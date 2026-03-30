import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Real-time location updates for active trips
	locationUpdates: defineTable({
		tripId: v.string(), // References Trip.id in PostgreSQL
		driverId: v.string(), // References Driver.id in PostgreSQL
		latitude: v.float64(),
		longitude: v.float64(),
		heading: v.optional(v.float64()), // Direction of travel in degrees
		speed: v.optional(v.float64()), // Speed in km/h
		status: v.union(
			v.literal("active"),
			v.literal("paused"),
			v.literal("completed"),
		),
	})
		.index("by_trip", ["tripId"])
		.index("by_driver", ["driverId"])
		.index("by_trip_status", ["tripId", "status"]),

	// Chat conversations between trip participants
	conversations: defineTable({
		tripId: v.string(), // References Trip.id in PostgreSQL
		bookingId: v.string(), // References Booking.id in PostgreSQL
		participants: v.array(v.string()), // Array of User.id from PostgreSQL
		lastMessageAt: v.optional(v.float64()), // Timestamp of last message
	})
		.index("by_trip", ["tripId"])
		.index("by_booking", ["bookingId"])
		.index("by_participant", ["participants"]),

	// Chat messages within conversations
	messages: defineTable({
		conversationId: v.id("conversations"),
		senderId: v.string(), // References User.id in PostgreSQL
		content: v.string(),
		readBy: v.array(v.string()), // Array of User.id who have read the message
	})
		.index("by_conversation", ["conversationId"]),

	// Real-time notifications
	notifications: defineTable({
		recipientId: v.string(), // References User.id in PostgreSQL
		type: v.union(
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
		),
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
		read: v.boolean(),
	})
		.index("by_recipient", ["recipientId"])
		.index("by_recipient_read", ["recipientId", "read"])
		.index("by_recipient_type", ["recipientId", "type"]),

	// SOS / Emergency alerts
	emergencyAlerts: defineTable({
		tripId: v.string(), // References Trip.id in PostgreSQL
		userId: v.string(), // References User.id (who triggered the alert)
		userRole: v.union(
			v.literal("passenger"),
			v.literal("driver"),
		),
		latitude: v.float64(),
		longitude: v.float64(),
		reason: v.optional(v.string()),
		status: v.union(
			v.literal("active"),
			v.literal("cancelled"),
			v.literal("resolved"),
		),
		resolvedAt: v.optional(v.float64()),
		resolvedBy: v.optional(v.string()), // Admin User.id who resolved it
	})
		.index("by_trip", ["tripId"])
		.index("by_status", ["status"])
		.index("by_user", ["userId"]),

	// User presence / online status
	presenceStatus: defineTable({
		userId: v.string(), // References User.id in PostgreSQL
		isOnline: v.boolean(),
		lastSeenAt: v.float64(),
	})
		.index("by_user", ["userId"]),
});
