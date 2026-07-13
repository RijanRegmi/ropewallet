import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../providers/wallet_provider.dart';

class ReceiptPage extends StatefulWidget {
  final Map<String, dynamic> transaction;
  final Map<String, dynamic> currentUser;

  const ReceiptPage({
    super.key,
    required this.transaction,
    required this.currentUser,
  });

  @override
  State<ReceiptPage> createState() => _ReceiptPageState();
}

class _ReceiptPageState extends State<ReceiptPage> {
  bool _isGeneratingPdf = false;

  Future<void> _generateAndSharePdf(bool isBalanceHidden) async {
    setState(() {
      _isGeneratingPdf = true;
    });

    try {
      final tx = widget.transaction;
      final type = tx['type'] ?? 'transfer';
      final String txId = tx['_id'] ?? 'N/A';
      final double amount = tx['amount'] is num ? tx['amount'].toDouble() : double.parse(tx['amount'].toString());
      final double fee = tx['fee'] is num ? tx['fee'].toDouble() : double.parse(tx['fee'].toString());
      final double netAmount = tx['netAmount'] is num ? tx['netAmount'].toDouble() : double.parse(tx['netAmount'].toString());
      final String rawDate = tx['createdAt'] ?? '';
      final String formattedDate = rawDate.isNotEmpty
          ? DateTime.parse(rawDate).toLocal().toString().substring(0, 16)
          : 'Recent';

      final senderObj = tx['sender'];
      final receiverObj = tx['receiver'];
      final String senderName = senderObj is Map ? (senderObj['fullName'] ?? 'System') : 'System';
      final String receiverName = receiverObj is Map ? (receiverObj['fullName'] ?? 'System') : 'System';
      final String remarks = tx['remarks'] ?? 'No remarks';

      final amountText = isBalanceHidden ? '\$ ••••' : '\$${amount.toStringAsFixed(2)}';
      final feeText = isBalanceHidden ? '\$ ••••' : '\$${fee.toStringAsFixed(2)}';
      final netText = isBalanceHidden ? '\$ ••••' : '\$${netAmount.toStringAsFixed(2)}';

      final pdf = pw.Document();

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Container(
              padding: const pw.EdgeInsets.all(32),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  // Logo/Header
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        'RopeWallet',
                        style: pw.TextStyle(
                          fontSize: 24,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromHex('#4F46E5'),
                        ),
                      ),
                      pw.Text(
                        'TRANSACTION RECEIPT',
                        style: pw.TextStyle(
                          fontSize: 12,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColor.fromHex('#64748B'),
                        ),
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 12),
                  pw.Divider(thickness: 1.5, color: PdfColor.fromHex('#E2E8F0')),
                  pw.SizedBox(height: 24),

                  // Receipt Meta Info
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('Date & Time', style: pw.TextStyle(fontSize: 10, color: PdfColor.fromHex('#94A3B8'))),
                          pw.Text(formattedDate, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                        ],
                      ),
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.end,
                        children: [
                          pw.Text('Transaction ID', style: pw.TextStyle(fontSize: 10, color: PdfColor.fromHex('#94A3B8'))),
                          pw.Text(txId, style: pw.TextStyle(fontSize: 11, font: pw.Font.courier())),
                        ],
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 32),

                  // Amount Box
                  pw.Container(
                    width: double.infinity,
                    padding: const pw.EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                    decoration: pw.BoxDecoration(
                      color: PdfColor.fromHex('#F8FAFC'),
                      borderRadius: const pw.BorderRadius.all(pw.Radius.circular(12)),
                    ),
                    child: pw.Column(
                      children: [
                        pw.Text(
                          'Transaction Amount',
                          style: pw.TextStyle(fontSize: 12, color: PdfColor.fromHex('#64748B'), fontWeight: pw.FontWeight.bold),
                        ),
                        pw.SizedBox(height: 8),
                        pw.Text(
                          amountText,
                          style: pw.TextStyle(
                            fontSize: 32,
                            fontWeight: pw.FontWeight.bold,
                            color: PdfColor.fromHex('#0F172A'),
                          ),
                        ),
                        pw.SizedBox(height: 4),
                        pw.Text(
                          'Type: ${type.toUpperCase()}',
                          style: pw.TextStyle(fontSize: 11, color: PdfColor.fromHex('#10B981'), fontWeight: pw.FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 32),

                  // Details Section
                  pw.Text('TRANSACTION DETAILS', style: pw.TextStyle(fontSize: 11, color: PdfColor.fromHex('#64748B'), fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 12),

                  _buildPdfDetailRow('Sender', senderName),
                  _buildPdfDetailRow('Recipient', receiverName),
                  _buildPdfDetailRow('Platform Fee (15%)', feeText),
                  _buildPdfDetailRow('Net Amount', netText),
                  _buildPdfDetailRow('Remarks', remarks),

                  pw.SizedBox(height: 48),
                  pw.Divider(thickness: 1, color: PdfColor.fromHex('#E2E8F0')),
                  pw.SizedBox(height: 16),
                  pw.Center(
                    child: pw.Text(
                      'Thank you for using RopeWallet!',
                      style: pw.TextStyle(fontSize: 11, color: PdfColor.fromHex('#94A3B8'), fontStyle: pw.FontStyle.italic),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/RopeWallet_Receipt_${txId.substring(0, 8)}.pdf');
      await file.writeAsBytes(await pdf.save());

      if (mounted) {
        await Share.shareXFiles(
          [XFile(file.path)],
          text: 'RopeWallet Transaction Receipt - $txId',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Failed to generate PDF: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isGeneratingPdf = false;
        });
      }
    }
  }

  pw.Widget _buildPdfDetailRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 8),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: 11, color: PdfColor.fromHex('#64748B'))),
          pw.Text(value, style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColor.fromHex('#0F172A'))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final walletProvider = Provider.of<WalletProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final tx = widget.transaction;
    final type = tx['type'] ?? 'transfer';
    final String txId = tx['_id'] ?? 'N/A';
    final double amount = tx['amount'] is num ? tx['amount'].toDouble() : double.parse(tx['amount'].toString());
    final double fee = tx['fee'] is num ? tx['fee'].toDouble() : double.parse(tx['fee'].toString());
    final double netAmount = tx['netAmount'] is num ? tx['netAmount'].toDouble() : double.parse(tx['netAmount'].toString());
    final String rawDate = tx['createdAt'] ?? '';
    final String formattedDate = rawDate.isNotEmpty
        ? DateTime.parse(rawDate).toLocal().toString().substring(0, 16)
        : 'Recent';

    final senderObj = tx['sender'];
    final receiverObj = tx['receiver'];
    final String senderName = senderObj is Map ? (senderObj['fullName'] ?? 'System') : 'System';
    final String receiverName = receiverObj is Map ? (receiverObj['fullName'] ?? 'System') : 'System';
    final String remarks = tx['remarks'] ?? 'No remarks';

    final isBalanceHidden = walletProvider.isBalanceHidden;
    final amountText = isBalanceHidden ? '\$ ••••' : '\$${amount.toStringAsFixed(2)}';
    final feeText = isBalanceHidden ? '\$ ••••' : '\$${fee.toStringAsFixed(2)}';
    final netText = isBalanceHidden ? '\$ ••••' : '\$${netAmount.toStringAsFixed(2)}';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Transaction Receipt'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Receipt card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Success Icon
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      color: Color(0xFFECFDF5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      color: Color(0xFF10B981),
                      size: 44,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Transaction Successful',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF10B981),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Amount
                  Text(
                    amountText,
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Type: ${type.toUpperCase()}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: theme.primaryColor,
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(),
                  const SizedBox(height: 16),

                  _buildDetailRow('Transaction ID', txId, isDark, isMonospace: true),
                  _buildDetailRow('Date & Time', formattedDate, isDark),
                  _buildDetailRow('Sender', senderName, isDark),
                  _buildDetailRow('Recipient', receiverName, isDark),
                  _buildDetailRow('Platform Fee (15%)', feeText, isDark),
                  _buildDetailRow('Net Amount Received', netText, isDark),
                  _buildDetailRow('Remarks', remarks, isDark),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Download/Export PDF Button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _isGeneratingPdf ? null : () => _generateAndSharePdf(isBalanceHidden),
                icon: _isGeneratingPdf
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.picture_as_pdf_rounded, color: Colors.white),
                label: const Text(
                  'Download / Share PDF Receipt',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primaryColor,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, bool isDark, {bool isMonospace = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                fontFamily: isMonospace ? 'monospace' : null,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
