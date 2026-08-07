"use client";

import { useId, useMemo, useState } from "react";
import type { MetricPaint } from "@/lib/metricColors";
import {
  ALPHA, AURA, ENTER_CLASS, MARKER, PAD, STROKE,
  AuraDefs, BaselineBand, BaselineLine, ChartLegend, ChartTooltip, Marker, XAxis, YAxis,
  fitTicks, linePath, niceScale, smoothPath,
  useMeasuredWidth, useTweenedSeries,
  type LegendItem,
} from "@/components/dashboard/chartTheme";
import { useIsLightForm } from "@/lib/themeTokens";

// ─────────────────────────────────────────────────────────────────────────────
// MetricLineChart — the single-series line/area treatment.
//
// This is THE shared chart, not a Respiratory Rate chart that happens to be
// reusable: nothing in here knows what it is plotting. Give it numbers, a unit,
// a metric colour and (optionally) a baseline or a baseline range, and it draws
// the same thing every time — which is the whole point, because twelve cards
// drawing one series should not be twelve different charts.
//
// The treatment:
//   · the metric's own colour, passed in from the fixed map in lib/metricColors,
//     so this chart never picks a colour and a metric never changes colour
//   · a crisp 2px stroke — no gradient along the line, no filter, no glow
//   · a short area fade underneath, which reads as ground rather than as bloom
//   · ONE flat baseline band with hairline edges (not stacked tinted strips)
//   · a dashed neutral baseline with a small labelled value
//   · gridlines thinned until they are at least MIN_GRID_GAP apart, with the
//     tick labels in a right gutter OUTSIDE the plot
//   · rounded markers on every point when the series is sparse; on a dense
//     curve only the latest point, so the line stays a line
//   · a hover crosshair and a compact tooltip pill above it
//   · a ~280ms entrance, and a value tween when the series changes
//
// It draws at 1:1 measured pixels — see the note at the top of chartTheme.tsx
// for why that matters more than any individual number in here.
// ─────────────────────────────────────────────────────────────────────────────

export interface MetricLineChartProps {
  /** Series values, oldest → newest. */
  data: number[];
  /** The metric's colour, from `useMetricPaint(id)`. */
  color: MetricPaint;
  /** Unit shown in the tooltip, e.g. "br/min". */
  unit?: string;
  /** Dashed reference line (personal baseline, average, goal), or null. */
  baseline?: number | null;
  /** Word after the baseline value in its label. */
  baselineLabel?: string;
  /** Shaded normal/baseline RANGE [lo, hi] — one flat band. */
  band?: [number, number] | null;
  /** Legend text for the band. Only shown when a legend is warranted. */
  bandLabel?: string;
  /** Legend text for the series. Supplying this with `band` shows a legend. */
  seriesLabel?: string;
  /** Y domain. Omit either and it is derived from the data, baseline and band. */
  lo?: number;
  hi?: number;
  /** Y gridline values. Omitted → a nice scale, thinned to fit. */
  ticks?: number[];
  /** Labels along the x axis, evenly spaced. */
  xLabels?: string[];
  /** One label per point, for the tooltip. Falls back to the point index. */
  pointLabels?: string[];
  /** Value formatter for the tooltip and the baseline label. */
  format?: (v: number) => string;
  /** Axis-label formatter. Defaults to whatever precision the tick step needs. */
  tickFormat?: (v: number) => string;
  /** Chart height in px. Detail screens want more room than cards. */
  height?: number;
  /**
   * Whether the underlying quantity is continuous. True (default) curves the
   * line; false keeps it straight, because a curve through one-reading-per-day
   * data invents values that were never measured.
   */
  continuous?: boolean;
  /** Sentence describing the series for screen readers. */
  ariaLabel?: string;
}

export default function MetricLineChart({
  data,
  color,
  unit,
  baseline = null,
  baselineLabel = "baseline",
  band = null,
  bandLabel = "baseline range",
  seriesLabel,
  lo,
  hi,
  ticks,
  xLabels,
  pointLabels,
  format = (v) => String(v),
  tickFormat,
  height = 168,
  continuous = true,
  ariaLabel,
}: MetricLineChartProps) {
  const lightForm = useIsLightForm();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const { ref, width: W } = useMeasuredWidth<HTMLDivElement>();
  const ready = W > 0 && data.length > 0;
  const series = useTweenedSeries(data);

  const H = height;
  const plotL = PAD.left;
  const plotR = Math.max(plotL + 1, W - PAD.right);
  const plotT = PAD.top;
  const plotB = H - PAD.bottom;
  const plotH = Math.max(1, plotB - plotT);
  const n = series.length;

  // Domain and gridlines. A derived scale always contains the baseline and the
  // band — a reference drawn outside the plot is worse than no reference.
  const { yLo, yHi, gridTicks, fmtTick } = useMemo(() => {
    const vals = [...data];
    if (baseline != null) vals.push(baseline);
    if (band) vals.push(band[0], band[1]);
    const nice = niceScale(Math.min(...vals), Math.max(...vals));
    let dLo = lo ?? nice.lo;
    let dHi = hi ?? nice.hi;
    let raw = ticks ?? nice.ticks;

    // Guarantee the band reads as a BAND. When the baseline range is the widest
    // thing on the chart, the nice scale snaps the domain to exactly the band's
    // own edges — respiratory's 13.5–15.0 range against a 13.5–15.0 domain — and
    // the "band" fills the entire plot as a flat wash that says nothing. One
    // step of headroom on whichever side it touches gives it edges to have.
    // Only when the domain is derived: an explicit lo/hi is the caller's call.
    if (band && ticks == null) {
      const step = nice.ticks.length > 1 ? nice.ticks[1] - nice.ticks[0] : 1;
      if (lo == null && band[0] <= dLo) { dLo -= step; raw = [dLo, ...raw]; }
      if (hi == null && band[1] >= dHi) { dHi += step; raw = [...raw, dHi]; }
    }

    return {
      yLo: dLo,
      yHi: dHi,
      gridTicks: fitTicks(raw, plotH, dLo, dHi),
      fmtTick: tickFormat ?? ((v: number) => v.toFixed(nice.decimals)),
    };
  }, [data, baseline, band, lo, hi, ticks, tickFormat, plotH]);

  // Nothing to lay out until the container has been measured. Reserving the
  // full height here keeps the card from reflowing when the chart appears.
  if (!ready) return <div ref={ref} style={{ width: "100%", height: H }} />;

  const xAt = (i: number) => plotL + (i / Math.max(1, n - 1)) * (plotR - plotL);
  const yAt = (v: number) => plotT + (1 - (v - yLo) / (yHi - yLo || 1)) * plotH;

  const pts: [number, number][] = series.map((v, i) => [xAt(i), yAt(v)]);
  const path = continuous ? smoothPath(pts) : linePath(pts);
  const area = `${path}L${pts[n - 1][0].toFixed(2)},${plotB}L${pts[0][0].toFixed(2)},${plotB}Z`;

  const last = pts[n - 1];
  const active = hover == null ? null : { i: hover, x: pts[hover][0], y: pts[hover][1], v: series[hover] };
  const sparse = n <= MARKER.sparseMax;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const t = ((e.clientX - r.left) - plotL) / Math.max(1, plotR - plotL);
    setHover(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
  };

  // A legend earns its place only when there are two things to tell apart.
  const legend: LegendItem[] = [];
  if (band && seriesLabel) {
    legend.push({ label: seriesLabel, color: color.hex, kind: "line" });
    legend.push({ label: bandLabel, color: color.alpha(0.22), kind: "band" });
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg
        width={W} height={H} viewBox={`0 0 ${W} ${H}`}
        role="img" aria-label={ariaLabel}
        className={ENTER_CLASS}
        style={{ display: "block", touchAction: "pan-y" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {lightForm && <AuraDefs uid={uid} />}
          {/* Two stops, both low. An area fill is ground for the line to sit on;
              the moment it is bright enough to read as its own shape it is
              competing with the thing it is supposed to support. */}
          {/* Light fades the body tone from 10% to nothing — a clean vertical
              wash under the line. It opts OUT of .nura-area-grad, whose job was
              to flatten dark's bloom-y multi-stop fill to one even band; this
              gradient is already flat and clean, and being flattened would kill
              the fade. Dark keeps the class and the behaviour. */}
          <linearGradient
            id={`fill${uid}`} x1="0" y1="0" x2="0" y2="1"
            className={lightForm ? undefined : "nura-area-grad"}
          >
            <stop
              offset="0"
              style={lightForm ? { stopColor: "var(--nura-sage-mid)" } : undefined}
              stopColor={lightForm ? undefined : color.hex}
              stopOpacity={lightForm ? 0.1 : ALPHA.areaTop}
            />
            <stop
              offset="1"
              style={lightForm ? { stopColor: "var(--nura-sage-mid)" } : undefined}
              stopColor={lightForm ? undefined : color.hex}
              stopOpacity={lightForm ? 0 : ALPHA.areaBottom} />
          </linearGradient>
        </defs>

        {/* The baseline RANGE, under everything — one flat wash, hairline edges */}
        {band && (
          <BaselineBand
            x={plotL} y={yAt(band[1])} w={plotR - plotL}
            h={yAt(band[0]) - yAt(band[1])} rgb={color.rgb}
          />
        )}

        <YAxis ticks={gridTicks} yAt={yAt} plotLeft={plotL} plotRight={plotR} format={fmtTick} />

        {baseline != null && (
          <BaselineLine
            x1={plotL} x2={plotR} y={yAt(baseline)}
            value={format(baseline)} suffix={baselineLabel}
          />
        )}

        <path d={area} fill={`url(#fill${uid})`} />
        <path
          d={path} fill="none" stroke={color.hex}
          // Same 2px weight as dark (STROKE.series); light only swaps the hue.
          // The stroke itself carries NO aura: a lit line is a line that has
          // been smudged, and the fade underneath is already its ground.
          style={lightForm ? { stroke: "var(--nura-chart-stroke)" } : undefined}
          strokeWidth={STROKE.series}
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* The latest point is the reading the card is quoting, so it is the one
            mark on this chart that earns an aura — a small one, under the dot,
            never under the line. */}
        {lightForm && (
          <circle
            data-decor="dot-aura"
            cx={last[0]} cy={last[1]} r={MARKER.rLatest + AURA.barGrow / 2}
            fill="var(--nura-chart-aura)" opacity={AURA.opacity}
            filter={`url(#${uid}-aura-bar)`}
          />
        )}

        {/* Markers. Every point when the series is sparse enough that each one
            is a real reading worth hitting; otherwise only the latest, so a
            dense curve stays a curve instead of a bead necklace. */}
        {sparse
          ? pts.map(([cx, cy], i) => <Marker key={i} cx={cx} cy={cy} color={lightForm ? "var(--nura-chart-stroke)" : color.hex} />)
          : <Marker cx={last[0]} cy={last[1]} color={lightForm ? "var(--nura-chart-stroke)" : color.hex} r={MARKER.rLatest} />}

        {/* Hover crosshair, drawn above the line but below the markers' ring */}
        {active && (
          <>
            <line
              x1={active.x} y1={plotT} x2={active.x} y2={plotB}
              strokeWidth={STROKE.crosshair} stroke="var(--nura-border-strong)"
            />
            <Marker cx={active.x} cy={active.y} color={lightForm ? "var(--nura-chart-stroke)" : color.hex} />
          </>
        )}

        {xLabels && <XAxis labels={xLabels} plotLeft={plotL} plotRight={plotR} y={H - 6} />}
      </svg>

      {active && (
        <ChartTooltip
          leftPct={Math.min(92, Math.max(8, (active.x / W) * 100))}
          topPx={active.y}
          // Near the ceiling there is no room above the point, so the pill goes
          // below rather than clipping out of the card.
          flip={active.y - plotT < 34}
          label={pointLabels?.[active.i]}
          value={format(active.v)}
          unit={unit}
        />
      )}

      <ChartLegend items={legend} />
    </div>
  );
}
