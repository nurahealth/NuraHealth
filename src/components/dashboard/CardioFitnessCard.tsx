"use client";

import { useId } from "react";
import { getCardioFitnessDetail, type DashboardMetric } from "@/lib/dashboardData";
import MetricCardShell from "@/components/dashboard/MetricCardShell";
import { smooth, hexA } from "@/components/dashboard/cardChartHelpers";

const GOLD = "#d3a253";
const TEAL = "#5dccae";
const TEXT = "var(--nura-text-primary)";
const FAINT = "var(--nura-text-tertiary)";

// VO2-max classification zone bar (worst→best: coral → gold → teal → sage) with
// a white marker at the user's value — same treatment as the Resting HR zone bar.
const ZONE_GRADIENT = "linear-gradient(90deg, #e8745a 0%, #d3a253 42%, #5dccae 78%, #9bb0a5 100%)";

// Cardio Fitness (VO2 max) card — classification zone bar + multi-month sparkline.
export default function CardioFitnessCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const d = getCardioFitnessDetail();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const pos = ((d.vo2 - d.zoneMin) / (d.zoneMax - d.zoneMin)) * 100;

  // Sparkline geometry.
  const w = 340, h = 46, pl = 2, pr = 30, pt = 8, pb = 6;
  const n = d.trend.length;
  const lo = d.trendFloor, hi = d.trendCeil;
  const X = (i: number) => pl + (i / (n - 1)) * (w - pl - pr);
  const Y = (v: number) => pt + (1 - (v - lo) / (hi - lo)) * (h - pt - pb);
  const pts: [number, number][] = d.trend.map((v, i) => [X(i), Y(v)]);
  const line = smooth(pts);

  return (
    <MetricCardShell
      name={metric.name}
      source={metric.source}
      onClick={onClick}
      value={String(d.vo2)}
      unit="ml/kg·min"
      trend={
        <span style={{ color: TEAL, display: "inline-flex", alignItems: "center", gap: 3 }}>
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
          <div style={{ position: "absolute", top: -5, left: `${pos.toFixed(1)}%`, width: 3, height: 24, background: "#fff", borderRadius: 2, transform: "translateX(-50%)", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 9 }}>
          {d.zoneLabels.map((z, i) => (
            <span key={z} style={{ fontSize: 9.5, letterSpacing: "0.4px", textTransform: "uppercase", fontWeight: 600, color: i === d.activeZone ? GOLD : FAINT }}>{z}</span>
          ))}
        </div>
      </div>

      {/* Multi-month trend sparkline */}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 10 }}>
        <defs>
          <linearGradient id={`vg${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={hexA(GOLD, 0.5)} />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
        </defs>
        <text x={w - pr + 5} y={(Y(d.vo2) + 3).toFixed(1)} fontSize={9} fill="rgba(235,230,216,0.40)">{d.vo2}</text>
        <path d={line} fill="none" stroke={`url(#vg${uid})`} strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={pts[n - 1][0].toFixed(1)} cy={pts[n - 1][1].toFixed(1)} r={3.2} fill={GOLD} />
        {d.trendMonths.map((m, k) => m ? (
          <text key={k} x={X(k).toFixed(1)} y={h + 2} fontSize={8.5} fill="rgba(235,230,216,0.38)" textAnchor={k === 0 ? "start" : k === n - 1 ? "end" : "middle"}>{m}</text>
        ) : null)}
      </svg>
    </MetricCardShell>
  );
}
