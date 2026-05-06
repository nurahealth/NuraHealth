import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { chunkText } from "@/lib/chunking";
import { generateEmbeddings } from "@/lib/embeddings";
import {
  createKnowledgeSource,
  updateKnowledgeSource,
  insertChunks,
} from "@/lib/knowledge";

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const OCR_PROMPT = "Extract all text from this image exactly as it appears. Preserve paragraph structure and headings. Return only the extracted text, no commentary.";

const METADATA_PROMPT = `Analyze this document and return ONLY a JSON object with these fields:
{
  "source_type": "book" | "research" | "article" | "other",
  "topics": ["topic1", "topic2"],
  "conditions": ["condition1"],
  "key_concepts": ["concept1"],
  "summary": "2-3 sentence summary"
}
Return ONLY valid JSON, no markdown.`;

async function ocrImage(imageBuffer: Buffer, mediaType: string): Promise<string> {
  const base64 = imageBuffer.toString("base64");
  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 },
          },
          { type: "text", text: OCR_PROMPT },
        ],
      },
    ],
  });
  const block = res.content.find((c) => c.type === "text");
  return block && "text" in block ? block.text : "";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let sourceId: string | null = null;

  try {
    await requireAdminFromRequest(req);
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  const title = String(formData.get("title") ?? "Photo Upload");
  const author = formData.get("author") ? String(formData.get("author")) : null;

  if (files.length === 0) {
    return NextResponse.json({ error: "No images provided" }, { status: 400 });
  }

  const source = await createKnowledgeSource({ title, author, status: "processing" });
  sourceId = source.id;

  try {
    // OCR all images in order
    const textParts: string[] = [];
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const mt = file.type || "image/jpeg";
      const extracted = await ocrImage(buf, mt);
      if (extracted.trim()) textParts.push(extracted.trim());
    }
    const text = textParts.join("\n\n");

    if (!text.trim()) throw new Error("No text extracted from images");

    // Metadata via Claude
    const snippet = text.slice(0, 5000);
    const metaRes = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 800,
      messages: [{ role: "user", content: `${METADATA_PROMPT}\n\nDocument:\n${snippet}` }],
    });
    const metaBlock = metaRes.content.find((c) => c.type === "text");
    const metaRaw = metaBlock && "text" in metaBlock ? metaBlock.text : "{}";
    const metaCleaned = metaRaw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const metaMatch = metaCleaned.match(/\{[\s\S]*\}/);
    const meta = metaMatch ? JSON.parse(metaMatch[0]) as Record<string, unknown> : {};

    await updateKnowledgeSource(sourceId, {
      source_type: (meta.source_type as "book" | "research" | "article" | "other") ?? "other",
      topics: Array.isArray(meta.topics) ? (meta.topics as string[]) : [],
      conditions: Array.isArray(meta.conditions) ? (meta.conditions as string[]) : [],
      key_concepts: Array.isArray(meta.key_concepts) ? (meta.key_concepts as string[]) : [],
      summary: (meta.summary as string) ?? "",
    });

    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    await insertChunks(sourceId, chunks.map((content, i) => ({ content, chunk_index: i, embedding: embeddings[i] })));
    await updateKnowledgeSource(sourceId, { status: "analyzed", chunk_count: chunks.length });

    return NextResponse.json({ sourceId, chunkCount: chunks.length, pageCount: files.length });
  } catch (err) {
    console.error("[photos] processing error:", err);
    if (sourceId) {
      await updateKnowledgeSource(sourceId, {
        status: "failed",
        error_message: err instanceof Error ? err.message : "Processing failed",
      });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : "Processing failed" }, { status: 500 });
  }
}
