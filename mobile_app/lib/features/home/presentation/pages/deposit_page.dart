import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import 'receipt_page.dart';

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

  // Share Request Link Fields
  bool _launchedPayment = false;
  String? _generatedLink;

  @override
  void dispose() {
    _amountController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
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

    if (!_cardFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final String cardNumber = _cardNumberController.text.trim();
    final String expiry = _expiryController.text.trim();
    final String cvc = _cvcController.text.trim();

    // Parse expiry MM/YY
    final List<String> expiryParts = expiry.split('/');
    if (expiryParts.length != 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid expiry date format. Use MM/YY.')),
      );
      return;
    }
    final String expMonth = expiryParts[0].trim();
    final String expYear = '20${expiryParts[1].trim()}'; // Convert YY to YYYY

    final success = await walletProvider.deposit(
      amount: amount!,
      cardNumber: cardNumber,
      expMonth: expMonth,
      expYear: expYear,
      cvc: cvc,
      authProvider: authProvider,
    );

    if (mounted) {
      if (success) {
        final cleanCard = cardNumber.replaceAll(' ', '');
        final cardLast4 = cleanCard.length >= 4 ? cleanCard.substring(cleanCard.length - 4) : '4242';
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'deposit',
          'amount': amount,
          'fee': 0.0,
          'netAmount': amount,
          'remarks': 'Deposit from Debit Card ending in $cardLast4',
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': 'Stripe'},
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

    final link = 'https://ropewallet.vercel.app/pay?to=$myQrData&amount=${amount.toStringAsFixed(2)}';
    
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
          content: Text('Balance and transaction history updated successfully!'),
        ),
      );
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

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Add Funds / Request'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.credit_card_rounded), text: 'Instant Card Load'),
              Tab(icon: Icon(Icons.share_rounded), text: 'Share Request Link'),
            ],
          ),
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
                            walletProvider.isBalanceHidden ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            size: 16,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      walletProvider.isBalanceHidden ? '\$ ••••' : '\$${userBalance.toStringAsFixed(2)}',
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

                // Dynamic Form Fields based on Selected Tab
                SizedBox(
                  height: 480,
                  child: TabBarView(
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      // TAB 1: INSTANT CARD LOAD
                      Form(
                        key: _cardFormKey,
                        child: SingleChildScrollView(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          const Text(
                            'Enter Debit Card Details:',
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
                          const SizedBox(height: 36),
                          SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: ElevatedButton(
                              onPressed: walletProvider.isLoading ? null : _submitInAppDeposit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: walletProvider.isLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text('Confirm Instant Deposit', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                      // TAB 2: SHARE REQUEST LINK
                      SingleChildScrollView(
                        child: Column(
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
                            // Link generated screen state
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
