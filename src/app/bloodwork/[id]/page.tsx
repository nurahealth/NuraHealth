"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { addSupplement } from "@/lib/supplements";
import { saveItem } from "@/lib/saved";
import {
  getPanelById,
  getPanelScore,
  getHealthScoreTrend,
  getBiomarkerHistory,
  getTopActionItems,
  deletePanelAndBiomarkers,
  type LabPanel,
  type Biomarker,
  type HealthScore,
  type ScoreTrendPoint,
  type BiomarkerHistoryPoint,
  type ActionItem,
} from "@/lib/bloodwork";
import NuraPageShell from "@/components/NuraPageShell";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-bg)";
const SAGE_RGB = "155,176,165";
const AMBER = "var(--nura-watch)";
const RED = "var(--nura-danger)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
};
const fmtShort = (d: string) => {
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
};
const statusColor = (s: Biomarker["status"]) =>
  s === "watch" ? AMBER : (s === "low" || s === "high" || s === "critical") ? RED : SAGE;
const statusLabel = (s: Biomarker["status"]) =>
  ({ low: "LOW", high: "HIGH", critical: "CRIT", watch: "WATCH", optimal: "OPTIMAL" } as Record<Biomarker["status"], string>)[s];

// ── Donut (sage stroke) ───────────────────────────────────────────────────────
function HealthDonut({ score, size = 96 }: { score: HealthScore; size?: number }) {
  const r = (size - 14) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const { optimalCount, watchCount, alertCount, total } = score;
  const optPct = total > 0 ? optimalCount / total : 0;
  const watchPct = total > 0 ? watchCount / total : 0;
  const alertPct = total > 0 ? alertCount / total : 0;
  const alertOffset = circ * 0.25;
  const watchOffset = alertOffset - alertPct * circ;
  const optOffset = watchOffset - watchPct * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(var(--nura-bg-tint-rgb),0.08)" strokeWidth={8} />
        {alertPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={RED} strokeWidth={8}
            strokeDasharray={`${alertPct * circ} ${circ - alertPct * circ}`} strokeDashoffset={alertOffset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        {watchPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={AMBER} strokeWidth={8}
            strokeDasharray={`${watchPct * circ} ${circ - watchPct * circ}`} strokeDashoffset={watchOffset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        )}
        {optPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={SAGE} strokeWidth={8}
            strokeDasharray={`${optPct * circ} ${circ - optPct * circ}`} strokeDashoffset={optOffset}
            transform={`rotate(-90 ${cx} ${cy})`} />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: SAGE, lineHeight: 1 }}>{score.score}</div>
        <div style={{ fontFamily: SANS, fontSize: 9, color: TEXT_TER, letterSpacing: "1px", marginTop: 4 }}>%OPT</div>
      </div>
    </div>
  );
}

// ── Trend chart ──────────────────────────────────────────────────────────────
function TrendChart({ points }: { points: ScoreTrendPoint[] }) {
  if (points.length < 2) return null;
  const W = 320, H = 64, pad = 8;
  const scores = points.map((p) => p.score);
  const minV = Math.max(0, Math.min(...scores) - 10);
  const maxV = Math.min(100, Math.max(...scores) + 10);
  const range = maxV - minV || 1;
  const toX = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - minV) / range) * (H - pad * 2);
  const pts = points.map((p, i) => `${toX(i)},${toY(p.score)}`).join(" ");
  const lastX = toX(points.length - 1);
  const lastY = toY(points[points.length - 1].score);
  const delta = scores[scores.length - 1] - scores[0];
  const deltaStr = delta > 0 ? `↑ +${delta}` : delta < 0 ? `↓ ${delta}` : "→ stable";
  const deltaColor = delta > 0 ? SAGE : delta < 0 ? RED : TEXT_TER;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionLabel>Health score trend</SectionLabel>
        <span style={{ fontFamily: SANS, fontSize: 11, color: deltaColor, fontWeight: 500 }}>{deltaStr}</span>
      </div>
      <svg width="100%" height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="trend-fill-d" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SAGE} stopOpacity="0.5" />
            <stop offset="100%" stopColor={SAGE} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pad},${H - pad} ${pts} ${toX(points.length - 1)},${H - pad}`} fill="url(#trend-fill-d)" />
        <polyline points={pts} fill="none" stroke={SAGE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r={4} fill={SAGE} />
        {points.map((p, i) => (
          <text key={i} x={toX(i)} y={H + 14} textAnchor="middle"
            fontFamily={SANS} fontSize="9"
            fill={i === points.length - 1 ? SAGE : TEXT_TER}>
            {fmtShort(p.date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ history, color, width = 100, height = 32 }: {
  history: BiomarkerHistoryPoint[]; color: string; width?: number; height?: number;
}) {
  if (history.length === 0) return <div style={{ width, height }} />;
  if (history.length === 1) {
    return <svg width={width} height={height}><circle cx={width / 2} cy={height / 2} r={3.5} fill={color} /></svg>;
  }
  const values = history.map((h) => h.value);
  const minV = Math.min(...values), maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pad = 4;
  const toX = (i: number) => pad + (i / (history.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - ((v - minV) / range) * (height - pad * 2);
  const pts = history.map((h, i) => `${toX(i)},${toY(h.value)}`).join(" ");
  const lastX = toX(history.length - 1), lastY = toY(history[history.length - 1].value);
  const fillId = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${height - pad} ${pts} ${toX(history.length - 1)},${height - pad}`} fill={`url(#${fillId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}

// ── Range bar ────────────────────────────────────────────────────────────────
function RangeBar({ b }: { b: Biomarker }) {
  const { value, reference_range_low: refLow, reference_range_high: refHigh, optimal_range_low: optLow, optimal_range_high: optHigh } = b;
  if (!refLow && !refHigh && !optLow && !optHigh) return null;

  const low = refLow ?? (optLow ? optLow * 0.5 : 0);
  const high = refHigh ?? (optHigh ? optHigh * 1.5 : 100);
  const span = high - low || 1;
  const optStart = optLow ?? refLow ?? low;
  const optEnd = optHigh ?? refHigh ?? high;
  const clamp = (v: number) => Math.min(100, Math.max(0, ((v - low) / span) * 100));
  const sc = statusColor(b.status);

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ position: "relative", height: 5, borderRadius: 3, background: `rgba(212,87,77,0.18)` }}>
        <div style={{
          position: "absolute", left: `${clamp(low)}%`, width: `${clamp(optStart) - clamp(low)}%`, height: "100%",
          background: `rgba(212,165,116,0.4)`, borderRadius: "3px 0 0 3px",
        }} />
        <div style={{
          position: "absolute", left: `${clamp(optStart)}%`, width: `${clamp(optEnd) - clamp(optStart)}%`, height: "100%",
          background: `rgba(var(--nura-sage-rgb),0.55)`,
        }} />
        <div style={{
          position: "absolute", left: `${clamp(optEnd)}%`, width: `${clamp(high) - clamp(optEnd)}%`, height: "100%",
          background: `rgba(212,165,116,0.4)`, borderRadius: "0 3px 3px 0",
        }} />
        <div style={{
          position: "absolute", top: "50%", left: `${clamp(value)}%`,
          transform: "translate(-50%, -50%)",
          width: 9, height: 9, borderRadius: "50%",
          background: sc, border: "1.5px solid var(--nura-bg)", boxShadow: `0 0 4px ${sc}`,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: TEXT_TER }}>
        {refLow ? <span>&lt;{refLow}</span> : <span />}
        {optLow && optHigh ? <span>Optimal {optLow}–{optHigh}</span> : <span />}
        {refHigh ? <span>&gt;{refHigh}</span> : <span />}
      </div>
    </div>
  );
}

// ── Biomarker card ───────────────────────────────────────────────────────────
function BiomarkerCard({ b, history, isFirst }: { b: Biomarker; history: BiomarkerHistoryPoint[]; isFirst: boolean }) {
  const sc = statusColor(b.status);
  const sl = statusLabel(b.status);
  let trend: React.ReactNode = null;
  if (history.length >= 2) {
    const prev = history[history.length - 2].value;
    const curr = history[history.length - 1].value;
    const diff = curr - prev;
    const symbol = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
    const label = diff === 0 ? "stable" : `${symbol} ${Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1)} vs prev`;
    const tc = b.status === "optimal" ? SAGE : diff === 0 ? TEXT_TER : RED;
    trend = <span style={{ fontFamily: SANS, fontSize: 11, color: tc }}>{label}</span>;
  }

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 14, marginBottom: 10,
      background: SURFACE, border: `0.5px solid ${BORDER}`,
      borderLeft: `2px solid ${sc}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 2 }}>{b.name}</div>
          {b.notes && <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER }}>{b.notes}</div>}
        </div>
        <span style={{
          padding: "2px 8px", borderRadius: 4,
          background: `${sc}1f`, border: `1px solid ${sc}40`,
          fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.8px", color: sc, textTransform: "uppercase",
          flexShrink: 0,
        }}>{sl}</span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: SANS, fontSize: 24, fontWeight: 500, color: sc, lineHeight: 1 }}>
              {b.value % 1 === 0 ? b.value.toString() : b.value.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: TEXT_TER }}>{b.unit}</span>
          </div>
          {trend && <div style={{ marginTop: 4 }}>{trend}</div>}
          {history.length === 1 && isFirst && (
            <div style={{ marginTop: 4, fontSize: 10, color: TEXT_TER }}>First panel</div>
          )}
        </div>
        {history.length > 0 && <Sparkline history={history} color={sc} />}
      </div>
      <RangeBar b={b} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
      color: TEXT_TER, textTransform: "uppercase",
    }}>{children}</span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BloodworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: panelId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [panel, setPanel] = useState<LabPanel | null>(null);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [panelScore, setPanelScore] = useState<HealthScore | null>(null);
  const [trendPoints, setTrendPoints] = useState<ScoreTrendPoint[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [histories, setHistories] = useState<Record<string, BiomarkerHistoryPoint[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "alert">("all");
  const [addingSupp, setAddingSupp] = useState<string | null>(null);
  const [addedSupps, setAddedSupps] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [protocolSaved, setProtocolSaved] = useState(false);
  const [protocolSaving, setProtocolSaving] = useState(false);
  const [showProtocolForm, setShowProtocolForm] = useState(false);
  const [protocolTitle, setProtocolTitle] = useState("");
  const [shareToast, setShareToast] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u); setAuthLoading(false);
    });
  }, [router]);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true); setError(null);
    try {
      const [{ panel: p, biomarkers: bm }, score, trend, actions] = await Promise.all([
        getPanelById(panelId),
        getPanelScore(panelId),
        getHealthScoreTrend(userId),
        getTopActionItems(panelId, "panel"),
      ]);
      setPanel(p); setBiomarkers(bm); setPanelScore(score); setTrendPoints(trend); setActionItems(actions);
      const historyEntries = await Promise.all(
        bm.map(async (b) => {
          const h = await getBiomarkerHistory(userId, b.name);
          return [b.name, h] as [string, BiomarkerHistoryPoint[]];
        })
      );
      setHistories(Object.fromEntries(historyEntries));
    } catch {
      setError("Failed to load panel data.");
    } finally {
      setLoading(false);
    }
  }, [panelId]);

  useEffect(() => { if (user) loadData(user.id); }, [user, loadData]);

  const handleAddSupplement = async (action: ActionItem) => {
    if (!user || !action.supplement_suggestion) return;
    const key = action.title;
    setAddingSupp(key);
    try {
      await addSupplement(user.id, {
        name: action.supplement_suggestion.name,
        dose: action.supplement_suggestion.dose,
        timing: action.supplement_suggestion.timing,
        frequency: "daily",
        notes: `Recommended by NŪRA: ${action.reasoning}`,
        recommended_by_nura: true,
        recommendation_reason: action.reasoning,
      });
      setAddedSupps((prev) => new Set(prev).add(key));
    } catch {} finally { setAddingSupp(null); }
  };

  const handleSaveProtocol = async () => {
    if (!user || !panel || !protocolTitle.trim()) return;
    setProtocolSaving(true);
    try {
      const content = actionItems
        .map((a, i) => `${i + 1}. ${a.title}\n   ${a.reasoning}${a.supplement_suggestion ? `\n   → ${a.supplement_suggestion.name} ${a.supplement_suggestion.dose} ${a.supplement_suggestion.timing}` : ""}`)
        .join("\n\n");
      await saveItem(user.id, {
        type: "protocol",
        title: protocolTitle.trim(),
        description: `${actionItems.length} action${actionItems.length !== 1 ? "s" : ""} from ${panel.name}`,
        content,
        metadata: { panel_id: panel.id, panel_name: panel.name, action_count: actionItems.length },
      });
      setProtocolSaved(true); setShowProtocolForm(false);
    } catch {} finally { setProtocolSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deletePanelAndBiomarkers(panelId); router.push("/bloodwork"); }
    catch { setDeleting(false); setDeleteConfirm(false); }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast("Link copied");
      setTimeout(() => setShareToast(""), 1800);
    } catch {
      setShareToast("Could not copy");
      setTimeout(() => setShareToast(""), 1800);
    }
  };

  const ShareButton = (
    <button
      onClick={handleShare}
      aria-label="Share"
      style={{
        width: 38, height: 38, borderRadius: 11,
        background: SURFACE, border: `0.5px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: TEXT,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
      </svg>
    </button>
  );

  if (authLoading || loading) {
    return <NuraPageShell rightAction={ShareButton}><div style={{ padding: "60px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>Loading…</div></NuraPageShell>;
  }
  if (error || !panel) {
    return (
      <NuraPageShell rightAction={ShareButton}>
        <div style={{ padding: "60px 0", textAlign: "center" }}>
          <p style={{ color: RED, fontSize: 14, marginBottom: 16 }}>{error ?? "Panel not found"}</p>
          <button onClick={() => router.push("/bloodwork")} style={{ background: "none", border: "none", color: SAGE, fontSize: 13, cursor: "pointer" }}>
            ← Back to bloodwork
          </button>
        </div>
      </NuraPageShell>
    );
  }

  const filteredBiomarkers = filter === "alert"
    ? biomarkers.filter((b) => b.status === "low" || b.status === "high" || b.status === "critical")
    : biomarkers;
  const isFirstPanel = trendPoints.length <= 1;

  return (
    <NuraPageShell rightAction={ShareButton} maxWidth={720}>
      {/* Title */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(28px, 4.5vw, 40px)",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {panel.name}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
          {fmtDate(panel.collected_date)} · {biomarkers.length} biomarkers
        </p>
      </div>

      {/* Score */}
      {panelScore && panelScore.total > 0 && (
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
          padding: 20, marginBottom: 16,
          display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" as const,
        }}>
          <HealthDonut score={panelScore} size={96} />
          <div style={{ flex: 1, minWidth: 180, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <ScoreTile count={panelScore.optimalCount} label="Optimal" color={SAGE} />
            <ScoreTile count={panelScore.watchCount} label="Watch" color={AMBER} />
            <ScoreTile count={panelScore.alertCount} label="Alert" color={RED} />
          </div>
        </div>
      )}

      {/* Trend */}
      {trendPoints.length >= 2 && (
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
          padding: 18, marginBottom: 16,
        }}>
          <TrendChart points={trendPoints} />
        </div>
      )}

      {/* Action plan */}
      {actionItems.length > 0 && (
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
          padding: 18, marginBottom: 16,
        }}>
          <div style={{ marginBottom: 14 }}>
            <SectionLabel>NŪRA&apos;s action plan</SectionLabel>
          </div>

          {actionItems.map((action, idx) => (
            <div key={action.title} style={{
              display: "flex", gap: 12,
              paddingBottom: idx < actionItems.length - 1 ? 14 : 0,
              marginBottom: idx < actionItems.length - 1 ? 14 : 0,
              borderBottom: idx < actionItems.length - 1 ? `0.5px solid ${BORDER}` : "none",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                background: `rgba(var(--nura-sage-rgb),0.18)`, border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, fontSize: 11, fontWeight: 600, color: SAGE,
              }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: TEXT, marginBottom: 4 }}>{action.title}</div>
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, lineHeight: 1.6 }}>{action.reasoning}</div>
                {action.action_type === "add_supplement" && action.supplement_suggestion && (
                  <button
                    onClick={() => handleAddSupplement(action)}
                    disabled={!!addingSupp || addedSupps.has(action.title)}
                    style={{
                      marginTop: 8, padding: "5px 11px", borderRadius: 8,
                      background: addedSupps.has(action.title) ? "transparent" : `rgba(var(--nura-sage-rgb),0.12)`,
                      border: `0.5px solid ${addedSupps.has(action.title) ? BORDER : `rgba(var(--nura-sage-rgb),0.4)`}`,
                      color: addedSupps.has(action.title) ? TEXT_TER : SAGE,
                      fontFamily: SANS, fontSize: 11, fontWeight: 500, cursor: addedSupps.has(action.title) ? "default" : "pointer",
                      opacity: addingSupp === action.title ? 0.5 : 1,
                    }}
                  >
                    {addedSupps.has(action.title) ? "✓ Added" : "+ Add to stack"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Save protocol */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `0.5px solid ${BORDER}` }}>
            {protocolSaved ? (
              <div style={{ textAlign: "center", padding: "6px 0", fontSize: 11, color: SAGE, fontWeight: 500, letterSpacing: "0.5px" }}>
                ✓ Saved as protocol
              </div>
            ) : showProtocolForm ? (
              <div>
                <div style={{ fontFamily: SANS, fontSize: 10, color: TEXT_TER, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
                  Protocol title
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={protocolTitle}
                    onChange={(e) => setProtocolTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveProtocol(); if (e.key === "Escape") setShowProtocolForm(false); }}
                    autoFocus
                    style={{
                      flex: 1, padding: "9px 12px", borderRadius: 9,
                      background: SURFACE, border: `0.5px solid ${BORDER}`,
                      color: TEXT, fontFamily: SANS, fontSize: 13, outline: "none",
                    }}
                  />
                  <button onClick={handleSaveProtocol} disabled={protocolSaving || !protocolTitle.trim()} style={{
                    padding: "9px 16px", borderRadius: 9, border: "none",
                    background: SAGE, color: SAGE_ON,
                    fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                    opacity: protocolSaving ? 0.5 : 1, whiteSpace: "nowrap",
                  }}>
                    {protocolSaving ? "…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setProtocolTitle(`${panel.name} Protocol — ${fmtDate(panel.collected_date)}`);
                  setShowProtocolForm(true);
                }}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 10,
                  background: "transparent", border: `0.5px solid rgba(var(--nura-sage-rgb),0.35)`,
                  color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >
                + Save as protocol
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel insight (if no action items) */}
      {panel.insight && actionItems.length === 0 && (
        <div style={{
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
          padding: 18, marginBottom: 16,
          borderLeft: `2px solid ${SAGE}`,
        }}>
          <div style={{ marginBottom: 8 }}><SectionLabel>NŪRA&apos;s read</SectionLabel></div>
          <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT, margin: 0, lineHeight: 1.6 }}>{panel.insight}</p>
        </div>
      )}

      {/* Biomarkers */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionLabel>Biomarkers · {filteredBiomarkers.length}</SectionLabel>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "alert"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 11px", borderRadius: 7,
                background: filter === f ? (f === "alert" ? `rgba(212,87,77,0.15)` : `rgba(var(--nura-sage-rgb),0.15)`) : "transparent",
                border: `0.5px solid ${filter === f ? (f === "alert" ? `rgba(212,87,77,0.4)` : `rgba(var(--nura-sage-rgb),0.4)`) : BORDER}`,
                color: filter === f ? (f === "alert" ? RED : SAGE) : TEXT_TER,
                fontFamily: SANS, fontSize: 11, fontWeight: 500, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isFirstPanel && biomarkers.length > 0 && (
        <div style={{
          padding: "8px 12px", marginBottom: 12, borderRadius: 8,
          background: SURFACE, border: `0.5px dashed ${BORDER}`,
          fontFamily: SANS, fontSize: 11, color: TEXT_TER,
        }}>
          First panel — sparklines populate as you add more
        </div>
      )}

      {filteredBiomarkers.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>
          {filter === "alert" ? "No alert biomarkers" : "No biomarkers"}
        </div>
      ) : (
        filteredBiomarkers.map((b) => (
          <BiomarkerCard key={b.id} b={b} history={histories[b.name] ?? []} isFirst={isFirstPanel} />
        ))
      )}

      {/* Delete (subtle, at bottom) */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button onClick={() => setDeleteConfirm(true)} style={{
          background: "none", border: "none", color: TEXT_TER,
          fontFamily: SANS, fontSize: 11, cursor: "pointer", letterSpacing: "0.5px",
        }}>
          Delete this panel
        </button>
      </div>

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: "fixed", bottom: 30, left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,20,21,0.95)", border: `0.5px solid rgba(var(--nura-sage-rgb),0.3)`,
          color: TEXT, padding: "8px 14px", borderRadius: 20, fontSize: 12, zIndex: 80,
        }}>
          {shareToast}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div onClick={() => !deleting && setDeleteConfirm(false)} style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--nura-bg)", border: `1px solid rgba(212,87,77,0.4)`,
            borderRadius: 14, padding: "22px 20px", maxWidth: 320, width: "100%",
          }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 22, color: TEXT, margin: "0 0 8px", fontWeight: 500 }}>Delete panel?</h3>
            <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 20px", lineHeight: 1.6 }}>
              This panel and all extracted biomarkers will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(false)} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: SURFACE, border: `0.5px solid ${BORDER}`,
                color: TEXT, fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "rgba(212,87,77,0.12)", border: `1px solid rgba(212,87,77,0.4)`,
                color: RED, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1,
              }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NuraPageShell>
  );
}

function ScoreTile({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{
      background: "rgba(var(--nura-bg-tint-rgb),0.03)", border: `0.5px solid ${BORDER}`, borderRadius: 10,
      padding: "10px 6px", textAlign: "center",
    }}>
      <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 500, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontFamily: SANS, fontSize: 10, color: TEXT_SEC, marginTop: 4 }}>{label}</div>
    </div>
  );
}
