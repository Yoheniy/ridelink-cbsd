import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';

/// Contract for commute preference data nested under `/users/me` profile.
abstract class UserPreferenceRepository {
  Future<Map<String, dynamic>?> getMePayload();

  Future<void> savePreferencePayload(Map<String, dynamic> body);
}

class ApiUserPreferenceRepository implements UserPreferenceRepository {
  final ApiClient _apiClient;

  ApiUserPreferenceRepository(this._apiClient);

  @override
  Future<Map<String, dynamic>?> getMePayload() async {
    final response = await _apiClient.get(ApiEndpoints.me);
    return response.data as Map<String, dynamic>?;
  }

  @override
  Future<void> savePreferencePayload(Map<String, dynamic> body) async {
    await _apiClient.patch(ApiEndpoints.completeProfile, data: body);
  }
}
