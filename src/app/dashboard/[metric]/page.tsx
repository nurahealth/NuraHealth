"use client";

// Placeholder metric-detail view. The full big-graph version comes next — for
// now it just confirms the route works and echoes the metric name + value from
// the shared dashboard data module.

import { use } from "react";
import { useRouter } from "next/navigation";
import NuraPageShell from "@/components/NuraPageShell";
import { getMetric, SOURCE_LABEL } from "@/lib/dashboardData";

const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const CARD = "var(--nura-card)";
const SAGE = "var(--nura-sage)";
const SANS = "var(--font-inter), system-ui, sans-serif";

const EYEBROW: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.6px", textTransform: "uppercase",
};

export default function MetricDetailPage({ params }: { params: Promise<{ metric: string }> }) {
  const { metric } = use(params);
  const router = useRouter();
  const m = getMetric(metric);

  return (
    <NuraPageShell maxWidth={860}>
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 20,
          background: "none", border: "none", padding: 0, cursor: "pointer",
          fontFamily: SANS, fontSize: 13, fontWeight: 500, color: TEXT_SEC,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Dashboard
      </button>

      {m ? (
        <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 22, padding: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <span style={{ ...EYEBROW, color: TEXT_SEC }}>{m.name}</span>
            <span style={{ ...EYEBROW, fontSize: 9, color: TEXT_TER }}>{SOURCE_LABEL[m.source]}</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
            <span style={{ fontFamily: SANS, fontSize: 48, fontWeight: 600, color: TEXT, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {m.displayValue ?? m.value.toLocaleString("en-US")}
            </span>
            {!m.displayValue && m.unit && (
              <span style={{ fontFamily: SANS, fontSize: 16, color: TEXT_SEC }}>{m.unit}</span>
            )}
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, margin: "12px 0 0", lineHeight: 1.55 }}>
            {m.caption}
          </p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, margin: "22px 0 0" }}>
            Full detail view with the big graph is coming next.
          </p>
        </div>
      ) : (
        <div style={{ background: CARD, border: `0.5px solid ${BORDER}`, borderRadius: 22, padding: 26 }}>
          <div style={{ ...EYEBROW, color: SAGE, marginBottom: 8 }}>Unknown metric</div>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT, margin: 0 }}>
            No metric found for “{metric}”.
          </p>
        </div>
      )}
    </NuraPageShell>
  );
}
