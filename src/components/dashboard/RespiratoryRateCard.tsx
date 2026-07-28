"use client";

import { getRespiratoryDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import OvernightTraceChart from "@/components/dashboard/OvernightTraceChart";
import { useThemeTokens } from "@/lib/themeTokens";

const TOKENS = { mauve: ["--nura-mauve", "#a98fc4"] } as const;
const TEXT = "var(--nura-text-primary)";

// Respiratory Rate card — overnight br/min trace with a dashed personal-baseline
// line on the same 11p–7a sleep-window axis.
export default function RespiratoryRateCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const { mauve: MAUVE } = useThemeTokens(TOKENS);
  const d = getRespiratoryDetail();
  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value={d.avg.toFixed(1)}
      unit="br/min"
      trend={<span style={{ color: MAUVE }}>steady</span>}
      caption={<>Right on your <b style={{ color: TEXT, fontWeight: 600 }}>{d.baseline.toFixed(1)}</b> baseline — no signs of strain or illness.</>}
      pillLabel={d.statusLabel}
      pillColor={MAUVE}
    >
      <OvernightTraceChart
        data={d.overnight}
        lo={d.floor}
        hi={d.ceil}
        ticks={d.ticks}
        band={d.band}
        refLine={d.baseline}
        color={MAUVE}
        axisLabels={d.axisLabels}
      />
    </MetricCardShell>
  );
}
