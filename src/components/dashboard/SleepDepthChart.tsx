import type { ReactElement } from "react";
import type { SleepDepthChartData } from "@/lib/dashboardData";

// Sleep card's bespoke overnight depth chart (mirrors design-reference/
// nura-sleep-card-final.html). Only the Sleep metric card renders this; every
// other card keeps the shared MetricChart.
//
//  • color-coded depth bars across the night — height = sleep depth, colored by
//    stage band (deep / light / REM / awake), each with a top→bottom gradient
//    and rounded top
//  • a flowing white glowing line (smooth Catmull-Rom curve) riding just above
//    the bar tops, zigzagging with the sleep-cycle depth
//  • a glowing off-white dot on every wave crest (each local maximum), including
//    the final small hump — but none in the troughs and none at the tail
//  • the stage-duration row beneath
//
// Colors are token-driven (--nura-* vars) so it tracks the design system and
// works in dark mode; the off-white ink (line, dots, awake bars) is the warm
// --nura-fg-rgb token.

const SANS = "'Inter', system-ui, sans-serif";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode

// Depth → stage-band color (token-driven). Mirrors the reference thresholds.
function bandColor(d: number): string {
  if (d >= 0.78) return "var(--nura-sleep-deep)"; // deep — blue
  if (d >= 0.5) return "var(--nura-sage)";        // light — sage
  if (d >= 0.3) return "var(--nura-teal)";        // REM — teal
  return `rgba(${INK},0.4)`;                       // awake — faint off-white
}

// Catmull-Rom → cubic-bezier path through the (uneven-x) crest points.
function catmullRom(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function SleepDepthChart({ data }: { data: SleepDepthChartData }) {
  const { depth, stages, axisLabels } = data;

  // Geometry mirrors the reference SVG (viewBox 0 0 356 124).
  const W = 356, H = 124, top = 10, bot = 92;
  const plotH = bot - top;
  const n = depth.length;
  const slot = W / n;
  const bw = Math.min(slot * 0.62, 7);
  const yOf = (d: number) => bot - d * plotH;

  const bars: ReactElement[] = [];
  const grads: ReactElement[] = [];
  const tops: { x: number; y: number }[] = [];
  depth.forEach((d, i) => {
    const c = bandColor(d);
    const x = i * slot + (slot - bw) / 2;
    const yy = yOf(d);
    const gid = `sb${i}`;
    grads.push(
      <linearGradient key={gid} id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={c} />
        <stop offset="1" stopColor={c} stopOpacity={0.3} />
      </linearGradient>,
    );
    bars.push(
      <rect
        key={i} x={x.toFixed(1)} y={yy.toFixed(1)} width={bw.toFixed(1)}
        height={(bot - yy).toFixed(1)} rx={(bw / 2).toFixed(1)} fill={`url(#${gid})`}
      />,
    );
    tops.push({ x: i * slot + slot / 2, y: yy - 4 });
  });

  const line = catmullRom(tops);

  // Glowing dot at every wave crest (local maximum), including the final small
  // hump — but never in a trough and never at the tail.
  const dots: ReactElement[] = [];
  depth.forEach((d, i) => {
    if (i === n - 1) return; // no dot at the very end / tail
    const prev = depth[i - 1] ?? Infinity;
    const next = depth[i + 1] ?? Infinity;
    if (d >= prev && d > next) {
      const p = tops[i];
      dots.push(
        <circle
          key={`dot${i}`} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3.6}
          fill={`rgb(${INK})`}
          style={{ filter: `drop-shadow(0 0 6px rgba(${INK},0.9))` }}
        />,
      );
    }
  });

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
        <defs>{grads}</defs>
        <g style={{ filter: "drop-shadow(0 0 4px rgba(var(--nura-teal-rgb),0.22))" }}>{bars}</g>
        {line && (
          <path
            d={line} fill="none" stroke={`rgb(${INK})`} strokeWidth={2.2}
            strokeLinecap="round" strokeLinejoin="round" opacity={0.92}
            style={{ filter: `drop-shadow(0 0 6px rgba(${INK},0.5))` }}
          />
        )}
        {dots}
      </svg>

      {/* X-axis */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: 5, fontFamily: SANS, fontSize: 10, color: `rgba(${INK},0.30)` }}>
        {axisLabels.map((l, i) => <span key={i}>{l}</span>)}
      </div>

      {/* Stage-duration row */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14 }}>
        {stages.map((s) => (
          <div key={s.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 10.5, color: `rgba(${INK},0.55)`, letterSpacing: "0.3px" }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              {s.label}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: `rgb(${INK})` }}>{s.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
