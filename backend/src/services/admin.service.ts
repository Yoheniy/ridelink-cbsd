import { BadRequestError, NotFoundError } from "@/errors";
import type {
	BanUserInput,
	CreateFeedbackInput,
	CreateIncidentLogInput,
	UnbanUserInput,
	UpdateConfigInput,
	UpdateIncidentLogInput,
} from "@/validations/schemas/admin.schema";
import { fromNodeHeaders } from "better-auth/node";
import type { IncomingHttpHeaders } from "node:http";
import { auth } from "../lib/auth";
import { appConfig, type AppConfigData } from "../lib/config";
import prisma from "../lib/prisma";

export class AdminService {
	// Config

	getConfig(): AppConfigData {
		return appConfig.get();
	}

	updateConfig(data: UpdateConfigInput): AppConfigData {
		return appConfig.update(data);
	}

	// Ban / Unban

	async banUser(data: BanUserInput, headers: IncomingHttpHeaders) {
		const result = await auth.api.banUser({
			body: {
				userId: data.userId,
				banReason: data.banReason,
				banExpiresIn: data.banExpiresIn,
			},
			headers: fromNodeHeaders(headers),
		});

		return result;
	}

	async unbanUser(data: UnbanUserInput, headers: IncomingHttpHeaders) {
		const result = await auth.api.unbanUser({
			body: {
				userId: data.userId,
			},
			headers: fromNodeHeaders(headers),
		});

		return result;
	}

	// Stats

	async getStats() {
		const [
			totalUsers,
			totalDrivers,
			totalPassengers,
			activeUsers,
			bannedUsers,
			totalTrips,
			activeTrips,
			completedTrips,
			totalBookings,
			totalFeedback,
			totalReports,
			openIncidents,
		] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { role: "driver" } }),
			prisma.user.count({ where: { role: "passenger" } }),
			prisma.user.count({ where: { status: "active" } }),
			prisma.user.count({ where: { banned: true } }),
			prisma.trip.count(),
			prisma.trip.count({ where: { status: "inProgress" } }),
			prisma.trip.count({ where: { status: "completed" } }),
			prisma.booking.count(),
			prisma.feedback.count({ where: { type: "rating" } }),
			prisma.feedback.count({ where: { type: "report" } }),
			prisma.incidentLog.count({
				where: { status: { in: ["open", "in_progress"] } },
			}),
		]);

		return {
			users: {
				total: totalUsers,
				drivers: totalDrivers,
				passengers: totalPassengers,
				active: activeUsers,
				banned: bannedUsers,
			},
			trips: {
				total: totalTrips,
				active: activeTrips,
				completed: completedTrips,
			},
			bookings: {
				total: totalBookings,
			},
			feedback: {
				ratings: totalFeedback,
				reports: totalReports,
			},
			incidents: {
				open: openIncidents,
			},
		};
	}

	// Feedback

	async createFeedback(data: CreateFeedbackInput, fromUserId: string) {
		if (data.toUserId === fromUserId) {
			throw new BadRequestError("Cannot submit feedback for yourself");
		}

		// Verify target user exists
		const targetUser = await prisma.user.findUnique({
			where: { id: data.toUserId },
		});
		if (!targetUser) throw new NotFoundError("Target user not found");

		const feedback = await prisma.feedback.create({
			data: {
				type: data.type,
				fromUserId,
				toUserId: data.toUserId,
				tripId: data.tripId,
				rating: data.rating,
				comment: data.comment,
			},
		});

		// If it's a rating, update the target user's average rating
		if (data.type === "rating" && data.rating !== undefined) {
			const aggregation = await prisma.feedback.aggregate({
				where: {
					toUserId: data.toUserId,
					type: "rating",
					rating: { not: null },
				},
				_avg: { rating: true },
			});

			const newAvg = aggregation._avg.rating ?? 0;
			await prisma.user.update({
				where: { id: data.toUserId },
				data: { rating: Math.round(newAvg * 100) / 100 },
			});
		}

		return feedback;
	}

	async getFeedbackForUser(userId: string) {
		return prisma.feedback.findMany({
			where: { toUserId: userId },
			orderBy: { createdAt: "desc" },
			include: {
				fromUser: { select: { id: true, name: true, image: true } },
			},
		});
	}

	async listFeedback(type?: "rating" | "report") {
		return prisma.feedback.findMany({
			where: type ? { type } : undefined,
			orderBy: { createdAt: "desc" },
			include: {
				fromUser: {
					select: { id: true, name: true, email: true, image: true },
				},
				toUser: { select: { id: true, name: true, email: true, image: true } },
			},
		});
	}

	// Incident Logs

	async createIncidentLog(data: CreateIncidentLogInput, adminId: string) {
		// Validate feedback reference if provided
		if (data.feedbackId) {
			const feedback = await prisma.feedback.findUnique({
				where: { id: data.feedbackId },
			});
			if (!feedback) throw new NotFoundError("Referenced feedback not found");
		}

		// Validate target user if provided
		if (data.targetUserId) {
			const user = await prisma.user.findUnique({
				where: { id: data.targetUserId },
			});
			if (!user) throw new NotFoundError("Target user not found");
		}

		return prisma.incidentLog.create({
			data: {
				feedbackId: data.feedbackId,
				sosAlertId: data.sosAlertId,
				sosReason: data.sosReason,
				action: data.action,
				status: data.status ?? "open",
				notes: data.notes,
				adminId,
				targetUserId: data.targetUserId,
			},
			include: {
				admin: { select: { id: true, name: true, email: true } },
				targetUser: { select: { id: true, name: true, email: true } },
				feedback: true,
			},
		});
	}

	async updateIncidentLog(incidentId: string, data: UpdateIncidentLogInput) {
		const existing = await prisma.incidentLog.findUnique({
			where: { id: incidentId },
		});
		if (!existing) throw new NotFoundError("Incident log not found");

		return prisma.incidentLog.update({
			where: { id: incidentId },
			data: {
				action: data.action,
				status: data.status,
				notes: data.notes,
			},
			include: {
				admin: { select: { id: true, name: true, email: true } },
				targetUser: { select: { id: true, name: true, email: true } },
				feedback: true,
			},
		});
	}

	async getIncidentLog(incidentId: string) {
		const incident = await prisma.incidentLog.findUnique({
			where: { id: incidentId },
			include: {
				admin: { select: { id: true, name: true, email: true } },
				targetUser: { select: { id: true, name: true, email: true } },
				feedback: {
					include: {
						fromUser: { select: { id: true, name: true, email: true } },
						toUser: { select: { id: true, name: true, email: true } },
					},
				},
			},
		});

		if (!incident) throw new NotFoundError("Incident log not found");
		return incident;
	}

	async listIncidentLogs(status?: "open" | "in_progress" | "closed") {
		return prisma.incidentLog.findMany({
			where: status ? { status } : undefined,
			orderBy: { createdAt: "desc" },
			include: {
				admin: { select: { id: true, name: true, email: true } },
				targetUser: { select: { id: true, name: true, email: true } },
				feedback: true,
			},
		});
	}
}

export const adminService = new AdminService();
