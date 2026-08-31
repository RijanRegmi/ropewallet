import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../security/device_security_service.dart';
import '../security/secure_storage_service.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final _secureStorage = SecureStorageService.instance;

  Future<Map<String, String>> _getHeaders() async {
    final token = await _secureStorage.read(key: 'auth_token');
    final deviceId = await DeviceSecurityService().getDeviceId();
    
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Device-Id': deviceId,
    };

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  Future<http.Response> _intercept(http.Response response) async {
    if (response.statusCode == 401 || response.statusCode == 403) {
      try {
        final body = jsonDecode(response.body);
        if (body['isDeviceRevoked'] == true || 
            (body['error'] != null && 
             (body['error'].toString().toLowerCase().contains('frozen') || 
              body['error'].toString().toLowerCase().contains('logged into on another device') ||
              body['error'].toString().toLowerCase().contains('session terminated')))) {
          await _secureStorage.delete(key: 'auth_token');
          await _secureStorage.delete(key: 'cached_user_profile');
        }
      } catch (_) {}
    }
    return response;
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    
    try {
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
      return _intercept(response);
    } catch (e) {
      throw Exception('Connection failed: Check if server is running ($e)');
    }
  }

  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();

    try {
      final response = await http.get(
        url,
        headers: headers,
      );
      return _intercept(response);
    } catch (e) {
      throw Exception('Connection failed: Check if server is running ($e)');
    }
  }

  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();

    try {
      final response = await http.delete(
        url,
        headers: headers,
      );
      return _intercept(response);
    } catch (e) {
      throw Exception('Connection failed: Check if server is running ($e)');
    }
  }

  Future<http.Response> put(String endpoint, [Map<String, dynamic>? body]) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();

    try {
      final response = await http.put(
        url,
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _intercept(response);
    } catch (e) {
      throw Exception('Connection failed: Check if server is running ($e)');
    }
  }
}
