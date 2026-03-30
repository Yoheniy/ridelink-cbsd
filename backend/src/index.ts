import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { Express } from "express";
import morgan from "morgan";
import { auth } from "./lib/auth";
import { FRONTEND_URL, NODE_ENV, PORT } from "./lib/constants";
import { specs, swaggerUi } from "./lib/swagger";
import { errorHandler } from "./middleware/error.middleware";
import adminRoutes from "./routes/admin.routes";
import feedbackRoutes from "./routes/feedback.routes";
import seriesRoutes from "./routes/trip-series.routes";
import tripRoutes from "./routes/trip.routes";
import userRoutes from "./routes/user.routes";

export const app: Express = express();

app.use(morgan("dev", { skip: () => process.env.NODE_ENV === "test" }));
app.use(
	cors({
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps, curl, Postman)
			if (!origin) {
				return callback(null, true);
			}
			// Allow the configured CORS origin
			if (origin === FRONTEND_URL) {
				return callback(null, true);
			}
			// In development, allow all origins for easier testing
			if (NODE_ENV === "development") {
				return callback(null, true);
			}
			// Otherwise reject
			callback(new Error("Not allowed by CORS"));
		},
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Accept", "Authorization"],
		credentials: true,
	}),
);

app.all("/api/auth{/*path}", toNodeHandler(auth));

app.use(express.json());

// Swagger UI
app.get("/api-docs.json", (_req, res) => {
	res.json(specs);
});
app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(specs, {
		swaggerOptions: {
			persistAuthorization: true,
			displayRequestDuration: true,
		},
	}),
);

// API Routes here
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/series", seriesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);

// Error handler middleware (must be last)
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
	app.listen(PORT, () => {
		console.log(`Server started on port ${PORT}`);
	});
}
