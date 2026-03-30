import { z } from "zod";

// Common parameter schemas
export const idParamSchema = z.object({
	id: z.string().min(1, "ID is required"),
});
