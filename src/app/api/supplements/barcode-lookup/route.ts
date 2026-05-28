import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { lookupUpc } from "@/lib/upcitemdb";

export const dynamic = "force-dynamic";

interface LookupBody {
  upc?: string;
}

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

    const outcome = await lookupUpc(upc);
    if (outcome.kind === "found") {
      return NextResponse.json({
        success: true,
        upc: outcome.upc,
        brand: outcome.data.brand,
        name: outcome.data.name,
        size: outcome.data.size,
        raw: outcome.data.raw,
      });
    }
    if (outcome.kind === "not-found") {
      return NextResponse.json(
        { success: false, upc: outcome.upc, error: "Not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Lookup service unavailable" },
      { status: 502 }
    );
  } catch (err) {
    console.error("[barcode-lookup] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
