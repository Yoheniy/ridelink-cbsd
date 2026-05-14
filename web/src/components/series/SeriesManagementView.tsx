import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "../ui/badge";
import SeriesDetailPanel from "./SeriesDetailPanel";
import { listSeries, deactivateSeries, type TripSeries } from "../../api/adminApi";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDays(days: number[]) {
  return days.slice().sort((a, b) => a - b).map((d) => DAY_NAMES[d] ?? d).join(", ");
}

export default function SeriesManagementView() {
  const [allSeries, setAllSeries] = useState<TripSeries[]>([]);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TripSeries | null>(null);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listSeries({}).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) {
        setAllSeries(res.data.series);
      } else {
        setError(res.message);
        setAllSeries([]);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let result = allSeries;
    if (activeFilter === "true") result = result.filter((s) => s.isActive);
    if (activeFilter === "false") result = result.filter((s) => !s.isActive);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          (s.driver?.user?.name ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [allSeries, activeFilter, search]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDeactivate = useCallback(async (seriesId: string) => {
    setDeactivating(seriesId);
    const res = await deactivateSeries(seriesId);
    setDeactivating(null);
    if (res.ok) {
      setAllSeries((prev) => prev.map((s) => (s.id === seriesId ? { ...s, isActive: false } : s)));
    }
  }, []);

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">Trip Series</h1>
        <p className="dash-desc">Manage recurring trip schedules.</p>
      </div>

      <div className="um-toolbar">
        <input
          type="search"
          placeholder="Search by origin, destination, or driver..."
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
          className="um-search"
          aria-label="Search series"
        />
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as "" | "true" | "false"); setPage(0); }}
          className="um-filter"
          aria-label="Filter by status"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {error && <p className="um-panel__error" role="alert">{error}</p>}

      <div className="dash-card">
        <div className="dash-card__body um-table-wrap">
          {loading ? (
            <p className="um-table__empty">Loading series…</p>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Driver</th>
                  <th>Schedule</th>
                  <th>Time</th>
                  <th>Seats</th>
                  <th>Price/Seat</th>
                  <th>Trips</th>
                  <th>Subs</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={10} className="um-table__empty">No series match your filters.</td></tr>
                ) : (
                  paged.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span className="trip-route">{s.origin} → {s.destination}</span>
                        <span className="trip-distance">{s.distanceKm.toFixed(1)} km</span>
                      </td>
                      <td>{s.driver?.user?.name ?? "—"}</td>
                      <td>{formatDays(s.daysOfWeek)}</td>
                      <td>{s.departureTimeOfDay}</td>
                      <td>{s.availableSeats}</td>
                      <td>{s.pricePerSeat.toFixed(2)} ETB</td>
                      <td>{s._count?.trips ?? 0}</td>
                      <td>{s._count?.tripSubscriptions ?? 0}</td>
                      <td>
                        <Badge variant={s.isActive ? "default" : "secondary"}>
                          {s.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="um-actions-cell">
                        <button type="button" className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" onClick={() => setSelected(s)}>
                          View
                        </button>
                        {s.isActive && (
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50"
                            disabled={deactivating === s.id}
                            onClick={() => handleDeactivate(s.id)}
                          >
                            {deactivating === s.id ? "…" : "Deactivate"}
                          </button>
                        )}
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
            <span className="um-pagination__info">Page {page + 1} of {totalPages} ({total} series)</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 disabled:opacity-50 cursor-pointer">Next</button>
          </div>
        )}
      </div>

      <SeriesDetailPanel series={selected} onClose={() => setSelected(null)} />
    </>
  );
}
