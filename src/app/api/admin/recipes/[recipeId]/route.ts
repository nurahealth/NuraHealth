import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import {
  RECIPE_CATEGORIES, STATUSES, slugify, slugTaken,
  toStringArray, toNumberedSteps, isMissingColumnError,
} from "@/lib/admin-nutrition";

const CATEGORY_SET = new Set<string>(RECIPE_CATEGORIES);
const STATUS_SET = new Set<string>(STATUSES);

// Replace all ingredient links for a recipe with the provided set (order = index).
async function replaceLinks(recipeId: string, links: unknown): Promise<void> {
  const { error: delErr } = await supabaseAdmin.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
  if (delErr) throw new Error(`Failed to clear ingredient links: ${delErr.message}`);
  if (!Array.isArray(links)) return;
  const rows = links
    .map((l, i) => {
      const o = (l ?? {}) as Record<string, unknown>;
      const ingredient_id = typeof o.ingredient_id === "string" ? o.ingredient_id : "";
      if (!ingredient_id) return null;
      return {
        recipe_id: recipeId,
        ingredient_id,
        amount_text: typeof o.amount_text === "string" && o.amount_text.trim() ? o.amount_text.trim() : null,
        primary_system: typeof o.primary_system === "string" && o.primary_system.trim() ? o.primary_system.trim() : null,
        context_note: typeof o.context_note === "string" && o.context_note.trim() ? o.context_note.trim() : null,
        order_index: i + 1,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);
  if (rows.length === 0) return;
  const { error } = await supabaseAdmin.from("recipe_ingredients").insert(rows);
  if (error) throw new Error(`Failed to link ingredients: ${error.message}`);
}

// ── GET: single recipe + its ingredient links (for the edit form) ───────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { recipeId } = await params;

    const [{ data: recipe, error }, { data: links }] = await Promise.all([
      supabaseAdmin.from("recipes").select("*").eq("id", recipeId).single(),
      supabaseAdmin
        .from("recipe_ingredients")
        .select("id, ingredient_id, amount_text, primary_system, context_note, order_index")
        .eq("recipe_id", recipeId)
        .order("order_index", { ascending: true }),
    ]);

    if (error || !recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    return NextResponse.json({ recipe, ingredients: links ?? [] });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/recipes/:id GET] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load recipe" }, { status: 500 });
  }
}

// ── PATCH: update a recipe + replace its ingredient links ───────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { recipeId } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    const update: Record<string, unknown> = {};

    if (body.title !== undefined) {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      update.title = title;
    }
    if (body.category !== undefined) {
      if (!CATEGORY_SET.has(String(body.category))) return NextResponse.json({ error: "A valid category is required" }, { status: 400 });
      update.category = body.category;
    }
    if (body.status !== undefined) {
      if (!STATUS_SET.has(String(body.status))) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      update.status = body.status;
    }
    if (body.slug !== undefined || body.title !== undefined) {
      const base = (typeof body.slug === "string" && body.slug.trim()) ? body.slug : (update.title as string | undefined) ?? "";
      if (base) {
        const slug = slugify(base);
        if (await slugTaken("recipes", slug, recipeId)) {
          return NextResponse.json({ error: `Slug "${slug}" is already in use — choose a different one` }, { status: 409 });
        }
        update.slug = slug;
      }
    }
    if (body.description !== undefined) update.description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
    if (body.cuisine !== undefined) update.cuisine = typeof body.cuisine === "string" && body.cuisine.trim() ? body.cuisine.trim() : null;
    if (body.total_minutes !== undefined) update.total_minutes = body.total_minutes === null || body.total_minutes === "" ? null : Number(body.total_minutes);
    if (body.servings !== undefined) update.servings = body.servings === null || body.servings === "" ? null : Number(body.servings);
    if (body.is_organic !== undefined) update.is_organic = body.is_organic === true;
    if (body.goal_tags !== undefined) update.goal_tags = toStringArray(body.goal_tags);
    if (body.system_tags !== undefined) update.system_tags = toStringArray(body.system_tags);
    if (body.allergen_flags !== undefined) update.allergen_flags = toStringArray(body.allergen_flags);
    if (body.hero_style !== undefined) update.hero_style = typeof body.hero_style === "string" && body.hero_style.trim() ? body.hero_style.trim() : null;
    if (body.image_url !== undefined) update.image_url = typeof body.image_url === "string" && body.image_url.trim() ? body.image_url.trim() : null;
    if (body.method_steps !== undefined) update.method_steps = toNumberedSteps(body.method_steps);

    if (Object.keys(update).length > 0) {
      let { data, error } = await supabaseAdmin.from("recipes").update(update).eq("id", recipeId).select("*").single();
      // Degrade gracefully if image_url isn't migrated yet (see POST route).
      if (error && isMissingColumnError(error, "image_url")) {
        const rest = { ...update };
        delete (rest as Record<string, unknown>).image_url;
        ({ data, error } = await supabaseAdmin.from("recipes").update(rest).eq("id", recipeId).select("*").single());
      }
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }

    if (body.ingredients !== undefined) await replaceLinks(recipeId, body.ingredients);

    const { data: fresh } = await supabaseAdmin.from("recipes").select("*").eq("id", recipeId).single();
    return NextResponse.json({ recipe: fresh });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/recipes/:id PATCH] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update recipe" }, { status: 500 });
  }
}

// ── DELETE: remove a recipe (its links cascade or are cleared first) ────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { recipeId } = await params;

    // Clear links first in case there's no ON DELETE CASCADE on the FK.
    await supabaseAdmin.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
    const { error } = await supabaseAdmin.from("recipes").delete().eq("id", recipeId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, deletedId: recipeId });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/recipes/:id DELETE] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete recipe" }, { status: 500 });
  }
}
