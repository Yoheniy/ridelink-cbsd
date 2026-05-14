import { useState, useEffect, useCallback } from "react";
import { Badge } from "../ui/badge";
import {
  listTrips,
  getTripBookings,
  acceptBooking,
  declineBooking,
  cancelBooking,
  type Trip,
  type Booking,
  type BookingStatus,
} from "../../api/adminApi";

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  canceled: "Canceled",
  completed: "Completed",
};

function statusVariant(s: BookingStatus) {
  if (s === "confirmed" || s === "completed") return "default" as const;
  if (s === "canceled") return "destructive" as const;
  return "outline" as const;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const btnAction = "px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50";

export default function BookingsView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    listTrips({ limit: 100 }).then((res) => {
      setTripsLoading(false);
      if (res.ok) setTrips(res.data.trips);
    });
  }, []);

  const fetchBookings = useCallback(() => {
    if (!selectedTripId) { setBookings([]); return; }
    setBookingsLoading(true);
    setBookingsError(null);
    getTripBookings(selectedTripId, statusFilter || undefined).then((res) => {
      setBookingsLoading(false);
      if (res.ok) {
        setBookings(res.data);
      } else {
        setBookingsError(res.message);
        setBookings([]);
      }
    });
  }, [selectedTripId, statusFilter]);

  useEffect(fetchBookings, [fetchBookings]);

  const filtered = searchInput
    ? bookings.filter(
        (b) =>
          b.passenger?.user?.name?.toLowerCase().includes(searchInput.toLowerCase()) ||
          b.id.toLowerCase().includes(searchInput.toLowerCase()),
      )
    : bookings;

  const handleBookingAction = useCallback(async (bookingId: string, action: "accept" | "decline" | "cancel") => {
    setActionLoading(bookingId);
    const fn = action === "accept" ? acceptBooking : action === "decline" ? declineBooking : cancelBooking;
    const res = await fn(bookingId);
    setActionLoading(null);
    if (res.ok) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: res.data.status } : b)));
    }
  }, []);

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">Bookings</h1>
        <p className="dash-desc">Select a trip to view its bookings.</p>
      </div>

      <div className="um-toolbar">
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.target.value)}
          className="um-filter um-filter--wide"
          aria-label="Select trip"
          disabled={tripsLoading}
        >
          <option value="">{tripsLoading ? "Loading trips…" : "Select a trip"}</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.origin} → {t.destination} ({formatDate(t.departureTime)})
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter((e.target.value || "") as BookingStatus | "")}
          className="um-filter"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {(["pending", "confirmed", "canceled", "completed"] as BookingStatus[]).map((s) => (
            <option key={s} value={s}>{BOOKING_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Search by passenger name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="um-search"
          aria-label="Search bookings"
        />
      </div>

      {selectedTrip && (
        <div className="dash-card" style={{ marginBottom: "1rem" }}>
          <div className="dash-card__body">
            <span className="trip-route">{selectedTrip.origin} → {selectedTrip.destination}</span>
            <span className="trip-distance">{selectedTrip.distanceKm.toFixed(1)} km · {selectedTrip.availableSeats} seats · {selectedTrip.pricePerSeat.toFixed(2)} ETB/seat</span>
          </div>
        </div>
      )}

      {bookingsError && <p className="um-panel__error" role="alert">{bookingsError}</p>}

      <div className="dash-card">
        <div className="dash-card__body um-table-wrap">
          {!selectedTripId ? (
            <p className="um-table__empty">Select a trip above to view bookings.</p>
          ) : bookingsLoading ? (
            <p className="um-table__empty">Loading bookings…</p>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>Passenger</th>
                  <th>Phone</th>
                  <th>Seats</th>
                  <th>Total Price</th>
                  <th>Pickup</th>
                  <th>Dropoff</th>
                  <th>Status</th>
                  <th>Booked</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="um-table__empty">No bookings found.</td></tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id}>
                      <td>{b.passenger?.user?.name ?? "—"}</td>
                      <td>{b.passenger?.user?.phone ?? "—"}</td>
                      <td>{b.seatsBooked}</td>
                      <td>{b.totalPrice.toFixed(2)} ETB</td>
                      <td>{b.pickUpPoint ?? "—"}</td>
                      <td>{b.dropOffPoint ?? "—"}</td>
                      <td><Badge variant={statusVariant(b.status)}>{BOOKING_STATUS_LABEL[b.status]}</Badge></td>
                      <td>{formatDate(b.createdAt)}</td>
                      <td className="um-actions-cell">
                        {b.status === "pending" && (
                          <>
                            <button type="button" disabled={actionLoading === b.id} className={`${btnAction} bg-gradient-to-r from-primary-600 to-accent-500 text-white`} onClick={() => handleBookingAction(b.id, "accept")}>
                              {actionLoading === b.id ? "…" : "Accept"}
                            </button>
                            <button type="button" disabled={actionLoading === b.id} className={`${btnAction} bg-red-500 text-white hover:bg-red-600`} onClick={() => handleBookingAction(b.id, "decline")}>
                              Decline
                            </button>
                          </>
                        )}
                        {(b.status === "pending" || b.status === "confirmed") && (
                          <button type="button" disabled={actionLoading === b.id} className={`${btnAction} border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300`} onClick={() => handleBookingAction(b.id, "cancel")}>
                            Cancel
                          </button>
                        )}
                        {(b.status === "canceled" || b.status === "completed") && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
