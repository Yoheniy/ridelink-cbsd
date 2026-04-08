const API = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; message: string };
type ApiResult<T> = ApiOk<T> | ApiErr;

/**
 * The backend wraps every response in { success, data, message }.
 * This helper unwraps it and maps to our ApiResult<T> type.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API}${path}`, { credentials: "include", ...init });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: body?.message ?? `Error ${res.status}` };
    }
    if (body?.success === false) {
      return { ok: false, message: body.message ?? "Request failed" };
    }
    return { ok: true, data: (body?.data ?? body) as T };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

/* ─────────────────────────── Stats ─────────────────────────── */

export type DashboardStats = {
  users: { total: number; drivers: number; passengers: number; active: number; banned: number };
  trips: { total: number; active: number; completed: number };
  bookings: { total: number };
  feedback: { ratings: number; reports: number };
  incidents: { open: number };
};

export async function getStats() {
  return apiFetch<DashboardStats>("/api/admin/stats");
}

/* ─────────────────────────── Config ─────────────────────────── */

export type CommutingWindow = { start: number; end: number };

export type AppConfig = {
  maxPricePerKm: number;
  commutingWindows: CommutingWindow[];
};

export async function getConfig() {
  return apiFetch<AppConfig>("/api/admin/config");
}

export async function updateConfig(data: Partial<AppConfig>) {
  return apiFetch<AppConfig>("/api/admin/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/* ─────────────────────────── Users ─────────────────────────── */
/* User listing is provided by Better Auth's admin plugin at /api/auth/admin/list-users */

export type UserRole = "admin" | "passenger" | "driver";
export type UserStatus = "active" | "pending" | "deactivated";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  role: UserRole;
  status: UserStatus;
  rating: number;
  banned: boolean;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
  image?: string | null;
};

type ListUsersParams = {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

export async function listUsers(params: ListUsersParams) {
  const qs = new URLSearchParams();
  const limit = params.limit ?? 10;
  const page = params.page ?? 1;
  qs.set("limit", String(limit));
  qs.set("offset", String((page - 1) * limit));

  if (params.search) {
    qs.set("searchField", "name");
    qs.set("searchValue", params.search);
    qs.set("searchOperator", "contains");
  }
  if (params.sortBy) {
    qs.set("sortBy", params.sortBy);
    qs.set("sortDirection", params.sortOrder === "asc" ? "asc" : "desc");
  }
  if (params.role) {
    qs.set("filterField", "role");
    qs.set("filterValue", params.role);
    qs.set("filterOperator", "eq");
  }

  try {
    const res = await fetch(`${API}/api/auth/admin/list-users?${qs}`, { credentials: "include" });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false as const, message: body?.message ?? `Error ${res.status}` };
    }
    const users: User[] = body?.users ?? [];
    const total: number = body?.total ?? users.length;
    return { ok: true as const, data: { users, total } };
  } catch (e) {
    return { ok: false as const, message: e instanceof Error ? e.message : "Network error" };
  }
}

export async function banUser(params: { userId: string; banReason?: string }) {
  return apiFetch<unknown>("/api/admin/ban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function unbanUser(params: { userId: string }) {
  return apiFetch<unknown>("/api/admin/unban", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/* ─────────────────────────── Trips ─────────────────────────── */

export type TripStatus = "scheduled" | "inProgress" | "completed" | "canceled";

export type Trip = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: TripStatus;
  seriesId?: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    licenseNumber: string;
    vehicleModel: string;
    vehiclePlate: string;
    vehicleSeats: number;
    user?: { id: string; name: string; email?: string; phone?: string; rating?: number; image?: string | null };
  };
  _count?: { bookings?: number };
};

type ListTripsParams = {
  status?: string;
  origin?: string;
  destination?: string;
  page?: number;
  limit?: number;
};

export async function listTrips(params: ListTripsParams) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.origin) qs.set("origin", params.origin);
  if (params.destination) qs.set("destination", params.destination);
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  return apiFetch<{ trips: Trip[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
    `/api/trips?${qs}`
  );
}

export async function getTripById(tripId: string) {
  return apiFetch<Trip>(`/api/trips/${tripId}`);
}

export async function updateTrip(tripId: string, data: Partial<Pick<Trip, "origin" | "destination" | "availableSeats" | "pricePerSeat" | "departureTime">>) {
  return apiFetch<Trip>(`/api/trips/${tripId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateTripStatus(tripId: string, status: TripStatus) {
  return apiFetch<Trip>(`/api/trips/${tripId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function deleteTrip(tripId: string) {
  return apiFetch<unknown>(`/api/trips/${tripId}`, { method: "DELETE" });
}

export async function getDriverTrips(driverId: string) {
  return apiFetch<Trip[]>(`/api/trips/drivers/${driverId}/trips`);
}

export async function getPassengerBookings(passengerId: string) {
  return apiFetch<Booking[]>(`/api/trips/passengers/${passengerId}/bookings`);
}

/* ─────────────────────────── Bookings ─────────────────────────── */

export type BookingStatus = "pending" | "confirmed" | "canceled" | "completed";

export type Booking = {
  id: string;
  tripId: string;
  seatsBooked: number;
  totalPrice: number;
  pickUpPoint?: string | null;
  dropOffPoint?: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  passenger?: {
    id: string;
    user?: { id: string; name: string; email?: string; phone?: string };
  };
};

export async function getTripBookings(tripId: string, status?: string) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Booking[]>(`/api/trips/${tripId}/bookings${qs}`);
}

export async function acceptBooking(bookingId: string) {
  return apiFetch<Booking>(`/api/trips/bookings/${bookingId}/accept`, { method: "PATCH" });
}

export async function declineBooking(bookingId: string) {
  return apiFetch<Booking>(`/api/trips/bookings/${bookingId}/decline`, { method: "PATCH" });
}

export async function cancelBooking(bookingId: string) {
  return apiFetch<Booking>(`/api/trips/bookings/${bookingId}/cancel`, { method: "PATCH" });
}

/* ─────────────────────────── Series ─────────────────────────── */

export type TripSeries = {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  daysOfWeek: number[];
  departureTimeOfDay: string;
  availableSeats: number;
  pricePerSeat: number;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  subscriptionOptions: string[];
  createdAt: string;
  updatedAt: string;
  driver?: {
    id: string;
    vehicleModel: string;
    vehiclePlate: string;
    user?: { id: string; name: string; rating?: number; image?: string | null };
  };
  _count?: { trips?: number; tripSubscriptions?: number };
};

export async function listSeries(params: { isActive?: boolean; page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params.isActive !== undefined) qs.set("isActive", String(params.isActive));
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));

  return apiFetch<{ series: TripSeries[]; pagination: { total: number } }>(`/api/series?${qs}`);
}

export async function getSeriesById(seriesId: string) {
  return apiFetch<TripSeries>(`/api/series/${seriesId}`);
}

export async function deactivateSeries(seriesId: string) {
  return apiFetch<TripSeries>(`/api/series/${seriesId}/deactivate`, { method: "PATCH" });
}

export async function generateTripsFromSeries(seriesId: string, data: { startDate: string; endDate: string }) {
  return apiFetch<{ count: number }>(`/api/series/${seriesId}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export type TripSubscription = {
  id: string;
  seriesId: string;
  passengerId: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  passenger?: { id: string; user?: { id: string; name: string; email?: string; phone?: string } };
};

export async function getSeriesSubscriptions(seriesId: string) {
  return apiFetch<TripSubscription[]>(`/api/series/${seriesId}/subscriptions`);
}

export async function cancelSubscription(subscriptionId: string) {
  return apiFetch<TripSubscription>(`/api/series/subscriptions/${subscriptionId}/cancel`, { method: "PATCH" });
}

/* ─────────────────────────── Feedback ─────────────────────────── */

export type Feedback = {
  id: string;
  type: "rating" | "report";
  rating: number | null;
  comment: string | null;
  fromUserId: string;
  toUserId: string;
  tripId?: string | null;
  createdAt: string;
  fromUser?: { id: string; name: string; email?: string; image?: string | null };
  toUser?: { id: string; name: string; email?: string; image?: string | null };
};

export async function getFeedbackForUser(userId: string) {
  return apiFetch<Feedback[]>(`/api/feedback/${userId}`);
}

export async function listAllFeedback(type?: "rating" | "report") {
  const qs = type ? `?type=${type}` : "";
  return apiFetch<Feedback[]>(`/api/admin/feedback${qs}`);
}

/* ─────────────────────────── Incidents ─────────────────────────── */

export type IncidentAction =
  | "warning_issued"
  | "user_suspended"
  | "user_banned"
  | "case_dismissed"
  | "under_review"
  | "escalated"
  | "resolved";

export type IncidentStatus = "open" | "in_progress" | "closed";

export type Incident = {
  id: string;
  feedbackId?: string | null;
  sosAlertId?: string | null;
  sosReason?: string | null;
  action: IncidentAction;
  status: IncidentStatus;
  notes?: string | null;
  adminId: string;
  targetUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  admin?: { id: string; name: string; email: string };
  targetUser?: { id: string; name: string; email: string } | null;
  feedback?: Feedback | null;
};

export async function listIncidents(status?: IncidentStatus) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Incident[]>(`/api/admin/incidents${qs}`);
}

export async function getIncidentById(incidentId: string) {
  return apiFetch<Incident>(`/api/admin/incidents/${incidentId}`);
}

export async function createIncident(data: {
  action: IncidentAction;
  targetUserId?: string;
  feedbackId?: string;
  notes?: string;
}) {
  return apiFetch<Incident>("/api/admin/incidents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateIncident(
  incidentId: string,
  data: { action?: IncidentAction; status?: IncidentStatus; notes?: string }
) {
  return apiFetch<Incident>(`/api/admin/incidents/${incidentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/* ─────────────────────────── Documents ─────────────────────────── */

export type DocumentStatus = "PENDING" | "UPLOADING" | "UPLOADED" | "VERIFIED" | "REJECTED" | "DELETED";
export type DocumentType = "ID" | "LICENSE";

export type Document = {
  id: string;
  userId: string;
  type: DocumentType;
  s3Key: string;
  contentType?: string | null;
  size?: number | null;
  status: DocumentStatus;
  uploadedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
};

export async function listDocuments() {
  return apiFetch<Document[]>("/api/admin/documents");
}

export async function verifyDocument(documentId: string) {
  return apiFetch<Document>(`/api/admin/documents/${documentId}/verify`, {
    method: "POST",
  });
}

export async function getDocumentDownloadUrl(key: string) {
  return apiFetch<{ downloadUrl: string; expiresAt: string }>(
    `/api/files/download?key=${encodeURIComponent(key)}`
  );
}
