import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../../core/network/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../auth/providers/auth_provider.dart';

class WalletProvider with ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  
  List<dynamic> _transactions = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _isBalanceHidden = true;

  List<dynamic> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isBalanceHidden => _isBalanceHidden;

  void toggleBalanceVisibility() {
    _isBalanceHidden = !_isBalanceHidden;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Fetch transaction history
  Future<void> fetchTransactions() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get(ApiConstants.transactions);
      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        _transactions = responseData['data'];
      } else {
        _errorMessage = responseData['error'] ?? 'Failed to fetch transactions';
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Deposit funds via Stripe (REST API integration)
  Future<bool> deposit({
    required double amount,
    required String cardNumber,
    required String expMonth,
    required String expYear,
    required String cvc,
    required AuthProvider authProvider,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // 1. Create PaymentMethod directly via Stripe's REST API
      final stripeUrl = Uri.parse('https://api.stripe.com/v1/payment_methods');
      final stripeResponse = await http.post(
        stripeUrl,
        headers: {
          'Authorization': 'Bearer ${ApiConstants.stripePublishableKey}',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          'type': 'card',
          'card[number]': cardNumber.replaceAll(' ', ''),
          'card[exp_month]': expMonth,
          'card[exp_year]': expYear,
          'card[cvc]': cvc,
        },
      );

      final stripeData = jsonDecode(stripeResponse.body);
      if (stripeResponse.statusCode != 200) {
        final errorMsg = stripeData['error']?['message'] ?? 'Stripe tokenization failed';
        _errorMessage = errorMsg;
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final String paymentMethodId = stripeData['id'];

      // 2. Send the PaymentMethod ID to the backend to complete the deposit
      final response = await _apiClient.post(
        ApiConstants.deposit,
        {
          'amount': amount,
          'paymentMethodId': paymentMethodId,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        // Refresh User profile to get updated balance
        await authProvider.tryAutoLogin();
        // Refresh transaction log
        await fetchTransactions();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Deposit failed';
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

  // Create Stripe Checkout Session link
  Future<String?> createCheckoutSession({
    required double amount,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.checkout,
        {
          'amount': amount,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        _isLoading = false;
        notifyListeners();
        return responseData['checkoutUrl'] as String?;
      } else {
        _errorMessage = responseData['error'] ?? 'Checkout link creation failed';
        _isLoading = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Withdraw to Chime Debit Card or Bank Account via Payouts
  Future<bool> withdraw({
    required double amount,
    required String method,
    required AuthProvider authProvider,
    String? cardNumber,
    int? expMonth,
    int? expYear,
    String? cvc,
    String? routingNumber,
    String? accountNumber,
    String? bankName,
    String? accountHolderName,
    String? recipientTag,
    String? pin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.withdraw,
        {
          'amount': amount,
          'method': method,
          'cardNumber': cardNumber,
          'expMonth': expMonth,
          'expYear': expYear,
          'cvc': cvc,
          'routingNumber': routingNumber,
          'accountNumber': accountNumber,
          'bankName': bankName,
          'accountHolderName': accountHolderName,
          'recipientTag': recipientTag,
          'pin': pin,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        // Refresh User profile to get updated balance
        await authProvider.tryAutoLogin();
        // Refresh transaction log
        await fetchTransactions();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Withdrawal failed';
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

  // Transfer wallet balance with 15% fee cut
  Future<bool> transfer({
    required String receiverQrData,
    required double amount,
    required AuthProvider authProvider,
    String? remarks,
    String? pin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.transfer,
        {
          'receiverQrData': receiverQrData,
          'amount': amount,
          'remarks': remarks,
          'pin': pin,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        // Refresh User profile to get updated balance
        await authProvider.tryAutoLogin();
        // Refresh transaction log
        await fetchTransactions();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Transfer failed';
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
}
