"use client";

import { useId } from "react";
import { smooth, hexA, light } from "@/components/dashboard/cardChartHelpers";

// Overnight % / rate trace across the 11p–7a sleep window — a smooth line with a
// soft area fill, an optional shaded normal-range band, an optional dashed
// reference line (average or baseline), right-edge axis ticks, and time labels.
// Used by the Blood Oxygen and Respiratory Rate cards. Ported from the mockup.

const W = 340, H = 150, padL = 4, padR = 30, padT = 14, padB = 24;

export default function OvernightTraceChart({
  data, lo, hi, ticks, band, refLine, color, axisLabels = ["11p", "1a", "3a", "5a", "7a"],
}: {
  data: number[];
  lo: number;
  hi: number;
  ticks: number[];
  /** Shaded normal-range band [low, high], or null. */
  band?: [number, number] | null;
  /** Dashed reference line value (average or baseline), or null. */
  refLine?: number | null;
  color: string;
  axisLabels?: string[];
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const n = data.length;
  const xAt = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const yAt = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const pts: [number, number][] = data.map((v, i) => [xAt(i), yAt(v)]);
  const line = smooth(pts);
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${yAt(lo).toFixed(1)} L${pts[0][0].toFixed(1)},${yAt(lo).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id={`ln${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={hexA(color, 0.55)} />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={light(color, 0.25)} />
        </linearGradient>
        <linearGradient id={`ar${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hexA(color, 0.28)} />
          <stop offset="1" stopColor={hexA(color, 0)} />
        </linearGradient>
      </defs>

      {/* Normal-range band */}
      {band && (
        <rect x={padL} y={yAt(band[1]).toFixed(1)} width={W - padL - padR} height={(yAt(band[0]) - yAt(band[1])).toFixed(1)} fill={hexA(color, 0.06)} rx={3} />
      )}

      {/* Right-edge gridline ticks + labels */}
      {ticks.map((t) => {
        const y = yAt(t);
        return (
          <g key={t}>
            <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)} stroke="rgba(235,230,216,0.06)" strokeWidth={1} />
            <text x={W - padR + 5} y={(y + 3).toFixed(1)} fontSize={9} fill="rgba(235,230,216,0.40)">{t}</text>
          </g>
        );
      })}

      {/* Dashed reference (average / baseline) */}
      {refLine != null && (
        <line x1={padL} y1={yAt(refLine).toFixed(1)} x2={W - padR} y2={yAt(refLine).toFixed(1)} stroke={hexA(color, 0.55)} strokeWidth={1.3} strokeDasharray="4 4" />
      )}

      <path d={area} fill={`url(#ar${uid})`} />
      <path d={line} fill="none" stroke={`url(#ln${uid})`} strokeWidth={2.4} strokeLinecap="round" />

      {/* X-axis time labels */}
      {axisLabels.map((l, k) => {
        const x = padL + (k / (axisLabels.length - 1)) * (W - padL - padR);
        return (
          <text key={k} x={x.toFixed(1)} y={H - 6} fontSize={9} fill="rgba(235,230,216,0.40)" textAnchor={k === 0 ? "start" : k === axisLabels.length - 1 ? "end" : "middle"}>{l}</text>
        );
      })}
    </svg>
  );
}
