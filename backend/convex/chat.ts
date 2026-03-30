import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

/**
 * Get messages for a conversation (reactive).
 *
 * Clients subscribing to this query will automatically receive new messages
 * in real-time as they are sent. Messages are ordered by creation time.
 *
 * Auth: Requires authenticated user who is a participant.
 */
export const getConversationMessages = query({
	args: {
		conversationId: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		// Verify participation
		const conversation = await ctx.db.get(args.conversationId);
		if (!conversation) {
			throw new Error("Conversation not found");
		}
		if (!conversation.participants.includes(auth.userId)) {
			throw new Error("You are not a participant in this conversation");
		}

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) =>
				q.eq("conversationId", args.conversationId),
			)
			.collect();

		return messages;
	},
});

/**
 * Get all conversations for the current user (reactive).
 *
 * Returns conversations sorted by last message time (most recent first).
 * Includes unread message count for each conversation.
 *
 * Auth: Requires authenticated user.
 */
export const getUserConversations = query({
	args: {},
	handler: async (ctx) => {
		const auth = await requireAuth(ctx);

		const allConversations = await ctx.db.query("conversations").collect();

		const userConversations = allConversations.filter((c) =>
			c.participants.includes(auth.userId),
		);

		// Sort by last message time (most recent first)
		userConversations.sort(
			(a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0),
		);

		// Add unread count for each conversation
		const withUnread = await Promise.all(
			userConversations.map(async (conv) => {
				const messages = await ctx.db
					.query("messages")
					.withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
					.collect();

				const unreadCount = messages.filter(
					(m) => !m.readBy.includes(auth.userId),
				).length;

				// Get the last message for preview
				const lastMessage =
					messages.length > 0 ? messages[messages.length - 1] : null;

				return {
					...conv,
					unreadCount,
					lastMessage: lastMessage
						? {
								content: lastMessage.content,
								senderId: lastMessage.senderId,
								_creationTime: lastMessage._creationTime,
							}
						: null,
				};
			}),
		);

		return withUnread;
	},
});

/**
 * Get a single conversation by booking ID.
 *
 * Auth: Requires authenticated user who is a participant.
 */
export const getConversationByBooking = query({
	args: {
		bookingId: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		const conversation = await ctx.db
			.query("conversations")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.first();

		if (!conversation) return null;

		if (!conversation.participants.includes(auth.userId)) {
			throw new Error("You are not a participant in this conversation");
		}

		return conversation;
	},
});

/**
 * Create a conversation between trip participants.
 *
 * Called when a booking is confirmed - either from Express via the HTTP
 * client or directly by a participant. Only one conversation per booking.
 *
 * Auth: Requires authenticated user who is a participant.
 */
export const createConversation = mutation({
	args: {
		tripId: v.string(),
		bookingId: v.string(),
		participants: v.array(v.string()), // [driverUserId, passengerUserId]
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		// Verify the caller is a participant
		if (!args.participants.includes(auth.userId)) {
			throw new Error("You must be a participant to create a conversation");
		}

		// Check if a conversation already exists for this booking
		const existing = await ctx.db
			.query("conversations")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.first();

		if (existing) {
			return existing._id;
		}

		return await ctx.db.insert("conversations", {
			tripId: args.tripId,
			bookingId: args.bookingId,
			participants: args.participants,
			lastMessageAt: Date.now(),
		});
	},
});

/**
 * Send a message in a conversation.
 *
 * Auth: Requires authenticated user who is a participant in the conversation.
 */
export const sendMessage = mutation({
	args: {
		conversationId: v.id("conversations"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		// Verify conversation exists and user is a participant
		const conversation = await ctx.db.get(args.conversationId);
		if (!conversation) {
			throw new Error("Conversation not found");
		}

		if (!conversation.participants.includes(auth.userId)) {
			throw new Error("You are not a participant in this conversation");
		}

		// Validate message content
		const content = args.content.trim();
		if (!content) {
			throw new Error("Message content cannot be empty");
		}

		if (content.length > 2000) {
			throw new Error("Message content cannot exceed 2000 characters");
		}

		// Create the message
		const messageId = await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			senderId: auth.userId,
			content,
			readBy: [auth.userId], // Sender has already "read" it
		});

		// Update conversation's last message timestamp
		await ctx.db.patch(args.conversationId, {
			lastMessageAt: Date.now(),
		});

		return messageId;
	},
});

/**
 * Mark messages as read by the current user.
 *
 * Auth: Requires authenticated user who is a participant.
 */
export const markMessagesAsRead = mutation({
	args: {
		conversationId: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		// Verify participation
		const conversation = await ctx.db.get(args.conversationId);
		if (!conversation) {
			throw new Error("Conversation not found");
		}
		if (!conversation.participants.includes(auth.userId)) {
			throw new Error("You are not a participant in this conversation");
		}

		// Find unread messages (not read by this user)
		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) =>
				q.eq("conversationId", args.conversationId),
			)
			.collect();

		const unread = messages.filter((m) => !m.readBy.includes(auth.userId));

		await Promise.all(
			unread.map((message) =>
				ctx.db.patch(message._id, {
					readBy: [...message.readBy, auth.userId],
				}),
			),
		);

		return { markedAsRead: unread.length };
	},
});

// ─── Internal mutations (called from HTTP actions, no auth needed) ───

/**
 * Internal: Create a conversation between trip participants.
 * Called from HTTP action when Express triggers booking confirmation.
 * No participant verification since this is a trusted server call.
 */
export const createInternalConversation = internalMutation({
	args: {
		tripId: v.string(),
		bookingId: v.string(),
		participants: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		// Check if a conversation already exists for this booking
		const existing = await ctx.db
			.query("conversations")
			.withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
			.first();

		if (existing) {
			return existing._id;
		}

		return await ctx.db.insert("conversations", {
			tripId: args.tripId,
			bookingId: args.bookingId,
			participants: args.participants,
			lastMessageAt: Date.now(),
		});
	},
});
