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
    final token = await _secureStorage.read(key: 'auth_token');
    if (token == null) return;

    _token = token;
    
    // Fetch profile from backend to verify token validity
    try {
      final response = await _apiClient.get(ApiConstants.profile);
      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        _user = responseData['data'];
        notifyListeners();
      } else {
        // Token is invalid/expired
        await logout();
      }
    } catch (e) {
      // Offline or server down; keep stored state or log out? We keep it for offline visual check but we don't block.
      _errorMessage = 'Could not reach server. Working offline.';
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

  Future<bool> register(String fullName, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.register,
        {
          'fullName': fullName,
          'email': email,
          'password': password,
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

  Future<void> logout() async {
    _token = null;
    _user = null;
    await _secureStorage.delete(key: 'auth_token');
    notifyListeners();
  }
}
