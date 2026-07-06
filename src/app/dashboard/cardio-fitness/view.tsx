"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getCardioFitnessDetail } from "@/lib/dashboardData";
import { hexA, smooth } from "@/components/dashboard/cardChartHelpers";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";

// ── Tokens ────────────────────────────────────────────────────────────────────
// Gold-only identity — every accent on this page is GOLD; no coral/orange tones.
const BG = "#0d0d0e";
const SURFACE = "rgba(235,230,216,0.04)";
const CREAM = "#ebe6d8";
const MUTED = "rgba(235,230,216,0.62)";
const FAINT = "rgba(235,230,216,0.45)";
const HAIR = "rgba(235,230,216,0.1)";
const SANS = "var(--font-inter), system-ui, sans-serif";

const GOLD = "#e3b765";
const GOLD_RGB = "232,194,102"; // #e8c266 — rich champagne gold for glows
// Hero ring gradient — rich gold ramp (deep amber → bright champagne).
const RING_LO = "#c99a34";
const RING_MID = "#e8c266";
const RING_HI = "#f7dd90";

// Built-in example state — rendered as-is so the view never blanks during
// development with no real data wired in. These are the canonical sample values.
const DATA = {
  source: "Apple Watch",
  vo2: 42,
  unit: "ml/kg·min",
  eyebrow: "Above average",
  // Gauge scale (ml/kg·min) — places the 42 marker comfortably right of center.
  gaugeLo: 25,
  gaugeHi: 55,
  // Last 6 months, oldest → now.
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  trend: [40, 40, 41, 41, 42, 42],
  trendAvg: 41,
};

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function CardioFitnessDetailPage() {
  const router = useRouter();
  // VO₂ value comes from the shared real/dev-fallback source so the detail and
  // the dashboard card always agree; the gauge scale + trend stay local sample.
  const d = { ...DATA, vo2: getCardioFitnessDetail().vo2 };

  return (
    <div style={{ minHeight: "100dvh", background: `radial-gradient(120% 72% at 50% -12%, rgba(232,194,102,0.16), transparent 55%), ${BG}`, color: CREAM, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        * { font-variant-numeric: tabular-nums; }
        .cf-reveal { opacity: 0; transform: translateY(16px); animation: cf-rise .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes cf-rise { to { opacity: 1; transform: none; } }
        .cf-back:hover { color: ${CREAM} !important; }
      `}</style>

      <div style={{
        maxWidth: 392, margin: "0 auto",
        padding: "calc(env(safe-area-inset-top, 0px) + 46px) 16px max(env(safe-area-inset-bottom), 28px)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* 1 — HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.push("/dashboard")} aria-label="Back to dashboard" className="cf-back"
            style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: SURFACE, border: `0.5px solid ${HAIR}`, display: "flex", alignItems: "center", justifyContent: "center", color: CREAM, cursor: "pointer" }}>
            <Chevron />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Cardio fitness</span>
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: FAINT, textTransform: "uppercase" }}>{d.source}</span>
        </div>

        {/* 2/3 — EYEBROW + HERO ARC GAUGE */}
        <div className="cf-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: GOLD, marginBottom: 18 }}>{d.eyebrow}</div>
          <ArcGauge value={d.vo2} lo={d.gaugeLo} hi={d.gaugeHi} unit={d.unit} />
        </div>

        {/* 4 — SUMMARY + 5 — PILL */}
        <div className="cf-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -4 }}>
          <div style={{ fontSize: 13.5, color: MUTED, textAlign: "center", marginBottom: 12, lineHeight: 1.55 }}>
            Your cardio fitness is <b style={{ color: CREAM, fontWeight: 600 }}>above average</b> for your age and sex — one of the strongest single markers of heart and lung health.
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, fontSize: 12.5, fontWeight: 600, color: CREAM, background: hexA(GOLD, 0.1), border: `0.5px solid ${hexA(GOLD, 0.4)}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 8px rgba(${GOLD_RGB},0.9)` }} />
            Above average
          </span>
        </div>

        {/* 6 — LAST 6 MONTHS */}
        <section className="cf-reveal" style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, padding: "16px 16px 14px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: CREAM }}>Last 6 months</span>
            <span style={{ fontSize: 11.5, color: FAINT }}>avg <b style={{ color: GOLD, fontWeight: 600 }}>{d.trendAvg}</b></span>
          </div>
          <TrendChart months={d.months} values={d.trend} avg={d.trendAvg} />
          <Legend />
        </section>

        {/* 7 — EXPLAINER + 8 — FOOTER */}
        <MetricEducation accent={GOLD} title="Understanding your cardio fitness" items={EDU_ITEMS} />

      </div>
    </div>
  );
}

const bStyle: React.CSSProperties = { color: CREAM, fontWeight: 500 };

// Educational rows for the "Understanding your cardio fitness" section.
const EDU_ITEMS: MetricEducationItem[] = [
  {
    label: "What it is",
    body: "VO₂ max is the most oxygen your body can take in and use during all-out exercise, measured in milliliters of oxygen per kg of body weight, per minute. It reflects how well your heart, lungs, blood, and muscles work together, and is the single clearest number for aerobic fitness.",
  },
  {
    label: "Why it matters",
    body: "Cardio fitness is one of the most powerful markers of long-term health. A higher VO₂ max is consistently associated with lower heart-disease risk and a longer, healthier life, while very low fitness tracks with higher all-cause mortality in large studies.",
  },
  {
    label: "Your number",
    body: <><b style={bStyle}>42 ml/kg/min</b> is above average for your age and sex. VO₂ max naturally drifts down about 10% per decade after your 30s, so holding steady or trending up is a real win.</>,
  },
  {
    label: "How to raise it",
    body: <>The biggest lever is consistent aerobic training — a base of easy &ldquo;zone 2&rdquo; cardio you can talk through, plus a weekly dose of harder intervals. Sleep, recovery, and daily movement all feed in. Expect change over months, not days.</>,
  },
  {
    label: "Keep in mind",
    body: <>Apple Watch estimates VO₂ max from heart rate and pace during outdoor walks and runs. It&apos;s a reliable estimate, though not as exact as a lab test — trust the trend over any single reading.</>,
  },
];

// ── Shared bits ──────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 10 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>
        <i style={{ width: 16, height: 2.2, borderRadius: 2, background: GOLD }} />monthly VO₂ max
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>
        <svg width="16" height="2" style={{ overflow: "visible" }}><line x1="0" y1="1" x2="16" y2="1" stroke={GOLD} strokeWidth="2" strokeDasharray="3 3" /></svg>
        above average (≥41)
      </span>
    </div>
  );
}

// ── 3 · Hero ring — full 270° gold load-up ring ──────────────────────────────
// A 270° arc (gap at bottom-center): a faint warm-gold track + a rich gold
// gradient fill with a blurred glow layer behind it. On mount the fill (and its
// glow) sweep from empty up to the value while the VO₂ number counts up 0 →
// value, both over ~1.5s ease-out. Fill fraction keeps the gauge's
// (value − lo) / (hi − lo) mapping (≈0.57 for 42). Under prefers-reduced-motion
// the ring is already filled + glowing and the number is final.
function ArcGauge({ value, lo, hi, unit }: { value: number; lo: number; hi: number; unit: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `cf-ring-${uid}`;

  const size = 204;
  const stroke = 14;
  const pad = 22; // room for the blurred glow + drop-shadow
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  const targetOffset = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const [offset, setOffset] = useState(arcLen); // start empty
  const [shown, setShown] = useState(0); // count up from 0
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setOffset(targetOffset); // already filled
      setShown(value); // final value
      return;
    }
    const t = setTimeout(() => setOffset(targetOffset), 60);
    const dur = 1500;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setShown(Math.round(value * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [value, targetOffset]);

  const trans = reduced ? "none" : "stroke-dashoffset 1500ms cubic-bezier(.2,.7,.2,1)";

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={RING_LO} />
            <stop offset="0.5" stopColor={RING_MID} />
            <stop offset="1" stopColor={RING_HI} />
          </linearGradient>
        </defs>
        {/* faint warm-gold track */}
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(227,183,101,0.15)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`} />
        {/* glow layer — a blurred copy of the fill behind it */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{ filter: "blur(7px)", opacity: 0.55, transition: trans }}
        />
        {/* crisp gold fill on top */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px rgba(${GOLD_RGB},0.5))`, transition: trans }}
        />
      </svg>

      {/* centered content — counting number + unit + label */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: SANS, fontSize: 54, fontWeight: 600, letterSpacing: "-1px", lineHeight: 1, color: CREAM, textShadow: `0 0 18px rgba(${GOLD_RGB},0.45)` }}>{shown}</span>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: MUTED, marginTop: 6 }}>{unit}</span>
        <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginTop: 7 }}>Cardio Fitness</span>
      </div>
    </div>
  );
}

// ── 6 · Last 6 months smooth chart ───────────────────────────────────────────
function TrendChart({ months, values, avg }: { months: string[]; values: number[]; avg: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // Tight y-range so the line sits high in the frame; the gold gradient fills
  // flush beneath it (no horizontal band, no black gap above the line).
  const X0 = 42, X1 = 300, top = 36, bot = 150, LO = 38, HI = 44;
  const yOf = (v: number) => top + (1 - (v - LO) / (HI - LO)) * (bot - top);
  const n = values.length;
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const pts: [number, number][] = values.map((v, i) => [xOf(i), yOf(v)]);
  const line = smooth(pts);
  const area = `${line} L ${pts[n - 1][0].toFixed(1)},${bot} L ${pts[0][0].toFixed(1)},${bot} Z`;

  return (
    <svg viewBox="0 0 340 196" shapeRendering="geometricPrecision" style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 10 }}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(GOLD, 0.3)} />
          <stop offset="100%" stopColor={hexA(GOLD, 0)} />
        </linearGradient>
      </defs>

      {/* Faint per-month vertical guides */}
      {pts.map(([x], i) => (
        <line key={i} x1={x.toFixed(1)} y1={top} x2={x.toFixed(1)} y2={bot} stroke="rgba(235,230,216,0.06)" strokeWidth={1} />
      ))}

      {/* Dashed gold reference line at the 6-month average */}
      <line x1={X0} y1={yOf(avg)} x2={X1} y2={yOf(avg)} stroke={hexA(GOLD, 0.55)} strokeWidth={1} strokeDasharray="3 3" />

      {/* y labels */}
      {[44, 41, 38].map((v) => (
        <text key={v} x={32} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} fill={FAINT}>{v}</text>
      ))}

      {/* Gradient fill flush beneath the line, then the smooth line */}
      <path d={area} fill={`url(#${uid}-fill)`} />
      <path d={line} fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points + value labels (latest bold with a halo dot) */}
      {pts.map(([x, y], i) => {
        const last = i === n - 1;
        return (
          <g key={i}>
            {last ? (
              <>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={9} fill={hexA(GOLD, 0.16)} />
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={4.5} fill={GOLD} stroke={BG} strokeWidth={1.8} />
                <text x={x.toFixed(1)} y={(y - 12).toFixed(1)} textAnchor="middle" fontSize={11} fontWeight={700} fill={GOLD}>{values[i]}</text>
              </>
            ) : (
              <>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={2.6} fill={GOLD} />
                <text x={x.toFixed(1)} y={(y - 9).toFixed(1)} textAnchor="middle" fontSize={9.5} fill={hexA(GOLD, 0.8)}>{values[i]}</text>
              </>
            )}
            <text x={x.toFixed(1)} y={172} textAnchor="middle" fontSize={10} fill={FAINT}>{months[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
