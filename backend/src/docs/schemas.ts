import { z } from "zod";

export const uuidSchema = z.uuid();
export const dateTimeSchema = z.iso.datetime();

export const coordinateSchema = z
	.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
	})
	.openapi("Coordinate");

export const userSchema = z
	.object({
		id: uuidSchema,
		email: z.email(),
		name: z.string(),
		phone: z.string().nullable().optional(),
		nationalId: z.string().nullable().optional(),
		role: z.enum(["passenger", "driver", "admin"]),
		status: z.string().optional(),
		createdAt: dateTimeSchema,
		updatedAt: dateTimeSchema,
	})
	.openapi("User");

export const tripSchema = z
	.object({
		id: uuidSchema,
		driverId: uuidSchema,
		origin: z.string(),
		destination: z.string(),
		routeCoordinates: z.array(coordinateSchema),
		departureTime: dateTimeSchema,
		availableSeats: z.number().int(),
		pricePerSeat: z.number(),
		status: z.enum(["scheduled", "inProgress", "completed", "canceled"]),
		seriesId: uuidSchema.nullable().optional(),
		createdAt: dateTimeSchema.optional(),
		updatedAt: dateTimeSchema.optional(),
	})
	.openapi("Trip");

export const bookingSchema = z
	.object({
		id: uuidSchema,
		tripId: uuidSchema,
		passengerId: uuidSchema,
		seatsBooked: z.number().int(),
		pickUpPoint: z.string().nullable().optional(),
		dropOffPoint: z.string().nullable().optional(),
		status: z.enum(["pending", "confirmed", "canceled", "completed"]),
		createdAt: dateTimeSchema.optional(),
		updatedAt: dateTimeSchema.optional(),
	})
	.openapi("Booking");

export const tripSeriesSchema = z
	.object({
		id: uuidSchema,
		driverId: uuidSchema,
		origin: z.string(),
		destination: z.string(),
		routeCoordinates: z.array(coordinateSchema),
		availableSeats: z.number().int(),
		pricePerSeat: z.number(),
		daysOfWeek: z.array(z.number().int().min(0).max(6)),
		departureTimeOfDay: z.string(),
		startDate: dateTimeSchema,
		endDate: dateTimeSchema.nullable().optional(),
		isActive: z.boolean().optional(),
		createdAt: dateTimeSchema.optional(),
		updatedAt: dateTimeSchema.optional(),
	})
	.openapi("TripSeries");

export const subscriptionSchema = z
	.object({
		id: uuidSchema,
		seriesId: uuidSchema,
		passengerId: uuidSchema,
		subscriptionType: z.enum(["weekly", "monthly"]),
		seatsSubscribed: z.number().int(),
		startDate: dateTimeSchema,
		endDate: dateTimeSchema.nullable().optional(),
		status: z.string().optional(),
		createdAt: dateTimeSchema.optional(),
		updatedAt: dateTimeSchema.optional(),
	})
	.openapi("TripSubscription");

export const feedbackSchema = z
	.object({
		id: uuidSchema,
		type: z.enum(["rating", "report"]),
		fromUserId: uuidSchema,
		toUserId: uuidSchema,
		tripId: uuidSchema.nullable().optional(),
		rating: z.number().int().nullable().optional(),
		comment: z.string().nullable().optional(),
		createdAt: dateTimeSchema.optional(),
	})
	.openapi("Feedback");

export const incidentSchema = z
	.object({
		id: uuidSchema,
		feedbackId: uuidSchema.nullable().optional(),
		sosAlertId: z.string().nullable().optional(),
		sosReason: z.string().nullable().optional(),
		action: z.enum([
			"warning_issued",
			"user_suspended",
			"user_banned",
			"case_dismissed",
			"under_review",
			"escalated",
			"resolved",
		]),
		status: z.enum(["open", "in_progress", "closed"]),
		notes: z.string().nullable().optional(),
		targetUserId: uuidSchema.nullable().optional(),
		createdAt: dateTimeSchema.optional(),
		updatedAt: dateTimeSchema.optional(),
	})
	.openapi("IncidentLog");

export const paginatedMetaSchema = z
	.object({
		page: z.number().int(),
		limit: z.number().int(),
		total: z.number().int(),
		totalPages: z.number().int().optional(),
		pages: z.number().int().optional(),
	})
	.openapi("PaginationMeta");
