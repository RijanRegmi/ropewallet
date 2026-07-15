import 'dart:convert';
import 'package:ropewallet/core/network/api_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import 'package:ropewallet/features/auth/presentation/pages/profile_page.dart';
import '../../providers/wallet_provider.dart';
import 'deposit_page.dart';
import 'scanner_page.dart';
import 'send_money_page.dart';
import 'withdraw_page.dart';
import 'statement_page.dart';
import 'receipt_page.dart';
import 'chime_transfer_page.dart';
import 'cash_app_transfer_page.dart';
import 'venmo_transfer_page.dart';
import 'bank_transfer_page.dart';
import 'usdt_transfer_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _isInit = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInit) {
      Provider.of<WalletProvider>(context, listen: false).fetchTransactions();
      _isInit = true;
    }
  }

  void _copyPaymentLink(String qrData) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return _ShareLinkBottomSheet(qrData: qrData);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final walletProvider = Provider.of<WalletProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = authProvider.user ?? {};
    final fullName = user['fullName'] ?? 'Wallet User';
    final email = user['email'] ?? '';
    final balance = user['walletBalance'] ?? 0.00;
    final qrData = user['qrCodeData'] ?? 'no-qr-data';
    final profileImage = user['profileImage'] ?? '';
    final transactions = walletProvider.transactions;
    final isBalanceHidden = walletProvider.isBalanceHidden;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text(
          'RopeWallet',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: -0.5),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([
            authProvider.tryAutoLogin(),
            walletProvider.fetchTransactions(),
          ]);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section with Avatar in front of name
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ProfilePage()),
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: theme.primaryColor.withOpacity(0.3),
                          width: 2,
                        ),
                      ),
                      child: CircleAvatar(
                        radius: 26,
                        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                        backgroundImage: profileImage.isNotEmpty
                            ? NetworkImage(profileImage)
                            : null,
                        child: profileImage.isEmpty
                            ? Icon(
                                Icons.person_rounded,
                                size: 30,
                                color: isDark ? Colors.white54 : Colors.grey[400],
                              )
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome Back,',
                          style: TextStyle(
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          fullName,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Premium Wallet Balance Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24.0),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.primaryColor,
                      theme.primaryColor.withBlue(210),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: theme.primaryColor.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Balance',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        // Eye Toggle Button for balance hiding
                        GestureDetector(
                          onTap: () {
                            walletProvider.toggleBalanceVisibility();
                          },
                          child: Icon(
                            isBalanceHidden ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      isBalanceHidden
                          ? '\$xxxx.xx'
                          : '\$${balance is num ? balance.toStringAsFixed(2) : double.parse(balance.toString()).toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Active Sponsor Bank',
                          style: TextStyle(
                            color: Colors.white60,
                            fontSize: 12,
                          ),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF34D399),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'Connected',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        )
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Action Cards (Scan, Send, Deposit, Withdraw, Link Card, Share)
              Row(
                children: [
                  _buildActionCard(
                    Icons.qr_code_scanner_rounded,
                    'Scan QR',
                    theme.primaryColor,
                    () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ScannerPage()),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  _buildActionCard(
                    Icons.send_rounded,
                    'Send Tag',
                    const Color(0xFF10B981),
                    () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const SendMoneyPage()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildActionCard(
                    Icons.add_circle_rounded,
                    'Card Deposit',
                    const Color(0xFF3B82F6),
                    () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const DepositPage()),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  _buildActionCard(
                    Icons.credit_card_rounded,
                    'Card Payout',
                    const Color(0xFFF59E0B),
                    () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const WithdrawPage()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildActionCard(
                    Icons.link_rounded,
                    'Link Card',
                    const Color(0xFF8B5CF6),
                    () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const DepositPage()),
                      );
                    },
                  ),
                  const SizedBox(width: 12),
                  _buildActionCard(
                    Icons.share_rounded,
                    'Share Link',
                    const Color(0xFFEC4899),
                    () => _copyPaymentLink(qrData),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Services & External Wallets Hub
              const Text(
                'Services & External Wallets',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.45,
                children: [
                  _buildServiceCard(
                    title: 'Chime',
                    subtitle: 'Deposit / Payout',
                    logoUrl: 'https://img.icons8.com/color/96/chime.png',
                    accentColor: const Color(0xFF25C974),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const ChimeTransferPage()),
                      );
                    },
                  ),
                  _buildServiceCard(
                    title: 'Cash App',
                    subtitle: 'Send / Payout',
                    logoUrl: 'https://img.icons8.com/color/96/cash-app.png',
                    accentColor: const Color(0xFF00D632),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const CashAppTransferPage()),
                      );
                    },
                  ),
                  _buildServiceCard(
                    title: 'Venmo',
                    subtitle: 'Send / Payout',
                    logoUrl: 'https://img.icons8.com/color/96/venmo.png',
                    accentColor: const Color(0xFF008CFF),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const VenmoTransferPage()),
                      );
                    },
                  ),
                  _buildServiceCard(
                    title: 'Bank Account',
                    subtitle: 'Direct Deposit',
                    logoUrl: 'https://img.icons8.com/color/96/bank.png',
                    accentColor: const Color(0xFF475569),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const BankTransferPage()),
                      );
                    },
                  ),
                  _buildServiceCard(
                    title: 'USDT Tether',
                    subtitle: 'TRC-20 Payout',
                    logoUrl: 'https://img.icons8.com/color/96/tether.png',
                    accentColor: const Color(0xFF26A17B),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const UsdtTransferPage()),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Recent Transactions Header & Statement Icon
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Transactions',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const StatementPage()),
                      );
                    },
                    child: Row(
                      children: [
                        Text(
                          'Statements',
                          style: TextStyle(
                            color: theme.primaryColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(Icons.receipt_long_rounded, color: theme.primaryColor, size: 18),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              walletProvider.isLoading && transactions.isEmpty
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 20.0),
                        child: CircularProgressIndicator(),
                      ),
                    )
                  : transactions.isEmpty
                      ? Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 36),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(Icons.history_rounded, size: 48, color: Colors.grey.withOpacity(0.4)),
                              const SizedBox(height: 12),
                              const Text(
                                'No transactions yet',
                                style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: transactions.length > 2 ? 2 : transactions.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final tx = transactions[index];
                            final String type = tx['type'] ?? 'transfer';
                            final double amount = tx['amount'] is num ? tx['amount'].toDouble() : double.parse(tx['amount'].toString());
                            final double fee = tx['fee'] is num ? tx['fee'].toDouble() : double.parse(tx['fee'].toString());
                            final double netAmount = tx['netAmount'] is num ? tx['netAmount'].toDouble() : double.parse(tx['netAmount'].toString());
                            final String rawDate = tx['createdAt'] ?? '';
                            final String formattedDate = rawDate.isNotEmpty
                                ? DateTime.parse(rawDate).toLocal().toString().substring(0, 16)
                                : 'Recent';

                            bool isSender = false;
                            if (type == 'transfer') {
                              final senderObj = tx['sender'];
                              final String senderId = senderObj is Map ? (senderObj['_id'] ?? '') : (senderObj ?? '');
                              isSender = senderId == user['id'];
                            }

                            IconData txIcon;
                            Color txIconColor;
                            String txTitle;
                            String txAmountText;
                            Color txAmountColor;
                            String txSubtitle = formattedDate;

                            if (type == 'deposit') {
                              txIcon = Icons.add_circle_outline_rounded;
                              txIconColor = const Color(0xFF3B82F6);
                              txTitle = 'Deposit via Stripe';
                              txAmountText = '+\$${amount.toStringAsFixed(2)}';
                              txAmountColor = const Color(0xFF3B82F6);
                            } else {
                              if (isSender) {
                                txIcon = Icons.arrow_upward_rounded;
                                txIconColor = const Color(0xFFEF4444);
                                final receiverObj = tx['receiver'];
                                final String receiverName = receiverObj is Map ? (receiverObj['fullName'] ?? 'User') : 'User';
                                txTitle = 'Sent to $receiverName';
                                txAmountText = '-\$${amount.toStringAsFixed(2)}';
                                txAmountColor = const Color(0xFFEF4444);
                                txSubtitle = '$formattedDate • Incl. \$${fee.toStringAsFixed(2)} fee';
                              } else {
                                txIcon = Icons.arrow_downward_rounded;
                                txIconColor = const Color(0xFF10B981);
                                final senderObj = tx['sender'];
                                final String senderName = senderObj is Map ? (senderObj['fullName'] ?? 'User') : 'User';
                                txTitle = 'Received from $senderName';
                                txAmountText = '+\$${netAmount.toStringAsFixed(2)}';
                                txAmountColor = const Color(0xFF10B981);
                                txSubtitle = '$formattedDate • \$${fee.toStringAsFixed(2)} fee cut';
                              }
                            }

                            return ListTile(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ReceiptPage(
                                      transaction: tx,
                                      currentUser: user,
                                    ),
                                  ),
                                );
                              },
                              contentPadding: EdgeInsets.zero,
                              leading: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: txIconColor.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(txIcon, color: txIconColor),
                              ),
                              title: Text(txTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(txSubtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    txAmountText,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: txAmountColor,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 16),
                                ],
                              ),
                            );
                          },
                        ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard(IconData icon, String title, Color color, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: color.withOpacity(0.15),
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 6),
              Text(
                title,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  Widget _buildServiceCard({
    required String title,
    required String subtitle,
    required String logoUrl,
    required Color accentColor,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: accentColor.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Image.network(
                    logoUrl,
                    height: 24,
                    width: 24,
                    errorBuilder: (context, _, __) => Icon(
                      Icons.currency_exchange_rounded,
                      color: accentColor,
                      size: 24,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: isDark ? Colors.white30 : Colors.black26,
                  size: 14,
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ShareLinkBottomSheet extends StatefulWidget {
  final String qrData;

  const _ShareLinkBottomSheet({Key? key, required this.qrData}) : super(key: key);

  @override
  _ShareLinkBottomSheetState createState() => _ShareLinkBottomSheetState();
}

class _ShareLinkBottomSheetState extends State<_ShareLinkBottomSheet> {
  final TextEditingController _amountController = TextEditingController();
  String _selectedMethod = 'any'; // 'any', 'chime', 'venmo', 'cashapp', 'card'
  bool _isLoading = false;

  final List<Map<String, dynamic>> _methods = [
    {'id': 'any', 'name': 'Any Method', 'icon': '🌐', 'color': const Color(0xFFEC4899)},
    {'id': 'chime', 'name': 'Chime Only', 'icon': '🏦', 'color': const Color(0xFF25C490)},
    {'id': 'venmo', 'name': 'Venmo Only', 'icon': '💜', 'color': const Color(0xFF008CFF)},
    {'id': 'cashapp', 'name': 'Cash App Only', 'icon': '💚', 'color': const Color(0xFF00D632)},
    {'id': 'card', 'name': 'Card / Pay', 'icon': '💳', 'color': const Color(0xFF3B82F6)},
  ];

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _generateAndCopy() async {
    final amountText = _amountController.text.trim();
    final double? amount = double.tryParse(amountText);

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiClient().post('/p2p/create-request', {
        if (amount != null && amount > 0) 'amount': amount,
        'note': _selectedMethod == 'any' 
            ? 'General Payment Request'
            : 'Payment Request via ${_selectedMethod.toUpperCase()}',
      });

      if (!mounted) return;

      final responseData = jsonDecode(response.body);
      if (response.statusCode == 201 && responseData['success'] == true) {
        String link = responseData['data']['paymentLink'];
        
        // Append selected method to link if not 'any'
        if (_selectedMethod != 'any') {
          link = '$link&method=$_selectedMethod';
        }

        await Clipboard.setData(ClipboardData(text: link));
        
        if (!mounted) return;
        Navigator.pop(context);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEC4899),
            content: Row(
              children: [
                const Icon(Icons.check_circle_rounded, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _selectedMethod == 'any'
                        ? 'Unique general payment link copied!'
                        : 'Unique ${_selectedMethod.toUpperCase()} request link copied!',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text(responseData['error'] ?? 'Failed to generate link.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text('Network error: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 20,
        right: 20,
        top: 24,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF151922) : Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 50,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Customize Request Link',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Generate a specific payment link to share with friends',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white60 : Colors.black54,
              ),
            ),
            const SizedBox(height: 24),
            
            // Amount Input Field
            Text(
              'Request Amount (Optional)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white54 : Colors.black45,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              decoration: InputDecoration(
                prefixText: '\$ ',
                prefixStyle: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
                hintText: '0.00',
                hintStyle: TextStyle(
                  fontSize: 16,
                  color: isDark ? Colors.white24 : Colors.black26,
                ),
                filled: true,
                fillColor: isDark ? const Color(0xFF0F1218) : Colors.grey.shade100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(15),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              ),
            ),
            const SizedBox(height: 24),

            // Select Method Grid
            Text(
              'Select Payer Method',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white54 : Colors.black45,
              ),
            ),
            const SizedBox(height: 10),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 2.2,
              ),
              itemCount: _methods.length,
              itemBuilder: (context, index) {
                final method = _methods[index];
                final isSelected = _selectedMethod == method['id'];
                
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedMethod = method['id'];
                    });
                  },
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? (method['color'] as Color).withOpacity(0.15)
                          : (isDark ? const Color(0xFF0F1218) : Colors.grey.shade100),
                      border: Border.all(
                        color: isSelected 
                            ? (method['color'] as Color) 
                            : Colors.transparent,
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          method['icon'],
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          method['name'].split(' ')[0],
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSelected
                                ? (method['color'] as Color)
                                : (isDark ? Colors.white70 : Colors.black87),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 32),

            // Submit Button
            ElevatedButton(
              onPressed: _isLoading ? null : _generateAndCopy,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEC4899),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Generate & Copy Link',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
