import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/app_theme.dart';

class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.shimmerBase,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class ShimmerDashboard extends StatelessWidget {
  const ShimmerDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Shimmer.fromColors(
        baseColor: AppColors.shimmerBase,
        highlightColor: AppColors.shimmerHighlight,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                const ShimmerBox(width: 120, height: 16, borderRadius: 4),
                const Spacer(),
                const ShimmerBox(width: 80, height: 32, borderRadius: 20),
                const SizedBox(width: 12),
                const ShimmerBox(width: 40, height: 40, borderRadius: 20),
              ],
            ),
            const SizedBox(height: 24),

            // Search
            ShimmerBox(
                width: double.infinity, height: 52, borderRadius: 12),
            const SizedBox(height: 20),

            // Categories
            Row(
              children: List.generate(
                5,
                (i) => Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: const ShimmerBox(
                      width: 72, height: 90, borderRadius: 16),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Banner
            ShimmerBox(
                width: double.infinity, height: 140, borderRadius: 16),
            const SizedBox(height: 24),

            // Section title
            const ShimmerBox(width: 140, height: 18, borderRadius: 4),
            const SizedBox(height: 12),

            // Service cards
            Row(
              children: List.generate(
                3,
                (i) => Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: const ShimmerBox(
                      width: 140, height: 170, borderRadius: 16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ShimmerListTile extends StatelessWidget {
  const ShimmerListTile({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            const ShimmerBox(width: 48, height: 48, borderRadius: 12),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(
                      width: MediaQuery.of(context).size.width * 0.5,
                      height: 14,
                      borderRadius: 4),
                  const SizedBox(height: 6),
                  ShimmerBox(
                      width: MediaQuery.of(context).size.width * 0.3,
                      height: 12,
                      borderRadius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
