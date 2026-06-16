"use client";

import { getBloodOxygenDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import OvernightTraceChart from "@/components/dashboard/OvernightTraceChart";

const TEAL = "#5dccae";
const TEXT = "var(--nura-text-primary)";

// Blood Oxygen (SpO2) card — overnight % trace with a healthy-range band and a
// dashed overnight-average line.
export default function BloodOxygenCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const d = getBloodOxygenDetail();
  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value={<>{d.avgPct}<span style={{ fontSize: 18, fontWeight: 600, color: "var(--nura-text-secondary)" }}>%</span></>}
      trend={<span style={{ color: TEAL }}>avg overnight</span>}
      caption={<>Lowest <b style={{ color: TEXT, fontWeight: 600 }}>{d.lowestPct}%</b> · stayed in your healthy range all night.</>}
      pillLabel={d.statusLabel}
      pillColor={TEAL}
    >
      <OvernightTraceChart
        data={d.overnight}
        lo={d.floor}
        hi={d.ceil}
        ticks={d.ticks}
        band={d.band}
        refLine={d.avgPct}
        color={TEAL}
        axisLabels={d.axisLabels}
      />
    </MetricCardShell>
  );
}
