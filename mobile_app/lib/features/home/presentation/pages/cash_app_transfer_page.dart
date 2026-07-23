import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import 'receipt_page.dart';

class CashAppTransferPage extends StatefulWidget {
  const CashAppTransferPage({super.key});

  @override
  State<CashAppTransferPage> createState() => _CashAppTransferPageState();
}

class _CashAppTransferPageState extends State<CashAppTransferPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _tagFormKey = GlobalKey<FormState>();
  final _bankFormKey = GlobalKey<FormState>();

  // Input Controllers
  final _tagAmountController = TextEditingController();
  final _bankAmountController = TextEditingController();

  final _cashtagController = TextEditingController();
  final _holderNameController = TextEditingController();
  final _routingController = TextEditingController();
  final _accountController = TextEditingController();
  final _remarksController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
    _tagAmountController.addListener(() => setState(() {}));
    _bankAmountController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _tagAmountController.dispose();
    _bankAmountController.dispose();
    _cashtagController.dispose();
    _holderNameController.dispose();
    _routingController.dispose();
    _accountController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _submitTagTransfer() async {
    if (!_tagFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final double amount = double.parse(_tagAmountController.text.trim());
    final String tag = _cashtagController.text.trim();
    final String remarks = _remarksController.text.trim();

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to send Cash App transfer',
      ),
    );

    if (pin == null) return;

    final remarksText = remarks.isNotEmpty ? remarks : 'Cash App transfer to tag $tag';

    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'bank',
      authProvider: authProvider,
      bankName: 'Cash App',
      recipientTag: tag,
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
          'amount': amount * 1.15,
          'fee': amount * 0.15,
          'netAmount': amount,
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          'receiver': {'fullName': 'Cash App Tag $tag'},
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
            content: Text(walletProvider.errorMessage ?? 'Transfer failed'),
          ),
        );
      }
    }
  }

  Future<void> _submitBankWithdrawal() async {
    if (!_bankFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final double amount = double.parse(_bankAmountController.text.trim());
    final String holder = _holderNameController.text.trim();
    final String routing = _routingController.text.trim();
    final String account = _accountController.text.trim();

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to cash out to Cash App Account',
      ),
    );

    if (pin == null) return;

    final remarksText = 'Cash App payout to account (...${account.substring(account.length - 4)})';

    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'bank',
      authProvider: authProvider,
      routingNumber: routing,
      accountNumber: account,
      bankName: 'Cash App',
      accountHolderName: holder,
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
          'fee': amount * 0.15,
          'netAmount': amount * 0.85,
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          'receiver': {'fullName': 'Cash App Account'},
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
        title: const Text('Cash App Services'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00D632),
          labelColor: const Color(0xFF00D632),
          unselectedLabelColor: isDark ? Colors.white60 : Colors.black54,
          tabs: const [
            Tab(icon: Icon(Icons.send_rounded), text: 'Send Tag'),
            Tab(icon: Icon(Icons.account_balance_rounded), text: 'Withdraw'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. Cash App Tag Transfer
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _tagFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF00D632), Color(0xFF00B028)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Cash App Transfer', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            Image.network('https://img.icons8.com/color/96/cash-app.png', height: 28, errorBuilder: (c, e, s) => const SizedBox.shrink()),
                          ],
                        ),
                        const SizedBox(height: 20),
                        const Text('AVAILABLE BALANCE', style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text('\$${userBalance.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _cashtagController,
                    decoration: InputDecoration(
                      labelText: 'Cash App Tag',
                      prefixText: '\$ ',
                      prefixStyle: const TextStyle(fontWeight: FontWeight.bold),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Cashtag is required' : null,
                  ),
                  const SizedBox(height: 18),
                  TextFormField(
                    controller: _tagAmountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Amount to Send',
                      prefixText: '\$ ',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Enter amount';
                      final amt = double.tryParse(v);
                      if (amt == null || amt <= 0) return 'Enter valid amount';
                      if (amt * 1.15 > userBalance) return 'Insufficient balance (inc. 15% fee)';
                      return null;
                    },
                  ),
                  const SizedBox(height: 18),
                  TextFormField(
                    controller: _remarksController,
                    decoration: InputDecoration(
                      labelText: 'Remarks',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Builder(
                    builder: (context) {
                      final amount = double.tryParse(_tagAmountController.text) ?? 0.0;
                      final fee = 0.0;
                      if (amount <= 0) return const SizedBox.shrink();
                      return Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Send Amount:', style: TextStyle(color: Colors.grey)),
                                Text('\$${amount.toStringAsFixed(2)}'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Platform Fee:', style: TextStyle(color: Colors.grey)),
                                const Text('\$0.00 (0% Fee)', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
                              ],
                            ),
                            const Divider(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total Cost (You Pay):', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('\$${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
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
                    height: 52,
                    child: ElevatedButton(
                      onPressed: walletProvider.isLoading ? null : _submitTagTransfer,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00D632),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Send Cash App Transfer', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Cash App Withdrawal
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _bankFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Cash out to your Cash App Card/Bank routing details:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _holderNameController,
                    decoration: InputDecoration(
                      labelText: 'Account Holder Name',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _routingController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Routing Number',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) => (v == null || v.length != 9) ? 'Must be 9 digits' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _accountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Account Number',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) => (v == null || v.length < 4) ? 'Invalid account number' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _bankAmountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Amount to Cash Out',
                      prefixText: '\$ ',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Enter amount';
                      final amt = double.tryParse(v);
                      if (amt == null || amt <= 0) return 'Enter valid amount';
                      if (amt > userBalance) return 'Insufficient balance';
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  Builder(
                    builder: (context) {
                      final amount = double.tryParse(_bankAmountController.text) ?? 0.0;
                      final fee = amount > 0 ? (amount * 0.01 + 0.30) : 0.0;
                      final net = amount > 0 ? (amount - fee) : 0.0;
                      if (amount <= 0) return const SizedBox.shrink();
                      return Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
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
                            const Divider(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Net Received:', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('\$${net.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
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
                    height: 52,
                    child: ElevatedButton(
                      onPressed: walletProvider.isLoading ? null : _submitBankWithdrawal,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00D632),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Cash Out to Cash App', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
