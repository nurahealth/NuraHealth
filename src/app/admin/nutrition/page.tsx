import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NutritionAdminClient, { type AdminRecipe, type AdminIngredient } from "./NutritionAdminClient";

// Admin layout already gates /admin/* server-side; this re-asserts the gate for
// this route's own data fetch (same pattern as /admin/lab & /admin/knowledge).
export default async function AdminNutritionPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!(profile as { is_admin?: boolean } | null)?.is_admin) redirect("/");

  const [{ data: recipes }, { data: ingredients }] = await Promise.all([
    supabaseAdmin.from("recipes").select("*").order("title", { ascending: true }),
    supabaseAdmin.from("ingredients").select("*").order("name", { ascending: true }),
  ]);

  return (
    <NutritionAdminClient
      initialRecipes={(recipes ?? []) as AdminRecipe[]}
      initialIngredients={(ingredients ?? []) as AdminIngredient[]}
    />
  );
}
