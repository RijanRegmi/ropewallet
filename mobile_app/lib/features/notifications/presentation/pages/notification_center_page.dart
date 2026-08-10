import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
import '../../../home/providers/wallet_provider.dart';
import 'package:ropewallet/features/notifications/providers/notice_provider.dart';

class NotificationCenterPage extends StatefulWidget {
  const NotificationCenterPage({super.key});

  @override
  State<NotificationCenterPage> createState() => _NotificationCenterPageState();
}

class _NotificationCenterPageState extends State<NotificationCenterPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        final noticeProvider = Provider.of<NoticeProvider>(context, listen: false);
        if (!noticeProvider.hasLoadedOnce) {
          noticeProvider.fetchNotices();
        }
      } catch (_) {}
      try {
        final walletProvider = Provider.of<WalletProvider>(context, listen: false);
        if (walletProvider.transactions.isEmpty) {
          walletProvider.fetchTransactions();
        }
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Widget _getCategoryIcon(String cat) {
    switch (cat) {
      case 'urgent':
        return const Icon(Icons.error_outline_rounded, color: Color(0xFFEF4444));
      case 'alert':
        return const Icon(Icons.shield_outlined, color: Color(0xFFF59E0B));
      case 'promo':
        return const Icon(Icons.auto_awesome_rounded, color: Color(0xFFA855F7));
      default:
        return const Icon(Icons.info_outline_rounded, color: Color(0xFF3B82F6));
    }
  }

  Color _getCategoryColor(String cat) {
    switch (cat) {
      case 'urgent':
        return const Color(0xFFEF4444);
      case 'alert':
        return const Color(0xFFF59E0B);
      case 'promo':
        return const Color(0xFFA855F7);
      default:
        return const Color(0xFF3B82F6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    NoticeProvider? noticeProvider;
    try {
      noticeProvider = Provider.of<NoticeProvider>(context);
    } catch (_) {}
    final walletProvider = Provider.of<WalletProvider>(context);

    final notices = noticeProvider?.notices ?? [];
    final transactions = walletProvider.transactions;

    final bool isLoadingNotices = (noticeProvider?.isLoading ?? false) && !(noticeProvider?.hasLoadedOnce ?? false);
    final bool isLoadingTxns = walletProvider.isLoading && transactions.isEmpty;

    final unreadNoticesCount = noticeProvider?.unreadCount ?? 0;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Notifications & Alerts', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF6366F1),
          indicatorWeight: 3,
          labelColor: isDark ? Colors.white : const Color(0xFF0F172A),
          unselectedLabelColor: isDark ? Colors.grey[400] : Colors.grey[600],
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          tabs: [
            const Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_rounded, size: 18),
                  SizedBox(width: 8),
                  Text('Transactions'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.notifications_active_rounded, size: 18),
                  const SizedBox(width: 8),
                  const Text('Alerts'),
                  if (unreadNoticesCount > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '$unreadNoticesCount',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ─── TAB 1: Transactions Section ───────────────────────────
          RefreshIndicator(
            onRefresh: () async {
              await walletProvider.fetchTransactions();
            },
            child: isLoadingTxns
                ? const Center(child: CircularProgressIndicator())
                : transactions.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 56, color: Colors.grey[400]),
                            const SizedBox(height: 12),
                            const Text('No Transaction Activity Yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Deposits and transfers will appear here.', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: transactions.length,
                        itemBuilder: (context, index) {
                          final authProvider = Provider.of<AuthProvider>(context, listen: false);
                          final user = authProvider.user ?? {};
                          final userId = user['id'] ?? '';

                          final txn = transactions[index];
                          final String type = txn['type'] ?? 'transfer';
                          final double amount = (txn['amount'] as num?)?.toDouble() ?? 0.0;
                          final double netAmount = (txn['netAmount'] as num?)?.toDouble() ?? amount;
                          final double fee = (txn['fee'] as num?)?.toDouble() ?? 0.0;
                          final String status = txn['status'] ?? 'completed';
                          final dateStr = txn['createdAt'] != null
                              ? DateTime.tryParse(txn['createdAt'])?.toLocal().toString().substring(0, 16) ?? ''
                              : '';

                          bool isSender = false;
                          if (type == 'transfer') {
                            final senderObj = txn['sender'];
                            final String senderId = senderObj is Map ? (senderObj['_id'] ?? '') : (senderObj ?? '');
                            isSender = (senderId == userId);
                          }

                          String title;
                          String subtitle = txn['remarks'] ?? '';
                          String amountText;
                          Color amountColor;
                          IconData iconData;
                          Color iconColor;

                          if (type == 'deposit' || type == 'p2p_deposit') {
                            title = 'Deposit Received';
                            amountText = '+\$${amount.toStringAsFixed(2)}';
                            amountColor = const Color(0xFF10B981);
                            iconData = Icons.south_west_rounded;
                            iconColor = const Color(0xFF10B981);
                            if (subtitle.isEmpty) subtitle = 'Wallet Deposit';
                          } else if (type == 'withdrawal') {
                            if (status == 'declined') {
                              title = 'Withdrawal Refunded';
                              amountText = '+\$${amount.toStringAsFixed(2)}';
                              amountColor = const Color(0xFF10B981);
                              iconData = Icons.cancel_outlined;
                              iconColor = const Color(0xFFEF4444);
                              subtitle = 'Refunded to wallet balance';
                            } else if (status == 'pending') {
                              title = 'Withdrawal (Pending)';
                              amountText = '-\$${amount.toStringAsFixed(2)}';
                              amountColor = const Color(0xFFF59E0B);
                              iconData = Icons.access_time_rounded;
                              iconColor = const Color(0xFFF59E0B);
                              subtitle = 'Pending Admin Approval';
                            } else {
                              title = 'Withdrawal Payout';
                              amountText = '-\$${amount.toStringAsFixed(2)}';
                              amountColor = const Color(0xFFEF4444);
                              iconData = Icons.north_east_rounded;
                              iconColor = const Color(0xFFEF4444);
                              if (subtitle.isEmpty) subtitle = 'Fee \$${fee.toStringAsFixed(2)}';
                            }
                          } else if (isSender) {
                            final receiverObj = txn['receiver'];
                            final String receiverName = receiverObj is Map ? (receiverObj['fullName'] ?? 'User') : 'User';
                            title = 'Transfer Sent';
                            amountText = '-\$${amount.toStringAsFixed(2)}';
                            amountColor = const Color(0xFFEF4444);
                            iconData = Icons.north_east_rounded;
                            iconColor = const Color(0xFFEF4444);
                            if (subtitle.isEmpty) subtitle = 'Sent to $receiverName';
                          } else {
                            final senderObj = txn['sender'];
                            final String senderName = senderObj is Map ? (senderObj['fullName'] ?? 'User') : 'User';
                            title = 'Money Received';
                            amountText = '+\$${netAmount.toStringAsFixed(2)}';
                            amountColor = const Color(0xFF10B981);
                            iconData = Icons.south_west_rounded;
                            iconColor = const Color(0xFF10B981);
                            if (subtitle.isEmpty) subtitle = 'Received from $senderName';
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: iconColor.withOpacity(0.12),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    iconData,
                                    color: iconColor,
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        title,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        subtitle,
                                        style: TextStyle(color: isDark ? Colors.grey[400] : Colors.grey[600], fontSize: 12),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        dateStr,
                                        style: TextStyle(color: Colors.grey[500], fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      amountText,
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 16,
                                        color: amountColor,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: (status == 'completed')
                                            ? const Color(0xFF10B981).withOpacity(0.1)
                                            : (status == 'declined' ? const Color(0xFFEF4444).withOpacity(0.1) : const Color(0xFFF59E0B).withOpacity(0.1)),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        status.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: (status == 'completed')
                                              ? const Color(0xFF10B981)
                                              : (status == 'declined' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)),
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

          // ─── TAB 2: Alerts & Notices Section ────────────────────────
          RefreshIndicator(
            onRefresh: () async {
              try {
                await noticeProvider?.fetchNotices();
              } catch (_) {}
            },
            child: isLoadingNotices
                ? const Center(child: CircularProgressIndicator())
                : notices.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.notifications_none_rounded, size: 56, color: Colors.grey[400]),
                            const SizedBox(height: 12),
                            const Text('No Alert Notices', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('Admin announcements will appear here.', style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: notices.length,
                        itemBuilder: (context, index) {
                          final n = notices[index];
                          final isRead = n['isRead'] == true;
                          final cat = n['category'] ?? 'info';
                          final dateStr = n['createdAt'] != null
                              ? DateTime.tryParse(n['createdAt'])?.toLocal().toString().substring(0, 16) ?? ''
                              : '';

                          return GestureDetector(
                            onTap: () {
                              if (!isRead && n['_id'] != null) {
                                noticeProvider?.markNoticeAsRead(n['_id']);
                              }
                            },
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: !isRead
                                      ? const Color(0xFF6366F1).withOpacity(0.5)
                                      : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                                  width: !isRead ? 1.5 : 1.0,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      _getCategoryIcon(cat),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: _getCategoryColor(cat).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          cat.toString().toUpperCase(),
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: _getCategoryColor(cat),
                                          ),
                                        ),
                                      ),
                                      const Spacer(),
                                      if (!isRead)
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: Color(0xFF6366F1),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      const SizedBox(width: 6),
                                      Text(
                                        dateStr,
                                        style: TextStyle(color: Colors.grey[500], fontSize: 11),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    n['title'] ?? 'Notice',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: isDark ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    n['content'] ?? '',
                                    style: TextStyle(
                                      color: isDark ? Colors.grey[300] : Colors.grey[700],
                                      fontSize: 13,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
