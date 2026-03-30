import { BadRequestError, NotFoundError } from "@/errors";
import prisma from "@/lib/prisma";
import type { CreateFeedbackInput } from "@/validations/schemas/admin.schema";

export class FeedbackService {
	async createFeedback(data: CreateFeedbackInput, fromUserId: string) {
		if (data.toUserId === fromUserId) {
			throw new BadRequestError("Cannot submit feedback for yourself");
		}

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
			include: { fromUser: { select: { id: true, name: true, image: true } } },
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
}

export const feedbackService = new FeedbackService();
