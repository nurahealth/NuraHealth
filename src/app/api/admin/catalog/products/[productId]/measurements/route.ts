import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

const TYPE_SELECT = "id, name, slug, kind, unit, description, guideline_limit, sort_order";
const VALID_KIND = new Set(["contaminant", "nutrient", "property"]);

interface RawType {
  id: string; name: string; slug: string; kind: string | null; unit: string | null;
  description: string | null; guideline_limit: number | null; sort_order: number | null;
}

// Flatten the embedded type relation (object or single-element array) into a clean row.
function flatten(r: {
  id: string; value: number | null; risk_count: number | null; measurement_type_id: string;
  catalog_measurement_types: RawType | RawType[] | null;
}) {
  const t = Array.isArray(r.catalog_measurement_types) ? r.catalog_measurement_types[0] : r.catalog_measurement_types;
  return { id: r.id, value: r.value, risk_count: r.risk_count, measurement_type_id: r.measurement_type_id, type: t ?? null };
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "measurement";
}

async function uniqueTypeSlug(base: string): Promise<string> {
  const { data } = await supabaseAdmin.from("catalog_measurement_types").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => (r as { slug: string }).slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

const MEAS_SELECT = `id, value, risk_count, measurement_type_id, catalog_measurement_types(${TYPE_SELECT})`;

// ── GET: list a product's measurements + the full type catalogue for the picker ──
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    const [{ data: measRows, error: mErr }, { data: types, error: tErr }] = await Promise.all([
      supabaseAdmin.from("catalog_product_measurements").select(MEAS_SELECT).eq("product_id", productId),
      supabaseAdmin.from("catalog_measurement_types").select(TYPE_SELECT)
        .order("kind", { ascending: true }).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    ]);

    if (mErr || tErr) {
      const msg = mErr?.message || tErr?.message || "Failed to load measurements";
      console.error("[admin/catalog/.../measurements GET] failed:", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const measurements = ((measRows ?? []) as unknown as Parameters<typeof flatten>[0][]).map(flatten);
    return NextResponse.json({ measurements, types: types ?? [] });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../measurements GET] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load measurements" }, { status: 500 });
  }
}

// ── POST: attach a measurement — pick an existing type or create one inline ───
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    const body = (await req.json()) as {
      measurement_type_id?: string;
      new_type?: { name?: string; kind?: string; unit?: string; description?: string; guideline_limit?: number | string | null; sort_order?: number | string | null };
      value?: number | string | null;
      risk_count?: number | string | null;
    };

    // Per-product value + risk count
    let value: number | null = null;
    if (body.value !== null && body.value !== undefined && body.value !== "") {
      const n = Number(body.value);
      if (!Number.isFinite(n)) return NextResponse.json({ error: "Value must be a number" }, { status: 400 });
      value = n;
    }
    let risk_count = 0;
    if (body.risk_count !== null && body.risk_count !== undefined && body.risk_count !== "") {
      const n = Number(body.risk_count);
      if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Risk count must be 0 or more" }, { status: 400 });
      risk_count = Math.round(n);
    }

    // Resolve the measurement type: existing id, or create one inline
    let measurementTypeId = body.measurement_type_id?.trim() || "";

    if (!measurementTypeId) {
      const nt = body.new_type;
      const name = nt?.name?.trim();
      const kind = nt?.kind?.trim();
      if (!name) return NextResponse.json({ error: "New type needs a name" }, { status: 400 });
      if (!kind || !VALID_KIND.has(kind)) return NextResponse.json({ error: "Kind must be contaminant, nutrient, or property" }, { status: 400 });

      let guideline_limit: number | null = null;
      if (nt?.guideline_limit !== null && nt?.guideline_limit !== undefined && nt?.guideline_limit !== "") {
        const g = Number(nt.guideline_limit);
        if (!Number.isFinite(g)) return NextResponse.json({ error: "Guideline limit must be a number" }, { status: 400 });
        guideline_limit = g;
      }
      let sort_order: number | null = null;
      if (nt?.sort_order !== null && nt?.sort_order !== undefined && nt?.sort_order !== "") {
        const so = Number(nt.sort_order);
        if (!Number.isFinite(so)) return NextResponse.json({ error: "Sort order must be a number" }, { status: 400 });
        sort_order = Math.round(so);
      }

      const slug = await uniqueTypeSlug(slugify(name));
      const { data: created, error: typeErr } = await supabaseAdmin
        .from("catalog_measurement_types")
        .insert({ name, slug, kind, unit: nt?.unit?.trim() || null, description: nt?.description?.trim() || null, guideline_limit, sort_order: sort_order ?? 0 })
        .select("id")
        .single();
      if (typeErr || !created) {
        console.error("[admin/catalog/.../measurements POST] type insert failed:", typeErr?.message);
        return NextResponse.json({ error: typeErr?.message || "Failed to create measurement type" }, { status: 500 });
      }
      measurementTypeId = (created as { id: string }).id;
    }

    const { data, error } = await supabaseAdmin
      .from("catalog_product_measurements")
      .insert({ product_id: productId, measurement_type_id: measurementTypeId, value, risk_count })
      .select(MEAS_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This product already has that measurement" }, { status: 409 });
      }
      console.error("[admin/catalog/.../measurements POST] insert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ measurement: flatten(data as unknown as Parameters<typeof flatten>[0]) }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../measurements POST] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to add measurement" }, { status: 500 });
  }
}
