import 'package:flutter/foundation.dart';

import '../../../../core/constants/enums.dart';
import '../../../../core/services/storage_service.dart';
import '../../../passenger/booking/models/booking_model.dart';
import '../models/trip_model.dart';
import '../repositories/trip_repository.dart';

export '../models/trip_model.dart';

/// Manages trip-related UI state. Delegates all data access to [TripRepository],
/// keeping this class focused on state transitions and view notifications.
class TripProvider extends ChangeNotifier {
  final TripRepository _repository;
  final StorageService _storage;

  List<TripModel> _driverTrips = [];
  TripModel? _selectedTrip;
  List<BookingModel> _tripBookings = [];
  bool _loading = false;
  String? _error;

  List<TripModel> get driverTrips => _driverTrips;
  TripModel? get selectedTrip => _selectedTrip;
  List<BookingModel> get tripBookings => _tripBookings;
  bool get loading => _loading;
  String? get error => _error;

  static final _mockTrips = [
    TripModel(
      id: 't1',
      driverId: 'demo-driver-001',
      origin: 'Bole',
      destination: 'Megenagna',
      departureTime: DateTime.now().add(const Duration(hours: 1)),
      availableSeats: 4,
      pricePerSeat: 45,
      status: TripStatus.scheduled,
    ),
    TripModel(
      id: 't2',
      driverId: 'demo-driver-001',
      origin: 'Kazanchis',
      destination: 'CMC',
      departureTime: DateTime.now().add(const Duration(hours: 2)),
      availableSeats: 3,
      pricePerSeat: 35,
      status: TripStatus.scheduled,
    ),
  ];

  TripProvider(this._repository, this._storage);

  Future<void> loadDriverTrips() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final driverId = await _storage.getDriverId();
      if (driverId == null || driverId.startsWith('demo')) {
        _driverTrips = _mockTrips;
        _loading = false;
        notifyListeners();
        return;
      }

      _driverTrips = await _repository.getDriverTrips(driverId);
    } catch (e) {
      debugPrint('Failed to load trips: $e');
      _driverTrips = _mockTrips;
    }

    _loading = false;
    notifyListeners();
  }

  Future<TripModel?> getTripById(String id) async {
    try {
      _selectedTrip = await _repository.getTripById(id);
      notifyListeners();
      return _selectedTrip;
    } catch (e) {
      debugPrint('Failed to load trip: $e');
    }
    return null;
  }

  Future<bool> createTrip({
    required String driverId,
    required String origin,
    required String destination,
    required List<Map<String, double>> routeCoordinates,
    required double distanceKm,
    required DateTime departureTime,
    required int availableSeats,
    required double pricePerSeat,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _repository.createTrip({
        'driverId': driverId,
        'origin': origin,
        'destination': destination,
        'routeCoordinates': routeCoordinates,
        'distanceKm': distanceKm,
        'departureTime': departureTime.toIso8601String(),
        'availableSeats': availableSeats,
        'pricePerSeat': pricePerSeat,
      });
      _loading = false;
      notifyListeners();
      return success;
    } catch (e) {
      debugPrint('Failed to create trip: $e');
      _error = 'Failed to create trip';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateTripStatus(String tripId, TripStatus status) async {
    try {
      return await _repository.updateTripStatus(tripId, status);
    } catch (e) {
      debugPrint('Failed to update trip status: $e');
      return false;
    }
  }

  Future<bool> acceptBooking(String bookingId) async {
    try {
      return await _repository.acceptBooking(bookingId);
    } catch (e) {
      debugPrint('Failed to accept booking: $e');
      return false;
    }
  }

  Future<bool> declineBooking(String bookingId) async {
    try {
      return await _repository.declineBooking(bookingId);
    } catch (e) {
      debugPrint('Failed to decline booking: $e');
      return false;
    }
  }

  Future<List<BookingModel>> loadTripBookings(String tripId) async {
    try {
      _tripBookings = await _repository.getTripBookings(tripId);
      notifyListeners();
      return _tripBookings;
    } catch (e) {
      debugPrint('Failed to load trip bookings: $e');
    }
    return [];
  }

  Future<bool> updateTrip(String tripId, Map<String, dynamic> data) async {
    try {
      return await _repository.updateTrip(tripId, data);
    } catch (e) {
      debugPrint('Failed to update trip: $e');
      return false;
    }
  }

  Future<bool> deleteTrip(String tripId) async {
    try {
      final success = await _repository.deleteTrip(tripId);
      if (success) {
        _driverTrips.removeWhere((t) => t.id == tripId);
        notifyListeners();
      }
      return success;
    } catch (e) {
      debugPrint('Failed to delete trip: $e');
      return false;
    }
  }
}
