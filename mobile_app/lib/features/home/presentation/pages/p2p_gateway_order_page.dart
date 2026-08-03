import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class P2PGatewayOrderPage extends StatefulWidget {
  final String orderId;

  const P2PGatewayOrderPage({
    super.key,
    required this.orderId,
  });

  @override
  State<P2PGatewayOrderPage> createState() => _P2PGatewayOrderPageState();
}

class _P2PGatewayOrderPageState extends State<P2PGatewayOrderPage> {
  final ApiClient _apiClient = ApiClient();
  Timer? _pollingTimer;
  Timer? _countdownTimer;

  bool _isLoading = true;
  Map<String, dynamic>? _orderData;
  String _timerText = "20:00";
  int _remainingSeconds = 1200;
  bool _copied = false;
  String? _errorMessage;

  static const Color emeraldColor = Color(0xFF10B981);
  static const Color emeraldAccentColor = Color(0xFF34D399);

  @override
  void initState() {
    super.initState();
    _fetchOrder();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (_) => _fetchOrder());
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchOrder() async {
    try {
      final response = await _apiClient.get('${ApiConstants.p2pGetOrder}/${widget.orderId}');
      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res['success'] == true && res['data'] != null) {
          final data = Map<String, dynamic>.from(res['data']);
          setState(() {
            _orderData = data;
            _isLoading = false;
          });

          if (data['remainingSeconds'] != null && _countdownTimer == null) {
            _startCountdown(data['remainingSeconds'] as int);
          }

          if (data['status'] == 'completed' || data['status'] == 'expired') {
            _pollingTimer?.cancel();
          }
        }
      } else {
        final res = jsonDecode(response.body);
        setState(() {
          _errorMessage = res['error'] ?? 'Order not found';
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching P2P order: $e');
    }
  }

  void _startCountdown(int seconds) {
    _remainingSeconds = seconds;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds <= 0) {
        timer.cancel();
        setState(() {
          _timerText = "00:00";
        });
      } else {
        setState(() {
          _remainingSeconds--;
          final m = _remainingSeconds ~/ 60;
          final s = _remainingSeconds % 60;
          _timerText = "${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}";
        });
      }
    });
  }

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    setState(() => _copied = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Recipient handle copied to clipboard!'),
        backgroundColor: emeraldColor,
        duration: Duration(seconds: 2),
      ),
    );
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  Future<void> _launchApp(String directPayUrl) async {
    try {
      final uri = Uri.parse(directPayUrl);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not launch payment app: $e'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: const Color(0xFF0B0F1A),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text('Payment Gateway Hub'),
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.indigoAccent),
              SizedBox(height: 16),
              Text(
                'Initializing gateway session...',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null || _orderData == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0B0F1A),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text('Gateway Error'),
        ),
        body: Center(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF1F2937)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
                const SizedBox(height: 16),
                const Text(
                  'Order Gateway Expired or Not Found',
                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _errorMessage ?? 'Please generate a new payment link.',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final status = _orderData!['status'] as String? ?? 'pending';
    final amount = double.tryParse(_orderData!['amount'].toString()) ?? 0.0;
    final assignedHandle = _orderData!['assignedHandle'] as String? ?? '';
    final orderNo = _orderData!['orderNo'] as String? ?? '';
    final paymentMethod = (_orderData!['paymentMethod'] as String? ?? 'chime').toUpperCase();
    final directPayUrl = _orderData!['directPayUrl'] as String? ?? '';

    // SUCCESS VIEW
    if (status == 'completed') {
      return Scaffold(
        backgroundColor: const Color(0xFF0B0F1A),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: emeraldColor.withOpacity(0.4)),
                boxShadow: [
                  BoxShadow(
                    color: emeraldColor.withOpacity(0.15),
                    blurRadius: 30,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: emeraldColor.withOpacity(0.15),
                      shape: BoxShape.circle,
                      border: Border.all(color: emeraldColor, width: 2),
                    ),
                    child: const Icon(Icons.check_circle_rounded, color: emeraldColor, size: 40),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Payment Received!',
                    style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Your payment of \$${amount.toStringAsFixed(2)} has been verified',
                    style: const TextStyle(color: emeraldAccentColor, fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1F2937),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      children: [
                        _buildSummaryRow('Order No:', orderNo),
                        const SizedBox(height: 8),
                        _buildSummaryRow('Amount Paid:', '\$${amount.toStringAsFixed(2)}'),
                        const SizedBox(height: 8),
                        _buildSummaryRow('Method:', paymentMethod),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: emeraldColor,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Back to Wallet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    // EXPIRED VIEW
    if (status == 'expired' || _timerText == "00:00") {
      return Scaffold(
        backgroundColor: const Color(0xFF0B0F1A),
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: const Color(0xFF111827),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.timer_off_outlined, color: Colors.redAccent, size: 50),
                const SizedBox(height: 16),
                const Text(
                  'Order Expired',
                  style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'The 20-minute payment window for Order #$orderNo has lapsed. Please generate a new deposit link.',
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    // MAIN PENDING GATEWAY VIEW
    return Scaffold(
      backgroundColor: const Color(0xFF0B0F1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111827),
        elevation: 0,
        title: const Text('P2P Payment Hub', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: emeraldAccentColor),
            tooltip: 'Share Gateway Link',
            onPressed: () {
              final shareableUrl = 'https://www.ropewallet.com/pay/hub/${widget.orderId}';
              Clipboard.setData(ClipboardData(text: shareableUrl));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment Gateway Link copied! Share with customer.'),
                  backgroundColor: emeraldColor,
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Order No & Timer Top Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ORDER NO', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(orderNo, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                    ],
                  ),

                  // Timer Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.timer_outlined, color: Colors.redAccent, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          _timerText,
                          style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 15, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Hero Amount Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF1E1B4B).withOpacity(0.5), const Color(0xFF111827)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Column(
                children: [
                  const Text('RECHARGE AMOUNT', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  Text(
                    '\$${amount.toStringAsFixed(2)}',
                    style: const TextStyle(color: emeraldAccentColor, fontSize: 40, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Exact amount to send via $paymentMethod',
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Recipient Handle & Copy Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF1F2937)),
              ),
              child: Column(
                children: [
                  Text(
                    'Send Payment via $paymentMethod',
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text('Recipient Handle / Email:', style: TextStyle(color: Colors.grey, fontSize: 11)),
                  const SizedBox(height: 12),
                  SelectableText(
                    assignedHandle,
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 16),

                  // Copy Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton.icon(
                      onPressed: () => _copyToClipboard(assignedHandle),
                      icon: Icon(_copied ? Icons.check_circle : Icons.copy_rounded, color: emeraldAccentColor, size: 18),
                      label: Text(
                        _copied ? 'Copied to Clipboard!' : 'Copy Handle',
                        style: const TextStyle(color: emeraldAccentColor, fontWeight: FontWeight.bold),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: emeraldAccentColor.withOpacity(0.4)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),

                  if (directPayUrl.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: () => _launchApp(directPayUrl),
                        icon: const Icon(Icons.open_in_new_rounded, size: 20),
                        label: Text('Launch $paymentMethod App', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: emeraldColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Notice Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.amber.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.amber.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.security_rounded, color: Colors.amber, size: 16),
                      SizedBox(width: 8),
                      Text('Important Security Rules:', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildNoticeItem('Pay the exact amount \$${amount.toStringAsFixed(2)}.'),
                  _buildNoticeItem('Complete payment within the 20-minute order period.'),
                  _buildNoticeItem('Automatic verification checks your inbox every 3 seconds.'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
      ],
    );
  }

  Widget _buildNoticeItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: Colors.amber, fontSize: 12)),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white70, fontSize: 11))),
        ],
      ),
    );
  }
}
