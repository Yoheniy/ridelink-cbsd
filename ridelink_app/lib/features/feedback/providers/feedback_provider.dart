import 'package:flutter/foundation.dart';

import '../models/feedback_item.dart';
import '../repositories/feedback_repository.dart';

class FeedbackProvider extends ChangeNotifier {
  final FeedbackRepository _repository;

  bool _submitting = false;
  bool _submitted = false;
  String? _error;
  List<FeedbackItem> _feedbackList = [];
  bool _loadingFeedback = false;

  bool get submitting => _submitting;
  bool get submitted => _submitted;
  String? get error => _error;
  List<FeedbackItem> get feedbackList => _feedbackList;
  bool get loadingFeedback => _loadingFeedback;

  List<FeedbackItem> get ratings =>
      _feedbackList.where((f) => f.type == 'rating').toList();

  FeedbackProvider(this._repository);

  Future<bool> submitRating({
    required String tripId,
    required String fromUserId,
    required String toUserId,
    required int rating,
    String? comment,
  }) async {
    _submitting = true;
    _error = null;
    _submitted = false;
    notifyListeners();

    try {
      await _repository.submitRating(
        tripId: tripId,
        fromUserId: fromUserId,
        toUserId: toUserId,
        rating: rating,
        comment: comment,
      );
      _submitting = false;
      _submitted = true;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Failed to submit rating: $e');
      _error = 'Failed to submit rating';
      _submitting = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> submitReport({
    required String fromUserId,
    required String toUserId,
    String? tripId,
    required String comment,
  }) async {
    _submitting = true;
    _error = null;
    _submitted = false;
    notifyListeners();

    try {
      await _repository.submitReport(
        fromUserId: fromUserId,
        toUserId: toUserId,
        tripId: tripId,
        comment: comment,
      );
      _submitting = false;
      _submitted = true;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Failed to submit report: $e');
      _error = 'Failed to submit report';
      _submitting = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> loadFeedbackForUser(String userId) async {
    _loadingFeedback = true;
    notifyListeners();

    try {
      _feedbackList = await _repository.loadFeedbackForUser(userId);
    } catch (e) {
      debugPrint('Failed to load feedback: $e');
      _feedbackList = [];
    }

    _loadingFeedback = false;
    notifyListeners();
  }

  void reset() {
    _submitting = false;
    _submitted = false;
    _error = null;
    notifyListeners();
  }
}
