# Design patterns used in RideLink (mobile)

Short reference for CBSD / component-based documentation. Paths are under `lib/`.

## Repository Pattern

**Intent:** Hide where data comes from (REST, mock, cache) behind an interface so UI state classes stay small and testable.

| Interface | Implementation | Used by |
|-----------|----------------|---------|
| `TripRepository` | `ApiTripRepository` | `TripProvider` |
| `BookingRepository` | `ApiBookingRepository` | `BookingProvider` |
| `SearchRepository` | `ApiSearchRepository` | `SearchProvider` |
| `TripSeriesRepository` | `ApiTripSeriesRepository` | `TripSeriesProvider` |
| `FeedbackRepository` | `ApiFeedbackRepository` | `FeedbackProvider` |

**Files:** `features/driver/trip/repositories/`, `features/passenger/booking/repositories/`, `features/passenger/search/repositories/`, `features/feedback/repositories/`

`SearchProvider` still owns **geocoding** via `GebetaMapsService`; only the **GET /trips** query lives in `SearchRepository`.

## Observer Pattern

**Intent:** When state changes, dependent widgets update without polling.

- **Subject:** `ChangeNotifier` subclasses (`TripProvider`, `BookingProvider`, etc.).
- **Observers:** `Consumer`, `context.watch`, `Selector` from `provider`.

## Interceptor Pattern (HTTP)

**Intent:** Cross-cutting concerns on every request/response without duplicating code in each API call.

- `_AuthInterceptor`: attaches Bearer token from `StorageService`.
- `_ResponseUnwrapInterceptor`: unwraps `{ success, data }` envelope from the backend.

**File:** `core/network/api_client.dart`

## Dependency injection (composition root)

**Intent:** Construct services and repositories once in `main.dart`, inject into providers.

Repositories are created next to `ApiClient`, then passed into `TripProvider`, `BookingProvider`, `SearchProvider`, `TripSeriesProvider`, and `FeedbackProvider`.

**File:** `main.dart`

## Singleton (effective)

**Intent:** One HTTP client and shared services for the whole app.

`ApiClient`, `StorageService`, etc. are built once in `main()` and passed through `Provider.value`.
