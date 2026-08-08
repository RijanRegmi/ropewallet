import 'dart:convert';
import 'package:flutter/material.dart';
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

  // Reset provider state when switching accounts or logging out
  void reset() {
    _transactions = [];
    _isLoading = false;
    _errorMessage = null;
    _isBalanceHidden = true;
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
    String? cardNumber,
    String? expMonth,
    String? expYear,
    String? cvc,
    required AuthProvider authProvider,
    String? remarks,
    bool useSavedCard = false,
    String? pin,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      String cleanCard = '';

      if (!useSavedCard) {
        if (cardNumber == null || expMonth == null || expYear == null || cvc == null) {
          _errorMessage = 'Card details are required';
          _isLoading = false;
          notifyListeners();
          return false;
        }
        cleanCard = cardNumber.replaceAll(' ', '');
        // Card tokenization is handled server-side by the backend.
        // We never send raw card data to the Stripe API from the client.
      }

      // Send card details (or saved card flag) to our backend.
      // The backend handles Stripe tokenization using the secret key.
      final response = await _apiClient.post(
        ApiConstants.deposit,
        {
          'amount': amount,
          if (!useSavedCard) 'cardNumber': cleanCard,
          if (!useSavedCard) 'expMonth': expMonth,
          if (!useSavedCard) 'expYear': expYear,
          if (!useSavedCard) 'cvc': cvc,
          'useSavedCard': useSavedCard,
          'remarks': remarks,
          if (pin != null) 'pin': pin,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        final newBalance = (responseData['data']?['walletBalance'] as num?)?.toDouble();
        if (newBalance != null) {
          authProvider.updateWalletBalance(newBalance);
        } else {
          await authProvider.tryAutoLogin();
        }
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

  // Deposit funds from Bank Account (Routing Number & Account Number)
  Future<bool> bankDeposit({
    required double amount,
    required String routingNumber,
    required String accountNumber,
    required String accountHolderName,
    String? bankName,
    required AuthProvider authProvider,
    String? pin,
    String? remarks,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        ApiConstants.deposit,
        {
          'method': 'bank',
          'amount': amount,
          'routingNumber': routingNumber,
          'accountNumber': accountNumber,
          'accountHolderName': accountHolderName,
          'bankName': bankName,
          if (pin != null) 'pin': pin,
          'remarks': remarks,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        await Future.wait([
          authProvider.tryAutoLogin(),
          fetchTransactions(),
        ]);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = responseData['error'] ?? 'Bank deposit failed';
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
    String? usdtAddress,
    String? pin,
    String? remarks,
    bool useSavedCard = false,
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
          'cardNumber': cardNumber?.replaceAll(' ', ''),
          'expMonth': expMonth,
          'expYear': expYear,
          'cvc': cvc,
          'routingNumber': routingNumber,
          'accountNumber': accountNumber,
          'bankName': bankName,
          'accountHolderName': accountHolderName,
          'recipientTag': recipientTag,
          if (usdtAddress != null) 'usdtAddress': usdtAddress,
          'pin': pin,
          'remarks': remarks,
          'useSavedCard': useSavedCard,
        },
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        // Refresh User profile and transaction log concurrently
        await Future.wait([
          authProvider.tryAutoLogin(),
          fetchTransactions(),
        ]);
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
        // Refresh User profile and transaction log concurrently
        await Future.wait([
          authProvider.tryAutoLogin(),
          fetchTransactions(),
        ]);
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

  // Validate recipient QR code or user tag prior to opening send page or transferring
  Future<Map<String, dynamic>> validateRecipient({required String receiverQrData}) async {
    try {
      final response = await _apiClient.post(
        ApiConstants.validateRecipient,
        {'receiverQrData': receiverQrData},
      );

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {'success': true, 'data': responseData['data']};
      } else {
        final errorMsg = responseData['error'] ?? 'Customer to customer payments are not allowed. You can only send money to a Host account.';
        return {
          'success': false,
          'isCustomerToCustomer': responseData['isCustomerToCustomer'] == true,
          'error': errorMsg,
        };
      }
    } catch (e) {
      return {'success': false, 'error': e.toString().replaceAll('Exception: ', '')};
    }
  }
}
