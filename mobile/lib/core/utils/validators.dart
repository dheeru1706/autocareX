class Validators {
  Validators._();

  /// Validates Indian phone numbers (10 digits, starting with 6-9)
  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    final cleaned = value.replaceAll(RegExp(r'\s|-'), '');
    if (cleaned.length != 10) {
      return 'Enter a valid 10-digit phone number';
    }
    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(cleaned)) {
      return 'Enter a valid Indian phone number';
    }
    return null;
  }

  /// Validates email address
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    if (!RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        .hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  /// Optional email - only validates if not empty
  static String? optionalEmail(String? value) {
    if (value == null || value.isEmpty) return null;
    return email(value);
  }

  /// Required field validation
  static String? required(String? value, {String? fieldName}) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }

  /// Validates OTP (6 digits)
  static String? otp(String? value) {
    if (value == null || value.isEmpty) {
      return 'OTP is required';
    }
    if (value.length != 6 || !RegExp(r'^\d{6}$').hasMatch(value)) {
      return 'Enter a valid 6-digit OTP';
    }
    return null;
  }

  /// Validates Indian vehicle registration number
  static String? vehicleRegistration(String? value) {
    if (value == null || value.isEmpty) {
      return 'Registration number is required';
    }
    // Format: MH01AB1234
    final cleaned = value.toUpperCase().replaceAll(RegExp(r'\s'), '');
    if (!RegExp(r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$').hasMatch(cleaned)) {
      return 'Enter a valid registration number (e.g., MH01AB1234)';
    }
    return null;
  }

  /// Validates name (min 2 chars, alphabets and spaces only)
  static String? name(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!RegExp(r"^[a-zA-Z\s'.-]+$").hasMatch(value.trim())) {
      return 'Name can only contain letters, spaces, and hyphens';
    }
    return null;
  }

  /// Validates price/amount
  static String? amount(String? value, {double? min, double? max}) {
    if (value == null || value.isEmpty) {
      return 'Amount is required';
    }
    final amount = double.tryParse(value);
    if (amount == null) {
      return 'Enter a valid amount';
    }
    if (min != null && amount < min) {
      return 'Minimum amount is ₹${min.toStringAsFixed(0)}';
    }
    if (max != null && amount > max) {
      return 'Maximum amount is ₹${max.toStringAsFixed(0)}';
    }
    return null;
  }

  /// Validates year (vehicle manufacturing year)
  static String? year(String? value) {
    if (value == null || value.isEmpty) {
      return 'Year is required';
    }
    final year = int.tryParse(value);
    final currentYear = DateTime.now().year;
    if (year == null || year < 1980 || year > currentYear + 1) {
      return 'Enter a valid year between 1980 and ${currentYear + 1}';
    }
    return null;
  }

  /// Validates pincode (Indian 6-digit)
  static String? pincode(String? value) {
    if (value == null || value.isEmpty) {
      return 'Pincode is required';
    }
    if (!RegExp(r'^\d{6}$').hasMatch(value)) {
      return 'Enter a valid 6-digit pincode';
    }
    return null;
  }

  /// Min length validation
  static String? Function(String?) minLength(int min, {String? fieldName}) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return '${fieldName ?? 'This field'} is required';
      }
      if (value.length < min) {
        return '${fieldName ?? 'This field'} must be at least $min characters';
      }
      return null;
    };
  }

  /// Max length validation
  static String? Function(String?) maxLength(int max, {String? fieldName}) {
    return (String? value) {
      if (value != null && value.length > max) {
        return '${fieldName ?? 'This field'} must be at most $max characters';
      }
      return null;
    };
  }

  /// Combine multiple validators
  static String? Function(String?) combine(
      List<String? Function(String?)> validators) {
    return (String? value) {
      for (final validator in validators) {
        final result = validator(value);
        if (result != null) return result;
      }
      return null;
    };
  }
}
