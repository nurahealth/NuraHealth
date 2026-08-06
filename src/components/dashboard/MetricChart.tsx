"use client";

import { useMemo, useState } from "react";
import type { MetricChartData } from "@/lib/dashboardData";
import type { MetricPaint } from "@/lib/metricColors";
import {
  ENTER_CLASS, MONO, PAD, STROKE, TYPE,
  ChartTooltip, XAxis, YAxis,
  fitTicks, smoothPath, useMeasuredWidth,
  bucketAverage, roundedTopBar, thinLabels,
} from "@/components/dashboard/chartTheme";
import { useIsLightForm } from "@/lib/themeTokens";

// ─────────────────────────────────────────────────────────────────────────────
// MetricChart — the shared intraday bar treatment. Most metric cards render it.
//
// Thin rounded bars across the day rising from a per-metric floor, a dashed
// average curve over them, a right-gutter axis, a shaded overnight window and a
// mono x axis. Same geometry, type scale and stroke weights as
// MetricLineChart, because they are two views of one system.
//
// WHAT CHANGED, AND WHY
//
// 1. ONE COLOUR PER CHART. Each bar used to be interpolated along a per-metric
//    three-stop HUE ramp by its normalised value: Heart Rate ran teal → amber →
//    coral, Exercise ran amber → sage → green. That is the same
//    "one metric, several colours" problem the colour map exists to fix, just
//    inside a single chart — and worse, a hue ramp encodes good/bad, which is
//    the status chip's job, not the chart's.
//
//    Bars are now the metric's own colour at full strength, and HEIGHT carries
//    the value. That is not only simpler, it is the only version that holds the
//    contrast floor: grading the fill by alpha needs 0.80 before the palest
//    light-mode metric clears 3:1 on white, and a 0.80-1.0 range is a
//    difference nobody can see. Height was always the real encoding; the colour
//    grading was decorative double-encoding.
//
// 2. GLOW IS DARK-ONLY. The bar bloom and the lit peak label are the brand's
//    original dark treatment and they are back: on near-black a bloom reads as
//    a mark emitting light, which is the whole look. It is authored inline and
//    NOT branched on theme, because the light flattening layer in globals.css
//    already switches every inline drop-shadow off — so light gets the flat
//    marks it needs without this file knowing which theme it is in.
//    (The Steps-only "highTech" lit-glass gradients and the blurred hotspot
//    stay retired: those were a second, parallel chart style, not a glow.)
//
// 3. The axis moved into the SVG and into the right gutter, so the labels
//    cannot sit on the gridlines and the x row lines up with every other chart.
// ─────────────────────────────────────────────────────────────────────────────

/** Fraction of the day the shaded overnight window covers (midnight → ~6.5a). */
const NIGHT_FRACTION = 0.27;

/** Clock label for sample `i` of `n` across a 24h day, e.g. "3pm". */
function clockAt(i: number, n: number): string {
  const h = Math.round((i / Math.max(1, n - 1)) * 24) % 24;
  const ap = h < 12 ? "am" : "pm";
  return `${h % 12 === 0 ? 12 : h % 12}${ap}`;
}

export default function MetricChart({
  data,
  color,
  height = 132,
  unit,
  showPeak = false,
}: {
  data: MetricChartData;
  /** The metric's colour, from `useMetricPaint(id)`. */
  color: MetricPaint;
  height?: number;
  /** Unit for the hover tooltip. */
  unit?: string;
  /** Draw a "value · PEAK · time" readout over the tallest bar (Steps opts in). */
  showPeak?: boolean;
}) {
  const { readings: rawReadings, baseline, floor, ceiling, gridlines } = data;
  const { ref, width: W } = useMeasuredWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const lightForm = useIsLightForm();

  // Light draws a different chart, not a recoloured one: the same day averaged
  // down to at most 18 buckets. A 96-sample intraday series at 1px per bar is
  // texture on white; 18 bars at ~10px each are readings you can point at.
  const readings = useMemo(
    () => (lightForm ? bucketAverage(rawReadings) : rawReadings),
    [lightForm, rawReadings],
  );

  const H = height;
  const plotL = PAD.left;
  const plotR = Math.max(plotL + 1, W - PAD.right);
  const plotT = PAD.top;
  const plotB = H - PAD.bottom;
  const plotH = Math.max(1, plotB - plotT);

  const span = (ceiling - floor) || 1;
  const norm = (v: number) => Math.max(0, Math.min(1, (v - floor) / span));
  const yOf = (v: number) => plotB - norm(v) * plotH;

  const ticks = useMemo(
    () => {
      const t = fitTicks(gridlines, plotH, floor, ceiling);
      // Three gridlines is enough to read a value off a bar chart; the fourth
      // and fifth are furniture. Light only — dark's axis is unchanged.
      return lightForm ? thinLabels(t, 3) : t;
    },
    [gridlines, plotH, floor, ceiling, lightForm],
  );

  // Reserve the full height while measuring so the card cannot reflow.
  if (!(W > 0) || !readings.length) return <div ref={ref} style={{ width: "100%", height: H }} />;

  const n = readings.length;
  const slot = (plotR - plotL) / n;
  // Dark keeps its hairline bars. Light takes most of the slot and never goes
  // below 6px, so a bar is a shape rather than a stroke; the 3px it gives back
  // is the gap, which is what makes the count legible.
  const bw = lightForm
    ? Math.max(6, slot - 3)
    : Math.min(slot * 0.62, 5);

  // Dashed average curve from the coarse baseline series.
  const m = baseline.length;
  const curve = m > 1
    ? smoothPath(baseline.map((v, k) => [plotL + (k / (m - 1)) * (plotR - plotL), yOf(v)]))
    : "";

  let peakIdx = 0;
  readings.forEach((v, i) => { if (v > readings[peakIdx]) peakIdx = i; });

  const barX = (i: number) => plotL + i * slot + (slot - bw) / 2;
  const active = hover == null ? null : {
    i: hover,
    x: barX(hover) + bw / 2,
    y: yOf(readings[hover]),
    v: readings[hover],
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const i = Math.floor(((e.clientX - r.left) - plotL) / Math.max(0.001, slot));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg
        width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        className={ENTER_CLASS}
        style={{ display: "block", touchAction: "pan-y" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Overnight window. Neutral ink, not the metric colour: it annotates
            WHEN, so tinting it with the series would read as more data. */}
        <rect
          x={plotL} y={plotT} width={(plotR - plotL) * NIGHT_FRACTION} height={plotH}
          rx={4} fill={`rgba(var(--nura-fg-rgb),0.035)`}
        />

        <YAxis
          ticks={ticks} yAt={yOf} plotLeft={plotL} plotRight={plotR}
          format={(v) => String(v)}
        />

        {/* Bars — one colour, height carries the value */}
        {readings.map((v, i) => {
          const h = Math.max(norm(v) * plotH, 2);
          // Bloom scales with the bar, so a tall reading glows harder — the
          // original dark treatment. Neutralised wholesale in light.
          const t = norm(v);
          const glowR = (2 + t * 5).toFixed(1);
          const glowA = (0.3 + t * 0.45).toFixed(2);
          const dim = hover != null && hover !== i;
          return lightForm ? (
            <path
              key={i}
              d={roundedTopBar(barX(i), plotB - h, bw, h, 4)}
              fill={color.hex}
              opacity={dim ? 0.45 : 1}
            />
          ) : (
            <rect
              key={i}
              x={barX(i).toFixed(2)} y={(plotB - h).toFixed(2)}
              width={bw.toFixed(2)} height={h.toFixed(2)}
              rx={Math.min(bw / 2, h / 2).toFixed(2)}
              fill={color.hex}
              opacity={dim ? 0.55 : 1}
              style={{ filter: `drop-shadow(0 0 ${glowR}px rgba(${color.rgb},${glowA}))` }}
            />
          );
        })}

        {/* Dashed average curve. Neutral for the same reason as a baseline: it
            is a reference, not a second series. */}
        {/* One data layer in light. The dashed mean over 18 bars is a second
            series competing with the first, and the bars already carry the
            shape it was tracing. */}
        {curve && !lightForm && (
          <path
            d={curve} fill="none" stroke="var(--nura-text-tertiary)"
            strokeWidth={STROKE.baseline} strokeDasharray="4 5"
            strokeLinecap="round" opacity={0.55}
          />
        )}

        {showPeak && !lightForm && (
          <text
            x={Math.max(46, Math.min(plotR - 46, barX(peakIdx) + bw / 2)).toFixed(2)}
            y={Math.max(plotT - 4, yOf(readings[peakIdx]) - 9).toFixed(2)}
            textAnchor="middle" fontFamily={MONO} fontSize={TYPE.tick}
            style={{
              fill: "var(--nura-text-secondary)",
              paintOrder: "stroke", stroke: "var(--nura-card)",
              strokeWidth: 3.5, strokeLinejoin: "round",
              filter: `drop-shadow(0 0 5px rgba(${color.rgb},0.6))`,
            }}
          >
            {`${Math.round(readings[peakIdx])} · PEAK · ${clockAt(peakIdx, n)}`}
          </text>
        )}

        {active && (
          <line
            x1={active.x.toFixed(2)} y1={plotT} x2={active.x.toFixed(2)} y2={plotB}
            strokeWidth={STROKE.crosshair} stroke="var(--nura-border-strong)"
          />
        )}

        <XAxis
          labels={lightForm ? ["12a", "12p", "now"] : ["12a", "6a", "12p", "6p", "now"]}
          plotLeft={plotL} plotRight={plotR} y={H - 6}
        />
      </svg>

      {active && (
        <ChartTooltip
          leftPct={Math.min(92, Math.max(8, (active.x / W) * 100))}
          topPx={active.y}
          flip={active.y - plotT < 34}
          label={clockAt(active.i, n)}
          value={active.v >= 100 ? String(Math.round(active.v)) : String(Number(active.v.toFixed(1)))}
          unit={unit}
        />
      )}
    </div>
  );
}
