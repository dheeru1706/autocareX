import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/onboarding_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/otp_verify_screen.dart';
import '../../features/home/presentation/screens/home_shell.dart';
import '../../features/home/presentation/screens/dashboard_screen.dart';
import '../../features/booking/presentation/screens/bookings_list_screen.dart';
import '../../features/booking/presentation/screens/service_packages_screen.dart';
import '../../features/booking/presentation/screens/book_service_screen.dart';
import '../../features/booking/presentation/screens/booking_tracking_screen.dart';
import '../../features/marketplace/presentation/screens/marketplace_screen.dart';
import '../../features/marketplace/presentation/screens/car_listing_detail_screen.dart';
import '../../features/marketplace/presentation/screens/sell_car_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/vehicles/presentation/screens/vehicles_screen.dart';
import '../../features/vehicles/presentation/screens/add_vehicle_screen.dart';
import '../../features/subscriptions/presentation/screens/subscription_plans_screen.dart';
import '../../features/wallet/presentation/screens/wallet_screen.dart';
import '../../features/chat/presentation/screens/chat_screen.dart';
import '../../features/insurance/presentation/screens/insurance_screen.dart';
import '../../features/franchise/presentation/screens/partner_dashboard_screen.dart';
import '../providers/auth_provider.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isAuthenticated = authState.value?.isAuthenticated ?? false;
      final isAuthRoute = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/otp-verify') ||
          state.matchedLocation == '/onboarding' ||
          state.matchedLocation == '/splash';

      if (authState.isLoading) return null;

      if (!isAuthenticated && !isAuthRoute) {
        return '/login';
      }
      if (isAuthenticated &&
          (state.matchedLocation == '/login' ||
              state.matchedLocation == '/otp-verify' ||
              state.matchedLocation == '/onboarding')) {
        return '/home/dashboard';
      }
      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        name: 'splash',
        pageBuilder: (context, state) => const NoTransitionPage(
          child: SplashScreen(),
        ),
      ),

      // Onboarding
      GoRoute(
        path: '/onboarding',
        name: 'onboarding',
        pageBuilder: (context, state) => _fadeTransition(
          state: state,
          child: const OnboardingScreen(),
        ),
      ),

      // Login
      GoRoute(
        path: '/login',
        name: 'login',
        pageBuilder: (context, state) => _fadeTransition(
          state: state,
          child: const LoginScreen(),
        ),
      ),

      // OTP Verify
      GoRoute(
        path: '/otp-verify',
        name: 'otp-verify',
        pageBuilder: (context, state) {
          final phone = state.extra as String? ?? '';
          return _slideTransition(
            state: state,
            child: OtpVerifyScreen(phone: phone),
          );
        },
      ),

      // Home Shell with Bottom Nav
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(
            path: '/home/dashboard',
            name: 'dashboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: DashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/home/bookings',
            name: 'bookings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: BookingsListScreen(),
            ),
          ),
          GoRoute(
            path: '/home/marketplace',
            name: 'marketplace',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: MarketplaceScreen(),
            ),
          ),
          GoRoute(
            path: '/home/profile',
            name: 'profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),
        ],
      ),

      // Service Packages
      GoRoute(
        path: '/service-packages/:categoryId',
        name: 'service-packages',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: ServicePackagesScreen(
            categoryId: state.pathParameters['categoryId'] ?? '',
          ),
        ),
      ),

      // Book Service (multi-step)
      GoRoute(
        path: '/book-service',
        name: 'book-service',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: BookServiceScreen(
            packageId: (state.extra as Map<String, dynamic>?)?['packageId'] as String? ?? '',
          ),
        ),
      ),

      // Booking Tracking
      GoRoute(
        path: '/booking-tracking/:bookingId',
        name: 'booking-tracking',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: BookingTrackingScreen(
            bookingId: state.pathParameters['bookingId'] ?? '',
          ),
        ),
      ),

      // Vehicles
      GoRoute(
        path: '/vehicles',
        name: 'vehicles',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const VehiclesScreen(),
        ),
      ),

      GoRoute(
        path: '/vehicle/add',
        name: 'add-vehicle',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const AddVehicleScreen(),
        ),
      ),

      GoRoute(
        path: '/vehicle/:vehicleId',
        name: 'vehicle-detail',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: AddVehicleScreen(
            vehicleId: state.pathParameters['vehicleId'],
          ),
        ),
      ),

      // Subscription Plans
      GoRoute(
        path: '/subscription/plans',
        name: 'subscription-plans',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const SubscriptionPlansScreen(),
        ),
      ),

      // Marketplace Car Detail
      GoRoute(
        path: '/marketplace/listing/:id',
        name: 'listing-detail',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: CarListingDetailScreen(
            listingId: state.pathParameters['id'] ?? '',
          ),
        ),
      ),

      // Sell Car
      GoRoute(
        path: '/marketplace/sell',
        name: 'sell-car',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const SellCarScreen(),
        ),
      ),

      // Insurance
      GoRoute(
        path: '/insurance/policies',
        name: 'insurance',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const InsuranceScreen(),
        ),
      ),

      // Wallet
      GoRoute(
        path: '/wallet',
        name: 'wallet',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const WalletScreen(),
        ),
      ),

      // Notifications
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const _NotificationsScreen(),
        ),
      ),

      // Chat
      GoRoute(
        path: '/chat/:conversationId',
        name: 'chat',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: ChatScreen(
            conversationId: state.pathParameters['conversationId'] ?? '',
            recipientName: (state.extra as Map<String, dynamic>?)?['name'] as String? ?? 'Support',
          ),
        ),
      ),

      // Profile Edit
      GoRoute(
        path: '/profile/edit',
        name: 'profile-edit',
        pageBuilder: (context, state) => _slideTransition(
          state: state,
          child: const _ProfileEditScreen(),
        ),
      ),

      // Partner Dashboard (separate shell)
      ShellRoute(
        builder: (context, state, child) => child,
        routes: [
          GoRoute(
            path: '/partner/dashboard',
            name: 'partner-dashboard',
            pageBuilder: (context, state) => _slideTransition(
              state: state,
              child: const PartnerDashboardScreen(),
            ),
          ),
        ],
      ),
    ],

    errorBuilder: (context, state) => Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Color(0xFFF5C518), size: 64),
            const SizedBox(height: 16),
            Text(
              'Page Not Found',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              state.matchedLocation,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () => context.go('/home/dashboard'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

CustomTransitionPage<void> _fadeTransition({
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(opacity: animation, child: child);
    },
    transitionDuration: const Duration(milliseconds: 300),
  );
}

CustomTransitionPage<void> _slideTransition({
  required GoRouterState state,
  required Widget child,
}) {
  return CustomTransitionPage<void>(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      const begin = Offset(1.0, 0.0);
      const end = Offset.zero;
      const curve = Curves.easeInOutCubic;
      final tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
      return SlideTransition(
        position: animation.drive(tween),
        child: child,
      );
    },
    transitionDuration: const Duration(milliseconds: 300),
  );
}

// Placeholder screens for routes not fully implemented in separate files
class _NotificationsScreen extends StatelessWidget {
  const _NotificationsScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: const Center(
        child: Text('Notifications coming soon'),
      ),
    );
  }
}

class _ProfileEditScreen extends StatelessWidget {
  const _ProfileEditScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: const Center(
        child: Text('Edit Profile coming soon'),
      ),
    );
  }
}
