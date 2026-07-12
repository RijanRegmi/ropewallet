import 'package:flutter/material.dart';
import 'send_money_page.dart';

class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key});

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final _manualInputController = TextEditingController();

  // Predefined demo accounts for easy simulation/testing in emulator
  final List<Map<String, String>> _demoContacts = [
    {
      'name': 'Rijan Regmi (Merchant)',
      'email': 'rijan@test.com',
      'qrCode': 'wallet-uid-rijan-merchant-demo-12345',
    },
    {
      'name': 'Test Account (User B)',
      'email': 'test@test.com',
      'qrCode': 'wallet-uid-test-userb-demo-67890',
    },
    {
      'name': 'Alice Smith',
      'email': 'alice@test.com',
      'qrCode': 'wallet-uid-alice-friend-demo-abcde',
    },
  ];

  @override
  void initState() {
    super.initState();
    // Pulse animation for the scanning laser line
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _animationController.dispose();
    _manualInputController.dispose();
    super.dispose();
  }

  void _navigateToTransfer(String qrCodeData) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => SendMoneyPage(recipientQrData: qrCodeData),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Scanner Viewport Simulation
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.05),
                      border: Border.all(color: theme.primaryColor, width: 4),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Stack(
                        children: [
                          const Center(
                            child: Icon(
                              Icons.qr_code_scanner_rounded,
                              size: 160,
                              color: Colors.black12,
                            ),
                          ),
                          // Pulsing Laser animation line
                          AnimatedBuilder(
                            animation: _animationController,
                            builder: (context, child) {
                              return Positioned(
                                top: _animationController.value * 240 + 10,
                                left: 15,
                                right: 15,
                                child: Container(
                                  height: 4,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEF4444),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFFEF4444).withOpacity(0.8),
                                        blurRadius: 8,
                                        spreadRadius: 2,
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Align QR code within the frame to scan',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 32),

            // Demo Simulation Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Simulate Scanning (Demo Contacts):',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._demoContacts.map((contact) {
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: theme.primaryColor.withOpacity(0.1),
                          child: Icon(Icons.person_rounded, color: theme.primaryColor),
                        ),
                        title: Text(contact['name']!, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(contact['email']!),
                        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                        onTap: () => _navigateToTransfer(contact['qrCode']!),
                      ),
                    );
                  }),
                  const SizedBox(height: 24),
                  
                  // Manual input option
                  Text(
                    'Or Enter QR Wallet Data Manually:',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _manualInputController,
                          decoration: InputDecoration(
                            hintText: 'wallet-uid-...',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: () {
                          final qr = _manualInputController.text.trim();
                          if (qr.isNotEmpty) {
                            _navigateToTransfer(qr);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.primaryColor,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        ),
                        child: const Text('Proceed'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
