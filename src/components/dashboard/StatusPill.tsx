import type { CSSProperties } from "react";

// Reusable status pill for metric detail pages (Optimal / Good / Alert).
// Colors come from the theme status tokens; an optional `label` overrides the
// default text (e.g. "Below range & optimal").

export type PillStatus = "optimal" | "good" | "alert";

const MAP: Record<PillStatus, { color: string; rgb: string; label: string }> = {
  optimal: { color: "var(--nura-optimal)", rgb: "var(--nura-optimal-rgb)", label: "Optimal" },
  good: { color: "var(--nura-good)", rgb: "var(--nura-good-rgb)", label: "Good" },
  alert: { color: "var(--nura-alert)", rgb: "var(--nura-alert-rgb)", label: "Alert" },
};

const SANS = "var(--font-inter), system-ui, sans-serif";

export default function StatusPill({
  status,
  label,
  glow = true,
  style,
}: {
  status: PillStatus;
  label?: string;
  glow?: boolean;
  style?: CSSProperties;
}) {
  const s = MAP[status];
  return (
    <span className="nura-glow"
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 10px", borderRadius: 8,
        fontFamily: SANS, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
        color: s.color, background: `rgba(${s.rgb},0.16)`,
        boxShadow: glow ? `0 0 14px rgba(${s.rgb},0.10)` : "none",
        ...style,
      }}
    >
      {label ?? s.label}
    </span>
  );
}
