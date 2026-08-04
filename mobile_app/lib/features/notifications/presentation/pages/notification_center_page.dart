import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:ropewallet/core/network/api_client.dart';

class NotificationCenterPage extends StatefulWidget {
  const NotificationCenterPage({super.key});

  @override
  State<NotificationCenterPage> createState() => _NotificationCenterPageState();
}

class _NotificationCenterPageState extends State<NotificationCenterPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiClient _apiClient = ApiClient();

  // Transactions State
  bool _isLoadingTxns = true;
  List<dynamic> _transactions = [];

  // Notices / Alerts State
  bool _isLoadingNotices = true;
  List<dynamic> _notices = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchTransactions();
    _fetchNotices();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchTransactions() async {
    setState(() => _isLoadingTxns = true);
    try {
      final res = await _apiClient.get('/payments/transactions');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['data'] != null) {
          setState(() {
            _transactions = data['data'];
            _isLoadingTxns = false;
          });
          return;
        }
      }
      setState(() => _isLoadingTxns = false);
    } catch (e) {
      setState(() => _isLoadingTxns = false);
    }
  }

  Future<void> _fetchNotices() async {
    setState(() => _isLoadingNotices = true);
    try {
      final res = await _apiClient.get('/notices');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['data'] != null) {
          setState(() {
            _notices = data['data'];
            _isLoadingNotices = false;
          });
          return;
        }
      }
      setState(() => _isLoadingNotices = false);
    } catch (e) {
      setState(() => _isLoadingNotices = false);
    }
  }

  Future<void> _markNoticeAsRead(String noticeId, int index) async {
    try {
      await _apiClient.post('/notices/$noticeId/read', {});
      setState(() {
        _notices[index]['isRead'] = true;
      });
    } catch (e) {
      // Ignore fallback
    }
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

    final unreadNoticesCount = _notices.where((n) => n['isRead'] != true).length;

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
            onRefresh: _fetchTransactions,
            child: _isLoadingTxns
                ? const Center(child: CircularProgressIndicator())
                : _transactions.isEmpty
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
                        itemCount: _transactions.length,
                        itemBuilder: (context, index) {
                          final txn = _transactions[index];
                          final isDeposit = txn['type'] == 'deposit' || txn['type'] == 'p2p_deposit';
                          final amount = (txn['amount'] as num?)?.toDouble() ?? 0.0;
                          final dateStr = txn['createdAt'] != null
                              ? DateTime.tryParse(txn['createdAt'])?.toLocal().toString().substring(0, 16) ?? ''
                              : '';

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
                                    color: isDeposit
                                        ? const Color(0xFF10B981).withOpacity(0.12)
                                        : const Color(0xFFEF4444).withOpacity(0.12),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    isDeposit ? Icons.south_west_rounded : Icons.north_east_rounded,
                                    color: isDeposit ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        isDeposit ? 'Deposit Received' : 'Transfer Sent',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        txn['remarks'] ?? (isDeposit ? 'Wallet Deposit' : 'Peer Transfer'),
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
                                      '${isDeposit ? '+' : '-'}\$${amount.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 16,
                                        color: isDeposit ? const Color(0xFF10B981) : (isDark ? Colors.white : Colors.black87),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: (txn['status'] == 'completed')
                                            ? const Color(0xFF10B981).withOpacity(0.1)
                                            : const Color(0xFFF59E0B).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        (txn['status'] ?? 'completed').toString().toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: (txn['status'] == 'completed')
                                              ? const Color(0xFF10B981)
                                              : const Color(0xFFF59E0B),
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
            onRefresh: _fetchNotices,
            child: _isLoadingNotices
                ? const Center(child: CircularProgressIndicator())
                : _notices.isEmpty
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
                        itemCount: _notices.length,
                        itemBuilder: (context, index) {
                          final n = _notices[index];
                          final isRead = n['isRead'] == true;
                          final cat = n['category'] ?? 'info';
                          final dateStr = n['createdAt'] != null
                              ? DateTime.tryParse(n['createdAt'])?.toLocal().toString().substring(0, 16) ?? ''
                              : '';

                          return GestureDetector(
                            onTap: () {
                              if (!isRead) {
                                _markNoticeAsRead(n['_id'], index);
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
