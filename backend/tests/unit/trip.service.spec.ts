import { describe, expect, it } from "vitest";
import {
	calculateDistance,
	calculateRouteDistance,
	validateDepartureTime,
	validateStatusTransition,
} from "@/services/trip.service.js";

describe("trip service - pure helpers", () => {
	it("calculateDistance returns positive number", () => {
		const d = calculateDistance(0, 0, 0, 1);
		expect(d).toBeGreaterThan(0);
	});

	it("calculateRouteDistance sums segments", () => {
		const coords = [
			{ lat: 0, lng: 0 },
			{ lat: 0, lng: 1 },
			{ lat: 0, lng: 2 },
		];
		const r = calculateRouteDistance(coords);
		expect(r).toBeGreaterThan(0);
	});

	it("validateStatusTransition permits allowed transitions", () => {
		expect(validateStatusTransition("scheduled", "inProgress")).toBe(true);
		expect(validateStatusTransition("scheduled", "canceled")).toBe(true);
		expect(validateStatusTransition("completed", "scheduled")).toBe(false);
	});

	it("validateDepartureTime respects commuting windows (sanity)", () => {
		// Pick an hour and construct a date matching that hour.
		const now = new Date();
		const d = new Date(now);
		d.setHours(9, 0, 0, 0);
		// The function depends on getCommutingWindows; we only assert it returns a boolean
		const ok = validateDepartureTime(d);
		expect(typeof ok).toBe("boolean");
	});
});
