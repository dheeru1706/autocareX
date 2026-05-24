import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';

class OtpVerifyScreen extends ConsumerStatefulWidget {
  final String phone;
  const OtpVerifyScreen({super.key, required this.phone});

  @override
  ConsumerState<OtpVerifyScreen> createState() => _OtpVerifyScreenState();
}

class _OtpVerifyScreenState extends ConsumerState<OtpVerifyScreen>
    with SingleTickerProviderStateMixin {
  final _otpController = TextEditingController();
  final StreamController<ErrorAnimationType> _errorController =
      StreamController<ErrorAnimationType>();

  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  int _resendTimer = 60;
  Timer? _timer;
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _shakeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticOut),
    );
    _startTimer();
  }

  void _startTimer() {
    _resendTimer = 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_resendTimer > 0) {
            _resendTimer--;
          } else {
            timer.cancel();
          }
        });
      }
    });
  }

  Future<void> _verifyOtp(String otp) async {
    if (otp.length != 6) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final success = await ref.read(authProvider.notifier).verifyOtp(
          phone: widget.phone,
          otp: otp,
        );

    if (!mounted) return;

    if (success) {
      setState(() {
        _isSuccess = true;
        _isLoading = false;
      });
      await Future.delayed(const Duration(milliseconds: 800));
      if (mounted) context.go('/home/dashboard');
    } else {
      setState(() {
        _isLoading = false;
        _error = 'Invalid OTP. Please try again.';
      });
      _errorController.add(ErrorAnimationType.shake);
      _shakeController.forward(from: 0);
    }
  }

  Future<void> _resendOtp() async {
    if (_resendTimer > 0) return;
    await ref.read(authProvider.notifier).sendOtp(widget.phone);
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    _errorController.close();
    _shakeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // Success check or Lock icon
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 400),
                child: _isSuccess
                    ? Container(
                        key: const ValueKey('success'),
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.success.withOpacity(0.15),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.success.withOpacity(0.3),
                              blurRadius: 24,
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.check_circle_outline_rounded,
                          color: AppColors.success,
                          size: 40,
                        ),
                      ).animate().scale(curve: Curves.elasticOut)
                    : Container(
                        key: const ValueKey('lock'),
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withOpacity(0.15),
                        ),
                        child: const Icon(
                          Icons.lock_outline_rounded,
                          color: AppColors.primary,
                          size: 36,
                        ),
                      ),
              ).animate().scale(
                    begin: const Offset(0.8, 0.8),
                    duration: const Duration(milliseconds: 400),
                    curve: Curves.elasticOut,
                  ),

              const SizedBox(height: 24),

              Text(
                _isSuccess ? 'Verified! 🎉' : 'Enter OTP',
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ).animate().fadeIn(duration: const Duration(milliseconds: 300)),

              const SizedBox(height: 8),

              RichText(
                text: TextSpan(
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 15,
                    height: 1.5,
                  ),
                  children: [
                    const TextSpan(text: 'We sent a 6-digit code to\n'),
                    TextSpan(
                      text: '+91 ${widget.phone}',
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(
                    delay: const Duration(milliseconds: 100),
                    duration: const Duration(milliseconds: 300),
                  ),

              const SizedBox(height: 40),

              // OTP Input
              AnimatedBuilder(
                animation: _shakeAnimation,
                builder: (context, child) {
                  return Transform.translate(
                    offset: Offset(
                      _shakeAnimation.value *
                          10 *
                          (1 - _shakeAnimation.value) *
                          (_shakeController.status == AnimationStatus.forward
                              ? 1
                              : -1),
                      0,
                    ),
                    child: child,
                  );
                },
                child: PinCodeTextField(
                  appContext: context,
                  length: 6,
                  controller: _otpController,
                  errorAnimationController: _errorController,
                  keyboardType: TextInputType.number,
                  animationType: AnimationType.fade,
                  pinTheme: PinTheme(
                    shape: PinCodeFieldShape.box,
                    borderRadius: BorderRadius.circular(12),
                    fieldHeight: 56,
                    fieldWidth: 48,
                    activeFillColor: AppColors.surface,
                    inactiveFillColor: AppColors.surface,
                    selectedFillColor: AppColors.primary.withOpacity(0.1),
                    activeColor: AppColors.primary,
                    inactiveColor: AppColors.border,
                    selectedColor: AppColors.primary,
                    fieldOuterPadding:
                        const EdgeInsets.symmetric(horizontal: 4),
                  ),
                  enableActiveFill: true,
                  textStyle: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 4,
                  ),
                  onCompleted: _verifyOtp,
                  onChanged: (value) {
                    if (_error != null) {
                      setState(() => _error = null);
                    }
                  },
                ),
              ).animate().fadeIn(
                    delay: const Duration(milliseconds: 200),
                    duration: const Duration(milliseconds: 400),
                  ),

              // Error
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline,
                          color: AppColors.error, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        _error!,
                        style: const TextStyle(
                          color: AppColors.error,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ).animate().shake(),

              const SizedBox(height: 32),

              // Verify Button
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: (_isLoading || _isSuccess)
                      ? null
                      : const LinearGradient(
                          colors: [Color(0xFFF5C518), Color(0xFFD4A800)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                  color: _isSuccess
                      ? AppColors.success
                      : (_isLoading ? AppColors.surface : null),
                  boxShadow: (_isLoading || _isSuccess)
                      ? []
                      : [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: _isLoading || _isSuccess
                        ? null
                        : () => _verifyOtp(_otpController.text),
                    child: Center(
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: AppColors.primary,
                                strokeWidth: 2.5,
                              ),
                            )
                          : _isSuccess
                              ? const Icon(Icons.check_rounded,
                                  color: Colors.white, size: 28)
                              : const Text(
                                  'Verify OTP',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black,
                                  ),
                                ),
                    ),
                  ),
                ),
              ).animate().fadeIn(
                    delay: const Duration(milliseconds: 300),
                    duration: const Duration(milliseconds: 400),
                  ),

              const SizedBox(height: 24),

              // Resend Timer
              Center(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  child: _resendTimer > 0
                      ? Text(
                          'Resend OTP in ${_resendTimer}s',
                          key: ValueKey('timer_$_resendTimer'),
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 14,
                          ),
                        )
                      : GestureDetector(
                          onTap: _resendOtp,
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(
                                fontSize: 14,
                                color: AppColors.textSecondary,
                              ),
                              children: [
                                const TextSpan(text: "Didn't receive? "),
                                TextSpan(
                                  text: 'Resend OTP',
                                  style: TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
