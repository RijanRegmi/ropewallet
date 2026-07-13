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
  bool _isLoading = false;
  String? _errorMessage;

  bool get isBiometricSupported => _isBiometricSupported;
  bool get useBiometrics => _useBiometrics;
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
}
