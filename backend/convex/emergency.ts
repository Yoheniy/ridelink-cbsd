import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, requireRole } from "./auth";

/**
 * Get all active emergency alerts (reactive).
 *
 * The admin dashboard subscribes to this query to receive
 * real-time updates whenever a new SOS alert is triggered.
 *
 * Auth: Requires admin role.
 */
export const getActiveAlerts = query({
	args: {},
	handler: async (ctx) => {
		const auth = await requireAuth(ctx);
		requireRole(auth, "admin");

		const alerts = await ctx.db
			.query("emergencyAlerts")
			.withIndex("by_status", (q) => q.eq("status", "active"))
			.order("desc")
			.collect();

		return alerts;
	},
});

/**
 * Get details of a specific emergency alert.
 *
 * Includes the latest location data for the associated trip
 * so admins can see where the alert was triggered.
 *
 * Auth: Requires admin, or the user who triggered the alert.
 */
export const getAlertDetails = query({
	args: {
		alertId: v.id("emergencyAlerts"),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		const alert = await ctx.db.get(args.alertId);
		if (!alert) {
			throw new Error("Alert not found");
		}

		// Only admins or the alert creator can view details
		const isAdmin = auth.role === "admin";
		const isCreator = alert.userId === auth.userId;

		if (!isAdmin && !isCreator) {
			throw new Error("Not authorized to view this alert");
		}

		// Get the latest location for the trip
		const latestLocation = await ctx.db
			.query("locationUpdates")
			.withIndex("by_trip_status", (q) =>
				q.eq("tripId", alert.tripId).eq("status", "active"),
			)
			.first();

		return {
			...alert,
			currentLocation: latestLocation
				? {
						latitude: latestLocation.latitude,
						longitude: latestLocation.longitude,
						heading: latestLocation.heading,
						speed: latestLocation.speed,
					}
				: null,
		};
	},
});

/**
 * Get all alerts for a specific trip.
 *
 * Auth: Requires authenticated user.
 */
export const getAlertsByTrip = query({
	args: {
		tripId: v.string(),
	},
	handler: async (ctx, args) => {
		await requireAuth(ctx);

		const alerts = await ctx.db
			.query("emergencyAlerts")
			.withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
			.order("desc")
			.collect();

		return alerts;
	},
});

/**
 * Get alert history (all resolved/cancelled alerts) for admin review.
 *
 * Auth: Requires admin role.
 */
export const getAlertHistory = query({
	args: {
		limit: v.optional(v.float64()),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);
		requireRole(auth, "admin");

		const limit = args.limit ?? 50;

		// Get recent resolved/cancelled alerts
		const alerts = await ctx.db
			.query("emergencyAlerts")
			.order("desc")
			.filter((q) =>
				q.or(
					q.eq(q.field("status"), "resolved"),
					q.eq(q.field("status"), "cancelled"),
				),
			)
			.take(limit);

		return alerts;
	},
});

/**
 * Trigger an SOS emergency alert during an active trip.
 *
 * This is a high-priority action that:
 * 1. Creates an emergency alert record
 * 2. Sends notifications to all admin users
 * 3. Captures the user's current location
 *
 * Auth: Requires authenticated user (passenger or driver).
 */
export const triggerSOS = mutation({
	args: {
		tripId: v.string(),
		latitude: v.float64(),
		longitude: v.float64(),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		// Only passengers and drivers can trigger SOS
		if (auth.role !== "passenger" && auth.role !== "driver") {
			throw new Error("Only trip participants can trigger SOS alerts");
		}

		// Check if user already has an active alert for this trip
		const existingAlert = await ctx.db
			.query("emergencyAlerts")
			.withIndex("by_trip", (q) => q.eq("tripId", args.tripId))
			.filter((q) => q.eq(q.field("status"), "active"))
			.first();

		if (existingAlert) {
			throw new Error("An active SOS alert already exists for this trip");
		}

		// Create the emergency alert
		const alertId = await ctx.db.insert("emergencyAlerts", {
			tripId: args.tripId,
			userId: auth.userId,
			userRole: auth.role as "passenger" | "driver",
			latitude: args.latitude,
			longitude: args.longitude,
			reason: args.reason,
			status: "active",
		});

		return alertId;
	},
});

/**
 * Cancel an SOS alert (within the countdown window).
 *
 * Only the user who triggered the alert can cancel it.
 *
 * Auth: Requires authenticated user who triggered the alert.
 */
export const cancelSOS = mutation({
	args: {
		alertId: v.id("emergencyAlerts"),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);

		const alert = await ctx.db.get(args.alertId);
		if (!alert) {
			throw new Error("Alert not found");
		}

		if (alert.userId !== auth.userId) {
			throw new Error("Only the alert creator can cancel it");
		}

		if (alert.status !== "active") {
			throw new Error("Only active alerts can be cancelled");
		}

		await ctx.db.patch(args.alertId, {
			status: "cancelled",
		});
	},
});

/**
 * Resolve an SOS alert (admin action).
 *
 * Auth: Requires admin role.
 */
export const resolveSOS = mutation({
	args: {
		alertId: v.id("emergencyAlerts"),
	},
	handler: async (ctx, args) => {
		const auth = await requireAuth(ctx);
		requireRole(auth, "admin");

		const alert = await ctx.db.get(args.alertId);
		if (!alert) {
			throw new Error("Alert not found");
		}

		if (alert.status !== "active") {
			throw new Error("Only active alerts can be resolved");
		}

		await ctx.db.patch(args.alertId, {
			status: "resolved",
			resolvedAt: Date.now(),
			resolvedBy: auth.userId,
		});
	},
});
