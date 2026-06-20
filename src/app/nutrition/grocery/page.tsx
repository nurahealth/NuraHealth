import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import GroceryClient, { type GrocerySection } from "./GroceryClient";

export const dynamic = "force-dynamic";

// Aisle ordering for the section headers (known categories first, then any others).
const CATEGORY_ORDER = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit"];
const CATEGORY_LABELS: Record<string, string> = {
  "root-spice": "Roots & Spices",
  greens: "Greens",
  legumes: "Legumes",
  "good-fats": "Good Fats",
  ferments: "Ferments",
  protein: "Protein",
  fruit: "Fruit",
};

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Next 7 calendar days as YYYY-MM-DD, starting today.
function weekDates(): { start: string; end: string } {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const last = new Date(now);
  last.setDate(last.getDate() + 6);
  return { start, end: last.toISOString().slice(0, 10) };
}

interface IngredientEmbed { slug: string; name: string; category: string | null }

export default async function GroceryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { start, end } = weekDates();

  // This week's planned meals (next 7 days) + the prefs that gate exclusions.
  const [{ data: planned }, { data: prefRow }] = await Promise.all([
    supabaseAdmin
      .from("planned_meals")
      .select("recipe_id, plan_date, recipes(id, title)")
      .eq("user_id", user.id)
      .gte("plan_date", start)
      .lte("plan_date", end),
    supabaseAdmin
      .from("nutrition_preferences")
      .select("excluded_ingredients")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // recipe_id → title (deduped); collect the unique recipe ids to expand.
  const titleById = new Map<string, string>();
  for (const row of (planned ?? []) as Array<{ recipe_id: string | null; recipes: { id: string; title: string } | { id: string; title: string }[] | null }>) {
    if (!row.recipe_id) continue;
    const rec = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;
    if (rec?.title) titleById.set(row.recipe_id, rec.title);
  }
  const recipeIds = [...titleById.keys()];

  // Excluded ingredients (matched the same loose way as the plan generator).
  const excluded = new Set(
    ((prefRow?.excluded_ingredients ?? []) as string[]).map((s) => s.toLowerCase().trim()).filter(Boolean)
  );
  const isExcluded = (slug: string, name: string): boolean => {
    if (excluded.size === 0) return false;
    const n = name.toLowerCase();
    return excluded.has(slug) || [...excluded].some((e) => n.includes(e));
  };

  // Aggregate ingredients across all planned recipes, deduped by slug.
  type Agg = { slug: string; name: string; category: string; amounts: Set<string>; recipes: Set<string> };
  const bySlug = new Map<string, Agg>();

  if (recipeIds.length > 0) {
    const { data: riRows } = await supabaseAdmin
      .from("recipe_ingredients")
      .select("recipe_id, amount_text, ingredients(slug, name, category)")
      .in("recipe_id", recipeIds);

    for (const row of (riRows ?? []) as Array<{ recipe_id: string; amount_text: string | null; ingredients: IngredientEmbed | IngredientEmbed[] | null }>) {
      const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
      if (!ing?.slug || !ing.name) continue;
      if (isExcluded(ing.slug, ing.name)) continue;

      const entry = bySlug.get(ing.slug) ?? { slug: ing.slug, name: ing.name, category: ing.category ?? "other", amounts: new Set<string>(), recipes: new Set<string>() };
      if (row.amount_text && row.amount_text.trim()) entry.amounts.add(row.amount_text.trim());
      const title = titleById.get(row.recipe_id);
      if (title) entry.recipes.add(title);
      bySlug.set(ing.slug, entry);
    }
  }

  // Group into aisle sections, ordered by CATEGORY_ORDER then alphabetical.
  const byCategory = new Map<string, Agg[]>();
  for (const item of bySlug.values()) {
    const arr = byCategory.get(item.category) ?? [];
    arr.push(item);
    byCategory.set(item.category, arr);
  }
  const orderedCats = [...byCategory.keys()].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  const sections: GrocerySection[] = orderedCats.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? pretty(cat),
    items: (byCategory.get(cat) ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((i) => ({ slug: i.slug, name: i.name, amounts: [...i.amounts], recipes: [...i.recipes] })),
  }));

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <NuraPageShell maxWidth={760}>
      <GroceryClient sections={sections} totalItems={totalItems} weekStart={start} userId={user.id} />
    </NuraPageShell>
  );
}
