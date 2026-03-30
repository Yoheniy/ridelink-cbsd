import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Authentication utilities for Convex functions.
 *
 * Auth flow (with native Convex auth via better-auth JWT plugin):
 * 1. Client authenticates with Express (better-auth session)
 * 2. Client obtains a JWT via better-auth's /api/auth/token endpoint
 * 3. Client passes the JWT to Convex via ConvexProviderWithAuth
 * 4. Convex verifies the JWT cryptographically using the JWKS from Express
 * 5. ctx.auth.getUserIdentity() returns the verified identity
 *
 * Custom claims from better-auth definePayload (id, email, role) are
 * accessible on the identity object.
 */

export type AuthInfo = {
	userId: string;
	role: "admin" | "passenger" | "driver";
};

/**
 * Gets the authenticated user's identity from the Convex context.
 * Returns undefined if no valid JWT was provided.
 *
 * The identity's `subject` field corresponds to the JWT `sub` claim,
 * which better-auth sets to the user ID by default.
 *
 * Custom claims (id, email, role) from definePayload are accessible
 * as flattened fields on the identity.
 */
export async function getAuthInfo(
	ctx: QueryCtx | MutationCtx,
): Promise<AuthInfo | undefined> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) return undefined;

	// The subject is the user ID (set by better-auth JWT sub claim)
	const userId = identity.subject;

	// Custom claims from definePayload are accessible as top-level fields
	// e.g. identity["role"] for the role claim
	const role = (identity as Record<string, unknown>)["role"] as
		| string
		| undefined;

	if (!userId || !role) return undefined;

	const validRoles = ["admin", "passenger", "driver"];
	if (!validRoles.includes(role)) return undefined;

	return {
		userId,
		role: role as AuthInfo["role"],
	};
}

/**
 * Requires that the user is authenticated.
 * Throws if no valid JWT was provided.
 */
export async function requireAuth(
	ctx: QueryCtx | MutationCtx,
): Promise<AuthInfo> {
	const auth = await getAuthInfo(ctx);
	if (!auth) {
		throw new Error("Authentication required");
	}
	return auth;
}

/**
 * Validates that the user has one of the required roles.
 */
export function requireRole(
	auth: AuthInfo,
	...roles: AuthInfo["role"][]
): AuthInfo {
	if (!roles.includes(auth.role)) {
		throw new Error(
			`Forbidden: requires role ${roles.join(" or ")}, got ${auth.role}`,
		);
	}
	return auth;
}
