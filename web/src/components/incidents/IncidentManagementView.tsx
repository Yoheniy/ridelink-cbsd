import { useState, useEffect, useCallback } from "react";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import {
  listIncidents,
  createIncident,
  updateIncident,
  type Incident,
  type IncidentAction,
  type IncidentStatus,
} from "../../api/adminApi";

const ACTIONS: IncidentAction[] = ["under_review", "warning_issued", "user_suspended", "user_banned", "case_dismissed", "escalated", "resolved"];
const STATUSES: IncidentStatus[] = ["open", "in_progress", "closed"];

const ACTION_LABEL: Record<IncidentAction, string> = {
  warning_issued: "Warning Issued",
  user_suspended: "User Suspended",
  user_banned: "User Banned",
  case_dismissed: "Case Dismissed",
  under_review: "Under Review",
  escalated: "Escalated",
  resolved: "Resolved",
};

function statusVariant(s: IncidentStatus) {
  if (s === "closed") return "default" as const;
  if (s === "open") return "destructive" as const;
  return "secondary" as const;
}

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const btnPrimary = "px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50";
const btnOutline = "px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer";
const btnGhost = "px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer";
const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 text-sm";

export default function IncidentManagementView() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "">("");

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);

  const fetchIncidents = useCallback(() => {
    setLoading(true);
    setError(null);
    listIncidents(statusFilter || undefined).then((res) => {
      setLoading(false);
      if (res.ok) setIncidents(res.data);
      else { setError(res.message); setIncidents([]); }
    });
  }, [statusFilter]);

  useEffect(fetchIncidents, [fetchIncidents]);

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">Incidents</h1>
        <p className="dash-desc">Manage safety incidents, reviews, and bans.</p>
      </div>

      <div className="um-toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter((e.target.value || "") as IncidentStatus | "")}
          className="um-filter"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <button type="button" className={btnPrimary} onClick={() => setShowCreate(true)}>
          + New Incident
        </button>
      </div>

      {error && <p className="um-panel__error" role="alert">{error}</p>}

      <div className="dash-card">
        <div className="dash-card__body um-table-wrap">
          {loading ? (
            <p className="um-table__empty">Loading incidents…</p>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Target User</th>
                  <th>Admin</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 ? (
                  <tr><td colSpan={7} className="um-table__empty">No incidents found.</td></tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td>{ACTION_LABEL[inc.action] ?? inc.action}</td>
                      <td>{inc.targetUser?.name ?? "—"}</td>
                      <td>{inc.admin?.name ?? "—"}</td>
                      <td><Badge variant={statusVariant(inc.status)}>{inc.status.replace("_", " ")}</Badge></td>
                      <td className="max-w-[200px] truncate">{inc.notes ?? "—"}</td>
                      <td>{formatDate(inc.createdAt)}</td>
                      <td>
                        <button type="button" className={btnGhost} onClick={() => setSelected(inc)}>
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateIncidentPanel
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchIncidents(); }}
        />
      )}

      {selected && (
        <IncidentDetailPanel
          incident={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

function CreateIncidentPanel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [action, setAction] = useState<IncidentAction>("under_review");
  const [targetUserId, setTargetUserId] = useState("");
  const [feedbackId, setFeedbackId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const res = await createIncident({
      action,
      targetUserId: targetUserId || undefined,
      feedbackId: feedbackId || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (res.ok) onCreated();
    else setError(res.message);
  }

  return (
    <div className="um-panel" role="dialog" aria-modal="true">
      <div className="um-panel__backdrop" onClick={onClose} aria-hidden />
      <div className="um-panel__content">
        <div className="um-panel__head">
          <h2 className="um-panel__title">Create Incident</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="um-panel__body space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value as IncidentAction)} className={inputClass}>
              {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target User ID (optional)</label>
            <input type="text" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} placeholder="UUID" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Feedback ID (optional)</label>
            <input type="text" value={feedbackId} onChange={(e) => setFeedbackId(e.target.value)} placeholder="UUID" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
          </div>
          {error && <p className="um-panel__error" role="alert">{error}</p>}
          <div className="flex gap-3">
            <button type="button" disabled={saving} className={btnPrimary} onClick={handleCreate}>
              {saving ? "Creating…" : "Create Incident"}
            </button>
            <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentDetailPanel({ incident, onClose, onUpdated }: { incident: Incident; onClose: () => void; onUpdated: (i: Incident) => void }) {
  const [action, setAction] = useState(incident.action);
  const [status, setStatus] = useState(incident.status);
  const [notes, setNotes] = useState(incident.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    setSaving(true);
    setError(null);
    const res = await updateIncident(incident.id, {
      action: action !== incident.action ? action : undefined,
      status: status !== incident.status ? status : undefined,
      notes: notes !== (incident.notes ?? "") ? notes : undefined,
    });
    setSaving(false);
    if (res.ok) onUpdated(res.data);
    else setError(res.message);
  }

  return (
    <div className="um-panel" role="dialog" aria-modal="true">
      <div className="um-panel__backdrop" onClick={onClose} aria-hidden />
      <div className="um-panel__content">
        <div className="um-panel__head">
          <h2 className="um-panel__title">Incident Details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="um-panel__body space-y-4">
          <dl className="um-panel__meta">
            <dt>ID</dt><dd className="text-xs">{incident.id}</dd>
            <dt>Admin</dt><dd>{incident.admin?.name ?? "—"} ({incident.admin?.email ?? ""})</dd>
            <dt>Target</dt><dd>{incident.targetUser?.name ?? "—"} ({incident.targetUser?.email ?? ""})</dd>
            <dt>Created</dt><dd>{formatDate(incident.createdAt)}</dd>
            <dt>Updated</dt><dd>{formatDate(incident.updatedAt)}</dd>
            {incident.feedbackId && (<><dt>Feedback</dt><dd className="text-xs">{incident.feedbackId}</dd></>)}
          </dl>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value as IncidentAction)} className={inputClass}>
              {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as IncidentStatus)} className={inputClass}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputClass} />
          </div>
          {error && <p className="um-panel__error" role="alert">{error}</p>}
          <div className="flex gap-3">
            <button type="button" disabled={saving} className={btnPrimary} onClick={handleUpdate}>
              {saving ? "Saving…" : "Update Incident"}
            </button>
            <button type="button" className={btnOutline} onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
