import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma.js";
import { createPassengerUser } from "../helpers/fixtures.js";

// Mock auth middleware - read test user id from header to avoid colliding fixed ids
vi.mock("@/middleware/auth.middleware.js", () => ({
	requireAuth: vi.fn((req, _res, next) => {
		const headerId = (req.headers["x-test-user-id"] as string) || undefined;
		req.user = {
			id:
				headerId ??
				`mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		};
		next();
	}),
	requirePermission: vi.fn(
		() => (_req: any, _res: any, next: () => any) => next(),
	), // Mock permission
}));

// Mock convex realtime side-effects (if needed for users)
vi.mock("@/services/convex-realtime.service.js", () => ({
	sendNotification: vi.fn(),
	sendBulkNotifications: vi.fn(),
	startLocationTracking: vi.fn(),
	stopLocationTracking: vi.fn(),
	createConversation: vi.fn(),
}));

// Import app after mocks
import { app } from "@/index.js";

describe("integration: users", () => {
	it("completes user profile via PATCH /api/users/complete-profile", async () => {
		const { user } = await createPassengerUser();

		const res = await request(app)
			.patch("/api/users/complete-profile")
			.set("x-test-user-id", user.id)
			.send({
				phone: "123456789",
				nationalId: "NID123456",
			});

		expect(res.status).toBe(200);
		expect(res.body.data.user).toHaveProperty("phone", "123456789");
	});

	it("becomes a driver via POST /api/users/become-driver", async () => {
		const { user } = await createPassengerUser();
		await prisma.user.update({ where: { id: user.id }, data: {} });

		const res = await request(app)
			.post("/api/users/become-driver")
			.set("x-test-user-id", user.id)
			.send({
				licenseNumber: "LN789",
				vehicleModel: "Honda",
				vehiclePlate: "PLATE789",
				vehicleSeats: 5,
			});

		expect(res.status).toBe(200);
		expect(res.body.data.driver).toHaveProperty("licenseNumber", "LN789");
	});

	it("fails to become driver if already a driver", async () => {
		const { user } = await createPassengerUser();
		// Make user a driver first (use the actual user id)
		await prisma.driver.create({
			data: {
				userId: user.id,
				licenseNumber: "EXISTING",
				vehicleModel: "Existing",
				vehiclePlate: "EXISTING",
				vehicleSeats: 4,
			},
		});

		const res = await request(app)
			.post("/api/users/become-driver")
			.set("x-test-user-id", user.id)
			.send({
				licenseNumber: "NEWLN",
				vehicleModel: "New",
				vehiclePlate: "NEW",
				vehicleSeats: 4,
			});

		expect(res.status).toBe(409); // Conflict
		expect(res.body.message).toContain("already a driver");
	});
});
