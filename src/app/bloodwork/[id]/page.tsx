"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft, MoreVertical, AlertTriangle } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import { addSupplement } from "@/lib/supplements";
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

// ─── Primitives ──────────────────────────────────────────────────────────────

function CornerBrackets({ size = 10, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  const s = `${size}px`;
  return (
    <>
      <div style={{ position: "absolute", top: 6, left: 6, width: s, height: s, borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}` }} />
      <div style={{ position: "absolute", bottom: 6, right: 6, width: s, height: s, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
    </>
  );
}

function MonoLabel({ children, color, size = 9 }: { children: React.ReactNode; color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: size, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

function formatDateShort(d: string): string {
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

function statusColor(status: Biomarker["status"], fallback: string): string {
  if (status === "low" || status === "high" || status === "critical") return "#FF4C5C";
  if (status === "watch") return "#FFB400";
  return fallback;
}

function statusLabel(status: Biomarker["status"]): string {
  const map: Record<Biomarker["status"], string> = {
    low: "LOW", high: "HIGH", critical: "CRIT", watch: "WATCH", optimal: "OPT",
  };
  return map[status];
}

// ─── Donut ───────────────────────────────────────────────────────────────────

function HealthDonut({ score, size = 88 }: { score: HealthScore; size?: number }) {
  const { colors } = useTheme();
  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  const { optimalCount, watchCount, alertCount, total } = score;
  const optPct = total > 0 ? optimalCount / total : 0;
  const watchPct = total > 0 ? watchCount / total : 0;
  const alertPct = total > 0 ? alertCount / total : 0;

  const alertDash = alertPct * circ;
  const watchDash = watchPct * circ;
  const optDash = optPct * circ;

  const alertOffset = circ * 0.25;
  const watchOffset = alertOffset - alertDash;
  const optOffset = watchOffset - watchDash;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.mintBgMedium} strokeWidth={8} />
        {alertPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF4C5C" strokeWidth={8}
            strokeDasharray={`${alertDash} ${circ - alertDash}`} strokeDashoffset={alertOffset}
            strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: "drop-shadow(0 0 3px #FF4C5C)" }}
          />
        )}
        {watchPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FFB400" strokeWidth={8}
            strokeDasharray={`${watchDash} ${circ - watchDash}`} strokeDashoffset={watchOffset}
            strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: "drop-shadow(0 0 3px #FFB400)" }}
          />
        )}
        {optPct > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.mint} strokeWidth={8}
            strokeDasharray={`${optDash} ${circ - optDash}`} strokeDashoffset={optOffset}
            strokeLinecap="butt" transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 4px ${colors.mint})` }}
          />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700, color: colors.text, lineHeight: 1 }}>
          {score.score}
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 7, color: colors.textFaint, letterSpacing: "1px", marginTop: 1 }}>%OPT</div>
      </div>
    </div>
  );
}

function MetricTiles({ score }: { score: HealthScore }) {
  const { colors } = useTheme();
  const tiles = [
    { label: "OPT", value: score.optimalCount, color: colors.mint, bg: `${colors.mint}18` },
    { label: "WATCH", value: score.watchCount, color: "#FFB400", bg: "rgba(255,180,0,0.12)" },
    { label: "ALERT", value: score.alertCount, color: "#FF4C5C", bg: "rgba(255,76,92,0.12)" },
    { label: "TOTAL", value: score.total, color: colors.textMuted, bg: colors.mintBgMedium },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, flex: 1 }}>
      {tiles.map((t) => (
        <div key={t.label} style={{ background: t.bg, borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700, color: t.color, lineHeight: 1 }}>
            {t.value}
          </div>
          <div style={{ fontFamily: FONTS.mono, fontSize: 7, color: t.color, letterSpacing: "0.8px", marginTop: 3, opacity: 0.8 }}>
            {t.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Trend chart ─────────────────────────────────────────────────────────────

function TrendChart({ points }: { points: ScoreTrendPoint[] }) {
  const { colors } = useTheme();
  if (points.length < 2) return null;

  const W = 320;
  const H = 64;
  const pad = 8;

  const scores = points.map((p) => p.score);
  const minV = Math.max(0, Math.min(...scores) - 10);
  const maxV = Math.min(100, Math.max(...scores) + 10);
  const range = maxV - minV || 1;

  const toX = (i: number) => pad + (i / (points.length - 1)) * (W - pad * 2);
  const toY = (v: number) => H - pad - ((v - minV) / range) * (H - pad * 2);

  const pts = points.map((p, i) => `${toX(i)},${toY(p.score)}`).join(" ");
  const lastX = toX(points.length - 1);
  const lastY = toY(points[points.length - 1].score);

  const first = scores[0];
  const last = scores[scores.length - 1];
  const delta = last - first;
  const deltaStr = delta > 0 ? `↑ ${delta}% VS FIRST` : delta < 0 ? `↓ ${Math.abs(delta)}% VS FIRST` : "→ STABLE";
  const deltaColor = delta > 0 ? colors.mint : delta < 0 ? "#FF4C5C" : colors.textFaint;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <MonoLabel color={colors.textMuted}>HEALTH SCORE TREND</MonoLabel>
        <MonoLabel color={deltaColor}>{deltaStr}</MonoLabel>
      </div>
      <svg width={W} height={H + 20} style={{ display: "block" }}>
        <defs>
          <linearGradient id="detail-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.mint} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colors.mint} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pad},${H - pad} ${pts} ${toX(points.length - 1)},${H - pad}`} fill="url(#detail-trend-fill)" />
        <polyline points={pts} fill="none" stroke={colors.mint} strokeWidth={2} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${colors.mint})` }} />
        <circle cx={lastX} cy={lastY} r={5} fill={colors.mint} style={{ filter: `drop-shadow(0 0 6px ${colors.mint})` }} />
        <circle cx={lastX} cy={lastY} r={10} fill={colors.mintGlow} opacity={0.4} />
        {points.map((p, i) => (
          <text key={i} x={toX(i)} y={H + 14} textAnchor="middle" fontFamily={FONTS.mono} fontSize="8"
            fill={i === points.length - 1 ? colors.mint : colors.textGhost} letterSpacing="0.3">
            {formatDateShort(p.date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ history, color, width = 100, height = 32 }: {
  history: BiomarkerHistoryPoint[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (history.length === 0) return <div style={{ width, height }} />;
  if (history.length === 1) {
    const cx = width / 2;
    const cy = height / 2;
    return (
      <svg width={width} height={height}>
        <circle cx={cx} cy={cy} r={4} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      </svg>
    );
  }

  const values = history.map((h) => h.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pad = 4;

  const toX = (i: number) => pad + (i / (history.length - 1)) * (width - pad * 2);
  const toY = (v: number) => height - pad - ((v - minV) / range) * (height - pad * 2);

  const pts = history.map((h, i) => `${toX(i)},${toY(h.value)}`).join(" ");
  const lastX = toX(history.length - 1);
  const lastY = toY(history[history.length - 1].value);

  const fillId = `spark-fill-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${height - pad} ${pts} ${toX(history.length - 1)},${height - pad}`} fill={`url(#${fillId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
      <circle cx={lastX} cy={lastY} r={3} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

// ─── Range bar ───────────────────────────────────────────────────────────────

function RangeBar({ biomarker }: { biomarker: Biomarker }) {
  const { colors } = useTheme();
  const { value, reference_range_low: refLow, reference_range_high: refHigh, optimal_range_low: optLow, optimal_range_high: optHigh } = biomarker;

  if (!refLow && !refHigh && !optLow && !optHigh) return null;

  // Build a visual range: 0% = 0.5x refLow, 100% = 1.5x refHigh (or fallback)
  const low = refLow ?? (optLow ? optLow * 0.5 : 0);
  const high = refHigh ?? (optHigh ? optHigh * 1.5 : 100);
  const span = high - low || 1;

  const clampPct = (v: number) => Math.min(100, Math.max(0, ((v - low) / span) * 100));
  const markerPct = clampPct(value);

  // Zone widths
  const optStart = optLow ?? refLow ?? low;
  const optEnd = optHigh ?? refHigh ?? high;
  const optStartPct = clampPct(optStart);
  const optEndPct = clampPct(optEnd);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ position: "relative", height: 5, borderRadius: 3, overflow: "visible", background: "rgba(255,76,92,0.25)" }}>
        {/* watch low zone */}
        <div style={{ position: "absolute", left: `${clampPct(low)}%`, width: `${optStartPct - clampPct(low)}%`, height: "100%", background: "rgba(255,180,0,0.45)", borderRadius: "3px 0 0 3px" }} />
        {/* optimal zone */}
        <div style={{ position: "absolute", left: `${optStartPct}%`, width: `${optEndPct - optStartPct}%`, height: "100%", background: `${colors.mint}70` }} />
        {/* watch high zone */}
        <div style={{ position: "absolute", left: `${optEndPct}%`, width: `${clampPct(high) - optEndPct}%`, height: "100%", background: "rgba(255,180,0,0.45)", borderRadius: "0 3px 3px 0" }} />
        {/* marker */}
        <div
          style={{
            position: "absolute",
            left: `${markerPct}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: statusColor(biomarker.status, colors.mint),
            border: `1.5px solid ${colors.bg}`,
            boxShadow: `0 0 6px ${statusColor(biomarker.status, colors.mint)}`,
            zIndex: 2,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {refLow && <MonoLabel color={colors.textGhost} size={6.5}>&lt;{refLow} LOW</MonoLabel>}
        {optLow && optHigh && <MonoLabel color={colors.textGhost} size={6.5}>OPT {optLow}–{optHigh}</MonoLabel>}
        {refHigh && <MonoLabel color={colors.textGhost} size={6.5}>{refHigh}+ HIGH</MonoLabel>}
      </div>
    </div>
  );
}

// ─── Biomarker card ──────────────────────────────────────────────────────────

function BiomarkerCard({
  biomarker,
  history,
  isFirst,
}: {
  biomarker: Biomarker;
  history: BiomarkerHistoryPoint[];
  isFirst: boolean;
}) {
  const { colors } = useTheme();
  const sc = statusColor(biomarker.status, colors.mint);
  const sl = statusLabel(biomarker.status);
  const isAlert = biomarker.status === "low" || biomarker.status === "high" || biomarker.status === "critical";

  // Trend vs previous point
  let trendEl: React.ReactNode = null;
  if (history.length >= 2) {
    const prev = history[history.length - 2].value;
    const curr = history[history.length - 1].value;
    const diff = curr - prev;
    // "trending toward optimal" means moving into range if previously out, or stable
    const isOptimal = biomarker.status === "optimal";
    const trendColor = isOptimal ? colors.mint : diff === 0 ? colors.textFaint : "#FF4C5C";
    const symbol = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
    const label = diff === 0 ? "STABLE" : `${symbol} ${Math.abs(diff) % 1 === 0 ? Math.abs(diff).toString() : Math.abs(diff).toFixed(1)} VS PREV`;
    trendEl = <MonoLabel color={trendColor} size={8}>{label}</MonoLabel>;
  }

  return (
    <div
      style={{
        position: "relative",
        padding: "12px 14px",
        background: isAlert ? "rgba(255,76,92,0.05)" : biomarker.status === "watch" ? "rgba(255,180,0,0.05)" : colors.mintBgSubtle,
        border: `1px solid ${sc}40`,
        borderLeft: `3px solid ${sc}`,
        borderRadius: "0 10px 10px 0",
        marginBottom: 8,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div style={{ fontFamily: FONTS.sans, fontSize: 12.5, fontWeight: 600, color: colors.text, marginBottom: 2 }}>
            {biomarker.name}
          </div>
          {biomarker.notes && (
            <MonoLabel color={colors.textGhost} size={8}>{biomarker.notes}</MonoLabel>
          )}
        </div>
        <div
          style={{
            padding: "2px 8px",
            background: `${sc}20`,
            border: `1px solid ${sc}50`,
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          <MonoLabel color={sc} size={8}>{sl}</MonoLabel>
        </div>
      </div>

      {/* Value row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700, color: sc, lineHeight: 1, textShadow: `0 0 12px ${sc}60` }}>
              {biomarker.value % 1 === 0 ? biomarker.value.toString() : biomarker.value.toFixed(1)}
            </span>
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, color: colors.textGhost, letterSpacing: "1px" }}>{biomarker.unit}</span>
          </div>
          {trendEl && <div style={{ marginTop: 3 }}>{trendEl}</div>}
          {history.length === 1 && isFirst && (
            <div style={{ marginTop: 4 }}>
              <MonoLabel color={colors.textGhost} size={7.5}>FIRST PANEL — SPARKLINES POPULATE WITH MORE DATA</MonoLabel>
            </div>
          )}
        </div>
        {history.length > 0 && (
          <Sparkline history={history} color={sc} width={100} height={32} />
        )}
      </div>

      <RangeBar biomarker={biomarker} />
    </div>
  );
}

// ─── Detail page ─────────────────────────────────────────────────────────────

export default function BloodworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: panelId } = use(params);
  const router = useRouter();
  const { colors } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [panel, setPanel] = useState<LabPanel | null>(null);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [panelScore, setPanelScore] = useState<HealthScore | null>(null);
  const [trendPoints, setTrendPoints] = useState<ScoreTrendPoint[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [biomarkerHistories, setBiomarkerHistories] = useState<Record<string, BiomarkerHistoryPoint[]>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "alert">("all");
  const [addingSupp, setAddingSupp] = useState<string | null>(null);
  const [addedSupps, setAddedSupps] = useState<Set<string>>(new Set());

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [{ panel: p, biomarkers: bm }, score, trend, actions] = await Promise.all([
        getPanelById(panelId),
        getPanelScore(panelId),
        getHealthScoreTrend(userId),
        getTopActionItems(panelId, "panel"),
      ]);
      setPanel(p);
      setBiomarkers(bm);
      setPanelScore(score);
      setTrendPoints(trend);
      setActionItems(actions);

      // load histories in parallel for all biomarkers
      const historyEntries = await Promise.all(
        bm.map(async (b) => {
          const history = await getBiomarkerHistory(userId, b.name);
          return [b.name, history] as [string, BiomarkerHistoryPoint[]];
        })
      );
      setBiomarkerHistories(Object.fromEntries(historyEntries));
    } catch {
      setError("Failed to load panel data.");
    } finally {
      setLoading(false);
    }
  }, [panelId]);

  useEffect(() => {
    if (!user) return;
    loadData(user.id);
  }, [user, loadData]);

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
    } catch {
      // silent
    } finally {
      setAddingSupp(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePanelAndBiomarkers(panelId);
      router.push("/bloodwork");
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const filteredBiomarkers = filter === "alert"
    ? biomarkers.filter((b) => b.status === "low" || b.status === "high" || b.status === "critical")
    : biomarkers;

  const isFirstPanel = trendPoints.length <= 1;

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  if (error || !panel) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
        <AlertTriangle size={24} color="#FF4C5C" />
        <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: "#FF4C5C", letterSpacing: "1px" }}>{error ?? "PANEL NOT FOUND"}</div>
        <button onClick={() => router.push("/bloodwork")} style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.mint, background: "none", border: "none", cursor: "pointer", letterSpacing: "1px" }}>
          ← BACK TO BLOODWORK
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* Custom topbar for detail page */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", height: 56,
          background: colors.bgTopbar,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={() => router.push("/bloodwork")}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, borderRadius: 8, padding: 0 }}
        >
          <ChevronLeft size={22} />
        </button>
        <div style={{ fontFamily: FONTS.serif, fontSize: 17, color: colors.text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {panel.name}
        </div>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, borderRadius: 8, padding: 0 }}
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div
              style={{ position: "absolute", right: 0, top: 40, background: colors.bgSidebar, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "4px 0", zIndex: 200, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}
              onClick={() => setMenuOpen(false)}
            >
              <button
                onClick={() => { setMenuOpen(false); setDeleteConfirm(true); }}
                style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: "1px", color: "#FF4C5C", textAlign: "left" }}
              >
                DELETE PANEL
              </button>
            </div>
          )}
        </div>
      </div>
      {menuOpen && <div style={{ position: "fixed", inset: 0, zIndex: 150 }} onClick={() => setMenuOpen(false)} />}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />
      <div style={{ display: "none" }}><Topbar onMenuClick={() => setSidebarOpen(true)} /></div>

      <div style={{ padding: "20px 20px 80px", maxWidth: 480, margin: "0 auto" }}>

        {/* Subtitle */}
        <div style={{ marginBottom: 20 }}>
          <MonoLabel color={colors.textFaint}>
            {formatDate(panel.collected_date)} · {biomarkers.length} BIOMARKERS
          </MonoLabel>
        </div>

        {/* ── Panel score hero ── */}
        {panelScore && panelScore.total > 0 && (
          <div
            style={{
              position: "relative",
              padding: "16px",
              background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})`,
              border: `1px solid ${colors.mintBorder}`,
              borderRadius: 14,
              marginBottom: 14,
            }}
          >
            <CornerBrackets />
            <MonoLabel color={colors.mint}>PANEL SCORE</MonoLabel>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
              <HealthDonut score={panelScore} size={88} />
              <MetricTiles score={panelScore} />
            </div>
          </div>
        )}

        {/* ── Trend chart ── */}
        {trendPoints.length >= 2 && (
          <div
            style={{
              position: "relative",
              padding: "16px",
              background: colors.mintBgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              marginBottom: 14,
            }}
          >
            <CornerBrackets />
            <TrendChart points={trendPoints} />
          </div>
        )}

        {/* ── NŪRA Action Plan ── */}
        {actionItems.length > 0 && (
          <div
            style={{
              position: "relative",
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})`,
              border: `1px solid ${colors.mintBorder}`,
              borderRadius: 14,
              marginBottom: 14,
            }}
          >
            <CornerBrackets />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
              <MonoLabel color={colors.mint}>NŪRA&apos;S ACTION PLAN</MonoLabel>
            </div>

            {actionItems.map((action, idx) => (
              <div
                key={action.title}
                style={{
                  display: "flex",
                  gap: 12,
                  paddingBottom: idx < actionItems.length - 1 ? 12 : 0,
                  marginBottom: idx < actionItems.length - 1 ? 12 : 0,
                  borderBottom: idx < actionItems.length - 1 ? `1px solid ${colors.borderFaint}` : "none",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: `${colors.mint}25`,
                    border: `1.5px solid ${colors.mintBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, color: colors.mint }}>{idx + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 3 }}>
                    {action.title}
                  </div>
                  <div style={{ fontFamily: FONTS.sans, fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
                    {action.reasoning}
                  </div>
                  {action.action_type === "add_supplement" && action.supplement_suggestion && (
                    <button
                      onClick={() => handleAddSupplement(action)}
                      disabled={!!addingSupp || addedSupps.has(action.title)}
                      style={{
                        marginTop: 8,
                        padding: "5px 12px",
                        background: addedSupps.has(action.title) ? colors.mintBgSubtle : `${colors.mint}25`,
                        border: `1px solid ${addedSupps.has(action.title) ? colors.border : colors.mintBorder}`,
                        borderRadius: 7,
                        fontFamily: FONTS.mono,
                        fontSize: 8.5,
                        fontWeight: 700,
                        color: addedSupps.has(action.title) ? colors.textFaint : colors.mint,
                        letterSpacing: "1px",
                        cursor: addedSupps.has(action.title) ? "default" : "pointer",
                        opacity: addingSupp === action.title ? 0.5 : 1,
                      }}
                    >
                      {addedSupps.has(action.title) ? "✓ ADDED" : "+ ADD"}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {panel.insight && actionItems.length === 0 && (
              <p style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.7 }}>
                {panel.insight}
              </p>
            )}
          </div>
        )}

        {/* Panel insight (if not covered by actions) */}
        {panel.insight && actionItems.length > 0 && (
          <div
            style={{
              position: "relative",
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})`,
              border: `1px solid ${colors.mintBorder}`,
              borderRadius: 14,
              marginBottom: 14,
            }}
          >
            <CornerBrackets />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
              <MonoLabel color={colors.mint}>NŪRA&apos;S READ</MonoLabel>
            </div>
            <p style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.7 }}>
              {panel.insight}
            </p>
          </div>
        )}

        {/* ── Biomarkers ── */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MonoLabel color={colors.textMuted}>BIOMARKERS</MonoLabel>
              <div style={{ width: 20, height: 16, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MonoLabel color={colors.textFaint}>{filteredBiomarkers.length}</MonoLabel>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["all", "alert"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "4px 10px",
                    background: filter === f ? (f === "alert" ? "rgba(255,76,92,0.15)" : colors.mintBgMedium) : "transparent",
                    border: `1px solid ${filter === f ? (f === "alert" ? "rgba(255,76,92,0.4)" : colors.mintBorder) : colors.borderFaint}`,
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 8.5,
                    fontWeight: 700,
                    color: filter === f ? (f === "alert" ? "#FF4C5C" : colors.mint) : colors.textFaint,
                    letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {isFirstPanel && biomarkers.length > 0 && (
            <div style={{ padding: "8px 12px", background: colors.mintBgSubtle, border: `1px dashed ${colors.mintBorder}`, borderRadius: 8, marginBottom: 12 }}>
              <MonoLabel color={colors.textGhost} size={8}>FIRST PANEL — SPARKLINES POPULATE AS YOU ADD MORE PANELS</MonoLabel>
            </div>
          )}

          {filteredBiomarkers.length === 0 ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", textAlign: "center", padding: "24px 0" }}>
              {filter === "alert" ? "NO ALERT BIOMARKERS" : "NO BIOMARKERS"}
            </div>
          ) : (
            filteredBiomarkers.map((b) => (
              <BiomarkerCard
                key={b.id}
                biomarker={b}
                history={biomarkerHistories[b.name] ?? []}
                isFirst={isFirstPanel}
              />
            ))
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div
          onClick={() => !deleting && setDeleteConfirm(false)}
          style={{ position: "fixed", inset: 0, background: colors.overlay, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: colors.bgSidebar, border: "1px solid rgba(255,76,92,0.4)", borderRadius: 16, padding: "24px 20px", maxWidth: 320, width: "100%" }}
          >
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: colors.text, margin: "0 0 8px", fontWeight: 400 }}>Delete panel?</h3>
            <p style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
              This panel and all extracted biomarkers will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(false)} disabled={deleting} style={{ flex: 1, padding: 11, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 10, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: colors.textMuted, cursor: "pointer" }}>
                CANCEL
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.4)", borderRadius: 10, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#FF4C5C", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
