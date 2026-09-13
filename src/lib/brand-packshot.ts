// ── Official packshot resolution ──────────────────────────────────────────────
// Bulk product data is free; usable product photography is not. Open Food Facts
// images are shoppers' snapshots, and every one of them fails the packshot gate,
// so importing a category straight from it yields products with no photo.
//
// Brands do publish clean packshots — on their own storefronts. Most premium
// food and wellness brands run Shopify, which exposes its catalogue as JSON at
// /products.json without a key. This resolves a brand + product name to the
// brand's own image by querying that endpoint and matching on title.
//
// It will not resolve everything. That is the point: a product whose official
// image cannot be found is better skipped than shown with a bad one.

const UA = "NURA-catalog/1.0 (+https://nura.health)";
// Short on purpose: a storefront that has not answered in five seconds is
// not going to, and an import run touches dozens of them.
const TIMEOUT_MS = 5000;

/** Brands whose storefront domain is not derivable from the brand name. */
const BRAND_DOMAINS: Record<string, string> = {
  "gomacro": "gomacro.com",
  "clif": "clifbar.com",
  "clif bar": "clifbar.com",
  "perfect bar": "perfectsnacks.com",
  "perfect snacks": "perfectsnacks.com",
  "iq bar": "eatiqbar.com",
  "iqbar": "eatiqbar.com",
  "kind": "kindsnacks.com",
  "aloha": "aloha.com",
  "rxbar": "shop.rxbar.com",
  "larabar": "larabar.com",
  "olipop": "drinkolipop.com",
  "poppi": "drinkpoppi.com",
  "seventh generation": "seventhgeneration.com",
  "branch basics": "branchbasics.com",
  "blueland": "blueland.com",
  "hydro flask": "hydroflask.com",
  "stanley": "stanley1913.com",
  "caraway": "carawayhome.com",
  "our place": "fromourplace.com",
  "made in": "madeincookware.com",
  "lodge": "lodgecastiron.com",
  "boll and branch": "bollandbranch.com",
  "brooklinen": "brooklinen.com",
  "avocado": "avocadogreenmattress.com",
  "molekule": "molekule.com",
  "coway": "cowaymega.com",
  "austin air": "austinair.com",
  "badger": "badgerbalm.com",
  "weleda": "weleda.com",
  "earth mama": "earthmamaorganics.com",
  "primally pure": "primallypure.com",
  "osea": "oseamalibu.com",
  "ursa major": "ursamajorvt.com",
  "thorne": "thorne.com",
  "seed": "seed.com",
  "ritual": "ritual.com",
  "ag1": "drinkag1.com",
  "athletic greens": "drinkag1.com",
  "lmnt": "drinklmnt.com",
  "prima": "eatprima.com",
  "truff": "truff.com",
  "graza": "graza.co",
  "fly by jing": "flybyjing.com",
  "siete": "sietefoods.com",
  "simple mills": "simplemills.com",
  "hu": "hukitchen.com",
  "lily's": "lilys.com",
  "chomps": "chomps.com",
  "epic": "epicbar.com",
  "quest": "questnutrition.com",
  "trubar": "trubarsnacks.com",
  "barebells": "barebells.com",
  "david": "davidprotein.com",
};

function slugifyBrand(brand: string): string {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Candidate storefront domains for a brand, best guess first. */
export function brandDomains(brand: string): string[] {
  const key = brand.trim().toLowerCase();
  const known = BRAND_DOMAINS[key];
  if (known) return [known];
  const slug = slugifyBrand(brand);
  if (!slug) return [];
  const hyphen = brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const out = [`${slug}.com`];
  if (hyphen !== slug) out.push(`${hyphen}.com`);
  return out;
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "with", "in", "for", "bar", "bars",
  "organic", "natural", "protein", "snack", "pack", "count", "oz", "g",
]);

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
  );
}

/** Fraction of the query's meaningful words that appear in the candidate. */
function similarity(query: string, candidate: string): number {
  const q = tokens(query);
  if (q.size === 0) return 0;
  const c = tokens(candidate);
  let hit = 0;
  for (const t of q) if (c.has(t)) hit++;
  return hit / q.size;
}

interface ShopifyProduct {
  title: string;
  handle: string;
  images?: { src: string }[];
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// One storefront is queried once per import run, not once per product.
const catalogueCache = new Map<string, ShopifyProduct[] | null>();
// Brands with no reachable storefront — skipped for the rest of the run.
const noStorefront = new Set<string>();

async function shopifyCatalogue(domain: string): Promise<ShopifyProduct[] | null> {
  if (catalogueCache.has(domain)) return catalogueCache.get(domain)!;
  const all: ShopifyProduct[] = [];
  for (let page = 1; page <= 3; page++) {
    const j = (await getJson(`https://${domain}/products.json?limit=250&page=${page}`)) as
      | { products?: ShopifyProduct[] }
      | null;
    const batch = j?.products;
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 250) break;
  }
  const result = all.length ? all : null;
  catalogueCache.set(domain, result);
  return result;
}

export interface ResolvedPackshot {
  imageUrl: string;
  sourcePage: string;
  domain: string;
  matchedTitle: string;
  score: number;
}

/**
 * Find the brand's own packshot for a product. Returns null rather than a
 * weak guess — the caller skips products it cannot resolve.
 */
export async function resolveBrandPackshot(
  brand: string | null | undefined,
  productName: string,
  opts: { minScore?: number } = {}
): Promise<ResolvedPackshot | null> {
  if (!brand || !productName) return null;
  const minScore = opts.minScore ?? 0.6;

  const brandKey = brand.trim().toLowerCase();
  if (noStorefront.has(brandKey)) return null;
  let anyCatalogue = false;
  for (const domain of brandDomains(brand)) {
    const catalogue = await shopifyCatalogue(domain);
    if (!catalogue) continue;
    anyCatalogue = true;

    let best: { p: ShopifyProduct; score: number } | null = null;
    for (const p of catalogue) {
      if (!p.images?.length) continue;
      // A multipack listing is a different product from the single item.
      const score = similarity(productName, p.title);
      if (!best || score > best.score) best = { p, score };
    }
    if (!best || best.score < minScore) continue;

    const src = best.p.images![0].src;
    if (!src) continue;
    return {
      imageUrl: src.startsWith("//") ? `https:${src}` : src,
      sourcePage: `https://${domain}/products/${best.p.handle}`,
      domain,
      matchedTitle: best.p.title,
      score: Number(best.score.toFixed(2)),
    };
  }
  if (!anyCatalogue) noStorefront.add(brandKey);
  return null;
}

/** Clear the per-run storefront cache. */
export function resetPackshotCache(): void {
  catalogueCache.clear();
  noStorefront.clear();
}
