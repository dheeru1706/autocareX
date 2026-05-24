import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

class PartnerBooking {
  final String id;
  final String customerName;
  final String service;
  final String vehicle;
  final String address;
  final String time;
  final int amount;
  final String status;

  const PartnerBooking({
    required this.id,
    required this.customerName,
    required this.service,
    required this.vehicle,
    required this.address,
    required this.time,
    required this.amount,
    required this.status,
  });
}

class StaffMember {
  final String id;
  final String name;
  final String role;
  final bool isOnDuty;
  final int completedToday;
  final double rating;

  const StaffMember({
    required this.id,
    required this.name,
    required this.role,
    required this.isOnDuty,
    required this.completedToday,
    required this.rating,
  });
}

class PartnerDashboardScreen extends ConsumerStatefulWidget {
  const PartnerDashboardScreen({super.key});

  @override
  ConsumerState<PartnerDashboardScreen> createState() =>
      _PartnerDashboardScreenState();
}

class _PartnerDashboardScreenState
    extends ConsumerState<PartnerDashboardScreen> {
  final List<PartnerBooking> _pendingBookings = const [
    PartnerBooking(
      id: 'PB001',
      customerName: 'Arjun Sharma',
      service: 'Premium Car Wash',
      vehicle: 'Maruti Swift',
      address: '14, Koregaon Park, Pune',
      time: '11:00 AM',
      amount: 499,
      status: 'PENDING',
    ),
    PartnerBooking(
      id: 'PB002',
      customerName: 'Priya Mehta',
      service: '120-Point Inspection',
      vehicle: 'Hyundai Creta',
      address: 'Tower B, Magarpatta, Pune',
      time: '01:00 PM',
      amount: 799,
      status: 'PENDING',
    ),
  ];

  final List<StaffMember> _staff = const [
    StaffMember(
      id: 'S1',
      name: 'Rahul Sharma',
      role: 'Senior Technician',
      isOnDuty: true,
      completedToday: 3,
      rating: 4.9,
    ),
    StaffMember(
      id: 'S2',
      name: 'Amit Kumar',
      role: 'Washer',
      isOnDuty: true,
      completedToday: 4,
      rating: 4.7,
    ),
    StaffMember(
      id: 'S3',
      name: 'Suresh Patil',
      role: 'Detailer',
      isOnDuty: false,
      completedToday: 0,
      rating: 4.8,
    ),
  ];

  // Weekly revenue data
  final List<double> _weeklyRevenue = const [
    4200, 6800, 5500, 8100, 9200, 7400, 11200,
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Partner Dashboard'),
            Text(
              'AutoCareX Partner',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.primary,
                    fontSize: 11,
                  ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async =>
            await Future.delayed(const Duration(seconds: 1)),
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 100),
          children: [
            // Today's Stats
            _buildTodayStats(),
            const SizedBox(height: 20),

            // Revenue Chart
            _buildRevenueChart(),
            const SizedBox(height: 20),

            // Pending Bookings
            _buildSectionHeader('Incoming Requests',
                badge: '${_pendingBookings.length}'),
            ..._pendingBookings.asMap().entries.map((entry) =>
                AnimationConfiguration.staggeredList(
                  position: entry.key,
                  duration: const Duration(milliseconds: 400),
                  child: FadeInAnimation(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _PendingBookingCard(
                        booking: entry.value,
                        onAccept: () => _acceptBooking(entry.value.id),
                        onDecline: () => _declineBooking(entry.value.id),
                      ),
                    ),
                  ),
                )),

            const SizedBox(height: 8),

            // Staff
            _buildSectionHeader('Staff Today'),
            ..._staff.map(
              (s) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _StaffCard(member: s),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTodayStats() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Today\'s Overview',
          style: Theme.of(context)
              .textTheme
              .titleMedium
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          childAspectRatio: 1.8,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          children: [
            _StatCard(
              title: 'Earnings',
              value: '₹6,840',
              icon: Icons.account_balance_wallet_rounded,
              color: AppColors.primary,
              trend: '+12% vs yesterday',
              trendUp: true,
            ),
            _StatCard(
              title: 'Bookings',
              value: '7',
              icon: Icons.calendar_month_rounded,
              color: AppColors.info,
              trend: '2 pending',
              trendUp: null,
            ),
            _StatCard(
              title: 'Completed',
              value: '5',
              icon: Icons.check_circle_rounded,
              color: AppColors.success,
              trend: '71% completion',
              trendUp: true,
            ),
            _StatCard(
              title: 'Rating',
              value: '4.8★',
              icon: Icons.star_rounded,
              color: AppColors.warning,
              trend: '+0.1 this week',
              trendUp: true,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRevenueChart() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Weekly Revenue',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
            Text(
              '₹${_weeklyRevenue.reduce((a, b) => a + b).toStringAsFixed(0)} total',
              style: TextStyle(
                color: AppColors.primary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          height: 200,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: 14000,
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  tooltipBgColor: AppColors.surface,
                  getTooltipItem: (group, groupIndex, rod, rodIndex) {
                    return BarTooltipItem(
                      '₹${rod.toY.toStringAsFixed(0)}',
                      const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    );
                  },
                ),
              ),
              titlesData: FlTitlesData(
                show: true,
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (value, meta) {
                      const days = [
                        'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
                      ];
                      return Text(
                        days[value.toInt()],
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      );
                    },
                  ),
                ),
                leftTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
              ),
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: 3500,
                getDrawingHorizontalLine: (value) => FlLine(
                  color: AppColors.divider,
                  strokeWidth: 0.5,
                ),
              ),
              borderData: FlBorderData(show: false),
              barGroups: _weeklyRevenue.asMap().entries.map((entry) {
                final isToday = entry.key == DateTime.now().weekday - 1;
                return BarChartGroupData(
                  x: entry.key,
                  barRods: [
                    BarChartRodData(
                      toY: entry.value,
                      color: isToday ? AppColors.primary : AppColors.primary.withOpacity(0.4),
                      width: 20,
                      borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(6)),
                      backDrawRodData: BackgroundBarChartRodData(
                        show: true,
                        toY: 14000,
                        color: AppColors.surface,
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, {String? badge}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Text(
            title,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          if (badge != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                badge,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _acceptBooking(String id) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Booking accepted!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _declineBooking(String id) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Booking declined'),
        backgroundColor: AppColors.error,
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String trend;
  final bool? trendUp;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.trend,
    required this.trendUp,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            trend,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize: 10,
              color: trendUp == null
                  ? AppColors.textSecondary
                  : trendUp!
                      ? AppColors.success
                      : AppColors.error,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _PendingBookingCard extends StatelessWidget {
  final PartnerBooking booking;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const _PendingBookingCard({
    required this.booking,
    required this.onAccept,
    required this.onDecline,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
            color: AppColors.warning.withOpacity(0.3), width: 1),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'NEW REQUEST',
                        style: TextStyle(
                          color: AppColors.warning,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      booking.time,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            booking.customerName,
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          Text(booking.service,
                              style:
                                  Theme.of(context).textTheme.bodySmall),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.directions_car_rounded,
                                  size: 12, color: AppColors.textSecondary),
                              const SizedBox(width: 4),
                              Text(booking.vehicle,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₹${booking.amount}',
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                Row(
                  children: [
                    const Icon(Icons.location_on_rounded,
                        size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        booking.address,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.divider),

          Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onDecline,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: BorderSide(
                          color: AppColors.error.withOpacity(0.5)),
                      minimumSize: const Size(0, 44),
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: onAccept,
                    icon: const Icon(Icons.check_rounded, size: 18),
                    label: const Text('Accept'),
                    style: ElevatedButton.styleFrom(
                        minimumSize: const Size(0, 44)),
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

class _StaffCard extends StatelessWidget {
  final StaffMember member;

  const _StaffCard({required this.member});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: member.isOnDuty
                  ? AppColors.success.withOpacity(0.15)
                  : AppColors.surface,
              border: Border.all(
                color: member.isOnDuty ? AppColors.success : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Center(
              child: Text(
                member.name.split(' ').map((e) => e[0]).take(2).join(),
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: member.isOnDuty
                      ? AppColors.success
                      : AppColors.textSecondary,
                ),
              ),
            ),
          ),

          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      member.name,
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: member.isOnDuty
                            ? AppColors.success
                            : AppColors.textHint,
                      ),
                    ),
                  ],
                ),
                Text(
                  member.role,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),

          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${member.completedToday} done',
                style: TextStyle(
                  color: AppColors.success,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.star_rounded,
                      size: 12, color: AppColors.primary),
                  const SizedBox(width: 2),
                  Text(
                    '${member.rating}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
