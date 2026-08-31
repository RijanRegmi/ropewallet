import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/network/api_client.dart';
import '../../../core/security/secure_storage_service.dart';
import '../presentation/widgets/pin_code_dialog.dart';

class SecurityProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final LocalAuthentication _localAuth = LocalAuthentication();
  final _secureStorage = SecureStorageService.instance;

  bool _isBiometricSupported = false;
  bool _useBiometricsForLogin = false;
  bool _useBiometricsForPin = false;
  bool _hasPromptedBiometrics = false;
  bool _isLoading = false;
  String? _errorMessage;
  String? _currentUserId;

  bool get isBiometricSupported => _isBiometricSupported;
  bool get useBiometricsForLogin => _useBiometricsForLogin;
  bool get useBiometricsForPin => _useBiometricsForPin;
  bool get useBiometrics => _useBiometricsForLogin || _useBiometricsForPin;
  bool get hasPromptedBiometrics => _hasPromptedBiometrics;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  SecurityProvider() {
    loadUserSecuritySettings(null);
  }

  // Load user-scoped biometric security settings
  Future<void> loadUserSecuritySettings(String? userId) async {
    _currentUserId = userId;
    try {
      final isSupported = await _localAuth.isDeviceSupported();
      final canCheck = await _localAuth.canCheckBiometrics;
      _isBiometricSupported = isSupported && canCheck;

      final prefs = await SharedPreferences.getInstance();

      final String loginKey = userId != null ? 'use_biometrics_login_$userId' : 'use_biometrics_login';
      final String pinKey = userId != null ? 'use_biometrics_pin_$userId' : 'use_biometrics_pin';
      final String promptedKey = userId != null ? 'has_prompted_biometrics_$userId' : 'has_prompted_biometrics';

      if (prefs.containsKey(loginKey)) {
        _useBiometricsForLogin = prefs.getBool(loginKey) ?? false;
      } else {
        _useBiometricsForLogin = prefs.getBool('use_biometrics_login') ?? prefs.getBool('use_biometrics') ?? false;
      }

      if (prefs.containsKey(pinKey)) {
        _useBiometricsForPin = prefs.getBool(pinKey) ?? false;
      } else {
        _useBiometricsForPin = prefs.getBool('use_biometrics_pin') ?? prefs.getBool('use_biometrics') ?? false;
      }

      _hasPromptedBiometrics = prefs.getBool(promptedKey) ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('Biometrics initialization error: $e');
    }
  }

  // Reset runtime biometric state on user logout
  Future<void> resetOnLogout() async {
    _currentUserId = null;
    _useBiometricsForLogin = false;
    _useBiometricsForPin = false;
    _hasPromptedBiometrics = false;
    notifyListeners();
  }

  // Toggle biometric for Login
  Future<void> setUseBiometricsForLogin(bool value) async {
    _useBiometricsForLogin = value;
    final prefs = await SharedPreferences.getInstance();
    if (_currentUserId != null) {
      await prefs.setBool('use_biometrics_login_$_currentUserId', value);
    }
    await prefs.setBool('use_biometrics_login', value);
    await prefs.setBool('use_biometrics', _useBiometricsForLogin || _useBiometricsForPin);
    notifyListeners();
  }

  // Toggle biometric for Transaction PIN
  Future<void> setUseBiometricsForPin(bool value) async {
    _useBiometricsForPin = value;
    final prefs = await SharedPreferences.getInstance();
    if (_currentUserId != null) {
      await prefs.setBool('use_biometrics_pin_$_currentUserId', value);
    }
    await prefs.setBool('use_biometrics_pin', value);
    await prefs.setBool('use_biometrics', _useBiometricsForLogin || _useBiometricsForPin);
    notifyListeners();
  }

  // Legacy single toggle (updates both)
  Future<void> setUseBiometrics(bool value) async {
    await setUseBiometricsForLogin(value);
    await setUseBiometricsForPin(value);
  }

  Future<void> setHasPromptedBiometrics(bool value) async {
    _hasPromptedBiometrics = value;
    final prefs = await SharedPreferences.getInstance();
    if (_currentUserId != null) {
      await prefs.setBool('has_prompted_biometrics_$_currentUserId', value);
    }
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
        localizedReason: 'Authenticate to authorize your RopeWallet action',
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

  // Set 6-Digit Transaction PIN on backend
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
    // 1. Try Biometrics ONLY if _useBiometricsForPin is enabled
    if (_useBiometricsForPin && _isBiometricSupported) {
      final bioSuccess = await authenticateBiometrically();
      if (bioSuccess) {
        final savedPin = await getSavedPin();
        return savedPin ?? 'biometric_authenticated';
      }
    }

    // 2. Security PIN Authorization Modal Sheet (without auto-prompting biometric again)
    final String subtitleText = amount > 0
        ? 'Confirm PIN to ${actionName.replaceAll('Authorize ', '').toLowerCase()} (\$${amount.toStringAsFixed(2)})'
        : 'Confirm PIN to ${actionName.replaceAll('Authorize ', '').toLowerCase()}';

    final String? enteredPin = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => PinCodeDialog(
        title: 'Enter Transaction PIN',
        subtitle: subtitleText,
      ),
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
