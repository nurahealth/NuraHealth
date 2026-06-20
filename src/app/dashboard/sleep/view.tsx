"use client";

import { useId, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSleepDetail, SOURCE_LABEL, type MetricStatus } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import GlassCard from "@/components/dashboard/GlassCard";
import { hex, light, smooth } from "@/components/dashboard/ActiveEnergyTodayChart";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const INK = "235,230,216"; // warm off-white (matches --nura-fg-rgb in dark)

// Stage palette — shared by the hypnogram, the legend and the HR/HRV shading so
// every night chart speaks the same color language.
const DEEP = "#5aa0e6";
const REM = "#5dccae";
const LIGHT = "#9bb0a5";
const AWAKE = "#d3a253";
const HR_CORAL = "#f0a890";
const DEEP_RGB = "90,160,230";
const REM_RGB = "93,204,174";

// Cool blue→teal aurora pinned to the top, matching the reference.
const SLEEP_AURORA =
  "radial-gradient(80% 50% at 50% -4%, rgba(90,160,230,0.30), transparent 62%)," +
  "radial-gradient(60% 46% at 86% 4%, rgba(93,204,174,0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 10% 14%, rgba(90,160,230,0.12), transparent 60%)";

// Stage code → display + hypnogram bar height (fraction of plot) + color.
const STAGE_META: Record<"D" | "R" | "L" | "A", { short: string; label: string; color: string; h: number }> = {
  D: { short: "Deep", label: "Deep sleep", color: DEEP, h: 0.94 },
  R: { short: "REM", label: "REM sleep", color: REM, h: 0.6 },
  L: { short: "Light", label: "Light sleep", color: LIGHT, h: 0.4 },
  A: { short: "Awake", label: "Awake", color: AWAKE, h: 0.15 },
};
const LEGEND_ORDER: ("D" | "R" | "L" | "A")[] = ["D", "R", "L", "A"];

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ── Status badge (Optimal = teal · Good = gold · Alert = coral) ────────────────
const BADGE: Record<MetricStatus, { color: string; rgb: string; label: string }> = {
  optimal: { color: REM, rgb: REM_RGB, label: "Optimal" },
  good: { color: AWAKE, rgb: "211,162,83", label: "Good" },
  alert: { color: "#e8745a", rgb: "232,116,90", label: "Alert" },
};
function Badge({ status, label }: { status: MetricStatus; label?: string }) {
  const b = BADGE[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", whiteSpace: "nowrap",
      padding: "4px 10px", borderRadius: 8, fontFamily: SANS, fontSize: 11.5, fontWeight: 600,
      color: b.color, background: `rgba(${b.rgb},0.14)`, border: `1px solid rgba(${b.rgb},0.3)`,
    }}>
      {label ?? b.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SleepDetailPage() {
  const router = useRouter();
  const d = getSleepDetail();

  const SEQ = d.night.stageSeq;
  const HR = d.night.heartRate;
  const HRV = d.night.hrv;
  const n = SEQ.length;
  const lateFrom = Math.floor(n * 0.62);
  const argMin = (a: number[], from = 0, to = a.length) => { let bi = from; for (let i = from; i < to; i++) if (a[i] < a[bi]) bi = i; return bi; };
  const argMax = (a: number[], from = 0, to = a.length) => { let bi = from; for (let i = from; i < to; i++) if (a[i] > a[bi]) bi = i; return bi; };

  const hrLowI = argMin(HR);
  const hrHighI = argMax(HR, lateFrom);
  const hrvPeakI = argMax(HRV);
  const hrvLateI = argMin(HRV, lateFrom);

  const hrMarkers: Marker[] = [
    { i: hrLowI, value: HR[hrLowI], label: `${HR[hrLowI]} low · 1:20a`, place: "below" },
    { i: hrHighI, value: HR[hrHighI], label: `${HR[hrHighI]} · rising to wake · 6:10a`, place: "above" },
  ];
  const hrvMarkers: Marker[] = [
    { i: hrvPeakI, value: HRV[hrvPeakI], label: `${HRV[hrvPeakI]} peak · 1:20a`, place: "above" },
    { i: hrvLateI, value: HRV[hrvLateI], label: `${HRV[hrvLateI]} · easing · 6:10a`, place: "below" },
  ];

  const stageByLabel = (label: string) => d.stages.find((s) => s.label === label);

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "radial-gradient(130% 80% at 50% -8%, #0c1f2e 0%, #08131c 34%, var(--nura-bg) 72%)",
    }}>
      <style>{`
        .s-reveal { opacity: 0; transform: translateY(18px); animation: s-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes s-rise { to { opacity: 1; transform: none; } }
        .s-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={SLEEP_AURORA} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
        {/* 1 · Header — back · Sleep · source tag */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="s-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.2px" }}>Sleep</span>
          <span style={{ fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>
            {SOURCE_LABEL[d.source]}
          </span>
        </div>

        {/* 2 · Hero — 270° blue→teal score gauge + pill */}
        <div className="s-reveal" style={{ animationDelay: ".05s", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 2px" }}>
          <RadialGauge
            value={d.score}
            size={208}
            stroke={13}
            arc={270}
            label="Sleep score"
            valueFontSize={50}
            labelGap={8}
            gradientFrom={DEEP}
            gradientTo={REM}
            glowRgb={DEEP_RGB}
          />
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7, marginTop: 12,
            padding: "7px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.3px",
            color: REM, border: `1px solid rgba(${REM_RGB},0.4)`, background: `rgba(${REM_RGB},0.06)`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: REM, boxShadow: `0 0 8px ${REM}` }} />
            {d.heroPill}
          </span>
        </div>

        {/* 3 · Headline tiles — 2×2 with status badges */}
        <div className="s-reveal" style={{ animationDelay: ".12s", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          {d.subMetrics.map((sm) => (
            <div key={sm.label} style={{ background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: "14px 13px", boxShadow: "inset 0 1px 0 rgba(235,230,216,0.08)" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.9px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>{sm.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 10px", letterSpacing: "-0.5px" }}>
                {sm.value}<small style={{ fontSize: 12, fontWeight: 600, color: MUTED, letterSpacing: 0 }}>{sm.unit}</small>
              </div>
              <Badge status={sm.status} />
            </div>
          ))}
        </div>

        {/* 4 · Contributors — KEPT, restyled rows with badge + sage→teal bar */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".2s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>Contributors</h3>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 4px" }}>What shaped tonight&rsquo;s score</div>
          {d.contributors.map((c) => (
            <div key={c.name} style={{ padding: "13px 0", borderTop: `1px solid rgba(${INK},0.07)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                <Badge status={c.status} label={c.statusLabel} />
              </div>
              <div style={{ height: 5, background: `rgba(${INK},0.10)`, borderRadius: 3, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${c.pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${LIGHT}, ${REM})`, boxShadow: `0 0 10px rgba(${REM_RGB},0.4)` }} />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* 5 · Sleep stages — modern hypnogram + duration·% legend */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".28s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>Sleep stages</h3>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 6px" }}>Time in each stage through the night</div>

          <Hypnogram seq={SEQ} />
          <Axis labels={d.night.axisLabels} />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid rgba(${INK},0.07)` }}>
            {LEGEND_ORDER.map((code) => {
              const meta = STAGE_META[code];
              const st = stageByLabel(meta.label);
              return (
                <div key={code} style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: MUTED }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: meta.color }} />
                    {meta.short}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 5, letterSpacing: "-0.3px" }}>
                    {st?.duration}
                  </div>
                  <div style={{ fontSize: 11, color: FAINT, marginTop: 1 }}>{st?.pct}%</div>
                </div>
              );
            })}
          </div>

          {/* Sleep cycles — KEPT existing data, restyled */}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid rgba(${INK},0.07)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: MUTED, marginBottom: 9 }}>
              <span><b style={{ color: TEXT, fontWeight: 600 }}>Sleep cycles</b> · {d.cycles.total}</span>
              <span>{d.cycles.summary}</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {d.cycles.pattern.map((p, i) => (
                <div key={i} style={{
                  flex: 1, height: 22, borderRadius: 7,
                  background: p === "full"
                    ? `linear-gradient(90deg, rgba(${DEEP_RGB},0.5), rgba(${REM_RGB},0.5))`
                    : `rgba(${REM_RGB},0.18)`,
                  boxShadow: p === "full" ? `0 0 12px rgba(${REM_RGB},0.18)` : "none",
                }} />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 6 · Heart rate — nighttime line on the hypnogram timeline */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".36s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>Heart rate</h3>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 6px" }}>Beats per minute while you slept</div>

          <NightLineChart
            data={HR} floor={40} ceil={72} ticks={[45, 55, 65]} unit="bpm"
            stroke={HR_CORAL} glowRgb="240,168,144" avg={52} avgLabel="avg 52"
            seq={SEQ} markers={hrMarkers}
          />
          <Axis labels={d.night.axisLabels} />

          <Caption color={HR_CORAL}>
            Your heart rate bottomed out at <b style={{ color: TEXT }}>44&nbsp;bpm</b> in deep sleep — about 20% below your
            daytime resting rate, a sign of strong recovery. The gradual climb toward 6&nbsp;a.m. is your body preparing to
            wake, which is completely normal.
          </Caption>
        </GlassCard>

        {/* 7 · Heart rate variability — same treatment, teal line */}
        <GlassCard className="s-reveal" style={{ animationDelay: ".44s", marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>Heart rate variability</h3>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 6px" }}>HRV rises with deep, restorative sleep</div>

          <NightLineChart
            data={HRV} floor={30} ceil={100} ticks={[40, 60, 80]} unit="ms"
            stroke={REM} glowRgb={REM_RGB} avg={63} avgLabel="avg 63"
            seq={SEQ} markers={hrvMarkers}
          />
          <Axis labels={d.night.axisLabels} />

          <Caption color={REM}>
            HRV peaked above your baseline during the night&rsquo;s deep sleep — a marker of nervous-system recovery — then
            eased naturally as REM and light sleep took over toward morning.
          </Caption>
        </GlassCard>

        {/* 8 · Vitals tiles */}
        <div className="s-reveal" style={{ animationDelay: ".5s", display: "flex", gap: 10, marginTop: 16 }}>
          {d.vitals.map((v) => (
            <div key={v.label} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: "13px 12px", boxShadow: "inset 0 1px 0 rgba(235,230,216,0.08)" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>{v.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 5, letterSpacing: "-0.4px" }}>
                {v.value}<small style={{ fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: 0 }}>{v.unit}</small>
              </div>
            </div>
          ))}
        </div>

        {/* 9 · NŪRA insight — cool blue/teal treatment */}
        <div className="s-reveal" style={{
          animationDelay: ".56s", marginTop: 16, padding: "18px 20px", borderRadius: 18,
          border: `1px solid rgba(${DEEP_RGB},0.22)`,
          background: `linear-gradient(135deg, rgba(${DEEP_RGB},0.10), rgba(${REM_RGB},0.03))`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "1.4px", color: DEEP, textTransform: "uppercase" }}>NŪRA insight</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8, color: `rgba(${INK},0.85)` }}>{d.insight}</p>
        </div>

        {/* 10 · Understanding (shared MetricEducation) */}
        <div className="s-reveal" style={{ animationDelay: ".62s", marginTop: 16 }}>
          <MetricEducation accent={DEEP} title="Understanding your sleep" items={SLEEP_EDU_ITEMS} />
        </div>
      </div>
    </div>
  );
}

// Educational rows for the shared "Understanding your sleep" section.
const SLEEP_EDU_ITEMS: MetricEducationItem[] = [
  {
    label: "What it is",
    body: "Sleep tracking breaks your night into stages — deep, REM, light, and awake — from movement and heart-rate patterns. Together they show not just how long you slept, but how restorative it actually was.",
  },
  {
    label: "Why it matters",
    body: "Sleep is when your body repairs tissue, consolidates memory, and resets your hormones and immune system. Nearly every other number on this dashboard rides on it — recovery, heart rate, mood, and metabolism all depend on good sleep.",
  },
  {
    label: "Your number",
    body: "Most adults do best with 7–9 hours and a healthy mix of deep and REM. But consistency matters as much as total hours — steady bed and wake times keep your body clock aligned.",
  },
  {
    label: "What moves it",
    body: "Late screens, heavy late meals, stress, and irregular schedules fragment sleep and cut deep and REM. A cool, dark room and a wind-down routine protect it.",
  },
  {
    label: "Keep in mind",
    body: "Stage estimates from a wearable are approximate. Use them to spot patterns across your nights, not to chase a perfect-looking graph.",
  },
];

// ── Shared x-axis row ─────────────────────────────────────────────────────────
function Axis({ labels }: { labels: string[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: 7, fontSize: 10, color: FAINT }}>
      {labels.map((l, i) => <span key={i}>{l}</span>)}
    </div>
  );
}

// ── Caption with a colored lead dot ───────────────────────────────────────────
function Caption({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 9, marginTop: 14, paddingTop: 14, borderTop: `1px solid rgba(${INK},0.07)`, fontSize: 12.5, lineHeight: 1.5, color: MUTED }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0, marginTop: 5 }} />
      <span>{children}</span>
    </div>
  );
}

// ── Hypnogram (modern gradient stage bars) ────────────────────────────────────
// Per-bar vertical gradient colored by stage, deep front-loaded, 1.5px glow on
// deep bars only, faint gridlines, no overlay line or dots.
function Hypnogram({ seq }: { seq: ("D" | "R" | "L" | "A")[] }) {
  const rawId = useId();
  const uid = `hyp-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const W = 356, top = 14, bot = 120, plotH = bot - top;
  const n = seq.length, slot = W / n, bw = Math.min(slot * 0.62, 6.6);
  const jit = (i: number) => Math.sin(i * 12.9898 + 0.6) * 0.045;

  return (
    <svg width="100%" height={140} viewBox={`0 0 ${W} 140`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        {seq.map((s, i) => {
          const c = STAGE_META[s].color;
          const [lr, lg, lb] = light(hex(c), 0.34);
          return (
            <linearGradient key={i} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={`rgb(${lr},${lg},${lb})`} />
              <stop offset="0.55" stopColor={c} />
              <stop offset="1" stopColor={c} stopOpacity="0.4" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Faint gridlines */}
      {[0.28, 0.55, 0.82].map((g, i) => {
        const gy = top + (1 - g) * plotH;
        return <line key={`g${i}`} x1={0} y1={gy.toFixed(1)} x2={W} y2={gy.toFixed(1)} stroke={`rgba(${INK},0.05)`} />;
      })}

      {/* Stage bars */}
      {seq.map((s, i) => {
        const meta = STAGE_META[s];
        const d = Math.max(0.07, Math.min(1, meta.h + jit(i)));
        const h = Math.max(d * plotH, 3);
        const x = i * slot + (slot - bw) / 2;
        const y = bot - h;
        const rx = Math.min(bw / 2, h / 2);
        return (
          <rect
            key={i} x={x.toFixed(1)} y={y.toFixed(1)} width={bw.toFixed(1)} height={h.toFixed(1)}
            rx={rx.toFixed(1)} fill={`url(#${uid}-${i})`}
            style={s === "D" ? { filter: `drop-shadow(0 0 1.5px ${meta.color})` } : undefined}
          />
        );
      })}
    </svg>
  );
}

// ── Night line chart (HR / HRV) ───────────────────────────────────────────────
interface Marker { i: number; value: number; label: string; place: "above" | "below" }

// Maximal runs of `code` in the stage sequence, as [start, length] pairs.
function runsOf(seq: string[], code: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0;
  while (i < seq.length) {
    if (seq[i] === code) { let j = i; while (j < seq.length && seq[j] === code) j++; out.push([i, j - i]); i = j; }
    else i++;
  }
  return out;
}

function NightLineChart({
  data, floor, ceil, ticks, unit, stroke, glowRgb, avg, avgLabel, seq, markers,
}: {
  data: number[]; floor: number; ceil: number; ticks: number[]; unit: string;
  stroke: string; glowRgb: string; avg: number; avgLabel: string;
  seq: ("D" | "R" | "L" | "A")[]; markers: Marker[];
}) {
  const W = 356, top = 16, bot = 104, plotH = bot - top;
  const n = data.length, slot = W / n;
  const y = (v: number) => top + (1 - (v - floor) / (ceil - floor)) * plotH;
  const xMid = (i: number) => i * slot + slot / 2;

  const pts: [number, number][] = data.map((v, i) => [xMid(i), y(v)]);
  const path = smooth(pts);

  // Deep windows (all) + the single longest REM window — derived from the SAME
  // stage sequence the hypnogram uses, so the shading lines up under the bars.
  const deepWins = runsOf(seq, "D");
  const remWins = runsOf(seq, "R");
  const longestDeep = deepWins.reduce<[number, number]>((a, b) => (b[1] > a[1] ? b : a), [0, 0]);
  const longestRem = remWins.reduce<[number, number]>((a, b) => (b[1] > a[1] ? b : a), [0, 0]);
  const winX = (start: number, len: number) => ({ x: start * slot, w: len * slot });

  return (
    <svg width="100%" height={124} viewBox={`0 0 ${W} 124`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      {/* Stage shading behind the line */}
      {deepWins.map(([s, l], i) => {
        const { x, w } = winX(s, l);
        return <rect key={`d${i}`} x={x.toFixed(1)} y={top} width={w.toFixed(1)} height={plotH} fill={`rgba(${DEEP_RGB},0.12)`} rx="2" />;
      })}
      {longestRem[1] > 0 && (() => { const { x, w } = winX(longestRem[0], longestRem[1]); return (
        <rect x={x.toFixed(1)} y={top} width={w.toFixed(1)} height={plotH} fill={`rgba(${REM_RGB},0.12)`} rx="2" />
      ); })()}
      {longestDeep[1] > 0 && (
        <text x={(longestDeep[0] * slot + (longestDeep[1] * slot) / 2).toFixed(1)} y={top + 9} textAnchor="middle" fontFamily={SANS} fontSize={7.5} fontWeight={600} letterSpacing="0.6px" fill={`rgba(${DEEP_RGB},0.85)`}>DEEP SLEEP</text>
      )}
      {longestRem[1] > 0 && (
        <text x={(longestRem[0] * slot + (longestRem[1] * slot) / 2).toFixed(1)} y={top + 9} textAnchor="middle" fontFamily={SANS} fontSize={7.5} fontWeight={600} letterSpacing="0.6px" fill={`rgba(${REM_RGB},0.9)`}>REM</text>
      )}

      {/* Gridlines + right-gutter y labels */}
      {ticks.map((t, i) => {
        const gy = y(t);
        return (
          <g key={`t${i}`}>
            <line x1={0} y1={gy.toFixed(1)} x2={W} y2={gy.toFixed(1)} stroke={`rgba(${INK},0.06)`} />
            <text x={W - 2} y={(gy - 3).toFixed(1)} textAnchor="end" fontFamily={SANS} fontSize={9} fill={`rgba(${INK},0.32)`}>{t}</text>
          </g>
        );
      })}

      {/* Unit label, top-left */}
      <text x={1} y={9} fontFamily={SANS} fontSize={8.5} fontWeight={600} letterSpacing="0.6px" fill={`rgba(${INK},0.36)`}>{unit}</text>

      {/* Faint area + line */}
      <path d={`${path} L ${pts[n - 1][0].toFixed(1)},${bot} L ${pts[0][0].toFixed(1)},${bot} Z`} fill={stroke} opacity={0.07} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px rgba(${glowRgb},0.35))` }} />

      {/* Dashed average line + tag */}
      <line x1={0} y1={y(avg).toFixed(1)} x2={W} y2={y(avg).toFixed(1)} stroke={`rgba(${INK},0.32)`} strokeWidth={1} strokeDasharray="4 5" />
      <text x={2} y={(y(avg) - 4).toFixed(1)} textAnchor="start" fontFamily={SANS} fontSize={9} fontWeight={600} fill={`rgba(${INK},0.5)`}>{avgLabel}</text>

      {/* Markers — night low/high, late climb/ease */}
      {markers.map((m, i) => {
        const mx = xMid(m.i), my = y(m.value);
        const lx = Math.max(44, Math.min(W - 44, mx));
        const ly = m.place === "above" ? my - 8 : my + 14;
        return (
          <g key={`m${i}`}>
            <circle cx={mx.toFixed(1)} cy={my.toFixed(1)} r={2.6} fill={stroke} />
            <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" fontFamily={SANS} fontSize={9} fontWeight={600} fill={stroke}>{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
