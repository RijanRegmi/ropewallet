import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import 'receipt_page.dart';

class UsdtTransferPage extends StatefulWidget {
  const UsdtTransferPage({super.key});

  @override
  State<UsdtTransferPage> createState() => _UsdtTransferPageState();
}

class _UsdtTransferPageState extends State<UsdtTransferPage> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _addressController = TextEditingController();
  final _remarksController = TextEditingController();

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
    _addressController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _submitPayout() async {
    if (!_formKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final double amount = double.parse(_amountController.text.trim());
    final String address = _addressController.text.trim();
    final String customRemarks = _remarksController.text.trim();

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to send USDT payout',
      ),
    );

    if (pin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Payout canceled')),
      );
      return;
    }

    final remarksText = customRemarks.isNotEmpty
        ? customRemarks
        : 'USDT withdrawal of \$${amount.toStringAsFixed(2)} (\$${(amount * 0.85).toStringAsFixed(2)} received) to address $address';

    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'usdt',
      authProvider: authProvider,
      usdtAddress: address,
      pin: pin,
      remarks: remarksText,
    );

    if (mounted) {
      if (success) {
        final newTx = {
          '_id': walletProvider.transactions.isNotEmpty
              ? (walletProvider.transactions.first['_id'] ?? 'TX-${DateTime.now().millisecondsSinceEpoch}')
              : 'TX-${DateTime.now().millisecondsSinceEpoch}',
          'type': 'withdrawal',
          'amount': amount,
          'fee': amount * 0.01 + 0.30,
          'netAmount': amount - (amount * 0.01 + 0.30),
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          'receiver': {'fullName': 'USDT TRC-20 Wallet'},
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('USDT TRC-20 Withdrawal'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Brand Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF26A17B), Color(0xFF1B7A5C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF26A17B).withOpacity(0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    )
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tether Payout',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Image.network(
                          'https://img.icons8.com/color/96/tether.png',
                          height: 32,
                          errorBuilder: (context, _, __) => const Icon(
                            Icons.currency_exchange_rounded,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'AVAILABLE BALANCE',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '\$${userBalance.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Payout Input Fields
              const Text(
                'Withdrawal Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
                ],
                decoration: InputDecoration(
                  labelText: 'Amount to Withdraw',
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

              TextFormField(
                controller: _addressController,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                decoration: InputDecoration(
                  labelText: 'USDT Address (TRC-20)',
                  hintText: 'Starts with T...',
                  prefixIcon: const Icon(Icons.account_balance_wallet_rounded),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'USDT address is required';
                  }
                  if (!value.trim().startsWith('T') || value.trim().length < 34) {
                    return 'Please enter a valid TRC-20 address (starts with T)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 18),

              TextFormField(
                controller: _remarksController,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(
                  labelText: 'Remarks',
                  hintText: 'e.g. USDT Withdrawal',
                  prefixIcon: const Icon(Icons.edit_note_rounded),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
              const SizedBox(height: 28),

              // Fee Breakdown Card
              Builder(
                builder: (context) {
                  final text = _amountController.text.trim();
                  final amount = double.tryParse(text) ?? 0.00;
                  final fee = amount > 0 ? (amount * 0.01 + 0.30) : 0.0;
                  final netAmount = amount > 0 ? (amount - fee) : 0.0;

                  if (amount <= 0) return const SizedBox.shrink();

                  return Container(
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
                            Text('\$${amount.toStringAsFixed(2)}'),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Fee (1% + \$0.30):', style: TextStyle(color: Colors.grey)),
                            Text('-\$${fee.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFFEF4444))),
                          ],
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Net Received in Crypto:', style: TextStyle(fontWeight: FontWeight.bold)),
                            Text('\$${netAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 36),

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: walletProvider.isLoading ? null : _submitPayout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF26A17B),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: walletProvider.isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Confirm USDT Payout', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
