import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 2500));
    if (!mounted) return;

    final authState = ref.read(authProvider);
    final prefs = await SharedPreferences.getInstance();
    final onboardingDone = prefs.getBool(AppConstants.keyOnboardingDone) ?? false;

    if (!mounted) return;

    if (authState.value?.isAuthenticated == true) {
      context.go('/home/dashboard');
    } else if (!onboardingDone) {
      context.go('/onboarding');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(flex: 2),
            // Logo Section
            Center(
              child: Column(
                children: [
                  // Car Icon with glow
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer glow
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, _) {
                          return Container(
                            width: 120 + (_pulseController.value * 20),
                            height: 120 + (_pulseController.value * 20),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primary.withOpacity(
                                  0.05 + _pulseController.value * 0.05),
                            ),
                          );
                        },
                      ),
                      // Inner circle
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF5C518), Color(0xFFD4A800)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.4),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.directions_car_rounded,
                          size: 52,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  )
                      .animate()
                      .scale(
                        begin: const Offset(0.5, 0.5),
                        end: const Offset(1.0, 1.0),
                        duration: const Duration(milliseconds: 600),
                        curve: Curves.elasticOut,
                      )
                      .fadeIn(duration: const Duration(milliseconds: 400)),

                  const SizedBox(height: 24),

                  // App Name
                  RichText(
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'AutoCare',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                        TextSpan(
                          text: 'X',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFF5C518),
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(
                        delay: const Duration(milliseconds: 300),
                        duration: const Duration(milliseconds: 500),
                      )
                      .slideY(
                        begin: 0.3,
                        end: 0,
                        delay: const Duration(milliseconds: 300),
                        duration: const Duration(milliseconds: 500),
                        curve: Curves.easeOut,
                      ),

                  const SizedBox(height: 8),

                  // Tagline
                  Text(
                    'Your Premium Automotive Partner',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 14,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textSecondary,
                      letterSpacing: 0.5,
                    ),
                  )
                      .animate()
                      .fadeIn(
                        delay: const Duration(milliseconds: 600),
                        duration: const Duration(milliseconds: 500),
                      ),
                ],
              ),
            ),

            const Spacer(flex: 2),

            // Loading indicator
            Padding(
              padding: const EdgeInsets.only(bottom: 40),
              child: Column(
                children: [
                  SizedBox(
                    width: 120,
                    child: LinearProgressIndicator(
                      backgroundColor: AppColors.surface,
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(4),
                      minHeight: 3,
                    ),
                  )
                      .animate(
                        delay: const Duration(milliseconds: 800),
                      )
                      .fadeIn(duration: const Duration(milliseconds: 400)),
                  const SizedBox(height: 16),
                  Text(
                    'India\'s #1 Car Care App',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      color: AppColors.textHint,
                      letterSpacing: 1.0,
                    ),
                  )
                      .animate()
                      .fadeIn(
                        delay: const Duration(milliseconds: 1000),
                        duration: const Duration(milliseconds: 400),
                      ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
