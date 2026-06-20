import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import {
  INGREDIENT_CATEGORIES, STATUSES, slugify, slugTaken,
  toStringArray, toNumberedSteps, toBlocks,
} from "@/lib/admin-nutrition";

const CATEGORY_SET = new Set<string>(INGREDIENT_CATEGORIES);
const STATUS_SET = new Set<string>(STATUSES);

// ── GET: list all ingredients ───────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { data, error } = await supabaseAdmin
      .from("ingredients")
      .select("*")
      .order("name", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ingredients: data ?? [] });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/ingredients GET] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load ingredients" }, { status: 500 });
  }
}

// ── POST: create an ingredient ──────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json()) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const category = typeof body.category === "string" ? body.category : "";
    if (!CATEGORY_SET.has(category)) return NextResponse.json({ error: "A valid category is required" }, { status: 400 });

    const status = typeof body.status === "string" ? body.status : "draft";
    if (!STATUS_SET.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const slug = slugify((typeof body.slug === "string" && body.slug.trim()) ? body.slug : name);
    if (await slugTaken("ingredients", slug)) {
      return NextResponse.json({ error: `Slug "${slug}" is already in use — choose a different one` }, { status: 409 });
    }

    const insert = {
      name,
      slug,
      category,
      tagline: typeof body.tagline === "string" && body.tagline.trim() ? body.tagline.trim() : null,
      is_organic: body.is_organic === true,
      supports_systems: toStringArray(body.supports_systems),
      active_compounds: toStringArray(body.active_compounds),
      pairs_with: toStringArray(body.pairs_with),
      cellular_explainer: toBlocks(body.cellular_explainer),
      how_to_use: toNumberedSteps(body.how_to_use),
      status,
    };

    const { data, error } = await supabaseAdmin.from("ingredients").insert(insert).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ingredient: data }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/ingredients POST] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create ingredient" }, { status: 500 });
  }
}
