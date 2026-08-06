"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// The chart system — one set of constants and primitives that every chart in
// the app draws with, so twelve charts look like twelve views of one product
// instead of twelve charts.
//
// WHY THIS FILE MEASURES INSTEAD OF SCALING
//
// Every chart here used to be a fixed `viewBox` with `width: 100%`, which means
// the browser scales the whole drawing to fit the card. A 340-unit chart in a
// 558px desktop card is scaled 1.64x; the same chart in a 358px phone card is
// scaled 1.05x. So `fontSize={10}` rendered at 16.4px on desktop and 10.5px on
// mobile, a 2px stroke came out 3.3px vs 2.1px, and gridlines authored 31 units
// apart landed 51px apart on one screen and 32px on the other.
//
// That is the actual cause of the crowding and the inconsistent axis type — not
// the numbers anyone chose. You cannot specify readable typography in a
// coordinate space whose scale you don't control.
//
// So charts here measure their container and draw 1:1: one SVG user unit is one
// CSS pixel. `TYPE.tick = 10` is 10px everywhere, `STROKE.series = 2` is 2px
// everywhere, and MIN_GRID_GAP is a real pixel guarantee rather than a wish.
// The cost is a measure pass before first paint, which the entrance animation
// already covers.
// ─────────────────────────────────────────────────────────────────────────────

export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const SANS = "var(--font-inter), system-ui, sans-serif";

/** Stroke weights. Crisp and few — a chart with five line weights reads as noise. */
export const STROKE = {
  /** The data. 2px: visible at a glance, still fine enough to read as a line. */
  series: 2,
  /** A second/comparison series — same weight, distinguished by colour. */
  seriesAlt: 2,
  /** Gridlines and axis rules. Always hairline. */
  grid: 1,
  /** The dashed baseline reference. */
  baseline: 1,
  /** The ring around a data marker, in the card colour, so it clears the line. */
  markerRing: 2,
  /** Hover crosshair. */
  crosshair: 1,
} as const;

/**
 * Type scale, in real pixels. Axis labels are deliberately small and quiet —
 * they are a reference, not content — but never below 10px, which is where
 * tabular figures stop being reliably readable.
 */
export const TYPE = {
  tick: 10,
  axis: 10,
  baselineLabel: 10,
  tooltipLabel: 10.5,
  tooltipValue: 12.5,
  legend: 10.5,
} as const;

/**
 * Plot padding. `right` is the y-label gutter: labels live OUTSIDE the plot, to
 * the right of where the gridlines stop, which is what makes "labels never
 * crowd gridlines" structural rather than a matter of nudging.
 *
 * Putting the y gutter on the right also lets the plot start at x=0, so the
 * drawing uses the full card width. The old detail charts reserved 34 units on
 * the LEFT for labels and then stopped the plot 10 units short of the right
 * edge, which is where the dead margins came from.
 */
export const PAD = {
  top: 18,
  right: 38,
  bottom: 24,
  left: 2,
} as const;

/** Padding for a chart with no y-axis labels at all (bars, hypnograms). */
export const PAD_BARE = { top: 12, right: 2, bottom: 22, left: 2 } as const;

/**
 * Minimum vertical gap between gridlines, in real pixels. At 32px a 10px label
 * has more than twice its own height of clear space above and below; much under
 * that and the axis reads as a stack rather than a scale.
 */
export const MIN_GRID_GAP = 32;

/** Marker geometry. Diameter >= 8px, so a data point is a target, not a speck. */
export const MARKER = {
  /** Radius on a sparse chart — 4.5 gives a 9px dot. */
  r: 4.5,
  /** Radius of the latest-point marker on a dense curve. */
  rLatest: 4.5,
  /** At or below this many points a chart is "sparse" and shows every marker. */
  sparseMax: 12,
} as const;

/** Alphas. The band and area fills are ground for the line, never their own shape. */
export const ALPHA = {
  /** The baseline range band — ONE flat wash, per the brief's 6-8%. */
  band: 0.07,
  /** Its hairline edges, so the band has a defined top and bottom. */
  bandEdge: 0.2,
  /** Area fill under a line: a short fade, not a gradient feature. */
  areaTop: 0.13,
  areaBottom: 0.015,
  /** A dim/inactive mark of the metric's own colour. */
  dim: 0.35,
} as const;

/** Motion. Short and eased — a chart that animates for a second feels slow. */
export const MOTION = {
  enter: 280,
  update: 240,
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

// ── Scales ───────────────────────────────────────────────────────────────────

/**
 * A domain and gridlines a human would have chosen: a step from the
 * 1 / 2 / 2.5 / 5 family, with the domain snapped out to whole steps.
 *
 * The alternative — pad the extremes by a percentage — gives axes labelled
 * 13.7 / 14.2 / 14.7, which nobody reads as a scale. This also decides how many
 * decimals the labels need, because that is a property of the step and not of
 * the value: a 0.5 step wants "14.0", a 5 step wants "15".
 */
export function niceScale(min: number, max: number, target = 4) {
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

/**
 * Thin a tick list until adjacent lines are at least MIN_GRID_GAP apart.
 *
 * This is the guarantee that gridlines are never cramped. A short chart keeps
 * whatever fits — dropping every other line — instead of drawing five labels
 * into 90px and letting them collide. Endpoints are preserved, so the axis
 * still reads top-to-bottom.
 */
export function fitTicks(ticks: number[], plotH: number, lo: number, hi: number): number[] {
  if (ticks.length < 2) return ticks;
  const span = hi - lo || 1;
  const gap = (Math.abs(ticks[1] - ticks[0]) / span) * plotH;
  if (gap >= MIN_GRID_GAP) return ticks;

  const stride = Math.max(2, Math.ceil(MIN_GRID_GAP / Math.max(1, gap)));
  const kept = ticks.filter((_, i) => i % stride === 0);

  // Deliberately NOT force-appending the top tick. Doing that produced axes
  // like 13.0 / 14.0 / 15.0 / 15.5 — three even steps and then a half one —
  // and an axis whose steps are unequal is a worse lie than an axis that stops
  // one line short of the ceiling. Evenly spaced always wins; the top of the
  // plot simply carries a little headroom.
  return kept.length >= 2 ? kept : [ticks[0], ticks[ticks.length - 1]];
}

// ── Paths ────────────────────────────────────────────────────────────────────

/**
 * Catmull-Rom through the points, emitted as cubic beziers.
 *
 * `tension` 0 is a polyline; 1 is the standard Catmull-Rom curve. Continuous
 * signals (an overnight trace, a heart-rate day) get a curve because the real
 * quantity is continuous and the samples are arbitrary. Discrete readings (one
 * value per night) stay closer to straight, because a curve there invents
 * intermediate values that were never measured.
 */
export function smoothPath(pts: [number, number][], tension = 1): string {
  if (pts.length < 2) return pts.length ? `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}` : "";
  const t = Math.max(0, Math.min(1, tension)) / 6;
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(2)}` +
         ` ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(2)}` +
         ` ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/** Straight polyline path — for discrete series where a curve would lie. */
export function linePath(pts: [number, number][]): string {
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Measure the element's content width so the chart can draw at 1:1 px.
 *
 * Returns 0 until measured. Callers render a reserved-height placeholder at 0
 * and fade in once real — see `useChartEnter`, which is timed to cover exactly
 * this gap so the measure pass is never visible as a snap.
 */
export function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Round down: a fractional width would put the right-hand gridline end on a
    // half pixel and soften every vertical rule in the chart.
    const read = () => setW(Math.floor(el.getBoundingClientRect().width));
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width: w };
}

/**
 * Honour the OS reduced-motion setting for every chart animation.
 *
 * An external store rather than `useState` + `useEffect`, because the media
 * query IS external state: subscribing to it is the whole job, and reading it
 * into state on mount would be a synchronous setState in an effect (a cascading
 * render) for a value React can read directly.
 */
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia(REDUCE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCE_QUERY).matches,
    // SSR: assume motion is fine, matching the client's first paint.
    () => false,
  );
}

/**
 * The class that fades-and-rises a chart on first draw. Defined in globals.css
 * as a keyframe animation rather than a JS opacity transition: the JS version
 * had to flip state inside requestAnimationFrame, and rAF is throttled for
 * occluded iframes and background tabs, which left charts stuck at opacity 0
 * until the tab was focused. Reduced motion is handled in the stylesheet.
 */
export const ENTER_CLASS = "nura-chart-enter";

/**
 * Interpolate a series toward new values so switching metrics morphs the line
 * instead of cutting to it. Falls straight through under reduced motion, and
 * when the point count changes (there is no honest tween between a 7-point and
 * a 32-point series — that reads as a glitch, so it cuts).
 */
export function useTweenedSeries(data: number[], ms = MOTION.update): number[] {
  const reduced = usePrefersReducedMotion();
  // `null` means "not animating" — the hook then returns `data` directly. State
  // is only ever written from a rAF callback, never synchronously in the effect,
  // so adopting new data costs no extra render.
  const [tween, setTween] = useState<number[] | null>(null);
  const fromRef = useRef(data);
  const rafRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    // Nothing worth animating: adopt the new values as the next origin and let
    // render fall through to `data`. There is no honest tween between a 7-point
    // and a 32-point series, so a changed length cuts rather than morphs.
    if (reduced || from.length !== data.length || from.every((v, i) => v === data[i])) {
      fromRef.current = data;
      return;
    }

    let start = 0;
    const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / ms);
      const e = ease(p);
      const next = data.map((to, i) => from[i] + (to - from[i]) * e);
      // Track what is actually on screen, so a change that interrupts this
      // tween resumes from the current position instead of snapping back to
      // the original origin.
      fromRef.current = next;
      setTween(next);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = data;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data, reduced, ms]);

  // A tween from a previous series is stale once the point count changes.
  return tween && tween.length === data.length ? tween : data;
}

// ── Shared marks ─────────────────────────────────────────────────────────────

/**
 * The baseline range band: ONE flat wash of the metric colour with hairline
 * edges. Detail views used to stack a filled rect, a dashed average line and a
 * second tinted strip in the same space, which came out as a murky block with
 * no readable boundary — three marks competing to say one thing.
 */
export function BaselineBand({
  x, y, w, h, rgb,
}: { x: number; y: number; w: number; h: number; rgb: string }) {
  if (h <= 0) return null;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} fill={`rgba(${rgb},${ALPHA.band})`} rx={2} />
      <line x1={x} y1={y} x2={x + w} y2={y} strokeWidth={STROKE.grid} stroke={`rgba(${rgb},${ALPHA.bandEdge})`} />
      <line x1={x} y1={y + h} x2={x + w} y2={y + h} strokeWidth={STROKE.grid} stroke={`rgba(${rgb},${ALPHA.bandEdge})`} />
    </>
  );
}

/**
 * A dashed reference line with a small label.
 *
 * Deliberately NOT the series colour: a baseline is a reference, not a second
 * series, and tinting it with the metric makes the eye read two lines of equal
 * standing. The label carries a halo in the card colour (stroke first, fill on
 * top) because the series can run straight through it — cheaper and sharper
 * than a backing rect, and it needs no measured text width.
 */
export function BaselineLine({
  x1, x2, y, value, suffix,
}: { x1: number; x2: number; y: number; value?: string; suffix?: string }) {
  // Width of the knockout, estimated from the glyph count rather than measured.
  // A per-glyph halo (paint-order: stroke) leaves the inter-word space
  // uncovered, so a dash shows through the middle of the label; a solid plate
  // in the card colour does not. Mono figures run ~0.62em and the sans suffix
  // ~0.5em, which is close enough that any error is card-on-card and invisible.
  const fs = TYPE.baselineLabel;
  const plate = value
    ? 3 + value.length * fs * 0.62 + (suffix ? 4 + suffix.length * fs * 0.5 : 0)
    : 0;

  return (
    <>
      <line
        x1={x1} y1={y} x2={x2} y2={y}
        strokeWidth={STROKE.baseline} strokeDasharray="3 4" opacity={0.6}
        stroke="var(--nura-text-tertiary)"
      />
      {value && (
        // Centred ON its own line, not floating above it. Placed above, the
        // label had to live in the gap between two gridlines and collided with
        // whichever one was nearest. Sitting on the line it reads as an
        // interruption in the reference — which is what it is — and it cannot
        // crowd a gridline because it never enters the gap.
        <>
          <rect
            x={x1} y={y - fs / 2 - 2} width={plate} height={fs + 4}
            fill="var(--nura-card)"
          />
          <text
            x={x1 + 2} y={y + fs / 3} fontSize={fs}
            style={{ fill: "var(--nura-text-tertiary)" }}
          >
            <tspan fontFamily={MONO}>{value}</tspan>
            {suffix && <tspan fontFamily={SANS} dx="3.5">{suffix}</tspan>}
          </text>
        </>
      )}
    </>
  );
}

/** A data marker: filled in the series colour, ringed in the card surface. */
export function Marker({
  cx, cy, color, r = MARKER.r,
}: { cx: number; cy: number; color: string; r?: number }) {
  return (
    <circle
      cx={cx} cy={cy} r={r} fill={color}
      strokeWidth={STROKE.markerRing} stroke="var(--nura-card)"
    />
  );
}

/**
 * The tooltip pill. HTML rather than SVG so it gets the app's fonts, the card's
 * border token and a real shadow.
 *
 * Anchored ABOVE the crosshair and translated fully clear of it, so it never
 * covers the line it is describing, and clamped horizontally so it cannot hang
 * off the card edge. Near the top of the plot it flips below the point instead.
 */
export function ChartTooltip({
  leftPct, topPx, flip, label, value, unit,
}: {
  leftPct: number;
  topPx: number;
  flip: boolean;
  label?: string;
  value: string;
  unit?: string;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: `${leftPct}%`,
        top: topPx,
        transform: `translate(-50%, ${flip ? "16px" : "calc(-100% - 14px)"})`,
        pointerEvents: "none",
        whiteSpace: "nowrap",
        background: "var(--nura-card)",
        border: "1px solid var(--nura-border-strong)",
        borderRadius: 8,
        padding: "4px 9px",
        boxShadow: "var(--nura-card-shadow-soft)",
        display: "flex",
        alignItems: "baseline",
        gap: 6,
        zIndex: 2,
      }}
    >
      {label && (
        <span style={{ fontFamily: SANS, fontSize: TYPE.tooltipLabel, color: "var(--nura-text-tertiary)" }}>
          {label}
        </span>
      )}
      <span
        className="nura-datum-ink"
        style={{ fontFamily: MONO, fontSize: TYPE.tooltipValue, fontWeight: 600, color: "var(--nura-text-primary)" }}
      >
        {value}
      </span>
      {unit && (
        <span style={{ fontFamily: SANS, fontSize: TYPE.tooltipLabel, color: "var(--nura-text-secondary)" }}>
          {unit}
        </span>
      )}
    </div>
  );
}

export interface LegendItem {
  label: string;
  color: string;
  /** `band` draws a filled swatch, `line` a stroke, `dash` a dashed stroke. */
  kind?: "line" | "band" | "dash";
}

/**
 * The legend — rendered ONLY when a chart has two or more things to tell apart.
 * A one-series chart with a legend is a chart explaining its own title.
 */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  if (items.length < 2) return null;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flexWrap: "wrap", gap: "6px 16px", marginTop: 10,
      }}
    >
      {items.map((it) => (
        <span
          key={it.label}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: SANS, fontSize: TYPE.legend, color: "var(--nura-ink-muted)",
          }}
        >
          {it.kind === "band" ? (
            <i style={{ width: 14, height: 9, borderRadius: 2, background: it.color, flexShrink: 0 }} />
          ) : it.kind === "dash" ? (
            <i style={{
              width: 16, height: 0, flexShrink: 0,
              borderTop: `${STROKE.baseline * 1.5}px dashed ${it.color}`,
            }} />
          ) : (
            <i style={{ width: 16, height: STROKE.series, borderRadius: 2, background: it.color, flexShrink: 0 }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** Y tick labels in the right gutter + their gridlines. One call, one look. */
export function YAxis({
  ticks, yAt, plotLeft, plotRight, format,
}: {
  ticks: number[];
  yAt: (v: number) => number;
  plotLeft: number;
  plotRight: number;
  format: (v: number) => string;
}) {
  return (
    <>
      {ticks.map((t, i) => {
        const y = yAt(t);
        return (
          <g key={`${t}-${i}`}>
            <line
              x1={plotLeft} y1={y} x2={plotRight} y2={y}
              strokeWidth={STROKE.grid} stroke="var(--nura-hairline)"
            />
            <text
              // 8px clear of where the gridline stops — labels sit outside the
              // plot, so they cannot crowd the lines they annotate.
              x={plotRight + 8} y={y + TYPE.tick / 3}
              fontFamily={MONO} fontSize={TYPE.tick}
              style={{ fill: "var(--nura-text-tertiary)" }}
            >
              {format(t)}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** X labels along the foot, evenly spaced, ends anchored inward. */
export function XAxis({
  labels, plotLeft, plotRight, y,
}: { labels: string[]; plotLeft: number; plotRight: number; y: number }) {
  return (
    <>
      {labels.map((l, k) => {
        const x = plotLeft + (k / Math.max(1, labels.length - 1)) * (plotRight - plotLeft);
        return (
          <text
            key={`${l}-${k}`} x={x} y={y}
            fontFamily={MONO} fontSize={TYPE.axis}
            style={{ fill: "var(--nura-text-tertiary)" }}
            textAnchor={k === 0 ? "start" : k === labels.length - 1 ? "end" : "middle"}
          >
            {l}
          </text>
        );
      })}
    </>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   LIGHT FORM — fewer, wider, rounder marks.

   The dark charts draw every sample: 50–120 one-pixel bars, which on near-black
   reads as a lit waveform and is the look the brand shipped with. On white the
   same mark count reads as a barcode — dense enough that the eye resolves
   texture instead of values, and no palette fixes that. These helpers are how
   the light form gets to be a different chart rather than a recoloured one.
   ─────────────────────────────────────────────────────────────────────── */

/** Most bars a light-mode chart may draw. Above ~24 the gaps stop reading. */
export const LIGHT_MAX_BARS = 18;

/**
 * Down-sample a series to at most `max` buckets by averaging.
 *
 * Averaging rather than picking every Nth sample: a stride would let one spike
 * stand in for a whole bucket (or drop it entirely, depending on phase), which
 * changes what the chart claims. A mean of the bucket is a smaller, honest
 * statement — "this is roughly what that stretch looked like".
 *
 * Returns the original array when it is already short enough, so the caller can
 * use the result unconditionally.
 */
export function bucketAverage(values: number[], max = LIGHT_MAX_BARS): number[] {
  if (values.length <= max) return values;
  const out: number[] = [];
  for (let b = 0; b < max; b++) {
    const lo = Math.floor((b * values.length) / max);
    const hi = Math.max(lo + 1, Math.floor(((b + 1) * values.length) / max));
    let sum = 0;
    for (let i = lo; i < hi; i++) sum += values[i];
    out.push(sum / (hi - lo));
  }
  return out;
}

/**
 * A bar with rounded TOP corners and square feet.
 *
 * `rx` on a <rect> rounds all four, which on a bar sitting at the axis leaves
 * two little notches where it meets the baseline. The radius also clamps to
 * half the height so a short bar becomes a dome rather than an hourglass.
 */
export function roundedTopBar(x: number, y: number, w: number, h: number, r = 4): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M${(x).toFixed(2)},${(y + h).toFixed(2)}`,
    `V${(y + rr).toFixed(2)}`,
    `Q${(x).toFixed(2)},${(y).toFixed(2)} ${(x + rr).toFixed(2)},${(y).toFixed(2)}`,
    `H${(x + w - rr).toFixed(2)}`,
    `Q${(x + w).toFixed(2)},${(y).toFixed(2)} ${(x + w).toFixed(2)},${(y + rr).toFixed(2)}`,
    `V${(y + h).toFixed(2)}`,
    "Z",
  ].join(" ");
}

/** Keep at most `max` evenly-spaced entries of a label/tick list, ends first. */
export function thinLabels<T>(items: T[], max = 3): T[] {
  if (items.length <= max) return items;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(items[Math.round((i * (items.length - 1)) / (max - 1))]);
  return out;
}

/* ───────────────────────────────────────────────────────────────────────────
   THE BAR HIGHLIGHT — light mode only.

   A flat fill is honest and a little dead. Real objects are lit from above, so
   every bar and tick gets a vertical ramp from its tone at the base to ~12%
   brighter at the top, with a crisp brighter line along the top edge itself.
   No blur, no glow, no drop-shadow: the highlight is geometry, not atmosphere,
   which is exactly why it survives on a white card where a bloom would not.

   The bright edge is the first 3% of the gradient rather than a separate 1px
   element. A real 1px rect would need its own path per bar (and would round
   differently on a 4px-radius top); a hard stop at 3% renders as a crisp line
   that scales with the bar and costs nothing.
   ─────────────────────────────────────────────────────────────────────── */

export type SageTone = "deep" | "mid" | "faint";

/** The gradient id for `tone` within a chart instance. Pair with SageBarDefs. */
export function sageFill(uid: string, tone: SageTone): string {
  return `url(#${uid}-sage-${tone})`;
}

/**
 * The three bar gradients. Drop once inside a chart's <defs>, then fill marks
 * with sageFill(uid, tone). Colours come from tokens via `style` — an SVG
 * presentation ATTRIBUTE will not resolve var(), a CSS property will.
 */
export function SageBarDefs({ uid }: { uid: string }) {
  return (
    <>
      {(["deep", "mid", "faint"] as SageTone[]).map((tone) => (
        <linearGradient key={tone} id={`${uid}-sage-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: `var(--nura-sage-${tone}-edge)` }} />
          <stop offset="3%" style={{ stopColor: `var(--nura-sage-${tone}-top)` }} />
          <stop offset="100%" style={{ stopColor: `var(--nura-sage-${tone})` }} />
        </linearGradient>
      ))}
    </>
  );
}

/** One step brighter, for hover. Faint has nowhere quieter to go, so it lifts. */
export function brighter(tone: SageTone): SageTone {
  return tone === "mid" ? "deep" : tone === "faint" ? "mid" : "deep";
}
