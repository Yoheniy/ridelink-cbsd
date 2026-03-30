import { ForbiddenError, UnauthorizedError } from "@/errors";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";
import type { statement } from "../lib/permissions";

type Statement = typeof statement;
type Resource = keyof Statement;
type ActionFor<R extends Resource> = Statement[R][number];

/**
 * Permission descriptor: a record mapping resources to arrays of actions.
 * Example: { trip: ["create"], booking: ["read"] }
 */
export type PermissionDescriptor = {
	[R in Resource]?: ActionFor<R>[];
};

declare module "express" {
	interface Request {
		user: {
			id: string;
			role: string;
		};
	}
}

/**
 * Requires an authenticated session. Populates req.user.
 */
export async function requireAuth(
	req: Request,
	_: Response,
	next: NextFunction,
) {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers),
	});

	if (!session?.user) throw new UnauthorizedError();

	req.user = { id: session.user.id, role: session.user.role };

	next();
}

/**
 * Checks permissions using better-auth's admin plugin `userHasPermission`.
 * Pass a permission descriptor like: { trip: ["create"] }
 */
export function requirePermission(permissions: PermissionDescriptor) {
	return async (req: Request, _: Response, next: NextFunction) => {
		if (!req.user) throw new UnauthorizedError();

		const result = await auth.api.userHasPermission({
			body: {
				userId: req.user.id,
				permissions: permissions as Record<string, string[]>,
			},
		});

		if (!result?.success) {
			throw new ForbiddenError(`Insufficient permissions`);
		}

		next();
	};
}

/**
 * Checks if the user has one of the allowed roles.
 */
export function requireRoles(allowedRoles: string[]) {
	return (req: Request, _: Response, next: NextFunction) => {
		if (!req.user || !allowedRoles.includes(req.user.role)) {
			throw new ForbiddenError(`Requires one of: ${allowedRoles.join(", ")}`);
		}
		next();
	};
}

export function requireRole(role: string) {
	return requireRoles([role]);
}

export const requirePassenger = requireRole("passenger");
export const requireDriver = requireRole("driver");
export const requireAdmin = requireRole("admin");
