import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

class InsurancePolicy {
  final String id;
  final String vehicle;
  final String provider;
  final String policyNumber;
  final DateTime expiryDate;
  final String type;
  final double premium;
  final double coverage;

  const InsurancePolicy({
    required this.id,
    required this.vehicle,
    required this.provider,
    required this.policyNumber,
    required this.expiryDate,
    required this.type,
    required this.premium,
    required this.coverage,
  });

  int get daysLeft =>
      expiryDate.difference(DateTime.now()).inDays;

  bool get isExpired => daysLeft < 0;
  bool get isExpiringSoon => daysLeft >= 0 && daysLeft <= 30;

  Color get statusColor {
    if (isExpired) return AppColors.error;
    if (isExpiringSoon) return AppColors.warning;
    return AppColors.success;
  }

  String get statusText {
    if (isExpired) return 'Expired';
    if (isExpiringSoon) return 'Expiring in $daysLeft days';
    return 'Active • $daysLeft days left';
  }
}

final insurancePoliciesProvider =
    StateProvider<List<InsurancePolicy>>((ref) => [
          InsurancePolicy(
            id: 'INS001',
            vehicle: 'Maruti Swift • MH 01 AB 1234',
            provider: 'HDFC Ergo',
            policyNumber: 'HDFC-2024-MH01AB1234',
            expiryDate: DateTime.now().add(const Duration(days: 18)),
            type: 'Comprehensive',
            premium: 12800,
            coverage: 700000,
          ),
          InsurancePolicy(
            id: 'INS002',
            vehicle: 'Hyundai Creta • KA 02 CD 5678',
            provider: 'New India Assurance',
            policyNumber: 'NIA-2025-KA02CD5678',
            expiryDate: DateTime.now().add(const Duration(days: 245)),
            type: 'Comprehensive',
            premium: 18500,
            coverage: 1250000,
          ),
        ]);

class InsuranceScreen extends ConsumerWidget {
  const InsuranceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final policies = ref.watch(insurancePoliciesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Insurance'),
        actions: [
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Add Policy'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        children: [
          // Alert Banner for expiring soon
          if (policies.any((p) => p.isExpiringSoon || p.isExpired))
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.warning.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    color: AppColors.warning.withOpacity(0.3), width: 1),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded,
                      color: AppColors.warning, size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Insurance Expiry Alert',
                          style: TextStyle(
                            color: AppColors.warning,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          '${policies.where((p) => p.isExpiringSoon || p.isExpired).length} policy(ies) need attention',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: -0.2, end: 0),

          // Policy Cards
          ...policies.asMap().entries.map((entry) {
            return AnimationConfiguration.staggeredList(
              position: entry.key,
              duration: const Duration(milliseconds: 400),
              child: SlideAnimation(
                verticalOffset: 30,
                child: FadeInAnimation(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: _PolicyCard(policy: entry.value),
                  ),
                ),
              ),
            );
          }),

          // Claim Assistance Card
          _ClaimAssistanceCard(),

          const SizedBox(height: 20),

          // Why Renew with AutoCareX
          _WhyRenewCard(),
        ],
      ),
    );
  }
}

class _PolicyCard extends StatelessWidget {
  final InsurancePolicy policy;

  const _PolicyCard({required this.policy});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: policy.statusColor.withOpacity(0.3),
          width: 1,
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
                        color: AppColors.info.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.shield_rounded,
                          color: AppColors.info, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(policy.provider,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(policy.type,
                              style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ),
                    // Status chip
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: policy.statusColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        policy.isExpired
                            ? 'Expired'
                            : policy.isExpiringSoon
                                ? 'Expiring'
                                : 'Active',
                        style: TextStyle(
                          color: policy.statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Vehicle
                Row(
                  children: [
                    const Icon(Icons.directions_car_rounded,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(policy.vehicle,
                        style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),

                const SizedBox(height: 8),

                // Policy Number
                Row(
                  children: [
                    const Icon(Icons.numbers_rounded,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(policy.policyNumber,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              letterSpacing: 0.5,
                            )),
                  ],
                ),

                const SizedBox(height: 14),

                // Expiry status bar
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          policy.statusText,
                          style: TextStyle(
                            color: policy.statusColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          'Expires: ${policy.expiryDate.day}/${policy.expiryDate.month}/${policy.expiryDate.year}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: policy.isExpired
                            ? 0
                            : (policy.daysLeft / 365).clamp(0.0, 1.0),
                        backgroundColor: policy.statusColor.withOpacity(0.15),
                        color: policy.statusColor,
                        minHeight: 6,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // Coverage + Premium
                Row(
                  children: [
                    Expanded(
                      child: _InfoBox(
                        label: 'Coverage',
                        value: '₹${(policy.coverage / 100000).toStringAsFixed(1)}L',
                        icon: Icons.security_rounded,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _InfoBox(
                        label: 'Premium Paid',
                        value: '₹${policy.premium.toStringAsFixed(0)}',
                        icon: Icons.receipt_rounded,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          const Divider(height: 1, color: AppColors.divider),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.download_rounded, size: 16),
                    label: const Text('Download'),
                    style: TextButton.styleFrom(
                        foregroundColor: AppColors.textSecondary),
                  ),
                ),
                Expanded(
                  child: TextButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.report_problem_rounded, size: 16),
                    label: const Text('Claim'),
                    style: TextButton.styleFrom(
                        foregroundColor: AppColors.warning),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(0, 40),
                      backgroundColor: policy.statusColor,
                      foregroundColor: policy.isExpiringSoon || policy.isExpired
                          ? Colors.black
                          : Colors.white,
                    ),
                    child: Text(
                      policy.isExpired ? 'Renew Now' : 'Renew',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
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

class _InfoBox extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _InfoBox({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              Text(
                value,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ClaimAssistanceCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.error.withOpacity(0.15),
            AppColors.error.withOpacity(0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.health_and_safety_rounded,
                color: AppColors.error, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Claim Assistance',
                    style: Theme.of(context)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text('Met with an accident? Our team will help you file a claim.',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              minimumSize: const Size(0, 36),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Help',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

class _WhyRenewCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Why Renew with AutoCareX?',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          ...[
            ('Compare 10+ insurers instantly', Icons.compare_arrows_rounded, AppColors.info),
            ('Best price guarantee', Icons.thumb_up_rounded, AppColors.success),
            ('Instant policy issuance', Icons.flash_on_rounded, AppColors.primary),
            ('Free claim support', Icons.support_agent_rounded, AppColors.warning),
          ].map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  Icon(item.$2, size: 18, color: item.$3),
                  const SizedBox(width: 10),
                  Text(item.$1,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: AppColors.textPrimary)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
