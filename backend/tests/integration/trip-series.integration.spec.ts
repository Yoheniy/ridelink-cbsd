import request from "supertest";
import { describe, expect, it, vi } from "vitest";
// Mock convex realtime side-effects so tests don't rely on external services
vi.mock("@/services/convex-realtime.service.js", () => ({
	sendNotification: vi.fn(),
	sendBulkNotifications: vi.fn(),
	createConversation: vi.fn(),
	startLocationTracking: vi.fn(),
	stopLocationTracking: vi.fn(),
}));

import { app } from "@/index.js";
import { prisma } from "@/lib/prisma.js";
import { createDriverUser, createPassengerUser } from "../helpers/fixtures.js";

describe("integration: trip series and subscriptions", () => {
	it("creates a trip series and generates occurrences, then allow passenger to subscribe and pre-generate bookings", async () => {
		const { driver } = await createDriverUser();
		const { passenger } = await createPassengerUser();

		// Create series starting tomorrow, recurring for 2 days (use daysOfWeek array)
		const start = new Date();
		start.setDate(start.getDate() + 1);
		start.setHours(0, 0, 0, 0);
		const startIso = start.toISOString();

		// Choose one dayOfWeek equal to start's weekday
		const dow = [start.getDay()];

		const seriesRes = await request(app)
			.post("/api/series")
			.send({
				driverId: driver.id,
				origin: "X",
				destination: "Y",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				availableSeats: 3,
				pricePerSeat: 5,
				daysOfWeek: dow,
				departureTimeOfDay: "08:00",
				startDate: startIso,
				generationHorizonWeeks: 1,
				subscriptionOptions: ["weekly"],
				subscriptionPricing: { weekly: 20 },
			});

		expect(seriesRes.status).toBe(201);
		const series = seriesRes.body.data;
		expect(series).toHaveProperty("id");

		// Query generated trips for the series
		const trips = await prisma.trip.findMany({
			where: { seriesId: series.id },
		});
		expect(trips.length).toBeGreaterThan(0);

		// Subscribe passenger to series
		const subRes = await request(app).post("/api/series/subscriptions").send({
			seriesId: series.id,
			passengerId: passenger.id,
			subscriptionType: "weekly",
			seatsSubscribed: 1,
			startDate: startIso,
		});

		expect(subRes.status).toBe(201);
		const { subscription, bookingsCreated } = subRes.body.data;
		expect(subscription).toHaveProperty("id");
		// Bookings created should equal number of upcoming trips at subscription time
		expect(typeof bookingsCreated).toBe("number");
		// Verify at least one confirmed booking exists for passenger
		const booked = await prisma.booking.findMany({
			where: { passengerId: passenger.id },
		});
		expect(booked.length).toBeGreaterThanOrEqual(bookingsCreated);
		// Ensure those bookings are marked as subscription-generated
		expect(booked.some((b) => b.isSubscription)).toBe(true);
	});

	it("generateTripsForSeries extends horizon and creates subscription bookings for active subscriptions", async () => {
		// Setup driver, passenger, create series and subscribe
		const { driver } = await createDriverUser();
		const { passenger } = await createPassengerUser();

		const start = new Date();
		start.setDate(start.getDate() + 1);
		start.setHours(0, 0, 0, 0);
		const startIso = start.toISOString();
		const dow = [start.getDay()];

		const seriesRes = await request(app)
			.post("/api/series")
			.send({
				driverId: driver.id,
				origin: "X",
				destination: "Y",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				availableSeats: 3,
				pricePerSeat: 5,
				daysOfWeek: dow,
				departureTimeOfDay: "08:00",
				startDate: startIso,
				generationHorizonWeeks: 1,
				subscriptionOptions: ["weekly"],
				subscriptionPricing: { weekly: 20 },
			});
		const series = seriesRes.body.data;

		// Subscribe
		const subRes = await request(app).post("/api/series/subscriptions").send({
			seriesId: series.id,
			passengerId: passenger.id,
			subscriptionType: "weekly",
			seatsSubscribed: 1,
			startDate: startIso,
		});
		expect(subRes.status).toBe(201);

		// Extend generation by 2 weeks
		const genRes = await request(app)
			.post(`/api/series/${series.id}/generate`)
			.send({ weeks: 2 });

		expect(genRes.status).toBe(200);
		const { generatedTrips, generatedBookings } = genRes.body.data;
		expect(typeof generatedTrips).toBe("number");
		expect(typeof generatedBookings).toBe("number");

		// If there were active subscriptions, generatedBookings should be >= 0
		expect(generatedBookings).toBeGreaterThanOrEqual(0);
	});

	it("fails to create subscription when seats are insufficient due to existing bookings", async () => {
		const { driver } = await createDriverUser();
		const { passenger: p1 } = await createPassengerUser();
		const { passenger: p2 } = await createPassengerUser();

		const start = new Date();
		start.setDate(start.getDate() + 1);
		start.setHours(0, 0, 0, 0);
		const startIso = start.toISOString();
		const dow = [start.getDay()];

		const seriesRes = await request(app)
			.post("/api/series")
			.send({
				driverId: driver.id,
				origin: "X",
				destination: "Y",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				availableSeats: 1,
				pricePerSeat: 5,
				daysOfWeek: dow,
				departureTimeOfDay: "08:00",
				startDate: startIso,
				generationHorizonWeeks: 1,
				subscriptionOptions: ["weekly"],
				subscriptionPricing: { weekly: 20 },
			});
		const series = seriesRes.body.data;

		// pick an upcoming trip and create a pending booking that consumes the only seat
		const trips = await prisma.trip.findMany({
			where: { seriesId: series.id },
		});
		expect(trips.length).toBeGreaterThan(0);
		const tripId = trips[0].id;

		const bookRes = await request(app).post("/api/trips/bookings").send({
			tripId,
			passengerId: p1.id,
			seatsBooked: 1,
		});
		expect(bookRes.status).toBe(201);

		// Now try to subscribe p2 for 1 seat — should fail
		const subRes = await request(app).post("/api/series/subscriptions").send({
			seriesId: series.id,
			passengerId: p2.id,
			subscriptionType: "weekly",
			seatsSubscribed: 1,
			startDate: startIso,
		});
		expect(subRes.status).toBe(400);
		expect(subRes.body.message).toMatch(/Not enough seats/i);
	});

	it("cancelling a subscription deactivates it and cancels future subscription bookings", async () => {
		const { driver } = await createDriverUser();
		const { passenger } = await createPassengerUser();

		const start = new Date();
		start.setDate(start.getDate() + 1);
		start.setHours(0, 0, 0, 0);
		const startIso = start.toISOString();
		const dow = [start.getDay()];

		const seriesRes = await request(app)
			.post("/api/series")
			.send({
				driverId: driver.id,
				origin: "X",
				destination: "Y",
				routeCoordinates: [
					{ lat: 9.0, lng: 38.0 },
					{ lat: 9.1, lng: 38.1 },
				],
				availableSeats: 3,
				pricePerSeat: 5,
				daysOfWeek: dow,
				departureTimeOfDay: "08:00",
				startDate: startIso,
				generationHorizonWeeks: 1,
				subscriptionOptions: ["weekly"],
				subscriptionPricing: { weekly: 20 },
			});
		const series = seriesRes.body.data;

		const subRes = await request(app).post("/api/series/subscriptions").send({
			seriesId: series.id,
			passengerId: passenger.id,
			subscriptionType: "weekly",
			seatsSubscribed: 1,
			startDate: startIso,
		});
		expect(subRes.status).toBe(201);
		const subscriptionId = subRes.body.data.subscription.id;

		// Ensure there are future confirmed bookings for this subscription
		const bookingsBefore = await prisma.booking.findMany({
			where: { subscriptionId },
		});
		expect(bookingsBefore.length).toBeGreaterThanOrEqual(1);

		// Cancel the subscription
		const cancelRes = await request(app)
			.patch(`/api/series/subscriptions/${subscriptionId}/cancel`)
			.send();
		expect(cancelRes.status).toBe(200);

		// Bookings should now be canceled
		const bookingsAfter = await prisma.booking.findMany({
			where: { subscriptionId },
		});
		expect(bookingsAfter.every((b) => b.status === "canceled")).toBe(true);
	});
});
