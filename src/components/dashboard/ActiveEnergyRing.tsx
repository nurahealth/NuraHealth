"use client";

import { useEffect, useRef, useState } from "react";
import type { MetricPaint } from "@/lib/metricColors";
import { usePrefersReducedMotion } from "@/components/dashboard/chartTheme";

// ── Animated goal ring ────────────────────────────────────────────────────────
// A 270° arc (gap at bottom-center): a faint track + a solid fill in the
// movement amber. The fill is goal progress — clamp(kcal / goal, 0, 1) — and on
// mount it animates up while the centered number counts up 0 → kcal. Shared by
// the Active Energy detail hero (large) and the dashboard card (mini). Motion is
// disabled under prefers-reduced-motion.
//
// The fill was a two-stop ember gradient under a 7px drop-shadow bloom, and the
// numeral carried a coloured text-shadow. Both are gone — see the note on the
// HRV ring. Solid, in the metric's own colour.
const SANS = "var(--font-inter), system-ui, sans-serif";

export default function ActiveEnergyRing({
  kcal,
  goal,
  size = 118,
  stroke = 10,
  fillMs = 1400,
  innerLabel,
  color,
}: {
  kcal: number;
  goal: number;
  /** The metric's colour, from `useMetricPaint("active-energy")`. */
  color: MetricPaint;
  size?: number;
  stroke?: number;
  fillMs?: number;
  /** Optional muted line shown inside the ring, beneath the number (e.g. "of 750 goal"). */
  innerLabel?: string;
}) {
  // Geometry — a 270° arc with the gap centered at the bottom.
  const pad = Math.round(stroke * 1.3);
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, goal > 0 ? kcal / goal : 0));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const reduced = usePrefersReducedMotion();
  const [offset, setOffset] = useState(arcLen); // start empty
  const [num, setNum] = useState(0); // count up from 0
  const rafRef = useRef(0);

  // Size-relative typography so the same component reads well large or mini.
  const numFs = Math.round(size * 0.25);
  const unitFs = Math.round(size * 0.115);
  const labelFs = Math.max(10, Math.round(size * 0.08));

  useEffect(() => {
    // Under reduced motion the effect does nothing and render derives the final
    // values below — see the same note on the HRV ring.
    if (reduced) return;
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
    // Backstop. requestAnimationFrame is throttled for occluded iframes and
    // background tabs, so a count-up that starts and then loses frames can
    // leave a number stranded partway — showing "33 ms" for a 62 ms reading,
    // which is worse than not animating at all. This guarantees the true value
    // lands whether or not another frame ever arrives.
    const settle = setTimeout(() => setNum(kcal), fillMs + 120);
    return () => { clearTimeout(t); clearTimeout(settle); cancelAnimationFrame(rafRef.current); };
  }, [target, kcal, fillMs, reduced]);

  const shownOffset = reduced ? target : offset;
  const shownNum = reduced ? kcal : num;

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        {/* faint full 270° track */}
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={color.alpha(0.16)}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* the fill — solid, loading up to goal progress */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={color.hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={shownOffset}
          style={{ transition: reduced ? "none" : `stroke-dashoffset ${fillMs}ms cubic-bezier(.2,.7,.2,1)` }}
        />
      </svg>

      {/* dead-center overlay — number + inline "kcal", optional inner label beneath */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 5, lineHeight: 1 }}>
          <span style={{ fontFamily: SANS, fontSize: numFs, fontWeight: 800, letterSpacing: "-1px", color: "var(--nura-text-primary)" }}>{shownNum}</span>
          <span style={{ fontFamily: SANS, fontSize: unitFs, fontWeight: 600, color: "var(--nura-text-secondary)" }}>kcal</span>
        </div>
        {innerLabel && (
          <span style={{ fontFamily: SANS, fontSize: labelFs, color: "var(--nura-text-tertiary)", marginTop: 6 }}>{innerLabel}</span>
        )}
      </div>
    </div>
  );
}
