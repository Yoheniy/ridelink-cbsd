import { success } from "@/lib/response";
import { adminService } from "@/services/admin.service";
import type { Request, Response } from "express";

export class AdminController {
	// Config

	async getConfig(_req: Request, res: Response) {
		const config = adminService.getConfig();
		return success(res, config, "Config retrieved successfully");
	}

	async updateConfig(req: Request, res: Response) {
		const config = adminService.updateConfig(req.body);
		return success(res, config, "Config updated successfully");
	}

	// Ban / Unban

	async banUser(req: Request, res: Response) {
		const result = await adminService.banUser(req.body, req.headers);
		return success(res, result, "User banned successfully");
	}

	async unbanUser(req: Request, res: Response) {
		const result = await adminService.unbanUser(req.body, req.headers);
		return success(res, result, "User unbanned successfully");
	}

	// Stats
	async getStats(_req: Request, res: Response) {
		const stats = await adminService.getStats();
		return success(res, stats, "Dashboard stats retrieved successfully");
	}

	// Feedback
	async listFeedback(req: Request, res: Response) {
		const type = req.query.type as "rating" | "report" | undefined;
		const feedback = await adminService.listFeedback(type);
		return success(res, feedback, "Feedback list retrieved successfully");
	}

	// Incident Logs

	async createIncidentLog(req: Request, res: Response) {
		const incident = await adminService.createIncidentLog(
			req.body,
			req.user.id,
		);
		res.status(201);
		return success(res, incident, "Incident log created successfully");
	}

	async updateIncidentLog(req: Request, res: Response) {
		const incident = await adminService.updateIncidentLog(
			req.params.incidentId as string,
			req.body,
		);
		return success(res, incident, "Incident log updated successfully");
	}

	async getIncidentLog(req: Request, res: Response) {
		const incident = await adminService.getIncidentLog(
			req.params.incidentId as string,
		);
		return success(res, incident, "Incident log retrieved successfully");
	}

	async listIncidentLogs(req: Request, res: Response) {
		const status = req.query.status as
			| "open"
			| "in_progress"
			| "closed"
			| undefined;
		const incidents = await adminService.listIncidentLogs(status);
		return success(res, incidents, "Incident logs retrieved successfully");
	}
}

export const adminController = new AdminController();
