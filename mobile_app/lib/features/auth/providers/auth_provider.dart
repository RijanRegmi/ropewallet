import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../home/providers/wallet_provider.dart';

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
  String get role => _user?['role'] ?? 'customer';
  bool get isAdmin => role == 'host' || role == 'admin' || role == 'superadmin';
  bool get isHost => role == 'host' || role == 'admin';
  bool get isSuperAdmin => role == 'superadmin';
  bool get isCustomer => role == 'customer' || role == 'user';

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void markPinAsSet() {
    if (_user != null) {
      _user!['hasPin'] = true;
      notifyListeners();
    }
  }

  // Load saved token and user on startup
  Future<void> tryAutoLogin() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _secureStorage.read(key: 'auth_token');
      if (token == null) {
        _token = null;
        _user = null;
        _isLoading = false;
        notifyListeners();
        return;
      }

      _token = token;
      
      // Immediately restore cached profile for instant screen render
      try {
        final cachedStr = await _secureStorage.read(key: 'cached_user_profile');
        if (cachedStr != null && cachedStr.isNotEmpty) {
          _user = jsonDecode(cachedStr);
        }
      } catch (_) {}

      // Fetch fresh profile from backend with 3s timeout
      try {
        final response = await _apiClient.get(ApiConstants.profile).timeout(
          const Duration(seconds: 3),
        );
        if (response.statusCode == 200) {
          final responseData = jsonDecode(response.body);
          _user = responseData['data'];
          await _secureStorage.write(key: 'cached_user_profile', value: jsonEncode(_user));
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          // Token is explicitly rejected/expired by server
          _token = null;
          _user = null;
          await _secureStorage.delete(key: 'auth_token');
          await _secureStorage.delete(key: 'cached_user_profile');
        }
      } catch (_) {
        // Working offline or network timed out — preserve token & cached user
        _errorMessage = 'Working offline';
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password, {WalletProvider? walletProvider}) async {
    _isLoading = true;
    _errorMessage = null;
    // Wipe previous user session immediately to prevent state leaking
    _user = null;
    _token = null;
    walletProvider?.reset();
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
        await _secureStorage.write(key: 'cached_user_profile', value: jsonEncode(_user));
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

  // Check Email Availability
  Future<bool> checkEmailAvailability(String email) async {
    try {
      final response = await _apiClient.get(
        '${ApiConstants.checkEmail}?email=${Uri.encodeComponent(email.trim())}',
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
          await _secureStorage.write(key: 'cached_user_profile', value: jsonEncode(_user));
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

  Future<bool> saveCard({
    required String cardholderName,
    required String cardNumber,
    required String expMonth,
    required String expYear,
    required String cvc,
    required String zipCode,
    required String country,
    required String addressLine1,
    bool differentInvoiceName = false,
    String invoiceName = '',
    String taxId = '',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.saveCard,
        {
          'cardholderName': cardholderName,
          'cardNumber': cardNumber,
          'expMonth': expMonth,
          'expYear': expYear,
          'cvc': cvc,
          'zipCode': zipCode,
          'country': country,
          'addressLine1': addressLine1,
          'differentInvoiceName': differentInvoiceName,
          'invoiceName': invoiceName,
          'taxId': taxId,
        },
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        if (_user != null) {
          _user!['savedCard'] = responseData['data']['savedCard'];
        }
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to save card';
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

  Future<bool> deleteCard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.delete(
        ApiConstants.deleteCard,
      );

      final responseData = jsonDecode(response.body);
      _isLoading = false;

      if (response.statusCode == 200 && responseData['success'] == true) {
        if (_user != null) {
          _user!['savedCard'] = null;
        }
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to delete card';
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

  Future<void> logout({WalletProvider? walletProvider}) async {
    _token = null;
    _user = null;
    _isLoading = false;
    _errorMessage = null;
    await _secureStorage.delete(key: 'auth_token');
    await _secureStorage.delete(key: 'cached_user_profile');
    walletProvider?.reset();
    notifyListeners();
  }

  // Show "Are you sure?" dialog, perform logout, wipe providers, and redirect to LoginPage
  static Future<void> confirmAndLogout(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        final theme = Theme.of(dialogContext);
        final isDark = theme.brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Row(
            children: [
              Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 28),
              SizedBox(width: 12),
              Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          content: const Text(
            'Are you sure you want to log out of your RopeWallet account?',
            style: TextStyle(fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );

    if (confirm == true && context.mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final walletProvider = Provider.of<WalletProvider>(context, listen: false);

      // Pop all dialogs and sub-routes back to root first
      Navigator.of(context).popUntil((route) => route.isFirst);

      // Perform logout & reset state (AuthWrapper will cleanly render LoginPage)
      await authProvider.logout(walletProvider: walletProvider);
    }
  }
}

/// Helper function to robustly construct an ImageProvider for URLs, base64 data URIs, or empty strings.
ImageProvider? getProfileImageProvider(String? urlOrData) {
  if (urlOrData == null || urlOrData.trim().isEmpty) return null;
  final str = urlOrData.trim();
  if (str.startsWith('data:image/')) {
    try {
      final base64Str = str.split(',').last;
      return MemoryImage(base64Decode(base64Str));
    } catch (_) {
      return null;
    }
  } else if (str.startsWith('http://') || str.startsWith('https://')) {
    return NetworkImage(str);
  }
  return null;
}
