"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRespiratoryDetail, SOURCE_LABEL, type RespiratoryDetail } from "@/lib/dashboardData";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";

// ── Tokens (one violet identity) ──────────────────────────────────────────────
const BG = "var(--nura-bg)";
const SURFACE = "var(--nura-surface)";
const CREAM = "var(--nura-text-primary)";
const VIOLET = "var(--nura-violet)";       // the single violet identity (ring, line, pill, accents)
const VIOLET_LIGHT = "var(--nura-violet-hi)"; // ring gradient light end
const VIOLET_RGB = "var(--nura-violet-rgb)";
const MUTED = "var(--nura-ink-muted)";
const FAINT = "var(--nura-text-tertiary)";
const HAIR = "var(--nura-hairline-strong)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// Built-in example state — rendered whenever real data is missing so the view
// never silently vanishes during development.
const FALLBACK: RespiratoryDetail = {
  source: "oura",
  avg: 14.2,
  baseline: 14.3,
  overnight: [14.4, 14.2, 14.0, 14.3, 14.5, 14.2, 13.9, 14.1, 14.4, 14.6, 14.3, 14.0, 13.8, 14.1, 14.3, 14.2],
  floor: 12,
  ceil: 17,
  ticks: [12, 14, 16],
  band: [12, 16],
  axisLabels: ["11p", "1a", "3a", "5a", "7a"],
  statusLabel: "Normal",
  weekAvg: 14.1,
  baselineRange: [13.5, 15.0],
  sevenNight: [
    { label: "Mon", avg: 14.0 }, { label: "Tue", avg: 14.3 }, { label: "Wed", avg: 13.9 },
    { label: "Thu", avg: 14.1 }, { label: "Fri", avg: 14.2 }, { label: "Sat", avg: 13.9 },
    { label: "Last", avg: 14.2 },
  ],
};

const num = (v: unknown, f: number) => (typeof v === "number" && Number.isFinite(v) ? v : f);
const arr = <T,>(v: T[] | undefined, f: T[]) => (v && v.length ? v : f);

// Resolve the data layer with per-field fallback so a partial/empty payload
// still renders the example state instead of hiding.
function resolve(): { d: RespiratoryDetail; isExample: boolean } {
  let raw: RespiratoryDetail | null = null;
  try { raw = getRespiratoryDetail(); } catch { raw = null; }
  if (!raw) return { d: FALLBACK, isExample: true };
  const d: RespiratoryDetail = {
    source: raw.source ?? FALLBACK.source,
    avg: num(raw.avg, FALLBACK.avg),
    baseline: num(raw.baseline, FALLBACK.baseline),
    overnight: arr(raw.overnight, FALLBACK.overnight),
    floor: num(raw.floor, FALLBACK.floor),
    ceil: num(raw.ceil, FALLBACK.ceil),
    ticks: arr(raw.ticks, FALLBACK.ticks),
    band: raw.band ?? FALLBACK.band,
    axisLabels: arr(raw.axisLabels, FALLBACK.axisLabels),
    statusLabel: raw.statusLabel ?? FALLBACK.statusLabel,
    weekAvg: num(raw.weekAvg, FALLBACK.weekAvg),
    baselineRange: raw.baselineRange ?? FALLBACK.baselineRange,
    sevenNight: arr(raw.sevenNight, FALLBACK.sevenNight),
  };
  const isExample = !raw.overnight?.length || !raw.sevenNight?.length;
  return { d, isExample };
}

const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

// position ∈ [0,1]: 0.5 = band centre, edges → ~0.35 / 0.65, extremes scale out.
function positionFor(avg: number, [lo, hi]: [number, number]): number {
  const centre = (lo + hi) / 2;
  const half = (hi - lo) / 2 || 1;
  return clamp(0.5 + ((avg - centre) / half) * 0.15);
}

function statusFor(p: number) {
  if (p < 0.35) return { word: "Below", summary: "Sitting just below your baseline", pill: "Below your baseline" };
  if (p <= 0.65) return { word: "Steady", summary: "Right on your overnight baseline", pill: "Steady with your baseline" };
  return { word: "Elevated", summary: "Running a touch above your baseline", pill: "Above your baseline" };
}

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function RespiratoryRateDetailPage() {
  const router = useRouter();
  const { d } = resolve();

  const value = d.avg;
  const [bLo, bHi] = d.baselineRange;
  const position = positionFor(value, d.baselineRange);
  const status = statusFor(position);
  const band = `${bLo.toFixed(1)}–${bHi.toFixed(1)}`;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--nura-wash-resp)", color: CREAM, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        * { font-variant-numeric: tabular-nums; }
        .rr-reveal { opacity: 0; transform: translateY(16px); animation: rr-rise .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes rr-rise { to { opacity: 1; transform: none; } }
        .rr-back:hover { color: ${CREAM} !important; }
      `}</style>

      <div style={{
        maxWidth: 392, margin: "0 auto",
        padding: "calc(env(safe-area-inset-top, 0px) + 46px) 16px max(env(safe-area-inset-bottom), 28px)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* 1 — HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="rr-back"
            style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: SURFACE, border: `0.5px solid ${HAIR}`, display: "flex", alignItems: "center", justifyContent: "center", color: CREAM, cursor: "pointer" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Respiratory rate</span>
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: MUTED, textTransform: "uppercase" }}>{SOURCE_LABEL[d.source]}</span>
        </div>

        {/* 2 — HERO ARC GAUGE */}
        <div className="rr-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: VIOLET, marginBottom: 2 }}>{status.word}</div>
          <Gauge value={value} />
          <div style={{ fontSize: 13.5, color: MUTED, textAlign: "center", margin: "2px 0 12px" }}>{status.summary}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, background: "rgba(var(--nura-violet-rgb),0.1)", border: "0.5px solid rgba(var(--nura-violet-rgb),0.38)", fontSize: 12.5, fontWeight: 500, color: CREAM }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: VIOLET, boxShadow: `0 0 8px rgba(${VIOLET_RGB},0.9)` }} />
            {status.pill}
          </div>
        </div>

        {/* 3 — LAST NIGHT */}
        <section className="rr-reveal block" style={blockStyle}>
          <div style={cardHd}>
            <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Last night</span>
            <span style={{ fontSize: 13, color: MUTED }}>avg <b style={{ color: CREAM, fontWeight: 600 }}>{value.toFixed(1)}</b> br/min</span>
          </div>
          <div style={noteStyle}>Each reading through the night, against your baseline range</div>
          <NightChart readings={d.overnight} avg={value} baseline={d.baselineRange} />
          <Legend first="your rate" />
        </section>

        {/* 4 — LAST 7 NIGHTS */}
        <section className="rr-reveal block" style={blockStyle}>
          <div style={cardHd}>
            <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Last 7 nights</span>
            <span style={{ fontSize: 13, color: MUTED }}>avg <b style={{ color: CREAM, fontWeight: 600 }}>{d.weekAvg.toFixed(1)}</b> br/min</span>
          </div>
          <div style={noteStyle}>Each night&apos;s average — every night landed inside your range</div>
          <WeekChart nights={d.sevenNight} baseline={d.baselineRange} />
          <Legend first="nightly avg" />
        </section>

        {/* 5 — BASELINE STRIP */}
        <section className="block" style={{ ...blockStyle, padding: 0, display: "flex" }}>
          <StripCell v={value.toFixed(1)} k="Last night" first />
          <StripCell v={d.weekAvg.toFixed(1)} k="7-night avg" />
          <StripCell v={band} k="Baseline" />
        </section>

        {/* 6 — UNDERSTANDING (shared MetricEducation) */}
        <MetricEducation accent="var(--nura-violet)" title="Understanding your respiratory rate" items={RR_EDU_ITEMS} />

      </div>
    </div>
  );
}

// Educational rows for the shared "Understanding your respiratory rate" section.
const RR_EDU_ITEMS: MetricEducationItem[] = [
  {
    label: "What it is",
    body: "Respiratory rate is how many breaths you take per minute, measured overnight while you're at rest. It's a quiet but sensitive window into how your body is recovering — your nervous system, lungs, and metabolism all shape it.",
  },
  {
    label: "Why it matters",
    body: "A steady overnight breathing rate is a sign your body is at ease. A sudden, sustained rise can be one of the earliest signals something's shifting — illness, poor recovery, stress, or alcohol — often before you feel it.",
  },
  {
    label: "Your number",
    body: "Most healthy adults rest around 12–20 breaths per minute, and overnight it usually sits lower and steady. What matters most is your own baseline staying consistent night to night.",
  },
  {
    label: "What moves it",
    body: "Fever or infection, hard late training, alcohol, heat, stress, and altitude can nudge it up. Good sleep and consistent recovery bring it back down.",
  },
  {
    label: "Keep in mind",
    body: "This is a wellness signal, not a diagnosis. Watch for changes from your normal rather than reacting to any single night.",
  },
];

// ── Shared style fragments ────────────────────────────────────────────────────
const blockStyle: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, padding: "20px 18px 15px" };
const cardHd: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between" };
const noteStyle: React.CSSProperties = { fontSize: 12, color: FAINT, margin: "5px 0 2px", lineHeight: 1.5 };

function Legend({ first }: { first: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 8 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>
        <i style={{ width: 16, height: 2.5, borderRadius: 2, background: VIOLET }} />{first}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>
        <i style={{ width: 14, height: 10, borderRadius: 2, background: "rgba(var(--nura-violet-rgb),0.22)" }} />baseline range
      </span>
    </div>
  );
}

function StripCell({ v, k, first }: { v: string; k: string; first?: boolean }) {
  return (
    <div style={{ flex: 1, padding: "14px 10px", textAlign: "center", borderLeft: first ? "none" : `0.5px solid ${HAIR}` }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: CREAM, letterSpacing: "-0.2px" }}>{v}</div>
      <div style={{ fontSize: 11, color: FAINT, marginTop: 3 }}>{k}</div>
    </div>
  );
}

// ── 2 · HERO RING — full 270° violet load-up ring ────────────────────────────
// A 270° arc (gap at bottom-center): a faint track + a violet gradient fill
// (#b9a0e6 → #d3c2f0) with a soft glow. On mount the fill sweeps from empty up to
// the value while the number counts up 0.0 → value, both over ~1.4s ease-out.
// Fill fraction maps br/min onto an 8–20 range so a normal reading sits partly
// filled. Under prefers-reduced-motion the ring is filled and the number final.
function Gauge({ value }: { value: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `rr-ring-${uid}`;

  const size = 204;
  const stroke = 13;
  const pad = 18; // room for the glow
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, (value - 8) / 12)); // 8–20 br/min → 0–1
  const targetOffset = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const [offset, setOffset] = useState(arcLen); // start empty
  const [shown, setShown] = useState(0); // count up from 0.0
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
    const dur = 1400;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setShown(value * ease(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [value, targetOffset]);

  const trans = reduced ? "none" : "stroke-dashoffset 1400ms cubic-bezier(.2,.7,.2,1)";

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0"  style={{ stopColor: VIOLET }}/>
            <stop offset="1"  style={{ stopColor: VIOLET_LIGHT }}/>
          </linearGradient>
        </defs>
        {/* faint full 270° track */}
        <circle cx={c} cy={c} r={r} fill="none" stroke={`rgba(${VIOLET_RGB},0.14)`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`} />
        {/* violet gradient fill — loads up to the value */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 7px rgba(${VIOLET_RGB},0.55))`, transition: trans }}
        />
      </svg>

      {/* centered content — counting value + unit + label */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: SANS, fontSize: 52, fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1, color: CREAM, textShadow: `0 0 18px rgba(${VIOLET_RGB},0.4)` }}>{shown.toFixed(1)}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 6 }}>br/min</span>
        <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: VIOLET, marginTop: 7 }}>Respiratory Rate</span>
      </div>
    </div>
  );
}

// ── 3 · LAST NIGHT LINE ───────────────────────────────────────────────────────
function NightChart({ readings, avg, baseline }: { readings: number[]; avg: number; baseline: [number, number] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const X0 = 34, X1 = 330;
  const yOf = (v: number) => 30 + (16 - v) * 31;
  const n = readings.length;
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const pts = readings.map((v, i) => [xOf(i), yOf(v)] as const);
  const [bLo, bHi] = baseline;
  const bandY = yOf(bHi), bandH = yOf(bLo) - yOf(bHi);

  const line = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `M ${pts[0][0].toFixed(1)} 140 ` + pts.map((p) => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + ` L ${pts[n - 1][0].toFixed(1)} 140 Z`;
  const last = pts[n - 1];
  const ticks: [string, number, "start" | "middle" | "end"][] = [["11 PM", 34, "start"], ["1 AM", 108, "middle"], ["3 AM", 182, "middle"], ["5 AM", 256, "middle"], ["7 AM", 330, "end"]];

  return (
    <svg viewBox="0 0 340 168" style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 6 }}>
      <defs>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(var(--nura-violet-rgb),var(--nura-area-a30))" />
          <stop offset="100%" stopColor="rgba(var(--nura-violet-rgb),var(--nura-area-a0))" />
        </linearGradient>
      </defs>
      {[16, 15, 14, 13].map((v) => (
        <g key={v}>
          <line x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="rgba(var(--nura-bg-tint-rgb),0.06)" strokeWidth={1} />
          <text x={26} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} style={{ fill: FAINT }}>{v}</text>
        </g>
      ))}
      <rect x={34} y={bandY.toFixed(1)} width={296} height={bandH.toFixed(1)} fill="rgba(var(--nura-violet-rgb),0.12)" />
      <text x={326} y={58} textAnchor="end" fontSize={10} fill="rgba(var(--nura-violet-rgb),0.75)">baseline {bLo.toFixed(1)}–{bHi.toFixed(1)}</text>
      <line x1={X0} y1={yOf(avg).toFixed(1)} x2={X1} y2={yOf(avg).toFixed(1)} stroke="rgba(var(--nura-violet-rgb),0.3)" strokeWidth={1.5} strokeDasharray="3 4" />
      <path d={area} fill={`url(#${uid}-area)`} />
      <path d={line} fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"  style={{ stroke: VIOLET }}/>
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r={4} strokeWidth={2}  style={{ fill: CREAM, stroke: BG }}/>
      <line x1={X0} y1={140} x2={X1} y2={140} stroke="var(--nura-hairline-strong)" strokeWidth={1} />
      {ticks.map(([t, x, a]) => (
        <text key={t} x={x} y={158} textAnchor={a} fontSize={10} style={{ fill: FAINT }}>{t}</text>
      ))}
    </svg>
  );
}

// ── 4 · LAST 7 NIGHTS ─────────────────────────────────────────────────────────
function WeekChart({ nights, baseline }: { nights: { label: string; avg: number }[]; baseline: [number, number] }) {
  const X0 = 34, X1 = 314;
  const yOf = (v: number) => 42 + (15 - v) * 45;
  const n = nights.length;
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const pts = nights.map((p, i) => [xOf(i), yOf(p.avg)] as const);
  const [bLo, bHi] = baseline;
  const bandY = yOf(bHi), bandH = yOf(bLo) - yOf(bHi);

  return (
    <svg viewBox="0 0 340 175" style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 6 }}>
      {[15, 14, 13].map((v) => (
        <g key={v}>
          <line x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="rgba(var(--nura-bg-tint-rgb),0.06)" strokeWidth={1} />
          <text x={26} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} style={{ fill: FAINT }}>{v}</text>
        </g>
      ))}
      <rect x={34} y={bandY.toFixed(1)} width={280} height={bandH.toFixed(1)} fill="rgba(var(--nura-violet-rgb),0.12)" />
      <text x={310} y={39} textAnchor="end" fontSize={10} fill="rgba(var(--nura-violet-rgb),0.75)">baseline {bLo.toFixed(1)}–{bHi.toFixed(1)}</text>
      <polyline points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} fill="none" stroke="rgba(var(--nura-violet-rgb),0.55)" strokeWidth={2} />
      <line x1={X0} y1={146} x2={X1} y2={146} stroke="var(--nura-hairline-strong)" strokeWidth={1} />
      {nights.map((p, i) => {
        const [x, y] = pts[i];
        const isLast = i === n - 1;
        return (
          <g key={i}>
            {isLast ? (
              <>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={5} strokeWidth={2.5}  style={{ fill: CREAM, stroke: BG }}/>
                <text x={x.toFixed(1)} y={(y - 11).toFixed(1)} textAnchor="middle" fontSize={11} fontWeight={600} style={{ fill: CREAM }}>{p.avg.toFixed(1)}</text>
              </>
            ) : (
              <>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={3.5}  style={{ fill: VIOLET }}/>
                <text x={x.toFixed(1)} y={(y - 9).toFixed(1)} textAnchor="middle" fontSize={11} fill="var(--nura-ink-strong)">{p.avg.toFixed(1)}</text>
              </>
            )}
            <text x={x.toFixed(1)} y={162} textAnchor="middle" fontSize={10} style={{ fill: FAINT }}>{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
