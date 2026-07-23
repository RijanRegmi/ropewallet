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
  bool _isTorchOn = false;
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
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: const Row(
            children: [
              CircularProgressIndicator(color: Color(0xFF10B981)),
              SizedBox(width: 20),
              Text('Analyzing QR from image...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
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
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            content: const Row(
              children: [
                Icon(Icons.error_outline_rounded, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text('No valid QR code found in selected image.'),
                ),
              ],
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text('QR Code saved to Gallery!'),
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
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
        text: 'Pay me on RopeWallet using my QR code!',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
    final user = authProvider.user;
    final myTag = user?['userTag'] ?? '\$user';
    final myQrData = user?['qrCodeData'] ?? myTag;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. FULL-BLEED MOBILE SCANNER
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
                        SnackBar(
                          backgroundColor: const Color(0xFFEF4444),
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          content: const Text('Invalid QR code format.'),
                          duration: const Duration(seconds: 2),
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

          // 2. CAMERA OVERLAY & VIEWFINDER FRAME
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 270,
                      height: 270,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.5),
                            blurRadius: 30,
                            spreadRadius: 10,
                          ),
                        ],
                      ),
                    ),

                    // Corner brackets for ultra-sleek view
                    SizedBox(
                      width: 270,
                      height: 270,
                      child: CustomPaint(
                        painter: ScannerCornersPainter(color: const Color(0xFF10B981)),
                      ),
                    ),

                    // Laser scan animation line
                    AnimatedBuilder(
                      animation: _animationController,
                      builder: (context, child) {
                        return Positioned(
                          top: _animationController.value * 220 + 25,
                          left: 30,
                          right: 30,
                          child: Container(
                            height: 3,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(2),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF10B981).withValues(alpha: 0.8),
                                  blurRadius: 12,
                                  spreadRadius: 3,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Instruction pill
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: const Text(
                        'Align QR Code within frame',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 3. TOP GLASS APP BAR
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                  ),
                ),

                // Glass Title
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: const Text(
                        'Scan & Pay',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                  ),
                ),

                // Flash toggle
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                      ),
                      child: IconButton(
                        icon: Icon(
                          _isTorchOn ? Icons.flash_on_rounded : Icons.flash_off_rounded,
                          color: _isTorchOn ? const Color(0xFFFBBF24) : Colors.white,
                          size: 22,
                        ),
                        onPressed: () {
                          setState(() {
                            _isTorchOn = !_isTorchOn;
                          });
                          _cameraController.toggleTorch();
                        },
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 4. FLOATING GLASS ACTION BAR (UPLOAD IMAGE ABOVE SLIDER)
          Positioned(
            bottom: 120,
            left: 24,
            right: 24,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: _pickAndScanImage,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 1.5),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.3),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add_photo_alternate_rounded, color: Colors.white, size: 22),
                            SizedBox(width: 10),
                            Text(
                              'Upload Image QR',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                letterSpacing: 0.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 5. SLIDING BOTTOM SHEET FOR MY QR CODE
          DraggableScrollableSheet(
            initialChildSize: 0.12,
            minChildSize: 0.12,
            maxChildSize: 0.88,
            builder: (BuildContext context, ScrollController scrollController) {
              return Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.6),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(24),
                  children: [
                    // Drag Handle Bar
                    Center(
                      child: Container(
                        width: 48,
                        height: 5,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white.withValues(alpha: 0.2) : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Slider Drag Title
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.keyboard_arrow_up_rounded, color: Color(0xFF10B981), size: 24),
                        const SizedBox(width: 6),
                        Text(
                          'Slide up for My QR Code',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF1E293B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // QR Card Container
                    RepaintBoundary(
                      key: _qrBoundaryKey,
                      child: Container(
                        padding: const EdgeInsets.all(28),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.grey.shade200,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.08),
                                    blurRadius: 16,
                                    spreadRadius: 2,
                                  ),
                                ],
                              ),
                              child: QrImageView(
                                data: myQrData,
                                version: QrVersions.auto,
                                size: 200.0,
                                backgroundColor: Colors.white,
                                eyeStyle: const QrEyeStyle(
                                  eyeShape: QrEyeShape.square,
                                  color: Color(0xFF0F172A),
                                ),
                                dataModuleStyle: const QrDataModuleStyle(
                                  dataModuleShape: QrDataModuleShape.square,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // User Tag Header
                            Text(
                              user?['fullName'] ?? 'RopeWallet User',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                myTag.startsWith('\$') ? myTag : '\$$myTag',
                                style: const TextStyle(
                                  color: Color(0xFF10B981),
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Action Buttons for My QR (Download & Share)
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isSavingQr ? null : _downloadQr,
                            icon: const Icon(Icons.file_download_outlined, size: 20),
                            label: const Text('Save QR'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                              foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 0,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _isSavingQr ? null : _shareQr,
                            icon: const Icon(Icons.share_outlined, size: 20),
                            label: const Text('Share QR'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Manual Input Section
                    Text(
                      'Or Enter User Tag Manually',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _manualInputController,
                            style: TextStyle(color: isDark ? Colors.white : Colors.black),
                            decoration: InputDecoration(
                              hintText: 'e.g. \$username',
                              fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                              filled: true,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(16),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
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
                                  SnackBar(
                                    backgroundColor: const Color(0xFFEF4444),
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    content: const Text('Invalid user tag format.'),
                                  ),
                                );
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Proceed', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// Custom Painter for Glassmorphic Scanner Frame Corners
class ScannerCornersPainter extends CustomPainter {
  final Color color;
  ScannerCornersPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 4.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    const cornerLength = 28.0;

    // Top-Left Corner
    canvas.drawPath(
      Path()
        ..moveTo(0, cornerLength)
        ..lineTo(0, 0)
        ..lineTo(cornerLength, 0),
      paint,
    );

    // Top-Right Corner
    canvas.drawPath(
      Path()
        ..moveTo(size.width - cornerLength, 0)
        ..lineTo(size.width, 0)
        ..lineTo(size.width, cornerLength),
      paint,
    );

    // Bottom-Left Corner
    canvas.drawPath(
      Path()
        ..moveTo(0, size.height - cornerLength)
        ..lineTo(0, size.height)
        ..lineTo(cornerLength, size.height),
      paint,
    );

    // Bottom-Right Corner
    canvas.drawPath(
      Path()
        ..moveTo(size.width - cornerLength, size.height)
        ..lineTo(size.width, size.height)
        ..lineTo(size.width, size.height - cornerLength),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
