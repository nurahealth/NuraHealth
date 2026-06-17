"use client";

import { useRouter } from "next/navigation";
import { getRecoveryDetail, type HrvTrendChart, type RecoveryDriver } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import RadialGauge from "@/components/dashboard/RadialGauge";
import GlassCard from "@/components/dashboard/GlassCard";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const EMERALD = "var(--nura-optimal)";
const SAGE = "var(--nura-sage)";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode
const SANS = "var(--font-inter), system-ui, sans-serif";

// Status level → color token (emerald = strong, sage = solid, gold = watch).
const LEVEL_COLOR: Record<RecoveryDriver["level"], string> = {
  strong: "var(--nura-optimal)",
  solid: "var(--nura-sage)",
  watch: "var(--nura-good)",
};

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function RecoveryDetailPage() {
  const router = useRouter();
  const d = getRecoveryDetail();

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "radial-gradient(130% 80% at 50% -8%, #0d2c27 0%, #081514 34%, var(--nura-bg) 72%)",
    }}>
      <style>{`
        .r-reveal { opacity: 0; transform: translateY(18px); animation: r-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes r-rise { to { opacity: 1; transform: none; } }
        .r-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "max(env(safe-area-inset-top), 16px) 18px 44px" }}>
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

        {/* Hero — recovery gauge + status pill */}
        <div className="r-reveal" style={{ animationDelay: ".1s", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0 6px" }}>
          <RadialGauge
            value={d.score}
            label="Recovery"
            size={180}
            stroke={12}
            gradientFrom="var(--nura-sage)"
            gradientTo="var(--nura-optimal)"
            glowRgb="var(--nura-optimal-rgb)"
          />
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
            padding: "6px 15px", borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
            color: EMERALD, border: "1px solid rgba(var(--nura-optimal-rgb),0.4)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD, boxShadow: "0 0 8px var(--nura-optimal)" }} />
            {d.pill}
          </span>
        </div>

        {/* HRV · 7-day trend */}
        <GlassCard className="r-reveal" style={{ animationDelay: ".2s", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>HRV · 7-day trend</span>
            <span style={{ fontSize: 13, color: MUTED }}>
              <b style={{ color: TEXT, fontWeight: 700, fontSize: 18 }}>{d.hrv.current}</b> ms{" "}
              <span style={{ color: EMERALD, fontWeight: 600 }}>▲ {d.hrv.delta}</span>
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
          <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-sage),var(--nura-optimal))", boxShadow: "0 0 16px rgba(var(--nura-optimal-rgb),0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: EMERALD, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>
      </div>
    </div>
  );
}

// ── HRV zone-band line chart ──────────────────────────────────────────────────
// Shaded optimal-zone band, dashed rolling-average line, a white glowing line
// with a glowing dot on each day (the latest day larger + emerald glow), and
// y-axis gridline labels. Mirrors the HRV dashboard-card chart in the reference.
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
        rx={7} fill="rgba(var(--nura-optimal-rgb),0.12)"
      />
      <text x={R - 5} y={(yOf(zone[1]) + 14).toFixed(1)} textAnchor="end" fontSize={10} fontWeight={600} fill={EMERALD} style={{ fontFamily: SANS }}>
        Optimal zone
      </text>

      {/* Gridlines + edge labels */}
      {gridlines.map((g) => (
        <g key={g}>
          <line x1={L} y1={yOf(g).toFixed(1)} x2={R} y2={yOf(g).toFixed(1)} stroke={`rgba(${INK},0.05)`} />
          <text x={L - 5} y={(yOf(g) + 3).toFixed(1)} textAnchor="end" fontSize={9} fill={`rgba(${INK},0.32)`} style={{ fontFamily: SANS }}>{g}</text>
        </g>
      ))}

      {/* Rolling-average dashed line */}
      <line x1={L} y1={yOf(average).toFixed(1)} x2={R} y2={yOf(average).toFixed(1)} stroke={`rgba(${INK},0.4)`} strokeWidth={1} strokeDasharray="4 5" />
      <text x={L + 2} y={(yOf(average) - 4).toFixed(1)} fontSize={9} fill={`rgba(${INK},0.45)`} style={{ fontFamily: SANS }}>avg {average}</text>

      {/* Daily line + dots */}
      <polyline points={poly} fill="none" stroke={`rgb(${INK})`} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px rgba(${INK},0.4))` }} />
      {pts.map((p, i) => (
        <circle
          key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={i === last ? 4.4 : 3.4} fill={`rgb(${INK})`}
          style={{ filter: i === last ? "drop-shadow(0 0 6px rgba(var(--nura-optimal-rgb),0.95))" : `drop-shadow(0 0 3px rgba(${INK},0.55))` }}
        />
      ))}
    </svg>
  );
}
