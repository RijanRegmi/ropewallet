import 'dart:io';

class ApiConstants {
  // ================= CONFIGURATION FOR RUNNING THE APP =================
  // 1. Set 'useProduction' to true and update 'productionUrl' with your Vercel URL once deployed.
  // 2. Otherwise, for local development, configure the local settings below.
  static const bool useProduction = true;
  static const String productionUrl = 'https://ropewallet.vercel.app'; // Update with Vercel deployment URL

  // Local development settings:
  // - Set 'isTestingOnPhysicalDevice' to true if you are running on a physical device.
  // - Update 'localComputerIp' with your computer's IP address.
  // - Or, paste your ngrok URL in 'ngrokUrl'.
  static const bool isTestingOnPhysicalDevice = true;
  static const String localComputerIp = '192.168.1.7'; // Change to your local IP address
  static const String ngrokUrl = 'https://your-ngrok-tunnel-url.ngrok-free.app'; // Change to your ngrok URL
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
}
