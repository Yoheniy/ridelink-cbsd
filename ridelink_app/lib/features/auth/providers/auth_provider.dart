import 'package:convex_flutter/convex_flutter.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../core/network/api_exceptions.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/constants/enums.dart';
import '../models/user_model.dart';
import '../repositories/auth_repository.dart';

enum AuthState { initial, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repository;
  final StorageService _storage;
  final ConvexClient? _convex;

  AuthState _state = AuthState.initial;
  UserModel? _user;
  String? _errorMessage;
  Future<bool>? _syncConvexAuthInFlight;

  AuthProvider(this._repository, this._storage, {ConvexClient? convex})
      : _convex = convex;

  AuthState get state => _state;
  UserModel? get user => _user;
  String? get userId => _user?.id;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _state == AuthState.authenticated;
  bool get isDriver => _user?.role == UserRole.driver;
  bool get isPassenger => _user?.role == UserRole.passenger;

  Future<bool> requestSignInOtp(String email) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();
      await _repository.requestSignInOtp(email);
      _state = AuthState.unauthenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtpAndLogin({
    required String email,
    required String otp,
    required String password,
  }) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();
      await _repository.verifyEmailOtp(email: email, otp: otp);
      return await login(email, password);
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  /// Check if we have a valid session (stored token).
  Future<void> checkAuthStatus() async {
    final token = await _storage.getAccessToken();
    if (token == null) {
      _state = AuthState.unauthenticated;
      await _syncConvexAuth();
      notifyListeners();
      return;
    }

    try {
      _state = AuthState.loading;
      notifyListeners();

      final data = await _repository.getSession();
      if (data != null && data['user'] != null) {
        _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        await _hydrateUserFromMe();
        await _persistUserIds(_user!);
        _state = AuthState.authenticated;
      } else {
        await _storage.clearTokens();
        _state = AuthState.unauthenticated;
      }
    } on UnauthorizedException {
      await _storage.clearTokens();
      _state = AuthState.unauthenticated;
    } catch (e) {
      debugPrint('checkAuthStatus error: $e');
      _state = AuthState.unauthenticated;
    }
    await _syncConvexAuth();
    notifyListeners();
  }

  /// Sign in via Better Auth.
  Future<bool> login(String email, String password) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();

      final data = await _repository.signInWithEmail(
        email: email,
        password: password,
      );
      final sessionToken = data['session']?['token'] as String? ??
          data['token'] as String?;

      if (sessionToken == null) {
        _errorMessage = 'Invalid response from server';
        _state = AuthState.error;
        notifyListeners();
        return false;
      }

      await _storage.saveAccessToken(sessionToken);
      final userData = data['user'] as Map<String, dynamic>?;
      if (userData != null) {
        _user = UserModel.fromJson(userData);
      }
      await _hydrateUserFromMe();
      if (_user != null) {
        await _persistUserIds(_user!);
      }

      _state = AuthState.authenticated;
      await _syncConvexAuth();
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  /// Sign up via Better Auth, then complete profile, optionally become driver.
  Future<bool> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required UserRole role,
    String? nationalId,
  }) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();

      // POST /api/auth/sign-up/email
      final signUpData = await _repository.signUpWithEmail({
        'email': email,
        'password': password,
        'name': name,
        'phone': phone,
      });
      final sessionToken = signUpData['session']?['token'] as String? ??
          signUpData['token'] as String?;

      if (sessionToken != null) {
        await _storage.saveAccessToken(sessionToken);
      }

      if (role == UserRole.driver && sessionToken != null) {

        _state = AuthState.authenticated;
        notifyListeners();
        return true;
      }

      // Optional: national ID (not part of sign-up body)
      if (nationalId != null && nationalId.isNotEmpty) {
        try {
          await _repository.completeProfile({'nationalId': nationalId});
        } catch (e) {
          debugPrint('Complete profile step: $e');
        }
      }

      // Fetch full user data
      if (sessionToken != null) {
        try {
          final sessionData = await _repository.getSession();
          if (sessionData?['user'] != null) {
            _user = UserModel.fromJson(
                sessionData!['user'] as Map<String, dynamic>);
            await _persistUserIds(_user!);
            _state = AuthState.authenticated;
            await _syncConvexAuth();
            notifyListeners();
            return true;
          }
        } catch (e) {
          debugPrint('Post-register session fetch: $e');
        }
      }

      // If sign-up succeeded and token exists but user fetch failed,
      // keep the session token for follow-up setup steps.
      if (sessionToken != null) {
        await _storage.saveAccessToken(sessionToken);
        _state = AuthState.authenticated;
      } else {
        _state = AuthState.unauthenticated;
      }
      if (role != UserRole.driver) {
        await _syncConvexAuth();
      }
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyRegistrationOtp({
    required String email,
    required String otp,
  }) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();
      await _repository.verifyEmailOtp(email: email, otp: otp);
      await checkAuthStatus();
      return _state == AuthState.authenticated;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestPasswordResetOtp(String email) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();
      await _repository.requestPasswordResetOtp(email);
      _state = AuthState.unauthenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPasswordWithOtp({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();
      await _repository.resetPasswordWithOtp(
        email: email,
        otp: otp,
        password: newPassword,
      );
      _state = AuthState.unauthenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  /// Complete driver-specific profile after base account sign up.
  Future<bool> becomeDriver({
    required String licenseNumber,
    required String vehicleModel,
    required String vehiclePlate,
    required int vehicleSeats,
    required String licenseDocumentId,
  }) async {
    try {
      _state = AuthState.loading;
      _errorMessage = null;
      notifyListeners();

      await _repository.becomeDriver({
        'licenseNumber': licenseNumber,
        'vehicleModel': vehicleModel,
        'vehiclePlate': vehiclePlate,
        'vehicleSeats': vehicleSeats,
        'licenseDocumentId': licenseDocumentId,
      });

      final sessionData = await _repository.getSession();
      if (sessionData?['user'] != null) {
        _user = UserModel.fromJson(sessionData!['user'] as Map<String, dynamic>);
        await _hydrateUserFromMe();
        await _persistUserIds(_user!);
      }

      _state = AuthState.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _state = AuthState.error;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Failed to complete driver profile';
      _state = AuthState.error;
      notifyListeners();
      return false;
    }
  }

  /// Demo mode login without backend.
  Future<bool> loginAsDemo(UserRole role) async {
    _state = AuthState.loading;
    _errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 500));

    _user = UserModel(
      id: 'demo-user-001',
      name: role == UserRole.driver ? 'Abebe Kebede' : 'Tigist Hailu',
      email: role == UserRole.driver ? 'abebe@demo.com' : 'tigist@demo.com',
      phone: '+251912345678',
      status: UserStatus.active,
      role: role,
      rating: 4.7,
      passengerId: role == UserRole.passenger ? 'demo-passenger-001' : null,
      driverId: role == UserRole.driver ? 'demo-driver-001' : null,
      vehicleModel: role == UserRole.driver ? 'Toyota Yaris 2020' : null,
      vehiclePlate: role == UserRole.driver ? 'AA 3-12345' : null,
      vehicleSeats: role == UserRole.driver ? 4 : null,
    );

    await _storage.saveUserRole(role.name);
    await _storage.saveUserId('demo-user-001');
    if (role == UserRole.passenger) {
      await _storage.savePassengerId('demo-passenger-001');
    } else {
      await _storage.saveDriverId('demo-driver-001');
    }

    _state = AuthState.authenticated;
    await _syncConvexAuth();
    notifyListeners();
    return true;
  }

  /// Refreshes the Convex JWT from your backend and applies it to [ConvexClient].
  /// Call before Convex subscriptions that use `requireAuth` (e.g. chat/tracking).
  Future<void> syncConvexAuth() async {
    await ensureConvexAuth();
  }

  /// Ensures Convex has auth for the current session.
  /// Returns true when a token is successfully applied, false otherwise.
  Future<bool> ensureConvexAuth({bool forceRefresh = false}) {
    final inFlight = _syncConvexAuthInFlight;
    if (!forceRefresh && inFlight != null) {
      return inFlight;
    }
    final future = _syncConvexAuth(forceRefresh: forceRefresh);
    _syncConvexAuthInFlight = future;
    future.whenComplete(() {
      if (identical(_syncConvexAuthInFlight, future)) {
        _syncConvexAuthInFlight = null;
      }
    });
    return future;
  }

  /// Pushes the backend-issued Convex JWT into [ConvexClient] so queries that
  /// call `requireAuth` succeed (chat, tracking, notifications).
  Future<bool> _syncConvexAuth({bool forceRefresh = false}) async {
    final convex = _convex;
    if (convex == null) return false;
    try {
      if (_state != AuthState.authenticated) {
        await convex.setAuth(token: null);
        return false;
      }

      final jwt = await fetchConvexToken();
      if (jwt != null) {
        await convex.setAuth(token: jwt);
        debugPrint('Convex auth sync: fetched and applied backend JWT.');
        return true;
      }

      if (forceRefresh) {
        await _storage.saveConvexJwt('');
        await convex.setAuth(token: null);
        debugPrint('Convex auth sync: force refresh failed to fetch JWT.');
        return false;
      }

      final stored = await _storage.getConvexJwt();
      if (_isJwtUsable(stored)) {
        await convex.setAuth(token: stored);
        debugPrint('Convex auth sync: using cached JWT fallback.');
        return true;
      }

      await _storage.saveConvexJwt('');
      await convex.setAuth(token: null);
      debugPrint('Convex auth sync: no usable JWT available.');
      return false;
    } catch (e) {
      debugPrint('Convex auth sync error: $e');
      await convex.setAuth(token: null);
      return false;
    }
  }

  /// Fetch a JWT for Convex real-time auth.
  Future<String?> fetchConvexToken() async {
    try {
      final data = await _repository.getConvexToken();
      String? jwt;
      if (data is Map<String, dynamic>) {
        jwt = data['token'] as String?;
      } else if (data is String) {
        jwt = data;
      }
      if (jwt != null) {
        await _storage.saveConvexJwt(jwt);
      }
      return jwt;
    } catch (e) {
      debugPrint('Failed to fetch Convex token: $e');
      return null;
    }
  }

  bool _isJwtUsable(String? token) {
    if (token == null || token.trim().isEmpty) return false;
    final parts = token.split('.');
    if (parts.length != 3) return false;
    try {
      final payload = _decodeJwtPayload(parts[1]);
      final expRaw = payload['exp'];
      if (expRaw is! num) return false;
      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        expRaw.toInt() * 1000,
      );
      return expiresAt.isAfter(DateTime.now().add(const Duration(seconds: 10)));
    } catch (_) {
      return false;
    }
  }

  Map<String, dynamic> _decodeJwtPayload(String encodedPayload) {
    final normalized = base64Url.normalize(encodedPayload);
    final decoded = utf8.decode(base64Url.decode(normalized));
    return jsonDecode(decoded) as Map<String, dynamic>;
  }

  Future<void> logout() async {
    try {
      await _repository.signOut();
    } catch (_) {}
    _user = null;
    _state = AuthState.unauthenticated;
    await _storage.clearTokens();
    await _storage.clearProfileIds();
    await _storage.clearCachedUserJson();
    await _syncConvexAuth();
    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    try {
      await _repository.completeProfile(data);
      // Re-fetch session to get updated user
      final sessionData = await _repository.getSession();
      if (sessionData?['user'] != null) {
        _user =
            UserModel.fromJson(sessionData!['user'] as Map<String, dynamic>);
        await _persistUserIds(_user!);
      }
      notifyListeners();
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> _persistUserIds(UserModel user) async {
    await _storage.saveUserRole(user.role.name);
    await _storage.saveUserId(user.id);
    if (user.passengerId != null && user.passengerId!.isNotEmpty) {
      await _storage.savePassengerId(user.passengerId!);
    } else {
      await _storage.clearPassengerId();
    }
    if (user.driverId != null && user.driverId!.isNotEmpty) {
      await _storage.saveDriverId(user.driverId!);
    } else {
      await _storage.clearDriverId();
    }
    await _storage.saveCachedUserJson(jsonEncode(user.toJson()));
  }

  Future<void> _hydrateUserFromMe() async {
    try {
      final meData = await _repository.getMe();
      final meUser = meData?['user'] as Map<String, dynamic>?;
      if (meUser != null) {
        _user = UserModel.fromJson(meUser);
      }
    } catch (e) {
      debugPrint('/users/me fetch failed: $e');
    }
  }
}
