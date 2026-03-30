import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

/**
 * Convex HTTP router for Express-to-Convex communication.
 *
 * Express calls these HTTP endpoints to trigger Convex operations
 * when events happen on the REST side (booking confirmed, trip started, etc.).
 *
 * All endpoints require a shared API key in the X-API-Key header.
 * These are trusted server-to-server calls using internalMutation
 * (no JWT auth needed — Express is a trusted caller).
 */
const http = httpRouter();

const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * Validates the API key from the request header.
 * Returns true if valid, false otherwise.
 */
function validateApiKey(request: Request): boolean {
	const apiKey = request.headers.get("X-API-Key");
	const expectedKey = process.env.CONVEX_INTERNAL_API_KEY;

	if (!expectedKey) {
		console.error("[http] CONVEX_INTERNAL_API_KEY not configured");
		return false;
	}

	return apiKey === expectedKey;
}

http.route({
	path: "/test/jwt",
	method: "POST",
	handler: httpAction(async (ctx) => {
		const user = await ctx.auth.getUserIdentity();

		return new Response(JSON.stringify({ user }), {
			status: 200,
			headers: JSON_HEADERS,
		});
	}),
});

/**
 * POST /notifications/send
 *
 * Called by Express to create a notification in Convex.
 * Body: { recipientId, type, title, message, metadata? }
 * Header: X-API-Key
 */
http.route({
	path: "/notifications/send",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		if (!validateApiKey(request)) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: JSON_HEADERS,
			});
		}

		const body = await request.json();
		const { recipientId, type, title, message, metadata } = body;

		if (!recipientId || !type || !title || !message) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: JSON_HEADERS },
			);
		}

		try {
			const notificationId = await ctx.runMutation(
				internal.notification.createInternalNotification,
				{ recipientId, type, title, message, metadata },
			);

			return new Response(JSON.stringify({ success: true, notificationId }), {
				status: 200,
				headers: JSON_HEADERS,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : "Unknown error",
				}),
				{ status: 500, headers: JSON_HEADERS },
			);
		}
	}),
});

/**
 * POST /conversations/create
 *
 * Called by Express when a booking is confirmed to create
 * a chat conversation between driver and passenger.
 * Body: { tripId, bookingId, participants }
 * Header: X-API-Key
 */
http.route({
	path: "/conversations/create",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		if (!validateApiKey(request)) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: JSON_HEADERS,
			});
		}

		const body = await request.json();
		const { tripId, bookingId, participants } = body;

		if (!tripId || !bookingId || !participants) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: JSON_HEADERS },
			);
		}

		try {
			const conversationId = await ctx.runMutation(
				internal.chat.createInternalConversation,
				{ tripId, bookingId, participants },
			);

			return new Response(JSON.stringify({ success: true, conversationId }), {
				status: 200,
				headers: JSON_HEADERS,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : "Unknown error",
				}),
				{ status: 500, headers: JSON_HEADERS },
			);
		}
	}),
});

/**
 * POST /location/start
 *
 * Called by Express when a trip transitions to inProgress.
 * Initializes the location tracking record.
 * Body: { tripId, driverId, latitude, longitude }
 * Header: X-API-Key
 */
http.route({
	path: "/location/start",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		if (!validateApiKey(request)) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: JSON_HEADERS,
			});
		}

		const body = await request.json();
		const { tripId, driverId, latitude, longitude } = body;

		if (!tripId || !driverId || latitude == null || longitude == null) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: JSON_HEADERS },
			);
		}

		try {
			const trackingId = await ctx.runMutation(
				internal.location.internalStartTracking,
				{ tripId, driverId, latitude, longitude },
			);

			return new Response(JSON.stringify({ success: true, trackingId }), {
				status: 200,
				headers: JSON_HEADERS,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : "Unknown error",
				}),
				{ status: 500, headers: JSON_HEADERS },
			);
		}
	}),
});

/**
 * POST /location/stop
 *
 * Called by Express when a trip is completed or cancelled.
 * Marks the location tracking as completed.
 * Body: { tripId }
 * Header: X-API-Key
 */
http.route({
	path: "/location/stop",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		if (!validateApiKey(request)) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: JSON_HEADERS,
			});
		}

		const body = await request.json();
		const { tripId } = body;

		if (!tripId) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400, headers: JSON_HEADERS },
			);
		}

		try {
			await ctx.runMutation(internal.location.internalStopTracking, {
				tripId,
			});

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: JSON_HEADERS,
			});
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : "Unknown error",
				}),
				{ status: 500, headers: JSON_HEADERS },
			);
		}
	}),
});

export default http;
