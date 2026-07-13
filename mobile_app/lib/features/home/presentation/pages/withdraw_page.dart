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
  final _bankFormKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  
  // Card Form Fields
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();

  // Bank Form Fields
  final _routingController = TextEditingController();
  final _accountController = TextEditingController();
  final _holderNameController = TextEditingController();
  String _selectedBankName = 'Chime';
  final _remarksController = TextEditingController();

  @override
  void dispose() {
    _amountController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
    _routingController.dispose();
    _accountController.dispose();
    _holderNameController.dispose();
    _remarksController.dispose();
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
          n = (n % 10) + 1;
        }
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 == 0;
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
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user ?? {};
    final double userBalance = user['walletBalance'] is num 
        ? (user['walletBalance'] as num).toDouble() 
        : 0.00;
    if (amount > userBalance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Insufficient balance')),
      );
      return;
    }

    if (method == 'bank') {
      if (!_bankFormKey.currentState!.validate()) return;
    } else {
      if (!_cardFormKey.currentState!.validate()) return;
    }

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);

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

    if (method == 'bank') {
      final routing = _routingController.text.trim();
      remarksText = customRemarks.isNotEmpty ? customRemarks : 'Withdrawal to $_selectedBankName Bank Account (routing: ...${routing.length >= 4 ? routing.substring(routing.length - 4) : ''})';
      receiverName = '$_selectedBankName Bank Account';

      success = await walletProvider.withdraw(
        amount: amount!,
        method: 'bank',
        authProvider: authProvider,
        routingNumber: routing,
        accountNumber: _accountController.text.trim(),
        bankName: _selectedBankName,
        accountHolderName: _holderNameController.text.trim(),
        pin: pin,
        remarks: remarksText,
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

      final cardNumber = _cardNumberController.text.trim();
      final last4 = cardNumber.replaceAll(' ', '');
      String cardBrand = 'Debit Card';
      if (last4.startsWith('4')) {
        cardBrand = 'Chime Debit Card';
      } else if (last4.startsWith('5')) {
        cardBrand = 'Venmo Debit Card';
      }
      remarksText = customRemarks.isNotEmpty ? customRemarks : 'Withdrawal to $cardBrand ending in ${last4.length >= 4 ? last4.substring(last4.length - 4) : '4242'}';
      receiverName = cardBrand;

      success = await walletProvider.withdraw(
        amount: amount!,
        method: 'card',
        authProvider: authProvider,
        cardNumber: cardNumber,
        expMonth: expMonth,
        expYear: expYear,
        cvc: _cvcController.text.trim(),
        pin: pin,
        remarks: remarksText,
      );
    }

    if (mounted) {
      if (success) {
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'transfer',
          'amount': amount,
          'fee': 0.0,
          'netAmount': amount,
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

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Cash Out / Withdraw'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.credit_card_rounded), text: 'Instant Card Payout'),
              Tab(icon: Icon(Icons.account_balance_rounded), text: 'Direct Bank Account'),
            ],
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Available Balance card
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Text('Available Balance: ', style: TextStyle(fontWeight: FontWeight.w500)),
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
                    Row(
                      children: [
                        Text(
                          walletProvider.isBalanceHidden ? '\$ ••••' : '\$${userBalance.toStringAsFixed(2)}',
                          style: TextStyle(fontWeight: FontWeight.bold, color: theme.primaryColor),
                        ),
                        const SizedBox(width: 10),
                        TextButton(
                          onPressed: userBalance <= 0
                              ? null
                              : () {
                                  _amountController.text = userBalance.toStringAsFixed(2);
                                },
                          child: const Text('Withdraw All', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

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
                    labelText: 'Withdrawal Amount (USD)',
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

                // Dynamic Form Fields based on Selected Tab
                SizedBox(
                  height: 480,
                  child: TabBarView(
                    physics: const NeverScrollableScrollPhysics(), // Prevent sliding tabs without form validation
                    children: [
                      // TAB 1: CARD PAYOUT
                      Form(
                        key: _cardFormKey,
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Chime / Venmo / Cash App Card Details:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _cardNumberController,
                            autovalidateMode: AutovalidateMode.onUserInteraction,
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
                               if (value == null || value.trim().replaceAll(' ', '').length != 16) {
                                 return 'Please enter a valid 16-digit card number';
                               }
                               if (!_isValidLuhn(value)) {
                                 return 'Card number is invalid (Luhn check failed)';
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
                                  autovalidateMode: AutovalidateMode.onUserInteraction,
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
                                    if (value == null || value.trim().length != 5) {
                                      return 'Use MM/YY';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: TextFormField(
                                  controller: _cvcController,
                                  autovalidateMode: AutovalidateMode.onUserInteraction,
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
                                    if (value == null || value.trim().length < 3) {
                                      return 'CVC required';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
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
                              hintText: 'e.g. Cash out to card',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Remarks are required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 36),
                          SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: ElevatedButton(
                              onPressed: walletProvider.isLoading ? null : () => _submitWithdrawal('card'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: walletProvider.isLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text('Confirm Instant Card Cash Out', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                      // TAB 2: BANK ACCOUNT TRANSFER
                      Form(
                        key: _bankFormKey,
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Bank Routing & Account Details:',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            value: _selectedBankName,
                            decoration: InputDecoration(
                              labelText: 'Select Account Provider',
                              prefixIcon: const Icon(Icons.account_balance_rounded),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            items: ['Chime', 'Venmo', 'Cash App', 'Other Bank']
                                .map((bank) => DropdownMenuItem(value: bank, child: Text(bank)))
                                .toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedBankName = val;
                                });
                              }
                            },
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _holderNameController,
                            textCapitalization: TextCapitalization.words,
                            decoration: InputDecoration(
                              labelText: 'Account Holder Name',
                              prefixIcon: const Icon(Icons.person_outline_rounded),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                              hintText: 'John Doe',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                  return 'Please enter the account holder name';
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
                                    if (value == null || value.trim().length != 9) {
                                      return 'Requires 9 digits';
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
                                    if (value == null || value.trim().length < 6) {
                                      return 'Invalid account no.';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
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
                              hintText: 'e.g. Cash out to bank',
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
                            height: 54,
                            child: ElevatedButton(
                              onPressed: walletProvider.isLoading ? null : () => _submitWithdrawal('bank'),
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
                    ),
                  ),
                    ],
                  ),
                ),
              ],
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
