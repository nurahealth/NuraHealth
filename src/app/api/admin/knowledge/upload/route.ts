import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlockParam } from "@anthropic-ai/sdk/resources";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { chunkText } from "@/lib/chunking";
import { generateEmbeddings } from "@/lib/embeddings";
import { createKnowledgeSource, updateKnowledgeSource, insertChunks } from "@/lib/knowledge";

export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const METADATA_PROMPT = `Analyze this document and return ONLY a JSON object with these fields:
{
  "suggested_title": "concise 5-12 word descriptive title",
  "source_type": "book" | "research" | "article" | "other",
  "topics": ["topic1", "topic2"],
  "conditions": ["condition1"],
  "key_concepts": ["concept1", "concept2"],
  "summary": "2-3 sentence summary of the main content"
}
For suggested_title: a concise 5-12 word descriptive title. If from a known book or paper, use the actual title (shortened if needed). Otherwise generate a descriptive title based on the main topic.
Return ONLY valid JSON, no markdown.`;

function isGenericTitle(t: string | null | undefined): boolean {
  if (!t?.trim()) return true;
  const lower = t.trim().toLowerCase();
  return lower === "dummy" || lower === "untitled" || lower === "document" || lower === "pasted text" || t.trim().startsWith("Screenshot ");
}

async function extractMetadata(text: string) {
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
    suggested_title: (parsed.suggested_title as string) ?? "",
    source_type: (parsed.source_type as string) ?? "other",
    topics: Array.isArray(parsed.topics) ? (parsed.topics as string[]) : [],
    conditions: Array.isArray(parsed.conditions) ? (parsed.conditions as string[]) : [],
    key_concepts: Array.isArray(parsed.key_concepts) ? (parsed.key_concepts as string[]) : [],
    summary: (parsed.summary as string) ?? "",
  };
}

async function extractPdfTextAndMetadata(fileBuffer: Buffer) {
  const base64Pdf = fileBuffer.toString("base64");
  const res = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64Pdf },
          },
          {
            type: "text",
            text: 'Extract the full text content from this PDF and analyze it. Respond ONLY with valid JSON in this exact structure: { "full_text": "...", "suggested_title": "...", "source_type": "book|research|article|notes|protocol", "topics": ["topic1", "topic2", ...], "conditions": ["condition1", ...], "key_concepts": ["concept1", ...], "summary": "2-sentence description" }. The full_text should be the complete readable content of the PDF as plain text. For suggested_title: a concise 5-12 word descriptive title. If from a known book or paper, use the actual title (shortened if needed). Otherwise generate a descriptive title based on the main topic.',
          },
        ] as ContentBlockParam[],
      },
    ],
  });

  const raw = res.content.find((c) => c.type === "text");
  const txt = raw && "text" in raw ? raw.text : "";
  const cleaned = txt.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("[admin/upload/api] Claude raw PDF response:", txt);
    throw new Error("Claude returned malformed JSON for PDF extraction");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    console.error("[admin/upload/api] JSON parse error. Raw:", txt);
    throw new Error("Failed to parse Claude's JSON response for PDF extraction");
  }

  const VALID_SOURCE_TYPES = new Set(["book", "research", "article", "other"]);
  const rawType = parsed.source_type as string;
  const source_type = VALID_SOURCE_TYPES.has(rawType) ? rawType : "other";

  return {
    full_text: (parsed.full_text as string) ?? "",
    suggested_title: (parsed.suggested_title as string) ?? "",
    source_type,
    topics: Array.isArray(parsed.topics) ? (parsed.topics as string[]) : [],
    conditions: Array.isArray(parsed.conditions) ? (parsed.conditions as string[]) : [],
    key_concepts: Array.isArray(parsed.key_concepts) ? (parsed.key_concepts as string[]) : [],
    summary: (parsed.summary as string) ?? "",
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const userId = formData.get("userId") as string | null;
    const token = formData.get("token") as string | null;

    console.log("[admin/upload/api] userId:", userId, "hasToken:", !!token);

    if (!userId || !token) {
      return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: profile, error: profileError } = await authClient
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single();

    console.log("[admin/upload/api] profile query result:", profile, "error:", profileError);

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
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
    if (!["pdf", "md", "txt"].includes(ext)) {
      return NextResponse.json({ error: "Only PDF, MD, and TXT files are supported" }, { status: 400 });
    }
    if (ext === "pdf" && file.size > 32 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF must be under 32MB (Claude limit)" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Storage upload (non-fatal — missing bucket shouldn't block ingestion)
    const storagePath = `knowledge/${crypto.randomUUID()}.${ext}`;
    let fileUrl: string | undefined;
    try {
      const { error: storageErr } = await supabaseAdmin.storage
        .from("knowledge")
        .upload(storagePath, fileBuffer, { contentType: file.type || "application/octet-stream" });
      if (storageErr) {
        console.warn("[admin/upload/api] storage error (non-fatal):", storageErr.message);
      } else {
        fileUrl = supabaseAdmin.storage.from("knowledge").getPublicUrl(storagePath).data.publicUrl;
      }
    } catch (err) {
      console.warn("[admin/upload/api] storage threw (non-fatal):", err instanceof Error ? err.message : err);
    }

    const source = await createKnowledgeSource({
      uploaded_by: userId,
      title: title || file.name.replace(/\.[^.]+$/, ""),
      author,
      status: "processing",
      file_url: fileUrl,
      file_size: file.size,
    });

    try {
      let text = "";
      let meta: Awaited<ReturnType<typeof extractMetadata>>;

      if (ext === "pdf") {
        const pdfResult = await extractPdfTextAndMetadata(fileBuffer);
        text = pdfResult.full_text;
        meta = pdfResult;
      } else {
        text = fileBuffer.toString("utf-8");
        meta = await extractMetadata(text);
      }

      if (!text.trim()) throw new Error("No text extracted from file");

      const userTitle = title || file.name.replace(/\.[^.]+$/, "");
      const finalTitle = isGenericTitle(userTitle) && meta.suggested_title ? meta.suggested_title : userTitle;

      await updateKnowledgeSource(source.id, {
        title: finalTitle,
        source_type: meta.source_type as "book" | "research" | "article" | "other",
        topics: meta.topics,
        conditions: meta.conditions,
        key_concepts: meta.key_concepts,
        summary: meta.summary,
      });

      const chunks = chunkText(text);
      const embeddings = await generateEmbeddings(chunks);
      await insertChunks(
        source.id,
        chunks.map((content, i) => ({ content, chunk_index: i, embedding: embeddings[i] }))
      );
      await updateKnowledgeSource(source.id, { status: "analyzed", chunk_count: chunks.length });

      return NextResponse.json({
        sourceId: source.id,
        title: finalTitle,
        chunkCount: chunks.length,
        metadata: meta,
      });
    } catch (err) {
      console.error("[admin/upload/api] processing error:", err);
      await updateKnowledgeSource(source.id, {
        status: "failed",
        error_message: err instanceof Error ? err.message : "Processing failed",
      });
      throw err;
    }
  } catch (err) {
    console.error("[admin/upload/api] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
