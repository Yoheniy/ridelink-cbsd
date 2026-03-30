import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

/**
 * Notification type values - must match the schema union.
 */
const notificationType = v.union(
	v.literal("booking_request"),
	v.literal("booking_confirmed"),
	v.literal("booking_declined"),
	v.literal("booking_cancelled"),
	v.literal("trip_started"),
	v.literal("trip_completed"),
	v.literal("trip_cancelled"),
	v.literal("sos_alert"),
	v.literal("sos_resolved"),
	v.literal("warning"),
	v.literal("system"),
);

/**
 * Get notifications for the current user (reactive).
 *
 * Clients subscribing to this will receive real-time updates
 * whenever a new notification arrives.
 *
 * Returns notifications sorted by creation time (newest first),
 * limited to the most recent 50 notifications.
 *
 * Auth: Requires authenticated user.
 */
export const getUserNotifications = query({
	args: {
		limit: v.optional(v.float64()),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);
		const limit = args.limit ?? 50;

		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_recipient", (q) => q.eq("recipientId", auth.userId))
			.order("desc")
			.take(limit);

		return notifications;
	},
});

/**
 * Get the count of unread notifications for the current user (reactive).
 *
 * Useful for showing a badge count in the UI.
 *
 * Auth: Requires authenticated user.
 */
export const getUnreadCount = query({
	args: {},
	handler: async (ctx) => {
		const auth = await requireAuth(ctx);

		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_recipient_read", (q) =>
				q.eq("recipientId", auth.userId).eq("read", false),
			)
			.collect(); // TODO: Check if there is an efficient way to do this

		return { count: unread.length };
	},
});

/**
 * Get notifications filtered by type.
 *
 * Auth: Requires authenticated user.
 */
export const getNotificationsByType = query({
	args: {
		type: notificationType,
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_recipient_type", (q) =>
				q.eq("recipientId", auth.userId).eq("type", args.type),
			)
			.order("desc")
			.take(50);

		return notifications;
	},
});

/**
 * Create a notification for a user.
 *
 * This can be called by:
 * - Other Convex functions (e.g., SOS alert creates a notification)
 * - Express backend via the HTTP client (e.g., booking confirmed)
 *
 * Auth: Requires authenticated user (typically the system or an admin).
 */
export const createNotification = mutation({
	args: {
		recipientId: v.string(),
		type: notificationType,
		title: v.string(),
		message: v.string(),
		metadata: v.optional(
			v.object({
				tripId: v.optional(v.string()),
				bookingId: v.optional(v.string()),
				alertId: v.optional(v.id("emergencyAlerts")),
				senderId: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		return await ctx.db.insert("notifications", {
			recipientId: args.recipientId,
			type: args.type,
			title: args.title,
			message: args.message,
			metadata: args.metadata,
			read: false,
		});
	},
});

/**
 * Internal mutation for creating notifications from other Convex functions.
 * Does not require auth token (trusted internal call).
 */
export const createInternalNotification = internalMutation({
	args: {
		recipientId: v.string(),
		type: notificationType,
		title: v.string(),
		message: v.string(),
		metadata: v.optional(
			v.object({
				tripId: v.optional(v.string()),
				bookingId: v.optional(v.string()),
				alertId: v.optional(v.id("emergencyAlerts")),
				senderId: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("notifications", {
			recipientId: args.recipientId,
			type: args.type,
			title: args.title,
			message: args.message,
			metadata: args.metadata,
			read: false,
		});
	},
});

/**
 * Mark a single notification as read.
 *
 * Auth: Requires authenticated user who is the recipient.
 */
export const markNotificationRead = mutation({
	args: {
		notificationId: v.id("notifications"),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		const notification = await ctx.db.get(args.notificationId);
		if (!notification) {
			throw new Error("Notification not found");
		}
		if (notification.recipientId !== auth.userId) {
			throw new Error("Not authorized to modify this notification");
		}

		await ctx.db.patch(args.notificationId, { read: true });
	},
});

/**
 * Mark all notifications as read for the current user.
 *
 * Auth: Requires authenticated user.
 */
export const markAllNotificationsRead = mutation({
	args: {},
	handler: async (ctx) => {
		const auth = await requireAuth(ctx);

		const unread = await ctx.db
			.query("notifications")
			.withIndex("by_recipient_read", (q) =>
				q.eq("recipientId", auth.userId).eq("read", false),
			)
			.collect();

		await Promise.all(
			unread.map((notification) =>
				ctx.db.patch(notification._id, { read: true }),
			),
		);

		return { markedAsRead: unread.length };
	},
});
