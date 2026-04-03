import 'package:flutter/foundation.dart';

import '../../../../core/services/storage_service.dart';
import '../models/booking_model.dart';
import '../repositories/booking_repository.dart';

export '../models/booking_model.dart';

/// Manages booking-related UI state; delegates persistence to [BookingRepository].
class BookingProvider extends ChangeNotifier {
  final BookingRepository _repository;
  final StorageService _storage;

  List<BookingModel> _bookings = [];
  BookingModel? _activeBooking;
  bool _loading = false;
  String? _error;

  List<BookingModel> get bookings => _bookings;
  BookingModel? get activeBooking => _activeBooking;
  bool get loading => _loading;
  String? get error => _error;

  BookingProvider(this._repository, this._storage);

  Future<void> loadBookings() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final passengerId = await _storage.getPassengerId();
      if (passengerId == null || passengerId.startsWith('demo')) {
        _bookings = [];
        _loading = false;
        notifyListeners();
        return;
      }

      _bookings = await _repository.getPassengerBookings(passengerId);
    } catch (e) {
      debugPrint('Failed to load bookings: $e');
      _error = 'Failed to load bookings';
    }

    _loading = false;
    notifyListeners();
  }

  Future<bool> requestBooking({
    required String tripId,
    required String passengerId,
    int seatsBooked = 1,
    required double totalPrice,
    String? pickUpPoint,
    String? dropOffPoint,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      _activeBooking = await _repository.requestBooking(
        tripId: tripId,
        passengerId: passengerId,
        seatsBooked: seatsBooked,
        totalPrice: totalPrice,
        pickUpPoint: pickUpPoint,
        dropOffPoint: dropOffPoint,
      );
      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Failed to request booking: $e');
      _error = 'Failed to request booking';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<BookingModel?> getBookingById(String bookingId) async {
    try {
      _activeBooking = await _repository.getBookingById(bookingId);
      notifyListeners();
      return _activeBooking;
    } catch (e) {
      debugPrint('Failed to load booking: $e');
    }
    return null;
  }

  Future<bool> cancelBooking(String bookingId) async {
    try {
      final success = await _repository.cancelBooking(bookingId);
      if (success) {
        _bookings.removeWhere((b) => b.id == bookingId);
        if (_activeBooking?.id == bookingId) _activeBooking = null;
        notifyListeners();
      }
      return success;
    } catch (e) {
      debugPrint('Failed to cancel booking: $e');
      return false;
    }
  }
}
