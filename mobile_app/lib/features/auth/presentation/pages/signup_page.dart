import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class SignupPage extends StatefulWidget {
  const SignupPage({super.key});

  @override
  State<SignupPage> createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage> {
  int _currentStep = 0;
  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();

  // Step 1 Controllers
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _usernameController = TextEditingController();

  // Step 2 Controllers
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  // Step 3 (OTP) Controllers
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Username checking states
  Timer? _debounce;
  bool _isCheckingUsername = false;
  bool? _isUsernameAvailable;

  @override
  void initState() {
    super.initState();
    _usernameController.addListener(_onUsernameChanged);
  }

  @override
  void dispose() {
    _usernameController.removeListener(_onUsernameChanged);
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    _debounce?.cancel();
    super.dispose();
  }

  void _onUsernameChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    final username = _usernameController.text.trim();

    if (username.length < 3) {
      setState(() {
        _isCheckingUsername = false;
        _isUsernameAvailable = null;
      });
      return;
    }

    setState(() {
      _isCheckingUsername = true;
      _isUsernameAvailable = null;
    });

    _debounce = Timer(const Duration(milliseconds: 600), () async {
      if (!mounted) return;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final available = await authProvider.checkUsernameAvailability(username);
      if (mounted) {
        setState(() {
          _isCheckingUsername = false;
          _isUsernameAvailable = available;
        });
      }
    });
  }

  Future<void> _proceedToStep2() async {
    if (!_formKey1.currentState!.validate()) return;
    if (_isUsernameAvailable != true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an available username.')),
      );
      return;
    }
    setState(() {
      _currentStep = 1;
    });
  }

  Future<void> _proceedToStep3() async {
    if (!_formKey2.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.sendRegisterOtp(
      _emailController.text.trim(),
      _usernameController.text.trim(),
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
          ),
        );
      }
    }
  }

  Future<void> _submitRegister() async {
    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the full 6-digit code.')),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.registerWithOtp(
      firstName: _firstNameController.text.trim(),
      middleName: _middleNameController.text.trim().isEmpty ? null : _middleNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      username: _usernameController.text.trim(),
      email: _emailController.text.trim(),
      password: _passwordController.text,
      phoneNumber: _phoneController.text.trim(),
      otpCode: otpCode,
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
            content: const Text('Registration complete! Please log in with your new credentials.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop(); // pop dialog
                  Navigator.of(context).pop(); // pop signup page
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
            content: Text(authProvider.errorMessage ?? 'Registration failed'),
          ),
        );
      }
    }
  }

  // Handle clipboard paste in OTP fields
  void _handleOtpPaste(String value) {
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
    if (digitsOnly.length >= 6) {
      for (int i = 0; i < 6; i++) {
        _otpControllers[i].text = digitsOnly[i];
      }
      FocusScope.of(context).unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Step ${_currentStep + 1} of 3'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Header
              Text(
                _currentStep == 0
                    ? 'Create Account'
                    : _currentStep == 1
                        ? 'Contact Details'
                        : 'Verify Email',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _currentStep == 0
                    ? 'Let\'s start with your basic profile details.'
                    : _currentStep == 1
                        ? 'Secure your account and add email details.'
                        : 'Enter the 6-digit OTP code sent to your email.',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 32),

              // Horizontal Onboarding Progress Dots
              Row(
                children: List.generate(3, (index) {
                  final isActive = index == _currentStep;
                  final isDone = index < _currentStep;
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: isActive
                            ? theme.primaryColor
                            : isDone
                                ? const Color(0xFF10B981)
                                : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 36),

              // STEP 1 FORM
              if (_currentStep == 0)
                Form(
                  key: _formKey1,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _firstNameController,
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: 'First Name',
                          prefixIcon: const Icon(Icons.person_outline_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'First name is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _middleNameController,
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: 'Middle Name (Optional)',
                          prefixIcon: const Icon(Icons.person_outline_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _lastNameController,
                        textCapitalization: TextCapitalization.words,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: 'Last Name',
                          prefixIcon: const Icon(Icons.person_outline_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Last name is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // Username input with debounced availability check
                      TextFormField(
                        controller: _usernameController,
                        keyboardType: TextInputType.text,
                        textInputAction: TextInputAction.done,
                        decoration: InputDecoration(
                          labelText: 'Unique Username',
                          prefixIcon: const Icon(Icons.alternate_email_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          suffixIcon: _isCheckingUsername
                              ? const Padding(
                                  padding: EdgeInsets.all(12.0),
                                  child: SizedBox(
                                    height: 16,
                                    width: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2),
                                  ),
                                )
                              : _isUsernameAvailable == true
                                  ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981))
                                  : _isUsernameAvailable == false
                                      ? const Icon(Icons.cancel_rounded, color: Color(0xFFEF4444))
                                      : null,
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Username is required';
                          if (value.trim().length < 3) return 'Username must be at least 3 characters';
                          if (_isUsernameAvailable == false) return 'Username is not available';
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _proceedToStep2,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.primaryColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Next Step', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),

              // STEP 2 FORM
              if (_currentStep == 1)
                Form(
                  key: _formKey2,
                  child: Column(
                    children: [
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: 'Email Address',
                          prefixIcon: const Icon(Icons.email_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Email is required';
                          if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value.trim())) {
                            return 'Enter a valid email address';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: 'Phone Number',
                          prefixIcon: const Icon(Icons.phone_outlined),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          hintText: '+1 555-0199',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) return 'Phone number is required';
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        textInputAction: TextInputAction.done,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Password is required';
                          if (value.length < 6) return 'Password must be at least 6 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 36),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _currentStep = 0;
                                });
                              },
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: const Text('Back'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: authProvider.isLoading ? null : _proceedToStep3,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: theme.primaryColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: authProvider.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Text('Send Code', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

              // STEP 3: OTP VERIFICATION CODE
              if (_currentStep == 2)
                Column(
                  children: [
                    // OTP Box Grid
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) {
                        return Container(
                          width: 48,
                          height: 56,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                          ),
                          child: TextFormField(
                            controller: _otpControllers[index],
                            focusNode: _otpFocusNodes[index],
                            keyboardType: TextInputType.number,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            inputFormatters: [
                              LengthLimitingTextInputFormatter(6), // Accept up to 6 in case of paste
                              FilteringTextInputFormatter.digitsOnly,
                            ],
                            onChanged: (val) {
                              if (val.length >= 6) {
                                _handleOtpPaste(val);
                                return;
                              }
                              if (val.isNotEmpty && index < 5) {
                                _otpFocusNodes[index + 1].requestFocus();
                              } else if (val.isEmpty && index > 0) {
                                _otpFocusNodes[index - 1].requestFocus();
                              }
                            },
                            decoration: const InputDecoration(
                              border: InputBorder.none,
                              counterText: '',
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 48),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setState(() {
                                _currentStep = 1;
                              });
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('Back'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: authProvider.isLoading ? null : _submitRegister,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: theme.primaryColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: authProvider.isLoading
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Text('Verify & Register', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
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
