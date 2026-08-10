import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';

class NoticeProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();

  List<dynamic> _notices = [];
  bool _isLoading = false;
  bool _hasLoadedOnce = false;
  String? _errorMessage;

  List<dynamic> get notices => _notices;
  bool get isLoading => _isLoading;
  bool get hasLoadedOnce => _hasLoadedOnce;
  String? get errorMessage => _errorMessage;

  int get unreadCount => _notices.where((n) => n['isRead'] != true).length;

  // Pre-fetch or refresh notices (instant render from cache if already loaded)
  Future<void> fetchNotices({bool silent = false}) async {
    if (!_hasLoadedOnce && !silent) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final res = await _apiClient.get('/notices');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['data'] != null) {
          _notices = data['data'];
          _hasLoadedOnce = true;
          _isLoading = false;
          notifyListeners();
          return;
        }
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      _hasLoadedOnce = true;
      notifyListeners();
    }
  }

  // Mark notice as read instantly in local state and sync to server in background
  Future<void> markNoticeAsRead(String noticeId) async {
    final index = _notices.indexWhere((n) => n['_id'] == noticeId);
    if (index != -1) {
      _notices[index]['isRead'] = true;
      notifyListeners();
    }
    try {
      await _apiClient.post('/notices/$noticeId/read', {});
    } catch (_) {}
  }

  void reset() {
    _notices = [];
    _isLoading = false;
    _hasLoadedOnce = false;
    _errorMessage = null;
    notifyListeners();
  }
}
