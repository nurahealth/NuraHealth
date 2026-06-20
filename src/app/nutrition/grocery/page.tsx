import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import GroceryClient, { type GroceryItem, type PlanItem } from "./GroceryClient";

export const dynamic = "force-dynamic";

interface IngredientEmbed { slug: string; name: string; category: string | null }

// Next 7 calendar days as YYYY-MM-DD, starting today.
function weekDates(): { start: string; end: string } {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const last = new Date(now);
  last.setDate(last.getDate() + 6);
  return { start, end: last.toISOString().slice(0, 10) };
}

// Build the plan-derived candidate items from this week's planned meals
// (deduped by ingredient slug, excluded ingredients removed).
async function buildPlanItems(userId: string): Promise<PlanItem[]> {
  const { start, end } = weekDates();
  const [{ data: planned }, { data: prefRow }] = await Promise.all([
    supabaseAdmin
      .from("planned_meals")
      .select("recipe_id")
      .eq("user_id", userId)
      .gte("plan_date", start)
      .lte("plan_date", end),
    supabaseAdmin
      .from("nutrition_preferences")
      .select("excluded_ingredients")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const recipeIds = [...new Set(((planned ?? []) as { recipe_id: string | null }[]).map((r) => r.recipe_id).filter((x): x is string => !!x))];
  if (recipeIds.length === 0) return [];

  const excluded = new Set(
    ((prefRow?.excluded_ingredients ?? []) as string[]).map((s) => s.toLowerCase().trim()).filter(Boolean)
  );
  const isExcluded = (slug: string, name: string): boolean => {
    if (excluded.size === 0) return false;
    const n = name.toLowerCase();
    return excluded.has(slug) || [...excluded].some((e) => n.includes(e));
  };

  const { data: riRows } = await supabaseAdmin
    .from("recipe_ingredients")
    .select("amount_text, ingredients(slug, name, category)")
    .in("recipe_id", recipeIds);

  type Agg = { name: string; category: string; amounts: Set<string> };
  const bySlug = new Map<string, Agg>();
  for (const row of (riRows ?? []) as Array<{ amount_text: string | null; ingredients: IngredientEmbed | IngredientEmbed[] | null }>) {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    if (!ing?.slug || !ing.name) continue;
    if (isExcluded(ing.slug, ing.name)) continue;
    const entry = bySlug.get(ing.slug) ?? { name: ing.name, category: ing.category ?? "other", amounts: new Set<string>() };
    if (row.amount_text && row.amount_text.trim()) entry.amounts.add(row.amount_text.trim());
    bySlug.set(ing.slug, entry);
  }

  return [...bySlug.values()].map((a) => ({
    name: a.name,
    amount_text: a.amounts.size ? [...a.amounts].join(" · ") : null,
    category: a.category,
  }));
}

export default async function GroceryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const planItems = await buildPlanItems(user.id);

  // Read the user's grocery_items. If the table isn't there yet (migration not
  // applied), degrade gracefully instead of 500-ing.
  let tableReady = true;
  let items: GroceryItem[] = [];
  const { data: rows, error } = await supabaseAdmin
    .from("grocery_items")
    .select("id, name, amount_text, category, is_checked, source, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  if (error) {
    const msg = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (msg.includes("does not exist") || msg.includes("schema cache") || error.code === "42P01") {
      tableReady = false;
    }
  } else {
    items = (rows ?? []) as GroceryItem[];
  }

  // First load: if the table is ready but empty, seed it from this week's plan.
  if (tableReady && items.length === 0 && planItems.length > 0) {
    const seed = planItems.map((p, i) => ({
      user_id: user.id,
      name: p.name,
      amount_text: p.amount_text,
      category: p.category,
      source: "plan" as const,
      is_checked: false,
      sort_order: i,
    }));
    const { error: insErr } = await supabaseAdmin.from("grocery_items").insert(seed);
    if (!insErr) {
      const { data: reread } = await supabaseAdmin
        .from("grocery_items")
        .select("id, name, amount_text, category, is_checked, source, sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      items = (reread ?? []) as GroceryItem[];
    }
  }

  return (
    <NuraPageShell maxWidth={760}>
      <GroceryClient items={items} planItems={planItems} tableReady={tableReady} userId={user.id} />
    </NuraPageShell>
  );
}
