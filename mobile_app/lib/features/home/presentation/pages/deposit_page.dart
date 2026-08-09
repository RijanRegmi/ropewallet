import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../auth/providers/security_provider.dart';
import '../../providers/wallet_provider.dart';
import 'receipt_page.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import '../widgets/review_bottom_sheet.dart';
import '../widgets/full_page_loading_overlay.dart';
import 'package:ropewallet/core/network/api_client.dart';

class DepositPage extends StatefulWidget {
  const DepositPage({super.key});

  @override
  State<DepositPage> createState() => _DepositPageState();
}

class _DepositPageState extends State<DepositPage> {
  final _cardFormKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  // Card Form Fields (Pure Flutter TextFormFields - 100% visible on all Android devices)
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();
  final _remarksController = TextEditingController();

  // Additional Billing Fields (Symmetrical to SavedCardPage)
  final _cardholderController = TextEditingController();
  final _addressController = TextEditingController();
  final _zipController = TextEditingController();
  final _invoiceNameController = TextEditingController();
  final _taxIdController = TextEditingController();

  String _selectedCountry = 'United States';
  String _selectedState = 'California';
  bool _differentInvoiceName = false;
  bool _agreedToTerms = false;
  bool _isSavingCard = false;
  bool _isInlineEditing = false;

  final List<String> _usStates = const [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
  ];

  // Share Request Link Fields
  bool _launchedPayment = false;
  String? _generatedLink;

  final _cardFormController = CardFormEditController();

  @override
  void dispose() {
    _amountController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
    _remarksController.dispose();
    _cardholderController.dispose();
    _addressController.dispose();
    _zipController.dispose();
    _invoiceNameController.dispose();
    _taxIdController.dispose();
    super.dispose();
  }

  bool _isValidLuhn(String cardNumber) {
    final cleanNumber = cardNumber.replaceAll(' ', '');
    if (cleanNumber.isEmpty) return false;
    if (cleanNumber == '4242424242424242') return true;

    int sum = 0;
    bool alternate = false;
    for (int i = cleanNumber.length - 1; i >= 0; i--) {
      int n = int.tryParse(cleanNumber[i]) ?? 0;
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n -= 9;
        }
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 == 0;
  }

  String _formatCardNumber(String rawCard) {
    final text = rawCard.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      final nonZeroIndexValue = i + 1;
      if (nonZeroIndexValue % 4 == 0 && nonZeroIndexValue != text.length) {
        buffer.write(' ');
      }
    }
    return buffer.toString();
  }

  bool _isProcessingFlow = false;

  Future<void> _submitInAppDeposit() async {
    if (_isProcessingFlow || _isSavingCard) return;
    _isProcessingFlow = true;
    OverlayEntry? loadingOverlay;

    try {
      final String amountText = _amountController.text.trim();
      if (amountText.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter an amount')),
        );
        return;
      }
      final double? amount = double.tryParse(amountText);
      if (amount == null || amount <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a valid positive amount')),
        );
        return;
      }

      final walletProvider = Provider.of<WalletProvider>(context, listen: false);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final savedCard = authProvider.user?['savedCard'];
      final pmId = savedCard?['stripePaymentMethodId']?.toString();
      final hasValidStripePM = pmId != null && pmId.isNotEmpty && pmId.startsWith('pm_');

      // Validate form if adding/editing card details
      final bool needsSaveCard = !hasValidStripePM || _isInlineEditing;
      if (needsSaveCard) {
        if (!_cardFormKey.currentState!.validate()) return;
        if (!_agreedToTerms) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please agree to the storage terms to proceed.')),
          );
          return;
        }
      } else {
        if (!_cardFormKey.currentState!.validate()) return;
      }

      final String cardDisplay = hasValidStripePM && savedCard != null
          ? '${savedCard['cardBrand'] ?? 'Card'} ****${savedCard['last4'] ?? '****'}'
          : 'Credit/Debit Card';
      final String customRemarks = _remarksController.text.trim();
      final String remarksDisplay = customRemarks.isNotEmpty ? customRemarks : 'Load money';

      // 1. Show "Let's Review!" Bottom Sheet (Matching Image 2)
      final bool? confirmed = await ReviewBottomSheet.show(
        context,
        title: "Let's Review!",
        items: [
          ReviewItem(label: 'From Account', value: cardDisplay),
          ReviewItem(label: 'Wallet ID', value: authProvider.user?['userTag'] ?? authProvider.user?['email'] ?? ''),
          ReviewItem(label: 'Customer Name', value: authProvider.user?['fullName'] ?? 'Customer'),
          ReviewItem(label: 'Amount', value: '\$${amount.toStringAsFixed(2)}', isHighlight: true),
          ReviewItem(label: 'Remarks', value: remarksDisplay),
        ],
        onConfirm: () {},
      );

      if (confirmed != true) return;

      // 2. Prompt for Biometric / Security PIN authorization
      final securityProvider = Provider.of<SecurityProvider>(context, listen: false);
      final String? userPin = await securityProvider.authorizeSecurityWithPin(
        context,
        actionName: 'Authorize Deposit',
        amount: amount,
      );

      if (userPin == null || userPin.isEmpty) {
        return;
      }
      final String pin = userPin;

      setState(() {
        _isSavingCard = true;
      });

      // 3. Show Full Page Loading Overlay (Matching Image 3)
      loadingOverlay = FullPageLoadingOverlay.show(context, message: 'Processing wallet load...');

      // Step 1: Save card via Stripe SDK if needed
      if (needsSaveCard) {
        final expiryParts = _expiryController.text.split('/');
        final expMonth = int.tryParse(expiryParts[0].trim()) ?? 1;
        final expYear = int.tryParse('20${expiryParts[1].trim()}') ?? 2026;

        await Stripe.instance.dangerouslyUpdateCardDetails(
          CardDetails(
            number: _cardNumberController.text.replaceAll(' ', ''),
            cvc: _cvcController.text.trim(),
            expirationMonth: expMonth,
            expirationYear: expYear,
          ),
        );

        final paymentMethod = await Stripe.instance.createPaymentMethod(
          params: const PaymentMethodParams.card(
            paymentMethodData: PaymentMethodData(),
          ),
        );

        final saveSuccess = await authProvider.saveCard(
          paymentMethodId: paymentMethod.id,
          cardholderName: _cardholderController.text.trim(),
          zipCode: _zipController.text.trim(),
          country: _selectedCountry,
          addressLine1: _addressController.text.trim(),
          differentInvoiceName: _differentInvoiceName,
          invoiceName: _differentInvoiceName ? _invoiceNameController.text.trim() : '',
          taxId: _taxIdController.text.trim(),
        );

        if (saveSuccess) {
          _isInlineEditing = false;
        } else {
          loadingOverlay.remove();
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: const Color(0xFFEF4444),
                content: Text(authProvider.errorMessage ?? 'Failed to save payment card details'),
              ),
            );
          }
          return;
        }
      }

      // Step 2: Create PaymentIntent on the backend
      final intentResult = await walletProvider.createDepositIntent(
        amount: amount,
        remarks: customRemarks.isNotEmpty ? customRemarks : null,
        pin: pin,
      );

      if (intentResult == null) {
        loadingOverlay.remove();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text(walletProvider.errorMessage ?? 'Failed to create payment'),
            ),
          );
        }
        return;
      }

      final String clientSecret = intentResult['clientSecret'];
      final String paymentIntentId = intentResult['paymentIntentId'];

      // Step 3: Confirm payment client-side via Stripe SDK
      if (needsSaveCard) {
        final expiryParts = _expiryController.text.split('/');
        final expMonth = int.tryParse(expiryParts[0].trim()) ?? 1;
        final expYear = int.tryParse('20${expiryParts[1].trim()}') ?? 2026;

        await Stripe.instance.dangerouslyUpdateCardDetails(
          CardDetails(
            number: _cardNumberController.text.replaceAll(' ', ''),
            cvc: _cvcController.text.trim(),
            expirationMonth: expMonth,
            expirationYear: expYear,
          ),
        );

        await Stripe.instance.confirmPayment(
          paymentIntentClientSecret: clientSecret,
          data: const PaymentMethodParams.card(
            paymentMethodData: PaymentMethodData(),
          ),
        );
      } else {
        await Stripe.instance.confirmPayment(
          paymentIntentClientSecret: clientSecret,
        );
      }

      // Step 4: Tell backend to verify and credit wallet
      final updatedSavedCard = authProvider.user?['savedCard'];
      final cardBrand = updatedSavedCard?['cardBrand'] ?? 'Card';
      final cardLast4 = updatedSavedCard?['last4'] ?? '****';
      final String finalRemarks = customRemarks.isNotEmpty ? customRemarks : 'Deposit from $cardBrand ending in $cardLast4';

      final success = await walletProvider.confirmDeposit(
        paymentIntentId: paymentIntentId,
        authProvider: authProvider,
        remarks: finalRemarks,
      );

      loadingOverlay.remove();

      if (mounted) {
        if (success) {
          final createdTx = walletProvider.lastCreatedTransaction;
          final newTx = {
            '_id': createdTx?['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}',
            'type': 'deposit',
            'amount': amount,
            'fee': 0.0,
            'netAmount': amount,
            'remarks': finalRemarks,
            'createdAt': createdTx?['createdAt'] ?? DateTime.now().toIso8601String(),
            'sender': {'fullName': cardBrand},
            'receiver': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          };

          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => ReceiptPage(
                transaction: newTx,
                currentUser: authProvider.user ?? {},
                isNewTransferSuccess: true,
              ),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text(walletProvider.errorMessage ?? 'Deposit failed'),
            ),
          );
        }
      }
    } catch (e) {
      loadingOverlay?.remove();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Payment error: ${e.toString()}'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingCard = false;
        });
      }
      _isProcessingFlow = false;
    }
  }

  Future<void> _generateRequestLink(String myQrData) async {
    final amountText = _amountController.text.trim();
    if (amountText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an amount')),
      );
      return;
    }
    final double? amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid positive amount')),
      );
      return;
    }

    final String customRemarks = _remarksController.text.trim();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 20),
            Text('Generating payment link...'),
          ],
        ),
      ),
    );

    try {
      final response = await ApiClient().post('/p2p/create-request', {
        'amount': amount,
        if (customRemarks.isNotEmpty) 'note': customRemarks,
      });

      if (!mounted) return;
      Navigator.of(context).pop(); // dismiss loading dialog

      final responseData = jsonDecode(response.body);
      if (response.statusCode == 201 && responseData['success'] == true) {
        final link = responseData['data']['paymentLink'];
        setState(() {
          _generatedLink = link;
          _launchedPayment = true;
        });

        // Automatically copy it
        Clipboard.setData(ClipboardData(text: link));

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('Payment Request Link copied to clipboard automatically!'),
          ),
        );
      } else {
        final errorMsg = responseData['error'] ?? 'Failed to generate payment link';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(errorMsg),
          ),
        );
      }
    } catch (e) {
      if (mounted) Navigator.of(context).pop(); // dismiss loading dialog
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFEF4444),
          content: Text('Failed to generate payment link: $e'),
        ),
      );
    }
  }

  Future<void> _openRequestLink() async {
    if (_generatedLink == null) return;
    final Uri url = Uri.parse(_generatedLink!);
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFFEF4444),
          content: Text('Could not open link in browser: $e'),
        ),
      );
    }
  }

  Future<void> _checkPaymentStatus() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final walletProvider = Provider.of<WalletProvider>(context, listen: false);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const AlertDialog(
        content: Row(
          children: [
            CircularProgressIndicator(),
            SizedBox(width: 20),
            Text('Checking deposit status...'),
          ],
        ),
      ),
    );

    await authProvider.tryAutoLogin();
    await walletProvider.fetchTransactions();

    if (mounted) {
      Navigator.of(context).pop(); // dismiss loading dialog
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF10B981),
          content: Text('Account balance re-synced!'),
        ),
      );
      setState(() {
        _launchedPayment = false;
        _generatedLink = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final walletProvider = Provider.of<WalletProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    
    final user = authProvider.user ?? {};
    final String myQrData = user['qrCodeData'] ?? 'no-qr-data';
    final double userBalance = user['walletBalance'] is num 
        ? (user['walletBalance'] as num).toDouble() 
        : 0.00;

    final savedCard = user['savedCard'];
    final pmId = savedCard?['stripePaymentMethodId']?.toString();
    final cardBrandStr = savedCard?['cardBrand']?.toString();
    final last4Str = savedCard?['last4']?.toString();
    // Only treat card as saved for UI/payment if it has a valid Stripe PM token and brand/last4 details
    final hasSavedCard = pmId != null &&
        pmId.isNotEmpty &&
        pmId.startsWith('pm_') &&
        cardBrandStr != null &&
        cardBrandStr.isNotEmpty &&
        last4Str != null &&
        last4Str.isNotEmpty;

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Add Funds / Request'),
          elevation: 0,
        ),
        body: Builder(
          builder: (context) {
            final tabController = DefaultTabController.of(context);
            return AnimatedBuilder(
              animation: tabController,
              builder: (context, _) {
                final isCardTab = tabController.index == 0;
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Glassmorphic Segmented Pill Selector (No Divider Lines!)
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () => tabController.animateTo(0),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  decoration: BoxDecoration(
                                    color: isCardTab ? const Color(0xFF10B981) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: isCardTab ? [
                                      BoxShadow(
                                        color: const Color(0xFF10B981).withValues(alpha: 0.3),
                                        blurRadius: 10,
                                        spreadRadius: 1,
                                      ),
                                    ] : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.credit_card_rounded,
                                        size: 18,
                                        color: isCardTab ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Instant Card Load',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: isCardTab ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () => tabController.animateTo(1),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  decoration: BoxDecoration(
                                    color: !isCardTab ? const Color(0xFF10B981) : Colors.transparent,
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: !isCardTab ? [
                                      BoxShadow(
                                        color: const Color(0xFF10B981).withValues(alpha: 0.3),
                                        blurRadius: 10,
                                        spreadRadius: 1,
                                      ),
                                    ] : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.share_rounded,
                                        size: 18,
                                        color: !isCardTab ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Share Request Link',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                          color: !isCardTab ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Balance Indicator
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Text('Current Balance: ', style: TextStyle(fontWeight: FontWeight.w500)),
                              GestureDetector(
                                onTap: () {
                                  walletProvider.toggleBalanceVisibility();
                                },
                                child: Icon(
                                  walletProvider.isBalanceHidden ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                  size: 16,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          Text(
                            walletProvider.isBalanceHidden ? '\$xxxx.xx' : '\$${userBalance.toStringAsFixed(2)}',
                            style: TextStyle(fontWeight: FontWeight.bold, color: theme.primaryColor),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Amount Input
                      TextFormField(
                        controller: _amountController,
                        autovalidateMode: AutovalidateMode.onUserInteraction,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                        ],
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                        decoration: InputDecoration(
                          labelText: 'Amount (USD)',
                          prefixIcon: const Icon(Icons.attach_money_rounded, size: 28),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter an amount';
                          }
                          final amount = double.tryParse(value);
                          if (amount == null || amount <= 0) {
                            return 'Please enter a valid positive amount';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 24),

                      // Dynamic Tab Content rendered Inline to prevent nested scroll views
                      if (isCardTab)
                        Form(
                          key: _cardFormKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!hasSavedCard || _isInlineEditing) ...[
                                if (hasSavedCard) ...[
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Enter New Card Details:', style: TextStyle(fontWeight: FontWeight.bold)),
                                      TextButton(
                                        onPressed: () {
                                          setState(() {
                                            _isInlineEditing = false;
                                          });
                                        },
                                        child: const Text('Use Saved Card'),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                ] else ...[
                                  const Text('Payment method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 14),
                                ],
                                DropdownButtonFormField<String>(
                                  value: _selectedCountry,
                                  decoration: InputDecoration(
                                    labelText: 'Country or Region',
                                    prefixIcon: const Icon(Icons.public_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                  items: const [
                                    DropdownMenuItem<String>(value: 'United States', child: Text('United States')),
                                  ],
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _selectedCountry = val;
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 18),

                                DropdownButtonFormField<String>(
                                  value: _selectedState,
                                  decoration: InputDecoration(
                                    labelText: 'State',
                                    prefixIcon: const Icon(Icons.map_outlined),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                  items: _usStates.map((state) {
                                    return DropdownMenuItem<String>(
                                      value: state,
                                      child: Text(state),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() {
                                        _selectedState = val;
                                      });
                                    }
                                  },
                                ),
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _addressController,
                                  textCapitalization: TextCapitalization.words,
                                  decoration: InputDecoration(
                                    labelText: 'Street Address',
                                    prefixIcon: const Icon(Icons.home_outlined),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Street address required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _zipController,
                                  textCapitalization: TextCapitalization.characters,
                                  decoration: InputDecoration(
                                    labelText: 'Billing Zip / Postal Code',
                                    prefixIcon: const Icon(Icons.location_on_outlined),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Zip code is required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _cardNumberController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.allow(RegExp(r'[0-9 ]')),
                                    LengthLimitingTextInputFormatter(19),
                                    CardNumberFormatter(),
                                  ],
                                  decoration: InputDecoration(
                                    labelText: 'Card Number',
                                    prefixIcon: const Icon(Icons.credit_card_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                    suffixIcon: Container(
                                      width: 120,
                                      padding: const EdgeInsets.only(right: 8.0),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          Image.network('https://img.icons8.com/color/48/000000/visa.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('Visa')),
                                          const SizedBox(width: 3),
                                          Image.network('https://img.icons8.com/color/48/000000/mastercard.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('MC')),
                                          const SizedBox(width: 3),
                                          Image.network('https://img.icons8.com/color/48/000000/amex.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('Amex')),
                                          const SizedBox(width: 3),
                                          Image.network('https://img.icons8.com/color/48/000000/discover.png', width: 22, height: 14, errorBuilder: (c, e, s) => const Text('Disc')),
                                        ],
                                      ),
                                    ),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Card number is required';
                                    if (!_isValidLuhn(value)) return 'Invalid card format';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 18),

                                Row(
                                  children: [
                                    Expanded(
                                      child: TextFormField(
                                        controller: _expiryController,
                                        keyboardType: TextInputType.number,
                                        inputFormatters: [
                                          FilteringTextInputFormatter.allow(RegExp(r'[0-9/]')),
                                          LengthLimitingTextInputFormatter(5),
                                          CardExpiryFormatter(),
                                        ],
                                        decoration: InputDecoration(
                                          labelText: 'MM / YY',
                                          prefixIcon: const Icon(Icons.calendar_today_rounded, size: 20),
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                        ),
                                        validator: (value) {
                                          if (hasSavedCard && !_isInlineEditing) return null;
                                          if (value == null || value.trim().isEmpty) return 'Required';
                                          final parts = value.split('/');
                                          if (parts.length != 2) return 'MM/YY';
                                          final month = int.tryParse(parts[0]);
                                          if (month == null || month < 1 || month > 12) return '1-12';
                                          return null;
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _cvcController,
                                        keyboardType: TextInputType.number,
                                        obscureText: true,
                                        inputFormatters: [
                                          FilteringTextInputFormatter.digitsOnly,
                                          LengthLimitingTextInputFormatter(4),
                                        ],
                                        decoration: InputDecoration(
                                          labelText: 'CVC',
                                          prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                        ),
                                        validator: (value) {
                                          if (hasSavedCard && !_isInlineEditing) return null;
                                          if (value == null || value.trim().length < 3) return 'Required';
                                          return null;
                                        },
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _cardholderController,
                                  textCapitalization: TextCapitalization.words,
                                  decoration: InputDecoration(
                                    labelText: 'Full Name on Card',
                                    prefixIcon: const Icon(Icons.person_outline_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Full name is required';
                                    return null;
                                  },
                                ),

                                Row(
                                  children: [
                                    Checkbox(
                                      value: _differentInvoiceName,
                                      onChanged: (val) {
                                        setState(() {
                                          _differentInvoiceName = val ?? false;
                                        });
                                      },
                                    ),
                                    const Text('Use a different name on invoices', style: TextStyle(fontSize: 12)),
                                  ],
                                ),
                                if (_differentInvoiceName) ...[
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: _invoiceNameController,
                                    textCapitalization: TextCapitalization.words,
                                    decoration: InputDecoration(
                                      labelText: 'Business or Invoice Name',
                                      prefixIcon: const Icon(Icons.business_rounded),
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                    ),
                                    validator: (value) {
                                      if (hasSavedCard && !_isInlineEditing) return null;
                                      if (_differentInvoiceName && (value == null || value.trim().isEmpty)) return 'Invoice name required';
                                      return null;
                                    },
                                  ),
                                ],
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _taxIdController,
                                  keyboardType: TextInputType.text,
                                  decoration: InputDecoration(
                                    labelText: 'Business Tax ID / SSN (Optional)',
                                    prefixIcon: const Icon(Icons.badge_outlined),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                ),
                                const SizedBox(height: 18),

                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Checkbox(
                                      value: _agreedToTerms,
                                      onChanged: (val) {
                                        setState(() {
                                          _agreedToTerms = val ?? false;
                                        });
                                      },
                                    ),
                                    Expanded(
                                      child: Padding(
                                        padding: const EdgeInsets.only(top: 8.0),
                                        child: Text(
                                          'You agree that RopeWallet will securely store and verify this payment card for deposit and withdrawal purposes under our user terms.',
                                          style: TextStyle(color: Colors.grey[600], fontSize: 11, height: 1.4),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 24),

                                if (_isInlineEditing) ...[
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton(
                                          onPressed: () {
                                            setState(() {
                                              _isInlineEditing = false;
                                            });
                                          },
                                          style: OutlinedButton.styleFrom(
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            padding: const EdgeInsets.symmetric(vertical: 16),
                                          ),
                                          child: const Text('Cancel Edit'),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        flex: 2,
                                        child: ElevatedButton(
                                          onPressed: _isSavingCard ? null : _submitInAppDeposit,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: theme.primaryColor,
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                            padding: const EdgeInsets.symmetric(vertical: 16),
                                          ),
                                          child: _isSavingCard
                                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                              : const Text('Load', style: TextStyle(fontWeight: FontWeight.bold)),
                                        ),
                                      ),
                                    ],
                                  ),
                                ] else ...[
                                  Align(
                                   alignment: Alignment.centerRight,
                                   child: GestureDetector(
                                     onTap: walletProvider.isLoading ? null : _submitInAppDeposit,
                                     child: Container(
                                       width: 60,
                                       height: 60,
                                       decoration: BoxDecoration(
                                         color: isDark ? const Color(0xFF93B0FF) : theme.primaryColor,
                                         shape: BoxShape.circle,
                                         boxShadow: [
                                           BoxShadow(
                                             color: (isDark ? const Color(0xFF93B0FF) : theme.primaryColor).withOpacity(0.3),
                                             blurRadius: 12,
                                             offset: const Offset(0, 4),
                                           ),
                                         ],
                                       ),
                                       child: Center(
                                         child: (walletProvider.isLoading || _isSavingCard)
                                             ? SizedBox(
                                                 width: 22,
                                                 height: 22,
                                                 child: CircularProgressIndicator(
                                                   color: isDark ? const Color(0xFF0F172A) : Colors.white,
                                                   strokeWidth: 2.5,
                                                 ),
                                               )
                                             : Icon(
                                                 Icons.arrow_forward_rounded,
                                                 color: isDark ? const Color(0xFF0F172A) : Colors.white,
                                                 size: 26,
                                               ),
                                       ),
                                     ),
                                   ),
                                 ),
                                ],
                              ] else ...[
                                // Collapsed saved card details
                                Container(
                                  padding: const EdgeInsets.all(18),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        theme.primaryColor.withOpacity(0.85),
                                        theme.primaryColor.withBlue(220).withOpacity(0.85),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(18),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.credit_card_rounded, color: Colors.white, size: 28),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              savedCard['cardBrand'] ?? 'Saved Card',
                                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '•••• •••• •••• ${savedCard['last4']}',
                                              style: const TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1.0),
                                            ),
                                          ],
                                        ),
                                      ),
                                      TextButton(
                                        onPressed: () {
                                          setState(() {
                                             _isInlineEditing = true;
                                             _cardholderController.text = savedCard['cardholderName'] ?? '';
                                             _zipController.text = savedCard['zipCode'] ?? '';
                                             _selectedCountry = savedCard['country'] ?? 'United States';
                                             _addressController.text = savedCard['addressLine1'] ?? '';
                                             _differentInvoiceName = savedCard['differentInvoiceName'] ?? false;
                                             _invoiceNameController.text = savedCard['invoiceName'] ?? '';
                                             _taxIdController.text = savedCard['taxId'] ?? '';
                                             _agreedToTerms = true;
                                           });
                                        },
                                        child: const Text('Edit', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 18),

                                TextFormField(
                                  controller: _remarksController,
                                  autovalidateMode: AutovalidateMode.onUserInteraction,
                                  textCapitalization: TextCapitalization.sentences,
                                  decoration: InputDecoration(
                                    labelText: 'Remarks',
                                    prefixIcon: const Icon(Icons.edit_note_rounded, size: 24),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    hintText: 'e.g. Load money',
                                  ),
                                  validator: (value) {
                                    if (value == null || value.trim().isEmpty) {
                                      return 'Remarks are required';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 28),

                                SizedBox(
                                  width: double.infinity,
                                  height: 52,
                                  child: ElevatedButton(
                                    onPressed: walletProvider.isLoading ? null : _submitInAppDeposit,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: theme.primaryColor,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                     child: (walletProvider.isLoading || _isSavingCard)
                                         ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                         : const Text('Load', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        )
                      else
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (!_launchedPayment) ...[
                              const Text(
                                'Generate a request link to receive money:',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'Anyone with this link can pay you directly using Credit Card, Apple Pay, Google Pay, Chime, Venmo, or Cash App.',
                                style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.3),
                              ),
                              const SizedBox(height: 36),
                              SizedBox(
                                width: double.infinity,
                                height: 54,
                                child: ElevatedButton(
                                  onPressed: () => _generateRequestLink(myQrData),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: theme.primaryColor,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                  child: const Text('Generate Request Link & Copy', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ] else ...[
                              Center(
                                child: Column(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF10B981).withOpacity(0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.link_rounded, size: 40, color: Color(0xFF10B981)),
                                    ),
                                    const SizedBox(height: 16),
                                    const Text('Request Link Active', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Copied to clipboard! Share it with your friends.',
                                      style: TextStyle(color: isDark ? Colors.grey[300] : Colors.grey[600], fontSize: 13),
                                    ),
                                    const SizedBox(height: 20),
                                    OutlinedButton.icon(
                                      onPressed: _openRequestLink,
                                      icon: const Icon(Icons.open_in_browser_rounded),
                                      label: const Text('Open Page (Self Test)'),
                                      style: OutlinedButton.styleFrom(
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                    SizedBox(
                                      width: double.infinity,
                                      height: 50,
                                      child: ElevatedButton.icon(
                                        onPressed: _checkPaymentStatus,
                                        icon: const Icon(Icons.sync_rounded),
                                        label: const Text('Refresh Wallet Balance'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: theme.primaryColor,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextButton(
                                      onPressed: () {
                                        setState(() {
                                          _launchedPayment = false;
                                          _generatedLink = null;
                                        });
                                      },
                                      child: const Text('Create Another Request', style: TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

// Formatters
class CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text.replaceAll(' ', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      final nonZeroIndexValue = i + 1;
      if (nonZeroIndexValue % 4 == 0 && nonZeroIndexValue != text.length) {
        buffer.write(' ');
      }
    }
    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

class CardExpiryFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    final text = newValue.text.replaceAll('/', '');
    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      final nonZeroIndexValue = i + 1;
      if (nonZeroIndexValue % 2 == 0 && nonZeroIndexValue != text.length) {
        buffer.write('/');
      }
    }
    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}
