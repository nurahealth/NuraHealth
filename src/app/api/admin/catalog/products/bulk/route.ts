import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { buildProductFields, ProductFieldError } from "@/lib/catalog-product-fields";

// Bulk import for the lab catalogue.
//
// Creates many products in one request, each with its measurements and its
// source documents, so a whole category can be seeded without filling in the
// admin form one product at a time.
//
// POST body:
// {
//   "dry_run": true,                  // validate only, write nothing
//   "update_existing": false,         // update a product if its slug already exists
//   "products": [{
//      "name": "...", "brand": "...",
//      "category": "baby-food",       // category slug, id, or exact name
//      "status": "draft" | "published",
//      "score": 0-100, "score_label": "...", "score_rationale": "...",
//      "lab_tested": true, "microplastics_present": false,
//      "image_url": "...", "shop_url": "...",
//      "measurements": [
//        { "type": "lead", "kind": "contaminant", "unit": "ppb",
//          "description": "...", "guideline_limit": 5,
//          "value": 12.3, "risk_count": 1 }
//      ],
//      "documents": [
//        { "title": "...", "doc_type": "study", "year": 2021, "source_url": "https://..." }
//      ]
//   }]
// }

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_STATUS = new Set(["draft", "published"]);
const VALID_KIND = new Set(["contaminant", "nutrient", "property"]);
const MAX_PRODUCTS = 200;

function slugify(name: string): string {
  return (
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item"
  );
}

interface InMeasurement {
  type?: string;
  kind?: string;
  unit?: string;
  description?: string;
  guideline_limit?: number | string | null;
  sort_order?: number | string | null;
  value?: number | string | null;
  risk_count?: number | string | null;
}
interface InDocument {
  title?: string;
  doc_type?: string;
  year?: number | string | null;
  source_url?: string;
}
interface InProduct extends Record<string, unknown> {
  name?: string;
  brand?: string;
  category?: string;
  category_id?: string;
  status?: string;
  measurements?: InMeasurement[];
  documents?: InDocument[];
}

interface RowResult {
  name: string;
  status: "created" | "updated" | "skipped" | "error" | "valid";
  slug?: string;
  measurements?: number;
  documents?: number;
  reason?: string;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    const body = (await req.json()) as {
      products?: InProduct[];
      dry_run?: boolean;
      update_existing?: boolean;
    };

    const items = body.products;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Provide a non-empty `products` array" }, { status: 400 });
    }
    if (items.length > MAX_PRODUCTS) {
      return NextResponse.json({ error: `Too many products — max ${MAX_PRODUCTS} per request` }, { status: 400 });
    }
    const dryRun = body.dry_run === true;
    const updateExisting = body.update_existing === true;

    // ── Preload lookup tables once, rather than per product ──────────────────
    const [{ data: catRows }, { data: typeRows }, { data: prodRows }] = await Promise.all([
      supabaseAdmin.from("catalog_categories").select("id, slug, name"),
      supabaseAdmin.from("catalog_measurement_types").select("id, slug, name"),
      supabaseAdmin.from("catalog_products").select("id, slug"),
    ]);

    const catBySlug = new Map<string, string>();
    for (const c of (catRows ?? []) as { id: string; slug: string; name: string }[]) {
      catBySlug.set(c.slug.toLowerCase(), c.id);
      catBySlug.set(c.name.toLowerCase(), c.id);
      catBySlug.set(c.id, c.id);
    }
    const typeBySlug = new Map<string, string>();
    for (const t of (typeRows ?? []) as { id: string; slug: string; name: string }[]) {
      typeBySlug.set(t.slug.toLowerCase(), t.id);
      typeBySlug.set(t.name.toLowerCase(), t.id);
    }
    const takenSlugs = new Set((prodRows ?? []).map((r) => (r as { slug: string }).slug));
    const slugToId = new Map<string, string>();
    for (const r of (prodRows ?? []) as { id: string; slug: string }[]) slugToId.set(r.slug, r.id);

    function pickSlug(base: string): string {
      if (!takenSlugs.has(base)) return base;
      let n = 2;
      while (takenSlugs.has(`${base}-${n}`)) n++;
      return `${base}-${n}`;
    }

    const results: RowResult[] = [];

    for (const item of items) {
      const name = item.name?.trim();
      if (!name) {
        results.push({ name: "(unnamed)", status: "error", reason: "Name is required" });
        continue;
      }

      // Category
      const catKey = (item.category_id ?? item.category ?? "").toString().trim().toLowerCase();
      const categoryId = catBySlug.get(catKey);
      if (!categoryId) {
        results.push({ name, status: "error", reason: `Unknown category "${item.category ?? item.category_id ?? ""}"` });
        continue;
      }

      const status = (item.status ?? "draft").toString();
      if (!VALID_STATUS.has(status)) {
        results.push({ name, status: "error", reason: `Invalid status "${status}"` });
        continue;
      }

      let extended: Record<string, unknown>;
      try {
        extended = buildProductFields(item);
      } catch (e) {
        results.push({ name, status: "error", reason: e instanceof ProductFieldError ? e.message : "Bad field" });
        continue;
      }

      const base = slugify(name);
      const existingId = slugToId.get(base);
      const measIn = Array.isArray(item.measurements) ? item.measurements : [];
      const docsIn = Array.isArray(item.documents) ? item.documents : [];

      if (dryRun) {
        results.push({
          name,
          status: "valid",
          slug: existingId && !updateExisting ? base : pickSlug(base),
          measurements: measIn.length,
          documents: docsIn.length,
          reason: existingId ? (updateExisting ? "exists → would update" : "exists → would skip") : undefined,
        });
        continue;
      }

      if (existingId && !updateExisting) {
        results.push({ name, status: "skipped", slug: base, reason: "A product with this slug already exists" });
        continue;
      }

      // ── Upsert the product ────────────────────────────────────────────────
      let productId: string;
      if (existingId && updateExisting) {
        const { error } = await supabaseAdmin
          .from("catalog_products")
          .update({
            name,
            brand: item.brand?.trim() || null,
            category_id: categoryId,
            status,
            ...extended,
          })
          .eq("id", existingId);
        if (error) {
          results.push({ name, status: "error", reason: error.message });
          continue;
        }
        productId = existingId;
      } else {
        const slug = pickSlug(base);
        const { data, error } = await supabaseAdmin
          .from("catalog_products")
          .insert({
            name,
            slug,
            brand: item.brand?.trim() || null,
            category_id: categoryId,
            status,
            source_urls: [],
            attributes: {},
            ...extended,
          })
          .select("id, slug")
          .single();
        if (error || !data) {
          results.push({ name, status: "error", reason: error?.message ?? "Insert failed" });
          continue;
        }
        productId = (data as { id: string }).id;
        takenSlugs.add((data as { slug: string }).slug);
        slugToId.set((data as { slug: string }).slug, productId);
      }

      // ── Measurements ──────────────────────────────────────────────────────
      let measCount = 0;
      for (const m of measIn) {
        const typeName = m.type?.trim();
        if (!typeName) continue;
        let typeId = typeBySlug.get(typeName.toLowerCase());

        if (!typeId) {
          const kind = (m.kind ?? "contaminant").trim();
          if (!VALID_KIND.has(kind)) continue;
          const tSlug = slugify(typeName);
          const { data: created, error: tErr } = await supabaseAdmin
            .from("catalog_measurement_types")
            .insert({
              name: typeName,
              slug: tSlug,
              kind,
              unit: m.unit?.trim() || null,
              description: m.description?.trim() || null,
              guideline_limit: num(m.guideline_limit),
              sort_order: num(m.sort_order),
            })
            .select("id, slug, name")
            .single();
          if (tErr || !created) continue;
          typeId = (created as { id: string }).id;
          typeBySlug.set(tSlug, typeId);
          typeBySlug.set(typeName.toLowerCase(), typeId);
        }

        const { error: mErr } = await supabaseAdmin.from("catalog_product_measurements").insert({
          product_id: productId,
          measurement_type_id: typeId,
          value: num(m.value),
          risk_count: Math.max(0, Math.round(num(m.risk_count) ?? 0)),
        });
        if (!mErr) measCount++;
      }

      // ── Source documents (links only — files go through the single-product UI) ──
      let docCount = 0;
      for (let i = 0; i < docsIn.length; i++) {
        const d = docsIn[i];
        const url = d.source_url?.trim();
        if (!url) continue;
        const year = num(d.year);
        const { error: dErr } = await supabaseAdmin.from("catalog_product_documents").insert({
          product_id: productId,
          title: d.title?.trim() || url,
          doc_type: d.doc_type?.trim() || null,
          year: year === null ? null : Math.round(year),
          source_url: url,
          storage_path: null,
          sort_order: i,
        });
        if (!dErr) docCount++;
      }

      results.push({
        name,
        status: existingId && updateExisting ? "updated" : "created",
        measurements: measCount,
        documents: docCount,
      });
    }

    const tally = results.reduce<Record<string, number>>((a, r) => {
      a[r.status] = (a[r.status] ?? 0) + 1;
      return a;
    }, {});

    return NextResponse.json({ dry_run: dryRun, tally, results });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products/bulk] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk import failed" },
      { status: 500 }
    );
  }
}
