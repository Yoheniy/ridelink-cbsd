import 'auth_repository.dart';

/// In-memory simulation for component-model testing.
///
/// This implementation helps verify that [AuthProvider] behavior is preserved
/// when the required auth interface is swapped away from HTTP.
class InMemoryAuthRepository implements AuthRepository {
  InMemoryAuthRepository({Map<String, dynamic>? seedUser})
      : _user = seedUser ?? _defaultPassengerUser;

  static const Map<String, dynamic> _defaultPassengerUser = {
    'id': 'demo-user-001',
    'name': 'Tigist Hailu',
    'email': 'tigist@demo.com',
    'emailVerified': true,
    'phone': '+251912345678',
    'nationalId': 'AA1234567',
    'status': 'active',
    'role': 'passenger',
    'rating': 4.7,
    'banned': false,
    'passenger': {'id': 'demo-passenger-001', 'prefferedRoutes': []},
  };

  Map<String, dynamic>? _user;
  String? _token = 'demo-session-token';

  @override
  Future<Map<String, dynamic>?> getSession() async {
    if (_token == null || _user == null) {
      return null;
    }
    return {'user': _user, 'session': {'token': _token}};
  }

  @override
  Future<Map<String, dynamic>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    // Keep simulation deterministic: any non-empty password is accepted.
    if (password.isEmpty) {
      throw Exception('Invalid credentials');
    }

    _token = 'demo-session-token';
    _user = {
      ..._defaultPassengerUser,
      'email': email,
    };

    return {
      'token': _token,
      'session': {'token': _token},
      'user': _user,
    };
  }

  @override
  Future<Map<String, dynamic>> signUpWithEmail(Map<String, dynamic> body) async {
    _token = 'demo-signup-token';
    _user = {
      ..._defaultPassengerUser,
      'name': body['name'] ?? 'Demo User',
      'email': body['email'] ?? 'demo@local.test',
      'phone': body['phone'] ?? '+251900000000',
      'nationalId': body['nationalId'] ?? 'SIM-NID-000',
    };

    return {
      'token': _token,
      'session': {'token': _token},
      'user': _user,
    };
  }

  @override
  Future<void> completeProfile(Map<String, dynamic> data) async {
    if (_user == null) return;
    _user = {
      ..._user!,
      ...data,
    };
  }

  @override
  Future<void> becomeDriver(Map<String, dynamic> data) async {
    if (_user == null) return;
    _user = {
      ..._user!,
      'role': 'driver',
      'driver': {
        'id': 'demo-driver-001',
        'licenseNumber': data['licenseNumber'],
        'vehicleModel': data['vehicleModel'],
        'vehiclePlate': data['vehiclePlate'],
        'vehicleSeats': data['vehicleSeats'],
      },
    };
  }

  @override
  Future<dynamic> getConvexToken() async {
    return {'token': 'demo-convex-jwt'};
  }

  @override
  Future<void> signOut() async {
    _token = null;
  }
}
