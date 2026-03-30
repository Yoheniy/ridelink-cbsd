import { Router } from "express";
import { adminController } from "../controllers/admin.controller.js";
import {
	requireAuth,
	requirePermission,
} from "../middleware/auth.middleware.js";
import {
	validateParams,
	validateRequest,
} from "../middleware/validation.middleware.js";
import {
	banUserSchema,
	createIncidentLogSchema,
	incidentIdParamSchema,
	unbanUserSchema,
	updateConfigSchema,
	updateIncidentLogSchema,
} from "../validations/schemas/admin.schema.js";

const router: Router = Router();

// All admin routes require authentication
router.use(requireAuth);

// Config
router.get(
	"/config",
	requirePermission({ config: ["read"] }),
	adminController.getConfig.bind(adminController),
);

router.patch(
	"/config",
	requirePermission({ config: ["update"] }),
	validateRequest({ body: updateConfigSchema }),
	adminController.updateConfig.bind(adminController),
);

// Ban / Unban
router.post(
	"/ban",
	requirePermission({ user: ["ban"] }),
	validateRequest({ body: banUserSchema }),
	adminController.banUser.bind(adminController),
);

router.post(
	"/unban",
	requirePermission({ user: ["ban"] }),
	validateRequest({ body: unbanUserSchema }),
	adminController.unbanUser.bind(adminController),
);

// Stats
router.get(
	"/stats",
	requirePermission({ stats: ["read"] }),
	adminController.getStats.bind(adminController),
);

// Feedback (admin list kept here)
router.get(
	"/feedback",
	requirePermission({ feedback: ["list"] }),
	adminController.listFeedback.bind(adminController),
);

// Incident Logs
router.post(
	"/incidents",
	requirePermission({ incident: ["create"] }),
	validateRequest({ body: createIncidentLogSchema }),
	adminController.createIncidentLog.bind(adminController),
);

router.get(
	"/incidents",
	requirePermission({ incident: ["list"] }),
	adminController.listIncidentLogs.bind(adminController),
);

router.get(
	"/incidents/:incidentId",
	requirePermission({ incident: ["read"] }),
	validateParams(incidentIdParamSchema),
	adminController.getIncidentLog.bind(adminController),
);

router.patch(
	"/incidents/:incidentId",
	requirePermission({ incident: ["update"] }),
	validateRequest({
		params: incidentIdParamSchema,
		body: updateIncidentLogSchema,
	}),
	adminController.updateIncidentLog.bind(adminController),
);

export default router;
