import { useState } from "react";
import { Badge } from "../ui/badge";
import { getFeedbackForUser, listAllFeedback, type Feedback } from "../../api/adminApi";

function formatDate(s: string) {
  return new Date(s).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function renderStars(rating: number | null) {
  if (rating === null) return "—";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function FeedbackView() {
  const [mode, setMode] = useState<"user" | "all">("all");
  const [userIdInput, setUserIdInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"" | "rating" | "report">("");

  async function handleLoadAll() {
    setLoading(true);
    setError(null);
    setSearched(true);
    const res = await listAllFeedback(typeFilter || undefined);
    setLoading(false);
    if (res.ok) {
      setFeedback(res.data);
    } else {
      setError(res.message);
      setFeedback([]);
    }
  }

  async function handleSearchUser(e: React.FormEvent) {
    e.preventDefault();
    const id = userIdInput.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    const res = await getFeedbackForUser(id);
    setLoading(false);
    if (res.ok) {
      setFeedback(res.data);
    } else {
      setError(res.message);
      setFeedback([]);
    }
  }

  const filtered = typeFilter && mode === "user"
    ? feedback.filter((f) => f.type === typeFilter)
    : feedback;

  const ratingCount = feedback.filter((f) => f.type === "rating").length;
  const reportCount = feedback.filter((f) => f.type === "report").length;
  const avgRating =
    ratingCount > 0
      ? (feedback.filter((f) => f.type === "rating" && f.rating !== null).reduce((sum, f) => sum + (f.rating ?? 0), 0) / ratingCount).toFixed(1)
      : "—";

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">Feedback</h1>
        <p className="dash-desc">View all ratings and reports, or look up a specific user.</p>
      </div>

      <div className="um-toolbar">
        <div className="flex gap-2">
          <button type="button" onClick={() => { setMode("all"); setSearched(false); }} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${mode === "all" ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
            All feedback
          </button>
          <button type="button" onClick={() => { setMode("user"); setSearched(false); setFeedback([]); }} className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all ${mode === "user" ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"}`}>
            By user ID
          </button>
        </div>

        {mode === "all" && (
          <>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | "rating" | "report")}
              className="um-filter"
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              <option value="rating">Ratings</option>
              <option value="report">Reports</option>
            </select>
            <button type="button" onClick={handleLoadAll} disabled={loading} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50">
              {loading ? "Loading…" : "Load"}
            </button>
          </>
        )}
      </div>

      {mode === "user" && (
        <form className="um-toolbar" onSubmit={handleSearchUser}>
          <input type="text" placeholder="Enter user ID..." value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} className="um-search" aria-label="User ID" />
          <button type="submit" disabled={loading || !userIdInput.trim()} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-500 text-white cursor-pointer disabled:opacity-50">
            {loading ? "Searching…" : "Look up"}
          </button>
          {searched && feedback.length > 0 && (
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "" | "rating" | "report")} className="um-filter" aria-label="Filter by type">
              <option value="">All ({feedback.length})</option>
              <option value="rating">Ratings ({ratingCount})</option>
              <option value="report">Reports ({reportCount})</option>
            </select>
          )}
        </form>
      )}

      {error && <p className="um-panel__error" role="alert">{error}</p>}

      {searched && !loading && feedback.length > 0 && (
        <div className="dash-grid-three" style={{ marginBottom: "1rem" }}>
          <div className="dash-card"><div className="dash-card__body"><p className="rs-metric__label">Total Feedback</p><p className="rs-metric__value">{feedback.length}</p></div></div>
          <div className="dash-card"><div className="dash-card__body"><p className="rs-metric__label">Average Rating</p><p className="rs-metric__value">{avgRating}</p></div></div>
          <div className="dash-card"><div className="dash-card__body"><p className="rs-metric__label">Reports</p><p className="rs-metric__value">{reportCount}</p></div></div>
        </div>
      )}

      {searched && !loading && (
        <div className="dash-card">
          <div className="dash-card__body um-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Trip</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="um-table__empty">{feedback.length === 0 ? "No feedback found." : "No feedback matches the filter."}</td></tr>
                ) : (
                  filtered.map((f) => (
                    <tr key={f.id}>
                      <td><Badge variant={f.type === "report" ? "destructive" : "default"}>{f.type === "rating" ? "Rating" : "Report"}</Badge></td>
                      <td>{f.fromUser?.name ?? f.fromUserId.slice(0, 8)}</td>
                      <td>{f.toUser?.name ?? f.toUserId.slice(0, 8)}</td>
                      <td className="feedback-stars">{f.type === "rating" ? renderStars(f.rating) : "—"}</td>
                      <td className="feedback-comment">{f.comment ?? "—"}</td>
                      <td>{f.tripId ? f.tripId.slice(0, 8) + "…" : "—"}</td>
                      <td>{formatDate(f.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
