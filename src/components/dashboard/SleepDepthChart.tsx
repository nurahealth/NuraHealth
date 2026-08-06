import type { ReactElement } from "react";
import type { SleepDepthChartData } from "@/lib/dashboardData";
import { useThemeTokens } from "@/lib/themeTokens";
import { useAccents } from "@/lib/accents";

// Sleep card's bespoke overnight chart (mirrors design-reference/
// nura-sleep-card-modern.html). Only the Sleep metric card renders this; every
// other card keeps the shared MetricChart.
//
//  • stage bars across the night (11p→7a) — height follows the hypnogram depth,
//    each bar coloured by its stage band (deep / REM / light / awake)
//  • three hairline gridlines for structure
//  • the stage-duration legend row beneath
//
// The four stages are four steps of ONE hue (the sleep indigo), because depth
// is a single ordered quantity — see the note beside --nura-stage-* in
// globals.css. Previously they were four unrelated hues, which made the
// hypnogram a rainbow and gave "Awake" a status gold it had not earned.
//
// The per-bar vertical gradient and the glow on the deep bars are gone: a
// gradient that fades each bar to 18% at its base means the bottom of the chart
// is barely a mark at all, and the ordered ramp now carries the distinction
// that the lightening was there to prop up.

import { MONO } from "@/components/dashboard/chartTheme";

const SANS = "var(--font-inter), system-ui, sans-serif";

// Stage palette — resolved to concrete hex for SVG fills. See lib/themeTokens.
const STAGE_TOKENS = {
  deep:  ["--nura-stage-deep", "#bacdc1"],
  rem:   ["--nura-stage-rem", "#9bb0a5"],
  light: ["--nura-stage-light", "#869a8e"],
  awake: ["--nura-stage-awake", "#6d8175"],
} as const;

type Stage = keyof typeof STAGE_TOKENS;

// Depth → stage band. Mirrors the reference thresholds.
function bandStage(d: number): Stage {
  if (d >= 0.78) return "deep";
  if (d >= 0.5) return "light";
  if (d >= 0.3) return "rem";
  return "awake";
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

  const bars: ReactElement[] = depth.map((d, i) => {
    const x = i * slot + (slot - bw) / 2;
    const yy = yOf(d);
    const h = bot - yy;
    return (
      <rect
        key={i} x={x.toFixed(1)} y={yy.toFixed(1)} width={bw.toFixed(1)}
        height={h.toFixed(1)} rx={Math.min(bw / 2, h / 2).toFixed(1)}
        fill={STAGE_HEX[bandStage(d)]}
        // Only the deepest band blooms — it is the peak of the night and the
        // glow is what made it read as one on near-black. Dark-only: the light
        // flattening layer switches every inline drop-shadow off.
        style={bandStage(d) === "deep" ? { filter: `drop-shadow(0 0 1.5px ${STAGE_HEX.deep})` } : undefined}
      />
    );
  });

  // Three faint horizontal gridlines for structure.
  const gridlines = [0.25, 0.5, 0.75].map((f, i) => (
    <line key={`g${i}`} x1={0} x2={W} y1={top + plotH * f} y2={top + plotH * f} stroke="var(--nura-hairline)" strokeWidth={1} />
  ));

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
        {gridlines}
        {bars}
      </svg>

      {/* X-axis */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: 5, fontFamily: MONO, fontSize: 10, color: "var(--nura-text-tertiary)" }}>
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
            <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: "var(--nura-text-primary)" }}>{s.duration}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
