import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';
import '../widgets/service_category_card.dart';

// ─── Mock Data Providers ────────────────────────────────────────────────────

final dashboardLoadingProvider = StateProvider<bool>((ref) => true);

// Simulated loading
final dashboardInitProvider = FutureProvider<void>((ref) async {
  await Future.delayed(const Duration(milliseconds: 1500));
  ref.read(dashboardLoadingProvider.notifier).state = false;
});

final walletBalanceProvider = StateProvider<double>((ref) => 1250.0);

final selectedCategoryProvider = StateProvider<String?>((ref) => null);

// ─── Models ──────────────────────────────────────────────────────────────────

class ServiceCategory {
  final String id;
  final String name;
  final IconData icon;
  final Color iconColor;
  final String? tag;

  const ServiceCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.iconColor,
    this.tag,
  });
}

class ServiceCard {
  final String id;
  final String name;
  final String description;
  final String price;
  final String duration;
  final IconData icon;
  final Color iconColor;
  final String? badge;

  const ServiceCard({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.duration,
    required this.icon,
    required this.iconColor,
    this.badge,
  });
}

class VehicleCard {
  final String id;
  final String name;
  final String plate;
  final String year;
  final int healthScore;
  final IconData icon;

  const VehicleCard({
    required this.id,
    required this.name,
    required this.plate,
    required this.year,
    required this.healthScore,
    required this.icon,
  });
}

// ─── Dashboard Screen ────────────────────────────────────────────────────────

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final PageController _bannerController = PageController();

  final List<ServiceCategory> _categories = const [
    ServiceCategory(
        id: 'wash',
        name: 'Car Wash',
        icon: Icons.water_drop_rounded,
        iconColor: Color(0xFF2196F3),
        tag: 'Popular'),
    ServiceCategory(
        id: 'detail',
        name: 'Detailing',
        icon: Icons.auto_fix_high_rounded,
        iconColor: Color(0xFF9C27B0),
        tag: 'Premium'),
    ServiceCategory(
        id: 'inspection',
        name: 'Inspection',
        icon: Icons.search_rounded,
        iconColor: Color(0xFFFF9800)),
    ServiceCategory(
        id: 'repair',
        name: 'Repair',
        icon: Icons.build_rounded,
        iconColor: Color(0xFFFF5722)),
    ServiceCategory(
        id: 'insurance',
        name: 'Insurance',
        icon: Icons.shield_rounded,
        iconColor: Color(0xFF00BCD4),
        tag: 'New'),
    ServiceCategory(
        id: 'sell',
        name: 'Sell Car',
        icon: Icons.sell_rounded,
        iconColor: Color(0xFF4CAF50)),
  ];

  final List<ServiceCard> _popularServices = const [
    ServiceCard(
      id: 's1',
      name: 'Premium Wash',
      description: 'Full exterior + interior clean',
      price: '₹499',
      duration: '90 min',
      icon: Icons.water_drop_rounded,
      iconColor: Color(0xFF2196F3),
      badge: 'Popular',
    ),
    ServiceCard(
      id: 's2',
      name: 'Full Detail',
      description: 'Paint correction + coating',
      price: '₹2,999',
      duration: '4-5 hrs',
      icon: Icons.auto_fix_high_rounded,
      iconColor: Color(0xFF9C27B0),
      badge: 'Premium',
    ),
    ServiceCard(
      id: 's3',
      name: '120-Point Check',
      description: 'Comprehensive inspection',
      price: '₹799',
      duration: '2 hrs',
      icon: Icons.search_rounded,
      iconColor: Color(0xFFFF9800),
    ),
    ServiceCard(
      id: 's4',
      name: 'Insurance Renew',
      description: 'Compare & renew policies',
      price: 'Free',
      duration: '5 min',
      icon: Icons.shield_rounded,
      iconColor: Color(0xFF00BCD4),
      badge: 'New',
    ),
    ServiceCard(
      id: 's5',
      name: 'Sell Your Car',
      description: 'AI-powered price estimation',
      price: '₹0',
      duration: 'Instant',
      icon: Icons.sell_rounded,
      iconColor: Color(0xFF4CAF50),
    ),
  ];

  final List<VehicleCard> _vehicles = const [
    VehicleCard(
      id: 'v1',
      name: 'Maruti Swift',
      plate: 'MH 01 AB 1234',
      year: '2021',
      healthScore: 85,
      icon: Icons.directions_car_rounded,
    ),
    VehicleCard(
      id: 'v2',
      name: 'Hyundai Creta',
      plate: 'KA 02 CD 5678',
      year: '2022',
      healthScore: 92,
      icon: Icons.directions_car_filled_rounded,
    ),
  ];

  final List<Map<String, dynamic>> _banners = [
    {
      'title': 'Get 30% Off First Service',
      'subtitle': 'Use code FIRSTX30',
      'color': const Color(0xFF1A0F00),
      'accentColor': const Color(0xFFF5C518),
      'icon': Icons.local_offer_rounded,
    },
    {
      'title': 'Premium Membership',
      'subtitle': 'Unlimited washes from ₹299/mo',
      'color': const Color(0xFF0A0020),
      'accentColor': const Color(0xFF9C27B0),
      'icon': Icons.workspace_premium_rounded,
    },
    {
      'title': 'Sell Your Car Today',
      'subtitle': 'Best price guaranteed',
      'color': const Color(0xFF001A00),
      'accentColor': const Color(0xFF00C853),
      'icon': Icons.sell_rounded,
    },
  ];

  @override
  void initState() {
    super.initState();
    ref.read(dashboardInitProvider);
  }

  @override
  void dispose() {
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(dashboardLoadingProvider);
    final userName = ref.watch(currentUserNameProvider) ?? 'Driver';
    final walletBalance = ref.watch(walletBalanceProvider);
    final selectedCategory = ref.watch(selectedCategoryProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(dashboardLoadingProvider.notifier).state = true;
          await Future.delayed(const Duration(milliseconds: 1500));
          ref.read(dashboardLoadingProvider.notifier).state = false;
        },
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        child: CustomScrollView(
          slivers: [
            // Top App Bar
            SliverToBoxAdapter(
              child: _buildTopBar(context, userName, walletBalance, isLoading),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: _buildSearchBar(context, isLoading),
            ),

            // Service Category Chips
            SliverToBoxAdapter(
              child: _buildCategoryChips(
                  context, selectedCategory, isLoading),
            ),

            // Banner Carousel
            SliverToBoxAdapter(
              child: _buildBannerCarousel(context, isLoading),
            ),

            // Popular Services
            SliverToBoxAdapter(
              child: _buildSectionHeader(
                  context, 'Popular Services', onTap: () {}),
            ),
            SliverToBoxAdapter(
              child: _buildPopularServices(context, isLoading),
            ),

            // Your Vehicles
            SliverToBoxAdapter(
              child:
                  _buildSectionHeader(context, 'Your Vehicles', onTap: () {
                context.push('/vehicles');
              }),
            ),
            SliverToBoxAdapter(
              child: _buildVehicleCards(context, isLoading),
            ),

            // Active Booking Card
            SliverToBoxAdapter(
              child: _buildActiveBookingCard(context, isLoading),
            ),

            // Subscription Promo
            SliverToBoxAdapter(
              child: _buildSubscriptionCard(context, isLoading),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 32)),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, String userName,
      double walletBalance, bool isLoading) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 56, 20, 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                isLoading
                    ? _shimmerBox(width: 100, height: 14)
                    : Text(
                        'Good Morning,',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ).animate().fadeIn(),
                const SizedBox(height: 4),
                isLoading
                    ? _shimmerBox(width: 160, height: 22)
                    : Text(
                        userName.split(' ').first,
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                      ).animate().fadeIn(delay: 100.ms),
              ],
            ),
          ),
          Row(
            children: [
              // Wallet
              if (!isLoading)
                GestureDetector(
                  onTap: () => context.push('/wallet'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.3),
                        width: 0.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.account_balance_wallet_rounded,
                            color: AppColors.primary, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '₹${walletBalance.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 200.ms),

              const SizedBox(width: 12),

              // Notification Bell
              Stack(
                children: [
                  IconButton(
                    onPressed: () => context.push('/notifications'),
                    icon: const Icon(Icons.notifications_outlined,
                        color: AppColors.textPrimary, size: 26),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context, bool isLoading) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: isLoading
          ? _shimmerBox(width: double.infinity, height: 52, radius: 12)
          : GestureDetector(
              onTap: () {
                // TODO: Navigate to search
              },
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border, width: 0.5),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 16),
                    const Icon(Icons.search_rounded,
                        color: AppColors.textHint, size: 22),
                    const SizedBox(width: 10),
                    Text(
                      'Search services, repairs...',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textHint,
                          ),
                    ),
                    const Spacer(),
                    Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.tune_rounded,
                              color: AppColors.primary, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Filter',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 100.ms),
            ),
    );
  }

  Widget _buildCategoryChips(
      BuildContext context, String? selected, bool isLoading) {
    if (isLoading) {
      return SizedBox(
        height: 100,
        child: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          scrollDirection: Axis.horizontal,
          itemCount: 5,
          itemBuilder: (_, i) => Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _shimmerBox(width: 72, height: 90, radius: 12),
          ),
        ),
      );
    }

    return SizedBox(
      height: 100,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = selected == cat.id;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: AnimationConfiguration.staggeredList(
              position: index,
              duration: const Duration(milliseconds: 400),
              child: SlideAnimation(
                horizontalOffset: 50,
                child: FadeInAnimation(
                  child: ServiceCategoryCard(
                    category: cat,
                    isSelected: isSelected,
                    onTap: () {
                      ref.read(selectedCategoryProvider.notifier).state =
                          isSelected ? null : cat.id;
                      context
                          .push('/service-packages/${cat.id}');
                    },
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBannerCarousel(BuildContext context, bool isLoading) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
      child: Column(
        children: [
          isLoading
              ? _shimmerBox(
                  width: double.infinity, height: 140, radius: 16)
              : SizedBox(
                  height: 140,
                  child: PageView.builder(
                    controller: _bannerController,
                    itemCount: _banners.length,
                    itemBuilder: (context, index) {
                      final banner = _banners[index];
                      return _BannerCard(banner: banner);
                    },
                  ),
                ).animate().fadeIn(delay: 200.ms),

          const SizedBox(height: 12),

          if (!isLoading)
            SmoothPageIndicator(
              controller: _bannerController,
              count: _banners.length,
              effect: WormEffect(
                activeDotColor: AppColors.primary,
                dotColor: AppColors.surface,
                dotHeight: 5,
                dotWidth: 5,
              ),
            ).animate().fadeIn(delay: 300.ms),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title,
      {VoidCallback? onTap}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          if (onTap != null)
            GestureDetector(
              onTap: onTap,
              child: Text(
                'See All',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPopularServices(BuildContext context, bool isLoading) {
    if (isLoading) {
      return SizedBox(
        height: 180,
        child: ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          scrollDirection: Axis.horizontal,
          itemCount: 4,
          itemBuilder: (_, i) => Padding(
            padding: const EdgeInsets.only(right: 12),
            child: _shimmerBox(width: 140, height: 170, radius: 16),
          ),
        ),
      );
    }

    return SizedBox(
      height: 180,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        scrollDirection: Axis.horizontal,
        itemCount: _popularServices.length,
        itemBuilder: (context, index) {
          final service = _popularServices[index];
          return AnimationConfiguration.staggeredList(
            position: index,
            duration: const Duration(milliseconds: 400),
            child: SlideAnimation(
              horizontalOffset: 50,
              child: FadeInAnimation(
                child: Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: _ServiceCard(service: service),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildVehicleCards(BuildContext context, bool isLoading) {
    if (isLoading) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: _shimmerBox(width: double.infinity, height: 80, radius: 12),
      );
    }

    return Column(
      children: [
        ..._vehicles.map((v) => Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              child: _VehicleCardWidget(vehicle: v).animate().fadeIn(),
            )),
        // Add Vehicle
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
          child: GestureDetector(
            onTap: () => context.push('/vehicle/add'),
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                border: Border.all(
                    color: AppColors.primary.withOpacity(0.4), width: 1),
                borderRadius: BorderRadius.circular(12),
                color: AppColors.primary.withOpacity(0.05),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.add_circle_outline_rounded,
                      color: AppColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Add Vehicle',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(),
        ),
      ],
    );
  }

  Widget _buildActiveBookingCard(BuildContext context, bool isLoading) {
    if (isLoading) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader(context, 'Active Booking'),
          GestureDetector(
            onTap: () =>
                context.push('/booking-tracking/BK001'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                    color: AppColors.statusInProgress.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppColors.statusInProgress.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.water_drop_rounded,
                      color: Color(0xFF9C27B0),
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Premium Car Wash',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Technician on the way • ETA 15 min',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.statusInProgress,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.statusInProgress.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: Color(0xFF9C27B0),
                      size: 14,
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn().slideY(begin: 0.2, end: 0),
        ],
      ),
    );
  }

  Widget _buildSubscriptionCard(BuildContext context, bool isLoading) {
    if (isLoading) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      child: GestureDetector(
        onTap: () => context.push('/subscription/plans'),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withOpacity(0.2),
                AppColors.primary.withOpacity(0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
                color: AppColors.primary.withOpacity(0.3), width: 1),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'PREMIUM',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Unlimited Car Washes',
                      style:
                          Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Starting ₹299/month',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.workspace_premium_rounded,
                  color: Colors.black,
                  size: 28,
                ),
              ),
            ],
          ),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
      ),
    );
  }

  Widget _shimmerBox({
    required double width,
    required double height,
    double radius = 8,
  }) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.shimmerBase,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

// ─── Banner Card Widget ────────────────────────────────────────────────────

class _BannerCard extends StatelessWidget {
  final Map<String, dynamic> banner;

  const _BannerCard({required this.banner});

  @override
  Widget build(BuildContext context) {
    final accentColor = banner['accentColor'] as Color;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Container(
        decoration: BoxDecoration(
          color: banner['color'] as Color,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: accentColor.withOpacity(0.3),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: accentColor.withOpacity(0.1),
              blurRadius: 20,
            ),
          ],
        ),
        child: Stack(
          children: [
            // Background pattern
            Positioned(
              right: -20,
              bottom: -20,
              child: Icon(
                banner['icon'] as IconData,
                size: 120,
                color: accentColor.withOpacity(0.07),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(4),
                      border:
                          Border.all(color: accentColor.withOpacity(0.4)),
                    ),
                    child: Text(
                      'LIMITED TIME',
                      style: TextStyle(
                        color: accentColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    banner['title'] as String,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    banner['subtitle'] as String,
                    style: TextStyle(
                      color: accentColor,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
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

// ─── Service Card Widget ───────────────────────────────────────────────────

class _ServiceCard extends StatelessWidget {
  final ServiceCard service;
  const _ServiceCard({required this.service});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: service.iconColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(service.icon,
                    color: service.iconColor, size: 22),
              ),
              if (service.badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    service.badge!,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            service.name,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            service.description,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          Text(
            service.price,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
          Text(
            service.duration,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Vehicle Card Widget ───────────────────────────────────────────────────

class _VehicleCardWidget extends StatelessWidget {
  final VehicleCard vehicle;
  const _VehicleCardWidget({required this.vehicle});

  Color get _healthColor {
    if (vehicle.healthScore >= 80) return AppColors.success;
    if (vehicle.healthScore >= 60) return AppColors.warning;
    return AppColors.error;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.directions_car_filled_rounded,
              color: AppColors.primary,
              size: 26,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  vehicle.name,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                const SizedBox(height: 2),
                Text(
                  '${vehicle.plate} • ${vehicle.year}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            children: [
              Text(
                '${vehicle.healthScore}%',
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: _healthColor,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Health',
                style: TextStyle(
                  fontSize: 10,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
