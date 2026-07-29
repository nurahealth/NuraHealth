"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useThemeTokens } from "@/lib/themeTokens";

// ── Animated ember-orange goal ring ───────────────────────────────────────────
// A 270° arc (gap at bottom-center): a faint track + an ember-orange gradient
// fill (#e07a3c → #f0a05a) with a soft glow. The fill is goal progress —
// clamp(kcal / goal, 0, 1) — and on mount it animates up while the centered
// number counts up 0 → kcal. Shared by the Active Energy detail hero (large) and
// the dashboard card (mini). Motion is disabled under prefers-reduced-motion
// (ring already filled, number at its final value).
const SANS = "var(--font-inter), system-ui, sans-serif";
// SVG gradient stops — concrete hex required.
const TOKENS = {
  ember: ["--nura-ember", "#e07a3c"],
  emberLight: ["--nura-ember-hi", "#f0a05a"],
} as const;
const EMBER_RGB = "var(--nura-ember-rgb)";

export default function ActiveEnergyRing({
  kcal,
  goal,
  size = 118,
  stroke = 10,
  fillMs = 1400,
  innerLabel,
}: {
  kcal: number;
  goal: number;
  size?: number;
  stroke?: number;
  fillMs?: number;
  /** Optional muted line shown inside the ring, beneath the number (e.g. "of 750 goal"). */
  innerLabel?: string;
}) {
  const { ember: EMBER, emberLight: EMBER_LIGHT } = useThemeTokens(TOKENS);
  const rawId = useId();
  const gid = `aering-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Geometry — a 270° arc with the gap centered at the bottom.
  const pad = Math.round(stroke * 1.3); // breathing room so the glow isn't clipped
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, goal > 0 ? kcal / goal : 0));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const [offset, setOffset] = useState(arcLen); // start empty
  const [num, setNum] = useState(0); // count up from 0
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef(0);

  // Size-relative typography so the same component reads well large or mini.
  const numFs = Math.round(size * 0.25);
  const unitFs = Math.round(size * 0.115);
  const labelFs = Math.max(10, Math.round(size * 0.08));

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setOffset(target); // already filled
      setNum(kcal); // final value, no count-up
      return;
    }
    // Defer one tick so the empty→target fill transition actually plays.
    const t = setTimeout(() => setOffset(target), 60);
    const ease = (p: number) => 1 - Math.pow(1 - p, 3); // ease-out cubic
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / fillMs);
      setNum(Math.round(kcal * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [target, kcal, fillMs]);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={EMBER} />
            <stop offset="1" stopColor={EMBER_LIGHT} />
          </linearGradient>
        </defs>
        {/* faint full 270° track */}
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={`rgba(${EMBER_RGB},0.14)`}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* ember-orange gradient fill — loads up to goal progress */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 7px rgba(${EMBER_RGB},0.6))`,
            transition: reduced ? "none" : `stroke-dashoffset ${fillMs}ms cubic-bezier(.2,.7,.2,1)`,
          }}
        />
      </svg>

      {/* dead-center overlay — number + inline "kcal", optional inner label beneath */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 5, lineHeight: 1 }}>
          <span style={{ fontFamily: SANS, fontSize: numFs, fontWeight: 800, letterSpacing: "-1px", color: "var(--nura-text-primary)", textShadow: `0 0 16px rgba(${EMBER_RGB},0.35)` }}>{num}</span>
          <span style={{ fontFamily: SANS, fontSize: unitFs, fontWeight: 600, color: "var(--nura-text-secondary)" }}>kcal</span>
        </div>
        {innerLabel && (
          <span style={{ fontFamily: SANS, fontSize: labelFs, color: "var(--nura-text-tertiary)", marginTop: 6 }}>{innerLabel}</span>
        )}
      </div>
    </div>
  );
}
