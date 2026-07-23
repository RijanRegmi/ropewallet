import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import 'receipt_page.dart';

class ChimeTransferPage extends StatefulWidget {
  const ChimeTransferPage({super.key});

  @override
  State<ChimeTransferPage> createState() => _ChimeTransferPageState();
}

class _ChimeTransferPageState extends State<ChimeTransferPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _depositFormKey = GlobalKey<FormState>();
  final _tagFormKey = GlobalKey<FormState>();
  final _bankFormKey = GlobalKey<FormState>();

  // Input Controllers
  final _depositAmountController = TextEditingController();
  final _tagAmountController = TextEditingController();
  final _bankAmountController = TextEditingController();

  final _chimeTagController = TextEditingController();
  final _holderNameController = TextEditingController();
  final _routingController = TextEditingController();
  final _accountController = TextEditingController();
  final _remarksController = TextEditingController();

  // Card Input Details for Chime Card Deposit
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvcController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() {});
    });
    _depositAmountController.addListener(() => setState(() {}));
    _tagAmountController.addListener(() => setState(() {}));
    _bankAmountController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _depositAmountController.dispose();
    _tagAmountController.dispose();
    _bankAmountController.dispose();
    _chimeTagController.dispose();
    _holderNameController.dispose();
    _routingController.dispose();
    _accountController.dispose();
    _remarksController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvcController.dispose();
    super.dispose();
  }

  Future<void> _submitDeposit() async {
    if (!_depositFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final double amount = double.parse(_depositAmountController.text.trim());

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to deposit from Chime',
      ),
    );

    if (pin == null) return;

    final hasSavedCard = authProvider.user?['savedCard'] != null;
    final expiryParts = _expiryController.text.contains('/')
        ? _expiryController.text.split('/')
        : <String>[];

    final success = await walletProvider.deposit(
      amount: amount,
      authProvider: authProvider,
      cardNumber: hasSavedCard ? null : _cardNumberController.text.trim(),
      expMonth: !hasSavedCard && expiryParts.isNotEmpty ? expiryParts[0].trim() : null,
      expYear: !hasSavedCard && expiryParts.length > 1 ? '20${expiryParts[1].trim()}' : null,
      cvc: hasSavedCard ? null : _cvcController.text.trim(),
      pin: pin,
      remarks: 'Deposit from Chime Debit Card',
      useSavedCard: hasSavedCard,
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
          'remarks': 'Deposit from Chime Debit Card',
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': 'Chime Card'},
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

  Future<void> _submitTagTransfer() async {
    if (!_tagFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    final double amount = double.parse(_tagAmountController.text.trim());
    final String tag = _chimeTagController.text.trim();
    final String remarks = _remarksController.text.trim();

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN to send Chime transfer',
      ),
    );

    if (pin == null) return;

    final remarksText = remarks.isNotEmpty ? remarks : 'Chime transfer to tag $tag';

    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'bank',
      authProvider: authProvider,
      bankName: 'Chime',
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
          'receiver': {'fullName': 'Chime Tag $tag'},
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
        subtitle: 'Confirm PIN to withdraw to Chime Bank',
      ),
    );

    if (pin == null) return;

    final remarksText = 'Chime withdrawal to account (...${account.substring(account.length - 4)})';

    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'bank',
      authProvider: authProvider,
      routingNumber: routing,
      accountNumber: account,
      bankName: 'Chime',
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
          'receiver': {'fullName': 'Chime Bank Account'},
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
        title: const Text('Chime Services'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Glassmorphic Segmented Pill Selector (No Green-on-Green Blurring!)
          // Glassmorphic Sliding Segmented Pill Track
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final double itemWidth = (constraints.maxWidth - 10) / 3;
                final Alignment alignment = _tabController.index == 0
                    ? Alignment.centerLeft
                    : _tabController.index == 1
                        ? Alignment.center
                        : Alignment.centerRight;

                return Container(
                  height: 50,
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: Stack(
                    children: [
                      // Smooth Sliding Emerald Glass Pill Indicator
                      AnimatedAlign(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.fastOutSlowIn,
                        alignment: alignment,
                        child: Container(
                          width: itemWidth,
                          height: double.infinity,
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withValues(alpha: 0.35),
                                blurRadius: 12,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                      ),

                      // Interactive Button Labels
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _tabController.animateTo(0),
                              behavior: HitTestBehavior.opaque,
                              child: Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.arrow_downward_rounded,
                                      size: 16,
                                      color: _tabController.index == 0 ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Deposit',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: _tabController.index == 0 ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _tabController.animateTo(1),
                              behavior: HitTestBehavior.opaque,
                              child: Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.send_rounded,
                                      size: 16,
                                      color: _tabController.index == 1 ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Send Tag',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: _tabController.index == 1 ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => _tabController.animateTo(2),
                              behavior: HitTestBehavior.opaque,
                              child: Center(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.account_balance_rounded,
                                      size: 16,
                                      color: _tabController.index == 2 ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      'Withdraw',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: _tabController.index == 2 ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // 1. Chime Card Deposit
                SingleChildScrollView(
                  padding: const EdgeInsets.all(20.0),
                  child: Form(
                    key: _depositFormKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Ultra-Sleek Glass Balance Card
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3), width: 1.5),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.25),
                                blurRadius: 20,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Chime Banking Services', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                                  Image.network('https://img.icons8.com/color/96/chime.png', height: 26, errorBuilder: (c, e, s) => const SizedBox.shrink()),
                                ],
                              ),
                              const SizedBox(height: 18),
                              const Text('AVAILABLE ROPEWALLET BALANCE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                              const SizedBox(height: 4),
                              Text('\$${userBalance.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF10B981), fontSize: 28, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                  TextFormField(
                    controller: _depositAmountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: 'Deposit Amount',
                      prefixText: '\$ ',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Enter amount';
                      final amt = double.tryParse(v);
                      if (amt == null || amt <= 0) return 'Enter valid amount';
                      return null;
                    },
                  ),
                  const SizedBox(height: 20),
                  if (hasSavedCard) ...[
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.credit_card_rounded, color: Color(0xFF25C974)),
                          const SizedBox(width: 12),
                          Text('Using Saved Card ending in ${savedCard['last4']}'),
                        ],
                      ),
                    ),
                  ] else ...[
                    TextFormField(
                      controller: _cardNumberController,
                      decoration: InputDecoration(
                        labelText: 'Chime Debit Card Number',
                        prefixIcon: const Icon(Icons.credit_card_rounded),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      validator: (v) => (v == null || v.isEmpty) ? 'Enter card number' : null,
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _expiryController,
                            decoration: InputDecoration(
                              labelText: 'Expiry (MM/YY)',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: TextFormField(
                            controller: _cvcController,
                            decoration: InputDecoration(
                              labelText: 'CVC',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 36),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: walletProvider.isLoading ? null : _submitDeposit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF25C974),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Confirm Chime Deposit', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 2. Chime Tag Transfer (Sends to another Chime user tag)
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _tagFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Send directly to a Chime username tag:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _chimeTagController,
                    decoration: InputDecoration(
                      labelText: 'Chime Sign/Tag',
                      prefixText: '\$ ',
                      prefixStyle: const TextStyle(fontWeight: FontWeight.bold),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Chime tag is required';
                      return null;
                    },
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
                        backgroundColor: const Color(0xFF25C974),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Send Chime Transfer', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Withdraw to Chime Bank Account
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _bankFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Cash out directly to your Chime Bank Account:', style: TextStyle(fontWeight: FontWeight.bold)),
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
                      labelText: 'Chime Routing Number',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    validator: (v) => (v == null || v.length != 9) ? 'Must be 9 digits' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _accountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Chime Account Number',
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
                                const Text('Net Received in Bank:', style: TextStyle(fontWeight: FontWeight.bold)),
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
                        backgroundColor: const Color(0xFF25C974),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Withdraw to Chime Bank', style: TextStyle(fontWeight: FontWeight.bold)),
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
);
}
}
