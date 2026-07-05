"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SOURCE_LABEL, type DashboardMetric } from "@/lib/dashboardData";

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";

// Aqua-teal identity — matches the HRV detail page.
const AQUA = "#4fc4d6";
const AQUA_LIGHT = "#7fdce8";
const AQUA_RGB = "79,196,214"; // #4fc4d6

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

const COUNT_FROM = 30; // count-up start
const FILL_MS = 1300;

// ── Mini aqua HRV ring ─────────────────────────────────────────────────────────
// A compact 270° ring (gap at bottom-center): a faint full-arc track + an
// aqua-teal gradient fill (#4fc4d6 → #7fdce8) with a soft glow. Higher HRV is
// better, so the fill is reading strength: clamp((hrv − 20) / 70, 0, 1). On mount
// the fill loads up while the centered value counts up (~1.3s). Motion is disabled
// under prefers-reduced-motion (ring already filled, number at its final value).
function HrvMiniRing({ hrv }: { hrv: number }) {
  const rawId = useId();
  const gid = `hrvcard-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const size = 114;
  const stroke = 9;
  const pad = 12; // breathing room so the glow isn't clipped
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, (hrv - 20) / 70));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const [offset, setOffset] = useState(arcLen); // start empty
  const [num, setNum] = useState(COUNT_FROM);
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setOffset(target); // already filled
      setNum(hrv); // final value, no count-up
      return;
    }
    // Defer one tick so the empty→target fill transition actually plays.
    const t = setTimeout(() => setOffset(target), 60);
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let startTs = 0;
    const stepFn = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / FILL_MS);
      setNum(Math.round(COUNT_FROM + (hrv - COUNT_FROM) * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(stepFn);
    };
    rafRef.current = requestAnimationFrame(stepFn);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [target, hrv]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={AQUA} />
            <stop offset="1" stopColor={AQUA_LIGHT} />
          </linearGradient>
        </defs>
        {/* faint full 270° track */}
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={`rgba(${AQUA_RGB},0.14)`}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* aqua-teal gradient fill */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 5px rgba(${AQUA_RGB},0.6))`,
            transition: reduced ? "none" : `stroke-dashoffset ${FILL_MS}ms cubic-bezier(.2,.7,.2,1)`,
          }}
        />
      </svg>

      {/* centered content — value + a smaller "ms" inline on one line */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, lineHeight: 1 }}>
        <span style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, color: TEXT, letterSpacing: "-0.02em", textShadow: `0 0 14px rgba(${AQUA_RGB},0.3)` }}>{num}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: TEXT_SEC }}>ms</span>
      </div>
    </div>
  );
}

// ── HRV card ─────────────────────────────────────────────────────────────────
// Aqua-teal mini-ring tile matching the HRV detail page. Reads the metric's real
// value / delta / status (dev fallback if the store ever lacks them).
export default function HrvCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const hrv = metric.value ?? 62;
  const delta = metric.delta ?? { value: 8, dir: "up" as const };
  const status = metric.status ?? "optimal";
  const caption = metric.caption ?? "Trending up over the last 7 days";
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div
      className="dash-card"
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      style={{
        background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 18,
        padding: 18, cursor: "pointer", display: "flex", flexDirection: "column",
        minHeight: 248,
      }}
    >
      {/* Header — name (left) · source (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{metric.name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[metric.source]}</span>
      </div>

      {/* Center — mini aqua ring gauge + label directly beneath */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: "10px 0" }}>
        <HrvMiniRing hrv={hrv} />
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER }}>Heart Rate Variability</span>
      </div>

      {/* Below the ring — delta, trend note, status pill */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, marginTop: "auto" }}>
        <span style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 600, color: AQUA,
          display: "inline-flex", alignItems: "center", gap: 3,
        }}>
          {delta.dir === "up" ? "▲" : "▼"} {delta.value} vs last week
        </span>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4, textAlign: "center" }}>{caption}</span>
        <span style={{
          ...EYEBROW, fontSize: 9, color: AQUA, padding: "3px 8px", borderRadius: 999,
          background: `rgba(${AQUA_RGB},0.12)`, border: `0.5px solid rgba(${AQUA_RGB},0.35)`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
