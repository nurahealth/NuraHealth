import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface LookupBody {
  upc?: string;
}

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

const TIMEOUT_MS = 5000;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as LookupBody | null;
    const upc = body?.upc?.trim();
    if (!upc || !/^\d{8,14}$/.test(upc)) {
      return NextResponse.json({ error: "Invalid UPC" }, { status: 400 });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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
      console.error("[barcode-lookup] network error:", err);
      return NextResponse.json(
        { success: false, error: "Lookup service unavailable" },
        { status: 502 }
      );
    }
    clearTimeout(timer);

    if (!res.ok) {
      console.error("[barcode-lookup] upstream non-OK:", res.status);
      return NextResponse.json(
        { success: false, error: "Lookup service unavailable" },
        { status: 502 }
      );
    }

    const data = (await res.json().catch(() => null)) as UpcResponse | null;
    if (!data || data.code !== "OK" || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { success: false, upc, error: "Not found" },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      upc,
      brand,
      name,
      size,
      raw: item,
    });
  } catch (err) {
    console.error("[barcode-lookup] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
