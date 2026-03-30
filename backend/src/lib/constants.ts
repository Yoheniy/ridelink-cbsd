import dotenv from "dotenv";

dotenv.config({
	path: ".env",
});

export const PORT = 5000;
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
export const CONVEX_URL = process.env.CONVEX_SITE_URL;
export const CONVEX_INTERNAL_API_KEY = process.env.CONVEX_INTERNAL_API_KEY;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DATABASE_URL = process.env.DATABASE_URL;
export const DEV_DATABASE = !DATABASE_URL?.includes("neon");
export const RESEND_API_KEY =
	process.env.RESEND_API_KEY ||
	(NODE_ENV === "development" ? "re_dummy_key_for_development" : undefined);

if (!RESEND_API_KEY) {
	throw new Error(
		"RESEND_API_KEY is not set. Please configure the RESEND_API_KEY environment variable.",
	);
}
