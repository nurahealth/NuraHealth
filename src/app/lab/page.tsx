import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import LabBrowseClient, { type LabCategory, type LabProduct } from "./LabBrowseClient";

export default async function LabPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  // Beta-flag gate — unchanged
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("catalog_beta_enabled")
    .eq("id", user.id)
    .single();

  const profile = data as { catalog_beta_enabled: boolean } | null;
  if (profile?.catalog_beta_enabled !== true) redirect("/dashboard");

  // Fetch categories (parent/child) and published products
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from("catalog_categories")
      .select("id, slug, name, parent_id, sort_order")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("catalog_products")
      .select("id, slug, name, brand, score, lab_tested, image_url, category_id")
      .eq("status", "published")
      .order("score", { ascending: false, nullsFirst: false }),
  ]);

  return (
    <NuraPageShell maxWidth={1040} title="Lab">
      <LabBrowseClient
        categories={(categories ?? []) as LabCategory[]}
        products={(products ?? []) as LabProduct[]}
      />
    </NuraPageShell>
  );
}
