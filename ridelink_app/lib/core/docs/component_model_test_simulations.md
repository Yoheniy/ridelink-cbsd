# Component Model Test Simulations (CBSD)

This note records concrete simulations that validate component swappability in the RideLink mobile app.

## Simulation 1: Search component (implemented)

### Goal
Prove that `SearchProvider` does not depend on REST directly and can run with a non-HTTP repository.

### Setup
- Interface: `SearchRepository`
- Production implementation: `ApiSearchRepository`
- Simulation implementation: `InMemorySearchRepository`

### Files
- `lib/features/passenger/search/repositories/search_repository.dart`
- `lib/features/passenger/search/repositories/in_memory_search_repository.dart`
- `lib/features/passenger/search/providers/search_provider.dart`

### Procedure
1. Build a static list of `TripModel` values.
2. Inject `InMemorySearchRepository` into `SearchProvider`.
3. Call `searchTrips(origin, destination)`.
4. Observe that:
   - provider state transitions (`loading`, `error`, `searchResults`) still work
   - filtering/sorting/recommendation logic still runs unchanged
   - no API call is required

### Result
`SearchProvider` behavior remains valid when the repository is swapped. This confirms the Search component's required interface is stable and composable in X-MAN terms.

## Simulation 2: Trip component (planned)

Replace `ApiTripRepository` with an in-memory fake returning fixed trip and booking payloads; verify trip list rendering and status updates in provider state.

## Simulation 3: Booking component (planned)

Replace `ApiBookingRepository` with a fake repository to validate booking request/cancel flows independently from network availability.

