import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import 'receipt_page.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import 'package:ropewallet/core/network/api_client.dart';

class DepositPage extends StatefulWidget {
  const DepositPage({super.key});

  @override
  State<DepositPage> createState() => _DepositPageState();
}

class _DepositPageState extends State<DepositPage> {
  final _cardFormKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  // Card Form Fields
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
  bool _differentInvoiceName = false;
  bool _agreedToTerms = false;
  bool _isSavingCard = false;
  bool _isInlineEditing = false;

  // Share Request Link Fields
  bool _launchedPayment = false;
  String? _generatedLink;

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

  Future<void> _submitInAppDeposit() async {
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
    final hasSavedCard = savedCard != null && savedCard['cardNumber'] != null && savedCard['cardNumber'].toString().isNotEmpty;

    // Validate form if adding/editing card details
    final bool needsSaveCard = !hasSavedCard || _isInlineEditing;
    if (needsSaveCard) {
      if (!_cardFormKey.currentState!.validate()) return;
      if (!_agreedToTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please agree to the storage terms to proceed.')),
        );
        return;
      }
    } else {
      // Validate amount/remarks form part
      if (!_cardFormKey.currentState!.validate()) return;
    }

    // Always prompt for transaction PIN on deposit
    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to complete deposit',
      ),
    );

    if (pin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Deposit canceled')),
      );
      return;
    }

    // Step 1: Save card if needed
    if (needsSaveCard) {
      setState(() {
        _isSavingCard = true;
      });
      
      final expiryParts = _expiryController.text.split('/');
      final saveSuccess = await authProvider.saveCard(
        cardholderName: _cardholderController.text.trim(),
        cardNumber: _cardNumberController.text.trim(),
        expMonth: expiryParts[0].trim(),
        expYear: '20${expiryParts[1].trim()}',
        cvc: _cvcController.text.trim(),
        zipCode: _zipController.text.trim(),
        country: _selectedCountry,
        addressLine1: _addressController.text.trim(),
        differentInvoiceName: _differentInvoiceName,
        invoiceName: _differentInvoiceName ? _invoiceNameController.text.trim() : '',
        taxId: _taxIdController.text.trim(),
      );

      setState(() {
        _isSavingCard = false;
        if (saveSuccess) {
          _isInlineEditing = false;
        }
      });

      if (!saveSuccess) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to save payment card details'),
          ),
        );
        return;
      }
    }

    // Step 2: Perform Deposit
    final updatedSavedCard = authProvider.user?['savedCard'];
    final cardBrand = updatedSavedCard?['cardBrand'] ?? 'Debit Card';
    final cardLast4 = updatedSavedCard?['last4'] ?? '4242';
    final String customRemarks = _remarksController.text.trim();
    final String finalRemarks = customRemarks.isNotEmpty ? customRemarks : 'Deposit from $cardBrand ending in $cardLast4';

    final success = await walletProvider.deposit(
      amount: amount,
      authProvider: authProvider,
      remarks: finalRemarks,
      useSavedCard: true, // Always use saved card info
      pin: pin,
    );

    if (mounted) {
      if (success) {
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'deposit',
          'amount': amount,
          'fee': 0.0,
          'netAmount': amount,
          'remarks': finalRemarks,
          'createdAt': DateTime.now().toIso8601String(),
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
    final hasSavedCard = savedCard != null && savedCard['cardNumber'] != null && savedCard['cardNumber'].toString().isNotEmpty;

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
                                // Symmetrical saved card form
                                const Text('Payment method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 12),
                                const Text('Full name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _cardholderController,
                                  textCapitalization: TextCapitalization.words,
                                  decoration: InputDecoration(
                                    hintText: 'Rijan Regmi',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Full name is required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 14),

                                 const Text('Billing Zip / Postal Code', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _zipController,
                                  textCapitalization: TextCapitalization.characters,
                                  decoration: InputDecoration(
                                    hintText: 'e.g. 90210',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                  ),
                                  validator: (value) {
                                    if (hasSavedCard && !_isInlineEditing) return null;
                                    if (value == null || value.trim().isEmpty) return 'Zip code is required';
                                    return null;
                                  },
                                ),
                                const SizedBox(height: 14),

                                const Text('Card number', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 6),
                                TextFormField(
                                  controller: _cardNumberController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.allow(RegExp(r'[0-9 ]')),
                                    LengthLimitingTextInputFormatter(19),
                                    CardNumberFormatter(),
                                  ],
                                  decoration: InputDecoration(
                                    hintText: '1234 5678 1234 5678',
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                const SizedBox(height: 14),

                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Expiration date', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _expiryController,
                                            keyboardType: TextInputType.number,
                                            inputFormatters: [
                                              FilteringTextInputFormatter.allow(RegExp(r'[0-9/]')),
                                              LengthLimitingTextInputFormatter(5),
                                              CardExpiryFormatter(),
                                            ],
                                            decoration: InputDecoration(
                                              hintText: 'MM / YY',
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Security code', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                          const SizedBox(height: 6),
                                          TextFormField(
                                            controller: _cvcController,
                                            keyboardType: TextInputType.number,
                                            obscureText: true,
                                            inputFormatters: [
                                              FilteringTextInputFormatter.digitsOnly,
                                              LengthLimitingTextInputFormatter(4),
                                            ],
                                            decoration: InputDecoration(
                                              hintText: 'CVC',
                                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                              suffixIcon: const Icon(Icons.lock_rounded, size: 16),
                                            ),
                                            validator: (value) {
                                              if (hasSavedCard && !_isInlineEditing) return null;
                                              if (value == null || value.trim().length < 3) return 'Required';
                                              return null;
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 14),

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
                                      hintText: 'Invoice name (e.g. Business Name)',
                                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    ),
                                    validator: (value) {
                                      if (hasSavedCard && !_isInlineEditing) return null;
                                      if (_differentInvoiceName && (value == null || value.trim().isEmpty)) return 'Invoice name required';
                                      return null;
                                    },
                                  ),
                                ],
                                const SizedBox(height: 14),

                                const Text('Business tax ID (Optional)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                const SizedBox(height: 4),
                                Text(
                                  'If you provide a tax ID, the "Full name" above should be your business\'s name.',
                                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const SizedBox(
                                      width: 110,
                                      child: Text('US SSN / EIN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                    ),
                                    Expanded(
                                      child: TextFormField(
                                        controller: _taxIdController,
                                        keyboardType: TextInputType.text,
                                        decoration: InputDecoration(
                                          hintText: '12-3456789',
                                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                        ),
                                      ),
                                    ),
                                  ],
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
                                  SizedBox(
                                    width: double.infinity,
                                    height: 52,
                                    child: ElevatedButton(
                                      onPressed: _isSavingCard ? null : _submitInAppDeposit,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: theme.primaryColor,
                                        foregroundColor: Colors.white,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      ),
                                      child: _isSavingCard
                                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                          : const Text('Load', style: TextStyle(fontWeight: FontWeight.bold)),
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
                                            _cardNumberController.text = _formatCardNumber(savedCard['cardNumber'] ?? '');
                                            _expiryController.text = '${savedCard['expMonth']}/${(savedCard['expYear'] ?? '').toString().substring(2)}';
                                            _cvcController.text = savedCard['cvc'] ?? '';
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
                                    child: walletProvider.isLoading
                                        ? const CircularProgressIndicator(color: Colors.white)
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
