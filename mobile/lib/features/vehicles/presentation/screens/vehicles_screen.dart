import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';

import '../../../../core/theme/app_theme.dart';

class Vehicle {
  final String id;
  final String make;
  final String model;
  final String year;
  final String plate;
  final String fuel;
  final String type;
  final int healthScore;
  final String? insuranceExpiry;

  const Vehicle({
    required this.id,
    required this.make,
    required this.model,
    required this.year,
    required this.plate,
    required this.fuel,
    required this.type,
    required this.healthScore,
    this.insuranceExpiry,
  });

  String get fullName => '$make $model';
}

final vehiclesProvider = StateProvider<List<Vehicle>>((ref) => const [
      Vehicle(
        id: 'v1',
        make: 'Maruti Suzuki',
        model: 'Swift',
        year: '2021',
        plate: 'MH 01 AB 1234',
        fuel: 'Petrol',
        type: 'Hatchback',
        healthScore: 85,
        insuranceExpiry: '2025-12-15',
      ),
      Vehicle(
        id: 'v2',
        make: 'Hyundai',
        model: 'Creta',
        year: '2022',
        plate: 'KA 02 CD 5678',
        fuel: 'Diesel',
        type: 'SUV',
        healthScore: 92,
        insuranceExpiry: '2025-08-30',
      ),
    ]);

class VehiclesScreen extends ConsumerWidget {
  const VehiclesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vehicles = ref.watch(vehiclesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Vehicles'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => context.push('/vehicle/add'),
          ),
        ],
      ),
      body: vehicles.isEmpty
          ? _buildEmptyState(context)
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
              itemCount: vehicles.length,
              itemBuilder: (context, index) {
                return AnimationConfiguration.staggeredList(
                  position: index,
                  duration: const Duration(milliseconds: 400),
                  child: SlideAnimation(
                    verticalOffset: 30,
                    child: FadeInAnimation(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _VehicleCard(
                          vehicle: vehicles[index],
                          onTap: () => context
                              .push('/vehicle/${vehicles[index].id}'),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/vehicle/add'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add_rounded),
        label: const Text(
          'Add Vehicle',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.directions_car_rounded,
                size: 40, color: AppColors.primary),
          ),
          const SizedBox(height: 16),
          Text('No Vehicles Added',
              style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            'Add your car to book services\nand track maintenance',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.push('/vehicle/add'),
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Add Your First Vehicle'),
            style: ElevatedButton.styleFrom(
                minimumSize: const Size(220, 52)),
          ),
        ],
      ),
    );
  }
}

class _VehicleCard extends StatelessWidget {
  final Vehicle vehicle;
  final VoidCallback onTap;

  const _VehicleCard({required this.vehicle, required this.onTap});

  Color get _healthColor {
    if (vehicle.healthScore >= 80) return AppColors.success;
    if (vehicle.healthScore >= 60) return AppColors.warning;
    return AppColors.error;
  }

  bool get _insuranceExpiringSoon {
    if (vehicle.insuranceExpiry == null) return false;
    final expiry = DateTime.tryParse(vehicle.insuranceExpiry!);
    if (expiry == null) return false;
    return expiry.difference(DateTime.now()).inDays < 30;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _insuranceExpiringSoon
                ? AppColors.warning.withOpacity(0.4)
                : AppColors.border,
            width: _insuranceExpiringSoon ? 1 : 0.5,
          ),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Vehicle icon
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(
                      Icons.directions_car_filled_rounded,
                      color: Colors.black,
                      size: 30,
                    ),
                  ),

                  const SizedBox(width: 14),

                  // Vehicle info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          vehicle.fullName,
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          vehicle.plate,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          children: [
                            _Tag(vehicle.year),
                            _Tag(vehicle.fuel),
                            _Tag(vehicle.type),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Health Score
                  CircularPercentIndicator(
                    radius: 30,
                    lineWidth: 4,
                    percent: vehicle.healthScore / 100,
                    center: Text(
                      '${vehicle.healthScore}',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: _healthColor,
                      ),
                    ),
                    progressColor: _healthColor,
                    backgroundColor: _healthColor.withOpacity(0.15),
                    circularStrokeCap: CircularStrokeCap.round,
                  ),
                ],
              ),
            ),

            // Insurance warning
            if (_insuranceExpiringSoon) ...[
              const Divider(height: 1, color: AppColors.divider),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.1),
                  borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(20)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning_rounded,
                        color: AppColors.warning, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Insurance expires soon (${vehicle.insuranceExpiry})',
                        style: const TextStyle(
                          color: AppColors.warning,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {},
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(0, 0),
                        foregroundColor: AppColors.warning,
                      ),
                      child: const Text(
                        'Renew',
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              // Actions row
              const Divider(height: 1, color: AppColors.divider),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    _VehicleAction(
                      icon: Icons.local_car_wash_rounded,
                      label: 'Service',
                      onTap: () =>
                          context.push('/service-packages/wash'),
                    ),
                    _VehicleAction(
                      icon: Icons.shield_rounded,
                      label: 'Insurance',
                      onTap: () => context.push('/insurance/policies'),
                    ),
                    _VehicleAction(
                      icon: Icons.sell_rounded,
                      label: 'Sell',
                      onTap: () => context.push('/marketplace/sell'),
                    ),
                    _VehicleAction(
                      icon: Icons.edit_rounded,
                      label: 'Edit',
                      onTap: onTap,
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  const _Tag(this.text);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 10,
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _VehicleAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _VehicleAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: TextButton(
        onPressed: onTap,
        style: TextButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 6),
          foregroundColor: AppColors.textSecondary,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
