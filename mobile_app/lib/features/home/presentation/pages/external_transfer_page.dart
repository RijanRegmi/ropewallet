import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';

class ExternalTransferPage extends StatefulWidget {
  final String provider;
  final String recipientName;

  const ExternalTransferPage({
    super.key,
    required this.provider,
    required this.recipientName,
  });

  @override
  State<ExternalTransferPage> createState() => _ExternalTransferPageState();
}

class _ExternalTransferPageState extends State<ExternalTransferPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();

  // Card Form Fields
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();

  // Bank Form Fields
  final _routingController = TextEditingController();
  final _accountController = TextEditingController();
  final _holderNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _holderNameController.text = widget.recipientName;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
    _routingController.dispose();
    _accountController.dispose();
    _holderNameController.dispose();
    super.dispose();
  }

  Future<void> _submitTransfer(String method) async {
    if (!_formKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final double amount = double.parse(_amountController.text.trim());

    bool success = false;

    if (method == 'bank') {
      success = await walletProvider.withdraw(
        amount: amount,
        method: 'bank',
        authProvider: authProvider,
        routingNumber: _routingController.text.trim(),
        accountNumber: _accountController.text.trim(),
        bankName: widget.provider,
        accountHolderName: _holderNameController.text.trim(),
      );
    } else {
      // Parse card expiry
      final List<String> expiryParts = _expiryController.text.split('/');
      if (expiryParts.length != 2) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid expiry date format. Use MM/YY.')),
        );
        return;
      }
      final int? expMonth = int.tryParse(expiryParts[0].trim());
      final int? expYear = int.tryParse('20${expiryParts[1].trim()}');

      if (expMonth == null || expYear == null || expMonth < 1 || expMonth > 12) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid expiry month or year.')),
        );
        return;
      }

      success = await walletProvider.withdraw(
        amount: amount,
        method: 'card',
        authProvider: authProvider,
        cardNumber: _cardNumberController.text.trim(),
        expMonth: expMonth,
        expYear: expYear,
        cvc: _cvcController.text.trim(),
      );
    }

    if (mounted) {
      if (success) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
                SizedBox(width: 10),
                Text('Transfer Sent'),
              ],
            ),
            content: Text(
              'Successfully sent \$${amount.toStringAsFixed(2)} directly to ${widget.recipientName} on ${widget.provider}!\n\n'
              '${method == 'bank' ? 'ACH transfers are processed in 1 business day.' : 'Funds are processed instantly via Visa Direct / Mastercard Send.'}',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop(); // pop dialog
                  Navigator.of(context).pop(); // pop transfer page
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(walletProvider.errorMessage ?? 'Transfer failed'),
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

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text('Send to ${widget.provider}'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.credit_card_rounded), text: 'Recipient Card'),
              Tab(icon: Icon(Icons.account_balance_rounded), text: 'Recipient Bank'),
            ],
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: theme.primaryColor.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: theme.primaryColor.withOpacity(0.2)),
                  ),
                  child: Text(
                    'Sending from RopeWallet balance to ${widget.recipientName} on ${widget.provider}.',
                    style: TextStyle(fontWeight: FontWeight.w600, color: theme.primaryColor),
                  ),
                ),
                const SizedBox(height: 24),

                // Available Balance
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Available Balance:', style: TextStyle(fontWeight: FontWeight.w500)),
                    Text(
                      '\$${userBalance.toStringAsFixed(2)}',
                      style: TextStyle(fontWeight: FontWeight.bold, color: theme.primaryColor),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Amount Input
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                  ],
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Amount to Send (USD)',
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
                    if (amount > userBalance) {
                      return 'Insufficient balance';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // Dynamic Form Fields
                SizedBox(
                  height: 380,
                  child: TabBarView(
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      // TAB 1: RECIPIENT CARD DETAILS
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Recipient ${widget.provider} Debit Card Details:',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _cardNumberController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(16),
                              CardNumberFormatter(),
                            ],
                            decoration: InputDecoration(
                              labelText: 'Card Number',
                              prefixIcon: const Icon(Icons.credit_card_rounded),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                              hintText: '4242 4242 4242 4242',
                            ),
                            validator: (value) {
                              if (DefaultTabController.of(context).index == 0) {
                                if (value == null || value.trim().replaceAll(' ', '').length != 16) {
                                  return 'Please enter a valid 16-digit card number';
                                }
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
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(4),
                                    CardExpiryFormatter(),
                                  ],
                                  decoration: InputDecoration(
                                    labelText: 'Expiry Date',
                                    prefixIcon: const Icon(Icons.calendar_today_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    hintText: 'MM/YY',
                                  ),
                                  validator: (value) {
                                    if (DefaultTabController.of(context).index == 0) {
                                      if (value == null || value.trim().length != 5) {
                                        return 'Use MM/YY';
                                      }
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
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
                                    labelText: 'CVC / CVV',
                                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    hintText: '123',
                                  ),
                                  validator: (value) {
                                    if (DefaultTabController.of(context).index == 0) {
                                      if (value == null || value.trim().length < 3) {
                                        return 'CVC required';
                                      }
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 36),
                          SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: ElevatedButton(
                              onPressed: walletProvider.isLoading ? null : () => _submitTransfer('card'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: walletProvider.isLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text('Confirm Instant Card Transfer', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),

                      // TAB 2: RECIPIENT BANK DETAILS
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Recipient Routing & Account Numbers:',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _holderNameController,
                            textCapitalization: TextCapitalization.words,
                            decoration: InputDecoration(
                              labelText: 'Account Holder Name',
                              prefixIcon: const Icon(Icons.person_outline_rounded),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            validator: (value) {
                              if (DefaultTabController.of(context).index == 1) {
                                if (value == null || value.trim().isEmpty) {
                                  return 'Please enter the account holder name';
                                }
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _routingController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(9),
                                  ],
                                  decoration: InputDecoration(
                                    labelText: 'Routing Number',
                                    prefixIcon: const Icon(Icons.numbers_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    hintText: '121000248',
                                  ),
                                  validator: (value) {
                                    if (DefaultTabController.of(context).index == 1) {
                                      if (value == null || value.trim().length != 9) {
                                        return 'Requires 9 digits';
                                      }
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: _accountController,
                                  keyboardType: TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter.digitsOnly,
                                    LengthLimitingTextInputFormatter(17),
                                  ],
                                  decoration: InputDecoration(
                                    labelText: 'Account Number',
                                    prefixIcon: const Icon(Icons.tag_rounded),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                                    hintText: '00012345678',
                                  ),
                                  validator: (value) {
                                    if (DefaultTabController.of(context).index == 1) {
                                      if (value == null || value.trim().length < 6) {
                                        return 'Invalid account no.';
                                      }
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 28),
                          SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: ElevatedButton(
                              onPressed: walletProvider.isLoading ? null : () => _submitTransfer('bank'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: walletProvider.isLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text('Confirm Direct Bank Transfer', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
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
