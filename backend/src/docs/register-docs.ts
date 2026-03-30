import {
	banUserSchema,
	createFeedbackSchema,
	createIncidentLogSchema,
	incidentIdParamSchema,
	unbanUserSchema,
	updateConfigSchema,
	updateIncidentLogSchema,
	userIdParamSchema,
} from "@/validations/schemas/admin.schema";
import {
	bookingIdParamSchema,
	createBookingSchema,
	createTripSchema,
	createTripSeriesSchema,
	createTripSubscriptionSchema,
	generateTripsSchema,
	querySeriesSchema,
	queryTripsSchema,
	seriesIdParamSchema,
	subscriptionIdParamSchema,
	tripIdParamSchema,
	updateTripSchema,
	updateTripSeriesSchema,
	updateTripStatusSchema,
} from "@/validations/schemas/trip.schema";
import {
	becomeDriverSchema,
	completeProfileSchema,
} from "@/validations/schemas/user.schema";
import { z } from "zod";
import {
	authSecurity,
	createSuccessResponse,
	defaultErrorResponses,
	registry,
} from "./openapi";
import {
	bookingSchema,
	feedbackSchema,
	incidentSchema,
	paginatedMetaSchema,
	subscriptionSchema,
	tripSchema,
	tripSeriesSchema,
	userSchema,
	uuidSchema,
} from "./schemas";

let registered = false;

const okMessageSchema = z.object({ message: z.string() });

const queryWithStatusSchema = z.object({
	status: z.string().optional(),
});

const driverParamSchema = z.object({ driverId: uuidSchema });
const passengerParamSchema = z.object({ passengerId: uuidSchema });

const createTokenResponseSchema = z.object({ token: z.string() });

function registerAuthDocs() {
	// Sign up
	registry.registerPath({
		method: "post",
		path: "/api/auth/sign-up/email",
		tags: ["Auth"],
		summary: "Sign up with email and password",
		description: "Create a new user account with email and password",
		security: [],
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: z.object({
							email: z.email(),
							password: z.string().min(8),
							name: z.string().min(1).optional(),
							phone: z.string().optional(),
							nationalId: z.string().optional(),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "Account created successfully",
				content: {
					"application/json": {
						schema: z.object({
							user: userSchema,
							session: z.object({
								id: z.string(),
								expiresAt: z.iso.datetime(),
								token: z.string(),
							}),
						}),
					},
				},
			},
			400: {
				description: "Validation error or user already exists",
				content: {
					"application/json": {
						schema: z.object({
							error: z.object({
								message: z.string(),
								statusCode: z.number(),
							}),
						}),
					},
				},
			},
		},
	});

	// Sign in
	registry.registerPath({
		method: "post",
		path: "/api/auth/sign-in/email",
		tags: ["Auth"],
		summary: "Sign in with email and password",
		description:
			"Authenticate user with email and password. Returns session cookie and optionally JWT token.",
		security: [],
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: z.object({
							email: z.email(),
							password: z.string().min(1),
						}),
					},
				},
			},
		},
		responses: {
			200: {
				description: "Authentication successful",
				content: {
					"application/json": {
						schema: z.object({
							user: userSchema,
							session: z.object({
								id: z.string(),
								expiresAt: z.iso.datetime(),
								token: z.string(),
							}),
						}),
					},
				},
			},
			400: {
				description: "Invalid credentials",
				content: {
					"application/json": {
						schema: z.object({
							error: z.object({
								message: z.string(),
								statusCode: z.number(),
							}),
						}),
					},
				},
			},
		},
	});

	// Sign out
	registry.registerPath({
		method: "post",
		path: "/api/auth/sign-out",
		tags: ["Auth"],
		summary: "Sign out current user",
		description: "End the current user session",
		security: authSecurity,
		responses: {
			200: {
				description: "Signed out successfully",
				content: {
					"application/json": {
						schema: z.object({
							message: z.string(),
						}),
					},
				},
			},
		},
	});

	// Get session
	registry.registerPath({
		method: "get",
		path: "/api/auth/session",
		tags: ["Auth"],
		summary: "Get current session",
		description: "Retrieve current user session information",
		security: [],
		responses: {
			200: {
				description: "Session retrieved",
				content: {
					"application/json": {
						schema: z.object({
							user: userSchema,
							session: z.object({
								id: z.string(),
								expiresAt: z.iso.datetime(),
								token: z.string(),
							}),
						}),
					},
				},
			},
			401: {
				description: "No active session",
			},
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/auth/token",
		tags: ["Auth"],
		summary: "Get JWT token for current session",
		description:
			"Returns a Better Auth JWT token. Use this token in Swagger Authorize dialog as Bearer token.",
		security: [],
		responses: {
			200: {
				description: "JWT token issued successfully",
				content: {
					"application/json": {
						schema: createTokenResponseSchema,
					},
				},
			},
			...defaultErrorResponses,
		},
	});
}

function registerUserDocs() {
	registry.registerPath({
		method: "patch",
		path: "/api/users/complete-profile",
		tags: ["Users"],
		summary: "Complete user profile",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: completeProfileSchema,
					},
				},
			},
		},
		responses: {
			200: createSuccessResponse(
				"Profile updated successfully",
				z.object({ user: userSchema }),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/users/become-driver",
		tags: ["Users"],
		summary: "Promote user to driver",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: becomeDriverSchema,
					},
				},
			},
		},
		responses: {
			200: createSuccessResponse(
				"User promoted to driver",
				z.object({ driver: userSchema }),
			),
			...defaultErrorResponses,
		},
	});
}

function registerTripDocs() {
	registry.registerPath({
		method: "post",
		path: "/api/trips",
		tags: ["Trips"],
		summary: "Create trip",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: createTripSchema } },
			},
		},
		responses: {
			201: createSuccessResponse("Trip created", tripSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/trips",
		tags: ["Trips"],
		summary: "Query trips",
		security: authSecurity,
		request: { query: queryTripsSchema },
		responses: {
			200: createSuccessResponse(
				"Trips fetched",
				z.object({
					items: z.array(tripSchema).optional(),
					trips: z.array(tripSchema).optional(),
					pagination: paginatedMetaSchema.optional(),
					total: z.number().int().optional(),
				}),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/trips/{tripId}",
		tags: ["Trips"],
		summary: "Get trip by id",
		security: authSecurity,
		request: { params: tripIdParamSchema },
		responses: {
			200: createSuccessResponse("Trip fetched", tripSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/trips/{tripId}",
		tags: ["Trips"],
		summary: "Update trip",
		security: authSecurity,
		request: {
			params: tripIdParamSchema,
			body: {
				required: true,
				content: { "application/json": { schema: updateTripSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("Trip updated", tripSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/trips/{tripId}/status",
		tags: ["Trips"],
		summary: "Update trip status",
		security: authSecurity,
		request: {
			params: tripIdParamSchema,
			body: {
				required: true,
				content: { "application/json": { schema: updateTripStatusSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("Trip status updated", tripSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "delete",
		path: "/api/trips/{tripId}",
		tags: ["Trips"],
		summary: "Delete trip",
		security: authSecurity,
		request: { params: tripIdParamSchema },
		responses: {
			200: createSuccessResponse("Trip deleted", okMessageSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/trips/{tripId}/bookings",
		tags: ["Bookings"],
		summary: "List bookings for a trip",
		security: authSecurity,
		request: {
			params: tripIdParamSchema,
			query: queryWithStatusSchema,
		},
		responses: {
			200: createSuccessResponse(
				"Trip bookings fetched",
				z.array(bookingSchema),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/trips/bookings",
		tags: ["Bookings"],
		summary: "Create booking",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: createBookingSchema } },
			},
		},
		responses: {
			201: createSuccessResponse("Booking created", bookingSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/trips/bookings/{bookingId}",
		tags: ["Bookings"],
		summary: "Get booking by id",
		security: authSecurity,
		request: { params: bookingIdParamSchema },
		responses: {
			200: createSuccessResponse("Booking fetched", bookingSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/trips/bookings/{bookingId}/accept",
		tags: ["Bookings"],
		summary: "Accept booking",
		security: authSecurity,
		request: { params: bookingIdParamSchema },
		responses: {
			200: createSuccessResponse("Booking accepted", bookingSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/trips/bookings/{bookingId}/decline",
		tags: ["Bookings"],
		summary: "Decline booking",
		security: authSecurity,
		request: { params: bookingIdParamSchema },
		responses: {
			200: createSuccessResponse("Booking declined", bookingSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/trips/bookings/{bookingId}/cancel",
		tags: ["Bookings"],
		summary: "Cancel booking",
		security: authSecurity,
		request: { params: bookingIdParamSchema },
		responses: {
			200: createSuccessResponse("Booking canceled", bookingSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/trips/passengers/{passengerId}/bookings",
		tags: ["Bookings"],
		summary: "Get passenger bookings",
		security: authSecurity,
		request: { params: passengerParamSchema },
		responses: {
			200: createSuccessResponse(
				"Passenger bookings fetched",
				z.array(bookingSchema),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/trips/drivers/{driverId}/trips",
		tags: ["Trips"],
		summary: "Get driver trips",
		security: authSecurity,
		request: {
			params: driverParamSchema,
			query: queryWithStatusSchema,
		},
		responses: {
			200: createSuccessResponse("Driver trips fetched", z.array(tripSchema)),
			...defaultErrorResponses,
		},
	});
}

function registerSeriesDocs() {
	registry.registerPath({
		method: "post",
		path: "/api/series",
		tags: ["Trip Series"],
		summary: "Create trip series",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: createTripSeriesSchema } },
			},
		},
		responses: {
			201: createSuccessResponse("Trip series created", tripSeriesSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/series",
		tags: ["Trip Series"],
		summary: "Query trip series",
		security: authSecurity,
		request: { query: querySeriesSchema },
		responses: {
			200: createSuccessResponse(
				"Trip series fetched",
				z.object({
					items: z.array(tripSeriesSchema).optional(),
					series: z.array(tripSeriesSchema).optional(),
					pagination: paginatedMetaSchema.optional(),
					total: z.number().int().optional(),
				}),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/series/{seriesId}",
		tags: ["Trip Series"],
		summary: "Get trip series by id",
		security: authSecurity,
		request: { params: seriesIdParamSchema },
		responses: {
			200: createSuccessResponse("Trip series fetched", tripSeriesSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/series/{seriesId}",
		tags: ["Trip Series"],
		summary: "Update trip series",
		security: authSecurity,
		request: {
			params: seriesIdParamSchema,
			body: {
				required: true,
				content: { "application/json": { schema: updateTripSeriesSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("Trip series updated", tripSeriesSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/series/{seriesId}/deactivate",
		tags: ["Trip Series"],
		summary: "Deactivate trip series",
		security: authSecurity,
		request: { params: seriesIdParamSchema },
		responses: {
			200: createSuccessResponse("Trip series deactivated", okMessageSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/series/{seriesId}/generate",
		tags: ["Trip Series"],
		summary: "Generate trip occurrences",
		security: authSecurity,
		request: {
			params: seriesIdParamSchema,
			body: {
				required: true,
				content: { "application/json": { schema: generateTripsSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("Trips generated", okMessageSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/series/subscriptions",
		tags: ["Trip Subscriptions"],
		summary: "Create subscription",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: {
					"application/json": {
						schema: createTripSubscriptionSchema,
					},
				},
			},
		},
		responses: {
			201: createSuccessResponse("Subscription created", subscriptionSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/series/subscriptions/{subscriptionId}",
		tags: ["Trip Subscriptions"],
		summary: "Get subscription by id",
		security: authSecurity,
		request: { params: subscriptionIdParamSchema },
		responses: {
			200: createSuccessResponse("Subscription fetched", subscriptionSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/series/subscriptions/{subscriptionId}/cancel",
		tags: ["Trip Subscriptions"],
		summary: "Cancel subscription",
		security: authSecurity,
		request: { params: subscriptionIdParamSchema },
		responses: {
			200: createSuccessResponse("Subscription canceled", subscriptionSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/series/passengers/{passengerId}/subscriptions",
		tags: ["Trip Subscriptions"],
		summary: "Get passenger subscriptions",
		security: authSecurity,
		request: { params: passengerParamSchema },
		responses: {
			200: createSuccessResponse(
				"Passenger subscriptions fetched",
				z.array(subscriptionSchema),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/series/{seriesId}/subscriptions",
		tags: ["Trip Subscriptions"],
		summary: "Get subscriptions for a series",
		security: authSecurity,
		request: { params: seriesIdParamSchema },
		responses: {
			200: createSuccessResponse(
				"Series subscriptions fetched",
				z.array(subscriptionSchema),
			),
			...defaultErrorResponses,
		},
	});
}

function registerFeedbackDocs() {
	registry.registerPath({
		method: "post",
		path: "/api/feedback",
		tags: ["Feedback"],
		summary: "Create feedback",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: createFeedbackSchema } },
			},
		},
		responses: {
			201: createSuccessResponse("Feedback created", feedbackSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/feedback/{userId}",
		tags: ["Feedback"],
		summary: "Get feedback for user",
		security: authSecurity,
		request: { params: userIdParamSchema },
		responses: {
			200: createSuccessResponse("Feedback fetched", z.array(feedbackSchema)),
			...defaultErrorResponses,
		},
	});
}

function registerAdminDocs() {
	registry.registerPath({
		method: "get",
		path: "/api/admin/config",
		tags: ["Admin"],
		summary: "Get admin config",
		security: authSecurity,
		responses: {
			200: createSuccessResponse(
				"Config fetched",
				z.record(z.string(), z.any()),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/admin/config",
		tags: ["Admin"],
		summary: "Update admin config",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: updateConfigSchema } },
			},
		},
		responses: {
			200: createSuccessResponse(
				"Config updated",
				z.record(z.string(), z.any()),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/admin/ban",
		tags: ["Admin"],
		summary: "Ban user",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: banUserSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("User banned", okMessageSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/admin/unban",
		tags: ["Admin"],
		summary: "Unban user",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: unbanUserSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("User unbanned", okMessageSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/admin/stats",
		tags: ["Admin"],
		summary: "Get dashboard stats",
		security: authSecurity,
		responses: {
			200: createSuccessResponse(
				"Stats fetched",
				z.record(z.string(), z.any()),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/admin/feedback",
		tags: ["Admin"],
		summary: "List all feedback",
		security: authSecurity,
		request: {
			query: z.object({
				type: z.enum(["rating", "report"]).optional(),
			}),
		},
		responses: {
			200: createSuccessResponse(
				"Feedback list fetched",
				z.array(feedbackSchema),
			),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "post",
		path: "/api/admin/incidents",
		tags: ["Admin Incidents"],
		summary: "Create incident log",
		security: authSecurity,
		request: {
			body: {
				required: true,
				content: { "application/json": { schema: createIncidentLogSchema } },
			},
		},
		responses: {
			201: createSuccessResponse("Incident created", incidentSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/admin/incidents",
		tags: ["Admin Incidents"],
		summary: "List incident logs",
		security: authSecurity,
		request: {
			query: z.object({
				status: z.enum(["open", "in_progress", "closed"]).optional(),
			}),
		},
		responses: {
			200: createSuccessResponse("Incidents fetched", z.array(incidentSchema)),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "get",
		path: "/api/admin/incidents/{incidentId}",
		tags: ["Admin Incidents"],
		summary: "Get incident log",
		security: authSecurity,
		request: { params: incidentIdParamSchema },
		responses: {
			200: createSuccessResponse("Incident fetched", incidentSchema),
			...defaultErrorResponses,
		},
	});

	registry.registerPath({
		method: "patch",
		path: "/api/admin/incidents/{incidentId}",
		tags: ["Admin Incidents"],
		summary: "Update incident log",
		security: authSecurity,
		request: {
			params: incidentIdParamSchema,
			body: {
				required: true,
				content: { "application/json": { schema: updateIncidentLogSchema } },
			},
		},
		responses: {
			200: createSuccessResponse("Incident updated", incidentSchema),
			...defaultErrorResponses,
		},
	});
}

export function registerOpenApiDocs() {
	if (registered) return;

	registerAuthDocs();
	registerUserDocs();
	registerTripDocs();
	registerSeriesDocs();
	registerFeedbackDocs();
	registerAdminDocs();

	registered = true;
}
