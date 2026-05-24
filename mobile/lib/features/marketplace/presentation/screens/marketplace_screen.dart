import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

class CarListing {
  final String id;
  final String title;
  final int price;
  final int year;
  final int mileage;
  final String fuel;
  final String condition;
  final String location;
  final int inspectionScore;
  final bool isVerified;

  const CarListing({
    required this.id,
    required this.title,
    required this.price,
    required this.year,
    required this.mileage,
    required this.fuel,
    required this.condition,
    required this.location,
    required this.inspectionScore,
    required this.isVerified,
  });
}

final marketplaceListingsProvider = FutureProvider<List<CarListing>>((ref) async {
  await Future.delayed(const Duration(milliseconds: 800));
  return const [
    CarListing(
      id: 'L001',
      title: 'Maruti Swift VXI',
      price: 685000,
      year: 2021,
      mileage: 32000,
      fuel: 'Petrol',
      condition: 'Good',
      location: 'Pune, MH',
      inspectionScore: 87,
      isVerified: true,
    ),
    CarListing(
      id: 'L002',
      title: 'Hyundai Creta SX',
      price: 1250000,
      year: 2022,
      mileage: 18000,
      fuel: 'Diesel',
      condition: 'Excellent',
      location: 'Mumbai, MH',
      inspectionScore: 94,
      isVerified: true,
    ),
    CarListing(
      id: 'L003',
      title: 'Tata Nexon EV',
      price: 1450000,
      year: 2023,
      mileage: 12000,
      fuel: 'Electric',
      condition: 'Excellent',
      location: 'Bangalore, KA',
      inspectionScore: 96,
      isVerified: true,
    ),
    CarListing(
      id: 'L004',
      title: 'Honda City ZX',
      price: 1050000,
      year: 2020,
      mileage: 45000,
      fuel: 'Petrol',
      condition: 'Good',
      location: 'Hyderabad, TS',
      inspectionScore: 82,
      isVerified: false,
    ),
    CarListing(
      id: 'L005',
      title: 'Mahindra XUV700 AX5',
      price: 2150000,
      year: 2022,
      mileage: 28000,
      fuel: 'Diesel',
      condition: 'Excellent',
      location: 'Delhi, DL',
      inspectionScore: 91,
      isVerified: true,
    ),
  ];
});

final isGridViewProvider = StateProvider<bool>((ref) => true);
final searchQueryProvider = StateProvider<String>((ref) => '');
final selectedFuelFilterProvider = StateProvider<String?>((ref) => null);

class MarketplaceScreen extends ConsumerStatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  ConsumerState<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends ConsumerState<MarketplaceScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isGrid = ref.watch(isGridViewProvider);
    final listingsAsync = ref.watch(marketplaceListingsProvider);
    final fuelFilter = ref.watch(selectedFuelFilterProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Marketplace'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: Icon(
              isGrid ? Icons.view_list_rounded : Icons.grid_view_rounded,
            ),
            onPressed: () => ref.read(isGridViewProvider.notifier).state =
                !isGrid,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search + Filter Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search make, model, year...',
                    prefixIcon: const Icon(Icons.search_rounded, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              ref
                                  .read(searchQueryProvider.notifier)
                                  .state = '';
                            },
                          )
                        : null,
                    contentPadding:
                        const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onChanged: (v) =>
                      ref.read(searchQueryProvider.notifier).state = v,
                ),

                const SizedBox(height: 10),

                // Filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(
                        label: 'All',
                        isSelected: fuelFilter == null,
                        onTap: () => ref
                            .read(selectedFuelFilterProvider.notifier)
                            .state = null,
                      ),
                      const SizedBox(width: 8),
                      ...['Petrol', 'Diesel', 'Electric', 'CNG'].map((f) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: _FilterChip(
                            label: f,
                            isSelected: fuelFilter == f,
                            onTap: () => ref
                                .read(selectedFuelFilterProvider.notifier)
                                .state = fuelFilter == f ? null : f,
                          ),
                        );
                      }),
                      _FilterChip(
                        label: '⚙ Filters',
                        isSelected: false,
                        onTap: () => _showFilters(context),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Listings
          Expanded(
            child: listingsAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
              error: (_, __) => const Center(
                child: Text('Error loading listings'),
              ),
              data: (listings) {
                final filtered = listings.where((l) {
                  if (fuelFilter != null && l.fuel != fuelFilter) return false;
                  final q = ref.watch(searchQueryProvider).toLowerCase();
                  if (q.isNotEmpty &&
                      !l.title.toLowerCase().contains(q)) {
                    return false;
                  }
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_off_rounded,
                            size: 56, color: AppColors.textHint),
                        const SizedBox(height: 16),
                        Text('No listings found',
                            style: Theme.of(context).textTheme.titleMedium),
                      ],
                    ),
                  );
                }

                return isGrid
                    ? GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.72,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          return AnimationConfiguration.staggeredGrid(
                            position: index,
                            columnCount: 2,
                            duration: const Duration(milliseconds: 400),
                            child: FadeInAnimation(
                              child: _ListingCard(
                                listing: filtered[index],
                                isGrid: true,
                                onTap: () => context.push(
                                    '/marketplace/listing/${filtered[index].id}'),
                              ),
                            ),
                          );
                        },
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          return AnimationConfiguration.staggeredList(
                            position: index,
                            duration: const Duration(milliseconds: 400),
                            child: SlideAnimation(
                              verticalOffset: 30,
                              child: FadeInAnimation(
                                child: Padding(
                                  padding:
                                      const EdgeInsets.only(bottom: 12),
                                  child: _ListingCard(
                                    listing: filtered[index],
                                    isGrid: false,
                                    onTap: () => context.push(
                                        '/marketplace/listing/${filtered[index].id}'),
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/marketplace/sell'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.sell_rounded),
        label: const Text(
          'Sell My Car',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  void _showFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Filter Listings',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    )),
            const SizedBox(height: 20),
            Text('Price Range',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            // Simple price range slider
            const Text('Coming soon...', style: TextStyle(color: AppColors.textHint)),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52)),
              child: const Text('Apply Filters'),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.15)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 0.5,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 12,
            fontWeight:
                isSelected ? FontWeight.w700 : FontWeight.w400,
            color: isSelected ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  final CarListing listing;
  final bool isGrid;
  final VoidCallback onTap;

  const _ListingCard({
    required this.listing,
    required this.isGrid,
    required this.onTap,
  });

  Color get _conditionColor {
    switch (listing.condition) {
      case 'Excellent':
        return AppColors.success;
      case 'Good':
        return AppColors.info;
      default:
        return AppColors.warning;
    }
  }

  String _formatPrice(int price) {
    if (price >= 100000) {
      return '₹${(price / 100000).toStringAsFixed(2)}L';
    }
    return '₹${(price / 1000).toStringAsFixed(0)}K';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image placeholder
            Container(
              height: isGrid ? 100 : 160,
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16)),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Icon(Icons.directions_car_rounded,
                        size: 48, color: AppColors.textHint),
                  ),
                  // Verified badge
                  if (listing.isVerified)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.success,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified_rounded,
                                size: 10, color: Colors.white),
                            SizedBox(width: 3),
                            Text(
                              'Verified',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Condition badge
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: _conditionColor.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        listing.condition,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    listing.title,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 4),

                  // Specs
                  Row(
                    children: [
                      Text(
                        '${listing.year}',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                      const Text(' • ',
                          style: TextStyle(
                              color: AppColors.textHint, fontSize: 11)),
                      Text(
                        '${(listing.mileage / 1000).toStringAsFixed(0)}K km',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                      const Text(' • ',
                          style: TextStyle(
                              color: AppColors.textHint, fontSize: 11)),
                      Text(
                        listing.fuel,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 6),

                  Text(
                    _formatPrice(listing.price),
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),

                  if (!isGrid) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_rounded,
                            size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 2),
                        Text(listing.location,
                            style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
