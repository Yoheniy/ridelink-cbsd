import { becomeDriver, completeProfile } from "@/controllers/user.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import {
	becomeDriverSchema,
	completeProfileSchema,
} from "@/validations/schemas/user.schema";
import { Router } from "express";

const router: Router = Router();

router.use(requireAuth);

router.patch(
	"/complete-profile",
	validateBody(completeProfileSchema),
	completeProfile,
);

router.post("/become-driver", validateBody(becomeDriverSchema), becomeDriver);

export default router;
