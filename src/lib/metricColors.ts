"use client";

import { useThemeTokens } from "@/lib/themeTokens";

/**
 * The fixed metric → colour map.
 *
 * A metric's colour is a property of the metric. Before this file it was a
 * property of the call site: RespiratoryRateCard asked for `--nura-series` and
 * got sage, respiratory-rate/view.tsx asked for `--nura-violet` and got purple,
 * and the same number wore two colours depending on which screen you were on.
 *
 * Every surface that draws a metric — card, expanded view, tooltip, legend,
 * ring, progress row — resolves its colour through here. Nothing else decides.
 * Adding a metric means adding a row; it does not mean picking a colour at a
 * component.
 *
 * WHAT THE MAP MEANS NOW. It used to hand out a hue per physiological family
 * — violet respiratory, indigo sleep, coral heart, amber movement. It hands
 * out one sage step to all of them. The map stays because the INDIRECTION is
 * the valuable part: every metric mark in the app still passes through one
 * table, so a future second step is a one-line change here rather than a
 * hunt through forty components. See the ladder note in globals.css for why
 * the hues went.
 *
 * Keys are the metric `id` from lib/dashboardData, which is also the route
 * slug, so a detail screen can look itself up by its own path segment.
 *
 * Values are the DARK hex, per the hydration contract in lib/themeTokens: the
 * server and the first client render both emit these, then the light values
 * land once the stylesheet is live. Never put a light value here.
 */
const SAGE = "#9bb0a5";        // --nura-sage-500, the dark default mark
const SAGE_HI = "#bacdc1";     // --nura-sage-600, the brightest dark step

const MARK = {
  "respiratory-rate": ["--nura-metric-resp", SAGE],
  "heart-rate": ["--nura-metric-heart", SAGE],
  "resting-hr": ["--nura-metric-rhr", SAGE],
  "blood-pressure": ["--nura-metric-bp-sys", SAGE],
  sleep: ["--nura-metric-sleep", SAGE],
  hrv: ["--nura-metric-hrv", SAGE],
  steps: ["--nura-metric-activity", SAGE],
  exercise: ["--nura-metric-activity", SAGE],
  "active-energy": ["--nura-metric-activity", SAGE],
  distance: ["--nura-metric-activity", SAGE],
  movement: ["--nura-metric-activity", SAGE],
  "body-temperature": ["--nura-metric-temp", SAGE],
  "blood-oxygen": ["--nura-metric-oxygen", SAGE],
  "cardio-fitness": ["--nura-metric-oxygen", SAGE],
} as const;

/**
 * Secondary steps: gradient ends, the BP pair's second series, temp's warm
 * pole. `tempWarm` is deliberately the SAME step as `body-temperature` now —
 * the arc's two poles are one measurement, and which side of baseline it fell
 * on is a status reading, which the chip beside it makes.
 */
const AUX = {
  respHi: ["--nura-metric-resp-hi", SAGE_HI],
  rhrHi: ["--nura-metric-rhr-hi", SAGE_HI],
  bpDia: ["--nura-metric-bp-dia", "#d5e3da"],
  tempWarm: ["--nura-metric-temp-warm", SAGE],
  /** The fallback for a chart with no metric identity at all. */
  series: ["--nura-series", SAGE],
} as const;

export type MetricColorId = keyof typeof MARK;

/** True when `id` has a colour in the map — narrows a loose string. */
export function isMetricColorId(id: string): id is MetricColorId {
  return id in MARK;
}

/** The token name for a metric, for the rare place that wants raw `var()`. */
export function metricColorToken(id: string): string {
  return isMetricColorId(id) ? MARK[id][0] : AUX.series[0];
}

export interface MetricPaint {
  /** Concrete "#rrggbb" — for hex maths and SVG presentation attributes. */
  hex: string;
  /** `var(--token)` — for style props, which accept it directly. */
  varRef: string;
  /** "r,g,b" — for building `rgba(...)` washes at a chosen alpha. */
  rgb: string;
  /** The mark at `a` alpha, e.g. the 7% baseline band or the area fill. */
  alpha: (a: number) => string;
}

function paint(hex: string, token: string): MetricPaint {
  const s = hex.replace("#", "");
  // A token can resolve to a `var()` chain that has already been flattened to
  // hex by getComputedStyle, but a malformed/missing value would slice to NaN
  // and paint "rgba(NaN,…)" — which renders as nothing. Guard by falling back
  // to the literal, so a bad token degrades to a visible mark.
  const ok = /^[0-9a-f]{6}$/i.test(s);
  const rgb = ok
    ? `${parseInt(s.slice(0, 2), 16)},${parseInt(s.slice(2, 4), 16)},${parseInt(s.slice(4, 6), 16)}`
    : "155,176,165";
  return {
    hex,
    varRef: `var(${token})`,
    rgb,
    alpha: (a: number) => `rgba(${rgb},${a})`,
  };
}

type Paints = Record<MetricColorId, MetricPaint> & {
  respHi: MetricPaint;
  rhrHi: MetricPaint;
  bpDia: MetricPaint;
  tempWarm: MetricPaint;
  /** No-identity fallback (sage). */
  series: MetricPaint;
};

const SPEC = { ...MARK, ...AUX } as Record<string, readonly [string, string]>;

/**
 * Every metric colour, resolved for the active theme. Call once per component
 * and index by metric id — cheaper than one hook per metric, and it keeps the
 * token spec a module-level constant as `useThemeTokens` requires.
 */
export function useMetricPaints(): Paints {
  const resolved = useThemeTokens(SPEC);
  const out = {} as Record<string, MetricPaint>;
  for (const key in SPEC) out[key] = paint(resolved[key], SPEC[key][0]);
  return out as Paints;
}

/**
 * One metric's colour. `id` is a metric id / route slug; anything unrecognised
 * falls back to the neutral single-series sage rather than throwing, so a new
 * metric renders in a sane colour before it gets a row in the map.
 */
export function useMetricPaint(id: string): MetricPaint {
  const paints = useMetricPaints();
  return isMetricColorId(id) ? paints[id] : paints.series;
}
