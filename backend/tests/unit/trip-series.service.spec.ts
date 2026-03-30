import { generateOccurrenceDates } from "@/services/trip-series.service.js";
import { describe, expect, it } from "vitest";

describe("trip-series service - pure helpers", () => {
	it("generates occurrence dates for given days and time, skipping exceptions and past dates", () => {
		// pick a start date tomorrow and an until 10 days later
		const now = new Date();
		const start = new Date(now);
		start.setDate(start.getDate() + 1);
		start.setHours(0, 0, 0, 0);

		const until = new Date(start);
		until.setDate(until.getDate() + 9);

		// Choose the weekday of the start so we expect occurrences on that weekday
		const dow = [start.getDay()];
		const timeOfDay = "08:30";

		// No exceptions: should produce at least one occurrence
		const dates = generateOccurrenceDates(dow, timeOfDay, start, until, []);
		expect(Array.isArray(dates)).toBe(true);
		expect(dates.length).toBeGreaterThanOrEqual(1);
		// All dates should be on the requested weekday and at the specified time
		for (const d of dates) {
			expect(d.getDay()).toBe(dow[0]);
			expect(d.getHours()).toBe(8);
			expect(d.getMinutes()).toBe(30);
			expect(d > new Date()).toBe(true);
		}

		// Add an exception for the first date; expect that specific date to be omitted
		const firstDateStr = dates[0].toISOString().split("T")[0];
		const datesWithException = generateOccurrenceDates(
			dow,
			timeOfDay,
			start,
			until,
			[firstDateStr],
		);
		// None of the returned dates should have the same date string
		for (const d of datesWithException) {
			expect(d.toISOString().split("T")[0]).not.toBe(firstDateStr);
		}
	});

	it("returns empty when there are no matching weekdays in range", () => {
		const start = new Date();
		start.setDate(start.getDate() + 1);
		start.setHours(0, 0, 0, 0);
		const until = new Date(start);
		until.setDate(until.getDate() + 2);

		// Pick a weekday that does not occur in the 3-day window by using a list
		// that excludes all days (edge-case: empty daysOfWeek)
		const dates = generateOccurrenceDates([], "09:00", start, until, []);
		expect(Array.isArray(dates)).toBe(true);
		expect(dates.length).toBe(0);
	});
});
