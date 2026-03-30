import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAuth, requireRole } from "./auth";

/**
 * Get the latest location for an active trip.
 *
 * This is a reactive query - clients subscribing to this will automatically
 * receive updates whenever the driver pushes a new location.
 *
 * Auth: Requires authenticated user (passenger tracking their ride, or driver).
 */
export const getLatestLocation = query({
	args: {
		tripId: v.string(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const location = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip_status", (q) =>
				q.eq("tripId", args.tripId).eq("status", "active"),
			)
			.first();

		return location;
	},
});

/**
 * Get location history for a trip (all records including completed).
 * Useful for showing the route trail on a map.
 *
 * Auth: Requires authenticated user.
 */
export const getLocationHistory = query({
	args: {
		tripId: v.string(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const locations = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
			.collect();

		return locations;
	},
});

/**
 * Check if a trip is currently being tracked (has an active location record).
 *
 * Auth: Requires authenticated user.
 */
export const isTrackingActive = query({
	args: {
		tripId: v.string(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const active = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip_status", (q) =>
				q.eq("tripId", args.tripId).eq("status", "active"),
			)
			.first();

		return { isActive: !!active };
	},
});

/**
 * Update the driver's current location during an active trip.
 *
 * Called by the driver's client at regular intervals (every 3-5 seconds).
 * Creates or updates the location record for the trip.
 *
 * Auth: Requires driver role.
 */
export const updateLocation = mutation({
	args: {
		tripId: v.string(),
		latitude: v.float64(),
		longitude: v.float64(),
		heading: v.optional(v.float64()),
		speed: v.optional(v.float64()),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);
		requireRole(auth, "driver");

		// Check if there's an existing active location record for this trip
		const existing = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip_status", (q) =>
				q.eq("tripId", args.tripId).eq("status", "active"),
			)
			.first();

		if (existing) {
			// Update the existing record
			await ctx.db.patch(existing._id, {
				latitude: args.latitude,
				longitude: args.longitude,
				heading: args.heading,
				speed: args.speed,
			});
			return existing._id;
		}

		// Create a new location record
		return await ctx.db.insert("locationUpdates", {
			tripId: args.tripId,
			driverId: auth.userId,
			latitude: args.latitude,
			longitude: args.longitude,
			heading: args.heading,
			speed: args.speed,
			status: "active",
		});
	},
});

/**
 * Initialize location tracking when a trip starts.
 * Called from Express (via HTTP action) when trip status changes to inProgress.
 *
 * Auth: Requires driver role.
 */
export const startTracking = mutation({
	args: {
		tripId: v.string(),
		driverId: v.string(),
		latitude: v.float64(),
		longitude: v.float64(),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);
		requireRole(auth, "driver");

		return await ctx.db.insert("locationUpdates", {
			tripId: args.tripId,
			driverId: args.driverId,
			latitude: args.latitude,
			longitude: args.longitude,
			status: "active",
		});
	},
});

/**
 * Stop location tracking when a trip ends.
 * Marks the location record as completed.
 *
 * Auth: Requires driver role.
 */
export const stopTracking = mutation({
	args: {
		tripId: v.string(),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);
		requireRole(auth, "driver");

		const active = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip_status", (q) =>
				q.eq("tripId", args.tripId).eq("status", "active"),
			)
			.first();

		if (active) {
			await ctx.db.patch(active._id, { status: "completed" });
		}
	},
});

// ─── Internal mutations (called from HTTP actions, no auth needed) ───

/**
 * Internal: Initialize location tracking.
 * Called from HTTP action when Express triggers trip start.
 */
export const internalStartTracking = internalMutation({
	args: {
		tripId: v.string(),
		driverId: v.string(),
		latitude: v.float64(),
		longitude: v.float64(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("locationUpdates", {
			tripId: args.tripId,
			driverId: args.driverId,
			latitude: args.latitude,
			longitude: args.longitude,
			status: "active",
		});
	},
});

/**
 * Internal: Stop location tracking.
 * Called from HTTP action when Express triggers trip end.
 */
export const internalStopTracking = internalMutation({
	args: {
		tripId: v.string(),
	},
	handler: async (ctx, args) => {
		const active = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip_status", (q) =>
				q.eq("tripId", args.tripId).eq("status", "active"),
			)
			.first();

		if (active) {
			await ctx.db.patch(active._id, { status: "completed" });
		}
	},
});
