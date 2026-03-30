import type { AuthConfig } from "convex/server";

/**
 * Convex auth configuration — validates JWTs issued by the Express
 * better-auth server.
 *
 * better-auth's JWT plugin (ES256) signs tokens and exposes
 * a JWKS endpoint at /api/auth/jwks. Convex fetches the public keys
 * from there to cryptographically verify every token.
 *
 * The BETTER_AUTH_URL env var must be set in the Convex dashboard
 * (e.g. http://localhost:5000 in dev, https://api.ridelink.com in prod).
 */
export default {
	providers: [
		{
			type: "customJwt",
			issuer: process.env.BETTER_AUTH_URL!,
			jwks: `${process.env.BETTER_AUTH_URL!}/api/auth/jwks`,
			algorithm: "ES256",
		},
	],
} satisfies AuthConfig;
