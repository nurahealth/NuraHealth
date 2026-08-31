import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Keyless local-vendor search over OpenStreetMap:
//  - Nominatim geocodes a US ZIP → lat/lng (when no coordinates are supplied)
//  - Overpass returns nearby food vendors by tag
//  - Known chains get their official site + logo; independents try their own
//    website's og:image (a real facility photo), then a logo, then a tile.
//  - Every card gets a working link (its site, or a Google search fallback).
// No API key, no billing. Location arrives in the POST body (never the URL).

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const UA = "NuraHealthApp/1.0 (https://nura-health-three.vercel.app)";

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
  mapsUrl: string;
  website: string | null;
  searchUrl: string;
  image: string | null;
  imageKind: ImageKind;
}

// Known health/organic chains → official domain (drives logo + website).
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
  { match: ["the fresh market", "fresh market"], domain: "thefreshmarket.com" },
];
const ORGANIC_CHAINS = BRANDS.flatMap((b) => b.match);

// Explicitly excluded — conventional big-box / low-quality chains.
// A real farmers/green market names itself as one. A lone company sitting at a
// market does not — so amenity=marketplace only counts when the name says market.
const MARKET_WORDS = [
  "market", "farmers", "farmer's", "greenmarket", "green market",
  "bazaar", "produce", "growers", "farm stand", "farmstand", "co-op", "coop",
];

const CONVENTIONAL = [
  "walmart", "target", "publix", "kroger", "safeway", "costco", "sam's club",
  "sams club", "aldi", "food lion", "winn-dixie", "winn dixie", "albertsons",
  "meijer", "dollar general", "family dollar", "stop & shop", "giant eagle",
  "winco", "smith's", "vons", "ralphs", "food 4 less",
];

// Specific local farms we have a real logo for (matched by name).
const FARMS: { match: string[]; logo: string }[] = [
  { match: ["firefly"], logo: "/logos/firefly-farm.webp?v=3" },
];
function farmLogoFor(name: string): string | null {
  const n = name.toLowerCase();
  return FARMS.find((f) => f.match.some((m) => n.includes(m)))?.logo ?? null;
}

// Known permanently-closed places OSM still lists as open (manual blocklist —
// add any that slip through here).
const CLOSED_NAMES = ["yankee peddler"];

// Supplement / vitamin retailers — not real food sources. OSM tags these as
// shop=health_food just like grocers, so exclude them by name.
// Non-food product companies that get mis-tagged as shops/markets. Excluded.
const NON_FOOD_NAMES = [
  "deodorant", "cosmetic", "perfume", "fragrance", "candle", "soap",
  "skincare", "skin care", "beauty", "salon", "spa", "nail", "barber",
  "boutique", "apparel", "clothing", "jewelry", "florist", "cbd", "vape",
  "smoke shop", "pet ", "hardware",
];

const SUPPLEMENT_NAMES = [
  "nutrishop", "gnc", "vitamin shoppe", "vitamin world", "max muscle",
  "complete nutrition", "supplement superstore", "supplement warehouse",
  "nutrition depot", "nutrition zone", "popeye's supplements", "the vitamin",
  "supplement", "nutrishop usa",
];

// Detect a place OSM has flagged as closed/disused/gone.
function isClosed(tags: Record<string, string>): boolean {
  const oh = (tags.opening_hours ?? "").toLowerCase().trim();
  if (oh === "closed" || oh === "off") return true;
  if (tags.disused === "yes" || tags.abandoned === "yes") return true;
  if (tags.end_date) return true;
  for (const k of Object.keys(tags)) {
    if (/^(disused|was|abandoned|closed|removed|demolished|razed):/i.test(k)) return true;
  }
  return false;
}

function brandFor(name: string): { domain: string; logo?: string } | null {
  const n = name.toLowerCase();
  return BRANDS.find((b) => b.match.some((m) => n.includes(m))) ?? null;
}

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.min(1, Math.sqrt(s)));
}

function classify(tags: Record<string, string>): { type: string; tier: Tier; organic: boolean } | null {
  const shop = tags.shop;
  const amenity = tags.amenity;
  const name = (tags.name ?? "").toLowerCase();
  if (isClosed(tags)) return null;
  if (CLOSED_NAMES.some((c) => name.includes(c))) return null;
  if (SUPPLEMENT_NAMES.some((c) => name.includes(c))) return null;
  if (NON_FOOD_NAMES.some((c) => name.includes(c))) return null;
  const organicTag = tags.organic === "yes" || tags.organic === "only" || shop === "organic";
  const chain = ORGANIC_CHAINS.some((c) => name.includes(c));
  if (CONVENTIONAL.some((c) => name.includes(c))) return null;
  const organic = organicTag || chain;

  if (shop === "farm") return { type: "Local farm", tier: 1, organic };
  if (amenity === "marketplace") {
    const looksLikeMarket = MARKET_WORDS.some((w) => name.includes(w));
    return looksLikeMarket ? { type: "Farmers market", tier: 2, organic } : null;
  }
  if (shop === "greengrocer") return { type: "Greengrocer", tier: 3, organic };
  if (shop === "health_food" || shop === "organic") return { type: "Health-food market", tier: 3, organic };
  if (shop === "supermarket") {
    if (chain || organicTag) return { type: "Organic-focused grocer", tier: 4, organic: true };
    return null;
  }
  return null;
}

function buildAddress(t: Record<string, string>): string | null {
  const line1 = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
  const parts = [line1, t["addr:city"], t["addr:state"], t["addr:postcode"]].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function normalizeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function domainOf(url: string): string | null {
  try {
    return new URL(normalizeUrl(url)!).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const logoUrl = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM}?postalcode=${encodeURIComponent(zip)}&country=us&format=json&limit=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!rows.length) return null;
  return { lat: parseFloat(rows[0].lat), lng: parseFloat(rows[0].lon) };
}

// Fetch a store's homepage: report whether it's alive (link is safe to show)
// and its og:image / twitter:image (a real facility photo) when present.
async function fetchSite(siteUrl: string): Promise<{ ok: boolean; og: string | null }> {
  const base = normalizeUrl(siteUrl);
  if (!base) return { ok: false, og: null };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(base, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, og: null };
    if (!(res.headers.get("content-type") ?? "").includes("text/html")) return { ok: true, og: null };
    const html = (await res.text()).slice(0, 200_000);
    const m =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!m) return { ok: true, og: null };
    let img = m[1].trim();
    const origin = new URL(base).origin;
    if (img.startsWith("//")) img = "https:" + img;
    else if (img.startsWith("/")) img = origin + img;
    else if (!/^https?:\/\//i.test(img)) img = origin + "/" + img.replace(/^\.?\//, "");
    return { ok: true, og: /^https?:\/\//i.test(img) ? img : null };
  } catch {
    return { ok: false, og: null };
  }
}

interface OverpassEl {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const q = `[out:json][timeout:20];
(
  node["shop"~"^(health_food|greengrocer|farm|organic|supermarket)$"](around:${radiusM},${lat},${lng});
  way["shop"~"^(health_food|greengrocer|farm|organic|supermarket)$"](around:${radiusM},${lat},${lng});
  node["amenity"="marketplace"](around:${radiusM},${lat},${lng});
  way["amenity"="marketplace"](around:${radiusM},${lat},${lng});
);
out center tags;`;

  const controllers = OVERPASS_ENDPOINTS.map(() => new AbortController());
  const timers = controllers.map((c) => setTimeout(() => c.abort(), 22000));
  let elements: OverpassEl[] | null = null;
  try {
    const winner = await Promise.any(
      OVERPASS_ENDPOINTS.map(async (ep, i) => {
        const res = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
          body: "data=" + encodeURIComponent(q),
          cache: "no-store",
          signal: controllers[i].signal,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return (await res.json()) as { elements?: OverpassEl[] };
      })
    );
    elements = winner.elements ?? [];
  } catch {
    elements = null; // every mirror failed
  } finally {
    timers.forEach(clearTimeout);
    controllers.forEach((c) => { try { c.abort(); } catch {} });
  }
  if (elements === null) {
    return NextResponse.json({ error: "The map service is busy right now — give it a few seconds and search again." }, { status: 502 });
  }

  const vendors: Vendor[] = [];
  const seen = new Set<string>();
  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name) continue;
    const vlat = el.lat ?? el.center?.lat;
    const vlng = el.lon ?? el.center?.lon;
    if (vlat === undefined || vlng === undefined) continue;
    const cls = classify(tags);
    if (!cls) continue;
    const key = `${name.toLowerCase()}|${vlat.toFixed(3)}|${vlng.toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let website = normalizeUrl(tags.website ?? tags["contact:website"]);
    try { if (website) website = new URL(website).origin; } catch { website = null; }
    let image = normalizeUrl(tags.image);
    let imageKind: ImageKind = image ? "photo" : null;

    // Known chain → official site + real logo. Specific farms → their logo.
    // Any other place with a website → its favicon as a logo (upgraded to a real
    // facility photo below when the site has one).
    const brand = brandFor(name);
    if (brand) {
      website = website ?? `https://www.${brand.domain}`;
      image = brand.logo ?? logoUrl(brand.domain);
      imageKind = "logo";
    }
    const farmLogo = farmLogoFor(name);
    if (farmLogo) {
      image = farmLogo;
      imageKind = "logo";
    }

    const searchQ = [name, tags["addr:city"], tags["addr:state"]].filter(Boolean).join(" ");

    vendors.push({
      id: `${el.type}/${el.id}`,
      name,
      type: cls.type,
      tier: cls.tier,
      organic: cls.organic,
      lat: vlat,
      lng: vlng,
      distanceMi: Math.round(haversineMi(lat, lng, vlat, vlng) * 10) / 10,
      address: buildAddress(tags),
      hours: tags.opening_hours ?? null,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${vlat}%2C${vlng}`,
      website,
      searchUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQ)}`,
      image,
      imageKind,
    });
  }

  vendors.sort((a, b) => a.tier - b.tier || a.distanceMi - b.distanceMi);
  const top = vendors.slice(0, 60);

  // Verify EVERY shown independent's website actually loads (2xx). If it doesn't,
  // drop the link so the card shows the working "Find online" search instead.
  // Upgrade its logo to a real facility photo when the site has one. All checks
  // run in parallel, so verifying them all costs ~one request of latency.
  const toProcess = top.filter((v) => v.website && !brandFor(v.name));
  await Promise.allSettled(
    toProcess.map(async (v) => {
      const curated = !!farmLogoFor(v.name); // hosted logo — never overwrite it
      const r = await fetchSite(v.website!);
      if (!r.ok) {
        v.website = null; // not reachable → fall back to search link
        return;
      }
      if (!curated && r.og) {
        v.image = r.og;
        v.imageKind = "photo";
      }
    })
  );

  return NextResponse.json({ center: { lat, lng }, count: vendors.length, vendors: top });
}
