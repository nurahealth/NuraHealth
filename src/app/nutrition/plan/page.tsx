import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getLatestBiomarkersWith } from "@/lib/bloodwork";
import NuraPageShell from "@/components/NuraPageShell";
import WeekPlanClient, { type PlanDay, type PlanCandidate } from "./WeekPlanClient";
import {
  resolveMarkerValue,
  computeMarkerGeometry,
  markerSeverity,
  DEFAULT_PREFS,
  SAMPLE_VALUES,
  SAMPLE_COLLECTED,
  type MarkerDirection,
  type NutritionPrefs,
} from "@/lib/nutrition";
import { type FlaggedMarker, type MarkerFoodMap } from "@/lib/mealScoring";
import { selectPlannedMealsWithReason } from "@/lib/plannedMealsIO";

export const dynamic = "force-dynamic";

interface HealthMarkerRow {
  slug: string;
  name: string;
  unit: string | null;
  optimal_min: number | null;
  optimal_max: number | null;
  direction: MarkerDirection;
  is_nutrition_responsive: boolean;
  display_order: number;
}

// Next 7 calendar days starting today (YYYY-MM-DD).
function weekDates(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default async function WeekPlanPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const dates = weekDates();
  const start = dates[0];
  const end = dates[dates.length - 1];
  const today = start;

  type PlannedRow = {
    id: string; plan_date: string; meal_slot: string; target_marker_slug: string | null; order_index: number;
    reason?: string | null;
    recipes: { slug: string; title: string; total_minutes: number | null; category: string } | { slug: string; title: string; total_minutes: number | null; category: string }[] | null;
  };

  const [
    realBiomarkers,
    { data: markerRows },
    { data: prefRow },
    { data: recipeRows },
    { data: riRows },
    { data: foodRows },
    plannedRows,
  ] = await Promise.all([
    getLatestBiomarkersWith(supabase, user.id),
    supabaseAdmin
      .from("health_markers")
      .select("slug, name, unit, optimal_min, optimal_max, direction, is_nutrition_responsive, display_order")
      .eq("is_nutrition_responsive", true)
      .order("display_order", { ascending: true }),
    supabaseAdmin
      .from("nutrition_preferences")
      .select("dietary_pattern, excluded_ingredients, max_cook_minutes, prioritize_markers, respect_allergens, budget_friendly")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("recipes")
      .select("id, slug, title, category, status, total_minutes, goal_tags, allergen_flags")
      .eq("status", "published"),
    supabaseAdmin.from("recipe_ingredients").select("recipe_id, ingredients(slug, name)"),
    supabaseAdmin
      .from("marker_foods")
      .select("order_index, health_markers(slug), ingredients(slug, name)")
      .order("order_index", { ascending: true }),
    selectPlannedMealsWithReason<PlannedRow>((extra) =>
      supabaseAdmin
        .from("planned_meals")
        .select(`id, plan_date, meal_slot, target_marker_slug, order_index, recipes(slug, title, total_minutes, category)${extra}`)
        .eq("user_id", user.id)
        .gte("plan_date", start)
        .lte("plan_date", end)
    ),
  ]);

  const markers = (markerRows ?? []) as HealthMarkerRow[];
  const isSample = realBiomarkers.length === 0;
  const markerNames: Record<string, string> = {};
  for (const m of markers) markerNames[m.slug] = m.name;

  // ── Resolve flagged markers (most-significant-first) — same as the daily tab ─
  const built: { slug: string; name: string; unit: string | null; value: number; severity: number; status: string }[] = [];
  for (const m of markers) {
    let value: number | null = null;
    if (isSample) {
      if (m.slug in SAMPLE_VALUES) value = SAMPLE_VALUES[m.slug];
    } else {
      const resolved = resolveMarkerValue(m.slug, realBiomarkers);
      if (resolved) value = resolved.value;
    }
    if (value == null) continue;
    const geo = computeMarkerGeometry(value, m.optimal_min, m.optimal_max, m.direction, m.unit);
    built.push({ slug: m.slug, name: m.name, unit: m.unit, value, status: geo.status, severity: markerSeverity(value, m.optimal_min, m.optimal_max, m.direction) });
  }
  const flaggedBuilt = built.filter((b) => b.status === "attention").sort((a, b) => b.severity - a.severity);
  const flaggedSlugs = flaggedBuilt.map((b) => b.slug);
  const flaggedMarkers: FlaggedMarker[] = flaggedBuilt.map((b) => ({
    slug: b.slug, name: b.name, severity: b.severity, value: b.value, unit: b.unit,
  }));

  // marker slug → top foods (ingredient slug + name) for the scoring engine.
  const markerFoods: MarkerFoodMap = {};
  for (const row of (foodRows ?? []) as Array<{
    health_markers: { slug: string } | { slug: string }[] | null;
    ingredients: { slug: string; name: string } | { slug: string; name: string }[] | null;
  }>) {
    const hm = Array.isArray(row.health_markers) ? row.health_markers[0] : row.health_markers;
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    if (!hm?.slug || !ing?.slug || !ing?.name) continue;
    (markerFoods[hm.slug] ??= []).push({ slug: ing.slug, name: ing.name });
  }

  void SAMPLE_COLLECTED; // (sample date not surfaced on this view)

  // ── Candidate recipes (published) + ingredient maps, for regenerate/swap ────
  const ingByRecipe = new Map<string, { slugs: string[]; names: string[] }>();
  for (const row of (riRows ?? []) as Array<{ recipe_id: string; ingredients: { slug: string; name: string } | { slug: string; name: string }[] | null }>) {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    if (!ing) continue;
    const e = ingByRecipe.get(row.recipe_id) ?? { slugs: [], names: [] };
    if (ing.slug) e.slugs.push(ing.slug);
    if (ing.name) e.names.push(ing.name);
    ingByRecipe.set(row.recipe_id, e);
  }
  const candidates: PlanCandidate[] = ((recipeRows ?? []) as Array<{
    id: string; slug: string; title: string; category: string; status: string;
    total_minutes: number | null; goal_tags: string[] | null; allergen_flags: string[] | null;
  }>).map((r) => ({
    id: r.id, slug: r.slug, title: r.title, category: r.category, status: r.status,
    total_minutes: r.total_minutes, goal_tags: r.goal_tags ?? [], allergen_flags: r.allergen_flags ?? [],
    ingredientSlugs: ingByRecipe.get(r.id)?.slugs ?? [], ingredientNames: ingByRecipe.get(r.id)?.names ?? [],
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

  // ── Build the 7-day view-model from planned_meals ───────────────────────────
  const byDateSlot = new Map<string, PlannedRow>();
  let totalPlanned = 0;
  for (const row of plannedRows) {
    byDateSlot.set(`${row.plan_date}__${row.meal_slot}`, row);
    totalPlanned++;
  }

  const SLOTS = ["breakfast", "lunch", "dinner", "snack"];
  const days: PlanDay[] = dates.map((date) => {
    const d = new Date(`${date}T00:00:00`);
    return {
      date,
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      isToday: date === today,
      meals: SLOTS.map((slot) => {
        const row = byDateSlot.get(`${date}__${slot}`);
        if (!row) return { slot, meal: null };
        const rec = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;
        if (!rec) return { slot, meal: null };
        return {
          slot,
          meal: {
            id: row.id,
            recipeSlug: rec.slug,
            recipeTitle: rec.title,
            totalMinutes: rec.total_minutes,
            targetMarkerSlug: row.target_marker_slug,
            targetMarkerName: row.target_marker_slug ? markerNames[row.target_marker_slug] ?? null : null,
            reason: row.reason ?? null,
          },
        };
      }),
    };
  });

  return (
    <NuraPageShell maxWidth={860} desktopMaxWidth={1280}>
      <WeekPlanClient
        days={days}
        totalPlanned={totalPlanned}
        candidates={candidates}
        prefs={prefs}
        flaggedSlugs={flaggedSlugs}
        flaggedMarkers={flaggedMarkers}
        markerFoods={markerFoods}
        markerNames={markerNames}
        dates={dates}
        userId={user.id}
      />
    </NuraPageShell>
  );
}
