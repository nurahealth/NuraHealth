import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import RecipesBrowseClient, { type Recipe } from "./RecipesBrowseClient";

export const dynamic = "force-dynamic";

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  total_minutes: number | null;
  servings: number | null;
  is_organic: boolean;
  goal_tags: string[] | null;
  system_tags: string[] | null;
  status: string;
}

export default async function RecipesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  // All recipes (incl. draft stubs) so the library renders fully for review,
  // plus a lightweight recipe→ingredient-name map to power ingredient search.
  const [{ data: recipeRows }, { data: linkRows }] = await Promise.all([
    supabaseAdmin
      .from("recipes")
      .select("id, slug, title, description, category, cuisine, total_minutes, servings, is_organic, goal_tags, system_tags, status")
      .order("title", { ascending: true }),
    supabaseAdmin
      .from("recipe_ingredients")
      .select("recipe_id, ingredients(name)"),
  ]);

  // recipe_id → [ingredient names]
  const namesByRecipe = new Map<string, string[]>();
  for (const row of (linkRows ?? []) as Array<{ recipe_id: string; ingredients: { name: string } | { name: string }[] | null }>) {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    if (!ing?.name) continue;
    const arr = namesByRecipe.get(row.recipe_id) ?? [];
    arr.push(ing.name);
    namesByRecipe.set(row.recipe_id, arr);
  }

  const recipes: Recipe[] = ((recipeRows ?? []) as RecipeRow[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    cuisine: r.cuisine,
    total_minutes: r.total_minutes,
    servings: r.servings,
    is_organic: r.is_organic,
    goal_tags: r.goal_tags ?? [],
    system_tags: r.system_tags ?? [],
    status: r.status,
    ingredientNames: namesByRecipe.get(r.id) ?? [],
  }));

  return (
    <NuraPageShell maxWidth={1040}>
      <RecipesBrowseClient recipes={recipes} />
    </NuraPageShell>
  );
}
