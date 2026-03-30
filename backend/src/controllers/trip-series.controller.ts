import { seriesService } from "@/services/trip-series.service.js";
import type { Request, Response } from "express";
import { success } from "../lib/response.js";

export class SeriesController {
	// TripSeries CRUD

	async createTripSeries(req: Request, res: Response) {
		const series = await seriesService.createTripSeries(req.body);
		res.status(201);
		return success(res, series, "Trip series created successfully");
	}

	async getTripSeriesById(req: Request, res: Response) {
		const series = await seriesService.getTripSeriesById(
			req.params.seriesId as string,
		);
		return success(res, series, "Trip series retrieved successfully");
	}

	async querySeries(req: Request, res: Response) {
		const result = await seriesService.querySeries(req.query as any);
		return success(res, result, "Trip series retrieved successfully");
	}

	async updateTripSeries(req: Request, res: Response) {
		const series = await seriesService.updateTripSeries(
			req.params.seriesId as string,
			req.body,
		);
		return success(res, series, "Trip series updated successfully");
	}

	async deactivateSeries(req: Request, res: Response) {
		const result = await seriesService.deactivateSeries(
			req.params.seriesId as string,
		);
		return success(res, result, "Trip series deactivated successfully");
	}

	// Trip generation

	async generateTrips(req: Request, res: Response) {
		const result = await seriesService.generateTripsForSeries(
			req.params.seriesId as string,
			req.body.weeks,
		);
		return success(res, result, "Trip occurrences generated successfully");
	}

	// Subscriptions

	async createSubscription(req: Request, res: Response) {
		const result = await seriesService.createSubscription(req.body);
		res.status(201);
		return success(res, result, "Subscription created successfully");
	}

	async cancelSubscription(req: Request, res: Response) {
		const result = await seriesService.cancelSubscription(
			req.params.subscriptionId as string,
		);
		return success(res, result, "Subscription cancelled successfully");
	}

	async getSubscriptionById(req: Request, res: Response) {
		const subscription = await seriesService.getSubscriptionById(
			req.params.subscriptionId as string,
		);
		return success(res, subscription, "Subscription retrieved successfully");
	}

	async getPassengerSubscriptions(req: Request, res: Response) {
		const subscriptions = await seriesService.getPassengerSubscriptions(
			req.params.passengerId as string,
		);
		return success(
			res,
			subscriptions,
			"Passenger subscriptions retrieved successfully",
		);
	}

	async getSeriesSubscriptions(req: Request, res: Response) {
		const subscriptions = await seriesService.getSeriesSubscriptions(
			req.params.seriesId as string,
		);
		return success(
			res,
			subscriptions,
			"Series subscriptions retrieved successfully",
		);
	}
}

export const seriesController = new SeriesController();
