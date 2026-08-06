"use client";

import { type ReactNode } from "react";

// Reusable "Understanding your …" educational section shared across metric
// detail pages. The metric supplies its own accent color, title, and rows; the
// styling, spacing, accent-colored row labels, and the closing disclaimer are
// fixed so every metric reads identically. Extracted from the Cardio fitness
// (VO₂ max) detail page.

const SANS = "var(--font-inter), system-ui, sans-serif";
const SURFACE = "rgba(var(--nura-bg-tint-rgb),0.04)";
const CREAM = "var(--nura-text-primary)";
const MUTED = "var(--nura-ink-a62)";
const FAINT = "var(--nura-ink-a45)";
const HAIR = "rgba(var(--nura-bg-tint-rgb),0.1)";

export interface MetricEducationItem {
  /** Short uppercase row label, rendered in the accent color. */
  label: string;
  /** Paragraph body — may include bold spans / other inline markup. */
  body: ReactNode;
}

export default function MetricEducation({
  accent, title, items,
}: {
  accent: string;
  title: string;
  items: MetricEducationItem[];
}) {
  return (
    // One edit here reaches all twelve metric detail screens: they all mount
    // this section. In light it takes the shared card finish, and its section
    // labels join the label scale — which also drops the accent colour, since
    // light reserves sage for functional accents rather than running text.
    <section className="nura-card" style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, padding: "4px 18px", fontFamily: SANS }}>
      <div className="nura-title" style={{ padding: "16px 0 4px", fontSize: 14, fontWeight: 600, color: CREAM }}>{title}</div>

      {items.map((it) => (
        <div key={it.label} style={{ padding: "16px 0", borderTop: `0.5px solid ${HAIR}` }}>
          <div className="nura-label" style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: accent, marginBottom: 7 }}>{it.label}</div>
          <div style={{ fontSize: 13.5, lineHeight: 1.62, color: MUTED }}>{it.body}</div>
        </div>
      ))}

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 0 14px", borderTop: `0.5px solid ${HAIR}`, fontSize: 11, color: FAINT }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
        <span>Educational context, not a diagnosis.</span>
      </div>
    </section>
  );
}
