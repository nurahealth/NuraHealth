import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

const VALID_STATUS = new Set(["draft", "published"]);

// ── GET: single product ─────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    const { data, error } = await supabaseAdmin
      .from("catalog_products")
      .select("*, catalog_categories(id, name, slug, parent_id)")
      .eq("id", productId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products/:id GET] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load product" },
      { status: 500 }
    );
  }
}

// ── PATCH: update a product ─────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    const body = (await req.json()) as {
      name?: string;
      brand?: string;
      category_id?: string;
      description?: string;
      status?: string;
    };

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      update.name = name;
    }
    if (body.brand !== undefined) update.brand = body.brand.trim() || null;
    if (body.category_id !== undefined) {
      if (!body.category_id) return NextResponse.json({ error: "Category is required" }, { status: 400 });
      update.category_id = body.category_id;
    }
    if (body.description !== undefined) update.description = body.description.trim() || null;
    if (body.status !== undefined) {
      if (!VALID_STATUS.has(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      update.status = body.status;
    }

    const { data, error } = await supabaseAdmin
      .from("catalog_products")
      .update(update)
      .eq("id", productId)
      .select("*, catalog_categories(id, name, slug, parent_id)")
      .single();

    if (error) {
      console.error("[admin/catalog/products/:id PATCH] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product: data });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products/:id PATCH] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update product" },
      { status: 500 }
    );
  }
}

// ── DELETE: remove a product ────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    const { error } = await supabaseAdmin
      .from("catalog_products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("[admin/catalog/products/:id DELETE] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, deletedId: productId });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products/:id DELETE] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete product" },
      { status: 500 }
    );
  }
}
