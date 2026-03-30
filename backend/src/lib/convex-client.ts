import { ConvexHttpClient } from "convex/browser";
import { CONVEX_URL } from "./constants";

if (!CONVEX_URL) {
	console.warn("CONVEX_URL is not set. Convex client will not be available.");
}

/**
 * Server-side Convex HTTP client.
 *
 * Used by Express services to call Convex mutations/actions when
 * events occur on the REST side (e.g., booking created, trip status changed).
 *
 * This is a stateless HTTP client (not WebSocket-based) suitable for
 * server-to-server communication.
 */
let convexClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
	if (!CONVEX_URL) {
		throw new Error(
			"CONVEX_URL is not configured. Set CONVEX_URL in your .env file.",
		);
	}

	if (!convexClient) {
		convexClient = new ConvexHttpClient(CONVEX_URL);
	}

	return convexClient;
}
