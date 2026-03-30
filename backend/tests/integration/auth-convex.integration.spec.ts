import { CONVEX_URL } from "@/lib/constants.js";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createUser } from "../helpers/fixtures";

import { app } from "@/index.js";

describe("integration: better-auth ↔ convex jwt integration", () => {
	beforeAll(() => {
		console.info("Ensure convex is running locally before starting testing");
	});

	it("successfully authenticates user via JWT between Better Auth and Convex", async () => {
		const testEmail = `jwt-test-${Date.now()}@example.test`;

		const user = await createUser({
			id: crypto.randomUUID(),
			email: testEmail,
			name: "JWT Test User",
			password: "TestPassword123!",
			phone: "+1234567890",
			nationalId: "JWT123456",
			role: "passenger",
			emailVerified: true,
		});

		// Step 2: Sign in to establish session
		const loginResponse = await request(app)
			.post("/api/auth/sign-in/email")
			.send({
				email: testEmail,
				password: "TestPassword123!",
			});

		expect(loginResponse.status).toBe(200);

		// Extract session cookie from sign in response
		const cookies = loginResponse.headers["set-cookie"];
		expect(cookies).toBeDefined();
		expect(cookies.length).toBeGreaterThan(0);

		// Step 3: Get JWT token using the session
		const tokenResponse = await request(app)
			.get("/api/auth/token")
			.set("Cookie", cookies);

		expect(tokenResponse.status).toBe(200);
		expect(tokenResponse.body).toHaveProperty("token");

		const jwtToken = tokenResponse.body.token;

		// Step 4: Test JWT authentication with Convex
		const convexUrl = CONVEX_URL || "http://localhost:3211";
		const convexResponse = await fetch(`${convexUrl}/test/jwt`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwtToken}`,
				"Content-Type": "application/json",
			},
		});

		expect(convexResponse.status).toBe(200);

		const convexData = await convexResponse.json();

		expect(convexData).toHaveProperty("user");
		expect(convexData.user).toHaveProperty("subject", user.id);
		expect(convexData.user).toHaveProperty("email", testEmail);
		expect(convexData.user).toHaveProperty("role", "passenger");
	});

	it("fails when no JWT token is provided to Convex", async () => {
		const convexUrl = CONVEX_URL || "http://localhost:3210";
		const convexResponse = await fetch(`${convexUrl}/test/jwt`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		expect(convexResponse.status).toBe(200); // The endpoint returns user as undefined/null

		const convexData = await convexResponse.json();
		expect(convexData.user).toBeNull(); // Should be null when no valid JWT
	});

	it("fails when invalid JWT token is provided to Convex", async () => {
		const convexUrl = CONVEX_URL || "http://localhost:3211";
		const convexResponse = await fetch(`${convexUrl}/test/jwt`, {
			method: "POST",
			headers: {
				Authorization: "Bearer invalid.jwt.token",
				"Content-Type": "application/json",
			},
		});

		expect(convexResponse.status).toBe(500); // The endpoint returns user as undefined/null

		const convexData = await convexResponse.json();
		expect(convexData.user).toBeNullable(); // Should be null when invalid JWT
	});
});

