import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./auth";

/**
 * Get the online status of a specific user (reactive).
 *
 * Subscribing clients will see real-time updates when the user
 * comes online or goes offline.
 *
 * Auth: Requires authenticated user.
 */
export const getUserPresence = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const presence = await ctx.db
			.query("presenceStatus")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.first();

		if (!presence) {
			return { isOnline: false, lastSeenAt: null };
		}

		// Consider user offline if heartbeat is older than 2 minutes
		const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000;
		const isStale = Date.now() - presence.lastSeenAt > HEARTBEAT_TIMEOUT_MS;

		return {
			isOnline: presence.isOnline && !isStale,
			lastSeenAt: presence.lastSeenAt,
		};
	},
});

/**
 * Get the online status of multiple users at once.
 *
 * Useful for showing presence indicators in a list of users
 * (e.g., conversation participants, trip bookings).
 *
 * Auth: Requires authenticated user.
 */
export const getBulkPresence = query({
	args: {
		userIds: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const HEARTBEAT_TIMEOUT_MS = 2 * 60 * 1000;
		const now = Date.now();

		const results: Record<
			string,
			{ isOnline: boolean; lastSeenAt: number | null }
		> = {};

		for (const userId of args.userIds) {
			const presence = await ctx.db
				.query("presenceStatus")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.first();

			if (!presence) {
				results[userId] = { isOnline: false, lastSeenAt: null };
			} else {
				const isStale = now - presence.lastSeenAt > HEARTBEAT_TIMEOUT_MS;
				results[userId] = {
					isOnline: presence.isOnline && !isStale,
					lastSeenAt: presence.lastSeenAt,
				};
			}
		}

		return results;
	},
});

/**
 * Update the current user's online presence.
 *
 * Called by the client on:
 * - App open / focus (isOnline: true)
 * - App close / blur / background (isOnline: false)
 * - Periodic heartbeat (isOnline: true, every 30-60 seconds)
 *
 * Auth: Requires authenticated user.
 */
export const updatePresence = mutation({
	args: {
		isOnline: v.boolean(),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		const existing = await ctx.db
			.query("presenceStatus")
			.withIndex("by_user", (q) => q.eq("userId", auth.userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				isOnline: args.isOnline,
				lastSeenAt: Date.now(),
			});
			return existing._id;
		}

		return await ctx.db.insert("presenceStatus", {
			userId: auth.userId,
			isOnline: args.isOnline,
			lastSeenAt: Date.now(),
		});
	},
});
