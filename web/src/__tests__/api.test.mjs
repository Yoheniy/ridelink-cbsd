/**
 * Backend API integration tests.
 *
 * These tests run from the web project and verify that the frontend can
 * reach every backend endpoint and receive properly shaped responses.
 *
 * Run:  node --test src/__tests__/api.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const API = process.env.VITE_API_URL ?? "http://localhost:5000";

/* ── helpers ────────────────────────────────────────────────────── */

async function api(path, init) {
  const res = await fetch(`${API}${path}`, { ...init });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function assertEnvelope(body, expectSuccess = true) {
  assert.equal(typeof body, "object", "response should be JSON object");
  assert.equal(body.success, expectSuccess, `expected success=${expectSuccess}`);
  if (expectSuccess) {
    assert.ok("data" in body, "successful response must contain 'data'");
  }
}

/* ================================================================
 *  1. Health / reachability
 * ================================================================ */
describe("Backend reachability", () => {
  it("server responds to a known route", async () => {
    const { status } = await api("/api/trips?limit=1");
    assert.ok(status < 500, `expected non-5xx status, got ${status}`);
  });
});

/* ================================================================
 *  2. Trips  —  GET /api/trips
 * ================================================================ */
describe("Trips API", () => {
  it("GET /api/trips returns trip list with pagination", async () => {
    const { status, body } = await api("/api/trips?limit=5");
    assert.equal(status, 200);
    assertEnvelope(body);

    const { trips, pagination } = body.data;
    assert.ok(Array.isArray(trips), "data.trips should be an array");
    assert.ok(typeof pagination === "object", "data.pagination should exist");
    assert.ok(typeof pagination.total === "number", "pagination.total should be a number");
    assert.ok(typeof pagination.page === "number", "pagination.page should be a number");
  });

  it("GET /api/trips trip objects have required fields", async () => {
    const { body } = await api("/api/trips?limit=1");
    assertEnvelope(body);

    const trips = body.data.trips;
    if (trips.length === 0) return; // no data to check

    const trip = trips[0];
    for (const field of ["id", "origin", "destination", "distanceKm", "departureTime", "availableSeats", "pricePerSeat", "status"]) {
      assert.ok(field in trip, `trip should have field '${field}'`);
    }
    assert.ok(["scheduled", "inProgress", "completed", "canceled"].includes(trip.status), `unexpected trip status: ${trip.status}`);
  });

  it("GET /api/trips?status=scheduled filters by status", async () => {
    const { status, body } = await api("/api/trips?status=scheduled&limit=50");
    assert.equal(status, 200);
    assertEnvelope(body);

    for (const t of body.data.trips) {
      assert.equal(t.status, "scheduled", `expected status 'scheduled', got '${t.status}'`);
    }
  });

  it("GET /api/trips includes driver info", async () => {
    const { body } = await api("/api/trips?limit=1");
    assertEnvelope(body);
    if (body.data.trips.length === 0) return;

    const trip = body.data.trips[0];
    assert.ok(trip.driver, "trip should include driver object");
    assert.ok(typeof trip.driver.vehicleModel === "string", "driver.vehicleModel should be a string");
  });
});

/* ================================================================
 *  3. Trip Series  —  GET /api/series
 * ================================================================ */
describe("Trip Series API", () => {
  it("GET /api/series returns series list with pagination", async () => {
    const { status, body } = await api("/api/series");
    assert.equal(status, 200);
    assertEnvelope(body);

    const { series, pagination } = body.data;
    assert.ok(Array.isArray(series), "data.series should be an array");
    assert.ok(typeof pagination === "object", "data.pagination should exist");
  });

  it("GET /api/series series objects have required fields", async () => {
    const { body } = await api("/api/series?limit=1");
    assertEnvelope(body);
    if (body.data.series.length === 0) return;

    const s = body.data.series[0];
    for (const field of ["id", "origin", "destination", "distanceKm", "daysOfWeek", "departureTimeOfDay", "availableSeats", "pricePerSeat", "isActive"]) {
      assert.ok(field in s, `series should have field '${field}'`);
    }
    assert.ok(Array.isArray(s.daysOfWeek), "daysOfWeek should be an array");
    assert.equal(typeof s.isActive, "boolean", "isActive should be boolean");
  });

  it("GET /api/series includes driver info", async () => {
    const { body } = await api("/api/series?limit=1");
    assertEnvelope(body);
    if (body.data.series.length === 0) return;

    const s = body.data.series[0];
    assert.ok(s.driver, "series should include driver object");
    assert.ok(typeof s.driver.vehicleModel === "string", "driver.vehicleModel should be a string");
  });
});

/* ================================================================
 *  4. Admin  —  stats, config, incidents, feedback
 * ================================================================ */
describe("Admin API (public endpoints)", () => {
  it("GET /api/admin/config returns app configuration", async () => {
    const { status, body } = await api("/api/admin/config");
    // May require auth — accept 200 or 401/403
    if (status === 200) {
      assertEnvelope(body);
      assert.ok(typeof body.data.maxPricePerKm === "number", "config should have maxPricePerKm");
      assert.ok(Array.isArray(body.data.commutingWindows), "config should have commutingWindows array");
    } else {
      assert.ok([401, 403].includes(status), `expected 200/401/403 for config, got ${status}`);
    }
  });

  it("GET /api/admin/stats returns dashboard statistics", async () => {
    const { status, body } = await api("/api/admin/stats");
    if (status === 200) {
      assertEnvelope(body);
      const d = body.data;
      assert.ok(typeof d.users === "object", "stats should have users object");
      assert.ok(typeof d.trips === "object", "stats should have trips object");
      assert.ok(typeof d.bookings === "object", "stats should have bookings object");
    } else {
      assert.ok([401, 403].includes(status), `expected 200/401/403 for stats, got ${status}`);
    }
  });

  it("GET /api/admin/incidents returns incident list", async () => {
    const { status, body } = await api("/api/admin/incidents");
    if (status === 200) {
      assertEnvelope(body);
      assert.ok(Array.isArray(body.data), "incidents data should be an array");
    } else {
      assert.ok([401, 403].includes(status), `expected 200/401/403 for incidents, got ${status}`);
    }
  });

  it("GET /api/admin/feedback returns feedback list", async () => {
    const { status, body } = await api("/api/admin/feedback");
    if (status === 200) {
      assertEnvelope(body);
      assert.ok(Array.isArray(body.data), "feedback data should be an array");
    } else {
      assert.ok([401, 403].includes(status), `expected 200/401/403 for feedback, got ${status}`);
    }
  });
});

/* ================================================================
 *  5. Auth endpoint reachability
 * ================================================================ */
describe("Auth API reachability", () => {
  it("POST /api/auth/sign-in/email rejects empty body with 4xx", async () => {
    const { status } = await api("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.ok(status >= 400 && status < 500, `expected 4xx for empty sign-in, got ${status}`);
  });

  it("POST /api/auth/sign-in/email rejects bad credentials", async () => {
    const { status } = await api("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fake@none.com", password: "wrong" }),
    });
    assert.ok(status >= 400 && status < 500, `expected 4xx for bad credentials, got ${status}`);
  });
});

/* ================================================================
 *  6. Validation — backend rejects bad input
 * ================================================================ */
describe("Input validation", () => {
  it("GET /api/trips?limit=abc returns 400", async () => {
    const { status, body } = await api("/api/trips?limit=abc");
    assert.equal(status, 400, "non-numeric limit should be rejected");
    assert.equal(body.success, false);
  });

  it("GET /api/trips?limit=999 returns 400 (max 100)", async () => {
    const { status, body } = await api("/api/trips?limit=999");
    assert.equal(status, 400, "limit > 100 should be rejected");
    assert.equal(body.success, false);
  });

  it("GET /api/trips?status=INVALID returns 400", async () => {
    const { status, body } = await api("/api/trips?status=INVALID");
    assert.equal(status, 400, "invalid status should be rejected");
    assert.equal(body.success, false);
  });

  it("PATCH /api/trips/not-a-uuid/status returns 400", async () => {
    const { status } = await api("/api/trips/not-a-uuid/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    assert.equal(status, 400, "non-uuid tripId should be rejected");
  });
});

/* ================================================================
 *  7. 404 handling
 * ================================================================ */
describe("404 handling", () => {
  it("GET /api/nonexistent returns 404", async () => {
    const { status } = await api("/api/nonexistent");
    assert.equal(status, 404, "unknown route should return 404");
  });
});

/* ================================================================
 *  8. Response format consistency
 * ================================================================ */
describe("Response format", () => {
  it("success responses have { success: true, data }", async () => {
    const { body } = await api("/api/trips?limit=1");
    assert.equal(body.success, true);
    assert.ok("data" in body);
  });

  it("error responses have { success: false, message }", async () => {
    const { body } = await api("/api/trips?limit=abc");
    assert.equal(body.success, false);
    assert.ok(typeof body.message === "string", "error should have a message string");
  });
});
