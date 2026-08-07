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
   SHARED BAR GEOMETRY

   Both themes draw the same bars. `roundedTopBar` exists because `rx` on a
   <rect> rounds all four corners, which on a bar sitting at the axis leaves
   two notches where it meets the baseline.
   ─────────────────────────────────────────────────────────────────────── */

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


/* ───────────────────────────────────────────────────────────────────────────
   THE BAR TREATMENT — light rendering only, identical geometry to dark.

   Three tones and a lit top edge. The tone is chosen from the DATA, not from
   the index alone, so the same rule reads correctly on a flat day and a spiky
   one: the top ~18% of readings and the newest one or two are the emphasis
   tone, the bottom ~18% recede, everything between is body.

   The edge is a real 1.4px stroke inset at the top of the bar rather than a
   gradient stop, because a stop is a fraction of bar height — on a short bar
   it vanishes and on a tall one it becomes a band. A stroke is 1.4px on every
   bar, which is what makes a column of them look machined.
   ─────────────────────────────────────────────────────────────────────── */

export type SageTone = "deep" | "mid" | "faint";

/** The gradient id for `tone` within a chart instance. Pair with SageBarDefs. */
export function sageFill(uid: string, tone: SageTone): string {
  return `url(#${uid}-sage-${tone})`;
}

/**
 * Tone per bar. `values` is the whole series so the thresholds are relative to
 * what is actually on screen; `i` and `n` bring in recency.
 */
export function barTones(values: number[]): SageTone[] {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))];
  const hi = at(0.82);
  const lo = at(0.18);
  const n = values.length;
  return values.map((v, i) => {
    if (i >= n - 2 || v >= hi) return "deep";
    if (v <= lo) return "faint";
    return "mid";
  });
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
          <stop offset="0%" style={{ stopColor: `var(--nura-sage-${tone}-top)` }} />
          <stop offset="100%" style={{ stopColor: `var(--nura-sage-${tone}-base)` }} />
        </linearGradient>
      ))}
    </>
  );
}

/**
 * The lit inner top edge — a rounded stroke just below the bar's cap.
 *
 * Inset scales with the bar rather than sitting at a fixed distance: these
 * charts run from 4px intraday bars to 20px weekly ones, and a fixed inset
 * either vanishes on the narrow ones or floats in the middle of the wide ones.
 * At 28% per side the highlight is always visibly shorter than the bar and
 * always present, which is what makes a row of them look machined.
 *
 * Marked `data-decor` so the light/dark structural-parity check can tell a
 * rendering flourish from a data mark.
 */
export function BarTopEdge({ x, y, w, r = 2 }: { x: number; y: number; w: number; r?: number }) {
  if (w < 2.5) return null;
  const inset = Math.min(r * 0.6, w * 0.28);
  return (
    <line
      data-decor="bar-edge"
      x1={(x + inset).toFixed(2)} y1={(y + 1.1).toFixed(2)}
      x2={(x + w - inset).toFixed(2)} y2={(y + 1.1).toFixed(2)}
      stroke="var(--nura-bar-edge)" strokeWidth={1.4} strokeLinecap="round"
    />
  );
}

/** One step brighter, for hover. Faint has nowhere quieter to go, so it lifts. */
export function brighter(tone: SageTone): SageTone {
  return tone === "mid" ? "deep" : tone === "faint" ? "mid" : "deep";
}

/* ───────────────────────────────────────────────────────────────────────────
   THE LUMINOUS AURA — light rendering only, identical geometry to dark.

   A soft, blurred copy of a mark, drawn BENEATH it in the mark's own hue.

   WHY THIS AND NOT A GLOW. Dark's bloom is a drop-shadow ON the mark: on
   near-black that reads as a mark emitting light, and it is the brand. The
   same filter over white has nowhere to bloom to — it lands as grey haze
   around the mark and dirties it, which is why the light flattening layer in
   globals.css switches every inline drop-shadow off. The aura inverts the
   relationship: it sits UNDER the mark and slightly proud of it, so the mark
   reads as resting on light rather than leaking it. Nothing is drawn over the
   data, so nothing gets muddied.

   WHY ONLY ON EMPHASIS. The aura is a way of saying "this one". Applied to
   every mark it stops being a signal and becomes a texture — the chart looks
   soft-focus and the eye has nowhere to land. So it goes on goal-hit bars,
   peaks, the latest readings, ring fills and the latest point of a line, and
   on nothing else. Standard mid-tone bars and mist bars stay flat.

   The numbers are SVG attributes (stdDeviation, stroke-width) and an
   attribute will not resolve var(), so they live here as constants while the
   colour stays a token.
   ─────────────────────────────────────────────────────────────────────── */

export const AURA = {
  /** Gaussian σ under a bar. */
  blurBar: 3,
  /** Under a ring or arc — a bigger mark wants a wider falloff to read soft. */
  blurRing: 4.5,
  opacity: 0.4,
  /** Total px a bar's aura outgrows its bar by. */
  barGrow: 1.6,
  /** A ring aura's stroke, as a multiple of the arc's own width. */
  ringScale: 1.6,
  /** Radians trimmed off each end of a ring's inner-edge highlight. */
  edgeInset: 0.06,
  /** The inner-edge highlight's own stroke width. */
  edgeWidth: 1.2,
} as const;

/**
 * The two blur filters an aura needs. Drop once inside a chart's <defs>,
 * alongside SageBarDefs.
 *
 * The filter region is generous on purpose: the default -10%/+10% clips a
 * gaussian at roughly 1σ, which shows up as an aura with visibly straight
 * sides. These give the full ~3σ falloff room to land.
 */
export function AuraDefs({ uid }: { uid: string }) {
  return (
    <>
      <filter id={`${uid}-aura-bar`} x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation={AURA.blurBar} />
      </filter>
      <filter id={`${uid}-aura-ring`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation={AURA.blurRing} />
      </filter>
    </>
  );
}

/**
 * A bar's aura: the same rounded-top shape, grown by AURA.barGrow.
 *
 * It grows sideways symmetrically but UPWARD only — the extra height is added
 * at the cap and the foot stays pinned to the axis. Growing both ways would
 * push a soft sage edge below the baseline, which reads as the bar column
 * sitting in fog rather than standing on a line.
 *
 * Render these as their own pass BEFORE the bars, not interleaved: drawn per
 * bar, a wide aura laps over the neighbour that was drawn before it.
 */
export function BarAura({
  uid, x, y, w, h, r = 2,
}: { uid: string; x: number; y: number; w: number; h: number; r?: number }) {
  const g = AURA.barGrow;
  return (
    <path
      data-decor="bar-aura"
      d={roundedTopBar(x - g / 2, y - g, w + g, h + g, r + g / 2)}
      fill="var(--nura-chart-aura)"
      opacity={AURA.opacity}
      filter={`url(#${uid}-aura-bar)`}
    />
  );
}

/**
 * Paint props for a ring's aura — a wider, blurred copy of the arc stroke.
 * Spread onto a <circle> that already carries the arc's geometry (radius,
 * dash array, dash offset and its transition), so the aura sweeps with the
 * fill instead of appearing under a ring that is still filling.
 */
export function ringAuraPaint(uid: string, arcWidth: number) {
  return {
    stroke: "var(--nura-chart-aura)",
    strokeWidth: arcWidth * AURA.ringScale,
    opacity: AURA.opacity,
    filter: `url(#${uid}-aura-ring)`,
  } as const;
}

/* ── The light ring, assembled ───────────────────────────────────────────────
   Every ring in the app is hand-rolled around its own animation state, so
   these are the LAYERS rather than a whole ring: drop LightRingBase before the
   existing fill circle, point that fill at ringArcFill(uid), and drop
   LightRingEdge after it. Nine rings then share one treatment instead of nine
   near-copies drifting apart, and each keeps the sweep and count-up it had.

   Render order matters — the aura has to sit UNDER the track, or the blur
   washes over the very arc it is lighting.
   ────────────────────────────────────────────────────────────────────────── */

/** The gradient a light ring's fill should use. Pair with LightRingBase. */
export function ringArcFill(uid: string): string {
  return `url(#${uid}-arc)`;
}

export function LightRingBase({
  uid, cx, cy, r, stroke, arcLen, circ, offset, transition,
}: {
  uid: string; cx: number; cy: number; r: number; stroke: number;
  arcLen: number; circ: number; offset: number; transition?: string;
}) {
  return (
    <>
      <defs>
        <AuraDefs uid={uid} />
        {/* Deep at the start of the sweep, pale at its end, so a ring reads as
            one lit object rather than a stroke of flat colour. */}
        <linearGradient id={`${uid}-arc`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--nura-ring-arc-from)" />
          <stop offset="100%" stopColor="var(--nura-ring-arc-to)" />
        </linearGradient>
      </defs>

      {/* Aura — carries the fill's dash geometry and transition so it sweeps
          WITH the arc rather than sitting under a ring that has not filled. */}
      <circle
        data-decor="ring-aura"
        cx={cx} cy={cy} r={r} fill="none" strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
        {...ringAuraPaint(uid, stroke)}
        style={transition ? { transition } : undefined}
      />

      {/* Empty track */}
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke="var(--nura-chart-track)"
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circ}`}
      />
    </>
  );
}

/** The hairline highlight just inside a filled arc. Render AFTER the fill. */
export function LightRingEdge({
  cx, cy, r, stroke, sweep, from = 0,
}: { cx: number; cy: number; r: number; stroke: number; sweep: number; from?: number }) {
  const d = arcEdgePath(cx, cy, r - stroke / 2 + AURA.edgeWidth, from, sweep);
  if (!d) return null;
  return (
    <path
      data-decor="ring-edge" d={d} fill="none"
      stroke="var(--nura-ring-edge)" strokeWidth={AURA.edgeWidth} strokeLinecap="round"
    />
  );
}

/**
 * The inner-edge highlight path for a filled arc — a hairline just inside the
 * stroke, trimmed at both ends so it reads as light catching the ring rather
 * than as a second, thinner ring.
 *
 * Authored as an explicit path at the arc's resting angle rather than as a
 * dashed circle: a dash pattern is measured from the path origin, so insetting
 * the LEADING end of a partially-filled arc is not expressible in one — the
 * inset is swallowed by the dash offset as soon as the ring is less than full.
 *
 * `from` is where the sweep starts in the ring's own (pre-rotation) frame;
 * `sweep` is how far it runs, both in radians, clockwise.
 */
export function arcEdgePath(
  cx: number, cy: number, r: number, from: number, sweep: number,
): string {
  const a0 = from + AURA.edgeInset;
  const a1 = from + sweep - AURA.edgeInset;
  if (a1 <= a0) return "";
  return [
    `M ${(cx + r * Math.cos(a0)).toFixed(2)} ${(cy + r * Math.sin(a0)).toFixed(2)}`,
    `A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1`,
    `${(cx + r * Math.cos(a1)).toFixed(2)} ${(cy + r * Math.sin(a1)).toFixed(2)}`,
  ].join(" ");
}
