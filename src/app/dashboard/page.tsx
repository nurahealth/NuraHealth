"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  getLatestBiomarkers,
  getUserPanels,
  getOverallHealthScore,
  type Biomarker,
  type LabPanel,
  type HealthScore,
} from "@/lib/bloodwork";
import {
  BIOMARKER_CATALOG,
  enrichCatalogWithUserData,
  type EnrichedSection,
  type EnrichedMarker,
  type SourceType,
} from "@/lib/biomarkerCatalog";
import NuraPageShell from "@/components/NuraPageShell";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_RGB = "155,176,165";
const AMBER = "#d4a574";
const RED = "#d4574d";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

const statusColor = (s: Biomarker["status"]) =>
  s === "watch" ? AMBER : (s === "low" || s === "high" || s === "critical") ? RED : SAGE;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

const fmtPanelDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
};

const formatValue = (v: number) => (v % 1 === 0 ? v.toString() : v.toFixed(1));

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [score, setScore] = useState<HealthScore | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth");
      else { setUser(user); setAuthLoading(false); }
    });
  }, [router]);

  const loadAll = useCallback(async (userId: string) => {
    setDataLoading(true);
    try {
      const [bm, ps, sc] = await Promise.all([
        getLatestBiomarkers(userId),
        getUserPanels(userId),
        getOverallHealthScore(userId),
      ]);
      setBiomarkers(bm);
      setPanels(ps);
      setScore(sc);
    } catch {
      // silent
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadAll(user.id);
  }, [user, loadAll]);

  if (authLoading) {
    return <NuraPageShell maxWidth={1280}><div /></NuraPageShell>;
  }

  const enriched = enrichCatalogWithUserData(BIOMARKER_CATALOG, biomarkers);
  const analyzedPanels = panels.filter((p) => p.status === "analyzed");
  const latestPanel = analyzedPanels[0];
  const todayLabel = fmtDate(new Date());

  return (
    <NuraPageShell maxWidth={1280}>
      <style>{`
        .dash-pad { padding: 0 6px; }
        @media (min-width: 768px) { .dash-pad { padding: 0 22px; } }
        @media (min-width: 1024px) { .dash-pad { padding: 0 38px; } }

        .dash-hero { display: flex; flex-direction: column; gap: 24px; margin-bottom: 40px; }
        @media (min-width: 1024px) {
          .dash-hero { flex-direction: row; align-items: flex-start; gap: 32px; }
          .dash-hero-left { flex: 1; }
          .dash-hero-right { width: 100%; max-width: 380px; flex-shrink: 0; }
        }

        .dash-marker-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .dash-marker-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .dash-marker-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        }
      `}</style>

      <div className="dash-pad">
        {/* HERO */}
        <div className="dash-hero">
          <div className="dash-hero-left">
            <h1 style={{
              fontFamily: SERIF, fontWeight: 500, color: TEXT,
              margin: "0 0 6px", lineHeight: 1.1, letterSpacing: "-0.5px",
              fontSize: "clamp(32px, 5vw, 52px)",
            }}>
              Your wellness, today
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
              {todayLabel}
            </p>
          </div>

          {/* Health score card */}
          <div className="dash-hero-right">
            <div style={{
              background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
              padding: 20,
            }}>
              <div style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
                color: SAGE, textTransform: "uppercase", marginBottom: 8,
              }}>
                Overall score
              </div>
              <div style={{
                fontFamily: SERIF, fontWeight: 500, color: SAGE, lineHeight: 1,
                fontSize: "clamp(48px, 6vw, 56px)", marginBottom: 18,
              }}>
                {score?.score ?? 0}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <ScoreTile count={score?.optimalCount ?? 0} label="Optimal" color={SAGE} />
                <ScoreTile count={score?.watchCount ?? 0} label="Watch" color={AMBER} />
                <ScoreTile count={score?.alertCount ?? 0} label="Alert" color={RED} />
              </div>
            </div>
          </div>
        </div>

        {dataLoading ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>
            Loading…
          </div>
        ) : (
          <>
            {/* SECTIONS */}
            {enriched.map((section) => (
              <Section
                key={section.id}
                section={section}
                onConnect={() => router.push("/integrations")}
                onUpload={() => router.push("/bloodwork")}
                onTileClick={(m) => m.match && router.push(`/bloodwork/${m.match.panel_id}`)}
              />
            ))}

            {/* LATEST INSIGHT */}
            {latestPanel?.insight && (
              <div style={{
                background: SURFACE, border: `0.5px solid ${BORDER}`,
                borderLeft: `2px solid ${SAGE}`, borderRadius: 14,
                padding: 20, marginTop: 32,
              }}>
                <div style={{
                  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
                  color: SAGE, textTransform: "uppercase", marginBottom: 10,
                }}>
                  Latest insight
                </div>
                <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT, margin: 0, lineHeight: 1.6 }}>
                  {latestPanel.insight}
                </p>
              </div>
            )}

            {/* RECENT PANELS */}
            {analyzedPanels.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <SectionLabel>Recent panels</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {analyzedPanels.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/bloodwork/${p.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(235,230,216,0.06)";
                        e.currentTarget.style.borderColor = `rgba(${SAGE_RGB},0.25)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = SURFACE;
                        e.currentTarget.style.borderColor = BORDER;
                      }}
                      style={{
                        width: "100%", textAlign: "left", padding: "14px 16px",
                        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
                        cursor: "pointer", fontFamily: SANS,
                        transition: "background 160ms, border-color 160ms",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>{p.name}</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_TER} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 6l6 6-6 6"/>
                        </svg>
                      </div>
                      <div style={{ fontSize: 12, color: TEXT_SEC }}>{fmtPanelDate(p.collected_date)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </NuraPageShell>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────
function Section({
  section,
  onConnect,
  onUpload,
  onTileClick,
}: {
  section: EnrichedSection;
  onConnect: () => void;
  onUpload: () => void;
  onTileClick: (m: EnrichedMarker) => void;
}) {
  return (
    <section style={{ marginTop: 32, marginBottom: 16 }}>
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 4px", lineHeight: 1.2, letterSpacing: "-0.3px",
          fontSize: "clamp(22px, 3vw, 28px)",
        }}>
          {section.title}
        </h2>
        <div style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
          color: SAGE, textTransform: "uppercase",
        }}>
          {section.subtitle}
        </div>
      </div>

      {/* Body */}
      {!section.hasAnyMatch ? (
        <EmptySectionPrompt sourceType={section.sourceType} onConnect={onConnect} onUpload={onUpload} />
      ) : section.subgroups ? (
        section.subgroups.map((sg) => (
          <div key={sg.title} style={{ marginBottom: 8 }}>
            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
              color: SAGE, textTransform: "uppercase",
              margin: "14px 0 8px",
            }}>
              {sg.title} · {sg.markers.length}
            </div>
            <div className="dash-marker-grid">
              {sg.markers.map((m) => (
                <MarkerTile key={m.id} marker={m} onClick={() => onTileClick(m)} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="dash-marker-grid">
          {(section.markers ?? []).map((m) => (
            <MarkerTile key={m.id} marker={m} onClick={() => onTileClick(m)} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Marker tile ──────────────────────────────────────────────────────────────
function MarkerTile({ marker, onClick }: { marker: EnrichedMarker; onClick: () => void }) {
  const hasData = !!marker.match;
  const b = marker.match;
  const sc = b ? statusColor(b.status) : TEXT_TER;
  const unit = b?.unit ?? marker.unit;

  return (
    <div
      onClick={hasData ? onClick : undefined}
      style={{
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
        padding: 14, cursor: hasData ? "pointer" : "default",
        transition: "border-color 160ms",
      }}
      onMouseEnter={hasData ? (e) => { e.currentTarget.style.borderColor = `rgba(${SAGE_RGB},0.25)`; } : undefined}
      onMouseLeave={hasData ? (e) => { e.currentTarget.style.borderColor = BORDER; } : undefined}
    >
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
        color: sc, textTransform: "uppercase", lineHeight: 1.3, marginBottom: 8,
        overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
        minHeight: 26,
      }}>
        {marker.shortName ?? marker.name}
      </div>

      {hasData && b ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, color: TEXT, lineHeight: 1 }}>
              {formatValue(b.value)}
            </span>
            <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>{unit}</span>
          </div>
          <MarkerRangeBar marker={marker} />
        </>
      ) : (
        <>
          <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT_TER, lineHeight: 1 }}>—</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: TEXT_TER, marginTop: 8 }}>No data yet</div>
        </>
      )}
    </div>
  );
}

// ── Range bar for a marker tile ──────────────────────────────────────────────
function MarkerRangeBar({ marker }: { marker: EnrichedMarker }) {
  const b = marker.match;
  if (!b) return null;
  const sc = statusColor(b.status);

  // Determine optimal range from user data > catalog defaults
  const optLow = b.optimal_range_low ?? marker.optimalLow ?? null;
  const optHigh = b.optimal_range_high ?? marker.optimalHigh ?? null;

  // If we don't know the optimal range AND we don't know reference range,
  // just show a flat colored bar (no marker dot).
  if (optLow === null && optHigh === null && b.reference_range_low === null && b.reference_range_high === null) {
    return (
      <div style={{ height: 4, borderRadius: 2, marginTop: 10, background: sc, opacity: 0.6 }} />
    );
  }

  // Build the scale
  const refLow = b.reference_range_low ?? (optLow !== null ? optLow * 0.5 : 0);
  const refHigh = b.reference_range_high ?? (optHigh !== null ? optHigh * 1.5 : (optLow !== null ? optLow * 2 : 100));
  const low = Math.min(refLow, b.value);
  const high = Math.max(refHigh, b.value);
  const span = (high - low) || 1;
  const clamp = (v: number) => Math.min(100, Math.max(0, ((v - low) / span) * 100));

  const optStart = optLow ?? refLow ?? low;
  const optEnd = optHigh ?? refHigh ?? high;

  return (
    <div style={{ position: "relative", height: 4, borderRadius: 2, marginTop: 10, overflow: "visible" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(235,230,216,0.07)", borderRadius: 2 }} />
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        left: `${clamp(optStart)}%`,
        width: `${Math.max(0, clamp(optEnd) - clamp(optStart))}%`,
        background: `rgba(${SAGE_RGB},0.4)`,
      }} />
      <div style={{
        position: "absolute", top: "50%", left: `${clamp(b.value)}%`,
        transform: "translate(-50%, -50%)",
        width: 8, height: 8, borderRadius: "50%",
        background: sc, border: "1.5px solid #0d0d0e",
        boxShadow: `0 0 4px ${sc}`,
      }} />
    </div>
  );
}

// ── Empty section prompt ─────────────────────────────────────────────────────
function EmptySectionPrompt({
  sourceType,
  onConnect,
  onUpload,
}: {
  sourceType: SourceType;
  onConnect: () => void;
  onUpload: () => void;
}) {
  const isWearable = sourceType === "wearable";
  return (
    <div style={{
      width: "100%", padding: "20px 22px", borderRadius: 14,
      background: "rgba(235,230,216,0.02)", border: `0.5px dashed ${BORDER}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" as const,
    }}>
      <span style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.5 }}>
        {isWearable ? "Connect a device to track these." : "Upload bloodwork to see these."}
      </span>
      <button
        onClick={isWearable ? onConnect : onUpload}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
          fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
          display: "flex", alignItems: "center", gap: 4,
        }}
      >
        {isWearable ? "Connect" : "Upload"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6"/>
        </svg>
      </button>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
      color: TEXT_TER, textTransform: "uppercase", marginBottom: 12,
    }}>{children}</div>
  );
}

function ScoreTile({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{
      background: "rgba(235,230,216,0.03)", border: `0.5px solid ${BORDER}`, borderRadius: 10,
      padding: "10px 8px", textAlign: "center",
    }}>
      <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontFamily: SANS, fontSize: 10, color: TEXT_SEC, marginTop: 4, letterSpacing: "0.5px" }}>{label}</div>
    </div>
  );
}
