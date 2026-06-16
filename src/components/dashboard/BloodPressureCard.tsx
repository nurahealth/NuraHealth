"use client";

import { useId } from "react";
import { getBloodPressureDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import { smooth, hexA } from "@/components/dashboard/cardChartHelpers";

const CORAL = "#e8745a";
const TEXT = "var(--nura-text-primary)";

// ACC/AHA classification from the latest reading. Colored by severity (calm →
// coral) — the card itself is coral-accented.
function classifyBP(sys: number, dia: number): { label: string; color: string } {
  if (sys >= 140 || dia >= 90) return { label: "Stage 2", color: "#e8745a" };
  if (sys >= 130 || dia >= 80) return { label: "Stage 1", color: "#e0a23e" };
  if (sys >= 120) return { label: "Elevated", color: "#d3a253" };
  return { label: "Normal", color: "#5dccae" };
}

// Blood Pressure card — systolic + diastolic dual-line trend over recent readings
// with dashed reference thresholds (120/80). A TREND from the connected health
// platform, framed explicitly as non-clinical (not a diagnostic reading).
export default function BloodPressureCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const d = getBloodPressureDetail();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const cls = classifyBP(d.systolic, d.diastolic);

  const W = 340, H = 150, padL = 4, padR = 30, padT = 14, padB = 24;
  const n = d.systolicTrend.length;
  const lo = d.floor, hi = d.ceil;
  const xAt = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const yAt = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const sysPts: [number, number][] = d.systolicTrend.map((v, i) => [xAt(i), yAt(v)]);
  const diaPts: [number, number][] = d.diastolicTrend.map((v, i) => [xAt(i), yAt(v)]);
  const sysLine = smooth(sysPts);
  const diaLine = smooth(diaPts);

  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value="118/76"
      unit="mmHg"
      caption={<>From your health platform — a <b style={{ color: TEXT, fontWeight: 600 }}>trend</b>, not a diagnosis.</>}
      pillLabel={cls.label}
      pillColor={cls.color}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          <linearGradient id={`sys${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={hexA(CORAL, 0.55)} />
            <stop offset="1" stopColor={CORAL} />
          </linearGradient>
        </defs>

        {/* Dashed reference thresholds (120 systolic, 80 diastolic) + right-edge ticks */}
        {[
          { v: d.sysThreshold, tag: "SYS" },
          { v: d.diaThreshold, tag: "DIA" },
        ].map(({ v, tag }) => {
          const y = yAt(v);
          return (
            <g key={tag}>
              <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} stroke={hexA(CORAL, 0.4)} strokeWidth={1.2} strokeDasharray="4 4" />
              <text x={W - padR + 5} y={(y + 3).toFixed(1)} fontSize={9} fill="rgba(235,230,216,0.40)">{v}</text>
              <text x={padL + 2} y={(y - 4).toFixed(1)} fontSize={8} fontWeight={700} letterSpacing="0.6" fill="rgba(235,230,216,0.42)">{tag}</text>
            </g>
          );
        })}

        {/* Diastolic (lighter) + systolic (solid coral) trend lines */}
        <path d={diaLine} fill="none" stroke={hexA(CORAL, 0.55)} strokeWidth={1.8} strokeLinecap="round" />
        <path d={sysLine} fill="none" stroke={`url(#sys${uid})`} strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={sysPts[n - 1][0].toFixed(1)} cy={sysPts[n - 1][1].toFixed(1)} r={3.2} fill={CORAL} />
        <circle cx={diaPts[n - 1][0].toFixed(1)} cy={diaPts[n - 1][1].toFixed(1)} r={2.6} fill={hexA(CORAL, 0.7)} />

        {/* X-axis labels */}
        {d.axisLabels.map((l, k) => {
          const x = padL + (k / (d.axisLabels.length - 1)) * (W - padL - padR);
          return (
            <text key={k} x={x.toFixed(1)} y={H - 6} fontSize={9} fill="rgba(235,230,216,0.40)" textAnchor={k === 0 ? "start" : k === d.axisLabels.length - 1 ? "end" : "middle"}>{l}</text>
          );
        })}
      </svg>
    </MetricCardShell>
  );
}
