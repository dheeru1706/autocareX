import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

extension StringExtensions on String {
  String get capitalize {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1).toLowerCase()}';
  }

  String get titleCase {
    return split(' ').map((word) => word.capitalize).join(' ');
  }

  bool get isValidEmail {
    return RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        .hasMatch(trim());
  }

  bool get isValidIndianPhone {
    return RegExp(r'^[6-9]\d{9}$').hasMatch(trim());
  }

  String get maskedPhone {
    if (length != 10) return this;
    return '${substring(0, 2)}XXXXXX${substring(8)}';
  }
}

extension DateTimeExtensions on DateTime {
  String get relativeTime {
    final now = DateTime.now();
    final diff = now.difference(this);

    if (diff.inDays > 0) {
      return DateFormat('d MMM yyyy').format(this);
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  String get timeString {
    return DateFormat('h:mm a').format(this);
  }

  String get dateString {
    final now = DateTime.now();
    if (day == now.day && month == now.month && year == now.year) {
      return 'Today';
    }
    final yesterday = now.subtract(const Duration(days: 1));
    if (day == yesterday.day &&
        month == yesterday.month &&
        year == yesterday.year) {
      return 'Yesterday';
    }
    return DateFormat('d MMM yyyy').format(this);
  }

  bool get isToday {
    final now = DateTime.now();
    return day == now.day && month == now.month && year == now.year;
  }

  int get daysUntil {
    return difference(DateTime.now()).inDays;
  }
}

extension DoubleExtensions on double {
  String get formatCurrency {
    if (this >= 100000) {
      return '₹${(this / 100000).toStringAsFixed(2)}L';
    } else if (this >= 1000) {
      return '₹${(this / 1000).toStringAsFixed(1)}K';
    }
    return '₹${toStringAsFixed(0)}';
  }
}

extension IntExtensions on int {
  String get formatCurrency {
    return toDouble().formatCurrency;
  }

  String get ordinal {
    if (this >= 11 && this <= 13) return '${this}th';
    switch (this % 10) {
      case 1:
        return '${this}st';
      case 2:
        return '${this}nd';
      case 3:
        return '${this}rd';
      default:
        return '${this}th';
    }
  }
}

extension BuildContextExtensions on BuildContext {
  double get screenWidth => MediaQuery.of(this).size.width;
  double get screenHeight => MediaQuery.of(this).size.height;
  bool get isSmallScreen => screenWidth < 360;
  EdgeInsets get safeAreaPadding => MediaQuery.of(this).padding;

  void showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor:
            isError ? const Color(0xFFFF4444) : const Color(0xFF00C853),
      ),
    );
  }

  Future<bool?> showConfirmDialog({
    required String title,
    required String content,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
    bool isDestructive = false,
  }) {
    return showDialog<bool>(
      context: this,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF232323),
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(cancelText),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: isDestructive
                ? TextButton.styleFrom(
                    foregroundColor: const Color(0xFFFF4444))
                : null,
            child: Text(confirmText),
          ),
        ],
      ),
    );
  }
}
