import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class SecurityProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final LocalAuthentication _localAuth = LocalAuthentication();
  static const _secureStorage = FlutterSecureStorage();

  bool _isBiometricSupported = false;
  bool _useBiometrics = false;
  bool _hasPromptedBiometrics = false;
  bool _isLoading = false;
  String? _errorMessage;

  bool get isBiometricSupported => _isBiometricSupported;
  bool get useBiometrics => _useBiometrics;
  bool get hasPromptedBiometrics => _hasPromptedBiometrics;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  SecurityProvider() {
    _initSecuritySettings();
  }

  Future<void> _initSecuritySettings() async {
    try {
      final isSupported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;
      _isBiometricSupported = isSupported && canCheck;

      final prefs = await SharedPreferences.getInstance();
      _useBiometrics = prefs.getBool('use_biometrics') ?? false;
      _hasPromptedBiometrics = prefs.getBool('has_prompted_biometrics') ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('Biometrics initialization error: $e');
    }
  }

  // Toggle biometrics usage
  Future<void> setUseBiometrics(bool value) async {
    _useBiometrics = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_biometrics', value);
    notifyListeners();
  }

  Future<void> setHasPromptedBiometrics(bool value) async {
    _hasPromptedBiometrics = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_prompted_biometrics', value);
    notifyListeners();
  }

  // Retrieve saved PIN securely from keystore/keychain
  Future<String?> getSavedPin() async {
    return await _secureStorage.read(key: 'transaction_pin');
  }

  // Trigger Local FaceID/Fingerprint scan
  Future<bool> authenticateBiometrically() async {
    if (!_isBiometricSupported) return false;

    try {
      return await _localAuth.authenticate(
        localizedReason: 'Authenticate to authorize your RopeWallet transaction',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
    } catch (e) {
      debugPrint('Biometric auth error: $e');
      return false;
    }
  }

  // Set 4-Digit Transaction PIN on backend
  Future<bool> setTransactionPin(String pin) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/set-pin',
        {'pin': pin},
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        await _secureStorage.write(key: 'transaction_pin', value: pin);
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to set transaction PIN';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Verify PIN with backend
  Future<bool> verifyTransactionPin(String pin) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/verify-pin',
        {'pin': pin},
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        final isValid = responseData['valid'] == true;
        if (isValid) {
          await _secureStorage.write(key: 'transaction_pin', value: pin);
        }
        notifyListeners();
        return isValid;
      } else {
        _errorMessage = responseData['error'] ?? 'PIN verification failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> setTransactionPinLocally(String pin) async {
    await _secureStorage.write(key: 'transaction_pin', value: pin);
  }

  // Unified Security Authorization returning authorized 6-digit PIN
  Future<String?> authorizeSecurityWithPin(
    BuildContext context, {
    required String actionName,
    double amount = 0.0,
  }) async {
    // 1. Try Biometrics if enabled
    if (_useBiometrics && _isBiometricSupported) {
      final bioSuccess = await authenticateBiometrically();
      if (bioSuccess) {
        final savedPin = await getSavedPin();
        return savedPin ?? 'biometric_authenticated';
      }
    }

    // 2. Security PIN Authorization Modal Sheet
    final pinController = TextEditingController();
    bool isAuthenticating = false;
    String? pinError;

    final String? enteredPin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final theme = Theme.of(context);
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24,
                left: 24,
                right: 24,
              ),
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: theme.primaryColor.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.shield_outlined, color: theme.primaryColor, size: 24),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(actionName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            if (amount > 0)
                              Text('Amount: \$${amount.toStringAsFixed(2)}', style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx, null),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text('Enter 6-Digit Security PIN to authorize', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 10),
                  TextField(
                    controller: pinController,
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    maxLength: 6,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
                    decoration: InputDecoration(
                      counterText: '',
                      hintText: '••••••',
                      errorText: pinError,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: isAuthenticating
                          ? null
                          : () async {
                              final pin = pinController.text.trim();
                              if (pin.length < 6) {
                                setSheetState(() {
                                  pinError = 'Please enter 6-digit PIN';
                                });
                                return;
                              }
                              setSheetState(() {
                                isAuthenticating = true;
                                pinError = null;
                              });

                              final valid = await verifyTransactionPin(pin);

                              if (valid) {
                                await _secureStorage.write(key: 'transaction_pin', value: pin);
                                Navigator.pop(ctx, pin);
                              } else {
                                setSheetState(() {
                                  isAuthenticating = false;
                                  pinError = _errorMessage ?? 'Incorrect Security PIN';
                                });
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: theme.primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: isAuthenticating
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Authorize & Confirm', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    return enteredPin;
  }

  // Unified Security Authorization returning boolean for legacy callers
  Future<bool> authorizeSecurity(
    BuildContext context, {
    required String actionName,
    double amount = 0.0,
  }) async {
    final pin = await authorizeSecurityWithPin(context, actionName: actionName, amount: amount);
    return pin != null && pin.isNotEmpty;
  }
}
