import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/driver_payout.dart';
import '../models/driver_payout_account.dart';

/// Driver payout list + payout bank/mobile-money account configuration.
abstract class PayoutRepository {
  Future<List<DriverPayout>> listPayouts({int page = 1, int limit = 20});

  Future<DriverPayoutAccount> upsertPayoutAccount(DriverPayoutAccount account);
}

class ApiPayoutRepository implements PayoutRepository {
  final ApiClient _apiClient;

  ApiPayoutRepository(this._apiClient);

  @override
  Future<List<DriverPayout>> listPayouts({int page = 1, int limit = 20}) async {
    final response = await _apiClient.get(
      ApiEndpoints.paymentsDriverPayouts,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data;
    List items = const [];
    if (data is Map<String, dynamic>) {
      if (data['items'] is List) {
        items = data['items'] as List;
      } else if (data['data'] is Map<String, dynamic> &&
          (data['data'] as Map<String, dynamic>)['items'] is List) {
        items = (data['data'] as Map<String, dynamic>)['items'] as List;
      }
    } else if (data is List) {
      items = data;
    }
    return items
        .whereType<Map<String, dynamic>>()
        .map(DriverPayout.fromJson)
        .toList();
  }

  @override
  Future<DriverPayoutAccount> upsertPayoutAccount(
    DriverPayoutAccount account,
  ) async {
    final response = await _apiClient.post(
      ApiEndpoints.paymentsDriverPayoutAccount,
      data: account.toJson(),
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      if (data['account'] is Map<String, dynamic>) {
        return DriverPayoutAccount.fromJson(
          data['account'] as Map<String, dynamic>,
        );
      }
      return DriverPayoutAccount.fromJson(data);
    }
    return account;
  }
}
