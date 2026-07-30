"use client";

import { getCardioFitnessDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import { useMetricPaint } from "@/lib/metricColors";

const TEXT = "var(--nura-text-primary)";
const FAINT = "var(--nura-text-tertiary)";

// Cardio Fitness (VO2 max) card — classification zone bar.
//
// This wore a champagne-gold identity of its own, which put it in the amber
// family alongside the four movement metrics while Blood Oxygen — the other
// oxygen-delivery metric — was silver. Both are sage now.
//
// The zone bar was a three-stop gold gradient at full width, which is the
// loudest thing on a white card and why light mode had to neutralise the whole
// --nura-meter-* set to grey. It is now an ordered ramp of the metric's own
// colour: a low-alpha wash at the LOW end deepening to full strength at HIGH,
// so position along the scale reads as depth of one hue rather than as a change
// of hue. Same rule as the sleep stages.
export default function CardioFitnessCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const paint = useMetricPaint(metric.id);
  const d = getCardioFitnessDetail();

  const pos = ((d.vo2 - d.zoneMin) / (d.zoneMax - d.zoneMin)) * 100;
  const zoneRamp = `linear-gradient(90deg, ${paint.alpha(0.22)} 0%, ${paint.alpha(0.55)} 58%, ${paint.hex} 100%)`;

  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value={String(d.vo2)}
      unit="ml/kg·min"
      trend={
        <span style={{ color: paint.hex, display: "inline-flex", alignItems: "center", gap: 3 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7" /></svg>
          {d.delta3mo} in 3 mo
        </span>
      }
      caption={<><b style={{ color: TEXT, fontWeight: 600 }}>{d.classification}</b> for your age &amp; sex · roughly top 25%.</>}
      pillLabel={d.statusLabel}
      pillColor={paint.hex}
    >
      {/* Classification zone bar */}
      <div>
        <div style={{ position: "relative", height: 14, borderRadius: 7, background: zoneRamp }}>
          <div className="nura-marker-ring" style={{ position: "absolute", top: -5, left: `${pos.toFixed(1)}%`, width: 3, height: 24, background: "var(--nura-marker)", borderRadius: 2, transform: "translateX(-50%)", boxShadow: "0 0 0 1.5px var(--nura-card)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9 }}>
          {d.zoneLabels.map((z, i) => (
            <span key={z} style={{ fontSize: 9.5, letterSpacing: "0.4px", textTransform: "uppercase", fontWeight: 600, color: i === d.activeZone ? paint.hex : FAINT }}>{z}</span>
          ))}
        </div>
      </div>
    </MetricCardShell>
  );
}
