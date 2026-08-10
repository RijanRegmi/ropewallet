import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKeyEmail = GlobalKey<FormState>();
  final _formKeyPassword = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  // 0: enter email, 1: verify OTP, 2: enter new password
  int _step = 0;

  @override
  void dispose() {
    _emailController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  Future<void> _pasteOtpFromClipboard() async {
    final clipboardData = await Clipboard.getData('text/plain');
    if (clipboardData != null && clipboardData.text != null) {
      final text = clipboardData.text!.replaceAll(RegExp(r'[^0-9]'), '');
      if (text.isNotEmpty) {
        for (int i = 0; i < 6; i++) {
          if (i < text.length) {
            _otpControllers[i].text = text[i];
          }
        }
        if (mounted) setState(() {});
        final lastIdx = (text.length - 1).clamp(0, 5);
        _otpFocusNodes[lastIdx].requestFocus();
        if (text.length >= 6) {
          _verifyOtpCode();
        }
      }
    }
  }

  bool _isVerifying = false;

  Future<void> _sendCode({bool isResend = false}) async {
    if (!isResend) {
      if (_formKeyEmail.currentState == null || !_formKeyEmail.currentState!.validate()) return;
    }

    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.sendForgotPasswordOtp(email);

    if (mounted) {
      if (success) {
        if (isResend) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('A new 6-digit code has been sent to your email.'),
            ),
          );
        } else {
          setState(() {
            _step = 1;
          });
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _otpFocusNodes[0].requestFocus();
          });
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to send reset code'),
          ),
        );
      }
    }
  }

  Future<void> _verifyOtpCode() async {
    if (_isVerifying) return;
    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFEF4444),
          content: Text('Please enter the full 6-digit verification code.'),
        ),
      );
      return;
    }

    setState(() {
      _isVerifying = true;
    });

    // Verify OTP with backend
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.verifyForgotPasswordOtp(
      email: _emailController.text.trim(),
      otpCode: otpCode,
    );

    if (mounted) {
      setState(() {
        _isVerifying = false;
      });

      if (success) {
        setState(() {
          _step = 2;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Invalid verification code'),
          ),
        );
      }
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKeyPassword.currentState!.validate()) return;

    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.resetPasswordWithOtp(
      email: _emailController.text.trim(),
      otpCode: otpCode,
      newPassword: _newPasswordController.text,
    );

    if (success) {
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Color(0xFF10B981)),
                SizedBox(width: 10),
                Text('Success'),
              ],
            ),
            content: const Text('Password has been reset successfully! Please login with your new password.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop();
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Password reset failed'),
          ),
        );
      }
    }
  }

  Widget _buildOtpField(int index, bool isDark) {
    final isFocused = _otpFocusNodes[index].hasFocus;
    final hasValue = _otpControllers[index].text.isNotEmpty;

    return KeyboardListener(
      focusNode: FocusNode(),
      onKeyEvent: (event) {
        if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.backspace) {
          if (_otpControllers[index].text.isEmpty && index > 0) {
            _otpFocusNodes[index - 1].requestFocus();
            _otpControllers[index - 1].clear();
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
          controller: _otpControllers[index],
          focusNode: _otpFocusNodes[index],
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
          onTap: () {
            _otpControllers[index].selection = TextSelection(
              baseOffset: 0,
              extentOffset: _otpControllers[index].text.length,
            );
          },
          onChanged: (val) {
            final digitsOnly = val.replaceAll(RegExp(r'[^0-9]'), '');

            if (digitsOnly.length > 2) {
              // True paste (3+ digits)
              for (int i = 0; i < 6; i++) {
                if (i < digitsOnly.length) {
                  _otpControllers[i].text = digitsOnly[i];
                }
              }
              final nextIdx = digitsOnly.length.clamp(0, 5);
              _otpFocusNodes[nextIdx].requestFocus();
              setState(() {});
              if (digitsOnly.length >= 6) {
                _verifyOtpCode();
              }
              return;
            }

            if (val.length == 2) {
              // Typing over an existing single digit!
              final newChar = val[1];
              _otpControllers[index].text = newChar;
              _otpControllers[index].selection = const TextSelection.collapsed(offset: 1);
              if (index < 5) {
                _otpFocusNodes[index + 1].requestFocus();
              }
            } else if (val.length == 1) {
              // Normal typing into an empty box
              _otpControllers[index].text = val;
              _otpControllers[index].selection = const TextSelection.collapsed(offset: 1);
              if (index < 5) {
                _otpFocusNodes[index + 1].requestFocus();
              }
            } else if (val.isEmpty) {
              // Erased current box digit
              if (index > 0) {
                _otpFocusNodes[index - 1].requestFocus();
              }
            }

            setState(() {});

            final fullCode = _otpControllers.map((c) => c.text).join();
            if (fullCode.length == 6) {
              _verifyOtpCode();
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

    final stepTitles = ['Forgot Password?', 'Verify Code', 'New Password'];
    final stepSubtitles = [
      'Enter your email to receive a 6-digit password reset verification code.',
      'Enter the 6-digit code sent to your email address.',
      'Create a new password for your account.',
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B0F19) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black87, size: 20),
          onPressed: () {
            if (_step > 0) {
              setState(() {
                _step--;
              });
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
        title: Text(
          'Step ${_step + 1} of 3',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
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
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.shield_outlined, size: 14, color: Color(0xFF10B981)),
                    const SizedBox(width: 6),
                    Text(
                      stepTitles[_step].toUpperCase(),
                      style: const TextStyle(
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
                stepTitles[_step],
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                stepSubtitles[_step],
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),

              // Progress Bar (3 Pill Steps)
              Row(
                children: List.generate(3, (index) {
                  final isActive = index == _step;
                  final isDone = index < _step;
                  return Expanded(
                    child: Container(
                      height: 5,
                      margin: const EdgeInsets.symmetric(horizontal: 2.5),
                      decoration: BoxDecoration(
                        color: isActive
                            ? const Color(0xFF10B981)
                            : isDone
                                ? const Color(0xFF059669)
                                : isDark
                                    ? const Color(0xFF1E293B)
                                    : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              // STEP 0: ENTER EMAIL
              if (_step == 0)
                Form(
                  key: _formKeyEmail,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _sendCode(),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          labelText: 'Email Address *',
                          hintText: 'you@example.com',
                          prefixIcon: Icon(Icons.email_outlined, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 20),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.8),
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Please enter your email';
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value.trim())) {
                            return 'Enter a valid email address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: authProvider.isLoading ? null : _sendCode,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            elevation: 4,
                            padding: EdgeInsets.zero,
                            shadowColor: const Color(0xFF10B981).withOpacity(0.4),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: authProvider.isLoading
                              ? const SizedBox(
                                  height: 22,
                                  width: 22,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Send Verification Code',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        height: 1.2,
                                      ),
                                    ),
                                    SizedBox(width: 8),
                                    Icon(Icons.send_rounded, size: 20),
                                  ],
                                ),
                        ),
                      ),
                    ],
                  ),
                ),

              // STEP 1: VERIFY OTP CODE
              if (_step == 1)
                Column(
                  children: [
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
                              'Code sent to ${_emailController.text.trim()}',
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

                    // OTP 6-Box Layout (Single Border Clean)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) => _buildOtpField(index, isDark)),
                    ),
                    const SizedBox(height: 20),

                    // 1-Tap Paste Button
                    TextButton.icon(
                      onPressed: _pasteOtpFromClipboard,
                      icon: const Icon(Icons.content_paste_rounded, size: 16, color: Color(0xFF10B981)),
                      label: const Text(
                        'Paste Code from Clipboard',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                      ),
                    ),

                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          flex: 1,
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() {
                                _step = 0;
                              });
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                            ),
                            child: Text('Back', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: SizedBox(
                            height: 56,
                            child: ElevatedButton(
                              onPressed: (_isVerifying || authProvider.isLoading) ? null : _verifyOtpCode,
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
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                    )
                                  : const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Verify Code',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            height: 1.2,
                                          ),
                                        ),
                                        SizedBox(width: 6),
                                        Icon(Icons.arrow_forward_rounded, size: 20),
                                      ],
                                    ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: TextButton(
                        onPressed: authProvider.isLoading ? null : () => _sendCode(isResend: true),
                        child: const Text(
                          'Resend Code',
                          style: TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

              // STEP 2: ENTER NEW PASSWORD
              if (_step == 2)
                Form(
                  key: _formKeyPassword,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextFormField(
                        controller: _newPasswordController,
                        obscureText: _obscureNewPassword,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          labelText: 'New Password *',
                          prefixIcon: Icon(Icons.lock_outline_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 20),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.8),
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureNewPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureNewPassword = !_obscureNewPassword;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Please enter a new password';
                          if (value.length < 6) return 'Password must be at least 6 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: _obscureConfirmPassword,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                        decoration: InputDecoration(
                          labelText: 'Confirm Password *',
                          prefixIcon: Icon(Icons.lock_reset_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 20),
                          filled: true,
                          fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.8),
                          ),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscureConfirmPassword = !_obscureConfirmPassword;
                              });
                            },
                          ),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Confirm your password';
                          if (value != _newPasswordController.text) return 'Passwords do not match';
                          return null;
                        },
                      ),
                      const SizedBox(height: 40),
                      Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _step = 1;
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                              ),
                              child: Text('Back', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: SizedBox(
                              height: 52,
                              child: ElevatedButton(
                                onPressed: authProvider.isLoading ? null : _resetPassword,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF10B981),
                                  foregroundColor: Colors.white,
                                  elevation: 4,
                                  shadowColor: const Color(0xFF10B981).withOpacity(0.4),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: authProvider.isLoading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text('Reset Password', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                                          SizedBox(width: 6),
                                          Icon(Icons.check_circle_outline_rounded, size: 18),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
