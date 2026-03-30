import { Router } from "express";
import { seriesController } from "../controllers/trip-series.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
	createTripSeriesSchema,
	createTripSubscriptionSchema,
	generateTripsSchema,
	querySeriesSchema,
	seriesIdParamSchema,
	subscriptionIdParamSchema,
	updateTripSeriesSchema,
} from "../validations/schemas/trip.schema.js";

const router: Router = Router();

// TripSeries CRUD
router.post(
	"/",
	validateRequest({ body: createTripSeriesSchema }),
	seriesController.createTripSeries.bind(seriesController),
);

router.get(
	"/",
	validateRequest({ params: querySeriesSchema }),
	seriesController.querySeries.bind(seriesController),
);

router.get(
	"/:seriesId",
	validateRequest({ params: seriesIdParamSchema }),
	seriesController.getTripSeriesById.bind(seriesController),
);

router.patch(
	"/:seriesId",
	validateRequest({
		params: seriesIdParamSchema,
		body: updateTripSeriesSchema,
	}),
	seriesController.updateTripSeries.bind(seriesController),
);

router.patch(
	"/:seriesId/deactivate",
	validateRequest({ params: seriesIdParamSchema }),
	seriesController.deactivateSeries.bind(seriesController),
);

// Trip occurrence generation
router.post(
	"/:seriesId/generate",
	validateRequest({ params: seriesIdParamSchema, body: generateTripsSchema }),
	seriesController.generateTrips.bind(seriesController),
);

// Subscriptions
router.post(
	"/subscriptions",
	validateRequest({ body: createTripSubscriptionSchema }),
	seriesController.createSubscription.bind(seriesController),
);

router.get(
	"/subscriptions/:subscriptionId",
	validateRequest({ params: subscriptionIdParamSchema }),
	seriesController.getSubscriptionById.bind(seriesController),
);

router.patch(
	"/subscriptions/:subscriptionId/cancel",
	validateRequest({ params: subscriptionIdParamSchema }),
	seriesController.cancelSubscription.bind(seriesController),
);

// Passenger subscriptions
router.get(
	"/passengers/:passengerId/subscriptions",
	seriesController.getPassengerSubscriptions.bind(seriesController),
);

// Series subscriptions (for drivers to view)
router.get(
	"/:seriesId/subscriptions",
	validateRequest({ params: seriesIdParamSchema }),
	seriesController.getSeriesSubscriptions.bind(seriesController),
);

export default router;
