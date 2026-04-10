import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../driver/trip/models/trip_model.dart';

/// Contract for trip search data access. Geocoding stays in [SearchProvider];
/// this layer only performs the REST query.
abstract class SearchRepository {
  Future<List<TripModel>> findScheduledTrips({
    required String origin,
    required String destination,
    double? originLat,
    double? originLng,
    double? destLat,
    double? destLng,
  });
}

class ApiSearchRepository implements SearchRepository {
  final ApiClient _apiClient;

  ApiSearchRepository(this._apiClient);

  @override
  Future<List<TripModel>> findScheduledTrips({
    required String origin,
    required String destination,
    double? originLat,
    double? originLng,
    double? destLat,
    double? destLng,
  }) async {
    final response = await _apiClient.get(
      ApiEndpoints.trips,
      queryParameters: {
        'origin': origin,
        'destination': destination,
        'status': 'scheduled',
        if (originLat != null) 'originLat': originLat,
        if (originLng != null) 'originLng': originLng,
        if (destLat != null) 'destLat': destLat,
        if (destLng != null) 'destLng': destLng,
      },
    );
    final list = response.data as List?;
    if (list == null) return [];
    return list
        .map((e) => TripModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
