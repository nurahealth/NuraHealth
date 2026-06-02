// ─────────────────────────────────────────────────────────────────────────────
// Dashboard data module
//
// Single source of truth for every metric value shown on the Dashboard.
// Today it returns realistic SAMPLE values. It is shaped so that a real
// device-integration source (Oura / Apple Watch / Apple Health) can later
// implement `getDashboardData()` (e.g. async, fetched per-user) WITHOUT the
// Dashboard UI having to change — the UI only ever reads these typed shapes.
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Sample payload
// ─────────────────────────────────────────────────────────────────────────────
const DASHBOARD_DATA: DashboardData = {
  user: { firstName: "Alex" },

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
    },
    {
      id: "resting-hr",
      name: "Resting HR",
      source: "apple-watch",
      value: 54,
      unit: "bpm",
      delta: { value: 2, dir: "down" },
      status: "good",
      caption: "Steady and low through the week",
      viz: { kind: "sparkline", points: [58, 57, 56, 55, 56, 55, 54] },
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
    },
    {
      id: "body-temp",
      name: "Body Temp",
      source: "oura",
      value: 0.3,
      displayValue: "+0.3°F",
      unit: "°F",
      status: "good",
      caption: "Slightly above your baseline",
      viz: { kind: "deviation", value: 0.3, baseline: 0, range: 1.5 },
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
  /** Tag text color (hand-picked for contrast on `color`). */
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
    { label: "Awake", color: "#ebe6d8", textColor: "#0d0d0e", duration: "0h 58m", pct: 12 },
    { label: "REM sleep", color: "#5dccae", textColor: "#06372c", duration: "2h 18m", pct: 28 },
    { label: "Light sleep", color: "#2f9e83", textColor: "#eafff7", duration: "3h 46m", pct: 46 },
    { label: "Deep sleep", color: "#15564a", textColor: "#9fe6d2", duration: "1h 04m", pct: 13 },
  ],
  hypnogram: {
    // 0 deep · 1 light · 2 REM · 3 awake
    levels: [
      1, 1, 2, 1, 0, 0, 1, 1, 2, 3, 1, 1, 0, 0, 0, 1, 2, 2, 1, 1, 0, 1, 1, 2,
      2, 3, 1, 1, 1, 2, 2, 2, 1, 3, 1, 2, 2, 2, 3, 1, 1, 2, 2, 3, 3,
    ],
    levelColors: ["#15564a", "#2f9e83", "#5dccae", "#ebe6d8"],
    axisLabels: ["11:48 PM", "2 AM", "4 AM", "6 AM", "8:08 AM"],
  },
  cycles: {
    total: 5,
    summary: "4 full · 1 partial",
    pattern: ["full", "full", "partial", "full", "full"],
  },
  insight:
    "Strong night — your deep sleep landed a touch under your sweet spot, but consistency and timing were dialed in. Skin temperature dropped below baseline, which usually tracks with good recovery. Keep the cool room and early wind-down going.",
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
