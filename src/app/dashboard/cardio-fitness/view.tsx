"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
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
// Hero arc gradient — gold-only ramp, low → high.
const GOLD_LO = "#c79a52";
const GOLD_MID = "#d8ad5d";
const GOLD_HI = "#e3b765";

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
  const d = DATA;

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: CREAM, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
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
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: GOLD, marginBottom: 2 }}>{d.eyebrow}</div>
          <ArcGauge value={d.vo2} lo={d.gaugeLo} hi={d.gaugeHi} unit={d.unit} />
        </div>

        {/* 4 — SUMMARY + 5 — PILL */}
        <div className="cf-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -4 }}>
          <div style={{ fontSize: 13.5, color: MUTED, textAlign: "center", marginBottom: 12, lineHeight: 1.55 }}>
            Your cardio fitness is <b style={{ color: CREAM, fontWeight: 600 }}>above average</b> for your age and sex — one of the strongest single markers of heart and lung health.
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, fontSize: 12.5, fontWeight: 600, color: CREAM, background: hexA(GOLD, 0.1), border: `0.5px solid ${hexA(GOLD, 0.4)}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
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

// ── 3 · Hero arc gauge ───────────────────────────────────────────────────────
function ArcGauge({ value, lo, hi, unit }: { value: number; lo: number; hi: number; unit: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ARC = "M 14 164 A 146 146 0 0 1 306 164";
  const arcPoint = (p: number, r: number): [number, number] => {
    const theta = ((180 - p * 180) * Math.PI) / 180;
    return [160 + r * Math.cos(theta), 164 - r * Math.sin(theta)];
  };
  const pos = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  const [mx, my] = arcPoint(pos, 146);

  return (
    <svg viewBox="0 0 320 192" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}-arc`} gradientUnits="userSpaceOnUse" x1="14" y1="0" x2="306" y2="0">
          <stop offset="0%" stopColor={GOLD_LO} />
          <stop offset="50%" stopColor={GOLD_MID} />
          <stop offset="100%" stopColor={GOLD_HI} />
        </linearGradient>
      </defs>
      <path d={ARC} fill="none" stroke="rgba(235,230,216,0.06)" strokeWidth={16} strokeLinecap="round" />
      <path d={ARC} fill="none" stroke={`url(#${uid}-arc)`} strokeWidth={14} strokeLinecap="round" />

      {/* Marker at the value */}
      <circle cx={mx.toFixed(1)} cy={my.toFixed(1)} r={7} fill={CREAM} stroke={BG} strokeWidth={3.5} />

      {/* Center readout */}
      <text x={160} y={120} textAnchor="middle" fontSize={52} fontWeight={600} letterSpacing={-1} fill={CREAM}>{value}</text>
      <text x={160} y={144} textAnchor="middle" fontSize={12} fill={MUTED}>{unit}</text>

      {/* End labels */}
      <text x={10} y={186} textAnchor="start" fontSize={11} fill="rgba(235,230,216,0.5)">Low</text>
      <text x={310} y={186} textAnchor="end" fontSize={11} fill="rgba(235,230,216,0.5)">High</text>
    </svg>
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
