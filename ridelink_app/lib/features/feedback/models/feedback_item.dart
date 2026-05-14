class FeedbackItem {
  final String id;
  final String type;
  final String fromUserId;
  final String? fromUserName;
  final int? rating;
  final String? comment;
  final DateTime? createdAt;

  const FeedbackItem({
    required this.id,
    required this.type,
    required this.fromUserId,
    this.fromUserName,
    this.rating,
    this.comment,
    this.createdAt,
  });

  factory FeedbackItem.fromJson(Map<String, dynamic> json) {
    final fromUser = json['fromUser'] as Map<String, dynamic>?;
    return FeedbackItem(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? '',
      fromUserId: json['fromUserId'] as String? ?? '',
      fromUserName: fromUser?['name'] as String?,
      rating: json['rating'] as int?,
      comment: json['comment'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }
}
