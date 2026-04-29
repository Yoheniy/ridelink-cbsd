import 'dart:convert';

import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter/foundation.dart';

import '../../../core/constants/convex_functions.dart';

typedef ConvexAuthSync = Future<bool> Function({bool forceRefresh});

class ChatConversation {
  final String id;
  final String tripId;
  final String bookingId;
  final List<String> participants;
  final String? lastMessage;
  final int unreadCount;
  final DateTime? lastMessageAt;

  // Display helpers
  final String displayName;

  const ChatConversation({
    required this.id,
    this.tripId = '',
    this.bookingId = '',
    this.participants = const [],
    this.lastMessage,
    this.unreadCount = 0,
    this.lastMessageAt,
    this.displayName = '',
  });

  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    final dynamic lastMessageRaw = json['lastMessage'];
    final String? lastMessageText = lastMessageRaw is String
        ? lastMessageRaw
        : lastMessageRaw is Map<String, dynamic>
            ? lastMessageRaw['content'] as String?
            : null;
    return ChatConversation(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      tripId: json['tripId'] as String? ?? '',
      bookingId: json['bookingId'] as String? ?? '',
      participants: (json['participants'] as List?)?.cast<String>() ?? [],
      lastMessage: lastMessageText,
      unreadCount: json['unreadCount'] as int? ?? 0,
      lastMessageAt: json['lastMessageAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(
              (json['lastMessageAt'] as num).toInt(),
            )
          : null,
      displayName: json['displayName'] as String? ??
          json['name'] as String? ??
          'Trip chat',
    );
  }

  String get timeAgo {
    if (lastMessageAt == null) return '';
    final diff = DateTime.now().difference(lastMessageAt!);
    if (diff.inMinutes < 1) return 'Now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays}d ago';
  }
}

class ChatMessage {
  final String id;
  final String text;
  final bool isSent;
  final DateTime? sentAt;

  const ChatMessage({
    required this.id,
    required this.text,
    required this.isSent,
    this.sentAt,
  });

  factory ChatMessage.fromJson(
      Map<String, dynamic> json, String currentUserId) {
    return ChatMessage(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      text: json['content'] as String? ?? json['text'] as String? ?? '',
      isSent: (json['senderId'] as String?) == currentUserId,
      sentAt: json['_creationTime'] != null
          ? DateTime.fromMillisecondsSinceEpoch(json['_creationTime'] as int)
          : null,
    );
  }

  String get time {
    if (sentAt == null) return '';
    final h = sentAt!.hour.toString().padLeft(2, '0');
    final m = sentAt!.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

class ChatProvider extends ChangeNotifier {
  final ConvexClient? _convex;
  String _currentUserId;
  ConvexAuthSync? _syncAuth;

  SubscriptionHandle? _conversationsSubscription;
  SubscriptionHandle? _messagesSubscription;

  List<ChatConversation> _conversations = [];
  List<ChatMessage> _messages = [];
  bool _loadingConversations = false;
  bool _loadingMessages = false;
  String? _error;
  String? _activeConversationId;
  bool _conversationsRetriedAfterAuth = false;
  bool _messagesRetriedAfterAuth = false;
  bool _authRecoveryInProgress = false;

  List<ChatConversation> get conversations => _conversations;
  List<ChatMessage> get messages => _messages;
  bool get loadingConversations => _loadingConversations;
  bool get loadingMessages => _loadingMessages;
  String? get error => _error;

  ChatProvider(this._convex, this._currentUserId);

  void bindAuthSync(ConvexAuthSync syncAuth) {
    _syncAuth = syncAuth;
  }

  void setUserId(String userId) {
    if (_currentUserId != userId) {
      _currentUserId = userId;
    }
  }

  Future<bool> _ensureReady() async {
    if (_currentUserId.trim().isEmpty) {
      _error = 'Chat is unavailable until user identity is loaded.';
      return false;
    }
    final sync = _syncAuth;
    if (sync == null) {
      _error = 'Chat auth is not configured.';
      return false;
    }
    final ok = await sync();
    if (!ok) {
      _error = 'Chat authentication failed. Please try again.';
      return false;
    }
    return true;
  }

  bool _isAuthErrorText(String message) {
    final normalized = message.toLowerCase();
    return normalized.contains('authentication required') ||
        normalized.contains('unauthorized') ||
        normalized.contains('forbidden') ||
        normalized.contains('not authenticated');
  }

  Future<bool> _recoverAuth() async {
    if (_authRecoveryInProgress) return false;
    final sync = _syncAuth;
    if (sync == null) return false;
    _authRecoveryInProgress = true;
    try {
      final ok = await sync(forceRefresh: true);
      return ok;
    } finally {
      _authRecoveryInProgress = false;
    }
  }

  Future<void> loadConversations() async {
    _loadingConversations = true;
    _error = null;
    notifyListeners();

    if (_convex == null) {
      _conversations = [];
      _error = 'Chat service is not configured for this build.';
      _loadingConversations = false;
      notifyListeners();
      return;
    }

    if (!await _ensureReady()) {
      _conversations = [];
      _loadingConversations = false;
      notifyListeners();
      return;
    }

    try {
      _conversationsSubscription?.cancel();
      _conversationsSubscription = await _convex.subscribe(
        name: ConvexFunctions.getUserConversations,
        args: {},
        onUpdate: (value) {
          try {
            final list = jsonDecode(value) as List;
            _conversations = list
                .map((e) =>
                    ChatConversation.fromJson(e as Map<String, dynamic>))
                .toList();
            _conversationsRetriedAfterAuth = false;
          } catch (e) {
            debugPrint('Conversation parse error: $e');
            _conversations = [];
            _error = 'Failed to parse conversations.';
          }
          _loadingConversations = false;
          notifyListeners();
        },
        onError: (message, value) {
          debugPrint('Conversations error: $message');
          if (_isAuthErrorText(message) && !_conversationsRetriedAfterAuth) {
            _conversationsRetriedAfterAuth = true;
            _retryConversationsAfterAuth();
            return;
          }
          _conversations = [];
          _error = message;
          _loadingConversations = false;
          notifyListeners();
        },
      );
    } catch (e) {
      debugPrint('Failed to subscribe to conversations: $e');
      _conversations = [];
      _error = 'Failed to connect to chat conversations.';
      _loadingConversations = false;
      notifyListeners();
    }
  }

  Future<void> _retryConversationsAfterAuth() async {
    _loadingConversations = true;
    _error = 'Refreshing chat authentication...';
    notifyListeners();
    final recovered = await _recoverAuth();
    if (!recovered) {
      _conversations = [];
      _loadingConversations = false;
      _error = 'Chat authentication expired. Please sign in again.';
      notifyListeners();
      return;
    }
    await loadConversations();
  }

  Future<void> loadMessages(String conversationId) async {
    _activeConversationId = conversationId;
    _loadingMessages = true;
    _error = null;
    notifyListeners();

    if (_convex == null) {
      _messages = [];
      _error = 'Chat service is not configured for this build.';
      _loadingMessages = false;
      notifyListeners();
      return;
    }

    if (!await _ensureReady()) {
      _messages = [];
      _loadingMessages = false;
      notifyListeners();
      return;
    }

    try {
      _messagesSubscription?.cancel();
      _messagesSubscription = await _convex.subscribe(
        name: ConvexFunctions.getConversationMessages,
        args: {'conversationId': conversationId},
        onUpdate: (value) {
          try {
            final list = jsonDecode(value) as List;
            _messages = list
                .map((e) => ChatMessage.fromJson(
                    e as Map<String, dynamic>, _currentUserId))
                .toList();
            _messagesRetriedAfterAuth = false;
          } catch (e) {
            debugPrint('Messages parse error: $e');
            _messages = [];
            _error = 'Failed to parse messages.';
          }
          _loadingMessages = false;
          markAsRead(conversationId);
          notifyListeners();
        },
        onError: (message, value) {
          debugPrint('Messages error: $message');
          if (_isAuthErrorText(message) && !_messagesRetriedAfterAuth) {
            _messagesRetriedAfterAuth = true;
            _retryMessagesAfterAuth(conversationId);
            return;
          }
          _messages = [];
          _error = message;
          _loadingMessages = false;
          notifyListeners();
        },
      );
    } catch (e) {
      debugPrint('Failed to subscribe to messages: $e');
      _messages = [];
      _error = 'Failed to connect to conversation.';
      _loadingMessages = false;
      notifyListeners();
    }
  }

  Future<void> _retryMessagesAfterAuth(String conversationId) async {
    _loadingMessages = true;
    _error = 'Refreshing chat authentication...';
    notifyListeners();
    final recovered = await _recoverAuth();
    if (!recovered) {
      _messages = [];
      _loadingMessages = false;
      _error = 'Chat authentication expired. Please sign in again.';
      notifyListeners();
      return;
    }
    await loadMessages(conversationId);
  }

  Future<void> sendMessage(String content) async {
    if (_activeConversationId == null || content.trim().isEmpty) return;

    final tempMessage = ChatMessage(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      text: content,
      isSent: true,
      sentAt: DateTime.now(),
    );
    _messages = [..._messages, tempMessage];
    notifyListeners();

    try {
      await _runWithAuthRetry(
        operationName: 'sendMessage',
        action: () => _convex!.mutation(
          name: ConvexFunctions.sendMessage,
          args: {
            'conversationId': _activeConversationId!,
            'content': content,
          },
        ),
      );
    } catch (e) {
      debugPrint('Failed to send message: $e');
      _error = 'Failed to send message';
      notifyListeners();
    }
  }

  Future<void> markAsRead(String conversationId) async {
    try {
      await _runWithAuthRetry(
        operationName: 'markMessagesAsRead',
        action: () => _convex!.mutation(
          name: ConvexFunctions.markMessagesAsRead,
          args: {'conversationId': conversationId},
        ),
      );
    } catch (e) {
      debugPrint('Failed to mark messages as read: $e');
    }
  }

  Future<String?> getConversationIdByBooking(String bookingId) async {
    if (_convex == null || bookingId.trim().isEmpty) return null;
    try {
      final value = await _runWithAuthRetry<String>(
        operationName: 'getConversationByBooking',
        action: () => _convex.query(
          ConvexFunctions.getConversationByBooking,
          {'bookingId': bookingId},
        ),
      );
      if (value == null) return null;
      if (value.trim().isEmpty || value == 'null') return null;
      final decoded = jsonDecode(value);
      if (decoded is Map) return decoded['_id']?.toString();
      return null;
    } catch (e) {
      debugPrint('Failed to resolve conversation by booking: $e');
      return null;
    }
  }

  Future<T?> _runWithAuthRetry<T>({
    required String operationName,
    required Future<T?> Function() action,
  }) async {
    if (!await _ensureReady()) {
      throw StateError(_error ?? 'Chat auth not ready.');
    }
    try {
      return await action();
    } catch (e) {
      final message = e.toString();
      if (_isAuthErrorText(message)) {
        final recovered = await _recoverAuth();
        if (recovered) {
          return await action();
        }
        _error = 'Chat authentication expired. Please sign in again.';
      }
      debugPrint('Chat operation $operationName failed: $e');
      rethrow;
    }
  }

  void disposeMessages() {
    _messagesSubscription?.cancel();
    _messagesSubscription = null;
    _messages = [];
    _activeConversationId = null;
  }

  @override
  void dispose() {
    _conversationsSubscription?.cancel();
    _messagesSubscription?.cancel();
    super.dispose();
  }
}
