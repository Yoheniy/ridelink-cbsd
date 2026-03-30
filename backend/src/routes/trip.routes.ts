import { Router } from "express";
import { tripController } from "../controllers/trip.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
	bookingIdParamSchema,
	createBookingSchema,
	createTripSchema,
	queryTripsSchema,
	tripIdParamSchema,
	updateTripSchema,
	updateTripStatusSchema,
} from "../validations/schemas/trip.schema.js";

const router: Router = Router();

// Trip CRUD
router.post(
	"/",
	validateRequest({ body: createTripSchema }),
	tripController.createTrip.bind(tripController),
);

router.get(
	"/",
	validateRequest({ params: queryTripsSchema }),
	tripController.queryTrips.bind(tripController),
);

router.get(
	"/:tripId",
	validateRequest({ params: tripIdParamSchema }),
	tripController.getTripById.bind(tripController),
);

router.patch(
	"/:tripId",
	validateRequest({ params: tripIdParamSchema, body: updateTripSchema }),
	tripController.updateTrip.bind(tripController),
);

router.patch(
	"/:tripId/status",
	validateRequest({ params: tripIdParamSchema, body: updateTripStatusSchema }),
	tripController.updateTripStatus.bind(tripController),
);

router.delete(
	"/:tripId",
	validateRequest({ params: tripIdParamSchema }),
	tripController.deleteTrip.bind(tripController),
);

// Trip bookings (for drivers to view)
router.get(
	"/:tripId/bookings",
	validateRequest({ params: tripIdParamSchema }),
	tripController.getTripBookings.bind(tripController),
);

// Booking CRUD + lifecycle
router.post(
	"/bookings",
	validateRequest({ body: createBookingSchema }),
	tripController.createBooking.bind(tripController),
);

router.get(
	"/bookings/:bookingId",
	validateRequest({ params: bookingIdParamSchema }),
	tripController.getBookingById.bind(tripController),
);

router.patch(
	"/bookings/:bookingId/accept",
	validateRequest({ params: bookingIdParamSchema }),
	tripController.acceptBooking.bind(tripController),
);

router.patch(
	"/bookings/:bookingId/decline",
	validateRequest({ params: bookingIdParamSchema }),
	tripController.declineBooking.bind(tripController),
);

router.patch(
	"/bookings/:bookingId/cancel",
	validateRequest({ params: bookingIdParamSchema }),
	tripController.cancelBooking.bind(tripController),
);

// Passenger bookings
router.get(
	"/passengers/:passengerId/bookings",
	tripController.getPassengerBookings.bind(tripController),
);

// Driver trips
router.get(
	"/drivers/:driverId/trips",
	tripController.getDriverTrips.bind(tripController),
);

export default router;
