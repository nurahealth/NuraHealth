"use client";

import { useRouter } from "next/navigation";
import { getMovementDetail, SOURCE_LABEL, type IntradayChart } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import WeeklyBarStrip from "@/components/dashboard/WeeklyBarStrip";
import GlassCard from "@/components/dashboard/GlassCard";
import StatusPill from "@/components/dashboard/StatusPill";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const AMBER = "var(--nura-amber)";
const SAGE = "var(--nura-sage)";
const SANS = "var(--font-inter), system-ui, sans-serif";

const AMBER_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(var(--nura-amber-rgb),0.30), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-good-rgb),0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-amber-2-rgb),0.12), transparent 60%)";

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
const BoltIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function MovementDetailPage() {
  const router = useRouter();
  const d = getMovementDetail();
  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-movement)",
    }}>
      <style>{`
        .m-reveal { opacity: 0; transform: translateY(18px); animation: m-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes m-rise { to { opacity: 1; transform: none; } }
        .m-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={AMBER_AURORA} />

      <div className="mp-col" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "max(env(safe-area-inset-top), 16px) 18px 44px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="m-back"
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
        <div className="m-reveal" style={{ animationDelay: ".05s", display: "flex", alignItems: "center", gap: 18, padding: "20px 0 6px" }}>
          <RadialGauge
            value={d.score}
            label="Movement"
            gradientFrom="var(--nura-amber)"
            gradientTo="var(--nura-amber-2)"
            glowRgb="var(--nura-amber-rgb)"
          />
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: AMBER, fontWeight: 600 }}>
              {SOURCE_LABEL[d.source]}
            </div>
            <h1 style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-0.4px", margin: "5px 0 2px" }}>{d.title}</h1>
            <span className="nura-glow" style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 9,
              padding: "5px 11px", borderRadius: 9, fontSize: 12, fontWeight: 600, color: AMBER,
              background: "rgba(var(--nura-amber-rgb),0.12)", border: "1px solid rgba(var(--nura-amber-rgb),0.20)",
              boxShadow: "0 0 16px rgba(var(--nura-amber-rgb),0.10)",
            }}>
              <BoltIcon />{d.badge}
            </span>
          </div>
        </div>

        {/* Weekly strip */}
        <div className="m-reveal" style={{ animationDelay: ".15s", margin: "16px 0 6px" }}>
          <WeeklyBarStrip
            days={d.week}
            max={d.weekMax}
            barGradient="linear-gradient(180deg, rgba(var(--nura-amber-rgb),0.32), rgba(var(--nura-amber-2-rgb),0.10))"
            selectedGradient="linear-gradient(180deg,var(--nura-marker),var(--nura-orange-hi))"
            accent="var(--nura-amber)"
          />
        </div>

        {/* Contributors */}
        <GlassCard className="m-reveal" style={{ animationDelay: ".25s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", marginBottom: 15 }}>Contributors</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
            {d.subMetrics.map((sm) => (
              <div key={sm.label} style={{ background: "rgba(var(--nura-bg-tint-rgb),0.035)", border: "1px solid rgba(var(--nura-bg-tint-rgb),0.06)", borderRadius: 15, padding: 14 }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
                  {sm.value}{sm.unit && <small style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>{sm.unit}</small>}
                </div>
                <div style={{ fontSize: 10, letterSpacing: "0.9px", textTransform: "uppercase", color: MUTED, margin: "6px 0 9px", fontWeight: 600 }}>{sm.label}</div>
                <StatusPill status={sm.status} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 6 }}>
            {d.contributors.map((c) => (
              <div key={c.name} style={{ padding: "13px 0", borderTop: "1px solid rgba(var(--nura-bg-tint-rgb),0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 500 }}>{c.name}</span>
                  <StatusPill status={c.status} label={c.statusLabel} />
                </div>
                <div style={{ height: 5, background: "rgba(var(--nura-bg-tint-rgb),0.10)", borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                  <div className="nura-glow" style={{ height: "100%", width: `${c.pct}%`, borderRadius: 3, background: "linear-gradient(90deg,var(--nura-amber-2),var(--nura-amber))", boxShadow: "0 0 10px rgba(var(--nura-amber-rgb),0.4)" }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Activity — two intraday charts */}
        <GlassCard className="m-reveal" style={{ animationDelay: ".35s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.2px", marginBottom: 15 }}>Activity</h3>
          {d.charts.map((chart, i) => (
            <div
              key={chart.label}
              style={i === 0
                ? { marginTop: 6 }
                : { marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(var(--nura-bg-tint-rgb),0.06)" }}
            >
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.6px" }}>
                    {chart.value}{chart.unit && <small style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>{chart.unit}</small>}
                  </div>
                  <div style={{ fontSize: 11, letterSpacing: "0.9px", textTransform: "uppercase", color: MUTED, fontWeight: 600, marginTop: 3 }}>{chart.label}</div>
                </div>
                {chart.pillStatus && <StatusPill status={chart.pillStatus} label={chart.pillLabel} />}
              </div>

              <IntradayBars series={chart.series} />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: FAINT, marginTop: 5 }}>
                {chart.axisLabels.map((a, j) => <span key={j}>{a}</span>)}
              </div>
            </div>
          ))}
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="m-reveal" style={{ animationDelay: ".45s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div className="nura-glow" aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-sage),var(--nura-amber))", boxShadow: "0 0 16px rgba(var(--nura-sage-rgb),0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: "var(--nura-accent-label)", textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>
      </div>
    </div>
  );
}

// ── Intraday bar chart (12 AM → 12 AM) ────────────────────────────────────────
function IntradayBars({ series }: { series: IntradayChart["series"] }) {
  const W = 360, maxH = 80;
  const n = series.length;
  const bw = W / n;
  const max = Math.max(...series, 1);
  return (
    <svg width="100%" height={90} viewBox={`0 0 ${W} 90`} preserveAspectRatio="none" style={{ marginTop: 12, filter: "drop-shadow(0 0 7px rgba(var(--nura-amber-rgb),0.30))" }}>
      {series.map((v, i) => {
        const h = Math.max(2, (v / max) * maxH);
        return <rect key={i} x={(i * bw).toFixed(1)} y={(maxH + 4 - h).toFixed(1)} width={(bw - 1.1).toFixed(1)} height={h.toFixed(1)} rx="1.2" fill="var(--nura-amber)" />;
      })}
    </svg>
  );
}
