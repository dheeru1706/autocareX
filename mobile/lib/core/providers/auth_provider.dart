import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';
import '../network/api_client.dart';
import '../network/endpoints.dart';

// Auth state model
class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final String? userId;
  final String? phone;
  final String? name;
  final String? avatar;
  final String? token;
  final String? error;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.userId,
    this.phone,
    this.name,
    this.avatar,
    this.token,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? userId,
    String? phone,
    String? name,
    String? avatar,
    String? token,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      userId: userId ?? this.userId,
      phone: phone ?? this.phone,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      token: token ?? this.token,
      error: error,
    );
  }

  @override
  String toString() => 'AuthState(isAuthenticated: $isAuthenticated, userId: $userId)';
}

class AuthNotifier extends AsyncNotifier<AuthState> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  @override
  Future<AuthState> build() async {
    return _loadFromStorage();
  }

  Future<AuthState> _loadFromStorage() async {
    try {
      final token = await _storage.read(key: AppConstants.keyAuthToken);
      if (token == null || token.isEmpty) {
        return const AuthState(isAuthenticated: false);
      }

      final userId = await _storage.read(key: AppConstants.keyUserId);
      final phone = await _storage.read(key: AppConstants.keyUserPhone);
      final name = await _storage.read(key: AppConstants.keyUserName);
      final avatar = await _storage.read(key: AppConstants.keyUserAvatar);

      return AuthState(
        isAuthenticated: true,
        token: token,
        userId: userId,
        phone: phone,
        name: name,
        avatar: avatar,
      );
    } catch (_) {
      return const AuthState(isAuthenticated: false);
    }
  }

  Future<void> sendOtp(String phone) async {
    state = const AsyncLoading();
    try {
      final api = ref.read(apiClientProvider);
      await api.post(Endpoints.sendOtp, data: {'phone': phone});
      state = AsyncData(const AuthState(isLoading: false));
    } catch (e) {
      state = AsyncData(AuthState(
        isLoading: false,
        error: e.toString(),
      ));
    }
  }

  Future<bool> verifyOtp({
    required String phone,
    required String otp,
  }) async {
    state = const AsyncLoading();
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.post(
        Endpoints.verifyOtp,
        data: {'phone': phone, 'otp': otp},
      );

      final data = response.data as Map<String, dynamic>;
      final token = data['access_token'] as String;
      final refreshToken = data['refresh_token'] as String;
      final user = data['user'] as Map<String, dynamic>;

      // Save to secure storage
      await Future.wait([
        _storage.write(key: AppConstants.keyAuthToken, value: token),
        _storage.write(key: AppConstants.keyRefreshToken, value: refreshToken),
        _storage.write(
            key: AppConstants.keyUserId, value: user['id']?.toString() ?? ''),
        _storage.write(
            key: AppConstants.keyUserPhone, value: phone),
        _storage.write(
            key: AppConstants.keyUserName,
            value: user['name']?.toString() ?? ''),
        _storage.write(
            key: AppConstants.keyUserAvatar,
            value: user['avatar']?.toString() ?? ''),
      ]);

      state = AsyncData(AuthState(
        isAuthenticated: true,
        token: token,
        userId: user['id']?.toString(),
        phone: phone,
        name: user['name']?.toString(),
        avatar: user['avatar']?.toString(),
      ));

      return true;
    } catch (e) {
      state = AsyncData(AuthState(
        isLoading: false,
        error: 'Invalid OTP. Please try again.',
      ));
      return false;
    }
  }

  Future<void> refreshToken() async {
    try {
      final refreshTokenStr =
          await _storage.read(key: AppConstants.keyRefreshToken);
      if (refreshTokenStr == null) {
        await logout();
        return;
      }

      final api = ref.read(apiClientProvider);
      final response = await api.post(
        Endpoints.refreshToken,
        data: {'refresh_token': refreshTokenStr},
      );

      final data = response.data as Map<String, dynamic>;
      final newToken = data['access_token'] as String;
      await _storage.write(key: AppConstants.keyAuthToken, value: newToken);

      final current = state.value ?? const AuthState();
      state = AsyncData(current.copyWith(token: newToken));
    } catch (_) {
      await logout();
    }
  }

  Future<void> updateProfile({
    String? name,
    String? avatar,
  }) async {
    final current = state.value;
    if (current == null) return;

    if (name != null) {
      await _storage.write(key: AppConstants.keyUserName, value: name);
    }
    if (avatar != null) {
      await _storage.write(key: AppConstants.keyUserAvatar, value: avatar);
    }

    state = AsyncData(current.copyWith(
      name: name ?? current.name,
      avatar: avatar ?? current.avatar,
    ));
  }

  Future<void> logout() async {
    try {
      final api = ref.read(apiClientProvider);
      await api.post(Endpoints.logout);
    } catch (_) {}

    await _storage.deleteAll();
    state = const AsyncData(AuthState(isAuthenticated: false));
  }
}

final authProvider =
    AsyncNotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

// Convenience providers
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).value?.isAuthenticated ?? false;
});

final currentUserIdProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).value?.userId;
});

final currentUserNameProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).value?.name;
});

final currentUserPhoneProvider = Provider<String?>((ref) {
  return ref.watch(authProvider).value?.phone;
});
