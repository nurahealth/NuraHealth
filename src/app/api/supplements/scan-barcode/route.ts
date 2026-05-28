import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { lookupUpc } from "@/lib/upcitemdb";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-opus-4-7";
const MAX_DECODED_BYTES = 5 * 1024 * 1024;

const BARCODE_PROMPT = `Look at this image. Extract any UPC, EAN, or other product barcode digits visible.

Return ONLY a JSON object, no surrounding text or code fences:

If a barcode is visible and readable:
{ "barcode_found": true, "digits": "<digits only, no spaces or hyphens>" }

If no barcode is visible or cannot be read:
{ "barcode_found": false, "reason": "<brief reason>" }`;

interface ScanBarcodeBody {
  image_base64?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as ScanBarcodeBody | null;
    const b64 = body?.image_base64?.trim();
    if (!b64) {
      return NextResponse.json({ error: "image_base64 is required" }, { status: 400 });
    }
    if (b64.length < 100 || !/^[A-Za-z0-9+/=]+$/.test(b64)) {
      return NextResponse.json({ error: "image_base64 is malformed" }, { status: 400 });
    }
    const approxBytes = Math.floor(b64.length * 0.75);
    if (approxBytes > MAX_DECODED_BYTES) {
      return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 413 });
    }

    let visionRes;
    try {
      visionRes = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: b64 } },
              { type: "text", text: BARCODE_PROMPT },
            ],
          },
        ],
      });
    } catch (err) {
      console.error("[scan-barcode] anthropic failed:", err);
      return NextResponse.json(
        { success: false, source: "error", error: "Vision service unavailable" },
        { status: 502 }
      );
    }

    const textBlock = visionRes.content.find((c) => c.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) {
      console.error("[scan-barcode] no JSON in response:", rawText);
      return NextResponse.json(
        { success: false, source: "error", error: "Parse failed" },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(m[0]);
    } catch (err) {
      console.error("[scan-barcode] JSON parse error:", err, rawText);
      return NextResponse.json(
        { success: false, source: "error", error: "Parse failed" },
        { status: 502 }
      );
    }

    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json(
        { success: false, source: "error", error: "Parse failed" },
        { status: 502 }
      );
    }
    const p = parsed as Record<string, unknown>;

    if (p.barcode_found === true) {
      const rawDigits = typeof p.digits === "string" ? p.digits : "";
      const digits = rawDigits.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 14) {
        const reason =
          typeof p.reason === "string" && p.reason ? p.reason : "Invalid digits";
        return NextResponse.json({ success: false, source: "no_barcode", error: reason });
      }

      const outcome = await lookupUpc(digits);
      if (outcome.kind === "found") {
        return NextResponse.json({
          success: true,
          source: "barcode",
          upc: outcome.upc,
          brand: outcome.data.brand,
          name: outcome.data.name,
          size: outcome.data.size,
          raw: outcome.data.raw,
        });
      }
      if (outcome.kind === "not-found") {
        return NextResponse.json({
          success: false,
          source: "barcode_no_match",
          upc: digits,
        });
      }
      return NextResponse.json(
        { success: false, source: "error", error: outcome.reason },
        { status: 502 }
      );
    }

    const reason = typeof p.reason === "string" && p.reason ? p.reason : "No barcode detected";
    return NextResponse.json({ success: false, source: "no_barcode", error: reason });
  } catch (err) {
    console.error("[scan-barcode] error:", err);
    return NextResponse.json(
      {
        success: false,
        source: "error",
        error: err instanceof Error ? err.message : "Scan failed",
      },
      { status: 500 }
    );
  }
}
