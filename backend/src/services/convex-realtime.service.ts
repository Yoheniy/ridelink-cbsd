/**
 * Express-side service for communicating with the Convex realtime backend.
 *
 * Uses Convex HTTP actions (defined in convex/http.ts) to trigger
 * realtime operations from the Express REST layer.
 *
 * Authentication: Uses a shared API key (CONVEX_INTERNAL_API_KEY) in the
 * X-API-Key header. These are trusted server-to-server calls — Convex
 * HTTP actions validate the key and call internalMutations directly.
 *
 * Each method is non-blocking: logs errors but does not throw, so REST
 * operations are not disrupted by realtime failures.
 */

import { CONVEX_INTERNAL_API_KEY, CONVEX_URL } from "@/lib/constants";

/**
 * Notification types matching the Convex schema.
 */
type NotificationType =
	| "booking_request"
	| "booking_confirmed"
	| "booking_declined"
	| "booking_cancelled"
	| "trip_started"
	| "trip_completed"
	| "trip_cancelled"
	| "sos_alert"
	| "sos_resolved"
	| "warning"
	| "system";

interface NotificationPayload {
	recipientId: string;
	type: NotificationType;
	title: string;
	message: string;
	metadata?: {
		tripId?: string;
		bookingId?: string;
		senderId?: string;
	};
}

interface ConversationPayload {
	tripId: string;
	bookingId: string;
	participants: string[];
}

interface LocationStartPayload {
	tripId: string;
	driverId: string;
	latitude: number;
	longitude: number;
}

/**
 * Makes a POST request to a Convex HTTP action endpoint.
 * Non-blocking: logs errors but does not throw, so REST operations
 * are not disrupted by realtime failures.
 */
export async function callConvexHttp<T = unknown>(
	path: string,
	body: Record<string, unknown>,
): Promise<T | null> {
	if (!CONVEX_URL) {
		console.warn(
			`[convex-realtime] CONVEX_URL not set, skipping call to ${path}`,
		);
		return null;
	}

	if (!CONVEX_INTERNAL_API_KEY) {
		console.warn(
			`[convex-realtime] CONVEX_INTERNAL_API_KEY not set, skipping call to ${path}`,
		);
		return null;
	}

	// Convex HTTP actions are served at the deployment URL + path
	// The CONVEX_URL looks like https://<deployment>.convex.cloud
	// HTTP routes are at https://<deployment>.convex.site/<path>
	const baseUrl = CONVEX_URL.replace(".convex.cloud", ".convex.site");
	const url = `${baseUrl}${path}`;

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-Key": CONVEX_INTERNAL_API_KEY,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error(
				`[convex-realtime] HTTP ${response.status} from ${path}: ${error}`,
			);
			return null;
		}

		return (await response.json()) as T;
	} catch (error) {
		console.error(`[convex-realtime] Failed to call ${path}:`, error);
		return null;
	}
}

// ─── Notifications ───────────────────────────────────────────────────

/**
 * Send a notification to a user via Convex.
 * The notification appears in real-time for connected clients.
 */
export async function sendNotification(
	payload: NotificationPayload,
): Promise<void> {
	await callConvexHttp("/notifications/send", { ...payload });
}

/**
 * Send a notification to multiple users.
 */
export async function sendBulkNotifications(
	payloads: NotificationPayload[],
): Promise<void> {
	await Promise.allSettled(payloads.map((p) => sendNotification(p)));
}

// ─── Conversations ───────────────────────────────────────────────────

/**
 * Create a chat conversation between driver and passenger.
 * Called when a booking is confirmed so participants can communicate.
 */
export async function createConversation(
	payload: ConversationPayload,
): Promise<string | null> {
	const result = await callConvexHttp<{ conversationId: string }>(
		"/conversations/create",
		{ ...payload },
	);
	return result?.conversationId ?? null;
}

// ─── Location Tracking ──────────────────────────────────────────────

/**
 * Initialize location tracking when a trip starts.
 * The driver's client will then begin sending location updates directly to Convex.
 */
export async function startLocationTracking(
	payload: LocationStartPayload,
): Promise<string | null> {
	const result = await callConvexHttp<{ trackingId: string }>(
		"/location/start",
		{ ...payload },
	);
	return result?.trackingId ?? null;
}

/**
 * Stop location tracking when a trip is completed or cancelled.
 */
export async function stopLocationTracking(tripId: string): Promise<void> {
	await callConvexHttp("/location/stop", { tripId });
}
