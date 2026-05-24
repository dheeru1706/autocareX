import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

class BookingTrackingScreen extends ConsumerStatefulWidget {
  final String bookingId;
  const BookingTrackingScreen({super.key, required this.bookingId});

  @override
  ConsumerState<BookingTrackingScreen> createState() =>
      _BookingTrackingScreenState();
}

class _BookingTrackingScreenState extends ConsumerState<BookingTrackingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pingController;
  int _currentStatus = 1; // 0=confirmed, 1=on way, 2=arrived, 3=in progress, 4=done

  static const List<_StatusStep> _statusSteps = [
    _StatusStep(
      title: 'Booking Confirmed',
      subtitle: 'Your booking is confirmed',
      icon: Icons.check_circle_rounded,
      time: '10:00 AM',
    ),
    _StatusStep(
      title: 'Technician Assigned',
      subtitle: 'Rahul Sharma is on the way',
      icon: Icons.person_rounded,
      time: '10:05 AM',
    ),
    _StatusStep(
      title: 'Technician Arrived',
      subtitle: 'Verify OTP to start service',
      icon: Icons.location_on_rounded,
      time: '10:45 AM',
    ),
    _StatusStep(
      title: 'Service In Progress',
      subtitle: 'Your car is being serviced',
      icon: Icons.build_rounded,
      time: '',
    ),
    _StatusStep(
      title: 'Service Completed',
      subtitle: 'Rate your experience',
      icon: Icons.star_rounded,
      time: '',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _pingController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pingController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // App bar + Map
          SliverToBoxAdapter(
            child: _buildMapSection(context),
          ),

          // Booking info
          SliverToBoxAdapter(
            child: _buildStaffCard(context),
          ),

          // Status timeline
          SliverToBoxAdapter(
            child: _buildStatusTimeline(context),
          ),

          // OTP section (if arrived)
          if (_currentStatus == 2)
            SliverToBoxAdapter(
              child: _buildOtpSection(context),
            ),

          // Before/After photos (if completed)
          if (_currentStatus == 4)
            SliverToBoxAdapter(
              child: _buildPhotosSection(context),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
      floatingActionButton: _buildFABs(context),
    );
  }

  Widget _buildMapSection(BuildContext context) {
    return Stack(
      children: [
        // Map placeholder
        Container(
          height: 280,
          color: const Color(0xFF1A1F2E),
          child: Stack(
            children: [
              // Mock map grid
              CustomPaint(
                size: const Size(double.infinity, 280),
                painter: _MapGridPainter(),
              ),

              // Animated technician pin
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Ping animation
                    AnimatedBuilder(
                      animation: _pingController,
                      builder: (context, child) {
                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 60 + (_pingController.value * 40),
                              height: 60 + (_pingController.value * 40),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary.withOpacity(
                                    0.2 * (1 - _pingController.value)),
                              ),
                            ),
                            Container(
                              width: 20,
                              height: 20,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.5),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'Technician',
                        style: TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
                color: AppColors.card,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_ios_rounded,
                  size: 18, color: AppColors.textPrimary),
            ),
          ),
        ),

        // ETA chip
        Positioned(
          top: 48,
          right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.schedule_rounded,
                    size: 14, color: AppColors.primary),
                const SizedBox(width: 4),
                const Text(
                  'ETA 15 min',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStaffCard(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
              ),
              child: const Center(
                child: Text(
                  'RS',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
              ),
            ),

            const SizedBox(width: 14),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Rahul Sharma',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded,
                          size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        '4.9 • 1,247 services',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Call & Chat buttons
            Row(
              children: [
                _ActionBtn(
                  icon: Icons.call_rounded,
                  color: AppColors.success,
                  onTap: () {},
                ),
                const SizedBox(width: 8),
                _ActionBtn(
                  icon: Icons.chat_bubble_rounded,
                  color: AppColors.info,
                  onTap: () =>
                      context.push('/chat/conv_${widget.bookingId}'),
                ),
              ],
            ),
          ],
        ),
      ).animate().fadeIn().slideY(begin: 0.2, end: 0),
    );
  }

  Widget _buildStatusTimeline(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Booking Status',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
          ..._statusSteps.asMap().entries.map((entry) {
            final index = entry.key;
            final step = entry.value;
            final isDone = index < _currentStatus;
            final isCurrent = index == _currentStatus;

            return Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDone
                            ? AppColors.success
                            : isCurrent
                                ? AppColors.primary
                                : AppColors.surface,
                        border: Border.all(
                          color: isDone
                              ? AppColors.success
                              : isCurrent
                                  ? AppColors.primary
                                  : AppColors.border,
                          width: 1.5,
                        ),
                      ),
                      child: Icon(
                        isDone ? Icons.check_rounded : step.icon,
                        size: 18,
                        color: isDone
                            ? Colors.white
                            : isCurrent
                                ? Colors.black
                                : AppColors.textHint,
                      ),
                    ),
                    if (index < _statusSteps.length - 1)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 400),
                        width: 2,
                        height: 40,
                        color:
                            isDone ? AppColors.success : AppColors.border,
                      ),
                  ],
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 6, bottom: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment:
                              MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              step.title,
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 14,
                                fontWeight: isCurrent || isDone
                                    ? FontWeight.w700
                                    : FontWeight.w400,
                                color: isDone || isCurrent
                                    ? AppColors.textPrimary
                                    : AppColors.textHint,
                              ),
                            ),
                            if (step.time.isNotEmpty)
                              Text(
                                step.time,
                                style: const TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                          ],
                        ),
                        if (isCurrent)
                          Text(
                            step.subtitle,
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 12,
                              color: AppColors.primary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildOtpSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: AppColors.primary.withOpacity(0.3), width: 1),
        ),
        child: Column(
          children: [
            const Text(
              'Share this OTP to start service',
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              '7 3 4 2',
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 40,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
                letterSpacing: 12,
              ),
            ),
          ],
        ),
      ).animate().fadeIn(),
    );
  }

  Widget _buildPhotosSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Before & After',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  children: [
                    Container(
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text('Before',
                            style: TextStyle(color: AppColors.textSecondary)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text('Before',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              const Icon(Icons.arrow_forward_rounded,
                  color: AppColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  children: [
                    Container(
                      height: 120,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text('After',
                            style: TextStyle(color: AppColors.textSecondary)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text('After',
                        style: TextStyle(
                            color: AppColors.success, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () {},
            child: const Text('Rate Your Experience ⭐'),
          ),
        ],
      ),
    );
  }

  Widget _buildFABs(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        FloatingActionButton(
          heroTag: 'call',
          onPressed: () {},
          backgroundColor: AppColors.success,
          mini: true,
          child: const Icon(Icons.call_rounded, color: Colors.white),
        ),
        const SizedBox(height: 8),
        FloatingActionButton(
          heroTag: 'chat',
          onPressed: () =>
              context.push('/chat/conv_${widget.bookingId}'),
          backgroundColor: AppColors.info,
          child: const Icon(Icons.chat_bubble_rounded, color: Colors.white),
        ),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }
}

class _StatusStep {
  final String title;
  final String subtitle;
  final IconData icon;
  final String time;

  const _StatusStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.time,
  });
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF252D3D)
      ..strokeWidth = 0.5;

    // Draw grid lines
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw mock road
    final roadPaint = Paint()
      ..color = const Color(0xFF2D3748)
      ..strokeWidth = 20
      ..strokeCap = StrokeCap.round;

    canvas.drawLine(
      Offset(0, size.height * 0.5),
      Offset(size.width, size.height * 0.5),
      roadPaint,
    );
    canvas.drawLine(
      Offset(size.width * 0.4, 0),
      Offset(size.width * 0.4, size.height),
      roadPaint,
    );
  }

  @override
  bool shouldRepaint(_MapGridPainter oldDelegate) => false;
}
