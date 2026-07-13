import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/security_provider.dart';

class PinCodeDialog extends StatefulWidget {
  final String title;
  final String subtitle;

  const PinCodeDialog({
    super.key,
    this.title = 'Enter Transaction PIN',
    this.subtitle = 'Authorize your RopeWallet transaction',
  });

  @override
  State<PinCodeDialog> createState() => _PinCodeDialogState();
}

class _PinCodeDialogState extends State<PinCodeDialog> {
  String _pin = '';
  bool _isVerifying = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    // Auto-trigger biometric scanning if enabled
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkBiometricBypass();
    });
  }

  Future<void> _checkBiometricBypass() async {
    final securityProvider = Provider.of<SecurityProvider>(context, listen: false);
    if (securityProvider.useBiometrics && securityProvider.isBiometricSupported) {
      final authenticated = await securityProvider.authenticateBiometrically();
      if (authenticated && mounted) {
        final savedPin = await securityProvider.getSavedPin();
        if (savedPin != null) {
          Navigator.of(context).pop(savedPin);
        } else {
          setState(() {
            _error = 'PIN required manually once to activate biometrics.';
          });
        }
      }
    }
  }

  void _onKeyPress(String digit) {
    if (_pin.length >= 6) return;
    setState(() {
      _pin += digit;
      _error = null;
    });

    if (_pin.length == 6) {
      _verifyPin();
    }
  }

  void _onBackspace() {
    if (_pin.isEmpty) return;
    setState(() {
      _pin = _pin.substring(0, _pin.length - 1);
      _error = null;
    });
  }

  Future<void> _verifyPin() async {
    setState(() {
      _isVerifying = true;
    });

    final securityProvider = Provider.of<SecurityProvider>(context, listen: false);
    final isValid = await securityProvider.verifyTransactionPin(_pin);

    if (mounted) {
      setState(() {
        _isVerifying = false;
      });

      if (isValid) {
        Navigator.of(context).pop(_pin); // Success: returns the correct plain/hashed PIN
      } else {
        setState(() {
          _pin = '';
          _error = 'Invalid PIN. Please try again.';
        });
      }
    }
  }

  Widget _buildDot(int index) {
    final isFilled = index < _pin.length;
    final theme = Theme.of(context);
    return Container(
      width: 16,
      height: 16,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isFilled ? theme.primaryColor : Colors.transparent,
        border: Border.all(
          color: isFilled ? theme.primaryColor : Colors.grey.withOpacity(0.5),
          width: 2,
        ),
      ),
    );
  }

  Widget _buildKey(String value, {VoidCallback? onPressed, IconData? icon}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Container(
        margin: const EdgeInsets.all(8),
        height: 60,
        child: InkWell(
          borderRadius: BorderRadius.circular(30),
          onTap: onPressed ?? () => _onKeyPress(value),
          child: Center(
            child: icon != null
                ? Icon(
                    icon,
                    size: 26,
                    color: isDark ? Colors.white70 : Colors.black87,
                  )
                : Text(
                    value,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final securityProvider = Provider.of<SecurityProvider>(context);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),

          // Security Lock Icon
          Icon(Icons.lock_outline_rounded, size: 40, color: theme.primaryColor),
          const SizedBox(height: 12),

          // Title & Description
          Text(
            widget.title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            widget.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.grey[400] : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 28),

          // Dots Indicator
          if (_isVerifying)
            const SizedBox(
              height: 24,
              width: 24,
              child: CircularProgressIndicator(strokeWidth: 2.5),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (index) => _buildDot(index)),
            ),

          // Error Message
          const SizedBox(height: 12),
          SizedBox(
            height: 18,
            child: _error != null
                ? Text(
                    _error!,
                    style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13, fontWeight: FontWeight.w500),
                  )
                : null,
          ),
          const SizedBox(height: 16),

          // Keypad Layout
          Column(
            children: [
              Row(
                children: [
                  _buildKey('1'),
                  _buildKey('2'),
                  _buildKey('3'),
                ],
              ),
              Row(
                children: [
                  _buildKey('4'),
                  _buildKey('5'),
                  _buildKey('6'),
                ],
              ),
              Row(
                children: [
                  _buildKey('7'),
                  _buildKey('8'),
                  _buildKey('9'),
                ],
              ),
              Row(
                children: [
                  // Left button: Biometric Auth trigger if supported & enabled
                  Expanded(
                    child: securityProvider.isBiometricSupported && securityProvider.useBiometrics
                        ? IconButton(
                            icon: Icon(
                              Icons.fingerprint_rounded,
                              size: 32,
                              color: theme.primaryColor,
                            ),
                            onPressed: _checkBiometricBypass,
                          )
                        : const SizedBox(),
                  ),
                  _buildKey('0'),
                  // Right button: Backspace
                  _buildKey('', icon: Icons.backspace_outlined, onPressed: _onBackspace),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
