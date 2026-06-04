"use client";

import { useRouter } from "next/navigation";
import { getHeartRateDetail, getMetric } from "@/lib/dashboardData";
import AuroraBackground from "@/components/dashboard/AuroraBackground";
import GlassCard from "@/components/dashboard/GlassCard";
import MetricChart from "@/components/dashboard/MetricChart";

// ── Tokens ──────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const MUTED = "var(--nura-text-secondary)";
const FAINT = "var(--nura-text-tertiary)";
const CORAL = "var(--nura-alert)";
const INK = "var(--nura-fg-rgb)"; // warm off-white in dark mode
const SANS = "'Inter', system-ui, sans-serif";

// Warm coral/amber ambient so this reads as the cardiovascular page.
const CORAL_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(232,116,90,0.30), transparent 60%)," +
  "radial-gradient(60% 50% at 86% 6%, rgba(224,162,62,0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(232,116,90,0.12), transparent 60%)";

// ── Icons ───────────────────────────────────────────────────────────────────
const Chevron = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" strokeLinecap="round" /></svg>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function HeartRateDetailPage() {
  const router = useRouter();
  const d = getHeartRateDetail();
  const chart = getMetric("heart-rate")?.chart; // reuse the dashboard card's chart data

  return (
    <div style={{
      position: "relative", minHeight: "100dvh", overflow: "hidden",
      color: TEXT, fontFamily: SANS,
      background: "radial-gradient(130% 80% at 50% -8%, #2e1410 0%, #160a08 34%, var(--nura-bg) 72%)",
    }}>
      <style>{`
        .hr-reveal { opacity: 0; transform: translateY(18px); animation: hr-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes hr-rise { to { opacity: 1; transform: none; } }
        @keyframes hr-beat { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .6; } }
        .hr-back:hover { color: var(--nura-text-primary) !important; }
        * { font-variant-numeric: tabular-nums; }
      `}</style>

      <AuroraBackground gradient={CORAL_AURORA} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "max(env(safe-area-inset-top), 16px) 18px 44px" }}>
        {/* Header shell — back · NŪRA wordmark · info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0 2px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="hr-back"
            style={{ background: "none", border: "none", padding: 4, margin: -4, cursor: "pointer", color: MUTED, display: "flex" }}
          >
            <Chevron />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: "0.18em" }}>NŪRA</span>
          <span style={{ display: "flex", alignItems: "center", color: MUTED }}><InfoIcon /></span>
        </div>

        {/* Title */}
        <h1 className="hr-reveal" style={{ animationDelay: ".05s", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: "18px 0 2px" }}>
          Heart Rate
        </h1>
        <div className="hr-reveal" style={{ animationDelay: ".05s", color: MUTED, fontSize: 14, marginBottom: 6 }}>{d.subtitle}</div>

        {/* Hero — live BPM + pulse + triple tiles */}
        <div className="hr-reveal" style={{ animationDelay: ".1s", textAlign: "center", padding: "14px 0 6px" }}>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-3px", lineHeight: 1, display: "inline-flex", alignItems: "baseline", gap: 8 }}>
            {d.live}<small style={{ fontSize: 20, fontWeight: 600, color: MUTED, letterSpacing: 0 }}>bpm</small>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 8, fontSize: 12, letterSpacing: "1.2px", textTransform: "uppercase", color: MUTED }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: CORAL, boxShadow: "0 0 8px var(--nura-alert)", animation: "hr-beat 1.1s ease-in-out infinite" }} />
            {d.liveLabel}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            {[
              { k: "Resting", v: d.resting },
              { k: "Average", v: d.average },
              { k: "Max today", v: d.max },
            ].map((t) => (
              <div key={t.k} style={{ flex: 1, background: "var(--nura-glass)", border: "1px solid var(--nura-glass-line)", borderRadius: 16, padding: 13, textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: FAINT }}>{t.k}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                  {t.v}<small style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}> bpm</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today — reuse the dashboard card's vivid intraday chart */}
        <GlassCard className="hr-reveal" style={{ animationDelay: ".2s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Today</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>{d.rangeCaption}</div>
          {chart && <MetricChart data={chart} height={150} />}
        </GlassCard>

        {/* Heart rate zones */}
        <GlassCard className="hr-reveal" style={{ animationDelay: ".28s", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Heart rate zones</div>
          <div style={{ fontSize: 12.5, color: MUTED, margin: "3px 0 8px" }}>Time spent in each zone today</div>

          {d.zones.map((z) => (
            <div key={z.name} style={{ marginTop: 15 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14 }}>
                  <i style={{ width: 9, height: 9, borderRadius: "50%", background: z.color, flexShrink: 0 }} />
                  {z.name} <span style={{ fontSize: 11.5, color: FAINT }}>{z.range}</span>
                </span>
                <span style={{ fontSize: 12.5, color: MUTED }}>
                  <b style={{ color: TEXT, fontWeight: 600 }}>{z.duration}</b> · {z.pct}%
                </span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: `rgba(${INK},0.07)`, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${z.pct}%`, borderRadius: 4, background: z.color }} />
              </div>
            </div>
          ))}
        </GlassCard>

        {/* NŪRA insight */}
        <GlassCard className="hr-reveal" style={{ animationDelay: ".36s", marginTop: 16, borderRadius: 20, padding: 17, position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "linear-gradient(180deg,var(--nura-amber),var(--nura-alert))", boxShadow: "0 0 16px rgba(var(--nura-alert-rgb),0.5)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", color: CORAL, textTransform: "uppercase" }}>NŪRA</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 9 }}>{d.insight}</p>
        </GlassCard>
      </div>
    </div>
  );
}
