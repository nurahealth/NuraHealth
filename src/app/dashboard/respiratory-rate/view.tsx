"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRespiratoryDetail, SOURCE_LABEL, type RespiratoryDetail } from "@/lib/dashboardData";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";
import MetricLineChart from "@/components/dashboard/MetricLineChart";
import {
  AURA, LightRingBase, LightRingEdge, ringArcFill, usePrefersReducedMotion,
} from "@/components/dashboard/chartTheme";
import { useIsLightForm } from "@/lib/themeTokens";
import { useMetricPaint, type MetricPaint } from "@/lib/metricColors";

const SURFACE = "var(--nura-surface)";
const CREAM = "var(--nura-text-primary)";
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
  // The same row of the same map the card reads — which is why this screen can
  // no longer disagree with it about what colour respiratory rate is.
  const paint = useMetricPaint("respiratory-rate");

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

      <div className="mp-col" style={{
        maxWidth: 392, margin: "0 auto",
        padding: "calc(env(safe-area-inset-top, 0px) + 46px) 16px max(env(safe-area-inset-bottom), 28px)",
        display: "flex", flexDirection: "column", gap: 14 }}>

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
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: paint.hex, marginBottom: 2 }}>{status.word}</div>
          <Gauge value={value} paint={paint} />
          <div style={{ fontSize: 13.5, color: MUTED, textAlign: "center", margin: "2px 0 12px" }}>{status.summary}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, background: paint.alpha(0.1), border: `0.5px solid ${paint.alpha(0.38)}`, fontSize: 12.5, fontWeight: 500, color: CREAM }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: paint.hex }} />
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
          <NightChart readings={d.overnight} baseline={d.baselineRange} paint={paint} />
        </section>

        {/* 4 — LAST 7 NIGHTS */}
        <section className="rr-reveal block" style={blockStyle}>
          <div style={cardHd}>
            <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Last 7 nights</span>
            <span style={{ fontSize: 13, color: MUTED }}>avg <b style={{ color: CREAM, fontWeight: 600 }}>{d.weekAvg.toFixed(1)}</b> br/min</span>
          </div>
          <div style={noteStyle}>Each night&apos;s average — every night landed inside your range</div>
          <WeekChart nights={d.sevenNight} baseline={d.baselineRange} paint={paint} />
        </section>

        {/* 5 — BASELINE STRIP */}
        <section className="block" style={{ ...blockStyle, padding: 0, display: "flex" }}>
          <StripCell v={value.toFixed(1)} k="Last night" first />
          <StripCell v={d.weekAvg.toFixed(1)} k="7-night avg" />
          <StripCell v={band} k="Baseline" />
        </section>

        {/* 6 — UNDERSTANDING (shared MetricEducation) */}
        <MetricEducation accent={paint.hex} title="Understanding your respiratory rate" items={RR_EDU_ITEMS} />

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

function StripCell({ v, k, first }: { v: string; k: string; first?: boolean }) {
  return (
    <div style={{ flex: 1, padding: "14px 10px", textAlign: "center", borderLeft: first ? "none" : `0.5px solid ${HAIR}` }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: CREAM, letterSpacing: "-0.2px" }}>{v}</div>
      <div style={{ fontSize: 11, color: FAINT, marginTop: 3 }}>{k}</div>
    </div>
  );
}

// ── 2 · HERO RING ─────────────────────────────────────────────────────────────
// A 270° arc (gap at bottom-center): a faint track + a solid fill in the metric
// colour. On mount the fill sweeps from empty up to the value while the number
// counts up 0.0 → value, both over ~1.4s ease-out. Fill fraction maps br/min
// onto an 8–20 range so a normal reading sits partly filled. Under
// prefers-reduced-motion the ring is filled and the number final.
//
// The gradient and the drop-shadow bloom are gone, along with the numeral's
// coloured text-shadow — see the note on the HRV ring.
function Gauge({ value, paint }: { value: number; paint: MetricPaint }) {
  const lightForm = useIsLightForm();
  const rawUid = useId();
  const ringUid = `rr-ring-${rawUid.replace(/[^a-zA-Z0-9]/g, "")}`;
  const size = 204;
  const stroke = 13;
  // Room for dark's glow and for light's aura falloff. The SVG is offset back
  // by `pad`, so the ring itself does not move either way.
  const pad = 18 + Math.ceil(AURA.blurRing * 2);
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, (value - 8) / 12)); // 8–20 br/min → 0–1
  const targetOffset = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const reduced = usePrefersReducedMotion();
  const [offset, setOffset] = useState(arcLen); // start empty
  const [count, setCount] = useState(0); // count up from 0.0
  const rafRef = useRef(0);

  useEffect(() => {
    // Under reduced motion the effect does nothing and render derives the final
    // values below, rather than setting three pieces of state synchronously in
    // an effect body.
    if (reduced) return;
    const t = setTimeout(() => setOffset(targetOffset), 60);
    const dur = 1400;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setCount(value * ease(p));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    // Backstop — rAF is throttled for background tabs, and a stalled count-up
    // leaves a WRONG number on screen. See the note on the HRV ring.
    const settle = setTimeout(() => setCount(value), dur + 120);
    return () => { clearTimeout(t); clearTimeout(settle); cancelAnimationFrame(rafRef.current); };
  }, [value, targetOffset, reduced]);

  const shownOffset = reduced ? targetOffset : offset;
  const shown = reduced ? value : count;
  const trans = reduced ? "none" : "stroke-dashoffset 1400ms cubic-bezier(.2,.7,.2,1)";

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        {/* Light: the shared ring treatment — gradient, aura and empty track. */}
        {lightForm && (
          <LightRingBase
            uid={ringUid} cx={c} cy={c} r={r} stroke={stroke}
            arcLen={arcLen} circ={circ} offset={shownOffset}
            transition={reduced ? undefined : "stroke-dashoffset 1400ms cubic-bezier(.2,.7,.2,1)"}
          />
        )}

        {/* faint full 270° track */}
        {!lightForm && (
          <circle cx={c} cy={c} r={r} fill="none" stroke={paint.alpha(0.16)} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`} />
        )}
        {/* the fill — solid, loading up to the value */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={lightForm ? ringArcFill(ringUid) : paint.hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={shownOffset}
          style={{ filter: `drop-shadow(0 0 7px ${paint.alpha(0.55)})`, transition: trans }}
        />

        {lightForm && (
          <LightRingEdge cx={c} cy={c} r={r} stroke={stroke} sweep={(arc * Math.PI / 180) * frac} />
        )}
      </svg>

      {/* centered content — counting value + unit + label */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: SANS, fontSize: 52, fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1, color: CREAM }}>{shown.toFixed(1)}</span>
        <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 6 }}>br/min</span>
        <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: paint.hex, marginTop: 7 }}>Respiratory Rate</span>
      </div>
    </div>
  );
}

// ── 3 · LAST NIGHT + 4 · LAST 7 NIGHTS ────────────────────────────────────────
//
// Both were hand-rolled SVGs and both are now the shared MetricLineChart, which
// is the point: an expanded view is a bigger look at the same metric, not a
// different chart. What that fixes here, concretely:
//
//  · COLOUR. The line was --nura-violet while the card was --nura-series, so
//    respiratory rate was purple here and sage there. Both read the map now.
//
//  · GRIDLINE SPACING. The old y scale was hardcoded — `30 + (16 - v) * 31`
//    with ticks at 16/15/14/13 — so the gridlines sat 31 viewBox units apart
//    and the labels sat 8 units from the plot. Because the whole drawing was
//    scaled to the card width, that became ~51px apart with 16px type on
//    desktop and ~32px with 10px type on a phone. The shared chart draws at
//    1:1 and thins its own ticks to a real minimum gap.
//
//  · DEAD MARGINS. The plot ran from x=34 (reserving the left gutter for
//    labels) to x=330 of a 340-wide box, so it used 87% of the card and lost
//    the rest to margin. The gutter is on the right now and the plot starts at
//    the card edge.
//
//  · THE BAND. There were three marks stacked in the same space — a filled
//    12% rect, a dashed average line tinted with the series, and a floating
//    "baseline 13.5–15.0" label — which came out as a murky block. It is one
//    7% band with hairline edges, and the legend names it once.
//
// The two charts differ only in `continuous`: a night of readings is a
// continuous signal and curves; one average per night is discrete and does not,
// because a curve there would invent values between nights that were never
// measured.
function NightChart({
  readings, baseline, paint,
}: { readings: number[]; baseline: [number, number]; paint: MetricPaint }) {
  const clock = useMemo(() => sleepClockLabels(readings.length, 23, 7), [readings.length]);
  return (
    <MetricLineChart
      data={readings}
      color={paint}
      unit="br/min"
      band={baseline}
      seriesLabel="your rate"
      bandLabel="baseline range"
      xLabels={["11p", "1a", "3a", "5a", "7a"]}
      pointLabels={clock}
      format={(v) => v.toFixed(1)}
      height={210}
      ariaLabel={`Overnight respiratory rate, ${readings.length} readings from 11pm to 7am, against a baseline range of ${baseline[0].toFixed(1)} to ${baseline[1].toFixed(1)} breaths per minute.`}
    />
  );
}

function WeekChart({
  nights, baseline, paint,
}: { nights: { label: string; avg: number }[]; baseline: [number, number]; paint: MetricPaint }) {
  return (
    <MetricLineChart
      data={nights.map((n) => n.avg)}
      color={paint}
      unit="br/min"
      band={baseline}
      seriesLabel="nightly avg"
      bandLabel="baseline range"
      xLabels={nights.map((n) => n.label)}
      pointLabels={nights.map((n) => n.label)}
      format={(v) => v.toFixed(1)}
      height={200}
      continuous={false}
      ariaLabel={`Average respiratory rate for each of the last ${nights.length} nights, against a baseline range of ${baseline[0].toFixed(1)} to ${baseline[1].toFixed(1)} breaths per minute.`}
    />
  );
}

/**
 * Clock labels for `n` samples spread evenly across the sleep window, for the
 * tooltip. The overnight trace is 11p→7a, so a point is worth ~30 minutes and
 * "1:45am" is a truer answer than "#12".
 */
function sleepClockLabels(n: number, startHour: number, endHour: number): string[] {
  const span = ((endHour - startHour + 24) % 24) * 60;
  return Array.from({ length: n }, (_, i) => {
    const mins = startHour * 60 + (i / Math.max(1, n - 1)) * span;
    const h = Math.floor(mins / 60) % 24;
    const m = Math.round(mins % 60);
    const ap = h < 12 ? "am" : "pm";
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")}${ap}`;
  });
}
