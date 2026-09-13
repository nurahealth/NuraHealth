import { scoreProduct } from "./catalog-scoring";

// ── Open Food Facts → catalogue product ───────────────────────────────────────
// Given one OFF record, build the exact payload the bulk importer accepts:
// scored, with nutrient measurements per 100 g, serving weight, ingredient
// declaration, and a citation back to the source record. The category feed
// and the curated feed both go through here so a product is built the same
// way whichever door it came in by.

const UA = "NuraHealthApp/1.0 (https://nura-health-three.vercel.app)";
export const OFF_FIELDS = [
  "code", "product_name", "brands", "image_front_url", "ingredients_text",
  "additives_tags", "nova_group", "nutriscore_grade", "nutriments",
  "labels_tags", "categories_tags_en", "quantity", "serving_size", "serving_quantity",
].join(",");

export interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  ingredients_text?: string;
  additives_tags?: string[];
  nova_group?: number;
  nutriscore_grade?: string;
  nutriments?: Record<string, number>;
  labels_tags?: string[];
  quantity?: string;
  serving_size?: string;
  serving_quantity?: number | string;
}

/** One product by barcode — exact, no guessing. */
export async function fetchOffByBarcode(code: string): Promise<OffProduct | null> {
  const clean = code.replace(/[^0-9]/g, "");
  if (!clean) return null;
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${clean}?fields=${OFF_FIELDS}`,
      { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(15000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { status?: number; product?: OffProduct };
    return j.status === 1 && j.product ? j.product : null;
  } catch {
    return null;
  }
}

export interface BuildOptions {
  category: string;
  status: "draft" | "published";
  /** Curated overrides — the brand's own name, image and (if known) serving. */
  brand?: string | null;
  name?: string | null;
  imageUrl?: string | null;
  servingGrams?: number | null;
  extraDocuments?: { title: string; doc_type: string; year: number; source_url: string }[];
}

export function servingGramsOf(p: OffProduct): number | null {
  const qty = Number(p.serving_quantity);
  if (Number.isFinite(qty) && qty > 0) return qty;
  const fromText = p.serving_size ? Number((p.serving_size.match(/([\d.]+)\s*g/) ?? [])[1]) : NaN;
  return Number.isFinite(fromText) && fromText > 0 ? fromText : null;
}

export function buildProductFromOff(p: OffProduct, o: BuildOptions): Record<string, unknown> | null {
  const name = (o.name ?? p.product_name)?.trim();
  if (!name) return null;
  const brand = (o.brand ?? p.brands?.split(",")[0])?.trim() || null;
  const ingredients = p.ingredients_text?.trim() || null;
  const servingGrams = o.servingGrams ?? servingGramsOf(p);

  const n = p.nutriments ?? {};
  const organic = (p.labels_tags ?? []).some((l) => /organic|bio/i.test(l));
  const scored = scoreProduct({
    nova: p.nova_group ?? null,
    additivesCount: p.additives_tags?.length ?? null,
    sugars100g: n["sugars_100g"] ?? null,
    sodium100g: n["sodium_100g"] ?? null,
    satFat100g: n["saturated-fat_100g"] ?? null,
    organic,
  });

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

  const documents = [
    ...(p.code
      ? [{
          title: `Open Food Facts record${brand ? ` — ${brand}` : ""}`,
          doc_type: "database",
          year: new Date().getFullYear(),
          source_url: `https://world.openfoodfacts.org/product/${p.code}`,
        }]
      : []),
    ...(o.extraDocuments ?? []),
  ];

  return {
    name: name.slice(0, 120),
    brand,
    category: o.category,
    status: o.status,
    image_url: o.imageUrl ?? p.image_front_url?.trim() ?? null,
    score: scored.score,
    score_label: scored.label,
    score_rationale: scored.rationale,
    lab_tested: false,
    properties: {
      ...(servingGrams ? { "Serving size": `${servingGrams} g` } : {}),
      ...(p.quantity ? { "Package size": p.quantity } : {}),
      ...(p.code ? { "Barcode": p.code } : {}),
    },
    description: ingredients ? `Ingredients: ${ingredients}`.slice(0, 1200) : null,
    measurements,
    documents,
  };
}
