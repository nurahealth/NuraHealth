import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchKnowledgeBase, searchKnowledgeBaseByText } from "@/lib/knowledge";
import { createSupabaseServerClient } from "@/lib/supabase-server";

interface IncomingMessage { role?: string; text?: string }

const BASE_SYSTEM_PROMPT = `You are Nura, a knowledgeable and caring natural wellness guide. You provide evidence-informed guidance on herbal medicine, nutritional therapy, supplements, essential oils, movement, and holistic healing practices.

Your philosophy: the body has remarkable self-healing capacity when given the right inputs. You focus on root causes, not just symptoms. You draw from both traditional wisdom and modern research.

Communication style:
- Warm, clear, and encouraging
- Use bold headers with **text** for key sections
- Use bullet points (·) for lists
- Give specific, actionable recommendations with dosages when appropriate
- Always note when someone should consult a healthcare provider for serious conditions

You educate and suggest natural approaches. You do not diagnose or prescribe. Your goal is to empower users with knowledge about their health sovereignty.`;

async function buildSystemPrompt(userQuery: string): Promise<string> {
  if (!userQuery) return BASE_SYSTEM_PROMPT;

  try {
    let chunks: { content: string; source_title: string; similarity: number }[] = [];

    // Embedding step is OPTIONAL — if OPENAI_API_KEY is missing/invalid,
    // generateEmbedding returns null and we silently fall through.
    const embedding = await generateEmbedding(userQuery);
    if (embedding) {
      try {
        chunks = await searchKnowledgeBase(embedding, 5, 0.65);
      } catch (err) {
        console.warn("[chat] vector search failed (non-fatal):", err);
      }
    }

    // Text-search fallback
    if (chunks.length === 0) {
      try {
        chunks = await searchKnowledgeBaseByText(userQuery, 3);
      } catch (err) {
        console.warn("[chat] text search failed (non-fatal):", err);
      }
    }

    if (chunks.length === 0) return BASE_SYSTEM_PROMPT;

    const contextBlock = chunks
      .map((c, i) => `[Source ${i + 1}: "${c.source_title}"${c.similarity > 0 ? ` — ${Math.round(c.similarity * 100)}% match` : ""}]\n${c.content}`)
      .join("\n\n---\n\n");

    return `${BASE_SYSTEM_PROMPT}

━━━ KNOWLEDGE BASE CONTEXT ━━━
The following excerpts from NŪRA's curated knowledge base are relevant to this query. Use them to ground your response in evidence:

${contextBlock}

━━━ END CONTEXT ━━━

When citing these sources, you may reference them naturally (e.g., "Research on this topic suggests..." or "According to [source title]..."). Do not fabricate citations beyond what's provided.`;
  } catch (err) {
    console.error("[chat] RAG error (non-fatal):", err);
    return BASE_SYSTEM_PROMPT;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── Auth ──
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Validate body ──
    let body: { messages?: IncomingMessage[] };
    try {
      body = await req.json() as { messages?: IncomingMessage[] };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages must be a non-empty array" }, { status: 400 });
    }

    // ── Anthropic API key ──
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[chat] ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "Server misconfigured — missing ANTHROPIC_API_KEY" },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // ── Build prompt ──
    const lastUser = [...messages].reverse().find(m => m?.role === "user");
    const userQuery = (lastUser?.text ?? "").toString();
    const systemPrompt = await buildSystemPrompt(userQuery);

    // Sanitize messages into the Claude API shape
    const claudeMessages = messages
      .filter((m): m is IncomingMessage & { text: string } => m != null && typeof m.text === "string" && m.text.trim().length > 0)
      .map(m => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

    if (claudeMessages.length === 0) {
      return NextResponse.json({ error: "No valid messages to send" }, { status: 400 });
    }

    // ── Call Claude ──
    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1500,
        system: systemPrompt,
        messages: claudeMessages,
      });
    } catch (err) {
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : "Unknown Anthropic error";
      console.error("[chat] Anthropic error:", status, message);

      if (status === 401) {
        return NextResponse.json({ error: "AI service authentication failed" }, { status: 500 });
      }
      if (status === 429) {
        return NextResponse.json(
          { error: "Too many requests right now. Please try again in a moment." },
          { status: 429 }
        );
      }
      if (status === 529 || status === 503) {
        return NextResponse.json(
          { error: "AI service is temporarily overloaded. Please try again." },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 502 }
      );
    }

    const textContent = response.content.find(c => c.type === "text");
    const reply = textContent && "text" in textContent
      ? textContent.text
      : "I'm having trouble responding right now. Please try again.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
