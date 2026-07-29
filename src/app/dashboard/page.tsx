"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NuraPageShell from "@/components/NuraPageShell";
import {
  getDashboardData,
  getStepsDetail,
  getActiveEnergyDetail,
  getRestingHrDetail,
  getBodyTempDetail,
  SOURCE_LABEL,
  type MetricStatus,
  type ConnectedSource,
  type DashboardMetric,
} from "@/lib/dashboardData";
import MetricChart from "@/components/dashboard/MetricChart";
import SleepDepthChart from "@/components/dashboard/SleepDepthChart";
import ActiveEnergyTodayChart from "@/components/dashboard/ActiveEnergyTodayChart";
import RestingHrZoneBar from "@/components/dashboard/RestingHrZoneBar";
import BodyTempCardRing from "@/components/dashboard/BodyTempCardRing";
import OverallHealthCard from "@/components/dashboard/OverallHealthCard";
import HealthPlanCard from "@/components/dashboard/HealthPlanCard";
import CustomizeSheet from "@/components/dashboard/CustomizeSheet";
import HrvCard from "@/components/dashboard/HrvCard";
import StepsCard from "@/components/dashboard/StepsCard";
import ActiveEnergyCard from "@/components/dashboard/ActiveEnergyCard";
import BloodOxygenCard from "@/components/dashboard/BloodOxygenCard";
import RespiratoryRateCard from "@/components/dashboard/RespiratoryRateCard";
import CardioFitnessCard from "@/components/dashboard/CardioFitnessCard";
import BloodPressureCard from "@/components/dashboard/BloodPressureCard";
import { useDashboardVisibility, useDashboardPrefs } from "@/lib/dashboardVisibility";
import { useTemperatureUnitStore, fmtMagUnit, deviationDirection } from "@/lib/temperatureUnit";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const CARD = "var(--nura-card)";
const SAGE = "var(--nura-sage)";
const SANS = "var(--font-inter), system-ui, sans-serif";

const STATUS: Record<MetricStatus, { color: string; bg: string; label: string }> = {
  optimal: { color: "var(--nura-chip-optimal-fg)", bg: "var(--nura-chip-optimal-bg)", label: "Optimal" },
  good: { color: "var(--nura-chip-good-fg)", bg: "var(--nura-chip-good-bg)", label: "Good" },
  alert: { color: "var(--nura-chip-alert-fg)", bg: "var(--nura-chip-alert-bg)", label: "Alert" },
};

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px",
  textTransform: "uppercase",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [firstName, setFirstName] = useState<string>("");
  const initUnit = useTemperatureUnitStore((s) => s.initUnit);
  const vis = useDashboardVisibility();
  const loadPrefs = useDashboardPrefs((s) => s.load);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const data = getDashboardData();

  // Hydrate the temperature-unit preference from storage / locale on mount.
  useEffect(() => { initUnit(); }, [initUnit]);

  // Load the user's hidden-metrics preference on mount (shared visibility store).
  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      const meta = (user.user_metadata ?? {}) as { name?: string; full_name?: string };
      const raw = meta.name ?? meta.full_name ?? user.email?.split("@")[0] ?? data.user.firstName;
      setFirstName(raw.split(" ")[0]);
      setAuthLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (authLoading) return <NuraPageShell maxWidth={480} desktopMaxWidth={1280}><div /></NuraPageShell>;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <NuraPageShell maxWidth={480} desktopMaxWidth={1280}>
      <style>{`
        /* The two narrative cards. One column at every width — including
           desktop. Side by side they had independent heights, so opening an
           accordion in one grew that column and stranded a half-screen of page
           background beside the shorter one. Stacked, each card owns the whole
           measure: an accordion opening has nothing beside it to strand, and
           the page simply grows by the height of what opened. */
        .dash-hero { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: start; }
        @media (min-width: 1024px) {
          /* The cards carry an inline margin-bottom for the phone case; here
             the grid gap owns the spacing so the rhythm is one value. */
          .dash-hero { gap: var(--nura-card-gap); }
          .dash-hero > * { margin-bottom: 0 !important; }
          /* DOM order is Plan → Overall, which is the phone reading order.
             Desktop leads with the score and follows with the plan. */
          .dash-hero > :nth-child(1) { order: 2; }
          .dash-hero > :nth-child(2) { order: 1; }
        }
        .dash-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px) { .dash-grid { grid-template-columns: 1fr 1fr; gap: 16px; } }
        /* Metric cards are small and self-contained, so they take a third
           column once the rail is docked and the shell widens. This grid is
           full-width and sits BELOW both hero cards — never stuffed into one
           dangling column. */
        @media (min-width: 1024px) {
          .dash-grid { grid-template-columns: repeat(3, 1fr); gap: var(--nura-card-gap); }
          /* One rhythm down the page: every gap between two stacked blocks —
             hero cards, metric grid, the customize row, the insight — is the
             same single value, so nothing reads as a stranded margin. */
          .dash-grid { margin-top: var(--nura-card-gap) !important; }
          .dash-customize { margin-top: var(--nura-card-gap) !important; }
          .dash-insight { margin-top: var(--nura-card-gap) !important; }
        }
        .dash-card { transition: border-color 180ms, transform 180ms; }
        .dash-card:hover { border-color: rgba(var(--nura-sage-rgb),0.35) !important; transform: translateY(-2px); }
        .dash-cta:hover { color: var(--nura-sage-hover) !important; }
        .dash-customize:hover { border-color: rgba(var(--nura-sage-rgb),0.4) !important; color: var(--nura-text-primary) !important; }
      `}</style>

      {/* 1 — Date eyebrow + greeting */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...EYEBROW, color: "var(--nura-accent-label)", marginBottom: 8 }}>
          Today · {dateLabel}
        </div>
        <h1 style={{
          fontFamily: SANS, fontWeight: 600, color: TEXT, margin: 0,
          fontSize: "clamp(26px, 5vw, 34px)", letterSpacing: "-0.02em", lineHeight: 1.1,
        }}>
          {greetingFor(now)}, {firstName || data.user.firstName}
        </h1>
      </div>

      {/* 2 — Connected sources strip */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
        {data.sources.map((s) => <SourcePill key={s.id} source={s} />)}
      </div>

      {/* 3+4 — Health Plan and Overall Health. One full-width column at every
          size; from lg the order flips so the score leads. */}
      <div className="dash-hero">
        <HealthPlanCard />
        <OverallHealthCard />
      </div>

      {/* 5 — Metric grid (only cards that have data AND aren't hidden) */}
      <div className="dash-grid" style={{ marginTop: 16 }}>
        {vis.visible.map((m) => {
          const go = () => router.push(`/dashboard/${m.id}`);
          if (m.id === "hrv") return <HrvCard key={m.id} metric={m} onClick={go} />;
          if (m.id === "steps") return <StepsCard key={m.id} metric={m} onClick={go} />;
          if (m.id === "active-energy") return <ActiveEnergyCard key={m.id} metric={m} onClick={go} />;
          if (m.id === "blood-oxygen") return <BloodOxygenCard key={m.id} metric={m} onClick={go} />;
          if (m.id === "respiratory-rate") return <RespiratoryRateCard key={m.id} metric={m} onClick={go} />;
          if (m.id === "cardio-fitness") return <CardioFitnessCard key={m.id} metric={m} onClick={go} />;
          if (m.id === "blood-pressure") return <BloodPressureCard key={m.id} metric={m} onClick={go} />;
          return <MetricCard key={m.id} metric={m} onClick={go} />;
        })}
      </div>

      {/* 6 — Customize (quiet, full-width; opens the show/hide sheet) */}
      <button
        onClick={() => setCustomizeOpen(true)}
        className="dash-customize"
        style={{
          width: "100%", marginTop: 14, padding: "13px 0", borderRadius: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          background: "transparent", border: `1px solid ${BORDER}`,
          fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TEXT_SEC, transition: "border-color 160ms, color 160ms",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="8" x2="20" y2="8" /><circle cx="9" cy="8" r="2.4" fill="var(--nura-bg)" />
          <line x1="4" y1="16" x2="20" y2="16" /><circle cx="15" cy="16" r="2.4" fill="var(--nura-bg)" />
        </svg>
        Customize dashboard
      </button>

      {/* 7 — NŪRA insight */}
      <InsightCard
        text={data.insight.text}
        ctaLabel={data.insight.ctaLabel}
        onCta={() => router.push(data.insight.ctaHref)}
      />

      <CustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        available={vis.available}
        hidden={vis.hidden}
        onToggle={vis.toggle}
      />
    </NuraPageShell>
  );
}

// ── 2 · Source pill ────────────────────────────────────────────────────────────
function SourcePill({ source }: { source: ConnectedSource }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 13px", borderRadius: 999,
      background: CARD, border: `0.5px solid ${BORDER}`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: "var(--nura-optimal)",
        boxShadow: source.state === "live" ? "0 0 0 3px rgba(var(--nura-optimal-rgb),0.18)" : "none",
      }} />
      <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: TEXT }}>{source.name}</span>
      <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER }}>{source.syncLabel}</span>
    </div>
  );
}

// ── Status pill ─────────────────────────────────────────────────────────────────
function StatusPill({ status, size = "md" }: { status: MetricStatus; size?: "sm" | "md" }) {
  const s = STATUS[status];
  const pad = size === "sm" ? "3px 8px" : "5px 11px";
  const fs = size === "sm" ? 9 : 10;
  return (
    <span className="nura-chip" style={{
      ...EYEBROW, fontSize: fs, color: s.color, padding: pad, borderRadius: 999,
      background: s.bg, border: `0.5px solid ${s.bg}`,
      whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

// ── 4 · Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  // Resting HR gets a bespoke treatment: value + daily delta, a zone bar (no
  // chart), and a "{n} bpm below your baseline" footer with an "Excellent" pill.
  const isRestingHr = metric.id === "resting-hr";
  const rhr = isRestingHr ? getRestingHrDetail() : null;
  const rhrBelow = rhr ? rhr.baseline - rhr.value : 0;

  // Body Temp gets a bespoke treatment: a cool→warm deviation ring (value in the
  // center, no top value row) and a "7-day {avg} · within range" footer.
  const isBodyTemp = metric.id === "body-temperature";
  const bt = isBodyTemp ? getBodyTempDetail() : null;
  const tempUnit = useTemperatureUnitStore((s) => s.unit);

  const display = isRestingHr && rhr ? String(rhr.value) : metric.displayValue ?? fmtNumber(metric.value);
  const showUnit = isRestingHr ? true : !metric.displayValue && metric.unit;

  // Steps gets an elevated, opt-in treatment: a "to go" goal callout, a
  // distance · flights · kcal · active strip, and the high-tech intraday chart.
  const isSteps = metric.id === "steps";
  const steps = isSteps ? getStepsDetail() : null;
  const remaining = steps ? Math.max(0, steps.goal - steps.steps) : 0;
  const statStrip = steps
    ? `${steps.tiles[0].value}${steps.tiles[0].unit} · ${steps.tiles[1].value} flights · ${steps.kcal} kcal · ${steps.tiles[2].value}${steps.tiles[2].unit}`
    : "";

  // Active Energy gets the same detailed intraday chart as its detail page,
  // plus a "to go" callout, a total · resting · exercise strip, and a
  // "{percent}% of your {goal} goal" footer.
  const isActiveEnergy = metric.id === "active-energy";
  const ae = isActiveEnergy ? getActiveEnergyDetail() : null;
  const aeToGoal = ae ? Math.max(0, ae.moveGoal - ae.activeEnergy) : 0;
  const aePct = ae ? Math.round((ae.activeEnergy / ae.moveGoal) * 100) : 0;
  const aeStrip = ae
    ? `${ae.totalBurn.toLocaleString("en-US")} total · ${ae.restingEnergy.toLocaleString("en-US")} resting · ${ae.exerciseMinutes} min`
    : "";

  return (
    <div
      className="dash-card"
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      style={{
        background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 18,
        padding: 18, cursor: "pointer", display: "flex", flexDirection: "column",
        minHeight: 248,
      }}
    >
      {/* Top: name + source tag */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, color: TEXT_SEC }}>{metric.name}</span>
        <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[metric.source]}</span>
      </div>

      {/* Value + delta (Body Temp shows its value in the ring center instead) */}
      <div style={{ display: isBodyTemp ? "none" : "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {display}
        </span>
        {showUnit && <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>{metric.unit}</span>}
        {metric.delta && !isActiveEnergy && !isRestingHr && (
          <span className="nura-trend-ink" style={{
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            color: metric.delta.dir === "up" ? "var(--nura-optimal)" : SAGE,
            display: "inline-flex", alignItems: "center", gap: 2,
          }}>
            <span style={{ color: metric.delta.dir === "up" ? "var(--nura-status-good)" : "var(--nura-status-alert)" }}>{metric.delta.dir === "up" ? "▲" : "▼"}</span>{metric.delta.value}
          </span>
        )}
        {isRestingHr && rhr && (
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "var(--nura-teal)" }}>
            ▼ {rhr.dayDelta} vs yesterday
          </span>
        )}
        {isSteps && remaining > 0 && (
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "var(--nura-amber)" }}>
            {fmtNumber(remaining)} to go
          </span>
        )}
        {isActiveEnergy && aeToGoal > 0 && (
          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: "var(--nura-amber)" }}>
            {fmtNumber(aeToGoal)} to go
          </span>
        )}
      </div>

      {/* Visualization */}
      <div style={{ marginTop: 14, marginBottom: 14, flex: 1, display: (isRestingHr || isBodyTemp) ? "flex" : undefined, alignItems: (isRestingHr || isBodyTemp) ? "center" : undefined }}>
        {isBodyTemp && bt
          ? <BodyTempCardRing devC={bt.tonight} unit={tempUnit} normalRange={bt.normalRange} />
          : isRestingHr && rhr
            ? <RestingHrZoneBar value={rhr.value} min={rhr.zoneMin} max={rhr.zoneMax} labels={rhr.zoneLabels} />
            : metric.sleepDepth
              ? <SleepDepthChart data={metric.sleepDepth} />
              : isActiveEnergy && ae
                ? <ActiveEnergyTodayChart d={ae} height={140} />
                : <MetricChart data={metric.chart} highTech={isSteps} />}
      </div>

      {/* Steps stat strip — distance · flights · kcal · active time */}
      {isSteps && (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, letterSpacing: "0.2px", marginBottom: 12 }}>
          {statStrip}
        </div>
      )}

      {/* Active Energy stat strip — total · resting · exercise */}
      {isActiveEnergy && (
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, letterSpacing: "0.2px", marginBottom: 12 }}>
          {aeStrip}
        </div>
      )}

      {/* Footer — Body Temp uses a centered "7-day {avg} · within range" line */}
      {isBodyTemp && bt ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: "auto", fontFamily: SANS, fontSize: 11.5, color: TEXT_SEC }}>
          <span className="nura-glow" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--nura-teal)", boxShadow: "0 0 6px var(--nura-teal)" }} />
          <span>
            {deviationDirection(bt.avg7) === "at"
              ? <>7-day avg <b style={{ color: TEXT, fontWeight: 700 }}>right at baseline</b> · within range</>
              : <>7-day avg <b style={{ color: TEXT, fontWeight: 700 }}>{fmtMagUnit(bt.avg7, tempUnit)} {deviationDirection(bt.avg7)}</b> · within range</>}
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto" }}>
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4 }}>
            {isRestingHr && rhr
              ? `${rhrBelow} bpm below your baseline`
              : isActiveEnergy && ae ? `${aePct}% of your ${ae.moveGoal} goal` : metric.caption}
          </span>
          <span style={{ flexShrink: 0 }}>
            {isRestingHr && rhr ? (
              <span style={{
                ...EYEBROW, fontSize: 9, color: "var(--nura-teal)", padding: "3px 8px", borderRadius: 999,
                background: "rgba(var(--nura-teal-rgb),0.12)", border: "0.5px solid rgba(var(--nura-teal-rgb),0.35)",
                whiteSpace: "nowrap",
              }}>
                {rhr.status}
              </span>
            ) : (
              <StatusPill status={isActiveEnergy ? "good" : metric.status} size="sm" />
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// ── 5 · NŪRA insight card ───────────────────────────────────────────────────────
function InsightCard({ text, ctaLabel, onCta }: { text: string; ctaLabel: string; onCta: () => void }) {
  return (
    <div className="dash-insight" style={{
      marginTop: 16, borderRadius: 20, padding: 22,
      background: `linear-gradient(135deg, rgba(var(--nura-sage-rgb),0.06), transparent 60%), ${CARD}`,
      border: `0.5px solid ${BORDER}`, borderLeft: `2px solid ${SAGE}`,
    }}>
      <div style={{ ...EYEBROW, color: "var(--nura-accent-label)", letterSpacing: "2px", marginBottom: 10 }}>NŪRA</div>
      <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT, margin: 0, lineHeight: 1.65 }}>{text}</p>
      <button
        className="dash-cta"
        onClick={onCta}
        style={{
          marginTop: 16, background: "none", border: "none", padding: 0, cursor: "pointer",
          fontFamily: SANS, fontSize: 13, fontWeight: 600, color: SAGE, transition: "color 160ms",
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
