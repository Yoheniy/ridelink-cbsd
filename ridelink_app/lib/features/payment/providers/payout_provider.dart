import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exceptions.dart';
import '../models/driver_payout.dart';
import '../models/driver_payout_account.dart';

class PayoutProvider extends ChangeNotifier {
  final ApiClient _apiClient;

  DriverPayoutAccount? _account;
  List<DriverPayout> _payouts = [];
  bool _loading = false;
  bool _saving = false;
  String? _error;

  PayoutProvider(this._apiClient);

  DriverPayoutAccount? get account => _account;
  List<DriverPayout> get payouts => _payouts;
  bool get loading => _loading;
  bool get saving => _saving;
  String? get error => _error;

  Future<void> loadPayouts({int page = 1, int limit = 20}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
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
      _payouts = items
          .whereType<Map<String, dynamic>>()
          .map(DriverPayout.fromJson)
          .toList();
    } on ApiException catch (e) {
      _error = e.message;
      _payouts = [];
    } catch (_) {
      _error = 'Failed to load payouts';
      _payouts = [];
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> upsertAccount(DriverPayoutAccount account) async {
    _saving = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _apiClient.post(
        ApiEndpoints.paymentsDriverPayoutAccount,
        data: account.toJson(),
      );
      final data = response.data;
      if (data is Map<String, dynamic>) {
        if (data['account'] is Map<String, dynamic>) {
          _account = DriverPayoutAccount.fromJson(
            data['account'] as Map<String, dynamic>,
          );
        } else {
          _account = DriverPayoutAccount.fromJson(data);
        }
      } else {
        _account = account;
      }
      _saving = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _saving = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'Failed to save payout account';
      _saving = false;
      notifyListeners();
      return false;
    }
  }
}
