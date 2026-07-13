import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../auth/providers/auth_provider.dart';
import 'send_money_page.dart';
import 'external_transfer_page.dart';

class ScannerPage extends StatefulWidget {
  const ScannerPage({super.key});

  @override
  State<ScannerPage> createState() => _ScannerPageState();
}

class _ScannerPageState extends State<ScannerPage> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final MobileScannerController _cameraController = MobileScannerController();
  final _manualInputController = TextEditingController();

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
    _cameraController.dispose();
    _manualInputController.dispose();
    super.dispose();
  }

  void _navigateToTransfer(String qrCodeData) {
    bool isExternal = false;
    String provider = '';
    String recipientName = '';

    final lowerData = qrCodeData.toLowerCase();
    if (lowerData.contains('cash.app') || qrCodeData.startsWith('\$')) {
      isExternal = true;
      provider = 'Cash App';
      recipientName = qrCodeData.contains('/') 
          ? qrCodeData.substring(qrCodeData.lastIndexOf('/') + 1)
          : qrCodeData;
    } else if (lowerData.contains('venmo.com') || lowerData.startsWith('venmo://')) {
      isExternal = true;
      provider = 'Venmo';
      recipientName = qrCodeData.contains('/') 
          ? qrCodeData.substring(qrCodeData.lastIndexOf('/') + 1)
          : qrCodeData;
    } else if (lowerData.contains('chime.me') || lowerData.contains('chime.com')) {
      isExternal = true;
      provider = 'Chime';
      recipientName = qrCodeData.contains('/') 
          ? qrCodeData.substring(qrCodeData.lastIndexOf('/') + 1)
          : qrCodeData;
    }

    if (isExternal) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => ExternalTransferPage(
            provider: provider,
            recipientName: recipientName,
          ),
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => SendMoneyPage(recipientQrData: qrCodeData),
        ),
      );
    }
  }

  Future<void> _pickAndScanImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      // This will request Photo/File access permissions automatically on iOS and Android
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
      
      if (image == null) return; // User canceled picking

      // Show reading dialog loader
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => const AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 20),
              Text('Reading QR from image...'),
            ],
          ),
        ),
      );

      final MobileScannerController imageController = MobileScannerController();
      final BarcodeCapture? capture = await imageController.analyzeImage(image.path);
      imageController.dispose();

      // Dismiss reading dialog
      if (mounted) {
        Navigator.of(context).pop();
      }

      if (capture != null && capture.barcodes.isNotEmpty) {
        final String? detectedCode = capture.barcodes.first.rawValue;
        if (detectedCode != null) {
          _navigateToTransfer(detectedCode);
          return;
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFEF4444),
            content: Text('No valid QR code found in the selected image. Please try another.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        // Dismiss loading dialog if open
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Error selecting file: $e'),
          ),
        );
      }
    }
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
            // TAB 1: SCAN QR CODE (USING LIVE CAMERA)
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(
                children: [
                  // Bigger Viewport with Live Camera Scanner
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          width: 320, // Bigger scan area
                          height: 320,
                          decoration: BoxDecoration(
                            color: Colors.black,
                            border: Border.all(color: theme.primaryColor, width: 4),
                            borderRadius: BorderRadius.circular(28),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Stack(
                              children: [
                                // Active camera preview
                                MobileScanner(
                                  controller: _cameraController,
                                  onDetect: (BarcodeCapture capture) {
                                    if (capture.barcodes.isNotEmpty) {
                                      final String? code = capture.barcodes.first.rawValue;
                                      if (code != null) {
                                        _navigateToTransfer(code);
                                      }
                                    }
                                  },
                                ),
                                // Viewfinder overlay border
                                Container(
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.black.withOpacity(0.4),
                                      width: 20,
                                    ),
                                  ),
                                ),
                                // Pulsing laser scanning line
                                AnimatedBuilder(
                                  animation: _animationController,
                                  builder: (context, child) {
                                    return Positioned(
                                      top: _animationController.value * 260 + 20,
                                      left: 25,
                                      right: 25,
                                      child: Container(
                                        height: 3,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEF4444),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFFEF4444).withOpacity(0.8),
                                              blurRadius: 8,
                                              spreadRadius: 2.5,
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
                    'Align recipient QR code within the frame',
                    style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 32),

                  // Manual input fallback (Still useful if camera is unavailable or to paste UID)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Enter Wallet Address / QR Data Manually:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
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

            // TAB 2: SHOW MY QR CODE (BIG, BLACK & WHITE, PROFESSIONAL)
            SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const SizedBox(height: 16),
                  Text(
                    'Receive funds by presenting this QR Code',
                    style: TextStyle(
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 30),
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white, // Keep background purely white for scannability
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isDark ? 0.4 : 0.08),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                        border: Border.all(
                          color: const Color(0xFFE2E8F0),
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Vector professional black & white QR code
                          QrImageView(
                            data: myQrData,
                            version: QrVersions.auto,
                            size: 240.0, // Big scan area
                            gapless: false,
                            foregroundColor: Colors.black,
                            backgroundColor: Colors.white,
                            errorStateBuilder: (cxt, err) {
                              return const Center(child: Text("Error generating QR"));
                            },
                          ),
                          const SizedBox(height: 20),
                          Text(
                            myName,
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'RopeWallet Address',
                            style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500),
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

            // TAB 3: UPLOAD QR IMAGE (REAL FILE ACCESS)
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: _pickAndScanImage,
                    child: Container(
                      width: double.infinity,
                      height: 280,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: theme.primaryColor.withOpacity(0.4),
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(22),
                            decoration: BoxDecoration(
                              color: theme.primaryColor.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.photo_library_outlined,
                              size: 56,
                              color: theme.primaryColor,
                            ),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Upload QR from Gallery',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Tap to select a QR code photo from your device',
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
