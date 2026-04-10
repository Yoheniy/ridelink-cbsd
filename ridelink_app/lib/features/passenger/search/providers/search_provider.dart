import 'package:flutter/material.dart';

import '../../../../core/constants/enums.dart';
import '../../../../core/services/gebeta_maps_service.dart';
import '../../../driver/trip/models/trip_model.dart';
import '../repositories/search_repository.dart';

enum SortMode { recommended, price, rating, time, seats }

/// UI state and geocoding for search; trip list fetch goes through [SearchRepository].
class SearchProvider extends ChangeNotifier {
  final SearchRepository _repository;
  final GebetaMapsService _mapsService;

  List<TripModel> _searchResults = [];
  List<TripModel> _sortedResults = [];
  bool _loading = false;
  String? _error;
  SortMode _sortMode = SortMode.recommended;

  double? _maxPrice;
  int? _minSeats;
  TimeOfDay? _preferredTime;

  List<TripModel> get searchResults => _sortedResults;
  bool get loading => _loading;
  String? get error => _error;
  SortMode get sortMode => _sortMode;
  double? get maxPrice => _maxPrice;
  int? get minSeats => _minSeats;
  TimeOfDay? get preferredTime => _preferredTime;

  int get totalResults => _searchResults.length;

  SearchProvider(this._repository, this._mapsService);

  Future<void> searchTrips({
    required String origin,
    required String destination,
    double? originLat,
    double? originLng,
    double? destLat,
    double? destLng,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    double? oLat = originLat;
    double? oLng = originLng;
    double? dLat = destLat;
    double? dLng = destLng;

    if (oLat == null || oLng == null) {
      final results = await _mapsService.searchPlace(origin);
      if (results.isNotEmpty) {
        oLat = results.first.lat;
        oLng = results.first.lng;
      }
    }

    if (dLat == null || dLng == null) {
      final results = await _mapsService.searchPlace(destination);
      if (results.isNotEmpty) {
        dLat = results.first.lat;
        dLng = results.first.lng;
      }
    }

    try {
      _searchResults = await _repository.findScheduledTrips(
        origin: origin,
        destination: destination,
        originLat: oLat,
        originLng: oLng,
        destLat: dLat,
        destLng: dLng,
      );
      _error = null;
    } catch (e) {
      debugPrint('Search failed: $e');
      _error = 'Could not load trips. Showing sample results.';
      _searchResults = _fallbackResults;
    }

    _applyFiltersAndSort();
    _loading = false;
    notifyListeners();
  }

  void setSortMode(SortMode mode) {
    _sortMode = mode;
    _applyFiltersAndSort();
    notifyListeners();
  }

  void setMaxPrice(double? price) {
    _maxPrice = price;
    _applyFiltersAndSort();
    notifyListeners();
  }

  void setMinSeats(int? seats) {
    _minSeats = seats;
    _applyFiltersAndSort();
    notifyListeners();
  }

  void setPreferredTime(TimeOfDay? time) {
    _preferredTime = time;
    _applyFiltersAndSort();
    notifyListeners();
  }

  void clearFilters() {
    _maxPrice = null;
    _minSeats = null;
    _preferredTime = null;
    _sortMode = SortMode.recommended;
    _applyFiltersAndSort();
    notifyListeners();
  }

  void _applyFiltersAndSort() {
    var filtered = List<TripModel>.from(_searchResults);

    if (_maxPrice != null) {
      filtered =
          filtered.where((t) => t.pricePerSeat <= _maxPrice!).toList();
    }
    if (_minSeats != null) {
      filtered =
          filtered.where((t) => t.seatsLeft >= _minSeats!).toList();
    }

    switch (_sortMode) {
      case SortMode.recommended:
        _sortByRecommendation(filtered);
        break;
      case SortMode.price:
        filtered.sort((a, b) => a.pricePerSeat.compareTo(b.pricePerSeat));
        break;
      case SortMode.rating:
        filtered.sort(
            (a, b) => (b.driverRating ?? 0).compareTo(a.driverRating ?? 0));
        break;
      case SortMode.time:
        filtered.sort((a, b) => a.departureTime.compareTo(b.departureTime));
        break;
      case SortMode.seats:
        filtered.sort((a, b) => b.seatsLeft.compareTo(a.seatsLeft));
        break;
    }

    _sortedResults = filtered;
  }

  /// Multi-factor scoring that weighs driver rating, price competitiveness,
  /// departure proximity, and seat availability to surface the best options.
  void _sortByRecommendation(List<TripModel> trips) {
    if (trips.isEmpty) return;

    final now = DateTime.now();

    final prices = trips.map((t) => t.pricePerSeat).toList();
    final minPrice = prices.reduce((a, b) => a < b ? a : b);
    final maxPrice = prices.reduce((a, b) => a > b ? a : b);
    final priceRange = maxPrice - minPrice;

    final scores = <TripModel, double>{};

    for (final trip in trips) {
      double score = 0;

      final rating = trip.driverRating ?? 3.0;
      score += (rating / 5.0) * 40;

      if (priceRange > 0) {
        score += (1 - (trip.pricePerSeat - minPrice) / priceRange) * 25;
      } else {
        score += 25;
      }

      final minutesUntil =
          trip.departureTime.difference(now).inMinutes.toDouble();
      if (minutesUntil < 15) {
        score += 5;
      } else if (minutesUntil <= 60) {
        score += 20;
      } else if (minutesUntil <= 180) {
        score += 15;
      } else {
        score += 8;
      }

      if (_preferredTime != null) {
        final prefMinutes =
            _preferredTime!.hour * 60 + _preferredTime!.minute;
        final tripMinutes =
            trip.departureTime.hour * 60 + trip.departureTime.minute;
        final diff = (prefMinutes - tripMinutes).abs();
        if (diff <= 30) {
          score += 10;
        } else if (diff <= 60) {
          score += 5;
        }
      }

      final seatRatio = trip.seatsLeft / (trip.availableSeats.clamp(1, 100));
      score += seatRatio * 15;

      scores[trip] = score;
    }

    trips.sort((a, b) => (scores[b] ?? 0).compareTo(scores[a] ?? 0));
  }

  void clearResults() {
    _searchResults = [];
    _sortedResults = [];
    notifyListeners();
  }

  static final _fallbackResults = [
    TripModel(
      id: 't1',
      driverId: 'd1',
      origin: 'Bole',
      destination: 'Megenagna',
      departureTime: DateTime.now().add(const Duration(hours: 1)),
      availableSeats: 4,
      pricePerSeat: 45,
      status: TripStatus.scheduled,
      driverName: 'Abebe Kebede',
      driverRating: 4.8,
    ),
    TripModel(
      id: 't2',
      driverId: 'd2',
      origin: 'Bole',
      destination: 'Megenagna',
      departureTime: DateTime.now().add(const Duration(hours: 2)),
      availableSeats: 3,
      pricePerSeat: 40,
      status: TripStatus.scheduled,
      driverName: 'Tigist Hailu',
      driverRating: 4.5,
    ),
  ];
}
