"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Design tokens (locked NŪRA system) ────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SURFACE_ELEV = "var(--nura-surface-elevated)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Vendor {
  id: string;
  name: string;
  type: string;
  tier: 1 | 2 | 3 | 4 | 5;
  organic: boolean;
  lat: number;
  lng: number;
  distanceMi: number;
  address: string | null;
  hours: string | null;
  mapsUrl: string;
  website: string | null;
  searchUrl: string;
  image: string | null;
  imageKind: "photo" | "logo" | null;
}

type FilterKey = "all" | "farm" | "market" | "health" | "grocer";

const FILTERS: { key: FilterKey; label: string; match: (v: Vendor) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "farm", label: "Farms", match: (v) => v.tier === 1 },
  { key: "market", label: "Markets", match: (v) => v.tier === 2 },
  { key: "health", label: "Health-food", match: (v) => v.tier === 3 },
  { key: "grocer", label: "Grocers", match: (v) => v.tier >= 4 },
];

function tierDot(tier: number): string {
  const steps: Record<number, string> = { 1: "0.9", 2: "0.72", 3: "0.55", 4: "0.4", 5: "0.28" };
  return `rgba(${SAGE_RGB}, ${steps[tier] ?? "0.4"})`;
}

function tierGradient(tier: number): string {
  const top: Record<number, string> = { 1: "0.5", 2: "0.42", 3: "0.34", 4: "0.28", 5: "0.22" };
  const bot: Record<number, string> = { 1: "0.2", 2: "0.17", 3: "0.14", 4: "0.12", 5: "0.1" };
  return `linear-gradient(140deg, rgba(${SAGE_RGB},${top[tier] ?? "0.3"}), rgba(${SAGE_RGB},${bot[tier] ?? "0.12"}))`;
}

function tierNote(v: Vendor): string {
  if (v.tier === 1) return "Local farm — as fresh and close to source as it gets";
  if (v.tier === 2) return "Farmers market — seasonal, local growers";
  if (v.tier === 3) return v.organic ? "Health-food market — organic focus" : "Health-food market";
  if (v.tier === 4) return "Organic-focused grocer";
  return "Grocery store with fresh options";
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function Pin() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-11a7 7 0 1 0-14 0c0 4.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
function Globe() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.4 2.6 2.4 15.4 0 18M12 3c-2.4 2.6-2.4 15.4 0 18" />
    </svg>
  );
}
function LeafGlyph() {
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke="var(--nura-sage-bg-on)" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
      <path d="M5 21c.5-4.5 2.5-8 7-10" />
      <path d="M9 18c6.22 0 10.5-3.29 11-12V4h-4.01C9 4 6 7 6 11c0 3 1 5 3 7z" />
    </svg>
  );
}

// Right-side thumbnail: the store's own photo when the map has one, otherwise a
// clean branded tile (no broken images, no paid photo API needed).
function Thumb({ v }: { v: Vendor }) {
  const [err, setErr] = useState(false);
  const show = !!v.image && !err;
  const isLogo = v.imageKind === "logo";
  return (
    <div style={{
      width: 96, height: 96, flexShrink: 0, borderRadius: 14, overflow: "hidden",
      border: `0.5px solid ${BORDER}`,
      background: show && isLogo ? "#ffffff" : tierGradient(v.tier),
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={v.image!}
          alt={v.name}
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: isLogo ? "contain" : "cover", padding: isLogo ? 4 : 0 }}
        />
      ) : (
        <LeafGlyph />
      )}
    </div>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: SANS, fontSize: 12.5, fontWeight: active ? 600 : 400, letterSpacing: "0.01em",
        padding: "7px 14px", borderRadius: 99, cursor: "pointer", whiteSpace: "nowrap",
        color: active ? SAGE : TEXT_SEC,
        background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent",
        border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.5)` : BORDER}`,
        transition: "background 160ms, border-color 160ms, color 160ms",
      }}
    >
      {children}
    </button>
  );
}

const linkStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5,
  fontFamily: SANS, fontSize: 12, fontWeight: 500, color: SAGE, textDecoration: "none",
};

function DirectionsButton({ v }: { v: Vendor }) {
  const [open, setOpen] = useState(false);
  const apple = `https://maps.apple.com/?daddr=${v.lat},${v.lng}`;
  const google = `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;
  const item: React.CSSProperties = {
    display: "block", padding: "10px 16px", fontFamily: SANS, fontSize: 13,
    color: TEXT, textDecoration: "none", whiteSpace: "nowrap",
  };
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ ...linkStyle, background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        <Pin /> Directions
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
          <div
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 21,
              background: SURFACE_ELEV, border: `0.5px solid ${BORDER}`, borderRadius: 12,
              overflow: "hidden", minWidth: 150, boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <a href={apple} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} style={item}>Apple Maps</a>
            <div style={{ height: 0.5, background: BORDER }} />
            <a href={google} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} style={item}>Google Maps</a>
          </div>
        </>
      )}
    </div>
  );
}

function VendorCard({ v }: { v: Vendor }) {
  const [hov, setHov] = useState(false);
  const host = v.website
    ? v.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")
    : null;
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", gap: 14, padding: 16, borderRadius: 16,
        background: hov ? SURFACE_ELEV : SURFACE, border: `0.5px solid ${BORDER}`,
        transition: "background 160ms",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: tierDot(v.tier), flexShrink: 0 }} />
          <span style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT }}>{v.name}</span>
          {v.organic && (
            <span style={{
              fontFamily: SANS, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "var(--nura-accent-label)", border: `0.5px solid rgba(${SAGE_RGB},0.5)`, borderRadius: 6, padding: "2px 6px",
            }}>Organic</span>
          )}
        </div>

        <div style={{ fontFamily: SANS, fontSize: 12, color: SAGE, marginTop: 4 }}>
          {v.type} · {v.distanceMi} mi
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, marginTop: 5, lineHeight: 1.5 }}>
          {tierNote(v)}
        </div>
        {v.address && <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, marginTop: 6 }}>{v.address}</div>}
        {v.hours && <div style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, marginTop: 2 }}>{v.hours}</div>}

        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
          <DirectionsButton v={v} />
          {v.website ? (
            <a href={v.website} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              <Globe /> {host || "Website"}
            </a>
          ) : (
            <a href={v.searchUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              <Globe /> Find online
            </a>
          )}
        </div>
      </div>

      <Thumb v={v} />
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function escapeHtml(v: string): string {
  const m: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return v.replace(/[&<>"']/g, (c) => m[c] ?? c);
}

// Keyless OpenStreetMap map (Leaflet + dark CARTO tiles) with a pin per place.
function ShopMap({ center, vendors }: { center: { lat: number; lng: number }; vendors: Vendor[] }) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function ensureLeaflet(): Promise<any> {
      const w = window as any;
      if (w.L) return w.L;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      await new Promise<void>((resolve, reject) => {
        if ((window as any).L) return resolve();
        const sc = document.createElement("script");
        sc.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        sc.async = true;
        sc.onload = () => resolve();
        sc.onerror = () => reject(new Error("leaflet failed to load"));
        document.body.appendChild(sc);
      });
      return (window as any).L;
    }

    ensureLeaflet()
      .then((L: any) => {
        if (cancelled || !elRef.current) return;
        if (!mapRef.current) {
          mapRef.current = L.map(elRef.current, {
            zoomControl: true,
            attributionControl: false,
            scrollWheelZoom: false,
          }).setView([center.lat, center.lng], 11);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            subdomains: "abc",
          }).addTo(mapRef.current);
          layerRef.current = L.layerGroup().addTo(mapRef.current);
        }
        drawMarkers(L);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (L && mapRef.current) drawMarkers(L);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, center]);

  function drawMarkers(L: any) {
    if (!layerRef.current || !mapRef.current) return;
    layerRef.current.clearLayers();
    const pts: [number, number][] = [[center.lat, center.lng]];
    const pin = (color: string) =>
      L.divIcon({
        className: "nura-pin",
        html:
          '<div style="filter:drop-shadow(0 3px 3px rgba(0,0,0,.45))"><svg width="20" height="27" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.2 12.1 22.3 12.6 22.9a1.9 1.9 0 0 0 2.8 0C15.9 36.3 28 23.2 28 14 28 6.27 21.73 0 14 0z" fill="' +
          color +
          '"/><circle cx="14" cy="14" r="5.5" fill="#0d0d0e"/></svg></div>',
        iconSize: [20, 27],
        iconAnchor: [10, 27],
        popupAnchor: [0, -25],
      });
    const youIcon = L.divIcon({
      className: "nura-you",
      html:
        '<div style="width:13px;height:13px;border-radius:50%;background:#9bb0a5;border:2px solid #fff;box-shadow:0 0 0 2px rgba(155,176,165,.45),0 1px 4px rgba(0,0,0,.4)"></div>',
      iconSize: [13, 13],
      iconAnchor: [7, 7],
    });
    L.marker([center.lat, center.lng], { icon: youIcon })
      .bindPopup("<strong>You</strong>")
      .addTo(layerRef.current);
    for (const v of vendors) {
      L.marker([v.lat, v.lng], { icon: pin("#9bb0a5") })
        .bindPopup(`<strong>${escapeHtml(v.name)}</strong><br/>${escapeHtml(v.type)} \u00b7 ${v.distanceMi} mi`)
        .addTo(layerRef.current);
      pts.push([v.lat, v.lng]);
    }
    if (pts.length > 1) mapRef.current.fitBounds(pts, { padding: [28, 28], maxZoom: 13 });
    else mapRef.current.setView([center.lat, center.lng], 11);
  }

  return (
    <div
      ref={elRef}
      style={{ height: 260, width: "100%", borderRadius: 16, overflow: "hidden", border: `0.5px solid ${BORDER}`, marginBottom: 16, background: SURFACE }}
    />
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ShopClient() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [zip, setZip] = useState("");
  const [radiusMi, setRadiusMi] = useState(10);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [located, setLocated] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const lastSearchRef = useRef<{ lat?: number; lng?: number; zip?: string } | null>(null);
  const fetchedRadiusRef = useRef(0);

  const runSearch = useCallback(
    async (payload: { lat?: number; lng?: number; zip?: string }, radiusOverride?: number) => {
      lastSearchRef.current = payload;
      const radius = radiusOverride ?? radiusMi;
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/shop/nearby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, radiusMi: radius }),
        });
        const data = (await res.json()) as { vendors?: Vendor[]; center?: { lat: number; lng: number }; error?: string };
        if (!res.ok) {
          setError(data.error || "Something went wrong. Try again.");
          setVendors(null);
        } else {
          setVendors(data.vendors ?? []);
          setCenter(data.center ?? null);
          setLocated(true);
          fetchedRadiusRef.current = radius;
        }
      } catch {
        setError("Couldn't run the search. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [radiusMi]
  );

  // Re-run the last search automatically whenever the radius changes.
  const didFirstRadius = useRef(false);
  useEffect(() => {
    if (!didFirstRadius.current) {
      didFirstRadius.current = true;
      return;
    }
    // Going wider than we've loaded → fetch more. Going narrower → just filter
    // the results we already have (instant, no server call).
    if (radiusMi > fetchedRadiusRef.current && lastSearchRef.current) runSearch(lastSearchRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusMi]);

  const useMyLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Location isn't available on this device — enter a ZIP code instead.");
      return;
    }
    setLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setLoading(false);
        setError("Couldn't get your location. Allow location access, or enter a ZIP code below.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [runSearch]);

  const searchZip = useCallback(() => {
    const z = zip.trim();
    if (!/^\d{5}$/.test(z)) {
      setError("Enter a 5-digit US ZIP code.");
      return;
    }
    runSearch({ zip: z });
  }, [zip, runSearch]);

  const shown = (vendors ?? [])
    .filter((v) => v.distanceMi <= radiusMi)
    .filter((v) => FILTERS.find((f) => f.key === filter)!.match(v))
    .filter((v) => (organicOnly ? v.organic : true));

  return (
    <div style={{ fontFamily: SANS }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--nura-accent-label)" }}>
          Shop Local
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: TEXT, margin: "6px 0 8px", lineHeight: 1.15 }}>
          The healthiest food near you
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, maxWidth: 560 }}>
          Find local farms, farmers markets, and organic grocers close by — ranked from the freshest,
          most local sources first. Whole foods that actually nourish the body.
        </p>
      </div>

      {/* Location controls */}
      <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
        <button
          onClick={useMyLocation}
          disabled={loading}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "13px 16px", borderRadius: 13, cursor: loading ? "default" : "pointer",
            background: SAGE, border: "none",
            color: "var(--nura-sage-bg-on)", fontFamily: SANS, fontSize: 14, fontWeight: 600,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Pin /> {loading ? "Searching…" : "Use my location"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0" }}>
          <div style={{ flex: 1, height: 0.5, background: BORDER }} />
          <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER }}>or</span>
          <div style={{ flex: 1, height: 0.5, background: BORDER }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
            onKeyDown={(e) => e.key === "Enter" && searchZip()}
            inputMode="numeric"
            placeholder="Enter ZIP code"
            style={{
              flex: 1, background: "var(--nura-bg)", border: `0.5px solid ${BORDER}`, borderRadius: 12,
              color: TEXT, fontFamily: SANS, fontSize: 14, padding: "12px 15px", outline: "none",
            }}
          />
          <button
            onClick={searchZip}
            disabled={loading}
            style={{
              flexShrink: 0, padding: "12px 20px", borderRadius: 12, cursor: "pointer",
              background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.5)`,
              color: SAGE, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            }}
          >
            Search
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
          <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>Within</span>
          {[10, 25, 50, 100].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusMi(r)}
              style={{
                padding: "5px 11px", borderRadius: 99, cursor: "pointer",
                fontFamily: SANS, fontSize: 12, fontWeight: radiusMi === r ? 600 : 400,
                color: radiusMi === r ? SAGE : TEXT_SEC,
                background: radiusMi === r ? `rgba(${SAGE_RGB},0.14)` : "transparent",
                border: `0.5px solid ${radiusMi === r ? `rgba(${SAGE_RGB},0.5)` : BORDER}`,
              }}
            >
              {r} mi
            </button>
          ))}
        </div>

        <p style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 14, lineHeight: 1.5 }}>
          Your location is used only to run this search. It&apos;s never saved to your account.
        </p>
      </div>

      {error && (
        <div style={{
          background: `rgba(${SAGE_RGB},0.08)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 12,
          padding: "12px 15px", marginBottom: 16, fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
        }}>
          {error}
        </div>
      )}

      {loading && !vendors && (
        <div style={{ textAlign: "center", padding: "40px 0", fontFamily: SANS, fontSize: 13, color: TEXT_TER }}>
          Scanning your area for the healthiest options…
        </div>
      )}

      {vendors && (
        <>
          {center && shown.length > 0 && <ShopMap center={center} vendors={shown} />}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 6, scrollbarWidth: "none" }}>
            {FILTERS.map((f) => (
              <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label}
              </Chip>
            ))}
            <div style={{ width: 1, background: BORDER, margin: "2px 4px", flexShrink: 0 }} />
            <Chip active={organicOnly} onClick={() => setOrganicOnly((v) => !v)}>
              Organic only
            </Chip>
          </div>

          <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, margin: "8px 2px 14px" }}>
            {shown.length} {shown.length === 1 ? "place" : "places"} found
            {radiusMi ? ` within ${radiusMi} mi` : ""}
          </div>

          {shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 20px", fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6 }}>
              {located
                ? "No matches in this range. Try widening the distance or clearing the filters."
                : "Enter a location to get started."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {shown.map((v) => (
                <VendorCard key={v.id} v={v} />
              ))}
            </div>
          )}

          <p style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 20, lineHeight: 1.5 }}>
            Places and details come from OpenStreetMap, a community map — hours, photos, and organic tags
            may be incomplete. Always confirm with the store.
          </p>
        </>
      )}
    </div>
  );
}
