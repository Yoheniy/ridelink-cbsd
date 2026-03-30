import type { CreateBookingInput } from "../validations/schemas/trip.schema.js";

/**
 * Provided interface for the Booking component.
 *
 * Isolates booking lifecycle operations (create, accept, decline, cancel)
 * from trip CRUD. This follows the Interface Segregation Principle --
 * a passenger screen that only manages bookings depends on IBookingService,
 * never needing to know about trip creation or status management.
 */
export interface IBookingService {
	createBooking(data: CreateBookingInput): Promise<unknown>;
	acceptBooking(bookingId: string): Promise<unknown>;
	declineBooking(bookingId: string): Promise<unknown>;
	cancelBooking(bookingId: string): Promise<unknown>;
	getBookingById(bookingId: string): Promise<unknown>;
	getTripBookings(tripId: string, status?: string): Promise<unknown>;
	getPassengerBookings(passengerId: string): Promise<unknown>;
}
