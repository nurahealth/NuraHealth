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
export const ACCENTS = {
  "--nura-sage": ["--nura-sage", "#9bb0a5"],
  "--nura-teal": ["--nura-teal", "#5dccae"],
  "--nura-sleep-deep": ["--nura-sleep-deep", "#5aa0e6"],
  "--nura-good": ["--nura-good", "#d3a253"],
  // Same gold as --nura-good, but registered as a viz accent so light
  // neutralises it with the rest of the categorical set instead of leaving it
  // wearing a status colour. See the note beside the token in globals.css.
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
  // Ordered sleep-stage ramp — light steps the sage ramp, dark keeps its hues.
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
