import 'package:badges/badges.dart' as badges;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

// Provider for active bookings count (for badge)
final activeBookingsCountProvider = StateProvider<int>((ref) => 2);

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  static const _tabs = [
    _TabItem(
      icon: Icons.home_rounded,
      label: 'Home',
      path: '/home/dashboard',
    ),
    _TabItem(
      icon: Icons.calendar_month_rounded,
      label: 'Bookings',
      path: '/home/bookings',
    ),
    _TabItem(
      icon: Icons.storefront_rounded,
      label: 'Market',
      path: '/home/marketplace',
    ),
    _TabItem(
      icon: Icons.person_rounded,
      label: 'Profile',
      path: '/home/profile',
    ),
  ];

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = _getCurrentIndex(context);
    final activeCount = ref.watch(activeBookingsCountProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(
            top: BorderSide(color: AppColors.divider, width: 0.5),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (index) {
                final tab = _tabs[index];
                final isActive = currentIndex == index;

                return _NavItem(
                  tab: tab,
                  isActive: isActive,
                  badge: index == 1 && activeCount > 0 ? activeCount : 0,
                  onTap: () => context.go(tab.path),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final String label;
  final String path;

  const _TabItem({
    required this.icon,
    required this.label,
    required this.path,
  });
}

class _NavItem extends StatelessWidget {
  final _TabItem tab;
  final bool isActive;
  final int badge;
  final VoidCallback onTap;

  const _NavItem({
    required this.tab,
    required this.isActive,
    required this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: isActive
                    ? AppColors.primary.withOpacity(0.15)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: badge > 0
                  ? badges.Badge(
                      badgeContent: Text(
                        badge.toString(),
                        style: const TextStyle(
                          color: Colors.black,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      badgeStyle: const badges.BadgeStyle(
                        badgeColor: AppColors.primary,
                        padding: EdgeInsets.all(4),
                      ),
                      child: Icon(
                        tab.icon,
                        color: isActive
                            ? AppColors.primary
                            : AppColors.textSecondary,
                        size: 24,
                      ),
                    )
                  : Icon(
                      tab.icon,
                      color: isActive
                          ? AppColors.primary
                          : AppColors.textSecondary,
                      size: 24,
                    ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: TextStyle(
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight:
                    isActive ? FontWeight.w700 : FontWeight.w400,
                color:
                    isActive ? AppColors.primary : AppColors.textSecondary,
              ),
              child: Text(tab.label),
            ),
          ],
        ),
      ),
    );
  }
}
