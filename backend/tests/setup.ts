import { prisma } from "@/lib/prisma";
import { afterAll, beforeAll, beforeEach } from "vitest";

// Use TEST_DATABASE_URL if provided
if (process.env.TEST_DATABASE_URL) {
	process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

export async function resetDatabase() {
	// Delete in order to avoid foreign key issues.
	// Order: child tables first, then parents. No CASCADE needed since we delete children first.
	await prisma.booking.deleteMany({});
	await prisma.tripSubscription.deleteMany({});
	await prisma.trip.deleteMany({});
	await prisma.driver.deleteMany({});
	await prisma.passenger.deleteMany({});
	await prisma.user.deleteMany({});
	// Admin tables
	await prisma.feedback.deleteMany({});
	await prisma.incidentLog.deleteMany({});
	await prisma.jwks.deleteMany({});
	await prisma.verification.deleteMany({});
	await prisma.account.deleteMany({});
	await prisma.session.deleteMany({});
}

beforeAll(async () => {
	// Ensure prisma client connected
	await prisma.$connect();
	await resetDatabase();
});

beforeEach(async () => {});

afterAll(async () => {
	await prisma.$disconnect();
});
