// ─────────────────────────────────────────────────────────────────────────────
// Meal-plan scoring engine — pure domain logic (no I/O; runs identically on the
// server for initial generation and on the client for "Update my meals" /
// "Regenerate week"). This is the single place the personalization math lives, so
// all three regeneration paths stay in lockstep and the weights are tunable here.
//
// Signals, strongest → weakest:
//   STRONG  — the recipe contains an ingredient that is a *top food* for a flagged
//             marker (recipe_ingredients → ingredients → marker_foods.ingredient_id).
//             This is real evidence, and it's what makes the "For Vitamin D" tag and
//             the explainer sentence truthful.
//   MEDIUM  — the recipe's goal_tags map to a flagged marker's category via
//             MARKER_GOALS (e.g. anti-inflammatory ↔ hs-CRP). Weaker, category-level.
//
// Every signal is multiplied by a severity weight so markers that are further out
// of their optimal range pull harder on the plan.
// ─────────────────────────────────────────────────────────────────────────────

import {
  MARKER_GOALS,
  recipePassesPrefs,
  type CandidateRecipe,
  type NutritionPrefs,
  type PlannedRow,
} from "./nutrition";

// A flagged (out-of-optimal) marker plus the context we score + explain against.
export interface FlaggedMarker {
  slug: string;
  name: string;
  severity: number;   // >0; from markerSeverity — larger = further out of range
  value: number;      // the user's latest reading (for the explainer line)
  unit: string | null;
}

// marker slug → that marker's "top foods" (ingredient slug + display name),
// built from marker_foods → ingredients. Drives the STRONG signal + the reason.
export type MarkerFoodMap = Record<string, { slug: string; name: string }[]>;

// ── Tunable weights — one knob-board for the whole engine ────────────────────
export const SCORE = {
  STRONG: 10,        // recipe has a top food for the marker (ingredient-level)
  STRONG_EXTRA: 3,   // each ADDITIONAL top-food match for the same marker
  MEDIUM: 4,         // recipe goal_tag maps to the marker (category-level)
  SEVERITY_CAP: 3,   // ceiling on the severity multiplier (one wild value can't dominate)
  LEAD_BONUS: 2.5,   // extra pull for the day's rotated "lead" marker (variety)
};

// Out-of-range markers weigh more. severity is a fractional distance past the
// optimal edge (see markerSeverity); we cap it so a single extreme value can't
// swamp the plan.
export function severityWeight(severity: number): number {
  return 1 + Math.min(Math.max(severity, 0), SCORE.SEVERITY_CAP);
}

export interface RecipeScore {
  total: number;                   // overall — higher = better fit for this user
  bestMarkerSlug: string | null;   // the marker it helps most → target_marker_slug
  bestSignal: "strong" | "medium" | null;
  bestFoodName: string | null;     // the specific top-food ingredient (for the reason)
  perMarker: Record<string, number>;
}

const EMPTY_SCORE: RecipeScore = {
  total: 0, bestMarkerSlug: null, bestSignal: null, bestFoodName: null, perMarker: {},
};

// Pure: score one recipe against the user's flagged markers.
export function scoreRecipe(
  recipe: CandidateRecipe,
  flagged: FlaggedMarker[],
  markerFoods: MarkerFoodMap,
  leadMarkerSlug?: string | null,
): RecipeScore {
  const ingredientSet = new Set(recipe.ingredientSlugs.map((s) => s.toLowerCase()));
  const perMarker: Record<string, number> = {};
  let total = 0;
  let best: { slug: string; score: number; signal: "strong" | "medium"; food: string | null } | null = null;

  for (const m of flagged) {
    let raw = 0;
    let signal: "strong" | "medium" | null = null;
    let food: string | null = null;

    // STRONG — ingredient-level match against this marker's top foods.
    const foods = markerFoods[m.slug] ?? [];
    const matches = foods.filter((f) => ingredientSet.has(f.slug.toLowerCase()));
    if (matches.length) {
      raw += SCORE.STRONG + SCORE.STRONG_EXTRA * (matches.length - 1);
      signal = "strong";
      food = matches[0].name;
    }

    // MEDIUM — goal_tag ↔ marker category mapping.
    if ((MARKER_GOALS[m.slug] ?? []).some((g) => recipe.goal_tags.includes(g))) {
      raw += SCORE.MEDIUM;
      if (!signal) signal = "medium";
    }

    if (raw <= 0) continue;

    const weight = severityWeight(m.severity) * (leadMarkerSlug === m.slug ? SCORE.LEAD_BONUS : 1);
    const contribution = raw * weight;
    perMarker[m.slug] = contribution;
    total += contribution;
    if (!best || contribution > best.score) best = { slug: m.slug, score: contribution, signal: signal!, food };
  }

  return {
    total,
    bestMarkerSlug: best?.slug ?? null,
    bestSignal: best?.signal ?? null,
    bestFoodName: best?.food ?? null,
    perMarker,
  };
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

// Pure: the short "why this meal" line. Strong picks name the specific food and
// the user's reading; medium picks give a softer, still-truthful line; fallback
// picks (no marker) get null.
export function buildMealReason(
  score: RecipeScore,
  flaggedBySlug: Record<string, FlaggedMarker>,
): string | null {
  const slug = score.bestMarkerSlug;
  if (!slug) return null;
  const m = flaggedBySlug[slug];
  if (!m) return null;
  const reading = `${m.value}${m.unit ? ` ${m.unit}` : ""}`;
  if (score.bestSignal === "strong" && score.bestFoodName) {
    return `${capitalize(score.bestFoodName)} is a top ${m.name} food — your last reading was ${reading}.`;
  }
  return `Chosen to support your ${m.name} — last reading ${reading}.`;
}

// The three primary slots we fill (snack is optional/manual, as today).
const SLOTS = ["breakfast", "lunch", "dinner"];

export interface DayPlanOptions {
  recipes: CandidateRecipe[];
  flagged: FlaggedMarker[];
  markerFoods: MarkerFoodMap;
  prefs: NutritionPrefs;
  avoidRecipeIds?: Set<string>;   // soft week-level de-dup (still usable if needed)
  leadMarkerSlug?: string | null; // rotate which marker the day emphasizes
}

// Pure: build one day's breakfast/lunch/dinner. Marker-driven when the user has
// flagged markers (and hasn't turned prioritization off); otherwise a balanced
// goal-tag fallback that mirrors the previous behavior. Never leaves a slot empty
// while eligible recipes remain.
export function buildDayPlan(opts: DayPlanOptions): PlannedRow[] {
  const { recipes, flagged, markerFoods, prefs, avoidRecipeIds, leadMarkerSlug } = opts;

  const flaggedBySlug: Record<string, FlaggedMarker> = {};
  for (const m of flagged) flaggedBySlug[m.slug] = m;

  const eligible = recipes.filter((r) => recipePassesPrefs(r, prefs));
  const useMarkers = flagged.length > 0 && prefs.prioritize_markers !== false;

  const scored = eligible.map((r) => ({
    r,
    s: useMarkers ? scoreRecipe(r, flagged, markerFoods, leadMarkerSlug) : EMPTY_SCORE,
  }));

  // Primary pool: recipes that actually score. If nothing scores (few/no markers,
  // or prioritization off) fall back to a balanced goal-tag ranking.
  let pool = useMarkers ? scored.filter((x) => x.s.total > 0) : [];
  if (pool.length === 0) {
    pool = [...scored].sort(
      (a, b) => b.r.goal_tags.length - a.r.goal_tags.length ||
        (a.r.total_minutes ?? 999) - (b.r.total_minutes ?? 999),
    );
  } else {
    pool.sort(
      (a, b) => b.s.total - a.s.total ||
        (a.r.total_minutes ?? 999) - (b.r.total_minutes ?? 999),
    );
  }

  // Soft variety: push already-used-this-week recipes to the back of the pool
  // without removing them (stable sort keeps score order within each group), so a
  // small pool still fills every slot.
  if (avoidRecipeIds && avoidRecipeIds.size) {
    pool = [...pool].sort(
      (a, b) => Number(avoidRecipeIds.has(a.r.id)) - Number(avoidRecipeIds.has(b.r.id)),
    );
  }

  const used = new Set<string>();
  const filled = new Set<string>();
  const rows: PlannedRow[] = [];
  const mkRow = (x: { r: CandidateRecipe; s: RecipeScore }, slot: string): PlannedRow => ({
    recipe_id: x.r.id,
    meal_slot: slot,
    target_marker_slug: x.s.bestMarkerSlug,
    order_index: SLOTS.indexOf(slot),
    reason: buildMealReason(x.s, flaggedBySlug),
  });

  // Pass 1 — place each recipe in its natural category slot.
  for (const x of pool) {
    if (rows.length >= SLOTS.length) break;
    if (used.has(x.r.id)) continue;
    if (SLOTS.includes(x.r.category) && !filled.has(x.r.category)) {
      rows.push(mkRow(x, x.r.category));
      used.add(x.r.id); filled.add(x.r.category);
    }
  }
  // Pass 2 — fill any remaining slot with the best leftover recipe.
  for (const slot of SLOTS) {
    if (filled.has(slot)) continue;
    const next = pool.find((x) => !used.has(x.r.id));
    if (!next) break;
    rows.push(mkRow(next, slot));
    used.add(next.r.id); filled.add(slot);
  }

  return rows.sort((a, b) => a.order_index - b.order_index);
}

// Pure: build a 7-day plan with cross-day variety — rotate the "lead" marker each
// day so different days target different flagged markers, and avoid repeating a
// recipe within the week while the eligible pool is comfortably large enough.
export function buildWeekPlan(opts: {
  dates: string[];
  recipes: CandidateRecipe[];
  flagged: FlaggedMarker[];
  markerFoods: MarkerFoodMap;
  prefs: NutritionPrefs;
}): Record<string, PlannedRow[]> {
  const { dates, recipes, flagged, markerFoods, prefs } = opts;
  const avoid = new Set<string>();
  const eligibleCount = recipes.filter((r) => recipePassesPrefs(r, prefs)).length;
  const enforceVariety = eligibleCount > 6; // need >2 days' worth before we de-dup
  const out: Record<string, PlannedRow[]> = {};

  for (let i = 0; i < dates.length; i++) {
    const leadMarkerSlug = flagged.length ? flagged[i % flagged.length].slug : null;
    const rows = buildDayPlan({
      recipes, flagged, markerFoods, prefs,
      avoidRecipeIds: enforceVariety ? avoid : undefined,
      leadMarkerSlug,
    });
    out[dates[i]] = rows;
    if (enforceVariety) for (const r of rows) avoid.add(r.recipe_id);
  }
  return out;
}
