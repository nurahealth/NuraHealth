"use client";

import { useMemo } from "react";
import { getRespiratoryDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import MetricLineChart from "@/components/dashboard/MetricLineChart";
import { BaselineChip } from "@/components/dashboard/chartTheme";
import { useMetricPaint } from "@/lib/metricColors";

const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";

/**
 * Clock labels for `n` samples spread evenly across a sleep window, used for
 * the chart's hover readout. The overnight trace is 32 samples from 11p to 7a,
 * so a point is worth ~15 minutes and "01:45" is a truer answer than "#12".
 */
function sleepClockLabels(n: number, startHour: number, endHour: number): string[] {
  const span = ((endHour - startHour + 24) % 24) * 60;
  return Array.from({ length: n }, (_, i) => {
    const mins = startHour * 60 + (i / Math.max(1, n - 1)) * span;
    const h = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    const ap = h < 12 ? "am" : "pm";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")}${ap}`;
  });
}

// Respiratory Rate card — overnight br/min trace on the shared single-series
// line treatment, with the personal baseline as its dashed reference.
export default function RespiratoryRateCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  // The card and the expanded view now read the same row of the same map, which
  // is why they can no longer disagree about what colour respiratory rate is.
  const paint = useMetricPaint(metric.id);
  const d = getRespiratoryDetail();
  const clock = useMemo(() => sleepClockLabels(d.overnight.length, 23, 7), [d.overnight.length]);

  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value={d.avg.toFixed(1)}
      unit="br/min"
      // "steady" is a plain-language reading of the trend, not a status —
      // it was mauve, which made it look like a state the card was warning
      // about. It is prose, so it is ink.
      trend={<span style={{ color: TEXT_SEC, fontWeight: 500 }}>steady</span>}
      caption={<>Right on your <b style={{ color: TEXT, fontWeight: 600 }}>{d.baseline.toFixed(1)}</b> baseline — no signs of strain or illness.</>}
      pillLabel={d.statusLabel}
      pillColor={paint.hex}
      // The reference values, in the chrome. They used to be painted inside the
      // plot on the baseline rule, where the trace crossed straight through
      // them — a horizontal reference sits in the middle of a series that
      // oscillates around it, so there was no night on which they did not
      // collide. Values are read from the same data the chart plots.
      meta={<BaselineChip baseline={d.baseline} range={d.baselineRange} />}
    >
      <MetricLineChart
        data={d.overnight}
        color={paint}
        unit="br/min"
        baseline={d.baseline}
        // No explicit domain on purpose. The clinical 12–17 range flattens a
        // night that only moves between 13.8 and 14.6 into a straight line —
        // on a glanceable card the shape of the night is the information, and
        // the dashed baseline is the reference that makes it mean something.
        // The detail screen is where the full clinical range belongs.
        xLabels={d.axisLabels}
        pointLabels={clock}
        format={(v) => v.toFixed(1)}
        // No y labels: the chip above states the baseline and the range, so the
        // gutter figures were a second, quieter copy of the same information
        // pressed against the plot. The time axis stays — it says WHEN, which
        // nothing else on the card does.
        showYAxis={false}
        // Thirty-two samples moving ±0.4 br/min. Interpolating through every
        // one of them turns sampling noise into spikes; approximating reads as
        // the gentle undulation an overnight trace actually is.
        smoothing="approximate"
        strokeWidth={2.2}
        areaAlpha={0.14}
        dotRadius={3.4}
        ariaLabel={`Overnight respiratory rate, ${d.overnight.length} readings from 11pm to 7am, averaging ${d.avg.toFixed(1)} breaths per minute against a ${d.baseline.toFixed(1)} baseline, personal range ${d.baselineRange[0].toFixed(1)} to ${d.baselineRange[1].toFixed(1)}.`}
      />
    </MetricCardShell>
  );
}
