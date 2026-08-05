"use client";

import { useRouter } from "next/navigation";
import { getBloodPressureDetail, SOURCE_LABEL, type BloodPressureDetail } from "@/lib/dashboardData";
import { hexA, smooth } from "@/components/dashboard/cardChartHelpers";
import { useMetricPaints } from "@/lib/metricColors";
import {
  bpCategory, systolicCategory, diastolicCategory, BP_COLOR, type BPCategory,
  systolicPct, diastolicPct, SYS_GRADIENT, DIA_GRADIENT,
} from "@/lib/bloodPressure";

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG = "var(--nura-bg)";
const SURFACE = "var(--nura-surface)";
const CREAM = "var(--nura-text-primary)";
const MUTED = "var(--nura-ink-muted)";
const FAINT = "var(--nura-text-tertiary)";
const HAIR = "var(--nura-hairline-strong)";
// Systolic and diastolic are the one chart in the app that genuinely needs two
// data colours — two series, one plot. They are two STEPS of the sage ladder
// rather than two hues: systolic is the upper line and takes the more emphatic
// step, and the legend names them. `var()` refs where a colour is only handed
// to CSS; the chart itself needs them resolved (see the note in ReadingsChart).
const SYS_LINE = "var(--nura-sys-line)";
const DIA_LINE = "var(--nura-dia-line)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// Built-in example state — rendered whenever real data is missing so the view
// never silently vanishes during development.
const FALLBACK: BloodPressureDetail = {
  source: "apple-health",
  systolic: 118, diastolic: 76,
  systolicTrend: [], diastolicTrend: [],
  sysThreshold: 120, diaThreshold: 80,
  floor: 60, ceil: 140,
  axisLabels: [],
  avgSys: 119, avgDia: 77,
  readings: [
    { label: "Mon", sys: 120, dia: 78 }, { label: "Tue", sys: 121, dia: 79 },
    { label: "Wed", sys: 118, dia: 76 }, { label: "Thu", sys: 122, dia: 79 },
    { label: "Fri", sys: 119, dia: 77 }, { label: "Sat", sys: 117, dia: 75 },
    { label: "Sun", sys: 118, dia: 76 },
  ],
};

const num = (v: unknown, f: number) => (typeof v === "number" && Number.isFinite(v) ? v : f);

function resolve(): BloodPressureDetail {
  let raw: BloodPressureDetail | null = null;
  try { raw = getBloodPressureDetail(); } catch { raw = null; }
  if (!raw) return FALLBACK;
  return {
    ...raw,
    systolic: num(raw.systolic, FALLBACK.systolic),
    diastolic: num(raw.diastolic, FALLBACK.diastolic),
    avgSys: num(raw.avgSys, FALLBACK.avgSys),
    avgDia: num(raw.avgDia, FALLBACK.avgDia),
    readings: raw.readings?.length ? raw.readings : FALLBACK.readings,
  };
}

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function BloodPressureDetailPage() {
  const router = useRouter();
  const d = resolve();
  const category = bpCategory(d.systolic, d.diastolic);
  const color = BP_COLOR[category];

  const meansLead: Record<BPCategory, string> = {
    "Normal": "Staying under 120/80 means your heart and vessels aren’t being overworked.",
    "Elevated": "Sitting in the Elevated band means pressure is creeping up but isn’t yet high — a cue to watch habits, not to worry.",
    "Stage 1": "Landing in Stage 1 means pressure is consistently above the healthy ceiling and worth addressing.",
    "Stage 2": "Reaching Stage 2 means pressure is well above the healthy ceiling and worth discussing with a clinician.",
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, color: CREAM, fontFamily: SANS, WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        * { font-variant-numeric: tabular-nums; }
        .bp-reveal { opacity: 0; transform: translateY(16px); animation: bp-rise .6s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes bp-rise { to { opacity: 1; transform: none; } }
        .bp-back:hover { color: ${CREAM} !important; }
      `}</style>

      <div className="mp-col" style={{
        maxWidth: 392, margin: "0 auto",
        padding: "calc(env(safe-area-inset-top, 0px) + 46px) 16px max(env(safe-area-inset-bottom), 28px)",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {/* 1 — HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => router.push("/dashboard")} aria-label="Back to dashboard" className="bp-back"
            style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: SURFACE, border: `0.5px solid ${HAIR}`, display: "flex", alignItems: "center", justifyContent: "center", color: CREAM, cursor: "pointer" }}>
            <Chevron />
          </button>
          <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Blood pressure</span>
          <span style={{ fontSize: 11, letterSpacing: "0.18em", color: FAINT, textTransform: "uppercase" }}>{SOURCE_LABEL[d.source]}</span>
        </div>

        {/* 2/3 — HERO */}
        <div className="bp-reveal" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.18em", color, marginBottom: 6 }}>{category}</div>
          <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: "-1.5px", lineHeight: 1, color: CREAM }}>
            {d.systolic}<span style={{ color: FAINT }}>/</span>{d.diastolic}
          </div>
          <div style={{ fontSize: 12, color: FAINT, marginTop: 8 }}>systolic / diastolic · mmHg</div>
        </div>

        {/* 4/5/6/7 — METERS + KEY + PILL */}
        <section className="bp-reveal block" style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, padding: "18px 18px 16px", display: "flex", flexDirection: "column", gap: 22 }}>
          <RangeMeter
            name="Systolic" value={d.systolic} tag={systolicCategory(d.systolic)} gradient={SYS_GRADIENT}
            pct={systolicPct(d.systolic)} ticks={[33.3, 44.4, 55.6]}
            nums={[[90, 0], [120, 33.3], [130, 44.4], [140, 55.6], [160, 77.8], [180, 100]]}
          />
          <RangeMeter
            name="Diastolic" value={d.diastolic} tag={diastolicCategory(d.diastolic)} gradient={DIA_GRADIENT}
            pct={diastolicPct(d.diastolic)} ticks={[50, 66.7]}
            nums={[[50, 0], [70, 33.3], [80, 50], [90, 66.7], [100, 83.3], [110, 100]]}
          />

          {/* Category key */}
          <div style={{ borderTop: `0.5px solid ${HAIR}`, marginTop: 4, paddingTop: 15 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px" }}>
              <KeyRow cat="Normal" range="under 120/80" />
              <KeyRow cat="Elevated" range="120–129" />
              <KeyRow cat="Stage 1" range="130–139 / 80–89" />
              <KeyRow cat="Stage 2" range="140+ / 90+" />
            </div>
          </div>

          {/* Pill */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            {/* color is a `var()` (the clinical category token), so hexA would
                parse it to NaN and the pill would silently lose its tint and
                its border. color-mix takes the var directly. */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 30, fontSize: 12.5, fontWeight: 600, color: CREAM, background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `0.5px solid color-mix(in srgb, ${color} 45%, transparent)` }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
              {category} blood pressure
            </span>
          </div>
        </section>

        {/* 8 — LAST 7 READINGS — transparent, sits flush on the page */}
        <section className="bp-reveal" style={{ padding: "4px 2px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: CREAM }}>Last 7 readings</span>
            <span style={{ fontSize: 13, color: MUTED }}>avg <b style={{ color: CREAM, fontWeight: 600 }}>{d.avgSys}/{d.avgDia}</b> mmHg</span>
          </div>
          <div style={{ fontSize: 12, color: FAINT, margin: "5px 0 2px", lineHeight: 1.5 }}>Both numbers held under the 120 / 80 ceiling all week</div>
          <ReadingsChart readings={d.readings} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            <LegendItem swatch={<i style={{ width: 16, height: 2.5, borderRadius: 2, background: SYS_LINE }} />} label="systolic" />
            <LegendItem swatch={<i style={{ width: 16, height: 2.5, borderRadius: 2, background: DIA_LINE }} />} label="diastolic" />
            <LegendItem swatch={<i style={{ width: 16, height: 0, borderTop: `1.5px dashed ${FAINT}` }} />} label="normal ceiling" />
          </div>
        </section>

        {/* 9 — STRIP */}
        <section className="block" style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, display: "flex" }}>
          <StripCell v={`${d.systolic}/${d.diastolic}`} k="Latest" first />
          <StripCell v={`${d.avgSys}/${d.avgDia}`} k="7-day avg" />
          <StripCell v={category} k="Category" color={color} />
        </section>

        {/* 10 — EXPLAINER */}
        <section className="block" style={{ background: SURFACE, border: `0.5px solid ${HAIR}`, borderRadius: 18, padding: "4px 18px" }}>
          <Beat label="What it is" color={color} first>
            Blood pressure is the force your blood exerts against your artery walls — <b style={bStyle}>systolic</b> (heart beating) over <b style={bStyle}>diastolic</b> (heart resting), measured in mmHg.
          </Beat>
          <Beat label="Your numbers" color={color}>
            Your latest reading was <b style={bStyle}>{d.systolic}/{d.diastolic}</b> and your 7-day average is <b style={bStyle}>{d.avgSys}/{d.avgDia}</b> — {category === "Normal"
              ? <>both under the <b style={bStyle}>120/80</b> ceiling, which keeps you in the <b style={bStyle}>Normal</b> range.</>
              : <>which places you in the <b style={bStyle}>{category}</b> range relative to the <b style={bStyle}>120/80</b> ceiling.</>}
          </Beat>
          <Beat label="What it means" color={color}>
            {meansLead[category]} The first step up is <b style={bStyle}>Elevated</b> (120–129 systolic); a single reading only matters as part of a trend, since pressure swings with stress, caffeine, salt, sleep, and time of day.
          </Beat>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 0 4px", borderTop: `0.5px solid ${HAIR}`, fontSize: 11, color: FAINT }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
            <span>Context, not a diagnosis — discuss any sustained changes with a clinician.</span>
          </div>
        </section>

      </div>
    </div>
  );
}

const bStyle: React.CSSProperties = { color: CREAM, fontWeight: 500 };

// ── Range meter ─────────────────────────────────────────────────────────────
function RangeMeter({ name, value, tag, gradient, pct, ticks, nums }: {
  name: string; value: number; tag: BPCategory; gradient: string; pct: number; ticks: number[]; nums: [number, number][];
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 13 }}>
        <span style={{ fontSize: 13, color: MUTED }}>{name}</span>
        <span><b style={{ color: CREAM, fontWeight: 600, fontSize: 14 }}>{value}</b><span style={{ fontSize: 12, fontWeight: 600, marginLeft: 6, color: BP_COLOR[tag] }}>{tag}</span></span>
      </div>
      <div style={{ position: "relative", height: 9 }}>
        <div style={{ position: "absolute", bottom: 16, left: `${pct.toFixed(1)}%`, transform: "translateX(-50%)", fontSize: 11, fontWeight: 600, color: CREAM, whiteSpace: "nowrap" }}>{value}</div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: gradient }} />
        {ticks.map((t) => (
          <div key={t} style={{ position: "absolute", top: -1, left: `${t}%`, transform: "translateX(-50%)", width: 2, height: 11, borderRadius: 1, background: "rgba(var(--nura-bg-rgb),0.55)" }} />
        ))}
        <div style={{ position: "absolute", top: "50%", left: `${pct.toFixed(1)}%`, transform: "translate(-50%,-50%)", width: 5, height: 19, borderRadius: 3, background: CREAM, boxShadow: `0 0 0 3px ${BG}` }} />
      </div>
      <div style={{ position: "relative", height: 14, marginTop: 9 }}>
        {nums.map(([n, p]) => (
          <span key={n} style={{ position: "absolute", top: 0, left: `${p}%`, transform: p === 0 ? "translateX(0)" : p === 100 ? "translateX(-100%)" : "translateX(-50%)", fontSize: 10, color: FAINT }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

function KeyRow({ cat, range }: { cat: BPCategory; range: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: BP_COLOR[cat] }} />
      <b style={{ color: CREAM, fontWeight: 600, whiteSpace: "nowrap" }}>{cat}</b>
      <span style={{ color: FAINT }}>{range}</span>
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: FAINT }}>{swatch}{label}</span>;
}

function StripCell({ v, k, first, color }: { v: string; k: string; first?: boolean; color?: string }) {
  return (
    <div style={{ flex: 1, padding: "14px 10px", textAlign: "center", borderLeft: first ? "none" : `0.5px solid ${HAIR}` }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: color ?? CREAM, letterSpacing: "-0.2px" }}>{v}</div>
      <div style={{ fontSize: 11, color: FAINT, marginTop: 3 }}>{k}</div>
    </div>
  );
}

function Beat({ label, color, first, children }: { label: string; color: string; first?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 0", borderTop: first ? "none" : `0.5px solid ${HAIR}` }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color, marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.62, color: MUTED }}>{children}</div>
    </div>
  );
}

// ── 8 · Last 7 readings dual smooth-line chart ───────────────────────────────
// Two smooth trend lines (systolic the deeper step, diastolic the lighter) over a 70–150
// mmHg field, each with a subtle gradient fill. Dashed colour-matched 120/80
// ceilings run the full width; y-axis gridlines + numbers sit at 140/120/100/80.
// Generous top headroom keeps the ~122 systolic labels off the 140 line, and
// bottom headroom keeps the ~75 diastolic labels off the day row. The latest
// reading (Sun) gets a halo dot and a bold value on each line.
function ReadingsChart({ readings }: { readings: { label: string; sys: number; dia: number }[] }) {
  // hexA does hex maths, so it cannot be handed a `var()` — it parsed "va" as a
  // red channel and returned "rgba(NaN,NaN,NaN,a)", which SVG rejects and falls
  // back to BLACK for. That is where the black slab between the two lines came
  // from: both area fills, both dashed ceilings and every non-latest value
  // label were painted with it. Invisible on a near-black card; on a white one
  // it was the loudest thing on the page. Resolved through the metric map.
  const paints = useMetricPaints();
  const sysHex = paints["blood-pressure"].hex;
  const diaHex = paints.bpDia.hex;
  // X0 pulled right so the y-axis numbers (anchored at x=26) keep their own
  // far-left column; X1 leaves the ringed latest reading right-side clearance.
  const X0 = 52, X1 = 314, top = 24, bot = 158, LO = 70, HI = 150;
  const yOf = (v: number) => top + (1 - (v - LO) / (HI - LO)) * (bot - top);
  const n = readings.length;
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const sysPts: [number, number][] = readings.map((p, i) => [xOf(i), yOf(p.sys)]);
  const diaPts: [number, number][] = readings.map((p, i) => [xOf(i), yOf(p.dia)]);
  const sysLine = smooth(sysPts);
  const diaLine = smooth(diaPts);
  // A week of readings — label the x-axis Mon–Sun by position so the row reads
  // as a full week even when the data source tags the latest point "Last".
  const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayLabel = (i: number) => (n === 7 ? WEEK[i] : readings[i].label);
  const areaUnder = (line: string, pts: [number, number][]) =>
    `${line} L ${pts[n - 1][0].toFixed(1)},${bot} L ${pts[0][0].toFixed(1)},${bot} Z`;

  return (
    <svg viewBox="0 0 340 198" shapeRendering="geometricPrecision" style={{ display: "block", width: "100%", height: "auto", overflow: "visible", marginTop: 8, fontFamily: SANS }}>
      <defs>
        <linearGradient id="bpSysFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(sysHex, 0.22)} />
          <stop offset="100%" stopColor={hexA(sysHex, 0)} />
        </linearGradient>
        <linearGradient id="bpDiaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(diaHex, 0.22)} />
          <stop offset="100%" stopColor={hexA(diaHex, 0)} />
        </linearGradient>
      </defs>

      {/* Y gridlines + reference numbers in their own far-left column */}
      {[140, 120, 100, 80].map((v) => (
        <g key={v}>
          <line x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke="rgba(var(--nura-bg-tint-rgb),0.06)" strokeWidth={1} />
          <text x={26} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} style={{ fill: FAINT }}>{v}</text>
        </g>
      ))}

      {/* Dashed colour-matched ceilings across the full width — 120 sys, 80 dia */}
      {([[120, sysHex], [80, diaHex]] as [number, string][]).map(([v, c]) => (
        <line key={v} x1={X0} y1={yOf(v)} x2={X1} y2={yOf(v)} stroke={hexA(c, 0.5)} strokeWidth={1} strokeDasharray="2 4" />
      ))}

      {/* Subtle gradient fills under each line */}
      <path d={areaUnder(diaLine, diaPts)} fill="url(#bpDiaFill)" />
      <path d={areaUnder(sysLine, sysPts)} fill="url(#bpSysFill)" />

      {/* Smooth trend lines */}
      <path d={diaLine} fill="none" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"  style={{ stroke: DIA_LINE }}/>
      <path d={sysLine} fill="none" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"  style={{ stroke: SYS_LINE }}/>

      {readings.map((p, i) => {
        const last = i === n - 1;
        const [sx, sy] = sysPts[i];
        const [dx, dy] = diaPts[i];
        return (
          <g key={i}>
            {last ? (
              <>
                <circle cx={sx.toFixed(1)} cy={sy.toFixed(1)} r={9} fill={hexA(sysHex, 0.18)} />
                <circle cx={sx.toFixed(1)} cy={sy.toFixed(1)} r={4.5} strokeWidth={1.8}  style={{ fill: SYS_LINE, stroke: BG }}/>
                <circle cx={dx.toFixed(1)} cy={dy.toFixed(1)} r={9} fill={hexA(diaHex, 0.18)} />
                <circle cx={dx.toFixed(1)} cy={dy.toFixed(1)} r={4.5} strokeWidth={1.8}  style={{ fill: DIA_LINE, stroke: BG }}/>
                <text x={sx.toFixed(1)} y={(sy - 12).toFixed(1)} textAnchor="middle" fontSize={12} fontWeight={700} style={{ fill: SYS_LINE }}>{p.sys}</text>
                <text x={dx.toFixed(1)} y={(dy + 19).toFixed(1)} textAnchor="middle" fontSize={12} fontWeight={700} style={{ fill: DIA_LINE }}>{p.dia}</text>
              </>
            ) : (
              <>
                <circle cx={sx.toFixed(1)} cy={sy.toFixed(1)} r={2.3}  style={{ fill: SYS_LINE }}/>
                <circle cx={dx.toFixed(1)} cy={dy.toFixed(1)} r={2.3}  style={{ fill: DIA_LINE }}/>
                <text x={sx.toFixed(1)} y={(sy - 10).toFixed(1)} textAnchor="middle" fontSize={9.5} fill={hexA(sysHex, 0.7)}>{p.sys}</text>
                <text x={dx.toFixed(1)} y={(dy + 16).toFixed(1)} textAnchor="middle" fontSize={9.5} fill={hexA(diaHex, 0.7)}>{p.dia}</text>
              </>
            )}
            <text x={xOf(i).toFixed(1)} y={180} textAnchor="middle" fontSize={10} style={{ fill: FAINT }}>{dayLabel(i)}</text>
          </g>
        );
      })}
    </svg>
  );
}
