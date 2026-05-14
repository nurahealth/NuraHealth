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
import NuraPageShell from "@/components/NuraPageShell";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
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

// ── Range bar ─────────────────────────────────────────────────────────────────
function MiniRange({ b }: { b: Biomarker }) {
  const low = b.reference_range_low ?? (b.optimal_range_low ? b.optimal_range_low * 0.5 : 0);
  const high = b.reference_range_high ?? (b.optimal_range_high ? b.optimal_range_high * 1.5 : 100);
  const span = high - low || 1;
  const optStart = b.optimal_range_low ?? b.reference_range_low ?? low;
  const optEnd = b.optimal_range_high ?? b.reference_range_high ?? high;
  const clamp = (v: number) => Math.min(100, Math.max(0, ((v - low) / span) * 100));
  const sc = statusColor(b.status);

  return (
    <div style={{ position: "relative", height: 4, borderRadius: 2, marginTop: 8, overflow: "visible" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(235,230,216,0.06)", borderRadius: 2 }} />
      <div style={{
        position: "absolute", top: 0, bottom: 0,
        left: `${clamp(optStart)}%`,
        width: `${clamp(optEnd) - clamp(optStart)}%`,
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
    return <NuraPageShell><div /></NuraPageShell>;
  }

  // Top 6 biomarkers — prioritize alerts > watch > optimal
  const priority = { critical: 0, high: 1, low: 1, watch: 2, optimal: 3 } as Record<Biomarker["status"], number>;
  const sorted = [...biomarkers].sort((a, b) => (priority[a.status] - priority[b.status]));
  const topBiomarkers = sorted.slice(0, 6);

  const analyzedPanels = panels.filter((p) => p.status === "analyzed");
  const latestPanel = analyzedPanels[0];
  const hasPanels = analyzedPanels.length > 0;
  const todayLabel = fmtDate(new Date());

  return (
    <NuraPageShell maxWidth={720}>
      {/* HERO */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 48px)",
        }}>
          Your wellness, today
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
          {todayLabel}
        </p>
      </div>

      {dataLoading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>
          Loading…
        </div>
      ) : !hasPanels ? (
        // EMPTY STATE
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          padding: "48px 20px 24px", marginTop: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, marginBottom: 20,
            background: `rgba(${SAGE_RGB},0.1)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center", color: SAGE,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c0 0-8 11-8 14.5a8 8 0 0 0 16 0C20 13 12 2 12 2z"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.3px" }}>
            No bloodwork yet
          </h2>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, margin: "0 0 22px", maxWidth: 360, lineHeight: 1.6 }}>
            Upload your first panel to see insights here.
          </p>
          <button
            onClick={() => router.push("/bloodwork")}
            onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
            style={{
              padding: "12px 22px", borderRadius: 12, border: "none",
              background: SAGE, color: SAGE_ON,
              fontFamily: SANS, fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}
          >
            Upload bloodwork
          </button>
        </div>
      ) : (
        <>
          {/* HEALTH SCORE CARD */}
          {score && score.total > 0 && (
            <div style={{
              background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
              padding: 22, marginBottom: 18,
              display: "flex", gap: 18, flexWrap: "wrap" as const, alignItems: "center",
            }}>
              <div style={{ minWidth: 120 }}>
                <div style={{
                  fontFamily: SERIF, fontSize: 48, fontWeight: 500, color: SAGE, lineHeight: 1,
                }}>
                  {score.score}
                </div>
                <div style={{
                  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
                  color: SAGE, textTransform: "uppercase", marginTop: 8,
                }}>
                  Overall score
                </div>
              </div>
              <div style={{
                flex: 1, minWidth: 200, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
              }}>
                <ScoreTile count={score.optimalCount} label="Optimal" color={SAGE} />
                <ScoreTile count={score.watchCount} label="Watch" color={AMBER} />
                <ScoreTile count={score.alertCount} label="Alert" color={RED} />
              </div>
            </div>
          )}

          {/* BIOMARKER TILES */}
          {topBiomarkers.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Biomarkers</SectionLabel>
              <div className="dash-bm-grid" style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
              }}>
                <style>{`
                  @media (min-width: 768px) {
                    .dash-bm-grid { grid-template-columns: 1fr 1fr 1fr 1fr !important; }
                  }
                `}</style>
                {topBiomarkers.map((b) => {
                  const sc = statusColor(b.status);
                  return (
                    <div key={b.id} onClick={() => router.push(`/bloodwork/${b.panel_id}`)} style={{
                      background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
                      padding: 14, cursor: "pointer",
                    }}>
                      <div style={{
                        fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "1.4px",
                        color: sc, textTransform: "uppercase", marginBottom: 8,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {b.name}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontFamily: SANS, fontSize: 20, fontWeight: 500, color: TEXT, lineHeight: 1 }}>
                          {b.value % 1 === 0 ? b.value.toString() : b.value.toFixed(1)}
                        </span>
                        <span style={{ fontSize: 12, color: TEXT_SEC }}>{b.unit}</span>
                      </div>
                      <MiniRange b={b} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LATEST INSIGHT */}
          {latestPanel?.insight && (
            <div style={{
              background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
              padding: 18, marginBottom: 22,
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

          {/* PANEL HISTORY */}
          {analyzedPanels.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Recent panels</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {analyzedPanels.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/bloodwork/${p.id}`)}
                    style={{
                      width: "100%", textAlign: "left", padding: "14px 16px",
                      background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
                      cursor: "pointer", fontFamily: SANS,
                      transition: "background 160ms, border-color 160ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(235,230,216,0.06)";
                      e.currentTarget.style.borderColor = `rgba(${SAGE_RGB},0.25)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = SURFACE;
                      e.currentTarget.style.borderColor = BORDER;
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
    </NuraPageShell>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
      color: TEXT_TER, textTransform: "uppercase", marginBottom: 10,
    }}>{children}</div>
  );
}

function ScoreTile({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{
      background: "rgba(235,230,216,0.03)", border: `0.5px solid ${BORDER}`, borderRadius: 10,
      padding: "10px 8px", textAlign: "center",
    }}>
      <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontFamily: SANS, fontSize: 10, color: TEXT_SEC, marginTop: 4, letterSpacing: "0.5px" }}>{label}</div>
    </div>
  );
}
