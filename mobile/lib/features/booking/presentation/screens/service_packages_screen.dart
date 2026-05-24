import 'package:expandable/expandable.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

class ServicePackage {
  final String id;
  final String name;
  final String description;
  final int price;
  final int? originalPrice;
  final String duration;
  final List<String> includes;
  final List<String> excludes;
  final bool isPopular;
  final bool isPremium;
  final IconData icon;
  final Color color;

  const ServicePackage({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.duration,
    required this.includes,
    this.excludes = const [],
    this.isPopular = false,
    this.isPremium = false,
    required this.icon,
    required this.color,
  });
}

final servicePackagesProvider =
    FutureProvider.family<List<ServicePackage>, String>((ref, categoryId) async {
  await Future.delayed(const Duration(milliseconds: 800));

  // Mock packages per category
  switch (categoryId) {
    case 'wash':
      return const [
        ServicePackage(
          id: 'w1',
          name: 'Basic Wash',
          description: 'Quick exterior rinse and dry',
          price: 199,
          originalPrice: 299,
          duration: '30 min',
          includes: [
            'Exterior rinse',
            'Foam wash',
            'Water spotless dry',
            'Tyre shine',
          ],
          excludes: ['Interior cleaning', 'Waxing'],
          icon: Icons.water_drop_outlined,
          color: Color(0xFF2196F3),
        ),
        ServicePackage(
          id: 'w2',
          name: 'Premium Wash',
          description: 'Full exterior + interior clean',
          price: 499,
          originalPrice: 699,
          duration: '90 min',
          includes: [
            'Complete exterior wash',
            'Interior vacuum',
            'Dashboard wipe',
            'Glass cleaning',
            'Tyre & rim clean',
            'Air freshener',
          ],
          isPopular: true,
          icon: Icons.water_drop_rounded,
          color: Color(0xFF2196F3),
        ),
        ServicePackage(
          id: 'w3',
          name: 'Luxury Wash',
          description: 'Ceramic-safe wash with wax protection',
          price: 999,
          duration: '2.5 hrs',
          includes: [
            'pH-neutral foam wash',
            'Clay bar decontamination',
            'Hand wax application',
            'Full interior shampoo',
            'Leather conditioning',
            'Engine bay light clean',
            'Before/after photos',
          ],
          isPremium: true,
          icon: Icons.auto_awesome_rounded,
          color: Color(0xFF9C27B0),
        ),
      ];
    default:
      return const [
        ServicePackage(
          id: 'd1',
          name: 'Basic Package',
          description: 'Standard service package',
          price: 499,
          duration: '1-2 hrs',
          includes: ['Basic service', 'Quality check', 'Report'],
          icon: Icons.build_outlined,
          color: Color(0xFFFF9800),
        ),
        ServicePackage(
          id: 'd2',
          name: 'Premium Package',
          description: 'Comprehensive service with warranty',
          price: 1499,
          duration: '3-4 hrs',
          includes: [
            'Full service',
            'Quality check',
            'Detailed report',
            '30-day warranty',
            'Priority support',
          ],
          isPopular: true,
          icon: Icons.build_rounded,
          color: Color(0xFFFF9800),
        ),
      ];
  }
});

class ServicePackagesScreen extends ConsumerStatefulWidget {
  final String categoryId;
  const ServicePackagesScreen({super.key, required this.categoryId});

  @override
  ConsumerState<ServicePackagesScreen> createState() =>
      _ServicePackagesScreenState();
}

class _ServicePackagesScreenState extends ConsumerState<ServicePackagesScreen> {
  bool _compareMode = false;
  final Set<String> _compareIds = {};

  String _getCategoryName() {
    const names = {
      'wash': 'Car Wash',
      'detail': 'Detailing',
      'inspection': 'Inspection',
      'repair': 'Repair',
      'insurance': 'Insurance',
      'sell': 'Sell Car',
    };
    return names[widget.categoryId] ?? 'Services';
  }

  @override
  Widget build(BuildContext context) {
    final packagesAsync =
        ref.watch(servicePackagesProvider(widget.categoryId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_getCategoryName()),
        actions: [
          TextButton.icon(
            onPressed: () => setState(() => _compareMode = !_compareMode),
            icon: Icon(
              _compareMode ? Icons.close : Icons.compare_arrows_rounded,
              size: 18,
            ),
            label: Text(_compareMode ? 'Cancel' : 'Compare'),
          ),
        ],
      ),
      body: packagesAsync.when(
        loading: () => ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: 3,
          itemBuilder: (_, __) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _PackageShimmer(),
          ),
        ),
        error: (e, _) => Center(
          child: Text('Error loading packages',
              style: Theme.of(context).textTheme.bodyLarge),
        ),
        data: (packages) => Column(
          children: [
            // Category description header
            _CategoryHeader(categoryId: widget.categoryId),

            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                itemCount: packages.length,
                itemBuilder: (context, index) {
                  final package = packages[index];
                  return AnimationConfiguration.staggeredList(
                    position: index,
                    duration: const Duration(milliseconds: 400),
                    child: SlideAnimation(
                      verticalOffset: 30,
                      child: FadeInAnimation(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _PackageCard(
                            package: package,
                            compareMode: _compareMode,
                            isSelected: _compareIds.contains(package.id),
                            onCompareToggle: () {
                              setState(() {
                                if (_compareIds.contains(package.id)) {
                                  _compareIds.remove(package.id);
                                } else if (_compareIds.length < 2) {
                                  _compareIds.add(package.id);
                                }
                              });
                            },
                            onBookNow: () => context.push(
                              '/book-service',
                              extra: {'packageId': package.id},
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _compareMode && _compareIds.length == 2
          ? _CompareBar(packageIds: _compareIds.toList())
          : null,
    );
  }
}

class _CategoryHeader extends StatelessWidget {
  final String categoryId;
  const _CategoryHeader({required this.categoryId});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.local_car_wash_rounded,
                color: AppColors.primary, size: 26),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Professional Service',
                    style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(
                  'All services include doorstep delivery & OTP verification',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PackageCard extends StatelessWidget {
  final ServicePackage package;
  final bool compareMode;
  final bool isSelected;
  final VoidCallback onCompareToggle;
  final VoidCallback onBookNow;

  const _PackageCard({
    required this.package,
    required this.compareMode,
    required this.isSelected,
    required this.onCompareToggle,
    required this.onBookNow,
  });

  @override
  Widget build(BuildContext context) {
    return ExpandableNotifier(
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: package.isPopular
                ? AppColors.primary.withOpacity(0.4)
                : package.isPremium
                    ? const Color(0xFF9C27B0).withOpacity(0.4)
                    : AppColors.border,
            width: package.isPopular || package.isPremium ? 1.5 : 0.5,
          ),
          boxShadow: package.isPopular
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.1),
                    blurRadius: 20,
                  ),
                ]
              : [],
        ),
        child: Column(
          children: [
            // Popular Badge
            if (package.isPopular)
              Container(
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius:
                      BorderRadius.vertical(top: Radius.circular(20)),
                ),
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: const Center(
                  child: Text(
                    '⭐ MOST POPULAR',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: package.color.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(package.icon,
                            color: package.color, size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(package.name,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(fontWeight: FontWeight.w700)),
                            Text(package.description,
                                style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                      if (compareMode)
                        GestureDetector(
                          onTap: onCompareToggle,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? AppColors.primary
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.border,
                                width: 1.5,
                              ),
                            ),
                            child: isSelected
                                ? const Icon(Icons.check,
                                    size: 14, color: Colors.black)
                                : null,
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Price Row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '₹${package.price}',
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                      if (package.originalPrice != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          '₹${package.originalPrice}',
                          style: const TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 16,
                            fontWeight: FontWeight.w400,
                            color: AppColors.textHint,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${(((package.originalPrice! - package.price) / package.originalPrice!) * 100).round()}% off',
                            style: const TextStyle(
                              color: AppColors.success,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(Icons.schedule_rounded,
                              size: 14, color: AppColors.textSecondary),
                          const SizedBox(width: 4),
                          Text(package.duration,
                              style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Includes (expandable)
                  ExpandablePanel(
                    theme: const ExpandableThemeData(
                      headerAlignment:
                          ExpandablePanelHeaderAlignment.center,
                      tapBodyToCollapse: true,
                      iconColor: AppColors.textSecondary,
                      expandIcon: Icons.keyboard_arrow_down_rounded,
                      collapseIcon: Icons.keyboard_arrow_up_rounded,
                    ),
                    header: Text(
                      'What\'s included (${package.includes.length} items)',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    collapsed: const SizedBox.shrink(),
                    expanded: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        ...package.includes.map((item) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.check_circle_rounded,
                                    color: AppColors.success,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(item,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                              color: AppColors.textPrimary)),
                                ],
                              ),
                            )),
                        if (package.excludes.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          const Divider(color: AppColors.divider),
                          const SizedBox(height: 4),
                          Text('Not included:',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(color: AppColors.error)),
                          const SizedBox(height: 6),
                          ...package.excludes.map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.close_rounded,
                                      color: AppColors.error,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(item,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                                color: AppColors.textHint)),
                                  ],
                                ),
                              )),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // CTAs
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            // Subscribe flow
                            context.push('/subscription/plans');
                          },
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(0, 48),
                          ),
                          child: const Text('Subscribe'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: onBookNow,
                          style: ElevatedButton.styleFrom(
                            minimumSize: const Size(0, 48),
                          ),
                          child: const Text('Book Now'),
                        ),
                      ),
                    ],
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

class _CompareBar extends StatelessWidget {
  final List<String> packageIds;
  const _CompareBar({required this.packageIds});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.divider, width: 0.5)),
      ),
      child: ElevatedButton.icon(
        onPressed: () {
          // TODO: Show compare sheet
        },
        icon: const Icon(Icons.compare_arrows_rounded, size: 20),
        label: const Text('Compare Selected Packages'),
      ),
    );
  }
}

class _PackageShimmer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: AppColors.shimmerBase,
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}
