import { useState, useCallback, useEffect } from "react";
import type { User, UserRole, UserStatus } from "./types";
import UserDetailPanel from "./UserDetailPanel";
import { listUsers, banUser, unbanUser } from "../../api/adminApi";
import { Badge } from "../ui/badge";

const PAGE_SIZE = 10;
const ROLES: UserRole[] = ["passenger", "driver", "admin"];
const STATUSES: UserStatus[] = ["active", "pending", "deactivated"];
const SEARCH_DEBOUNCE_MS = 300;

type SortKey = "name" | "email" | "role" | "createdAt" | "";
type SortDir = "asc" | "desc";

function formatDate(s: string) {
  return new Date(s).toLocaleDateString();
}

export default function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    setListError(null);

    listUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      page: page + 1,
      limit: PAGE_SIZE,
      sortBy: sortKey || "createdAt",
      sortOrder: sortDir,
    })
      .then((result) => {
        if (cancelled) return;
        setListLoading(false);
        if (result.ok) {
          setUsers(result.data.users);
          setTotal(result.data.total);
        } else {
          setListError(result.message);
          setUsers([]);
          setTotal(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setListLoading(false);
          setListError("Failed to load users");
          setUsers([]);
          setTotal(0);
        }
      });
    return () => { cancelled = true; };
  }, [search, roleFilter, statusFilter, sortKey, sortDir, page]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }, [sortKey]);

  const handleStatusChange = useCallback(async (userId: string, action: "ban" | "unban") => {
    setApiError(null);
    setStatusLoading(true);
    const result = action === "ban" ? await banUser({ userId }) : await unbanUser({ userId });
    setStatusLoading(false);
    if (result.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, banned: action === "ban", status: action === "ban" ? ("deactivated" as UserStatus) : ("active" as UserStatus) }
            : u
        )
      );
      setSelectedUser((u) =>
        u && u.id === userId
          ? { ...u, banned: action === "ban", status: action === "ban" ? ("deactivated" as UserStatus) : ("active" as UserStatus) }
          : u
      );
    } else {
      setApiError(result.message);
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCSV = useCallback(() => {
    const headers = ["Name", "Email", "Phone", "Role", "Status", "Banned", "Created"];
    const rows = users.map((u) =>
      [u.name, u.email, u.phone, u.role, u.status, u.banned, u.createdAt].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [users]);

  const SortIcon = ({ column }: { column: SortKey }) =>
    sortKey === column ? (sortDir === "asc" ? <span> ↑</span> : <span> ↓</span>) : null;

  return (
    <>
      <div className="dash-heading">
        <h1 className="dash-title">User Management</h1>
        <p className="dash-desc">View and manage all platform users.</p>
      </div>
      <div className="um-toolbar">
        <input
          type="search"
          placeholder="Search by name..."
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setPage(0); }}
          className="um-search"
          aria-label="Search users"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter((e.target.value || "") as UserRole | ""); setPage(0); }}
          className="um-filter"
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter((e.target.value || "") as UserStatus | ""); setPage(0); }}
          className="um-filter"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={exportCSV} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
          Export CSV
        </button>
      </div>

      {listError && <p className="um-panel__error" role="alert">{listError}</p>}

      <div className="dash-card">
        <div className="dash-card__body um-table-wrap">
          {listLoading ? (
            <p className="um-table__empty">Loading users…</p>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th><button type="button" className="um-th" onClick={() => handleSort("name")}>Name<SortIcon column="name" /></button></th>
                  <th><button type="button" className="um-th" onClick={() => handleSort("email")}>Email<SortIcon column="email" /></button></th>
                  <th><button type="button" className="um-th">Phone</button></th>
                  <th><button type="button" className="um-th" onClick={() => handleSort("role")}>Role<SortIcon column="role" /></button></th>
                  <th><button type="button" className="um-th">Status</button></th>
                  <th><button type="button" className="um-th" onClick={() => handleSort("createdAt")}>Registered<SortIcon column="createdAt" /></button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={7} className="um-table__empty">No users match your filters.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "—"}</td>
                      <td><Badge variant="secondary">{u.role}</Badge></td>
                      <td>
                        <Badge variant={u.banned ? "destructive" : u.status === "active" ? "default" : "secondary"}>
                          {u.banned ? "Banned" : u.status}
                        </Badge>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setSelectedUser(u)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        {!listLoading && total > 0 && (
          <div className="um-pagination">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer">
              Previous
            </button>
            <span className="um-pagination__info">Page {page + 1} of {totalPages} ({total} users)</span>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 cursor-pointer">
              Next
            </button>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => { setSelectedUser(null); setApiError(null); }}
          onStatusChange={(userId, action) => handleStatusChange(userId, action)}
          apiError={apiError}
          loading={statusLoading}
        />
      )}
    </>
  );
}
