import { z } from "zod";

// Config schemas

const commutingWindowSchema = z.object({
	start: z.number().int().min(0).max(23),
	end: z.number().int().min(0).max(23),
});

export const updateConfigSchema = z.object({
	maxPricePerKm: z.number().positive().optional(),
	commutingWindows: z.array(commutingWindowSchema).min(1).optional(),
});

export type UpdateConfigInput = z.infer<typeof updateConfigSchema>;

// Ban / Unban schemas

export const banUserSchema = z.object({
	userId: z.uuid(),
	banReason: z.string().min(1).max(500).optional(),
	banExpiresIn: z.number().positive().optional(),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

export const unbanUserSchema = z.object({
	userId: z.uuid(),
});

export type UnbanUserInput = z.infer<typeof unbanUserSchema>;

// Feedback schemas

export const createFeedbackSchema = z
	.object({
		type: z.enum(["rating", "report"]),
		toUserId: z.uuid(),
		tripId: z.uuid().optional(),
		rating: z.number().int().min(1).max(5).optional(),
		comment: z.string().max(2000).optional(),
	})
	.refine(
		(data) => {
			if (data.type === "rating") return data.rating !== undefined;
			return true;
		},
		{
			message: "Rating is required when feedback type is 'rating'",
			path: ["rating"],
		},
	)
	.refine(
		(data) => {
			if (data.type === "report")
				return data.comment !== undefined && data.comment.length > 0;
			return true;
		},
		{
			message: "Comment is required when feedback type is 'report'",
			path: ["comment"],
		},
	);

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

// Incident Log schemas

export const createIncidentLogSchema = z.object({
	feedbackId: z.uuid().optional(),
	sosAlertId: z.string().optional(),
	sosReason: z.string().max(1000).optional(),
	action: z.enum([
		"warning_issued",
		"user_suspended",
		"user_banned",
		"case_dismissed",
		"under_review",
		"escalated",
		"resolved",
	]),
	status: z.enum(["open", "in_progress", "closed"]).optional(),
	notes: z.string().max(5000).optional(),
	targetUserId: z.uuid().optional(),
});

export type CreateIncidentLogInput = z.infer<typeof createIncidentLogSchema>;

export const updateIncidentLogSchema = z.object({
	action: z
		.enum([
			"warning_issued",
			"user_suspended",
			"user_banned",
			"case_dismissed",
			"under_review",
			"escalated",
			"resolved",
		])
		.optional(),
	status: z.enum(["open", "in_progress", "closed"]).optional(),
	notes: z.string().max(5000).optional(),
});

export type UpdateIncidentLogInput = z.infer<typeof updateIncidentLogSchema>;

// Common param schemas

export const incidentIdParamSchema = z.object({
	incidentId: z.uuid(),
});

export const feedbackIdParamSchema = z.object({
	feedbackId: z.uuid(),
});

export const userIdParamSchema = z.object({
	userId: z.uuid(),
});
