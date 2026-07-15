import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
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
  bool _differentInvoiceName = false;
  bool _agreedToTerms = false;
  bool _isSavingCard = false;
  bool _isInlineEditing = false;

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
    final hasSavedCard = savedCard != null && savedCard['cardNumber'] != null && savedCard['cardNumber'].toString().isNotEmpty;

    // Validate forms
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
      if (!_cardFormKey.currentState!.validate()) return;
    }

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to complete withdrawal',
      ),
    );

    if (pin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Withdrawal canceled')),
      );
      return;
    }

    bool success = false;
    final String customRemarks = _remarksController.text.trim();
    String remarksText = '';
    String receiverName = '';

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
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'withdrawal',
          'amount': amount,
          'fee': amount * 0.15,
          'netAmount': amount * 0.85,
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
    final hasSavedCard = savedCard != null && savedCard['cardNumber'] != null && savedCard['cardNumber'].toString().isNotEmpty;

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
                  walletProvider.isBalanceHidden ? '\$ ••••••' : '\$${userBalance.toStringAsFixed(2)}',
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
                final fee = amount * 0.15;
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
                          const Row(
                            children: [
                              Text('Platform Fee ', style: TextStyle(color: Colors.grey)),
                              Text('(15% cut)', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 12)),
                              Text(':', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                          Text(
                            '-\$${fee.toStringAsFixed(2)}',
                            style: const TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.w600),
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

                    TextFormField(
                      controller: _cardholderController,
                      textCapitalization: TextCapitalization.words,
                      decoration: InputDecoration(
                        labelText: 'Cardholder Name',
                        prefixIcon: const Icon(Icons.person_outline_rounded),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Cardholder name is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _cardNumberController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        CardNumberFormatter(),
                        LengthLimitingTextInputFormatter(19),
                      ],
                      decoration: InputDecoration(
                        labelText: 'Card Number',
                        prefixIcon: const Icon(Icons.credit_card_rounded),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Card number is required';
                        }
                        final clean = value.replaceAll(' ', '');
                        if (clean.length < 15 || clean.length > 16) {
                          return 'Please enter a valid card number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _expiryController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              CardExpiryFormatter(),
                              LengthLimitingTextInputFormatter(5),
                            ],
                            decoration: InputDecoration(
                              labelText: 'Expiry Date',
                              hintText: 'MM/YY',
                              prefixIcon: const Icon(Icons.calendar_month_outlined),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Expiry required';
                              }
                              if (!value.contains('/') || value.length != 5) {
                                return 'Invalid expiry';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: TextFormField(
                            controller: _cvcController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(4),
                            ],
                            decoration: InputDecoration(
                              labelText: 'CVC / CVV',
                              prefixIcon: const Icon(Icons.lock_outline_rounded),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            validator: (value) {
                              if (value == null || value.length < 3) {
                                return 'Invalid CVC';
                              }
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    TextFormField(
                      controller: _addressController,
                      decoration: InputDecoration(
                        labelText: 'Billing Address Line 1',
                        prefixIcon: const Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Billing address is required';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _zipController,
                            decoration: InputDecoration(
                              labelText: 'Zip / Postal Code',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'ZIP is required';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _selectedCountry,
                                isExpanded: true,
                                items: ['United States', 'Canada', 'United Kingdom']
                                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) {
                                    setState(() {
                                      _selectedCountry = val;
                                    });
                                  }
                                },
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
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
