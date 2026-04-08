const SESSION_KEY = "ridelink-admin-session";
const SESSION_TTL_MS = 30 * 60 * 1000;

export type AdminUser = { name: string; email: string; role: string };

type Session = { token: string; expiresAt: number; user?: AdminUser };

function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasValidAdminSession(): boolean {
  const s = getSession();
  return s !== null && s.expiresAt > Date.now();
}

export function getAdminUser(): AdminUser | null {
  const s = getSession();
  if (!s || s.expiresAt <= Date.now()) return null;
  return s.user ?? null;
}

export function touchAdminSession(): void {
  const s = getSession();
  if (!s) return;
  s.expiresAt = Date.now() + SESSION_TTL_MS;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function saveAdminSession(token: string, user?: AdminUser): void {
  const session: Session = { token, expiresAt: Date.now() + SESSION_TTL_MS, user };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function logoutAdmin(): Promise<void> {
  const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
  try {
    await fetch(`${API}/api/auth/sign-out`, { method: "POST", credentials: "include" });
  } catch { /* ignore */ }
  clearAdminSession();
}
