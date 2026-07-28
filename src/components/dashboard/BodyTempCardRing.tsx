"use client";

import { useId } from "react";
import { deviationDirection, fmtMagUnit, type TemperatureUnit } from "@/lib/temperatureUnit";
import { useThemeTokens } from "@/lib/themeTokens";

// Body Temp dashboard-card ring — a 270° arc (gap at the bottom) with a faint
// full track under a cool→warm gradient zone track, a baseline notch at the TOP
// (deviation 0 sits at top), and a glowing marker placed by mapping the current
// °C deviation onto a −1…+1 scale: t = (devC + 1) / 2, angle = 135° + 270° × t.
// The center shows the deviation in the user's unit, a "from baseline" caption,
// and a status word. Marker position is unit-independent (a ratio on the scale).

// SVG gradient stops + attribute fills — concrete hex required.
const TOKENS = {
  teal:    ["--nura-teal", "#5dccae"],
  gold:    ["--nura-good", "#d3a253"],
  cool:    ["--nura-sleep-deep", "#5aa0e6"],
  warm:    ["--nura-alert", "#e8745a"],
  ink:     ["--nura-fg-rgb", "235,230,216"],
  tealRgb: ["--nura-teal-rgb", "93,204,174"],
  coolRgb: ["--nura-sleep-deep-rgb", "90,160,230"],
  warmRgb: ["--nura-alert-rgb", "232,116,90"],
  marker:  ["--nura-text-primary", "#ebe6d8"],
} as const;

const CX = 98, CY = 98, R = 60, START = 135, SWEEP = 270;
const pol = (a: number) => ({
  x: CX + R * Math.cos((a * Math.PI) / 180),
  y: CY + R * Math.sin((a * Math.PI) / 180),
});

export default function BodyTempCardRing({
  devC, unit, normalRange,
}: { devC: number; unit: TemperatureUnit; normalRange: [number, number] }) {
  const { teal: TEAL, gold: GOLD, cool: COOL, warm: WARM, ink: INK,
          tealRgb: TEAL_RGB, coolRgb: COOL_RGB, warmRgb: WARM_RGB, marker: MARKER } = useThemeTokens(TOKENS);
  const rawId = useId();
  const uid = `bt-ring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const t = Math.max(0, Math.min(1, (devC + 1) / 2));
  const aVal = START + SWEEP * t;
  const aBase = START + SWEEP * 0.5; // baseline (0) at top
  const m = pol(aVal);
  const b = pol(aBase);

  const circ = 2 * Math.PI * R;
  const vis = circ * (SWEEP / 360);

  const within = devC >= normalRange[0] && devC <= normalRange[1];
  const status = within ? "Normal" : devC > normalRange[1] ? "Elevated" : "Cool";
  const statusColor = within ? TEAL : devC > normalRange[1] ? GOLD : COOL;

  // Shortened center sub-line — "0.4°F below" (no "baseline") so it doesn't crowd
  // the smaller ring; "Right at baseline" at zero deviation.
  const dir = deviationDirection(devC);
  const subLine = dir === "at" ? "Right at baseline" : `${fmtMagUnit(devC, unit)} ${dir}`;

  return (
    <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      <svg viewBox="0 0 196 196" style={{ width: "100%", maxWidth: 196, height: "auto", display: "block" }}>
        <defs>
          <linearGradient id={`${uid}-zone`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={COOL} />
            <stop offset="40%" stopColor={TEAL} />
            <stop offset="72%" stopColor={GOLD} />
            <stop offset="100%" stopColor={WARM} />
          </linearGradient>
          <filter id={`${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Faint full track */}
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke={`rgba(${INK},0.07)`} strokeWidth={9}
          strokeLinecap="round" strokeDasharray={`${vis.toFixed(1)} ${circ.toFixed(1)}`}
          transform={`rotate(${START} ${CX} ${CY})`}
        />
        {/* Gradient zone track */}
        <circle
          cx={CX} cy={CY} r={R} fill="none" stroke={`url(#${uid}-zone)`} strokeWidth={9} strokeOpacity={0.85}
          strokeLinecap="round" strokeDasharray={`${vis.toFixed(1)} ${circ.toFixed(1)}`}
          transform={`rotate(${START} ${CX} ${CY})`}
        />
        {/* Baseline notch + label at top */}
        <circle cx={b.x.toFixed(1)} cy={b.y.toFixed(1)} r={2} fill={`rgba(${INK},0.5)`} />
        <text x={CX} y={(CY - R - 18).toFixed(1)} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={10.5} fontWeight={600} fill={`rgba(${INK},0.4)`} letterSpacing="0.8">BASELINE</text>
        {/* Current-reading marker */}
        <circle cx={m.x.toFixed(1)} cy={m.y.toFixed(1)} r={8} fill="var(--nura-bg)" stroke={`rgba(${TEAL_RGB},0.5)`} strokeWidth={1} />
        <circle cx={m.x.toFixed(1)} cy={m.y.toFixed(1)} r={4.5} fill={MARKER} filter={`url(#${uid}-glow)`} />
        {/* End-of-scale hints — centered, below + outboard of the lower arc ends */}
        <text x={52} y={164} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={10.5} letterSpacing="0.8" fill={`rgba(${COOL_RGB},0.7)`} fontWeight={600}>COOL</text>
        <text x={144} y={164} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={10.5} letterSpacing="0.8" fill={`rgba(${WARM_RGB},0.7)`} fontWeight={600}>WARM</text>
      </svg>

      {/* Center overlay — status-led: status word on top, worded deviation beneath */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: statusColor, letterSpacing: "-0.3px", filter: `drop-shadow(0 0 16px ${statusColor}55)` }}>{status}</div>
        <div style={{ fontSize: 10.5, color: "var(--nura-text-secondary)", marginTop: 6, lineHeight: 1.3 }}>{subLine}</div>
      </div>
    </div>
  );
}
