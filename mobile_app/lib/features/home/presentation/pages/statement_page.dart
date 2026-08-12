import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import 'receipt_page.dart';

class StatementPage extends StatefulWidget {
  const StatementPage({super.key});

  @override
  State<StatementPage> createState() => _StatementPageState();
}

class _StatementPageState extends State<StatementPage> {
  String _selectedFilter = 'all'; // 'all', 'in', 'out', 'pending'

  @override
  Widget build(BuildContext context) {
    final walletProvider = Provider.of<WalletProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = authProvider.user ?? {};
    final String fullName = user['fullName'] ?? 'User';
    final String userTag = user['userTag'] ?? '';
    final double availableBalance = user['walletBalance'] is num
        ? (user['walletBalance'] as num).toDouble()
        : (double.tryParse(user['walletBalance']?.toString() ?? '0') ?? 0.00);
    final double pendingCashout = user['pendingCashoutBalance'] is num
        ? (user['pendingCashoutBalance'] as num).toDouble()
        : (double.tryParse(user['pendingCashoutBalance']?.toString() ?? '0') ?? 0.00);
    final double totalBalance = availableBalance + pendingCashout;

    final rawTransactions = walletProvider.transactions;

    // Filter transactions based on selection
    final transactions = rawTransactions.where((tx) {
      final String type = tx['type'] ?? 'transfer';
      final String status = tx['status'] ?? 'completed';

      bool isSender = false;
      if (type == 'transfer') {
        final senderObj = tx['sender'];
        final String senderId = senderObj is Map ? (senderObj['_id'] ?? '') : (senderObj ?? '');
        isSender = senderId == user['id'];
      }

      if (_selectedFilter == 'in') {
        return type == 'deposit' || (type == 'transfer' && !isSender) || (type == 'withdrawal' && status == 'declined');
      } else if (_selectedFilter == 'out') {
        return (type == 'transfer' && isSender) || (type == 'withdrawal' && status == 'completed');
      } else if (_selectedFilter == 'pending') {
        return status == 'pending';
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Account Statement', style: TextStyle(fontWeight: FontWeight.bold)),
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
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
          children: [
            // ─── Balance & Statement Summary Card ───
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22.0),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                      : [const Color(0xFF1E3A8A), const Color(0xFF3B82F6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withValues(alpha: 0.25),
                    blurRadius: 16,
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fullName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (userTag.isNotEmpty)
                            Text(
                              userTag,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                              ),
                            ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${rawTransactions.length} Records',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Divider(color: Colors.white24, height: 1),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Available Balance',
                            style: TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '\$${availableBalance.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      if (pendingCashout > 0)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'Pending Cashout',
                              style: TextStyle(color: Colors.amberAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '\$${pendingCashout.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Colors.amberAccent,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Total (incl. pending): \$${totalBalance.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Colors.white60,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ─── Filter Tabs ───
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('all', 'All Activity', Icons.swap_horiz_rounded, isDark, theme),
                  const SizedBox(width: 8),
                  _buildFilterChip('in', 'Money In', Icons.arrow_downward_rounded, isDark, theme),
                  const SizedBox(width: 8),
                  _buildFilterChip('out', 'Money Out', Icons.arrow_upward_rounded, isDark, theme),
                  const SizedBox(width: 8),
                  _buildFilterChip('pending', 'Pending', Icons.access_time_rounded, isDark, theme),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ─── Transactions List ───
            transactions.isEmpty
                ? Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 48),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        Icon(Icons.history_rounded, size: 54, color: Colors.grey.withValues(alpha: 0.4)),
                        const SizedBox(height: 12),
                        const Text(
                          'No transactions found',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Transactions matching your filter will appear here.',
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: transactions.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final tx = transactions[index];
                      final String type = tx['type'] ?? 'transfer';
                      final String status = tx['status'] ?? 'completed';
                      final double amount = tx['amount'] is num ? tx['amount'].toDouble() : double.parse(tx['amount'].toString());
                      final double fee = tx['fee'] is num ? tx['fee'].toDouble() : double.parse(tx['fee'].toString());
                      final double netAmount = tx['netAmount'] is num ? tx['netAmount'].toDouble() : double.parse(tx['netAmount'].toString());
                      final String remarks = tx['remarks'] ?? '';
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
                        txTitle = remarks.isNotEmpty ? remarks : 'Card Deposit';
                        txAmountText = '+\$${amount.toStringAsFixed(2)}';
                        txAmountColor = const Color(0xFF3B82F6);
                      } else if (type == 'withdrawal') {
                        if (status == 'declined') {
                          txIcon = Icons.cancel_outlined;
                          txIconColor = const Color(0xFFEF4444);
                          txTitle = 'Withdrawal Refunded';
                          txAmountText = '+\$${amount.toStringAsFixed(2)}';
                          txAmountColor = const Color(0xFF10B981);
                          txSubtitle = '$formattedDate • Refunded to wallet';
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
                          txTitle = remarks.isNotEmpty ? remarks : 'Withdrawal Payout';
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
                          txSubtitle = '$formattedDate • Fee \$${fee.toStringAsFixed(2)}';
                        } else {
                          txIcon = Icons.arrow_downward_rounded;
                          txIconColor = const Color(0xFF10B981);
                          final senderObj = tx['sender'];
                          final String senderName = senderObj is Map ? (senderObj['fullName'] ?? 'User') : 'User';
                          txTitle = 'Received from $senderName';
                          txAmountText = '+\$${netAmount.toStringAsFixed(2)}';
                          txAmountColor = const Color(0xFF10B981);
                          txSubtitle = '$formattedDate • Fee \$${fee.toStringAsFixed(2)}';
                        }
                      }

                      return Container(
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: ListTile(
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
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          leading: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: txIconColor.withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(txIcon, color: txIconColor, size: 22),
                          ),
                          title: Row(
                            children: [
                              Expanded(
                                child: Text(
                                  txTitle,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              _buildStatusBadge(status),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Text(
                              txSubtitle,
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ),
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
                              const SizedBox(width: 6),
                              const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 20),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String filterKey, String label, IconData icon, bool isDark, ThemeData theme) {
    final bool isSelected = _selectedFilter == filterKey;
    return ChoiceChip(
      showCheckmark: false,
      avatar: Icon(
        icon,
        size: 16,
        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
      ),
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 13,
        ),
      ),
      selected: isSelected,
      selectedColor: theme.primaryColor,
      backgroundColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      onSelected: (val) {
        if (val) {
          setState(() {
            _selectedFilter = filterKey;
          });
        }
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label;

    if (status == 'completed') {
      bg = const Color(0xFF10B981).withValues(alpha: 0.12);
      fg = const Color(0xFF10B981);
      label = 'Completed';
    } else if (status == 'pending') {
      bg = const Color(0xFFF59E0B).withValues(alpha: 0.12);
      fg = const Color(0xFFF59E0B);
      label = 'Pending';
    } else {
      bg = const Color(0xFFEF4444).withValues(alpha: 0.12);
      fg = const Color(0xFFEF4444);
      label = 'Declined';
    }

    return Container(
      margin: const EdgeInsets.only(left: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
