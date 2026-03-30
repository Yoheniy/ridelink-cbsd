import { getCommutingWindows, getMaxPricePerKm } from "@/types/index.js";
import {
	BadRequestError,
	ConflictError,
	NotFoundError,
} from "../errors/app-errors.js";
import { prisma } from "../lib/prisma.js";
import type {
	CreateBookingInput,
	CreateTripInput,
	QueryTripsInput,
	TripStatus,
	UpdateTripInput,
} from "../validations/schemas/trip.schema.js";
import {
	createConversation,
	sendBulkNotifications,
	sendNotification,
	startLocationTracking,
	stopLocationTracking,
} from "./convex-realtime.service.js";

const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
	scheduled: ["inProgress", "canceled"],
	inProgress: ["completed", "canceled"],
	completed: [],
	canceled: [],
};

const DRIVER_SELECT = {
	include: {
		user: {
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				rating: true,
				image: true,
			},
		},
	},
};

// Pure helpers (exported for testing)
export function validateStatusTransition(
	current: TripStatus,
	next: TripStatus,
): boolean {
	return TRIP_STATUS_TRANSITIONS[current].includes(next);
}

export function validateDepartureTime(time: Date): boolean {
	const hours = time.getHours();
	return getCommutingWindows().some((w) => hours >= w.start && hours < w.end);
}

export function calculateDistance(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateRouteDistance(
	coords: Array<{ lat: number; lng: number }>,
): number {
	if (coords.length < 2) return 0;
	let total = 0;
	for (let i = 0; i < coords.length - 1; i++) {
		total += calculateDistance(
			coords[i].lat,
			coords[i].lng,
			coords[i + 1].lat,
			coords[i + 1].lng,
		);
	}
	return Math.round(total * 100) / 100;
}

// TripService — handles one-time trips, bookings, booking lifecycle
export class TripService {
	// One-time trip CRUD
	async createTrip(data: CreateTripInput) {
		const driver = await prisma.driver.findUnique({
			where: { id: data.driverId },
		});
		if (!driver) throw new NotFoundError("Driver not found");

		if (data.availableSeats > driver.vehicleSeats) {
			throw new BadRequestError(
				`Available seats cannot exceed vehicle capacity (${driver.vehicleSeats})`,
			);
		}

		const departureTime = new Date(data.departureTime);
		if (departureTime <= new Date()) {
			throw new BadRequestError("Departure time must be in the future");
		}

		if (!validateDepartureTime(departureTime)) {
			throw new BadRequestError(
				`Departure time must be within commuting windows: ${getCommutingWindows()
					.map((w) => `${w.start}:00-${w.end}:00`)
					.join(", ")}`,
			);
		}

		const distanceKm = calculateRouteDistance(data.routeCoordinates);
		if (distanceKm === 0)
			throw new BadRequestError("Invalid route coordinates");

		const maxAllowedPrice = distanceKm * getMaxPricePerKm();
		if (data.pricePerSeat > maxAllowedPrice) {
			throw new BadRequestError(
				`Price (${data.pricePerSeat} ETB) exceeds cap of ${getMaxPricePerKm()} ETB/km. Max: ${maxAllowedPrice.toFixed(2)} ETB`,
			);
		}

		return prisma.trip.create({
			data: {
				driverId: data.driverId,
				origin: data.origin,
				destination: data.destination,
				routeCoordinates: data.routeCoordinates,
				distanceKm,
				departureTime,
				availableSeats: data.availableSeats,
				pricePerSeat: data.pricePerSeat,
				status: "scheduled",
			},
			include: { driver: DRIVER_SELECT },
		});
	}

	async updateTrip(tripId: string, data: UpdateTripInput) {
		const trip = await prisma.trip.findUnique({
			where: { id: tripId },
			include: { driver: true, bookings: { where: { status: "confirmed" } } },
		});

		if (!trip) throw new NotFoundError("Trip not found");
		if (trip.status !== "scheduled") {
			throw new BadRequestError(
				`Cannot update trip with status: ${trip.status}`,
			);
		}

		if (data.availableSeats !== undefined) {
			if (data.availableSeats > trip.driver.vehicleSeats) {
				throw new BadRequestError(
					`Available seats cannot exceed vehicle capacity (${trip.driver.vehicleSeats})`,
				);
			}
			const bookedSeats = trip.bookings.reduce(
				(sum, b) => sum + b.seatsBooked,
				0,
			);
			if (data.availableSeats < bookedSeats) {
				throw new BadRequestError(
					`Cannot reduce seats below booked count (${bookedSeats})`,
				);
			}
		}

		if (data.departureTime) {
			const time = new Date(data.departureTime);
			if (time <= new Date())
				throw new BadRequestError("Departure time must be in the future");
			if (!validateDepartureTime(time)) {
				throw new BadRequestError(
					`Departure time must be within commuting windows: ${getCommutingWindows()
						.map((w) => `${w.start}:00-${w.end}:00`)
						.join(", ")}`,
				);
			}
		}

		if (data.pricePerSeat !== undefined) {
			const distance = data.routeCoordinates
				? calculateRouteDistance(data.routeCoordinates)
				: trip.distanceKm;
			const maxPrice = distance * getMaxPricePerKm();
			if (data.pricePerSeat > maxPrice) {
				throw new BadRequestError(
					`Price exceeds cap. Max: ${maxPrice.toFixed(2)} ETB for ${distance} km`,
				);
			}
		}

		const updateData: Record<string, unknown> = {
			...(data.origin && { origin: data.origin }),
			...(data.destination && { destination: data.destination }),
			...(data.departureTime && {
				departureTime: new Date(data.departureTime),
			}),
			...(data.availableSeats !== undefined && {
				availableSeats: data.availableSeats,
			}),
			...(data.pricePerSeat !== undefined && {
				pricePerSeat: data.pricePerSeat,
			}),
		};

		if (data.routeCoordinates) {
			updateData.routeCoordinates = data.routeCoordinates;
			updateData.distanceKm = calculateRouteDistance(data.routeCoordinates);
		}

		return prisma.trip.update({
			where: { id: tripId },
			data: updateData,
			include: { driver: DRIVER_SELECT },
		});
	}

	async updateTripStatus(tripId: string, newStatus: TripStatus) {
		const trip = await prisma.trip.findUnique({
			where: { id: tripId },
			include: {
				driver: { include: { user: { select: { id: true } } } },
				bookings: {
					where: { status: "confirmed" },
					include: {
						passenger: {
							include: { user: { select: { id: true, name: true } } },
						},
					},
				},
			},
		});
		if (!trip) throw new NotFoundError("Trip not found");

		if (!validateStatusTransition(trip.status, newStatus)) {
			throw new BadRequestError(
				`Invalid transition from ${trip.status} to ${newStatus}. Allowed: ${TRIP_STATUS_TRANSITIONS[trip.status].join(", ") || "none"}`,
			);
		}

		const updatedTrip = await prisma.trip.update({
			where: { id: tripId },
			data: { status: newStatus },
			include: { driver: DRIVER_SELECT },
		});

		// Convex realtime triggers (fire-and-forget)
		const passengerUserIds = trip.bookings.map((b) => b.passenger.user.id);

		if (newStatus === "inProgress") {
			sendBulkNotifications(
				passengerUserIds.map((userId) => ({
					recipientId: userId,
					type: "trip_started" as const,
					title: "Trip Started",
					message: `Your trip from ${trip.origin} to ${trip.destination} has started.`,
					metadata: { tripId },
				})),
			);

			startLocationTracking({
				tripId,
				driverId: trip.driverId,
				latitude:
					(trip.routeCoordinates as Array<{ lat: number; lng: number }>)[0]
						?.lat ?? 0,
				longitude:
					(trip.routeCoordinates as Array<{ lat: number; lng: number }>)[0]
						?.lng ?? 0,
			});
		}

		if (newStatus === "completed") {
			// Bulk-complete all confirmed bookings for this trip
			await prisma.booking.updateMany({
				where: { tripId, status: "confirmed" },
				data: { status: "completed" },
			});

			sendBulkNotifications(
				passengerUserIds.map((userId) => ({
					recipientId: userId,
					type: "trip_completed" as const,
					title: "Trip Completed",
					message: `Your trip from ${trip.origin} to ${trip.destination} has been completed.`,
					metadata: { tripId },
				})),
			);

			stopLocationTracking(tripId);
		}

		if (newStatus === "canceled") {
			// Bulk-cancel all non-completed bookings for this trip
			await prisma.booking.updateMany({
				where: { tripId, status: { in: ["pending", "confirmed"] } },
				data: { status: "canceled" },
			});

			sendBulkNotifications(
				passengerUserIds.map((userId) => ({
					recipientId: userId,
					type: "trip_cancelled" as const,
					title: "Trip Cancelled",
					message: `Your trip from ${trip.origin} to ${trip.destination} has been cancelled.`,
					metadata: { tripId },
				})),
			);

			stopLocationTracking(tripId);
		}

		return updatedTrip;
	}

	async getTripById(tripId: string) {
		const trip = await prisma.trip.findUnique({
			where: { id: tripId },
			include: {
				driver: DRIVER_SELECT,
				series: {
					select: {
						id: true,
						daysOfWeek: true,
						departureTimeOfDay: true,
						isActive: true,
					},
				},
				bookings: {
					include: {
						passenger: {
							include: {
								user: {
									select: { id: true, name: true, rating: true, image: true },
								},
							},
						},
					},
				},
			},
		});

		if (!trip) throw new NotFoundError("Trip not found");
		return trip;
	}

	async queryTrips(query: QueryTripsInput) {
		const where: Record<string, unknown> = {};

		if (query.driverId) where.driverId = query.driverId;
		if (query.origin)
			where.origin = { contains: query.origin, mode: "insensitive" };
		if (query.destination)
			where.destination = { contains: query.destination, mode: "insensitive" };
		if (query.status) where.status = query.status;
		if (query.minSeats) where.availableSeats = { gte: query.minSeats };
		if (query.maxPrice) where.pricePerSeat = { lte: query.maxPrice };
		if (query.seriesId) where.seriesId = query.seriesId;

		if (query.departureTimeFrom || query.departureTimeTo) {
			const dt: Record<string, Date> = {};
			if (query.departureTimeFrom) dt.gte = new Date(query.departureTimeFrom);
			if (query.departureTimeTo) dt.lte = new Date(query.departureTimeTo);
			where.departureTime = dt;
		}

		const page = query.page || 1;
		const limit = query.limit || 10;
		const skip = (page - 1) * limit;

		const [trips, total] = await Promise.all([
			prisma.trip.findMany({
				where,
				include: {
					driver: DRIVER_SELECT,
					_count: { select: { bookings: { where: { status: "confirmed" } } } },
				},
				orderBy: { departureTime: "asc" },
				skip,
				take: limit,
			}),
			prisma.trip.count({ where }),
		]);

		return {
			trips,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async deleteTrip(tripId: string) {
		const trip = await prisma.trip.findUnique({
			where: { id: tripId },
			include: { _count: { select: { bookings: true } } },
		});

		if (!trip) throw new NotFoundError("Trip not found");
		if (trip.status !== "scheduled") {
			throw new BadRequestError(
				`Cannot delete trip with status: ${trip.status}`,
			);
		}
		if (trip._count.bookings > 0) {
			throw new BadRequestError(
				"Cannot delete trip with bookings. Cancel instead.",
			);
		}

		await prisma.trip.delete({ where: { id: tripId } });
		return { message: "Trip deleted successfully" };
	}

	async getDriverTrips(driverId: string, status?: TripStatus) {
		const where: Record<string, unknown> = { driverId };
		if (status) where.status = status;

		return prisma.trip.findMany({
			where,
			include: {
				_count: { select: { bookings: { where: { status: "confirmed" } } } },
			},
			orderBy: { departureTime: "asc" },
		});
	}

	// Booking CRUD + lifecycle

	/**
	 * Create a booking request (status = pending).
	 * The driver must accept or decline it.
	 */
	async createBooking(data: CreateBookingInput) {
		const trip = await prisma.trip.findUnique({
			where: { id: data.tripId },
			include: {
				driver: { include: { user: { select: { id: true } } } },
				bookings: { where: { status: { in: ["pending", "confirmed"] } } },
			},
		});

		if (!trip) throw new NotFoundError("Trip not found");
		if (trip.status !== "scheduled") {
			throw new BadRequestError(`Cannot book trip with status: ${trip.status}`);
		}

		// Prevent duplicate bookings (also enforced by DB unique constraint)
		const existing = trip.bookings.find(
			(b) => b.passengerId === data.passengerId,
		);
		if (existing) {
			throw new ConflictError("Passenger already has a booking on this trip");
		}

		// Check seat availability (count confirmed + pending to avoid over-booking)
		const reservedSeats = trip.bookings.reduce(
			(sum, b) => sum + b.seatsBooked,
			0,
		);
		const available = trip.availableSeats - reservedSeats;

		if (data.seatsBooked > available) {
			throw new BadRequestError(
				`Not enough seats. Requested: ${data.seatsBooked}, Available: ${available}`,
			);
		}

		const passenger = await prisma.passenger.findUnique({
			where: { id: data.passengerId },
			include: { user: { select: { id: true, name: true } } },
		});
		if (!passenger) throw new NotFoundError("Passenger not found");

		const booking = await prisma.booking.create({
			data: {
				tripId: data.tripId,
				passengerId: data.passengerId,
				seatsBooked: data.seatsBooked,
				totalPrice: trip.pricePerSeat * data.seatsBooked,
				pickUpPoint: data.pickUpPoint ?? null,
				dropOffPoint: data.dropOffPoint ?? null,
				status: "pending",
			},
			include: {
				trip: true,
				passenger: {
					include: {
						user: {
							select: { id: true, name: true, email: true, phone: true },
						},
					},
				},
			},
		});

		// Notify the driver about the new booking request
		const driverUserId = trip.driver.user.id;
		const passengerName = passenger.user.name || "A passenger";

		sendNotification({
			recipientId: driverUserId,
			type: "booking_request",
			title: "Booking Request",
			message: `${passengerName} requested ${data.seatsBooked} seat(s) on your trip from ${trip.origin} to ${trip.destination}.`,
			metadata: { tripId: data.tripId, bookingId: booking.id },
		});

		return booking;
	}

	/**
	 * Driver accepts a pending booking.
	 */
	async acceptBooking(bookingId: string) {
		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				trip: {
					include: { driver: { include: { user: { select: { id: true } } } } },
				},
				passenger: {
					include: { user: { select: { id: true, name: true } } },
				},
			},
		});

		if (!booking) throw new NotFoundError("Booking not found");
		if (booking.status !== "pending") {
			throw new BadRequestError(
				`Cannot accept booking with status: ${booking.status}`,
			);
		}

		const updatedBooking = await prisma.booking.update({
			where: { id: bookingId },
			data: { status: "confirmed" },
			include: {
				trip: true,
				passenger: {
					include: {
						user: {
							select: { id: true, name: true, email: true, phone: true },
						},
					},
				},
			},
		});

		// Notify the passenger
		const passengerUserId = booking.passenger.user.id;
		sendNotification({
			recipientId: passengerUserId,
			type: "booking_confirmed",
			title: "Booking Confirmed",
			message: `Your booking on the trip from ${booking.trip.origin} to ${booking.trip.destination} has been confirmed.`,
			metadata: { tripId: booking.tripId, bookingId: booking.id },
		});

		// Create a conversation between driver and passenger
		const driverUserId = booking.trip.driver.user.id;
		createConversation({
			tripId: booking.tripId,
			bookingId: booking.id,
			participants: [driverUserId, passengerUserId],
		});

		return updatedBooking;
	}

	/**
	 * Driver declines a pending booking — frees up the reserved seats.
	 */
	async declineBooking(bookingId: string) {
		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				trip: true,
				passenger: {
					include: { user: { select: { id: true, name: true } } },
				},
			},
		});

		if (!booking) throw new NotFoundError("Booking not found");
		if (booking.status !== "pending") {
			throw new BadRequestError(
				`Cannot decline booking with status: ${booking.status}`,
			);
		}

		const updatedBooking = await prisma.booking.update({
			where: { id: bookingId },
			data: { status: "canceled" },
			include: {
				trip: true,
				passenger: {
					include: {
						user: {
							select: { id: true, name: true, email: true, phone: true },
						},
					},
				},
			},
		});

		// Notify the passenger
		sendNotification({
			recipientId: booking.passenger.user.id,
			type: "booking_declined",
			title: "Booking Declined",
			message: `Your booking request for the trip from ${booking.trip.origin} to ${booking.trip.destination} was declined.`,
			metadata: { tripId: booking.tripId, bookingId: booking.id },
		});

		return updatedBooking;
	}

	/**
	 * Passenger cancels their own booking (pending or confirmed).
	 */
	async cancelBooking(bookingId: string) {
		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				trip: {
					include: { driver: { include: { user: { select: { id: true } } } } },
				},
				passenger: {
					include: { user: { select: { id: true, name: true } } },
				},
			},
		});

		if (!booking) throw new NotFoundError("Booking not found");
		if (booking.status === "canceled" || booking.status === "completed") {
			throw new BadRequestError(
				`Cannot cancel booking with status: ${booking.status}`,
			);
		}

		const updatedBooking = await prisma.booking.update({
			where: { id: bookingId },
			data: { status: "canceled" },
			include: {
				trip: true,
				passenger: {
					include: {
						user: {
							select: { id: true, name: true, email: true, phone: true },
						},
					},
				},
			},
		});

		// Notify the driver
		const passengerName = booking.passenger.user.name || "A passenger";
		sendNotification({
			recipientId: booking.trip.driver.user.id,
			type: "booking_cancelled",
			title: "Booking Cancelled",
			message: `${passengerName} cancelled their booking on your trip from ${booking.trip.origin} to ${booking.trip.destination}.`,
			metadata: { tripId: booking.tripId, bookingId: booking.id },
		});

		return updatedBooking;
	}

	/**
	 * Get a single booking by ID.
	 */
	async getBookingById(bookingId: string) {
		const booking = await prisma.booking.findUnique({
			where: { id: bookingId },
			include: {
				trip: { include: { driver: DRIVER_SELECT } },
				passenger: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								rating: true,
								image: true,
								phone: true,
							},
						},
					},
				},
				subscription: true,
			},
		});
		if (!booking) throw new NotFoundError("Booking not found");
		return booking;
	}

	/**
	 * Get bookings for a specific trip (for drivers to review).
	 */
	async getTripBookings(tripId: string, status?: string) {
		const trip = await prisma.trip.findUnique({ where: { id: tripId } });
		if (!trip) throw new NotFoundError("Trip not found");

		const where: Record<string, unknown> = { tripId };
		if (status) where.status = status;

		return prisma.booking.findMany({
			where,
			include: {
				passenger: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								rating: true,
								image: true,
								phone: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	async getPassengerBookings(passengerId: string) {
		return prisma.booking.findMany({
			where: { passengerId },
			include: {
				trip: {
					include: {
						driver: {
							include: {
								user: {
									select: {
										id: true,
										name: true,
										rating: true,
										image: true,
										phone: true,
									},
								},
							},
						},
					},
				},
				subscription: true,
			},
			orderBy: { createdAt: "desc" },
		});
	}
}

export const tripService = new TripService();
