"use client";

import { useId, useMemo, useState } from "react";
import { smooth, hexA } from "@/components/dashboard/cardChartHelpers";
import { useThemeTokens } from "@/lib/themeTokens";

// ─────────────────────────────────────────────────────────────────────────────
// MetricLineChart — the single-series line/area treatment for metric cards.
//
// This is the shared chart, not a Respiratory Rate chart that happens to be
// reusable: nothing in here knows what it is plotting. Give it numbers, a unit
// and (optionally) a baseline and it draws the same thing every time, which is
// the whole point — twelve cards drawing one series should not be twelve
// different charts.
//
// The treatment:
//   · one sage series, from --nura-series, so the card makes no colour choice
//   · a crisp 2px stroke — no gradient along the line, no filter, no glow
//   · a flat area fade underneath at 12% → 2%, which reads as ground rather
//     than as bloom
//   · a dashed, muted baseline with a small label, recessive by construction
//   · hairline gridlines and mono tick labels that stay out of the way
//   · a filled marker on the latest point, ringed in the card surface so it
//     separates from the line it sits on
//   · a hover crosshair and tooltip
//
// Every number rendered here is mono. Ticks, the tooltip readout and the
// baseline value are all data, and data lines up.
// ─────────────────────────────────────────────────────────────────────────────

const SERIES_TOKENS = { series: ["--nura-series", "#9bb0a5"] } as const;

const MONO = "'JetBrains Mono', monospace";
const SANS = "var(--font-inter), system-ui, sans-serif";

// viewBox units. The svg is width:100% / height:auto, so these are a ratio,
// not pixels — the right gutter holds the y labels, the foot holds the x ones.
const W = 340;
const PAD_L = 4, PAD_R = 30, PAD_T = 16, PAD_B = 22;

/**
 * A domain and gridlines a human would have chosen: a step from the 1 / 2 /
 * 2.5 / 5 family, with the domain snapped out to whole steps.
 *
 * The alternative — pad the extremes by a percentage — gives axes labelled
 * 13.7 / 14.2 / 14.7, which nobody reads as a scale. This also decides how
 * many decimals the labels need, because that is a property of the step and
 * not of the value: a 0.5 step wants "14.0", a 5 step wants "15".
 */
function niceScale(min: number, max: number, target = 3) {
  const raw = (max - min || 1) / Math.max(1, target - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Half-step slack on the loop bound: lo/hi come out of floating-point
  // division, so `v <= hi` alone drops the top gridline about as often as not.
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { lo, hi, ticks, decimals: Math.max(0, -Math.floor(Math.log10(step))) };
}

export interface MetricLineChartProps {
  /** Series values, oldest → newest. */
  data: number[];
  /** Unit shown in the tooltip, e.g. "br/min". */
  unit?: string;
  /** Dashed reference line (personal baseline, average, goal), or null. */
  baseline?: number | null;
  /** Word after the baseline value in its label. */
  baselineLabel?: string;
  /** Y domain. Omit either and it is derived from the data (and the baseline). */
  lo?: number;
  hi?: number;
  /** Y gridline values. Omitted → three evenly spaced steps across the domain. */
  ticks?: number[];
  /** Labels along the x axis, evenly spaced. */
  xLabels?: string[];
  /** One label per point, for the tooltip. Falls back to the point index. */
  pointLabels?: string[];
  /** Value formatter for the tooltip and the baseline label. */
  format?: (v: number) => string;
  /** Axis-label formatter. Defaults to whatever precision the tick step needs. */
  tickFormat?: (v: number) => string;
  /** viewBox height. Wider cards want a shorter chart; leave it alone mostly. */
  height?: number;
  /** Sentence describing the series for screen readers. */
  ariaLabel?: string;
}

export default function MetricLineChart({
  data,
  unit,
  baseline = null,
  baselineLabel = "baseline",
  lo,
  hi,
  ticks,
  xLabels,
  pointLabels,
  format = (v) => String(v),
  tickFormat,
  height = 150,
  ariaLabel,
}: MetricLineChartProps) {
  const { series: SERIES } = useThemeTokens(SERIES_TOKENS);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const H = height;
  const n = data.length;

  // Domain and gridlines. A derived scale always contains the baseline — a
  // reference line drawn outside the plot is worse than no reference line.
  const { yLo, yHi, gridTicks, fmtTick } = useMemo(() => {
    const vals = baseline == null ? data : [...data, baseline];
    const nice = niceScale(Math.min(...vals), Math.max(...vals));
    const dp = tickFormat ?? ((v: number) => v.toFixed(nice.decimals));
    return {
      yLo: lo ?? nice.lo,
      yHi: hi ?? nice.hi,
      gridTicks: ticks ?? nice.ticks,
      fmtTick: dp,
    };
  }, [data, baseline, lo, hi, ticks, tickFormat]);

  const xAt = (i: number) => PAD_L + (i / Math.max(1, n - 1)) * (W - PAD_L - PAD_R);
  const yAt = (v: number) => PAD_T + (1 - (v - yLo) / (yHi - yLo || 1)) * (H - PAD_T - PAD_B);

  const pts: [number, number][] = data.map((v, i) => [xAt(i), yAt(v)]);
  const linePath = smooth(pts);
  const floorY = H - PAD_B;
  const areaPath = `${linePath} L${pts[n - 1][0].toFixed(1)},${floorY} L${pts[0][0].toFixed(1)},${floorY} Z`;

  const lastX = pts[n - 1][0], lastY = pts[n - 1][1];
  const active = hover == null ? null : { i: hover, x: pts[hover][0], y: pts[hover][1], v: data[hover] };

  // The baseline label sits above its line, unless that would push it into the
  // top padding, in which case it hangs below instead.
  const baseY = baseline == null ? 0 : yAt(baseline);
  const baseLabelAbove = baseY - PAD_T > 12;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width) return;
    const vx = ((e.clientX - r.left) / r.width) * W;
    const t = (vx - PAD_L) / (W - PAD_L - PAD_R);
    setHover(Math.max(0, Math.min(n - 1, Math.round(t * (n - 1)))));
  };

  // Tooltip is HTML, not SVG — it needs the app's fonts, the card's border
  // token and a real shadow. The svg keeps its aspect ratio, so a viewBox
  // coordinate maps to a percentage of the wrapper directly.
  const tipLeft = active ? Math.min(88, Math.max(12, (active.x / W) * 100)) : 0;
  const tipTop = active ? (active.y / H) * 100 : 0;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", width: "100%", height: "auto", touchAction: "pan-y" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {/* Two stops, both low. An area fill is ground for the line to sit
              on; the moment it is bright enough to read as its own shape it
              is competing with the thing it is supposed to support. */}
          <linearGradient id={`fill${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hexA(SERIES, 0.12)} />
            <stop offset="1" stopColor={hexA(SERIES, 0.02)} />
          </linearGradient>
        </defs>

        {/* Gridlines + right-gutter tick labels */}
        {gridTicks.map((t, i) => {
          const y = yAt(t);
          return (
            <g key={`${t}-${i}`}>
              <line
                x1={PAD_L} y1={y.toFixed(1)} x2={W - PAD_R} y2={y.toFixed(1)}
                strokeWidth={1} style={{ stroke: "var(--nura-hairline)" }}
              />
              <text
                x={W - PAD_R + 6} y={(y + 3).toFixed(1)}
                fontFamily={MONO} fontSize={8.5}
                style={{ fill: "var(--nura-text-tertiary)" }}
              >
                {fmtTick(t)}
              </text>
            </g>
          );
        })}

        {/* Baseline — dashed, neutral, and deliberately not the series colour.
            It is a reference, not a second series; tinting it sage would make
            the eye read two lines of equal standing. */}
        {baseline != null && (
          <>
            <line
              x1={PAD_L} y1={baseY.toFixed(1)} x2={W - PAD_R} y2={baseY.toFixed(1)}
              strokeWidth={1} strokeDasharray="3 4" opacity={0.55}
              style={{ stroke: "var(--nura-text-tertiary)" }}
            />
            {/* The series can run anywhere, including straight through this
                label, so it carries a halo in the card colour: stroke first,
                fill on top. Cheaper and sharper than a backing rect, and it
                needs no knowledge of the text's measured width. */}
            <text
              x={PAD_L + 2} y={(baseY + (baseLabelAbove ? -5 : 11)).toFixed(1)}
              fontSize={8.5}
              style={{
                fill: "var(--nura-text-tertiary)",
                paintOrder: "stroke",
                stroke: "var(--nura-card)",
                strokeWidth: 3,
                strokeLinejoin: "round",
              }}
            >
              <tspan fontFamily={MONO}>{format(baseline)}</tspan>
              <tspan fontFamily={SANS} dx="3.5">{baselineLabel}</tspan>
            </text>
          </>
        )}

        <path d={areaPath} fill={`url(#fill${uid})`} />
        <path
          d={linePath} fill="none" stroke={SERIES}
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />

        {/* Hover crosshair */}
        {active && (
          <>
            <line
              x1={active.x.toFixed(1)} y1={PAD_T} x2={active.x.toFixed(1)} y2={floorY}
              strokeWidth={1} style={{ stroke: "var(--nura-border-strong)" }}
            />
            <circle
              cx={active.x.toFixed(1)} cy={active.y.toFixed(1)} r={4}
              fill={SERIES} strokeWidth={2} style={{ stroke: "var(--nura-card)" }}
            />
          </>
        )}

        {/* Latest point. Ringed in the card surface so it reads as a marker
            sitting on the line rather than a bulge in it. */}
        <circle
          cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r={4}
          fill={SERIES} strokeWidth={2} style={{ stroke: "var(--nura-card)" }}
        />

        {/* X labels */}
        {xLabels?.map((l, k) => {
          const x = PAD_L + (k / Math.max(1, xLabels.length - 1)) * (W - PAD_L - PAD_R);
          return (
            <text
              key={k} x={x.toFixed(1)} y={H - 5}
              fontFamily={MONO} fontSize={8.5}
              style={{ fill: "var(--nura-text-tertiary)" }}
              textAnchor={k === 0 ? "start" : k === xLabels.length - 1 ? "end" : "middle"}
            >
              {l}
            </text>
          );
        })}
      </svg>

      {active && (
        <div
          aria-hidden
          style={{
            position: "absolute", left: `${tipLeft}%`, top: `${tipTop}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
            pointerEvents: "none", whiteSpace: "nowrap",
            background: "var(--nura-card)", border: "1px solid var(--nura-border-strong)",
            borderRadius: 8, padding: "5px 9px", boxShadow: "var(--nura-card-shadow-soft)",
            display: "flex", alignItems: "baseline", gap: 7,
          }}
        >
          <span style={{ fontFamily: SANS, fontSize: 10, color: "var(--nura-text-tertiary)" }}>
            {pointLabels?.[active.i] ?? `#${active.i + 1}`}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: "var(--nura-text-primary)" }}>
            {format(active.v)}
          </span>
          {unit && (
            <span style={{ fontFamily: SANS, fontSize: 10, color: "var(--nura-text-secondary)" }}>{unit}</span>
          )}
        </div>
      )}
    </div>
  );
}
