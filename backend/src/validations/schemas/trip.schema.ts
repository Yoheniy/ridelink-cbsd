import { z } from "zod";

const coordinateSchema = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
});

const subscriptionPricingSchema = z.object({
	weekly: z.number().positive().optional(),
	monthly: z.number().positive().optional(),
});

const tripStatusSchema = z.enum([
	"scheduled",
	"inProgress",
	"completed",
	"canceled",
]);
const bookingStatusSchema = z.enum([
	"pending",
	"confirmed",
	"canceled",
	"completed",
]);
const subscriptionTypeSchema = z.enum(["weekly", "monthly"]);

export const createTripSchema = z.object({
	driverId: z.uuid(),
	origin: z.string().min(1).max(255),
	destination: z.string().min(1).max(255),
	routeCoordinates: z.array(coordinateSchema).min(2),
	departureTime: z.iso.datetime(),
	availableSeats: z.number().int().positive(),
	pricePerSeat: z.number().positive(),
});

export const updateTripSchema = z.object({
	origin: z.string().min(1).max(255).optional(),
	destination: z.string().min(1).max(255).optional(),
	routeCoordinates: z.array(coordinateSchema).min(2).optional(),
	departureTime: z.iso.datetime().optional(),
	availableSeats: z.number().int().positive().optional(),
	pricePerSeat: z.number().positive().optional(),
});

export const updateTripStatusSchema = z.object({
	status: tripStatusSchema,
});

export const queryTripsSchema = z.object({
	driverId: z.uuid().optional(),
	origin: z.string().optional(),
	destination: z.string().optional(),
	status: tripStatusSchema.optional(),
	departureTimeFrom: z.iso.datetime().optional(),
	departureTimeTo: z.iso.datetime().optional(),
	minSeats: z.coerce.number().int().positive().optional(),
	maxPrice: z.coerce.number().positive().optional(),
	seriesId: z.uuid().optional(),
	page: z.coerce.number().int().positive().optional().default(1),
	limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

export const tripIdParamSchema = z.object({
	tripId: z.uuid(),
});

export const createBookingSchema = z.object({
	tripId: z.uuid(),
	passengerId: z.uuid(),
	seatsBooked: z.number().int().positive().default(1),
	pickUpPoint: z.string().min(1).max(255).optional(),
	dropOffPoint: z.string().min(1).max(255).optional(),
});

export const bookingIdParamSchema = z.object({
	bookingId: z.uuid(),
});

export const cancelBookingSchema = z.object({
	bookingId: z.uuid(),
});

// TripSeries (recurring trips)
export const createTripSeriesSchema = z.object({
	driverId: z.uuid(),
	origin: z.string().min(1).max(255),
	destination: z.string().min(1).max(255),
	routeCoordinates: z.array(coordinateSchema).min(2),
	availableSeats: z.number().int().positive(),
	pricePerSeat: z.number().positive(),
	daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
	departureTimeOfDay: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
	startDate: z.iso.datetime(),
	endDate: z.iso.datetime().optional(),
	subscriptionOptions: z.array(subscriptionTypeSchema).min(1),
	subscriptionPricing: subscriptionPricingSchema,
	// How many weeks ahead to pre-generate trip occurrences (default 4)
	generationHorizonWeeks: z
		.number()
		.int()
		.positive()
		.max(52)
		.optional()
		.default(4),
});

export const updateTripSeriesSchema = z.object({
	origin: z.string().min(1).max(255).optional(),
	destination: z.string().min(1).max(255).optional(),
	routeCoordinates: z.array(coordinateSchema).min(2).optional(),
	availableSeats: z.number().int().positive().optional(),
	pricePerSeat: z.number().positive().optional(),
	daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1).optional(),
	departureTimeOfDay: z
		.string()
		.regex(/^\d{2}:\d{2}$/, "Must be HH:mm format")
		.optional(),
	endDate: z.iso.datetime().optional(),
	isActive: z.boolean().optional(),
	subscriptionOptions: z.array(subscriptionTypeSchema).min(1).optional(),
	subscriptionPricing: subscriptionPricingSchema.optional(),
});

export const seriesIdParamSchema = z.object({
	seriesId: z.uuid(),
});

export const generateTripsSchema = z.object({
	weeks: z.number().int().positive().max(52).optional().default(4),
});

export const querySeriesSchema = z.object({
	driverId: z.uuid().optional(),
	origin: z.string().optional(),
	destination: z.string().optional(),
	isActive: z.coerce.boolean().optional(),
	page: z.coerce.number().int().positive().optional().default(1),
	limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// TripSubscription (now references TripSeries)
export const createTripSubscriptionSchema = z.object({
	seriesId: z.uuid(),
	passengerId: z.uuid(),
	subscriptionType: subscriptionTypeSchema,
	seatsSubscribed: z.number().int().positive().default(1),
	startDate: z.iso.datetime(),
	endDate: z.iso.datetime().optional(),
});

export const subscriptionIdParamSchema = z.object({
	subscriptionId: z.uuid(),
});

export const cancelSubscriptionSchema = z.object({
	subscriptionId: z.uuid(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
export type QueryTripsInput = z.infer<typeof queryTripsSchema>;
export type TripIdParam = z.infer<typeof tripIdParamSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
export type CreateTripSeriesInput = z.infer<typeof createTripSeriesSchema>;
export type UpdateTripSeriesInput = z.infer<typeof updateTripSeriesSchema>;
export type SeriesIdParam = z.infer<typeof seriesIdParamSchema>;
export type GenerateTripsInput = z.infer<typeof generateTripsSchema>;
export type QuerySeriesInput = z.infer<typeof querySeriesSchema>;
export type CreateTripSubscriptionInput = z.infer<
	typeof createTripSubscriptionSchema
>;
export type SubscriptionIdParam = z.infer<typeof subscriptionIdParamSchema>;
export type TripStatus = z.infer<typeof tripStatusSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type SubscriptionType = z.infer<typeof subscriptionTypeSchema>;
export type Coordinate = z.infer<typeof coordinateSchema>;
export type SubscriptionPricing = z.infer<typeof subscriptionPricingSchema>;
