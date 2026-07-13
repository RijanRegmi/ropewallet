import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/security_provider.dart';
import '../../providers/auth_provider.dart';

class SecuritySettingsSheet extends StatefulWidget {
  const SecuritySettingsSheet({super.key});

  @override
  State<SecuritySettingsSheet> createState() => _SecuritySettingsSheetState();
}

class _SecuritySettingsSheetState extends State<SecuritySettingsSheet> {
  final _pinController1 = TextEditingController();
  final _pinController2 = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  bool _isSettingPin = false;

  @override
  void dispose() {
    _pinController1.dispose();
    _pinController2.dispose();
    super.dispose();
  }

  Future<void> _submitPinSetup() async {
    if (!_formKey.currentState!.validate()) return;

    final securityProvider = Provider.of<SecurityProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final success = await securityProvider.setTransactionPin(_pinController1.text.trim());

    if (mounted) {
      if (success) {
        // Refresh User profile in AuthProvider so hasPin updates!
        await authProvider.tryAutoLogin();

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('Transaction PIN set successfully!'),
          ),
        );
        setState(() {
          _isSettingPin = false;
          _pinController1.clear();
          _pinController2.clear();
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(securityProvider.errorMessage ?? 'Failed to set PIN'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final securityProvider = Provider.of<SecurityProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    
    final user = authProvider.user ?? {};
    final bool hasPinSet = user['hasPin'] == true;

    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 24),

          const Text(
            'Security Settings',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            'Manage your PIN code and Biometrics verification.',
            style: TextStyle(fontSize: 13, color: isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
          const SizedBox(height: 24),

          if (!_isSettingPin) ...[
            // PIN status option
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: theme.primaryColor.withOpacity(0.15),
                child: Icon(Icons.dialpad_rounded, color: theme.primaryColor),
              ),
              title: const Text('Transaction PIN', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(hasPinSet ? 'PIN protection is active' : 'PIN protection is disabled'),
              trailing: OutlinedButton(
                onPressed: () {
                  setState(() {
                    _isSettingPin = true;
                  });
                },
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(hasPinSet ? 'Reset PIN' : 'Set PIN'),
              ),
            ),
            const Divider(height: 32),

            // Biometrics Toggle
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: theme.primaryColor.withOpacity(0.15),
                child: Icon(Icons.fingerprint_rounded, color: theme.primaryColor),
              ),
              title: const Text('Biometric Authentication', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Use FaceID/Fingerprint for PIN verification'),
              trailing: Switch(
                value: securityProvider.useBiometrics && securityProvider.isBiometricSupported,
                onChanged: securityProvider.isBiometricSupported
                    ? (value) => securityProvider.setUseBiometrics(value)
                    : null,
              ),
            ),
            if (!securityProvider.isBiometricSupported) ...[
              const SizedBox(height: 8),
              const Text(
                'Biometrics are not supported or registered on this device.',
                style: TextStyle(color: Colors.grey, fontSize: 12, fontStyle: FontStyle.italic),
              ),
            ],
          ] else ...[
            // PIN set form
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasPinSet ? 'Change Transaction PIN' : 'Create Transaction PIN',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _pinController1,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: InputDecoration(
                      labelText: 'Enter 4-digit PIN',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      counterText: '',
                    ),
                    validator: (value) {
                      if (value == null || value.length != 4 || int.tryParse(value) == null) {
                        return 'PIN must be exactly 4 digits';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _pinController2,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 4,
                    decoration: InputDecoration(
                      labelText: 'Confirm 4-digit PIN',
                      prefixIcon: const Icon(Icons.lock_outline_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      counterText: '',
                    ),
                    validator: (value) {
                      if (value != _pinController1.text) {
                        return 'PINs do not match';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _isSettingPin = false;
                            });
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: securityProvider.isLoading ? null : _submitPinSetup,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: securityProvider.isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : const Text('Save PIN', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
