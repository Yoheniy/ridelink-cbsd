# X-MAN style component view (RideLink mobile)

Use this section in the **Component Model Practice** tab of your Google Doc. X-MAN stresses **composition**: components expose **provided** interfaces and declare **required** interfaces; wiring is **exogenous** (outside the component, e.g. `main.dart`).

## Trip Management component

| Role | Content |
|------|--------|
| **Computation unit** | `TripProvider`: loading flags, selected trip, driver trip list, demo fallback |
| **Provided interface** | `loadDriverTrips`, `getTripById`, `createTrip`, `updateTripStatus`, `acceptBooking`, `declineBooking`, `loadTripBookings`, `updateTrip`, `deleteTrip` |
| **Required interface** | `TripRepository` (trip/booking HTTP), `StorageService` (driver id, demo mode) |
| **Exogenous connector** | `ChangeNotifierProvider` in `main.dart` injects `ApiTripRepository(apiClient)` + `storageService` |

**Why Repository fits X-MAN:** `TripRepository` is a **replaceable** required interface. You can swap `ApiTripRepository` with a mock in tests or a cached implementation without changing `TripProvider`.

## Booking component

| Role | Content |
|------|--------|
| **Computation unit** | `BookingProvider`: list of bookings, active booking, error string |
| **Provided interface** | `loadBookings`, `requestBooking`, `getBookingById`, `cancelBooking` |
| **Required interface** | `BookingRepository`, `StorageService` (passenger id, demo mode) |
| **Exogenous connector** | `ChangeNotifierProvider` in `main.dart` injects `ApiBookingRepository(apiClient)` + `storageService` |

## Commute preferences component

| Role | Content |
|------|--------|
| **Computation unit** | `UserPreferenceProvider`: load/save nested commute preference from profile |
| **Provided interface** | `loadFromMe`, `savePreference` |
| **Required interface** | `UserPreferenceRepository` (`/users/me` read + profile patch for preference payload) |
| **Exogenous connector** | `ChangeNotifierProvider` in `main.dart` injects `ApiUserPreferenceRepository(apiClient)` |

## Driver payouts component

| Role | Content |
|------|--------|
| **Computation unit** | `PayoutProvider`: payout history list, payout account upsert, loading/error flags |
| **Provided interface** | `loadPayouts`, `upsertAccount` |
| **Required interface** | `PayoutRepository` (driver payouts list + payout account endpoints) |
| **Exogenous connector** | `ChangeNotifierProvider` in `main.dart` injects `ApiPayoutRepository(apiClient)` |

## Component model test simulation (idea for your log)

- **Simulation A:** Replace `ApiTripRepository` with a fake that returns fixed `TripModel` lists; `TripProvider` should still update UI state without knowing HTTP.
- **Simulation B:** Same for `BookingRepository` and passenger booking flows.
- **Simulation C (implemented):** Search supports an `InMemorySearchRepository` that satisfies `SearchRepository`, demonstrating provider behavior is preserved without network I/O.
- **Simulation D (implemented):** Auth supports an `InMemoryAuthRepository` that satisfies `AuthRepository`, demonstrating login/register state flow remains valid without backend auth endpoints.

Documenting these swaps in your Google Doc satisfies “component model test simulations.”
