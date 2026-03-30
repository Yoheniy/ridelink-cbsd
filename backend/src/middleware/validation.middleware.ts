import type { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import type { ZodObject } from "zod";

export function validateBody(schema: ZodObject) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			const validatedData = await schema.parseAsync(req.body);
			req.body = validatedData;
			next();
		} catch (error) {
			if (error instanceof Error && "issues" in error) {
				// Zod validation error
				const zodError = error as {
					issues: Array<{ path: string[]; message: string }>;
				};
				const messages = zodError.issues.map(
					(issue) => `${issue.path.join(".")}: ${issue.message}`,
				);
				next(createError(400, `Validation failed: ${messages.join(", ")}`));
			} else {
				next(createError(400, "Invalid request body"));
			}
		}
	};
}

export function validateParams(schema: ZodObject) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			const validatedData = await schema.parseAsync(req.params);
			req.params = validatedData as Record<string, any>;
			next();
		} catch (error) {
			if (error instanceof Error && "issues" in error) {
				const zodError = error as {
					issues: Array<{ path: string[]; message: string }>;
				};
				const messages = zodError.issues.map(
					(issue) => `${issue.path.join(".")}: ${issue.message}`,
				);
				next(
					createError(400, `Invalid URL parameters: ${messages.join(", ")}`),
				);
			} else {
				next(createError(400, "Invalid URL parameters"));
			}
		}
	};
}

export function validateQuery(schema: ZodObject) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			const validatedData = await schema.parseAsync(req.query);
			// @ts-expect-error
			req.query = validatedData;
			next();
		} catch (error) {
			if (error instanceof Error && "issues" in error) {
				const zodError = error as {
					issues: Array<{ path: string[]; message: string }>;
				};
				const messages = zodError.issues.map(
					(issue) => `${issue.path.join(".")}: ${issue.message}`,
				);
				next(
					createError(400, `Invalid query parameters: ${messages.join(", ")}`),
				);
			} else {
				next(createError(400, "Invalid query parameters"));
			}
		}
	};
}

export function validateRequest(schemas: {
	body?: ZodObject;
	params?: ZodObject;
	query?: ZodObject;
}) {
	return async (req: Request, _res: Response, next: NextFunction) => {
		try {
			// Validate body if schema provided
			if (schemas.body) {
				const validatedBody = await schemas.body.parseAsync(req.body);
				req.body = validatedBody;
			}

			// Validate params if schema provided
			if (schemas.params) {
				const validatedParams = await schemas.params.parseAsync(req.params);
				req.params = validatedParams as Record<string, any>;
			}

			// Validate query if schema provided
			if (schemas.query) {
				const validatedQuery = await schemas.query.parseAsync(req.query);
				// @ts-expect-error
				req.query = validatedQuery;
			}

			next();
		} catch (error) {
			if (error instanceof Error && "issues" in error) {
				const zodError = error as {
					issues: Array<{ path: string[]; message: string }>;
				};
				const messages = zodError.issues.map(
					(issue) => `${issue.path.join(".")}: ${issue.message}`,
				);
				next(createError(400, `Validation failed: ${messages.join(", ")}`));
			} else {
				next(createError(400, "Validation failed"));
			}
		}
	};
}
