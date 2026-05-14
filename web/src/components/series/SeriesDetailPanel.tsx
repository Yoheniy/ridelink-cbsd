import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import {
  getSeriesSubscriptions,
  cancelSubscription,
  generateTripsFromSeries,
  type TripSeries,
  type TripSubscription,
} from "../../api/adminApi";

type Props = {
  series: TripSeries | null;
  onClose: () => void;
  onSeriesUpdated?: (s: TripSeries) => void;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDays(days: number[]) {
  return days.slice().sort((a, b) => a - b).map((d) => DAY_NAMES[d] ?? d).join(", ");
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const btnPrimary = "px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50";
const btnOutline = "px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer";
const inputClass = "px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm";

export default function SeriesDetailPanel({ series, onClose, onSeriesUpdated }: Props) {
  const [subs, setSubs] = useState<TripSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [genStartDate, setGenStartDate] = useState("");
  const [genEndDate, setGenEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (!series) return;
    setSubsLoading(true);
    getSeriesSubscriptions(series.id).then((res) => {
      setSubsLoading(false);
      if (res.ok) setSubs(res.data);
      else setSubs([]);
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 8);
    setGenStartDate(tomorrow.toISOString().slice(0, 10));
    setGenEndDate(nextWeek.toISOString().slice(0, 10));
    setGenResult(null);
    setGenError(null);
  }, [series?.id]);

  if (!series) return null;

  async function handleCancelSub(subId: string) {
    setCancellingId(subId);
    const res = await cancelSubscription(subId);
    setCancellingId(null);
    if (res.ok) {
      setSubs((prev) => prev.map((s) => (s.id === subId ? { ...s, status: "canceled" } : s)));
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenResult(null);
    setGenError(null);
    const res = await generateTripsFromSeries(series!.id, {
      startDate: new Date(genStartDate).toISOString(),
      endDate: new Date(genEndDate).toISOString(),
    });
    setGenerating(false);
    if (res.ok) {
      setGenResult(`Generated ${res.data.count} trip(s).`);
    } else {
      setGenError(res.message);
    }
  }

  return (
    <div className="um-panel" role="dialog" aria-modal="true" aria-labelledby="series-panel-title">
      <div className="um-panel__backdrop" onClick={onClose} aria-hidden />
      <div className="um-panel__content">
        <div className="um-panel__head">
          <h2 id="series-panel-title" className="um-panel__title">Series Details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="um-panel__body">
          <dl className="um-panel__meta">
            <dt>Route</dt>
            <dd>{series.origin} → {series.destination}</dd>
            <dt>Distance</dt>
            <dd>{series.distanceKm.toFixed(1)} km</dd>
            <dt>Driver</dt>
            <dd>{series.driver?.user?.name ?? "—"}</dd>
            <dt>Vehicle</dt>
            <dd>{series.driver?.vehicleModel ?? "—"} · {series.driver?.vehiclePlate ?? "—"}</dd>
            <dt>Days</dt>
            <dd>{formatDays(series.daysOfWeek)}</dd>
            <dt>Time</dt>
            <dd>{series.departureTimeOfDay}</dd>
            <dt>Seats</dt>
            <dd>{series.availableSeats}</dd>
            <dt>Price / Seat</dt>
            <dd>{series.pricePerSeat.toFixed(2)} ETB</dd>
            <dt>Status</dt>
            <dd>
              <Badge variant={series.isActive ? "default" : "secondary"}>
                {series.isActive ? "Active" : "Inactive"}
              </Badge>
            </dd>
            <dt>Start</dt>
            <dd>{formatDate(series.startDate)}</dd>
            {series.endDate && (
              <>
                <dt>End</dt>
                <dd>{formatDate(series.endDate)}</dd>
              </>
            )}
          </dl>

          {/* Generate trips */}
          {series.isActive && (
            <section className="um-panel__section">
              <h3 className="um-panel__section-title">Generate Trips</h3>
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">From</label>
                  <input type="date" value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">To</label>
                  <input type="date" value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} className={inputClass} />
                </div>
                <button type="button" disabled={generating || !genStartDate || !genEndDate} className={btnPrimary} onClick={handleGenerate}>
                  {generating ? "Generating…" : "Generate"}
                </button>
              </div>
              {genResult && <p className="text-sm text-eco-600 dark:text-eco-400">{genResult}</p>}
              {genError && <p className="um-panel__error" role="alert">{genError}</p>}
            </section>
          )}

          {/* Subscriptions */}
          <section className="um-panel__section">
            <h3 className="um-panel__section-title">
              Subscriptions ({subs.length})
            </h3>
            {subsLoading && <p className="um-table__empty">Loading subscriptions…</p>}
            {!subsLoading && subs.length === 0 && <p className="um-table__empty">No subscriptions for this series.</p>}
            {!subsLoading && subs.length > 0 && (
              <div className="um-table-wrap">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Start</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((sub) => (
                      <tr key={sub.id}>
                        <td>{sub.passenger?.user?.name ?? "—"}</td>
                        <td>{sub.type}</td>
                        <td>
                          <Badge variant={sub.status === "active" ? "default" : sub.status === "canceled" ? "destructive" : "secondary"}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td>{formatDate(sub.startDate)}</td>
                        <td>
                          {sub.status === "active" && (
                            <button
                              type="button"
                              disabled={cancellingId === sub.id}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-500 text-white cursor-pointer disabled:opacity-50"
                              onClick={() => handleCancelSub(sub.id)}
                            >
                              {cancellingId === sub.id ? "…" : "Cancel"}
                            </button>
                          )}
                          {sub.status !== "active" && <span className="text-xs text-slate-400">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Counts & Metadata */}
          <section className="um-panel__section">
            <h3 className="um-panel__section-title">Summary</h3>
            <ul className="um-panel__list">
              <li>Generated trips: <strong>{series._count?.trips ?? 0}</strong></li>
              <li>Active subscriptions: <strong>{series._count?.tripSubscriptions ?? 0}</strong></li>
              <li>Created: {formatDate(series.createdAt)}</li>
              <li>Updated: {formatDate(series.updatedAt)}</li>
            </ul>
          </section>

          {series.subscriptionOptions.length > 0 && (
            <section className="um-panel__section">
              <h3 className="um-panel__section-title">Subscription Options</h3>
              <ul className="um-panel__list">
                {series.subscriptionOptions.map((opt) => (
                  <li key={opt}>{opt}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
