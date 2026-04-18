import 'package:flutter/foundation.dart';

import '../../../../core/services/storage_service.dart';
import '../../../passenger/booking/models/trip_subscription_model.dart';
import '../models/trip_series_model.dart';
import '../repositories/trip_series_repository.dart';

/// State for recurring trip series and passenger subscriptions.
/// Data access goes through [TripSeriesRepository].
class TripSeriesProvider extends ChangeNotifier {
  final TripSeriesRepository _repository;
  final StorageService _storage;

  List<TripSeriesModel> _series = [];
  List<TripSubscriptionModel> _subscriptions = [];
  bool _loading = false;
  String? _error;

  List<TripSeriesModel> get series => _series;
  List<TripSubscriptionModel> get subscriptions => _subscriptions;
  bool get loading => _loading;
  String? get error => _error;

  TripSeriesProvider(this._repository, this._storage);

  Future<void> loadDriverSeries() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final driverId = await _storage.getDriverId();
      _series = await _repository.listSeries(driverId: driverId);
    } catch (e) {
      debugPrint('Failed to load series: $e');
      _error = 'Failed to load trip series';
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> createSeries(TripSeriesModel seriesData) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.createSeries(seriesData.toCreateJson());
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Failed to create series: $e');
      _error = 'Failed to create trip series';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deactivateSeries(String seriesId) async {
    try {
      final ok = await _repository.deactivateSeries(seriesId);
      if (ok) {
        _series.removeWhere((s) => s.id == seriesId);
        notifyListeners();
      }
      return ok;
    } catch (e) {
      debugPrint('Failed to deactivate series: $e');
      return false;
    }
  }

  Future<bool> generateTrips(String seriesId) async {
    try {
      return await _repository.generateTrips(seriesId);
    } catch (e) {
      debugPrint('Failed to generate trips: $e');
      return false;
    }
  }

  Future<void> loadPassengerSubscriptions() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final passengerId = await _storage.getPassengerId();
      if (passengerId == null || passengerId.startsWith('demo')) {
        _subscriptions = [];
        _loading = false;
        notifyListeners();
        return;
      }

      _subscriptions =
          await _repository.listPassengerSubscriptions(passengerId);
    } catch (e) {
      debugPrint('Failed to load subscriptions: $e');
      _error = 'Failed to load subscriptions';
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> subscribe({
    required String seriesId,
    required String passengerId,
    required String subscriptionType,
    int seatsSubscribed = 1,
    required double pricePerPeriod,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.createSubscription({
        'seriesId': seriesId,
        'passengerId': passengerId,
        'subscriptionType': subscriptionType,
        'seatsSubscribed': seatsSubscribed,
        'pricePerPeriod': pricePerPeriod,
        'startDate': DateTime.now().toIso8601String(),
      });
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Failed to subscribe: $e');
      _error = 'Failed to create subscription';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> cancelSubscription(String subscriptionId) async {
    try {
      final ok = await _repository.cancelSubscription(subscriptionId);
      if (ok) {
        _subscriptions.removeWhere((s) => s.id == subscriptionId);
        notifyListeners();
      }
      return ok;
    } catch (e) {
      debugPrint('Failed to cancel subscription: $e');
      return false;
    }
  }
}
