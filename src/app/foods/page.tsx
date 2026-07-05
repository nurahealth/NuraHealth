import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import FoodsBrowseClient, { type Food } from "./FoodsBrowseClient";

export const dynamic = "force-dynamic";

interface IngredientRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  is_organic: boolean;
  supports_systems: string[] | null;
}

export default async function FoodsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: rows } = await supabaseAdmin
    .from("ingredients")
    .select("id, slug, name, category, tagline, is_organic, supports_systems")
    .order("name", { ascending: true });

  const foods: Food[] = ((rows ?? []) as IngredientRow[]).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    tagline: r.tagline,
    is_organic: r.is_organic,
    supports_systems: r.supports_systems ?? [],
  }));

  return (
    <NuraPageShell maxWidth={1040}>
      <FoodsBrowseClient foods={foods} />
    </NuraPageShell>
  );
}
