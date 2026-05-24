class AppConstants {
  AppConstants._();

  // App Info
  static const String appName = 'AutoCareX';
  static const String appVersion = '1.0.0';
  static const String bundleId = 'com.autocareX.app';

  // API Configuration
  static const String baseUrl = 'https://autocarex-production.up.railway.app/api/v1';
  static const String wsUrl = 'wss://autocarex-production.up.railway.app';
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 30000;

  // Google Maps
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
  static const double defaultLatitude = 12.9716;
  static const double defaultLongitude = 77.5946;
  static const double defaultMapZoom = 14.0;

  // Razorpay
  static const String razorpayKey = 'YOUR_RAZORPAY_KEY_ID';
  static const String razorpayName = 'AutoCareX';
  static const String razorpayDescription = 'Payment for AutoCareX services';

  // Storage Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserId = 'user_id';
  static const String keyUserPhone = 'user_phone';
  static const String keyUserName = 'user_name';
  static const String keyUserAvatar = 'user_avatar';
  static const String keyOnboardingDone = 'onboarding_done';
  static const String keySelectedVehicle = 'selected_vehicle';
  static const String keyFcmToken = 'fcm_token';
  static const String keyPartnerMode = 'partner_mode';

  // Hive Box Names
  static const String boxAppCache = 'app_cache';
  static const String boxUserPrefs = 'user_preferences';
  static const String boxBookings = 'bookings';
  static const String boxVehicles = 'vehicles';

  // Country Code
  static const String countryCode = '+91';
  static const String countryFlag = '🇮🇳';
  static const int phoneDigits = 10;

  // OTP
  static const int otpLength = 6;
  static const int otpResendSeconds = 60;

  // Pagination
  static const int pageSize = 20;
  static const int maxRetries = 3;

  // Image
  static const int maxImageSizeMB = 5;
  static const int maxVehicleImages = 5;
  static const double imageQuality = 0.8;

  // Subscription Plans
  static const String planBasic = 'basic';
  static const String planPremium = 'premium';
  static const String planFleet = 'fleet';

  // Booking Status
  static const String bookingPending = 'PENDING';
  static const String bookingConfirmed = 'CONFIRMED';
  static const String bookingInProgress = 'IN_PROGRESS';
  static const String bookingCompleted = 'COMPLETED';
  static const String bookingCancelled = 'CANCELLED';

  // Service Categories
  static const String categoryWash = 'car_wash';
  static const String categoryDetail = 'detailing';
  static const String categoryInspection = 'inspection';
  static const String categoryRepair = 'repair';
  static const String categorySell = 'sell_car';
  static const String categoryInsurance = 'insurance';

  // Wallet
  static const double minWalletRecharge = 100.0;
  static const double maxWalletBalance = 50000.0;

  // Animations
  static const int animationDurationFast = 200;
  static const int animationDurationMedium = 350;
  static const int animationDurationSlow = 600;

  // Chat
  static const int chatPageSize = 50;
  static const int maxMessageLength = 1000;

  // Rating
  static const double minRating = 1.0;
  static const double maxRating = 5.0;
}
