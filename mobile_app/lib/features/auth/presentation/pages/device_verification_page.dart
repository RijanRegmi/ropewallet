import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import 'set_pin_page.dart';
import '../../../home/presentation/pages/home_page.dart';

class DeviceVerificationPage extends StatefulWidget {
  final String tempToken;
  final String? emailHint;

  const DeviceVerificationPage({
    super.key,
    required this.tempToken,
    this.emailHint,
  });

  @override
  State<DeviceVerificationPage> createState() => _DeviceVerificationPageState();
}

class _DeviceVerificationPageState extends State<DeviceVerificationPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  int _resendCountdown = 30;
  Timer? _timer;
  bool _isResending = false;

  @override
  void initState() {
    super.initState();
    _startResendTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNodes[0].requestFocus();
    });
  }

  void _startResendTimer() {
    _resendCountdown = 30;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_resendCountdown > 0) {
        if (mounted) setState(() => _resendCountdown--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  String get _otpCode => _controllers.map((c) => c.text).join();

  Future<void> _pasteOtpFromClipboard() async {
    final clipboardData = await Clipboard.getData('text/plain');
    if (clipboardData != null && clipboardData.text != null) {
      final text = clipboardData.text!.replaceAll(RegExp(r'[^0-9]'), '');
      if (text.isNotEmpty) {
        for (int i = 0; i < 6; i++) {
          if (i < text.length) {
            _controllers[i].text = text[i];
          }
        }
        if (mounted) setState(() {});
        final lastIdx = (text.length - 1).clamp(0, 5);
        _focusNodes[lastIdx].requestFocus();
        if (text.length >= 6) {
          _submitVerification();
        }
      }
    }
  }

  bool _isVerifying = false;

  Future<void> _submitVerification() async {
    if (_isVerifying) return;

    final code = _otpCode.trim();
    if (code.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFEF4444),
          content: Text('Please enter the full 6-digit verification code'),
        ),
      );
      return;
    }

    setState(() {
      _isVerifying = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.clearError();

    try {
      final success = await authProvider.verifyNewDevice(
        tempToken: widget.tempToken,
        otpCode: code,
      );

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('New device approved! Sign-in complete.'),
            ),
          );
          final targetPage = authProvider.hasPin ? const HomePage() : const SetPinPage();
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => targetPage),
            (route) => false,
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text(authProvider.errorMessage ?? 'Verification failed'),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(e.toString().replaceAll('Exception: ', '')),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isVerifying = false;
        });
      }
    }
  }

  Future<void> _handleResend() async {
    if (_resendCountdown > 0 || _isResending) return;

    setState(() => _isResending = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.resendDeviceOtp(tempToken: widget.tempToken);

    if (mounted) {
      setState(() => _isResending = false);
      if (success) {
        _startResendTimer();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('A new 6-digit code has been sent to your email.'),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to resend code'),
          ),
        );
      }
    }
  }

  Widget _buildOtpField(int index, bool isDark) {
    final isFocused = _focusNodes[index].hasFocus;
    final hasValue = _controllers[index].text.isNotEmpty;

    return KeyboardListener(
      focusNode: FocusNode(),
      onKeyEvent: (event) {
        if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
          if (_controllers[index].text.isEmpty && index > 0) {
            _focusNodes[index - 1].requestFocus();
            _controllers[index - 1].clear();
            setState(() {});
          }
        }
      },
      child: Container(
        width: 46,
        height: 54,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isFocused
                ? const Color(0xFF10B981) // Emerald border on focus
                : hasValue
                    ? const Color(0xFF059669)
                    : isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFCBD5E1),
            width: isFocused ? 2.0 : 1.2,
          ),
        ),
        child: TextField(
          controller: _controllers[index],
          focusNode: _focusNodes[index],
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onTap: () {
            _controllers[index].selection = TextSelection(
              baseOffset: 0,
              extentOffset: _controllers[index].text.length,
            );
          },
          onChanged: (val) {
            final digitsOnly = val.replaceAll(RegExp(r'[^0-9]'), '');

            if (digitsOnly.length > 2) {
              // True paste (3+ digits)
              for (int i = 0; i < 6; i++) {
                if (i < digitsOnly.length) {
                  _controllers[i].text = digitsOnly[i];
                }
              }
              final nextIdx = digitsOnly.length.clamp(0, 5);
              _focusNodes[nextIdx].requestFocus();
              setState(() {});
              if (digitsOnly.length >= 6) {
                _submitVerification();
              }
              return;
            }

            if (val.length == 2) {
              // Typing over an existing single digit!
              final newChar = val[1];
              _controllers[index].text = newChar;
              _controllers[index].selection = const TextSelection.collapsed(offset: 1);
              if (index < 5) {
                _focusNodes[index + 1].requestFocus();
              }
            } else if (val.length == 1) {
              // Normal typing into an empty box
              _controllers[index].text = val;
              _controllers[index].selection = const TextSelection.collapsed(offset: 1);
              if (index < 5) {
                _focusNodes[index + 1].requestFocus();
              }
            } else if (val.isEmpty) {
              // Erased current box digit
              if (index > 0) {
                _focusNodes[index - 1].requestFocus();
              }
            }

            setState(() {});

            final fullCode = _controllers.map((c) => c.text).join();
            if (fullCode.length == 6) {
              _submitVerification();
            }
          },
          decoration: const InputDecoration(
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            errorBorder: InputBorder.none,
            disabledBorder: InputBorder.none,
            counterText: '',
            contentPadding: EdgeInsets.zero,
            isDense: true,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B0F19) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black87, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Device Security Check',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Security Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.shield_outlined, size: 14, color: Color(0xFF10B981)),
                    SizedBox(width: 6),
                    Text(
                      'NEW DEVICE DETECTED',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF10B981),
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              Text(
                'Authorize New Device',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'We sent a 6-digit security verification code to your registered email address${widget.emailHint != null ? " (${widget.emailHint})" : ""}.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),

              // Email notification badge card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B).withOpacity(0.5) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.mark_email_read_outlined, color: Color(0xFF10B981), size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Code sent to ${widget.emailHint ?? "your email"}',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 6-Digit Pin Input Boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(6, (index) => _buildOtpField(index, isDark)),
              ),
              const SizedBox(height: 20),

              // 1-Tap Paste Button
              Center(
                child: TextButton.icon(
                  onPressed: _pasteOtpFromClipboard,
                  icon: const Icon(Icons.content_paste_rounded, size: 16, color: Color(0xFF10B981)),
                  label: const Text(
                    'Paste Code from Clipboard',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: (_isVerifying || authProvider.isLoading) ? null : _submitVerification,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    disabledBackgroundColor: const Color(0xFF10B981).withOpacity(0.6),
                    foregroundColor: Colors.white,
                    elevation: 4,
                    padding: EdgeInsets.zero,
                    shadowColor: const Color(0xFF10B981).withOpacity(0.4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: (_isVerifying || authProvider.isLoading)
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              'Approve & Sign In',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.verified_user_rounded, size: 20),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 24),

              // Resend Timer Row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Didn't receive code? ",
                    style: TextStyle(
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                  GestureDetector(
                    onTap: _resendCountdown == 0 ? _handleResend : null,
                    child: Text(
                      _resendCountdown > 0
                          ? 'Resend in ${_resendCountdown}s'
                          : (_isResending ? 'Sending...' : 'Resend Code'),
                      style: TextStyle(
                        color: _resendCountdown == 0 ? const Color(0xFF10B981) : Colors.grey,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
