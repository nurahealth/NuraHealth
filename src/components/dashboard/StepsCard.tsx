"use client";

import { useId } from "react";

import { getStepsDetail, SOURCE_LABEL, type DashboardMetric, type StepsWeekDay } from "@/lib/dashboardData";
import { useMetricPaint, type MetricPaint } from "@/lib/metricColors";

import { MONO, roundedTopBar, SageBarDefs, sageFill, BarTopEdge, AuraDefs, BarAura } from "@/components/dashboard/chartTheme";
import { useIsLightForm } from "@/lib/themeTokens";

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

// A day that hit goal is drawn in the movement amber; a day that fell short is
// drawn in the de-emphasis tone — sage mist in light, so an under-goal day
// recedes without turning brown beside the days that hit. Two states, one hue
// plus its quiet step; the bar's colour never encodes anything else.
const HIT_LABEL = "Hit";
const MISS_FILL = "var(--nura-bar-under)";

// Dev fallback — mirrors the sample StepsDetail week when the store has none.
const FALLBACK_WEEK: StepsWeekDay[] = [
  { label: "M", value: 8400 },
  { label: "T", value: 11200 },
  { label: "W", value: 7600 },
  { label: "T", value: 12100 },
  { label: "F", value: 9200 },
  { label: "S", value: 12200 },
  { label: "S", value: 8420, isToday: true },
];

const fmtK = (v: number) => `${(v / 1000).toFixed(1)}k`;

// ── Weekly Mon–Sun bar chart ──────────────────────────────────────────────────
// Seven rounded-top bars scaled to each day's total, teal (goal-hit) vs orange
// (under goal) vertical gradients with a soft glow. Values sit above each bar; a
// dashed goal line spans ONLY the bar area, with the "10k goal" label parked in a
// reserved right-side gutter so it's never covered. Today's bar is outlined and
// its weekday label is bold cream.
function WeeklyBars({ week, goal, paint }: { week: StepsWeekDay[]; goal: number; paint: MetricPaint }) {
  const lightForm = useIsLightForm();
  const rawUid = useId();
  const uid = `st-${rawUid.replace(/[^a-zA-Z0-9]/g, "")}`;
  const W = 320, H = 158;
  const L = 8;
  const gutter = 50;             // reserved right space for the goal label
  const plotR = W - gutter;      // bars live in [L, plotR]
  const plotW = plotR - L;
  const n = week.length;
  const slot = plotW / n;
  const barW = Math.min(22, slot * 0.52);

  const topPad = 22;             // headroom for the value labels
  const baseY = 124;             // bar baseline
  const labelY = baseY + 18;     // weekday labels
  const barMaxH = baseY - topPad;

  // Scale from 0 → ceil, keeping headroom above the tallest bar for its label.
  const maxVal = Math.max(goal, ...week.map((w) => w.value));
  const ceil = maxVal * 1.1;
  const yOf = (v: number) => baseY - (v / ceil) * barMaxH;
  const goalY = yOf(goal);

  const bars = week.map((w, i) => {
    const cx = L + slot * i + slot / 2;
    const topY = yOf(w.value);
    return { ...w, cx, x: cx - barW / 2, topY, h: baseY - topY, hit: w.value >= goal };
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
      {lightForm && <defs><SageBarDefs uid={uid} /><AuraDefs uid={uid} /></defs>}

      {/* Dashed goal line — spans only the bar area */}
      <line
        x1={L} y1={goalY.toFixed(1)} x2={plotR} y2={goalY.toFixed(1)}
        stroke={lightForm ? "var(--nura-chart-reference)" : "var(--nura-text-tertiary)"}
        strokeWidth={1} strokeDasharray={lightForm ? "3 4" : "4 4"} opacity={lightForm ? 1 : 0.6}
      />

      {/* Aura pass — under every bar, so a wide soft edge never laps the
          neighbour drawn before it. Hitting the goal IS the emphasis on this
          chart, so that is exactly what gets lit. */}
      {lightForm && bars.filter((b) => b.hit).map((b, i) => (
        <BarAura key={`a${i}`} uid={uid} x={b.x} y={b.topY} w={barW} h={Math.max(1, b.h)} r={2} />
      ))}

      {/* Bars — flat fills, no gradient and no blur. Light rounds only the
          tops, so the row sits on the axis instead of floating above it. */}
      {bars.map((b, i) => (
        lightForm ? (
          // Hit goal = emphasis tone; missed stays the warm grey it has always
          // been, which is the de-emphasis colour for an under-goal context.
          <g key={i}>
            <path d={roundedTopBar(b.x, b.topY, barW, Math.max(1, b.h), 2)} fill={b.hit ? sageFill(uid, "deep") : MISS_FILL} />
            {b.hit && <BarTopEdge x={b.x} y={b.topY} w={barW} r={2} />}
          </g>
        ) : (
          <rect
            key={i}
            x={b.x.toFixed(1)} y={b.topY.toFixed(1)} width={barW.toFixed(1)} height={Math.max(1, b.h).toFixed(1)}
            rx={3}
            fill={b.hit ? paint.hex : MISS_FILL}
          />
        )
      ))}

      {/* Today's outline — crisp cream stroke on top (no glow) */}
      {bars.filter((b) => b.isToday).map((b, i) => (
        <rect
          key={`t${i}`}
          x={b.x.toFixed(1)} y={b.topY.toFixed(1)} width={barW.toFixed(1)} height={Math.max(1, b.h).toFixed(1)}
          rx={3} fill="none" stroke="var(--nura-text-primary)" strokeWidth={1} opacity={0.85}
        />
      ))}

      {/* Value labels above each bar — soft cream, centered, non-overlapping */}
      {bars.map((b, i) => (
        <text
          key={`v${i}`}
          x={b.cx.toFixed(1)} y={(b.topY - 6).toFixed(1)} textAnchor="middle"
          fontSize={10} fontWeight={600} fill="var(--nura-text-secondary)" style={{ fontFamily: MONO }}
        >
          {fmtK(b.value)}
        </text>
      ))}

      {/* Weekday labels — today bold cream, others muted */}
      {bars.map((b, i) => (
        <text
          key={`d${i}`}
          x={b.cx.toFixed(1)} y={labelY.toFixed(1)} textAnchor="middle"
          fontSize={10} fontWeight={b.isToday ? 700 : 500}
          fill={b.isToday ? "var(--nura-text-primary)" : "var(--nura-text-tertiary)"} style={{ fontFamily: MONO }}
        >
          {b.label}
        </text>
      ))}

      {/* Goal label — parked in the right gutter, aligned to the goal line */}
      <text x={(plotR + 6).toFixed(1)} y={(goalY + 3.5).toFixed(1)} textAnchor="start" fontSize={10} fill="var(--nura-text-tertiary)" style={{ fontFamily: MONO }}>
        {Math.round(goal / 1000)}k goal
      </text>
    </svg>
  );
}

// ── Steps card ─────────────────────────────────────────────────────────────────
// Standalone dashboard tile: today's total + a weekly Mon–Sun bar chart. Reads
// real weekly step data (dev fallback if the store has none). Tappable → detail.
export default function StepsCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const paint = useMetricPaint(metric.id);
  const d = getStepsDetail();
  const week = d.week?.length ? d.week : FALLBACK_WEEK;
  const goal = d.weekGoal || d.goal || 10000;
  const today = d.steps ?? week.find((w) => w.isToday)?.value ?? metric.value ?? 8420;
  const hitCount = week.filter((w) => w.value >= goal).length;

  return (
    <div
      className="dash-card"
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      style={{
        background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 18,
        padding: 18, cursor: "pointer", display: "flex", flexDirection: "column",
        minHeight: 248,
      }}
    >
      {/* Header — name (left) · source (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{metric.name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[metric.source]}</span>
      </div>

      {/* Today's total + small label */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {today.toLocaleString("en-US")}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>steps today</span>
      </div>

      {/* Weekly bar chart */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", marginTop: 12, marginBottom: 8 }}>
        <WeeklyBars week={week} goal={goal} paint={paint} />
      </div>

      {/* Legend — two series, so it earns a legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 10, fontFamily: SANS, fontSize: 10.5, color: TEXT_TER }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: paint.hex }} />
          {HIT_LABEL} {Math.round(goal / 1000)}k goal
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: MISS_FILL }} />
          Under goal
        </span>
      </div>

      {/* Footer — days-hit-goal summary (real data) */}
      <div style={{ marginTop: "auto", fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4 }}>
        {hitCount} of {week.length} days hit goal this week
      </div>
    </div>
  );
}
