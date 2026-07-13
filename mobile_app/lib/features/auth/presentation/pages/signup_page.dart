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
  final _formKey4 = GlobalKey<FormState>();

  // Step 1 Controllers
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _usernameController = TextEditingController();

  // Step 2 Controllers
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  // Step 3 (OTP) Controllers with placeholder initialization
  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  // Step 4 (Security) Controllers
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _pinController = TextEditingController();
  final _confirmPinController = TextEditingController();

  // Username checking states
  Timer? _debounce;
  bool _isCheckingUsername = false;
  bool? _isUsernameAvailable;
  
  // Cache for checked usernames to avoid redundant network delays
  final Map<String, bool> _usernameCache = {};

  @override
  void initState() {
    super.initState();
    _usernameController.addListener(_onUsernameChanged);
    
    // Initialize OTP controllers with placeholder and focus change listeners
    for (int i = 0; i < 6; i++) {
      _otpControllers[i].text = '\u200B';
      _otpFocusNodes[i].addListener(() {
        if (mounted) setState(() {}); // Trigger repaint to update borders
      });
    }
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
    _confirmPasswordController.dispose();
    _pinController.dispose();
    _confirmPinController.dispose();
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
    final username = _usernameController.text.trim().toLowerCase();

    if (username.length < 3) {
      setState(() {
        _isCheckingUsername = false;
        _isUsernameAvailable = null;
      });
      return;
    }

    if (_usernameCache.containsKey(username)) {
      setState(() {
        _isCheckingUsername = false;
        _isUsernameAvailable = _usernameCache[username];
      });
      return;
    }

    setState(() {
      _isCheckingUsername = true;
      _isUsernameAvailable = null;
    });

    final currentText = username;
    // Debounce checks with extremely quick 150ms timeout
    _debounce = Timer(const Duration(milliseconds: 150), () async {
      if (!mounted) return;
      if (_usernameController.text.trim().toLowerCase() != currentText) return;

      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final available = await authProvider.checkUsernameAvailability(currentText);
      
      if (mounted) {
        // Prevent race condition: only update if input hasn't changed in the meantime
        if (_usernameController.text.trim().toLowerCase() == currentText) {
          setState(() {
            _isCheckingUsername = false;
            _isUsernameAvailable = available;
            _usernameCache[currentText] = available;
          });
        }
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

  void _proceedToStep4() {
    final otpCode = _otpControllers.map((c) => c.text.replaceAll('\u200B', '').trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the 6-digit verification code sent to your email.')),
      );
      return;
    }
    setState(() {
      _currentStep = 3;
    });
  }

  Future<void> _submitRegister() async {
    if (!_formKey4.currentState!.validate()) return;

    final otpCode = _otpControllers.map((c) => c.text.replaceAll('\u200B', '').trim()).join();
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
      transactionPin: _pinController.text.trim(),
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
            content: const Text('Registration complete! Please log in with your credentials.'),
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

  void _handleOtpPaste(String value) {
    final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
    if (digitsOnly.length >= 6) {
      for (int i = 0; i < 6; i++) {
        _otpControllers[i].text = '\u200B${digitsOnly[i]}';
      }
      FocusScope.of(context).unfocus();
    }
  }

  Widget _buildOtpField(int index) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isFocused = _otpFocusNodes[index].hasFocus;
    
    // Check if box has a digit entered (excluding placeholder)
    final hasValue = _otpControllers[index].text.replaceAll('\u200B', '').isNotEmpty;

    return Container(
      width: 46,
      height: 56,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: isDark
            ? (isFocused ? const Color(0xFF1E293B) : const Color(0xFF0F172A))
            : (isFocused ? Colors.white : const Color(0xFFF1F5F9)),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isFocused
              ? theme.primaryColor
              : (hasValue
                  ? (isDark ? const Color(0xFF475569) : const Color(0xFF94A3B8))
                  : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
          width: isFocused ? 2.0 : 1.5,
        ),
        boxShadow: isFocused
            ? [
                BoxShadow(
                  color: theme.primaryColor.withOpacity(0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                )
              ]
            : [],
      ),
      child: TextField(
        controller: _otpControllers[index],
        focusNode: _otpFocusNodes[index],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        showCursor: false,
        enableInteractiveSelection: false,
        style: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : const Color(0xFF0F172A),
        ),
        inputFormatters: [
          LengthLimitingTextInputFormatter(6),
        ],
        onChanged: (val) {
          if (val.length >= 6) {
            _handleOtpPaste(val);
            return;
          }
          if (val.length > 1) {
            final enteredChar = val.substring(val.length - 1);
            _otpControllers[index].text = '\u200B$enteredChar';
            if (index < 5) {
              _otpFocusNodes[index + 1].requestFocus();
            }
          } else if (val.isEmpty) {
            _otpControllers[index].text = '\u200B';
            if (index > 0) {
              _otpControllers[index - 1].text = '\u200B';
              _otpFocusNodes[index - 1].requestFocus();
            }
          }
        },
        decoration: const InputDecoration(
          border: InputBorder.none,
          counterText: '',
          contentPadding: EdgeInsets.zero,
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
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Step ${_currentStep + 1} of 4'),
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
                        : _currentStep == 2
                            ? 'Verify Email'
                            : 'Security Details',
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
                        ? 'Enter your contact coordinates below.'
                        : _currentStep == 2
                            ? 'Enter the 6-digit OTP code sent to your email.'
                            : 'Set up your secure password and transaction PIN.',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 32),

              // Onboarding Progress Dots
              Row(
                children: List.generate(4, (index) {
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
                        textInputAction: TextInputAction.done,
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
                                  : const Text('Send Verification Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
                      children: List.generate(6, (index) => _buildOtpField(index)),
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
                            onPressed: _proceedToStep4,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: theme.primaryColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('Verify Code', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

              // STEP 4: SECURITY SETUP
              if (_currentStep == 3)
                Form(
                  key: _formKey4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Choose Password',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
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
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'Confirm Password',
                          prefixIcon: const Icon(Icons.lock_reset_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Confirm password is required';
                          if (value != _passwordController.text) return 'Passwords do not match';
                          return null;
                        },
                      ),
                      const SizedBox(height: 28),

                      const Text(
                        'Set 4-Digit Transaction PIN',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _pinController,
                        keyboardType: TextInputType.number,
                        obscureText: true,
                        maxLength: 4,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          labelText: 'Create 4-digit PIN',
                          prefixIcon: const Icon(Icons.dialpad_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          counterText: '',
                        ),
                        validator: (value) {
                          if (value == null || value.length != 4) return 'PIN must be exactly 4 digits';
                          return null;
                        },
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _confirmPinController,
                        keyboardType: TextInputType.number,
                        obscureText: true,
                        maxLength: 4,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                        decoration: InputDecoration(
                          labelText: 'Confirm 4-digit PIN',
                          prefixIcon: const Icon(Icons.dialpad_rounded),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          counterText: '',
                        ),
                        validator: (value) {
                          if (value != _pinController.text) return 'PINs do not match';
                          return null;
                        },
                      ),
                      const SizedBox(height: 40),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setState(() {
                                  _currentStep = 2;
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
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                    )
                                  : const Text('Complete Registration', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
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
