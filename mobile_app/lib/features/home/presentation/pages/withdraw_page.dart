import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../auth/providers/security_provider.dart';
import '../../providers/wallet_provider.dart';
import 'receipt_page.dart';

class WithdrawPage extends StatefulWidget {
  const WithdrawPage({super.key});

  @override
  State<WithdrawPage> createState() => _WithdrawPageState();
}

class _WithdrawPageState extends State<WithdrawPage> {
  final _cardFormKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  
  // Card Form Fields
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();
  final _remarksController = TextEditingController();

  // Additional Billing Fields
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

  @override
  void initState() {
    super.initState();
    _amountController.addListener(() {
      setState(() {});
    });
  }

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

  Future<void> _submitWithdrawal(String method) async {
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
    // A card is only truly "saved" for payment if it has a valid Stripe PM token
    final hasValidStripePM = pmId != null && pmId.isNotEmpty && pmId.startsWith('pm_');

    // Validate forms
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

    // Prompt for Biometric / Security PIN authorization on cash out
    final securityProvider = Provider.of<SecurityProvider>(context, listen: false);
    final String? userPin = await securityProvider.authorizeSecurityWithPin(
      context,
      actionName: 'Authorize Cash Out',
      amount: amount,
    );

    if (userPin == null || userPin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cash Out authorization canceled')),
      );
      return;
    }
    final String pin = userPin;

    bool success = false;
    final String customRemarks = _remarksController.text.trim();
    String remarksText = '';
    String receiverName = '';

    // Step 1: Save card via Stripe SDK if needed
    if (needsSaveCard) {
      setState(() {
        _isSavingCard = true;
      });

      try {
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

        setState(() {
          _isSavingCard = false;
          if (saveSuccess) {
            _isInlineEditing = false;
          }
        });

        if (!saveSuccess) {
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
      } catch (e) {
        setState(() {
          _isSavingCard = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text('Card error: ${e.toString()}'),
            ),
          );
        }
        return;
      }
    }

    // Step 2: Perform Instant Withdrawal using saved card
    final updatedSavedCard = authProvider.user?['savedCard'];
    final cardBrand = updatedSavedCard?['cardBrand'] ?? 'Debit Card';
    final cardLast4 = updatedSavedCard?['last4'] ?? '4242';
    remarksText = customRemarks.isNotEmpty ? customRemarks : 'Withdrawal to $cardBrand ending in $cardLast4';
    receiverName = cardBrand;

    success = await walletProvider.withdraw(
      amount: amount,
      method: 'card',
      authProvider: authProvider,
      pin: pin,
      remarks: remarksText,
      useSavedCard: true,
    );

    if (mounted) {
      if (success) {
        final userRole = authProvider.user?['role'] ?? 'customer';
        final isHost = ['admin', 'host', 'superadmin'].contains(userRole);
        final fee = isHost ? (amount * 0.03) : 0.0;
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'withdrawal',
          'amount': amount,
          'fee': fee,
          'netAmount': amount - fee,
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          'receiver': {'fullName': receiverName},
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
            content: Text(walletProvider.errorMessage ?? 'Withdrawal failed'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final walletProvider = Provider.of<WalletProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    
    final user = authProvider.user ?? {};
    final double userBalance = user['walletBalance'] is num 
        ? (user['walletBalance'] as num).toDouble() 
        : 0.00;

    final savedCard = user['savedCard'];
    final pmId = savedCard?['stripePaymentMethodId']?.toString();
    // Only treat card as saved for UI/payment if it has a valid Stripe PM token
    final hasSavedCard = pmId != null && pmId.isNotEmpty && pmId.startsWith('pm_');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Instant Card Payout'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
                        walletProvider.isBalanceHidden ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                        size: 20,
                        color: theme.primaryColor,
                      ),
                    ),
                  ],
                ),
                Text(
                  walletProvider.isBalanceHidden ? '\$xxxx.xx' : '\$${userBalance.toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Amount Input
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
              ],
              decoration: InputDecoration(
                labelText: 'Amount to Cash Out',
                prefixText: '\$ ',
                prefixStyle: TextStyle(
                  color: isDark ? Colors.white : Colors.black,
                  fontWeight: FontWeight.bold,
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter an amount';
                }
                final amt = double.tryParse(value);
                if (amt == null || amt <= 0) {
                  return 'Please enter a valid amount';
                }
                final maxSingle = (user['role'] == 'admin' || user['role'] == 'host' || user['role'] == 'superadmin') ? 2500.00 : 500.00;
                if (amt > maxSingle) {
                  return 'Single withdrawal limit is \$${maxSingle.toStringAsFixed(2)} per transaction';
                }
                if (amt > userBalance) {
                  return 'Insufficient balance';
                }
                return null;
              },
            ),
            const SizedBox(height: 18),

            // Dynamic Fee Breakdown Card
            AnimatedBuilder(
              animation: _amountController,
              builder: (context, _) {
                final text = _amountController.text.trim();
                final amount = double.tryParse(text) ?? 0.00;
                final userRole = user['role'] ?? 'customer';
                final isHost = ['admin', 'host', 'superadmin'].contains(userRole);
                final fee = (amount > 0 && isHost) ? (amount * 0.03) : 0.0;
                final feeLabel = isHost ? '(3% host fee)' : '(FREE for customer)';
                final netAmount = amount - fee;
                
                if (amount <= 0) return const SizedBox.shrink();

                return Container(
                  margin: const EdgeInsets.only(bottom: 24),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Withdrawal Amount:', style: TextStyle(color: Colors.grey)),
                          Text(
                            '\$${amount.toStringAsFixed(2)}',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Text('Platform Fee ', style: TextStyle(color: Colors.grey)),
                              Text(feeLabel, style: TextStyle(color: isHost ? const Color(0xFFEF4444) : const Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12)),
                              const Text(':', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                          Text(
                            isHost ? '-\$${fee.toStringAsFixed(2)}' : 'FREE (\$0.00)',
                            style: TextStyle(color: isHost ? const Color(0xFFEF4444) : const Color(0xFF10B981), fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12.0),
                        child: Divider(color: Colors.transparent, height: 1),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('You Will Receive (Net):', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text(
                            '\$${(netAmount < 0 ? 0.00 : netAmount).toStringAsFixed(2)}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // Card Form
            Form(
              key: _cardFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasSavedCard && !_isInlineEditing) ...[
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
                                  '${savedCard['cardBrand']?.toUpperCase() ?? 'DEBIT CARD'}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '•••• •••• •••• ${savedCard['last4'] ?? '4242'}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1.2,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _isInlineEditing = true;
                              });
                            },
                            child: const Text('Change', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    // Card Form Inputs
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
                        if (value == null || value.trim().isEmpty) {
                          return 'Street address is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 18),

                    TextFormField(
                      controller: _zipController,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        labelText: 'Zip / Postal Code',
                        prefixIcon: const Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Zip code is required';
                        }
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
                        if (value == null || value.trim().isEmpty) {
                          return 'Card number is required';
                        }
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
                              if (value == null || value.trim().isEmpty) {
                                return 'Required';
                              }
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
                              if (value == null || value.trim().length < 3) {
                                return 'Required';
                              }
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
                        if (value == null || value.trim().isEmpty) {
                          return 'Full name is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 18),
                    const SizedBox(height: 14),

                    SwitchListTile(
                      title: const Text('Different Invoice Name?', style: TextStyle(fontSize: 14)),
                      value: _differentInvoiceName,
                      onChanged: (val) {
                        setState(() {
                          _differentInvoiceName = val;
                        });
                      },
                    ),
                    if (_differentInvoiceName) ...[
                      const SizedBox(height: 10),
                      TextFormField(
                        controller: _invoiceNameController,
                        decoration: InputDecoration(
                          labelText: 'Invoice Legal Name',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Invoice name is required';
                          }
                          return null;
                        },
                      ),
                    ],
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _taxIdController,
                      decoration: InputDecoration(
                        labelText: 'Tax ID / SSN (Optional)',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 14),

                    CheckboxListTile(
                      title: const Text(
                        'I agree to save this card details securely for future instant transfers.',
                        style: TextStyle(fontSize: 12),
                      ),
                      value: _agreedToTerms,
                      onChanged: (val) {
                        setState(() {
                          _agreedToTerms = val ?? false;
                        });
                      },
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ],

                  const SizedBox(height: 18),
                  TextFormField(
                    controller: _remarksController,
                    decoration: InputDecoration(
                      labelText: 'Remarks',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 28),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: (_isSavingCard || walletProvider.isLoading) ? null : () => _submitWithdrawal('card'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: (_isSavingCard || walletProvider.isLoading)
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Confirm Instant Card Cash Out', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Helpers
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
