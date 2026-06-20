"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { getBloodOxygenDetail, SOURCE_LABEL, type BloodOxygenDetail } from "@/lib/dashboardData";
import { hexA, smooth } from "@/components/dashboard/cardChartHelpers";
import { CYAN, CYAN_SOFT, spo2Status, type SpO2Status } from "@/lib/bloodOxygen";
import BloodOxygenTrends from "@/components/BloodOxygenTrends";

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG = "#0d0d0e";
const SURFACE = "rgba(235,230,216,0.04)";
const CREAM = "#ebe6d8";
const MUTED = "rgba(235,230,216,0.62)";
const FAINT = "rgba(235,230,216,0.45)";
const HAIR = "rgba(235,230,216,0.1)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// Built-in example state — rendered whenever real data is missing so the view
// never silently vanishes during development.
const FALLBACK: BloodOxygenDetail = {
  source: "oura",
  avgPct: 97, lowestPct: 94, lastNight: 97, avg7: 97,
  overnight: [97, 96.8, 95.9, 95.4, 96.2, 97, 96.7, 95.5, 96.2, 97],
  sevenDay: [97, 96, 97, 98, 97, 96, 97],
  thirtyDay: [],
  floor: 90, ceil: 100, ticks: [90, 95, 100], band: [95, 100],
  axisLabels: ["11p", "1a", "3a", "5a", "7a"],
  zoneMin: 88, zoneMax: 100,
  nightlyLows: [], nightlyLowLabels: [],
  statusLabel: "Normal", breathingPill: "Optimal breathing regularity",
};

const num = (v: unknown, f: number) => (typeof v === "number" && Number.isFinite(v) ? v : f);

// Downsample a dense overnight series to ~`target` evenly-spaced points using
// bucket means, so real per-minute SpO2 reads as a calm hourly-ish trend rather
// than per-minute noise. Series already at/under the target pass through.
function downsample(data: number[], target: number): number[] {
  if (data.length <= target) return data;
  const out: number[] = [];
  for (let i = 0; i < target; i++) {
    const start = Math.floor((i * data.length) / target);
    const end = Math.max(Math.floor(((i + 1) * data.length) / target), start + 1);
    const slice = data.slice(start, end);
    out.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return out;
}

function resolve(): BloodOxygenDetail {
  let raw: BloodOxygenDetail | null = null;
  try { raw = getBloodOxygenDetail(); } catch { raw = null; }
  if (!raw) return FALLBACK;
  return {
    ...raw,
    lastNight: num(raw.lastNight, FALLBACK.lastNight),
    avg7: num(raw.avg7, FALLBACK.avg7),
    overnight: raw.overnight?.length ? raw.overnight : FALLBACK.overnight,
    sevenDay: raw.sevenDay?.length ? raw.sevenDay : FALLBACK.sevenDay,
    band: raw.band ?? FALLBACK.band,
  };
}

const SUMMARY: Record<SpO2Status, string> = {
  Normal: "Steady and well-oxygenated overnight",
  Low: "Oxygen ran a little low through the night",
  Concerning: "Oxygen dipped below your normal range",
};

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Last"];

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function BloodOxygenDetailPage() {
  const router = useRouter();
  const d = resolve();
  const status = spo2Status(d.lastNight);
  const [bLo, bHi] = d.band;
  const range = `${bLo}–${bHi}%`;

  const nights = d.sevenDay.map((avg, i, arr) => ({
    avg,
    label: WEEK_LABELS[i] ?? (i === arr.length - 1 ? "Last" : `${arr.length - i}d`),
  }));

  const meansLead: Record<SpO2Status, string> = {
    Normal: "An overnight average at or above 95% means your breathing is oxygenating your blood efficiently while you sleep.",
    Low: "An overnight average in the low-90s means your blood is carrying a little less oxygen than ideal — worth watching.",
    Concerning: "An overnight average below 90% is low enough to discuss with a clinician, especially alongside frequent dips.",
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: CREAM, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        * { font-variant-numeric: tabular-nums; }
        .ox-reveal { opacity: 0; transform: translateY(16px); animation: ox-rise .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes ox-rise { to { opacity: 1; transform: none; } }
        .ox-back:hover { color: ${CREAM} !important; }
      `}</style>

      <div style={{
        maxWidth: 392, margin: "0 auto",
        padding: "calc(env(safe-area-inset-top, 0px) + 46px) 16px max(env(safe-area-inset-bottom), 28px)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* 1 — HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.push("/dashboard")} aria-label="Back to dashboard" className="ox-back"
            style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: SURFACE, border: `0.5px solid ${HAIR}`, display: "flex", alignItems: "center", justifyContent: "center", color: CREAM, cursor: "pointer" }}>
            <Chevron />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Blood oxygen</span>
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: FAINT, textTransform: "uppercase" }}>{SOURCE_LABEL[d.source]}</span>
        </div>

        {/* 2/3 — EYEBROW + RING GAUGE */}
        <div className="ox-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: CYAN_SOFT, marginBottom: 2 }}>{status}</div>
          <RingGauge spo2={d.lastNight} />
        </div>

        {/* 4 — SUMMARY + PILL */}
        <div className="ox-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -4 }}>
          <div style={{ fontSize: 13.5, color: MUTED, textAlign: "center", marginBottom: 12 }}>{SUMMARY[status]}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, fontSize: 12.5, fontWeight: 600, color: CREAM, background: hexA(CYAN, 0.1), border: `0.5px solid ${hexA(CYAN_SOFT, 0.4)}` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: CYAN }} />
            {status} blood oxygen
          </span>
        </div>

        {/* 5/6 — LAST NIGHT + LAST 7 NIGHTS */}
        <section className="ox-reveal" style={{ padding: "4px 2px 0" }}>
          <BloodOxygenTrends />
        </section>

        {/* 7 — STRIP */}
        <section style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, display: "flex" }}>
          <StripCell v={`${d.lastNight}%`} k="Last night" first />
          <StripCell v={`${d.avg7}%`} k="7-night avg" />
          <StripCell v={range} k="Normal" color={CYAN_SOFT} />
        </section>

        {/* 8 — EXPLAINER */}
        <section style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, padding: "4px 18px" }}>
          <Beat label="What it is" first>
            Blood oxygen — <b style={bStyle}>SpO₂</b> — is the percentage of your red blood cells carrying oxygen to your tissues. NŪRA reads it overnight from your Oura ring, when your breathing is steadiest.
          </Beat>
          <Beat label="Your average">
            Last night you averaged <b style={bStyle}>{d.lastNight}%</b>, and across the past week you&apos;ve held a <b style={bStyle}>{d.avg7}%</b> average. For most healthy people, <b style={bStyle}>95%</b> and above is normal.
          </Beat>
          <Beat label="What it means">
            {meansLead[status]} Brief dips into the low 90s now and then are normal; a sustained drop below <b style={bStyle}>95%</b> with frequent dips is worth raising with a clinician.
          </Beat>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 0 4px", borderTop: `0.5px solid ${HAIR}`, fontSize: 11, color: FAINT }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
            <span>Context, not a diagnosis.</span>
          </div>
        </section>

      </div>
    </div>
  );
}

const bStyle: React.CSSProperties = { color: CREAM, fontWeight: 500 };

// ── Shared bits ──────────────────────────────────────────────────────────────
function Legend({ first }: { first: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 8 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>
        <i style={{ width: 16, height: 2.2, borderRadius: 2, background: CYAN }} />{first}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>
        <i style={{ width: 14, height: 10, borderRadius: 2, background: hexA(CYAN, 0.16), border: `0.5px solid ${hexA(CYAN, 0.4)}` }} />normal range (≥95%)
      </span>
    </div>
  );
}

function StripCell({ v, k, first, color }: { v: string; k: string; first?: boolean; color?: string }) {
  return (
    <div style={{ flex: 1, padding: "14px 10px", textAlign: "center", borderLeft: first ? "none" : `0.5px solid ${HAIR}` }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: color ?? CREAM, letterSpacing: "-0.2px" }}>{v}</div>
      <div style={{ fontSize: 11, color: FAINT, marginTop: 3 }}>{k}</div>
    </div>
  );
}

function Beat({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 0", borderTop: first ? "none" : `0.5px solid ${HAIR}` }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: CYAN_SOFT, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.62, color: MUTED }}>{children}</div>
    </div>
  );
}

// ── 3 · Ring gauge ───────────────────────────────────────────────────────────
function RingGauge({ spo2 }: { spo2: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ARC = "M 14 164 A 146 146 0 0 1 306 164";
  const arcPoint = (p: number, r: number): [number, number] => {
    const theta = ((180 - p * 180) * Math.PI) / 180;
    return [160 + r * Math.cos(theta), 164 - r * Math.sin(theta)];
  };
  const pos = Math.max(0, Math.min(1, (spo2 - 88) / 12));
  const [mx, my] = arcPoint(pos, 146);
  const P95 = (95 - 88) / 12;
  const [t1x, t1y] = arcPoint(P95, 138);
  const [t2x, t2y] = arcPoint(P95, 153);
  const [lx, ly] = arcPoint(P95, 164);

  return (
    <svg viewBox="0 0 320 192" style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}-arc`} gradientUnits="userSpaceOnUse" x1="14" y1="0" x2="306" y2="0">
          <stop offset="0%" stopColor="#d96a6a" />
          <stop offset="17%" stopColor="#e0a85a" />
          <stop offset="45%" stopColor="#d9c45e" />
          <stop offset="58%" stopColor="#5fc4cf" />
          <stop offset="100%" stopColor="#4fc4d6" />
        </linearGradient>
      </defs>
      <path d={ARC} fill="none" stroke="rgba(235,230,216,0.06)" strokeWidth={16} strokeLinecap="round" />
      <path d={ARC} fill="none" stroke={`url(#${uid}-arc)`} strokeWidth={14} strokeLinecap="round" />

      {/* 95% threshold tick + label */}
      <line x1={t1x.toFixed(1)} y1={t1y.toFixed(1)} x2={t2x.toFixed(1)} y2={t2y.toFixed(1)} stroke="rgba(235,230,216,0.55)" strokeWidth={1.5} />
      <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" fontSize={9} fill="rgba(235,230,216,0.5)">95</text>

      {/* Marker */}
      <circle cx={mx.toFixed(1)} cy={my.toFixed(1)} r={7} fill={CREAM} stroke={BG} strokeWidth={3.5} />

      {/* Center readout */}
      <text x={160} y={120} textAnchor="middle" fontSize={52} fontWeight={600} letterSpacing={-1} fill={CREAM}>{spo2}%</text>
      <text x={160} y={144} textAnchor="middle" fontSize={12} fill={MUTED}>overnight average</text>

      {/* End labels */}
      <text x={10} y={186} textAnchor="start" fontSize={11} fill="rgba(235,230,216,0.5)">88%</text>
      <text x={310} y={186} textAnchor="end" fontSize={11} fill="rgba(235,230,216,0.5)">100%</text>
    </svg>
  );
}

// ── 5 · Last night smooth chart ──────────────────────────────────────────────
function OvernightChart({ readings, band }: { readings: number[]; band: [number, number] }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // Tall frame (shared with the 7-night chart) — points sit low relative to the
  // 100 line so any above-point value label clears it with comfortable headroom.
  const X0 = 34, X1 = 330, top = 26, bot = 166, LO = 90, HI = 100;
  const yOf = (v: number) => top + (1 - (v - LO) / (HI - LO)) * (bot - top);
  // Calm the trace to ~10 hourly-ish points so dense data never renders as noise.
  const series = downsample(readings, 10);
  const n = series.length;
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const pts: [number, number][] = series.map((v, i) => [xOf(i), yOf(v)]);
  const line = smooth(pts);
  const area = `${line} L ${pts[n - 1][0].toFixed(1)},${bot} L ${pts[0][0].toFixed(1)},${bot} Z`;
  const [bLo, bHi] = band;
  const ticks: [string, number, "start" | "middle" | "end"][] = [["11 PM", 34, "start"], ["1 AM", 108, "middle"], ["3 AM", 182, "middle"], ["5 AM", 256, "middle"], ["7 AM", 330, "end"]];

  return (
    <svg viewBox="0 0 340 196" shapeRendering="geometricPrecision" style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 8 }}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(CYAN, 0.26)} />
          <stop offset="100%" stopColor={hexA(CYAN, 0)} />
        </linearGradient>
      </defs>

      {/* Normal band 95–100 + dashed 95 line */}
      <rect x={X0} y={yOf(bHi).toFixed(1)} width={X1 - X0} height={(yOf(bLo) - yOf(bHi)).toFixed(1)} fill={hexA(CYAN, 0.08)} />
      <line x1={X0} y1={yOf(95)} x2={X1} y2={yOf(95)} stroke={hexA(CYAN, 0.3)} strokeWidth={1} strokeDasharray="2 4" />

      {/* y labels */}
      {[100, 95, 90].map((v) => (
        <text key={v} x={26} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} fill={FAINT}>{v}</text>
      ))}

      {/* Area + smooth line */}
      <path d={area} fill={`url(#${uid}-fill)`} />
      <path d={line} fill="none" stroke={CYAN} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

      {/* Latest point */}
      <circle cx={pts[n - 1][0].toFixed(1)} cy={pts[n - 1][1].toFixed(1)} r={9} fill={hexA(CYAN, 0.16)} />
      <circle cx={pts[n - 1][0].toFixed(1)} cy={pts[n - 1][1].toFixed(1)} r={4.5} fill={CYAN} stroke={BG} strokeWidth={1.8} />

      {/* x axis */}
      {ticks.map(([t, x, a]) => (
        <text key={t} x={x} y={182} textAnchor={a} fontSize={10} fill={FAINT}>{t}</text>
      ))}
    </svg>
  );
}

// ── 6 · Last 7 nights smooth chart ───────────────────────────────────────────
function WeekChart({ nights, band }: { nights: { label: string; avg: number }[]; band: [number, number] }) {
  // Tall frame (shared with the last-night chart) so the highest value label
  // (e.g. 98) clears the 100 line by ~12px; X1 pulled in so the latest label
  // isn't clipped at the right edge.
  const X0 = 34, X1 = 288, top = 26, bot = 166, LO = 90, HI = 100;
  const yOf = (v: number) => top + (1 - (v - LO) / (HI - LO)) * (bot - top);
  const n = nights.length;
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const pts: [number, number][] = nights.map((p, i) => [xOf(i), yOf(p.avg)]);
  const line = smooth(pts);
  const [bLo, bHi] = band;

  return (
    <svg viewBox="0 0 340 196" shapeRendering="geometricPrecision" style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 8 }}>
      <rect x={X0} y={yOf(bHi).toFixed(1)} width={X1 - X0} height={(yOf(bLo) - yOf(bHi)).toFixed(1)} fill={hexA(CYAN, 0.08)} />
      <line x1={X0} y1={yOf(95)} x2={X1} y2={yOf(95)} stroke={hexA(CYAN, 0.3)} strokeWidth={1} strokeDasharray="2 4" />
      {[100, 95, 90].map((v) => (
        <text key={v} x={26} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} fill={FAINT}>{v}</text>
      ))}

      <path d={line} fill="none" stroke={CYAN} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />

      {nights.map((p, i) => {
        const last = i === n - 1;
        const [x, y] = pts[i];
        return (
          <g key={i}>
            {last ? (
              <>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={4.5} fill={CYAN} stroke={BG} strokeWidth={1.8} />
                <text x={x.toFixed(1)} y={(y - 11).toFixed(1)} textAnchor="middle" fontSize={11} fontWeight={700} fill={CYAN}>{p.avg}%</text>
              </>
            ) : (
              <>
                <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={2.6} fill={CYAN} />
                <text x={x.toFixed(1)} y={(y - 9).toFixed(1)} textAnchor="middle" fontSize={9.5} fill={hexA(CYAN, 0.75)}>{p.avg}%</text>
              </>
            )}
            <text x={x.toFixed(1)} y={182} textAnchor="middle" fontSize={10} fill={FAINT}>{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
