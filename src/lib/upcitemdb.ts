interface UpcItem {
  ean?: string;
  title?: string;
  upc?: string;
  brand?: string;
  model?: string;
  size?: string;
  dimension?: string;
  weight?: string;
  [key: string]: unknown;
}

interface UpcResponse {
  code?: string;
  total?: number;
  items?: UpcItem[];
}

export interface UpcLookupData {
  brand: string | null;
  name: string;
  size: string | null;
  raw: UpcItem;
}

export type UpcLookupOutcome =
  | { kind: "found"; upc: string; data: UpcLookupData }
  | { kind: "not-found"; upc: string }
  | { kind: "unavailable"; reason: string };

const DEFAULT_TIMEOUT_MS = 5000;

export async function lookupUpc(
  upc: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<UpcLookupOutcome> {
  if (!/^\d{8,14}$/.test(upc)) {
    return { kind: "unavailable", reason: "Invalid UPC" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timer);
    console.error("[upcitemdb] network error:", err);
    return { kind: "unavailable", reason: "Network error" };
  }
  clearTimeout(timer);

  if (!res.ok) {
    console.error("[upcitemdb] upstream non-OK:", res.status);
    return { kind: "unavailable", reason: `Upstream ${res.status}` };
  }

  const data = (await res.json().catch(() => null)) as UpcResponse | null;
  if (!data || data.code !== "OK" || !Array.isArray(data.items) || data.items.length === 0) {
    return { kind: "not-found", upc };
  }

  const item = data.items[0];
  const brand =
    typeof item.brand === "string" && item.brand.trim() ? item.brand.trim() : null;

  let name = typeof item.title === "string" ? item.title.trim() : "";
  if (brand && name) {
    const lowerBrand = brand.toLowerCase();
    const lowerName = name.toLowerCase();
    if (lowerName.startsWith(lowerBrand + " ")) {
      name = name.slice(brand.length + 1).trim();
    } else if (lowerName.startsWith(lowerBrand)) {
      name = name.slice(brand.length).trim();
    }
  }
  if (!name) name = typeof item.title === "string" ? item.title.trim() : upc;

  const size =
    typeof item.size === "string" && item.size.trim()
      ? item.size.trim()
      : typeof item.dimension === "string" && item.dimension.trim()
      ? item.dimension.trim()
      : null;

  return {
    kind: "found",
    upc,
    data: { brand, name, size, raw: item },
  };
}
