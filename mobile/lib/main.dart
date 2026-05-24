import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:path_provider/path_provider.dart';

import 'app.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint('Handling background FCM message: ${message.messageId}');
}

bool _firebaseInitialized = false;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Light status bar icons (matches our navy/white theme)
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0F2D52),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Portrait orientation only
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Hive for local storage
  final appDocDir = await getApplicationDocumentsDirectory();
  await Hive.initFlutter(appDocDir.path);
  await Hive.openBox('app_cache');
  await Hive.openBox('user_preferences');

  // Initialize Firebase — graceful fallback if google-services.json is absent
  try {
    await Firebase.initializeApp();
    _firebaseInitialized = true;

    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request notification permissions
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
  } catch (e) {
    debugPrint('Firebase initialization skipped: $e');
    _firebaseInitialized = false;
  }

  runApp(
    ProviderScope(
      overrides: [
        firebaseInitializedProvider.overrideWithValue(_firebaseInitialized),
      ],
      child: const AutoCareXApp(),
    ),
  );
}

// Provider so widgets can check if Firebase is available
final firebaseInitializedProvider = Provider<bool>((ref) => false);
