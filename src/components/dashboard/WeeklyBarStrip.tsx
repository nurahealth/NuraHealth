import type { CSSProperties } from "react";

// Weekly bar strip with the selected day highlighted in white. Each bar shows
// its value above and a short label below. Reusable across metric detail pages.

const SANS = "var(--font-inter), system-ui, sans-serif";

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

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 4, height, ...style }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <div
            style={{
              position: "relative", width: "100%", maxWidth: 26,
              height: `${Math.max(4, Math.round((d.value / top) * 100))}%`,
              borderRadius: 8,
              background: d.selected ? selectedGradient : barGradient,
              boxShadow: d.selected ? "0 0 22px rgba(var(--nura-fg-rgb),0.30)" : "none",
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
