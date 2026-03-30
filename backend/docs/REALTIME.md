# RideLink Realtime Architecture

## Overview

RideLink uses a **hybrid backend architecture**:

- **Express.js + PostgreSQL/Prisma** — REST API for auth, trips, bookings, payments
- **Convex Cloud** — All realtime features: location tracking, chat, notifications, SOS alerts, presence

Clients connect to **both** services directly.

## Authentication

There are two auth paths:

### 1. Client → Convex (JWT via better-auth)

Convex natively verifies JWTs issued by better-auth's `jwt()` plugin using JWKS (asymmetric ES256 keys). No custom verification code — Convex handles it cryptographically.

```
Client                    Express                   Convex
  |                         |                         |
  |---- login ------------->|                         |
  |<---- session cookie ----|                         |
  |                         |                         |
  |-- GET /api/auth/token ->|                         |
  |   (with session cookie) |                         |
  |<---- JWT (ES256) -------|                         |
  |   {sub, email, role}    |                         |
  |                         |                         |
  |-- convex query/mutation ----------------------->  |
  |   (JWT in auth header,  |              verifies JWT via
  |    via ConvexProviderWithAuth)         JWKS from Express
  |<---- realtime data --------------------------------|
```

- Express endpoints: `GET /api/auth/token` (issue JWT), `GET /api/auth/jwks` (public keys) — provided by better-auth `jwt()` plugin
- Convex `auth.config.ts` uses `customJwt` provider with `ES256` algorithm, pointing to Express's JWKS URL
- All Convex functions use `ctx.auth.getUserIdentity()` — no `token` argument
- Custom claims (`id`, `email`, `role`) from `definePayload` are accessible on the identity object

### 2. Express → Convex (API key via HTTP actions)

Server-to-server calls use a shared API key (no JWT needed — Express is a trusted caller).

```
Express                     Convex HTTP Action
  |                              |
  |-- POST /notifications/send ->|
  |   Header: X-API-Key         |
  |   Body: {recipientId, ...}  |-- validates API key
  |                              |-- calls internalMutation
  |<---- {success: true} --------|
```

- HTTP actions validate `X-API-Key` header against `CONVEX_INTERNAL_API_KEY` env var
- Then call `internalMutation` directly (bypasses all auth checks)
- Fire-and-forget: realtime failures do not block REST responses

## Data Ownership

| Data                             | Owner          | Storage    |
| -------------------------------- | -------------- | ---------- |
| Users, Trips, Bookings, Payments | Express/Prisma | PostgreSQL |
| Location updates                 | Convex         | Convex DB  |
| Chat conversations & messages    | Convex         | Convex DB  |
| Notifications                    | Convex         | Convex DB  |
| Emergency/SOS alerts             | Convex         | Convex DB  |
| User presence/online status      | Convex         | Convex DB  |

Convex references PostgreSQL IDs (User.id, Trip.id, etc.) as strings but does **not** duplicate full records.

## Express → Convex Bridge

When REST events need to trigger realtime updates, Express calls Convex HTTP actions:

| Event                    | Convex HTTP Endpoint         | Effect                        |
| ------------------------ | ---------------------------- | ----------------------------- |
| Booking confirmed        | `POST /conversations/create` | Creates driver-passenger chat |
| Booking confirmed        | `POST /notifications/send`   | Notifies driver of booking    |
| Trip started             | `POST /location/start`       | Initializes location tracking |
| Trip completed/cancelled | `POST /location/stop`        | Stops location tracking       |
| Trip status change       | `POST /notifications/send`   | Notifies booked passengers    |

The Express-side wrapper is `src/services/convex-realtime.service.ts`. All calls are **fire-and-forget** — realtime failures do not block REST responses.

## Convex File Structure

```
convex/
├── schema.ts              # DB schema (6 tables)
├── auth.ts                # Auth helpers (getAuthInfo, requireAuth, requireRole)
├── auth.config.ts         # Convex auth config (customJwt + JWKS)
├── http.ts                # HTTP router (Express→Convex bridge, API key auth)
├── locationMutations.ts   # Location: start/stop/update tracking
├── locationQueries.ts     # Location: get latest, history
├── chatMutations.ts       # Chat: create conversation, send/read messages
├── chatQueries.ts         # Chat: get conversations, messages
├── notificationMutations.ts  # Notifications: create, mark read
├── notificationQueries.ts    # Notifications: list, unread count
├── emergencyMutations.ts  # SOS: trigger, cancel, resolve
├── emergencyQueries.ts    # SOS: active alerts, history
├── presenceMutations.ts   # Presence: update online status
├── presenceQueries.ts     # Presence: get user/bulk status
├── crons.ts               # Scheduled cleanup jobs
└── cronCleanup.ts         # Cleanup mutations (stale presence, old data)
```

## Setup

### Environment Variables

#### Express `.env`:

```
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=http://localhost:5000
CONVEX_URL=https://<your-deployment>.convex.cloud
CONVEX_INTERNAL_API_KEY=<shared-api-key-for-express-to-convex>
```

#### Convex environment variables (set via Convex dashboard):

```
BETTER_AUTH_URL=http://localhost:5000    # (or production URL) — used by auth.config.ts for JWKS URL
CONVEX_INTERNAL_API_KEY=<same-key>      # Must match the Express side
```

### Database Migration

The better-auth `jwt()` plugin requires a `jwks` table in PostgreSQL:

```bash
pnpm db:push   # or pnpm db:migrate
```

### First-Time Setup

```bash
# 1. Log in to Convex Cloud
npx convex login

# 2. Initialize the project (creates convex.json with deployment URL)
npx convex dev

# 3. This generates the _generated/ directory and deploys your schema

# 4. Set Convex environment variables in the Convex dashboard
```

### Development

```bash
# Run Convex dev server (watches for changes, syncs to cloud)
pnpm convex:dev

# Run Express dev server (in a separate terminal)
pnpm dev
```

### Deployment

```bash
pnpm convex:deploy
```

## Cron Jobs

| Job                     | Frequency         | Purpose                                          |
| ----------------------- | ----------------- | ------------------------------------------------ |
| Clean stale presence    | Every 2 min       | Mark users offline if no heartbeat for 5 min     |
| Clean old location data | Every 1 hour      | Delete completed tracking records older than 24h |
| Clean old notifications | Daily 3:00 AM UTC | Delete read notifications older than 30 days     |
