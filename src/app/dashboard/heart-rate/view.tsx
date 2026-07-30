"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { getHeartRateDetail, getMetric } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import GlassCard from "@/components/dashboard/GlassCard";
import MetricChart from "@/components/dashboard/MetricChart";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";
import { useMetricPaint } from "@/lib/metricColors";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const CORAL = "var(--nura-alert)";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode
const SANS = "var(--font-inter), system-ui, sans-serif";
const bStyle: React.CSSProperties = { color: TEXT, fontWeight: 600 };

// Warm coral/amber ambient so this reads as the cardiovascular page.
const CORAL_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(var(--nura-alert-rgb),0.30), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-amber-rgb),0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-alert-rgb),0.12), transparent 60%)";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ── Animated heart-rate ring hero ─────────────────────────────────────────────
// A 270° gauge (gap at bottom-center): a faint full-arc track plus a red
// gradient fill that "loads up" to the current bpm on mount. Inside it sits the
// live number (double-beat pulse), a tracing ECG line, and a blinking Live row.
// bpm is mapped onto a 40–110 range. Every animation is disabled under
// prefers-reduced-motion — the ring then renders already filled.
const RING_FROM = "var(--nura-heart)";
const RING_TO = "var(--nura-heart-hi)";
const RING_GLOW = "var(--nura-heart-rgb)"; // ring track / glow triplet

const ECG_PATH = "M0 15 H40 l5 -1 l4 3 l5 -13 l5 22 l5 -11 l5 0 H124";

function HeartRateRing({ bpm, liveLabel }: { bpm: number; liveLabel: string }) {
  const rawId = useId();
  const gid = `hrring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Geometry — mirrors RadialGauge: a 270° arc with the gap centered at bottom.
  const size = 236;
  const stroke = 13;
  const pad = 16; // breathing room so the glow isn't clipped
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  // Map bpm onto 40–110 → fill fraction (72 ≈ 46%).
  const frac = Math.max(0, Math.min(1, (bpm - 40) / 70));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  // Start empty; animate the fill up to `target` after mount (CSS transition).
  const [offset, setOffset] = useState(arcLen);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setOffset(target); // render already filled, no sweep
      return;
    }
    // Defer one tick so the empty→target transition actually plays.
    const t = setTimeout(() => setOffset(target), 60);
    return () => clearTimeout(t);
  }, [target]);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <style>{`
        @keyframes hrr-pulse {
          0%, 100% { transform: scale(1); }
          12% { transform: scale(1.04); }
          24% { transform: scale(1); }
          36% { transform: scale(1.025); }
          48% { transform: scale(1); }
        }
        @keyframes hrr-ecg { from { stroke-dashoffset: 116; } to { stroke-dashoffset: 0; } }
        @keyframes hrr-blink { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }
        .hrr-num { animation: hrr-pulse 1.1s ease-in-out infinite; transform-origin: center; }
        .hrr-trace { animation: hrr-ecg 1.8s linear infinite; }
        .hrr-dot { animation: hrr-blink 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .hrr-num, .hrr-dot { animation: none !important; transform: none !important; opacity: 1 !important; }
          .hrr-trace { animation: none !important; stroke-dasharray: none !important; stroke-dashoffset: 0 !important; }
        }
      `}</style>

      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0"  style={{ stopColor: RING_FROM }}/>
            <stop offset="1"  style={{ stopColor: RING_TO }}/>
          </linearGradient>
        </defs>
        {/* faint full 270° track */}
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={`rgba(${RING_GLOW},0.14)`}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* red gradient fill — loads up to the current bpm */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 7px rgba(${RING_GLOW},0.6))`,
            transition: reduced ? "none" : "stroke-dashoffset 1.3s cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </svg>

      {/* centered content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9 }}>
        <div className="hrr-num" style={{ display: "inline-flex", alignItems: "baseline", gap: 7, lineHeight: 1 }}>
          <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-2px", color: "var(--nura-text-primary)", textShadow: `0 0 18px rgba(${RING_GLOW},0.35)` }}>{bpm}</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--nura-text-secondary)" }}>bpm</span>
        </div>

        {/* ECG heartbeat line — faint base + a brighter pulse tracing across */}
        <svg width="124" height="30" viewBox="0 0 124 30" fill="none" style={{ display: "block", overflow: "visible" }}>
          <path d={ECG_PATH} stroke={`rgba(${RING_GLOW},0.22)`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path
            className="hrr-trace" d={ECG_PATH}
            strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
            pathLength={100} strokeDasharray="16 100" strokeDashoffset={116}
            style={{ stroke: RING_TO, filter: `drop-shadow(0 0 4px ${RING_TO})` }}
          />
        </svg>

        {/* Live · Apple Watch with a blinking red dot */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, letterSpacing: "1.2px", textTransform: "uppercase", color: "var(--nura-text-secondary)" }}>
          <span className="hrr-dot nura-glow" style={{ width: 7, height: 7, borderRadius: "50%", background: RING_FROM, boxShadow: `0 0 8px ${RING_FROM}` }} />
          {liveLabel}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HeartRateDetailPage() {
  const router = useRouter();
  const d = getHeartRateDetail();
  const chart = getMetric("heart-rate")?.chart; // reuse the dashboard card's chart data
  const paint = useMetricPaint("heart-rate");

  // Educational rows for the shared "Understanding your heart rate" section.
  // "Your number" is built from the same values the hero + tiles use.
  const eduItems: MetricEducationItem[] = [
    {
      label: "What it is",
      body: "This is your heart rate across the whole day — resting stretches, activity spikes, and everything in between — measured continuously by your watch. It shows how your heart responds to everything you do.",
    },
    {
      label: "Why it matters",
      body: "Watching heart rate through the day shows how hard your heart works at rest versus during effort, and how quickly it settles afterward. A heart that climbs efficiently and recovers fast is a sign of good fitness.",
    },
    {
      label: "Your number",
      body: <>Today your heart rate has ranged from <b style={bStyle}>{d.resting} bpm</b> to <b style={bStyle}>{d.max} bpm</b>, averaging around <b style={bStyle}>{d.average} bpm</b>. A typical resting range is <b style={bStyle}>60–100 bpm</b>, climbing into the 100s–150s+ during exercise — and how fast it drops afterward is one of the clearest fitness signals.</>,
    },
    {
      label: "What moves it",
      body: "Activity, stress, caffeine, heat, hydration, sleep, and emotion all push it up moment to moment. Fitness lowers your resting and working rates over time and speeds recovery.",
    },
    {
      label: "Keep in mind",
      body: "Brief spikes during the day are normal and healthy. Look at the overall pattern — how it rises with effort and recovers at rest — rather than any single high reading.",
    },
  ];

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-heart)",
    }}>
      <style>{`
        .hr-reveal { opacity: 0; transform: translateY(18px); animation: hr-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes hr-rise { to { opacity: 1; transform: none; } }
        .hr-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={CORAL_AURORA} />

      <div className="mp-col" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="hr-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title */}
        <h1 className="hr-reveal" style={{ animationDelay: ".05s", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "18px 0 2px" }}>
          Heart Rate
        </h1>
        <div className="hr-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — animated heart-rate ring + triple tiles */}
        <div className="hr-reveal" style={{ animationDelay: ".1s", textAlign: "center", padding: "14px 0 6px" }}>
          <HeartRateRing bpm={d.live} liveLabel={d.liveLabel} />

          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            {[
              { k: "Resting", v: d.resting },
              { k: "Average", v: d.average },
              { k: "Max today", v: d.max },
            ].map((t) => (
              <div key={t.k} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: 13, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: FAINT }}>{t.k}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {t.v}<small style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}> bpm</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today — reuse the dashboard card's vivid intraday chart */}
        <GlassCard className="hr-reveal" style={{ animationDelay: ".2s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Today</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>{d.rangeCaption}</div>
          {chart && <MetricChart data={chart} color={paint} unit="bpm" height={168} />}
        </GlassCard>

        {/* Heart rate zones */}
        <GlassCard className="hr-reveal" style={{ animationDelay: ".28s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Heart rate zones</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>Time spent in each zone today</div>

          {d.zones.map((z) => (
            <div key={z.name} style={{ marginTop: 15 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
                  <i style={{ width: 9, height: 9, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                  {z.name} <span style={{ fontSize: 11.5, color: FAINT }}>{z.range}</span>
                </span>
                <span style={{ fontSize: 12.5, color: MUTED }}>
                  <b style={{ color: TEXT, fontWeight: 600 }}>{z.duration}</b> · {z.pct}%
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: `rgba(${INK},0.07)`, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${z.pct}%`, borderRadius: 4, background: z.color }} />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="hr-reveal" style={{ animationDelay: ".36s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div className="nura-glow" aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-amber),var(--nura-alert))", boxShadow: "0 0 16px rgba(var(--nura-alert-rgb),0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: CORAL, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>

        {/* Understanding (shared MetricEducation) */}
        <div className="hr-reveal" style={{ animationDelay: ".44s", marginTop: 16 }}>
          <MetricEducation accent={CORAL} title="Understanding your heart rate" items={eduItems} />
        </div>
      </div>
    </div>
  );
}
