import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { scoreProduct } from "@/lib/catalog-scoring";

// Pull real products from Open Food Facts and map them into the shape the bulk
// importer expects — name, brand, image, a NŪRA clean-food score with its
// reasoning, nutrient measurements, and a citation back to the source record.
//
// Open Food Facts is an open database (ODbL) built for reuse, so this is a
// legitimate way to seed thousands of products without hand research.

export const runtime = "nodejs";
export const maxDuration = 60;

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

function titleCase(s: string): string {
  return s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
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
    };

    const offCategory = body.off_category?.trim();
    const category = body.category?.trim();
    if (!offCategory) return NextResponse.json({ error: "off_category is required" }, { status: 400 });
    if (!category) return NextResponse.json({ error: "category (NŪRA category) is required" }, { status: 400 });

    const limit = Math.min(Math.max(body.limit ?? 25, 1), 200);
    const status = body.status === "published" ? "published" : "draft";
    const requireComplete = body.require_complete !== false;

    // Over-fetch, because many OFF records are missing an image or ingredients.
    const pageSize = Math.min(limit * 4, 300);
    const params = new URLSearchParams({
      categories_tags_en: offCategory,
      fields: FIELDS,
      page_size: String(pageSize),
    });
    if (body.country?.trim()) params.set("countries_tags_en", body.country.trim());

    // Open Food Facts 503s intermittently under load, so retry with backoff
    // rather than failing an otherwise good import.
    let raw: { products?: OffProduct[]; count?: number } | null = null;
    let lastStatus = 0;
    for (let attempt = 0; attempt < 4 && !raw; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * attempt));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000);
      try {
        const res = await fetch(`${OFF_SEARCH}?${params.toString()}`, {
          headers: { "User-Agent": UA, Accept: "application/json" },
          signal: controller.signal,
          cache: "no-store",
        });
        lastStatus = res.status;
        if (res.ok) raw = (await res.json()) as { products?: OffProduct[]; count?: number };
      } catch {
        lastStatus = 0;
      } finally {
        clearTimeout(timer);
      }
    }
    if (!raw) {
      return NextResponse.json(
        { error: `Open Food Facts is busy right now (${lastStatus || "no response"}) — try again in a moment.` },
        { status: 502 }
      );
    }

    const products: Record<string, unknown>[] = [];
    let skipped = 0;

    for (const p of raw.products ?? []) {
      if (products.length >= limit) break;

      const name = p.product_name?.trim();
      const brand = p.brands?.split(",")[0]?.trim() || null;
      const image = p.image_front_url?.trim() || null;
      const ingredients = p.ingredients_text?.trim() || null;

      if (!name) { skipped++; continue; }
      if (requireComplete && (!brand || !image || !ingredients)) { skipped++; continue; }

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

      products.push({
        name: titleCase(name).slice(0, 120),
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
      });
    }

    return NextResponse.json({
      source: "Open Food Facts",
      off_category: offCategory,
      available: raw.count ?? null,
      returned: products.length,
      skipped_incomplete: skipped,
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
