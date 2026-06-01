import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

const TYPE_SELECT = "id, name, slug, kind, unit, description, guideline_limit, sort_order";
const MEAS_SELECT = `id, value, risk_count, measurement_type_id, catalog_measurement_types(${TYPE_SELECT})`;

interface RawType {
  id: string; name: string; slug: string; kind: string | null; unit: string | null;
  description: string | null; guideline_limit: number | null; sort_order: number | null;
}
function flatten(r: {
  id: string; value: number | null; risk_count: number | null; measurement_type_id: string;
  catalog_measurement_types: RawType | RawType[] | null;
}) {
  const t = Array.isArray(r.catalog_measurement_types) ? r.catalog_measurement_types[0] : r.catalog_measurement_types;
  return { id: r.id, value: r.value, risk_count: r.risk_count, measurement_type_id: r.measurement_type_id, type: t ?? null };
}

// ── PATCH: edit a measurement's per-product value / risk count ────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; measurementId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId, measurementId } = await params;

    const body = (await req.json()) as { value?: number | string | null; risk_count?: number | string | null };

    const { data: existing } = await supabaseAdmin
      .from("catalog_product_measurements")
      .select("id, product_id")
      .eq("id", measurementId)
      .maybeSingle();
    const row = existing as { id: string; product_id: string } | null;
    if (!row || row.product_id !== productId) {
      return NextResponse.json({ error: "Measurement not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};
    if ("value" in body) {
      if (body.value === null || body.value === "") update.value = null;
      else {
        const n = Number(body.value);
        if (!Number.isFinite(n)) return NextResponse.json({ error: "Value must be a number" }, { status: 400 });
        update.value = n;
      }
    }
    if ("risk_count" in body) {
      if (body.risk_count === null || body.risk_count === "") update.risk_count = 0;
      else {
        const n = Number(body.risk_count);
        if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "Risk count must be 0 or more" }, { status: 400 });
        update.risk_count = Math.round(n);
      }
    }

    if (Object.keys(update).length === 0) {
      const { data } = await supabaseAdmin.from("catalog_product_measurements").select(MEAS_SELECT).eq("id", measurementId).single();
      return NextResponse.json({ measurement: flatten(data as unknown as Parameters<typeof flatten>[0]) });
    }

    const { data, error } = await supabaseAdmin
      .from("catalog_product_measurements")
      .update(update)
      .eq("id", measurementId)
      .select(MEAS_SELECT)
      .single();

    if (error) {
      console.error("[admin/catalog/.../measurements PATCH] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ measurement: flatten(data as unknown as Parameters<typeof flatten>[0]) });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../measurements PATCH] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to update measurement" }, { status: 500 });
  }
}

// ── DELETE: remove a measurement (the shared type catalogue row is left alone) ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; measurementId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId, measurementId } = await params;

    const { data: existing } = await supabaseAdmin
      .from("catalog_product_measurements")
      .select("id, product_id")
      .eq("id", measurementId)
      .maybeSingle();
    const row = existing as { id: string; product_id: string } | null;
    if (!row || row.product_id !== productId) {
      return NextResponse.json({ error: "Measurement not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from("catalog_product_measurements").delete().eq("id", measurementId);
    if (error) {
      console.error("[admin/catalog/.../measurements DELETE] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, deletedId: measurementId });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../measurements DELETE] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to delete measurement" }, { status: 500 });
  }
}
