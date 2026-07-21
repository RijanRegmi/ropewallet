import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:gal/gal.dart';
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
  final GlobalKey _qrBoundaryKey = GlobalKey();
  bool _isSavingQr = false;
  bool _hasScanned = false;
  bool _isShowingInvalidMessage = false;

  bool _isValidQrData(String qrCodeData) {
    final lowerData = qrCodeData.toLowerCase();
    
    // Check if it's a valid external transfer QR
    if (lowerData.contains('cash.app') || 
        (qrCodeData.startsWith('\$') && (lowerData.contains('/') || lowerData.contains('.')))) {
      return true;
    }
    if (lowerData.contains('venmo.com') || lowerData.startsWith('venmo://')) {
      return true;
    }
    
    // Check if it's a valid domestic (RopeWallet) QR
    if (qrCodeData == 'admin-qr') {
      return true;
    }
    
    final domesticRegex = RegExp(r'^\$[a-zA-Z0-9]+$');
    return domesticRegex.hasMatch(qrCodeData);
  }

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
    if (lowerData.contains('cash.app') || (qrCodeData.startsWith('\$') && (lowerData.contains('/') || lowerData.contains('.')))) {
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
      final XFile? image = await picker.pickImage(source: ImageSource.gallery);
      
      if (image == null) return;

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

      if (mounted) {
        Navigator.of(context).pop();
      }

      if (capture != null && capture.barcodes.isNotEmpty) {
        final String? detectedCode = capture.barcodes.first.rawValue;
        if (detectedCode != null && _isValidQrData(detectedCode)) {
          if (mounted) {
            setState(() {
              _hasScanned = true;
            });
          }
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

  Future<Uint8List?> _captureQrPng() async {
    try {
      await Future.delayed(const Duration(milliseconds: 200));
      final boundary = _qrBoundaryKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (_) {
      return null;
    }
  }

  Future<void> _downloadQr() async {
    setState(() {
      _isSavingQr = true;
    });

    try {
      final bytes = await _captureQrPng();
      if (bytes == null) throw Exception('Failed to capture QR code image');

      File? savedFile;
      if (Platform.isAndroid) {
        final dir = Directory('/storage/emulated/0/Download');
        if (await dir.exists()) {
          savedFile = File('${dir.path}/RopeWallet_QR_${DateTime.now().millisecondsSinceEpoch}.png');
        } else {
          final tempDir = await getExternalStorageDirectory() ?? await getApplicationDocumentsDirectory();
          savedFile = File('${tempDir.path}/RopeWallet_QR.png');
        }
      } else {
        final tempDir = await getApplicationDocumentsDirectory();
        savedFile = File('${tempDir.path}/RopeWallet_QR.png');
      }

      await savedFile.writeAsBytes(bytes);
      await Gal.putImage(savedFile.path);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF047857),
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text('QR Code successfully saved to Gallery!'),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Failed to download: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingQr = false;
        });
      }
    }
  }

  Future<void> _shareQr() async {
    setState(() {
      _isSavingQr = true;
    });

    try {
      final bytes = await _captureQrPng();
      if (bytes == null) throw Exception('Failed to capture QR code image');

      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/RopeWallet_QR_Code.png');
      await file.writeAsBytes(bytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'My RopeWallet QR Code',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Failed to share: $e'),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSavingQr = false;
        });
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
    final String myUserTag = user['userTag'] ?? user['username'] ?? 'user';

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
        appBar: AppBar(
          title: const Text('Payments & Scanner'),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.qr_code_scanner_rounded), text: 'Scan QR'),
              Tab(icon: Icon(Icons.qr_code_rounded), text: 'My QR'),
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
                  Center(
                    child: Stack(
                      children: [
                        Container(
                          width: 320,
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
                                MobileScanner(
                                  controller: _cameraController,
                                  onDetect: (BarcodeCapture capture) {
                                    if (_hasScanned) return;
                                    if (capture.barcodes.isNotEmpty) {
                                      final String? code = capture.barcodes.first.rawValue;
                                      if (code != null) {
                                        if (_isValidQrData(code)) {
                                          setState(() {
                                            _hasScanned = true;
                                          });
                                          _cameraController.stop();
                                          _navigateToTransfer(code);
                                        } else {
                                          if (!_isShowingInvalidMessage) {
                                            _isShowingInvalidMessage = true;
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(
                                                backgroundColor: Color(0xFFEF4444),
                                                content: Text('QR code is invalid.'),
                                                duration: Duration(seconds: 2),
                                              ),
                                            );
                                            Future.delayed(const Duration(seconds: 2), () {
                                              _isShowingInvalidMessage = false;
                                            });
                                          }
                                        }
                                      }
                                    }
                                  },
                                ),
                                Container(
                                  decoration: BoxDecoration(
                                    border: Border.all(
                                      color: Colors.black.withOpacity(0.4),
                                      width: 20,
                                    ),
                                  ),
                                ),
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
                                  hintText: '\$tag',
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
                                  if (_isValidQrData(qr) || RegExp(r'^[a-zA-Z0-9]+$').hasMatch(qr)) {
                                    setState(() {
                                      _hasScanned = true;
                                    });
                                    _navigateToTransfer(qr);
                                  } else {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        backgroundColor: Color(0xFFEF4444),
                                        content: Text('Invalid user tag or wallet address format.'),
                                      ),
                                    );
                                  }
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
                  const SizedBox(height: 8),
                  Text(
                    'Receive funds by presenting your unique QR code',
                    style: TextStyle(
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  
                  // Wrap in RepaintBoundary to generate PNG
                  RepaintBoundary(
                    key: _qrBoundaryKey,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white, // Pure white background for best scan rate
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: const Color(0xFFE2E8F0),
                            width: 1.5,
                          ),
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            QrImageView(
                              data: myQrData,
                              version: QrVersions.auto,
                              size: 200.0,
                              gapless: false,
                              foregroundColor: Colors.black,
                              backgroundColor: Colors.white,
                              errorStateBuilder: (cxt, err) {
                                return const Center(child: Text("Error generating QR"));
                              },
                            ),
                            const SizedBox(height: 16),
                            Text(
                              myName,
                              style: const TextStyle(
                                fontSize: 20, 
                                fontWeight: FontWeight.bold, 
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(height: 8),
                            GestureDetector(
                              onTap: () {
                                final displayTag = myUserTag.startsWith(r'$') ? myUserTag : '\$' + myUserTag;
                                Clipboard.setData(ClipboardData(text: displayTag));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: const Color(0xFF10B981),
                                    content: Text('Copied tag $displayTag to clipboard!'),
                                    duration: const Duration(seconds: 2),
                                  ),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF4F46E5).withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFF4F46E5).withOpacity(0.2),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      myUserTag.startsWith(r'$') ? myUserTag : '\$' + myUserTag,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF4F46E5),
                                        fontFamily: 'monospace',
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    const Icon(
                                      Icons.copy_rounded,
                                      size: 14,
                                      color: Color(0xFF4F46E5),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: _isSavingQr ? null : _downloadQr,
                            icon: const Icon(Icons.download_rounded, color: Colors.white, size: 20),
                            label: const Text(
                              'Download QR',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: theme.primaryColor,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: SizedBox(
                          height: 52,
                          child: OutlinedButton.icon(
                            onPressed: _isSavingQr ? null : _shareQr,
                            icon: Icon(Icons.share_rounded, color: theme.primaryColor, size: 20),
                            label: Text(
                              'Share',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: theme.primaryColor),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: theme.primaryColor, width: 1.5),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // TAB 3: UPLOAD IMAGE
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
