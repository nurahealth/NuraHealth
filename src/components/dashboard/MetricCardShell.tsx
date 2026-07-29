"use client";

import { type ReactNode } from "react";
import { SOURCE_LABEL, type SourceId } from "@/lib/dashboardData";
import { hexA } from "@/components/dashboard/cardChartHelpers";

// Reusable metric-card chrome — mirrors the dashboard's existing MetricCard look
// (clickable glass card, name + source header, big value + unit + trend, a viz
// slot, and a footer caption + status pill). Used by the new SpO2 / Respiratory /
// Cardio Fitness cards so they match the rest of the grid without modifying any
// existing card. The `.dash-card` hover comes from the dashboard page's styles.

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

export default function MetricCardShell({
  name, source, value, unit, trend, children, caption, pillLabel, pillColor, onClick,
}: {
  name: string;
  source: SourceId;
  value: ReactNode;
  unit?: string;
  trend?: ReactNode;
  children: ReactNode;
  caption: ReactNode;
  pillLabel: string;
  pillColor: string;
  onClick: () => void;
}) {
  return (
    <div
      className="dash-card"
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      style={{
        background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 18,
        padding: 18, cursor: "pointer", display: "flex", flexDirection: "column",
        minHeight: 248,
      }}
    >
      {/* Header — name + source tag */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[source]}</span>
      </div>

      {/* Value + unit + trend */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</span>
        {unit && <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>{unit}</span>}
        {trend && <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>{trend}</span>}
      </div>

      {/* Visualization */}
      <div style={{ marginTop: 14, marginBottom: 14, flex: 1 }}>{children}</div>

      {/* Footer — caption + accent status pill */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto" }}>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4 }}>{caption}</span>
        <span className="nura-chip" style={{
          ...EYEBROW, fontSize: 9, color: pillColor, padding: "3px 8px", borderRadius: 999,
          background: hexA(pillColor, 0.12), border: `0.5px solid ${hexA(pillColor, 0.35)}`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {pillLabel}
        </span>
      </div>
    </div>
  );
}
