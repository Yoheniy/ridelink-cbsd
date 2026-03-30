import { prisma } from "@/lib/prisma.js";
import { calculateRouteDistance } from "@/services/trip.service.js";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

/**
 * Helper functions to seed common test fixtures.
 * These create data in the database for integration tests.
 */
const generateId = (prefix: string, index: number) => `${prefix}-${index}`;

export async function createUser(userData: {
	id: string;
	name: string;
	email: string;
	password: string;
	emailVerified?: boolean;
	role: "admin" | "passenger" | "driver";
	image?: string | null;
	banned?: boolean;
	nationalId: string;
	phone: string;
}) {
	const saltRounds = 10;
	const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

	// Create the user
	const user = await prisma.user.create({
		data: {
			id: userData.id,
			name: userData.name,
			email: userData.email,
			emailVerified: userData.emailVerified ?? true,
			role: userData.role,
			image: userData.image,
			banned: userData.banned ?? false,
			nationalId: userData.nationalId,
			phone: userData.phone,
		},
	});

	// Create the account record for credential-based auth
	// Better Auth uses this to store the hashed password
	await prisma.account.create({
		data: {
			id: generateId("account", Date.now()),
			accountId: userData.email,
			providerId: "credential",
			userId: user.id,
			password: hashedPassword,
		},
	});

	return user;
}

export async function createDriverUser(
	email?: string,
	phone?: string,
	nationalId?: string,
) {
	// Ensure uniqueness by embedding a short UUID fragment in generated values.
	// This avoids rare collisions when many tests create users in quick succession.
	const uid = faker.string.uuid();
	const useEmail = email ?? `${uid}@example.test`;
	const usePhone = phone ?? `+ph-${uid.slice(0, 8)}`;
	const useNationalId =
		nationalId ?? `NID-${faker.string.alphanumeric(8)}-${uid.slice(0, 6)}`;

	const user = await prisma.user.create({
		data: {
			id: `driver-${faker.string.uuid()}`,
			email: useEmail,
			name: faker.person.firstName(),
			status: "active",
			role: "driver",
			phone: usePhone,
			nationalId: useNationalId,
			driver: {
				create: {
					licenseNumber: `LN-${faker.string.alphanumeric(10)}-${uid.slice(0, 6)}`,
					vehicleModel: faker.vehicle.model(),
					vehiclePlate: `PL-${faker.string.alphanumeric(4).toUpperCase()}-${uid.slice(0, 4).toUpperCase()}`,
					vehicleSeats: 4,
				},
			},
		},
		include: {
			driver: true,
		},
	});
	return { user, driver: user.driver };
}

export async function createPassengerUser(
	email?: string,
	phone?: string,
	nationalId?: string,
) {
	const useEmail = email ?? faker.internet.email();
	const usePhone = phone ?? faker.phone.number();
	const useNationalId = nationalId ?? `NID-${faker.string.alphanumeric(8)}`;

	const user = await prisma.user.create({
		data: {
			id: `passenger-${faker.string.uuid()}`,
			email: useEmail,
			name: faker.person.firstName(),
			status: "active",
			role: "passenger",
			phone: usePhone,
			nationalId: useNationalId,
			passenger: {
				create: {
					prefferedRoutes: [],
				},
			},
		},
		include: {
			passenger: true,
		},
	});
	return { user, passenger: user.passenger };
}

export async function createTrip(driverId: string, overrides: any = {}) {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(8, 0, 0, 0);
	const departure = tomorrow.toISOString();

	const coords = overrides.routeCoordinates || [
		{ lat: 9.0, lng: 38.0 },
		{ lat: 9.1, lng: 38.1 },
	];
	const distanceKm = calculateRouteDistance(coords);

	return prisma.trip.create({
		data: {
			driverId,
			origin: "A",
			destination: "B",
			routeCoordinates: coords,
			distanceKm,
			departureTime: departure,
			availableSeats: 3,
			pricePerSeat: 5,
			...overrides,
		},
	});
}

export async function createBooking(
	tripId: string,
	passengerId: string,
	seats: number = 1,
	status: "pending" | "confirmed" = "pending",
) {
	return prisma.booking.create({
		data: {
			tripId,
			passengerId,
			seatsBooked: seats,
			totalPrice: 5 * seats, // Assuming price per seat is 5
			status,
		},
	});
}
