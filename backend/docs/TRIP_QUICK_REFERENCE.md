# Trip API Quick Reference

## 🚀 Quick Start

### Base URL

```
http://localhost:5000/api/trips
```

## 📝 Common Operations

### 1. Create a Trip

```bash
POST /api/trips
```

```json
{
	"driverId": "uuid",
	"origin": "Downtown",
	"destination": "Airport",
	"routeCoordinates": [
		{ "lat": 37.7749, "lng": -122.4194 },
		{ "lat": 37.6199, "lng": -122.3749 }
	],
	"departureTime": "2026-03-03T08:00:00Z",
	"availableSeats": 3,
	"pricePerSeat": 15.5,
	"isSubscribable": false
}
```

**Note:** Distance is auto-calculated from coordinates. Price validated against 4 ETB/km cap.

### 2. Search Trips

```bash
GET /api/trips?origin=Downtown&destination=Airport&status=scheduled
```

### 3. Book a Trip

```bash
POST /api/trips/bookings
```

```json
{
	"tripId": "uuid",
	"passengerId": "uuid",
	"seatsBooked": 2
}
```

### 4. Update Trip Status

```bash
PATCH /api/trips/{tripId}/status
```

```json
{
	"status": "inProgress"
}
```

## 🔄 Status Transitions

| From       | To         | Valid |
| ---------- | ---------- | ----- |
| scheduled  | inProgress | ✅    |
| scheduled  | canceled   | ✅    |
| inProgress | completed  | ✅    |
| inProgress | canceled   | ✅    |
| completed  | \*         | ❌    |
| canceled   | \*         | ❌    |

## ⏰ Commuting Windows

**Valid departure times:**

- Morning: 6:00 AM - 10:00 AM
- Afternoon: 5:00 PM - 8:00 PM

## 🔍 Query Parameters

| Parameter         | Type     | Example                                   |
| ----------------- | -------- | ----------------------------------------- |
| origin            | string   | `?origin=Downtown`                        |
| destination       | string   | `?destination=Airport`                    |
| status            | enum     | `?status=scheduled`                       |
| departureTimeFrom | datetime | `?departureTimeFrom=2026-03-03T00:00:00Z` |
| departureTimeTo   | datetime | `?departureTimeTo=2026-03-03T23:59:59Z`   |
| minSeats          | number   | `?minSeats=2`                             |
| maxPrice          | number   | `?maxPrice=20.00`                         |
| isSubscribable    | boolean  | `?isSubscribable=true`                    |
| page              | number   | `?page=1`                                 |
| limit             | number   | `?limit=10`                               |

## 🎫 Subscription Options

### Create Subscribable Trip

```json
{
	"isSubscribable": true,
	"subscriptionOptions": ["weekly", "monthly"],
	"subscriptionPricing": {
		"weekly": 70.0,
		"monthly": 250.0
	}
}
```

### Create Subscription

```bash
POST /api/trips/subscriptions
```

```json
{
	"tripId": "uuid",
	"passengerId": "uuid",
	"subscriptionType": "monthly",
	"seatsSubscribed": 1,
	"startDate": "2026-03-03T00:00:00Z"
}
```

## ⚠️ Common Errors

| Error                       | Cause                                | Solution               |
| --------------------------- | ------------------------------------ | ---------------------- |
| Seat count exceeds capacity | `availableSeats > vehicleSeats`      | Reduce seats           |
| Invalid time window         | Departure outside 6-10 AM or 5-8 PM  | Adjust time            |
| Price exceeds cap           | `pricePerSeat > 4 ETB/km × distance` | Reduce price           |
| Not enough seats            | Booking > available seats            | Reduce booking         |
| Invalid transition          | Wrong status change                  | Follow state machine   |
| Trip not subscribable       | Trying to subscribe to regular trip  | Check `isSubscribable` |

## 💰 Pricing Rules

- **Platform Cap:** 4 ETB per kilometer
- **Calculation:** `maxPrice = distanceKm × 4`
- **Distance:** Auto-calculated from route coordinates

## 📊 Response Format

### Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error

```json
{
	"success": false,
	"message": "Error description",
	"data": null
}
```

## 🔑 Test Credentials (After Seeding)

```
Driver 1: driver@ridelink.com / Driver123!
Driver 2: sarah@ridelink.com / Driver123!
Passenger 1: passenger@ridelink.com / Passenger123!
Passenger 2: bob@ridelink.com / Bob123!
```

## 🛠️ Development Commands

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Start dev server
npm run dev

# View database
npm run db:studio
```

## ✅ Validations Summary

**Trip Creation:**

- ✅ Commuting windows: 6-10 AM or 5-8 PM
- ✅ Price cap: 4 ETB/km (auto-calculated from route)
- ✅ Seats ≤ driver's vehicle capacity
- ✅ Distance auto-calculated from coordinates
- ✅ Subscription pricing required if enabled
- ✅ Status set to "Scheduled" initially

**Trip Updates:**

- ✅ Only "scheduled" trips can be updated
- ✅ Price rechecked if route/price changes
- ✅ Cannot reduce seats below booked count

**Bookings:**

- ✅ Only "scheduled" trips can be booked
- ✅ Seat availability validated
- ✅ Price auto-calculated
