"use client";

import { getActiveEnergyDetail, SOURCE_LABEL, type DashboardMetric } from "@/lib/dashboardData";
import ActiveEnergyRing from "@/components/dashboard/ActiveEnergyRing";

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";

// Ember-orange identity — matches the Active Energy detail page.
const EMBER = "var(--nura-ember)";
const EMBER_RGB = "var(--nura-ember-rgb)";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

// ── Active Energy card ─────────────────────────────────────────────────────────
// Mini ember-orange goal ring (fill = kcal / move goal) with the kcal count-up
// centered inside, "of {goal} goal" beneath the ring, a "{pct}% to goal · …" note
// and the status pill. Reads the real detail payload (dev fallback if missing).
export default function ActiveEnergyCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const d = getActiveEnergyDetail();
  const kcal = d?.activeEnergy ?? metric.value ?? 612;
  const goal = d?.moveGoal ?? 750;
  const status = metric.status ?? "optimal";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
  const percent = goal > 0 ? Math.round((kcal / goal) * 100) : 0;
  const note = `${percent}% to goal · ${percent >= 100 ? "goal reached" : "on track"}`;

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
      {/* Header — name (left) · source (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{metric.name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[metric.source]}</span>
      </div>

      {/* Center — mini ember ring + "of {goal} goal" beneath */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: "10px 0" }}>
        <ActiveEnergyRing kcal={kcal} goal={goal} size={118} stroke={10} fillMs={1300} />
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER }}>of {goal} goal</span>
      </div>

      {/* Below the ring — progress note + status pill */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, marginTop: "auto" }}>
        <span className="nura-note-ink" style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: EMBER }}>{note}</span>
        <span style={{
          ...EYEBROW, fontSize: 9, color: EMBER, padding: "3px 8px", borderRadius: 999,
          background: `rgba(${EMBER_RGB},0.12)`, border: `0.5px solid rgba(${EMBER_RGB},0.35)`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
