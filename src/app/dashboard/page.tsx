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
import { useTemperatureUnitStore, fmtMagUnit, deviationDirection } from "@/lib/temperatureUnit";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const CARD = "var(--nura-card)";
const SAGE = "var(--nura-sage)";
const SANS = "'Inter', system-ui, sans-serif";

const STATUS: Record<MetricStatus, { color: string; rgb: string; label: string }> = {
  optimal: { color: "var(--nura-optimal)", rgb: "var(--nura-optimal-rgb)", label: "Optimal" },
  good: { color: "var(--nura-good)", rgb: "var(--nura-good-rgb)", label: "Good" },
  alert: { color: "var(--nura-alert)", rgb: "var(--nura-alert-rgb)", label: "Alert" },
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

  const data = getDashboardData();

  // Hydrate the temperature-unit preference from storage / locale on mount.
  useEffect(() => { initUnit(); }, [initUnit]);

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

  if (authLoading) return <NuraPageShell maxWidth={480}><div /></NuraPageShell>;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <NuraPageShell maxWidth={480}>
      <style>{`
        .dash-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 640px) { .dash-grid { grid-template-columns: 1fr 1fr; gap: 16px; } }
        .dash-card { transition: border-color 180ms, transform 180ms; }
        .dash-card:hover { border-color: rgba(var(--nura-sage-rgb),0.35) !important; transform: translateY(-2px); }
        .dash-cta:hover { color: var(--nura-sage-hover) !important; }
      `}</style>

      {/* 1 — Date eyebrow + greeting */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...EYEBROW, color: SAGE, marginBottom: 8 }}>
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

      {/* 3 — Health Plan (sits directly above Overall Health) */}
      <HealthPlanCard />

      {/* 4 — Overall Health (replaces the old Readiness hero) */}
      <OverallHealthCard />

      {/* 4 — Metric grid */}
      <div className="dash-grid" style={{ marginTop: 16 }}>
        {data.metrics.map((m) => (
          <MetricCard key={m.id} metric={m} onClick={() => router.push(`/dashboard/${m.id}`)} />
        ))}
      </div>

      {/* 5 — NŪRA insight */}
      <InsightCard
        text={data.insight.text}
        ctaLabel={data.insight.ctaLabel}
        onCta={() => router.push(data.insight.ctaHref)}
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
    <span style={{
      ...EYEBROW, fontSize: fs, color: s.color, padding: pad, borderRadius: 999,
      background: `rgba(${s.rgb},0.12)`, border: `0.5px solid rgba(${s.rgb},0.35)`,
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
          <span style={{
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            color: metric.delta.dir === "up" ? "var(--nura-optimal)" : SAGE,
            display: "inline-flex", alignItems: "center", gap: 2,
          }}>
            {metric.delta.dir === "up" ? "▲" : "▼"}{metric.delta.value}
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
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--nura-teal)", boxShadow: "0 0 6px var(--nura-teal)" }} />
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
    <div style={{
      marginTop: 16, borderRadius: 20, padding: 22,
      background: `linear-gradient(135deg, rgba(var(--nura-sage-rgb),0.06), transparent 60%), ${CARD}`,
      border: `0.5px solid ${BORDER}`, borderLeft: `2px solid ${SAGE}`,
    }}>
      <div style={{ ...EYEBROW, color: SAGE, letterSpacing: "2px", marginBottom: 10 }}>NŪRA</div>
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
