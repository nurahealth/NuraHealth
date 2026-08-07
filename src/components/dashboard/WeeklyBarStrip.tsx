"use client";

import type { CSSProperties } from "react";
import { useIsLightForm } from "@/lib/themeTokens";
import { AURA } from "@/components/dashboard/chartTheme";

// Weekly bar strip with the selected day highlighted in white. Each bar shows
// its value above and a short label below. Reusable across metric detail pages.
//
// Callers pass DARK gradients — that is the theme these were authored for, and
// dark is frozen. Light ignores them and draws the shared two-state treatment
// instead: the selected day in the deep sage ramp with an aura beneath it, and
// every other day in sage mist. Left to the callers' gradients, light rendered
// an ink-to-orange selected bar next to pale sage ones, which is the rainbow
// the single sage ladder exists to stop.

const SANS = "var(--font-inter), system-ui, sans-serif";

/** The light bar treatment. Same geometry — only the paint differs. */
const LIGHT_SELECTED = "linear-gradient(180deg,var(--nura-sage-deep-top),var(--nura-sage-deep-base))";
const LIGHT_REST = "var(--nura-sage-mist)";
// The CSS equivalent of the SVG aura: a soft, slightly enlarged copy beneath
// the mark. Spread carries AURA.barGrow, blur is ~2σ of AURA.blurBar.
const LIGHT_AURA = `0 0 ${AURA.blurBar * 2}px ${AURA.barGrow / 2}px rgba(125, 150, 138, ${AURA.opacity})`;

export interface WeekDay {
  label: string;
  value: number;
  selected?: boolean;
}

export default function WeeklyBarStrip({
  days,
  max,
  height = 118,
  barGradient = "linear-gradient(180deg, rgba(var(--nura-teal-rgb),0.30), rgba(var(--nura-teal-mid-rgb),0.10))",
  selectedGradient = "linear-gradient(180deg,var(--nura-marker),var(--nura-score-to))",
  accent = "var(--nura-teal)",
  style,
}: {
  days: WeekDay[];
  /** Value mapped to full bar height; defaults to the largest value. */
  max?: number;
  height?: number;
  /** Gradient for non-selected bars. */
  barGradient?: string;
  /** Gradient for the selected (highlighted) bar. */
  selectedGradient?: string;
  /** Accent color for the selected day's label. */
  accent?: string;
  style?: CSSProperties;
}) {
  const top = max ?? Math.max(...days.map((d) => d.value), 1);
  const lightForm = useIsLightForm();

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 4, height, ...style }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <div
            // The class is dark's opt-in bloom, which the light flattening layer
            // switches off wholesale. Light needs its own box-shadow to survive,
            // so it opts out of the class rather than fighting an !important.
            className={lightForm ? undefined : "nura-glow"}
            style={{
              position: "relative", width: "100%", maxWidth: 26,
              height: `${Math.max(4, Math.round((d.value / top) * 100))}%`,
              borderRadius: 8,
              background: lightForm
                ? (d.selected ? LIGHT_SELECTED : LIGHT_REST)
                : (d.selected ? selectedGradient : barGradient),
              boxShadow: lightForm
                // Aura on the selected day only — it is the one mark this strip
                // is pointing at. The rest stay flat mist.
                ? (d.selected ? LIGHT_AURA : "none")
                : (d.selected ? "0 0 22px rgba(var(--nura-fg-rgb),0.30)" : "none"),
            }}
          >
            <span style={{
              position: "absolute", top: -16, left: 0, right: 0, textAlign: "center",
              fontFamily: SANS, fontSize: 10, fontWeight: 600,
              color: d.selected ? "var(--nura-text-strong)" : "var(--nura-text-secondary)",
            }}>
              {d.value}
            </span>
          </div>
          <span style={{
            fontFamily: SANS, fontSize: 10, fontWeight: 500,
            color: d.selected ? accent : "var(--nura-text-tertiary)",
          }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
