import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Nearby organic-food search powered by Google Places API (New).
//  - Text Search returns real, live businesses with a business_status flag,
//    so permanently-closed / phantom places are filtered out automatically.
//  - We keep only local farms and premium organic / health-food grocers;
//    conventional big-box chains and non-food shops are excluded by name.
//  - Real Google photos, star ratings and open-now status ride along.
// The Maps key is read from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. ZIP geocoding
// still uses keyless Nominatim so only two Google APIs need enabling.

// Server-side Places calls use a server-only key (restricted to Places API (New),
// never shipped to the browser). The public key is browser-only (Maps JS, locked
// to our domains) and is used here solely to build photo URLs the browser loads.
const KEY = process.env.GOOGLE_PLACES_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const BROWSER_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const PLACES_SEARCH = "https://places.googleapis.com/v1/places:searchText";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "NuraHealthApp/1.0 (https://nura-health-three.vercel.app)";

// Google circle radius caps at 50km (~31mi) per request; we bias to that and
// then filter to the user's chosen radius on the client.
const MAX_BIAS_M = 50000;

type Tier = 1 | 2 | 3 | 4 | 5;
type ImageKind = "photo" | "logo" | null;
interface Vendor {
  id: string;
  name: string;
  type: string;
  tier: Tier;
  organic: boolean;
  lat: number;
  lng: number;
  distanceMi: number;
  address: string | null;
  hours: string | null;
  hoursWeek: string[] | null;
  openNow: boolean | null;
  rating: number | null;
  ratingCount: number | null;
  mapsUrl: string;
  website: string | null;
  searchUrl: string;
  image: string | null;
  imageKind: ImageKind;
}

// Known health/organic chains -> real logo where we host one.
const BRANDS: { match: string[]; domain: string; logo?: string }[] = [
  { match: ["whole foods"], domain: "wholefoodsmarket.com", logo: "/logos/whole-foods.webp?v=3" },
  { match: ["sprouts"], domain: "sprouts.com", logo: "/logos/sprouts.webp?v=3" },
  { match: ["trader joe"], domain: "traderjoes.com" },
  { match: ["natural grocers"], domain: "naturalgrocers.com" },
  { match: ["fresh thyme"], domain: "freshthyme.com" },
  { match: ["erewhon"], domain: "erewhonmarket.com" },
  { match: ["earth fare"], domain: "earthfare.com" },
  { match: ["mom's organic", "moms organic"], domain: "momsorganicmarket.com" },
  { match: ["new seasons"], domain: "newseasonsmarket.com" },
  { match: ["the fresh market"], domain: "thefreshmarket.com" },
];
const brandFavicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
function brandFor(name: string): { match: string[]; domain: string; logo?: string } | null {
  const n = name.toLowerCase();
  return BRANDS.find((b) => b.match.some((m) => n.includes(m))) ?? null;
}

// Conventional big-box / low-quality chains -> excluded.
const CONVENTIONAL = [
  "walmart", "target", "publix", "kroger", "safeway", "costco", "sam's club",
  "sams club", "aldi", "food lion", "winn-dixie", "winn dixie", "albertsons",
  "meijer", "dollar general", "family dollar", "stop & shop", "giant eagle",
  "winco", "smith's", "vons", "ralphs", "food 4 less",
  "pete's fresh market", "petes fresh market", "pete's market",
  "jewel-osco", "jewel osco", "mariano's", "marianos", "heinen's",
  "7-eleven", "circle k", "wawa", "quiktrip", "cvs", "walgreens", "rite aid",
];

// Specific local farms we have a real logo for.
const FARMS: { match: string[]; logo: string }[] = [
  { match: ["firefly"], logo: "/logos/firefly-farm.webp?v=3" },
];
function farmLogoFor(name: string): string | null {
  const n = name.toLowerCase();
  return FARMS.find((f) => f.match.some((m) => n.includes(m)))?.logo ?? null;
}

const CLOSED_NAMES = ["yankee peddler"];
const NON_FOOD_NAMES = [
  "deodorant", "cosmetic", "perfume", "fragrance", "candle", "soap",
  "skincare", "skin care", "beauty", "salon", "spa", "nail", "barber",
  "boutique", "apparel", "clothing", "jewelry", "florist", "cbd", "vape",
  "smoke shop", "hardware", "pharmacy", "liquor", "wine & spirits",
];
const SUPPLEMENT_NAMES = [
  "nutrishop", "gnc", "vitamin shoppe", "vitamin world", "max muscle",
  "complete nutrition", "supplement superstore", "supplement warehouse",
  "nutrition depot", "nutrition zone", "popeye's supplements", "the vitamin",
  "supplement", "nutrishop usa",
];

// Google lists in-store departments as their own places ("Whole Foods Bakery",
// "Whole Foods Market Floral"). Collapse them — we only want the store itself.
const DEPARTMENT_WORDS = [
  "bakery", "floral", "deli", "coffee", "juice", "pizza", "sushi", "seafood",
  "pharmacy", "catering", "wine", "beer", "liquor", "butcher", "cafe", "café",
];
// Farmers markets are intentionally excluded (they pull in anything with
// "market" in the name). Branded chains like Sprouts are matched first, so
// "Sprouts Farmers Market" is unaffected.
const FARMERS_MARKET_WORDS = ["farmers market", "farmer's market", "farmers' market", "green market", "greenmarket"];

const FARM_WORDS = ["farm", "orchard", "ranch", "produce", "u-pick", "upick", "you-pick", "grove", "homestead", "creamery", "dairy", "apiary"];
const ORGANIC_WORDS = ["organic", "natural", "health food", "health foods", "co-op", "coop", "wholesome", "sprout"];

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Decide whether a Google place is a quality organic source, and how to label it.
function classify(
  name: string,
  primaryType: string,
  types: string[],
  fromFarmQuery: boolean
): { type: string; tier: Tier; organic: boolean } | null {
  const n = name.toLowerCase();
  if (CLOSED_NAMES.some((c) => n.includes(c))) return null;
  if (SUPPLEMENT_NAMES.some((c) => n.includes(c))) return null;
  if (NON_FOOD_NAMES.some((c) => n.includes(c))) return null;
  if (CONVENTIONAL.some((c) => n.includes(c))) return null;

  const brand = brandFor(name);
  const organicWord = ORGANIC_WORDS.some((w) => n.includes(w));
  const organic = !!brand || organicWord;

  // Known chains first — "Sprouts Farmers Market" is a grocer, not a farm.
  if (brand) {
    if (DEPARTMENT_WORDS.some((w) => n.includes(w))) return null; // in-store department, not the store
    return { type: "Organic-focused grocer", tier: 4, organic: true };
  }
  if (FARMERS_MARKET_WORDS.some((w) => n.includes(w))) return null;

  // Must actually look like a farm/produce source — coming back from the farm
  // search alone isn't enough (Google returns conventional grocers for it too).
  void fromFarmQuery;
  const farmish =
    FARM_WORDS.some((w) => n.includes(w)) ||
    types.includes("farm") ||
    primaryType === "farm";
  if (farmish) return { type: "Local farm", tier: 1, organic };
  if (organicWord) return { type: "Health-food market", tier: 3, organic: true };

  const grocery =
    primaryType === "grocery_store" ||
    primaryType === "supermarket" ||
    types.includes("grocery_store") ||
    types.includes("supermarket");
  // Unbranded conventional grocers with no organic signal -> drop (Austin: no bullshit).
  if (grocery) return null;
  return null;
}

async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM}?postalcode=${encodeURIComponent(zip)}&country=us&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!rows.length) return null;
  return { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
}

interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  primaryType?: string;
  types?: string[];
  photos?: { name: string }[];
  currentOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
}

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.primaryType",
  "places.types",
  "places.photos",
  "places.currentOpeningHours",
  "places.regularOpeningHours",
].join(",");

async function textSearch(
  query: string,
  lat: number,
  lng: number,
  radiusM: number
): Promise<{ places: GPlace[]; error: string | null }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(PLACES_SEARCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: Math.min(radiusM, MAX_BIAS_M),
          },
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      let msg = `Google Places returned ${res.status}`;
      try {
        const err = (await res.json()) as { error?: { message?: string; status?: string } };
        if (err.error?.message) msg = `${err.error.status ?? res.status}: ${err.error.message}`;
      } catch {}
      return { places: [], error: msg };
    }
    const data = (await res.json()) as { places?: GPlace[] };
    return { places: data.places ?? [], error: null };
  } catch (e) {
    return { places: [], error: e instanceof Error ? e.message : "request failed" };
  }
}

const QUERIES: { q: string; farm: boolean }[] = [
  { q: "organic grocery store", farm: false },
  { q: "health food store", farm: false },
  { q: "whole foods market", farm: false },
  { q: "sprouts farmers market", farm: false },
  { q: "farm stand", farm: true },
  { q: "organic farm", farm: true },
];

// Google isn't returning photos for this project, so for places with a website
// we pull the site's og:image (a real facility photo) as a fallback.
async function fetchOgImage(siteUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(siteUrl, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("text/html")) return null;
    const html = (await res.text()).slice(0, 200_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!m) return null;
    let img = m[1].trim();
    const origin = new URL(siteUrl).origin;
    if (img.startsWith("//")) img = "https:" + img;
    else if (img.startsWith("/")) img = origin + img;
    else if (!/^https?:\/\//i.test(img)) img = origin + "/" + img.replace(/^\.?\//, "");
    // Skip social/generic/site-builder placeholder images — they're not the store.
    if (/facebook\.com|fbcdn|instagram|bolt\.new|og[_-]?default|default[_-]?og|placeholder|\/wp-includes\/|gravatar|squarespace-cdn\.com\/content\/v1\/[^/]+\/1[0-9]{9}/i.test(img)) return null;
    return /^https?:\/\//i.test(img) ? img : null;
  } catch {
    return null;
  }
}

function photoUrl(name: string): string {
  return `https://places.googleapis.com/v1/${name}/media?maxHeightPx=640&maxWidthPx=640&key=${BROWSER_KEY}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!KEY) {
    return NextResponse.json(
      { error: "Maps isn't configured yet. Add GOOGLE_PLACES_SERVER_KEY (and NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) to .env.local and restart." },
      { status: 500 }
    );
  }

  let body: { lat?: number; lng?: number; zip?: string; radiusMi?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let lat = typeof body.lat === "number" ? body.lat : undefined;
  let lng = typeof body.lng === "number" ? body.lng : undefined;

  if ((lat === undefined || lng === undefined) && body.zip) {
    const geo = await geocodeZip(String(body.zip).trim());
    if (!geo) return NextResponse.json({ error: "Couldn't find that ZIP code." }, { status: 404 });
    lat = geo.lat;
    lng = geo.lng;
  }
  if (lat === undefined || lng === undefined) {
    return NextResponse.json({ error: "Provide a location or ZIP code." }, { status: 400 });
  }

  const radiusMi = Math.min(Math.max(body.radiusMi ?? 10, 1), 100);
  const radiusM = Math.round(radiusMi * 1609.34);

  // Run all queries in parallel.
  const results = await Promise.all(
    QUERIES.map((qq) => textSearch(qq.q, lat!, lng!, radiusM).then((r) => ({ ...r, farm: qq.farm })))
  );

  const firstError = results.find((r) => r.error)?.error ?? null;
  const totalPlaces = results.reduce((n, r) => n + r.places.length, 0);
  if (totalPlaces === 0 && firstError) {
    console.error("[shop/nearby] Google Places error:", firstError);
    return NextResponse.json({ error: `Google Places error — ${firstError}` }, { status: 502 });
  }

  const vendors: Vendor[] = [];
  const seen = new Set<string>();

  for (const { places, farm } of results) {
    for (const p of places) {
      if (!p.id || seen.has(p.id)) continue;
      const name = p.displayName?.text;
      const loc = p.location;
      if (!name || !loc) continue;
      // Live status: drop anything not actively operating.
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;

      const cls = classify(name, p.primaryType ?? "", p.types ?? [], farm);
      if (!cls) continue;
      seen.add(p.id);

      let image: string | null = null;
      let imageKind: ImageKind = null;
      const brand = brandFor(name);
      const farmLogo = farmLogoFor(name);
      if (farmLogo) {
        image = farmLogo;
        imageKind = "logo";
      } else if (brand?.logo) {
        image = brand.logo;
        imageKind = "logo";
      } else if (p.photos && p.photos.length) {
        image = photoUrl(p.photos[0].name);
        imageKind = "photo";
      }

      const hoursArr =
        p.currentOpeningHours?.weekdayDescriptions ?? p.regularOpeningHours?.weekdayDescriptions ?? null;

      vendors.push({
        id: p.id,
        name,
        type: cls.type,
        tier: cls.tier,
        organic: cls.organic,
        lat: loc.latitude,
        lng: loc.longitude,
        distanceMi: Math.round(haversineMi(lat, lng, loc.latitude, loc.longitude) * 10) / 10,
        address: p.formattedAddress ?? null,
        hours: hoursArr ? hoursArr.join(" · ") : null,
        hoursWeek: hoursArr,
        openNow: p.currentOpeningHours?.openNow ?? null,
        rating: p.rating ?? null,
        ratingCount: p.userRatingCount ?? null,
        mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${loc.latitude}%2C${loc.longitude}`,
        website: p.websiteUri ?? null,
        searchUrl: `https://www.google.com/search?q=${encodeURIComponent(name)}`,
        image,
        imageKind,
      });
    }
  }

  vendors.sort((a, b) => a.tier - b.tier || a.distanceMi - b.distanceMi);
  const top = vendors.slice(0, 60);

  // Photo fallback: any shown place with no image but a real (non-social) website
  // gets its site's og:image. All in parallel, so it costs ~one request of latency.
  const needPhoto = top.filter(
    (v) => !v.image && v.website && !/facebook\.com|instagram\.com|yelp\.com/i.test(v.website)
  );
  await Promise.allSettled(
    needPhoto.map(async (v) => {
      const og = await fetchOgImage(v.website!);
      if (og) {
        v.image = og;
        v.imageKind = "photo";
      }
    })
  );
  // Known chains that still have nothing → their official favicon as a logo.
  for (const v of top) {
    if (v.image) continue;
    const b = brandFor(v.name);
    if (b) {
      v.image = brandFavicon(b.domain);
      v.imageKind = "logo";
    }
  }

  return NextResponse.json({ center: { lat, lng }, count: vendors.length, vendors: top });
}
