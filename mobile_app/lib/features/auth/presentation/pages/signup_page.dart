import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/security_provider.dart';
import '../../../home/presentation/pages/home_page.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  int _currentStep = 0; // 0 to 4 (5 total steps)
  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();
  final _formKey4 = GlobalKey<FormState>();
  final _formKey5 = GlobalKey<FormState>();

  // Step 1 Controllers (Names)
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();

  // Step 2 Controllers (Contact)
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  // Step 3 (OTP) Controllers
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Step 4 (Password) Controllers & Eye Toggle state
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  // Step 5 (Security PIN) Controllers
  final _pinController = TextEditingController();
  final _confirmPinController = TextEditingController();

  @override
  void initState() {
    super.initState();
    for (int i = 0; i < 6; i++) {
      _otpFocusNodes[i].addListener(() {
        if (mounted) setState(() {});
      });
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _pinController.dispose();
    _confirmPinController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  // Helper to paste 6-digit OTP code into boxes
  Future<void> _pasteOtpFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data != null && data.text != null) {
      final digits = data.text!.replaceAll(RegExp(r'[^0-9]'), '');
      if (digits.isNotEmpty) {
        for (int i = 0; i < 6; i++) {
          if (i < digits.length) {
            _otpControllers[i].text = digits[i];
          }
        }
        final lastIdx = (digits.length - 1).clamp(0, 5);
        _otpFocusNodes[lastIdx].requestFocus();
        setState(() {});
        if (digits.length >= 6) {
          _verifyOtpAndProceed();
        }
      }
    }
  }

  Future<void> _proceedToStep2() async {
    if (!_formKey1.currentState!.validate()) return;
    setState(() {
      _currentStep = 1;
    });
  }

  Future<void> _proceedToStep3() async {
    if (!_formKey2.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.sendRegisterOtp(
      _emailController.text.trim(),
    );

    if (success) {
      setState(() {
        _currentStep = 2;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _otpFocusNodes[0].requestFocus();
      });
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to send verification code'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  Future<void> _verifyOtpAndProceed() async {
    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please enter the full 6-digit verification code.'),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final isValid = await authProvider.verifyRegisterOtp(
      _emailController.text.trim(),
      otpCode,
    );

    if (mounted) {
      if (isValid) {
        setState(() {
          _currentStep = 3; // Move to Step 4 (Password Setup)
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Invalid verification code'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  void _proceedToStep5() {
    if (!_formKey4.currentState!.validate()) return;
    setState(() {
      _currentStep = 4; // Move to Step 5 (PIN Setup)
    });
  }

  Future<void> _submitRegister() async {
    if (!_formKey5.currentState!.validate()) return;

    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final success = await authProvider.registerWithOtp(
      firstName: _firstNameController.text.trim(),
      middleName: _middleNameController.text.trim().isEmpty ? null : _middleNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      userTag: 'auto_generate',
      email: _emailController.text.trim(),
      password: _passwordController.text,
      phoneNumber: _phoneController.text.trim(),
      otpCode: otpCode,
      transactionPin: _pinController.text.trim(),
    );

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Welcome to RopeWallet, ${authProvider.user?["fullName"] ?? "User"}!'),
            backgroundColor: const Color(0xFF10B981),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );

        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const HomePage()),
          (route) => false,
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Registration failed'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  // Single Border Clean OTP Input Box
  Widget _buildOtpField(int index) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
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
                _verifyOtpAndProceed();
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
              _verifyOtpAndProceed();
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

    final stepTitles = ['Personal Info', 'Contact Info', 'Verify Email', 'Password', 'Security PIN'];
    final stepSubtitles = [
      'Enter your legal name as shown on official ID.',
      'Enter your contact details to receive verification codes.',
      'Enter the 6-digit verification code sent to your email.',
      'Create a secure password for your account.',
      'Set a 6-digit transaction PIN to authorize payments.',
    ];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B0F19) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black87, size: 20),
          onPressed: () {
            if (_currentStep > 0) {
              setState(() {
                _currentStep--;
              });
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
        title: Text(
          'Step ${_currentStep + 1} of 5',
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
              // Header Badge & Title
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
                      stepTitles[_currentStep].toUpperCase(),
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
                stepTitles[_currentStep],
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                stepSubtitles[_currentStep],
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),

              // Progress Bar (5 Pill Steps)
              Row(
                children: List.generate(5, (index) {
                  final isActive = index == _currentStep;
                  final isDone = index < _currentStep;
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

              // STEP 1 FORM (Personal Names)
              if (_currentStep == 0)
                Form(
                  key: _formKey1,
                  child: Column(
                    children: [
                      _buildInputField(
                        controller: _firstNameController,
                        label: 'First Name *',
                        hint: 'e.g. John',
                        icon: Icons.person_outline_rounded,
                        isDark: isDark,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'First name is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildInputField(
                        controller: _middleNameController,
                        label: 'Middle Name (Optional)',
                        hint: 'e.g. Edward',
                        icon: Icons.person_outline_rounded,
                        isDark: isDark,
                      ),
                      const SizedBox(height: 16),
                      _buildInputField(
                        controller: _lastNameController,
                        label: 'Last Name *',
                        hint: 'e.g. Doe',
                        icon: Icons.person_outline_rounded,
                        isDark: isDark,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Last name is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      _buildFullWidthButton(
                        text: 'Continue to Contact Info',
                        onPressed: _proceedToStep2,
                        icon: Icons.arrow_forward_rounded,
                      ),
                    ],
                  ),
                ),

              // STEP 2 FORM (Contact Info)
              if (_currentStep == 1)
                Form(
                  key: _formKey2,
                  child: Column(
                    children: [
                      _buildInputField(
                        controller: _emailController,
                        label: 'Email Address *',
                        hint: 'you@example.com',
                        icon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        isDark: isDark,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Email is required';
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value.trim())) {
                            return 'Enter a valid email address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildInputField(
                        controller: _phoneController,
                        label: 'Phone Number *',
                        hint: '+1 (555) 000-0000',
                        icon: Icons.phone_outlined,
                        keyboardType: TextInputType.phone,
                        isDark: isDark,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Phone number is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _currentStep = 0;
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
                            child: _buildFullWidthButton(
                              text: 'Send Code',
                              isLoading: authProvider.isLoading,
                              onPressed: _proceedToStep3,
                              icon: Icons.send_rounded,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

              // STEP 3: OTP VERIFICATION
              if (_currentStep == 2)
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

                    // OTP 6-Box Layout (Single Border clean)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) => _buildOtpField(index)),
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
                                _currentStep = 1;
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
                          child: _buildFullWidthButton(
                            text: 'Verify Code',
                            isLoading: authProvider.isLoading,
                            onPressed: _verifyOtpAndProceed,
                            icon: Icons.check_circle_outline_rounded,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

              // STEP 4: PASSWORD SETUP
              if (_currentStep == 3)
                Form(
                  key: _formKey4,
                  child: Column(
                    children: [
                      _buildInputField(
                        controller: _passwordController,
                        label: 'Password *',
                        hint: 'At least 6 characters',
                        icon: Icons.lock_outline_rounded,
                        obscureText: _obscurePassword,
                        isDark: isDark,
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Password is required';
                          if (value.length < 6) return 'Password must be at least 6 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildInputField(
                        controller: _confirmPasswordController,
                        label: 'Confirm Password *',
                        hint: 'Re-enter password',
                        icon: Icons.lock_reset_rounded,
                        obscureText: _obscureConfirmPassword,
                        isDark: isDark,
                        suffixIcon: IconButton(
                          icon: Icon(_obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                          onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Confirm password is required';
                          if (value != _passwordController.text) return 'Passwords do not match';
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _currentStep = 2;
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
                            child: _buildFullWidthButton(
                              text: 'Continue to PIN',
                              onPressed: _proceedToStep5,
                              icon: Icons.arrow_forward_rounded,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

              // STEP 5: TRANSACTION PIN SETUP
              if (_currentStep == 4)
                Form(
                  key: _formKey5,
                  child: Column(
                    children: [
                      _buildInputField(
                        controller: _pinController,
                        label: '6-Digit Transaction PIN *',
                        hint: '••••••',
                        icon: Icons.dialpad_rounded,
                        obscureText: true,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        isDark: isDark,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (value) {
                          if (value == null || value.length != 6) return 'PIN must be exactly 6 digits';
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildInputField(
                        controller: _confirmPinController,
                        label: 'Confirm 6-Digit PIN *',
                        hint: '••••••',
                        icon: Icons.dialpad_rounded,
                        obscureText: true,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        isDark: isDark,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        validator: (value) {
                          if (value == null || value.length != 6) return 'Confirm PIN is required';
                          if (value != _pinController.text) return 'PINs do not match';
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _currentStep = 3;
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
                            child: _buildFullWidthButton(
                              text: 'Complete Signup',
                              isLoading: authProvider.isLoading,
                              onPressed: _submitRegister,
                              icon: Icons.stars_rounded,
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

  // Reusable Premium Input Field
  Widget _buildInputField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    required bool isDark,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    int? maxLength,
    Widget? suffixIcon,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLength: maxLength,
      inputFormatters: inputFormatters,
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: isDark ? Colors.white : const Color(0xFF0F172A),
      ),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 20),
        suffixIcon: suffixIcon,
        counterText: '',
        filled: true,
        fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
        labelStyle: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
        ),
        hintStyle: TextStyle(
          fontSize: 13,
          color: isDark ? const Color(0xFF475569) : const Color(0xFF94A3B8),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
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
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
        ),
      ),
      validator: validator,
    );
  }

  // Reusable High-End Full-Width Button with FittedBox (Never Text Cut Off!)
  Widget _buildFullWidthButton({
    required String text,
    required VoidCallback? onPressed,
    required IconData icon,
    bool isLoading = false,
  }) {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF10B981), // Emerald
          foregroundColor: Colors.white,
          elevation: 4,
          shadowColor: const Color(0xFF10B981).withOpacity(0.4),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        child: isLoading
            ? const SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
              )
            : FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      text,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(icon, size: 18, color: Colors.white),
                  ],
                ),
              ),
      ),
    );
  }
}
