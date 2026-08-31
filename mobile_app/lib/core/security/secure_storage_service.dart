import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Hardened singleton service wrapping FlutterSecureStorage to prevent
/// BadPaddingException, KeyStore decryption failures, and Android backup sync issues.
class SecureStorageService {
  SecureStorageService._internal();
  static final SecureStorageService instance = SecureStorageService._internal();

  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
      resetOnError: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock,
    ),
  );

  /// Safe read: Returns null if key does not exist or if decryption fails.
  /// Automatically resets corrupted storage if a BadPadding / KeyStore exception is thrown.
  Future<String?> read({required String key}) async {
    try {
      return await _storage.read(key: key);
    } catch (e, stackTrace) {
      debugPrint('[SecureStorageService] Read error for key "$key": $e');
      debugPrint('[SecureStorageService] StackTrace: $stackTrace');
      // Attempt self-healing reset for this corrupted key or whole storage
      try {
        await _storage.delete(key: key);
      } catch (_) {
        try {
          await _storage.deleteAll();
        } catch (_) {}
      }
      return null;
    }
  }

  /// Safe write: writes key-value pair, catches and recovers from any platform storage errors.
  Future<void> write({required String key, required String value}) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e, stackTrace) {
      debugPrint('[SecureStorageService] Write error for key "$key": $e');
      debugPrint('[SecureStorageService] StackTrace: $stackTrace');
      // Attempt recovery by deleting corrupt entry and retrying once
      try {
        await _storage.delete(key: key);
        await _storage.write(key: key, value: value);
      } catch (retryError) {
        debugPrint('[SecureStorageService] Recovery write failed: $retryError');
      }
    }
  }

  /// Safe delete
  Future<void> delete({required String key}) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      debugPrint('[SecureStorageService] Delete error for key "$key": $e');
    }
  }

  /// Safe deleteAll
  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      debugPrint('[SecureStorageService] DeleteAll error: $e');
    }
  }

  /// Safe containsKey
  Future<bool> containsKey({required String key}) async {
    try {
      return await _storage.containsKey(key: key);
    } catch (e) {
      debugPrint('[SecureStorageService] ContainsKey error for key "$key": $e');
      return false;
    }
  }
}
