"use client";

import { useId, type ReactElement } from "react";
import type { MetricChartData } from "@/lib/dashboardData";
import { useThemeTokens } from "@/lib/themeTokens";

// Shared dashboard metric-card chart.
//
// Dense, thin rounded bars across the day rising from a per-metric floor, with:
//  • intensity color grading — each bar interpolated along a per-metric ramp by
//    its normalized value (not a single flat color)
//  • a soft colored glow on the hot/high bars only
//  • a smooth dashed Catmull-Rom threshold curve over the bars
//  • faint horizontal gridlines + right-edge value labels
//  • a faint shaded band over the overnight sleep window (first ~27%)
//  • an x-axis row (12a / 6a / 12p / 6p / now)
//
// Every metric card renders this, so the look is shared. Colors mirror the
// --nura-* status/metric tokens (the ramps must interpolate, which needs the
// literal hexes rather than CSS vars).
//
// `highTech` is an OPT-IN elevated treatment (used only by the Steps card +
// Steps detail "Today" chart): lit-glass gradient pills, per-bar colored glow,
// vertical hour gridlines, an orange hotspot behind the busiest stretch, a glowing
// average curve, and a glowing peak readout. When false (the default) the chart
// renders exactly as before — Heart Rate and every other card are untouched.

const SANS = "var(--font-inter), system-ui, sans-serif";
// Every colour here feeds hex interpolation (mix/rampColor/lighten) or an SVG
// presentation attribute, so all of it resolves to concrete hex via tokens.
// High-tech is a Steps-only treatment → a pure-orange identity (no teal/green).
const TOKENS = {
  ink:     ["--nura-fg-rgb", "235,230,216"],
  htGlow:  ["--nura-orange-rgb", "227,162,99"],
  htHi:    ["--nura-orange-hi", "#f3c795"],
  htMid:   ["--nura-orange-mid", "#f0bc84"],
  htBase:  ["--nura-orange", "#e3a263"],
  teal:    ["--nura-teal", "#5dccae"],
  amber:   ["--nura-amber", "#e0a23e"],
  coral:   ["--nura-alert", "#e8745a"],
  sage:    ["--nura-sage", "#9bb0a5"],
  emerald: ["--nura-optimal", "#5fbf8c"],
} as const;
type ChartTokens = Record<keyof typeof TOKENS, string>;

const rampsFor = (t: ChartTokens): Record<MetricChartData["ramp"], [string, string, string]> => ({
  hr: [t.teal, t.amber, t.coral],
  higherBetter: [t.amber, t.sage, t.emerald],
  lowerBetter: [t.emerald, t.sage, t.amber],
});

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a), y = hexToRgb(b);
  const c = (i: number) => Math.round(x[i] + (y[i] - x[i]) * t);
  return `rgb(${c(0)},${c(1)},${c(2)})`;
}
function rampColor(stops: [string, string, string], t: number): string {
  const u = Math.max(0, Math.min(1, t));
  return u < 0.5 ? mix(stops[0], stops[1], u / 0.5) : mix(stops[1], stops[2], (u - 0.5) / 0.5);
}

// High-tech helpers: resolve a ramp value to an [r,g,b] triplet and a lightened
// ("lit") variant for the top of each bar's vertical gradient.
function mixArr(a: string, b: string, t: number): [number, number, number] {
  const x = hexToRgb(a), y = hexToRgb(b);
  const c = (i: number) => Math.round(x[i] + (y[i] - x[i]) * t);
  return [c(0), c(1), c(2)];
}
function rampRgb(stops: [string, string, string], t: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  return u < 0.5 ? mixArr(stops[0], stops[1], u / 0.5) : mixArr(stops[1], stops[2], (u - 0.5) / 0.5);
}
function lighten([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [Math.round(r + (255 - r) * amt), Math.round(g + (255 - g) * amt), Math.round(b + (255 - b) * amt)];
}

// Catmull-Rom → cubic-bezier path through evenly spaced points.
function catmullRom(pts: [number, number][]): string {
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

export default function MetricChart({
  data,
  height = 116,
  highTech = false,
}: {
  data: MetricChartData;
  height?: number;
  highTech?: boolean;
}) {
  const tk = useThemeTokens(TOKENS);
  const INK = tk.ink;
  const HT_GLOW = tk.htGlow;
  const HT_STOPS: [string, string, string] = [tk.htHi, tk.htMid, tk.htBase];

  const { readings, baseline, floor, ceiling, gridlines, ramp } = data;
  const W = 356, H = height;
  const top = 12, base = H - 16, plotH = base - top;
  const span = (ceiling - floor) || 1;
  const yOf = (v: number) => base - Math.max(0, Math.min(1, (v - floor) / span)) * plotH;
  const normOf = (v: number) => Math.max(0, Math.min(1, (v - floor) / span));

  const n = readings.length;
  const slot = W / n;
  const bw = Math.min(slot * 0.6, 4);
  const stops = rampsFor(tk)[ramp];
  const HOT = 0.72;

  // Unique gradient-id prefix so multiple charts on a page never collide.
  const rawId = useId();
  const uid = `mc-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Dashed threshold curve from the coarse baseline series (shared by both modes).
  const m = baseline.length;
  const curvePts: [number, number][] = baseline.map((v, k) => [m > 1 ? (k / (m - 1)) * W : 0, yOf(v)]);
  const curve = catmullRom(curvePts);

  // ── High-tech treatment ────────────────────────────────────────────────────
  if (highTech) {
    // Per-bar lit-glass pills + their vertical gradients.
    const defs: ReactElement[] = [];
    const bars: ReactElement[] = [];
    readings.forEach((v, i) => {
      const norm = normOf(v);
      const h = Math.max(norm * plotH, 2);
      const x = i * slot + (slot - bw) / 2;
      const y = base - h;
      const [r, g, b] = rampRgb(HT_STOPS, norm);
      const [lr, lg, lb] = lighten([r, g, b], 0.5);
      const rx = Math.min(bw / 2, h / 2); // fully rounded top AND bottom
      const glowR = (2 + norm * 5).toFixed(1);
      const glowA = (0.3 + norm * 0.45).toFixed(2);
      const gid = `${uid}-bar-${i}`;
      defs.push(
        <linearGradient key={gid} id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${lr},${lg},${lb})`} stopOpacity="1" />
          <stop offset="50%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.92" />
          <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.42" />
        </linearGradient>,
      );
      bars.push(
        <rect
          key={i} x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)}
          rx={rx.toFixed(1)} fill={`url(#${gid})`}
          style={{ filter: `drop-shadow(0 0 ${glowR}px rgba(${r},${g},${b},${glowA}))` }}
        />,
      );
    });

    // Peak bar — glowing dot + "value · PEAK · time" readout above it.
    let peakIdx = 0;
    readings.forEach((v, i) => { if (v > readings[peakIdx]) peakIdx = i; });
    const peakV = readings[peakIdx];
    const peakX = peakIdx * slot + slot / 2;
    const peakY = base - Math.max(normOf(peakV) * plotH, 2);
    const peakHour = Math.round((peakIdx / Math.max(1, n - 1)) * 24) % 24;
    const peakAmpm = peakHour < 12 ? "A" : "P";
    const peakH12 = peakHour % 12 === 0 ? 12 : peakHour % 12;
    const peakLabel = `${Math.round(peakV)} · PEAK · ${peakH12}${peakAmpm}`;
    const labelY = Math.max(11, peakY - 11);
    const labelX = Math.max(40, Math.min(W - 40, peakX));

    // Vertical hour gridlines (instrument-panel feel) at the x-axis tick fractions.
    const vTicks = [0, 0.25, 0.5, 0.75, 1];

    return (
      <div style={{ marginTop: 2 }}>
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
          <defs>
            {defs}
            <radialGradient id={`${uid}-hot`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`rgba(${HT_GLOW},0.28)`} />
              <stop offset="60%" stopColor={`rgba(${HT_GLOW},0.10)`} />
              <stop offset="100%" stopColor={`rgba(${HT_GLOW},0)`} />
            </radialGradient>
          </defs>

          {/* Orange hotspot behind the most active stretch of the day */}
          <ellipse
            cx={peakX.toFixed(1)} cy={((top + base) / 2).toFixed(1)} rx={(slot * 5).toFixed(1)} ry={(plotH * 0.62).toFixed(1)}
            fill={`url(#${uid}-hot)`} style={{ filter: "blur(6px)" }}
          />

          {/* Overnight sleep window band (~first 27%) */}
          <rect x={0} y={top} width={W * 0.27} height={plotH} rx={8} fill={`rgba(${INK},0.035)`} />

          {/* Vertical hour gridlines */}
          {vTicks.map((f, i) => (
            <line key={`v${i}`} x1={(f * W).toFixed(1)} x2={(f * W).toFixed(1)} y1={top} y2={base} stroke={`rgba(${INK},0.05)`} strokeWidth={1} />
          ))}

          {/* Horizontal gridlines */}
          {gridlines.map((gl, i) => (
            <line key={`g${i}`} x1={0} x2={W} y1={yOf(gl)} y2={yOf(gl)} stroke={`rgba(${INK},0.07)`} strokeWidth={1} />
          ))}

          {/* Lit-glass pill bars */}
          <g>{bars}</g>

          {/* Glowing dashed average curve */}
          {curve && (
            <path
              d={curve} fill="none" stroke={`rgba(${INK},0.55)`} strokeWidth={1.6} strokeDasharray="4 5" strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 5px rgba(${HT_GLOW},0.5))` }}
            />
          )}

          {/* Gridline value labels at the right edge (drawn late for legibility) */}
          {gridlines.map((gl, i) => (
            <text key={`l${i}`} x={W - 2} y={yOf(gl) - 3} textAnchor="end" fill={`rgba(${INK},0.32)`} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600 }}>
              {String(gl)}
            </text>
          ))}

          {/* Peak readout — label (peak dot removed) */}
          <text
            x={labelX.toFixed(1)} y={labelY.toFixed(1)} textAnchor="middle"
            fill={tk.htHi} style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.5px", filter: `drop-shadow(0 0 5px rgba(${HT_GLOW},0.6))` }}
          >
            {peakLabel}
          </text>
        </svg>

        {/* X-axis */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: SANS, fontSize: 9.5, color: `rgba(${INK},0.30)`, letterSpacing: "0.3px" }}>
          <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>now</span>
        </div>
      </div>
    );
  }

  // ── Default treatment (unchanged) ────────────────────────────────────────────
  const cool: ReactElement[] = [];
  const hot: ReactElement[] = [];
  readings.forEach((v, i) => {
    const norm = Math.max(0, Math.min(1, (v - floor) / span));
    const h = Math.max(norm * plotH, 2);
    const x = i * slot + (slot - bw) / 2;
    const y = base - h;
    const rect = (
      <rect
        key={i} x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)}
        rx={(bw / 2).toFixed(1)} fill={rampColor(stops, norm)} opacity={(0.5 + 0.5 * norm).toFixed(2)}
      />
    );
    (norm > HOT ? hot : cool).push(rect);
  });

  return (
    <div style={{ marginTop: 2 }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
        {/* Overnight sleep window band (~first 27%) */}
        <rect x={0} y={top} width={W * 0.27} height={plotH} rx={8} fill={`rgba(${INK},0.035)`} />

        {/* Gridlines */}
        {gridlines.map((g, i) => (
          <line key={`g${i}`} x1={0} x2={W} y1={yOf(g)} y2={yOf(g)} stroke={`rgba(${INK},0.07)`} strokeWidth={1} />
        ))}

        {/* Bars */}
        <g>{cool}</g>
        <g style={{ filter: `drop-shadow(0 0 4px ${stops[2]}66)` }}>{hot}</g>

        {/* Dashed threshold curve */}
        {curve && (
          <path d={curve} fill="none" stroke={`rgba(${INK},0.38)`} strokeWidth={1.5} strokeDasharray="4 5" strokeLinecap="round" />
        )}

        {/* Gridline value labels at the right edge (drawn last for legibility) */}
        {gridlines.map((g, i) => (
          <text key={`l${i}`} x={W - 2} y={yOf(g) - 3} textAnchor="end" fill={`rgba(${INK},0.32)`} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600 }}>
            {String(g)}
          </text>
        ))}
      </svg>

      {/* X-axis */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: SANS, fontSize: 9.5, color: `rgba(${INK},0.30)`, letterSpacing: "0.3px" }}>
        <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>now</span>
      </div>
    </div>
  );
}
