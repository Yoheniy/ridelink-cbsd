import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/booking_model.dart';

/// Contract for booking data access, decoupling [BookingProvider] from HTTP details.
abstract class BookingRepository {
  Future<List<BookingModel>> getPassengerBookings(String passengerId);
  Future<BookingModel?> requestBooking({
    required String tripId,
    required String passengerId,
    int seatsBooked,
    required double totalPrice,
    String? pickUpPoint,
    String? dropOffPoint,
  });
  Future<BookingModel?> getBookingById(String bookingId);
  Future<bool> cancelBooking(String bookingId);
}

/// REST-backed implementation of [BookingRepository].
class ApiBookingRepository implements BookingRepository {
  final ApiClient _apiClient;

  ApiBookingRepository(this._apiClient);

  @override
  Future<List<BookingModel>> getPassengerBookings(String passengerId) async {
    final response =
        await _apiClient.get(ApiEndpoints.passengerBookings(passengerId));
    final list = response.data as List?;
    if (list == null) return [];
    return list
        .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<BookingModel?> requestBooking({
    required String tripId,
    required String passengerId,
    int seatsBooked = 1,
    required double totalPrice,
    String? pickUpPoint,
    String? dropOffPoint,
  }) async {
    final response = await _apiClient.post(
      ApiEndpoints.createBooking,
      data: {
        'tripId': tripId,
        'passengerId': passengerId,
        'seatsBooked': seatsBooked,
        'totalPrice': totalPrice,
        if (pickUpPoint != null) 'pickUpPoint': pickUpPoint,
        if (dropOffPoint != null) 'dropOffPoint': dropOffPoint,
      },
    );
    final data = response.data as Map<String, dynamic>?;
    if (data == null) return null;
    return BookingModel.fromJson(data);
  }

  @override
  Future<BookingModel?> getBookingById(String bookingId) async {
    final response =
        await _apiClient.get(ApiEndpoints.bookingById(bookingId));
    final data = response.data as Map<String, dynamic>?;
    if (data == null) return null;
    return BookingModel.fromJson(data);
  }

  @override
  Future<bool> cancelBooking(String bookingId) async {
    await _apiClient.patch(ApiEndpoints.cancelBooking(bookingId));
    return true;
  }
}
