import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import {
  updateTripStatus,
  getTripBookings,
  acceptBooking,
  declineBooking,
  cancelBooking,
  type Trip,
  type TripStatus,
  type Booking,
  type BookingStatus,
} from "../../api/adminApi";

type Props = {
  trip: Trip | null;
  onClose: () => void;
  onStatusUpdated: (trip: Trip) => void;
};

const STATUS_LABEL: Record<TripStatus, string> = {
  scheduled: "Scheduled",
  inProgress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

function statusVariant(s: string) {
  if (s === "completed" || s === "confirmed") return "default" as const;
  if (s === "canceled") return "destructive" as const;
  if (s === "inProgress") return "secondary" as const;
  return "outline" as const;
}

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  canceled: "Canceled",
  completed: "Completed",
};

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function TripDetailPanel({ trip, onClose, onStatusUpdated }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [bookingActionId, setBookingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!trip) return;
    setBookingsLoading(true);
    setBookingsError(null);
    getTripBookings(trip.id).then((res) => {
      setBookingsLoading(false);
      if (res.ok) {
        setBookings(res.data);
      } else {
        setBookingsError(res.message);
        setBookings([]);
      }
    });
  }, [trip?.id]);

  if (!trip) return null;

  const canCancel = trip.status === "scheduled" || trip.status === "inProgress";
  const canComplete = trip.status === "inProgress";
  const canStart = trip.status === "scheduled";

  async function handleBookingAction(bookingId: string, action: "accept" | "decline" | "cancel") {
    setBookingActionId(bookingId);
    const fn = action === "accept" ? acceptBooking : action === "decline" ? declineBooking : cancelBooking;
    const res = await fn(bookingId);
    setBookingActionId(null);
    if (res.ok) {
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: res.data.status } : b)));
    }
  }

  async function handleStatusChange(newStatus: TripStatus) {
    setApiError(null);
    setStatusLoading(true);
    const res = await updateTripStatus(trip!.id, newStatus);
    setStatusLoading(false);
    if (res.ok) {
      onStatusUpdated({ ...trip!, status: newStatus });
    } else {
      setApiError(res.message);
    }
  }

  return (
    <div className="um-panel" role="dialog" aria-modal="true" aria-labelledby="trip-panel-title">
      <div className="um-panel__backdrop" onClick={onClose} aria-hidden />
      <div className="um-panel__content">
        <div className="um-panel__head">
          <h2 id="trip-panel-title" className="um-panel__title">Trip Details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="um-panel__body">
          <dl className="um-panel__meta">
            <dt>Route</dt>
            <dd>{trip.origin} → {trip.destination}</dd>
            <dt>Distance</dt>
            <dd>{trip.distanceKm.toFixed(1)} km</dd>
            <dt>Driver</dt>
            <dd>{trip.driver?.user?.name ?? "—"}</dd>
            <dt>Vehicle</dt>
            <dd>{trip.driver?.vehicleModel ?? "—"} · {trip.driver?.vehiclePlate ?? "—"}</dd>
            <dt>Departure</dt>
            <dd>{formatDate(trip.departureTime)}</dd>
            <dt>Seats</dt>
            <dd>{trip.availableSeats}</dd>
            <dt>Price / Seat</dt>
            <dd>{trip.pricePerSeat.toFixed(2)} ETB</dd>
            <dt>Status</dt>
            <dd><Badge variant={statusVariant(trip.status)}>{STATUS_LABEL[trip.status]}</Badge></dd>
            {trip.seriesId && (
              <>
                <dt>Series</dt>
                <dd className="text-primary-500">{trip.seriesId.slice(0, 8)}…</dd>
              </>
            )}
            <dt>Created</dt>
            <dd>{formatDate(trip.createdAt)}</dd>
          </dl>

          <section className="um-panel__section">
            <h3 className="um-panel__section-title">Bookings ({bookings.length})</h3>
            {bookingsLoading && <p className="um-table__empty">Loading bookings…</p>}
            {bookingsError && <p className="um-panel__error" role="alert">{bookingsError}</p>}
            {!bookingsLoading && bookings.length === 0 && !bookingsError && (
              <p className="um-table__empty">No bookings for this trip.</p>
            )}
            {!bookingsLoading && bookings.length > 0 && (
              <div className="um-table-wrap">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Seats</th>
                      <th>Total</th>
                      <th>Pickup</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td>{b.passenger?.user?.name ?? "—"}</td>
                        <td>{b.seatsBooked}</td>
                        <td>{b.totalPrice.toFixed(2)} ETB</td>
                        <td>{b.pickUpPoint ?? "—"}</td>
                        <td><Badge variant={statusVariant(b.status)}>{BOOKING_STATUS_LABEL[b.status] ?? b.status}</Badge></td>
                        <td className="um-actions-cell">
                          {b.status === "pending" && (
                            <>
                              <button type="button" disabled={bookingActionId === b.id} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50" onClick={() => handleBookingAction(b.id, "accept")}>Accept</button>
                              <button type="button" disabled={bookingActionId === b.id} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500 text-white cursor-pointer disabled:opacity-50" onClick={() => handleBookingAction(b.id, "decline")}>Decline</button>
                            </>
                          )}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <button type="button" disabled={bookingActionId === b.id} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-white/10 text-slate-500 cursor-pointer disabled:opacity-50" onClick={() => handleBookingAction(b.id, "cancel")}>Cancel</button>
                          )}
                          {(b.status === "canceled" || b.status === "completed") && <span className="text-xs text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {apiError && <p className="um-panel__error" role="alert">{apiError}</p>}

          <div className="um-panel__actions">
            {canStart && (
              <button type="button" disabled={statusLoading} onClick={() => handleStatusChange("inProgress")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50">
                {statusLoading ? "Updating…" : "Start Trip"}
              </button>
            )}
            {canComplete && (
              <button type="button" disabled={statusLoading} onClick={() => handleStatusChange("completed")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50">
                {statusLoading ? "Updating…" : "Complete Trip"}
              </button>
            )}
            {canCancel && (
              <button type="button" disabled={statusLoading} onClick={() => handleStatusChange("canceled")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50">
                {statusLoading ? "Updating…" : "Cancel Trip"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
