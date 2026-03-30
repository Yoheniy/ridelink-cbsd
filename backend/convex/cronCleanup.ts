import { internalMutation } from "./_generated/server";

/**
 * Internal cleanup mutations called by cron jobs.
 * These are not callable from outside Convex (internal only).
 */

/**
 * Mark users as offline if they haven't sent a presence heartbeat
 * in the last 5 minutes.
 */
export const cleanStalePresence = internalMutation({
	args: {},
	handler: async (ctx) => {
		const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

		const staleRecords = await ctx.db
			.query("presenceStatus")
			.filter((q) =>
				q.and(
					q.eq(q.field("isOnline"), true),
					q.lt(q.field("lastSeenAt"), fiveMinutesAgo),
				),
			)
			.collect();

		await Promise.all(
			staleRecords.map((record) =>
				ctx.db.patch(record._id, { isOnline: false }),
			),
		);

		return { markedOffline: staleRecords.length };
	},
});

/**
 * Delete completed location tracking records older than 24 hours.
 * Active tracking records are preserved.
 */
export const cleanOldLocationData = internalMutation({
	args: {},
	handler: async (ctx) => {
		const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

		const oldRecords = await ctx.db
			.query("locationUpdates")
			.filter((q) =>
				q.and(
					q.eq(q.field("status"), "completed"),
					q.lt(q.field("_creationTime"), twentyFourHoursAgo),
				),
			)
			.collect();

		await Promise.all(oldRecords.map((record) => ctx.db.delete(record._id)));

		return { deleted: oldRecords.length };
	},
});

/**
 * Delete read notifications older than 30 days.
 * Unread notifications are preserved regardless of age.
 */
export const cleanOldNotifications = internalMutation({
	args: {},
	handler: async (ctx) => {
		const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

		const oldNotifications = await ctx.db
			.query("notifications")
			.filter((q) =>
				q.and(
					q.eq(q.field("read"), true),
					q.lt(q.field("_creationTime"), thirtyDaysAgo),
				),
			)
			.collect();

		await Promise.all(
			oldNotifications.map((notification) => ctx.db.delete(notification._id)),
		);

		return { deleted: oldNotifications.length };
	},
});
