import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type Coord = [number, number];

type Location = {
  id: string;
  name: string;
  coords: Coord;
};

type RouteDefinition = {
  from: string;
  to: string;
  riders: number;
  color: string;
  label: string;
};

const locations: Location[] = [
  { id: "bole", name: "Bole", coords: [9.0024, 38.7999] },
  { id: "piassa", name: "Piassa", coords: [9.0340, 38.7540] },
  { id: "cmc", name: "CMC", coords: [9.0280, 38.8250] },
  { id: "mexico", name: "Mexico", coords: [9.0102, 38.7445] },
  { id: "megenagna", name: "Megenagna", coords: [9.0194, 38.8016] },
  { id: "arat-kilo", name: "Arat Kilo", coords: [9.0329, 38.7634] },
  { id: "merkato", name: "Merkato", coords: [9.0250, 38.7367] },
  { id: "ayat", name: "Ayat", coords: [9.0256, 38.8760] },
  { id: "gerji", name: "Gerji", coords: [8.9954, 38.8095] },
  { id: "lideta", name: "Lideta", coords: [9.0116, 38.7344] },
  { id: "kazanchis", name: "Kazanchis", coords: [9.0167, 38.7660] },
  { id: "summit", name: "Summit", coords: [9.0120, 38.8471] },
];

const routeDefs: RouteDefinition[] = [
  { from: "bole", to: "piassa", riders: 12, color: "#08a6c4", label: "Bole \u2192 Piassa" },
  { from: "cmc", to: "mexico", riders: 8, color: "#afd0ce", label: "CMC \u2192 Mexico" },
  { from: "ayat", to: "arat-kilo", riders: 15, color: "#559e99", label: "Ayat \u2192 Arat Kilo" },
  { from: "megenagna", to: "merkato", riders: 6, color: "#0ccfed", label: "Megenagna \u2192 Merkato" },
  { from: "gerji", to: "kazanchis", riders: 9, color: "#3f837e", label: "Gerji \u2192 Kazanchis" },
  { from: "summit", to: "lideta", riders: 7, color: "#0d8a9f", label: "Summit \u2192 Lideta" },
];

function getLoc(id: string): Location {
  return locations.find((l) => l.id === id)!;
}

const ADDIS_CENTER: LatLngExpression = [9.015, 38.775];

async function fetchRoadRoute(from: Coord, to: Coord): Promise<Coord[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("routing failed");
    const data = await res.json();
    const coords: [number, number][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map(([lng, lat]) => [lat, lng] as Coord);
  } catch {
    return [from, to];
  }
}

type ResolvedRoute = RouteDefinition & { geometry: LatLngExpression[] };

function RouteLines({ resolvedRoutes }: { resolvedRoutes: ResolvedRoute[] }) {
  return (
    <>
      {resolvedRoutes.map((route) => (
        <g key={route.label}>
          <Polyline
            positions={route.geometry}
            pathOptions={{ color: route.color, weight: 7, opacity: 0.12, lineCap: "round", lineJoin: "round" }}
          />
          <Polyline
            positions={route.geometry}
            pathOptions={{ color: route.color, weight: 3.5, opacity: 0.85, lineCap: "round", lineJoin: "round" }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12 }}>
                <strong>{route.label}</strong>
                <br />
                {route.riders} commuters on this corridor
              </div>
            </Tooltip>
          </Polyline>
        </g>
      ))}
    </>
  );
}

function LocationMarkers() {
  return (
    <>
      {locations.map((loc) => {
        const isEndpoint = routeDefs.some((r) => r.from === loc.id || r.to === loc.id);
        return (
          <CircleMarker
            key={loc.id}
            center={loc.coords}
            radius={isEndpoint ? 6 : 3.5}
            pathOptions={{
              color: isEndpoint ? "#08a6c4" : "#94a3b8",
              fillColor: isEndpoint ? "#08a6c4" : "#cbd5e1",
              fillOpacity: isEndpoint ? 0.9 : 0.5,
              weight: isEndpoint ? 2 : 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent={isEndpoint}>
              <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 11 }}>
                {loc.name}
              </span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

function FitBounds() {
  const map = useMap();
  useEffect(() => {
    const allCoords = locations.map((l) => l.coords);
    map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 14 });
  }, [map]);
  return null;
}

const TILES = {
  street: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

export function MapSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [resolvedRoutes, setResolvedRoutes] = useState<ResolvedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [tileMode, setTileMode] = useState<"street" | "satellite">("street");

  const fetchAllRoutes = useCallback(async () => {
    const resolved = await Promise.all(
      routeDefs.map(async (rd) => {
        const from = getLoc(rd.from).coords;
        const to = getLoc(rd.to).coords;
        const geometry = await fetchRoadRoute(from, to);
        return { ...rd, geometry };
      })
    );
    setResolvedRoutes(resolved);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isInView) fetchAllRoutes();
  }, [isInView, fetchAllRoutes]);

  return (
    <section className="py-24 px-6 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/60 via-primary-50/30 to-slate-50/60 dark:from-white/[0.02] dark:via-primary-950/10 dark:to-white/[0.02]" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12"
        >
          <div>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
              Network Map
            </span>
            <h2 className="mt-3 font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white">
              Your city, connected
            </h2>
          </div>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-md">
            Commuters across the city share rides along the same corridors every day.
            Hover over any route to explore active carpooling lines.
          </p>
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="relative"
        >
          <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-white/10" style={{ height: "520px" }}>
            {loading && (
              <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl">
                <div className="flex items-center gap-3 glass-strong rounded-xl px-5 py-3 shadow-lg">
                  <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading routes...</span>
                </div>
              </div>
            )}
            <MapContainer
              center={ADDIS_CENTER}
              zoom={13}
              scrollWheelZoom={false}
              zoomControl={false}
              style={{ height: "100%", width: "100%" }}
              attributionControl={false}
            >
              <TileLayer key={tileMode} url={TILES[tileMode]} />
              <FitBounds />
              <LocationMarkers />
              <RouteLines resolvedRoutes={resolvedRoutes} />
            </MapContainer>

            {/* Satellite / Street toggle */}
            <button
              onClick={() => setTileMode((m) => (m === "street" ? "satellite" : "street"))}
              className="absolute right-3 sm:right-5 bottom-14 z-[1000] glass-strong rounded-xl px-3 py-2.5 shadow-lg flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
              aria-label="Toggle satellite view"
            >
              {tileMode === "street" ? (
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                </svg>
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {tileMode === "street" ? "Satellite" : "Street"}
              </span>
            </button>
          </div>

          {/* Floating stat cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 }}
            className="absolute left-3 sm:left-5 top-4 z-[1000]"
          >
            <div className="glass-strong rounded-xl p-3 sm:p-4 shadow-lg">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Active corridors</p>
              <p className="font-display font-bold text-lg sm:text-xl text-primary-600 dark:text-primary-400">24</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.6 }}
            className="absolute right-3 sm:right-5 top-4 z-[1000]"
          >
            <div className="glass-strong rounded-xl p-3 sm:p-4 shadow-lg">
              <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">Commuters now</p>
              <p className="font-display font-bold text-lg sm:text-xl text-eco-500">57</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-4 z-[1000]"
          >
            <div className="glass-strong rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-eco-500 animate-pulse" />
              <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <span className="font-bold text-slate-900 dark:text-white">6 corridors</span> with shared rides right now
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Route legend */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          {routeDefs.map((rd) => (
            <div key={rd.label} className="flex items-center gap-2">
              <span className="w-4 h-1 rounded-full" style={{ background: rd.color }} />
              <span className="text-slate-500 dark:text-slate-400">{rd.label}</span>
            </div>
          ))}
        </div>

        {/* Explanation cards */}
        <div className="grid sm:grid-cols-3 gap-6 mt-14">
          {[
            {
              title: "Shared corridors",
              description: "Multiple commuters heading in the same direction share one vehicle \u2014 cutting costs and congestion simultaneously.",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
              ),
            },
            {
              title: "Intelligent matching",
              description: "Our algorithm pairs riders by route overlap and departure window, ensuring minimal detours and maximum convenience.",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
              ),
            },
            {
              title: "Network effects",
              description: "Every new rider strengthens the network. More participants means faster fills, more corridors, and shorter wait times.",
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>
              ),
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8 + 0.1 * i, duration: 0.5 }}
              className="glass rounded-2xl p-6 glow-hover flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white">
                {card.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">{card.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
