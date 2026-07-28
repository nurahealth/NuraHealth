// ─────────────────────────────────────────────────────────────────────────────
// Nutrition tab — pure domain logic (no I/O; safe on client or server).
//
// The personalized Nutrition tab reads the user's REAL marker values from the
// existing `biomarkers` table (via getLatestBiomarkers) and joins them to the
// `health_markers` catalog by slug. health_markers.slug is aligned to the ids in
// biomarkerCatalog.ts, so we resolve a user's value through the same alias
// matcher (`matchBiomarker`) the /lab page uses. Everything here is pure so the
// same meal-selection logic runs both server-side (initial plan generation) and
// client-side (the Customize sheet's "Update my meals").
// ─────────────────────────────────────────────────────────────────────────────

import type { Biomarker } from "./bloodwork";
import {
  BIOMARKER_CATALOG,
  matchBiomarker,
  type CatalogMarker,
  type CatalogSection,
} from "./biomarkerCatalog";

export type MarkerDirection = "in-range" | "lower-better" | "higher-better";
export type MarkerStatus = "optimal" | "attention";

// ── Catalog index (slug/id → catalog marker, for alias lookup) ────────────────
function flattenCatalog(catalog: CatalogSection[]): CatalogMarker[] {
  const out: CatalogMarker[] = [];
  for (const section of catalog) {
    if (section.markers) out.push(...section.markers);
    if (section.subgroups) for (const sg of section.subgroups) out.push(...sg.markers);
  }
  return out;
}
const CATALOG_BY_ID: Map<string, CatalogMarker> = new Map(
  flattenCatalog(BIOMARKER_CATALOG).map((m) => [m.id, m])
);

export interface ResolvedValue {
  value: number;
  unit: string;
  collected_date: string | null;
}

// Resolve a user's real value for a health_marker slug, via catalog aliases.
export function resolveMarkerValue(
  slug: string,
  userBiomarkers: Biomarker[]
): ResolvedValue | null {
  const cat = CATALOG_BY_ID.get(slug);
  if (!cat) return null;
  const match = userBiomarkers.find((b) => matchBiomarker(b.name, cat.aliases));
  if (!match) return null;
  return { value: match.value, unit: match.unit, collected_date: match.collected_date };
}

// ── Status + range-bar geometry ───────────────────────────────────────────────
export interface MarkerGeometry {
  status: MarkerStatus;
  barMin: number;
  barMax: number;
  bandStartPct: number; // optimal band, as 0–100 across the bar
  bandEndPct: number;
  dotPct: number;       // value position, 0–100
  rangeLabel: string;   // e.g. "40–60", "Under 100", "Over 60"
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function computeMarkerGeometry(
  value: number,
  optimalMin: number | null,
  optimalMax: number | null,
  direction: MarkerDirection,
  unit: string | null
): MarkerGeometry {
  // optimal vs attention
  let status: MarkerStatus = "optimal";
  if (direction === "lower-better") {
    status = optimalMax == null || value <= optimalMax ? "optimal" : "attention";
  } else if (direction === "higher-better") {
    status = optimalMin == null || value >= optimalMin ? "optimal" : "attention";
  } else {
    const okLow = optimalMin == null || value >= optimalMin;
    const okHigh = optimalMax == null || value <= optimalMax;
    status = okLow && okHigh ? "optimal" : "attention";
  }

  // bar scale + optimal band
  let barMin: number, barMax: number, bandStart: number, bandEnd: number;
  if (direction === "lower-better") {
    const cap = optimalMax ?? Math.max(value, 1);
    barMin = 0;
    barMax = Math.max(cap * 2, value * 1.2);
    bandStart = 0;
    bandEnd = cap;
  } else if (direction === "higher-better") {
    const floor = optimalMin ?? Math.max(value, 1);
    barMin = 0;
    barMax = Math.max(floor * 2, value * 1.2);
    bandStart = floor;
    bandEnd = barMax;
  } else {
    const lo = optimalMin ?? value;
    const hi = optimalMax ?? value;
    const span = Math.max(hi - lo, hi * 0.15, 1);
    barMin = Math.max(0, lo - span * 1.5);
    barMax = hi + span * 1.5;
    bandStart = lo;
    bandEnd = hi;
  }
  // make sure the value is visible within the bar
  if (value < barMin) barMin = value - (barMax - value) * 0.1;
  if (value > barMax) barMax = value + (value - barMin) * 0.1;
  const span = Math.max(barMax - barMin, 1e-6);

  const pct = (n: number) => clamp(((n - barMin) / span) * 100, 0, 100);

  const u = unit ? ` ${unit}` : "";
  let rangeLabel: string;
  if (direction === "lower-better") rangeLabel = `Under ${optimalMax ?? "—"}${u}`;
  else if (direction === "higher-better") rangeLabel = `Over ${optimalMin ?? "—"}${u}`;
  else rangeLabel = `${optimalMin ?? "—"}–${optimalMax ?? "—"}${u}`;

  return {
    status,
    barMin,
    barMax,
    bandStartPct: pct(bandStart),
    bandEndPct: pct(bandEnd),
    dotPct: pct(value),
    rangeLabel,
  };
}

// Relative severity (0 = optimal; larger = further out) — for ranking focus.
export function markerSeverity(
  value: number,
  optimalMin: number | null,
  optimalMax: number | null,
  direction: MarkerDirection
): number {
  const safe = (d: number, base: number) => (base ? d / base : d);
  if (direction === "lower-better") {
    return optimalMax != null && value > optimalMax ? safe(value - optimalMax, optimalMax) : 0;
  }
  if (direction === "higher-better") {
    return optimalMin != null && value < optimalMin ? safe(optimalMin - value, optimalMin) : 0;
  }
  if (optimalMin != null && value < optimalMin) return safe(optimalMin - value, optimalMin);
  if (optimalMax != null && value > optimalMax) return safe(value - optimalMax, optimalMax);
  return 0;
}

// ── Summary narrative (rule-based, no AI) ─────────────────────────────────────
function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function buildSummaryNarrative(opts: {
  flaggedNames: string[];
  strongCount: number;
  topMarkerName: string | null;
  focusHint: string | null;
}): string {
  const { flaggedNames, strongCount, topMarkerName, focusHint } = opts;
  if (flaggedNames.length === 0) {
    return "Your nutrition-responsive markers are all sitting in their optimal range — nicely done. This week keeps the momentum with steady, whole-food meals built around what already works for you.";
  }
  const n = flaggedNames.length;
  const lead = `Your latest bloodwork flags ${n} marker${n > 1 ? "s" : ""} outside ${n > 1 ? "their" : "its"} optimal range — ${joinNames(flaggedNames)}.`;
  const strong =
    strongCount > 0
      ? ` ${strongCount} other${strongCount > 1 ? "s are" : " is"} already looking strong.`
      : "";
  const focus =
    topMarkerName && focusHint
      ? ` This week leans on ${focusHint} to support your ${topMarkerName}.`
      : "";
  return lead + strong + focus;
}

// ── Meal selection (pure) ─────────────────────────────────────────────────────
// Which recipe goal_tags address which marker (used to match recipes to flags).
export const MARKER_GOALS: Record<string, string[]> = {
  "hs-crp": ["anti-inflammatory"],
  "ldl-c": ["heart"],
  "hdl-c": ["heart"],
  trig: ["heart", "blood-sugar"],
  hba1c: ["blood-sugar"],
  "mg-rbc": ["energy"],
  ferritin: ["energy"],
  b12: ["energy"],
  "vit-d": ["anti-inflammatory", "heart"],
  "omega3-idx": ["heart", "anti-inflammatory"],
};

// Dietary pattern → recipe allergen_flags to exclude.
const PATTERN_BLOCK: Record<string, string[]> = {
  vegan: ["contains-dairy", "contains-red-meat", "contains-shellfish"],
  vegetarian: ["contains-red-meat", "contains-shellfish"],
  pescatarian: ["contains-red-meat"],
};

export const DIETARY_PATTERNS = [
  { value: "", label: "No preference" },
  { value: "omnivore", label: "Omnivore" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "mediterranean", label: "Mediterranean" },
];

export interface NutritionPrefs {
  dietary_pattern: string | null;
  excluded_ingredients: string[];
  max_cook_minutes: number | null;
  prioritize_markers: boolean;
  respect_allergens: boolean;
  budget_friendly: boolean;
}

export const DEFAULT_PREFS: NutritionPrefs = {
  dietary_pattern: null,
  excluded_ingredients: [],
  max_cook_minutes: null,
  prioritize_markers: true,
  respect_allergens: true,
  budget_friendly: false,
};

export interface CandidateRecipe {
  id: string;
  slug: string;
  category: string;
  status: string;
  total_minutes: number | null;
  goal_tags: string[];
  allergen_flags: string[];
  ingredientSlugs: string[];
  ingredientNames: string[];
}

export interface PlannedRow {
  recipe_id: string;
  meal_slot: string;
  target_marker_slug: string | null;
  order_index: number;
  reason: string | null;
}

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"];

// Does a recipe satisfy the user's preferences (status, cook time, excluded
// ingredients, dietary-pattern allergens)? Shared by the generator and the
// weekly-plan swap picker so both filter identically.
export function recipePassesPrefs(r: CandidateRecipe, prefs: NutritionPrefs): boolean {
  const excluded = new Set(
    (prefs.excluded_ingredients ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean)
  );
  const blocked = prefs.dietary_pattern ? PATTERN_BLOCK[prefs.dietary_pattern] ?? [] : [];
  const maxMin = prefs.max_cook_minutes ?? null;

  if (r.status !== "published") return false;
  if (maxMin != null && r.total_minutes != null && r.total_minutes > maxMin) return false;
  if (excluded.size) {
    const toks = [...r.ingredientSlugs, ...r.ingredientNames].map((x) => x.toLowerCase());
    if (toks.some((t) => excluded.has(t) || [...excluded].some((e) => e && t.includes(e)))) return false;
  }
  if (prefs.respect_allergens && blocked.length && r.allergen_flags.some((f) => blocked.includes(f)))
    return false;
  return true;
}

// Which of the user's flagged markers a recipe's goal_tags address.
export function markersAddressed(goalTags: string[], flaggedSlugs: string[]): string[] {
  return flaggedSlugs.filter((slug) => (MARKER_GOALS[slug] ?? []).some((g) => goalTags.includes(g)));
}

// NOTE: the meal-selection engine now lives in ./mealScoring (buildDayPlan /
// buildWeekPlan), which does true marker-driven scoring. `markersAddressed`
// remains here as the shared goal_tag ↔ marker mapping used by both the engine
// (MEDIUM signal) and the weekly-plan swap picker.

// ── Sample bloodwork (review fallback when the account has no panels) ─────────
// Mapped onto health_marker slugs. Mirrors the values in the Phase 3 brief.
export const SAMPLE_VALUES: Record<string, number> = {
  "vit-d": 22,
  "ldl-c": 138,
  "hs-crp": 3.4,
  "mg-rbc": 2.1,
};
export const SAMPLE_COLLECTED = "2026-05-20";

// ── Amber gradient (marker hero) — mirrors sageGradient but in the attention hue.
export function amberGradient(key: string | null | undefined): string {
  const s = key ?? "";
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = h >>> 0;
  const angle = 115 + (h % 130);
  const a1 = 0.26 + ((h >> 3) % 9) / 100;
  const a2 = 0.08 + ((h >> 8) % 6) / 100;
  return (
    `linear-gradient(${angle}deg, ` +
    `rgba(var(--nura-good-rgb),${a1}) 0%, ` +
    `rgba(var(--nura-good-rgb),${a2}) 58%, ` +
    `rgba(var(--nura-bg-tint-rgb),0.02) 100%)`
  );
}
