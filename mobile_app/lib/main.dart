import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'core/network/api_client.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/home/providers/wallet_provider.dart';
import 'features/auth/providers/security_provider.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/set_pin_page.dart';
import 'features/home/presentation/pages/home_page.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'core/constants/api_constants.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling background notification: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }

  // Initialize Stripe SDK (requires Theme.MaterialComponents in Android styles)
  try {
    Stripe.publishableKey = ApiConstants.stripePublishableKey;
    await Stripe.instance.applySettings();
  } catch (e) {
    debugPrint('Stripe init error: $e');
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => SecurityProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return MaterialApp(
      title: 'RopeWallet',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeProvider.themeMode,
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _initialized = false;
  bool _fcmSynced = false;

  void _syncFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        ApiClient().post('/auth/fcm-token', {'fcmToken': token});
      }
    } catch (_) {}
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      // Run auto-login attempt on startup
      Provider.of<AuthProvider>(context, listen: false).tryAutoLogin();
      _initialized = true;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (authProvider.isAuthenticated && !_fcmSynced) {
      _fcmSynced = true;
      _syncFcmToken();
    }

    // Show smooth splash loader ONLY while reading local storage during startup auto-login
    if (authProvider.isAutoLoggingIn) {
      return Scaffold(
        backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFFFFFF),
        body: const Center(
          child: CircularProgressIndicator(color: Color(0xFF10B981)),
        ),
      );
    }

    // Direct routing based on login authentication state & complete user profile availability
    if (authProvider.isAuthenticated && authProvider.user != null) {
      final hasPin = authProvider.user!['hasPin'] == true;
      if (!hasPin) {
        return const SetPinPage();
      }
      return const HomePage();
    } else {
      return const LoginPage();
    }
  }
}
