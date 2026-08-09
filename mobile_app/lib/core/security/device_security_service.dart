import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class DeviceSecurityService {
  static final DeviceSecurityService _instance = DeviceSecurityService._internal();
  factory DeviceSecurityService() => _instance;
  DeviceSecurityService._internal();

  static const String _deviceIdKey = 'ropewallet_secure_device_id';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  String? _cachedDeviceId;

  /// Get persistent unique device ID for this physical device / app installation
  Future<String> getDeviceId() async {
    if (_cachedDeviceId != null && _cachedDeviceId!.isNotEmpty) {
      return _cachedDeviceId!;
    }

    try {
      String? savedId = await _storage.read(key: _deviceIdKey);
      if (savedId == null || savedId.trim().isEmpty) {
        final rand = Random.secure();
        final randomPart = List.generate(16, (_) => rand.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
        savedId = 'DEV-${DateTime.now().millisecondsSinceEpoch}-$randomPart';
        await _storage.write(key: _deviceIdKey, value: savedId);
      }
      _cachedDeviceId = savedId;
      return savedId;
    } catch (e) {
      // Fallback if secure storage error occurs
      final fallbackId = 'DEV-FALLBACK-${DateTime.now().millisecondsSinceEpoch}';
      _cachedDeviceId = fallbackId;
      return fallbackId;
    }
  }
}
