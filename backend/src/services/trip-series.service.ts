import { getCommutingWindows, getMaxPricePerKm } from "@/types/index.js";
import {
	eachDayOfInterval,
	endOfDay,
	isAfter,
	set,
	startOfDay,
} from "date-fns";
import {
	BadRequestError,
	ConflictError,
	NotFoundError,
} from "../errors/app-errors.js";
import { prisma } from "../lib/prisma.js";
import type {
	CreateTripSeriesInput,
	CreateTripSubscriptionInput,
	QuerySeriesInput,
	UpdateTripSeriesInput,
} from "../validations/schemas/trip.schema.js";
import { sendNotification } from "./convex-realtime.service.js";
import { calculateRouteDistance } from "./trip.service.js";

/**
 * Generate concrete departure DateTimes from a series definition.
 * Returns dates between `from` and `until` that fall on the
 * specified daysOfWeek, skipping exception dates.
 */
export function generateOccurrenceDates(
	daysOfWeek: number[],
	timeOfDay: string, // "HH:mm"
	from: Date,
	until: Date,
	exceptions: string[] = [],
): Date[] {
	if (!daysOfWeek || daysOfWeek.length === 0) return [];

	const [hours, minutes] = timeOfDay.split(":").map(Number);
	const exceptionSet = new Set(
		exceptions.map((d) => new Date(d).toISOString().split("T")[0]),
	);

	// Normalize interval to whole days
	const start = startOfDay(from);
	const end = endOfDay(until);

	let days = eachDayOfInterval({ start, end }) || [];

	const results = days
		.filter((date) => daysOfWeek.includes(date.getDay()))
		.map((date) => set(date, { hours, minutes, seconds: 0, milliseconds: 0 }))
		.filter((departure) => {
			const dateKey = departure.toISOString().split("T")[0];
			if (exceptionSet.has(dateKey)) return false;
			// Only include future departures
			if (!isAfter(departure, new Date())) return false;
			return true;
		});

	// results are naturally ordered by eachDayOfInterval; dedupe just in case
	const unique: Date[] = [];
	const seen = new Set<string>();
	for (const d of results) {
		const key = d.toISOString();
		if (!seen.has(key)) {
			seen.add(key);
			unique.push(d);
		}
	}

	return unique;
}

// SeriesService
export class SeriesService {
	async createTripSeries(data: CreateTripSeriesInput) {
		const driver = await prisma.driver.findUnique({
			where: { id: data.driverId },
		});
		if (!driver) throw new NotFoundError("Driver not found");

		if (data.availableSeats > driver.vehicleSeats) {
			throw new BadRequestError(
				`Available seats cannot exceed vehicle capacity (${driver.vehicleSeats})`,
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

		// Validate departure time is within commuting windows
		const [hours] = data.departureTimeOfDay.split(":").map(Number);
		const inWindow = getCommutingWindows().some(
			(w) => hours >= w.start && hours < w.end,
		);
		if (!inWindow) {
			throw new BadRequestError(
				`Departure time must be within commuting windows: ${getCommutingWindows()
					.map((w) => `${w.start}:00-${w.end}:00`)
					.join(", ")}`,
			);
		}

		// Validate subscription pricing matches options
		for (const option of data.subscriptionOptions) {
			if (!data.subscriptionPricing[option]) {
				throw new BadRequestError(`Missing pricing for ${option} subscription`);
			}
		}

		const startDate = new Date(data.startDate);
		const horizonWeeks = data.generationHorizonWeeks ?? 4;

		// Calculate generation horizon
		const generatedUntil = new Date(startDate);
		generatedUntil.setDate(generatedUntil.getDate() + horizonWeeks * 7);

		// Cap at endDate if provided
		const endDate = data.endDate ? new Date(data.endDate) : null;
		const effectiveUntil =
			endDate && endDate < generatedUntil ? endDate : generatedUntil;

		// Generate occurrence dates
		const occurrenceDates = generateOccurrenceDates(
			data.daysOfWeek,
			data.departureTimeOfDay,
			startDate,
			effectiveUntil,
		);

		// Create series + trip occurrences in a single transaction
		const series = await prisma.$transaction(async (tx) => {
			const newSeries = await tx.tripSeries.create({
				data: {
					driverId: data.driverId,
					origin: data.origin,
					destination: data.destination,
					routeCoordinates: data.routeCoordinates,
					distanceKm,
					availableSeats: data.availableSeats,
					pricePerSeat: data.pricePerSeat,
					daysOfWeek: data.daysOfWeek,
					departureTimeOfDay: data.departureTimeOfDay,
					startDate,
					endDate,
					subscriptionOptions: data.subscriptionOptions,
					subscriptionPricing: data.subscriptionPricing,
					generatedUntil: effectiveUntil,
					isActive: true,
				},
			});

			// Bulk-create trip occurrences
			if (occurrenceDates.length > 0) {
				await tx.trip.createMany({
					data: occurrenceDates.map((departureTime) => ({
						driverId: data.driverId,
						origin: data.origin,
						destination: data.destination,
						routeCoordinates: data.routeCoordinates,
						distanceKm,
						departureTime,
						availableSeats: data.availableSeats,
						pricePerSeat: data.pricePerSeat,
						seriesId: newSeries.id,
						status: "scheduled" as const,
					})),
				});
			}

			return newSeries;
		});

		// Return the series with generated trips count
		const tripsCount = await prisma.trip.count({
			where: { seriesId: series.id },
		});

		return { ...series, generatedTripsCount: tripsCount };
	}

	async getTripSeriesById(seriesId: string) {
		const series = await prisma.tripSeries.findUnique({
			where: { id: seriesId },
			include: {
				driver: {
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
				},
				trips: {
					where: { status: "scheduled" },
					orderBy: { departureTime: "asc" },
					take: 20,
					include: {
						_count: {
							select: {
								bookings: {
									where: { status: { in: ["pending", "confirmed"] } },
								},
							},
						},
					},
				},
				tripSubscriptions: {
					where: { isActive: true },
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
				_count: {
					select: {
						trips: true,
						tripSubscriptions: { where: { isActive: true } },
					},
				},
			},
		});

		if (!series) throw new NotFoundError("Trip series not found");
		return series;
	}

	async querySeries(query: QuerySeriesInput) {
		const where: Record<string, unknown> = {};

		if (query.driverId) where.driverId = query.driverId;
		if (query.origin)
			where.origin = { contains: query.origin, mode: "insensitive" };
		if (query.destination)
			where.destination = { contains: query.destination, mode: "insensitive" };
		if (query.isActive !== undefined) where.isActive = query.isActive;

		const page = query.page || 1;
		const limit = query.limit || 10;
		const skip = (page - 1) * limit;

		const [seriesList, total] = await Promise.all([
			prisma.tripSeries.findMany({
				where,
				include: {
					driver: {
						include: {
							user: {
								select: { id: true, name: true, rating: true, image: true },
							},
						},
					},
					_count: {
						select: {
							trips: { where: { status: "scheduled" } },
							tripSubscriptions: { where: { isActive: true } },
						},
					},
				},
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			prisma.tripSeries.count({ where }),
		]);

		return {
			series: seriesList,
			pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
		};
	}

	async updateTripSeries(seriesId: string, data: UpdateTripSeriesInput) {
		const series = await prisma.tripSeries.findUnique({
			where: { id: seriesId },
			include: { driver: true },
		});
		if (!series) throw new NotFoundError("Trip series not found");
		if (!series.isActive && data.isActive !== true) {
			throw new BadRequestError("Cannot update an inactive series");
		}

		if (
			data.availableSeats !== undefined &&
			data.availableSeats > series.driver.vehicleSeats
		) {
			throw new BadRequestError(
				`Available seats cannot exceed vehicle capacity (${series.driver.vehicleSeats})`,
			);
		}

		if (data.pricePerSeat !== undefined) {
			const distance = data.routeCoordinates
				? calculateRouteDistance(data.routeCoordinates)
				: series.distanceKm;
			const maxPrice = distance * getMaxPricePerKm();
			if (data.pricePerSeat > maxPrice) {
				throw new BadRequestError(
					`Price exceeds cap. Max: ${maxPrice.toFixed(2)} ETB for ${distance} km`,
				);
			}
		}

		const updateData: Record<string, unknown> = {};
		if (data.origin !== undefined) updateData.origin = data.origin;
		if (data.destination !== undefined)
			updateData.destination = data.destination;
		if (data.availableSeats !== undefined)
			updateData.availableSeats = data.availableSeats;
		if (data.pricePerSeat !== undefined)
			updateData.pricePerSeat = data.pricePerSeat;
		if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;
		if (data.departureTimeOfDay !== undefined)
			updateData.departureTimeOfDay = data.departureTimeOfDay;
		if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
		if (data.isActive !== undefined) updateData.isActive = data.isActive;
		if (data.subscriptionOptions !== undefined)
			updateData.subscriptionOptions = data.subscriptionOptions;
		if (data.subscriptionPricing !== undefined)
			updateData.subscriptionPricing = data.subscriptionPricing;
		if (data.routeCoordinates) {
			updateData.routeCoordinates = data.routeCoordinates;
			updateData.distanceKm = calculateRouteDistance(data.routeCoordinates);
		}

		return prisma.tripSeries.update({
			where: { id: seriesId },
			data: updateData,
			include: {
				driver: {
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
				},
			},
		});
	}

	async deactivateSeries(seriesId: string) {
		const series = await prisma.tripSeries.findUnique({
			where: { id: seriesId },
		});
		if (!series) throw new NotFoundError("Trip series not found");
		if (!series.isActive) {
			throw new BadRequestError("Series is already inactive");
		}

		// Deactivate the series and cancel all future scheduled trips in a transaction
		return prisma.$transaction(async (tx) => {
			const updatedSeries = await tx.tripSeries.update({
				where: { id: seriesId },
				data: { isActive: false },
			});

			// Cancel all future scheduled trips in this series
			const futureTrips = await tx.trip.findMany({
				where: {
					seriesId,
					status: "scheduled",
					departureTime: { gt: new Date() },
				},
				select: { id: true },
			});

			if (futureTrips.length > 0) {
				const tripIds = futureTrips.map((t) => t.id);

				await tx.trip.updateMany({
					where: { id: { in: tripIds } },
					data: { status: "canceled" },
				});

				// Cancel all pending/confirmed bookings on those trips
				await tx.booking.updateMany({
					where: {
						tripId: { in: tripIds },
						status: { in: ["pending", "confirmed"] },
					},
					data: { status: "canceled" },
				});
			}

			// TODO: Add notifications to be sent here in case of subscribers and also refunding should be done here

			// Deactivate all subscriptions on this series
			await tx.tripSubscription.updateMany({
				where: { seriesId, isActive: true },
				data: { isActive: false, endDate: new Date() },
			});

			return {
				...updatedSeries,
				canceledTrips: futureTrips.length,
			};
		});
	}

	// Trip occurrence generation

	/**
	 * Extend the generation horizon for a series by N weeks.
	 * Also creates subscription bookings for any active subscriptions.
	 */
	async generateTripsForSeries(seriesId: string, weeks: number = 4) {
		const series = await prisma.tripSeries.findUnique({
			where: { id: seriesId },
			include: {
				tripSubscriptions: {
					where: { isActive: true },
					include: {
						passenger: {
							include: { user: { select: { id: true, name: true } } },
						},
					},
				},
			},
		});
		if (!series) throw new NotFoundError("Trip series not found");
		if (!series.isActive) {
			throw new BadRequestError("Cannot generate trips for inactive series");
		}

		// Calculate the new horizon
		const from = series.generatedUntil
			? new Date(series.generatedUntil)
			: new Date();
		const until = new Date(from);
		until.setDate(until.getDate() + weeks * 7);

		// Cap at endDate
		const effectiveUntil =
			series.endDate && series.endDate < until ? series.endDate : until;

		const exceptions = (series.exceptions as string[] | null) ?? [];
		const occurrenceDates = generateOccurrenceDates(
			series.daysOfWeek,
			series.departureTimeOfDay,
			from,
			effectiveUntil,
			exceptions,
		);

		if (occurrenceDates.length === 0) {
			return { generatedTrips: 0, generatedBookings: 0 };
		}

		const result = await prisma.$transaction(async (tx) => {
			// Create trip occurrences
			await tx.trip.createMany({
				data: occurrenceDates.map((departureTime) => ({
					driverId: series.driverId,
					origin: series.origin,
					destination: series.destination,
					routeCoordinates: series.routeCoordinates!,
					distanceKm: series.distanceKm,
					departureTime,
					availableSeats: series.availableSeats,
					pricePerSeat: series.pricePerSeat,
					seriesId: series.id,
					status: "scheduled" as const,
				})),
			});

			// Fetch the newly created trips to get their IDs
			const newTrips = await tx.trip.findMany({
				where: {
					seriesId: series.id,
					departureTime: { in: occurrenceDates },
				},
				select: { id: true, departureTime: true },
			});

			// Create subscription bookings for active subscriptions
			let bookingsCreated = 0;
			if (series.tripSubscriptions.length > 0) {
				const bookingData: Array<{
					tripId: string;
					passengerId: string;
					seatsBooked: number;
					totalPrice: number;
					status: "confirmed";
					isSubscription: true;
					subscriptionId: string;
				}> = [];

				for (const sub of series.tripSubscriptions) {
					// Skip if subscription has ended
					if (sub.endDate && sub.endDate < new Date()) continue;

					for (const trip of newTrips) {
						// Skip if trip is before subscription start
						if (trip.departureTime < sub.startDate) continue;
						// Skip if trip is after subscription end
						if (sub.endDate && trip.departureTime > sub.endDate) continue;

						bookingData.push({
							tripId: trip.id,
							passengerId: sub.passengerId,
							seatsBooked: sub.seatsSubscribed,
							totalPrice: series.pricePerSeat * sub.seatsSubscribed,
							status: "confirmed",
							isSubscription: true,
							subscriptionId: sub.id,
						});
					}
				}

				if (bookingData.length > 0) {
					// Use skipDuplicates to handle edge cases where booking already exists
					const result = await tx.booking.createMany({
						data: bookingData,
						skipDuplicates: true,
					});
					bookingsCreated = result.count;
				}
			}

			// Update the generatedUntil marker
			await tx.tripSeries.update({
				where: { id: series.id },
				data: { generatedUntil: effectiveUntil },
			});

			return {
				generatedTrips: newTrips.length,
				generatedBookings: bookingsCreated,
			};
		});

		return result;
	}

	// Subscriptions

	/**
	 * Subscribe a passenger to a trip series.
	 * Pre-generates confirmed bookings for all existing scheduled trips
	 * within the subscription window.
	 */
	async createSubscription(data: CreateTripSubscriptionInput) {
		const series = await prisma.tripSeries.findUnique({
			where: { id: data.seriesId },
			include: {
				driver: { include: { user: { select: { id: true } } } },
			},
		});
		if (!series) throw new NotFoundError("Trip series not found");
		if (!series.isActive) {
			throw new BadRequestError("Cannot subscribe to an inactive series");
		}
		if (!series.subscriptionOptions.includes(data.subscriptionType)) {
			throw new BadRequestError(
				`Subscription type '${data.subscriptionType}' not available. Options: ${series.subscriptionOptions.join(", ")}`,
			);
		}

		const pricing = series.subscriptionPricing as Record<string, number> | null;
		if (!pricing?.[data.subscriptionType]) {
			throw new BadRequestError("Subscription pricing not configured");
		}

		const passenger = await prisma.passenger.findUnique({
			where: { id: data.passengerId },
			include: { user: { select: { id: true, name: true } } },
		});
		if (!passenger) throw new NotFoundError("Passenger not found");

		// Check for existing active subscription
		const existing = await prisma.tripSubscription.findUnique({
			where: {
				seriesId_passengerId: {
					seriesId: data.seriesId,
					passengerId: data.passengerId,
				},
			},
		});
		if (existing?.isActive) {
			throw new ConflictError(
				"Passenger already has an active subscription to this series",
			);
		}

		const startDate = new Date(data.startDate);
		const endDate = data.endDate ? new Date(data.endDate) : null;

		// Find all future scheduled trips in this series within the subscription window
		const tripFilter: Record<string, unknown> = {
			seriesId: data.seriesId,
			status: "scheduled",
			departureTime: { gte: startDate },
		};
		if (endDate) {
			tripFilter.departureTime = { gte: startDate, lte: endDate };
		}

		const upcomingTrips = await prisma.trip.findMany({
			where: tripFilter,
			select: {
				id: true,
				departureTime: true,
				availableSeats: true,
				pricePerSeat: true,
			},
			orderBy: { departureTime: "asc" },
		});

		// Check seat availability on each trip
		const tripsWithAvailability = await Promise.all(
			upcomingTrips.map(async (trip) => {
				const reserved = await prisma.booking.aggregate({
					where: {
						tripId: trip.id,
						status: { in: ["pending", "confirmed"] },
					},
					_sum: { seatsBooked: true },
				});
				const available =
					trip.availableSeats - (reserved._sum.seatsBooked ?? 0);
				return { ...trip, available };
			}),
		);

		// Check if any trip doesn't have enough seats
		const insufficientTrips = tripsWithAvailability.filter(
			(t) => t.available < data.seatsSubscribed,
		);
		if (insufficientTrips.length > 0) {
			throw new BadRequestError(
				`Not enough seats on ${insufficientTrips.length} upcoming trip(s). First conflict: ${insufficientTrips[0].departureTime.toISOString()}`,
			);
		}

		// Create subscription + pre-generate bookings in a transaction
		const result = await prisma.$transaction(async (tx) => {
			// Upsert: if an inactive subscription exists, reactivate it
			const subscription = existing
				? await tx.tripSubscription.update({
						where: { id: existing.id },
						data: {
							subscriptionType: data.subscriptionType,
							seatsSubscribed: data.seatsSubscribed,
							pricePerPeriod: pricing[data.subscriptionType],
							startDate,
							endDate,
							isActive: true,
						},
					})
				: await tx.tripSubscription.create({
						data: {
							seriesId: data.seriesId,
							passengerId: data.passengerId,
							subscriptionType: data.subscriptionType,
							seatsSubscribed: data.seatsSubscribed,
							pricePerPeriod: pricing[data.subscriptionType],
							startDate,
							endDate,
							isActive: true,
						},
					});

			// Pre-generate confirmed bookings for all upcoming trips
			if (tripsWithAvailability.length > 0) {
				await tx.booking.createMany({
					data: tripsWithAvailability.map((trip) => ({
						tripId: trip.id,
						passengerId: data.passengerId,
						seatsBooked: data.seatsSubscribed,
						totalPrice: trip.pricePerSeat * data.seatsSubscribed,
						status: "confirmed" as const,
						isSubscription: true,
						subscriptionId: subscription.id,
					})),
					skipDuplicates: true,
				});
			}

			return {
				subscription,
				bookingsCreated: tripsWithAvailability.length,
			};
		});

		// Notify the driver
		const passengerName = passenger.user.name || "A passenger";
		sendNotification({
			recipientId: series.driver.user.id,
			type: "booking_confirmed",
			title: "New Subscription",
			message: `${passengerName} subscribed (${data.subscriptionType}) to your trip series from ${series.origin} to ${series.destination}.`,
			metadata: { tripId: data.seriesId },
		});

		return result;
	}

	/**
	 * Cancel a subscription — deactivates it and cancels all future
	 * subscription-generated bookings.
	 */
	async cancelSubscription(subscriptionId: string) {
		const subscription = await prisma.tripSubscription.findUnique({
			where: { id: subscriptionId },
			include: {
				series: true,
				passenger: {
					include: { user: { select: { id: true, name: true } } },
				},
			},
		});

		if (!subscription) throw new NotFoundError("Subscription not found");
		if (!subscription.isActive) {
			throw new BadRequestError("Subscription is already inactive");
		}

		const result = await prisma.$transaction(async (tx) => {
			// Deactivate the subscription
			const updatedSub = await tx.tripSubscription.update({
				where: { id: subscriptionId },
				data: { isActive: false, endDate: new Date() },
			});

			// Cancel all future bookings linked to this subscription
			const cancelResult = await tx.booking.updateMany({
				where: {
					subscriptionId,
					status: { in: ["pending", "confirmed"] },
					trip: { departureTime: { gt: new Date() } },
				},
				data: { status: "canceled" },
			});

			return {
				subscription: updatedSub,
				canceledBookings: cancelResult.count,
			};
		});

		return result;
	}

	/**
	 * Get subscription by ID.
	 */
	async getSubscriptionById(subscriptionId: string) {
		const subscription = await prisma.tripSubscription.findUnique({
			where: { id: subscriptionId },
			include: {
				series: {
					include: {
						driver: {
							include: {
								user: {
									select: { id: true, name: true, rating: true, image: true },
								},
							},
						},
					},
				},
				passenger: {
					include: {
						user: {
							select: { id: true, name: true, rating: true, image: true },
						},
					},
				},
				bookings: {
					where: { trip: { departureTime: { gte: new Date() } } },
					include: {
						trip: { select: { id: true, departureTime: true, status: true } },
					},
					orderBy: { trip: { departureTime: "asc" } },
					take: 20,
				},
			},
		});

		if (!subscription) throw new NotFoundError("Subscription not found");
		return subscription;
	}

	/**
	 * Get all subscriptions for a passenger.
	 */
	async getPassengerSubscriptions(passengerId: string) {
		return prisma.tripSubscription.findMany({
			where: { passengerId },
			include: {
				series: {
					include: {
						driver: {
							include: {
								user: {
									select: { id: true, name: true, rating: true, image: true },
								},
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});
	}

	/**
	 * Get all subscriptions for a series (for drivers).
	 */
	async getSeriesSubscriptions(seriesId: string) {
		return prisma.tripSubscription.findMany({
			where: { seriesId },
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
}

export const seriesService = new SeriesService();
