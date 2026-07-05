"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import SleepView from "@/app/dashboard/sleep/view";
import HrvView from "@/app/dashboard/hrv/view";
import RestingHrView from "@/app/dashboard/resting-hr/view";
import StepsView from "@/app/dashboard/steps/view";
import ActiveEnergyView from "@/app/dashboard/active-energy/view";
import HeartRateView from "@/app/dashboard/heart-rate/view";
import BloodOxygenView from "@/app/dashboard/blood-oxygen/view";
import RespiratoryRateView from "@/app/dashboard/respiratory-rate/view";
import CardioFitnessView from "@/app/dashboard/cardio-fitness/view";
import BloodPressureView from "@/app/dashboard/blood-pressure/view";

// ── Metric order + accents ────────────────────────────────────────────────────
// Mirrors the dashboard grid order (top-to-bottom, left-to-right), excluding the
// metrics without a dedicated detail view (Body Temp, Exercise, Distance). Each
// accent matches the color identity of that metric's detail view.
type MetricMeta = { id: string; accent: string; View: React.ComponentType };

const METRICS: MetricMeta[] = [
  { id: "sleep", accent: "#5aa0e6", View: SleepView },
  { id: "hrv", accent: "#4fc4d6", View: HrvView },
  { id: "resting-hr", accent: "#3fc488", View: RestingHrView },
  { id: "steps", accent: "var(--nura-amber)", View: StepsView },
  { id: "active-energy", accent: "var(--nura-amber)", View: ActiveEnergyView },
  { id: "heart-rate", accent: "var(--nura-alert)", View: HeartRateView },
  { id: "blood-oxygen", accent: "#4fc4d6", View: BloodOxygenView },
  { id: "respiratory-rate", accent: "#bca6e3", View: RespiratoryRateView },
  { id: "cardio-fitness", accent: "#e3b765", View: CardioFitnessView },
  { id: "blood-pressure", accent: "#cf8fa0", View: BloodPressureView },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function MetricPager({ initialMetric }: { initialMetric: string }) {
  const initialIndex = Math.max(0, METRICS.findIndex((m) => m.id === initialMetric));
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initialIndex);
  const ready = useRef(false);

  // Open already scrolled to the tapped metric — instant, before first paint.
  // Every panel reserves its full width (even the un-rendered ones), so this
  // lands exactly on the requested panel.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = initialIndex * el.clientWidth;
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the snapped panel as the user swipes.
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !ready.current) return;
    const w = el.clientWidth;
    if (!w) return;
    const idx = Math.max(0, Math.min(METRICS.length - 1, Math.round(el.scrollLeft / w)));
    setActive((prev) => (prev === idx ? prev : idx));
  }, []);

  // Keep the URL in sync with the active metric — shallow, no route reload.
  useEffect(() => {
    const id = METRICS[active]?.id;
    if (!id) return;
    const url = `/dashboard/${id}`;
    if (window.location.pathname !== url) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [active]);

  const jumpTo = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  return (
    <>
      <style>{`
        .mp-scroller {
          position: fixed; inset: 0; z-index: 1;
          display: flex; flex-wrap: nowrap;
          overflow-x: auto; overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
        }
        .mp-scroller::-webkit-scrollbar { display: none; }
        .mp-panel {
          flex: 0 0 100%; width: 100%;
          /* Each panel is its own vertically-scrollable column: full viewport
             height + its own scroll context. The outer .mp-scroller owns the
             horizontal snap; vertical scrolling happens WITHIN each panel.
             min-height keeps un-rendered placeholder panels full-height so the
             horizontal snap positions never drift. */
          height: 100dvh; min-height: 100dvh;
          overflow-y: auto; overflow-x: hidden;
          scroll-snap-align: start; scroll-snap-stop: always;
          -webkit-overflow-scrolling: touch;
        }
        .mp-panel::-webkit-scrollbar { display: none; }
        .mp-dot { transition: width 240ms cubic-bezier(.2,.7,.2,1), background 240ms, box-shadow 240ms; }
      `}</style>

      <div ref={scrollerRef} className="mp-scroller" onScroll={onScroll}>
        {METRICS.map((m, i) => {
          const View = m.View;
          // Render only the active panel and its neighbors; the others stay as
          // full-width empty placeholders so scroll-snap geometry is preserved.
          const render = Math.abs(i - active) <= 1;
          return (
            <div key={m.id} className="mp-panel">
              {render ? <View /> : null}
            </div>
          );
        })}
      </div>

      {/* Page dots — pinned at top, active one elongated + tinted with its accent */}
      <div
        role="tablist"
        aria-label="Metric pages"
        style={{
          position: "fixed", top: "max(env(safe-area-inset-top), 10px)",
          left: "50%", transform: "translateX(-50%)", zIndex: 50,
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 999,
          background: "rgba(13,13,14,0.32)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          border: "0.5px solid rgba(235,230,216,0.08)",
        }}
      >
        {METRICS.map((m, i) => {
          const on = i === active;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={on}
              aria-label={m.id}
              onClick={() => jumpTo(i)}
              style={{
                border: "none", background: "transparent", padding: 0, margin: 0,
                cursor: "pointer", display: "flex", alignItems: "center",
              }}
            >
              <span
                className="mp-dot"
                style={{
                  display: "block", height: 6, borderRadius: 999,
                  width: on ? 18 : 6,
                  background: on ? m.accent : "rgba(235,230,216,0.3)",
                  boxShadow: on ? `0 0 8px ${m.accent}` : "none",
                }}
              />
            </button>
          );
        })}
      </div>
    </>
  );
}
