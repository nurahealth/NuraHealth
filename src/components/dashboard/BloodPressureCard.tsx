"use client";

import { type DashboardMetric, getBloodPressureDetail, SOURCE_LABEL } from "@/lib/dashboardData";
import { hexA } from "@/components/dashboard/cardChartHelpers";
import {
  bpCategory, bpFooterMessage, BP_COLOR,
  systolicPct, diastolicPct, SYS_GRADIENT, DIA_GRADIENT,
} from "@/lib/bloodPressure";

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";
const FAINT = "rgba(235,230,216,0.45)";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

// Slim in-card meter: muted full-word label + cream value, then a gradient track
// with a faint ceiling tick and a cream marker (haloed against the card bg).
function CardMeter({ name, value, gradient, tickPct, pct }: { name: string; value: number; gradient: string; tickPct: number; pct: number }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>{name}</span>
        <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{value}</span>
      </div>
      <div style={{ position: "relative", height: 7 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: gradient }} />
        <div style={{ position: "absolute", top: -1, left: `${tickPct}%`, transform: "translateX(-50%)", width: 1.5, height: 9, borderRadius: 1, background: "rgba(13,13,14,0.5)" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct.toFixed(1)}%`, transform: "translate(-50%,-50%)", width: 4, height: 15, borderRadius: 2.5, background: "#ebe6d8", boxShadow: `0 0 0 2.5px ${CARD}` }} />
      </div>
    </div>
  );
}

// Compact Blood Pressure dashboard tile — two-value readout + stacked systolic /
// diastolic range meters + a status-driven category pill. Taps to the detail view.
export default function BloodPressureCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const d = getBloodPressureDetail();
  const cat = bpCategory(d.systolic, d.diastolic);
  const color = BP_COLOR[cat];

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{metric.name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[d.source]}</span>
      </div>

      {/* Readout */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {d.systolic}<span style={{ color: FAINT }}>/</span>{d.diastolic}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>mmHg</span>
      </div>

      {/* Meters */}
      <CardMeter name="Systolic" value={d.systolic} gradient={SYS_GRADIENT} tickPct={33.3} pct={systolicPct(d.systolic)} />
      <CardMeter name="Diastolic" value={d.diastolic} gradient={DIA_GRADIENT} tickPct={50} pct={diastolicPct(d.diastolic)} />

      {/* Footer — category one-liner + outlined status pill */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto", paddingTop: 16 }}>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4 }}>{bpFooterMessage(cat)}</span>
        <span style={{
          ...EYEBROW, fontSize: 9, color, padding: "3px 8px", borderRadius: 999,
          background: hexA(color, 0.12), border: `0.5px solid ${hexA(color, 0.35)}`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {cat}
        </span>
      </div>
    </div>
  );
}
