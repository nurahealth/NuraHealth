"use client";

import { useRouter } from "next/navigation";
import { getSleepDetail, SOURCE_LABEL, type SleepStageDetail } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import WeeklyBarStrip from "@/components/dashboard/WeeklyBarStrip";
import GlassCard from "@/components/dashboard/GlassCard";
import StatusPill from "@/components/dashboard/StatusPill";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const TEAL = "var(--nura-teal)";
const SAGE = "var(--nura-sage)";
const SANS = "'Inter', system-ui, sans-serif";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M8 8l4-4 4 4M5 16v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);
const TrophyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function SleepDetailPage() {
  const router = useRouter();
  const d = getSleepDetail();
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "radial-gradient(130% 80% at 50% -8%, #0d2c27 0%, #081514 34%, var(--nura-bg) 72%)",
    }}>
      <style>{`
        .s-reveal { opacity: 0; transform: translateY(18px); animation: s-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes s-rise { to { opacity: 1; transform: none; } }
        .s-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "max(env(safe-area-inset-top), 16px) 18px 44px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="s-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{dateLabel}</span>
          <span style={{ display: "flex", gap: 14, alignItems: "center", color: MUTED }}>
            <ShareIcon /><InfoIcon />
          </span>
        </div>

        {/* Hero */}
        <div className="s-reveal" style={{ animationDelay: ".05s", display: "flex", alignItems: "center", gap: 18, padding: "20px 0 6px" }}>
          <RadialGauge value={d.score} label="Sleep Index" />
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: TEAL, fontWeight: 600 }}>
              {SOURCE_LABEL[d.source]}
            </div>
            <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.4px", margin: "5px 0 2px" }}>{d.title}</h1>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 9,
              padding: "5px 11px", borderRadius: 9, fontSize: 12, fontWeight: 600, color: TEAL,
              background: "rgba(93,204,174,0.12)", border: "1px solid rgba(93,204,174,0.18)",
              boxShadow: "0 0 16px rgba(93,204,174,0.10)",
            }}>
              <TrophyIcon />{d.badge}
            </span>
          </div>
        </div>

        {/* Weekly strip */}
        <div className="s-reveal" style={{ animationDelay: ".15s", margin: "16px 0 6px" }}>
          <WeeklyBarStrip days={d.week} max={d.weekMax} />
        </div>

        {/* Contributors */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".25s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", marginBottom: 15 }}>Contributors</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            {d.subMetrics.map((sm) => (
              <div key={sm.label} style={{ background: "rgba(235,230,216,0.035)", border: "1px solid rgba(235,230,216,0.06)", borderRadius: 15, padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
                  {sm.value}<small style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>{sm.unit}</small>
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.9px", textTransform: "uppercase", color: MUTED, margin: "6px 0 9px", fontWeight: 600 }}>{sm.label}</div>
                <StatusPill status={sm.status} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 6 }}>
            {d.contributors.map((c) => (
              <div key={c.name} style={{ padding: "13px 0", borderTop: "1px solid rgba(235,230,216,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>{c.name}</span>
                  <StatusPill status={c.status} label={c.statusLabel} />
                </div>
                <div style={{ height: 5, background: "rgba(235,230,216,0.10)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.pct}%`, borderRadius: 3, background: "linear-gradient(90deg,var(--nura-teal-mid),var(--nura-teal))", boxShadow: "0 0 10px rgba(93,204,174,0.4)" }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Sleep stages */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".35s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", marginBottom: 15 }}>Sleep stages</h3>

          <div>
            {d.stages.map((st: SleepStageDetail) => (
              <div key={st.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "11px 0" }}>
                <span style={{ display: "inline-block", padding: "3px 11px", borderRadius: 7, fontSize: 13.5, fontWeight: 600, background: st.color, color: st.textColor }}>
                  {st.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {st.duration} <span style={{ color: MUTED, fontWeight: 500 }}>· {st.pct}%</span>
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: MUTED }}>
            Time in bed
            <b style={{ display: "block", fontSize: 24, color: TEXT, fontWeight: 700, marginTop: 2, letterSpacing: "-0.5px" }}>{d.timeInBed}</b>
          </div>

          <Hypnogram levels={d.hypnogram.levels} colors={d.hypnogram.levelColors} />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: FAINT, marginTop: 4 }}>
            {d.hypnogram.axisLabels.map((a, i) => <span key={i}>{a}</span>)}
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: MUTED, marginBottom: 9 }}>
              <span><b style={{ color: TEXT, fontWeight: 600 }}>Sleep cycles</b> · {d.cycles.total}</span>
              <span>{d.cycles.summary}</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {d.cycles.pattern.map((p, i) => (
                <div key={i} style={{
                  flex: 1, height: 22, borderRadius: 7,
                  background: p === "full"
                    ? "linear-gradient(90deg,rgba(95,191,140,0.6),rgba(93,204,174,0.5))"
                    : "rgba(95,191,140,0.20)",
                  boxShadow: p === "full" ? "0 0 12px rgba(95,191,140,0.18)" : "none",
                }} />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".45s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-sage),var(--nura-teal))", boxShadow: "0 0 16px rgba(155,176,165,0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: SAGE, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Hypnogram (stage timeline) ────────────────────────────────────────────────
function Hypnogram({ levels, colors }: { levels: number[]; colors: string[] }) {
  // Higher level = higher on the chart (awake at top, deep at bottom).
  const W = 360, H = 122;
  const yTop: Record<number, number> = { 0: 92, 1: 64, 2: 34, 3: 8 };
  const hgt: Record<number, number> = { 0: 26, 1: 54, 2: 84, 3: 110 };
  const bw = W / levels.length;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ marginTop: 14, filter: "drop-shadow(0 0 8px rgba(93,204,174,0.25))" }}>
      {levels.map((s, i) => (
        <rect key={i} x={(i * bw).toFixed(1)} y={yTop[s]} width={(bw - 1.1).toFixed(1)} height={hgt[s]} rx="2" fill={colors[s]} />
      ))}
    </svg>
  );
}
