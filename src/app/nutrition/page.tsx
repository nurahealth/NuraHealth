import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLatestBiomarkers } from "@/lib/bloodwork";
import NuraPageShell from "@/components/NuraPageShell";
import NutritionHome, {
  type MarkerCardVM,
  type MealVM,
  type SummaryVM,
} from "./NutritionHome";
import {
  resolveMarkerValue,
  computeMarkerGeometry,
  markerSeverity,
  buildSummaryNarrative,
  selectPlannedMeals,
  DEFAULT_PREFS,
  SAMPLE_VALUES,
  SAMPLE_COLLECTED,
  type MarkerDirection,
  type NutritionPrefs,
  type CandidateRecipe,
} from "@/lib/nutrition";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface HealthMarkerRow {
  slug: string;
  name: string;
  unit: string | null;
  optimal_min: number | null;
  optimal_max: number | null;
  direction: MarkerDirection;
  description: string | null;
  is_nutrition_responsive: boolean;
  display_order: number;
}

export default async function NutritionPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const today = todayISO();

  // ── Load everything in parallel ────────────────────────────────────────────
  const [
    realBiomarkers,
    { data: markerRows },
    { data: foodRows },
    { data: prefRow },
    { data: recipeRows },
    { data: riRows },
  ] = await Promise.all([
    getLatestBiomarkers(user.id),
    supabaseAdmin
      .from("health_markers")
      .select(
        "slug, name, unit, optimal_min, optimal_max, direction, description, is_nutrition_responsive, display_order"
      )
      .eq("is_nutrition_responsive", true)
      .order("display_order", { ascending: true }),
    supabaseAdmin
      .from("marker_foods")
      .select("marker_id, food_name, order_index, health_markers(slug), ingredients(name)")
      .order("order_index", { ascending: true }),
    supabaseAdmin
      .from("nutrition_preferences")
      .select(
        "dietary_pattern, excluded_ingredients, max_cook_minutes, prioritize_markers, respect_allergens, budget_friendly"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("recipes")
      .select("id, slug, title, category, status, total_minutes, goal_tags, allergen_flags")
      .eq("status", "published"),
    supabaseAdmin.from("recipe_ingredients").select("recipe_id, ingredients(slug, name)"),
  ]);

  const markers = (markerRows ?? []) as HealthMarkerRow[];

  // Review fallback: no panels on file → render with a clearly-labeled sample set.
  const isSample = realBiomarkers.length === 0;

  // First food (by order_index) per marker slug → one-line hint on the card.
  const foodHintBySlug = new Map<string, string>();
  for (const row of (foodRows ?? []) as Array<{
    food_name: string | null;
    health_markers: { slug: string } | { slug: string }[] | null;
    ingredients: { name: string } | { name: string }[] | null;
  }>) {
    const hm = Array.isArray(row.health_markers) ? row.health_markers[0] : row.health_markers;
    if (!hm?.slug || foodHintBySlug.has(hm.slug)) continue;
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    const label = ing?.name ?? row.food_name;
    if (label) foodHintBySlug.set(hm.slug, label);
  }

  // ── Build marker view-models (only markers we can resolve a value for) ──────
  interface Built extends MarkerCardVM {
    severity: number;
    direction: MarkerDirection;
    optimal_min: number | null;
    optimal_max: number | null;
  }
  const built: Built[] = [];
  for (const m of markers) {
    let value: number | null = null;
    let collected: string | null = null;
    if (isSample) {
      if (m.slug in SAMPLE_VALUES) {
        value = SAMPLE_VALUES[m.slug];
        collected = SAMPLE_COLLECTED;
      }
    } else {
      const resolved = resolveMarkerValue(m.slug, realBiomarkers);
      if (resolved) {
        value = resolved.value;
        collected = resolved.collected_date;
      }
    }
    if (value == null) continue; // gracefully skip markers with no value

    const geo = computeMarkerGeometry(value, m.optimal_min, m.optimal_max, m.direction, m.unit);
    built.push({
      slug: m.slug,
      name: m.name,
      unit: m.unit,
      value,
      status: geo.status,
      rangeLabel: geo.rangeLabel,
      bandStartPct: geo.bandStartPct,
      bandEndPct: geo.bandEndPct,
      dotPct: geo.dotPct,
      foodHint: foodHintBySlug.get(m.slug) ?? null,
      collectedDate: collected,
      severity: markerSeverity(value, m.optimal_min, m.optimal_max, m.direction),
      direction: m.direction,
      optimal_min: m.optimal_min,
      optimal_max: m.optimal_max,
    });
  }

  const flagged = built.filter((b) => b.status === "attention").sort((a, b) => b.severity - a.severity);
  const strong = built.filter((b) => b.status === "optimal");
  const flaggedSlugs = flagged.map((b) => b.slug);
  // Flagged first (most significant first), then the strong ones.
  const markerCards: MarkerCardVM[] = [...flagged, ...strong];

  const markerNames: Record<string, string> = {};
  for (const b of built) markerNames[b.slug] = b.name;

  // ── Build candidate recipes for plan generation ────────────────────────────
  const ingBySlug = new Map<string, { slugs: string[]; names: string[] }>();
  for (const row of (riRows ?? []) as Array<{
    recipe_id: string;
    ingredients: { slug: string; name: string } | { slug: string; name: string }[] | null;
  }>) {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    if (!ing) continue;
    const e = ingBySlug.get(row.recipe_id) ?? { slugs: [], names: [] };
    if (ing.slug) e.slugs.push(ing.slug);
    if (ing.name) e.names.push(ing.name);
    ingBySlug.set(row.recipe_id, e);
  }
  const candidates: CandidateRecipe[] = (
    (recipeRows ?? []) as Array<{
      id: string;
      slug: string;
      category: string;
      status: string;
      total_minutes: number | null;
      goal_tags: string[] | null;
      allergen_flags: string[] | null;
    }>
  ).map((r) => ({
    id: r.id,
    slug: r.slug,
    category: r.category,
    status: r.status,
    total_minutes: r.total_minutes,
    goal_tags: r.goal_tags ?? [],
    allergen_flags: r.allergen_flags ?? [],
    ingredientSlugs: ingBySlug.get(r.id)?.slugs ?? [],
    ingredientNames: ingBySlug.get(r.id)?.names ?? [],
  }));

  const prefs: NutritionPrefs = prefRow
    ? {
        dietary_pattern: prefRow.dietary_pattern ?? null,
        excluded_ingredients: prefRow.excluded_ingredients ?? [],
        max_cook_minutes: prefRow.max_cook_minutes ?? null,
        prioritize_markers: prefRow.prioritize_markers ?? true,
        respect_allergens: prefRow.respect_allergens ?? true,
        budget_friendly: prefRow.budget_friendly ?? false,
      }
    : DEFAULT_PREFS;

  // ── Today's plan — read, and generate+persist if none exists ───────────────
  async function readPlan(): Promise<MealVM[]> {
    const { data } = await supabaseAdmin
      .from("planned_meals")
      .select("id, meal_slot, target_marker_slug, order_index, recipes(slug, title)")
      .eq("user_id", user!.id)
      .eq("plan_date", today)
      .order("order_index", { ascending: true });
    return ((data ?? []) as Array<{
      id: string;
      meal_slot: string;
      target_marker_slug: string | null;
      order_index: number;
      recipes: { slug: string; title: string } | { slug: string; title: string }[] | null;
    }>)
      .map((row) => {
        const rec = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;
        if (!rec) return null;
        return {
          id: row.id,
          recipeSlug: rec.slug,
          recipeTitle: rec.title,
          slot: row.meal_slot,
          targetMarkerSlug: row.target_marker_slug,
          targetMarkerName: row.target_marker_slug ? markerNames[row.target_marker_slug] ?? null : null,
        } as MealVM;
      })
      .filter((m): m is MealVM => m !== null);
  }

  let meals = await readPlan();
  if (meals.length === 0 && flaggedSlugs.length > 0 && candidates.length > 0) {
    const rows = selectPlannedMeals({ recipes: candidates, flaggedSlugs, prefs });
    if (rows.length > 0) {
      await supabaseAdmin.from("planned_meals").insert(
        rows.map((r) => ({
          user_id: user.id,
          plan_date: today,
          meal_slot: r.meal_slot,
          recipe_id: r.recipe_id,
          target_marker_slug: r.target_marker_slug,
          order_index: r.order_index,
        }))
      );
      meals = await readPlan();
    }
  }

  // ── Summary stats + narrative ──────────────────────────────────────────────
  const targetedFlagged = new Set(
    meals.map((m) => m.targetMarkerSlug).filter((s): s is string => !!s && flaggedSlugs.includes(s))
  );
  const markersInFocus = flagged.length;
  const mealsPlanned = meals.length;
  const markersImproving = targetedFlagged.size;
  const onPlanPct =
    flagged.length > 0
      ? Math.round((markersImproving / flagged.length) * 100)
      : mealsPlanned > 0
        ? 100
        : built.length > 0
          ? 100
          : 0;

  const topMarker = flagged[0] ?? null;
  const topHints: string[] = [];
  for (const f of (foodRows ?? []) as Array<{
    food_name: string | null;
    health_markers: { slug: string } | { slug: string }[] | null;
    ingredients: { name: string } | { name: string }[] | null;
  }>) {
    if (!topMarker) break;
    const hm = Array.isArray(f.health_markers) ? f.health_markers[0] : f.health_markers;
    if (hm?.slug !== topMarker.slug) continue;
    const ing = Array.isArray(f.ingredients) ? f.ingredients[0] : f.ingredients;
    const label = ing?.name ?? f.food_name;
    if (label && topHints.length < 2) topHints.push(label.toLowerCase());
  }
  const focusHint = topHints.length ? topHints.join(" and ") : null;

  const summary: SummaryVM = {
    narrative: buildSummaryNarrative({
      flaggedNames: flagged.map((f) => f.name),
      strongCount: strong.length,
      topMarkerName: topMarker?.name ?? null,
      focusHint,
    }),
    onPlanPct,
    markersInFocus,
    mealsPlanned,
    markersImproving,
  };

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <NuraPageShell maxWidth={860}>
      <NutritionHome
        dateLabel={dateLabel}
        isSample={isSample}
        summary={summary}
        markers={markerCards}
        meals={meals}
        prefs={prefs}
        candidates={candidates}
        flaggedSlugs={flaggedSlugs}
        userId={user.id}
      />
    </NuraPageShell>
  );
}
