import type { ReactElement } from "react";
import type { MetricChartData } from "@/lib/dashboardData";

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

const SANS = "'Inter', system-ui, sans-serif";
const INK = "235,230,216"; // warm-white, matches --nura-fg-rgb (dark)

// Ramp stops mirror tokens: teal=--nura-teal, amber=--nura-amber,
// coral=--nura-alert, sage=--nura-sage, emerald=--nura-optimal.
const RAMPS: Record<MetricChartData["ramp"], [string, string, string]> = {
  hr: ["#5dccae", "#e0a23e", "#e8745a"],            // cool teal → amber → coral
  higherBetter: ["#e0a23e", "#9bb0a5", "#5fbf8c"],  // amber → sage → emerald
  lowerBetter: ["#5fbf8c", "#9bb0a5", "#e0a23e"],   // emerald → sage → amber
};

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

export default function MetricChart({ data, height = 116 }: { data: MetricChartData; height?: number }) {
  const { readings, baseline, floor, ceiling, gridlines, ramp } = data;
  const W = 356, H = height;
  const top = 12, base = H - 16, plotH = base - top;
  const span = (ceiling - floor) || 1;
  const yOf = (v: number) => base - Math.max(0, Math.min(1, (v - floor) / span)) * plotH;

  const n = readings.length;
  const slot = W / n;
  const bw = Math.min(slot * 0.6, 4);
  const stops = RAMPS[ramp];
  const HOT = 0.72;

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

  // Dashed threshold curve from the coarse baseline series.
  const m = baseline.length;
  const curvePts: [number, number][] = baseline.map((v, k) => [m > 1 ? (k / (m - 1)) * W : 0, yOf(v)]);
  const curve = catmullRom(curvePts);

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
