import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
	createDriverUser,
	createPassengerUser,
	createTrip,
} from "../helpers/fixtures.js";

// Mock convex realtime side-effects
vi.mock("@/services/convex-realtime.service.js", () => ({
	sendNotification: vi.fn(),
	sendBulkNotifications: vi.fn(),
	startLocationTracking: vi.fn(),
	stopLocationTracking: vi.fn(),
	createConversation: vi.fn(),
}));

// Import app after mocks
import { app } from "@/index.js";

describe("integration: trips", () => {
	it("creates a trip via POST /api/trips (happy path)", async () => {
		// create a driver user using fixtures to avoid unique constraint collisions
		const { driver } = await createDriverUser();

		// Set departure time to tomorrow at 8 AM (within commuting window 6-10)
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(8, 0, 0, 0);
		const departure = tomorrow.toISOString();

		const res = await request(app)
			.post("/api/trips")
			.send({
				driverId: driver.id,
				origin: "A",
				destination: "B",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				departureTime: departure,
				availableSeats: 3,
				pricePerSeat: 5,
			});

		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("id");
	});

	it("fails to create trip with departure time outside commuting windows", async () => {
		const { driver } = await createDriverUser();

		// Set departure time to tomorrow at 2 PM (outside commuting windows)
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(14, 0, 0, 0); // 2 PM
		const departure = tomorrow.toISOString();

		const res = await request(app)
			.post("/api/trips")
			.send({
				driverId: driver.id,
				origin: "A",
				destination: "B",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				departureTime: departure,
				availableSeats: 3,
				pricePerSeat: 5,
			});

		expect(res.status).toBe(400);
		expect(res.body.message).toContain("commuting windows");
	});

	it("fails to create trip with invalid route coordinates (single point)", async () => {
		const { driver } = await createDriverUser();

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(8, 0, 0, 0);
		const departure = tomorrow.toISOString();

		const res = await request(app)
			.post("/api/trips")
			.send({
				driverId: driver.id,
				origin: "A",
				destination: "B",
				routeCoordinates: [{ lat: 9.0, lng: 38.0 }], // Only one point
				departureTime: departure,
				availableSeats: 3,
				pricePerSeat: 5,
			});

		expect(res.status).toBe(400);
		expect(res.body.message).toContain(
			"Validation failed: routeCoordinates: Too small: expected array to have >=2 item",
		);
	});

	it("fails to create trip with price exceeding cap", async () => {
		const { driver } = await createDriverUser();

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(8, 0, 0, 0);
		const departure = tomorrow.toISOString();

		const res = await request(app)
			.post("/api/trips")
			.send({
				driverId: driver.id,
				origin: "A",
				destination: "B",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				departureTime: departure,
				availableSeats: 3,
				pricePerSeat: 100, // Assuming distance ~1km, max 4 ETB/km, so cap is 4, this exceeds
			});

		expect(res.status).toBe(400);
		expect(res.body.message).toContain("exceeds cap");
	});

	it("creates a booking via POST /api/trips/bookings", async () => {
		const { driver } = await createDriverUser();
		const { passenger } = await createPassengerUser();
		const trip = await createTrip(driver.id);

		const res = await request(app).post("/api/trips/bookings").send({
			tripId: trip.id,
			passengerId: passenger.id,
			seatsBooked: 1,
		});

		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("id");
		expect(res.body.data.totalPrice).toBe(5); // 1 seat * 5 ETB
		expect(res.body.data.status).toBe("pending"); // bookings start as pending
	});

	it("fails to book more seats than available", async () => {
		const { driver } = await createDriverUser();
		const { passenger } = await createPassengerUser();
		const trip = await createTrip(driver.id, { availableSeats: 2 });

		const res = await request(app).post("/api/trips/bookings").send({
			tripId: trip.id,
			passengerId: passenger.id,
			seatsBooked: 3, // More than available
		});

		expect(res.status).toBe(400);
		expect(res.body.message).toContain("Not enough seats");
	});

	it("updates trip status via PATCH /api/trips/:tripId/status", async () => {
		const { driver } = await createDriverUser();
		const trip = await createTrip(driver.id);

		const res = await request(app)
			.patch(`/api/trips/${trip.id}/status`)
			.send({ status: "inProgress" });

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("inProgress");
	});

	it("fails to update trip status to invalid transition", async () => {
		const { driver } = await createDriverUser();
		const trip = await createTrip(driver.id);

		const res = await request(app)
			.patch(`/api/trips/${trip.id}/status`)
			.send({ status: "completed" }); // Invalid from scheduled

		expect(res.status).toBe(400);
		expect(res.body.message).toContain("Invalid transition");
	});
});
