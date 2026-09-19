import { supabaseAdmin } from "./supabase-admin";
import { storePackshot } from "./packshot";
import { buildProductFields, ProductFieldError } from "./catalog-product-fields";

// ── Bulk catalogue import ─────────────────────────────────────────────────────
// The write path behind POST /api/admin/catalog/products/bulk, shared so every
// importer (the admin bulk form, the OFF category feed) creates products,
// measurement types, measurements and documents in exactly the same way.

const VALID_STATUS = new Set(["draft", "published"]);
const VALID_KIND = new Set(["contaminant", "nutrient", "property"]);

export function slugify(name: string): string {
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
export interface InProduct extends Record<string, unknown> {
  name?: string;
  brand?: string;
  category?: string;
  category_id?: string;
  status?: string;
  measurements?: InMeasurement[];
  documents?: InDocument[];
}

export interface RowResult {
  name: string;
  status: "created" | "updated" | "skipped" | "error" | "valid";
  slug?: string;
  measurements?: number;
  documents?: number;
  reason?: string;
  measurement_errors?: string[];
  packshot?: string;
  /** Not studio photography — the stored image is a background-removed cutout of a photo. */
  crowd_photo?: boolean;
}

export interface BulkImportOptions {
  dryRun?: boolean;
  updateExisting?: boolean;
  /** Skip a product whose image can't be made into a clean cutout, rather than import it without one. */
  requirePackshot?: boolean;
  /** Epoch ms after which remaining rows are skipped rather than started. */
  deadline?: number;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function importCatalogProducts(
  items: InProduct[],
  opts: BulkImportOptions = {}
): Promise<{ tally: Record<string, number>; results: RowResult[] }> {
  const dryRun = opts.dryRun === true;
  const updateExisting = opts.updateExisting === true;
  // When set, a product whose photo can't be turned into a clean transparent
  // cutout is skipped. When not, it is imported with no image — never with the
  // raw photo.
  const requirePackshot = opts.requirePackshot === true;

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

    if (opts.deadline && Date.now() > opts.deadline) {
      results.push({ name, status: "skipped", reason: "Time budget reached — not started" });
      continue;
    }

    // Category
    const catKey = (item.category_id ?? item.category ?? "").toString().trim().toLowerCase();
    const categoryId = catBySlug.get(catKey);
    if (!categoryId) {
      results.push({ name, status: "error", reason: `Unknown category "${item.category ?? item.category_id ?? ""}"` });
      continue;
    }

    // Absent status means "leave it alone", not "draft". Defaulting here
    // silently unpublished every product touched by a partial update.
    const statusGiven = item.status !== undefined && item.status !== null && item.status !== "";
    const status = statusGiven ? String(item.status) : "draft";
    if (statusGiven && !VALID_STATUS.has(status)) {
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

    // Every product photo becomes a transparent cutout before it is stored:
    // flat backdrops are keyed away, photos with a real scene behind them go
    // through background removal. A raw photo is never stored — if no clean
    // cutout comes out, the product goes in with no image, or (with
    // requirePackshot) not at all.
    let packshotNote: string | undefined;
    let crowdPhoto = false;
    if (!dryRun && typeof extended.image_url === "string" && extended.image_url) {
      const already = extended.image_url.includes("/catalog-images/");
      if (!already) {
        const shot = await storePackshot(extended.image_url);
        if (shot.ok && shot.url) {
          extended = { ...extended, image_url: shot.url };
          if (shot.meta?.cutout) {
            packshotNote = "background removed";
            crowdPhoto = true;
          } else if (shot.meta?.keyedTint) {
            packshotNote = `keyed ${shot.meta.keyedTint} backdrop`;
          }
        } else if (requirePackshot) {
          results.push({ name, status: "skipped", reason: `Image rejected — ${shot.error}` });
          continue;
        } else if (updateExisting && slugToId.has(slugify(name))) {
          // Updating: leave the product's current image as it is.
          extended = { ...extended };
          delete extended.image_url;
          packshotNote = `no clean cutout (${shot.error}) — existing image left unchanged`;
        } else {
          extended = { ...extended, image_url: null };
          packshotNote = `no clean cutout (${shot.error}) — imported without an image`;
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
          ...(statusGiven ? { status } : {}),
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
      ...(crowdPhoto ? { crowd_photo: true } : {}),
    });
  }

  const tally = results.reduce<Record<string, number>>((a, r) => {
    a[r.status] = (a[r.status] ?? 0) + 1;
    return a;
  }, {});

  return { tally, results };
}
