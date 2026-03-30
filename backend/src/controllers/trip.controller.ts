import type { Request, Response } from "express";
import { success } from "../lib/response.js";
import { tripService } from "../services/trip.service.js";

export class TripController {
	async createTrip(req: Request, res: Response) {
		const trip = await tripService.createTrip(req.body);
		res.status(201);
		return success(res, trip, "Trip created successfully");
	}

	async getTripById(req: Request, res: Response) {
		const { tripId } = req.params;
		const trip = await tripService.getTripById(tripId as string);
		return success(res, trip, "Trip retrieved successfully");
	}

	async queryTrips(req: Request, res: Response) {
		const result = await tripService.queryTrips(req.query as any);
		return success(res, result, "Trips retrieved successfully");
	}

	async updateTrip(req: Request, res: Response) {
		const trip = await tripService.updateTrip(
			req.params.tripId as string,
			req.body,
		);
		return success(res, trip, "Trip updated successfully");
	}

	async updateTripStatus(req: Request, res: Response) {
		const trip = await tripService.updateTripStatus(
			req.params.tripId as string,
			req.body.status,
		);
		return success(res, trip, "Trip status updated successfully");
	}

	async deleteTrip(req: Request, res: Response) {
		const { tripId } = req.params;
		const result = await tripService.deleteTrip(tripId as string);
		return success(res, result, "Trip deleted successfully");
	}

	// Booking endpoints

	async createBooking(req: Request, res: Response) {
		const booking = await tripService.createBooking(req.body);
		res.status(201);
		return success(res, booking, "Booking request created successfully");
	}

	async acceptBooking(req: Request, res: Response) {
		const booking = await tripService.acceptBooking(
			req.params.bookingId as string,
		);
		return success(res, booking, "Booking accepted successfully");
	}

	async declineBooking(req: Request, res: Response) {
		const booking = await tripService.declineBooking(
			req.params.bookingId as string,
		);
		return success(res, booking, "Booking declined successfully");
	}

	async cancelBooking(req: Request, res: Response) {
		const booking = await tripService.cancelBooking(
			req.params.bookingId as string,
		);
		return success(res, booking, "Booking cancelled successfully");
	}

	async getBookingById(req: Request, res: Response) {
		const booking = await tripService.getBookingById(
			req.params.bookingId as string,
		);
		return success(res, booking, "Booking retrieved successfully");
	}

	async getTripBookings(req: Request, res: Response) {
		const bookings = await tripService.getTripBookings(
			req.params.tripId as string,
			req.query.status as string | undefined,
		);
		return success(res, bookings, "Trip bookings retrieved successfully");
	}

	async getDriverTrips(req: Request, res: Response) {
		const trips = await tripService.getDriverTrips(
			req.params.driverId as string,
			req.query.status as any,
		);
		return success(res, trips, "Driver trips retrieved successfully");
	}

	async getPassengerBookings(req: Request, res: Response) {
		const bookings = await tripService.getPassengerBookings(
			req.params.passengerId as string,
		);
		return success(res, bookings, "Passenger bookings retrieved successfully");
	}
}

export const tripController = new TripController();
