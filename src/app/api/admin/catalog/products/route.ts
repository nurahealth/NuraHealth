import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

// ── Slug helpers ────────────────────────────────────────────────────────────
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "product"
  );
}

// Pick a slug that doesn't collide with existing rows (append -2, -3, … as needed)
async function uniqueSlug(base: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("catalog_products")
    .select("slug")
    .like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => (r as { slug: string }).slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const VALID_STATUS = new Set(["draft", "published"]);

// ── GET: list all products, newest first, with category joined ──────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    const { data, error } = await supabaseAdmin
      .from("catalog_products")
      .select("*, catalog_categories(id, name, slug, parent_id)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/catalog/products GET] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products GET] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load products" },
      { status: 500 }
    );
  }
}

// ── POST: create a new product ──────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    const body = (await req.json()) as {
      name?: string;
      brand?: string;
      category_id?: string;
      description?: string;
      status?: string;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.category_id) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    const status = body.status ?? "draft";
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const slug = await uniqueSlug(slugify(name));

    const { data, error } = await supabaseAdmin
      .from("catalog_products")
      .insert({
        name,
        slug,
        brand: body.brand?.trim() || null,
        category_id: body.category_id,
        description: body.description?.trim() || null,
        status,
        source_urls: [],
        attributes: {},
      })
      .select("*, catalog_categories(id, name, slug, parent_id)")
      .single();

    if (error) {
      console.error("[admin/catalog/products POST] insert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products POST] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
