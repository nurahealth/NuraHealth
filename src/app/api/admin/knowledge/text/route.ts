import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as {
      title?: string;
      author?: string;
      content?: string;
      userId?: string;
      token?: string;
    };

    console.log("[admin/text/api] received body:", {
      userId: body.userId,
      title: body.title,
      contentLength: body.content?.length,
    });

    const { title, author, content, userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
    }

    // Authenticate as the requesting user so RLS allows reading their own profile row
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

    console.log("[admin/text/api] profile query result:", profile, "error:", profileError);

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "FORBIDDEN — ADMIN ONLY" }, { status: 403 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const source = await createKnowledgeSource({
      uploaded_by: userId,
      title: title?.trim() || "Pasted Text",
      author: author?.trim() || null,
      status: "processing",
    });

    try {
      const meta = await extractMetadata(content);

      const finalTitle = isGenericTitle(title) && meta.suggested_title ? meta.suggested_title : (title?.trim() || "Pasted Text");

      await updateKnowledgeSource(source.id, {
        title: finalTitle,
        source_type: meta.source_type as "book" | "research" | "article" | "other",
        topics: meta.topics,
        conditions: meta.conditions,
        key_concepts: meta.key_concepts,
        summary: meta.summary,
      });

      const chunks = chunkText(content);
      const embeddings = await generateEmbeddings(chunks);
      await insertChunks(
        source.id,
        chunks.map((c, i) => ({ content: c, chunk_index: i, embedding: embeddings[i] }))
      );
      await updateKnowledgeSource(source.id, { status: "analyzed", chunk_count: chunks.length });

      return NextResponse.json({ success: true, sourceId: source.id, chunkCount: chunks.length, metadata: meta });
    } catch (err) {
      await updateKnowledgeSource(source.id, {
        status: "failed",
        error_message: err instanceof Error ? err.message : "Processing failed",
      });
      throw err;
    }
  } catch (err) {
    console.error("[admin/text/api] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 }
    );
  }
}
