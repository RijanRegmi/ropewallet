import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:ropewallet/core/theme/theme_provider.dart';
import 'package:ropewallet/features/auth/providers/auth_provider.dart';
import '../../../../core/network/api_client.dart';
import 'create_user_page.dart';
import '../../../admin/presentation/pages/admin_portal_page.dart';
import '../../providers/security_provider.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  Future<bool> _verifyUserCredentialToEnableBiometrics(BuildContext context, {required bool isPasswordOnly}) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final securityProvider = Provider.of<SecurityProvider>(context, listen: false);

    final TextEditingController inputController = TextEditingController();
    bool isVerifying = false;
    String? errorText;

    final verified = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.shield_rounded, color: Color(0xFF10B981), size: 24),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    isPasswordOnly ? 'Verify Password' : 'Verify Transaction PIN',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isPasswordOnly
                        ? 'To enable Biometric Login, please enter your account password.'
                        : 'To enable Biometric Transaction Authorization, please enter your 6-digit Transaction PIN.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: isDark ? Colors.grey[400] : Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 18),

                  TextField(
                    controller: inputController,
                    obscureText: true,
                    keyboardType: isPasswordOnly ? TextInputType.visiblePassword : TextInputType.number,
                    maxLength: isPasswordOnly ? null : 6,
                    inputFormatters: isPasswordOnly ? null : [FilteringTextInputFormatter.digitsOnly],
                    decoration: InputDecoration(
                      labelText: isPasswordOnly ? 'Account Password' : '6-Digit Transaction PIN',
                      prefixIcon: Icon(
                        isPasswordOnly ? Icons.lock_outline_rounded : Icons.dialpad_rounded,
                        color: const Color(0xFF10B981),
                      ),
                      counterText: '',
                      errorText: errorText,
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.8),
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isVerifying ? null : () => Navigator.of(ctx).pop(false),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                        ),
                        child: Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? Colors.white70 : Colors.grey[700])),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: isVerifying
                            ? null
                            : () async {
                                final text = inputController.text.trim();
                                if (text.isEmpty) {
                                  setDialogState(() {
                                    errorText = isPasswordOnly ? 'Password is required' : 'PIN is required';
                                  });
                                  return;
                                }

                                setDialogState(() {
                                  isVerifying = true;
                                  errorText = null;
                                });

                                bool isValid = false;
                                if (isPasswordOnly) {
                                  try {
                                    final userEmail = authProvider.user?['email'] ?? '';
                                    final res = await ApiClient().post('/auth/login', {
                                      'email': userEmail,
                                      'password': text,
                                    });
                                    final data = jsonDecode(res.body);
                                    isValid = res.statusCode == 200 && data['success'] == true;
                                  } catch (_) {
                                    isValid = false;
                                  }
                                } else {
                                  isValid = await securityProvider.verifyTransactionPin(text);
                                }

                                if (isValid) {
                                  Navigator.of(ctx).pop(true);
                                } else {
                                  setDialogState(() {
                                    isVerifying = false;
                                    errorText = isPasswordOnly ? 'Incorrect password. Try again.' : 'Incorrect PIN. Try again.';
                                  });
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: isVerifying
                            ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Verify', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        );
      },
    );

    return verified == true;
  }

  Future<void> _toggleBiometricsForLogin(bool enable, SecurityProvider securityProvider) async {
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
      final credentialVerified = await _verifyUserCredentialToEnableBiometrics(context, isPasswordOnly: true);
      if (!credentialVerified) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFFEF4444),
              content: Text('Password verification failed. Biometric login not enabled.'),
            ),
          );
        }
        return;
      }

      final bioSuccess = await securityProvider.authenticateBiometrically();
      if (bioSuccess) {
        await securityProvider.setUseBiometricsForLogin(true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('Password verified! Biometric login enabled.'),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFFEF4444),
              content: Text('Biometric sensor scan failed. Could not enable.'),
            ),
          );
        }
      }
    } else {
      await securityProvider.setUseBiometricsForLogin(false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Biometric login disabled.'),
          ),
        );
      }
    }
  }

  Future<void> _toggleBiometricsForPin(bool enable, SecurityProvider securityProvider) async {
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
      final credentialVerified = await _verifyUserCredentialToEnableBiometrics(context, isPasswordOnly: false);
      if (!credentialVerified) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFFEF4444),
              content: Text('PIN verification failed. Biometrics not enabled.'),
            ),
          );
        }
        return;
      }

      final bioSuccess = await securityProvider.authenticateBiometrically();
      if (bioSuccess) {
        await securityProvider.setUseBiometricsForPin(true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('Transaction PIN verified! Biometric for transactions enabled.'),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFFEF4444),
              content: Text('Biometric sensor scan failed. Could not enable.'),
            ),
          );
        }
      }
    } else {
      await securityProvider.setUseBiometricsForPin(false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Biometric for transactions disabled.'),
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
                  leading: const Icon(Icons.brightness_6_outlined, color: Color(0xFF10B981)),
                  title: const Text('Dark Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Toggle between light and dark modes'),
                  trailing: Switch(
                    activeColor: const Color(0xFF10B981),
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
                // 1. Biometric Login Toggle
                ListTile(
                  leading: const Icon(Icons.fingerprint_rounded, color: Color(0xFF10B981)),
                  title: const Text('Biometric Login', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(securityProvider.isBiometricSupported
                      ? 'Use Fingerprint / Face ID for account login'
                      : 'Biometrics unavailable'),
                  trailing: Switch(
                    activeColor: const Color(0xFF10B981),
                    value: securityProvider.useBiometricsForLogin && securityProvider.isBiometricSupported,
                    onChanged: securityProvider.isBiometricSupported
                        ? (val) => _toggleBiometricsForLogin(val, securityProvider)
                        : null,
                  ),
                ),

                // 2. Biometric for Transaction PIN Toggle
                ListTile(
                  leading: const Icon(Icons.shield_outlined, color: Color(0xFF10B981)),
                  title: const Text('Biometric for Transactions', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(securityProvider.isBiometricSupported
                      ? 'Use Fingerprint / Face ID for PIN payment authorization'
                      : 'Biometrics unavailable'),
                  trailing: Switch(
                    activeColor: const Color(0xFF10B981),
                    value: securityProvider.useBiometricsForPin && securityProvider.isBiometricSupported,
                    onChanged: securityProvider.isBiometricSupported
                        ? (val) => _toggleBiometricsForPin(val, securityProvider)
                        : null,
                  ),
                ),

                
                // Change Password
                ListTile(
                  leading: const Icon(Icons.lock_outline_rounded, color: Color(0xFF10B981)),
                  title: const Text('Change Password', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update account login password'),
                  trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                  onTap: () => _navigateToVerificationFlow(false),
                ),


                // Change Pin
                ListTile(
                  leading: const Icon(Icons.dialpad_rounded, color: Color(0xFF10B981)),
                  title: const Text('Change Transaction PIN', style: TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: const Text('Update 6-digit transaction authorization code'),
                  trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                  onTap: () => _navigateToVerificationFlow(true),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Section: Admin Management (Super Admin only)
          if (authProvider.isSuperAdmin) ...[
            _buildSectionHeader('Admin Management Portal', isDark),
            const SizedBox(height: 12),
            Container(
              decoration: _buildCardDecoration(isDark),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.admin_panel_settings_rounded, color: Color(0xFF10B981)),
                    title: Text(authProvider.isSuperAdmin ? 'Super Admin Portal Dashboard' : 'Admin Portal Dashboard', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Manage system users & notices'),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const AdminPortalPage()),
                      );
                    },
                  ),
                  if (authProvider.isSuperAdmin) ...[
                    ListTile(
                      leading: const Icon(Icons.person_add_alt_1_rounded, color: Color(0xFF10B981)),
                      title: const Text('Create New Account', style: TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: const Text('Register user, host, or admin'),
                      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const CreateUserPage()),
                        );
                      },
                    ),
                  ],
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
                  leading: Icon(Icons.info_outline_rounded, color: Color(0xFF10B981)),
                  title: Text('App Version', style: TextStyle(fontWeight: FontWeight.bold)),
                  trailing: Text(
                    '1.0.0',
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                ),

                ListTile(
                  leading: Icon(Icons.verified_user_outlined, color: Color(0xFF10B981)),
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
            height: 56,
            child: ElevatedButton.icon(
              onPressed: () => AuthProvider.confirmAndLogout(context),
              icon: const Icon(Icons.logout_rounded, color: Colors.white),
              label: const Text(
                'Log Out',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                padding: const EdgeInsets.symmetric(vertical: 14),
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
          _verifyOtp();
        }
      }
    }
  }

  Future<void> _sendOtpCode() async {
    setState(() {
      _isSendingOtp = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.sendUpdateOtp(
      type: widget.isPinChange ? 'pin' : 'password',
    );

    if (mounted) {
      setState(() {
        _isSendingOtp = false;
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text('Verification code sent to your email for ${widget.isPinChange ? "Transaction PIN" : "Password"} change.'),
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

  bool _isVerifying = false;

  Future<void> _verifyOtp() async {
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

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user ?? {};
    final email = user['email'] as String? ?? '';

    final success = await authProvider.verifyForgotPasswordOtp(
      email: email,
      otpCode: otpCode,
    );

    if (mounted) {
      setState(() {
        _isVerifying = false;
      });

      if (success) {
        setState(() {
          _step = 1;
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
                _verifyOtp();
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
              _verifyOtp();
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
    final authProvider = Provider.of<AuthProvider>(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final user = authProvider.user ?? {};

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
          widget.isPinChange ? 'Change Transaction PIN' : 'Change Password',
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
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
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
                      _step == 0 ? 'VERIFY IDENTITY' : 'SECURITY UPDATE',
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
                _step == 0 ? 'Verify Security Code' : (widget.isPinChange ? 'Set New PIN' : 'Set New Password'),
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _step == 0
                    ? 'Enter the 6-digit verification code sent to your registered email address.'
                    : (widget.isPinChange
                        ? 'Create and confirm a new 6-digit transaction PIN.'
                        : 'Create and confirm a new account password.'),
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),

              // STEP 0: OTP INPUT
              if (_step == 0) ...[
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
                          'Code sent to ${user["email"] ?? "your email"}',
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
                Row(
                  children: [
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: _isSendingOtp ? null : _sendOtpCode,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                        ),
                        child: _isSendingOtp
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text('Resend Code', style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _verifyOtp,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            elevation: 4,
                            padding: EdgeInsets.zero,
                            shadowColor: const Color(0xFF10B981).withOpacity(0.4),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Row(
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
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                          decoration: InputDecoration(
                            labelText: 'Create 6-digit PIN *',
                            prefixIcon: Icon(Icons.dialpad_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 20),
                            counterText: '',
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
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                          decoration: InputDecoration(
                            labelText: 'Confirm 6-digit PIN *',
                            prefixIcon: Icon(Icons.dialpad_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), size: 20),
                            counterText: '',
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
                        height: 56,
                        child: ElevatedButton(
                          onPressed: authProvider.isLoading ? null : _submitChange,
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
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    Text(
                                      widget.isPinChange ? 'Update Transaction PIN' : 'Update Password',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        height: 1.2,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Icon(Icons.check_circle_outline_rounded, size: 20),
                                  ],
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
