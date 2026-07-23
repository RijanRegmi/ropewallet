import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import '../../providers/wallet_provider.dart';
import 'receipt_page.dart';

class StatementPage extends StatelessWidget {
  const StatementPage({super.key});

  @override
  Widget build(BuildContext context) {
    final walletProvider = Provider.of<WalletProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final user = authProvider.user ?? {};
    final transactions = walletProvider.transactions;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Account Statement'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await walletProvider.fetchTransactions();
        },
        child: transactions.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                  Center(
                    child: Column(
                      children: [
                        Icon(Icons.history_rounded, size: 64, color: Colors.grey.withOpacity(0.4)),
                        const SizedBox(height: 16),
                        const Text(
                          'No transactions recorded',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Your transaction statements will appear here.',
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.all(24.0),
                itemCount: transactions.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
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

                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
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
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                          const SizedBox(width: 8),
                          const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 20),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
