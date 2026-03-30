import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Custom permission statements merged with better-auth's default admin statements.
 * Resources map to arrays of allowed actions.
 */
export const statement = {
	...defaultStatements,
	trip: ["create", "read", "update", "delete", "search"],
	booking: ["create", "read", "accept", "decline", "cancel"],
	profile: ["read", "update"],
	rating: ["read", "write"],
	tracking: ["update"],
	config: ["read", "update"],
	stats: ["read"],
	feedback: ["create", "read", "list"],
	incident: ["create", "read", "list", "update"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Admin role — inherits all default admin permissions plus full access
 * to every custom resource.
 */
export const adminRole = ac.newRole({
	...adminAc.statements,
	trip: ["create", "read", "update", "delete", "search"],
	booking: ["create", "read", "accept", "decline", "cancel"],
	profile: ["read", "update"],
	rating: ["read", "write"],
	tracking: ["update"],
	config: ["read", "update"],
	stats: ["read"],
	feedback: ["create", "read", "list"],
	incident: ["create", "read", "list", "update"],
});

/**
 * Driver role
 */
export const driverRole = ac.newRole({
	trip: ["create", "read", "update", "delete"],
	booking: ["accept", "decline", "read"],
	profile: ["read", "update"],
	rating: ["read", "write"],
	tracking: ["update"],
	feedback: ["create", "read"],
});

/**
 * Passenger role
 */
export const passengerRole = ac.newRole({
	trip: ["search", "read"],
	booking: ["create", "read", "cancel"],
	profile: ["read", "update"],
	rating: ["write"],
	feedback: ["create", "read"],
});
