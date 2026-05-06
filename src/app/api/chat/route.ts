import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchKnowledgeBase, searchKnowledgeBaseByText } from "@/lib/knowledge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
  try {
    let chunks: { content: string; source_title: string; similarity: number }[] = [];

    const embedding = await generateEmbedding(userQuery);
    if (embedding) {
      chunks = await searchKnowledgeBase(embedding, 5, 0.65);
    }

    // Fallback to text search if embedding missing or no results
    if (chunks.length === 0) {
      const textResults = await searchKnowledgeBaseByText(userQuery, 3);
      chunks = textResults;
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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const lastUserMessage = [...messages].reverse().find((m: { role: string; text: string }) => m.role === "user");
    const userQuery = lastUserMessage?.text ?? "";

    const systemPrompt = await buildSystemPrompt(userQuery);

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1500,
      system: systemPrompt,
      messages: messages.map((m: { role: string; text: string }) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      })),
    });

    const textContent = response.content.find((c) => c.type === "text");
    const reply = textContent && "text" in textContent ? textContent.text : "I'm having trouble responding right now. Please try again.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from Nura" },
      { status: 500 }
    );
  }
}
