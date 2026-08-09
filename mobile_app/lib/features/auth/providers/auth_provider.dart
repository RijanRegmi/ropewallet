import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:provider/provider.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../home/providers/wallet_provider.dart';
import '../presentation/pages/login_page.dart';

class AuthProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  static const _secureStorage = FlutterSecureStorage();
  
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isAutoLoggingIn = true;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAutoLoggingIn => _isAutoLoggingIn;
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

  void updateWalletBalance(double newBalance, [double? newPendingCashout]) {
    if (_user != null) {
      _user!['walletBalance'] = newBalance;
      if (newPendingCashout != null) {
        _user!['pendingCashoutBalance'] = newPendingCashout;
      }
      try {
        _secureStorage.write(key: 'cached_user_profile', value: jsonEncode(_user));
      } catch (_) {}
      notifyListeners();
    }
  }

  // Load saved token and user on startup with instant local cache render
  Future<void> tryAutoLogin() async {
    _isAutoLoggingIn = true;
    _isLoading = true;

    try {
      final token = await _secureStorage.read(key: 'auth_token');
      if (token != null && token.isNotEmpty) {
        _token = token;
        try {
          final cachedStr = await _secureStorage.read(key: 'cached_user_profile');
          if (cachedStr != null && cachedStr.isNotEmpty) {
            _user = jsonDecode(cachedStr);
          }
        } catch (_) {}
      } else {
        _token = null;
        _user = null;
      }
    } catch (_) {
      _token = null;
      _user = null;
    } finally {
      _isAutoLoggingIn = false;
      _isLoading = false;
      notifyListeners();
    }

    // Refresh user profile asynchronously in background if authenticated
    if (_token != null) {
      try {
        final response = await _apiClient.get(ApiConstants.profile).timeout(
          const Duration(seconds: 3),
        );
        if (response.statusCode == 200) {
          final responseData = jsonDecode(response.body);
          _user = responseData['data'];
          await _secureStorage.write(key: 'cached_user_profile', value: jsonEncode(_user));
          notifyListeners();
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          _token = null;
          _user = null;
          await _secureStorage.delete(key: 'auth_token');
          await _secureStorage.delete(key: 'cached_user_profile');
          notifyListeners();
        }
      } catch (_) {}
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
    required String paymentMethodId, // pm_xxx from Stripe SDK
    required String cardholderName,
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
          'paymentMethodId': paymentMethodId,
          'cardholderName': cardholderName,
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
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                      ),
                      onPressed: () => Navigator.of(dialogContext).pop(false),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: isDark ? Colors.white70 : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: SizedBox(
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.zero,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => Navigator.of(dialogContext).pop(true),
                      child: const Text(
                        'Log Out',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
          actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        );
      },
    );

    if (confirm == true && context.mounted) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final walletProvider = Provider.of<WalletProvider>(context, listen: false);

      // Perform logout & reset state
      await authProvider.logout(walletProvider: walletProvider);

      // Redirect cleanly to LoginPage and clear all navigation stack
      if (context.mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginPage()),
          (route) => false,
        );
      }
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
