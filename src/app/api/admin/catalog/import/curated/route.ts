import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { fetchOffByBarcode, buildProductFromOff } from "@/lib/off-product";

export const runtime = "nodejs";
export const maxDuration = 300;

// Curated import: a hand-picked list of products, each with its barcode and
// the brand's own packshot. Label data — nutrition, ingredients, additives,
// NOVA — comes from the Open Food Facts record for that exact barcode, so the
// numbers are the manufacturer's declaration, not anyone's guess. A product
// whose barcode has no record is reported, not invented.
//
// POST { category, status?, items: [{ brand, name, barcode, image_url, source_page? }] }

interface Item {
  brand: string;
  name: string;
  barcode: string;
  image_url: string;
  source_page?: string;
  serving_grams?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const body = (await req.json()) as { category?: string; status?: string; items?: Item[] };
    const category = body.category?.trim();
    if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });
    const status = body.status === "draft" ? "draft" : "published";
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return NextResponse.json({ error: "items is empty" }, { status: 400 });

    const products: Record<string, unknown>[] = [];
    const missing: { brand: string; name: string; barcode: string; reason: string }[] = [];

    for (const it of items) {
      if (!it.barcode || !it.image_url) {
        missing.push({ brand: it.brand, name: it.name, barcode: it.barcode ?? "", reason: "no barcode or image" });
        continue;
      }
      const off = await fetchOffByBarcode(it.barcode);
      if (!off) {
        missing.push({ brand: it.brand, name: it.name, barcode: it.barcode, reason: "no Open Food Facts record for this barcode" });
        continue;
      }
      // Nutrition is the point. A record with no nutrient data cannot be scored
      // honestly, so it does not go in.
      const n = off.nutriments ?? {};
      const hasNutrition = ["sugars_100g", "proteins_100g", "sodium_100g"].some((k) => typeof n[k] === "number");
      if (!hasNutrition) {
        missing.push({ brand: it.brand, name: it.name, barcode: it.barcode, reason: "record has no nutrition facts" });
        continue;
      }
      const built = buildProductFromOff(off, {
        category,
        status,
        brand: it.brand,
        name: it.name,
        imageUrl: it.image_url,
        servingGrams: it.serving_grams ?? null,
        extraDocuments: it.source_page
          ? [{ title: `${it.brand} product page`, doc_type: "brand", year: new Date().getFullYear(), source_url: it.source_page }]
          : [],
      });
      if (built) products.push(built);
      await new Promise((r) => setTimeout(r, 150));
    }

    return NextResponse.json({ requested: items.length, built: products.length, missing, products });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed" }, { status: 500 });
  }
}
