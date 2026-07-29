// ─────────────────────────────────────────────────────────────────────────────
// Dashboard data module
//
// Single source of truth for every metric value shown on the Dashboard.
// Today it returns realistic SAMPLE values. It is shaped so that a real
// device-integration source (Oura / Apple Watch / Apple Health) can later
// implement `getDashboardData()` (e.g. async, fetched per-user) WITHOUT the
// Dashboard UI having to change — the UI only ever reads these typed shapes.
// ─────────────────────────────────────────────────────────────────────────────

import type { AccentToken } from "@/lib/accents";

export type MetricStatus = "optimal" | "good" | "alert";

export type SourceId = "oura" | "apple-watch" | "apple-health";

/** Human-facing label for a device source. */
export const SOURCE_LABEL: Record<SourceId, string> = {
  oura: "Oura",
  "apple-watch": "Apple Watch",
  "apple-health": "Apple Health",
};

// ── Connected sources strip ──────────────────────────────────────────────────
export interface ConnectedSource {
  id: SourceId;
  name: string;
  connected: boolean;
  /** "live" = streaming now, "synced" = last successful sync. */
  state: "live" | "synced";
  /** Short label rendered next to the status dot, e.g. "synced 2m" / "live". */
  syncLabel: string;
}

// ── Readiness hero ───────────────────────────────────────────────────────────
export interface ReadinessDay {
  /** Short weekday label, e.g. "Mon". */
  day: string;
  value: number;
  /** The current day — rendered as a solid white bar. */
  isToday: boolean;
}

export interface Readiness {
  score: number;
  status: MetricStatus;
  summary: string;
  week: ReadinessDay[];
}

// ── Metric-card visualizations (discriminated union) ─────────────────────────
export interface SleepStage {
  /** "Deep" | "REM" | "Light" | "Awake" — UI maps the label to a color. */
  label: string;
  hours: number;
}

export type MetricViz =
  | { kind: "sleep-stages"; stages: SleepStage[] }
  | { kind: "sparkline"; points: number[] }
  | { kind: "progress-ring"; value: number; goal: number }
  | { kind: "mini-bars"; bars: number[] }
  | { kind: "deviation"; value: number; baseline: number; range: number };

// ── Metric-card chart (shared rich bar chart) ────────────────────────────────
/** Color ramp direction, applied per-bar by normalized value. */
export type ChartRamp = "hr" | "higherBetter" | "lowerBetter";

export interface MetricChartData {
  /** Dense intraday readings (~36–44 samples, 12a → now). */
  readings: number[];
  /** Coarse series driving the dashed threshold curve. */
  baseline: number[];
  /** Bottom of the plotted value range (bars rise from here). */
  floor: number;
  /** Top of the plotted value range. */
  ceiling: number;
  /** Up to 3 values to draw gridlines + edge labels at. */
  gridlines: number[];
  ramp: ChartRamp;
}

// ── Sleep depth chart (the Sleep card's bespoke overnight chart) ─────────────
/** One stage shown in the duration row beneath the sleep depth chart. */
export interface SleepDepthStage {
  /** "Deep" | "REM" | "Light" | "Awake". */
  label: string;
  /** Pre-formatted duration, e.g. "1h 22m". */
  duration: string;
  /** Swatch / depth-band color (a --nura-* token or rgba expression). */
  color: string;
}

export interface SleepDepthChartData {
  /** Per-sample sleep depth 0–1 across the night; bar height = depth, color by band. */
  depth: number[];
  /** Stage-duration row beneath the chart. */
  stages: SleepDepthStage[];
  /** Evenly-spaced time axis labels under the chart. */
  axisLabels: string[];
}

// ── Metric card ──────────────────────────────────────────────────────────────
export interface DashboardMetric {
  /** Route slug — links to /dashboard/[id]. */
  id: string;
  name: string;
  source: SourceId;
  value: number;
  /** Optional pre-formatted display string (e.g. "7h 42m"); falls back to value+unit. */
  displayValue?: string;
  unit: string;
  delta?: { value: number; dir: "up" | "down" };
  status: MetricStatus;
  caption: string;
  viz: MetricViz;
  /** Rich bar-chart data rendered by every metric card. */
  chart: MetricChartData;
  /** Sleep-only: bespoke overnight depth chart (bars + wave line) for the Sleep card. */
  sleepDepth?: SleepDepthChartData;
  /**
   * Explicit data-availability gate (default: present). Set false when the
   * connected platform returns no readings for this metric — e.g. Blood Pressure
   * for the many users with no BP source. The dashboard hides such cards and
   * drops them from the Customize sheet until real data exists.
   */
  dataAvailable?: boolean;
}

// ── Bottom insight card ──────────────────────────────────────────────────────
export interface DashboardInsight {
  text: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface DashboardData {
  /** Fallback first name; the page prefers the authenticated user's name. */
  user: { firstName: string };
  sources: ConnectedSource[];
  readiness: Readiness;
  metrics: DashboardMetric[];
  insight: DashboardInsight;
}

// ── Chart sample helpers ─────────────────────────────────────────────────────
// Synthesize realistic intraday shapes as a sum of Gaussian "bumps". A real
// device source would supply these arrays directly.
function gauss(i: number, center: number, width: number, h: number): number {
  return h * Math.exp(-((i - center) ** 2) / (2 * width * width));
}
function dayReadings(n: number, floor: number, peaks: [number, number, number][]): number[] {
  return Array.from({ length: n }, (_, i) =>
    Number(peaks.reduce((s, [c, w, h]) => s + gauss(i, c, w, h), floor).toFixed(2)),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample payload
// ─────────────────────────────────────────────────────────────────────────────
const DASHBOARD_DATA: DashboardData = {
  user: { firstName: "Alex" },

  // Simulate ALL devices connected so the overview shows no locked cards. A real
  // integration would set `connected` per the user's actual linked devices; the
  // adaptive locked-state UI then surfaces for anyone who owns only one device.
  sources: [
    { id: "oura", name: "Oura", connected: true, state: "synced", syncLabel: "synced 2m" },
    { id: "apple-watch", name: "Apple Watch", connected: true, state: "live", syncLabel: "live" },
    { id: "apple-health", name: "Apple Health", connected: true, state: "synced", syncLabel: "synced" },
  ],

  readiness: {
    score: 87,
    status: "optimal",
    summary: "Your body is well-recovered and primed for a demanding day.",
    week: [
      { day: "Mon", value: 72, isToday: false },
      { day: "Tue", value: 80, isToday: false },
      { day: "Wed", value: 68, isToday: false },
      { day: "Thu", value: 84, isToday: false },
      { day: "Fri", value: 79, isToday: false },
      { day: "Sat", value: 88, isToday: false },
      { day: "Sun", value: 87, isToday: true },
    ],
  },

  metrics: [
    {
      id: "sleep",
      name: "Sleep",
      source: "oura",
      value: 7.7,
      displayValue: "7h 42m",
      unit: "",
      delta: { value: 0.4, dir: "up" },
      status: "optimal",
      caption: "Above your 7h goal · strong deep sleep",
      viz: {
        kind: "sleep-stages",
        stages: [
          { label: "Deep", hours: 1.5 },
          { label: "REM", hours: 1.8 },
          { label: "Light", hours: 3.9 },
          { label: "Awake", hours: 0.5 },
        ],
      },
      chart: {
        readings: dayReadings(40, 0, [[2, 2, 70], [5, 3, 88], [9, 2.2, 62]]),
        baseline: [70, 82, 60, 8, 2, 2, 2, 2],
        floor: 0, ceiling: 100, gridlines: [30, 60, 90], ramp: "higherBetter",
      },
      sleepDepth: {
        // Per-sample sleep depth across the night (0–1). Bar height = depth;
        // color by band: deep ≥0.78 · light ≥0.5 · REM ≥0.3 · awake below.
        depth: [
          0.22, 0.45, 0.7, 0.88, 0.95, 0.9, 0.74, 0.58, 0.5, 0.56,
          0.7, 0.84, 0.8, 0.62, 0.44, 0.38, 0.46, 0.6, 0.74, 0.68,
          0.5, 0.36, 0.34, 0.46, 0.58, 0.52, 0.4, 0.3, 0.16, 0.2,
        ],
        stages: [
          // The ordered stage ramp, not four separately-chosen hues. Awake was
          // pointing at --nura-good, a STATUS colour, so on white it rendered
          // amber next to three sage swatches — the one rainbow left in the
          // light dashboard. The other three were hardcoded to the dark hues
          // they happen to equal, which left the light ramp out of order:
          // "Light" resolved to the deepened accent and came out darker than
          // "REM". Every entry now names its stage token, which is defined per
          // theme (dark: the original hues, light: monotonic sage steps).
          { label: "Deep", duration: "1h 22m", color: "--nura-stage-deep" },
          { label: "REM", duration: "1h 48m", color: "--nura-stage-rem" },
          { label: "Light", duration: "4h 02m", color: "--nura-stage-light" },
          { label: "Awake", duration: "0h 20m", color: "--nura-stage-awake" },
        ],
        axisLabels: ["11p", "1a", "3a", "5a", "7a"],
      },
    },
    {
      id: "hrv",
      name: "HRV",
      source: "oura",
      value: 62,
      unit: "ms",
      delta: { value: 8, dir: "up" },
      status: "optimal",
      caption: "Trending up over the last 7 days",
      viz: { kind: "sparkline", points: [48, 52, 49, 55, 58, 60, 62] },
      chart: {
        readings: [34, 40, 36, 44, 38, 46, 42, 50, 44, 52, 48, 56, 50, 58, 54, 60, 52, 62, 56, 64, 58, 66, 60, 68, 62, 70, 64, 66, 60, 68, 64, 70, 66, 62, 64, 62],
        baseline: [34, 42, 50, 56, 62, 66, 63, 60],
        floor: 20, ceiling: 80, gridlines: [30, 50, 70], ramp: "higherBetter",
      },
    },
    {
      id: "resting-hr",
      name: "Resting HR",
      source: "oura",
      value: 52,
      unit: "bpm",
      delta: { value: 2, dir: "down" },
      status: "good",
      caption: "Steady and low through the week",
      viz: { kind: "sparkline", points: [58, 57, 56, 55, 56, 55, 54] },
      chart: {
        readings: [58, 57, 56, 55, 57, 54, 55, 53, 54, 56, 53, 52, 54, 55, 53, 54, 52, 53, 55, 54, 52, 53, 54, 55, 53, 54, 52, 53, 54, 52, 53, 54, 53, 52, 54, 54],
        baseline: [57, 55, 54, 53, 53, 53, 54, 54],
        floor: 45, ceiling: 70, gridlines: [50, 55, 60], ramp: "lowerBetter",
      },
    },
    {
      id: "steps",
      name: "Steps",
      source: "apple-health",
      value: 8420,
      unit: "steps",
      status: "good",
      caption: "84% of your 10,000 goal",
      viz: { kind: "progress-ring", value: 8420, goal: 10000 },
      chart: {
        readings: dayReadings(40, 12, [[11, 3, 260], [20, 5, 420], [30, 3, 640], [37, 2, 360]]),
        baseline: [20, 120, 360, 520, 700, 520, 300, 160],
        floor: 0, ceiling: 1100, gridlines: [300, 600, 900], ramp: "higherBetter",
      },
    },
    {
      id: "active-energy",
      name: "Active Energy",
      source: "apple-watch",
      value: 612,
      unit: "kcal",
      delta: { value: 48, dir: "up" },
      status: "optimal",
      caption: "Above your daily average",
      viz: { kind: "mini-bars", bars: [380, 420, 510, 470, 560, 590, 612] },
      chart: {
        readings: dayReadings(40, 3, [[11, 3, 22], [20, 5, 36], [30, 3, 52], [37, 2, 28]]),
        baseline: [4, 18, 34, 46, 58, 44, 28, 14],
        floor: 0, ceiling: 80, gridlines: [20, 40, 60], ramp: "higherBetter",
      },
    },
    {
      id: "body-temperature",
      name: "Body Temp",
      source: "oura",
      value: 0.3,
      displayValue: "+0.3°F",
      unit: "°F",
      status: "good",
      caption: "Slightly above your baseline",
      viz: { kind: "deviation", value: 0.3, baseline: 0, range: 1.5 },
      chart: {
        readings: dayReadings(40, 0, [[5, 4, -0.45], [34, 5, 0.5]]),
        baseline: [-0.2, -0.4, -0.3, -0.1, 0.1, 0.3, 0.4, 0.2],
        floor: -1, ceiling: 1.5, gridlines: [-0.5, 0, 1], ramp: "lowerBetter",
      },
    },
    {
      id: "heart-rate",
      name: "Heart Rate",
      source: "apple-watch",
      value: 72,
      unit: "bpm",
      status: "good",
      caption: "Continuous · range 52–138 bpm today",
      viz: { kind: "sparkline", points: [62, 78, 95, 71, 66, 88, 74, 72] },
      chart: {
        readings: [58, 55, 54, 52, 53, 56, 60, 58, 54, 52, 55, 62, 58, 70, 82, 76, 68, 90, 104, 88, 72, 118, 96, 84, 130, 138, 110, 92, 78, 86, 74, 96, 108, 90, 82, 70, 76, 64, 60, 58, 56, 54, 52, 71],
        baseline: [56, 58, 66, 90, 120, 84, 64, 58],
        floor: 45, ceiling: 150, gridlines: [60, 100, 140], ramp: "hr",
      },
    },
    {
      id: "exercise",
      name: "Exercise",
      source: "apple-watch",
      value: 48,
      unit: "min",
      delta: { value: 12, dir: "up" },
      status: "optimal",
      caption: "18 min over your 30 min goal",
      viz: { kind: "mini-bars", bars: [22, 35, 18, 41, 30, 52, 48] },
      chart: {
        readings: dayReadings(40, 0.2, [[12, 1.6, 6.2], [31, 2, 9]]),
        baseline: [0.3, 1, 4, 2, 3, 7, 3, 1],
        floor: 0, ceiling: 10, gridlines: [2, 5, 8], ramp: "higherBetter",
      },
    },
    {
      id: "distance",
      name: "Distance",
      source: "apple-health",
      value: 4.2,
      unit: "mi",
      delta: { value: 0.8, dir: "up" },
      status: "good",
      caption: "From today's 8,420 steps",
      viz: { kind: "mini-bars", bars: [2.1, 3.4, 1.8, 3.9, 3.1, 4.8, 4.2] },
      chart: {
        readings: dayReadings(40, 0.01, [[11, 3, 0.16], [20, 5, 0.3], [30, 3, 0.42], [37, 2, 0.22]]),
        baseline: [0.02, 0.1, 0.28, 0.4, 0.5, 0.36, 0.22, 0.12],
        floor: 0, ceiling: 0.6, gridlines: [0.1, 0.3, 0.5], ramp: "higherBetter",
      },
    },
    {
      id: "blood-oxygen",
      name: "Blood Oxygen",
      source: "oura",
      value: 97,
      unit: "%",
      status: "optimal",
      caption: "Stayed in your healthy range overnight",
      viz: { kind: "sparkline", points: [96, 97, 98, 97, 96, 97, 97] },
      chart: {
        readings: [97, 97, 98, 97, 96, 97, 98, 97, 96, 95, 94, 95, 97, 98, 97, 97, 96, 97, 98, 98, 97, 96, 95, 94, 95, 96, 97, 98, 97, 97, 98, 97],
        baseline: [97, 96, 97, 97, 96, 97, 97, 97],
        floor: 90, ceiling: 100, gridlines: [90, 95, 100], ramp: "higherBetter",
      },
    },
    {
      id: "respiratory-rate",
      name: "Respiratory Rate",
      source: "oura",
      value: 14.2,
      displayValue: "14.2",
      unit: "br/min",
      status: "good",
      caption: "Right on your baseline",
      viz: { kind: "sparkline", points: [14.4, 14.2, 14.0, 14.3, 14.2, 14.1, 14.2] },
      chart: {
        readings: [14.4, 14.2, 14.0, 14.3, 14.5, 14.2, 13.9, 14.1, 14.4, 14.6, 14.3, 14.0, 13.8, 14.1, 14.3, 14.5, 14.2, 14.0, 14.2, 14.4, 14.3, 14.1, 13.9, 14.2, 14.4, 14.3, 14.1, 14.0, 14.2, 14.3, 14.2, 14.1],
        baseline: [14.3, 14.2, 14.3, 14.2, 14.3, 14.2, 14.2, 14.2],
        floor: 12, ceiling: 17, gridlines: [12, 14, 16], ramp: "higherBetter",
      },
    },
    {
      id: "cardio-fitness",
      name: "Cardio Fitness",
      source: "apple-watch",
      value: 48,
      unit: "ml/kg·min",
      delta: { value: 1.5, dir: "up" },
      status: "good",
      caption: "Above average for your age & sex",
      viz: { kind: "mini-bars", bars: [45.5, 46, 46.2, 46.8, 47.3, 48] },
      chart: {
        readings: [45.5, 46, 46.2, 46.8, 47.3, 48],
        baseline: [45.5, 46.2, 47, 48],
        floor: 44, ceiling: 49, gridlines: [45, 47, 49], ramp: "higherBetter",
      },
    },
    {
      id: "blood-pressure",
      name: "Blood Pressure",
      source: "apple-health",
      value: 118,
      displayValue: "118/76",
      unit: "mmHg",
      status: "good",
      caption: "Tracked from your health platform",
      // Gated OFF by default — most users have no BP source. Flip to true (or
      // remove) once the connected platform actually returns BP readings.
      dataAvailable: false,
      viz: { kind: "sparkline", points: [122, 120, 119, 118, 117, 118] },
      chart: {
        readings: [122, 120, 119, 121, 118, 117, 119, 120, 118, 116, 119, 118],
        baseline: [120, 119, 118, 118],
        floor: 60, ceiling: 140, gridlines: [80, 100, 120], ramp: "lowerBetter",
      },
    },
  ],

  insight: {
    text:
      "Readiness is optimal and your HRV climbed 8ms overnight — a strong recovery signal. With resting heart rate holding low, today is well-suited for higher-intensity training. Your magnesium and consistent sleep timing are paying off.",
    ctaLabel: "View supplement protocol →",
    ctaHref: "/supplements",
  },
};

/**
 * Returns the dashboard payload. Synchronous + static for now; a real
 * integration can swap the body for a per-user fetch without changing callers.
 */
export function getDashboardData(): DashboardData {
  return DASHBOARD_DATA;
}

/** Look up a single metric by its route slug. */
export function getMetric(id: string): DashboardMetric | undefined {
  return DASHBOARD_DATA.metrics.find((m) => m.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sleep detail (the /dashboard/sleep deep-dive view)
//
// Richer shape than the summary card. Sample Oura data for now; a real source
// can implement getSleepDetail() without the detail UI changing.
// ─────────────────────────────────────────────────────────────────────────────
export interface SleepWeekDay {
  /** Single-letter weekday label (M/T/W…). */
  label: string;
  value: number;
  selected?: boolean;
}

export interface SleepSubMetric {
  value: string;
  /** Small trailing unit, e.g. "m", "%", " PM". */
  unit: string;
  label: string;
  status: MetricStatus;
}

export interface SleepContributor {
  name: string;
  /** Fill percentage of the glowing progress bar (0–100). */
  pct: number;
  status: MetricStatus;
  /** Optional custom pill text (defaults to the status label). */
  statusLabel?: string;
}

export interface SleepStageDetail {
  label: string;
  /** Tag background color. */
  color: string;
  /** Tag text color. NOTE: currently unconsumed by any component — left as
   *  literal hex rather than tokenised, to avoid inventing tokens for dead
   *  data. Tokenise if a component ever renders it. */
  textColor: string;
  duration: string;
  pct: number;
}

export interface SleepHypnogram {
  /** Per-segment stage level: 0 deep · 1 light · 2 REM · 3 awake. */
  levels: number[];
  /** Color per level, indexed 0–3 to match `levels`. */
  levelColors: string[];
  /** Evenly-spaced time axis labels under the chart. */
  axisLabels: string[];
}

export interface SleepCycles {
  total: number;
  summary: string;
  pattern: ("full" | "partial")[];
}

export interface SleepNight {
  /** Per-segment stage code on the 11p–7a timeline: "D" deep · "R" REM · "L" light · "A" awake. */
  stageSeq: ("D" | "R" | "L" | "A")[];
  /** Nighttime heart rate (bpm), one value per stage segment (same timeline as `stageSeq`). */
  heartRate: number[];
  /** Heart-rate variability (ms), one value per stage segment (same timeline as `stageSeq`). */
  hrv: number[];
  /** Evenly-spaced x-axis labels shared by the hypnogram + HR + HRV charts. */
  axisLabels: string[];
}

export interface SleepVital {
  label: string;
  value: string;
  /** Small trailing unit, e.g. " bpm", " /min", " min". */
  unit: string;
}

export interface SleepDetail {
  source: SourceId;
  /** Sleep Index score (0–100). */
  score: number;
  title: string;
  badge: string;
  weekMax: number;
  week: SleepWeekDay[];
  subMetrics: SleepSubMetric[];
  contributors: SleepContributor[];
  timeInBed: string;
  stages: SleepStageDetail[];
  hypnogram: SleepHypnogram;
  cycles: SleepCycles;
  /** Pill under the hero gauge, e.g. "7h 42m · above your 7h goal". */
  heroPill: string;
  /** Nighttime time-series — hypnogram stages, HR and HRV on one 11p–7a timeline. */
  night: SleepNight;
  /** Overnight vitals tiles (resting HR · respiratory rate · sleep latency). */
  vitals: SleepVital[];
  insight: string;
}

const SLEEP_DETAIL: SleepDetail = {
  source: "oura",
  score: 91,
  title: "Restful night",
  badge: "Best in the last 7 days",
  weekMax: 95,
  week: [
    { label: "W", value: 78 },
    { label: "T", value: 84 },
    { label: "F", value: 62 },
    { label: "S", value: 73 },
    { label: "S", value: 88 },
    { label: "M", value: 70 },
    { label: "T", value: 91, selected: true },
    { label: "W", value: 76 },
    { label: "T", value: 82 },
    { label: "F", value: 67 },
    { label: "S", value: 80 },
  ],
  subMetrics: [
    { value: "7h 42", unit: "m", label: "Total Sleep", status: "optimal" },
    { value: "8h 20", unit: "m", label: "Time in Bed", status: "optimal" },
    { value: "41", unit: "%", label: "Restorative", status: "good" },
    { value: "11:48", unit: " PM", label: "Sleep Onset", status: "good" },
  ],
  contributors: [
    { name: "Sleep efficiency", pct: 88, status: "good" },
    { name: "Temperature", pct: 96, status: "optimal", statusLabel: "Below range & optimal" },
    { name: "Restfulness", pct: 82, status: "good" },
    { name: "Consistency", pct: 99, status: "optimal" },
    { name: "Timing", pct: 97, status: "optimal" },
  ],
  timeInBed: "8h 20m",
  stages: [
    { label: "Awake", color: "rgba(var(--nura-fg-rgb),0.4)", textColor: "#0d0d0e", duration: "0h 58m", pct: 12 },
    { label: "REM sleep", color: "--nura-stage-rem", textColor: "#06372c", duration: "2h 18m", pct: 28 },
    { label: "Light sleep", color: "--nura-stage-light", textColor: "#16241e", duration: "3h 46m", pct: 46 },
    { label: "Deep sleep", color: "--nura-stage-deep", textColor: "#082742", duration: "1h 04m", pct: 13 },
  ],
  hypnogram: {
    // 0 deep · 1 light · 2 REM · 3 awake
    levels: [
      1, 1, 2, 1, 0, 0, 1, 1, 2, 3, 1, 1, 0, 0, 0, 1, 2, 2, 1, 1, 0, 1, 1, 2,
      2, 3, 1, 1, 1, 2, 2, 2, 1, 3, 1, 2, 2, 2, 3, 1, 1, 2, 2, 3, 3,
    ],
    levelColors: ["--nura-stage-deep", "--nura-stage-light", "--nura-stage-rem", "var(--nura-stage-awake)"],
    axisLabels: ["11:48 PM", "2 AM", "4 AM", "6 AM", "8:08 AM"],
  },
  cycles: {
    total: 5,
    summary: "4 full · 1 partial",
    pattern: ["full", "full", "partial", "full", "full"],
  },
  heroPill: "7h 42m · above your 7h goal",
  night: {
    // Deep front-loaded into the first cycles, REM lengthening toward morning,
    // light dominant, brief awakenings scattered late. HR and HRV share this
    // exact 11p–7a timeline so all three night charts line up.
    stageSeq: [
      "L", "L", "L", "D", "D", "D", "L", "R", "L", "L", "L", "L", "D", "D", "L",
      "L", "R", "R", "L", "L", "L", "L", "R", "L", "R", "R", "L", "L", "L", "L",
      "R", "R", "R", "A", "L", "L", "L", "L", "R", "R", "A", "L", "L", "L", "R", "L",
    ],
    heartRate: [
      60, 57, 53, 49, 47, 46, 47, 49, 48, 47, 46, 47, 45, 44, 46, 48, 50, 51, 49,
      48, 49, 50, 52, 51, 53, 54, 52, 51, 52, 53, 55, 56, 54, 58, 55, 54, 55, 56,
      57, 58, 62, 57, 56, 58, 60, 61,
    ],
    hrv: [
      40, 48, 58, 70, 82, 88, 84, 76, 80, 83, 86, 82, 88, 90, 84, 78, 74, 70, 72,
      74, 70, 68, 64, 66, 60, 58, 62, 64, 60, 58, 54, 52, 56, 46, 54, 56, 52, 50,
      48, 46, 40, 50, 52, 48, 44, 42,
    ],
    axisLabels: ["11p", "1a", "3a", "5a", "7a"],
  },
  vitals: [
    { label: "Resting HR", value: "44", unit: " bpm" },
    { label: "Respiratory", value: "14.2", unit: " /min" },
    { label: "Latency", value: "9", unit: " min" },
  ],
  insight:
    "You fell asleep fast and banked most of your deep sleep in the first two cycles — right when your heart rate bottomed out at 44 bpm and HRV peaked near 90 ms. REM stretched longer toward morning, which supports memory and mood. The couple of brief awakenings before waking are normal. A strong, restorative night.",
};

/** Returns the Sleep detail payload (sample Oura data for now). */
export function getSleepDetail(): SleepDetail {
  return SLEEP_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Movement detail (the /dashboard/movement deep-dive view)
// ─────────────────────────────────────────────────────────────────────────────
export interface WeekBar {
  label: string;
  value: number;
  selected?: boolean;
}

export interface MovementSubMetric {
  value: string;
  unit: string;
  label: string;
  status: MetricStatus;
}

export interface MovementContributor {
  name: string;
  pct: number;
  status: MetricStatus;
  statusLabel?: string;
}

export interface IntradayChart {
  /** Headline value, e.g. "10,881". */
  value: string;
  /** Small trailing text, e.g. " / 10,000" or " kcal". */
  unit?: string;
  label: string;
  /** Optional status pill in the chart header. */
  pillStatus?: MetricStatus;
  pillLabel?: string;
  /** 48 intraday samples (every 30 min, 12 AM → 12 AM). */
  series: number[];
  axisLabels: string[];
}

export interface MovementDetail {
  source: SourceId;
  score: number;
  title: string;
  badge: string;
  weekMax: number;
  week: WeekBar[];
  subMetrics: MovementSubMetric[];
  contributors: MovementContributor[];
  charts: IntradayChart[];
  insight: string;
}

// Intraday series generator (mirrors the reference mockup) — a sum of Gaussian
// "bumps" across the 48 half-hour samples of the day. A real source would
// supply these arrays directly; here we synthesize realistic sample shapes.
const INTRADAY_SAMPLES = 48;
function bump(i: number, center: number, width: number, height: number): number {
  return height * Math.exp(-((i - center) ** 2) / (2 * width * width));
}
function series(base: number, peaks: [number, number, number][]): number[] {
  return Array.from({ length: INTRADAY_SAMPLES }, (_, i) =>
    peaks.reduce((sum, [c, w, h]) => sum + bump(i, c, w, h), base),
  );
}

const DAY_AXIS = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM", "12 AM"];

const MOVEMENT_DETAIL: MovementDetail = {
  source: "oura",
  score: 96,
  title: "Goal smashed",
  badge: "3-day move streak",
  weekMax: 100,
  week: [
    { label: "W", value: 77 },
    { label: "T", value: 100 },
    { label: "F", value: 81 },
    { label: "S", value: 67 },
    { label: "S", value: 54 },
    { label: "M", value: 96 },
    { label: "T", value: 96, selected: true },
    { label: "W", value: 100 },
    { label: "T", value: 83 },
    { label: "F", value: 66 },
    { label: "S", value: 88 },
  ],
  subMetrics: [
    { value: "10,881", unit: "", label: "Steps", status: "optimal" },
    { value: "1h 30", unit: "m", label: "Inactive Time", status: "optimal" },
    { value: "4", unit: "", label: "Active Hours", status: "optimal" },
    { value: "70", unit: "m", label: "Active Minutes", status: "good" },
  ],
  contributors: [
    { name: "Steps", pct: 100, status: "optimal" },
    { name: "Inactive time", pct: 93, status: "optimal" },
    { name: "Active hours", pct: 90, status: "optimal" },
    { name: "Active minutes", pct: 78, status: "good" },
  ],
  charts: [
    {
      value: "10,881",
      unit: " / 10,000",
      label: "Steps",
      pillStatus: "optimal",
      pillLabel: "Goal hit",
      series: series(1, [[16, 2.2, 16], [26, 4, 11], [33, 2, 15], [38, 2.6, 40]]),
      axisLabels: DAY_AXIS,
    },
    {
      value: "1,802",
      unit: " kcal",
      label: "Total Calories · Active + Resting",
      series: series(6, [[16, 2.5, 22], [24, 5, 10], [38, 2.8, 30], [33, 2, 14]]),
      axisLabels: DAY_AXIS,
    },
  ],
  insight:
    "Big movement day — you cleared your step goal, though most of it landed after 6pm. Try nudging a walk into the morning to ease evening wind-down. Your active-calorie burn is trending up three days running; keep that momentum.",
};

/** Returns the Movement detail payload (sample Oura data for now). */
export function getMovementDetail(): MovementDetail {
  return MOVEMENT_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// HRV / Recovery detail (the /dashboard/hrv deep-dive view)
// ─────────────────────────────────────────────────────────────────────────────
/** The zone-band HRV line chart shown on the Recovery detail page. */
export interface HrvTrendChart {
  /** 7 daily HRV samples (ms), oldest → newest. */
  values: number[];
  /** Optimal-zone bounds [low, high] in ms (the shaded band). */
  zone: [number, number];
  /** Rolling-average line value (ms, dashed). */
  average: number;
  /** Plotted y-range. */
  floor: number;
  ceil: number;
  /** Y-axis gridline values + edge labels. */
  gridlines: number[];
  /** Weekday x-axis labels. */
  axisLabels: string[];
  /** Header current value + delta (ms). */
  current: number;
  delta: number;
}

/** A small stat tile beneath the HRV chart (baseline / resting HR / balance). */
export interface RecoveryStatTile {
  label: string;
  value: string;
  /** Optional trailing unit, e.g. " ms". */
  unit?: string;
  /** Optional accent color token for the value (e.g. Balance "Even"). */
  accent?: string;
}

/** One "What's driving recovery" row. */
export interface RecoveryDriver {
  name: string;
  /** Lead status text before the bolded qualifier, e.g. "Above baseline". */
  detail: string;
  /** Bolded qualifier word, e.g. "strong" | "solid" | "watch". */
  qualifier: string;
  /** Status level → drives the qualifier color + bar fill (emerald/sage/gold). */
  level: "strong" | "solid" | "watch";
  /** Bar fill percentage (0–100). */
  pct: number;
}

export interface RecoveryDetail {
  source: SourceId;
  /** Recovery score (0–100). */
  score: number;
  /** One-line subtitle under the h1. */
  subtitle: string;
  /** Hero status pill text. */
  pill: string;
  hrv: HrvTrendChart;
  tiles: RecoveryStatTile[];
  drivers: RecoveryDriver[];
  insight: string;
}

const RECOVERY_DETAIL: RecoveryDetail = {
  source: "oura",
  score: 82,
  subtitle: "Your nervous system's readiness today",
  pill: "Well recovered · ready for strain",
  hrv: {
    values: [48, 55, 42, 60, 52, 68, 62],
    zone: [50, 90],
    average: 58,
    floor: 30,
    ceil: 100,
    gridlines: [40, 70, 100],
    axisLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    current: 62,
    delta: 8,
  },
  tiles: [
    { label: "7-day baseline", value: "58", unit: " ms" },
    { label: "Resting HR", value: "54", unit: " bpm" },
    { label: "Balance", value: "Even", accent: "var(--nura-optimal)" },
  ],
  drivers: [
    { name: "HRV trend", detail: "Above baseline", qualifier: "strong", level: "strong", pct: 84 },
    { name: "Resting heart rate", detail: "Low", qualifier: "strong", level: "strong", pct: 80 },
    { name: "Sleep", detail: "7h 32m", qualifier: "solid", level: "solid", pct: 76 },
    { name: "Prior-day strain", detail: "Moderate", qualifier: "watch", level: "watch", pct: 52 },
  ],
  insight:
    "Your HRV is sitting above your 7-day baseline and resting heart rate is low — your nervous system has recovered well. Today's a good day to push a little harder if you want to.",
};

/** Returns the HRV / Recovery detail payload (sample Oura data for now). */
export function getRecoveryDetail(): RecoveryDetail {
  return RECOVERY_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Heart Rate detail (the /dashboard/heart-rate deep-dive view)
//
// The intraday chart reuses the existing `heart-rate` metric's `chart` (read via
// getMetric("heart-rate")), so the detail page renders the SAME vivid MetricChart
// as the dashboard card. Only the surrounding detail data lives here.
// ─────────────────────────────────────────────────────────────────────────────
/** One heart-rate training zone row. */
export interface HeartRateZone {
  name: string;
  /** BPM range label, e.g. "150+ bpm" or "110–150". */
  range: string;
  /** Time spent in zone today, e.g. "1h 42m". */
  duration: string;
  /** Share of the day (0–100), drives the proportional bar width. */
  pct: number;
  /** Zone color (an existing --nura-* token). */
  color: string;
}

export interface HeartRateDetail {
  source: SourceId;
  /** One-line subtitle under the h1. */
  subtitle: string;
  /** Large live BPM value. */
  live: number;
  /** Live indicator label, e.g. "Live · Apple Watch". */
  liveLabel: string;
  resting: number;
  average: number;
  max: number;
  /** Caption under the "Today" chart title. */
  rangeCaption: string;
  zones: HeartRateZone[];
  insight: string;
}

const HEART_RATE_DETAIL: HeartRateDetail = {
  source: "apple-watch",
  subtitle: "Your continuous heart rate today",
  live: 72,
  liveLabel: "Live · Apple Watch",
  resting: 54,
  average: 78,
  max: 138,
  rangeCaption: "Continuous · range 52–138 bpm",
  zones: [
    { name: "Peak", range: "150+ bpm", duration: "0h 18m", pct: 3, color: "var(--nura-alert)" },
    { name: "Cardio", range: "110–150", duration: "1h 42m", pct: 8, color: "var(--nura-amber)" },
    { name: "Fat burn", range: "70–110", duration: "5h 20m", pct: 22, color: "var(--nura-good)" },
    { name: "Resting", range: "52–70", duration: "16h 10m", pct: 67, color: "var(--nura-optimal)" },
  ],
  insight:
    "You spent most of today at rest with one solid cardio block around midday. Your resting rate of 54 is low and steady — a good marker of cardiovascular fitness.",
};

/** Returns the Heart Rate detail payload (sample Apple Watch data for now). */
export function getHeartRateDetail(): HeartRateDetail {
  return HEART_RATE_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps detail (the /dashboard/steps deep-dive view)
//
// The intraday "Today" chart reuses the existing `steps` metric's `chart` (read
// via getMetric("steps")), so the detail page renders the SAME vivid MetricChart
// as the dashboard card. Only the surrounding detail data lives here.
// ─────────────────────────────────────────────────────────────────────────────
/** A small stat tile under the hero (Distance / Flights / Active). */
export interface StepsTile {
  label: string;
  value: string;
  /** Optional trailing unit, e.g. " mi" or "m". */
  unit: string;
}

/** One day in the "This week" bar chart. */
export interface StepsWeekDay {
  /** Single-letter weekday label (M/T/W…). */
  label: string;
  value: number;
  /** The current day — rendered brighter + bold. */
  isToday?: boolean;
}

export interface StepsDetail {
  source: SourceId;
  /** One-line subtitle under the h1. */
  subtitle: string;
  /** Today's step count (the goal-ring hero value). */
  steps: number;
  /** Daily step goal. */
  goal: number;
  /** Hero status pill text. */
  pill: string;
  /** Distance / Flights / Active tiles. */
  tiles: StepsTile[];
  /** Active energy burned today (kcal) — shown in the dashboard card stat strip. */
  kcal: number;
  /** Caption under the "Today" chart title. */
  rangeCaption: string;
  /** Pre-formatted weekly summary values. */
  weekTotal: string;
  weekAvg: string;
  goalHit: string;
  /** Daily goal — drives the dashed goal line + teal/gold bar coloring. */
  weekGoal: number;
  /** Plotted y-range for the weekly bar chart. */
  weekFloor: number;
  weekCeil: number;
  /** Y-axis gridline values + edge labels (in steps; rendered as "5k"/"15k"). */
  weekGridlines: number[];
  week: StepsWeekDay[];
  /** Pace card — today's cumulative steps sampled 12a→now (the last point is "now"). */
  paceToday: number[];
  /** Pace card — the user's typical cumulative steps at each matching sample point. */
  paceUsual: number[];
  /** Pace card — y-max for the cumulative chart (a touch above the day's total). */
  paceMax: number;
  /** This-week / last-week step totals — drive the week-over-week compare row. */
  thisWeekStepTotal: number;
  lastWeekStepTotal: number;
  /** Movement card — active ("a") / sedentary ("s") state per waking hour (~6a→10p). */
  movementHours: ("a" | "s")[];
  /** Movement card — formatted active / sedentary / longest-sit durations. */
  activeTime: string;
  sedentaryTime: string;
  longestSit: string;
  /** When the longest unbroken sit happened, e.g. "early afternoon". */
  longestSitWhen: string;
  insight: string;
}

const STEPS_DETAIL: StepsDetail = {
  source: "apple-health",
  subtitle: "Your movement across today",
  steps: 8420,
  goal: 10000,
  pill: "84% to goal · on track",
  tiles: [
    { label: "Distance", value: "3.8", unit: " mi" },
    { label: "Flights", value: "12", unit: "" },
    { label: "Active", value: "1h 20", unit: "m" },
  ],
  kcal: 612,
  rangeCaption: "Steps logged through the day",
  weekTotal: "69,120",
  weekAvg: "9,874",
  goalHit: "3 of 7",
  weekGoal: 10000,
  weekFloor: 0,
  weekCeil: 15000,
  weekGridlines: [5000, 15000],
  week: [
    { label: "M", value: 8400 },
    { label: "T", value: 11200 },
    { label: "W", value: 7600 },
    { label: "T", value: 12100 },
    { label: "F", value: 9200 },
    { label: "S", value: 12200 },
    { label: "S", value: 8420, isToday: true },
  ],
  paceToday: [0, 0, 0, 0, 0, 40, 120, 300, 620, 900, 1300, 1800, 2400, 3000, 3600, 4400, 5200, 6100, 7000, 7700, 8200, 8420],
  paceUsual: [0, 0, 0, 0, 30, 90, 220, 460, 820, 1200, 1700, 2200, 2800, 3400, 4000, 4700, 5400, 6100, 6800, 7300, 7700, 7880],
  paceMax: 8800,
  thisWeekStepTotal: 69120,
  lastWeekStepTotal: 62300,
  movementHours: ["s", "s", "a", "a", "s", "a", "s", "s", "a", "a", "s", "a", "a", "a", "s", "a"],
  activeTime: "6h 40m",
  sedentaryTime: "9h 20m",
  longestSit: "2h 10m",
  longestSitWhen: "early afternoon",
  insight:
    "You're 1,580 steps from your goal with the evening still ahead — an after-dinner walk would close it easily. You've cleared 10,000 on three days this week, and your daily average of 9,874 is sitting right at target.",
};

/** Returns the Steps detail payload (sample Apple Health data for now). */
export function getStepsDetail(): StepsDetail {
  return STEPS_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Energy detail (the /dashboard/active-energy deep-dive view)
//
// Sample Apple Watch data for now. `moveGoal` defaults to 750; when HealthKit
// activity-summary reads are added later this gets the user's real Move goal.
// ─────────────────────────────────────────────────────────────────────────────
/** One day in the "This week" active-energy bar chart. */
export interface ActiveEnergyWeekDay {
  /** Single-letter weekday label (M/T/W…). */
  label: string;
  /** kcal burned that day. */
  value: number;
  /** The current day — rendered brighter + bold. */
  isToday?: boolean;
}

export interface ActiveEnergyDetail {
  source: SourceId;
  /** One-line subtitle under the h1. */
  subtitle: string;
  /** kcal burned today (the hero gauge value). */
  activeEnergy: number;
  /** Apple Watch Move goal (kcal). */
  moveGoal: number;
  /** Resting energy burned today (kcal). */
  restingEnergy: number;
  /** Total burn today = active + resting (kcal). */
  totalBurn: number;
  /** Exercise minutes today. */
  exerciseMinutes: number;
  /** Caption under the "Today" chart title. */
  rangeCaption: string;
  /** 34-point intraday active-energy series (kcal/hr). */
  todayHourly: number[];
  /** Coarse series driving the dashed average curve. */
  todayBaseline: number[];
  /** Plotted y-range + gridlines for the "Today" chart. */
  todayFloor: number;
  todayCeil: number;
  todayGridlines: number[];
  /** Plotted y-range for the weekly bar chart. */
  weekFloor: number;
  weekCeil: number;
  week: ActiveEnergyWeekDay[];
  insight: string;
}

const ACTIVE_ENERGY_DETAIL: ActiveEnergyDetail = {
  source: "apple-watch",
  subtitle: "Your calories burned moving today",
  activeEnergy: 612,
  moveGoal: 750,
  restingEnergy: 1540,
  totalBurn: 2152,
  exerciseMinutes: 52,
  rangeCaption: "Active calories burned through the day",
  todayHourly: [
    3, 2, 2, 3, 2, 3, 4, 6, 14, 28, 42, 55, 48, 70, 88, 96, 82,
    104, 116, 128, 118, 96, 72, 60, 52, 46, 38, 44, 36, 28, 20, 14, 10, 8,
  ],
  todayBaseline: [4, 10, 30, 72, 108, 90, 50, 34],
  todayFloor: 0,
  todayCeil: 150,
  todayGridlines: [40, 80, 120],
  weekFloor: 0,
  weekCeil: 1000,
  week: [
    { label: "M", value: 690 },
    { label: "T", value: 820 },
    { label: "W", value: 540 },
    { label: "T", value: 760 },
    { label: "F", value: 610 },
    { label: "S", value: 900 },
    { label: "S", value: 612, isToday: true },
  ],
  insight:
    "You're 138 kcal from closing your Move ring with the evening still ahead — a brisk 20-minute walk would get you there. You've hit your 750 goal on three days this week, and your 52 active minutes today are already trending above your weekly average.",
};

/** Returns the Active Energy detail payload (sample Apple Watch data for now). */
export function getActiveEnergyDetail(): ActiveEnergyDetail {
  return ACTIVE_ENERGY_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Resting Heart Rate detail (the /dashboard/resting-hr deep-dive view)
//
// Resting HR has no goal, so there's no ring — the hero is a big value plus a
// zone bar. Sample Oura data for now; a real source can implement
// getRestingHrDetail() without the detail UI changing.
// ─────────────────────────────────────────────────────────────────────────────
export interface RestingHrDetail {
  source: SourceId;
  /** One-line subtitle under the h1. */
  subtitle: string;
  /** Today's resting HR (bpm) — the hero value. */
  value: number;
  /** Change vs yesterday (bpm, positive = lower today) — card "▼ n vs yesterday". */
  dayDelta: number;
  /** Resting-HR status word, e.g. "Excellent" (drives the hero pill). */
  status: string;
  /** 7-day average resting HR (bpm) — tile. */
  avg7: number;
  /** 30-day lowest resting HR (bpm) — tile. */
  low30: number;
  /** Personal baseline resting HR (bpm) — tile + dashed reference line. */
  baseline: number;
  /** Zone-bar scale bounds (bpm) — the gradient bar maps zoneMin→zoneMax. */
  zoneMin: number;
  zoneMax: number;
  /** Zone labels under the gradient bar, left (lowest/best) → right. */
  zoneLabels: string[];
  /** ~30 daily resting-HR readings (bpm), oldest → today (last point is today). */
  month: number[];
  /** 7 daily resting-HR readings (bpm), oldest → today — the 7D trend view. */
  week: number[];
  /** Today's intraday resting HR (bpm), 12a → now — the 1D trend view. */
  today: number[];
  /** Typical-range band [low, high] (bpm) shaded on the trend chart. */
  typicalRange: [number, number];
  /** Y-axis gridline/tick values for the trend chart (bpm). */
  monthGridlines: number[];
  /** Month trend delta (bpm, positive) — shown as "▼ {n} bpm" in the trend badge. */
  monthTrendDelta: number;
  /** Four weekly averages (bpm), oldest → last week (last bar highlighted). */
  weeklyAvg: number[];
  insight: string;
}

const RESTING_HR_DETAIL: RestingHrDetail = {
  source: "oura",
  subtitle: "Your resting heart rate today",
  value: 52,
  dayDelta: 2,
  status: "Excellent",
  avg7: 54,
  low30: 48,
  baseline: 56,
  zoneMin: 40,
  zoneMax: 80,
  zoneLabels: ["Athlete", "Excellent", "Good", "Average"],
  // 30 daily readings, oldest → today; a gentle downward drift below baseline
  // (56 → 52, a 4 bpm month trend), a 48 bpm low mid-month, today resting at 52.
  month: [
    56, 57, 55, 56, 54, 57, 55, 54, 56, 53,
    55, 54, 52, 55, 53, 51, 54, 52, 50, 53,
    51, 49, 48, 51, 50, 53, 51, 50, 51, 52,
  ],
  // Last 7 days, oldest → today (55 → 52, a 3 bpm week trend).
  week: [55, 54, 54, 53, 53, 52, 52],
  // Today's intraday resting HR, 12a → now: settles overnight to a ~5a low of
  // 48, climbs through the day, eases back to 52 now.
  today: [
    54, 53, 52, 51, 49, 48, 49, 51, 53, 55,
    56, 55, 54, 55, 54, 53, 54, 53, 52, 53,
    52, 53, 52, 52,
  ],
  typicalRange: [51, 57],
  monthGridlines: [50, 55, 60],
  monthTrendDelta: 4,
  weeklyAvg: [57, 55, 54, 53],
  insight:
    "A resting heart rate of 52 bpm sits comfortably below your 56 baseline — a strong marker of cardiovascular fitness and good recovery. The gentle downward drift over the past month is exactly what you want to see: your heart is doing more with each beat, helped by your consistent sleep and training. Keep an eye out for any sudden jump of 5+ bpm above baseline, which often flags illness, poor sleep, or under-recovery a day or two before you feel it.",
};

/** Returns the Resting Heart Rate detail payload (sample Oura data for now). */
export function getRestingHrDetail(): RestingHrDetail {
  return RESTING_HR_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Body Temperature detail (the /dashboard/body-temperature deep-dive view)
//
// Body temperature here is a DEVIATION from the user's personal baseline, not an
// absolute temperature. ALL values below are stored in °C deviations; the UI
// converts to °F as a DELTA (×1.8, no +32) via src/lib/temperatureUnit. Sample
// Oura data for now; a real source can implement getBodyTempDetail() unchanged.
// ─────────────────────────────────────────────────────────────────────────────
export interface BodyTempDetail {
  source: SourceId;
  /** One-line subtitle under the h1. */
  subtitle: string;
  /** Tonight's deviation from baseline (°C) — hero value + Tonight tile. */
  tonight: number;
  /** 7-day average deviation (°C) — tile + card footer. */
  avg7: number;
  /** 30-day low / high deviation (°C) — the "30-day range" tile. */
  low30: number;
  high30: number;
  /** Baseline deviation (always 0) — the dashed reference line. */
  baseline: number;
  /** Normal-range band [low, high] (°C) — shaded teal on the trend chart. */
  normalRange: [number, number];
  /** The notable mid-month spike (°C) — used in the captions / insight threshold. */
  spike: number;
  /** 30 nightly deviations (°C), oldest → today (last point is today). */
  month: number[];
  /** 7 nightly deviations (°C), oldest → today — the 7D view. */
  week: number[];
  /** Tonight's overnight deviation curve (°C), 12a → now — the 1D view. */
  today: number[];
  /** 4 weekly average deviations (°C), oldest → last week. */
  weeklyAvg: number[];
  /** Y-axis tick deviations (°C) for the 7D / 30D charts. */
  monthTicks: number[];
  /** Y-axis tick deviations (°C) for the 1D chart. */
  dayTicks: number[];
}

const BODY_TEMP_DETAIL: BodyTempDetail = {
  source: "oura",
  subtitle: "Your skin temperature deviation tonight",
  tonight: -0.2,
  avg7: -0.1,
  low30: -0.4,
  high30: 0.5,
  baseline: 0,
  normalRange: [-0.3, 0.3],
  spike: 0.5,
  // 30 nightly deviations (°C), oldest → today; steady & slightly cool with a
  // single +0.5 spike mid-month (a poor night's sleep), settling cool to −0.2.
  month: [
    0.0, 0.1, -0.1, 0.0, 0.2, 0.1, -0.1, 0.0, 0.3, 0.1,
    0.0, -0.2, -0.1, 0.0, 0.1, -0.1, 0.5, 0.3, 0.1, 0.0,
    -0.1, -0.2, -0.1, 0.0, -0.2, -0.1, -0.2, -0.3, -0.1, -0.2,
  ],
  // Last 7 nights, oldest → today.
  week: [-0.1, 0.0, -0.2, -0.1, -0.2, -0.3, -0.2],
  // Tonight's overnight curve, 12a → now: dips to an early-morning low then eases.
  today: [0.1, 0.0, -0.1, -0.2, -0.3, -0.4, -0.3, -0.2, -0.1, -0.1, -0.2],
  // 4 weekly averages, oldest → last week (drifting cool; last is coolest).
  weeklyAvg: [0.1, -0.1, -0.1, -0.2],
  monthTicks: [-0.4, 0, 0.4],
  dayTicks: [-0.4, -0.2, 0, 0.2],
};

/** Returns the Body Temperature detail payload (sample Oura data for now). */
export function getBodyTempDetail(): BodyTempDetail {
  return BODY_TEMP_DETAIL;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overall Health (the dashboard's top "Overall health" section)
//
// A single Health Score blended from six pillars, plus a personalized plan. All
// values below are SAMPLE seeds — the scores, health age/percentile, and plan
// copy will later be derived/generated from the user's real data; the UI only
// reads these typed shapes.
// ─────────────────────────────────────────────────────────────────────────────
export type HealthTrend = "up" | "down" | "flat";

export interface HealthPillar {
  key: string;
  label: string;
  score: number;
  trend: HealthTrend;
  /** Pillar accent — a --nura-* token name; resolve via useAccents(). */
  color: AccentToken;
  /** Angle (deg) of the pillar's spoke on the ring. */
  ang: number;
  /** One-line summary — also the "What it measures" field. */
  measures: string;
  /** Which metrics / devices feed this pillar. */
  builtFrom: string;
  /** Plain-language interpretation of the current score. */
  reading: string;
}

export interface HealthPlanItem {
  /** Icon key — maps to an inline SVG chip in the card. */
  icon: string;
  /** Accent — a --nura-* token name; resolve via useAccents(). */
  color: AccentToken;
  title: string;
  /** Always-visible one-line summary. */
  summary: string;
  /** Personalized guidance shown when expanded. */
  body: string;
  /** Optional CTA link (e.g. Supplements → /lab). */
  link?: string;
  linkLabel?: string;
}

export interface OverallHealth {
  score: number;
  /** Week-over-week change in the score (signed). */
  weeklyTrend: number;
  status: string;
  pillars: HealthPillar[];
  healthAge: { value: number; note: string };
  percentile: { value: string; note: string };
  bestPillar: { label: string; note: string };
  plan: HealthPlanItem[];
}

const OVERALL_HEALTH: OverallHealth = {
  score: 84,
  weeklyTrend: 3,
  status: "Thriving",
  pillars: [
    { key: "recovery", label: "Recovery", score: 88, trend: "up", color: "--nura-teal", ang: -90,
      measures: "How well your nervous system has bounced back.",
      builtFrom: "Overnight HRV, resting & sleeping heart rate.",
      reading: "Strong — your body is well-prepared for stress and training today." },
    { key: "heart", label: "Heart", score: 82, trend: "up", color: "--nura-rose", ang: -30,
      measures: "Your cardiovascular health and efficiency.",
      builtFrom: "Resting & active heart rate, HRV, heart-rate recovery.",
      reading: "Solid — your heart is working efficiently. Keep regular aerobic work in your week." },
    { key: "metabolic", label: "Metabolic", score: 79, trend: "flat", color: "--nura-amber", ang: 30,
      measures: "How your body manages energy and temperature.",
      builtFrom: "Body-temperature deviation, respiratory rate, recovery balance.",
      reading: "Good, with a little room. Steady night-to-night — no red flags." },
    { key: "activity", label: "Activity", score: 74, trend: "down", color: "--nura-good", ang: 90,
      measures: "Your daily movement and exercise load.",
      builtFrom: "Steps, active energy, workouts, sedentary time.",
      reading: "Your lowest pillar. More daily movement here lifts every other score." },
    { key: "sleep", label: "Sleep", score: 86, trend: "up", color: "--nura-sleep-deep", ang: 150,
      measures: "The quantity and quality of your sleep.",
      builtFrom: "Total sleep, deep & REM time, efficiency, timing.",
      reading: "Strong — restorative sleep is doing much of the heavy lifting in your recovery." },
    { key: "resilience", label: "Resilience", score: 84, trend: "up", color: "--nura-sage", ang: 210,
      measures: "Your capacity to handle stress over time.",
      builtFrom: "HRV trend, sleep consistency, recovery patterns.",
      reading: "Robust — you're adapting well to your current load." },
  ],
  healthAge: { value: 38, note: "4 yrs younger" },
  percentile: { value: "Top 18%", note: "for your age" },
  bestPillar: { label: "Recovery", note: "88 · strong" },
  plan: [
    { icon: "move", color: "--nura-good", title: "Move more",
      summary: "Activity is your one lagging pillar at 74.",
      body: "Activity is your one lagging pillar at 74. A daily 20-minute walk and landing closer to 9k steps would lift your score faster than anything else." },
    { icon: "moon", color: "--nura-sleep-deep", title: "Lock a consistent bedtime",
      summary: "Your sleep timing drifts late.",
      body: "Your sleep timing drifts late. A consistent bedtime — even on weekends — would push Recovery and Resilience higher still." },
    { icon: "fork", color: "--nura-teal", title: "Eating habits",
      summary: "Anchor protein and fiber earlier in the day.",
      body: "Front-loading protein and fiber earlier in the day steadies energy and supports your Metabolic pillar. Aim for a protein-forward breakfast and keep dinners lighter and earlier." },
    { icon: "sugar", color: "--nura-amber", title: "Ease off added sugar",
      summary: "Trim the evening sweets and sugary drinks.",
      body: "Added sugar late in the day nudges your overnight temperature and heart rate up, which can blunt recovery. Cutting back on evening sweets and sugary drinks is an easy win for Metabolic and Recovery." },
    { icon: "pill", color: "--nura-rose", title: "Supplements",
      summary: "A couple of targeted basics could help.",
      body: "Based on your readings, magnesium for sleep depth and omega-3s for cardiovascular support are worth a look. Nothing here is essential — they're small levers on pillars you're already doing well on.",
      link: "/lab", linkLabel: "View options in your Lab →" },
  ],
};

/** Returns the Overall Health payload (sample seed values for now). */
export function getOverallHealth(): OverallHealth {
  return OVERALL_HEALTH;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Plan (the dashboard's "Your health plan" section)
//
// A personalized protocol to raise the Health Score. SAMPLE seeds for now — in
// production the focus chips, domain steps, and projection are AI-generated /
// derived from the user's readings. `steps` and `projection` may contain trusted
// <b> emphasis markup (seed content, never user input).
// ─────────────────────────────────────────────────────────────────────────────
export interface HealthPlanDomain {
  key: string;
  /** Icon key — leaf | pill | drop | activity | moon | wind. */
  icon: string;
  /** Accent — a --nura-* token name; resolve via useAccents(). */
  color: AccentToken;
  title: string;
  summary: string;
  /** Which pillars this domain lifts, e.g. "Metabolic · Heart". */
  lifts: string;
  /** In-depth checklist steps (may contain trusted <b> markup). */
  steps: string[];
  /** Optional CTA route (e.g. /lab) + label. */
  link?: string;
  linkLabel?: string;
}

export interface HealthPlan {
  subtitle: string;
  /** Current Health Score + 4-week target, on a scaleMin…scaleMax bar. */
  now: number;
  target: number;
  scaleMin: number;
  scaleMax: number;
  targetCaption: string;
  /** "This week's focus" chips. */
  focus: string[];
  domains: HealthPlanDomain[];
  /** Closing projection line (may contain trusted <b> markup). */
  projection: string;
}

const HEALTH_PLAN: HealthPlan = {
  subtitle: "An in-depth protocol to raise your Health Score — built from your readings, refreshed each week.",
  now: 84,
  target: 90,
  scaleMin: 70,
  scaleMax: 95,
  targetCaption: "Your 4-week target if you stay consistent",
  focus: ["Post-meal walks", "Earlier, lighter dinners", "Magnesium nightly"],
  domains: [
    { key: "nutrition", icon: "leaf", color: "--nura-teal", title: "Nutrition", summary: "Anti-inflammatory, protein-forward eating.", lifts: "Metabolic · Heart", steps: [
      "Build each meal around a <b>palm of protein</b> and two fists of vegetables.",
      "Add omega-3 rich foods — wild salmon, sardines, walnuts, flax — about 3× a week.",
      "Finish eating <b>~3 hours before bed</b> and keep dinners on the lighter side.",
      "Cut added sugar and refined carbs, especially in the evening.",
    ] },
    { key: "supplements", icon: "pill", color: "--nura-sage", title: "Supplements", summary: "A simple, targeted daily stack.", lifts: "Recovery · Sleep", link: "/lab", linkLabel: "View options in your Lab", steps: [
      "<b>Magnesium glycinate</b> in the evening — supports deep sleep and calm.",
      "<b>Omega-3 (EPA/DHA)</b> with a meal — supports heart and recovery.",
      "<b>Vitamin D3 + K2</b> — test your levels first, then dose to target.",
      "<b>Ashwagandha (KSM-66)</b> in the evening if stress runs high.",
    ] },
    { key: "essential-oils", icon: "drop", color: "--nura-mauve", title: "Essential oils", summary: "Aromatherapy for calm and recovery.", lifts: "Sleep · Resilience", link: "/lab", linkLabel: "View options in your Lab", steps: [
      "Diffuse <b>lavender</b> in the bedroom ~30 min before sleep.",
      "Use <b>frankincense or cedarwood</b> during your evening wind-down.",
      "<b>Peppermint</b> in the morning for alertness and focus.",
      "<b>Eucalyptus</b> in the shower to support easy breathing.",
    ] },
    { key: "movement", icon: "activity", color: "--nura-good", title: "Movement", summary: "Build a daily activity base.", lifts: "Activity · Heart", steps: [
      "Walk <b>10–15 min after meals</b> — steadies blood sugar and adds steps.",
      "2–3 easy <b>zone-2 cardio</b> sessions a week (conversational pace, 30–40 min).",
      "One <b>strength session</b> for muscle and metabolic health.",
      "Break up long sitting — stand or move every hour.",
    ] },
    { key: "sleep", icon: "moon", color: "--nura-sleep-deep", title: "Sleep", summary: "Protect a consistent, restorative night.", lifts: "Recovery · Resilience", steps: [
      "Fixed <b>lights-out near 10:45pm</b>, even on weekends.",
      "Dim screens and lights <b>30–60 min before bed</b>.",
      "Keep the room cool (~65°F) and fully dark.",
      "Get <b>morning sunlight</b> within an hour of waking to anchor your rhythm.",
    ] },
    { key: "stress", icon: "wind", color: "--nura-rose", title: "Stress & mind", summary: "Downregulate every day.", lifts: "Resilience · Recovery", steps: [
      "<b>5 minutes of slow breathing</b> (longer exhales) once a day.",
      "Get outside daylight — especially morning sun.",
      "Protect one evening wind-down block with no work.",
      "Keep one true <b>rest day</b> a week from hard training.",
    ] },
  ],
  projection: "Stay consistent with this and your readings project a Health Score near <b>90</b> within four weeks — driven mostly by lifting Activity and steadying Metabolic.",
};

/** Returns the Health Plan payload (sample seed values for now). */
export function getHealthPlan(): HealthPlan {
  return HEALTH_PLAN;
}

// ─────────────────────────────────────────────────────────────────────────────
// New metric cards — Blood Oxygen (SpO2), Respiratory Rate, Cardio Fitness (VO2).
// Sample values for now; real values come from the connected device's SpO2 /
// respiratory-rate / VO2-max streams. Shapes are read by the bespoke cards.
// ─────────────────────────────────────────────────────────────────────────────
export interface BloodOxygenDetail {
  source: SourceId;
  /** Overnight average SpO2 (%) — also the dashed personal-average line. */
  avgPct: number;
  /** Lowest overnight reading (%). */
  lowestPct: number;
  /** Last night's average (%) — hero + tile. */
  lastNight: number;
  /** 7-day average (%) — tile. */
  avg7: number;
  /** Overnight SpO2 trace across the 11p–7a sleep window (1D trend). */
  overnight: number[];
  /** Nightly averages — 7D and 30D trend views. */
  sevenDay: number[];
  thirtyDay: number[];
  floor: number;
  ceil: number;
  ticks: number[];
  /** Healthy-range band [low, high] (%). */
  band: [number, number];
  axisLabels: string[];
  /** Hero zone-bar scale bounds (%) — Low → Healthy. */
  zoneMin: number;
  zoneMax: number;
  /** "Nightly lows" card — each of the last 7 nights' lowest reading + its label. */
  nightlyLows: number[];
  nightlyLowLabels: string[];
  statusLabel: string;
  /** Hero breathing-regularity pill text. */
  breathingPill: string;
}

const BLOOD_OXYGEN_DETAIL: BloodOxygenDetail = {
  source: "oura",
  avgPct: 97,
  lowestPct: 94,
  lastNight: 97,
  avg7: 97,
  // Calm hourly-ish overnight curve: holds ~96–97% with two gentle broad dips
  // toward 95%. (Real per-minute SpO2 is downsampled to points like these.)
  overnight: [97, 96.8, 95.9, 95.4, 96.2, 97, 96.7, 95.5, 96.2, 97],
  sevenDay: [97, 96, 97, 98, 97, 96, 97],
  thirtyDay: [97, 96, 97, 98, 96, 95, 97, 98, 97, 96, 97, 98, 97, 96, 95, 96, 97, 98, 97, 97, 96, 97, 98, 97, 96, 97, 98, 97, 96, 97],
  floor: 90,
  ceil: 100,
  ticks: [90, 95, 100],
  band: [95, 100],
  axisLabels: ["11p", "1a", "3a", "5a", "7a"],
  zoneMin: 88,
  zoneMax: 100,
  nightlyLows: [96, 97, 95, 94, 96, 95, 94],
  nightlyLowLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Last night"],
  statusLabel: "Normal",
  breathingPill: "Optimal breathing regularity",
};

/** Returns the Blood Oxygen (SpO2) detail payload (sample data for now). */
export function getBloodOxygenDetail(): BloodOxygenDetail {
  return BLOOD_OXYGEN_DETAIL;
}

export interface RespiratoryDetail {
  source: SourceId;
  /** Overnight average respiratory rate (br/min). */
  avg: number;
  /** The user's personal baseline (br/min) — the dashed reference line. */
  baseline: number;
  /** Overnight respiratory-rate trace across the 11p–7a sleep window. */
  overnight: number[];
  floor: number;
  ceil: number;
  ticks: number[];
  /** Healthy-range band [low, high] (br/min). */
  band: [number, number];
  axisLabels: string[];
  statusLabel: string;
  /** Seven-night average (br/min) — the "Last 7 nights" summary value. */
  weekAvg: number;
  /** Personal baseline range [low, high] (br/min) — the lavender band in the
   *  detail charts and the explainer copy. */
  baselineRange: [number, number];
  /** Per-night averages for the last 7 nights, oldest → last night. The final
   *  entry is last night and is highlighted in the trend chart. */
  sevenNight: { label: string; avg: number }[];
}

const RESPIRATORY_DETAIL: RespiratoryDetail = {
  source: "oura",
  avg: 14.2,
  baseline: 14.3,
  overnight: [14.4, 14.2, 14.0, 14.3, 14.5, 14.2, 13.9, 14.1, 14.4, 14.6, 14.3, 14.0, 13.8, 14.1, 14.3, 14.5, 14.2, 14.0, 14.2, 14.4, 14.3, 14.1, 13.9, 14.2, 14.4, 14.3, 14.1, 14.0, 14.2, 14.3, 14.2, 14.1],
  floor: 12,
  ceil: 17,
  ticks: [12, 14, 16],
  band: [12, 16],
  axisLabels: ["11p", "1a", "3a", "5a", "7a"],
  statusLabel: "Normal",
  weekAvg: 14.1,
  baselineRange: [13.5, 15.0],
  sevenNight: [
    { label: "Mon", avg: 14.0 },
    { label: "Tue", avg: 14.3 },
    { label: "Wed", avg: 13.9 },
    { label: "Thu", avg: 14.1 },
    { label: "Fri", avg: 14.2 },
    { label: "Sat", avg: 13.9 },
    { label: "Last", avg: 14.2 },
  ],
};

/** Returns the Respiratory Rate detail payload (sample data for now). */
export function getRespiratoryDetail(): RespiratoryDetail {
  return RESPIRATORY_DETAIL;
}

export interface CardioFitnessDetail {
  source: SourceId;
  /** VO2 max (ml/kg·min). */
  vo2: number;
  /** Change over the last 3 months (ml/kg·min, signed). */
  delta3mo: number;
  /** Classification zone scale bounds (ml/kg·min). */
  zoneMin: number;
  zoneMax: number;
  /** Zone labels left→right (worst→best). */
  zoneLabels: string[];
  /** Index of the active (current) zone in zoneLabels. */
  activeZone: number;
  /** Multi-month VO2 trend (oldest → now). */
  trend: number[];
  trendMonths: string[];
  trendFloor: number;
  trendCeil: number;
  /** Plain-language classification, e.g. "Above average". */
  classification: string;
  statusLabel: string;
}

const CARDIO_FITNESS_DETAIL: CardioFitnessDetail = {
  source: "apple-watch",
  vo2: 42,
  delta3mo: 1.5,
  zoneMin: 20,
  zoneMax: 60,
  zoneLabels: ["Low", "Below avg", "Above avg", "High"],
  activeZone: 2, // 42 → 55% of the 20–60 scale → "Above avg"
  trend: [40, 40.2, 40.5, 41, 41.5, 42],
  trendMonths: ["Jan", "", "Mar", "", "May", "Now"],
  trendFloor: 38,
  trendCeil: 43,
  classification: "Above average",
  statusLabel: "Above avg",
};

/** Returns the Cardio Fitness (VO2 max) detail payload (sample data for now). */
export function getCardioFitnessDetail(): CardioFitnessDetail {
  return CARDIO_FITNESS_DETAIL;
}

export interface BloodPressureDetail {
  source: SourceId;
  /** Latest reading (mmHg). */
  systolic: number;
  diastolic: number;
  /** Recent systolic / diastolic readings, oldest → latest. */
  systolicTrend: number[];
  diastolicTrend: number[];
  /** Standard ACC/AHA reference thresholds (mmHg). */
  sysThreshold: number;
  diaThreshold: number;
  /** Plotted y-range (mmHg). */
  floor: number;
  ceil: number;
  axisLabels: string[];
  /** Seven-day average systolic / diastolic (mmHg). */
  avgSys: number;
  avgDia: number;
  /** The last 7 readings, oldest → last. Each carries its own systolic +
   *  diastolic; the final entry is the latest reading (highlighted). */
  readings: { label: string; sys: number; dia: number }[];
}

const BLOOD_PRESSURE_DETAIL: BloodPressureDetail = {
  source: "apple-health",
  systolic: 118,
  diastolic: 76,
  systolicTrend: [122, 120, 119, 121, 118, 117, 119, 120, 118, 116, 119, 118],
  diastolicTrend: [80, 78, 77, 79, 76, 75, 77, 78, 76, 75, 77, 76],
  sysThreshold: 120,
  diaThreshold: 80,
  floor: 60,
  ceil: 140,
  axisLabels: ["3 wk", "2 wk", "1 wk", "now"],
  avgSys: 119,
  avgDia: 77,
  readings: [
    { label: "Mon", sys: 120, dia: 78 },
    { label: "Tue", sys: 121, dia: 79 },
    { label: "Wed", sys: 118, dia: 76 },
    { label: "Thu", sys: 122, dia: 79 },
    { label: "Fri", sys: 119, dia: 77 },
    { label: "Sat", sys: 117, dia: 75 },
    { label: "Last", sys: 118, dia: 76 },
  ],
};

/** Returns the Blood Pressure detail payload (sample data; a trend, not a diagnosis). */
export function getBloodPressureDetail(): BloodPressureDetail {
  return BLOOD_PRESSURE_DETAIL;
}
