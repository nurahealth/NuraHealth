import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import SavedRecipesClient from "./SavedRecipesClient";
import { type Recipe } from "../../recipes/RecipesBrowseClient";
import { withImageUrlFallback } from "@/lib/recipeSelect";

export const dynamic = "force-dynamic";

type RecipeEmbed = {
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
  image_url: string | null;
  focal_x: number | null;
  focal_y: number | null;
};

export default async function SavedRecipesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  // The user's saved recipes, most-recently-saved first.
  const savedRows = await withImageUrlFallback<unknown[]>((imageCol) =>
    supabaseAdmin
      .from("saved_recipes")
      .select(`created_at, recipes(id, slug, title, description, category, cuisine, total_minutes, servings, is_organic, goal_tags, system_tags, status${imageCol})`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  );

  const recipes: Recipe[] = ((savedRows ?? []) as Array<{ recipes: RecipeEmbed | RecipeEmbed[] | null }>)
    .map((row) => {
      const r = Array.isArray(row.recipes) ? row.recipes[0] : row.recipes;
      if (!r) return null;
      return {
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
        image_url: r.image_url ?? null,
        focal_x: r.focal_x ?? null,
        focal_y: r.focal_y ?? null,
        ingredientNames: [], // not needed for the card
      } as Recipe;
    })
    .filter((r): r is Recipe => r !== null);

  return (
    <NuraPageShell maxWidth={1040}>
      <SavedRecipesClient recipes={recipes} userId={user.id} />
    </NuraPageShell>
  );
}
