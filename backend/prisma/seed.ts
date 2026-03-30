import bcrypt from "bcrypt";
import prisma from "../src/lib/prisma";
import { UserRole } from "./generated/enums";

// Helper to generate CUID-like IDs (for deterministic seeding)
const generateId = (prefix: string, index: number) => `${prefix}-${index}`;

// Function to create a user compatible with Better Auth
// Creates both User and Account records with properly hashed password
async function createUser(userData: {
	id: string;
	name: string;
	email: string;
	password: string;
	emailVerified?: boolean;
	role: UserRole;
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

	console.log(`Created user: ${user.email} with Better Auth account`);
	return user;
}

async function main() {
	console.log("Start seeding...");

	// Create Admin User
	await createUser({
		id: crypto.randomUUID(),
		name: "Admin User",
		email: "admin@ridelink.com",
		password: "Admin123!",
		emailVerified: true,
		role: "admin",
		nationalId: "ET000000001",
		phone: "+251911000001",
	});

	// Create Driver Users
	const driverUser1 = await createUser({
		id: crypto.randomUUID(),
		name: "John Driver",
		email: "driver@ridelink.com",
		password: "Driver123!",
		emailVerified: true,
		role: "driver",
		nationalId: "ET000000002",
		phone: "+251911000002",
	});

	const driverUser2 = await createUser({
		id: crypto.randomUUID(),
		name: "Sarah Driver",
		email: "sarah@ridelink.com",
		password: "Driver123!",
		emailVerified: true,
		role: "driver",
		nationalId: "ET000000005",
		phone: "+251911000005",
	});

	// Create Passenger Users
	const passengerUser1 = await createUser({
		id: crypto.randomUUID(),
		name: "Jane Passenger",
		email: "passenger@ridelink.com",
		password: "Passenger123!",
		emailVerified: true,
		role: "passenger",
		nationalId: "ET000000003",
		phone: "+251911000003",
	});

	const passengerUser2 = await createUser({
		id: crypto.randomUUID(),
		name: "Bob Passenger",
		email: "bob@ridelink.com",
		password: "Bob123!",
		emailVerified: true,
		role: "passenger",
		nationalId: "ET000000004",
		phone: "+251911000004",
	});

	// Create Driver Profiles
	console.log("Creating driver profiles...");
	const driver1 = await prisma.driver.create({
		data: {
			userId: driverUser1.id,
			licenseNumber: "DL-ET-2020-001234",
			vehicleModel: "Toyota Camry",
			vehiclePlate: "AA-12345",
			vehicleSeats: 4,
		},
	});
	console.log(`Created driver profile: ${driver1.id}`);

	const driver2 = await prisma.driver.create({
		data: {
			userId: driverUser2.id,
			licenseNumber: "DL-ET-2021-005678",
			vehicleModel: "Honda Accord",
			vehiclePlate: "BB-67890",
			vehicleSeats: 4,
		},
	});
	console.log(`Created driver profile: ${driver2.id}`);

	// Create Passenger Profiles
	console.log("Creating passenger profiles...");
	const passenger1 = await prisma.passenger.create({
		data: {
			userId: passengerUser1.id,
			prefferedRoutes: ["Downtown to Airport", "City Center to Business Park"],
		},
	});
	console.log(`Created passenger profile: ${passenger1.id}`);

	const passenger2 = await prisma.passenger.create({
		data: {
			userId: passengerUser2.id,
			prefferedRoutes: ["Residential Area to Downtown", "Home to Office"],
		},
	});
	console.log(`Created passenger profile: ${passenger2.id}`);

	// Create Trips
	console.log("Creating sample trips...");

	// Get tomorrow's date at 8 AM
	const tomorrow8AM = new Date();
	tomorrow8AM.setDate(tomorrow8AM.getDate() + 1);
	tomorrow8AM.setHours(8, 0, 0, 0);

	// Get tomorrow's date at 6 PM
	const tomorrow6PM = new Date();
	tomorrow6PM.setDate(tomorrow6PM.getDate() + 1);
	tomorrow6PM.setHours(18, 0, 0, 0);

	// Get day after tomorrow at 7 AM
	const dayAfter7AM = new Date();
	dayAfter7AM.setDate(dayAfter7AM.getDate() + 2);
	dayAfter7AM.setHours(7, 0, 0, 0);

	// Trip 1: Downtown to Airport (Morning, one-time) - ~10km
	const trip1 = await prisma.trip.create({
		data: {
			driverId: driver1.id,
			origin: "Downtown Tech Hub",
			destination: "Addis Ababa Bole International Airport",
			routeCoordinates: [
				{ lat: 9.0320, lng: 38.7469 },
				{ lat: 9.0200, lng: 38.7500 },
				{ lat: 8.9779, lng: 38.7993 },
			],
			distanceKm: 10.5,
			departureTime: tomorrow8AM,
			availableSeats: 3,
			pricePerSeat: 35.0,
			status: "scheduled",
		},
	});
	console.log(`Created one-time trip: ${trip1.id}`);

	// Trip 2: Another one-time trip
	const trip2 = await prisma.trip.create({
		data: {
			driverId: driver2.id,
			origin: "Bole Residential Area",
			destination: "Meskel Square",
			routeCoordinates: [
				{ lat: 8.9950, lng: 38.7920 },
				{ lat: 9.0100, lng: 38.7650 },
				{ lat: 9.0180, lng: 38.7500 },
			],
			distanceKm: 6.0,
			departureTime: dayAfter7AM,
			availableSeats: 3,
			pricePerSeat: 20.0,
			status: "scheduled",
		},
	});
	console.log(`Created one-time trip: ${trip2.id}`);

	// Create a TripSeries (recurring trip with subscriptions)
	console.log("Creating sample trip series...");

	const startDate = new Date();
	startDate.setDate(startDate.getDate() + 1);
	startDate.setHours(0, 0, 0, 0);

	const endDate = new Date(startDate);
	endDate.setDate(endDate.getDate() + 28); // 4 weeks

	const series1 = await prisma.tripSeries.create({
		data: {
			driverId: driver1.id,
			origin: "City Center Plaza",
			destination: "Silicon Valley Business Park",
			routeCoordinates: [
				{ lat: 9.0300, lng: 38.7600 },
				{ lat: 9.0400, lng: 38.7700 },
				{ lat: 9.0500, lng: 38.7800 },
			],
			distanceKm: 8.0,
			availableSeats: 4,
			pricePerSeat: 30.0,
			daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
			departureTimeOfDay: "08:00",
			startDate,
			endDate,
			subscriptionOptions: ["weekly", "monthly"],
			subscriptionPricing: { weekly: 600.0, monthly: 2200.0 },
			isActive: true,
			generatedUntil: endDate,
		},
	});
	console.log(`Created trip series: ${series1.id}`);

	// Generate a few trip occurrences for the series
	const occurrenceDates: Date[] = [];
	const cursor = new Date(startDate);
	while (cursor <= endDate) {
		const day = cursor.getDay();
		if (day >= 1 && day <= 5) { // Mon-Fri
			const departure = new Date(cursor);
			departure.setHours(8, 0, 0, 0);
			if (departure > new Date()) {
				occurrenceDates.push(new Date(departure));
			}
		}
		cursor.setDate(cursor.getDate() + 1);
	}

	if (occurrenceDates.length > 0) {
		await prisma.trip.createMany({
			data: occurrenceDates.map((departureTime) => ({
				driverId: driver1.id,
				origin: "City Center Plaza",
				destination: "Silicon Valley Business Park",
				routeCoordinates: [
					{ lat: 9.0300, lng: 38.7600 },
					{ lat: 9.0400, lng: 38.7700 },
					{ lat: 9.0500, lng: 38.7800 },
				],
				distanceKm: 8.0,
				departureTime,
				availableSeats: 4,
				pricePerSeat: 30.0,
				seriesId: series1.id,
				status: "scheduled" as const,
			})),
		});
		console.log(`Generated ${occurrenceDates.length} trip occurrences for series`);
	}

	// Create Bookings (pending — waiting for driver to accept)
	console.log("Creating sample bookings...");

	const booking1 = await prisma.booking.create({
		data: {
			tripId: trip1.id,
			passengerId: passenger1.id,
			seatsBooked: 1,
			totalPrice: 35.0,
			status: "pending",
		},
	});
	console.log(`Created pending booking: ${booking1.id}`);

	const booking2 = await prisma.booking.create({
		data: {
			tripId: trip2.id,
			passengerId: passenger2.id,
			seatsBooked: 2,
			totalPrice: 40.0,
			status: "confirmed",
		},
	});
	console.log(`Created confirmed booking: ${booking2.id}`);

	// Create a subscription on the series
	console.log("Creating sample subscriptions...");

	const subscription1 = await prisma.tripSubscription.create({
		data: {
			seriesId: series1.id,
			passengerId: passenger1.id,
			subscriptionType: "monthly",
			seatsSubscribed: 1,
			pricePerPeriod: 2200.0,
			startDate: new Date(),
			isActive: true,
		},
	});
	console.log(`Created subscription: ${subscription1.id}`);

	// Create subscription bookings for the first few series trips
	const seriesTrips = await prisma.trip.findMany({
		where: { seriesId: series1.id, status: "scheduled" },
		orderBy: { departureTime: "asc" },
		take: 5,
	});

	if (seriesTrips.length > 0) {
		await prisma.booking.createMany({
			data: seriesTrips.map((trip) => ({
				tripId: trip.id,
				passengerId: passenger1.id,
				seatsBooked: 1,
				totalPrice: trip.pricePerSeat,
				status: "confirmed" as const,
				isSubscription: true,
				subscriptionId: subscription1.id,
			})),
		});
		console.log(`Created ${seriesTrips.length} subscription bookings`);
	}

	console.log("\nSeeding finished successfully!");
	console.log("\nSummary:");
	console.log("- 5 users created (1 admin, 2 drivers, 2 passengers)");
	console.log("- 2 driver profiles created");
	console.log("- 2 passenger profiles created");
	console.log("- 2 one-time trips created");
	console.log(`- 1 trip series created with ${occurrenceDates.length} occurrences`);
	console.log("- 2 one-off bookings created (1 pending, 1 confirmed)");
	console.log(`- 1 subscription created with ${seriesTrips.length} pre-generated bookings`);
	console.log("\nTest Credentials:");
	console.log("Admin: admin@ridelink.com / Admin123!");
	console.log("Driver 1: driver@ridelink.com / Driver123!");
	console.log("Driver 2: sarah@ridelink.com / Driver123!");
	console.log("Passenger 1: passenger@ridelink.com / Passenger123!");
	console.log("Passenger 2: bob@ridelink.com / Bob123!");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
