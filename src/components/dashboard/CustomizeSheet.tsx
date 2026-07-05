"use client";

import { type ReactElement } from "react";
import { SOURCE_LABEL, type DashboardMetric } from "@/lib/dashboardData";
import { hex } from "@/components/dashboard/ActiveEnergyTodayChart";

// ─────────────────────────────────────────────────────────────────────────────
// Customize dashboard — bottom sheet listing every AVAILABLE metric (Layer 1)
// with a sage toggle to show/hide it (Layer 2). Toggling persists immediately
// via the shared store; the live count + row dimming reflect the change at once.
// ─────────────────────────────────────────────────────────────────────────────

const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "'Fraunces', Georgia, serif";
const TEXT = "#ebe6d8";
const MUTED = "rgba(235,230,216,0.58)";
const FAINT = "rgba(235,230,216,0.32)";
const SAGE = "#9bb0a5";

// hexA on the shared hex tuple helper — "#5dccae" + alpha → rgba string.
const hexA = (h: string, a: number) => {
  const [r, g, b] = hex(h);
  return `rgba(${r},${g},${b},${a})`;
};

// Per-metric color + icon (mirrors each card/detail page's established accent).
const META: Record<string, { color: string; icon: string }> = {
  sleep: { color: "#5aa0e6", icon: "moon" },
  hrv: { color: "#5dccae", icon: "wave" },
  "resting-hr": { color: "#5dccae", icon: "heart" },
  "heart-rate": { color: "#e8745a", icon: "heart" },
  steps: { color: "#d3a253", icon: "steps" },
  "active-energy": { color: "#e0a23e", icon: "flame" },
  "body-temperature": { color: "#5dccae", icon: "temp" },
  exercise: { color: "#5dccae", icon: "dumbbell" },
  distance: { color: "#5aa0e6", icon: "route" },
  "blood-oxygen": { color: "#5dccae", icon: "drop" },
  "respiratory-rate": { color: "#a98fc4", icon: "lungs" },
  "cardio-fitness": { color: "#d3a253", icon: "activity" },
  "blood-pressure": { color: "#c47d8e", icon: "gauge" },
};
const FALLBACK = { color: SAGE, icon: "dot" };

function MetricIcon({ name, color }: { name: string; color: string }) {
  const c = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactElement> = {
    moon: <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" />,
    wave: <path d="M3 12h3l2-6 4 12 2-6h7" />,
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2 4 4 0 017 2c0 5.5-7 10-7 10z" />,
    steps: <><path d="M7 4c-1.5 0-2.5 1.6-2.5 4.5S5.5 13 7 13s2-2 2-4.5S8.5 4 7 4z" /><path d="M16 8c1.5 0 2.5 1.6 2.5 4.5S17.5 17 16 17s-2-2-2-4.5S14.5 8 16 8z" /></>,
    flame: <path d="M12 3s5 4.5 5 9a5 5 0 01-10 0c0-1.8 1-3.4 2-4.5C9.5 9 10 7 9 5c2 0 3 1 3 1z" />,
    temp: <path d="M12 3a2 2 0 00-2 2v8a4 4 0 104 0V5a2 2 0 00-2-2z" />,
    dumbbell: <><path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" /></>,
    route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h6a4 4 0 000-8H9a4 4 0 010-8h" /></>,
    drop: <path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z" />,
    lungs: <><path d="M12 4v8" /><path d="M8 8c-2 1-3 3-3 6v3a2 2 0 002 2c1.5 0 2-1 2-2.5V11c0-2-1-3-3-3z" /><path d="M16 8c2 1 3 3 3 6v3a2 2 0 01-2 2c-1.5 0-2-1-2-2.5V11c0-2 1-3 3-3z" /></>,
    activity: <path d="M3 12h4l2.5-7 4 14 2.5-7H21" />,
    gauge: <><path d="M4 18a8 8 0 0116 0" /><path d="M12 18l4.5-4.5" /></>,
    dot: <circle cx="12" cy="12" r="6" />,
  };
  return <svg {...c}>{paths[name] ?? paths.dot}</svg>;
}

// Sage toggle switch.
function Switch({ on }: { on: boolean }) {
  return (
    <span style={{
      width: 42, height: 24, borderRadius: 999, flex: "none", position: "relative",
      transition: "background .18s",
      background: on ? SAGE : "rgba(235,230,216,0.14)",
      border: on ? "none" : "1px solid rgba(235,230,216,0.12)",
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 20 : 2,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left .18s", boxShadow: "0 1px 3px rgba(0,0,0,0.45)",
      }} />
    </span>
  );
}

export default function CustomizeSheet({
  open, onClose, available, hidden, onToggle,
}: {
  open: boolean;
  onClose: () => void;
  available: DashboardMetric[];
  hidden: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (!open) return null;

  const shown = available.filter((m) => !hidden.has(m.id)).length;
  const total = available.length;

  return (
    <>
      <style>{`
        @keyframes cs-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cs-rise { from { transform: translateY(100%); } to { transform: none; } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", animation: "cs-fade .2s ease forwards" }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 81,
          margin: "0 auto", maxWidth: 480, width: "100%",
          background: "var(--nura-glass)",
          backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          borderTop: "1px solid var(--nura-glass-line)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: "0 -22px 60px rgba(0,0,0,.5)",
          padding: "10px 16px max(env(safe-area-inset-bottom), 18px)",
          color: TEXT, fontFamily: SANS,
          animation: "cs-rise .26s cubic-bezier(.2,.7,.2,1) forwards",
          maxHeight: "86dvh", overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 12px" }}>
          <span style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(235,230,216,0.22)" }} />
        </div>

        {/* Title + subtitle */}
        <div style={{ padding: "0 2px" }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, letterSpacing: "-0.2px" }}>Customize dashboard</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4, lineHeight: 1.45 }}>
            Show or hide metric cards. Hidden cards also leave your dashboard overview.
          </div>
        </div>

        {/* Count */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: SAGE, margin: "16px 2px 6px" }}>
          {shown} of {total} shown
        </div>

        {/* Rows */}
        <div>
          {available.map((m) => {
            const meta = META[m.id] ?? FALLBACK;
            const on = !hidden.has(m.id);
            return (
              <div
                key={m.id}
                onClick={() => onToggle(m.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 2px", cursor: "pointer",
                  borderTop: "1px solid rgba(235,230,216,0.07)",
                  opacity: on ? 1 : 0.45, transition: "opacity .18s",
                }}
              >
                <div style={{ flex: "none", width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: hexA(meta.color, 0.13), border: `1px solid ${hexA(meta.color, 0.26)}` }}>
                  <MetricIcon name={meta.icon} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: FAINT, letterSpacing: "0.3px", marginTop: 1 }}>{SOURCE_LABEL[m.source]}</div>
                </div>
                <Switch on={on} />
              </div>
            );
          })}
        </div>

        {/* Done */}
        <button
          onClick={onClose}
          style={{
            width: "100%", marginTop: 16, padding: "13px 0", borderRadius: 14, border: "none", cursor: "pointer",
            background: SAGE, color: "#13201b", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, letterSpacing: "0.2px",
          }}
        >
          Done
        </button>
      </div>
    </>
  );
}
