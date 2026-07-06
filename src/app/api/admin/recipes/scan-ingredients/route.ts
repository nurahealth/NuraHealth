import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

export const maxDuration = 60;

// Same server-side client + env pattern as the bloodwork extractor — the key
// never leaves the server.
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT_MIME: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB — same cap as the photo field

const PROMPT = `You are extracting the ingredient list from a photo of a recipe (a cookbook page, recipe card, or screenshot).

Return ONLY valid JSON — no prose, no markdown — in exactly this shape:
{"ingredients":[{"name":"<ingredient name>","amount_text":"<amount as written, or null>"}]}

Rules:
- One entry per ingredient line.
- "name": the ingredient itself WITHOUT the quantity (e.g. "extra virgin olive oil", "garlic", "canned chickpeas", "smoked paprika").
- "amount_text": the full quantity/measure exactly as written (e.g. "2 tbsp", "1 clove, minced", "400g can", "a pinch"), or null when there is none.
- Ignore section headings, method/instructions, page numbers, and any non-ingredient text.
- Preserve the order they appear.
- If the image is unreadable or is not an ingredient list, return {"ingredients":[]}.`;

interface ScanItem { name: string; amount_text: string | null }

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const ext = (file.name || "").toLowerCase().split(".").pop() ?? "";
    if (ext === "heic" || ext === "heif" || file.type === "image/heic" || file.type === "image/heif") {
      return NextResponse.json({ error: "HEIC isn't supported — export as JPEG or PNG first." }, { status: 400 });
    }
    const mediaType = ALLOWED_MIME.has(file.type) ? (file.type as "image/jpeg" | "image/png" | "image/webp") : EXT_MIME[ext];
    if (!mediaType) {
      return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image" }, { status: 400 });
    }

    // The scan image is NOT stored anywhere — it's only sent for extraction.
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

    let items: ScanItem[];
    try {
      const response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      const raw = textBlock && "text" in textBlock ? textBlock.text : "";
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in model response");

      const parsed = JSON.parse(match[0]) as { ingredients?: unknown };
      const arr = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
      items = arr
        .map((r) => {
          const o = (r ?? {}) as Record<string, unknown>;
          const name = typeof o.name === "string" ? o.name.trim() : "";
          const amount = typeof o.amount_text === "string" && o.amount_text.trim() ? o.amount_text.trim() : null;
          return name ? { name, amount_text: amount } : null;
        })
        .filter((x): x is ScanItem => x !== null);
    } catch (err) {
      console.error("[admin/recipes/scan-ingredients] extraction failed:", err);
      return NextResponse.json({ error: "Couldn't read that image. Try a clearer, well-lit photo of just the ingredient list." }, { status: 502 });
    }

    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/recipes/scan-ingredients] unexpected:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Scan failed" }, { status: 500 });
  }
}
