"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/components/dashboard/chartTheme";
import { getMetric, getRecoveryDetail, type HrvTrendChart, type RecoveryDriver } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import GlassCard from "@/components/dashboard/GlassCard";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode
const SANS = "var(--font-inter), system-ui, sans-serif";
const bStyle: React.CSSProperties = { color: TEXT, fontWeight: 600 };

// Aqua-teal identity for the whole page (ring, pill, chart, accents).
const AQUA = "var(--nura-aqua)";
const AQUA_LIGHT = "var(--nura-aqua-hi)";
const AQUA_RGB = "var(--nura-aqua-rgb)"; // #4fc4d6
const AQUA_LIGHT_RGB = "var(--nura-aqua-hi-rgb)"; // #7fdce8

// Subtle dark-aqua ambient at the top of the page (fades to near-black).
const AQUA_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(var(--nura-aqua-rgb),0.20), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-aqua-rgb),0.10), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-aqua-rgb),0.10), transparent 60%)";

// Status level → color token. Strong/solid ride the aqua theme; watch stays gold
// as a distinct "keep an eye on it" signal.
const LEVEL_COLOR: Record<RecoveryDriver["level"], string> = {
  strong: AQUA,
  solid: AQUA_LIGHT,
  watch: "var(--nura-good)",
};

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ── Animated aqua-teal HRV ring hero ──────────────────────────────────────────
// A 270° aqua ring (gap at bottom-center): a faint full-arc track + an aqua-teal
// gradient fill that loads up on mount while the centered number counts up from
// ~30 to the value. Higher HRV is better, so the fill represents strength:
// clamp((hrv − 20) / 70, 0, 1) — 62 ms ≈ 60% filled. No ECG/heartbeat: HRV is an
// overnight summary, not a live metric. All motion is disabled under
// prefers-reduced-motion (ring already filled, number at its final value).
const RING_FROM = AQUA;
const RING_TO = AQUA_LIGHT;
const RING_GLOW = AQUA_RGB; // RGB triplet for the aqua glow
const COUNT_FROM = 30; // count-up start
const FILL_MS = 1400;

function HrvRing({ hrv }: { hrv: number }) {
  const rawId = useId();
  const gid = `hrvring-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

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
  // Higher HRV is better, so map 20→90 ms onto 0→1 fill strength.
  const frac = Math.max(0, Math.min(1, (hrv - 20) / 70));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const reduced = usePrefersReducedMotion();
  const [offset, setOffset] = useState(arcLen); // start empty
  const [num, setNum] = useState(COUNT_FROM);
  const rafRef = useRef(0);

  useEffect(() => {
    // Under reduced motion the effect does nothing and render derives the
    // final values below — setting state synchronously inside an effect
    // body is a cascading render.
    if (reduced) return;
    // Defer one tick so the empty→target fill transition actually plays.
    const t = setTimeout(() => setOffset(target), 60);
    // Count the number up from COUNT_FROM → hrv over the same ~1.4s (ease-out).
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let startTs = 0;
    const stepFn = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / FILL_MS);
      setNum(Math.round(COUNT_FROM + (hrv - COUNT_FROM) * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(stepFn);
    };
    rafRef.current = requestAnimationFrame(stepFn);
    // Backstop: rAF is throttled for background tabs, and a stalled count-up
    // leaves a WRONG number on screen rather than merely an unanimated one.
    const settle = setTimeout(() => setNum(hrv), FILL_MS + 120);
    return () => { clearTimeout(t); clearTimeout(settle); cancelAnimationFrame(rafRef.current); };
  }, [target, hrv, reduced]);

  const shownOffset = reduced ? target : offset;
  const shownNum = reduced ? hrv : num;

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
        {/* aqua-teal gradient fill — loads up to the reading strength */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={shownOffset}
          style={{
            
            transition: reduced ? "none" : `stroke-dashoffset ${FILL_MS}ms cubic-bezier(.2,.7,.2,1)` }}
        />
      </svg>

      {/* centered content — count-up number + muted label */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", gap: 7, lineHeight: 1 }}>
          <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-2px", color: TEXT, textShadow: `0 0 18px rgba(${RING_GLOW},0.35)` }}>{shownNum}</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: MUTED }}>ms</span>
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 8 }}>Heart rate variability</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RecoveryDetailPage() {
  const router = useRouter();
  const d = getRecoveryDetail();

  // Hero number + ring fill + count-up target all read the real HRV metric
  // (dev fallback to the recovery payload / 62 if it's ever missing).
  const hrvMetric = getMetric("hrv");
  const hrv = hrvMetric?.value ?? d.hrv.current ?? 62;

  // Status pill, driven by real data: "{Status} · trending {up|down} 7 days".
  const status = hrvMetric?.status ?? "optimal";
  const pillStatus = status.charAt(0).toUpperCase() + status.slice(1);
  const trendUp = (hrvMetric?.delta?.dir ?? "up") === "up";
  const pillText = `${pillStatus} · trending ${trendUp ? "up" : "down"} 7 days`;

  // "Your number" is built from the same HRV data the hero/trend use: the rolling
  // 7-day average and the "7-day baseline" tile — so it tracks live or dev-fallback
  // values rather than a hardcoded number.
  const hrvWeeklyAvg = d.hrv.average;
  const baselineTile = d.tiles.find((t) => /baseline/i.test(t.label));
  const hrvBaseline = baselineTile ? `${baselineTile.value}${baselineTile.unit ?? ""}`.trim() : `${hrvWeeklyAvg} ms`;

  const eduItems: MetricEducationItem[] = [
    {
      label: "What it is",
      body: "Heart rate variability is the tiny variation in time between your heartbeats, measured overnight. Counterintuitively, MORE variability is better — it means your nervous system is relaxed and adaptable rather than stuck in stress mode.",
    },
    {
      label: "Why it matters",
      body: "HRV is one of the best day-to-day readouts of recovery and stress balance. A higher, steady HRV means your body is bouncing back well; a drop often shows up when you're run down, stressed, sick, or under-recovered — sometimes before you feel it.",
    },
    {
      label: "Your number",
      body: <>Your HRV has averaged <b style={bStyle}>{hrvWeeklyAvg} ms</b> overnight this week, around your <b style={bStyle}>{hrvBaseline}</b> baseline. HRV is highly individual — there&apos;s no universal &ldquo;good&rdquo; number, so your own baseline and trend matter far more than comparing to anyone else.</>,
    },
    {
      label: "What moves it",
      body: "Sleep, training load, alcohol, stress, hydration, and illness all move it. Easy days, good sleep, and recovery raise it; hard training, drinking, or a short night drop it the next morning.",
    },
    {
      label: "Keep in mind",
      body: "HRV is noisy night to night — don't over-read a single reading. The multi-day trend against your own baseline is what tells the story.",
    },
  ];

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-hrv)" }}>
      <style>{`
        .r-reveal { opacity: 0; transform: translateY(18px); animation: r-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes r-rise { to { opacity: 1; transform: none; } }
        .r-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={AQUA_AURORA} />

      <div className="mp-col" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="r-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title */}
        <h1 className="r-reveal" style={{ animationDelay: ".05s", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "18px 0 2px" }}>
          HRV &amp; Recovery
        </h1>
        <div className="r-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — animated aqua HRV ring (fill = reading strength) + status pill */}
        <div className="r-reveal" style={{ animationDelay: ".1s", textAlign: "center", padding: "16px 0 2px" }}>
          <HrvRing hrv={hrv} />

          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20,
            padding: "6px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
            color: RING_FROM, border: `1px solid rgba(${RING_GLOW},0.4)` }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: RING_FROM, boxShadow: `0 0 8px rgba(${RING_GLOW},0.9)` }} />
            {pillText}
          </span>
        </div>

        {/* HRV · 7-day trend */}
        <GlassCard className="r-reveal" style={{ animationDelay: ".2s", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>HRV · 7-day trend</span>
            <span style={{ fontSize: 13, color: MUTED }}>
              <b style={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>{d.hrv.current}</b> ms{" "}
              <span style={{ color: RING_FROM, fontWeight: 600 }}>▲ {d.hrv.delta}</span>
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>
            Optimal zone {d.hrv.zone[0]}–{d.hrv.zone[1]} ms · rolling average {d.hrv.average} ms
          </div>

          <HrvZoneChart hrv={d.hrv} />

          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 24, marginTop: 6, fontSize: 10, color: FAINT }}>
            {d.hrv.axisLabels.map((a, i) => <span key={i}>{a}</span>)}
          </div>
        </GlassCard>

        {/* Stat tiles */}
        <div className="r-reveal" style={{ animationDelay: ".28s", display: "flex", gap: 10, marginTop: 14 }}>
          {d.tiles.map((t) => (
            <div key={t.label} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: 13 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: FAINT }}>{t.label}</div>
              <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4, color: t.accent ?? TEXT }}>
                {t.value}{t.unit && <small style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{t.unit}</small>}
              </div>
            </div>
          ))}
        </div>

        {/* What's driving recovery */}
        <GlassCard className="r-reveal" style={{ animationDelay: ".36s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>What&apos;s driving recovery</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 14 }}>Today vs your baseline</div>

          {d.drivers.map((c) => (
            <div key={c.name} style={{ marginTop: 13 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 13.5 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: MUTED }}>
                  {c.detail} · <b style={{ fontWeight: 600, color: LEVEL_COLOR[c.level] }}>{c.qualifier}</b>
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: `rgba(${INK},0.07)`, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${c.pct}%`, borderRadius: 4, background: LEVEL_COLOR[c.level] }} />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="r-reveal" style={{ animationDelay: ".44s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div className="nura-glow" aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${RING_FROM}, ${RING_TO})`, boxShadow: `0 0 16px rgba(${RING_GLOW},0.5)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: AQUA, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>

        {/* Understanding (shared MetricEducation) */}
        <div className="r-reveal" style={{ animationDelay: ".52s", marginTop: 16 }}>
          <MetricEducation accent={AQUA} title="Understanding your HRV" items={eduItems} />
        </div>
      </div>
    </div>
  );
}

// ── HRV zone-band line chart ──────────────────────────────────────────────────
// Shaded optimal-zone band, dashed rolling-average line, an aqua glowing line
// with a glowing dot on each day (the latest day larger + brighter aqua glow),
// and y-axis gridline labels. Mirrors the HRV dashboard-card chart in the reference.
function HrvZoneChart({ hrv }: { hrv: HrvTrendChart }) {
  const { values, zone, average, floor, ceil, gridlines } = hrv;
  const W = 356, H = 150, L = 24, R = 352, top = 10, bot = 120;
  const plotW = R - L;
  const yOf = (v: number) => top + (1 - (v - floor) / (ceil - floor)) * (bot - top);

  const pts = values.map((v, i) => ({ x: L + i * (plotW / (values.length - 1)), y: yOf(v) }));
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = pts.length - 1;

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 2 }}>
      {/* Optimal-zone band */}
      <rect
        x={L} y={yOf(zone[1]).toFixed(1)} width={plotW} height={(yOf(zone[0]) - yOf(zone[1])).toFixed(1)}
        rx={7} fill={`rgba(${AQUA_RGB},0.12)`}
      />
      <text x={R - 5} y={(yOf(zone[1]) + 14).toFixed(1)} textAnchor="end" fontSize={10} fontWeight={600} style={{ fill: AQUA, fontFamily: SANS }}>
        Optimal zone
      </text>

      {/* Gridlines + edge labels */}
      {gridlines.map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g).toFixed(1)} x2={R} y2={yOf(g).toFixed(1)} stroke={`rgba(${INK},0.05)`} />
          <text x={L - 5} y={(yOf(g) + 3).toFixed(1)} textAnchor="end" fontSize={9} fill="var(--nura-ink-a32)" style={{ fontFamily: SANS }}>{g}</text>
        </g>
      ))}

      {/* Rolling-average dashed line */}
      <line x1={L} y1={yOf(average).toFixed(1)} x2={R} y2={yOf(average).toFixed(1)} stroke={`rgba(${INK},0.4)`} strokeWidth={1} strokeDasharray="4 5" />
      <text x={L + 2} y={(yOf(average) - 4).toFixed(1)} fontSize={9} fill="var(--nura-ink-a45)" style={{ fontFamily: SANS }}>avg {average}</text>

      {/* Daily line + dots (aqua) */}
      <polyline points={poly} fill="none" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: AQUA}} />
      {pts.map((p, i) => (
        <circle
          key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={i === last ? 4.4 : 3.4} fill={i === last ? AQUA_LIGHT : AQUA}
        />
      ))}
    </svg>
  );
}
