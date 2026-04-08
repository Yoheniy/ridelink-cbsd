import type { User } from "./types";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";

type UserDetailPanelProps = {
  user: User | null;
  onClose: () => void;
  onStatusChange: (userId: string, action: "ban" | "unban") => void;
  apiError?: string | null;
  loading?: boolean;
};

export default function UserDetailPanel({
  user,
  onClose,
  onStatusChange,
  apiError,
  loading = false,
}: UserDetailPanelProps) {
  if (!user) return null;

  return (
    <div className="um-panel" role="dialog" aria-modal="true" aria-labelledby="um-panel-title">
      <div className="um-panel__backdrop" onClick={onClose} aria-hidden />
      <div className="um-panel__content">
        <div className="um-panel__head">
          <h2 id="um-panel-title" className="um-panel__title">User details</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="um-panel__body">
          <dl className="um-panel__meta">
            <dt>Name</dt>
            <dd>{user.name}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Phone</dt>
            <dd>{user.phone || "—"}</dd>
            <dt>National ID</dt>
            <dd>{user.nationalId || "—"}</dd>
            <dt>Role</dt>
            <dd><Badge variant="secondary">{user.role}</Badge></dd>
            <dt>Status</dt>
            <dd>
              <Badge variant={user.banned ? "destructive" : user.status === "active" ? "default" : "secondary"}>
                {user.banned ? "Banned" : user.status}
              </Badge>
            </dd>
            <dt>Rating</dt>
            <dd>{user.rating > 0 ? `${user.rating.toFixed(1)} ★` : "No ratings"}</dd>
            <dt>Registered</dt>
            <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
            {user.banReason && (
              <>
                <dt>Ban reason</dt>
                <dd className="text-red-500">{user.banReason}</dd>
              </>
            )}
          </dl>

          {apiError && <p className="um-panel__error" role="alert">{apiError}</p>}

          <div className="um-panel__actions">
            {user.banned ? (
              <button type="button" disabled={loading} onClick={() => onStatusChange(user.id, "unban")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50">
                {loading ? "Please wait…" : "Unban user"}
              </button>
            ) : (
              <button type="button" disabled={loading} onClick={() => onStatusChange(user.id, "ban")} className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 cursor-pointer disabled:opacity-50">
                {loading ? "Please wait…" : "Ban user"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
