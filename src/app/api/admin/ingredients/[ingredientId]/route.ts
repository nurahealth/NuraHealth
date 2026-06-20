import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import {
  INGREDIENT_CATEGORIES, STATUSES, slugify, slugTaken,
  toStringArray, toNumberedSteps, toBlocks,
} from "@/lib/admin-nutrition";

const CATEGORY_SET = new Set<string>(INGREDIENT_CATEGORIES);
const STATUS_SET = new Set<string>(STATUSES);

// ── GET: single ingredient (for the edit form) ──────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ingredientId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { ingredientId } = await params;
    const { data, error } = await supabaseAdmin.from("ingredients").select("*").eq("id", ingredientId).single();
    if (error || !data) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    return NextResponse.json({ ingredient: data });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/ingredients/:id GET] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load ingredient" }, { status: 500 });
  }
}

// ── PATCH: update an ingredient ─────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ingredientId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { ingredientId } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const update: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      update.name = name;
    }
    if (body.category !== undefined) {
      if (!CATEGORY_SET.has(String(body.category))) return NextResponse.json({ error: "A valid category is required" }, { status: 400 });
      update.category = body.category;
    }
    if (body.status !== undefined) {
      if (!STATUS_SET.has(String(body.status))) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      update.status = body.status;
    }
    if (body.slug !== undefined || body.name !== undefined) {
      const base = (typeof body.slug === "string" && body.slug.trim()) ? body.slug : (update.name as string | undefined) ?? "";
      if (base) {
        const slug = slugify(base);
        if (await slugTaken("ingredients", slug, ingredientId)) {
          return NextResponse.json({ error: `Slug "${slug}" is already in use — choose a different one` }, { status: 409 });
        }
        update.slug = slug;
      }
    }
    if (body.tagline !== undefined) update.tagline = typeof body.tagline === "string" && body.tagline.trim() ? body.tagline.trim() : null;
    if (body.is_organic !== undefined) update.is_organic = body.is_organic === true;
    if (body.supports_systems !== undefined) update.supports_systems = toStringArray(body.supports_systems);
    if (body.active_compounds !== undefined) update.active_compounds = toStringArray(body.active_compounds);
    if (body.pairs_with !== undefined) update.pairs_with = toStringArray(body.pairs_with);
    if (body.cellular_explainer !== undefined) update.cellular_explainer = toBlocks(body.cellular_explainer);
    if (body.how_to_use !== undefined) update.how_to_use = toNumberedSteps(body.how_to_use);

    if (Object.keys(update).length === 0) {
      const { data } = await supabaseAdmin.from("ingredients").select("*").eq("id", ingredientId).single();
      return NextResponse.json({ ingredient: data });
    }

    const { data, error } = await supabaseAdmin.from("ingredients").update(update).eq("id", ingredientId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    return NextResponse.json({ ingredient: data });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/ingredients/:id PATCH] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update ingredient" }, { status: 500 });
  }
}

// ── DELETE: remove an ingredient ────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ingredientId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { ingredientId } = await params;

    // Clear any recipe links referencing it first (no orphan FK rows).
    await supabaseAdmin.from("recipe_ingredients").delete().eq("ingredient_id", ingredientId);
    const { error } = await supabaseAdmin.from("ingredients").delete().eq("id", ingredientId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, deletedId: ingredientId });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/ingredients/:id DELETE] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete ingredient" }, { status: 500 });
  }
}
