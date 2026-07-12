import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../auth/providers/auth_provider.dart';
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

  void _simulateImageUpload() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        final theme = Theme.of(ctx);
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Simulate Upload from Gallery',
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Select a QR code image from your library to decode:',
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 20),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _demoContacts.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final contact = _demoContacts[index];
                  return Card(
                    elevation: 0,
                    color: theme.primaryColor.withOpacity(0.05),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      leading: const Icon(Icons.image_outlined, color: Colors.blue),
                      title: Text(contact['name']!, style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('Decodes to: ${contact['email']}'),
                      onTap: () {
                        Navigator.of(ctx).pop(); // Close bottom sheet
                        // Simulate progress loader
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (loadingCtx) {
                            Future.delayed(const Duration(milliseconds: 800), () {
                              Navigator.of(loadingCtx).pop(); // Close loader
                              _navigateToTransfer(contact['qrCode']!);
                            });
                            return const AlertDialog(
                              content: Row(
                                children: [
                                  CircularProgressIndicator(),
                                  SizedBox(width: 20),
                                  Text('Reading QR from image...'),
                                ],
                              ),
                            );
                          },
                        );
                      },
                    ),
                  );
                },
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user ?? {};
    final String myQrData = user['qrCodeData'] ?? 'no-qr-data';
    final String myName = user['fullName'] ?? 'User';

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Payments & Scanner'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.qr_code_scanner_rounded), text: 'Scan QR'),
              Tab(icon: Icon(Icons.qr_code_rounded), text: 'Show QR'),
              Tab(icon: Icon(Icons.image_search_rounded), text: 'Upload Image'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // TAB 1: SCAN QR CODE
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(
                children: [
                  // Scanner Viewport Simulation
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          width: 240,
                          height: 240,
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
                                    size: 140,
                                    color: Colors.black12,
                                  ),
                                ),
                                // Laser scan line animation
                                AnimatedBuilder(
                                  animation: _animationController,
                                  builder: (context, child) {
                                    return Positioned(
                                      top: _animationController.value * 220 + 10,
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
                  const SizedBox(height: 16),
                  const Text(
                    'Align QR code within the frame to scan',
                    style: TextStyle(fontSize: 13, color: Colors.grey, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 24),

                  // Demo simulation controls
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Scan Mock Recipient (Simulated):',
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
                        const SizedBox(height: 20),
                        
                        // Manual input
                        Text(
                          'Or Input QR Address Manually:',
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
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // TAB 2: SHOW MY QR CODE
            SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  Text(
                    'Show this QR code to receive money',
                    style: TextStyle(
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 32),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF151B2C) : Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isDark ? 0.25 : 0.05),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                        border: Border.all(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        ),
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 200,
                            height: 200,
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: theme.primaryColor.withOpacity(0.2),
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Center(
                              child: Icon(
                                Icons.qr_code_2_rounded,
                                size: 160,
                                color: theme.primaryColor,
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            myName,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'RopeWallet QR Code',
                            style: TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: theme.primaryColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: SelectableText(
                              myQrData,
                              style: TextStyle(
                                fontSize: 11,
                                color: theme.primaryColor,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // TAB 3: UPLOAD QR IMAGE
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: _simulateImageUpload,
                    child: Container(
                      width: double.infinity,
                      height: 260,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: theme.primaryColor.withOpacity(0.4),
                          width: 2,
                          style: BorderStyle.solid, // solid border since Flutter dashed needs package
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: theme.primaryColor.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.cloud_upload_outlined,
                              size: 56,
                              color: theme.primaryColor,
                            ),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Upload QR Code Image',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Tap to select a QR code from your gallery',
                            style: TextStyle(color: Colors.grey, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
