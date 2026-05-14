import { useState } from "react";
import { Badge } from "../ui/badge";
import {
  updateConfig,
  updateIncident,
  type AppConfig,
  type Incident,
  type IncidentStatus,
} from "../../api/adminApi";

type Props = {
  config: AppConfig | null;
  onConfigUpdated: (c: AppConfig) => void;
  incidents: Incident[];
  onIncidentsUpdated: (list: Incident[]) => void;
};

const btnPrimary = "px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50";
const btnOutline = "px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer";

function incidentStatusVariant(s: IncidentStatus) {
  if (s === "closed") return "default" as const;
  if (s === "open") return "destructive" as const;
  return "secondary" as const;
}

export default function ConfigurationSection({ config, onConfigUpdated, incidents, onIncidentsUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [maxPrice, setMaxPrice] = useState(config?.maxPricePerKm ?? 0);
  const [windows, setWindows] = useState(config?.commutingWindows ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  function startEdit() {
    setMaxPrice(config?.maxPricePerKm ?? 0);
    setWindows(config?.commutingWindows ?? []);
    setEditing(true);
    setError(null);
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updateConfig({ maxPricePerKm: maxPrice, commutingWindows: windows });
    setSaving(false);
    if (res.ok) {
      onConfigUpdated(res.data);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.message);
    }
  }

  async function resolveIncident(id: string) {
    setResolvingId(id);
    const res = await updateIncident(id, { status: "closed", action: "resolved" });
    setResolvingId(null);
    if (res.ok) {
      onIncidentsUpdated(incidents.filter((inc) => inc.id !== id));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Configuration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">System and app configuration. Values fetched from the server.</p>
        </div>
        {!editing && (
          <button type="button" className={btnOutline} onClick={startEdit}>Edit Config</button>
        )}
      </div>

      {success && (
        <div className="rounded-2xl border border-eco-500/30 bg-eco-500/10 p-4 text-sm text-eco-600 dark:text-eco-400">
          Configuration updated successfully.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!editing ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 flex flex-col gap-2">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Price cap</p>
            <p className="font-display font-bold text-xl text-primary-600 dark:text-primary-400">
              {config ? `${config.maxPricePerKm} ETB/km` : "—"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Maximum fare per kilometer</p>
          </div>
          {(config?.commutingWindows ?? []).map((w, i) => (
            <div key={i} className="glass rounded-2xl p-6 flex flex-col gap-2">
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                {i === 0 ? "Morning window" : "Afternoon window"}
              </p>
              <p className="font-display font-bold text-xl text-primary-600 dark:text-primary-400">
                {w.start}:00 – {w.end}:00
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trips accepted in this window</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Max Price Per Km (ETB)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          {windows.map((w, i) => (
            <div key={i} className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {i === 0 ? "Morning window start (hour)" : "Afternoon window start (hour)"}
                </label>
                <input
                  type="number" min={0} max={23} value={w.start}
                  onChange={(e) => {
                    const copy = [...windows];
                    copy[i] = { ...copy[i], start: Number(e.target.value) };
                    setWindows(copy);
                  }}
                  className="w-24 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End (hour)</label>
                <input
                  type="number" min={0} max={23} value={w.end}
                  onChange={(e) => {
                    const copy = [...windows];
                    copy[i] = { ...copy[i], end: Number(e.target.value) };
                    setWindows(copy);
                  }}
                  className="w-24 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" disabled={saving} className={btnPrimary} onClick={handleSave}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" className={btnOutline} onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {incidents.length > 0 && (
        <>
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mt-6">Open Incidents</h2>
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="glass rounded-2xl p-5 flex flex-wrap items-center gap-4">
                <Badge variant={incidentStatusVariant(inc.status)}>{inc.status}</Badge>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{inc.action.replace(/_/g, " ")}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400 flex-1">
                  {inc.notes ?? "No notes"}
                  {inc.targetUser ? ` · ${inc.targetUser.name}` : ""}
                </span>
                <button
                  type="button"
                  disabled={resolvingId === inc.id}
                  className={btnPrimary}
                  onClick={() => resolveIncident(inc.id)}
                >
                  {resolvingId === inc.id ? "Resolving…" : "Resolve"}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
