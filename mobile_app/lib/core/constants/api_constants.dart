import 'dart:io';

class ApiConstants {
  // ================= CONFIGURATION FOR RUNNING THE APP =================
  // 1. Set 'useProduction' to true and update 'productionUrl' with your Vercel URL once deployed.
  // 2. Otherwise, for local development, configure the local settings below.
  static const bool useProduction = true;
  static const String productionUrl = 'https://www.ropewallet.com'; // Live custom domain for RopeWallet

  // Local development settings:
  // - Set 'isTestingOnPhysicalDevice' to true if you are running on a physical device.
  // - Update 'localComputerIp' with your computer's IP address.
  // - Or, paste your ngrok URL in 'ngrokUrl'.
  static const bool isTestingOnPhysicalDevice = true;
  static const String localComputerIp = '192.168.1.7'; // Change to your local IP address
  static const String ngrokUrl = 'https://your-ngrok-tunnel-url.ngrok-free.app'; // Change to your ngrok URL
  static const String stripePublishableKey = 'pk_live_51TsQ96EAXnJUFOnkpg5J6wq4ZNg79gk3lxsdhFDKXk0CPPTS24OYkDf4E4xPnNLc9epU3YA0eoi5cSKXi0iQ5n5900ZKKnbUvY';
  // ====================================================================

  static String get baseUrl {
    if (useProduction && !productionUrl.contains('your-vercel-backend')) {
      return '$productionUrl/api';
    }

    if (ngrokUrl.contains('ngrok-free.app') && !ngrokUrl.contains('your-ngrok-tunnel-url')) {
      return '$ngrokUrl/api';
    }
    
    if (isTestingOnPhysicalDevice) {
      return 'http://$localComputerIp:5000/api';
    }

    // Default configuration for virtual devices / emulators
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api'; // Android Emulator routes to host localhost
    } else {
      return 'http://localhost:5000/api'; // iOS Simulator / Web routes to localhost
    }
  }

  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String profile = '/auth/me';
  static const String checkUserTag = '/auth/check-usertag';
  static const String sendRegisterOtp = '/auth/send-register-otp';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String saveCard = '/auth/save-card';
  static const String deleteCard = '/auth/delete-card';
  
  static const String deposit = '/payments/deposit';
  static const String checkout = '/payments/checkout';
  static const String transfer = '/payments/transfer';
  static const String withdraw = '/payments/withdraw';
  static const String transactions = '/payments/transactions';
}
