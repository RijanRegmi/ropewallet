import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/core/theme/theme_provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import 'create_user_page.dart';
import '../../../admin/presentation/pages/admin_portal_page.dart';
import '../../providers/security_provider.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Future<void> _toggleBiometrics(bool enable, SecurityProvider securityProvider) async {
    if (!securityProvider.isBiometricSupported) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFFEF4444),
          content: Text('Biometrics not supported or registered on this device.'),
        ),
      );
      return;
    }

    if (enable) {
      // Trigger scan to verify before enabling
      final success = await securityProvider.authenticateBiometrically();
      if (success) {
        await securityProvider.setUseBiometrics(true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('Biometric verification enabled!'),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFFEF4444),
              content: Text('Biometric authentication failed. Could not enable.'),
            ),
          );
        }
      }
    } else {
      await securityProvider.setUseBiometrics(false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Biometric verification disabled.'),
          ),
        );
      }
    }
  }

  void _navigateToVerificationFlow(bool isPinChange) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChangeCredentialVerificationPage(isPinChange: isPinChange),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final securityProvider = Provider.of<SecurityProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          // Section: Preferences
          _buildSectionHeader('Preferences', isDark),
          const SizedBox(height: 12),
          Container(
            decoration: _buildCardDecoration(isDark),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.brightness_6_outlined, color: Color(0xFF4F46E5)),
                  title: const Text('Dark Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Toggle between light and dark modes'),
                  trailing: Switch(
                    value: themeProvider.themeMode == ThemeMode.dark,
                    onChanged: (val) {
                      themeProvider.toggleTheme();
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Section: Security
          _buildSectionHeader('Security & Credentials', isDark),
          const SizedBox(height: 12),
          Container(
            decoration: _buildCardDecoration(isDark),
            child: Column(
              children: [
                // Biometrics toggle
                ListTile(
                  leading: const Icon(Icons.fingerprint_rounded, color: Color(0xFF4F46E5)),
                  title: const Text('Biometric Authentication', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(securityProvider.isBiometricSupported
                      ? 'Use Fingerprint / FaceID to authorize'
                      : 'Biometrics unavailable'),
                  trailing: Switch(
                    value: securityProvider.useBiometrics && securityProvider.isBiometricSupported,
                    onChanged: securityProvider.isBiometricSupported
                        ? (val) => _toggleBiometrics(val, securityProvider)
                        : null,
                  ),
                ),

                
                // Change Password
                ListTile(
                  leading: const Icon(Icons.lock_outline_rounded, color: Color(0xFF4F46E5)),
                  title: const Text('Change Password', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update account login password'),
                  trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                  onTap: () => _navigateToVerificationFlow(false),
                ),


                // Change Pin
                ListTile(
                  leading: const Icon(Icons.dialpad_rounded, color: Color(0xFF4F46E5)),
                  title: const Text('Change Transaction PIN', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update 6-digit transaction authorization code'),
                  trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                  onTap: () => _navigateToVerificationFlow(true),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Section: Admin Management
          if (authProvider.isAdmin) ...[
            _buildSectionHeader('Admin Management Portal', isDark),
            const SizedBox(height: 12),
            Container(
              decoration: _buildCardDecoration(isDark),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.admin_panel_settings_rounded, color: Color(0xFF4F46E5)),
                    title: Text(authProvider.isSuperAdmin ? 'Super Admin Portal Dashboard' : 'Admin Portal Dashboard', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Manage overview stats, users, deposits & P2P accounts'),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AdminPortalPage()),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.person_add_alt_1_outlined, color: Color(0xFF10B981)),
                    title: const Text('Create User Account', style: TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(authProvider.isSuperAdmin
                        ? 'Create User, Admin, or Super Admin'
                        : 'Create regular User account'),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const CreateUserPage()),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
          ],

          // Section: About App
          _buildSectionHeader('App Information', isDark),
          const SizedBox(height: 12),
          Container(
            decoration: _buildCardDecoration(isDark),
            child: const Column(
              children: [
                ListTile(
                  leading: Icon(Icons.info_outline_rounded, color: Color(0xFF4F46E5)),
                  title: Text('App Version', style: TextStyle(fontWeight: FontWeight.bold)),
                  trailing: Text(
                    '1.0.0',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                ),

                ListTile(
                  leading: Icon(Icons.verified_user_outlined, color: Color(0xFF4F46E5)),
                  title: Text('Developer', style: TextStyle(fontWeight: FontWeight.bold)),
                  trailing: Text(
                    'RJN',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 48),

          // Logout Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: () async {
                await authProvider.logout();
                if (mounted) {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              },
              icon: const Icon(Icons.logout_rounded, color: Colors.white),
              label: const Text(
                'Log Out',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4.0),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.0,
          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
        ),
      ),
    );
  }

  BoxDecoration _buildCardDecoration(bool isDark) {
    return BoxDecoration(
      color: isDark ? const Color(0xFF1E293B) : Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(
        color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
      ),
    );
  }
}

// Sub Page for sending Email verification and updating password/pin
class ChangeCredentialVerificationPage extends StatefulWidget {
  final bool isPinChange;

  const ChangeCredentialVerificationPage({super.key, required this.isPinChange});

  @override
  State<ChangeCredentialVerificationPage> createState() => _ChangeCredentialVerificationPageState();
}

class _ChangeCredentialVerificationPageState extends State<ChangeCredentialVerificationPage> {
  final _formKeyOtp = GlobalKey<FormState>();
  final _formKeyTarget = GlobalKey<FormState>();

  final List<TextEditingController> _otpControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(6, (_) => FocusNode());

  final _newValController = TextEditingController();
  final _confirmValController = TextEditingController();

  bool _obscureNewVal = true;
  bool _obscureConfirmVal = true;

  int _step = 0; // 0: send code & input OTP, 1: input new credentials
  bool _isSendingOtp = false;

  @override
  void initState() {
    super.initState();
    // Auto-trigger OTP send on entry
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _sendOtpCode();
    });
  }

  @override
  void dispose() {
    for (var c in _otpControllers) {
      c.dispose();
    }
    for (var f in _otpFocusNodes) {
      f.dispose();
    }
    _newValController.dispose();
    _confirmValController.dispose();
    super.dispose();
  }

  Future<void> _sendOtpCode() async {
    setState(() {
      _isSendingOtp = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.sendUpdateOtp();

    if (mounted) {
      setState(() {
        _isSendingOtp = false;
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('Verification code sent to your registered email.'),
          ),
        );
        _otpFocusNodes[0].requestFocus();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Failed to send verification code'),
          ),
        );
      }
    }
  }

  Future<void> _verifyOtp() async {
    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    if (otpCode.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the full 6-digit code.')),
      );
      return;
    }

    // Move to next step (actual update logic validates OTP on submit to prevent unauthorized calls)
    setState(() {
      _step = 1;
    });
  }

  Future<void> _submitChange() async {
    if (!_formKeyTarget.currentState!.validate()) return;

    final otpCode = _otpControllers.map((c) => c.text.trim()).join();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    bool success = false;
    if (widget.isPinChange) {
      success = await authProvider.changePin(
        otpCode: otpCode,
        newPin: _newValController.text.trim(),
      );
    } else {
      success = await authProvider.changePassword(
        otpCode: otpCode,
        newPassword: _newValController.text,
      );
    }

    if (mounted) {
      if (success) {
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
            content: Text(widget.isPinChange
                ? 'Transaction PIN updated successfully!'
                : 'Account password changed successfully!'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop(); // pop dialog
                  Navigator.of(context).pop(); // pop verification screen
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(authProvider.errorMessage ?? 'Update failed. Check your verification code.'),
          ),
        );
      }
    }
  }

  Widget _buildOtpBox(int index, bool isDark, ThemeData theme) {
    final isFocused = _otpFocusNodes[index].hasFocus;
    final hasValue = _otpControllers[index].text.isNotEmpty;

    return Container(
      width: 44,
      height: 54,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isFocused
              ? theme.primaryColor
              : hasValue
                  ? const Color(0xFF10B981)
                  : isDark
                      ? const Color(0xFF475569)
                      : const Color(0xFFCBD5E1),
          width: isFocused ? 2 : 1.5,
        ),
      ),
      child: TextField(
        controller: _otpControllers[index],
        focusNode: _otpFocusNodes[index],
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 1,
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: isDark ? Colors.white : const Color(0xFF0F172A),
        ),
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(1),
        ],
        onChanged: (val) {
          setState(() {});
          if (val.isNotEmpty && index < 5) {
            _otpFocusNodes[index + 1].requestFocus();
          }
          if (val.isEmpty && index > 0) {
            _otpFocusNodes[index - 1].requestFocus();
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
    final authProvider = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF000000) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(widget.isPinChange ? 'Change PIN' : 'Change Password'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _step == 0 ? 'Verify Identity' : 'Set New Value',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _step == 0
                    ? 'We have sent a 6-digit OTP verification code to your registered email address.'
                    : (widget.isPinChange
                        ? 'Enter and confirm your new 6-digit Transaction PIN.'
                        : 'Enter and confirm your new account login password.'),
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 40),

              // STEP 0: OTP INPUT
              if (_step == 0) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(6, (index) => _buildOtpBox(index, isDark, theme)),
                ),
                const SizedBox(height: 40),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isSendingOtp ? null : _sendOtpCode,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: _isSendingOtp
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('Resend Code'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _verifyOtp,
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

              // STEP 1: CHANGE VALUE
              if (_step == 1)
                Form(
                  key: _formKeyTarget,
                  child: Column(
                    children: [
                      if (widget.isPinChange) ...[
                        TextFormField(
                          controller: _newValController,
                          keyboardType: TextInputType.number,
                          obscureText: _obscureNewVal,
                          maxLength: 6,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          decoration: InputDecoration(
                            labelText: 'Create 6-digit PIN',
                            prefixIcon: const Icon(Icons.dialpad_rounded),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            counterText: '',
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureNewVal ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureNewVal = !_obscureNewVal;
                                });
                              },
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.length != 6 || int.tryParse(value) == null) {
                              return 'PIN must be exactly 6 digits';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 18),
                        TextFormField(
                          controller: _confirmValController,
                          keyboardType: TextInputType.number,
                          obscureText: _obscureConfirmVal,
                          maxLength: 6,
                          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                          decoration: InputDecoration(
                            labelText: 'Confirm 6-digit PIN',
                            prefixIcon: const Icon(Icons.dialpad_rounded),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            counterText: '',
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmVal ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureConfirmVal = !_obscureConfirmVal;
                                });
                              },
                            ),
                          ),
                          validator: (value) {
                            if (value != _newValController.text) {
                              return 'PINs do not match';
                            }
                            return null;
                          },
                        ),
                      ] else ...[
                        TextFormField(
                          controller: _newValController,
                          obscureText: _obscureNewVal,
                          decoration: InputDecoration(
                            labelText: 'New Password',
                            prefixIcon: const Icon(Icons.lock_outline_rounded),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureNewVal ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureNewVal = !_obscureNewVal;
                                });
                              },
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Password is required';
                            if (value.length < 6) return 'Password must be at least 6 characters';
                            return null;
                          },
                        ),
                        const SizedBox(height: 18),
                        TextFormField(
                          controller: _confirmValController,
                          obscureText: _obscureConfirmVal,
                          decoration: InputDecoration(
                            labelText: 'Confirm Password',
                            prefixIcon: const Icon(Icons.lock_reset_rounded),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirmVal ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureConfirmVal = !_obscureConfirmVal;
                                });
                              },
                            ),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Confirm password';
                            if (value != _newValController.text) return 'Passwords do not match';
                            return null;
                          },
                        ),
                      ],
                      const SizedBox(height: 40),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: authProvider.isLoading ? null : _submitChange,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.primaryColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: authProvider.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                )
                              : const Text('Update Security', style: TextStyle(fontWeight: FontWeight.bold)),
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
