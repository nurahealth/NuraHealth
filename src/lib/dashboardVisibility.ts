import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { getDashboardData, type DashboardMetric } from "@/lib/dashboardData";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard card visibility — the single shared source of truth for which metric
// cards render, read by both the dashboard grid and the Customize sheet (and any
// future metric-overview section).
//
//   Layer 1 (automatic): a card is AVAILABLE only if its data source is connected
//           and it actually returns data. Computed from the existing dashboard /
//           integration-connection state — no new fetching, no invented sources.
//   Layer 2 (manual):    of the available cards, the user may hide some. The
//           hidden set is persisted per-user in the dashboard_preferences table.
//
//   A card is VISIBLE  ⇔  available AND not hidden.
// ─────────────────────────────────────────────────────────────────────────────
const TABLE = "dashboard_preferences";

/** Layer 1 — metrics whose source is connected and that return data. */
export function getAvailableMetrics(): DashboardMetric[] {
  const d = getDashboardData();
  // In development we never silently drop a metric card for lack of live data:
  // any chart-bearing metric stays visible (rendering its example values) so it
  // also shows up in Customize and can be toggled. Production keeps the strict
  // auto-hide gate, so cards still disappear when their source returns nothing.
  const devShowAll = process.env.NODE_ENV !== "production";
  return d.metrics.filter((m) => {
    const src = d.sources.find((s) => s.id === m.source);
    // Source connected, the metric returns data, and it isn't explicitly gated
    // off for lack of readings (e.g. Blood Pressure with no BP source).
    const available = Boolean(src?.connected) && Boolean(m.chart) && m.dataAvailable !== false;
    return available || (devShowAll && Boolean(m.chart));
  });
}

interface PrefsState {
  hidden: string[];
  ready: boolean;
  /** Load the persisted hidden set (call once on dashboard mount). */
  load: () => Promise<void>;
  /** Flip a metric's hidden state and persist immediately (optimistic). */
  toggle: (id: string) => Promise<void>;
}

export const useDashboardPrefs = create<PrefsState>((set, get) => ({
  hidden: [],
  ready: false,
  load: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { set({ ready: true }); return; }
      const { data } = await supabase
        .from(TABLE)
        .select("hidden_metrics")
        .eq("user_id", user.id)
        .maybeSingle();
      set({ hidden: data?.hidden_metrics ?? [], ready: true });
    } catch {
      set({ ready: true });
    }
  },
  toggle: async (id) => {
    const cur = get().hidden;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ hidden: next }); // optimistic
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from(TABLE)
        .upsert({ user_id: user.id, hidden_metrics: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    } catch {
      // keep the optimistic local state; a later load() will reconcile
    }
  },
}));

export interface DashboardVisibility {
  /** Layer 1 — metrics that have data (also the exact set the Customize sheet lists). */
  available: DashboardMetric[];
  /** Currently hidden metric ids. */
  hidden: Set<string>;
  /** Available ∩ not hidden, in dashboard order. */
  visible: DashboardMetric[];
  isVisible: (id: string) => boolean;
  toggle: (id: string) => void;
  ready: boolean;
}

/** Shared visibility hook — Layer 1 (available) ∩ Layer 2 (not hidden). */
export function useDashboardVisibility(): DashboardVisibility {
  const hiddenArr = useDashboardPrefs((s) => s.hidden);
  const ready = useDashboardPrefs((s) => s.ready);
  const toggle = useDashboardPrefs((s) => s.toggle);

  const available = getAvailableMetrics();
  const hidden = new Set(hiddenArr);
  const visible = available.filter((m) => !hidden.has(m.id));

  return {
    available,
    hidden,
    visible,
    ready,
    toggle,
    isVisible: (id) => available.some((m) => m.id === id) && !hidden.has(id),
  };
}
