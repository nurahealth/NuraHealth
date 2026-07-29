"use client";

import { getCardioFitnessDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import { useThemeTokens } from "@/lib/themeTokens";

// pillColor feeds hexA(), so gold must resolve to concrete hex.
const TOKENS = { gold: ["--nura-gold-ring", "#e8c266"] } as const;
const TEXT = "var(--nura-text-primary)";
const FAINT = "var(--nura-text-tertiary)";

// VO2-max classification zone bar — one gold identity: dim deep-gold on the LOW
// end → bright champagne on the HIGH end, with a gold marker at the user's value.
const ZONE_GRADIENT = "linear-gradient(90deg, var(--nura-meter-gold-lo) 0%, var(--nura-meter-gold-mid) 58%, var(--nura-meter-gold-hi) 100%)";

// Cardio Fitness (VO2 max) card — classification zone bar.
export default function CardioFitnessCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const { gold: GOLD } = useThemeTokens(TOKENS);
  const d = getCardioFitnessDetail();

  const pos = ((d.vo2 - d.zoneMin) / (d.zoneMax - d.zoneMin)) * 100;

  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value={String(d.vo2)}
      unit="ml/kg·min"
      trend={
        <span style={{ color: GOLD, display: "inline-flex", alignItems: "center", gap: 3 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l7-7 7 7" /></svg>
          {d.delta3mo} in 3 mo
        </span>
      }
      caption={<><b style={{ color: TEXT, fontWeight: 600 }}>{d.classification}</b> for your age &amp; sex · roughly top 25%.</>}
      pillLabel={d.statusLabel}
      pillColor={GOLD}
    >
      {/* Classification zone bar */}
      <div>
        <div style={{ position: "relative", height: 14, borderRadius: 7, background: ZONE_GRADIENT }}>
          <div className="nura-glow" style={{ position: "absolute", top: -5, left: `${pos.toFixed(1)}%`, width: 3, height: 24, background: "var(--nura-gold-ring-hi)", borderRadius: 2, transform: "translateX(-50%)", boxShadow: "0 0 8px rgba(var(--nura-gold-ring-rgb),0.85)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9 }}>
          {d.zoneLabels.map((z, i) => (
            <span key={z} style={{ fontSize: 9.5, letterSpacing: "0.4px", textTransform: "uppercase", fontWeight: 600, color: i === d.activeZone ? GOLD : FAINT }}>{z}</span>
          ))}
        </div>
      </div>
    </MetricCardShell>
  );
}
