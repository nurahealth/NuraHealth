import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { scoreProduct } from "@/lib/catalog-scoring";
import { resolveBrandPackshot, resetPackshotCache } from "@/lib/brand-packshot";

// Pull real products from Open Food Facts and map them into the shape the bulk
// importer expects — name, brand, image, a NŪRA clean-food score with its
// reasoning, nutrient measurements, and a citation back to the source record.
//
// Open Food Facts is an open database (ODbL) built for reuse, so this is a
// legitimate way to seed thousands of products without hand research.

export const runtime = "nodejs";
export const maxDuration = 300;

const OFF_SEARCH = "https://world.openfoodfacts.org/api/v2/search";
const UA = "NuraHealthApp/1.0 (https://nura-health-three.vercel.app)";
const FIELDS = [
  "code", "product_name", "brands", "image_front_url", "ingredients_text",
  "additives_tags", "nova_group", "nutriscore_grade", "nutriments",
  "labels_tags", "categories_tags_en", "quantity",
].join(",");

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  ingredients_text?: string;
  additives_tags?: string[];
  nova_group?: number;
  nutriscore_grade?: string;
  labels_tags?: string[];
  quantity?: string;
  nutriments?: Record<string, number | undefined>;
}

// OFF names arrive in wildly mixed casing ("OH OH COOKIE DOUGH", "gomacro").
// Title-case anything that is mostly caps, and leave good casing alone.
function tidyCase(raw: string): string {
  const s = raw.replace(/\s+/g, " ").trim();
  const letters = s.replace(/[^A-Za-z]/g, "");
  const upperRatio = letters ? letters.replace(/[^A-Z]/g, "").length / letters.length : 0;
  if (upperRatio < 0.7) return s;
  return s
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\b(And|Or|The|With|A|Of|In)\b/g, (m) => m.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());
}

// A brand key that collapses "RXBAR" / "Rxbar" / "rx bar" onto one identity.
function brandKey(b: string): string {
  return b.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Brands write themselves inconsistently in the source data; map the common
// ones onto the spelling the brand itself uses.
const BRAND_CANON: Record<string, string> = {
  gomacro: "GoMacro", gomacromacrobar: "GoMacro", macrobar: "GoMacro",
  rxbar: "RXBAR", rx: "RXBAR",
  iqbar: "IQ Bar",
  clif: "Clif", clifbar: "Clif", clifbuilders: "Clif",
  kind: "KIND", kindsnacks: "KIND",
  perfectbar: "Perfect Bar", perfectsnacks: "Perfect Bar",
  larabar: "Larabar",
  aloha: "ALOHA",
  kirklandsignature: "Kirkland Signature",
  goodgather: "Good & Gather",
  quest: "Quest", questnutrition: "Quest",
  trubar: "TRUBAR",
  simplyprotein: "SimplyProtein",
  misfits: "Misfits",
  thinkthin: "think!", think: "think!",
  builtbar: "Built Bar",
  barebells: "Barebells",
  onebrands: "ONE", one: "ONE",
};

function canonBrand(b: string): string {
  const k = brandKey(b);
  if (BRAND_CANON[k]) return BRAND_CANON[k];
  // Otherwise title-case it for consistency.
  return b
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

const SMALL_WORDS = /^(and|or|the|with|a|an|of|in|on|to|for|de|w)$/;

// Product names arrive in every casing; normalise to Title Case so the
// catalogue reads consistently.
function tidyName(raw: string, brand: string | null): string {
  let s = raw.replace(/\s+/g, " ").trim();
  // Drop a leading brand repeat: "Larabar Larabar Peanut Butter" → "Peanut Butter"
  if (brand) {
    const bk = brandKey(brand);
    const re = new RegExp(`^(?:${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|${bk})\\s+`, "i");
    const stripped = s.replace(re, "").trim();
    if (stripped.length >= 3) s = stripped;
  }
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.test(w) ? w : w.replace(/^[a-z]/, (c) => c.toUpperCase())))
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());
}

// Multipacks and variety boxes aren't a single bar-and-flavour, which is what
// the catalogue is meant to show.
const MULTIPACK = /(variety|multi[\s-]?pack|assort|sampler|\b\d{1,2}\s*(?:count|ct|pack|pk|bars?|boxes?)\b|\bbox of\b|\bcase\b)/i;

// Entries with no flavour at all ("Protein Bar", "Protein Bars", "Clean").
function lacksFlavour(name: string, brand: string | null): string | false {
  const stripped = name
    .toLowerCase()
    .replace(brand ? new RegExp(brand.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g") : /$^/, " ")
    .replace(/\b(protein|bar|bars|snack|nutrition|organic|plant[\s-]?based|gluten[\s-]?free)\b/g, " ")
    .replace(/[^a-z]/g, "");
  return stripped.length < 3 ? "no flavour in name" : false;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    const body = (await req.json()) as {
      off_category?: string;
      category?: string;
      limit?: number;
      country?: string;
      status?: string;
      require_complete?: boolean;
      resolve_images?: boolean;
    };

    const offCategory = body.off_category?.trim();
    const category = body.category?.trim();
    if (!offCategory) return NextResponse.json({ error: "off_category is required" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "category (NŪRA category) is required" }, { status: 400 });

    const limit = Math.min(Math.max(body.limit ?? 25, 1), 200);
    const status = body.status === "published" ? "published" : "draft";
    const requireComplete = body.require_complete !== false;
    const resolveImages = body.resolve_images !== false;

    // Open Food Facts struggles with large single pages, so walk several small
    // pages instead. Each page is retried with backoff before we give up.
    const PAGE = 50;
    const poolTarget = Math.min(Math.max(limit * 10, 80), 250);
    const pages = Math.ceil(poolTarget / PAGE);

    let totalAvailable: number | null = null;

    async function fetchPage(page: number): Promise<OffProduct[] | null> {
      const params = new URLSearchParams({
        categories_tags_en: offCategory!,
        fields: FIELDS,
        page_size: String(PAGE),
        page: String(page),
      });
      if (body.country?.trim()) params.set("countries_tags_en", body.country.trim());

      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 600 * attempt));
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);
        try {
          const res = await fetch(`${OFF_SEARCH}?${params.toString()}`, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: controller.signal,
            cache: "no-store",
          });
          if (res.ok) {
            const j = (await res.json()) as { products?: OffProduct[]; count?: number };
            if (page === 1) totalAvailable = j.count ?? null;
            return j.products ?? [];
          }
        } catch {
          /* retry */
        } finally {
          clearTimeout(timer);
        }
      }
      return null;
    }

    const pool: OffProduct[] = [];
    let pageFailures = 0;
    for (let page = 1; page <= pages; page++) {
      const got = await fetchPage(page);
      if (got === null) { pageFailures++; continue; }
      pool.push(...got);
      if (got.length < PAGE) break;
      if (page < pages) await new Promise((r) => setTimeout(r, 250));
    }

    if (pool.length === 0) {
      return NextResponse.json(
        { error: "Open Food Facts is busy right now — try again in a moment." },
        { status: 502 }
      );
    }


    const scoredAll: { payload: Record<string, unknown>; score: number; key: string }[] = [];
    let skipped = 0;

    for (const p of pool) {
      const rawName = p.product_name?.trim();
      const rawBrand = p.brands?.split(",")[0]?.trim() || null;
      const brand = rawBrand ? canonBrand(rawBrand) : null;
      const name = rawName ? tidyName(rawName, brand) : undefined;
      const image = p.image_front_url?.trim() || null;
      const ingredients = p.ingredients_text?.trim() || null;

      if (!name) { skipped++; continue; }
      if (requireComplete && (!brand || !image || !ingredients)) { skipped++; continue; }
      if (MULTIPACK.test(name)) { skipped++; continue; }
      if (lacksFlavour(name, brand)) { skipped++; continue; }

      const n = p.nutriments ?? {};
      const labels = p.labels_tags ?? [];
      const organic = labels.some((l) => /organic|bio/i.test(l));

      const scored = scoreProduct({
        nova: p.nova_group ?? null,
        additivesCount: p.additives_tags?.length ?? null,
        sugars100g: n["sugars_100g"] ?? null,
        sodium100g: n["sodium_100g"] ?? null,
        satFat100g: n["saturated-fat_100g"] ?? null,
        organic,
      });

      // Nutrient measurements worth surfacing on the product page.
      const measurements: Record<string, unknown>[] = [];
      const addNutrient = (type: string, unit: string, value: number | undefined) => {
        if (typeof value === "number" && Number.isFinite(value)) {
          measurements.push({ type, kind: "nutrient", unit, value: Math.round(value * 100) / 100 });
        }
      };
      addNutrient("Protein", "g/100g", n["proteins_100g"]);
      addNutrient("Sugars", "g/100g", n["sugars_100g"]);
      addNutrient("Fiber", "g/100g", n["fiber_100g"]);
      addNutrient("Saturated fat", "g/100g", n["saturated-fat_100g"]);
      if (typeof n["sodium_100g"] === "number") {
        measurements.push({ type: "Sodium", kind: "nutrient", unit: "mg/100g", value: Math.round(n["sodium_100g"] * 1000) });
      }
      if (typeof p.nova_group === "number") {
        measurements.push({
          type: "Processing level (NOVA)", kind: "property", unit: "1–4",
          description: "NOVA food-processing classification: 1 is unprocessed, 4 is ultra-processed.",
          value: p.nova_group,
        });
      }
      if (p.additives_tags) {
        measurements.push({
          type: "Declared additives", kind: "property", unit: "count",
          description: "Number of additives declared on the product label.",
          value: p.additives_tags.length,
          risk_count: p.additives_tags.length,
        });
      }

      const documents = p.code
        ? [{
            title: `Open Food Facts record${brand ? ` — ${brand}` : ""}`,
            doc_type: "database",
            year: new Date().getFullYear(),
            source_url: `https://world.openfoodfacts.org/product/${p.code}`,
          }]
        : [];

      scoredAll.push({
        score: scored.score,
        key: `${brandKey(brand ?? "")}|${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        payload: {
          name: name.slice(0, 120),
          brand,
          category,
          status,
          image_url: image,
          score: scored.score,
          score_label: scored.label,
          score_rationale: scored.rationale,
          lab_tested: false,
          description: ingredients ? `Ingredients: ${ingredients}`.slice(0, 1200) : null,
          measurements,
          documents,
        },
      });
    }

    // Highest-scoring first, de-duplicated on brand + product name.
    // Deterministic ranking: score first, then a stable key, so the same
    // request returns the same twenty bars every time rather than reshuffling
    // ties and creating near-duplicate products on a re-import.
    scoredAll.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
    const seenKeys = new Set<string>();
    const shortlist: typeof scoredAll = [];
    for (const row of scoredAll) {
      if (seenKeys.has(row.key)) continue;
      seenKeys.add(row.key);
      shortlist.push(row);
      // Over-fetch: a product whose official packshot cannot be found is
      // dropped below, so the shortlist has to be deeper than the quota.
      if (shortlist.length >= limit * 4) break;
    }

    // ── Swap in the brand's own product photography ────────────────────────
    // Open Food Facts images are shoppers' snapshots and fail the packshot
    // gate on import, so a product kept with its OFF image would simply be
    // skipped later. Resolve the brand's own image instead, and drop what
    // cannot be resolved rather than shipping a bad photo.
    resetPackshotCache();
    const products: Record<string, unknown>[] = [];
    let unresolved = 0;
    const resolvedFrom: Record<string, number> = {};

    for (const row of shortlist) {
      if (products.length >= limit) break;
      const payload = row.payload as Record<string, unknown>;
      const brand = typeof payload.brand === "string" ? payload.brand : null;
      const name = typeof payload.name === "string" ? payload.name : "";

      if (!resolveImages) {
        products.push(payload);
        continue;
      }

      const shot = await resolveBrandPackshot(brand, name);
      if (!shot) {
        unresolved++;
        continue;
      }
      resolvedFrom[shot.domain] = (resolvedFrom[shot.domain] ?? 0) + 1;
      const docs = Array.isArray(payload.documents) ? [...(payload.documents as unknown[])] : [];
      docs.push({
        title: `${brand ?? "Brand"} product page`,
        doc_type: "brand",
        year: new Date().getFullYear(),
        source_url: shot.sourcePage,
      });
      products.push({ ...payload, image_url: shot.imageUrl, documents: docs });
    }

    return NextResponse.json({
      source: "Open Food Facts",
      off_category: offCategory,
      available: totalAvailable,
      pool_fetched: pool.length,
      pool_scored: scoredAll.length,
      page_failures: pageFailures,
      returned: products.length,
      skipped_incomplete: skipped,
      shortlisted: shortlist.length,
      unresolved_packshots: unresolved,
      resolved_from: resolvedFrom,
      products,
    });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/import/openfoodfacts] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
