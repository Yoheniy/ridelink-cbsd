import 'package:flutter/foundation.dart';

import '../../../core/network/api_exceptions.dart';
import '../models/driver_payout.dart';
import '../models/driver_payout_account.dart';
import '../repositories/payout_repository.dart';

class PayoutProvider extends ChangeNotifier {
  final PayoutRepository _repository;

  DriverPayoutAccount? _account;
  List<DriverPayout> _payouts = [];
  bool _loading = false;
  bool _saving = false;
  String? _error;

  PayoutProvider(this._repository);

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
      _payouts = await _repository.listPayouts(page: page, limit: limit);
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
      _account = await _repository.upsertPayoutAccount(account);
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
