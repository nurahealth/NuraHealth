"use client";

import { useRouter } from "next/navigation";
import { getStepsDetail, getMetric, type StepsDetail } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import GlassCard from "@/components/dashboard/GlassCard";
import MetricChart from "@/components/dashboard/MetricChart";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const GOLD = "var(--nura-amber)";
const TEAL = "var(--nura-teal)";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode
const SANS = "'Inter', system-ui, sans-serif";

// Warm gold ambient so this reads as the movement / steps page.
const GOLD_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(224,162,62,0.30), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(211,162,83,0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(224,162,62,0.12), transparent 60%)";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function StepsDetailPage() {
  const router = useRouter();
  const d = getStepsDetail();
  const chart = getMetric("steps")?.chart; // reuse the dashboard card's chart data

  const summary = [
    { k: "Total", v: d.weekTotal },
    { k: "Daily avg", v: d.weekAvg },
    { k: "Goal hit", v: d.goalHit },
  ];

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "radial-gradient(130% 80% at 50% -8%, #2e2008 0%, #161005 34%, var(--nura-bg) 72%)",
    }}>
      <style>{`
        .st-reveal { opacity: 0; transform: translateY(18px); animation: st-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes st-rise { to { opacity: 1; transform: none; } }
        .st-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={GOLD_AURORA} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "max(env(safe-area-inset-top), 16px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="st-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title */}
        <h1 className="st-reveal" style={{ animationDelay: ".05s", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "18px 0 2px" }}>
          Steps
        </h1>
        <div className="st-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — goal-progress ring + status pill */}
        <div className="st-reveal" style={{ animationDelay: ".1s", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 6px" }}>
          <RadialGauge
            value={d.steps}
            max={d.goal}
            size={200}
            stroke={13}
            label={`of ${d.goal.toLocaleString("en-US")} steps`}
            format={(n) => n.toLocaleString("en-US")}
            valueFontSize={44}
            labelGap={10}
            gradientFrom={GOLD}
            gradientTo={TEAL}
            glowRgb="var(--nura-amber-rgb)"
          />
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
            padding: "6px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
            color: GOLD, border: "1px solid rgba(var(--nura-amber-rgb),0.4)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: "0 0 8px var(--nura-amber)" }} />
            {d.pill}
          </span>
        </div>

        {/* Tiles — Distance · Flights · Active */}
        <div className="st-reveal" style={{ animationDelay: ".18s", display: "flex", gap: 10, marginTop: 16 }}>
          {d.tiles.map((t) => (
            <div key={t.label} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: 13, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: FAINT }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {t.value}{t.unit && <small style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{t.unit}</small>}
              </div>
            </div>
          ))}
        </div>

        {/* Today — reuse the dashboard card's vivid intraday steps chart */}
        <GlassCard className="st-reveal" style={{ animationDelay: ".26s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Today</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>{d.rangeCaption}</div>
          {chart && <MetricChart data={chart} height={150} highTech />}

          {/* Data strip — divided from the chart's x-axis row; wraps if needed */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(235,230,216,0.07)",
            fontSize: 12.5, lineHeight: 1.5,
          }}>
            {[
              { num: d.tiles[0].value, words: d.tiles[0].unit, gold: false },
              { num: d.tiles[1].value, words: " flights", gold: false },
              { num: String(d.kcal), words: " kcal", gold: false },
              { num: (d.goal - d.steps).toLocaleString("en-US"), words: " to go", gold: true },
            ].map((it, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(235,230,216,0.3)", margin: "0 9px", flexShrink: 0 }} />}
                <span>
                  <b style={{ fontWeight: 700, color: it.gold ? "#d3a253" : "#ebe6d8" }}>{it.num}</b>
                  <span style={{ color: it.gold ? "#d3a253" : "rgba(235,230,216,0.55)" }}>{it.words}</span>
                </span>
              </span>
            ))}
          </div>
        </GlassCard>

        {/* This week */}
        <GlassCard className="st-reveal" style={{ animationDelay: ".34s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>This week</div>
          <div style={{ display: "flex", gap: 22, marginTop: 12 }}>
            {summary.map((s) => (
              <div key={s.k}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>{s.v}</div>
                <div style={{ fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", color: FAINT, marginTop: 3 }}>{s.k}</div>
              </div>
            ))}
          </div>

          <StepsWeekChart d={d} />
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="st-reveal" style={{ animationDelay: ".42s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-amber),var(--nura-teal))", boxShadow: "0 0 16px rgba(var(--nura-amber-rgb),0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: GOLD, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>
      </div>
    </div>
  );
}

// ── This-week bar chart ───────────────────────────────────────────────────────
// Seven daily bars with the step count labeled above each. Days that met the
// 10k goal are teal with a soft glow; days below are gold. Faint y-axis
// gridlines (5k/15k), a dashed goal line labeled "10k goal", and weekday labels
// with today highlighted.
function StepsWeekChart({ d }: { d: StepsDetail }) {
  const W = 356, H = 190, L = 26, R = 308, top = 26, bot = 150;
  const plotW = R - L;
  const span = (d.weekCeil - d.weekFloor) || 1;
  const yOf = (v: number) => top + (1 - (v - d.weekFloor) / span) * (bot - top);
  const n = d.week.length;
  const slot = plotW / n;
  const barW = Math.min(slot * 0.5, 24);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 6 }}>
      {/* Gridlines + edge labels */}
      {d.weekGridlines.map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g).toFixed(1)} x2={R} y2={yOf(g).toFixed(1)} stroke={`rgba(${INK},0.05)`} />
          <text x={L - 6} y={(yOf(g) + 3).toFixed(1)} textAnchor="end" fontSize={9} fill={`rgba(${INK},0.32)`} style={{ fontFamily: SANS }}>{g / 1000}k</text>
        </g>
      ))}

      {/* Dashed goal line — label sits in the right gutter, centered on the line */}
      <line x1={L} y1={yOf(d.weekGoal).toFixed(1)} x2={R} y2={yOf(d.weekGoal).toFixed(1)} stroke={`rgba(${INK},0.4)`} strokeWidth={1} strokeDasharray="4 5" />
      <text x={R + 6} y={yOf(d.weekGoal).toFixed(1)} textAnchor="start" dominantBaseline="central" fontSize={9} fontWeight={600} fill={`rgba(${INK},0.5)`} style={{ fontFamily: SANS }}>10k goal</text>

      {/* Daily bars */}
      {d.week.map((day, i) => {
        const hit = day.value >= d.weekGoal;
        const x = L + i * slot + (slot - barW) / 2;
        const y = yOf(day.value);
        const h = bot - y;
        return (
          <g key={i} style={hit ? { filter: "drop-shadow(0 0 5px rgba(var(--nura-teal-rgb),0.55))" } : undefined}>
            <rect
              x={x.toFixed(1)} y={y.toFixed(1)} width={barW.toFixed(1)} height={Math.max(h, 2).toFixed(1)}
              rx={6} fill={hit ? TEAL : GOLD} opacity={day.isToday ? 1 : 0.9}
            />
            <text x={(x + barW / 2).toFixed(1)} y={(y - 7).toFixed(1)} textAnchor="middle" fontSize={10} fontWeight={700} fill={day.isToday ? TEXT : `rgba(${INK},0.62)`} style={{ fontFamily: SANS }}>
              {(day.value / 1000).toFixed(1)}k
            </text>
            <text x={(x + barW / 2).toFixed(1)} y={(bot + 17).toFixed(1)} textAnchor="middle" fontSize={11} fontWeight={day.isToday ? 700 : 500} fill={day.isToday ? TEXT : FAINT} style={{ fontFamily: SANS }}>
              {day.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
