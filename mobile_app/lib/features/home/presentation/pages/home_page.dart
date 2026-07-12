import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/core/theme/theme_provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import 'deposit_page.dart';
import 'scanner_page.dart';
import 'send_money_page.dart';

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
      // Fetch user's transaction history when home page opens
      Provider.of<WalletProvider>(context, listen: false).fetchTransactions();
      _isInit = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final walletProvider = Provider.of<WalletProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = authProvider.user ?? {};
    final fullName = user['fullName'] ?? 'Wallet User';
    final email = user['email'] ?? '';
    final balance = user['walletBalance'] ?? 0.00;
    final qrData = user['qrCodeData'] ?? 'no-qr-data';
    final transactions = walletProvider.transactions;

    return Scaffold(
      appBar: AppBar(
        title: const Text('RopeWallet'),
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
            ),
            tooltip: 'Toggle Theme',
            onPressed: () {
              themeProvider.toggleTheme();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Logout',
            onPressed: () async {
              await authProvider.logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await authProvider.tryAutoLogin();
          await walletProvider.fetchTransactions();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Section
              Text(
                'Hello,',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  fontSize: 18,
                ),
              ),
              Text(
                fullName,
                style: theme.textTheme.displayLarge?.copyWith(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                email,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),

              // Premium Wallet Balance Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(28.0),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.primaryColor,
                      theme.primaryColor.withBlue(220),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: theme.primaryColor.withOpacity(0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
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
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'USD Wallet',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '\$${balance is num ? balance.toStringAsFixed(2) : double.parse(balance.toString()).toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 38,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Active US Sponsor Bank',
                          style: TextStyle(
                            color: Colors.white60,
                            fontSize: 13,
                          ),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Color(0xFF34D399), // green dot
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Text(
                              'Connected',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
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

              // Action Cards (Scan, Send, Deposit)
              Row(
                children: [
                  // Scan
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const ScannerPage()),
                        );
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        decoration: BoxDecoration(
                          color: theme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.qr_code_scanner_rounded, color: theme.primaryColor, size: 28),
                            const SizedBox(height: 8),
                            Text(
                              'Scan',
                              style: TextStyle(
                                color: theme.primaryColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Send
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const SendMoneyPage()),
                        );
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.send_rounded, color: Color(0xFF10B981), size: 28),
                            const SizedBox(height: 8),
                            const Text(
                              'Send',
                              style: TextStyle(
                                color: Color(0xFF10B981),
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Deposit
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const DepositPage()),
                        );
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.add_circle_rounded, color: Color(0xFF3B82F6), size: 28),
                            const SizedBox(height: 8),
                            const Text(
                              'Deposit',
                              style: TextStyle(
                                color: Color(0xFF3B82F6),
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Transaction History List
              Text(
                'Recent Transactions',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
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
                            color: isDark ? const Color(0xFF151B2C) : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
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
                              const SizedBox(height: 4),
                              const Text(
                                'Perform a deposit or send money to get started!',
                                style: TextStyle(color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: transactions.length > 5 ? 5 : transactions.length, // Show up to 5 recent
                          separatorBuilder: (context, index) => const Divider(height: 1),
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

                            // Build transaction line details
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
                                txSubtitle = '$formattedDate • \$${fee.toStringAsFixed(2)} platform fee cut';
                              }
                            }

                            return ListTile(
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
                              trailing: Text(
                                txAmountText,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: txAmountColor,
                                ),
                              ),
                            );
                          },
                        ),
              const SizedBox(height: 36),

              // In-app QR Code Section
              Text(
                'My QR Code',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF151B2C) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(isDark ? 0.2 : 0.05),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Mock QR Visual Design using simple borders & icons
                      Container(
                        width: 180,
                        height: 180,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: theme.primaryColor.withOpacity(0.3),
                            width: 2,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Icon(
                            Icons.qr_code_2_rounded,
                            size: 140,
                            color: theme.primaryColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Scan to Send Funds',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      SelectableText(
                        qrData,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontSize: 11,
                          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
