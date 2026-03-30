import { success } from "@/lib/response";
import { feedbackService } from "@/services/feedback.service";
import type { Request, Response } from "express";

export class FeedbackController {
	async createFeedback(req: Request, res: Response) {
		const feedback = await feedbackService.createFeedback(
			req.body,
			req.user.id,
		);
		res.status(201);
		return success(res, feedback, "Feedback submitted successfully");
	}

	async getFeedbackForUser(req: Request, res: Response) {
		const feedback = await feedbackService.getFeedbackForUser(
			req.params.userId as string,
		);
		return success(res, feedback, "User feedback retrieved successfully");
	}
}

export const feedbackController = new FeedbackController();
