import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import '../../../auth/presentation/widgets/pin_code_dialog.dart';
import 'receipt_page.dart';

class BankTransferPage extends StatefulWidget {
  const BankTransferPage({super.key});

  @override
  State<BankTransferPage> createState() => _BankTransferPageState();
}

class _BankTransferPageState extends State<BankTransferPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _depositFormKey = GlobalKey<FormState>();
  final _payoutFormKey = GlobalKey<FormState>();

  // Deposit Controllers
  final _depAmountController = TextEditingController();
  final _depHolderNameController = TextEditingController();
  final _depRoutingController = TextEditingController();
  final _depAccountController = TextEditingController();
  final _depRemarksController = TextEditingController();
  String _depSelectedBankName = 'Chase';

  // Payout Controllers
  final _payAmountController = TextEditingController();
  final _payHolderNameController = TextEditingController();
  final _payRoutingController = TextEditingController();
  final _payAccountController = TextEditingController();
  final _payRemarksController = TextEditingController();
  String _paySelectedBankName = 'Chase';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() => setState(() {}));
    _depAmountController.addListener(() => setState(() {}));
    _payAmountController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _depAmountController.dispose();
    _depHolderNameController.dispose();
    _depRoutingController.dispose();
    _depAccountController.dispose();
    _depRemarksController.dispose();
    _payAmountController.dispose();
    _payHolderNameController.dispose();
    _payRoutingController.dispose();
    _payAccountController.dispose();
    _payRemarksController.dispose();
    super.dispose();
  }

  Future<void> _submitBankDeposit() async {
    if (!_depositFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final double amount = double.parse(_depAmountController.text.trim());
    final String holderName = _depHolderNameController.text.trim();
    final String routing = _depRoutingController.text.trim();
    final String account = _depAccountController.text.trim();
    final String customRemarks = _depRemarksController.text.trim();

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN for bank deposit of \$${amount.toStringAsFixed(2)}',
      ),
    );

    if (pin == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Deposit canceled')),
      );
      return;
    }

    final remarksText = customRemarks.isNotEmpty
        ? customRemarks
        : 'Bank deposit of \$${amount.toStringAsFixed(2)} from $_depSelectedBankName Account (...${account.substring(account.length - 4)})';

    final success = await walletProvider.bankDeposit(
      amount: amount,
      routingNumber: routing,
      accountNumber: account,
      accountHolderName: holderName,
      bankName: _depSelectedBankName,
      authProvider: authProvider,
      pin: pin,
      remarks: remarksText,
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
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': '$_depSelectedBankName Account'},
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
            content: Text(walletProvider.errorMessage ?? 'Bank deposit failed'),
          ),
        );
      }
    }
  }

  Future<void> _submitPayout() async {
    if (!_payoutFormKey.currentState!.validate()) return;

    final walletProvider = Provider.of<WalletProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final double amount = double.parse(_payAmountController.text.trim());
    final String holderName = _payHolderNameController.text.trim();
    final String routing = _payRoutingController.text.trim();
    final String account = _payAccountController.text.trim();
    final String customRemarks = _payRemarksController.text.trim();

    final String? pin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: 'Confirm PIN for bank cash out of \$${amount.toStringAsFixed(2)}',
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
        : 'Bank withdrawal of \$${amount.toStringAsFixed(2)} to $_paySelectedBankName Account (...${account.substring(account.length - 4)})';

    final success = await walletProvider.withdraw(
      amount: amount,
      method: 'bank',
      authProvider: authProvider,
      routingNumber: routing,
      accountNumber: account,
      bankName: _paySelectedBankName,
      accountHolderName: holderName,
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
          'fee': amount * 0.03,
          'netAmount': amount - (amount * 0.03),
          'remarks': remarksText,
          'createdAt': DateTime.now().toIso8601String(),
          'sender': {'fullName': authProvider.user?['fullName'] ?? 'You'},
          'receiver': {'fullName': '$_paySelectedBankName Account'},
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
        title: const Text('Bank Transfer Portal'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.primaryColor,
          labelColor: theme.primaryColor,
          unselectedLabelColor: isDark ? Colors.white60 : Colors.black54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.arrow_downward_rounded, size: 18), text: 'Bank Deposit'),
            Tab(icon: Icon(Icons.arrow_upward_rounded, size: 18), text: 'Bank Cash Out'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ─── TAB 1: BANK DEPOSIT ───
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _depositFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBalanceCard(isDark, userBalance, 'Deposit to Wallet'),
                  const SizedBox(height: 28),

                  const Text(
                    'Bank Routing & Account Details:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 16),

                  _buildBankDropdown(_depSelectedBankName, (val) => setState(() => _depSelectedBankName = val!)),
                  const SizedBox(height: 16),

                  _buildTextField(_depHolderNameController, 'Account Holder Name', Icons.person_outline_rounded, hint: 'John Doe'),
                  const SizedBox(height: 16),

                  _buildRoutingField(_depRoutingController),
                  const SizedBox(height: 16),

                  _buildAccountField(_depAccountController),
                  const SizedBox(height: 16),

                  _buildAmountField(
                    _depAmountController,
                    isDark,
                    userBalance,
                    user,
                    isDeposit: true,
                  ),
                  const SizedBox(height: 16),

                  _buildTextField(_depRemarksController, 'Remarks', Icons.edit_note_rounded, hint: 'Bank Deposit'),
                  const SizedBox(height: 28),

                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: walletProvider.isLoading ? null : _submitBankDeposit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Confirm Bank Deposit', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ─── TAB 2: BANK CASH OUT (WITHDRAWAL) ───
          SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _payoutFormKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBalanceCard(isDark, userBalance, 'Direct Bank Payout'),
                  const SizedBox(height: 28),

                  const Text(
                    'Bank Routing & Account Details:',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 16),

                  _buildBankDropdown(_paySelectedBankName, (val) => setState(() => _paySelectedBankName = val!)),
                  const SizedBox(height: 16),

                  _buildTextField(_payHolderNameController, 'Account Holder Name', Icons.person_outline_rounded, hint: 'John Doe'),
                  const SizedBox(height: 16),

                  _buildRoutingField(_payRoutingController),
                  const SizedBox(height: 16),

                  _buildAccountField(_payAccountController),
                  const SizedBox(height: 16),

                  _buildAmountField(
                    _payAmountController,
                    isDark,
                    userBalance,
                    user,
                    isDeposit: false,
                  ),
                  const SizedBox(height: 16),

                  _buildTextField(_payRemarksController, 'Remarks', Icons.edit_note_rounded, hint: 'Bank Payout'),
                  const SizedBox(height: 24),

                  // Fee Breakdown Box
                  Builder(
                    builder: (context) {
                      final text = _payAmountController.text.trim();
                      final amount = double.tryParse(text) ?? 0.00;
                      final fee = amount > 0 ? (amount * 0.03) : 0.0;
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
                                Text('\$${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w500)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Platform Fee (3%):', style: TextStyle(color: Colors.grey)),
                                Text('-\$${fee.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFFEF4444))),
                              ],
                            ),
                            const Divider(height: 20),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Net Received in Bank:', style: TextStyle(fontWeight: FontWeight.bold)),
                                Text('\$${netAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 28),

                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: walletProvider.isLoading ? null : _submitPayout,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: walletProvider.isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Confirm Bank Cash Out', style: TextStyle(fontWeight: FontWeight.bold)),
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

  Widget _buildBalanceCard(bool isDark, double balance, String title) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark 
              ? [const Color(0xFF334155), const Color(0xFF1E293B)] 
              : [const Color(0xFF475569), const Color(0xFF334155)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const Icon(Icons.account_balance_rounded, color: Colors.white70, size: 28),
            ],
          ),
          const SizedBox(height: 18),
          const Text(
            'AVAILABLE WALLET BALANCE',
            style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0),
          ),
          const SizedBox(height: 4),
          Text(
            '\$${balance.toStringAsFixed(2)}',
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildBankDropdown(String value, ValueChanged<String?> onChanged) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: 'Select Bank',
        prefixIcon: const Icon(Icons.business_rounded),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      ),
      items: ['Chase', 'Wells Fargo', 'Bank of America', 'PNC Bank', 'Citi', 'Capital One']
          .map((bank) => DropdownMenuItem(value: bank, child: Text(bank)))
          .toList(),
      onChanged: onChanged,
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {String? hint}) {
    return TextFormField(
      controller: controller,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      textCapitalization: TextCapitalization.words,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      ),
      validator: (val) {
        if (val == null || val.trim().isEmpty) return '$label is required';
        return null;
      },
    );
  }

  Widget _buildRoutingField(TextEditingController controller) {
    return TextFormField(
      controller: controller,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(9),
      ],
      decoration: InputDecoration(
        labelText: 'Routing Number (9 Digits)',
        prefixIcon: const Icon(Icons.tag_rounded),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        hintText: 'e.g. 121000358',
      ),
      validator: (val) {
        if (val == null || val.trim().length != 9) return 'Please enter valid 9-digit routing number';
        return null;
      },
    );
  }

  Widget _buildAccountField(TextEditingController controller) {
    return TextFormField(
      controller: controller,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      keyboardType: TextInputType.number,
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(17),
      ],
      decoration: InputDecoration(
        labelText: 'Account Number',
        prefixIcon: const Icon(Icons.account_balance_wallet_rounded),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        hintText: 'e.g. 990012345678',
      ),
      validator: (val) {
        if (val == null || val.trim().length < 4) return 'Please enter valid account number';
        return null;
      },
    );
  }

  Widget _buildAmountField(TextEditingController controller, bool isDark, double userBalance, Map user, {required bool isDeposit}) {
    return TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
      ],
      decoration: InputDecoration(
        labelText: isDeposit ? 'Amount to Deposit' : 'Amount to Cash Out',
        prefixText: '\$ ',
        prefixStyle: TextStyle(
          color: isDark ? Colors.white : Colors.black,
          fontWeight: FontWeight.bold,
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
      ),
      validator: (value) {
        if (value == null || value.trim().isEmpty) return 'Please enter an amount';
        final amt = double.tryParse(value);
        if (amt == null || amt <= 0) return 'Please enter a valid amount';
        final isAdminOrHost = user['role'] == 'admin' || user['role'] == 'host' || user['role'] == 'superadmin';
        final maxSingle = isAdminOrHost ? 2500.00 : 500.00;
        if (amt > maxSingle) {
          return 'Single ${isDeposit ? "deposit" : "withdrawal"} limit is \$${maxSingle.toStringAsFixed(2)}';
        }
        if (!isDeposit && amt > userBalance) {
          return 'Insufficient balance';
        }
        return null;
      },
    );
  }
}
