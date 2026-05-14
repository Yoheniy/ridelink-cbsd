import '../../../../core/constants/enums.dart';
import '../../../driver/trip/models/trip_model.dart';
import 'search_repository.dart';

/// In-memory implementation used for component model test simulations.
/// This proves SearchProvider can work without HTTP when the repository
/// contract is respected.
class InMemorySearchRepository implements SearchRepository {
  final List<TripModel> _trips;

  InMemorySearchRepository(this._trips);

  @override
  Future<List<TripModel>> findScheduledTrips({
    required String origin,
    required String destination,
    double? originLat,
    double? originLng,
    double? destLat,
    double? destLng,
  }) async {
    final o = origin.toLowerCase().trim();
    final d = destination.toLowerCase().trim();

    return _trips.where((trip) {
      final sameOrigin = trip.origin.toLowerCase().trim() == o;
      final sameDestination = trip.destination.toLowerCase().trim() == d;
      final scheduled = trip.status == TripStatus.scheduled;
      return sameOrigin && sameDestination && scheduled;
    }).toList();
  }
}

