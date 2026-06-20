import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import {
  RECIPE_CATEGORIES, STATUSES, slugify, slugTaken,
  toStringArray, toNumberedSteps,
} from "@/lib/admin-nutrition";

const CATEGORY_SET = new Set<string>(RECIPE_CATEGORIES);
const STATUS_SET = new Set<string>(STATUSES);

// Insert recipe_ingredient links for a recipe (order preserved by index).
async function insertLinks(recipeId: string, links: unknown): Promise<void> {
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

// ── GET: list all recipes (with ingredient links count) ─────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { data, error } = await supabaseAdmin
      .from("recipes")
      .select("*")
      .order("title", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ recipes: data ?? [] });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/recipes GET] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load recipes" }, { status: 500 });
  }
}

// ── POST: create a recipe + its ingredient links ────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json()) as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const category = typeof body.category === "string" ? body.category : "";
    if (!CATEGORY_SET.has(category)) return NextResponse.json({ error: "A valid category is required" }, { status: 400 });

    const status = typeof body.status === "string" ? body.status : "draft";
    if (!STATUS_SET.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const slug = slugify((typeof body.slug === "string" && body.slug.trim()) ? body.slug : title);
    if (await slugTaken("recipes", slug)) {
      return NextResponse.json({ error: `Slug "${slug}" is already in use — choose a different one` }, { status: 409 });
    }

    const insert = {
      title,
      slug,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      category,
      cuisine: typeof body.cuisine === "string" && body.cuisine.trim() ? body.cuisine.trim() : null,
      total_minutes: body.total_minutes === null || body.total_minutes === undefined || body.total_minutes === "" ? null : Number(body.total_minutes),
      servings: body.servings === null || body.servings === undefined || body.servings === "" ? null : Number(body.servings),
      is_organic: body.is_organic === true,
      goal_tags: toStringArray(body.goal_tags),
      system_tags: toStringArray(body.system_tags),
      allergen_flags: toStringArray(body.allergen_flags),
      hero_style: typeof body.hero_style === "string" && body.hero_style.trim() ? body.hero_style.trim() : null,
      method_steps: toNumberedSteps(body.method_steps),
      status,
    };

    const { data, error } = await supabaseAdmin.from("recipes").insert(insert).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await insertLinks((data as { id: string }).id, body.ingredients);

    return NextResponse.json({ recipe: data }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/recipes POST] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create recipe" }, { status: 500 });
  }
}
