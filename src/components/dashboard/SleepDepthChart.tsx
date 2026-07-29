import type { ReactElement } from "react";
import type { SleepDepthChartData } from "@/lib/dashboardData";
import { useThemeTokens } from "@/lib/themeTokens";
import { useAccents } from "@/lib/accents";

// Sleep card's bespoke overnight chart (mirrors design-reference/
// nura-sleep-card-modern.html). Only the Sleep metric card renders this; every
// other card keeps the shared MetricChart.
//
//  • gradient stage bars across the night (11p→7a) — height follows the
//    hypnogram depth, each bar colored by its stage band (deep / REM / light /
//    awake) with a top→bottom vertical gradient (lighter at the top, fading
//    translucent at the base)
//  • a subtle 1.5px glow on the deep bars only
//  • three faint horizontal gridlines for structure
//  • the stage-duration legend row beneath
//
// No overlay line and no crest dots — purely the stage bars.

const SANS = "var(--font-inter), system-ui, sans-serif";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode

// Stage palette. The per-bar gradients lighten these, so they must resolve to
// concrete hex — see lib/themeTokens.ts.
const STAGE_TOKENS = {
  deep:  ["--nura-sleep-deep", "#5aa0e6"],
  rem:   ["--nura-teal", "#5dccae"],
  light: ["--nura-sage", "#9bb0a5"],
  awake: ["--nura-good", "#d3a253"],
} as const;

type Stage = keyof typeof STAGE_TOKENS;

// Depth → stage band. Mirrors the reference thresholds.
function bandStage(d: number): Stage {
  if (d >= 0.78) return "deep";
  if (d >= 0.5) return "light";
  if (d >= 0.3) return "rem";
  return "awake";
}

function hex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function light([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [Math.round(r + (255 - r) * amt), Math.round(g + (255 - g) * amt), Math.round(b + (255 - b) * amt)];
}

export default function SleepDepthChart({ data }: { data: SleepDepthChartData }) {
  const STAGE_HEX = useThemeTokens(STAGE_TOKENS);
  const acc = useAccents();
  const { depth, stages, axisLabels } = data;

  // Geometry mirrors the reference SVG (viewBox 0 0 356 124).
  const W = 356, H = 124, top = 10, bot = 92;
  const plotH = bot - top;
  const n = depth.length;
  const slot = W / n;
  const bw = Math.min(slot * 0.62, 7);
  const yOf = (d: number) => bot - d * plotH;

  const grads: ReactElement[] = [];
  const bars: ReactElement[] = [];
  depth.forEach((d, i) => {
    const stage = bandStage(d);
    const c = STAGE_HEX[stage];
    const [r, g, b] = hex(c);
    const [lr, lg, lb] = light([r, g, b], 0.35);
    const x = i * slot + (slot - bw) / 2;
    const yy = yOf(d);
    const h = bot - yy;
    const gid = `sb${i}`;
    grads.push(
      <linearGradient key={gid} id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={`rgb(${lr},${lg},${lb})`} stopOpacity={1} />
        <stop offset="1" stopColor={`rgb(${r},${g},${b})`} stopOpacity={0.18} />
      </linearGradient>,
    );
    bars.push(
      <rect
        key={i} x={x.toFixed(1)} y={yy.toFixed(1)} width={bw.toFixed(1)}
        height={h.toFixed(1)} rx={Math.min(bw / 2, h / 2).toFixed(1)} fill={`url(#${gid})`}
        style={stage === "deep" ? { filter: `drop-shadow(0 0 1.5px rgba(${r},${g},${b},0.7))` } : undefined}
      />,
    );
  });

  // Three faint horizontal gridlines for structure.
  const gridlines = [0.25, 0.5, 0.75].map((f, i) => (
    <line key={`g${i}`} x1={0} x2={W} y1={top + plotH * f} y2={top + plotH * f} stroke={`rgba(${INK},0.06)`} strokeWidth={1} />
  ));

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
        <defs>{grads}</defs>
        {gridlines}
        {bars}
      </svg>

      {/* X-axis */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: 5, fontFamily: SANS, fontSize: 10, color: "var(--nura-ink-a30)" }}>
        {axisLabels.map((l, i) => <span key={i}>{l}</span>)}
      </div>

      {/* Stage-duration row */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14 }}>
        {stages.map((s) => (
          <div key={s.label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 10.5, color: "var(--nura-ink-a55)", letterSpacing: "0.3px" }}>
              <i style={{ width: 8, height: 8, borderRadius: 2, background: s.color.startsWith("--") ? acc[s.color as keyof typeof acc] : s.color, flexShrink: 0 }} />
              {s.label}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: `rgb(${INK})` }}>{s.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
