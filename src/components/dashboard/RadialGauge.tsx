"use client";

import { useEffect, useId, useRef, useState } from "react";

// Animated radial score gauge: a gradient arc that sweeps in on mount plus a
// count-up number in the center. Reused by every metric detail hero.

const SANS = "'Inter', system-ui, sans-serif";

interface Props {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  /** Small caption under the number, e.g. "Sleep Index". */
  label?: string;
  gradientFrom?: string;
  gradientTo?: string;
  /** RGB triplet for the arc + number glow (defaults to teal). */
  glowRgb?: string;
}

export default function RadialGauge({
  value,
  max = 100,
  size = 118,
  stroke = 9,
  label,
  gradientFrom = "var(--nura-teal)",
  gradientTo = "var(--nura-sage)",
  glowRgb = "93,204,174",
}: Props) {
  const rawId = useId();
  const gid = `gauge-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Pad the SVG canvas around the ring so the drop-shadow glow fades fully
  // inside the viewport instead of being clipped to a square. The ring keeps
  // its original radius/position; the SVG is offset back by `pad` so the gauge
  // looks identical — only the glow has room to breathe.
  const pad = 16;
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const target = circ * (1 - pct);

  const [offset, setOffset] = useState(circ);
  const [num, setNum] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    // Kick the arc transition shortly after mount so CSS animates it.
    const t = setTimeout(() => setOffset(target), 250);

    // Count-up with an ease-out cubic.
    const dur = 1300;
    let start = 0;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setNum(Math.round(value * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [value, target]);

  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: "rotate(-90deg)", overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={gradientFrom} />
            <stop offset="1" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(235,230,216,0.08)" strokeWidth={stroke} />
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 7px rgba(${glowRgb},0.65))`,
            transition: "stroke-dashoffset 1.3s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{
          fontFamily: SANS, fontSize: Math.round(size * 0.32), fontWeight: 800,
          letterSpacing: "-1.5px", lineHeight: 1, color: "var(--nura-text-primary)",
          textShadow: `0 0 18px rgba(${glowRgb},0.35)`,
        }}>
          {num}
        </span>
        {label && (
          <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--nura-text-tertiary)", marginTop: 2, letterSpacing: "0.5px" }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
