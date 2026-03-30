import { feedbackController } from "@/controllers/feedback.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import {
	validateBody,
	validateParams,
} from "@/middleware/validation.middleware";
import {
	createFeedbackSchema,
	userIdParamSchema,
} from "@/validations/schemas/admin.schema";
import { Router } from "express";

const router: Router = Router();

router.use(requireAuth);

// Create feedback
router.post(
	"/",
	validateBody(createFeedbackSchema),
	feedbackController.createFeedback.bind(feedbackController),
);

// Get feedback for a user
router.get(
	"/:userId",
	validateParams(userIdParamSchema),
	feedbackController.getFeedbackForUser.bind(feedbackController),
);

export default router;
