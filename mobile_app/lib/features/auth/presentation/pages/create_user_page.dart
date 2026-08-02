import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/network/api_client.dart';
import '../../providers/auth_provider.dart';

class CreateUserPage extends StatefulWidget {
  const CreateUserPage({super.key});

  @override
  State<CreateUserPage> createState() => _CreateUserPageState();
}

class _CreateUserPageState extends State<CreateUserPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _middleNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _tagController = TextEditingController();
  final _passwordController = TextEditingController();

  String _selectedRole = 'customer';
  bool _isLoading = false;
  bool _obscurePassword = true;

  // Real-time User Tag availability state
  bool _isCheckingTag = false;
  bool? _isTagAvailable;
  String? _tagCheckMessage;
  Timer? _tagDebounceTimer;
  bool _userEditedTag = false;

  // Real-time Email availability state
  bool _isCheckingEmail = false;
  bool? _isEmailAvailable;
  String? _emailCheckMessage;
  Timer? _emailDebounceTimer;

  @override
  void initState() {
    super.initState();
    // Auto generate a unique tag after frame layout
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _autoGenerateTag();
    });
  }

  @override
  void dispose() {
    _tagDebounceTimer?.cancel();
    _emailDebounceTimer?.cancel();
    _firstNameController.dispose();
    _middleNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _tagController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _autoGenerateTag() async {
    if (!mounted) return;
    setState(() {
      _isCheckingTag = true;
      _isTagAvailable = null;
      _tagCheckMessage = null;
    });

    final first = _firstNameController.text.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    final last = _lastNameController.text.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    final base = (first.isNotEmpty ? first : last.isNotEmpty ? last : 'user');
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    String generatedTag = '';
    bool foundUnique = false;

    for (int attempts = 0; attempts < 15; attempts++) {
      final randNum = Random().nextInt(900) + 100;
      final candidate = '\$$base$randNum';
      final available = await authProvider.checkUserTagAvailability(candidate);
      if (available) {
        generatedTag = candidate;
        foundUnique = true;
        break;
      }
    }

    if (!foundUnique) {
      final randNum = Random().nextInt(9000) + 1000;
      generatedTag = '\$$base$randNum';
    }

    if (!mounted) return;
    setState(() {
      _tagController.text = generatedTag;
      _isCheckingTag = false;
      _isTagAvailable = true;
      _tagCheckMessage = '$generatedTag is available';
    });
  }

  void _onNameChanged(String val) {
    if (!_userEditedTag) {
      _autoGenerateTag();
    }
  }

  void _onTagInputChanged(String val) {
    _userEditedTag = true;
    String formatted = val.trim();
    if (formatted.isNotEmpty && !formatted.startsWith('\$')) {
      formatted = '\$$formatted';
      _tagController.value = TextEditingValue(
        text: formatted,
        selection: TextSelection.collapsed(offset: formatted.length),
      );
    }

    _tagDebounceTimer?.cancel();
    _tagDebounceTimer = Timer(const Duration(milliseconds: 350), () {
      if (formatted.isNotEmpty && formatted != '\$') {
        _checkTagAvailability(formatted);
      } else {
        setState(() {
          _isCheckingTag = false;
          _isTagAvailable = null;
          _tagCheckMessage = null;
        });
      }
    });
  }

  Future<void> _checkTagAvailability(String tag) async {
    if (!mounted) return;
    setState(() {
      _isCheckingTag = true;
      _isTagAvailable = null;
      _tagCheckMessage = null;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final available = await authProvider.checkUserTagAvailability(tag);

    if (!mounted) return;
    setState(() {
      _isCheckingTag = false;
      _isTagAvailable = available;
      _tagCheckMessage = available ? '$tag is available' : '$tag is already taken';
    });
  }

  void _onEmailInputChanged(String val) {
    final email = val.trim();
    _emailDebounceTimer?.cancel();

    if (email.isEmpty || !RegExp(r'^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$').hasMatch(email)) {
      setState(() {
        _isCheckingEmail = false;
        _isEmailAvailable = null;
        _emailCheckMessage = null;
      });
      return;
    }

    setState(() {
      _isCheckingEmail = true;
      _isEmailAvailable = null;
      _emailCheckMessage = null;
    });

    _emailDebounceTimer = Timer(const Duration(milliseconds: 350), () async {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final available = await authProvider.checkEmailAvailability(email);

      if (!mounted) return;
      setState(() {
        _isCheckingEmail = false;
        _isEmailAvailable = available;
        _emailCheckMessage = available ? '$email is available' : 'Email is already registered';
      });
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_isEmailAvailable == false) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Email address is already registered. Please use another email.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_isTagAvailable == false) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please generate or choose an available user tag.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await ApiClient().post(
        '/admin/users',
        {
          'firstName': _firstNameController.text.trim(),
          'middleName': _middleNameController.text.trim().isNotEmpty
              ? _middleNameController.text.trim()
              : null,
          'lastName': _lastNameController.text.trim(),
          'email': _emailController.text.trim(),
          'phoneNumber': _phoneController.text.trim(),
          'userTag': _tagController.text.trim(),
          'password': _passwordController.text,
          'role': _selectedRole,
        },
      );

      final responseData = jsonDecode(response.body);

      if (mounted) {
        setState(() {
          _isLoading = false;
        });

        if (response.statusCode == 200 || response.statusCode == 201) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(responseData['message'] ?? 'Account created successfully!'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(responseData['error'] ?? 'Failed to create account'),
              backgroundColor: const Color(0xFFEF4444),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  InputDecoration _buildInputDecoration({
    required String labelText,
    required IconData prefixIcon,
    Widget? suffixIcon,
    required bool isDark,
    required ThemeData theme,
  }) {
    return InputDecoration(
      labelText: labelText,
      labelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
      ),
      prefixIcon: Icon(prefixIcon, color: theme.primaryColor, size: 20),
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(
          color: theme.primaryColor,
          width: 2,
        ),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(
          color: Color(0xFFEF4444),
          width: 1.5,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context);
    final isSuperAdmin = authProvider.isSuperAdmin;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Create New Account'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [theme.primaryColor, theme.primaryColor.withBlue(220)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: theme.primaryColor.withOpacity(0.25),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.person_add_alt_1_rounded, color: Colors.white, size: 28),
                        SizedBox(width: 12),
                        Text(
                          'Add Account',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      isSuperAdmin
                          ? 'Super Admin: You can create Customer, Host, or Super Admin accounts.'
                          : 'Host: You can create Customer accounts.',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Form Container Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Role Selection
                    DropdownButtonFormField<String>(
                      value: _selectedRole,
                      decoration: _buildInputDecoration(
                        labelText: 'Account Role',
                        prefixIcon: Icons.badge_outlined,
                        isDark: isDark,
                        theme: theme,
                      ),
                      dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                      items: [
                        const DropdownMenuItem(value: 'customer', child: Text('Customer')),
                        if (isSuperAdmin) ...[
                          const DropdownMenuItem(value: 'host', child: Text('Host')),
                          const DropdownMenuItem(value: 'superadmin', child: Text('Super Admin')),
                        ],
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedRole = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 20),

                    // First Name
                    TextFormField(
                      controller: _firstNameController,
                      textCapitalization: TextCapitalization.words,
                      onChanged: _onNameChanged,
                      decoration: _buildInputDecoration(
                        labelText: 'First Name *',
                        prefixIcon: Icons.person_outline_rounded,
                        isDark: isDark,
                        theme: theme,
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'First name is required' : null,
                    ),
                    const SizedBox(height: 20),

                    // Middle Name
                    TextFormField(
                      controller: _middleNameController,
                      textCapitalization: TextCapitalization.words,
                      decoration: _buildInputDecoration(
                        labelText: 'Middle Name (Optional)',
                        prefixIcon: Icons.person_outline_rounded,
                        isDark: isDark,
                        theme: theme,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Last Name
                    TextFormField(
                      controller: _lastNameController,
                      textCapitalization: TextCapitalization.words,
                      onChanged: _onNameChanged,
                      decoration: _buildInputDecoration(
                        labelText: 'Last Name *',
                        prefixIcon: Icons.person_outline_rounded,
                        isDark: isDark,
                        theme: theme,
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Last name is required' : null,
                    ),
                    const SizedBox(height: 20),

                    // Email Address Field with Real-Time Availability Check
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      onChanged: _onEmailInputChanged,
                      decoration: _buildInputDecoration(
                        labelText: 'Email Address *',
                        prefixIcon: Icons.email_outlined,
                        isDark: isDark,
                        theme: theme,
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'Email is required';
                        if (!RegExp(r'^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$').hasMatch(val.trim())) {
                          return 'Enter a valid email address';
                        }
                        if (_isEmailAvailable == false) {
                          return 'This email address is already registered';
                        }
                        return null;
                      },
                    ),

                    // Real-Time Email Availability Status Indicator
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, left: 4.0),
                      child: Builder(
                        builder: (context) {
                          if (_isCheckingEmail) {
                            return const Row(
                              children: [
                                SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Checking email availability...',
                                  style: TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            );
                          }
                          if (_isEmailAvailable == true && _emailCheckMessage != null) {
                            return Row(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  _emailCheckMessage!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            );
                          }
                          if (_isEmailAvailable == false && _emailCheckMessage != null) {
                            return Row(
                              children: [
                                const Icon(Icons.cancel_rounded, color: Color(0xFFEF4444), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  _emailCheckMessage!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Phone Number
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: _buildInputDecoration(
                        labelText: 'Phone Number *',
                        prefixIcon: Icons.phone_outlined,
                        isDark: isDark,
                        theme: theme,
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Phone number is required' : null,
                    ),
                    const SizedBox(height: 20),

                    // Mandatory Auto-Generated User Tag Field
                    TextFormField(
                      controller: _tagController,
                      onChanged: _onTagInputChanged,
                      decoration: _buildInputDecoration(
                        labelText: 'User Tag * (Auto-Generated Unique Tag)',
                        prefixIcon: Icons.alternate_email_rounded,
                        suffixIcon: IconButton(
                          icon: Icon(Icons.refresh_rounded, color: theme.primaryColor),
                          tooltip: 'Generate Unique Tag',
                          onPressed: () {
                            _userEditedTag = false;
                            _autoGenerateTag();
                          },
                        ),
                        isDark: isDark,
                        theme: theme,
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty || val.trim() == '\$') {
                          return 'User tag is required';
                        }
                        if (_isTagAvailable == false) {
                          return 'This user tag is already taken';
                        }
                        return null;
                      },
                    ),

                    // Real-Time Tag Availability Status Indicator
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, left: 4.0),
                      child: Builder(
                        builder: (context) {
                          if (_isCheckingTag) {
                            return const Row(
                              children: [
                                SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Generating & checking unique tag...',
                                  style: TextStyle(fontSize: 12, color: Colors.grey),
                                ),
                              ],
                            );
                          }
                          if (_isTagAvailable == true && _tagCheckMessage != null) {
                            return Row(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  _tagCheckMessage!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            );
                          }
                          if (_isTagAvailable == false && _tagCheckMessage != null) {
                            return Row(
                              children: [
                                const Icon(Icons.cancel_rounded, color: Color(0xFFEF4444), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  _tagCheckMessage!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Password
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: _buildInputDecoration(
                        labelText: 'Account Password *',
                        prefixIcon: Icons.lock_outline_rounded,
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: Colors.grey,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                        isDark: isDark,
                        theme: theme,
                      ),
                      validator: (val) {
                        if (val == null || val.isEmpty) return 'Password is required';
                        if (val.length < 6) return 'Password must be at least 6 characters';
                        return null;
                      },
                    ),
                    const SizedBox(height: 32),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        child: _isLoading
                            ? const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2.5,
                                    ),
                                  ),
                                  SizedBox(width: 12),
                                  Text(
                                    'Creating Account...',
                                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              )
                            : const Text(
                                'Create Account',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                      ),
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
