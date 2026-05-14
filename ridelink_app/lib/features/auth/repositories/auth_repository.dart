import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';

/// Contract for Better Auth and user-profile HTTP used by [AuthProvider].
abstract class AuthRepository {
  Future<Map<String, dynamic>?> getSession();
  Future<Map<String, dynamic>?> getMe();

  Future<Map<String, dynamic>> signInWithEmail({
    required String email,
    required String password,
  });

  Future<Map<String, dynamic>> signUpWithEmail(Map<String, dynamic> body);

  Future<void> completeProfile(Map<String, dynamic> data);
  Future<void> requestSignInOtp(String email);
  Future<void> verifyEmailOtp({required String email, required String otp});
  Future<void> requestPasswordResetOtp(String email);
  Future<void> resetPasswordWithOtp({
    required String email,
    required String otp,
    required String password,
  });

  Future<void> becomeDriver(Map<String, dynamic> data);

  Future<dynamic> getConvexToken();

  Future<void> signOut();
}

class ApiAuthRepository implements AuthRepository {
  final ApiClient _apiClient;

  ApiAuthRepository(this._apiClient);

  @override
  Future<Map<String, dynamic>?> getSession() async {
    final response = await _apiClient.get(ApiEndpoints.getSession);
    return response.data as Map<String, dynamic>?;
  }

  @override
  Future<Map<String, dynamic>?> getMe() async {
    final response = await _apiClient.get(ApiEndpoints.me);
    return response.data as Map<String, dynamic>?;
  }

  @override
  Future<Map<String, dynamic>> signInWithEmail({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.signIn,
      data: {'email': email, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> signUpWithEmail(Map<String, dynamic> body) async {
    final response = await _apiClient.post(ApiEndpoints.signUp, data: body);
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<void> completeProfile(Map<String, dynamic> data) async {
    await _apiClient.patch(ApiEndpoints.completeProfile, data: data);
  }

  @override
  Future<void> requestSignInOtp(String email) async {
    await _apiClient.post(
      ApiEndpoints.sendVerificationOtp,
      data: {'email': email, 'type': 'email-verification'},
    );
  }

  @override
  Future<void> verifyEmailOtp({required String email, required String otp}) async {
    await _apiClient.post(
      ApiEndpoints.verifyEmailOtp,
      data: {'email': email, 'otp': otp},
    );
  }

  @override
  Future<void> requestPasswordResetOtp(String email) async {
    await _apiClient.post(
      ApiEndpoints.requestPasswordResetOtp,
      data: {'email': email},
    );
  }

  @override
  Future<void> resetPasswordWithOtp({
    required String email,
    required String otp,
    required String password,
  }) async {
    await _apiClient.post(
      ApiEndpoints.resetPasswordOtp,
      data: {'email': email, 'otp': otp, 'password': password},
    );
  }

  @override
  Future<void> becomeDriver(Map<String, dynamic> data) async {
    await _apiClient.post(ApiEndpoints.becomeDriver, data: data);
  }

  @override
  Future<dynamic> getConvexToken() async {
    final response = await _apiClient.get(ApiEndpoints.getToken);
    return response.data;
  }

  @override
  Future<void> signOut() async {
    await _apiClient.post(ApiEndpoints.signOut);
  }
}
