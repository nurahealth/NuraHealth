import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-opus-4-7";

// Decoded-byte cap. base64 inflates ~4/3, so we estimate decoded size from b64 length.
const MAX_DECODED_BYTES = 5 * 1024 * 1024;

const SCAN_PROMPT = `You are looking at a photo of a supplement, vitamin, or health product label. Extract the product details.

Return ONLY a JSON object with no surrounding text, code fences, or explanation, in this exact shape:

For successful identification:
{
  "success": true,
  "name": "<supplement name e.g. 'Vitamin D3', 'Magnesium Glycinate'>",
  "dosage": "<amount per serving with unit e.g. '1000 IU', '400 mg'>",
  "form": "<capsule|softgel|tablet|gummy|powder|liquid|other>",
  "brand": "<brand name if visible, else null>",
  "confidence": "<high|medium|low>"
}

For failed identification (not a supplement, label unreadable, etc.):
{
  "success": false,
  "error": "<brief reason>"
}

Return the JSON object only. No markdown, no preamble.`;

interface ScanBody {
  image_base64?: string;
}

type ScanSuccess = {
  success: true;
  name: string;
  dosage: string | null;
  form: string | null;
  brand: string | null;
  confidence: string | null;
};
type ScanFailure = { success: false; error: string };

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as ScanBody | null;
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

    let response;
    try {
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/jpeg", data: b64 },
              },
              { type: "text", text: SCAN_PROMPT },
            ],
          },
        ],
      });
    } catch (err) {
      console.error("[supplements/scan] anthropic call failed:", err);
      return NextResponse.json(
        { error: "Vision service unavailable" },
        { status: 502 }
      );
    }

    const textBlock = response.content.find((c) => c.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) {
      console.error("[supplements/scan] no JSON in response:", raw);
      return NextResponse.json({ error: "Scan parsing failed" }, { status: 500 });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(m[0]);
    } catch (e) {
      console.error("[supplements/scan] JSON parse error:", e, raw);
      return NextResponse.json({ error: "Scan parsing failed" }, { status: 500 });
    }

    if (typeof parsed !== "object" || parsed === null) {
      return NextResponse.json({ error: "Scan parsing failed" }, { status: 500 });
    }
    const p = parsed as Record<string, unknown>;

    if (p.success === true) {
      const name = typeof p.name === "string" ? p.name.trim() : "";
      if (!name) {
        const fail: ScanFailure = { success: false, error: "No product name detected" };
        return NextResponse.json(fail, { status: 422 });
      }
      const str = (v: unknown): string | null => {
        if (v == null) return null;
        const s = String(v).trim();
        if (!s || s.toLowerCase() === "null") return null;
        return s;
      };
      const out: ScanSuccess = {
        success: true,
        name,
        dosage: str(p.dosage),
        form: str(p.form),
        brand: str(p.brand),
        confidence: str(p.confidence),
      };
      return NextResponse.json(out);
    }

    const errMsg = typeof p.error === "string" ? p.error : "Could not identify supplement";
    const fail: ScanFailure = { success: false, error: errMsg };
    return NextResponse.json(fail, { status: 422 });
  } catch (err) {
    console.error("[supplements/scan] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 }
    );
  }
}
