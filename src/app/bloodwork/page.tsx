"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Upload, FileText, AlertTriangle, ChevronRight } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { addSupplement } from "@/lib/supplements";
import {
  getUserPanels,
  getPanelsBiomarkers,
  deletePanelAndBiomarkers,
  getHealthScoreTrend,
  getOverallHealthScore,
  getTopActionItems,
  type LabPanel,
  type Biomarker,
  type HealthScore,
  type ScoreTrendPoint,
  type ActionItem,
} from "@/lib/bloodwork";

// ─── Shared primitives ────────────────────────────────────────────────────────

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

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

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

function countsByStatus(biomarkers: Biomarker[]) {
  return {
    optimal: biomarkers.filter((b) => b.status === "optimal").length,
    watch: biomarkers.filter((b) => b.status === "watch").length,
    alert: biomarkers.filter((b) => b.status === "low" || b.status === "high" || b.status === "critical").length,
    total: biomarkers.length,
  };
}

// ─── Donut chart ─────────────────────────────────────────────────────────────

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

  const offset = 0;
  const alertOffset = circ * 0.25; // start at top
  const watchOffset = alertOffset - alertDash;
  const optOffset = watchOffset - watchDash;

  void offset;

  const alertColor = "#FF4C5C";
  const watchColor = "#FFB400";
  const optColor = colors.mint;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.mintBgMedium} strokeWidth={8} />
        {/* alert segment */}
        {alertPct > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={alertColor} strokeWidth={8}
            strokeDasharray={`${alertDash} ${circ - alertDash}`}
            strokeDashoffset={alertOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 3px ${alertColor})` }}
          />
        )}
        {/* watch segment */}
        {watchPct > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={watchColor} strokeWidth={8}
            strokeDasharray={`${watchDash} ${circ - watchDash}`}
            strokeDashoffset={watchOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 3px ${watchColor})` }}
          />
        )}
        {/* optimal segment */}
        {optPct > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={optColor} strokeWidth={8}
            strokeDasharray={`${optDash} ${circ - optDash}`}
            strokeDashoffset={optOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ filter: `drop-shadow(0 0 4px ${optColor})` }}
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

// ─── Metric tiles ─────────────────────────────────────────────────────────────

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
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H + 20} style={{ display: "block" }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.mint} stopOpacity="0.35" />
              <stop offset="100%" stopColor={colors.mint} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${pad},${H - pad} ${pts} ${toX(points.length - 1)},${H - pad}`}
            fill="url(#trend-fill)"
          />
          <polyline
            points={pts}
            fill="none"
            stroke={colors.mint}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 4px ${colors.mint})` }}
          />
          <circle cx={lastX} cy={lastY} r={5} fill={colors.mint} style={{ filter: `drop-shadow(0 0 6px ${colors.mint})` }} />
          <circle cx={lastX} cy={lastY} r={10} fill={colors.mintGlow} opacity={0.4} />
          {points.map((p, i) => (
            <text
              key={i}
              x={toX(i)}
              y={H + 14}
              textAnchor="middle"
              fontFamily={FONTS.mono}
              fontSize="8"
              fill={i === points.length - 1 ? colors.mint : colors.textGhost}
              letterSpacing="0.3"
            >
              {formatDateShort(p.date)}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BloodworkPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [panelBiomarkers, setPanelBiomarkers] = useState<Record<string, Biomarker[]>>({});
  const [panelsLoading, setPanelsLoading] = useState(true);
  const [panelsError, setPanelsError] = useState<string | null>(null);

  const [overallScore, setOverallScore] = useState<HealthScore | null>(null);
  const [trendPoints, setTrendPoints] = useState<ScoreTrendPoint[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addingSupp, setAddingSupp] = useState<string | null>(null);
  const [addedSupps, setAddedSupps] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  const loadPanels = useCallback(async (userId: string) => {
    setPanelsLoading(true);
    setPanelsError(null);
    try {
      const fetchedPanels = await getUserPanels(userId);
      setPanels(fetchedPanels);
      const analyzedIds = fetchedPanels.filter((p) => p.status === "analyzed").map((p) => p.id);
      if (analyzedIds.length > 0) {
        const bm = await getPanelsBiomarkers(analyzedIds);
        setPanelBiomarkers(bm);
      }
    } catch {
      setPanelsError("Failed to load panels.");
    } finally {
      setPanelsLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async (userId: string) => {
    setAnalyticsLoading(true);
    try {
      const [score, trend, actions] = await Promise.all([
        getOverallHealthScore(userId),
        getHealthScoreTrend(userId),
        getTopActionItems(userId, "user"),
      ]);
      setOverallScore(score);
      setTrendPoints(trend);
      setActionItems(actions);
    } catch {
      // analytics optional — fail silently
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadPanels(user.id);
    loadAnalytics(user.id);
  }, [user, loadPanels, loadAnalytics]);

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploadError(null);
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10MB.");
      return;
    }
    setUploadStatus("uploading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      setUploadStatus("processing");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/bloodwork/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body.error ?? "Upload failed");
      }
      setUploadStatus("done");
      await loadPanels(user.id);
      await loadAnalytics(user.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploadStatus("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePanelAndBiomarkers(deleteTarget);
      setPanels((prev) => prev.filter((p) => p.id !== deleteTarget));
      setPanelBiomarkers((prev) => { const next = { ...prev }; delete next[deleteTarget]; return next; });
      setDeleteTarget(null);
      if (user) { await loadAnalytics(user.id); }
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

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

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";
  const hasAnalyzedPanels = panels.some((p) => p.status === "analyzed");
  const latestPanel = panels.find((p) => p.status === "analyzed");
  const topAction = actionItems[0] ?? null;

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes action-glow { 0%, 100% { box-shadow: 0 0 12px ${colors.mint}30; } 50% { box-shadow: 0 0 20px ${colors.mint}50; } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 4px" }}>
            Bloodwork Panel
          </h1>
          <MonoLabel color={colors.textFaint}>UPLOAD LABS · NŪRA READS THEM</MonoLabel>
        </div>

        {/* ── HERO: Overall score (only with data) ── */}
        {!analyticsLoading && hasAnalyzedPanels && overallScore && overallScore.total > 0 && (
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
            <MonoLabel color={colors.mint}>OVERALL HEALTH SCORE</MonoLabel>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
              <HealthDonut score={overallScore} size={88} />
              <MetricTiles score={overallScore} />
            </div>
          </div>
        )}

        {/* ── Trend chart ── */}
        {!analyticsLoading && trendPoints.length >= 2 && (
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

        {/* single panel placeholder */}
        {!analyticsLoading && hasAnalyzedPanels && trendPoints.length === 1 && (
          <div
            style={{
              padding: "12px 14px",
              background: colors.mintBgSubtle,
              border: `1px dashed ${colors.mintBorder}`,
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <MonoLabel color={colors.textGhost}>TREND AVAILABLE AFTER 2ND PANEL</MonoLabel>
            <p style={{ fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textFaint, margin: "6px 0 0", lineHeight: 1.6 }}>
              Upload another panel to see your score trend. NŪRA tracks progress over time.
            </p>
          </div>
        )}

        {/* ── Upload zone ── */}
        {!hasAnalyzedPanels ? (
          /* Big upload when no panels */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              position: "relative",
              border: `2px dashed ${dragging ? colors.mint : isUploading ? colors.mintBorderStrong : colors.mintBorder}`,
              borderRadius: 16,
              padding: "32px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              background: dragging ? colors.mintBgMedium : isUploading ? colors.mintBgMedium : colors.mintBgSubtle,
              transition: "all 0.2s",
              marginBottom: 20,
              cursor: isUploading ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? (
              <>
                <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${colors.mintBorder}`, borderTopColor: colors.mint, animation: "spin 1s linear infinite" }} />
                <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500, color: colors.textMuted, textAlign: "center" }}>
                  {uploadStatus === "uploading" ? "Uploading PDF..." : "NŪRA is analyzing your labs..."}
                </div>
                <MonoLabel color={colors.textGhost}>{uploadStatus === "processing" ? "THIS MAY TAKE 20–40 SECONDS" : "PLEASE WAIT"}</MonoLabel>
              </>
            ) : uploadStatus === "done" ? (
              <>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${colors.mint}20`, border: `1px solid ${colors.mintBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={24} color={colors.mint} />
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500, color: colors.mint }}>Analysis complete</div>
                <MonoLabel color={colors.textGhost}>UPLOAD ANOTHER PDF</MonoLabel>
              </>
            ) : (
              <>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: colors.mintBgMedium, border: `1px solid ${colors.mintBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Upload size={24} color={colors.mint} />
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 15, fontWeight: 500, color: colors.textMuted }}>Upload bloodwork</div>
                <MonoLabel color={colors.textGhost}>PDF ONLY · MAX 10MB</MonoLabel>
                <div style={{ marginTop: 4, padding: "9px 20px", background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, borderRadius: 8, fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, color: colors.textOnAccent, letterSpacing: "1px" }}>
                  CHOOSE FILE
                </div>
              </>
            )}
          </div>
        ) : (
          /* Compact upload strip when panels exist */
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: dragging ? colors.mintBgMedium : colors.mintBgSubtle,
              border: `1px solid ${dragging ? colors.mintBorder : colors.borderFaint}`,
              borderRadius: 12,
              marginBottom: 14,
              transition: "all 0.2s",
            }}
          >
            {isUploading ? (
              <>
                <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${colors.mintBorder}`, borderTopColor: colors.mint, animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textMuted }}>
                    {uploadStatus === "uploading" ? "Uploading..." : "NŪRA reading your labs..."}
                  </div>
                  <MonoLabel color={colors.textGhost}>PLEASE WAIT</MonoLabel>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: colors.mintBgMedium, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Upload size={14} color={colors.mint} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textMuted }}>Upload new bloodwork</div>
                  <MonoLabel color={colors.textGhost}>PDF · MAX 10MB</MonoLabel>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "6px 14px",
                    background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                    border: "none",
                    borderRadius: 8,
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    fontWeight: 700,
                    color: colors.textOnAccent,
                    letterSpacing: "1px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  CHOOSE
                </button>
              </>
            )}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={handleFileInput} />

        {uploadError && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.4)", borderRadius: 10, marginBottom: 14 }}>
            <AlertTriangle size={14} color="#FF4C5C" />
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: "#FF4C5C", letterSpacing: "0.06em" }}>{uploadError}</span>
          </div>
        )}

        {/* ── NŪRA Top Action ── */}
        {!analyticsLoading && topAction && (
          <div
            style={{
              position: "relative",
              padding: "14px 16px",
              background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})`,
              border: `1px solid ${colors.mintBorder}`,
              borderRadius: 14,
              marginBottom: 14,
              animation: "action-glow 3s ease-in-out infinite",
            }}
          >
            <CornerBrackets />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
              <MonoLabel color={colors.mint}>NŪRA&apos;S TOP ACTION</MonoLabel>
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
              {topAction.title}
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textMuted, lineHeight: 1.6, marginBottom: topAction.action_type === "add_supplement" ? 10 : 0 }}>
              {topAction.reasoning}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {topAction.action_type === "add_supplement" && topAction.supplement_suggestion && (
                <button
                  onClick={() => handleAddSupplement(topAction)}
                  disabled={!!addingSupp || addedSupps.has(topAction.title)}
                  style={{
                    padding: "6px 14px",
                    background: addedSupps.has(topAction.title) ? colors.mintBgSubtle : `${colors.mint}25`,
                    border: `1px solid ${addedSupps.has(topAction.title) ? colors.border : colors.mintBorder}`,
                    borderRadius: 8,
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    fontWeight: 700,
                    color: addedSupps.has(topAction.title) ? colors.textFaint : colors.mint,
                    letterSpacing: "1px",
                    cursor: addedSupps.has(topAction.title) ? "default" : "pointer",
                    opacity: addingSupp === topAction.title ? 0.5 : 1,
                  }}
                >
                  {addedSupps.has(topAction.title) ? "✓ ADDED" : "+ ADD SUPPLEMENT"}
                </button>
              )}
              {latestPanel && (
                <button
                  onClick={() => router.push(`/bloodwork/${latestPanel.id}`)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONTS.mono,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "1px",
                    color: colors.textFaint,
                    marginLeft: "auto",
                    padding: 0,
                  }}
                >
                  {actionItems.length > 1 ? `+ ${actionItems.length - 1} MORE · VIEW ALL →` : "VIEW PANEL →"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Panels list ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <MonoLabel color={colors.textMuted}>RECENT PANELS</MonoLabel>
            {!panelsLoading && (
              <div style={{ width: 20, height: 16, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MonoLabel color={colors.textFaint}>{panels.length}</MonoLabel>
              </div>
            )}
          </div>

          {panelsLoading ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", textAlign: "center", padding: "24px 0" }}>LOADING...</div>
          ) : panelsError ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: "#FF4C5C", textAlign: "center", padding: "16px 0" }}>{panelsError}</div>
          ) : panels.length === 0 ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", textAlign: "center", padding: "24px 0" }}>
              NO PANELS YET — UPLOAD YOUR FIRST LAB REPORT
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {panels.map((panel) => {
                const bm = panelBiomarkers[panel.id] ?? [];
                const counts = countsByStatus(bm);
                const isProcessing = panel.status === "processing";
                const isFailed = panel.status === "failed";
                const isAnalyzed = panel.status === "analyzed";

                return (
                  <div
                    key={panel.id}
                    onClick={() => isAnalyzed && router.push(`/bloodwork/${panel.id}`)}
                    style={{
                      position: "relative",
                      padding: "14px 16px",
                      background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      cursor: isAnalyzed ? "pointer" : "default",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <CornerBrackets size={8} />
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: colors.mintBgMedium, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isProcessing ? (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${colors.mintBorder}`, borderTopColor: colors.mint, animation: "spin 1s linear infinite" }} />
                        ) : (
                          <FileText size={17} color={isFailed ? "#FF4C5C" : colors.mint} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: 600, color: colors.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {panel.name}
                        </div>
                        <MonoLabel color={colors.textGhost}>{formatDate(panel.collected_date)}</MonoLabel>

                        {isProcessing && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFB400", animation: "live-pulse 1.5s ease-in-out infinite" }} />
                            <MonoLabel color="#FFB400">PROCESSING...</MonoLabel>
                          </div>
                        )}

                        {isFailed && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                            <AlertTriangle size={11} color="#FF4C5C" />
                            <MonoLabel color="#FF4C5C">ANALYSIS FAILED</MonoLabel>
                          </div>
                        )}

                        {isAnalyzed && counts.total > 0 && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                            {counts.optimal > 0 && (
                              <div style={{ background: `${colors.mint}18`, border: `1px solid ${colors.mint}30`, borderRadius: 4, padding: "2px 7px" }}>
                                <MonoLabel color={colors.mint} size={8}>{counts.optimal} OPTIMAL</MonoLabel>
                              </div>
                            )}
                            {counts.watch > 0 && (
                              <div style={{ background: "rgba(255,180,0,0.12)", border: "1px solid rgba(255,180,0,0.35)", borderRadius: 4, padding: "2px 7px" }}>
                                <MonoLabel color="#FFB400" size={8}>{counts.watch} WATCH</MonoLabel>
                              </div>
                            )}
                            {counts.alert > 0 && (
                              <div style={{ background: "rgba(255,76,92,0.12)", border: "1px solid rgba(255,76,92,0.35)", borderRadius: 4, padding: "2px 7px" }}>
                                <MonoLabel color="#FF4C5C" size={8}>{counts.alert} ALERT</MonoLabel>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {isAnalyzed && <ChevronRight size={16} color={colors.textGhost} />}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(panel.id); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: colors.textGhost, padding: 4, display: "flex", alignItems: "center" }}
                        >
                          <span style={{ fontFamily: FONTS.mono, fontSize: 14, lineHeight: 1 }}>⋮</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
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
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: 11, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 10, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: colors.textMuted, cursor: "pointer" }}>
                CANCEL
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: 11, background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.4)", borderRadius: 10, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#FF4C5C", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
