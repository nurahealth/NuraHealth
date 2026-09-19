import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { importCatalogProducts, type InProduct } from "@/lib/catalog-bulk-import";

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

const MAX_PRODUCTS = 200;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    const body = (await req.json()) as {
      products?: InProduct[];
      dry_run?: boolean;
      update_existing?: boolean;
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

    const { tally, results } = await importCatalogProducts(items, {
      dryRun,
      updateExisting: body.update_existing === true,
      requirePackshot: body.require_packshot === true,
    });

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
