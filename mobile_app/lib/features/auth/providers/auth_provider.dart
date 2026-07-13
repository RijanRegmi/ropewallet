import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';

class AuthProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  static const _secureStorage = FlutterSecureStorage();
  
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _token != null;

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Load saved token and user on startup
  Future<void> tryAutoLogin() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _secureStorage.read(key: 'auth_token');
      if (token == null) {
        _isLoading = false;
        notifyListeners();
        return;
      }

      _token = token;
      notifyListeners(); // Redirect immediately if token is present
      
      // Fetch profile from backend to verify token validity in background
      final response = await _apiClient.get(ApiConstants.profile);
      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        _user = responseData['data'];
      } else {
        // Token is invalid/expired
        await logout();
      }
    } catch (e) {
      _errorMessage = 'Could not reach server. Working offline.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.login,
        {
          'email': email,
          'password': password,
        },
      );

      final responseData = jsonDecode(response.body);
      
      if (response.statusCode == 200 && responseData['success'] == true) {
        _token = responseData['data']['token'];
        _user = responseData['data']['user'];
        
        await _secureStorage.write(key: 'auth_token', value: _token!);
        // Save credentials for biometric login
        await _secureStorage.write(key: 'saved_email', value: email);
        await _secureStorage.write(key: 'saved_password', value: password);
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to login';
        _isLoading = false;
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

  // Check User Tag Availability
  Future<bool> checkUserTagAvailability(String userTag) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.checkUserTag}?userTag=${Uri.encodeComponent(userTag)}',
      );
      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return responseData['available'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Send Register OTP Email
  Future<bool> sendRegisterOtp(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.sendRegisterOtp,
        {
          'email': email,
        },
      );

      final responseData = jsonDecode(response.body);

      _isLoading = false;
      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to send OTP';
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

  // Verify Register OTP
  Future<bool> verifyRegisterOtp(String email, String otpCode) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/verify-register-otp',
        {
          'email': email,
          'otpCode': otpCode,
        },
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Invalid or expired verification code';
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

  // Register with OTP Verification
  Future<bool> registerWithOtp({
    required String firstName,
    String? middleName,
    required String lastName,
    required String userTag,
    required String email,
    required String password,
    required String phoneNumber,
    required String otpCode,
    required String transactionPin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.register,
        {
          'firstName': firstName,
          'middleName': middleName,
          'lastName': lastName,
          'userTag': userTag,
          'email': email,
          'password': password,
          'phoneNumber': phoneNumber,
          'otpCode': otpCode,
          'transactionPin': transactionPin,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201 && responseData['success'] == true) {
        _token = responseData['data']['token'];
        _user = responseData['data']['user'];

        await _secureStorage.write(key: 'auth_token', value: _token!);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to register';
        _isLoading = false;
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

  // Send Forgot Password OTP
  Future<bool> sendForgotPasswordOtp(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.forgotPassword,
        {
          'email': email,
        },
      );

      final responseData = jsonDecode(response.body);

      _isLoading = false;
      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to send OTP';
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

  // Verify Forgot Password OTP
  Future<bool> verifyForgotPasswordOtp({
    required String email,
    required String otpCode,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/verify-forgot-password-otp',
        {
          'email': email,
          'otpCode': otpCode,
        },
      );

      final responseData = jsonDecode(response.body);

      _isLoading = false;
      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Invalid verification code';
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

  // Reset Password using OTP Verification
  Future<bool> resetPasswordWithOtp({
    required String email,
    required String otpCode,
    required String newPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.resetPassword,
        {
          'email': email,
          'otpCode': otpCode,
          'newPassword': newPassword,
        },
      );

      final responseData = jsonDecode(response.body);

      _isLoading = false;
      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to reset password';
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

  Future<bool> updateProfileImage(String profileImage) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/update-profile-image',
        {
          'profileImage': profileImage,
        },
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        if (_user != null) {
          _user!['profileImage'] = profileImage;
        }
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to update profile image';
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

  Future<bool> sendUpdateOtp() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/auth/send-update-otp', {});
      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to send OTP code';
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

  Future<bool> changePassword({
    required String otpCode,
    required String newPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/change-password',
        {
          'otpCode': otpCode,
          'newPassword': newPassword,
        },
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to change password';
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

  Future<bool> changePin({
    required String otpCode,
    required String newPin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        '/auth/change-pin',
        {
          'otpCode': otpCode,
          'newPin': newPin,
        },
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        if (_user != null) {
          _user!['hasPin'] = true;
        }
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to change PIN';
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

  Future<void> logout() async {
    _token = null;
    _user = null;
    await _secureStorage.delete(key: 'auth_token');
    notifyListeners();
  }
}
