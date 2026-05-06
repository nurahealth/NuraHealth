import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
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

const METADATA_PROMPT = `Analyze this document and return ONLY a JSON object with these fields:
{
  "source_type": "book" | "research" | "article" | "other",
  "topics": ["topic1", "topic2"],
  "conditions": ["condition1"],
  "key_concepts": ["concept1", "concept2"],
  "summary": "2-3 sentence summary of the main content"
}
Return ONLY valid JSON, no markdown.`;

async function extractMetadata(text: string): Promise<{
  source_type: string;
  topics: string[];
  conditions: string[];
  key_concepts: string[];
  summary: string;
}> {
  const snippet = text.slice(0, 6000);
  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 800,
    messages: [{ role: "user", content: `${METADATA_PROMPT}\n\nDocument:\n${snippet}` }],
  });
  const raw = res.content.find((c) => c.type === "text");
  const txt = raw && "text" in raw ? raw.text : "";
  const cleaned = txt.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in metadata response");
  const parsed = JSON.parse(match[0]) as Record<string, unknown>;
  return {
    source_type: (parsed.source_type as string) ?? "other",
    topics: Array.isArray(parsed.topics) ? (parsed.topics as string[]) : [],
    conditions: Array.isArray(parsed.conditions) ? (parsed.conditions as string[]) : [],
    key_concepts: Array.isArray(parsed.key_concepts) ? (parsed.key_concepts as string[]) : [],
    summary: (parsed.summary as string) ?? "",
  };
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

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const title = String(formData.get("title") ?? "");
  const author = formData.get("author") ? String(formData.get("author")) : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 50MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = ["pdf", "md", "txt"];
  if (!allowedExts.includes(ext)) {
    return NextResponse.json({ error: "Only PDF, MD, and TXT files are supported" }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage
  const storagePath = `knowledge/${crypto.randomUUID()}.${ext}`;
  const { error: storageErr } = await sb.storage
    .from("knowledge")
    .upload(storagePath, fileBuffer, { contentType: file.type || "application/octet-stream" });
  if (storageErr) {
    console.warn("[upload] storage error (non-fatal):", storageErr.message);
  }
  const { data: urlData } = sb.storage.from("knowledge").getPublicUrl(storagePath);

  // Create source row
  const source = await createKnowledgeSource({
    title: title || file.name.replace(/\.[^.]+$/, ""),
    author,
    status: "processing",
    file_url: urlData.publicUrl,
    file_size: file.size,
  });
  sourceId = source.id;

  try {
    // Extract text
    let text = "";
    if (ext === "pdf") {
      const parsed = await pdfParse(fileBuffer);
      text = parsed.text;
    } else {
      text = fileBuffer.toString("utf-8");
    }

    if (!text.trim()) throw new Error("No text extracted from file");

    // Extract metadata via Claude
    const meta = await extractMetadata(text);

    await updateKnowledgeSource(sourceId, {
      source_type: meta.source_type as KnowledgeSource["source_type"],
      topics: meta.topics,
      conditions: meta.conditions,
      key_concepts: meta.key_concepts,
      summary: meta.summary,
    });

    // Chunk
    const chunks = chunkText(text);

    // Embed
    const embeddings = await generateEmbeddings(chunks);

    // Insert chunks
    await insertChunks(
      sourceId,
      chunks.map((content, i) => ({
        content,
        chunk_index: i,
        embedding: embeddings[i],
      }))
    );

    // Mark analyzed
    await updateKnowledgeSource(sourceId, {
      status: "analyzed",
      chunk_count: chunks.length,
    });

    return NextResponse.json({
      sourceId,
      title: title || source.title,
      chunkCount: chunks.length,
      metadata: meta,
    });
  } catch (err) {
    console.error("[upload] processing error:", err);
    if (sourceId) {
      await updateKnowledgeSource(sourceId, {
        status: "failed",
        error_message: err instanceof Error ? err.message : "Processing failed",
      });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}

// Type alias to satisfy TS inside the route file
type KnowledgeSource = {
  source_type: "book" | "research" | "article" | "other";
  topics: string[] | null;
  conditions: string[] | null;
  key_concepts: string[] | null;
  summary: string | null;
};
