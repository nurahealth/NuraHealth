"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { getBodyTempDetail, SOURCE_LABEL, type BodyTempDetail } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import GlassCard from "@/components/dashboard/GlassCard";
import { hex, lerp, smooth } from "@/components/dashboard/ActiveEnergyTodayChart";
import {
  useTemperatureUnitStore,
  fmtDeltaBare, fmtDeltaDeg, fmtDeltaUnit, fmtMagUnit, wordedDeviation,
  type TemperatureUnit,
} from "@/lib/temperatureUnit";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const INK = "var(--nura-fg-rgb)"; // off-white in dark, near-black in light
const SANS = "var(--font-inter), system-ui, sans-serif";

const TEAL = "var(--nura-teal)";
const TEAL_RGB = "93,204,174";
const WARM = "var(--nura-amber)";       // amber deviation line
const WARM_RGB = "224,162,62";
const CORAL = "var(--nura-alert)";

// Cool teal aurora at the top of the page.
const TEAL_AURORA =
  "radial-gradient(80% 55% at 50% -6%, rgba(var(--nura-teal-rgb),0.26), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(var(--nura-sleep-deep-rgb),0.14), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(var(--nura-teal-rgb),0.10), transparent 60%)";

// Zone bar: cool (blue) → normal (teal) → warm (gold) → elevated (coral).
const ZONE_GRADIENT = "linear-gradient(90deg, var(--nura-sleep-deep) 0%, var(--nura-teal) 38%, var(--nura-good) 72%, var(--nura-alert) 100%)";

// ── Chart color helper — colorAt(t, stops) over an arbitrary ramp ─────────────
// Defined locally (reusing the shared hex/lerp) so it's guaranteed available
// wherever these charts render — a missing colorAt silently blanks a chart.
function colorAt(t: number, stops: [number, string][]): string {
  const u = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [s0, c0] = stops[i];
    const [s1, c1] = stops[i + 1];
    if (u >= s0 && u <= s1) {
      const k = (u - s0) / ((s1 - s0) || 1);
      const A = hex(c0), B = hex(c1);
      return `rgb(${Math.round(lerp(A[0], B[0], k))},${Math.round(lerp(A[1], B[1], k))},${Math.round(lerp(A[2], B[2], k))})`;
    }
  }
  return stops[stops.length - 1][1];
}

type Range = "1" | "7" | "30";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function BodyTempDetailPage() {
  const router = useRouter();
  const d = getBodyTempDetail();
  const unit = useTemperatureUnitStore((s) => s.unit);
  const setUnit = useTemperatureUnitStore((s) => s.setUnit);
  const initUnit = useTemperatureUnitStore((s) => s.initUnit);
  const [range, setRange] = useState<Range>("30");

  useEffect(() => { initUnit(); }, [initUnit]);

  // Per-range trend config — data, scale, what reference layers to show, labels.
  const ranges: Record<Range, {
    data: number[]; ticks: number[]; floor: number; ceil: number;
    labels: string[]; band: [number, number] | null; baseline: number | null;
    sub: string; mark: "low" | "high";
  }> = {
    "1": { data: d.today, ticks: d.dayTicks, floor: -0.6, ceil: 0.4, labels: ["12a", "6a", "12p", "6p", "now"], band: null, baseline: null, sub: "Temperature deviation across tonight", mark: "low" },
    "7": { data: d.week, ticks: d.monthTicks, floor: -0.6, ceil: 0.6, labels: ["6d ago", "4d", "2d", "yest", "today"], band: d.normalRange, baseline: 0, sub: "Nightly temperature deviation this week", mark: "high" },
    "30": { data: d.month, ticks: d.monthTicks, floor: -0.6, ceil: 0.6, labels: ["30d ago", "3 wks", "2 wks", "last wk", "today"], band: d.normalRange, baseline: 0, sub: "Nightly temperature deviation this month", mark: "high" },
  };
  const active = ranges[range];
  const badge = range === "1" ? `low ${fmtDeltaDeg(Math.min(...active.data), unit)}` : "Stable";

  const zonePos = ((d.tonight + 1) / 2) * 100; // unit-independent ratio on −1…+1

  // Status-led headline — the hero word carries the state (no separate pill).
  const within = d.tonight >= d.normalRange[0] && d.tonight <= d.normalRange[1];
  const statusWord = within ? "Normal" : d.tonight > d.normalRange[1] ? "Elevated" : "Cool";
  const statusColor = within ? TEAL : d.tonight > d.normalRange[1] ? "var(--nura-good)" : "var(--nura-sleep-deep)";

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "var(--nura-wash-temp)",
    }}>
      <style>{`
        .bt-reveal { opacity: 0; transform: translateY(18px); animation: bt-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes bt-rise { to { opacity: 1; transform: none; } }
        .bt-back:hover { color: var(--nura-text-primary) !important; }
        .bt-seg { transition: color 160ms, background 160ms; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={TEAL_AURORA} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "max(env(safe-area-inset-top), 16px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="bt-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title + source tag */}
        <div className="bt-reveal" style={{ animationDelay: ".05s", margin: "18px 0 2px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.9px", textTransform: "uppercase", color: TEAL, fontWeight: 600, marginBottom: 6 }}>
            {SOURCE_LABEL[d.source]}
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>Body Temperature</h1>
        </div>
        <div className="bt-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — status-led: status headline + worded deviation, unit toggle, zone bar */}
        <div className="bt-reveal" style={{ animationDelay: ".1s", display: "flex", flexDirection: "column", alignItems: "center", margin: "18px 0 4px" }}>
          <div style={{ fontSize: 46, fontWeight: 700, color: statusColor, letterSpacing: "-1.5px", lineHeight: 1, filter: `drop-shadow(0 0 22px ${statusColor}40)` }}>{statusWord}</div>
          <div style={{ fontSize: 14, color: MUTED, marginTop: 10 }}>{wordedDeviation(d.tonight, unit, true)}</div>

          {/* °F / °C toggle — updates the global preference */}
          <div style={{ display: "inline-flex", gap: 2, marginTop: 12, padding: 3, borderRadius: 999, background: `rgba(${INK},0.05)`, border: `1px solid rgba(${INK},0.08)` }}>
            {(["F", "C"] as TemperatureUnit[]).map((u) => {
              const on = u === unit;
              return (
                <button
                  key={u}
                  className="bt-seg"
                  onClick={() => setUnit(u)}
                  style={{
                    border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 16px",
                    fontFamily: SANS, fontSize: 12, fontWeight: 600,
                    background: on ? `rgba(${TEAL_RGB},0.16)` : "transparent",
                    color: on ? TEAL : "var(--nura-ink-a50)",
                  }}
                >
                  °{u}
                </button>
              );
            })}
          </div>

          {/* Zone bar — marker by deviation ratio (does NOT move on unit toggle) */}
          <div style={{ width: "100%", marginTop: 20 }}>
            <div style={{ position: "relative", height: 8, borderRadius: 999, background: ZONE_GRADIENT }}>
              <div style={{ position: "absolute", top: -5, left: `${zonePos.toFixed(1)}%`, transform: "translateX(-50%)", width: 3, height: 18, borderRadius: 2, background: "var(--nura-text-primary)", boxShadow: "0 0 8px rgba(var(--nura-bg-tint-rgb),0.6)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, color: FAINT }}>
              <span>Cool</span><span>Normal</span><span>Elevated</span>
            </div>
          </div>
        </div>

        {/* Tiles — Tonight · 7-day avg · 30-day range */}
        <div className="bt-reveal" style={{ animationDelay: ".18s", display: "flex", gap: 10, marginTop: 22 }}>
          {[
            { k: "Tonight", v: fmtDeltaBare(d.tonight, unit) },
            { k: "7-day avg", v: fmtDeltaBare(d.avg7, unit) },
            { k: "30-day range", v: `${fmtDeltaBare(d.low30, unit)}–${fmtDeltaBare(d.high30, unit)}` },
          ].map((t) => (
            <div key={t.k} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: FAINT, fontWeight: 600 }}>{t.k}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6, letterSpacing: "-0.5px" }}>
                {t.v}<small style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}> °{unit}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Trend — 1D / 7D / 30D, chart re-renders per range */}
        <GlassCard className="bt-reveal" style={{ animationDelay: ".26s", marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>Trend</div>
              <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 0" }}>{active.sub}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: TEAL, whiteSpace: "nowrap" }}>{badge}</span>
          </div>

          {/* Range tabs */}
          <div style={{ display: "inline-flex", gap: 2, marginTop: 10, padding: 3, borderRadius: 999, background: `rgba(${INK},0.05)`, border: `1px solid rgba(${INK},0.08)` }}>
            {(["1", "7", "30"] as Range[]).map((r) => {
              const on = r === range;
              return (
                <button
                  key={r}
                  className="bt-seg"
                  onClick={() => setRange(r)}
                  style={{
                    border: "none", cursor: "pointer", borderRadius: 999, padding: "5px 14px",
                    fontFamily: SANS, fontSize: 11.5, fontWeight: 600,
                    background: on ? `rgba(${TEAL_RGB},0.16)` : "transparent",
                    color: on ? TEAL : "var(--nura-ink-a50)",
                  }}
                >
                  {r}D
                </button>
              );
            })}
          </div>

          <TrendChart
            data={active.data} floor={active.floor} ceil={active.ceil} ticks={active.ticks}
            band={active.band} baseline={active.baseline} mark={active.mark} unit={unit}
          />

          {/* X-axis labels */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginTop: 7, fontSize: 10, color: FAINT }}>
            {active.labels.map((l, i) => <span key={i}>{l}</span>)}
          </div>

          {/* Legend (below the chart) */}
          <div style={{ display: "flex", gap: 14, marginTop: 11, fontSize: 11, color: MUTED, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 15, height: 0, borderTop: `2px solid ${WARM}` }} />Temp deviation
            </span>
            {active.band && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 15, height: 9, borderRadius: 3, background: `rgba(${TEAL_RGB},0.18)`, border: `1px dashed rgba(${TEAL_RGB},0.6)` }} />Normal range
              </span>
            )}
            {active.baseline !== null && (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 15, height: 0, borderTop: `2px dashed rgba(${INK},0.5)` }} />Baseline
              </span>
            )}
          </div>

          {/* Mini-insight */}
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 13, paddingTop: 13, borderTop: `1px solid rgba(${INK},0.07)`, fontSize: 12.5, lineHeight: 1.45, color: MUTED }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: WARM, marginTop: 5, flex: "none", boxShadow: `0 0 7px ${WARM}` }} />
            <span>
              Your skin temperature is running <b style={{ color: TEXT, fontWeight: 700 }}>{fmtMagUnit(d.tonight, unit)}</b> below baseline — comfortably within normal night-to-night variation. The single spike to <b style={{ color: TEXT, fontWeight: 700 }}>{fmtDeltaUnit(d.spike, unit)}</b> mid-month lined up with a poor night&apos;s sleep. Sustained rises usually mean something&apos;s up.
            </span>
          </div>
        </GlassCard>

        {/* Weekly average */}
        <GlassCard className="bt-reveal" style={{ animationDelay: ".34s", marginTop: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>Weekly average</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 0" }}>Each week&apos;s average deviation</div>
          <WeeklyChart weeklyAvg={d.weeklyAvg} unit={unit} />
        </GlassCard>

        {/* NŪRA insight */}
        <div className="bt-reveal" style={{ animationDelay: ".42s", marginTop: 16, padding: "18px 20px", borderRadius: 18, border: `1px solid rgba(${TEAL_RGB},0.2)`, background: `linear-gradient(135deg, rgba(${TEAL_RGB},0.09), rgba(var(--nura-sleep-deep-rgb),0.03))` }}>
          <div style={{ fontSize: 11, letterSpacing: "1.4px", textTransform: "uppercase", color: TEAL, fontWeight: 600 }}>NŪRA insight</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 8, color: `rgba(${INK},0.85)` }}>
            This isn&apos;t your actual body temperature — it&apos;s how far last night drifted from your own personal baseline. NŪRA reads your skin temperature overnight, when it&apos;s most stable, and compares it to the normal you&apos;ve built up over the past few weeks. <b style={{ color: TEXT, fontWeight: 700 }}>Normal</b> means you&apos;re sitting right where you usually do, and small swings of a few tenths of a degree from night to night are completely expected. The signal worth watching is a <i>sustained</i> rise of about <b style={{ color: TEXT, fontWeight: 700 }}>{fmtDeltaUnit(d.spike, unit)}</b> over several nights — that can show up a day or two before you feel ill, track the second half of a menstrual cycle, or simply follow alcohol, a late meal, or a warm room.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Trend chart ───────────────────────────────────────────────────────────────
// An amber deviation line with a soft fill. When band, the normal range is a teal
// fill with dashed teal top/bottom edges; when baseline, a dashed reference line
// at 0 (no inline text). The most-elevated point is flagged coral (or the low
// teal, for 1D); today is an amber dot inside a halo ring. Ticks render in-SVG.
function TrendChart({
  data, floor, ceil, ticks, band, baseline, mark, unit,
}: {
  data: number[]; floor: number; ceil: number; ticks: number[];
  band: [number, number] | null; baseline: number | null; mark: "low" | "high"; unit: TemperatureUnit;
}) {
  const rawId = useId();
  const uid = `bt-trend-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const W = 356, top = 18, bot = 104, plotH = bot - top, n = data.length;
  const xOf = (i: number) => (n > 1 ? i * (W / (n - 1)) : 0);
  const yOf = (v: number) => top + (1 - (v - floor) / (ceil - floor)) * plotH;

  const pts: [number, number][] = data.map((v, i) => [xOf(i), yOf(v)]);
  const line = smooth(pts);
  const area = `${line} L ${pts[n - 1][0].toFixed(1)},${bot} L ${pts[0][0].toFixed(1)},${bot} Z`;

  // High / low flag.
  let flagIdx = 0;
  data.forEach((v, i) => { if (mark === "high" ? v > data[flagIdx] : v < data[flagIdx]) flagIdx = i; });
  const flagV = data[flagIdx];
  const [flagX, flagY] = pts[flagIdx];
  const [todayX, todayY] = pts[n - 1];

  return (
    <svg width="100%" height={140} viewBox={`0 0 ${W} 140`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 10 }}>
      <defs>
        <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${WARM_RGB},0.18)`} />
          <stop offset="100%" stopColor={`rgba(${WARM_RGB},0)`} />
        </linearGradient>
      </defs>

      {/* Normal-range band */}
      {band && (
        <>
          <rect x={0} y={yOf(band[1]).toFixed(1)} width={W} height={(yOf(band[0]) - yOf(band[1])).toFixed(1)} fill={`rgba(${TEAL_RGB},0.13)`} />
          <line x1={0} x2={W} y1={yOf(band[1]).toFixed(1)} y2={yOf(band[1]).toFixed(1)} stroke={`rgba(${TEAL_RGB},0.3)`} strokeWidth={1} strokeDasharray="2 3" />
          <line x1={0} x2={W} y1={yOf(band[0]).toFixed(1)} y2={yOf(band[0]).toFixed(1)} stroke={`rgba(${TEAL_RGB},0.3)`} strokeWidth={1} strokeDasharray="2 3" />
        </>
      )}

      {/* Gridlines + right-edge tick labels (in active unit) */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={0} x2={W} y1={yOf(t).toFixed(1)} y2={yOf(t).toFixed(1)} stroke={`rgba(${INK},0.06)`} />
          <text x={W - 2} y={(yOf(t) - 3).toFixed(1)} textAnchor="end" fontFamily={SANS} fontSize={9} fill="var(--nura-ink-a32)">{fmtDeltaDeg(t, unit)}</text>
        </g>
      ))}

      {/* Dashed baseline at 0 (no inline text) */}
      {baseline !== null && (
        <line x1={0} x2={W} y1={yOf(baseline).toFixed(1)} y2={yOf(baseline).toFixed(1)} stroke={`rgba(${INK},0.3)`} strokeWidth={1} strokeDasharray="3 4" />
      )}

      {/* Area + amber line */}
      <path d={area} fill={`url(#${uid}-area)`} />
      <path d={line} fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: WARM, filter: `drop-shadow(0 0 5px rgba(${WARM_RGB},0.5))` }} />

      {/* High (coral, label above) or low (teal, label below) flag */}
      <circle cx={flagX.toFixed(1)} cy={flagY.toFixed(1)} r={2.6} fill={mark === "high" ? CORAL : TEAL} style={{ filter: `drop-shadow(0 0 5px ${mark === "high" ? CORAL : TEAL})` }} />
      <text
        x={flagX.toFixed(1)} y={(mark === "high" ? flagY - 9 : flagY + 14).toFixed(1)} textAnchor="middle"
        fontFamily={SANS} fontSize={9} fontWeight={700} fill={mark === "high" ? CORAL : TEAL}
      >
        {fmtDeltaDeg(flagV, unit)}
      </text>

      {/* Today — amber dot inside a halo ring */}
      <circle cx={todayX.toFixed(1)} cy={todayY.toFixed(1)} r={6.5} fill="none" strokeOpacity={0.35} strokeWidth={1.5}  style={{ stroke: WARM }}/>
      <circle cx={todayX.toFixed(1)} cy={todayY.toFixed(1)} r={3} style={{ fill: WARM, filter: `drop-shadow(0 0 6px ${WARM})` }} />
    </svg>
  );
}

// ── Weekly-average lollipop ─────────────────────────────────────────────────
// A horizontal dashed baseline through the middle; for each of the last 4 weeks
// a thin stem rising (above) or dropping (below) to a glowing dot, the dot
// colored along a diverging cool→warm ramp by how far it sat from baseline. The
// most recent week's dot is larger with a halo ring. Values sit on the outer
// side of each dot; week labels run along the bottom. Deliberately different
// from the connected weekly LINE on the Resting HR page.
function WeeklyChart({ weeklyAvg, unit }: { weeklyAvg: number[]; unit: TemperatureUnit }) {
  // Taller canvas + a data-driven scale (largest weekly deviation × ~1.35) so the
  // dots lift clearly off the baseline instead of hugging it. Left padding starts
  // the first point at x≈60 so it clears the "BASELINE" label.
  const W = 356, H = 168, baseY = 80, amp = 46, pad = 60;
  const labels = ["4 wks", "3 wks", "2 wks", "last"];
  const n = weeklyAvg.length;
  const scaleMax = Math.max(0.1, Math.max(...weeklyAvg.map((v) => Math.abs(v))) * 1.35);
  const xOf = (i: number) => pad + (n > 1 ? i * ((W - 2 * pad) / (n - 1)) : 0);
  const yOf = (v: number) => baseY - (Math.max(-scaleMax, Math.min(scaleMax, v)) / scaleMax) * amp;
  // Diverging ramp around baseline: blue → teal → sage → gold → coral.
  const ramp: [number, string][] = [[0, "var(--nura-sleep-deep)"], [0.25, "var(--nura-teal)"], [0.5, "var(--nura-sage)"], [0.75, "var(--nura-good)"], [1, "var(--nura-alert)"]];
  const norm = (v: number) => (v + scaleMax) / (2 * scaleMax);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible", marginTop: 6 }}>
      {/* Baseline reference */}
      <line x1={4} x2={W} y1={baseY} y2={baseY} stroke={`rgba(${INK},0.3)`} strokeWidth={1} strokeDasharray="3 4" />
      <text x={4} y={baseY - 6} fontFamily={SANS} fontSize={8.5} fontWeight={600} letterSpacing="0.5" fill="var(--nura-ink-a40)">BASELINE</text>

      {weeklyAvg.map((v, i) => {
        const x = xOf(i), y = yOf(v);
        const last = i === n - 1;
        const fill = colorAt(norm(v), ramp);
        const above = v >= 0;
        const valY = above ? y - 11 : y + 15;
        return (
          <g key={i}>
            {/* Stem from baseline to the dot */}
            <line x1={x.toFixed(1)} x2={x.toFixed(1)} y1={baseY} y2={y.toFixed(1)} stroke={fill} strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
            {last && <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={9} fill="none" stroke={fill} strokeOpacity={0.3} strokeWidth={1.5} />}
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={last ? 5.5 : 4} fill={fill} style={{ filter: `drop-shadow(0 0 ${last ? 8 : 5}px ${fill})` }} />
            <text x={x.toFixed(1)} y={valY.toFixed(1)} textAnchor="middle" fontFamily={SANS} fontSize={12} fontWeight={700} fill={last ? fill : "var(--nura-text-primary)"}>{fmtDeltaDeg(v, unit)}</text>
            <text x={x.toFixed(1)} y={158} textAnchor="middle" fontFamily={SANS} fontSize={10.5} fill="var(--nura-ink-a32)">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}
