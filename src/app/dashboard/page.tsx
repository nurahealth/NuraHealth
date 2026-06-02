"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NuraPageShell from "@/components/NuraPageShell";
import {
  getDashboardData,
  SOURCE_LABEL,
  type MetricStatus,
  type ConnectedSource,
  type Readiness,
  type DashboardMetric,
} from "@/lib/dashboardData";
import MetricChart from "@/components/dashboard/MetricChart";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const CARD = "var(--nura-card)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
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

  const data = getDashboardData();

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

  if (authLoading) return <NuraPageShell maxWidth={860}><div /></NuraPageShell>;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <NuraPageShell maxWidth={860}>
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

      {/* 3 — Readiness hero */}
      <ReadinessCard readiness={data.readiness} />

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

// ── 3 · Readiness hero card ─────────────────────────────────────────────────────
function ReadinessCard({ readiness }: { readiness: Readiness }) {
  const max = Math.max(...readiness.week.map((d) => d.value), 100);

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      borderRadius: 22, padding: 22,
      background: `radial-gradient(120% 95% at 25% 0%, rgba(var(--nura-optimal-rgb),0.13), rgba(var(--nura-sage-rgb),0.04) 42%, transparent 72%), ${CARD}`,
      border: `0.5px solid ${BORDER}`,
    }}>
      {/* Top row: label + status */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ ...EYEBROW, color: SAGE, paddingTop: 6 }}>Readiness</div>
        <StatusPill status={readiness.status} />
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
        <span style={{
          fontFamily: SANS, fontWeight: 600, color: TEXT, lineHeight: 1,
          fontSize: "clamp(56px, 13vw, 76px)", letterSpacing: "-0.03em",
        }}>
          {readiness.score}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 500, color: TEXT_TER }}>/100</span>
      </div>

      {/* Summary */}
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, margin: "10px 0 0", lineHeight: 1.55, maxWidth: 460 }}>
        {readiness.summary}
      </p>

      {/* 7-day strip */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 22, height: 92 }}>
        {readiness.week.map((d, i) => {
          const h = Math.max(8, (d.value / max) * 70);
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 600,
                color: d.isToday ? TEXT : TEXT_TER,
              }}>
                {d.value}
              </span>
              <div style={{
                width: "100%", maxWidth: 26, height: h, borderRadius: 6,
                background: d.isToday ? "#ffffff" : `rgba(${SAGE_RGB},0.22)`,
              }} />
              <span style={{
                fontFamily: SANS, fontSize: 9.5, letterSpacing: "0.4px",
                color: d.isToday ? TEXT_SEC : TEXT_TER,
                fontWeight: d.isToday ? 600 : 400,
              }}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 4 · Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ metric, onClick }: { metric: DashboardMetric; onClick: () => void }) {
  const s = STATUS[metric.status];
  const display = metric.displayValue ?? fmtNumber(metric.value);
  const showUnit = !metric.displayValue && metric.unit;

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

      {/* Value + delta */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
        <span style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {display}
        </span>
        {showUnit && <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>{metric.unit}</span>}
        {metric.delta && (
          <span style={{
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            color: metric.delta.dir === "up" ? "var(--nura-optimal)" : SAGE,
            display: "inline-flex", alignItems: "center", gap: 2,
          }}>
            {metric.delta.dir === "up" ? "▲" : "▼"}{metric.delta.value}
          </span>
        )}
      </div>

      {/* Visualization */}
      <div style={{ marginTop: 14, marginBottom: 14, flex: 1 }}>
        <MetricChart data={metric.chart} />
      </div>

      {/* Footer caption + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: "auto" }}>
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, lineHeight: 1.4 }}>{metric.caption}</span>
        <span style={{ flexShrink: 0 }}><StatusPill status={metric.status} size="sm" /></span>
      </div>
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
