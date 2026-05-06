"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  getUserSupplements,
  getTodaysLogs,
  logSupplementTaken,
  unlogSupplementTaken,
  type Supplement,
} from "@/lib/supplements";
import { getLatestBiomarkers, type Biomarker } from "@/lib/bloodwork";
import { TrendingUp, Check } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

function CornerBrackets({ size = 10, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  const s = `${size}px`;
  const t = "2px";
  return (
    <>
      <div style={{ position: "absolute", top: 6, left: 6, width: s, height: s, borderTop: `${t} solid ${c}`, borderLeft: `${t} solid ${c}` }} />
      <div style={{ position: "absolute", bottom: 6, right: 6, width: s, height: s, borderBottom: `${t} solid ${c}`, borderRight: `${t} solid ${c}` }} />
    </>
  );
}

function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { colors } = useTheme();
  return (
    <div
      style={{
        position: "relative",
        background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`,
        border: `1px solid ${colors.mintBorder}`,
        borderRadius: 12,
        padding: "16px",
        ...style,
      }}
    >
      <CornerBrackets />
      {children}
    </div>
  );
}

function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

function ProgressBar({ value, color }: { value: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  return (
    <div style={{ height: 4, background: colors.mintBgMedium, borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${value}%`,
          background: `linear-gradient(90deg, ${c}, ${colors.mintBright})`,
          borderRadius: 2,
          boxShadow: `0 0 6px ${c}80`,
        }}
      />
    </div>
  );
}

const RECOVERY_METRICS = [
  { label: "SYNC LOAD", value: 88 },
  { label: "RESPONSE", value: 72 },
  { label: "BUFFER", value: 94 },
  { label: "LATENCY", value: 64 },
];

const HRV_POINTS = [58, 61, 55, 63, 67, 65, 68];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export default function DashboardPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<string[]>([]);
  const [suppLoading, setSuppLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [biomarkersLoading, setBiomarkersLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth");
      else { setUser(user); setAuthLoading(false); }
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setSuppLoading(true);
    Promise.all([getUserSupplements(user.id), getTodaysLogs(user.id)])
      .then(([supps, logs]) => {
        setSupplements(supps);
        setTodaysLogs(logs);
        setSuppLoading(false);
      })
      .catch(() => setSuppLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setBiomarkersLoading(true);
    getLatestBiomarkers(user.id)
      .then((bm) => { setBiomarkers(bm.slice(0, 3)); setBiomarkersLoading(false); })
      .catch(() => setBiomarkersLoading(false));
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  const biomarkerColor = (status: string) => {
    if (status === "low" || status === "high" || status === "critical") return colors.danger;
    if (status === "watch") return colors.warn;
    return colors.mint;
  };
  const biomarkerLabel = (status: string) => {
    const map: Record<string, string> = { low: "LOW", high: "HIGH", critical: "CRIT", watch: "WATCH", optimal: "OPT" };
    return map[status] ?? status.toUpperCase();
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "USER";
  const userInitial = userName.charAt(0).toUpperCase();
  const userHandle = (user?.user_metadata?.name || user?.email?.split("@")[0] || "USER").toUpperCase().replace(/\s/g, "_");

  const handleDashCheck = async (supplementId: string, isLogged: boolean) => {
    if (!user || pendingIds.has(supplementId)) return;
    setPendingIds((prev) => new Set(prev).add(supplementId));
    setTodaysLogs((prev) =>
      isLogged ? prev.filter((id) => id !== supplementId) : [...prev, supplementId]
    );
    try {
      if (isLogged) await unlogSupplementTaken(user.id, supplementId);
      else await logSupplementTaken(user.id, supplementId);
    } catch {
      setTodaysLogs((prev) =>
        isLogged ? [...prev, supplementId] : prev.filter((id) => id !== supplementId)
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(supplementId);
        return next;
      });
    }
  };

  const dailySupplements = supplements.filter((s) => s.frequency === "daily");
  const displayedSupplements = dailySupplements.slice(0, 4);
  const remainingSupplements = dailySupplements.length - displayedSupplements.length;
  const dailyTakenCount = todaysLogs.filter((id) =>
    dailySupplements.some((s) => s.id === id)
  ).length;

  const chartH = 60;
  const chartW = 260;
  const min = Math.min(...HRV_POINTS);
  const max = Math.max(...HRV_POINTS);
  const pts = HRV_POINTS.map((v, i) => {
    const x = (i / (HRV_POINTS.length - 1)) * chartW;
    const y = chartH - ((v - min) / (max - min || 1)) * chartH;
    return `${x},${y}`;
  }).join(" ");
  const lastX = chartW;
  const lastY = chartH - ((HRV_POINTS[HRV_POINTS.length - 1] - min) / (max - min || 1)) * chartH;

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes spin-ring { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin-ring-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 4px" }}>
              Health Stream
            </h1>
            <MonoLabel>{userHandle} · WK 03 · DAY 247</MonoLabel>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: colors.mintBgMedium,
              border: `1px solid ${colors.mintBorder}`,
              borderRadius: 20,
              padding: "5px 10px",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite" }} />
            <MonoLabel color={colors.mint}>SYNCED</MonoLabel>
          </div>
        </div>

        {/* 4-up biometric strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "HRV", value: "68", unit: "MS", trend: "up", delta: "+8" },
            { label: "RHR", value: "52", unit: "BPM", trend: "neutral", delta: "—" },
            { label: "SPO2", value: "98", unit: "%", trend: "up", delta: "" },
            { label: "TEMP", value: "97.6", unit: "°F", trend: "neutral", delta: "" },
          ].map((m) => (
            <Panel key={m.label} style={{ padding: "12px 10px", textAlign: "center" }}>
              <CornerBrackets size={6} />
              <MonoLabel color={colors.textFaint}>{m.label}</MonoLabel>
              <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 600, color: colors.text, margin: "4px 0 2px", lineHeight: 1 }}>
                {m.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <MonoLabel color={colors.textGhost}>{m.unit}</MonoLabel>
                {m.trend === "up" && m.delta && (
                  <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: colors.mint, marginLeft: 2 }}>↑{m.delta}</span>
                )}
              </div>
            </Panel>
          ))}
        </div>

        {/* Recovery Orbital */}
        <Panel style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <MonoLabel color={colors.textMuted}>RECOVERY ORBITAL</MonoLabel>
            <MonoLabel color={colors.mint}>SCORE 82</MonoLabel>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px dashed ${colors.mintBorder}`, animation: "spin-ring 12s linear infinite" }} />
              <div style={{ position: "absolute", inset: 8, borderRadius: "50%", border: `1.5px dashed ${colors.mintBgMedium}`, animation: "spin-ring-rev 8s linear infinite" }} />
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="30" fill="none" stroke={colors.mintBgMedium} strokeWidth="8" />
                <circle
                  cx="40" cy="40" r="30" fill="none"
                  stroke={colors.mint} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 30 * 0.82} ${2 * Math.PI * 30 * 0.18}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  style={{ filter: `drop-shadow(0 0 4px ${colors.mint})` }}
                />
              </svg>
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700, color: colors.text }}>82</div>
                <MonoLabel color={colors.textFaint}>REC</MonoLabel>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {RECOVERY_METRICS.map((m) => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <MonoLabel color={colors.textFaint}>{m.label}</MonoLabel>
                    <MonoLabel color={colors.textMuted}>{m.value}%</MonoLabel>
                  </div>
                  <ProgressBar value={m.value} />
                </div>
              ))}
            </div>
          </div>
        </Panel>

        {/* HRV 7D Trend */}
        <Panel style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <MonoLabel color={colors.textMuted}>HRV 7D TREND</MonoLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingUp size={12} color={colors.mint} />
              <MonoLabel color={colors.mint}>+8MS</MonoLabel>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <svg width={chartW} height={chartH + 20} style={{ display: "block" }}>
              <defs>
                <linearGradient id="hrv-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.mint} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colors.mint} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`0,${chartH} ${pts} ${chartW},${chartH}`} fill="url(#hrv-fill)" />
              <polyline points={pts} fill="none" stroke={colors.mint} strokeWidth="2" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${colors.mint})` }} />
              <circle cx={lastX} cy={lastY} r="5" fill={colors.mint} style={{ filter: `drop-shadow(0 0 6px ${colors.mint})` }} />
              <circle cx={lastX} cy={lastY} r="9" fill={colors.mintGlow} />
              {DAYS.map((d, i) => (
                <text
                  key={i}
                  x={(i / (DAYS.length - 1)) * chartW}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontFamily={FONTS.mono}
                  fontSize="9"
                  fill={i === DAYS.length - 1 ? colors.mint : colors.textGhost}
                  letterSpacing="0.5"
                >
                  {d}
                </text>
              ))}
            </svg>
          </div>
        </Panel>

        {/* Sleep + Steps 2-up */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Panel style={{ padding: "14px" }}>
            <MonoLabel color={colors.textFaint}>SLEEP</MonoLabel>
            <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700, color: colors.text, margin: "6px 0 10px" }}>7H 24M</div>
            {[
              { label: "REM", pct: 22, color: colors.mint },
              { label: "DEEP", pct: 18, color: colors.mintDeep },
              { label: "LIGHT", pct: 60, color: colors.mintBgMedium },
            ].map((s) => (
              <div key={s.label} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <MonoLabel color={colors.textGhost}>{s.label}</MonoLabel>
                  <MonoLabel color={colors.textFaint}>{s.pct}%</MonoLabel>
                </div>
                <ProgressBar value={s.pct} color={s.color} />
              </div>
            ))}
          </Panel>
          <Panel style={{ padding: "14px" }}>
            <MonoLabel color={colors.textFaint}>STEPS</MonoLabel>
            <div style={{ fontFamily: FONTS.mono, fontSize: 18, fontWeight: 700, color: colors.text, margin: "6px 0 4px" }}>8,247</div>
            <MonoLabel color={colors.textGhost}>GOAL 10,000</MonoLabel>
            <div style={{ margin: "12px 0 4px" }}>
              <ProgressBar value={82} />
            </div>
            <MonoLabel color={colors.mint}>82% OF GOAL</MonoLabel>
            <div style={{ marginTop: 16 }}>
              <MonoLabel color={colors.textFaint}>ACTIVE CAL</MonoLabel>
              <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 600, color: colors.text, marginTop: 4 }}>342 KCAL</div>
            </div>
          </Panel>
        </div>

        {/* NŪRA Live Insight */}
        <Panel style={{ marginBottom: 16, background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
            <MonoLabel color={colors.mint}>NŪRA LIVE INSIGHT</MonoLabel>
          </div>
          <p style={{ fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textMuted, margin: 0, lineHeight: 1.7 }}>
            Your HRV has trended upward <strong style={{ color: colors.text }}>+8ms over 7 days</strong> — a strong signal of nervous system recovery. Sleep quality is driving this. Keep the magnesium glycinate going before bed.
          </p>
        </Panel>

        {/* Biomarkers */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <MonoLabel color={colors.textFaint}>BIOMARKERS LATEST</MonoLabel>
          <button
            onClick={() => router.push("/bloodwork")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1px", color: colors.mint, textTransform: "uppercase", padding: 0 }}
          >
            VIEW ALL →
          </button>
        </div>
        {biomarkersLoading ? (
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", textAlign: "center", padding: "16px 0", marginBottom: 8 }}>
            LOADING...
          </div>
        ) : biomarkers.length === 0 ? (
          <button
            onClick={() => router.push("/bloodwork")}
            style={{ width: "100%", marginBottom: 16, padding: "16px", background: colors.mintBgSubtle, border: `1px dashed ${colors.mintBorder}`, borderRadius: 12, fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: colors.textFaint, cursor: "pointer", textAlign: "center" }}
          >
            No bloodwork uploaded yet — Upload labs
          </button>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {biomarkers.map((b) => {
              const c = biomarkerColor(b.status);
              const shortName = b.name.split(",")[0].split(" ").slice(0, 2).join(" ").toUpperCase();
              return (
                <div key={b.id} onClick={() => router.push("/bloodwork")} style={{ cursor: "pointer" }}>
                  <Panel style={{ padding: "12px 10px", textAlign: "center" }}>
                    <CornerBrackets size={6} color={c} />
                    <MonoLabel color={colors.textFaint}>{shortName}</MonoLabel>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 16, fontWeight: 700, color: colors.text, margin: "4px 0 2px", lineHeight: 1 }}>
                      {b.value % 1 === 0 ? b.value.toString() : b.value.toFixed(1)}
                    </div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, color: c, letterSpacing: "1px", background: `${c}18`, border: `1px solid ${c}30`, borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
                      {biomarkerLabel(b.status)}
                    </div>
                    <div style={{ marginTop: 2 }}>
                      <MonoLabel color={colors.textGhost}>{b.unit}</MonoLabel>
                    </div>
                  </Panel>
                </div>
              );
            })}
          </div>
        )}

        {/* Supplements Today */}
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <MonoLabel color={colors.textMuted}>SUPPLEMENTS · TODAY</MonoLabel>
            {suppLoading ? (
              <MonoLabel color={colors.textFaint}>—</MonoLabel>
            ) : (
              <button
                onClick={() => router.push("/supplements")}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "baseline", gap: 1 }}
              >
                <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: colors.mint }}>{dailyTakenCount}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: colors.textFaint }}>/{dailySupplements.length}</span>
              </button>
            )}
          </div>

          {suppLoading ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", padding: "8px 0" }}>
              LOADING...
            </div>
          ) : dailySupplements.length === 0 ? (
            <button
              onClick={() => router.push("/supplements")}
              style={{
                width: "100%",
                padding: "12px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: FONTS.mono,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: colors.textFaint,
                textAlign: "center",
              }}
            >
              No supplements added yet — Tap to add
            </button>
          ) : (
            <>
              {displayedSupplements.map((s, i) => {
                const isLogged = todaysLogs.includes(s.id);
                const isPending = pendingIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => router.push("/supplements")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: i < displayedSupplements.length - 1 ? `1px solid ${colors.border}` : "none",
                      cursor: "pointer",
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDashCheck(s.id, isLogged); }}
                      disabled={isPending}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `1.5px solid ${isLogged ? colors.mint : colors.textGhost}`,
                        background: isLogged ? `${colors.mint}20` : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        padding: 0,
                        cursor: isPending ? "not-allowed" : "pointer",
                        opacity: isPending ? 0.5 : 1,
                        boxShadow: isLogged ? `0 0 6px ${colors.mint}40` : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {isLogged && <Check size={11} color={colors.mint} strokeWidth={2.5} />}
                    </button>
                    <span
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 13,
                        color: isLogged ? colors.textDim : colors.textMuted,
                        textDecoration: isLogged ? "line-through" : "none",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </span>
                  </div>
                );
              })}
              {remainingSupplements > 0 && (
                <button
                  onClick={() => router.push("/supplements")}
                  style={{
                    width: "100%",
                    padding: "8px 0 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    color: colors.mint,
                    textAlign: "left",
                  }}
                >
                  +{remainingSupplements} MORE
                </button>
              )}
            </>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 12,
              backgroundImage: `radial-gradient(${colors.mint}18 1px, transparent 1px)`,
              backgroundSize: "16px 16px",
              pointerEvents: "none",
              opacity: 0.4,
              zIndex: -1,
            }}
          />
        </Panel>
      </div>

      <BottomNav />
    </div>
  );
}
