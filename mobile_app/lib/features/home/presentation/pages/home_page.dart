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
    final link = 'https://ropewallet.vercel.app/pay?to=$qrData';
    Clipboard.setData(ClipboardData(text: link));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Theme.of(context).primaryColor,
        content: const Row(
          children: [
            Icon(Icons.link_rounded, color: Colors.white),
            SizedBox(width: 10),
            Text('Payment link copied to clipboard!'),
          ],
        ),
      ),
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
          await authProvider.tryAutoLogin();
          await walletProvider.fetchTransactions();
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

              // Action Cards (Scan, Send, Deposit, Withdraw)
              Row(
                children: [
                  _buildActionCard(
                    Icons.qr_code_scanner_rounded,
                    'Scan',
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
                    'Send',
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
                    'Deposit',
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
                    Icons.account_balance_wallet_rounded,
                    'Withdraw',
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
              const SizedBox(height: 20),

              // Share link card
              InkWell(
                onTap: () => _copyPaymentLink(qrData),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: theme.primaryColor.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.share_rounded, color: theme.primaryColor, size: 18),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Share Your Request Link',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Accepts Apple Pay, Venmo, Cash App, Chime',
                              style: TextStyle(color: isDark ? Colors.white60 : Colors.black54, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.copy_all_rounded, color: theme.primaryColor, size: 18),
                    ],
                  ),
                ),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
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
}
