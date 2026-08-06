"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { getActiveEnergyDetail, SOURCE_LABEL, type ActiveEnergyDetail } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import ActiveEnergyRing from "@/components/dashboard/ActiveEnergyRing";
import GlassCard from "@/components/dashboard/GlassCard";
import { useMetricPaint } from "@/lib/metricColors";
import ActiveEnergyTodayChart, { colorAt, light } from "@/components/dashboard/ActiveEnergyTodayChart";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";
import { useThemeTokens } from "@/lib/themeTokens";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const EMBER = "var(--nura-ember)";
const EMBER_LIGHT = "var(--nura-ember-hi)";
const INK = "var(--nura-fg-rgb)"; // off-white in dark, near-black in light
const EMBER_RGB = "var(--nura-ember-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const bStyle: React.CSSProperties = { color: TEXT, fontWeight: 600 };

// The weekly bars shade by value, and the shading is done in hex maths, so the
// ramp has to arrive as concrete colours. Left unpassed it fell through to the
// module default — a hardcoded amber→coral ember ramp that no theme could
// touch, so these seven bars stayed lit in the old palette on a white card.
const WEEK_RAMP_TOKENS = {
  lo: ["--nura-step-1", "#6d8175"],
  mid: ["--nura-step-3", "#9bb0a5"],
  hi: ["--nura-step-4", "#bacdc1"],
} as const;

// Ambient bloom behind the page — the metric colour, like every detail screen.
const EMBER_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(var(--nura-ember-rgb),0.26), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-ember-hi-rgb),0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-ember-rgb),0.12), transparent 60%)";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function ActiveEnergyDetailPage() {
  const router = useRouter();
  const d = getActiveEnergyDetail();
  const paint = useMetricPaint("active-energy");

  const percent = Math.round((d.activeEnergy / d.moveGoal) * 100);
  const toGoal = Math.max(0, d.moveGoal - d.activeEnergy);

  const tiles = [
    { label: "Total burn", value: d.totalBurn.toLocaleString("en-US"), unit: " kcal" },
    { label: "Resting", value: d.restingEnergy.toLocaleString("en-US"), unit: " kcal" },
    { label: "Exercise", value: String(d.exerciseMinutes), unit: " min" },
  ];

  const weekTotal = d.week.reduce((s, x) => s + x.value, 0);
  const weekAvg = Math.round(weekTotal / d.week.length);
  const hits = d.week.filter((x) => x.value >= d.moveGoal).length;

  // "Your number" is built from the same active-energy values the hero/trend use:
  // today's burn and the weekly daily average — so it tracks live or fallback data.
  const eduItems: MetricEducationItem[] = [
    {
      label: "What it is",
      body: "Active energy is the calories you burn through movement and exercise, on top of the baseline calories your body uses just to keep you alive. It reflects how much you actually moved today.",
    },
    {
      label: "Why it matters",
      body: "It's a fuller picture of daily effort than steps alone — it captures workouts, cycling, climbing, and intensity, not just walking. Tracking it shows whether your activity is trending up, holding steady, or slipping.",
    },
    {
      label: "Your number",
      body: <>Today you&apos;ve burned <b style={bStyle}>{d.activeEnergy.toLocaleString("en-US")} kcal</b>, with a weekly average of <b style={bStyle}>{weekAvg.toLocaleString("en-US")} kcal</b> a day. There&apos;s no universal target — what matters is a level that&apos;s consistent and right for your goals, so your own trend tells you more than the raw number.</>,
    },
    {
      label: "What moves it",
      body: "Workouts, intensity, walking, body size, and how much you move between tasks all drive it. A rest day naturally dips it; an active day or hard session spikes it.",
    },
    {
      label: "Keep in mind",
      body: "Calorie burn from a wearable is an estimate, not a precise measurement — use it to compare your own days, not as exact accounting.",
    },
  ];

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-energy)" }}>
      <style>{`
        .ae-reveal { opacity: 0; transform: translateY(18px); animation: ae-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes ae-rise { to { opacity: 1; transform: none; } }
        .ae-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={EMBER_AURORA} />

      <div className="mp-col" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="ae-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title + source tag */}
        <div className="ae-reveal" style={{ animationDelay: ".05s", margin: "18px 0 2px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.9px", textTransform: "uppercase", color: EMBER, fontWeight: 600, marginBottom: 6 }}>
            {SOURCE_LABEL[d.source]}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Active Energy</h1>
        </div>
        <div className="ae-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — animated 270° ember goal ring + status pill */}
        <div className="ae-reveal" style={{ animationDelay: ".1s", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 6px" }}>
          <ActiveEnergyRing
            kcal={d.activeEnergy}
            goal={d.moveGoal}
            size={208}
            stroke={13}
            fillMs={1500}
            innerLabel={`of ${d.moveGoal} goal`}
          color={paint} />
          <span className="nura-note-ink" style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
            padding: "6px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
            color: EMBER, border: `1px solid rgba(${EMBER_RGB},0.4)` }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: EMBER, boxShadow: `0 0 8px ${EMBER}` }} />
            {percent}% to goal · {percent >= 100 ? "goal reached" : "on track"}
          </span>
        </div>

        {/* Tiles — Total burn · Resting · Exercise */}
        <div className="ae-reveal" style={{ animationDelay: ".18s", display: "flex", gap: 10, marginTop: 16 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: 13, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: FAINT }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {t.value}<small style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{t.unit}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Today — bespoke amber/coral intraday chart */}
        <GlassCard className="ae-reveal" style={{ animationDelay: ".26s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Today</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>{d.rangeCaption}</div>

          <ActiveEnergyTodayChart d={d} color={paint} />

          {/* Data strip below the x-axis */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            marginTop: 14, paddingTop: 14, borderTop: `1px solid rgba(${INK},0.07)`,
            fontSize: 12.5, lineHeight: 1.5 }}>
            {[
              { num: String(d.activeEnergy), words: " kcal", warm: false },
              { num: String(d.exerciseMinutes), words: " min exercise", warm: false },
              { num: String(toGoal), words: " kcal to goal", warm: true },
            ].map((it, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: `rgba(${INK},0.3)`, margin: "0 9px", flexShrink: 0 }} />}
                <span>
                  <b style={{ fontWeight: 700, color: it.warm ? "var(--nura-ember)" : "var(--nura-text-primary)" }}>{it.num}</b>
                  <span style={{ color: it.warm ? "var(--nura-ember)" : "var(--nura-ink-a55)" }}>{it.words}</span>
                </span>
              </span>
            ))}
          </div>
        </GlassCard>

        {/* This week */}
        <GlassCard className="ae-reveal" style={{ animationDelay: ".34s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>This week</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 0" }}>Active calories vs your {d.moveGoal} goal</div>
          <div style={{ display: "flex", gap: 22, marginTop: 12 }}>
            {[
              { k: "Total", v: weekTotal.toLocaleString("en-US") },
              { k: "Daily avg", v: weekAvg.toLocaleString("en-US") },
              { k: "Goal hit", v: `${hits}/7` },
            ].map((s) => (
              <div key={s.k}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>{s.v}</div>
                <div style={{ fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase", color: FAINT, marginTop: 3 }}>{s.k}</div>
              </div>
            ))}
          </div>

          <ActiveWeekChart d={d} />

          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, fontSize: 11.5, color: MUTED }}>
            <span style={{ color: EMBER, fontWeight: 700 }}>✓</span>
            Reached your {d.moveGoal} move goal on {hits} of 7 days
          </div>
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="ae-reveal" style={{ animationDelay: ".42s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div className="nura-glow" aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${EMBER_LIGHT}, ${EMBER})`, boxShadow: `0 0 16px rgba(${EMBER_RGB},0.5)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: EMBER, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>

        {/* Understanding (shared MetricEducation) */}
        <div className="ae-reveal" style={{ animationDelay: ".5s", marginTop: 16 }}>
          <MetricEducation accent={EMBER} title="Understanding your active energy" items={eduItems} />
        </div>
      </div>
    </div>
  );
}

// ── This week · daily bars vs the Move goal ───────────────────────────────────
// Seven lit-glass bars, shaded along the ordered ramp, kcal value above each. Days that hit
// the goal get a "✓", full color, and a soft glow; missed days are dimmed. A
// dashed goal line (label in the right gutter) and weekday labels with today
// highlighted complete the panel.
function ActiveWeekChart({ d }: { d: ActiveEnergyDetail }) {
  const rawId = useId();
  const uid = `ae-week-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const wr = useThemeTokens(WEEK_RAMP_TOKENS);
  const ramp = [wr.lo, wr.mid, wr.hi];

  const W = 356, H = 192, L = 24, R = 302, top = 28, bot = 152;
  const plotW = R - L;
  const span = (d.weekCeil - d.weekFloor) || 1;
  const yOf = (v: number) => top + (1 - (v - d.weekFloor) / span) * (bot - top);
  const nn = d.week.length;
  const slot = plotW / nn;
  const barW = Math.min(slot * 0.5, 24);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 6 }}>
      <defs>
        {d.week.map((day, i) => {
          const [r, g, b] = colorAt(Math.max(0, Math.min(1, (day.value - d.weekFloor) / span)), ramp);
          const [lr, lg, lb] = light([r, g, b], 0.5);
          return (
            <linearGradient key={i} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgb(${lr},${lg},${lb})`} stopOpacity="1" />
              <stop offset="55%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.95" />
              <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.5" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Dashed goal line — label sits in the right gutter, centered on the line */}
      <line x1={L} y1={yOf(d.moveGoal).toFixed(1)} x2={R} y2={yOf(d.moveGoal).toFixed(1)} stroke={`rgba(${INK},0.4)`} strokeWidth={1} strokeDasharray="4 5" />
      <text x={R + 6} y={yOf(d.moveGoal).toFixed(1)} textAnchor="start" dominantBaseline="central" fontSize={9} fontWeight={600} fill="var(--nura-ink-a50)" style={{ fontFamily: SANS }}>{d.moveGoal} goal</text>

      {/* Daily bars */}
      {d.week.map((day, i) => {
        const hit = day.value >= d.moveGoal;
        const norm = Math.max(0, Math.min(1, (day.value - d.weekFloor) / span));
        const [r, g, b] = colorAt(norm, ramp);
        const x = L + i * slot + (slot - barW) / 2;
        const y = yOf(day.value);
        const h = bot - y;
        return (
          <g key={i} style={hit ? { filter: `drop-shadow(0 0 6px rgba(${r},${g},${b},0.6))` } : undefined}>
            <rect
              x={x.toFixed(1)} y={y.toFixed(1)} width={barW.toFixed(1)} height={Math.max(h, 2).toFixed(1)}
              rx={Math.min(barW / 2, Math.max(h, 2) / 2).toFixed(1)} fill={`url(#${uid}-${i})`} opacity={hit ? 1 : 0.5}
            />
            <text x={(x + barW / 2).toFixed(1)} y={(y - 7).toFixed(1)} textAnchor="middle" fontSize={10} fontWeight={700} fill={hit ? "var(--nura-text-primary)" : "var(--nura-ink-a50)"} style={{ fontFamily: SANS }}>
              {day.value}{hit ? " ✓" : ""}
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
