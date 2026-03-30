import { Resend } from "resend";
import { RESEND_API_KEY } from "./constants";

const resend = new Resend(RESEND_API_KEY);

export interface SendVerificationEmailParams {
	email: string;
	username: string;
	url: string;
}

export async function sendEmail({
	email,
	username,
	url: verificationUrl,
}: SendVerificationEmailParams) {
	await resend.emails.send({
		from: "RideLink <onboarding@resend.dev>",
		to: email,
		subject: "Verify your RideLink account",
		html: `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
			</head>
			<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1 style="color: #2563eb;">Welcome to RideLink, ${username}!</h1>
				<p>Thank you for signing up. Please verify your email address to get started.</p>
				<div style="text-align: center; margin: 30px 0;">
					<a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
				</div>
				<p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
				<p style="color: #2563eb; word-break: break-all;">${verificationUrl}</p>
				<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
				<p style="color: #999; font-size: 12px;">If you didn't create an account with RideLink, you can safely ignore this email.</p>
			</body>
			</html>
		`,
	});
}
