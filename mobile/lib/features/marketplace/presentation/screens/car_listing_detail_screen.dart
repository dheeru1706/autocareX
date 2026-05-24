import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';

import '../../../../core/theme/app_theme.dart';

class CarListingDetailScreen extends ConsumerStatefulWidget {
  final String listingId;
  const CarListingDetailScreen({super.key, required this.listingId});

  @override
  ConsumerState<CarListingDetailScreen> createState() =>
      _CarListingDetailScreenState();
}

class _CarListingDetailScreenState extends ConsumerState<CarListingDetailScreen> {
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();

  // Mock data
  final _listing = const {
    'title': 'Hyundai Creta SX',
    'price': 1250000,
    'aiEstimate': 1280000,
    'year': 2022,
    'mileage': 18000,
    'fuel': 'Diesel',
    'condition': 'Excellent',
    'location': 'Mumbai, MH',
    'inspectionScore': 94,
    'description':
        'Well maintained Hyundai Creta SX 2022 in excellent condition. Single owner, all service records available. No accidents, fully original paint. Insurance valid till December 2025.',
    'seller': 'AutoCareX Certified Partner',
    'sellerRating': 4.8,
    'sellerReviews': 127,
    'imageCount': 5,
  };

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  String _formatPrice(int price) {
    return '₹${(price / 100000).toStringAsFixed(2)}L';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Image Gallery
          SliverToBoxAdapter(
            child: _buildImageGallery(),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title + Price
                  _buildTitleSection(),
                  const SizedBox(height: 20),

                  // Key Specs
                  _buildSpecsRow(),
                  const SizedBox(height: 20),

                  // Inspection Score
                  _buildInspectionScore(),
                  const SizedBox(height: 20),

                  // AI Price Estimate
                  _buildAiEstimate(),
                  const SizedBox(height: 20),

                  // Description
                  _buildDescription(),
                  const SizedBox(height: 20),

                  // Seller Info
                  _buildSellerInfo(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(context),
    );
  }

  Widget _buildImageGallery() {
    return Stack(
      children: [
        SizedBox(
          height: 280,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _listing['imageCount'] as int,
            onPageChanged: (i) => setState(() => _currentImageIndex = i),
            itemBuilder: (context, index) {
              return Container(
                color: AppColors.surface,
                child: Stack(
                  children: [
                    const Center(
                      child: Icon(Icons.directions_car_rounded,
                          size: 80, color: AppColors.textHint),
                    ),
                    Center(
                      child: Text(
                        'Photo ${index + 1}',
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),

        // Back button
        Positioned(
          top: 48,
          left: 16,
          child: GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.card.withOpacity(0.9),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.arrow_back_ios_rounded,
                  size: 18, color: AppColors.textPrimary),
            ),
          ),
        ),

        // Image counter
        Positioned(
          bottom: 12,
          right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${_currentImageIndex + 1}/${_listing['imageCount']}',
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600),
            ),
          ),
        ),

        // Image dots
        Positioned(
          bottom: 12,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _listing['imageCount'] as int,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: i == _currentImageIndex ? 20 : 6,
                height: 6,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: BoxDecoration(
                  color: i == _currentImageIndex
                      ? AppColors.primary
                      : Colors.white.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTitleSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _listing['title'] as String,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on_rounded,
                          size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(_listing['location'] as String,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                _listing['condition'] as String,
                style: const TextStyle(
                  color: AppColors.success,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        Text(
          _formatPrice(_listing['price'] as int),
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: AppColors.primary,
          ),
        ),
      ],
    );
  }

  Widget _buildSpecsRow() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _SpecItem(
            icon: Icons.calendar_today_rounded,
            label: 'Year',
            value: '${_listing['year']}',
          ),
          _VerticalDivider(),
          _SpecItem(
            icon: Icons.speed_rounded,
            label: 'Mileage',
            value: '${((_listing['mileage'] as int) / 1000).round()}K km',
          ),
          _VerticalDivider(),
          _SpecItem(
            icon: Icons.local_gas_station_rounded,
            label: 'Fuel',
            value: _listing['fuel'] as String,
          ),
          _VerticalDivider(),
          _SpecItem(
            icon: Icons.settings_rounded,
            label: 'Trans.',
            value: 'Auto',
          ),
        ],
      ),
    );
  }

  Widget _buildInspectionScore() {
    final score = _listing['inspectionScore'] as int;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.fact_check_rounded,
                  color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text('Inspection Score',
                  style: Theme.of(context).textTheme.titleSmall),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.success.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$score/100',
                  style: const TextStyle(
                    color: AppColors.success,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearPercentIndicator(
            lineHeight: 8,
            percent: score / 100,
            backgroundColor: AppColors.surface,
            linearGradient: const LinearGradient(
              colors: [AppColors.success, AppColors.primary],
            ),
            barRadius: const Radius.circular(4),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(height: 10),
          const Row(
            children: [
              _InspectionItem(label: 'Engine', ok: true),
              SizedBox(width: 16),
              _InspectionItem(label: 'Body', ok: true),
              SizedBox(width: 16),
              _InspectionItem(label: 'Interior', ok: true),
              SizedBox(width: 16),
              _InspectionItem(label: 'Electrical', ok: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAiEstimate() {
    final price = _listing['price'] as int;
    final estimate = _listing['aiEstimate'] as int;
    final diff = estimate - price;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withOpacity(0.1),
            AppColors.primary.withOpacity(0.02),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppColors.primary.withOpacity(0.2), width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.auto_graph_rounded,
                color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Market Estimate',
                    style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 4),
                Text(
                  _formatPrice(estimate),
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '${diff > 0 ? "+" : ""}${_formatPrice(diff)} vs market',
              style: const TextStyle(
                color: AppColors.success,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Description',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        Text(
          _listing['description'] as String,
          style: Theme.of(context)
              .textTheme
              .bodyMedium
              ?.copyWith(height: 1.7, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _buildSellerInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Seller',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.store_rounded,
                    color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          _listing['seller'] as String,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.verified_rounded,
                            color: AppColors.info, size: 14),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          '${_listing['sellerRating']} • ${_listing['sellerReviews']} reviews',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.divider, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.calendar_today_rounded, size: 18),
              label: const Text('Test Drive'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 52),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.message_rounded, size: 18),
              label: const Text('Make Inquiry'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(0, 52),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SpecItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _SpecItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(height: 4),
        Text(value,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            )),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 0.5,
      height: 40,
      color: AppColors.divider,
    );
  }
}

class _InspectionItem extends StatelessWidget {
  final String label;
  final bool ok;

  const _InspectionItem({required this.label, required this.ok});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          ok ? Icons.check_circle_rounded : Icons.cancel_rounded,
          size: 14,
          color: ok ? AppColors.success : AppColors.error,
        ),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
