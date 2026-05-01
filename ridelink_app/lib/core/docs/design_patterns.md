# Design patterns used in RideLink (mobile)

Short reference for CBSD / component-based documentation. Paths are under `lib/`.

## Repository Pattern

**Intent:** Hide where data comes from (REST, mock, cache) behind an interface so UI state classes stay small and testable.

| Interface | Implementation | Used by |
|-----------|----------------|---------|
| `AuthRepository` | `ApiAuthRepository`, `InMemoryAuthRepository` | `AuthProvider` |
| `UserPreferenceRepository` | `ApiUserPreferenceRepository` | `UserPreferenceProvider` |
| `FeedbackRepository` | `ApiFeedbackRepository` | `FeedbackProvider` |

**Files:** `features/auth/repositories/`, `features/preferences/repositories/`, `features/feedback/repositories/`

Trip, booking, search, trip-series, and payment flows currently call `ApiClient` directly from their providers while staying aligned with the upstream app; additional repository extraction can follow the same pattern as auth and preferences.

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

Repositories are created next to `ApiClient`, then passed into `AuthProvider`, `UserPreferenceProvider`, and `FeedbackProvider` (and optionally swapped for simulations such as in-memory auth).

For component-model simulations, the composition root can switch `AuthRepository`
from `ApiAuthRepository` to `InMemoryAuthRepository` without changing
`AuthProvider`.

**File:** `main.dart`

## Singleton (effective)

**Intent:** One HTTP client and shared services for the whole app.

`ApiClient`, `StorageService`, etc. are built once in `main()` and passed through `Provider.value`.
