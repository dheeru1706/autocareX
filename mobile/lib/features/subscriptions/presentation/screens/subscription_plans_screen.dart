import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

class SubscriptionPlan {
  final String id;
  final String name;
  final int monthlyPrice;
  final int yearlyPrice;
  final List<FeatureRow> features;
  final bool isPopular;
  final Color color;
  final IconData icon;
  final String badge;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.monthlyPrice,
    required this.yearlyPrice,
    required this.features,
    this.isPopular = false,
    required this.color,
    required this.icon,
    required this.badge,
  });

  int get yearlySaving => (monthlyPrice * 12) - yearlyPrice;
  int get yearlySavingPercent =>
      ((yearlySaving / (monthlyPrice * 12)) * 100).round();
}

class FeatureRow {
  final String name;
  final bool? basic;
  final bool? premium;
  final bool? fleet;

  const FeatureRow(this.name, {this.basic, this.premium, this.fleet});
}

final billingCycleProvider = StateProvider<bool>((ref) => false); // false=monthly, true=yearly

class SubscriptionPlansScreen extends ConsumerWidget {
  const SubscriptionPlansScreen({super.key});

  static final List<SubscriptionPlan> _plans = [
    SubscriptionPlan(
      id: 'basic',
      name: 'Basic',
      monthlyPrice: 299,
      yearlyPrice: 2388,
      color: const Color(0xFF2196F3),
      icon: Icons.star_border_rounded,
      badge: 'Starter',
      features: const [
        FeatureRow('Car Washes / Month', basic: true, premium: true, fleet: true),
        FeatureRow('Free Pickup & Drop', basic: false, premium: true, fleet: true),
        FeatureRow('Priority Booking', basic: false, premium: true, fleet: true),
        FeatureRow('Inspection Discount', basic: false, premium: true, fleet: true),
        FeatureRow('Fleet Management', basic: false, premium: false, fleet: true),
        FeatureRow('Dedicated Account Manager', basic: false, premium: false, fleet: true),
      ],
    ),
    SubscriptionPlan(
      id: 'premium',
      name: 'Premium',
      monthlyPrice: 699,
      yearlyPrice: 5588,
      color: AppColors.primary,
      icon: Icons.workspace_premium_rounded,
      badge: 'Best Value',
      isPopular: true,
      features: const [],
    ),
    SubscriptionPlan(
      id: 'fleet',
      name: 'Fleet',
      monthlyPrice: 1999,
      yearlyPrice: 15988,
      color: const Color(0xFF9C27B0),
      icon: Icons.directions_car_filled_rounded,
      badge: 'Business',
      features: const [],
    ),
  ];

  static const List<String> _featureNames = [
    'Washes Included',
    'Free Pickup & Drop',
    'Priority Booking',
    'Inspection Discount',
    'Fleet Management',
    'Account Manager',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isYearly = ref.watch(billingCycleProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Subscription Plans'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Column(
                children: [
                  Text(
                    'Choose Your Plan',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Save more with annual billing',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Billing toggle
            _BillingToggle(
              isYearly: isYearly,
              onToggle: () =>
                  ref.read(billingCycleProvider.notifier).state = !isYearly,
            ),

            const SizedBox(height: 24),

            // Plan cards (horizontal scroll)
            SizedBox(
              height: 460,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: _plans.length,
                itemBuilder: (context, index) {
                  final plan = _plans[index];
                  return AnimationConfiguration.staggeredList(
                    position: index,
                    duration: const Duration(milliseconds: 400),
                    child: SlideAnimation(
                      horizontalOffset: 50,
                      child: FadeInAnimation(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 16),
                          child: _PlanCard(
                            plan: plan,
                            isYearly: isYearly,
                            isCurrentPlan: plan.id == 'basic',
                            onSubscribe: () => _subscribe(context, plan, isYearly),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 24),

            // Feature comparison table
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _FeatureComparisonTable(plans: _plans),
            ),

            const SizedBox(height: 32),

            // FAQ / Guarantee
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: AppColors.primary.withOpacity(0.2), width: 0.5),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_rounded,
                        color: AppColors.success, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '7-Day Money Back Guarantee',
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(color: AppColors.success),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Not satisfied? Get a full refund within 7 days of purchase.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  void _subscribe(
      BuildContext context, SubscriptionPlan plan, bool isYearly) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Subscribe to ${plan.name}',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              isYearly
                  ? '₹${plan.yearlyPrice}/year (save ₹${plan.yearlySaving})'
                  : '₹${plan.monthlyPrice}/month',
              style: TextStyle(
                color: plan.color,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                // Razorpay integration
              },
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 56),
                backgroundColor: plan.color,
                foregroundColor:
                    plan.id == 'premium' ? Colors.black : Colors.white,
              ),
              child: Text(
                'Pay ${isYearly ? '₹${plan.yearlyPrice}' : '₹${plan.monthlyPrice}'}',
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Cancel anytime • Auto-renews',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}

class _BillingToggle extends StatelessWidget {
  final bool isYearly;
  final VoidCallback onToggle;

  const _BillingToggle({required this.isYearly, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border, width: 0.5),
        ),
        child: Stack(
          children: [
            // Sliding indicator
            AnimatedAlign(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              alignment: isYearly
                  ? Alignment.centerRight
                  : Alignment.centerLeft,
              child: FractionallySizedBox(
                widthFactor: 0.5,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 40,
                    child: Center(
                      child: Text(
                        'Monthly',
                        style: TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: !isYearly ? Colors.black : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: SizedBox(
                    height: 40,
                    child: Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Yearly',
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isYearly
                                  ? Colors.black
                                  : AppColors.textSecondary,
                            ),
                          ),
                          if (!isYearly) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 4, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.success.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: const Text(
                                '-20%',
                                style: TextStyle(
                                  color: AppColors.success,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final SubscriptionPlan plan;
  final bool isYearly;
  final bool isCurrentPlan;
  final VoidCallback onSubscribe;

  const _PlanCard({
    required this.plan,
    required this.isYearly,
    required this.isCurrentPlan,
    required this.onSubscribe,
  });

  int get _displayPrice =>
      isYearly ? plan.yearlyPrice : plan.monthlyPrice;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: plan.isPopular
              ? plan.color
              : AppColors.border,
          width: plan.isPopular ? 1.5 : 0.5,
        ),
        boxShadow: plan.isPopular
            ? [
                BoxShadow(
                  color: plan.color.withOpacity(0.2),
                  blurRadius: 20,
                ),
              ]
            : [],
      ),
      child: Column(
        children: [
          if (plan.isPopular)
            Container(
              decoration: BoxDecoration(
                color: plan.color,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.star_rounded, size: 12, color: Colors.black),
                  SizedBox(width: 4),
                  Text(
                    'MOST POPULAR',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon + Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: plan.color.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(plan.icon, color: plan.color, size: 24),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: plan.color.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        plan.badge,
                        style: TextStyle(
                          color: plan.color,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                Text(
                  plan.name,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),

                const SizedBox(height: 8),

                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹$_displayPrice',
                      style: TextStyle(
                        fontFamily: 'Inter',
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: plan.color,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4, left: 4),
                      child: Text(
                        isYearly ? '/year' : '/mo',
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),

                if (isYearly)
                  Text(
                    'Save ₹${plan.yearlySaving} (${plan.yearlySavingPercent}% off)',
                    style: const TextStyle(
                      color: AppColors.success,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                const SizedBox(height: 16),

                // Key features
                ...[
                  'Unlimited Washes',
                  if (plan.id != 'basic') 'Free Pickup & Drop',
                  if (plan.id == 'premium' || plan.id == 'fleet') 'Priority Booking',
                  if (plan.id == 'fleet') 'Fleet Dashboard',
                ].map(
                  (f) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Icon(Icons.check_circle_rounded,
                            size: 14, color: plan.color),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            f,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(color: AppColors.textPrimary),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // CTA
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: isCurrentPlan
                      ? Container(
                          decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppColors.success.withOpacity(0.3)),
                          ),
                          child: const Center(
                            child: Text(
                              '✓ Current Plan',
                              style: TextStyle(
                                color: AppColors.success,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        )
                      : ElevatedButton(
                          onPressed: onSubscribe,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: plan.color,
                            foregroundColor: plan.id == 'premium'
                                ? Colors.black
                                : Colors.white,
                            minimumSize: const Size(0, 44),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text(
                            'Subscribe',
                            style: TextStyle(fontWeight: FontWeight.w700),
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

class _FeatureComparisonTable extends StatelessWidget {
  final List<SubscriptionPlan> plans;
  const _FeatureComparisonTable({required this.plans});

  @override
  Widget build(BuildContext context) {
    const features = [
      'Car Washes/Month',
      'Free Pickup & Drop',
      'Priority Booking',
      '20% Off Inspection',
      'Fleet Dashboard',
      'Account Manager',
    ];

    const basicValues = ['4', '✗', '✗', '✗', '✗', '✗'];
    const premiumValues = ['Unlimited', '✓', '✓', '✓', '✗', '✗'];
    const fleetValues = ['Unlimited', '✓', '✓', '✓', '✓', '✓'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Feature Comparison',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 16),
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  border: Border(
                      bottom:
                          BorderSide(color: AppColors.divider, width: 0.5)),
                ),
                child: const Row(
                  children: [
                    Expanded(flex: 3, child: SizedBox()),
                    Expanded(
                        child: Center(
                            child: Text('Basic',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF2196F3))))),
                    Expanded(
                        child: Center(
                            child: Text('Premium',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary)))),
                    Expanded(
                        child: Center(
                            child: Text('Fleet',
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF9C27B0))))),
                  ],
                ),
              ),

              // Rows
              ...List.generate(features.length, (index) {
                return Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 12),
                  decoration: index < features.length - 1
                      ? const BoxDecoration(
                          border: Border(
                              bottom: BorderSide(
                                  color: AppColors.divider, width: 0.5)))
                      : null,
                  child: Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Text(
                          features[index],
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Center(
                          child: _FeatureCell(basicValues[index]),
                        ),
                      ),
                      Expanded(
                        child: Center(
                          child: _FeatureCell(premiumValues[index]),
                        ),
                      ),
                      Expanded(
                        child: Center(
                          child: _FeatureCell(fleetValues[index]),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }
}

class _FeatureCell extends StatelessWidget {
  final String value;
  const _FeatureCell(this.value);

  @override
  Widget build(BuildContext context) {
    if (value == '✓') {
      return const Icon(Icons.check_circle_rounded,
          color: AppColors.success, size: 18);
    } else if (value == '✗') {
      return const Icon(Icons.cancel_rounded,
          color: AppColors.textHint, size: 18);
    }
    return Text(
      value,
      style: const TextStyle(
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
    );
  }
}
