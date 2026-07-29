"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBloodOxygenDetail, SOURCE_LABEL, type BloodOxygenDetail } from "@/lib/dashboardData";
import { spo2Status, type SpO2Status } from "@/lib/bloodOxygen";
import BloodOxygenTrends from "@/components/BloodOxygenTrends";

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG = "var(--nura-bg)";
const SURFACE = "var(--nura-surface)";
const CREAM = "var(--nura-text-primary)";
const MUTED = "var(--nura-ink-muted)";
const FAINT = "var(--nura-text-tertiary)";
const HAIR = "var(--nura-hairline-strong)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// Ice / platinum identity — a cool-blue-leaning silver, kept crisp (not washed
// out) on the near-black background via a soft glow.
const ICE = "var(--nura-ice)";
const ICE_LIGHT = "var(--nura-ice-hi)";
const ICE_RGB = "174,191,207";

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

  const meansLead: Record<SpO2Status, string> = {
    Normal: "An overnight average at or above 95% means your breathing is oxygenating your blood efficiently while you sleep.",
    Low: "An overnight average in the low-90s means your blood is carrying a little less oxygen than ideal — worth watching.",
    Concerning: "An overnight average below 90% is low enough to discuss with a clinician, especially alongside frequent dips.",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--nura-wash-spo2)", color: CREAM, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
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
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color: ICE_LIGHT, marginBottom: 10 }}>{status}</div>
          <RingGauge spo2={d.lastNight} />
        </div>

        {/* 4 — SUMMARY + PILL */}
        <div className="ox-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -4 }}>
          <div style={{ fontSize: 13.5, color: MUTED, textAlign: "center", marginBottom: 12 }}>{SUMMARY[status]}</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, fontSize: 12.5, fontWeight: 600, color: CREAM, background: `rgba(${ICE_RGB},0.1)`, border: `0.5px solid rgba(${ICE_RGB},0.4)` }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: ICE_LIGHT, boxShadow: `0 0 8px rgba(${ICE_RGB},0.9)` }} />
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
          <StripCell v={range} k="Normal" color={ICE_LIGHT} />
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
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: ICE_LIGHT, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.62, color: MUTED }}>{children}</div>
    </div>
  );
}

// ── 3 · Ring gauge — clean 270° platinum load-up ring ─────────────────────────
// A 270° arc (gap at bottom-center): faint track + an ice/platinum gradient fill
// with a soft glow. On mount the fill sweeps from empty up to the value while the
// percentage counts up 0 → SpO₂, both over ~1.4s ease-out. Fill fraction maps the
// value onto the 88–100 range: clamp((spo2 − 88) / 12, 0, 1) — 97% ≈ 75%. Under
// prefers-reduced-motion the ring is already filled and the number is final.
function RingGauge({ spo2 }: { spo2: number }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `bo-ring-${uid}`;

  const size = 204;
  const stroke = 13;
  const pad = 16; // room so the glow isn't clipped
  const box = size + pad * 2;
  const r = (size - stroke) / 2;
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const arc = 270;
  const arcLen = circ * (arc / 360);
  const frac = Math.max(0, Math.min(1, (spo2 - 88) / 12));
  const target = arcLen * (1 - frac);
  const rotation = -(90 + arc / 2); // -225° → gap centered at bottom

  const [offset, setOffset] = useState(arcLen); // start empty
  const [shown, setShown] = useState(0); // count up from 0
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReduced(true);
      setOffset(target); // already filled
      setShown(spo2); // final value
      return;
    }
    const t = setTimeout(() => setOffset(target), 60);
    const dur = 1400;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setShown(Math.round(spo2 * ease(p)));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [spo2, target]);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg
        width={box} height={box} viewBox={`0 0 ${box} ${box}`}
        style={{ position: "absolute", top: -pad, left: -pad, transform: `rotate(${rotation}deg)`, overflow: "visible", pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0"  style={{ stopColor: ICE }}/>
            <stop offset="1"  style={{ stopColor: ICE_LIGHT }}/>
          </linearGradient>
        </defs>
        {/* faint full 270° track */}
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={`rgba(${ICE_RGB},0.14)`}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circ}`}
        />
        {/* platinum gradient fill — loads up to the value */}
        <circle
          cx={c} cy={c} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${arcLen} ${circ}`} strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 7px rgba(${ICE_RGB},0.5))`,
            transition: reduced ? "none" : "stroke-dashoffset 1400ms cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </svg>

      {/* centered content — counting % + "overnight average" beneath */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "baseline", lineHeight: 1 }}>
          <span style={{ fontFamily: SANS, fontSize: 52, fontWeight: 600, letterSpacing: "-1px", color: CREAM, textShadow: `0 0 18px rgba(${ICE_RGB},0.3)` }}>{shown}</span>
          <span style={{ fontFamily: SANS, fontSize: 26, fontWeight: 600, color: CREAM }}>%</span>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: MUTED, marginTop: 8 }}>overnight average</div>
      </div>
    </div>
  );
}
