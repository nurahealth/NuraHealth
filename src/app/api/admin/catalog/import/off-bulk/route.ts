import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildProductFromOff, type OffProduct } from "@/lib/off-product";
import { importCatalogProducts, slugify, type InProduct } from "@/lib/catalog-bulk-import";

// Long-tail category fill from Open Food Facts.
//
// Pulls the most-scanned US products for a set of OFF category tags, builds
// each one through the same OFF → catalogue mapping the curated feed uses, and
// writes them through the same importer as products/bulk. Unlike the curated
// feed, crowd photos are accepted: the importer cuts the product out of the
// photo, and a product whose photo won't cut out cleanly goes in without an
// image. Hand-verified packshots stay the standard for the top of each
// category; this route fills in behind them.
//
// POST { category, off_tags: string[], max?: number (default 100, cap 200), page?: number }
// See src/lib/off-category-map.ts for sensible off_tags per category.

export const runtime = "nodejs";
export const maxDuration = 300;

const OFF_SEARCH = "https://world.openfoodfacts.org/api/v2/search";
const UA = "NuraHealthApp/1.0 (https://nura-health-three.vercel.app)";
const FIELDS = [
  "code", "product_name", "brands", "image_front_url", "nutriments", "ingredients_text", "lang", "countries_tags",
  "nova_group", "quantity", "serving_size", "labels_tags", "additives_tags",
].join(",");
const PAGE_SIZE = 100;
// Pages walked per request at most. Sequential, with a pause between each, to
// stay well inside OFF's search rate guidance.
const MAX_PAGES = 5;
const PAGE_PAUSE_MS = 1500;
// Leave headroom under maxDuration so the response always gets written.
const TIME_BUDGET_MS = 270_000;

async function fetchSearchPage(tags: string[], page: number): Promise<OffProduct[] | null> {
  const params = new URLSearchParams({
    // "|" is OR in OFF tag filters; "," would be AND.
    categories_tags: tags.join("|"),
    countries_tags: "en:united-states",
    sort_by: "unique_scans_n",
    page_size: String(PAGE_SIZE),
    page: String(page),
    fields: FIELDS,
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt));
    try {
      const res = await fetch(`${OFF_SEARCH}?${params.toString()}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      });
      if (res.ok) {
        const j = (await res.json()) as { products?: OffProduct[] };
        return j.products ?? [];
      }
    } catch {
      /* retry */
    }
  }
  return null;
}

function hasNutrition(p: OffProduct): boolean {
  const n = p.nutriments ?? {};
  return ["sugars_100g", "proteins_100g", "sodium_100g"].some(
    (k) => typeof n[k] === "number" && Number.isFinite(n[k])
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const started = Date.now();
  try {
    await requireAdminFromRequest(req);

    const body = (await req.json()) as {
      category?: string;
      off_tags?: string[];
      max?: number;
      page?: number;
    };
    const category = body.category?.trim();
    if (category === "meat-seafood") {
      return NextResponse.json({ error: "meat-seafood is excluded from bulk imports — it is hand-curated on the source rubric" }, { status: 400 });
    }
    if (!category) return NextResponse.json({ error: "category is required" }, { status: 400 });
    const offTags = (Array.isArray(body.off_tags) ? body.off_tags : [])
      .map((t) => String(t).trim())
      .filter(Boolean);
    if (!offTags.length) return NextResponse.json({ error: "off_tags must be a non-empty array" }, { status: 400 });
    const max = Math.min(Math.max(Math.floor(Number(body.max ?? 100)) || 100, 1), 200);
    const firstPage = Math.max(Math.floor(Number(body.page ?? 1)) || 1, 1);

    // Existing slugs, loaded once — a product already in the catalogue is
    // skipped before any image work is spent on it. Paged, because a plain
    // select stops at the API's 1,000-row cap and this route grows past it.
    const existing = new Set<string>();
    for (let from = 0; ; from += 1000) {
      const { data, error } = await supabaseAdmin
        .from("catalog_products")
        .select("slug")
        .order("slug")
        .range(from, from + 999);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      for (const r of (data ?? []) as { slug: string }[]) existing.add(r.slug);
      if (!data || data.length < 1000) break;
    }

    let fetched = 0;
    let skippedExisting = 0;
    let skippedNoData = 0;
    let pageFailures = 0;
    let lastPage = firstPage - 1;
    let exhausted = false;
    let stoppedMidPage = false;
    const products: InProduct[] = [];

    for (let page = firstPage; page < firstPage + MAX_PAGES && products.length < max; page++) {
      if (page > firstPage) await new Promise((r) => setTimeout(r, PAGE_PAUSE_MS));
      const hits = await fetchSearchPage(offTags, page);
      if (hits === null) { pageFailures++; break; }
      lastPage = page;
      fetched += hits.length;

      for (const p of hits) {
        if (products.length >= max) { stoppedMidPage = true; break; }
        // US-PRIMARY market test: the product's country list must be entirely
        // North American. A French or German product a traveler once scanned
        // carries its home country in countries_tags and is rejected here —
        // "includes US" alone let imports leak in.
        const countries = ((p as { countries_tags?: string[] }).countries_tags ?? []) as string[];
        const NA = new Set(["en:united-states", "en:canada", "en:mexico"]);
        const usPrimary = countries.includes("en:united-states") && countries.every((c) => NA.has(c));
        const isEnglish = ((p as { lang?: string }).lang ?? "en") === "en";
        // Name hygiene: printable ASCII only (no é/ü/… — those are imports),
        // and long enough to be a real product name.
        const rawName = (p.product_name ?? "").trim();
        const asciiName = /^[\x20-\x7E]+$/.test(rawName) && rawName.length >= 6;
        if (!usPrimary || !isEnglish || !asciiName) { skippedNoData++; continue; }
        // SHOUTING labels read like data-entry junk — normalise to title case.
        if (rawName === rawName.toUpperCase() && /[A-Z]{4,}/.test(rawName)) {
          p.product_name = rawName.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());
        }
        if (!p.product_name?.trim() || !p.brands?.trim() || !p.image_front_url?.trim() || !hasNutrition(p)) {
          skippedNoData++;
          continue;
        }
        const built = buildProductFromOff(p, { category, status: "published" });
        if (!built) { skippedNoData++; continue; }
        const slug = slugify(String(built.name));
        if (existing.has(slug)) { skippedExisting++; continue; }
        existing.add(slug); // also de-dupes repeats within this run
        products.push(built as InProduct);
      }
      if (hits.length < PAGE_SIZE) { exhausted = true; break; }
    }

    if (fetched === 0 && pageFailures > 0) {
      return NextResponse.json(
        { error: "Open Food Facts is busy right now — try again in a moment." },
        { status: 502 }
      );
    }

    const { tally, results } = products.length
      ? await importCatalogProducts(products, {
          updateExisting: false,
          // IMAGE LAW: a product whose photo won't cut out cleanly is skipped,
          // never imported with a raw photo or no image.
          requirePackshot: true,
          deadline: started + TIME_BUDGET_MS,
        })
      : { tally: {}, results: [] };

    const created = results.filter((r) => r.status === "created");
    const timedOut = results.filter((r) => r.status === "skipped" && r.reason?.startsWith("Time budget")).length;

    return NextResponse.json({
      fetched,
      imported: created.length,
      skipped_existing: skippedExisting + results.filter((r) => r.status === "skipped" && r.reason?.includes("already exists")).length,
      skipped_no_data: skippedNoData,
      image_notes: created.filter((r) => r.crowd_photo).length,
      sample: created.slice(0, 10).map((r) => r.name),
      // Extra context for running the next batch.
      errors: results.filter((r) => r.status === "error").map((r) => ({ name: r.name, reason: r.reason })),
      not_started_time_budget: timedOut,
      page_failures: pageFailures,
      // Stopped partway through a page → resume on that page; the rows already
      // imported are skipped by slug next time.
      next_page: stoppedMidPage ? lastPage : exhausted ? null : lastPage + 1,
      tally,
    });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/import/off-bulk] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 }
    );
  }
}
