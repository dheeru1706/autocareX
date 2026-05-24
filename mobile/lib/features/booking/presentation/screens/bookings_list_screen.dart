import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

class _BookingItem {
  final String id;
  final String service;
  final String vehicle;
  final String date;
  final String time;
  final int amount;
  final String status;
  final String technician;

  const _BookingItem({
    required this.id,
    required this.service,
    required this.vehicle,
    required this.date,
    required this.time,
    required this.amount,
    required this.status,
    required this.technician,
  });
}

class BookingsListScreen extends ConsumerStatefulWidget {
  const BookingsListScreen({super.key});

  @override
  ConsumerState<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends ConsumerState<BookingsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<_BookingItem> _activeBookings = const [
    _BookingItem(
      id: 'BK001',
      service: 'Premium Car Wash',
      vehicle: 'Maruti Swift • MH 01 AB 1234',
      date: 'Today',
      time: '11:00 AM',
      amount: 499,
      status: 'IN_PROGRESS',
      technician: 'Rahul Sharma',
    ),
    _BookingItem(
      id: 'BK002',
      service: '120-Point Inspection',
      vehicle: 'Hyundai Creta • KA 02 CD 5678',
      date: 'Tomorrow',
      time: '09:00 AM',
      amount: 799,
      status: 'CONFIRMED',
      technician: 'Amit Kumar',
    ),
  ];

  final List<_BookingItem> _pastBookings = const [
    _BookingItem(
      id: 'BK098',
      service: 'Basic Wash',
      vehicle: 'Maruti Swift • MH 01 AB 1234',
      date: '15 May 2025',
      time: '10:00 AM',
      amount: 199,
      status: 'COMPLETED',
      technician: 'Suresh Patil',
    ),
    _BookingItem(
      id: 'BK097',
      service: 'Full Detailing',
      vehicle: 'Hyundai Creta • KA 02 CD 5678',
      date: '10 May 2025',
      time: '08:00 AM',
      amount: 2999,
      status: 'COMPLETED',
      technician: 'Vikram Rao',
    ),
    _BookingItem(
      id: 'BK096',
      service: 'Oil Change',
      vehicle: 'Maruti Swift • MH 01 AB 1234',
      date: '05 May 2025',
      time: '11:00 AM',
      amount: 899,
      status: 'CANCELLED',
      technician: 'N/A',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Bookings'),
        automaticallyImplyLeading: false,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorSize: TabBarIndicatorSize.label,
          indicatorWeight: 3,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          tabs: [
            Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Active'),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${_activeBookings.length}',
                      style: const TextStyle(
                        color: Colors.black,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Tab(text: 'Past'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildBookingsList(_activeBookings, isActive: true),
          _buildBookingsList(_pastBookings, isActive: false),
        ],
      ),
    );
  }

  Widget _buildBookingsList(List<_BookingItem> bookings, {required bool isActive}) {
    if (bookings.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive
                  ? Icons.calendar_month_rounded
                  : Icons.history_rounded,
              size: 64,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 16),
            Text(
              isActive ? 'No active bookings' : 'No past bookings',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              isActive
                  ? 'Book a service to get started'
                  : 'Your completed bookings will appear here',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (isActive) ...[
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => context.go('/service-packages/wash'),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text('Book Now'),
                style: ElevatedButton.styleFrom(
                    minimumSize: const Size(180, 48)),
              ),
            ],
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await Future.delayed(const Duration(seconds: 1));
      },
      color: AppColors.primary,
      backgroundColor: AppColors.surface,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          return AnimationConfiguration.staggeredList(
            position: index,
            duration: const Duration(milliseconds: 400),
            child: SlideAnimation(
              verticalOffset: 30,
              child: FadeInAnimation(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: _BookingCard(
                    booking: bookings[index],
                    isActive: isActive,
                    onTrack: () => context.push(
                        '/booking-tracking/${bookings[index].id}'),
                    onRate: () {},
                    onCancel: () => _showCancelDialog(bookings[index].id),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showCancelDialog(String bookingId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text('Cancel Booking'),
        content: const Text(
            'Are you sure you want to cancel this booking? A cancellation fee may apply.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep Booking'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Booking cancelled')),
              );
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Cancel Booking'),
          ),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final _BookingItem booking;
  final bool isActive;
  final VoidCallback onTrack;
  final VoidCallback onRate;
  final VoidCallback onCancel;

  const _BookingCard({
    required this.booking,
    required this.isActive,
    required this.onTrack,
    required this.onRate,
    required this.onCancel,
  });

  Color get _statusColor {
    switch (booking.status) {
      case 'IN_PROGRESS':
        return const Color(0xFF9C27B0);
      case 'CONFIRMED':
        return AppColors.info;
      case 'COMPLETED':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.error;
      default:
        return AppColors.warning;
    }
  }

  String get _statusLabel {
    switch (booking.status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  }

  IconData get _serviceIcon {
    if (booking.service.toLowerCase().contains('wash')) {
      return Icons.water_drop_rounded;
    } else if (booking.service.toLowerCase().contains('inspect')) {
      return Icons.search_rounded;
    } else if (booking.service.toLowerCase().contains('detail')) {
      return Icons.auto_fix_high_rounded;
    }
    return Icons.build_rounded;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isActive
              ? _statusColor.withOpacity(0.3)
              : AppColors.border,
          width: isActive ? 1 : 0.5,
        ),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: _statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(_serviceIcon,
                          color: _statusColor, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(booking.service,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(booking.vehicle,
                              style: Theme.of(context).textTheme.bodySmall,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                    // Status chip
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _statusLabel,
                        style: TextStyle(
                          color: _statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Details row
                Row(
                  children: [
                    _DetailChip(
                        icon: Icons.calendar_today_rounded,
                        text: booking.date),
                    const SizedBox(width: 12),
                    _DetailChip(
                        icon: Icons.schedule_rounded, text: booking.time),
                    const Spacer(),
                    Text(
                      '₹${booking.amount}',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Divider
          const Divider(height: 1, color: AppColors.divider),

          // Action buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                if (booking.status == 'IN_PROGRESS' ||
                    booking.status == 'CONFIRMED')
                  Expanded(
                    child: TextButton.icon(
                      onPressed: onTrack,
                      icon: const Icon(Icons.gps_fixed_rounded, size: 16),
                      label: const Text('Track'),
                    ),
                  ),
                if (booking.status == 'COMPLETED')
                  Expanded(
                    child: TextButton.icon(
                      onPressed: onRate,
                      icon: const Icon(Icons.star_outline_rounded, size: 16),
                      label: const Text('Rate'),
                    ),
                  ),
                if (booking.status == 'CANCELLED' ||
                    booking.status == 'COMPLETED')
                  Expanded(
                    child: TextButton.icon(
                      onPressed: () => context.push('/book-service',
                          extra: {'packageId': ''}),
                      icon: const Icon(Icons.refresh_rounded, size: 16),
                      label: const Text('Rebook'),
                    ),
                  ),
                if (booking.status == 'CONFIRMED')
                  Expanded(
                    child: TextButton.icon(
                      onPressed: onCancel,
                      icon: const Icon(Icons.close_rounded, size: 16),
                      label: const Text('Cancel'),
                      style: TextButton.styleFrom(
                          foregroundColor: AppColors.error),
                    ),
                  ),
                Expanded(
                  child: TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.help_outline_rounded, size: 16),
                    label: const Text('Help'),
                    style: TextButton.styleFrom(
                        foregroundColor: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  final IconData icon;
  final String text;

  const _DetailChip({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Text(text, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
