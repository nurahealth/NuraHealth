"use client";

import { useThemeTokens } from "@/lib/themeTokens";

/**
 * The dashboard's accent registry.
 *
 * Metric and pillar accents used to live in the data layer as raw hex
 * ("#5dccae"), which meant the entire dashboard's data-viz ignored the theme —
 * dark-tuned saturations were painted onto white cards in light mode. Data now
 * carries a *token name*; components resolve it to a concrete value through
 * `useAccents()`.
 *
 * The value of each entry is the dark fallback, used during SSR and the first
 * client render. See lib/themeTokens.ts for the hydration contract.
 */
// The dark column of the sage ladder — see globals.css. Every data accent
// below now falls back to a step of it, because every data accent RESOLVES to
// a step of it. Only the status trio keeps a hue of its own.
const S400 = "#6d8175";
const S500 = "#9bb0a5";
const S600 = "#bacdc1";

export const ACCENTS = {
  "--nura-sage": ["--nura-sage", "#9bb0a5"],
  // The one-series card-chart colour. See the note beside it in globals.css.
  "--nura-series": ["--nura-series", S500],
  "--nura-teal": ["--nura-teal", S500],
  "--nura-sleep-deep": ["--nura-sleep-deep", S500],
  "--nura-good": ["--nura-good", "#d3a253"],
  // Was the same gold as --nura-good, registered separately so light could
  // neutralise it without touching the status token. Post-collapse it is a
  // ladder step in both columns — the separation is what made that possible.
  "--nura-viz-gold": ["--nura-viz-gold", S500],
  "--nura-amber": ["--nura-amber", S500],
  "--nura-alert": ["--nura-alert", "#e8745a"],
  "--nura-optimal": ["--nura-optimal", "#5fbf8c"],
  "--nura-rose": ["--nura-rose", S500],
  "--nura-heart": ["--nura-heart", S500],
  "--nura-mauve": ["--nura-mauve", S500],
  "--nura-violet": ["--nura-violet", S500],
  "--nura-aqua": ["--nura-aqua", S500],
  "--nura-ice": ["--nura-ice", S500],
  "--nura-ember": ["--nura-ember", S500],
  "--nura-gold-ring": ["--nura-gold-ring", S500],
  "--nura-orange": ["--nura-orange", S500],
  // The fixed metric map. Registered here so data-layer rows (the health
  // pillars, plan icons) can name a metric family directly instead of reaching
  // for whichever legacy hue happened to be nearest.
  "--nura-metric-resp": ["--nura-metric-resp", S500],
  "--nura-metric-heart": ["--nura-metric-heart", S500],
  "--nura-metric-rhr": ["--nura-metric-rhr", S500],
  "--nura-metric-sleep": ["--nura-metric-sleep", S500],
  "--nura-metric-hrv": ["--nura-metric-hrv", S500],
  "--nura-metric-activity": ["--nura-metric-activity", S500],
  "--nura-metric-temp": ["--nura-metric-temp", S500],
  "--nura-metric-oxygen": ["--nura-metric-oxygen", S500],
  // The shared ordered ramp — one hue, four steps, ascending in presence on
  // near-black. Sleep stages and the intensity zones both walk it.
  "--nura-step-1": ["--nura-step-1", S400],
  "--nura-step-2": ["--nura-step-2", "#869a8e"],
  "--nura-step-3": ["--nura-step-3", S500],
  "--nura-step-4": ["--nura-step-4", S600],
  "--nura-stage-awake": ["--nura-stage-awake", S400],
  "--nura-stage-light": ["--nura-stage-light", "#869a8e"],
  "--nura-stage-rem": ["--nura-stage-rem", S500],
  "--nura-stage-deep": ["--nura-stage-deep", S600],
} as const;

/** A `--nura-*` custom property usable as a data-viz accent. */
export type AccentToken = keyof typeof ACCENTS;

/**
 * Resolve every accent token to a concrete "#rrggbb" for the active theme.
 * Concrete values are required because accents are fed to hex maths (`hexA`,
 * gradient stop interpolation) and to SVG presentation attributes, neither of
 * which accept `var()`.
 */
export function useAccents(): Record<AccentToken, string> {
  return useThemeTokens(ACCENTS);
}
