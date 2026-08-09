import 'package:flutter/material.dart';

class FullPageLoadingOverlay extends StatefulWidget {
  final String message;

  const FullPageLoadingOverlay({
    super.key,
    this.message = 'Processing transaction...',
  });

  static OverlayEntry show(BuildContext context, {String message = 'Processing transaction...'}) {
    final overlayEntry = OverlayEntry(
      builder: (context) => FullPageLoadingOverlay(message: message),
    );
    Overlay.of(context).insert(overlayEntry);
    return overlayEntry;
  }

  @override
  State<FullPageLoadingOverlay> createState() => _FullPageLoadingOverlayState();
}

class _FullPageLoadingOverlayState extends State<FullPageLoadingOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;

    return Material(
      color: const Color(0xE60D1322), // Semi-transparent dark backdrop matching image 3
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated Square Block Loader matching image 3
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                return Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final double delay = index * 0.2;
                    final double animValue = (_controller.value - delay) % 1.0;
                    final double opacity = (animValue < 0.5 ? animValue * 2 : (1.0 - animValue) * 2).clamp(0.2, 1.0);
                    final double size = 16.0 + (opacity * 6.0);

                    return Container(
                      width: size,
                      height: size,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF60A5FA).withOpacity(opacity),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    );
                  }),
                );
              },
            ),
            const SizedBox(height: 28),

            // Message text
            Text(
              widget.message,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
