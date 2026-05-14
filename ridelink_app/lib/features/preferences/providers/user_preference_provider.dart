import 'package:flutter/foundation.dart';

import '../../../core/network/api_exceptions.dart';
import '../models/user_preference_model.dart';
import '../repositories/user_preference_repository.dart';

class UserPreferenceProvider extends ChangeNotifier {
  final UserPreferenceRepository _repository;

  UserPreferenceModel? _preference;
  bool _loading = false;
  bool _saving = false;
  String? _error;

  UserPreferenceProvider(this._repository);

  UserPreferenceModel? get preference => _preference;
  bool get loading => _loading;
  bool get saving => _saving;
  String? get error => _error;

  Future<void> loadFromMe() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _repository.getMePayload();
      final user = data?['user'] as Map<String, dynamic>?;
      final prefRaw = user?['preference'];
      if (prefRaw is Map<String, dynamic>) {
        _preference = UserPreferenceModel.fromJson(prefRaw);
      } else {
        _preference = null;
      }
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = 'Failed to load commute preference';
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> savePreference({
    required UserPreferenceModel preference,
    required String phone,
    required String nationalId,
  }) async {
    _saving = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.savePreferencePayload({
        'phone': phone,
        'nationalId': nationalId,
        'preference': preference.toJson(),
      });
      _preference = preference;
      _saving = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _saving = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'Failed to save commute preference';
      _saving = false;
      notifyListeners();
      return false;
    }
  }
}
