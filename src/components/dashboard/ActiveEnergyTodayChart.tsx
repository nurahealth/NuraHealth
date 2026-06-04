"use client";

import { useId } from "react";
import type { ActiveEnergyDetail } from "@/lib/dashboardData";

// Shared "Active Energy — Today" intraday chart, rendered by BOTH the Active
// Energy detail page and the dashboard Active Energy card.
//
// Amber→coral lit-glass pills (per-bar vertical gradient + glow on the hottest
// bars), faint horizontal gridlines, a glowing dashed average curve with an
// "avg" tag, a "KCAL / HR" unit label, a glowing peak readout, and a faint
// dashed "now" marker at the right edge.

const SANS = "'Inter', system-ui, sans-serif";
const INK = "235,230,216"; // warm off-white (matches --nura-fg-rgb in dark)
const CORAL_RGB = "232,116,90";
const AMBER_RGB = "224,162,62";

// ── Chart helpers (hex · lerp · light · colorAt · smooth) ─────────────────────
// The intraday + weekly bars interpolate along an amber→coral ramp, so the work
// happens on raw [r,g,b] triplets rather than CSS vars.
const RAMP = ["#e6b454", "#e0a23e", "#e8745a"]; // amber → deep amber → coral

export function hex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** Lighten a color toward white by `amt` (0–1) — the lit top of each bar. */
export function light([r, g, b]: [number, number, number], amt: number): [number, number, number] {
  return [Math.round(lerp(r, 255, amt)), Math.round(lerp(g, 255, amt)), Math.round(lerp(b, 255, amt))];
}
/** Resolve a 0–1 intensity to an [r,g,b] along the amber→coral ramp. */
export function colorAt(t: number): [number, number, number] {
  const u = Math.max(0, Math.min(1, t));
  const [a, b, c] = RAMP.map(hex);
  const s = u < 0.5 ? a : b;
  const e = u < 0.5 ? b : c;
  const k = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
  return [Math.round(lerp(s[0], e[0], k)), Math.round(lerp(s[1], e[1], k)), Math.round(lerp(s[2], e[2], k))];
}
/** Catmull-Rom → cubic-bezier path through evenly spaced points. */
export function smooth(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
/** Format a 0–23 hour as a compact clock label, e.g. 14 → "2P". */
function hourLabel(h24: number): string {
  const ap = h24 < 12 ? "A" : "P";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}${ap}`;
}

export default function ActiveEnergyTodayChart({ d, height = 170 }: { d: ActiveEnergyDetail; height?: number }) {
  const rawId = useId();
  const uid = `ae-today-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const data = d.todayHourly;
  const W = 356, H = height, top = 22, base = H - 16, plotH = base - top;
  const span = (d.todayCeil - d.todayFloor) || 1;
  const yOf = (v: number) => base - Math.max(0, Math.min(1, (v - d.todayFloor) / span)) * plotH;
  const normOf = (v: number) => Math.max(0, Math.min(1, (v - d.todayFloor) / span));
  const n = data.length, slot = W / n, bw = Math.min(slot * 0.62, 5);

  // Peak bar.
  let pi = 0;
  data.forEach((v, i) => { if (v > data[pi]) pi = i; });
  const peakV = data[pi];
  const peakX = pi * slot + slot / 2;
  const peakY = yOf(peakV);
  const peakLabel = `${Math.round(peakV)} · PEAK · ${hourLabel(Math.round((pi / Math.max(1, n - 1)) * 24) % 24)}`;
  const labelY = Math.max(11, peakY - 11);
  const labelX = Math.max(46, Math.min(W - 46, peakX));

  // Average curve.
  const bl = d.todayBaseline, m = bl.length;
  const curvePts: [number, number][] = bl.map((v, k) => [m > 1 ? (k / (m - 1)) * W : 0, yOf(v)]);
  const curve = smooth(curvePts);
  const avgEnd = curvePts[curvePts.length - 1];

  return (
    <div style={{ marginTop: 2 }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
        <defs>
          {data.map((v, i) => {
            const [r, g, b] = colorAt(normOf(v));
            const [lr, lg, lb] = light([r, g, b], 0.5);
            return (
              <linearGradient key={i} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`rgb(${lr},${lg},${lb})`} stopOpacity="1" />
                <stop offset="50%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.92" />
                <stop offset="100%" stopColor={`rgb(${r},${g},${b})`} stopOpacity="0.42" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Horizontal gridlines */}
        {d.todayGridlines.map((gl, i) => (
          <line key={`g${i}`} x1={0} x2={W} y1={yOf(gl)} y2={yOf(gl)} stroke={`rgba(${INK},0.07)`} strokeWidth={1} />
        ))}

        {/* Lit-glass pill bars */}
        {data.map((v, i) => {
          const norm = normOf(v);
          const h = Math.max(norm * plotH, 2);
          const x = i * slot + (slot - bw) / 2;
          const y = base - h;
          const rx = Math.min(bw / 2, h / 2);
          const [r, g, b] = colorAt(norm);
          return (
            <rect
              key={i} x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)}
              rx={rx.toFixed(1)} fill={`url(#${uid}-${i})`}
              style={norm > 0.5 ? { filter: `drop-shadow(0 0 ${(1.5 + norm * 4).toFixed(1)}px rgba(${r},${g},${b},${(0.2 + norm * 0.45).toFixed(2)}))` } : undefined}
            />
          );
        })}

        {/* Glowing dashed average curve + tag */}
        {curve && (
          <path d={curve} fill="none" stroke={`rgba(${INK},0.5)`} strokeWidth={1.6} strokeDasharray="4 5" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px rgba(${AMBER_RGB},0.45))` }} />
        )}
        <text x={(W - 14).toFixed(1)} y={(avgEnd[1] - 6).toFixed(1)} textAnchor="end" fill={`rgba(${AMBER_RGB},0.9)`} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600 }}>avg</text>

        {/* Faint dashed "now" marker at the right edge */}
        <line x1={W - 1} x2={W - 1} y1={top} y2={base} stroke={`rgba(${INK},0.2)`} strokeWidth={1} strokeDasharray="3 4" />

        {/* Right-edge gridline value labels */}
        {d.todayGridlines.map((gl, i) => (
          <text key={`l${i}`} x={W - 4} y={yOf(gl) - 3} textAnchor="end" fill={`rgba(${INK},0.32)`} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600 }}>{String(gl)}</text>
        ))}

        {/* KCAL / HR unit label, top-left */}
        <text x={1} y={11} fill={`rgba(${INK},0.42)`} style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: "1px" }}>KCAL / HR</text>

        {/* Peak readout — glowing dot + label */}
        <circle cx={peakX.toFixed(1)} cy={peakY.toFixed(1)} r={3.4} fill={`rgb(${CORAL_RGB})`} style={{ filter: `drop-shadow(0 0 6px rgba(${CORAL_RGB},0.95))` }} />
        <text x={labelX.toFixed(1)} y={labelY.toFixed(1)} textAnchor="middle" fill={`rgb(${INK})`} style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.5px", filter: `drop-shadow(0 0 5px rgba(${CORAL_RGB},0.6))` }}>
          {peakLabel}
        </text>
      </svg>

      {/* X-axis */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: SANS, fontSize: 9.5, color: `rgba(${INK},0.30)`, letterSpacing: "0.3px" }}>
        <span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>now</span>
      </div>
    </div>
  );
}
