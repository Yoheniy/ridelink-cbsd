# Figma + Stitch Interconnection Notes (CBSD Friday)

This document captures design-to-component traceability for the CBSD process log.

## Design inputs

- Figma design: add your file/frame links here
- Stitch project: `https://stitch.withgoogle.com/projects/12155015757702587928`

## Interconnection table

| Design Screen/Frame | RideLink UI Screen | Component Package/Module | API / Realtime Integration | Notes |
|---|---|---|---|---|
| Passenger Search Results | `SearchResultsScreen` | `features/passenger/search/` | `GET /trips` (scheduled) | Uses SearchProvider ranking/filtering |
| Driver Detail | `DriverDetailScreen` | `features/passenger/search/` + trip model | `GET /trips/:id` | Booking call-to-action starts here |
| Booking Confirm | `BookingConfirmScreen` | `features/passenger/booking/` | `POST /trips/bookings` | Uses BookingRepository |
| Live Tracking | `LiveTrackingScreen` | `features/tracking/` | Convex location subscriptions | Driver broadcast + passenger subscribe |
| Chat | `ChatScreen` | `features/chat/` | Convex chat queries/mutations | Realtime conversation by trip/booking |
| SOS | `SOSScreen` | `features/emergency/` | Convex emergency functions | Trigger/cancel/resolve alert flow |
| Admin Dashboard Panel | `web/src/pages/Dashboard.tsx` | `web/src/components/*` | Admin REST endpoints + analytics feed | Imported from `RideLinkGC/web` branch `yabets` |

## Component-based interpretation

1. Design assets are mapped to **feature boundaries**, not just pages.
2. Shared design blocks map to reusable component areas:
   - Mobile shared widgets: `lib/core/widgets/`
   - Web reusable UI: `web/src/components/ui/`
   - Monorepo shared examples: `monorepo/packages/ui-components/`
3. Integration points are explicit:
   - REST integration for CRUD flows (trips/bookings/profile)
   - Convex integration for realtime (tracking/chat/notifications/SOS)

## Evidence checklist for process log

- [ ] Figma frame links pasted in Google Doc
- [ ] Stitch link included in Google Doc
- [ ] Interconnection table pasted in Google Doc
- [ ] One screenshot from Stitch/Figma included
- [ ] One paragraph on how design informed component boundaries

