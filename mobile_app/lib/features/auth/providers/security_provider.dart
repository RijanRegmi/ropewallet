import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../presentation/widgets/pin_code_dialog.dart';

class SecurityProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final LocalAuthentication _localAuth = LocalAuthentication();
  static const _secureStorage = FlutterSecureStorage();

  bool _isBiometricSupported = false;
  bool _useBiometricsForLogin = false;
  bool _useBiometricsForPin = false;
  bool _hasPromptedBiometrics = false;
  bool _isLoading = false;
  String? _errorMessage;

  bool get isBiometricSupported => _isBiometricSupported;
  bool get useBiometricsForLogin => _useBiometricsForLogin;
  bool get useBiometricsForPin => _useBiometricsForPin;
  // Legacy getter for backward compatibility
  bool get useBiometrics => _useBiometricsForLogin || _useBiometricsForPin;
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
      
      // Load independent toggles for Login and PIN
      if (prefs.containsKey('use_biometrics_login')) {
        _useBiometricsForLogin = prefs.getBool('use_biometrics_login') ?? false;
      } else {
        // Migration fallback from legacy single toggle
        _useBiometricsForLogin = prefs.getBool('use_biometrics') ?? false;
      }

      if (prefs.containsKey('use_biometrics_pin')) {
        _useBiometricsForPin = prefs.getBool('use_biometrics_pin') ?? false;
      } else {
        // Migration fallback from legacy single toggle
        _useBiometricsForPin = prefs.getBool('use_biometrics') ?? false;
      }

      _hasPromptedBiometrics = prefs.getBool('has_prompted_biometrics') ?? false;
      notifyListeners();
    } catch (e) {
      debugPrint('Biometrics initialization error: $e');
    }
  }

  // Toggle biometric for Login
  Future<void> setUseBiometricsForLogin(bool value) async {
    _useBiometricsForLogin = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_biometrics_login', value);
    await prefs.setBool('use_biometrics', _useBiometricsForLogin || _useBiometricsForPin);
    notifyListeners();
  }

  // Toggle biometric for Transaction PIN
  Future<void> setUseBiometricsForPin(bool value) async {
    _useBiometricsForPin = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_biometrics_pin', value);
    await prefs.setBool('use_biometrics', _useBiometricsForLogin || _useBiometricsForPin);
    notifyListeners();
  }

  // Legacy single toggle (updates both)
  Future<void> setUseBiometrics(bool value) async {
    _useBiometricsForLogin = value;
    _useBiometricsForPin = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('use_biometrics_login', value);
    await prefs.setBool('use_biometrics_pin', value);
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
