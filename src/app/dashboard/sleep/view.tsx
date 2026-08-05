"use client";

import { useId, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSleepDetail, SOURCE_LABEL, type MetricStatus } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import GlassCard from "@/components/dashboard/GlassCard";
import { smooth } from "@/components/dashboard/ActiveEnergyTodayChart";
import MetricEducation, { type MetricEducationItem } from "@/components/dashboard/MetricEducation";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const INK = "var(--nura-fg-rgb)"; // off-white in dark, near-black in light

// Stage palette — shared by the hypnogram, the legend and the HR/HRV shading so
// every night chart speaks the same color language.
// All four stages come off the ordered ramp. Light and Awake used to reach
// past it — Light took the brand sage and Awake took --nura-good, the status
// gold — so a hypnogram carried two ramp steps, an accent and a status colour
// in one strip, and the quietest stage of the night was the loudest mark.
const DEEP = "var(--nura-stage-deep)";
const REM = "var(--nura-stage-rem)";
const LIGHT = "var(--nura-stage-light)";
const AWAKE = "var(--nura-stage-awake)";
const DEEP_RGB = "var(--nura-metric-sleep-rgb)";
const REM_RGB = "var(--nura-metric-sleep-rgb)";

// The overnight heart-rate and HRV strips. These used to carry each metric's
// own hue so the strip matched its tab; every metric is the one data colour
// now, and the strips are told apart by their titles and their axes.
const HR_RED = "var(--nura-heart)";
const HR_RED_RGB = "var(--nura-heart-rgb)"; // pill tint
const HR_RED_GLOW = "var(--nura-heart-hi-rgb)"; // lighter step for the glow
const HRV_AQUA = "var(--nura-aqua)";
const HRV_AQUA_RGB = "var(--nura-aqua-rgb)"; // pill tint
const HRV_AQUA_GLOW = "var(--nura-aqua-hi-rgb)"; // lighter step for the glow

// Cool blue→teal aurora pinned to the top, matching the reference.
const SLEEP_AURORA =
  "radial-gradient(80% 50% at 50% -4%, rgba(var(--nura-metric-sleep-rgb),0.30), transparent 62%)," +
  "radial-gradient(60% 46% at 86% 4%, rgba(var(--nura-metric-sleep-rgb),0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 10% 14%, rgba(var(--nura-metric-sleep-rgb),0.12), transparent 60%)";

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
const ChevronRight = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
);

// Header row for a tappable chart card: title (left) + a "View" affordance
// (right) in the chart's color, so it reads as a shortcut into that metric tab.
function ChartHeader({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px", margin: 0 }}>{title}</h3>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 600, color }}>
        View <ChevronRight color={color} />
      </span>
    </div>
  );
}

// Subtitle row: caption (left) + an "Avg …" stat pill (right) in the chart color.
function ChartSubhead({ caption, avg, color, rgb }: { caption: string; avg: string; color: string; rgb: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "3px 0 6px" }}>
      <span style={{ fontSize: 12.5, color: MUTED }}>{caption}</span>
      <span style={{
        display: "inline-flex", alignItems: "center", flexShrink: 0, whiteSpace: "nowrap",
        padding: "3px 9px", borderRadius: 999, fontSize: 11.5, fontWeight: 600,
        color, background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.28)` }}>
        {avg}
      </span>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
// These were painted from the SLEEP STAGE ramp plus a hardcoded gold — Optimal
// wore the REM step and Good wore the Awake step, so the chip that judges a
// reading was drawn in the same colours as the reading itself, and the gold
// literal ignored the theme entirely. They use the shared chip tokens now:
// calm sage for the fine states, amber and brick kept for actual attention.
const BADGE: Record<MetricStatus, { fg: string; bg: string; label: string }> = {
  optimal: { fg: "var(--nura-chip-optimal-fg)", bg: "var(--nura-chip-optimal-bg)", label: "Optimal" },
  good: { fg: "var(--nura-chip-good-fg)", bg: "var(--nura-chip-good-bg)", label: "Good" },
  alert: { fg: "var(--nura-chip-alert-fg)", bg: "var(--nura-chip-alert-bg)", label: "Alert" },
};
function Badge({ status, label }: { status: MetricStatus; label?: string }) {
  const b = BADGE[status];
  return (
    <span className="nura-chip" style={{
      display: "inline-flex", alignItems: "center", whiteSpace: "nowrap",
      padding: "4px 10px", borderRadius: 8, fontFamily: SANS, fontSize: 11.5, fontWeight: 600,
      color: b.fg, background: b.bg, border: "1px solid var(--nura-chip-border)" }}>
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
      background: "var(--nura-wash-sleep)" }}>
      <style>{`
        .s-reveal { opacity: 0; transform: translateY(18px); animation: s-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes s-rise { to { opacity: 1; transform: none; } }
        .s-back:hover { color: var(--nura-text-primary) !important; }
        .s-tap { cursor: pointer; transition: transform .18s ease, border-color .18s ease; }
        .s-tap:hover { transform: translateY(-1px); border-color: rgba(var(--nura-bg-tint-rgb),0.18); }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={SLEEP_AURORA} />

      <div className="mp-col" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "calc(env(safe-area-inset-top, 0px) + 46px) 18px 44px" }}>
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
            color: REM, border: `1px solid rgba(${REM_RGB},0.4)`, background: `rgba(${REM_RGB},0.06)` }}>
            <span className="nura-glow" style={{ width: 6, height: 6, borderRadius: "50%", background: REM, boxShadow: `0 0 8px ${REM}` }} />
            {d.heroPill}
          </span>
        </div>

        {/* 3 · Headline tiles — 2×2 with status badges */}
        <div className="s-reveal" style={{ animationDelay: ".12s", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
          {d.subMetrics.map((sm) => (
            <div key={sm.label} style={{ background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: "14px 13px", boxShadow: "inset 0 1px 0 rgba(var(--nura-bg-tint-rgb),0.08)" }}>
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
                <div className="nura-glow" style={{ height: "100%", width: `${c.pct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${LIGHT}, ${REM})`, boxShadow: `0 0 10px rgba(${REM_RGB},0.4)` }} />
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
                <div className="nura-glow" key={i} style={{
                  flex: 1, height: 22, borderRadius: 7,
                  background: p === "full"
                    ? `linear-gradient(90deg, rgba(${DEEP_RGB},0.5), rgba(${REM_RGB},0.5))`
                    : `rgba(${REM_RGB},0.18)`,
                  boxShadow: p === "full" ? `0 0 12px rgba(${REM_RGB},0.18)` : "none" }} />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* 6 · Heart rate — nighttime line, tappable shortcut into the HR tab */}
        <GlassCard
          className="s-reveal s-tap"
          style={{ animationDelay: ".36s", marginTop: 16 }}
          role="link"
          tabIndex={0}
          ariaLabel="Open Heart Rate detail"
          onClick={() => router.push("/dashboard/heart-rate")}
          onKeyDown={(e) => { if (e.key === "Enter") router.push("/dashboard/heart-rate"); }}
        >
          <ChartHeader title="Heart rate" color={HR_RED} />
          <ChartSubhead caption="Beats per minute while you slept" avg="Avg 52 bpm" color={HR_RED} rgb={HR_RED_RGB} />

          <NightLineChart
            data={HR} floor={40} ceil={72} ticks={[44, 52, 60, 68]} unit="bpm"
            glowRgb={HR_RED_GLOW} avg={52}
            seq={SEQ} markers={hrMarkers}
            stroke={HR_RED}
          />
          <Axis labels={d.night.axisLabels} />

          <Caption color={HR_RED}>
            Your heart rate bottomed out at <b style={{ color: TEXT }}>44&nbsp;bpm</b> in deep sleep — about 20% below your
            daytime resting rate, a sign of strong recovery. The gradual climb toward 6&nbsp;a.m. is your body preparing to
            wake, which is completely normal.
          </Caption>
        </GlassCard>

        {/* 7 · Heart rate variability — tappable shortcut into the HRV tab */}
        <GlassCard
          className="s-reveal s-tap"
          style={{ animationDelay: ".44s", marginTop: 16 }}
          role="link"
          tabIndex={0}
          ariaLabel="Open Heart Rate Variability detail"
          onClick={() => router.push("/dashboard/hrv")}
          onKeyDown={(e) => { if (e.key === "Enter") router.push("/dashboard/hrv"); }}
        >
          <ChartHeader title="Heart rate variability" color={HRV_AQUA} />
          <ChartSubhead caption="HRV rises with deep, restorative sleep" avg="Avg 63 ms" color={HRV_AQUA} rgb={HRV_AQUA_RGB} />

          <NightLineChart
            data={HRV} floor={30} ceil={100} ticks={[40, 55, 70, 85]} unit="ms"
            glowRgb={HRV_AQUA_GLOW} avg={63}
            seq={SEQ} markers={hrvMarkers}
            stroke={HRV_AQUA}
          />
          <Axis labels={d.night.axisLabels} />

          <Caption color={HRV_AQUA}>
            HRV peaked above your baseline during the night&rsquo;s deep sleep — a marker of nervous-system recovery — then
            eased naturally as REM and light sleep took over toward morning.
          </Caption>
        </GlassCard>

        {/* 8 · Vitals tiles */}
        <div className="s-reveal" style={{ animationDelay: ".5s", display: "flex", gap: 10, marginTop: 16 }}>
          {d.vitals.map((v) => (
            <div key={v.label} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: "13px 12px", boxShadow: "inset 0 1px 0 rgba(var(--nura-bg-tint-rgb),0.08)" }}>
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
          background: `linear-gradient(135deg, rgba(${DEEP_RGB},0.10), rgba(${REM_RGB},0.03))` }}>
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
      <span className="nura-glow" style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0, marginTop: 5 }} />
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
          // `c` is a var() reference, so hex() parsed it to NaN and the lit top
          // stop came out rgb(NaN,…) — which SVG resolves to black. color-mix
          // takes the reference and lightens it against the live theme.
          return (
            <linearGradient key={i} id={`${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={`color-mix(in srgb, ${c}, white 34%)`} />
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
            style={s === "D" ? { } : undefined}
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
  data, floor, ceil, ticks, unit, stroke, glowRgb, avg, seq, markers,
}: {
  data: number[]; floor: number; ceil: number; ticks: number[]; unit: string;
  stroke: string; glowRgb: string; avg: number;
  seq: ("D" | "R" | "L" | "A")[]; markers: Marker[];
}) {
  const rawId = useId();
  const uid = `night-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Geometry — a left gutter holds the aligned y-axis number column; even
  // top/bottom padding so the plot sits centered with room for callouts.
  const W = 356, H = 132;
  const padL = 30, padR = 10, padT = 26, padB = 24;
  const plotL = padL, plotR = W - padR, plotW = plotR - plotL;
  const plotT = padT, plotB = H - padB, plotH = plotB - plotT;
  const n = data.length, slot = plotW / n;
  const y = (v: number) => plotT + (1 - (v - floor) / (ceil - floor)) * plotH;
  const xMid = (i: number) => plotL + i * slot + slot / 2;

  const pts: [number, number][] = data.map((v, i) => [xMid(i), y(v)]);
  const path = smooth(pts);

  // Deep windows (all) + the single longest REM window — derived from the SAME
  // stage sequence the hypnogram uses, so the shading lines up under the bars.
  const deepWins = runsOf(seq, "D");
  const remWins = runsOf(seq, "R");
  const longestDeep = deepWins.reduce<[number, number]>((a, b) => (b[1] > a[1] ? b : a), [0, 0]);
  const longestRem = remWins.reduce<[number, number]>((a, b) => (b[1] > a[1] ? b : a), [0, 0]);
  const winX = (start: number, len: number) => ({ x: plotL + start * slot, w: len * slot });

  // Sleep-context zone bands stay neutral translucent grey (not the line color).
  const BAND_DEEP = `rgba(${INK},0.08)`;
  const BAND_REM = `rgba(${INK},0.045)`;
  const BAND_LABEL = `rgba(${INK},0.5)`;

  // Average is shown as a pill in the card header (see ChartSubhead); here we
  // only draw the dashed reference line — no inline label to collide with.
  const avgY = y(avg);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Neutral grey stage shading behind the line */}
      {deepWins.map(([s, l], i) => {
        const { x, w } = winX(s, l);
        return <rect key={`d${i}`} x={x.toFixed(1)} y={plotT} width={w.toFixed(1)} height={plotH} rx="3"  style={{ fill: BAND_DEEP }}/>;
      })}
      {longestRem[1] > 0 && (() => { const { x, w } = winX(longestRem[0], longestRem[1]); return (
        <rect x={x.toFixed(1)} y={plotT} width={w.toFixed(1)} height={plotH} rx="3"  style={{ fill: BAND_REM }}/>
      ); })()}
      {longestDeep[1] > 0 && (
        <text x={(plotL + longestDeep[0] * slot + (longestDeep[1] * slot) / 2).toFixed(1)} y={10} textAnchor="middle" fontFamily={SANS} fontSize={7.5} fontWeight={600} letterSpacing="0.6px" style={{ fill: BAND_LABEL }}>DEEP SLEEP</text>
      )}
      {longestRem[1] > 0 && (
        <text x={(plotL + longestRem[0] * slot + (longestRem[1] * slot) / 2).toFixed(1)} y={10} textAnchor="middle" fontFamily={SANS} fontSize={7.5} fontWeight={600} letterSpacing="0.6px" style={{ fill: BAND_LABEL }}>REM</text>
      )}

      {/* Evenly-spaced gridlines + a clean aligned y-axis column in the left gutter */}
      {ticks.map((t, i) => {
        const gy = y(t);
        return (
          <g key={`t${i}`}>
            <line x1={plotL} y1={gy.toFixed(1)} x2={plotR} y2={gy.toFixed(1)} stroke={`rgba(${INK},0.06)`} />
            <text x={plotL - 8} y={(gy + 3).toFixed(1)} textAnchor="end" fontFamily={SANS} fontSize={9} fill="var(--nura-ink-a40)">{t}</text>
          </g>
        );
      })}
      {/* Unit label atop the number column */}
      <text x={plotL - 8} y={(plotT - 12).toFixed(1)} textAnchor="end" fontFamily={SANS} fontSize={8.5} fontWeight={600} letterSpacing="0.6px" fill="var(--nura-ink-a36)">{unit}</text>

      {/* Gradient area fill (line color → transparent) + smooth line */}
      <path d={`${path} L ${pts[n - 1][0].toFixed(1)},${plotB} L ${pts[0][0].toFixed(1)},${plotB} Z`} fill={`url(#${uid}-fill)`} />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Dashed average line (its value lives in the header pill, not inline) */}
      <line x1={plotL} y1={avgY.toFixed(1)} x2={plotR} y2={avgY.toFixed(1)} stroke={`rgba(${INK},0.3)`} strokeWidth={1} strokeDasharray="4 5" />

      {/* Markers — colored dot + label placed to clear the line, bands and each other */}
      {markers.map((m, i) => {
        const mx = xMid(m.i), my = y(m.value);
        const frac = (m.value - floor) / (ceil - floor);
        // High points label above (line is below them); low points label below.
        const ly = frac >= 0.4 ? my - 12 : my + 16;
        const half = Math.min(72, m.label.length * 2.4);
        const lx = Math.max(plotL + half, Math.min(plotR - half, mx));
        return (
          <g key={`m${i}`}>
            <circle cx={mx.toFixed(1)} cy={my.toFixed(1)} r={2.8} fill={stroke} />
            <text x={lx.toFixed(1)} y={ly.toFixed(1)} textAnchor="middle" fontFamily={SANS} fontSize={9} fontWeight={600} fill={stroke}>{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
