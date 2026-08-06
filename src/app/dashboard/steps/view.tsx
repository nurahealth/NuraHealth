"use client";

import { useRouter } from "next/navigation";
import { getStepsDetail, getMetric, type StepsDetail } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import GlassCard from "@/components/dashboard/GlassCard";
import MetricChart from "@/components/dashboard/MetricChart";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";
import { useMetricPaint } from "@/lib/metricColors";
import { smooth } from "@/components/dashboard/ActiveEnergyTodayChart";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const GOLD = "var(--nura-metric-activity)";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode
const SANS = "var(--font-inter), system-ui, sans-serif";
const bStyle: React.CSSProperties = { color: TEXT, fontWeight: 600 };

// Warm gold ambient so this reads as the movement / steps page.
const GOLD_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(var(--nura-metric-activity-rgb),0.30), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-metric-activity-rgb),0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-metric-activity-rgb),0.12), transparent 60%)";

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
  const paint = useMetricPaint("steps");

  const summary = [
    { k: "Total", v: d.weekTotal },
    { k: "Daily avg", v: d.weekAvg },
    { k: "Goal hit", v: d.goalHit },
  ];

  // "Your number" is built from the same step values the hero/trend use: today's
  // count and the weekly daily average — so it tracks live or dev-fallback data.
  const todaySteps = d.steps.toLocaleString("en-US");
  const eduItems: MetricEducationItem[] = [
    {
      label: "What it is",
      body: "Steps count the walking and movement you do across the whole day, pulled from your phone and watch. It's the simplest measure of how active you are outside of dedicated workouts.",
    },
    {
      label: "Why it matters",
      body: "Everyday movement adds up more than most people realize. Regular steps are linked to better heart health, metabolism, mood, and longevity — and the biggest gains come from simply not being sedentary, not from hitting a magic number.",
    },
    {
      label: "Your number",
      body: <>Today you&apos;ve taken <b style={bStyle}>{todaySteps}</b>, and you&apos;ve averaged <b style={bStyle}>{d.weekAvg}</b> a day this week. The &ldquo;10,000&rdquo; target is really a marketing number — research suggests the benefits build from around 7,000&ndash;8,000 steps a day, with more still helping.</>,
    },
    {
      label: "What moves it",
      body: "Walking meetings, errands, taking the stairs, and short movement breaks all stack up; desk-bound days and bad weather pull it down. Small, frequent walks beat one big push.",
    },
    {
      label: "Keep in mind",
      body: "Step counts vary by device and where you carry your phone — read it as a consistent trend for yourself, not a precise tally.",
    },
  ];

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-steps)" }}>
      <style>{`
        .st-reveal { opacity: 0; transform: translateY(18px); animation: st-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes st-rise { to { opacity: 1; transform: none; } }
        .st-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={GOLD_AURORA} />

      <div className="mp-col" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
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
        <div className="st-reveal" style={{ animationDelay: ".1s", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 18px" }}>
          <RadialGauge
            value={d.steps}
            max={d.goal}
            size={200}
            stroke={13}
            label={`of ${d.goal.toLocaleString("en-US")} steps`}
            format={(n) => n.toLocaleString("en-US")}
            valueFontSize={44}
            labelGap={10}
            gradientFrom="var(--nura-orange)"
            gradientTo="var(--nura-orange-mid)"
            glowRgb="227,162,99"
          />
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 18,
            padding: "6px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
            color: GOLD, border: "1px solid rgba(var(--nura-metric-activity-rgb),0.4)" }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: "0 0 8px var(--nura-metric-activity)" }} />
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
          {chart && <MetricChart data={chart} color={paint} unit="steps" height={168} showPeak />}

          {/* Data strip — divided from the chart's x-axis row; wraps if needed */}
          <div style={{
            display: "flex", flexWrap: "wrap", alignItems: "center",
            marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(var(--nura-bg-tint-rgb),0.07)",
            fontSize: 12.5, lineHeight: 1.5 }}>
            {[
              { num: d.tiles[0].value, words: d.tiles[0].unit, gold: false },
              { num: d.tiles[1].value, words: " flights", gold: false },
              { num: String(d.kcal), words: " kcal", gold: false },
              { num: (d.goal - d.steps).toLocaleString("en-US"), words: " to go", gold: true },
            ].map((it, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
                {i > 0 && <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--nura-ink-faint)", margin: "0 9px", flexShrink: 0 }} />}
                <span>
                  {/* "N to go" was --nura-good, the status gold, for emphasis.
                      A remaining count is not a warning; --nura-accent-text
                      keeps the dark-mode emphasis and goes ink in light, where
                      a tinted stat number is exactly what this pass removes. */}
                  <b style={{ fontWeight: 700, color: it.gold ? "var(--nura-accent-text)" : "var(--nura-text-primary)" }}>{it.num}</b>
                  <span style={{ color: "var(--nura-text-secondary)" }}>{it.words}</span>
                </span>
              </span>
            ))}
          </div>
        </GlassCard>

        {/* Pace vs your usual — today's cumulative steps against a typical day */}
        <StepsPaceCard d={d} />

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

        {/* Movement — active vs sedentary across the waking hours */}
        <StepsMovementCard d={d} />

        {/* NŪRA insight */}
        <GlassCard className="st-reveal" style={{ animationDelay: ".42s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div className="nura-glow" aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-orange-mid),var(--nura-orange))", boxShadow: "0 0 16px rgba(var(--nura-orange-rgb),0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: GOLD, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>

        {/* Understanding (shared MetricEducation) */}
        <div className="st-reveal" style={{ animationDelay: ".5s", marginTop: 16 }}>
          <MetricEducation accent={GOLD} title="Understanding your steps" items={eduItems} />
        </div>
      </div>
    </div>
  );
}

// ── This-week bar chart ───────────────────────────────────────────────────────
// Seven daily bars with the step count labeled above each. Days that met the
// 10k goal are orange with a soft glow; days below are muted grey. Faint y-axis
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
      <defs>
        <linearGradient id="swk-orange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--nura-orange-hi)" />
          <stop offset="1" stopColor="var(--nura-orange)" />
        </linearGradient>
        <linearGradient id="swk-grey" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--nura-bar-dim-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--nura-bar-dim-bot)" }} />
        </linearGradient>
      </defs>

      {/* Gridlines + edge labels */}
      {d.weekGridlines.map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g).toFixed(1)} x2={R} y2={yOf(g).toFixed(1)} stroke={`rgba(${INK},0.05)`} />
          <text x={L - 6} y={(yOf(g) + 3).toFixed(1)} textAnchor="end" fontSize={9} fill="var(--nura-ink-a32)" style={{ fontFamily: SANS }}>{g / 1000}k</text>
        </g>
      ))}

      {/* Dashed goal line — label sits in the right gutter, centered on the line */}
      <line x1={L} y1={yOf(d.weekGoal).toFixed(1)} x2={R} y2={yOf(d.weekGoal).toFixed(1)} stroke={`rgba(${INK},0.4)`} strokeWidth={1} strokeDasharray="4 5" />
      <text x={R + 6} y={yOf(d.weekGoal).toFixed(1)} textAnchor="start" dominantBaseline="central" fontSize={9} fontWeight={600} fill="var(--nura-ink-a50)" style={{ fontFamily: SANS }}>10k goal</text>

      {/* Daily bars — orange (hit goal) vs muted grey (under), soft glow on both */}
      {d.week.map((day, i) => {
        const hit = day.value >= d.weekGoal;
        const x = L + i * slot + (slot - barW) / 2;
        const y = yOf(day.value);
        const h = bot - y;
        return (
          <g key={i}>
            <rect
              x={x.toFixed(1)} y={y.toFixed(1)} width={barW.toFixed(1)} height={Math.max(h, 2).toFixed(1)}
              rx={6} fill={hit ? "url(#swk-orange)" : "url(#swk-grey)"}
            />
            {day.isToday && (
              <rect
                x={x.toFixed(1)} y={y.toFixed(1)} width={barW.toFixed(1)} height={Math.max(h, 2).toFixed(1)}
                rx={6} fill="none" stroke={`rgba(${INK},0.85)`} strokeWidth={1}
              />
            )}
            <text x={(x + barW / 2).toFixed(1)} y={(y - 7).toFixed(1)} textAnchor="middle" fontSize={10} fontWeight={700} fill={day.isToday ? TEXT : "var(--nura-ink-a62)"} style={{ fontFamily: SANS }}>
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

// One identity across the page. The "behind / down" indicator used to be
// --nura-good, the status gold, which put a status colour on an ordinary
// number and made "slightly under your usual" look like a rating. It is
// neutral ink now — the arrow says the direction, the colour says nothing.
const ORANGE = "var(--nura-orange)";        // base
const ORANGE_LIGHT = "var(--nura-orange-mid)";  // light
const ORANGE_RGB = "var(--nura-orange-rgb)"; // series tint
const GOLD_HEX = "var(--nura-text-secondary)";

// ── Card 1 · Pace vs your usual ───────────────────────────────────────────────
// How today's cumulative steps are tracking against a typical day: a lead line
// with the live delta, a cumulative line chart (today solid orange vs usual dashed
// off-white, with the "ahead" gap shaded orange), a key row, and a week-over-week
// compare row.
function StepsPaceCard({ d }: { d: StepsDetail }) {
  const last = d.paceToday.length - 1;
  const todaySteps = d.paceToday[last];
  const usualSteps = d.paceUsual[last];
  const delta = todaySteps - usualSteps;
  const ahead = delta >= 0;

  const pct = d.lastWeekStepTotal
    ? Math.round(((d.thisWeekStepTotal - d.lastWeekStepTotal) / d.lastWeekStepTotal) * 100)
    : 0;
  const up = pct >= 0;

  return (
    <GlassCard className="st-reveal" style={{ animationDelay: ".22s", marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Pace vs your usual</div>
      <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>How today is tracking against a typical day</div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "10px 0 4px" }}>
        <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-1px", color: ahead ? ORANGE : GOLD_HEX }}>
          {ahead ? "▲" : "▼"} {Math.abs(delta).toLocaleString("en-US")}
        </span>
        <span style={{ fontSize: 13, color: MUTED }}>{ahead ? "ahead of" : "behind"} your usual pace by now</span>
      </div>

      <StepsPaceChart d={d} />

      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: 6, fontSize: 10, color: FAINT }}>
        <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>now</span>
      </div>

      {/* Key — today (solid) vs usual (dashed) */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(var(--nura-bg-tint-rgb),0.07)", fontSize: 12, color: MUTED }}>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 16, height: 0, borderTop: `2px solid ${ORANGE}`, borderRadius: 2 }} />
          <span><b style={{ color: TEXT, fontWeight: 700 }}>Today</b> · {todaySteps.toLocaleString("en-US")}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 16, height: 0, borderTop: "2px dashed rgba(var(--nura-bg-tint-rgb),0.5)", borderRadius: 2 }} />
          <span><b style={{ color: TEXT, fontWeight: 700 }}>Usual</b> · {usualSteps.toLocaleString("en-US")}</span>
        </span>
      </div>

      {/* Week over week */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 13, paddingTop: 13, borderTop: "1px solid rgba(var(--nura-bg-tint-rgb),0.07)", fontSize: 13, color: MUTED }}>
        <span style={{ color: up ? ORANGE : GOLD_HEX, fontWeight: 700 }}>{up ? "▲" : "▼"} {Math.abs(pct)}%</span>
        <span>this week ({d.thisWeekStepTotal.toLocaleString("en-US")}) vs last week ({d.lastWeekStepTotal.toLocaleString("en-US")})</span>
      </div>
    </GlassCard>
  );
}

// Cumulative pace chart — today's solid orange line over the usual dashed
// off-white line, with the gap between them shaded faint orange and a glowing dot
// at today's current point. Stretches to fill the card width (preserveAspectRatio
// "none"); the 12a→now axis labels are rendered by the card.
function StepsPaceChart({ d }: { d: StepsDetail }) {
  const W = 376, top = 12, bot = 128, plotH = bot - top;
  const today = d.paceToday, usual = d.paceUsual;
  const n = today.length, max = d.paceMax || 1;
  const xOf = (i: number) => i * (W / (n - 1));
  const yOf = (v: number) => top + (1 - v / max) * plotH;

  const tp: [number, number][] = today.map((v, i) => [xOf(i), yOf(v)]);
  const up: [number, number][] = usual.map((v, i) => [xOf(i), yOf(v)]);

  // Shade the "ahead" gap: today's curve, then back along usual (reversed), closed.
  let gap = `${smooth(tp)} L${up[n - 1][0].toFixed(1)},${up[n - 1][1].toFixed(1)}`;
  for (let i = n - 2; i >= 0; i--) gap += ` L${up[i][0].toFixed(1)},${up[i][1].toFixed(1)}`;
  gap += " Z";

  return (
    <svg width="100%" height={150} viewBox={`0 0 ${W} 150`} preserveAspectRatio="none" style={{ display: "block" }}>
      <path d={gap} fill="rgba(var(--nura-orange-rgb),0.12)" />
      <path d={smooth(up)} fill="none" stroke="var(--nura-text-secondary)" strokeWidth={1.6} strokeDasharray="4 5" strokeLinecap="round" />
      <path d={smooth(tp)} fill="none" strokeWidth={2.2} strokeLinecap="round" style={{ stroke: ORANGE, filter: "drop-shadow(0 0 4px rgba(var(--nura-orange-rgb),0.5))" }} />
      <circle cx={tp[n - 1][0].toFixed(1)} cy={tp[n - 1][1].toFixed(1)} r={3.2} style={{ fill: ORANGE, filter: `drop-shadow(0 0 6px ${ORANGE})` }} />
    </svg>
  );
}

// ── Card 2 · Movement ─────────────────────────────────────────────────────────
// Active vs sedentary through the waking hours: a strip of per-hour blocks (orange
// when active, faint when sedentary), three duration tiles, and a mini-insight.
function StepsMovementCard({ d }: { d: StepsDetail }) {
  const wakingHours = d.movementHours.length;
  const activeHours = d.movementHours.filter((s) => s === "a").length;
  const stats = [
    { k: "Active", v: d.activeTime },
    { k: "Sedentary", v: d.sedentaryTime },
    { k: "Longest sit", v: d.longestSit },
  ];

  return (
    <GlassCard className="st-reveal" style={{ animationDelay: ".40s", marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Movement</div>
      <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>Active vs sedentary through your waking hours</div>

      {/* Per-hour strip */}
      <div style={{ display: "flex", gap: 3, marginTop: 14 }}>
        {d.movementHours.map((s, i) => (
          <div className="nura-glow"
            key={i}
            style={{
              flex: 1, height: 30, borderRadius: 4,
              background: s === "a" ? `linear-gradient(180deg, ${ORANGE_LIGHT}, ${ORANGE})` : "rgba(var(--nura-bg-tint-rgb),0.07)",
              boxShadow: s === "a" ? `0 0 8px rgba(${ORANGE_RGB},0.35)` : undefined }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: FAINT }}>
        <span>6a</span><span>12p</span><span>6p</span><span>10p</span>
      </div>

      {/* Duration tiles */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {stats.map((t) => (
          <div key={t.k} style={{ flex: 1, background: "rgba(var(--nura-bg-tint-rgb),0.03)", border: "1px solid var(--nura-glass-line)", borderRadius: 14, padding: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.7px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>{t.k}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 5, letterSpacing: "-0.4px" }}><Duration value={t.v} /></div>
          </div>
        ))}
      </div>

      {/* Mini-insight */}
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, paddingTop: 13, borderTop: "1px solid rgba(var(--nura-bg-tint-rgb),0.07)", fontSize: 12.5, lineHeight: 1.45, color: MUTED }}>
        <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: ORANGE, marginTop: 5, flex: "none", boxShadow: `0 0 7px ${ORANGE}` }} />
        <span>
          You moved during <b style={{ color: TEXT, fontWeight: 700 }}>{activeHours} of {wakingHours}</b> waking hours. Your longest unbroken sit was{" "}
          <b style={{ color: TEXT, fontWeight: 700 }}>{d.longestSit}</b> around {d.longestSitWhen} — a 5-minute walk in that window would break it up and is where most easy wins hide.
        </span>
      </div>
    </GlassCard>
  );
}

// Render a duration string like "6h 40m" with the unit letters set smaller and
// muted, e.g. 6h 40m → 6<small>h</small> 40<small>m</small>.
function Duration({ value }: { value: string }) {
  const parts = value.split(/(\d+)/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        /\d/.test(p)
          ? <span key={i}>{p}</span>
          : <small key={i} style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{p}</small>
      )}
    </>
  );
}
