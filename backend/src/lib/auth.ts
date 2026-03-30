import bcrypt from "bcrypt";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { admin, jwt } from "better-auth/plugins";
import { CONVEX_URL, FRONTEND_URL } from "./constants";
import { sendEmail } from "./email";
import { ac, adminRole, driverRole, passengerRole } from "./permissions";
import prisma from "./prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		password: {
			hash: async (password) => {
				return await bcrypt.hash(password, 10);
			},
			verify: async ({ hash, password }) => {
				return await bcrypt.compare(password, hash);
			},
		},
		requireEmailVerification: true,
	},
	user: {
		additionalFields: {
			phone: {
				type: "string",
				required: false,
				input: true,
				unique: true,
			},
			nationalId: {
				type: "string",
				required: false,
				input: true,
			},
			role: {
				type: "string",
				required: true,
				input: false,
				defaultValue: "passenger",
			},
			status: {
				type: "string",
				required: true,
				input: false,
				defaultValue: "active",
			},
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			void sendEmail({
				email: user.email,
				username: user.name,
				url,
			});
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
	},
	hooks: {
		// Create a passenger record after sign up
		after: createAuthMiddleware(async (ctx) => {
			const response = ctx.context.returned as {
				user: { id: string; role: string };
			};
			const user = response?.user;

			if (user && user.role === "passenger") {
				await prisma.passenger.create({
					data: { userId: user.id, prefferedRoutes: [] },
				});
			}
		}),
	},
	databaseHooks: {
		user: {
			create: {
				// If nationalId and phone not passed set the account to pending status
				before: async (user) => {
					const phone = user?.phone as string | undefined;
					const nationalId = user?.nationalId as string | undefined;

					if (phone && nationalId) return true;

					return {
						data: {
							...user,
							phone: phone || "",
							nationalId: nationalId || "",
							status: "pending",
						},
					};
				},
			},
		},
	},
	plugins: [
		admin({
			ac,
			roles: {
				admin: adminRole,
				driver: driverRole,
				passenger: passengerRole,
			},
			adminRoles: ["admin"],
			defaultRole: "passenger",
		}),
		jwt({
			jwks: {
				keyPairConfig: {
					alg: "ES256",
				},
			},
			jwt: {
				definePayload: ({ user }) => ({
					id: user.id,
					email: user.email,
					role: user.role as string,
				}),
			},
		}),
	],
	trustedOrigins: [FRONTEND_URL, CONVEX_URL],
});
