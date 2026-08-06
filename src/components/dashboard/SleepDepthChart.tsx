import { useId, type ReactElement } from "react";
import type { SleepDepthChartData } from "@/lib/dashboardData";
import { useThemeTokens, useIsLightForm } from "@/lib/themeTokens";
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
// The stage colours come from --nura-stage-*, and the two themes answer that
// differently on purpose: DARK is the brand's original four hues (gold awake,
// sage light, teal REM, blue deep), LIGHT is four monotone steps of the
// sage ramp, lightest awake to deepest deep. Depth is a single ordered
// quantity, so on white it reads as one ramp getting darker; on near-black the
// original palette is the look the brand shipped with. See globals.css.
//
// The per-bar vertical gradient and the glow on the deep bars are gone: a
// gradient that fades each bar to 18% at its base means the bottom of the chart
// is barely a mark at all, and the ordered ramp now carries the distinction
// that the lightening was there to prop up.

import { MONO, roundedTopBar, SageBarDefs, sageFill, BarTopEdge, type SageTone } from "@/components/dashboard/chartTheme";

const SANS = "var(--font-inter), system-ui, sans-serif";

// Stage palette — resolved to concrete hex for SVG fills. See lib/themeTokens.
const STAGE_TOKENS = {
  deep:  ["--nura-stage-deep", "#5aa0e6"],
  rem:   ["--nura-stage-rem", "#5dccae"],
  light: ["--nura-stage-light", "#9bb0a5"],
  awake: ["--nura-stage-awake", "#d3a253"],
} as const;

type Stage = keyof typeof STAGE_TOKENS;

/** Light draws the four stages from the three shared tones (see chartTheme). */
const LIGHT_STAGE_TONE: Record<Stage, SageTone> = {
  deep: "deep", rem: "mid", light: "mid", awake: "faint",
};

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
  const lightForm = useIsLightForm();
  const rawUid = useId();
  const uid = `sd-${rawUid.replace(/[^a-zA-Z0-9]/g, "")}`;
  // Same hypnogram in both themes — every sample, same width, same gridlines.
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
      lightForm ? (
        // Depth maps onto the three tones: deep sleep is the emphasis, light
        // and REM are body, awake is the quiet one. Same ordering the stage
        // ramp always had, expressed in the shared palette.
        <g key={i}>
          <path d={roundedTopBar(x, yy, bw, h, 2)} fill={sageFill(uid, LIGHT_STAGE_TONE[bandStage(d)])} />
          {LIGHT_STAGE_TONE[bandStage(d)] !== "faint" && <BarTopEdge x={x} y={yy} w={bw} r={2} />}
        </g>
      ) : (
        <rect
          key={i} x={x.toFixed(1)} y={yy.toFixed(1)} width={bw.toFixed(1)}
          height={h.toFixed(1)} rx={Math.min(bw / 2, h / 2).toFixed(1)}
          fill={STAGE_HEX[bandStage(d)]}
          // Only the deepest band blooms — it is the peak of the night and the
          // glow is what made it read as one on near-black. Dark-only: the light
          // flattening layer switches every inline drop-shadow off.
          style={bandStage(d) === "deep" ? { filter: `drop-shadow(0 0 1.5px ${STAGE_HEX.deep})` } : undefined}
        />
      )
    );
  });

  // Three faint horizontal gridlines for structure.
  const gridlines = [0.25, 0.5, 0.75].map((f, i) => (
    <line key={`g${i}`} x1={0} x2={W} y1={top + plotH * f} y2={top + plotH * f} stroke="var(--nura-hairline)" strokeWidth={1} />
  ));

  return (
    <div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
        {lightForm && <defs><SageBarDefs uid={uid} /></defs>}
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
