import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../passenger/booking/models/trip_subscription_model.dart';
import '../models/trip_series_model.dart';

/// Contract for trip series and subscription REST access.
abstract class TripSeriesRepository {
  Future<List<TripSeriesModel>> listSeries({String? driverId});
  Future<bool> createSeries(Map<String, dynamic> body);
  Future<bool> deactivateSeries(String seriesId);
  Future<bool> generateTrips(String seriesId);
  Future<List<TripSubscriptionModel>> listPassengerSubscriptions(
      String passengerId);
  Future<bool> createSubscription(Map<String, dynamic> body);
  Future<bool> cancelSubscription(String subscriptionId);
}

class ApiTripSeriesRepository implements TripSeriesRepository {
  final ApiClient _apiClient;

  ApiTripSeriesRepository(this._apiClient);

  @override
  Future<List<TripSeriesModel>> listSeries({String? driverId}) async {
    final response = await _apiClient.get(
      ApiEndpoints.series,
      queryParameters: {
        if (driverId != null) 'driverId': driverId,
      },
    );
    final list = response.data as List?;
    if (list == null) return [];
    return list
        .map((e) => TripSeriesModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<bool> createSeries(Map<String, dynamic> body) async {
    await _apiClient.post(ApiEndpoints.series, data: body);
    return true;
  }

  @override
  Future<bool> deactivateSeries(String seriesId) async {
    await _apiClient.patch(ApiEndpoints.deactivateSeries(seriesId));
    return true;
  }

  @override
  Future<bool> generateTrips(String seriesId) async {
    await _apiClient.post(ApiEndpoints.generateTrips(seriesId));
    return true;
  }

  @override
  Future<List<TripSubscriptionModel>> listPassengerSubscriptions(
      String passengerId) async {
    final response =
        await _apiClient.get(ApiEndpoints.passengerSubscriptions(passengerId));
    final list = response.data as List?;
    if (list == null) return [];
    return list
        .map((e) =>
            TripSubscriptionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<bool> createSubscription(Map<String, dynamic> body) async {
    await _apiClient.post(ApiEndpoints.createSubscription, data: body);
    return true;
  }

  @override
  Future<bool> cancelSubscription(String subscriptionId) async {
    await _apiClient.patch(ApiEndpoints.cancelSubscription(subscriptionId));
    return true;
  }
}
