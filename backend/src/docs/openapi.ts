import { PORT } from "@/lib/constants";
import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
	extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const successEnvelope = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.literal(true),
		data: dataSchema,
		message: z.string().optional(),
	});

export const messageSuccessSchema = successEnvelope(
	z.object({
		message: z.string(),
	}),
).openapi("MessageSuccess");

export const errorSchema = z
	.object({
		success: z.literal(false),
		message: z.string(),
		data: z.null().optional(),
	})
	.openapi("Error");

registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description:
		"Use a Better Auth JWT access token. You can get one from GET /api/auth/token after sign in.",
});

export const defaultErrorResponses = {
	400: {
		description: "Validation error",
		content: {
			"application/json": {
				schema: errorSchema,
			},
		},
	},
	401: {
		description: "Unauthorized",
		content: {
			"application/json": {
				schema: errorSchema,
			},
		},
	},
	403: {
		description: "Forbidden",
		content: {
			"application/json": {
				schema: errorSchema,
			},
		},
	},
	404: {
		description: "Not found",
		content: {
			"application/json": {
				schema: errorSchema,
			},
		},
	},
	500: {
		description: "Internal server error",
		content: {
			"application/json": {
				schema: errorSchema,
			},
		},
	},
} as const;

export const createSuccessResponse = <T extends z.ZodTypeAny>(
	description: string,
	dataSchema: T,
) => ({
	description,
	content: {
		"application/json": {
			schema: successEnvelope(dataSchema),
		},
	},
});

export const authSecurity = [{ bearerAuth: [] as string[] }];

export function generateOpenApiDocument(): ReturnType<
	OpenApiGeneratorV3["generateDocument"]
> {
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.3",
		info: {
			title: "RideLink Backend API",
			version: "1.0.0",
			description:
				"API documentation generated from Zod schemas and route definitions.",
		},
		servers: [
			{
				url:
					process.env.NODE_ENV === "production"
						? "https://api.ridelink.com"
						: `http://localhost:${PORT}`,
				description:
					process.env.NODE_ENV === "production"
						? "Production"
						: "Local development",
			},
		],
	});
}
