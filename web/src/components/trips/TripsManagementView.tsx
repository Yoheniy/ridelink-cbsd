import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "../ui/badge";
import TripDetailPanel from "./TripDetailPanel";
import { listTrips, deleteTrip, type Trip, type TripStatus } from "../../api/adminApi";

const PAGE_SIZE = 10;
const STATUSES: TripStatus[] = ["scheduled", "inProgress", "completed", "canceled"];
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_LABEL: Record<TripStatus, string> = {
  scheduled: "Scheduled",
  inProgress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

function statusVariant(s: TripStatus) {
  if (s === "completed") return "default" as const;
  if (s === "canceled") return "destructive" as const;
  if (s === "inProgress") return "secondary" as const;
  return "outline" as const;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function TripsManagementView() {
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TripStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listTrips({ limit: 100 }).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setAllTrips(res.data.trips);
      } else {
        setError(res.message);
        setAllTrips([]);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = allTrips;
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.origin.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          (t.driver?.user?.name ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [allTrips, statusFilter, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = useCallback(async (tripId: string) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;
    setDeletingId(tripId);
    const res = await deleteTrip(tripId);
    setDeletingId(null);
    if (res.ok) {
      setAllTrips((prev) => prev.filter((t) => t.id !== tripId));
    }
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ["ID", "Origin", "Destination", "Driver", "Departure", "Seats", "Price/Seat", "Status"];
    const rows = filtered.map((t) =>
      [t.id, t.origin, t.destination, t.driver?.user?.name ?? "", t.departureTime, t.availableSeats, t.pricePerSeat, t.status].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trips-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">Trips &amp; Routes</h1>
        <p className="dash-desc">Browse, filter, and manage all trips.</p>
      </div>

      <div className="um-toolbar">
        <input
          type="search"
          placeholder="Search by origin, destination, or driver..."
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
          className="um-search"
          aria-label="Search trips"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter((e.target.value || "") as TripStatus | ""); setPage(0); }}
          className="um-filter"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <button type="button" onClick={exportCSV} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          Export CSV
        </button>
      </div>

      {error && <p className="um-panel__error" role="alert">{error}</p>}

      <div className="dash-card">
        <div className="dash-card__body um-table-wrap">
          {loading ? (
            <p className="um-table__empty">Loading trips…</p>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Departure</th>
                  <th>Seats</th>
                  <th>Price/Seat</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={8} className="um-table__empty">No trips match your filters.</td></tr>
                ) : (
                  paged.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="trip-route">{t.origin} → {t.destination}</span>
                        <span className="trip-distance">{t.distanceKm.toFixed(1)} km</span>
                      </td>
                      <td>{t.driver?.user?.name ?? "—"}</td>
                      <td>{formatDate(t.departureTime)}</td>
                      <td>{t.availableSeats}</td>
                      <td>{t.pricePerSeat.toFixed(2)} ETB</td>
                      <td>{t._count?.bookings ?? 0}</td>
                      <td><Badge variant={statusVariant(t.status)}>{STATUS_LABEL[t.status]}</Badge></td>
                      <td className="um-actions-cell">
                        <button type="button" className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => setSelectedTrip(t)}>
                          View
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === t.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
                          onClick={() => handleDelete(t.id)}
                        >
                          {deletingId === t.id ? "…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && total > 0 && (
          <div className="um-pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 cursor-pointer">Previous</button>
            <span className="um-pagination__info">Page {page + 1} of {totalPages} ({total} trips)</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 cursor-pointer">Next</button>
          </div>
        )}
      </div>

      <TripDetailPanel
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
        onStatusUpdated={(updated) => {
          setAllTrips((prev) => prev.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t)));
          setSelectedTrip(null);
        }}
      />
    </>
  );
}
