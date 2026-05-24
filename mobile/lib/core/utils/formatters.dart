import 'package:intl/intl.dart';

class Formatters {
  Formatters._();

  /// Format amount to Indian currency display (₹1,23,456)
  static String currency(double amount, {bool compact = false}) {
    if (compact) {
      if (amount >= 10000000) {
        return '₹${(amount / 10000000).toStringAsFixed(2)}Cr';
      } else if (amount >= 100000) {
        return '₹${(amount / 100000).toStringAsFixed(2)}L';
      } else if (amount >= 1000) {
        return '₹${(amount / 1000).toStringAsFixed(1)}K';
      }
    }
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }

  /// Format Indian phone number with spaces
  static String phone(String phone) {
    if (phone.length != 10) return phone;
    return '${phone.substring(0, 5)} ${phone.substring(5)}';
  }

  /// Format vehicle registration number with spaces
  static String registration(String reg) {
    final cleaned = reg.toUpperCase().replaceAll(' ', '');
    if (cleaned.length == 10) {
      return '${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6)}';
    }
    return cleaned;
  }

  /// Format date to readable string
  static String date(DateTime date, {String format = 'd MMM yyyy'}) {
    return DateFormat(format).format(date);
  }

  /// Format date with time
  static String dateTime(DateTime dt) {
    return DateFormat('d MMM yyyy, h:mm a').format(dt);
  }

  /// Format relative time (e.g. "2 hours ago")
  static String relativeTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inDays >= 365) {
      return '${(diff.inDays / 365).floor()} year${diff.inDays >= 730 ? "s" : ""} ago';
    } else if (diff.inDays >= 30) {
      return '${(diff.inDays / 30).floor()} month${diff.inDays >= 60 ? "s" : ""} ago';
    } else if (diff.inDays > 0) {
      return '${diff.inDays} day${diff.inDays > 1 ? "s" : ""} ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours} hour${diff.inHours > 1 ? "s" : ""} ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes} min ago';
    } else {
      return 'Just now';
    }
  }

  /// Format mileage with comma separator
  static String mileage(int km) {
    return NumberFormat('#,###').format(km) + ' km';
  }

  /// Format percentage
  static String percentage(double value, {int decimals = 1}) {
    return '${value.toStringAsFixed(decimals)}%';
  }

  /// Truncate text with ellipsis
  static String truncate(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }
}
