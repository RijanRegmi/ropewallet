import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'core/network/api_client.dart';
import 'core/constants/api_constants.dart';
import 'features/auth/providers/auth_provider.dart';
import 'features/home/providers/wallet_provider.dart';
import 'features/auth/providers/security_provider.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/auth/presentation/pages/set_pin_page.dart';
import 'features/home/presentation/pages/home_page.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling background notification: ${message.messageId}");
}

final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Stripe SDK for client-side card tokenization (PCI-compliant)
  Stripe.publishableKey = ApiConstants.stripePublishableKey;

  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true, provisional: false);
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  } catch (e) {
    debugPrint('Firebase init error: $e');
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
  void initState() {
    super.initState();
    _setupFcmForegroundListener();
  }

  void _setupFcmForegroundListener() {
    // Listen for foreground FCM push messages and display floating banner
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final notification = message.notification;
      if (notification != null) {
        rootScaffoldMessengerKey.currentState?.showSnackBar(
          SnackBar(
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFF0F172A),
            elevation: 8,
            duration: const Duration(seconds: 4),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            margin: const EdgeInsets.all(16),
            content: Row(
              children: [
                const Icon(Icons.notifications_active_rounded, color: Color(0xFF10B981), size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        notification.title ?? 'Notification',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      if (notification.body != null)
                        Text(
                          notification.body!,
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }
    });

    // Listen for token refresh and sync to backend
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      if (token.isNotEmpty) {
        ApiClient().post('/auth/fcm-token', {'fcmToken': token});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return MaterialApp(
      scaffoldMessengerKey: rootScaffoldMessengerKey,
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
