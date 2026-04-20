import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../models/feedback_item.dart';

abstract class FeedbackRepository {
  Future<bool> submitRating({
    required String tripId,
    required String fromUserId,
    required String toUserId,
    required int rating,
    String? comment,
  });

  Future<bool> submitReport({
    required String fromUserId,
    required String toUserId,
    String? tripId,
    required String comment,
  });

  Future<List<FeedbackItem>> loadFeedbackForUser(String userId);
}

class ApiFeedbackRepository implements FeedbackRepository {
  final ApiClient _apiClient;

  ApiFeedbackRepository(this._apiClient);

  @override
  Future<bool> submitRating({
    required String tripId,
    required String fromUserId,
    required String toUserId,
    required int rating,
    String? comment,
  }) async {
    await _apiClient.post(ApiEndpoints.feedback, data: {
      'type': 'rating',
      'fromUserId': fromUserId,
      'toUserId': toUserId,
      'tripId': tripId,
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    });
    return true;
  }

  @override
  Future<bool> submitReport({
    required String fromUserId,
    required String toUserId,
    String? tripId,
    required String comment,
  }) async {
    await _apiClient.post(ApiEndpoints.feedback, data: {
      'type': 'report',
      'fromUserId': fromUserId,
      'toUserId': toUserId,
      if (tripId != null) 'tripId': tripId,
      'comment': comment,
    });
    return true;
  }

  @override
  Future<List<FeedbackItem>> loadFeedbackForUser(String userId) async {
    final response = await _apiClient.get(ApiEndpoints.feedbackForUser(userId));
    final list = response.data as List?;
    if (list == null) return [];

    return list
        .map((e) => FeedbackItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
