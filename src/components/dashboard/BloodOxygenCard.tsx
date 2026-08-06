"use client";

import { getBloodOxygenDetail, SOURCE_LABEL, type DashboardMetric } from "@/lib/dashboardData";
import { spo2Status, spo2FooterMessage } from "@/lib/bloodOxygen";
import { useMetricPaint } from "@/lib/metricColors";

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

// Compact Blood Oxygen tile — big % readout, a range bar (90–100, with the
// 95–100 "normal" portion stronger) marking the reading, and a status pill.
//
// This used to carry its own "ice / platinum" identity, which is how SpO2 ended
// up a different colour from Cardio Fitness despite both being oxygen-delivery
// metrics. Both now wear the sage family. The bar's glows are gone with it —
// the marker keeps its hairline ring, which is what actually separates it from
// the fill it sits on.
export default function BloodOxygenCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const paint = useMetricPaint(metric.id);
  const d = getBloodOxygenDetail();
  const status = spo2Status(d.lastNight);
  // Range bar: 90 → 100 scale; marker at the reading, tick at the 95 threshold.
  const markPct = Math.max(0, Math.min(100, ((d.lastNight - 90) / 10) * 100));

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
        alignItems: "center", justifyContent: "space-between", textAlign: "center",
        minHeight: 248,
      }}
    >
      {/* Header — stacked + centered: label over source */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{metric.name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[d.source]}</span>
      </div>

      {/* Middle group — value + bar kept close, centered in the vertical middle */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        {/* Readout */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
          <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.02em" }}>{d.lastNight}</span>
          <span style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: TEXT_SEC }}>%</span>
        </div>

        {/* Range bar — dim 90–95, stronger 95–100, marker at the reading */}
        <div style={{ width: "100%" }}>
          <div style={{ position: "relative", height: 7 }}>
            <div className="nura-meter-track" style={{ position: "absolute", inset: 0, borderRadius: 999, background: paint.alpha(0.16) }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", right: 0, borderRadius: "0 999px 999px 0", background: paint.alpha(0.55) }} />
            <div className="nura-meter-tick" style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", width: 1.5, height: 9, borderRadius: 1, background: "var(--nura-tick-on-accent)" }} />
            <div className="nura-marker-ring nura-meter-dot" style={{ position: "absolute", top: "50%", left: `${markPct.toFixed(1)}%`, transform: "translate(-50%,-50%)", width: 4, height: 15, borderRadius: 2.5, background: paint.hex, boxShadow: `0 0 0 2.5px ${CARD}` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: SANS, fontSize: 10, color: TEXT_TER }}>
            <span>90</span><span>95</span><span>100</span>
          </div>
        </div>
      </div>

      {/* Footer — stacked + centered: status one-liner over the cyan status pill */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4, textAlign: "center" }}>{spo2FooterMessage(status)}</span>
        <span style={{
          ...EYEBROW, fontSize: 9, color: paint.hex, padding: "3px 8px", borderRadius: 999,
          background: paint.alpha(0.14), border: `0.5px solid ${paint.alpha(0.4)}`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {status}
        </span>
      </div>
    </div>
  );
}
