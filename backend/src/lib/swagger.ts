import { generateOpenApiDocument } from "@/docs/openapi";
import { registerOpenApiDocs } from "@/docs/register-docs";
import swaggerUi from "swagger-ui-express";

registerOpenApiDocs();

export const specs: ReturnType<typeof generateOpenApiDocument> =
	generateOpenApiDocument();

export { swaggerUi };
