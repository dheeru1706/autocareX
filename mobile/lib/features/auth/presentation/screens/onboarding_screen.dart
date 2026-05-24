import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_theme.dart';

class _OnboardingPage {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final List<Color> gradientColors;

  const _OnboardingPage({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.gradientColors,
  });
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingPage> _pages = const [
    _OnboardingPage(
      title: 'Premium Car Care',
      subtitle:
          'Experience luxury-grade car maintenance at your doorstep. From detailing to full service — we handle everything.',
      icon: Icons.star_rounded,
      iconColor: Color(0xFFF5C518),
      gradientColors: [Color(0xFF1A1500), Color(0xFF0D0D0D)],
    ),
    _OnboardingPage(
      title: 'Expert Technicians',
      subtitle:
          'Certified mechanics and detailers with 5+ years experience. Rated 4.8★ by 50,000+ customers across India.',
      icon: Icons.engineering_rounded,
      iconColor: Color(0xFF00C853),
      gradientColors: [Color(0xFF001A0A), Color(0xFF0D0D0D)],
    ),
    _OnboardingPage(
      title: 'Book in 60 Seconds',
      subtitle:
          'Select your car, pick a slot, pay securely. Real-time tracking, OTP verification, before/after photos.',
      icon: Icons.bolt_rounded,
      iconColor: Color(0xFF2196F3),
      gradientColors: [Color(0xFF001020), Color(0xFF0D0D0D)],
    ),
  ];

  Future<void> _complete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.keyOnboardingDone, true);
    if (mounted) context.go('/login');
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.only(top: 8, right: 16),
                child: TextButton(
                  onPressed: _complete,
                  child: const Text('Skip'),
                ),
              ),
            ),

            // PageView
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  return _OnboardingPageWidget(page: _pages[index]);
                },
              ),
            ),

            // Bottom section
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: Column(
                children: [
                  // Page indicator
                  SmoothPageIndicator(
                    controller: _pageController,
                    count: _pages.length,
                    effect: ExpandingDotsEffect(
                      activeDotColor: AppColors.primary,
                      dotColor: AppColors.surface,
                      dotHeight: 6,
                      dotWidth: 6,
                      expansionFactor: 4,
                      spacing: 6,
                    ),
                  ),

                  const SizedBox(height: 32),

                  // CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () {
                        if (_currentPage < _pages.length - 1) {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeInOutCubic,
                          );
                        } else {
                          _complete();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _currentPage < _pages.length - 1
                                ? 'Next'
                                : 'Get Started',
                            style: const TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward_rounded, size: 20),
                        ],
                      ),
                    ),
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

class _OnboardingPageWidget extends StatelessWidget {
  final _OnboardingPage page;

  const _OnboardingPageWidget({required this.page});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Illustration container
          Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              gradient: RadialGradient(
                colors: [
                  page.iconColor.withOpacity(0.15),
                  Colors.transparent,
                ],
                radius: 0.8,
              ),
              shape: BoxShape.circle,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Background decoration circles
                Positioned(
                  top: 30,
                  right: 40,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: page.iconColor.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 40,
                  left: 30,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: page.iconColor.withOpacity(0.2),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),

                // Main icon container
                Container(
                  width: 140,
                  height: 140,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.card,
                    border: Border.all(
                      color: page.iconColor.withOpacity(0.3),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: page.iconColor.withOpacity(0.2),
                        blurRadius: 40,
                        spreadRadius: 10,
                      ),
                    ],
                  ),
                  child: Icon(
                    page.icon,
                    size: 64,
                    color: page.iconColor,
                  ),
                ),
              ],
            ),
          )
              .animate()
              .scale(
                begin: const Offset(0.8, 0.8),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOut,
              )
              .fadeIn(duration: const Duration(milliseconds: 400)),

          const SizedBox(height: 48),

          // Title
          Text(
            page.title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(
                delay: const Duration(milliseconds: 150),
                duration: const Duration(milliseconds: 400),
              )
              .slideY(
                begin: 0.2,
                end: 0,
                delay: const Duration(milliseconds: 150),
                curve: Curves.easeOut,
              ),

          const SizedBox(height: 16),

          // Subtitle
          Text(
            page.subtitle,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                  height: 1.6,
                ),
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(
                delay: const Duration(milliseconds: 250),
                duration: const Duration(milliseconds: 400),
              )
              .slideY(
                begin: 0.2,
                end: 0,
                delay: const Duration(milliseconds: 250),
                curve: Curves.easeOut,
              ),
        ],
      ),
    );
  }
}
