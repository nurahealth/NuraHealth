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
// These fallbacks are DARK values, and dark is the per-metric palette again —
// violet respiratory, coral heart, cyan HRV, ember movement. They briefly all
// pointed at steps of the sage ladder, which was correct only while dark had
// been collapsed onto that ladder too. Light is unaffected either way: the
// fallback is a first-paint value, and light resolves the live token the
// moment the stylesheet is up (see lib/themeTokens.ts).
export const ACCENTS = {
  "--nura-sage": ["--nura-sage", "#9bb0a5"],
  // Dial pillar — sage in dark, ink in light. See globals.css.
  "--nura-pillar-resilience": ["--nura-pillar-resilience", "#9bb0a5"],
  // The one-series card-chart colour. See the note beside it in globals.css.
  "--nura-series": ["--nura-series", "#9bb0a5"],
  "--nura-teal": ["--nura-teal", "#5dccae"],
  "--nura-sleep-deep": ["--nura-sleep-deep", "#5aa0e6"],
  "--nura-good": ["--nura-good", "#d3a253"],
  // Was the same gold as --nura-good, registered separately so light could
  // neutralise it without touching the status token. Post-collapse it is a
  // ladder step in both columns — the separation is what made that possible.
  "--nura-viz-gold": ["--nura-viz-gold", "#d3a253"],
  "--nura-amber": ["--nura-amber", "#e0a23e"],
  "--nura-alert": ["--nura-alert", "#e8745a"],
  "--nura-optimal": ["--nura-optimal", "#5fbf8c"],
  "--nura-rose": ["--nura-rose", "#f0a890"],
  "--nura-heart": ["--nura-heart", "#e8615c"],
  "--nura-mauve": ["--nura-mauve", "#a98fc4"],
  "--nura-violet": ["--nura-violet", "#b9a0e6"],
  "--nura-aqua": ["--nura-aqua", "#4fc4d6"],
  "--nura-ice": ["--nura-ice", "#aebfcf"],
  "--nura-ember": ["--nura-ember", "#e07a3c"],
  "--nura-gold-ring": ["--nura-gold-ring", "#e8c266"],
  "--nura-orange": ["--nura-orange", "#e3a263"],
  // The fixed metric map. Registered here so data-layer rows (the health
  // pillars, plan icons) can name a metric family directly instead of reaching
  // for whichever legacy hue happened to be nearest.
  "--nura-metric-resp": ["--nura-metric-resp", "#b9a0e6"],
  "--nura-metric-heart": ["--nura-metric-heart", "#e8615c"],
  "--nura-metric-rhr": ["--nura-metric-rhr", "#f0a890"],
  "--nura-metric-sleep": ["--nura-metric-sleep", "#5aa0e6"],
  "--nura-metric-hrv": ["--nura-metric-hrv", "#4fc4d6"],
  "--nura-metric-activity": ["--nura-metric-activity", "#e07a3c"],
  "--nura-metric-temp": ["--nura-metric-temp", "#5dccae"],
  "--nura-metric-oxygen": ["--nura-metric-oxygen", "#aebfcf"],
  // The shared ordered ramp — one hue, four steps, ascending in presence on
  // near-black. Sleep stages and the intensity zones both walk it.
  "--nura-step-1": ["--nura-step-1", "#6d8175"],
  "--nura-step-2": ["--nura-step-2", "#869a8e"],
  "--nura-step-3": ["--nura-step-3", "#9bb0a5"],
  "--nura-step-4": ["--nura-step-4", "#bacdc1"],
  "--nura-stage-awake": ["--nura-stage-awake", "#d3a253"],
  "--nura-stage-light": ["--nura-stage-light", "#9bb0a5"],
  "--nura-stage-rem": ["--nura-stage-rem", "#5dccae"],
  "--nura-stage-deep": ["--nura-stage-deep", "#5aa0e6"],
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
