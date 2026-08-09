import 'dart:convert';
import 'package:ropewallet/core/network/api_client.dart';
import 'package:ropewallet/core/constants/api_constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import 'package:ropewallet/features/auth/providers/security_provider.dart';
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
import 'p2p_gateway_order_page.dart';
import '../../../admin/presentation/pages/admin_portal_page.dart';
import 'package:ropewallet/features/notifications/presentation/pages/notification_center_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _isInit = false;
  String? _currentUserId;
  List<dynamic> _activeP2pAccounts = [];
  int _unreadNoticeCount = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.user?['_id'] ?? authProvider.user?['id'];
    
    if (!_isInit || (userId != null && _currentUserId != userId)) {
      _currentUserId = userId;
      _isInit = true;
      Provider.of<WalletProvider>(context, listen: false).fetchTransactions();
      _fetchActiveP2pAccounts();
      _fetchUnreadNoticesCount();
      _checkBiometricsPrompt();
    }
  }

  Future<void> _fetchUnreadNoticesCount() async {
    try {
      final response = await ApiClient().get('/notices');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final List notices = data['data'];
          int unread = 0;
          for (var n in notices) {
            if (n['isRead'] != true) {
              unread++;
            }
          }
          if (mounted) {
            setState(() {
              _unreadNoticeCount = unread;
            });
          }
        }
      }
    } catch (_) {}
  }

  void _checkBiometricsPrompt() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final securityProvider = Provider.of<SecurityProvider>(context, listen: false);
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      final userId = user?['_id']?.toString() ?? user?['email']?.toString();

      await securityProvider.loadUserSecuritySettings(userId);

      if (securityProvider.isBiometricSupported &&
          !securityProvider.useBiometricsForLogin &&
          !securityProvider.useBiometricsForPin &&
          !securityProvider.hasPromptedBiometrics) {
        _showBiometricSetupBottomSheet(securityProvider);
      }
    });
  }

  void _showBiometricSetupBottomSheet(SecurityProvider securityProvider) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.fingerprint_rounded, color: Color(0xFF10B981), size: 30),
              ),
              const SizedBox(height: 16),
              Text(
                'Enable Biometric Security',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Would you like to enable Face ID or Fingerprint authentication for faster sign-ins and PIN verification?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await securityProvider.setHasPromptedBiometrics(true);
                    final authenticated = await securityProvider.authenticateBiometrically();
                    if (authenticated) {
                      await securityProvider.setUseBiometricsForLogin(true);
                      await securityProvider.setUseBiometricsForPin(true);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Biometrics enabled for login and transactions!'),
                            backgroundColor: const Color(0xFF10B981),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Enable Biometrics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: TextButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await securityProvider.setHasPromptedBiometrics(true);
                  },
                  child: Text(
                    'Not Now',
                    style: TextStyle(
                      color: isDark ? Colors.white60 : Colors.black54,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _fetchActiveP2pAccounts() async {
    try {
      final response = await ApiClient().get('/p2p/active-accounts');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          if (mounted) {
            setState(() {
              _activeP2pAccounts = data['data'];
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Error fetching active P2P accounts: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    if (!authProvider.isAuthenticated || authProvider.user == null) {
      return const SizedBox.shrink();
    }
    final walletProvider = Provider.of<WalletProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = authProvider.user!;
    final fullName = user['fullName'] ?? 'User';
    final double availableBalance = user['walletBalance'] is num 
        ? (user['walletBalance'] as num).toDouble() 
        : (double.tryParse(user['walletBalance']?.toString() ?? '0') ?? 0.00);
    final double pendingCashout = user['pendingCashoutBalance'] is num 
        ? (user['pendingCashoutBalance'] as num).toDouble() 
        : (double.tryParse(user['pendingCashoutBalance']?.toString() ?? '0') ?? 0.00);
    final double totalBalance = availableBalance + pendingCashout;
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
            _fetchActiveP2pAccounts(),
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
                        backgroundImage: getProfileImageProvider(profileImage),
                        child: getProfileImageProvider(profileImage) == null
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
                  IconButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const NotificationCenterPage()),
                      );
                    },
                    icon: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Icon(
                          Icons.notifications_none_rounded,
                          size: 26,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                        if (_unreadNoticeCount > 0)
                          Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              width: 9,
                              height: 9,
                              decoration: const BoxDecoration(
                                color: Color(0xFFEF4444),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Premium Wallet Balance Card (Clickable to inspect balance breakdown)
              GestureDetector(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    shape: const RoundedRectangleBorder(
                      borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    builder: (ctx) => Container(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.account_balance_wallet_rounded, color: theme.primaryColor, size: 28),
                              const SizedBox(width: 12),
                              const Text('Balance Summary', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 20),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Available Balance:', style: TextStyle(fontWeight: FontWeight.w600)),
                                    Text('\$${availableBalance.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  ],
                                ),
                                const Divider(height: 24),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Pending Cashout Amount:', style: TextStyle(color: Colors.grey)),
                                    Text('\$${pendingCashout.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange)),
                                  ],
                                ),
                                const Divider(height: 24),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Total Balance (incl. Pending):', style: TextStyle(fontWeight: FontWeight.bold)),
                                    Text('\$${totalBalance.toStringAsFixed(2)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: theme.primaryColor)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () => Navigator.pop(ctx),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.primaryColor,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: const Text('Close'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
                child: Container(
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
                            'Available Balance',
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
                      const SizedBox(height: 10),
                      Text(
                        isBalanceHidden
                            ? '\$xxxx.xx'
                            : '\$${availableBalance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isBalanceHidden
                            ? 'Total (incl. pending): \$xxxx.xx'
                            : 'Total (incl. pending): \$${totalBalance.toStringAsFixed(2)}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.85),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 18),
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
              ),
              const SizedBox(height: 28),

              // Admin Management Portal Banner Card (Super Admin only)
              if (authProvider.isSuperAdmin) ...[
                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const AdminPortalPage()),
                    );
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF4F46E5).withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.admin_panel_settings_rounded, color: Colors.white, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  authProvider.isSuperAdmin ? 'Super Admin Portal' : 'Admin Portal',
                                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Users, Deposits & Analytics',
                                  style: TextStyle(color: Colors.white70, fontSize: 12),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Action Cards (Scan, Send, Deposit, Payout)
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
              const SizedBox(height: 32),

              // Extra Services Hub (USDT TRC-20 Payout)
              const Text(
                'Extra Services',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
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
                            } else if (type == 'withdrawal') {
                              final String status = tx['status'] ?? 'completed';
                              if (status == 'declined') {
                                txIcon = Icons.cancel_outlined;
                                txIconColor = const Color(0xFFEF4444);
                                txTitle = 'Withdrawal Refunded';
                                txAmountText = '+\$${amount.toStringAsFixed(2)}';
                                txAmountColor = const Color(0xFF10B981);
                                txSubtitle = '$formattedDate • Refunded to balance';
                              } else if (status == 'pending') {
                                txIcon = Icons.access_time_rounded;
                                txIconColor = const Color(0xFFF59E0B);
                                txTitle = 'Withdrawal (Pending)';
                                txAmountText = '-\$${amount.toStringAsFixed(2)}';
                                txAmountColor = const Color(0xFFF59E0B);
                                txSubtitle = '$formattedDate • Pending Admin Approval';
                              } else {
                                txIcon = Icons.arrow_upward_rounded;
                                txIconColor = const Color(0xFFEF4444);
                                txTitle = 'Withdrawal Payout';
                                txAmountText = '-\$${amount.toStringAsFixed(2)}';
                                txAmountColor = const Color(0xFFEF4444);
                                txSubtitle = '$formattedDate • Fee \$${fee.toStringAsFixed(2)}';
                              }
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
  final List<dynamic> activeP2pAccounts;

  const _ShareLinkBottomSheet({
    Key? key,
    required this.qrData,
    required this.activeP2pAccounts,
  }) : super(key: key);

  @override
  _ShareLinkBottomSheetState createState() => _ShareLinkBottomSheetState();
}

class _ShareLinkBottomSheetState extends State<_ShareLinkBottomSheet> {
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _customerTagController = TextEditingController();
  final TextEditingController _gameIdController = TextEditingController();
  String _selectedMethod = 'chime'; // 'chime', 'venmo', 'cashapp', 'card'
  bool _isLoading = false;

  final List<Map<String, dynamic>> _allMethods = [
    {'id': 'chime', 'name': 'Chime', 'logo': 'https://img.icons8.com/color/96/chime.png', 'color': const Color(0xFF25C490)},
    {'id': 'cashapp', 'name': 'Cash App', 'logo': 'https://img.icons8.com/color/96/cash-app.png', 'color': const Color(0xFF00D632)},
    {'id': 'venmo', 'name': 'Venmo', 'logo': 'https://img.icons8.com/ios-filled/100/008CFF/venmo.png', 'color': const Color(0xFF008CFF)},
    {'id': 'applepay', 'name': 'Apple Pay', 'logo': 'https://img.icons8.com/color/96/apple-pay.png', 'color': const Color(0xFFA855F7)},
  ];

  List<Map<String, dynamic>> _availableMethods = [];

  @override
  void initState() {
    super.initState();
    final activePlatforms = widget.activeP2pAccounts
        .where((a) => a['isActive'] != false)
        .map((a) => (a['platform'] as String).toLowerCase())
        .toSet();

    if (!ApiConstants.enableP2P) {
      _availableMethods = [];
    } else if (activePlatforms.isNotEmpty) {
      _availableMethods = _allMethods.where((m) => activePlatforms.contains(m['id'])).toList();
    } else {
      // Fallback: Default to chime if none explicitly enabled
      _availableMethods = _allMethods.where((m) => m['id'] == 'chime').toList();
    }

    if (_availableMethods.isNotEmpty) {
      _selectedMethod = _availableMethods[0]['id'];
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _customerTagController.dispose();
    _gameIdController.dispose();
    super.dispose();
  }

  Future<void> _generateAndCopy() async {
    final amountText = _amountController.text.trim();
    final double? amount = double.tryParse(amountText);
    final customerTag = _customerTagController.text.trim();
    final gameUserId = _gameIdController.text.trim();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userTag = authProvider.user?['userTag'] ?? 'admin';

    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.red,
          content: Text('Please enter a required amount of at least \$1.00'),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiClient().post('/pay/create-order', {
        'userTag': userTag,
        'payerTag': customerTag,
        'gameUserId': gameUserId,
        'paymentMethod': _selectedMethod,
        'amount': amount,
      });

      if (!mounted) return;

      final responseData = jsonDecode(response.body);
      if ((response.statusCode == 200 || response.statusCode == 201) && responseData['success'] == true) {
        final orderId = responseData['data']['orderId'] as String;
        final link = 'https://www.ropewallet.com/pay/hub/$orderId';

        await Clipboard.setData(ClipboardData(text: link));

        if (!mounted) return;
        Navigator.pop(context);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Payment Gateway Link copied to clipboard! Share with customer.',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        );

        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => P2PGatewayOrderPage(orderId: orderId),
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
            
            // Customer Tag Field
            Text(
              'Customer Tag / Name (e.g. \$alice99)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white54 : Colors.black45,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _customerTagController,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              decoration: InputDecoration(
                hintText: 'e.g. \$alice99 or Alice Smith',
                hintStyle: TextStyle(
                  fontSize: 14,
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
            const SizedBox(height: 16),

            // Account ID Field (Optional)
            Text(
              'Account ID (Optional, e.g. 101)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white54 : Colors.black45,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _gameIdController,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : Colors.black87,
              ),
              decoration: InputDecoration(
                hintText: 'e.g. 101',
                hintStyle: TextStyle(
                  fontSize: 14,
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
            const SizedBox(height: 16),

            // Amount Input Field
            Text(
              'Request Amount (USD) *',
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
              itemCount: _availableMethods.length,
              itemBuilder: (context, index) {
                final method = _availableMethods[index];
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
                        Image.network(
                          method['logo'] as String,
                          height: 20,
                          width: 20,
                          errorBuilder: (c, e, s) => Icon(Icons.payment, size: 18, color: method['color'] as Color),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          method['name'],
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
