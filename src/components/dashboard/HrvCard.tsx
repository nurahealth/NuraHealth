"use client";

import { useEffect, useRef, useState } from "react";
import { useIsLightForm } from "@/lib/themeTokens";
import { SOURCE_LABEL, type DashboardMetric } from "@/lib/dashboardData";
import { useMetricPaint, type MetricPaint } from "@/lib/metricColors";
import { usePrefersReducedMotion } from "@/components/dashboard/chartTheme";

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const CARD = "var(--nura-card)";
const BORDER = "var(--nura-border)";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

const COUNT_FROM = 30; // count-up start
const FILL_MS = 1300;

// ── Mini HRV ring ────────────────────────────────────────────────────────────
// A compact 270° ring (gap at bottom-center): a faint full-arc track + a fill in
// the HRV teal. Higher HRV is better, so the fill reads strength:
// clamp((hrv − 20) / 70, 0, 1). On mount the fill loads up while the centered
// value counts up (~1.3s), unless prefers-reduced-motion.
//
// The fill was a two-stop gradient with a drop-shadow bloom and the numeral had
// a coloured text-shadow. Both are gone: bloom is a dark-mode device that the
// light theme then had to switch off again in the flattening layer, and a solid
// stroke in the metric's own colour is what makes this ring look like the same
// object as every other mark for this metric.
function HrvMiniRing({ hrv, paint }: { hrv: number; paint: MetricPaint }) {
  const size = 114;
  const stroke = 9;
  const pad = 12; // breathing room so the glow isn't clipped
  const box = size + pad * 2;
  const lightForm = useIsLightForm();
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, (hrv - 20) / 70));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const reduced = usePrefersReducedMotion();
  const [offset, setOffset] = useState(arcLen); // start empty
  const [num, setNum] = useState(COUNT_FROM);
  const rafRef = useRef(0);

  useEffect(() => {
    // Under reduced motion the effect does nothing at all and render derives
    // the final values below, rather than setting three pieces of state
    // synchronously inside the effect (which is a cascading render).
    if (reduced) return;
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
    // Backstop. requestAnimationFrame is throttled for occluded iframes and
    // background tabs, so a count-up that starts and then loses frames can
    // leave a number stranded partway — showing "33 ms" for a 62 ms reading,
    // which is worse than not animating at all. This guarantees the true value
    // lands whether or not another frame ever arrives.
    const settle = setTimeout(() => setNum(hrv), FILL_MS + 120);
    return () => { clearTimeout(t); clearTimeout(settle); cancelAnimationFrame(rafRef.current); };
  }, [target, hrv, reduced]);

  const shownOffset = reduced ? target : offset;
  const shownNum = reduced ? hrv : num;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        {/* faint full 270° track */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={lightForm ? "var(--nura-track-neutral)" : paint.alpha(0.16)}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* the fill — solid, in the metric's colour */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={paint.hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={shownOffset}
          style={{ filter: `drop-shadow(0 0 5px rgba(${paint.rgb},0.6))`, transition: reduced ? "none" : `stroke-dashoffset ${FILL_MS}ms cubic-bezier(.2,.7,.2,1)` }}
        />
      </svg>

      {/* centered content — dead-center in the ring; value + a smaller "ms" inline */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 4, lineHeight: 1 }}>
          <span style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, color: TEXT, letterSpacing: "-0.02em" }}>{shownNum}</span>
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: TEXT_SEC }}>ms</span>
        </div>
      </div>
    </div>
  );
}

// ── HRV card ─────────────────────────────────────────────────────────────────
// Mini-ring tile in the HRV teal, matching the HRV detail page. Reads the
// metric's real value / delta / status (dev fallback if the store ever lacks them).
export default function HrvCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const paint = useMetricPaint(metric.id);
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
        <HrvMiniRing hrv={hrv} paint={paint} />
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER }}>Heart Rate Variability</span>
      </div>

      {/* Below the ring — delta, trend note, status pill */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, marginTop: "auto" }}>
        <span className="nura-trend-ink" style={{
          fontFamily: SANS, fontSize: 12, fontWeight: 600, color: paint.hex,
          display: "inline-flex", alignItems: "center", gap: 3,
        }}>
          <span style={{ color: delta.dir === "up" ? "var(--nura-status-good)" : "var(--nura-status-alert)" }}>{delta.dir === "up" ? "▲" : "▼"}</span> {delta.value} vs last week
        </span>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4, textAlign: "center" }}>{caption}</span>
        <span style={{
          ...EYEBROW, fontSize: 9, color: paint.hex, padding: "3px 8px", borderRadius: 999,
          background: paint.alpha(0.12), border: `0.5px solid ${paint.alpha(0.35)}`,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
