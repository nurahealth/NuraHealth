import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import CatalogClient, { type CatalogCategory, type CatalogProduct } from "./CatalogClient";

// Admin layout already gates /admin/* server-side; this re-asserts the gate for
// this route's own data fetch (same pattern as /admin/knowledge & /lab).
export default async function AdminLabPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!(profile as { is_admin?: boolean } | null)?.is_admin) redirect("/");

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from("catalog_products")
      .select("*, catalog_categories(id, name, slug, parent_id)")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("catalog_categories")
      .select("id, name, slug, parent_id, sort_order, active")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <CatalogClient
      initialProducts={(products ?? []) as CatalogProduct[]}
      categories={(categories ?? []) as CatalogCategory[]}
    />
  );
}
