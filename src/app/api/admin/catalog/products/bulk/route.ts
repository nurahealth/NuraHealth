import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { storePackshot } from "@/lib/packshot";
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
export const maxDuration = 300;

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
  measurement_errors?: string[];
  packshot?: string;
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
      normalise_images?: boolean;
      require_packshot?: boolean;
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
    const normaliseImages = body.normalise_images !== false;
    // When set, a product whose photo is not studio product photography is
    // skipped rather than imported. Bulk sources are crowd-sourced, and a
    // catalogue of strangers' phone snapshots is worse than a smaller one.
    const requirePackshot = body.require_packshot === true;

    // ── Preload lookup tables once, rather than per product ──────────────────
    const [{ data: catRows }, { data: typeRows }, { data: prodRows }] = await Promise.all([
      supabaseAdmin.from("catalog_categories").select("id, slug, name"),
      supabaseAdmin.from("catalog_measurement_types").select("id, slug, name, kind, unit, sort_order"),
      supabaseAdmin.from("catalog_products").select("id, slug"),
    ]);

    const catBySlug = new Map<string, string>();
    for (const c of (catRows ?? []) as { id: string; slug: string; name: string }[]) {
      catBySlug.set(c.slug.toLowerCase(), c.id);
      catBySlug.set(c.name.toLowerCase(), c.id);
      catBySlug.set(c.id, c.id);
    }
    // Types are keyed by name AND kind: "Sodium" as a water contaminant (mg/L)
    // and "Sodium" as a food nutrient (mg/100g) are different measurements that
    // must not share a row.
    const typeBySlug = new Map<string, string>();
    const typeByKind = new Map<string, string>();
    const takenTypeSlugs = new Set<string>();
    // Name + kind + unit. "Sodium" in mg/L (water chemistry) and "Sodium" in
    // mg/100g (food nutrition) are the same word for two different readings, so
    // the unit has to be part of the identity or one silently absorbs the other.
    const kindKey = (name: string, kind: string, unit: string) =>
      `${name.trim().toLowerCase()}|${kind}|${unit.trim().toLowerCase()}`;
    let nextSortOrder = 1;
    for (const t of (typeRows ?? []) as {
      id: string;
      slug: string;
      name: string;
      kind: string | null;
      unit: string | null;
      sort_order: number | null;
    }[]) {
      typeBySlug.set(t.slug.toLowerCase(), t.id);
      typeBySlug.set(t.name.toLowerCase(), t.id);
      takenTypeSlugs.add(t.slug.toLowerCase());
      if (t.kind) typeByKind.set(kindKey(t.name, t.kind, t.unit ?? ""), t.id);
      if (typeof t.sort_order === "number" && t.sort_order >= nextSortOrder) {
        nextSortOrder = t.sort_order + 1;
      }
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

      // Normalise the product photo before it is stored. Source imagery arrives
      // in every shape and on every background; without this the catalogue grid
      // is a mix of tight transparent crops, letterboxed landscape shots and
      // brand-tinted backdrops. Failure is non-fatal — the original URL is kept
      // and the row says what went wrong.
      let packshotNote: string | undefined;
      if (!dryRun && normaliseImages && typeof extended.image_url === "string" && extended.image_url) {
        const already = extended.image_url.includes("/catalog-images/");
        if (!already) {
          const shot = await storePackshot(extended.image_url, { requirePackshot });
          if (shot.ok && shot.url) {
            extended = { ...extended, image_url: shot.url };
            if (shot.meta?.keyedTint) packshotNote = `keyed ${shot.meta.keyedTint} backdrop`;
          } else if (requirePackshot && shot.meta && !shot.meta.isPackshot) {
            results.push({ name, status: "skipped", reason: `Image rejected — ${shot.error}` });
            continue;
          } else {
            packshotNote = `image not normalised (${shot.error}) — kept original`;
          }
        }
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
        // Re-importing replaces the measurement set rather than stacking a
        // second copy of every reading on top of the old one.
        if (measIn.length) {
          await supabaseAdmin
            .from("catalog_product_measurements")
            .delete()
            .eq("product_id", existingId);
        }
        if (docsIn.length) {
          await supabaseAdmin
            .from("catalog_product_documents")
            .delete()
            .eq("product_id", existingId)
            .is("storage_path", null); // keep uploaded PDFs, replace link-only rows
        }
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
      const measErrors: string[] = [];
      for (const m of measIn) {
        const typeName = m.type?.trim();
        if (!typeName) continue;
        const kind = (m.kind ?? "contaminant").trim();
        const unit = m.unit?.trim() ?? "";
        // With an explicit kind, only a type of that same kind and unit counts
        // as a match; without one, fall back to a plain name/slug lookup.
        let typeId = m.kind
          ? typeByKind.get(kindKey(typeName, kind, unit))
          : typeBySlug.get(typeName.toLowerCase());

        if (!typeId) {
          if (!VALID_KIND.has(kind)) {
            measErrors.push(`${typeName}: invalid kind "${kind}"`);
            continue;
          }
          // slug, unit and sort_order are NOT NULL in catalog_measurement_types,
          // so every one of them needs a real value here — never null.
          const baseSlug = slugify(typeName) || `type-${Date.now()}`;
          let tSlug = baseSlug;
          if (takenTypeSlugs.has(tSlug)) tSlug = `${baseSlug}-${slugify(unit) || kind}`;
          let n = 2;
          while (takenTypeSlugs.has(tSlug)) tSlug = `${baseSlug}-${slugify(unit) || kind}-${n++}`;
          const so = num(m.sort_order);
          const { data: created, error: tErr } = await supabaseAdmin
            .from("catalog_measurement_types")
            .insert({
              name: typeName,
              slug: tSlug,
              kind,
              unit,
              description: m.description?.trim() || null,
              guideline_limit: num(m.guideline_limit),
              sort_order: so === null ? nextSortOrder++ : Math.round(so),
            })
            .select("id, slug, name")
            .single();
          if (tErr || !created) {
            // A parallel insert may have won the race — try to pick it up.
            const { data: found } = await supabaseAdmin
              .from("catalog_measurement_types")
              .select("id")
              .eq("slug", tSlug)
              .maybeSingle();
            if (found?.id) {
              typeId = (found as { id: string }).id;
              typeBySlug.set(tSlug, typeId);
              takenTypeSlugs.add(tSlug);
              typeByKind.set(kindKey(typeName, kind, unit), typeId);
            } else {
              measErrors.push(`${typeName}: ${tErr?.message ?? "type insert failed"}`);
              continue;
            }
          } else {
            typeId = (created as { id: string }).id;
            typeBySlug.set(tSlug, typeId);
            takenTypeSlugs.add(tSlug);
            typeByKind.set(kindKey(typeName, kind, unit), typeId);
            if (!typeBySlug.has(typeName.toLowerCase())) {
              typeBySlug.set(typeName.toLowerCase(), typeId);
            }
          }
        }

        const { error: mErr } = await supabaseAdmin.from("catalog_product_measurements").insert({
          product_id: productId,
          measurement_type_id: typeId,
          value: num(m.value),
          risk_count: Math.max(0, Math.round(num(m.risk_count) ?? 0)),
        });
        if (!mErr) measCount++;
        else measErrors.push(`${typeName}: ${mErr.message}`);
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
        ...(measErrors.length ? { measurement_errors: measErrors } : {}),
        ...(packshotNote ? { packshot: packshotNote } : {}),
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
