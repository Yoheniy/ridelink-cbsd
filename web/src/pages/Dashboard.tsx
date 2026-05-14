import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutAdmin, getAdminUser } from "../auth/adminAuth";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import DashboardTopbar from "../components/layout/DashboardTopbar";
import NotificationBell from "../components/modals/NotificationBell";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import type { NavGroup } from "../components/layout/DashboardSidebar";
import {
  MetricCard,
  DateRangeSelect,
  HealthIndicator,
} from "../components/analytics";
import DonutChart from "../components/analytics/DonutChart";
import VerticalBarChart from "../components/analytics/VerticalBarChart";
import RadialChart from "../components/analytics/RadialChart";
import ProgressGauge from "../components/analytics/ProgressGauge";
import UserManagementView from "../components/users/UserManagementView";
import TripsManagementView from "../components/trips/TripsManagementView";
import BookingsView from "../components/bookings/BookingsView";
import SeriesManagementView from "../components/series/SeriesManagementView";
import FeedbackView from "../components/feedback/FeedbackView";
import IncidentManagementView from "../components/incidents/IncidentManagementView";
import ConfigurationSection from "../components/config/ConfigurationSection";
import DocumentsManagementView from "../components/documents/DocumentsManagementView";
import { cn } from "@/lib/utils";
import {
  getStats,
  getConfig,
  updateConfig,
  listIncidents,
  type DashboardStats,
  type AppConfig,
  type Incident,
} from "../api/adminApi";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CarFront,
  FileCheck,
  MapPin,
  CalendarCheck,
  Repeat2,
  MessageSquare,
  AlertTriangle,
  Wallet,
  Settings,
  User,
  LogOut,
  Search,
} from "lucide-react";

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

type Section =
  | "overview"
  | "analytics"
  | "users"
  | "drivers"
  | "documents"
  | "trips"
  | "bookings"
  | "series"
  | "feedback"
  | "incidents"
  | "finance"
  | "configuration";

const NAV_GROUPS: Array<NavGroup<Section>> = [
  {
    items: [
      { key: "overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
    ],
  },
  {
    label: "Management",
    items: [
      { key: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
      { key: "users", label: "Users", icon: <Users size={16} /> },
      { key: "drivers", label: "Drivers", icon: <CarFront size={16} /> },
      { key: "documents", label: "Documents", icon: <FileCheck size={16} /> },
      { key: "trips", label: "Trips & Routes", icon: <MapPin size={16} /> },
      { key: "bookings", label: "Bookings", icon: <CalendarCheck size={16} /> },
      { key: "series", label: "Trip Series", icon: <Repeat2 size={16} /> },
      { key: "feedback", label: "Feedback", icon: <MessageSquare size={16} /> },
      { key: "incidents", label: "Incidents", icon: <AlertTriangle size={16} /> },
      { key: "finance", label: "Finance & Support", icon: <Wallet size={16} /> },
    ],
  },
  {
    label: "System",
    items: [
      { key: "configuration", label: "Configuration", icon: <Settings size={16} /> },
    ],
  },
];

const PENDING_DRIVERS = [
  { name: "Elias M.", license: "ET-892341", vehicle: "Corolla 2018" },
  { name: "Betelhem A.", license: "ET-102938", vehicle: "Vitz 2015" },
  { name: "Yoseph K.", license: "ET-564738", vehicle: "Yaris 2020" },
];

const LIVE_TRIPS = [
  { id: "TR-8923", driver: "Dawit T.", route: "Piazza → Bole", seats: "2/4", status: "In Progress" },
  { id: "TR-8924", driver: "Sara K.", route: "Megenagna → CMC", seats: "1/4", status: "In Progress" },
  { id: "TR-8925", driver: "Alemayehu S.", route: "Autobus Tera → Saris", seats: "4/4", status: "Scheduled" },
];

const COMPLAINTS = [
  { title: "Overcharged passenger", reportedBy: "Meron H.", against: "Dawit T." },
  { title: "Reckless driving", reportedBy: "Yonatan F.", against: "Abel M." },
];

const CHART_COLORS = {
  primary: "#0ccfed",
  secondary: "#afd0ce",
  accent: "#74beb9",
  eco: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

function buildUserDonut(s: DashboardStats) {
  return [
    { name: "Drivers", value: s.users.drivers, color: CHART_COLORS.primary },
    { name: "Passengers", value: s.users.passengers, color: CHART_COLORS.secondary },
    { name: "Banned", value: s.users.banned, color: CHART_COLORS.danger },
  ];
}

function buildTripBars(s: DashboardStats) {
  return [
    { name: "Completed", value: s.trips.completed, color: CHART_COLORS.eco },
    { name: "Active", value: s.trips.active, color: CHART_COLORS.primary },
    { name: "Total", value: s.trips.total, color: CHART_COLORS.accent },
  ];
}

function buildFeedbackRadial(s: DashboardStats) {
  return [
    { name: "Bookings", value: s.bookings.total, fill: CHART_COLORS.accent },
    { name: "Ratings", value: s.feedback.ratings, fill: CHART_COLORS.eco },
    { name: "Reports", value: s.feedback.reports, fill: CHART_COLORS.warning },
    { name: "Incidents", value: s.incidents.open, fill: CHART_COLORS.danger },
  ];
}

function buildGauges(s: DashboardStats) {
  const completionRate = s.trips.total > 0 ? (s.trips.completed / s.trips.total) * 100 : 0;
  const banRate = s.users.total > 0 ? (s.users.banned / s.users.total) * 100 : 0;
  const reportRatio = s.feedback.ratings > 0 ? (s.feedback.reports / s.feedback.ratings) * 100 : 0;
  const activeRate = s.users.total > 0 ? (s.users.active / s.users.total) * 100 : 0;
  const bookingRate = s.trips.total > 0 ? (s.bookings.total / s.trips.total) * 100 : 0;

  return [
    { label: "Trip completion rate", value: `${completionRate.toFixed(1)}%`, pct: completionRate, color: CHART_COLORS.eco },
    { label: "Active user rate", value: `${activeRate.toFixed(1)}%`, pct: activeRate, color: CHART_COLORS.primary },
    { label: "Bookings per trip", value: `${bookingRate.toFixed(1)}%`, pct: Math.min(bookingRate, 100), color: CHART_COLORS.accent },
    { label: "Reports per 100 ratings", value: reportRatio.toFixed(2), pct: Math.min(reportRatio, 100), color: CHART_COLORS.warning },
    { label: "Ban rate", value: `${banRate.toFixed(2)}%`, pct: Math.min(banRate * 10, 100), color: CHART_COLORS.danger },
  ];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [dateRange, setDateRange] = useState(getDefaultDateRange);
  const [notifications, setNotifications] = useState<string[]>([]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLive, setIsLive] = useState(false);

  const adminUser = getAdminUser();
  const displayName = adminUser?.name ?? "Admin";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    getStats().then((res) => {
      if (res.ok) { setStats(res.data); setIsLive(true); }
    });
    getConfig().then((res) => {
      if (res.ok) setConfig(res.data);
    });
    listIncidents("open").then((res) => {
      if (res.ok) setIncidents(res.data);
    });
  }, []);

  const onLogout = async () => {
    await logoutAdmin();
    navigate("/login");
  };

  const exportReports = () => {
    const s = stats;
    const rows = [
      "Metric,Value",
      `Total Users,${s?.users.total ?? 0}`,
      `Active Users,${s?.users.active ?? 0}`,
      `Drivers,${s?.users.drivers ?? 0}`,
      `Passengers,${s?.users.passengers ?? 0}`,
      `Banned Users,${s?.users.banned ?? 0}`,
      `Total Trips,${s?.trips.total ?? 0}`,
      `Active Trips,${s?.trips.active ?? 0}`,
      `Completed Trips,${s?.trips.completed ?? 0}`,
      `Total Bookings,${s?.bookings.total ?? 0}`,
      `Feedback Ratings,${s?.feedback.ratings ?? 0}`,
      `Feedback Reports,${s?.feedback.reports ?? 0}`,
      `Open Incidents,${s?.incidents.open ?? 0}`,
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platform-analytics-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const t = setInterval(() => {
      setUnread((c) => c + 1);
      setNotifications((n) => ["Live surge in Bole district", ...n].slice(0, 8));
    }, 8000);
    return () => clearInterval(t);
  }, []);

  const cardClass = "glass rounded-2xl overflow-hidden";
  const cardHeaderClass = "flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5";
  const cardBodyClass = "p-6";
  const titleClass = "font-display font-bold text-base text-slate-900 dark:text-white";
  const descClass = "text-xs text-slate-400 mt-0.5";
  const btnOutline = "px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer";
  const btnDanger = "px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer";
  const btnGhost = "px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer";
  const tableClass = "w-full text-sm";
  const thClass = "text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider";
  const tdClass = "px-5 py-3.5";
  const trClass = "border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <DashboardSidebar
        logoText="RideLink Admin"
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        navGroups={NAV_GROUPS}
        activeKey={section}
        onSelect={setSection}
        onLogout={onLogout}
      />

      <div className={cn("transition-all duration-300", collapsed ? "ml-[68px]" : "ml-[240px]")}>
        <DashboardTopbar
          brandName="RideLink Admin"
          searchId="dash-search"
          searchPlaceholder="Search users, trips, vehicles..."
          searchIcon={<Search size={16} />}
          userName={displayName}
          userRole={adminUser?.role ?? "Admin"}
          rightActions={
            <NotificationBell
              prefix="dash"
              unreadCount={unread}
              onToggle={() => { setNotifOpen((o) => !o); setUnread(0); }}
            />
          }
          avatarSlot={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="cursor-pointer" aria-label="Open profile menu">
                  <Avatar className="w-9 h-9">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary-500 to-accent-500 text-white">{initials}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem><User size={14} className="mr-2" /> Profile</DropdownMenuItem>
                <DropdownMenuItem><Settings size={14} className="mr-2" /> Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}><LogOut size={14} className="mr-2" /> Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
          notifications={notifOpen ? notifications : undefined}
          showNotifications={notifOpen}
        />

        <main className="p-6 space-y-6">
          {/* ── Overview ── */}
          {section === "overview" && (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Overview</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor system activity, active trips, and pending actions.</p>
                </div>
                <button type="button" className={btnOutline} onClick={exportReports}>Export Report</button>
              </div>

              {/* SOS Alert */}
              {incidents.length > 0 && (
                <div className="rounded-2xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20 p-5 flex flex-wrap items-center gap-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">Open Incidents</span>
                  <span className="font-display font-bold text-2xl text-red-600 dark:text-red-400">{incidents.length}</span>
                  <p className="flex-1 text-sm text-red-700 dark:text-red-300">
                    {incidents[0].notes || `Incident ${incidents[0].action.replace(/_/g, " ")}`}
                    {incidents[0].targetUser ? ` · ${incidents[0].targetUser.name}` : ""}
                  </p>
                  <button type="button" className={btnDanger} onClick={() => setSection("configuration")}>View Details</button>
                </div>
              )}

              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Users", value: stats ? stats.users.total.toLocaleString() : "—" },
                  { label: "Active Trips", value: stats ? stats.trips.active.toLocaleString() : "—", sub: stats ? `${stats.users.drivers} drivers` : undefined },
                  { label: "Total Bookings", value: stats ? stats.bookings.total.toLocaleString() : "—" },
                  { label: "Open Incidents", value: stats ? stats.incidents.open.toLocaleString() : "—", sub: stats ? `${stats.feedback.reports} reports` : undefined },
                ].map((m) => (
                  <div key={m.label} className="glass rounded-2xl p-5">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{m.label}</p>
                    <p className="font-display font-bold text-2xl mt-1 text-slate-900 dark:text-white">{m.value}</p>
                    {m.sub && <p className="text-[11px] text-eco-500 mt-1">{m.sub}</p>}
                  </div>
                ))}
              </div>

              {!isLive && (
                <div className="glass rounded-2xl p-4 text-sm text-slate-500 dark:text-slate-400 text-center">
                  Showing placeholder data. Connect as admin to see live stats.
                </div>
              )}

              {/* Finance links */}
              <div className="flex gap-3">
                {["Payments", "Subscriptions"].map((l) => (
                  <span key={l} className="text-sm font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">{l}</span>
                ))}
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">
                  Disputes <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold">4</span>
                </span>
              </div>

              {/* Two-column grid */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Live trip monitoring */}
                <div className={cardClass}>
                  <div className={cardHeaderClass}>
                    <div>
                      <h2 className={titleClass}>Live Trip Monitoring</h2>
                      <p className={descClass}>84 Active Drivers Tracking</p>
                    </div>
                    <button type="button" className={btnOutline}>View Full Map</button>
                  </div>
                  <div className={cn(cardBodyClass, "flex items-center justify-center h-48 bg-slate-50 dark:bg-white/[0.02]")}>
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-eco-500 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                      <span className="text-sm ml-2">Live view</span>
                    </div>
                  </div>
                </div>

                {/* Pending verifications */}
                <div className={cardClass}>
                  <div className={cardHeaderClass}>
                    <h2 className={titleClass}>Pending Driver Verifications</h2>
                    <button type="button" className={btnGhost} onClick={() => setSection("documents")}>View All</button>
                  </div>
                  <div className={cardBodyClass}>
                    <div className="space-y-3">
                      {PENDING_DRIVERS.map((d) => (
                        <div key={d.name} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.name}</p>
                            <p className="text-xs text-slate-400">License: {d.license} · {d.vehicle}</p>
                          </div>
                          <button type="button" className={btnOutline} onClick={() => setSection("documents")}>Review</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live trips table */}
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <h2 className={titleClass}>Active Trips</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className={tableClass}>
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/5">
                        {["Trip ID", "Driver", "Route", "Seats", "Status"].map((h) => (
                          <th key={h} className={thClass}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {LIVE_TRIPS.map((t) => (
                        <tr key={t.id} className={trClass}>
                          <td className={cn(tdClass, "font-medium text-slate-900 dark:text-white")}>#{t.id}</td>
                          <td className={cn(tdClass, "text-slate-600 dark:text-slate-300")}>{t.driver}</td>
                          <td className={cn(tdClass, "text-slate-600 dark:text-slate-300")}>{t.route}</td>
                          <td className={cn(tdClass, "text-slate-600 dark:text-slate-300")}>{t.seats}</td>
                          <td className={tdClass}>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent complaints */}
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <h2 className={titleClass}>Recent Complaints</h2>
                  <button type="button" className={btnGhost}>View All (4)</button>
                </div>
                <div className={cardBodyClass}>
                  <div className="space-y-3">
                    {COMPLAINTS.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.title}</p>
                          <p className="text-xs text-slate-400">Reported by: {c.reportedBy} against {c.against}</p>
                        </div>
                        <button type="button" className={btnOutline}>Review</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Analytics ── */}
          {section === "analytics" && (
            <>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Platform Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time metrics from the platform database.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <DateRangeSelect
                  start={dateRange.start}
                  end={dateRange.end}
                  onStartChange={(v) => setDateRange((r) => ({ ...r, start: v }))}
                  onEndChange={(v) => setDateRange((r) => ({ ...r, end: v }))}
                  className="flex gap-3"
                />
                <button type="button" className={btnOutline} onClick={exportReports}>Export Report</button>
              </div>

              {!stats ? (
                <div className="glass rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">
                  Loading analytics data...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard label="Total users" value={stats.users.total.toLocaleString()} />
                    <MetricCard label="Active users" value={stats.users.active.toLocaleString()} />
                    <MetricCard label="Drivers" value={stats.users.drivers.toLocaleString()} />
                    <MetricCard label="Passengers" value={stats.users.passengers.toLocaleString()} />
                    <MetricCard label="Total trips" value={stats.trips.total.toLocaleString()} />
                    <MetricCard label="Completed trips" value={stats.trips.completed.toLocaleString()} />
                    <MetricCard label="Active trips" value={stats.trips.active.toLocaleString()} />
                    <MetricCard label="Total bookings" value={stats.bookings.total.toLocaleString()} />
                    <MetricCard label="Feedback ratings" value={stats.feedback.ratings.toLocaleString()} />
                    <MetricCard label="Feedback reports" value={stats.feedback.reports.toLocaleString()} />
                    <MetricCard label="Open incidents" value={stats.incidents.open.toLocaleString()} />
                    <MetricCard label="Banned users" value={stats.users.banned.toLocaleString()} />
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <HealthIndicator label="API" status={isLive ? "healthy" : "critical"} value={isLive ? "Connected" : "Offline"} />
                    <HealthIndicator label="Database" status={isLive ? "healthy" : "warning"} value={isLive ? "OK" : "N/A"} />
                    <HealthIndicator label="Incidents" status={stats.incidents.open > 5 ? "critical" : stats.incidents.open > 0 ? "warning" : "healthy"} value={`${stats.incidents.open} open`} />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className={cardClass}>
                      <div className={cardHeaderClass}>
                        <div>
                          <h2 className={titleClass}>User distribution</h2>
                          <p className={descClass}>Breakdown by role</p>
                        </div>
                      </div>
                      <div className={cardBodyClass}>
                        <DonutChart data={buildUserDonut(stats)} centerLabel="Total users" />
                      </div>
                    </div>
                    <div className={cardClass}>
                      <div className={cardHeaderClass}>
                        <div>
                          <h2 className={titleClass}>Trip breakdown</h2>
                          <p className={descClass}>Completed, active, and total trips</p>
                        </div>
                      </div>
                      <div className={cardBodyClass}>
                        <VerticalBarChart data={buildTripBars(stats)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className={cardClass}>
                      <div className={cardHeaderClass}>
                        <div>
                          <h2 className={titleClass}>Feedback &amp; safety</h2>
                          <p className={descClass}>Bookings, ratings, reports, and incidents</p>
                        </div>
                      </div>
                      <div className={cardBodyClass}>
                        <RadialChart data={buildFeedbackRadial(stats)} />
                      </div>
                    </div>
                    <div className={cardClass}>
                      <div className={cardHeaderClass}>
                        <div>
                          <h2 className={titleClass}>Platform health</h2>
                          <p className={descClass}>Key ratios derived from live data</p>
                        </div>
                      </div>
                      <div className={cardBodyClass}>
                        <ProgressGauge items={buildGauges(stats)} />
                      </div>
                    </div>
                  </div>

                  <div className={cardClass}>
                    <div className={cardHeaderClass}>
                      <div>
                        <h2 className={titleClass}>User accounts</h2>
                        <p className={descClass}>Status of all registered accounts</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className={tableClass}>
                        <thead><tr className="border-b border-slate-100 dark:border-white/5"><th className={thClass}>Status</th><th className={thClass}>Count</th><th className={thClass}>% of total</th></tr></thead>
                        <tbody>
                          {[
                            { status: "Active", count: stats.users.active, pct: stats.users.total > 0 ? ((stats.users.active / stats.users.total) * 100).toFixed(1) : "0" },
                            { status: "Drivers", count: stats.users.drivers, pct: stats.users.total > 0 ? ((stats.users.drivers / stats.users.total) * 100).toFixed(1) : "0" },
                            { status: "Passengers", count: stats.users.passengers, pct: stats.users.total > 0 ? ((stats.users.passengers / stats.users.total) * 100).toFixed(1) : "0" },
                            { status: "Banned", count: stats.users.banned, pct: stats.users.total > 0 ? ((stats.users.banned / stats.users.total) * 100).toFixed(1) : "0" },
                          ].map((r) => (
                            <tr key={r.status} className={trClass}><td className={cn(tdClass, "text-slate-700 dark:text-slate-300")}>{r.status}</td><td className={cn(tdClass, "font-semibold text-slate-900 dark:text-white")}>{r.count.toLocaleString()}</td><td className={cn(tdClass, "text-slate-500")}>{r.pct}%</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Users ── */}
          {section === "users" && <UserManagementView />}

          {/* ── Drivers ── */}
          {section === "drivers" && (
            <>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Drivers</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verification and driver accounts.</p>
              </div>
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <div>
                    <h2 className={titleClass}>Verification queue</h2>
                    <p className={descClass}>License and ID document review for driver applicants.</p>
                  </div>
                  <button type="button" className={btnOutline} onClick={() => setSection("documents")}>
                    Open Documents
                  </button>
                </div>
                <div className={cardBodyClass}>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="glass rounded-xl p-4 cursor-pointer hover:ring-1 hover:ring-primary-200 dark:hover:ring-primary-800 transition-all" onClick={() => setSection("documents")}>
                      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">License review</h3>
                      <p className="text-xs text-slate-400 mt-1">Review driving licenses uploaded by driver applicants before granting access.</p>
                    </div>
                    <div className="glass rounded-xl p-4 cursor-pointer hover:ring-1 hover:ring-primary-200 dark:hover:ring-primary-800 transition-all" onClick={() => setSection("documents")}>
                      <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">ID verification</h3>
                      <p className="text-xs text-slate-400 mt-1">Verify national ID documents uploaded by users for identity confirmation.</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    When a document is verified for a pending driver, their account is automatically activated.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── Documents ── */}
          {section === "documents" && <DocumentsManagementView />}

          {/* ── Trips ── */}
          {section === "trips" && <TripsManagementView />}

          {/* ── Bookings ── */}
          {section === "bookings" && <BookingsView />}

          {/* ── Series ── */}
          {section === "series" && <SeriesManagementView />}

          {/* ── Feedback ── */}
          {section === "feedback" && <FeedbackView />}

          {/* ── Incidents ── */}
          {section === "incidents" && <IncidentManagementView />}

          {/* ── Finance ── */}
          {section === "finance" && (
            <>
              <div>
                <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Finance &amp; Support</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Payments, subscriptions, and disputes.</p>
              </div>
              <div className={cardClass}>
                <div className={cardHeaderClass}>
                  <div>
                    <h2 className={titleClass}>Payments</h2>
                    <p className={descClass}>Daily transaction summary.</p>
                  </div>
                </div>
                <div className={cardBodyClass}>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <li>Successful today: <strong className="text-slate-900 dark:text-white">12,491</strong></li>
                    <li>Failed: <strong className="text-red-500">21</strong></li>
                    <li>Refunds: <strong className="text-amber-500">7</strong></li>
                    <li>Commission: Platform 18%, Driver 82%</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* ── Configuration ── */}
          {section === "configuration" && (
            <ConfigurationSection config={config} onConfigUpdated={setConfig} incidents={incidents} onIncidentsUpdated={setIncidents} />
          )}
        </main>
      </div>
    </div>
  );
}
