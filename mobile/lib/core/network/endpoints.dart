class Endpoints {
  Endpoints._();

  // Auth
  static const String sendOtp = '/auth/send-otp';
  static const String verifyOtp = '/auth/verify-otp';
  static const String refreshToken = '/auth/refresh-token';
  static const String logout = '/auth/logout';
  static const String socialLogin = '/auth/social-login';

  // User Profile
  static const String profile = '/users/profile';
  static const String updateProfile = '/users/profile/update';
  static const String updateAvatar = '/users/avatar';
  static const String addresses = '/users/addresses';
  static const String addAddress = '/users/addresses/add';
  static const String updateAddress = '/users/addresses/{id}';
  static const String deleteAddress = '/users/addresses/{id}';

  // Vehicles
  static const String vehicles = '/vehicles';
  static const String addVehicle = '/vehicles/add';
  static const String vehicleDetail = '/vehicles/{id}';
  static const String updateVehicle = '/vehicles/{id}';
  static const String deleteVehicle = '/vehicles/{id}';
  static const String vehicleMakes = '/vehicles/makes';
  static const String vehicleModels = '/vehicles/models';
  static const String vehicleHealthScore = '/vehicles/{id}/health-score';

  // Services
  static const String serviceCategories = '/services/categories';
  static const String servicePackages = '/services/packages';
  static const String servicePackagesByCat = '/services/packages/category/{categoryId}';
  static const String serviceDetail = '/services/packages/{id}';
  static const String popularServices = '/services/popular';
  static const String searchServices = '/services/search';

  // Bookings
  static const String createBooking = '/bookings/create';
  static const String bookings = '/bookings';
  static const String activeBookings = '/bookings/active';
  static const String pastBookings = '/bookings/past';
  static const String bookingDetail = '/bookings/{id}';
  static const String cancelBooking = '/bookings/{id}/cancel';
  static const String rescheduleBooking = '/bookings/{id}/reschedule';
  static const String rateBooking = '/bookings/{id}/rate';
  static const String trackBooking = '/bookings/{id}/track';
  static const String timeSlots = '/bookings/time-slots';
  static const String applyCoupon = '/bookings/apply-coupon';

  // Subscriptions
  static const String subscriptionPlans = '/subscriptions/plans';
  static const String mySubscription = '/subscriptions/my';
  static const String createSubscription = '/subscriptions/create';
  static const String cancelSubscription = '/subscriptions/{id}/cancel';

  // Marketplace
  static const String carListings = '/marketplace/listings';
  static const String carListingDetail = '/marketplace/listings/{id}';
  static const String createListing = '/marketplace/listings/create';
  static const String myListings = '/marketplace/listings/my';
  static const String makeInquiry = '/marketplace/listings/{id}/inquiry';
  static const String scheduleTestDrive = '/marketplace/listings/{id}/test-drive';
  static const String aiPriceEstimate = '/marketplace/price-estimate';

  // Insurance
  static const String insurancePolicies = '/insurance/policies';
  static const String insurancePolicyDetail = '/insurance/policies/{id}';
  static const String renewInsurance = '/insurance/policies/{id}/renew';
  static const String addInsurance = '/insurance/policies/add';
  static const String insuranceProviders = '/insurance/providers';

  // Wallet
  static const String walletBalance = '/wallet/balance';
  static const String walletTransactions = '/wallet/transactions';
  static const String walletRecharge = '/wallet/recharge';
  static const String walletHistory = '/wallet/history';
  static const String rewardPoints = '/wallet/rewards';

  // Referral
  static const String referralInfo = '/referrals/info';
  static const String referralHistory = '/referrals/history';

  // Notifications
  static const String notifications = '/notifications';
  static const String markReadNotification = '/notifications/{id}/read';
  static const String markAllRead = '/notifications/mark-all-read';
  static const String fcmToken = '/notifications/fcm-token';

  // Chat
  static const String conversations = '/chat/conversations';
  static const String chatMessages = '/chat/{conversationId}/messages';
  static const String sendMessage = '/chat/{conversationId}/send';
  static const String uploadChatImage = '/chat/upload-image';

  // Partners (Nearby)
  static const String nearbyPartners = '/partners/nearby';
  static const String partnerProfile = '/partners/{id}';

  // Franchise/Partner Dashboard
  static const String partnerStats = '/partner/stats';
  static const String partnerBookings = '/partner/bookings';
  static const String partnerStaff = '/partner/staff';
  static const String acceptBooking = '/partner/bookings/{id}/accept';
  static const String declineBooking = '/partner/bookings/{id}/decline';
  static const String startService = '/partner/bookings/{id}/start';
  static const String completeService = '/partner/bookings/{id}/complete';
  static const String partnerRevenue = '/partner/revenue';
  static const String partnerEarnings = '/partner/earnings';

  // Promotions
  static const String banners = '/promotions/banners';
  static const String coupons = '/promotions/coupons';
  static const String validateCoupon = '/promotions/coupons/validate';

  // Payments
  static const String createOrder = '/payments/create-order';
  static const String verifyPayment = '/payments/verify';
  static const String paymentHistory = '/payments/history';

  // Helpers
  static String withParam(String endpoint, String param, String value) {
    return endpoint.replaceAll('{$param}', value);
  }
}
