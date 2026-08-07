"use client";

import type { ActiveEnergyDetail } from "@/lib/dashboardData";
import type { MetricPaint } from "@/lib/metricColors";
import { useId, useMemo } from "react";
import {
  ENTER_CLASS, MONO, PAD, STROKE, TYPE,
  XAxis, YAxis, fitTicks, useMeasuredWidth,
  AuraDefs, BarAura, BarTopEdge, SageBarDefs, barTones, roundedTopBar, sageFill,
} from "@/components/dashboard/chartTheme";
import { useIsLightForm } from "@/lib/themeTokens";

// Shared "Active Energy — Today" intraday chart, rendered by BOTH the Active
// Energy detail page and the dashboard Active Energy card.
//
// Flat bars in the movement amber, hairline gridlines with a right-gutter mono
// axis, a dashed neutral average curve, a peak readout and a dashed "now"
// marker. Same geometry and type scale as MetricChart, because they are the
// same chart with different data.
//
// It used to be "ember-orange lit-glass pills": a three-stop hue ramp per bar,
// a per-bar drop-shadow bloom, a glowing dashed curve and a glowing peak label.
// The ramp is gone for the reason given in MetricChart (a hue ramp inside one
// metric is the colour-drift problem in miniature, and alpha grading cannot
// hold 3:1 on white); the glow is gone because bloom reads as grime over white,
// which is why the light theme had to switch it all off again downstream.


// ── Chart helpers (hex · lerp · light · colorAt · smooth) ─────────────────────
// Re-exported through cardChartHelpers and used by several other charts, so
// they stay even though this file no longer interpolates a ramp of its own.

export function hex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** Lighten a color toward white by `amt` (0–1) — the lit top of each bar. */
export function light([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [Math.round(lerp(r, 255, amt)), Math.round(lerp(g, 255, amt)), Math.round(lerp(b, 255, amt))];
}
/** Resolve a 0–1 intensity to an [r,g,b] along an ordered ramp. */
/** Last-resort default, for a caller that renders before its tokens resolve.
 *  Three steps of the dark sage ladder — it was the amber→coral ember ramp,
 *  which is how an un-migrated caller could silently paint a chart in a hue
 *  the theme no longer contains. Migrated callers pass a resolved ramp. */
const RAMP_DARK = ["#6d8175", "#9bb0a5", "#bacdc1"] as const;

export function colorAt(t: number, ramp: readonly string[] = RAMP_DARK): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  const [a, b, c] = ramp.map(hex);
  const s = u < 0.5 ? a : b;
  const e = u < 0.5 ? b : c;
  const k = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
  return [Math.round(lerp(s[0], e[0], k)), Math.round(lerp(s[1], e[1], k)), Math.round(lerp(s[2], e[2], k))];
}
/** Catmull-Rom → cubic-bezier path through evenly spaced points. */
export function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
/** Format a 0–23 hour as a compact clock label, e.g. 14 → "2P". */
function hourLabel(h24: number): string {
  const ap = h24 < 12 ? "A" : "P";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}${ap}`;
}

export default function ActiveEnergyTodayChart({
  d, color, height = 176,
}: {
  d: ActiveEnergyDetail;
  /** The metric's colour, from `useMetricPaint("active-energy")`. */
  color: MetricPaint;
  height?: number;
}) {
  const { ref, width: W } = useMeasuredWidth<HTMLDivElement>();
  // Same three-tone treatment as every other bar chart — this one was still
  // drawing flat metric-hex bars in light, which is the one card in the sweep
  // that did not look like the rest of the system.
  const lightForm = useIsLightForm();
  const rawUid = useId();
  const uid = `ae-today-${rawUid.replace(/[^a-zA-Z0-9]/g, "")}`;
  const tones = useMemo(() => barTones(d.todayHourly), [d.todayHourly]);

  const H = height;
  const plotL = PAD.left;
  const plotR = Math.max(plotL + 1, W - PAD.right);
  const plotT = PAD.top;
  const plotB = H - PAD.bottom;
  const plotH = Math.max(1, plotB - plotT);

  const data = d.todayHourly;
  const span = (d.todayCeil - d.todayFloor) || 1;
  const normOf = (v: number) => Math.max(0, Math.min(1, (v - d.todayFloor) / span));
  const yOf = (v: number) => plotB - normOf(v) * plotH;

  if (!(W > 0) || !data.length) return <div ref={ref} style={{ width: "100%", height: H }} />;

  const n = data.length;
  const slot = (plotR - plotL) / n;
  const bw = Math.min(slot * 0.62, 5);
  const ticks = fitTicks(d.todayGridlines, plotH, d.todayFloor, d.todayCeil);

  // Peak bar.
  let pi = 0;
  data.forEach((v, i) => { if (v > data[pi]) pi = i; });
  const peakX = plotL + pi * slot + slot / 2;
  const peakLabel = `${Math.round(data[pi])} · PEAK · ${hourLabel(Math.round((pi / Math.max(1, n - 1)) * 24) % 24)}`;

  // Average curve.
  const bl = d.todayBaseline, m = bl.length;
  const curve = m > 1
    ? smooth(bl.map((v, k) => [plotL + (k / (m - 1)) * (plotR - plotL), yOf(v)] as [number, number]))
    : "";

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <svg
        width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        className={ENTER_CLASS} style={{ display: "block" }}
      >
        {lightForm && <defs><SageBarDefs uid={uid} /><AuraDefs uid={uid} /></defs>}

        <YAxis ticks={ticks} yAt={yOf} plotLeft={plotL} plotRight={plotR} format={(v) => String(v)} />

        {/* Aura pass — its own layer under ALL the bars, so a soft edge never
            laps the neighbour drawn before it. `deep` is the emphasis set: the
            top ~18% of the day plus the latest hours. */}
        {lightForm && data.map((v, i) => {
          if (tones[i] !== "deep") return null;
          const h = Math.max(normOf(v) * plotH, 2);
          const x = plotL + i * slot + (slot - bw) / 2;
          return <BarAura key={`a${i}`} uid={uid} x={x} y={plotB - h} w={bw} h={h} r={2} />;
        })}

        {/* Bars — flat, one colour, height carries the value */}
        {data.map((v, i) => {
          const norm = normOf(v);
          const h = Math.max(norm * plotH, 2);
          const x = plotL + i * slot + (slot - bw) / 2;
          return lightForm ? (
            <g key={i}>
              <path d={roundedTopBar(x, plotB - h, bw, h, 2)} fill={sageFill(uid, tones[i])} />
              {tones[i] !== "faint" && <BarTopEdge x={x} y={plotB - h} w={bw} r={2} />}
            </g>
          ) : (
            <rect
              key={i} x={x.toFixed(2)} y={(plotB - h).toFixed(2)}
              width={bw.toFixed(2)} height={h.toFixed(2)}
              rx={Math.min(bw / 2, h / 2).toFixed(2)} fill={color.hex}
              // Only the taller half of the day blooms, scaled by height —
              // dark's original treatment. Flattened wholesale in light.
              style={norm > 0.5
                ? { filter: `drop-shadow(0 0 ${(1.5 + norm * 4).toFixed(1)}px ${color.alpha(Number((0.2 + norm * 0.45).toFixed(2)))})` }
                : undefined}
            />
          );
        })}

        {/* Dashed average curve — neutral, because it is a reference */}
        {curve && (
          <path
            d={curve} fill="none"
            stroke={lightForm ? "var(--nura-chart-reference)" : "var(--nura-text-tertiary)"}
            strokeWidth={lightForm ? 1 : STROKE.baseline}
            strokeDasharray={lightForm ? "3 4" : "4 5"}
            strokeLinecap="round" opacity={lightForm ? 1 : 0.55}
          />
        )}

        {/* "now" marker at the right edge of the plot */}
        <line
          x1={plotR} x2={plotR} y1={plotT} y2={plotB}
          stroke="var(--nura-border-strong)" strokeWidth={STROKE.grid} strokeDasharray="3 4"
        />

        {/* Unit label, top-left */}
        <text
          x={plotL} y={plotT - 7} fontFamily={MONO} fontSize={TYPE.tick}
          style={{ fill: "var(--nura-text-tertiary)" }}
        >
          KCAL/HR
        </text>

        {/* Peak readout */}
        <text
          x={Math.max(plotL + 46, Math.min(plotR - 46, peakX)).toFixed(2)}
          y={Math.max(plotT - 4, yOf(data[pi]) - 9).toFixed(2)}
          textAnchor="middle" fontFamily={MONO} fontSize={TYPE.tick}
          style={{
            fill: "var(--nura-text-secondary)",
            paintOrder: "stroke", stroke: "var(--nura-card)",
            strokeWidth: 3.5, strokeLinejoin: "round",
          }}
        >
          {peakLabel}
        </text>

        <XAxis labels={["12a", "6a", "12p", "6p", "now"]} plotLeft={plotL} plotRight={plotR} y={H - 6} />
      </svg>
    </div>
  );
}
