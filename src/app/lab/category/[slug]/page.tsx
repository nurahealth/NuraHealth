import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import NuraPageShell from "@/components/NuraPageShell";
import { ProductCard, type LabCategory, type LabProduct } from "../../LabBrowseClient";

const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const SANS = "var(--font-inter), system-ui, sans-serif";

export default async function LabCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard");

  const { data: categories } = await supabaseAdmin
    .from("catalog_categories")
    .select("id, slug, name, parent_id, sort_order");
  const cats = (categories ?? []) as LabCategory[];
  const current = cats.find((c) => c.slug === slug);
  if (!current) notFound();

  // A parent category shows everything underneath it as well.
  const ids = new Set<string>([current.id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of cats) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) { ids.add(c.id); grew = true; }
    }
  }

  const { data: products } = await supabaseAdmin
    .from("catalog_products")
    .select("id, slug, name, brand, score, lab_tested, image_url, category_id")
    .eq("status", "published")
    .in("category_id", [...ids])
    .order("score", { ascending: false, nullsFirst: false });
  const list = (products ?? []) as LabProduct[];
  const parent = current.parent_id ? cats.find((c) => c.id === current.parent_id) : null;

  return (
    <NuraPageShell maxWidth={1040} desktopMaxWidth={1280}>
      <style>{`
        .lab-card { transition: background 180ms, border-color 180ms, transform 180ms; }
        .lab-card:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-2px); }
      `}</style>
      <div style={{ marginBottom: 22 }}>
        <Link href="/lab" style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, textDecoration: "none" }}>
          ← All products{parent ? ` · ${parent.name}` : ""}
        </Link>
        <h1 style={{ fontFamily: SANS, fontSize: "clamp(28px, 4.5vw, 36px)", fontWeight: 600, color: TEXT, margin: "10px 0 6px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          {current.name}
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, margin: 0 }}>
          {list.length} {list.length === 1 ? "product" : "products"}, ranked by score.
        </p>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", fontFamily: SANS, color: TEXT_SEC }}>
          Nothing scored here yet.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {list.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </NuraPageShell>
  );
}
