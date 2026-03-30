import '../../../../core/constants/enums.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../../passenger/booking/models/booking_model.dart';
import '../models/trip_model.dart';

/// Contract for trip data access, decoupling the state layer (TripProvider)
/// from the specifics of how trip data is fetched, created, or modified.
abstract class TripRepository {
  Future<List<TripModel>> getDriverTrips(String driverId);
  Future<TripModel?> getTripById(String id);
  Future<bool> createTrip(Map<String, dynamic> data);
  Future<bool> updateTripStatus(String tripId, TripStatus status);
  Future<bool> updateTrip(String tripId, Map<String, dynamic> data);
  Future<bool> deleteTrip(String tripId);
  Future<List<BookingModel>> getTripBookings(String tripId);
  Future<bool> acceptBooking(String bookingId);
  Future<bool> declineBooking(String bookingId);
}

/// Concrete implementation that talks to the Express backend via REST.
/// Can be swapped with a mock implementation for testing or demo mode.
class ApiTripRepository implements TripRepository {
  final ApiClient _apiClient;

  ApiTripRepository(this._apiClient);

  @override
  Future<List<TripModel>> getDriverTrips(String driverId) async {
    final response =
        await _apiClient.get(ApiEndpoints.driverTrips(driverId));
    final list = response.data as List?;
    if (list == null) return [];
    return list
        .map((e) => TripModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<TripModel?> getTripById(String id) async {
    final response = await _apiClient.get(ApiEndpoints.tripById(id));
    final data = response.data as Map<String, dynamic>?;
    if (data == null) return null;
    return TripModel.fromJson(data);
  }

  @override
  Future<bool> createTrip(Map<String, dynamic> data) async {
    await _apiClient.post(ApiEndpoints.trips, data: data);
    return true;
  }

  @override
  Future<bool> updateTripStatus(String tripId, TripStatus status) async {
    await _apiClient.patch(
      ApiEndpoints.tripStatus(tripId),
      data: {'status': status.name},
    );
    return true;
  }

  @override
  Future<bool> updateTrip(String tripId, Map<String, dynamic> data) async {
    await _apiClient.patch(ApiEndpoints.tripById(tripId), data: data);
    return true;
  }

  @override
  Future<bool> deleteTrip(String tripId) async {
    await _apiClient.delete(ApiEndpoints.tripById(tripId));
    return true;
  }

  @override
  Future<List<BookingModel>> getTripBookings(String tripId) async {
    final response =
        await _apiClient.get(ApiEndpoints.tripBookings(tripId));
    final list = response.data as List?;
    if (list == null) return [];
    return list
        .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<bool> acceptBooking(String bookingId) async {
    await _apiClient.patch(ApiEndpoints.acceptBooking(bookingId));
    return true;
  }

  @override
  Future<bool> declineBooking(String bookingId) async {
    await _apiClient.patch(ApiEndpoints.declineBooking(bookingId));
    return true;
  }
}
