import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';

import '../../../../core/theme/app_theme.dart';

// Step tracking
final bookingStepProvider = StateProvider<int>((ref) => 0);

class BookServiceScreen extends ConsumerStatefulWidget {
  final String packageId;
  const BookServiceScreen({super.key, required this.packageId});

  @override
  ConsumerState<BookServiceScreen> createState() => _BookServiceScreenState();
}

class _BookServiceScreenState extends ConsumerState<BookServiceScreen> {
  int _step = 0;
  String? _selectedVehicle;
  String? _selectedAddress;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedTimeSlot;
  String? _couponCode;
  bool _couponApplied = false;
  final _couponController = TextEditingController();

  static const List<String> _timeSlots = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM',
    '04:00 PM', '05:00 PM', '06:00 PM',
  ];

  final List<Map<String, String>> _mockVehicles = const [
    {'id': 'v1', 'name': 'Maruti Swift', 'plate': 'MH 01 AB 1234'},
    {'id': 'v2', 'name': 'Hyundai Creta', 'plate': 'KA 02 CD 5678'},
  ];

  final List<Map<String, String>> _mockAddresses = const [
    {
      'id': 'a1',
      'label': 'Home',
      'address': '14, Sunflower Society, Koregaon Park, Pune 411001'
    },
    {
      'id': 'a2',
      'label': 'Office',
      'address': 'Tower B, Magarpatta City, Hadapsar, Pune 411013'
    },
  ];

  final List<String> _stepTitles = const [
    'Vehicle',
    'Address',
    'Schedule',
    'Coupon',
    'Review',
  ];

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _VehicleStep(
          vehicles: _mockVehicles,
          selected: _selectedVehicle,
          onSelect: (id) => setState(() => _selectedVehicle = id),
        );
      case 1:
        return _AddressStep(
          addresses: _mockAddresses,
          selected: _selectedAddress,
          onSelect: (id) => setState(() => _selectedAddress = id),
        );
      case 2:
        return _ScheduleStep(
          selectedDate: _selectedDate,
          selectedSlot: _selectedTimeSlot,
          timeSlots: _timeSlots,
          onDateSelected: (d) => setState(() => _selectedDate = d),
          onSlotSelected: (s) => setState(() => _selectedTimeSlot = s),
        );
      case 3:
        return _CouponStep(
          controller: _couponController,
          applied: _couponApplied,
          onApply: () {
            if (_couponController.text == 'FIRSTX30') {
              setState(() {
                _couponApplied = true;
                _couponCode = _couponController.text;
              });
            }
          },
          onRemove: () => setState(() {
            _couponApplied = false;
            _couponCode = null;
            _couponController.clear();
          }),
        );
      case 4:
        return _ReviewStep(
          vehicle: _mockVehicles
              .firstWhere((v) => v['id'] == _selectedVehicle,
                  orElse: () => _mockVehicles.first)['name']!,
          address: _mockAddresses
              .firstWhere((a) => a['id'] == _selectedAddress,
                  orElse: () => _mockAddresses.first)['address']!,
          date: _selectedDate,
          timeSlot: _selectedTimeSlot ?? '09:00 AM',
          basePrice: 499,
          discount: _couponApplied ? 150 : 0,
          couponCode: _couponCode,
        );
      default:
        return const SizedBox.shrink();
    }
  }

  bool get _canProceed {
    switch (_step) {
      case 0:
        return _selectedVehicle != null;
      case 1:
        return _selectedAddress != null;
      case 2:
        return _selectedTimeSlot != null;
      case 3:
        return true; // coupon is optional
      case 4:
        return true;
      default:
        return false;
    }
  }

  void _next() {
    if (_step < 4) {
      setState(() => _step++);
    } else {
      // Initiate payment → Razorpay
      _initiatePayment();
    }
  }

  void _initiatePayment() {
    // TODO: Integrate Razorpay
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        title: const Text('Payment'),
        content: const Text('Razorpay integration would open here.'),
        actions: [
          TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.go('/booking-tracking/BK_NEW');
              },
              child: const Text('Simulate Success')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Book Service'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () {
            if (_step > 0) {
              setState(() => _step--);
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: Column(
        children: [
          // Progress indicator
          _StepProgressBar(
            steps: _stepTitles,
            currentStep: _step,
          ),

          // Step content
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              transitionBuilder: (child, animation) {
                return FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0.1, 0),
                      end: Offset.zero,
                    ).animate(animation),
                    child: child,
                  ),
                );
              },
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: _buildStep(),
                ),
              ),
            ),
          ),

          // Navigation buttons
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                  top: BorderSide(color: AppColors.divider, width: 0.5)),
            ),
            child: Row(
              children: [
                if (_step > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      style: OutlinedButton.styleFrom(
                          minimumSize: const Size(0, 52)),
                      child: const Text('Back'),
                    ),
                  ),
                if (_step > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _canProceed ? _next : null,
                    style: ElevatedButton.styleFrom(
                        minimumSize: const Size(0, 52)),
                    child: Text(
                      _step == 4 ? 'Pay Now' : 'Next',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
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

// ─── Step Widgets ────────────────────────────────────────────────────────────

class _StepProgressBar extends StatelessWidget {
  final List<String> steps;
  final int currentStep;

  const _StepProgressBar({required this.steps, required this.currentStep});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (index) {
          if (index.isOdd) {
            // Connector line
            final stepIndex = index ~/ 2;
            return Expanded(
              child: Container(
                height: 2,
                color: stepIndex < currentStep
                    ? AppColors.primary
                    : AppColors.border,
              ),
            );
          }
          // Step circle
          final stepIndex = index ~/ 2;
          final isDone = stepIndex < currentStep;
          final isCurrent = stepIndex == currentStep;

          return Column(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDone
                      ? AppColors.primary
                      : isCurrent
                          ? AppColors.primary.withOpacity(0.2)
                          : AppColors.surface,
                  border: Border.all(
                    color: isDone || isCurrent
                        ? AppColors.primary
                        : AppColors.border,
                    width: 1.5,
                  ),
                ),
                child: isDone
                    ? const Icon(Icons.check_rounded,
                        size: 14, color: Colors.black)
                    : Center(
                        child: Text(
                          '${stepIndex + 1}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isCurrent
                                ? AppColors.primary
                                : AppColors.textHint,
                          ),
                        ),
                      ),
              ),
            ],
          );
        }),
      ),
    );
  }
}

class _VehicleStep extends StatelessWidget {
  final List<Map<String, String>> vehicles;
  final String? selected;
  final ValueChanged<String> onSelect;

  const _VehicleStep({
    required this.vehicles,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Select Vehicle',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('Which car needs service?',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 24),
        ...vehicles.map((v) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GestureDetector(
                onTap: () => onSelect(v['id']!),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: selected == v['id']
                        ? AppColors.primary.withOpacity(0.1)
                        : AppColors.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected == v['id']
                          ? AppColors.primary
                          : AppColors.border,
                      width: selected == v['id'] ? 1.5 : 0.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.directions_car_rounded,
                            color: AppColors.primary, size: 26),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(v['name']!,
                                style: Theme.of(context).textTheme.titleSmall),
                            Text(v['plate']!,
                                style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                      if (selected == v['id'])
                        const Icon(Icons.check_circle_rounded,
                            color: AppColors.primary, size: 22),
                    ],
                  ),
                ),
              ),
            )),
        TextButton.icon(
          onPressed: () {
            // Navigate to add vehicle
          },
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('Add Another Vehicle'),
        ),
      ],
    );
  }
}

class _AddressStep extends StatelessWidget {
  final List<Map<String, String>> addresses;
  final String? selected;
  final ValueChanged<String> onSelect;

  const _AddressStep({
    required this.addresses,
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Service Location',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('Where should the technician come?',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 24),

        // Map placeholder
        Container(
          height: 160,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.map_rounded, color: AppColors.primary, size: 40),
                SizedBox(height: 8),
                Text('Map View',
                    style: TextStyle(color: AppColors.textSecondary)),
                Text('(Google Maps integration)',
                    style: TextStyle(
                        color: AppColors.textHint, fontSize: 12)),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        ...addresses.map((a) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: GestureDetector(
                onTap: () => onSelect(a['id']!),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: selected == a['id']
                        ? AppColors.primary.withOpacity(0.1)
                        : AppColors.card,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: selected == a['id']
                          ? AppColors.primary
                          : AppColors.border,
                      width: selected == a['id'] ? 1.5 : 0.5,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          a['label'] == 'Home'
                              ? Icons.home_rounded
                              : Icons.work_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(a['label']!,
                                style: Theme.of(context).textTheme.titleSmall),
                            const SizedBox(height: 2),
                            Text(a['address']!,
                                style: Theme.of(context).textTheme.bodySmall,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis),
                          ],
                        ),
                      ),
                      if (selected == a['id'])
                        const Icon(Icons.check_circle_rounded,
                            color: AppColors.primary, size: 22),
                    ],
                  ),
                ),
              ),
            )),
      ],
    );
  }
}

class _ScheduleStep extends StatelessWidget {
  final DateTime selectedDate;
  final String? selectedSlot;
  final List<String> timeSlots;
  final ValueChanged<DateTime> onDateSelected;
  final ValueChanged<String> onSlotSelected;

  const _ScheduleStep({
    required this.selectedDate,
    required this.selectedSlot,
    required this.timeSlots,
    required this.onDateSelected,
    required this.onSlotSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Pick Date & Time',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('Select when you need service',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 20),

        // Calendar
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: TableCalendar(
            firstDay: DateTime.now(),
            lastDay: DateTime.now().add(const Duration(days: 30)),
            focusedDay: selectedDate,
            selectedDayPredicate: (day) => isSameDay(day, selectedDate),
            onDaySelected: (selected, focused) => onDateSelected(selected),
            calendarStyle: CalendarStyle(
              outsideDaysVisible: false,
              selectedDecoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              selectedTextStyle:
                  const TextStyle(color: Colors.black, fontWeight: FontWeight.w700),
              todayDecoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              todayTextStyle:
                  const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
              defaultTextStyle:
                  const TextStyle(color: AppColors.textPrimary),
              weekendTextStyle:
                  const TextStyle(color: AppColors.textSecondary),
              disabledTextStyle:
                  const TextStyle(color: AppColors.textDisabled),
            ),
            headerStyle: const HeaderStyle(
              formatButtonVisible: false,
              titleCentered: true,
              titleTextStyle: TextStyle(
                fontFamily: 'Inter',
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
              leftChevronIcon:
                  Icon(Icons.chevron_left, color: AppColors.textPrimary),
              rightChevronIcon:
                  Icon(Icons.chevron_right, color: AppColors.textPrimary),
            ),
            daysOfWeekStyle: const DaysOfWeekStyle(
              weekdayStyle: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500),
              weekendStyle: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500),
            ),
          ),
        ),

        const SizedBox(height: 24),

        Text('Available Time Slots',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),

        // Time slots grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            childAspectRatio: 2.5,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: timeSlots.length,
          itemBuilder: (context, index) {
            final slot = timeSlots[index];
            final isSelected = selectedSlot == slot;
            final isUnavailable = index % 4 == 0; // Mock unavailable slots

            return GestureDetector(
              onTap: isUnavailable ? null : () => onSlotSelected(slot),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isUnavailable
                      ? AppColors.surface.withOpacity(0.5)
                      : isSelected
                          ? AppColors.primary
                          : AppColors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.border,
                    width: isSelected ? 0 : 0.5,
                  ),
                ),
                child: Center(
                  child: Text(
                    slot,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 12,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w400,
                      color: isUnavailable
                          ? AppColors.textDisabled
                          : isSelected
                              ? Colors.black
                              : AppColors.textPrimary,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _CouponStep extends StatelessWidget {
  final TextEditingController controller;
  final bool applied;
  final VoidCallback onApply;
  final VoidCallback onRemove;

  const _CouponStep({
    required this.controller,
    required this.applied,
    required this.onApply,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Apply Coupon',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('Got a promo code? Save more!',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 24),

        if (!applied) ...[
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: controller,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1),
                  decoration: const InputDecoration(
                    hintText: 'Enter coupon code',
                    prefixIcon:
                        Icon(Icons.local_offer_outlined, size: 20),
                  ),
                  textCapitalization: TextCapitalization.characters,
                ),
              ),
              const SizedBox(width: 12),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: onApply,
                  style: ElevatedButton.styleFrom(
                      minimumSize: const Size(80, 52)),
                  child: const Text('Apply'),
                ),
              ),
            ],
          ),
        ] else ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: AppColors.success.withOpacity(0.3), width: 1),
            ),
            child: Row(
              children: [
                const Icon(Icons.check_circle_rounded,
                    color: AppColors.success, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Coupon Applied!',
                          style: TextStyle(
                            color: AppColors.success,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          )),
                      Text('₹150 discount applied to your order',
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: onRemove,
                  child: const Icon(Icons.close_rounded,
                      color: AppColors.textSecondary, size: 20),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 24),

        Text('Available Offers',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),

        ...[
          {'code': 'FIRSTX30', 'desc': '30% off your first booking', 'saving': '₹150'},
          {'code': 'WASH50', 'desc': '₹50 off car wash services', 'saving': '₹50'},
          {'code': 'PREMIUM20', 'desc': '20% off premium packages', 'saving': '₹200'},
        ].map((offer) => GestureDetector(
              onTap: () {
                controller.text = offer['code']!;
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.primary.withOpacity(0.3), width: 0.5),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                            color: AppColors.primary.withOpacity(0.4)),
                      ),
                      child: Text(
                        offer['code']!,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(offer['desc']!,
                          style: Theme.of(context).textTheme.bodySmall),
                    ),
                    Text(
                      'Save ${offer['saving']!}',
                      style: const TextStyle(
                        color: AppColors.success,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

class _ReviewStep extends StatelessWidget {
  final String vehicle;
  final String address;
  final DateTime date;
  final String timeSlot;
  final int basePrice;
  final int discount;
  final String? couponCode;

  const _ReviewStep({
    required this.vehicle,
    required this.address,
    required this.date,
    required this.timeSlot,
    required this.basePrice,
    required this.discount,
    this.couponCode,
  });

  int get total => basePrice - discount;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Review & Pay',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text('Confirm your booking details',
            style: Theme.of(context).textTheme.bodyMedium),
        const SizedBox(height: 24),

        // Summary Card
        Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: Column(
            children: [
              _ReviewRow(
                icon: Icons.inventory_2_rounded,
                label: 'Service',
                value: 'Premium Car Wash',
              ),
              const Divider(height: 1, color: AppColors.divider),
              _ReviewRow(
                icon: Icons.directions_car_rounded,
                label: 'Vehicle',
                value: vehicle,
              ),
              const Divider(height: 1, color: AppColors.divider),
              _ReviewRow(
                icon: Icons.location_on_rounded,
                label: 'Location',
                value: address,
                isMultiLine: true,
              ),
              const Divider(height: 1, color: AppColors.divider),
              _ReviewRow(
                icon: Icons.calendar_today_rounded,
                label: 'Date',
                value:
                    '${date.day}/${date.month}/${date.year}',
              ),
              const Divider(height: 1, color: AppColors.divider),
              _ReviewRow(
                icon: Icons.schedule_rounded,
                label: 'Time',
                value: timeSlot,
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Price breakdown
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 0.5),
          ),
          child: Column(
            children: [
              _PriceRow(label: 'Service Price', value: '₹$basePrice'),
              if (discount > 0) ...[
                const SizedBox(height: 8),
                _PriceRow(
                  label: 'Discount ($couponCode)',
                  value: '-₹$discount',
                  valueColor: AppColors.success,
                ),
              ],
              const SizedBox(height: 8),
              const Divider(color: AppColors.divider),
              const SizedBox(height: 8),
              _PriceRow(
                label: 'Total',
                value: '₹$total',
                isTotal: true,
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Payment info
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.info.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
                color: AppColors.info.withOpacity(0.2), width: 0.5),
          ),
          child: Row(
            children: [
              const Icon(Icons.security_rounded,
                  color: AppColors.info, size: 18),
              const SizedBox(width: 8),
              Text(
                'Secured by Razorpay • UPI, Cards, NetBanking accepted',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.info,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isMultiLine;

  const _ReviewRow({
    required this.icon,
    required this.label,
    required this.value,
    this.isMultiLine = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        crossAxisAlignment:
            isMultiLine ? CrossAxisAlignment.start : CrossAxisAlignment.center,
        children: [
          Icon(icon, color: AppColors.textSecondary, size: 18),
          const SizedBox(width: 12),
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context)
                  .textTheme
                  .bodyMedium
                  ?.copyWith(color: AppColors.textPrimary),
              textAlign: TextAlign.right,
              maxLines: isMultiLine ? 3 : 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool isTotal;

  const _PriceRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isTotal = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal
              ? Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700)
              : Theme.of(context).textTheme.bodyMedium,
        ),
        Text(
          value,
          style: isTotal
              ? const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                )
              : TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: valueColor ?? AppColors.textPrimary,
                ),
        ),
      ],
    );
  }
}
