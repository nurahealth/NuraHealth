"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRestingHrDetail, SOURCE_LABEL, type RestingHrDetail } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import GlassCard from "@/components/dashboard/GlassCard";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";
import { hex, lerp, smooth } from "@/components/dashboard/ActiveEnergyTodayChart";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const INK = "var(--nura-fg-rgb)"; // off-white in dark, near-black in light
const SANS = "var(--font-inter), system-ui, sans-serif";
const bStyle: React.CSSProperties = { color: TEXT, fontWeight: 600 };

// Rose accents — resting HR reads as a warm, calm cardiovascular page.
const ROSE = "var(--nura-rose)";
const ROSE_RGB = "var(--nura-rose-rgb)";
// Teal carries the "better / typical / improving" meaning (low resting HR is good).
const TEAL = "var(--nura-teal)";
const TEAL_RGB = "var(--nura-teal-rgb)";

// Subtle dark-emerald ambient at the top of the page (fades to near-black).
const EMERALD_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(var(--nura-optimal-rgb),0.20), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-optimal-rgb),0.10), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-optimal-rgb),0.10), transparent 60%)";

// ── Chart color helper (teal → sage → rose ramp, by value) ────────────────────
// Defined locally and reusing the shared hex/lerp so it's guaranteed available
// wherever these charts render — a missing colorAt silently blanks a chart.
const WEEK_RAMP = ["var(--nura-teal)", "var(--nura-sage)", "var(--nura-rose)"]; // teal (best/lowest) → sage → rose
function colorAt(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  const [a, b, c] = WEEK_RAMP.map(hex);
  const s = u < 0.5 ? a : b;
  const e = u < 0.5 ? b : c;
  const k = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
  return `rgb(${Math.round(lerp(s[0], e[0], k))},${Math.round(lerp(s[1], e[1], k))},${Math.round(lerp(s[2], e[2], k))})`;
}

type Range = "1D" | "7D" | "30D";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ── Animated resting-HR ring hero ─────────────────────────────────────────────
// A 270° teal gauge (gap at bottom-center): faint full-arc track + a teal
// gradient fill that loads up on mount while the centered number counts up from
// ~38 to the value. Because a LOWER resting rate is better, the fill represents
// reading strength: clamp((90 − bpm) / 52, 0, 1) — 52 bpm ≈ 73% ("excellent").
// No ECG/heartbeat — resting HR is an overnight summary, not a live metric.
// All motion is disabled under prefers-reduced-motion (ring filled, number final).
const RING_FROM = "var(--nura-optimal)";
const RING_TO = "var(--nura-optimal-hi)";
const RING_GLOW = "var(--nura-optimal-rgb)"; // ring track / glow triplet
const COUNT_FROM = 38; // count-up start
const FILL_MS = 1400;

function RestingHrRing({ bpm }: { bpm: number }) {
  const rawId = useId();
  const gid = `rhrring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Geometry — a 270° arc with the gap centered at the bottom (mirrors RadialGauge).
  const size = 236;
  const stroke = 13;
  const pad = 16; // breathing room so the glow isn't clipped
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  // Lower resting HR is better, so map 90→40 onto 0→1 fill strength.
  const frac = Math.max(0, Math.min(1, (90 - bpm) / 52));
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
      setNum(bpm); // final value, no count-up
      return;
    }
    // Defer one tick so the empty→target fill transition actually plays.
    const t = setTimeout(() => setOffset(target), 60);
    // Count the number up from COUNT_FROM → bpm over the same ~1.4s (ease-out).
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let startTs = 0;
    const stepFn = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / FILL_MS);
      setNum(Math.round(COUNT_FROM + (bpm - COUNT_FROM) * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(stepFn);
    };
    rafRef.current = requestAnimationFrame(stepFn);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [target, bpm]);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
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
        {/* teal gradient fill — loads up to the reading strength */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 7px rgba(${RING_GLOW},0.6))`,
            transition: reduced ? "none" : `stroke-dashoffset ${FILL_MS}ms cubic-bezier(.2,.7,.2,1)`,
          }}
        />
      </svg>

      {/* centered content — count-up number + muted label */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 7, lineHeight: 1 }}>
          <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-2px", color: "var(--nura-text-primary)", textShadow: `0 0 18px rgba(${RING_GLOW},0.35)` }}>{num}</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "var(--nura-text-secondary)" }}>bpm</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--nura-text-secondary)", marginTop: 8 }}>Resting heart rate</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RestingHrDetailPage() {
  const router = useRouter();
  const d = getRestingHrDetail();
  const [range, setRange] = useState<Range>("30D");

  const belowBaseline = d.baseline - d.value; // positive = below baseline = good
  const tiles = [
    { label: "7-day avg", value: d.avg7, unit: " bpm" },
    { label: "30-day low", value: d.low30, unit: " bpm" },
    { label: "Baseline", value: d.baseline, unit: " bpm" },
  ];

  // Educational rows for the shared "Understanding your resting heart rate"
  // section. "Your number" is built from the same data the hero/trend use, so it
  // tracks live values (or the dev fallback) rather than a hardcoded number.
  const eduItems: MetricEducationItem[] = [
    {
      label: "What it is",
      body: "Your resting heart rate is how many times your heart beats per minute when you're fully at rest, measured overnight. A lower, steady resting rate usually points to a stronger, more efficient heart.",
    },
    {
      label: "Why it matters",
      body: "It's one of the simplest windows into cardiovascular fitness and recovery. As fitness improves it drifts down, while a sudden climb can flag stress, illness, dehydration, or under-recovery.",
    },
    {
      label: "Your number",
      body: <>This week your resting heart rate has averaged <b style={bStyle}>{d.avg7} bpm</b> overnight, right around your usual <b style={bStyle}>{d.baseline} bpm</b> baseline. For most adults 50–70 bpm is typical, and fitter people often sit lower.</>,
    },
    {
      label: "What moves it",
      body: "Aerobic fitness, sleep, hydration, alcohol, caffeine, stress, and illness all shift it. Training lowers it over weeks; a hard day or short night nudges it up the next morning.",
    },
    {
      label: "Keep in mind",
      body: "One high morning isn't a problem on its own — read it against your own normal and watch the trend.",
    },
  ];

  // Per-range trend config — series, what reference layers to show, axis labels.
  const cfg: Record<Range, { series: number[]; showBand: boolean; showBaseline: boolean; subtitle: string; xLabels: string[] }> = {
    "1D": { series: d.today, showBand: false, showBaseline: false, subtitle: "Resting heart rate through today", xLabels: ["12a", "6a", "12p", "6p", "now"] },
    "7D": { series: d.week, showBand: true, showBaseline: true, subtitle: "Resting heart rate over the past week", xLabels: ["7d ago", "5d", "3d", "yest", "today"] },
    "30D": { series: d.month, showBand: true, showBaseline: true, subtitle: "Resting heart rate over the past month", xLabels: ["30d ago", "3 wks", "2 wks", "last wk", "today"] },
  };
  const active = cfg[range];
  const series = active.series;
  const trendDelta = Math.round(series[0] - series[series.length - 1]); // + = drifted down
  const trendDown = trendDelta >= 0;

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-rhr)",
    }}>
      <style>{`
        .rhr-reveal { opacity: 0; transform: translateY(18px); animation: rhr-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes rhr-rise { to { opacity: 1; transform: none; } }
        .rhr-back:hover { color: var(--nura-text-primary) !important; }
        .rhr-seg { transition: color 160ms, background 160ms; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={EMERALD_AURORA} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="rhr-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title + source tag */}
        <div className="rhr-reveal" style={{ animationDelay: ".05s", margin: "18px 0 2px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.9px", textTransform: "uppercase", color: ROSE, fontWeight: 600, marginBottom: 6 }}>
            {SOURCE_LABEL[d.source]}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Resting Heart Rate</h1>
        </div>
        <div className="rhr-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — animated teal ring (fill = reading strength) + status pill */}
        <div className="rhr-reveal" style={{ animationDelay: ".1s", textAlign: "center", padding: "16px 0 2px" }}>
          <RestingHrRing bpm={d.value} />

          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20,
            padding: "6px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
            color: RING_FROM, border: `1px solid rgba(${RING_GLOW},0.4)`,
          }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: RING_FROM, boxShadow: `0 0 8px rgba(${RING_GLOW},0.9)` }} />
            {d.status} · {belowBaseline} below your baseline
          </span>
        </div>

        {/* Tiles — 7-day avg · 30-day low · Baseline */}
        <div className="rhr-reveal" style={{ animationDelay: ".18s", display: "flex", gap: 10, marginTop: 18 }}>
          {tiles.map((t) => (
            <div key={t.label} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: 13, textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: FAINT }}>{t.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                {t.value}<small style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{t.unit}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Trend — segmented 1D / 7D / 30D, chart re-renders per range */}
        <GlassCard className="rhr-reveal" style={{ animationDelay: ".26s", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Trend</div>
              <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 0" }}>{active.subtitle}</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: trendDown ? RING_FROM : "var(--nura-good)", whiteSpace: "nowrap" }}>
              {trendDown ? "▼" : "▲"} {Math.abs(trendDelta)} bpm
            </span>
          </div>

          {/* Segmented range toggle */}
          <div style={{ display: "inline-flex", marginTop: 12, padding: 3, gap: 2, borderRadius: 999, background: `rgba(${INK},0.06)`, border: `1px solid rgba(${INK},0.08)` }}>
            {(["1D", "7D", "30D"] as Range[]).map((r) => {
              const on = r === range;
              return (
                <button
                  key={r}
                  className="rhr-seg"
                  onClick={() => setRange(r)}
                  style={{
                    border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 14px",
                    fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.3px",
                    background: on ? `rgba(${RING_GLOW},0.18)` : "transparent",
                    color: on ? RING_TO : "var(--nura-ink-a50)",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>

          <TrendChart d={d} series={series} showBand={active.showBand} showBaseline={active.showBaseline} xLabels={active.xLabels} />

          {/* Legend (below the chart, not inside it) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, fontSize: 11.5, color: MUTED }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="nura-glow" style={{ width: 16, height: 0, borderTop: `2.4px solid ${RING_FROM}`, borderRadius: 2, boxShadow: `0 0 5px rgba(${RING_GLOW},0.6)` }} />
              Resting HR
            </span>
            {active.showBand && (
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 16, height: 10, borderRadius: 3, background: `rgba(${TEAL_RGB},0.13)`, border: `1px dashed rgba(${TEAL_RGB},0.7)` }} />
                Typical range
              </span>
            )}
            {active.showBaseline && (
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 16, height: 0, borderTop: `1.5px dashed rgba(${INK},0.5)` }} />
                Baseline {d.baseline}
              </span>
            )}
          </div>

          {/* Insight caption */}
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, paddingTop: 13, borderTop: `1px solid rgba(${INK},0.07)`, fontSize: 12.5, lineHeight: 1.45, color: MUTED }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: ROSE, marginTop: 5, flex: "none", boxShadow: `0 0 7px ${ROSE}` }} />
            <span>
              Your resting HR has drifted <b style={{ color: TEXT, fontWeight: 700 }}>{d.monthTrendDelta} bpm below baseline</b> over the month — a downward trend is a positive sign of improving cardiovascular fitness and recovery, not something to correct.
            </span>
          </div>
        </GlassCard>

        {/* Weekly average */}
        <GlassCard className="rhr-reveal" style={{ animationDelay: ".34s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Weekly average</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 0" }}>Average resting HR over the last 4 weeks</div>

          <WeeklyAvgChart d={d} />
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="rhr-reveal" style={{ animationDelay: ".42s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div className="nura-glow" aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${ROSE}, var(--nura-teal))`, boxShadow: `0 0 16px rgba(${ROSE_RGB},0.5)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: ROSE, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>

        {/* Understanding (shared MetricEducation) */}
        <div className="rhr-reveal" style={{ animationDelay: ".5s", marginTop: 16 }}>
          <MetricEducation accent={TEAL} title="Understanding your resting heart rate" items={eduItems} />
        </div>
      </div>
    </div>
  );
}

// ── Trend chart ───────────────────────────────────────────────────────────────
// A rose resting-HR line with a soft area fill. When showBand, the typical range
// is a teal fill with dashed teal top/bottom edges; when showBaseline, a dashed
// reference line. The lowest point gets a teal dot + "{low} low"; today gets a
// rose dot inside a faint halo ring. Axis ticks + labels render in-SVG. A fixed
// 46–61 bpm scale keeps the plot stable as the range toggles.
function TrendChart({
  d, series, showBand, showBaseline, xLabels,
}: { d: RestingHrDetail; series: number[]; showBand: boolean; showBaseline: boolean; xLabels: string[] }) {
  const rawId = useId();
  const uid = `rhr-trend-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const W = 356, H = 196, L = 24, R = 344, top = 16, bot = 150;
  const plotW = R - L;
  const n = series.length;
  const lo = 46, hi = 61, range = hi - lo;
  const xOf = (i: number) => L + (n > 1 ? (i / (n - 1)) * plotW : 0);
  const yOf = (v: number) => top + (1 - (v - lo) / range) * (bot - top);

  const pts: [number, number][] = series.map((v, i) => [xOf(i), yOf(v)]);
  const line = smooth(pts);
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${bot.toFixed(1)} L${pts[0][0].toFixed(1)},${bot.toFixed(1)} Z`;

  let lowIdx = 0;
  series.forEach((v, i) => { if (v < series[lowIdx]) lowIdx = i; });
  const lowV = series[lowIdx];
  const [lowX, lowY] = pts[lowIdx];
  const [todayX, todayY] = pts[n - 1];

  const bandTop = yOf(d.typicalRange[1]);
  const bandBot = yOf(d.typicalRange[0]);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 12 }}>
      <defs>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${RING_GLOW},var(--nura-area-a28))`} />
          <stop offset="100%" stopColor={`rgba(${RING_GLOW},var(--nura-area-a0))`} />
        </linearGradient>
      </defs>

      {/* Typical-range band — teal fill + dashed teal top/bottom edges (no label) */}
      {showBand && (
        <>
          <rect x={L} y={bandTop.toFixed(1)} width={plotW} height={(bandBot - bandTop).toFixed(1)} fill={`rgba(${TEAL_RGB},0.13)`} />
          <line x1={L} x2={R} y1={bandTop.toFixed(1)} y2={bandTop.toFixed(1)} stroke={`rgba(${TEAL_RGB},0.6)`} strokeWidth={1} strokeDasharray="4 4" />
          <line x1={L} x2={R} y1={bandBot.toFixed(1)} y2={bandBot.toFixed(1)} stroke={`rgba(${TEAL_RGB},0.6)`} strokeWidth={1} strokeDasharray="4 4" />
        </>
      )}

      {/* Y gridlines + edge labels */}
      {d.monthGridlines.map((g) => (
        <g key={g}>
          <line x1={L} x2={R} y1={yOf(g).toFixed(1)} y2={yOf(g).toFixed(1)} stroke={`rgba(${INK},0.06)`} strokeWidth={1} />
          <text x={L - 6} y={(yOf(g) + 3).toFixed(1)} textAnchor="end" fontSize={9} fill="var(--nura-ink-a32)" style={{ fontFamily: SANS }}>{g}</text>
        </g>
      ))}

      {/* Dashed baseline reference (no inline text) */}
      {showBaseline && (
        <line x1={L} x2={R} y1={yOf(d.baseline).toFixed(1)} y2={yOf(d.baseline).toFixed(1)} stroke={`rgba(${INK},0.4)`} strokeWidth={1} strokeDasharray="4 5" />
      )}

      {/* Area fill + rose line */}
      <path d={area} fill={`url(#${uid}-area)`} />
      <path d={line} fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: RING_FROM, filter: `drop-shadow(0 0 4px rgba(${RING_GLOW},0.55))` }} />

      {/* Lowest point — teal dot + label */}
      <circle cx={lowX.toFixed(1)} cy={lowY.toFixed(1)} r={3.4} style={{ fill: TEAL, filter: `drop-shadow(0 0 6px rgba(${TEAL_RGB},0.9))` }} />
      <text x={lowX.toFixed(1)} y={(lowY + 15).toFixed(1)} textAnchor="middle" fontSize={9.5} fontWeight={700} style={{ fill: TEAL, fontFamily: SANS }}>{lowV} low</text>

      {/* Today — teal dot inside a faint halo ring */}
      <circle cx={todayX.toFixed(1)} cy={todayY.toFixed(1)} r={8} fill="none" stroke={`rgba(${RING_GLOW},0.35)`} strokeWidth={1.5} />
      <circle cx={todayX.toFixed(1)} cy={todayY.toFixed(1)} r={3.6} style={{ fill: RING_TO, filter: `drop-shadow(0 0 6px rgba(${RING_GLOW},0.95))` }} />

      {/* X-axis labels (in-SVG so they align with the gutter) */}
      {xLabels.map((lab, i) => {
        const f = i / (xLabels.length - 1);
        const x = L + f * plotW;
        const anchor = i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle";
        return (
          <text key={lab} x={x.toFixed(1)} y={(bot + 18).toFixed(1)} textAnchor={anchor} fontSize={9.5} fill="var(--nura-ink-a30)" style={{ fontFamily: SANS, letterSpacing: "0.3px" }}>{lab}</text>
        );
      })}
    </svg>
  );
}

// ── Weekly-average line ─────────────────────────────────────────────────────
// A smooth rose trend line (glow + soft fill) through the last 4 weekly averages.
// Each point is a dot colored along the teal→sage→rose ramp by value; the best
// (lowest) week is a teal dot inside a halo ring. Values above, week labels below.
function WeeklyAvgChart({ d }: { d: RestingHrDetail }) {
  const rawId = useId();
  const uid = `rhr-week-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const W = 356, H = 176, L = 34, R = 322, top = 36, bot = 116;
  const plotW = R - L;
  const labels = ["4 wks", "3 wks", "2 wks", "last"];
  const vals = d.weeklyAvg;
  const n = vals.length;

  const lo = Math.min(...vals) - 3;
  const hi = Math.max(...vals) + 1;
  const range = (hi - lo) || 1;
  const xOf = (i: number) => L + (n > 1 ? (i / (n - 1)) * plotW : 0);
  const yOf = (v: number) => top + (1 - (v - lo) / range) * (bot - top);

  const pts: [number, number][] = vals.map((v, i) => [xOf(i), yOf(v)]);
  const line = smooth(pts);
  const area = `${line} L${pts[n - 1][0].toFixed(1)},${bot.toFixed(1)} L${pts[0][0].toFixed(1)},${bot.toFixed(1)} Z`;

  const vmin = Math.min(...vals), vmax = Math.max(...vals);
  const vspan = (vmax - vmin) || 1;
  let bestIdx = 0;
  vals.forEach((v, i) => { if (v < vals[bestIdx]) bestIdx = i; });

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 8 }}>
      <defs>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${ROSE_RGB},var(--nura-area-a26))`} />
          <stop offset="100%" stopColor={`rgba(${ROSE_RGB},var(--nura-area-a0))`} />
        </linearGradient>
      </defs>

      {/* Soft fill + glowing rose line */}
      <path d={area} fill={`url(#${uid}-area)`} />
      <path d={line} fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: ROSE, filter: `drop-shadow(0 0 5px rgba(${ROSE_RGB},0.55))` }} />

      {/* Per-point dots, value above, week label below */}
      {vals.map((v, i) => {
        const [x, y] = pts[i];
        const best = i === bestIdx;
        const fill = best ? TEAL : colorAt((v - vmin) / vspan);
        return (
          <g key={i}>
            {best && <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={8} fill="none" stroke={`rgba(${TEAL_RGB},0.4)`} strokeWidth={1.5} />}
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={4} fill={fill} style={{ filter: `drop-shadow(0 0 5px ${best ? `rgba(${TEAL_RGB},0.9)` : `rgba(${ROSE_RGB},0.55)`})` }} />
            <text x={x.toFixed(1)} y={(y - 13).toFixed(1)} textAnchor="middle" fontSize={11} fontWeight={700} fill={best ? TEAL : "var(--nura-text-primary)"} style={{ fontFamily: SANS }}>{v}</text>
            <text x={x.toFixed(1)} y={(bot + 20).toFixed(1)} textAnchor="middle" fontSize={11} fontWeight={best ? 700 : 500} fill={best ? TEXT : FAINT} style={{ fontFamily: SANS }}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
