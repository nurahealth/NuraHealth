import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchKnowledgeBase, searchKnowledgeBaseByText } from "@/lib/knowledge";
import { createSupabaseServerClient } from "@/lib/supabase-server";

interface ChatMessageRow {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  attachments: unknown;
  created_at: string;
}

const BASE_SYSTEM_PROMPT = `You are Nura, a knowledgeable and caring natural wellness guide. You provide evidence-informed guidance on herbal medicine, nutritional therapy, supplements, essential oils, movement, and holistic healing practices.

Your philosophy: the body has remarkable self-healing capacity when given the right inputs. You focus on root causes, not just symptoms. You draw from both traditional wisdom and modern research.

Communication style:
- Warm, clear, and encouraging
- Use bold headers with **text** for key sections
- Use bullet points (·) for lists
- Give specific, actionable recommendations with dosages when appropriate
- Always note when someone should consult a healthcare provider for serious conditions

You educate and suggest natural approaches. You do not diagnose or prescribe. Your goal is to empower users with knowledge about their health sovereignty.`;

function onboardingSlice(data: Record<string, unknown> | null): string {
  if (!data) return "";
  const parts: string[] = [];
  const v = (k: string) => (data[k] != null ? String(data[k]) : "");
  if (v("name")) parts.push(`Name: ${v("name")}`);
  if (v("sex")) parts.push(`Sex: ${v("sex")}`);
  if (v("dob")) parts.push(`DOB: ${v("dob")}`);
  if (Array.isArray(data.goals) && data.goals.length) parts.push(`Goals: ${(data.goals as string[]).join(", ")}`);
  if (Array.isArray(data.symptom_chips) && data.symptom_chips.length) parts.push(`Symptoms: ${(data.symptom_chips as string[]).join(", ")}`);
  if (v("symptoms_text")) parts.push(`Notes: ${v("symptoms_text")}`);
  if (v("diet")) parts.push(`Diet: ${v("diet")}`);
  if (v("exercise")) parts.push(`Exercise: ${v("exercise")}`);
  if (v("sleep")) parts.push(`Sleep: ${v("sleep")}`);
  if (v("stress")) parts.push(`Stress: ${v("stress")}`);
  return parts.length
    ? `\n\n━━━ USER PROFILE ━━━\n${parts.join("\n")}\n━━━ END PROFILE ━━━\nUse this to personalize. Reference their goals/symptoms when relevant. Don't recite the profile back at them.\n`
    : "";
}

async function buildSystemPrompt(userQuery: string, onboardingData: Record<string, unknown> | null): Promise<string> {
  const baseWithProfile = BASE_SYSTEM_PROMPT + onboardingSlice(onboardingData);
  if (!userQuery) return baseWithProfile;

  try {
    let chunks: { content: string; source_title: string; similarity: number }[] = [];

    const embedding = await generateEmbedding(userQuery);
    if (embedding) {
      try {
        chunks = await searchKnowledgeBase(embedding, 5, 0.65);
      } catch (err) {
        console.warn("[chat] vector search failed (non-fatal):", err);
      }
    }
    if (chunks.length === 0) {
      try { chunks = await searchKnowledgeBaseByText(userQuery, 3); }
      catch (err) { console.warn("[chat] text search failed (non-fatal):", err); }
    }
    if (chunks.length === 0) return baseWithProfile;

    const contextBlock = chunks
      .map((c, i) => `[Source ${i + 1}: "${c.source_title}"${c.similarity > 0 ? ` — ${Math.round(c.similarity * 100)}% match` : ""}]\n${c.content}`)
      .join("\n\n---\n\n");

    return `${baseWithProfile}

━━━ KNOWLEDGE BASE CONTEXT ━━━
The following excerpts from NŪRA's curated knowledge base are relevant to this query. Use them to ground your response in evidence:

${contextBlock}

━━━ END CONTEXT ━━━

When citing these sources, you may reference them naturally. Do not fabricate citations beyond what's provided.`;
  } catch (err) {
    console.error("[chat] RAG error (non-fatal):", err);
    return baseWithProfile;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { message?: string; sessionId?: string; attachments?: unknown[] };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

    const message = (body.message ?? "").toString().trim();
    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    // ── Session: get or create ──
    let sessionId = body.sessionId ?? null;
    if (sessionId) {
      const { data: existing, error: sErr } = await supabase
        .from("chat_sessions")
        .select("id, user_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (sErr || !existing || (existing as { user_id: string }).user_id !== user.id) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    } else {
      const title = message.length > 50 ? message.slice(0, 50).trim() + "…" : message;
      const { data: created, error: cErr } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (cErr || !created) {
        console.error("[chat] session create failed:", cErr);
        return NextResponse.json({ error: "Could not create session" }, { status: 500 });
      }
      sessionId = (created as { id: string }).id;
    }

    // ── Insert user message ──
    const { data: userMsg, error: uErr } = await supabase
      .from("chat_messages")
      .insert({ session_id: sessionId, role: "user", content: message, attachments })
      .select("id, session_id, role, content, attachments, created_at")
      .single();
    if (uErr || !userMsg) {
      console.error("[chat] user msg insert failed:", uErr);
      return NextResponse.json({ error: "Could not save message" }, { status: 500 });
    }

    // ── Build conversation history ──
    const { data: history, error: hErr } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (hErr) {
      console.error("[chat] history load failed:", hErr);
      return NextResponse.json({ error: "Could not load conversation" }, { status: 500 });
    }

    // ── Profile / onboarding data ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_data")
      .eq("id", user.id)
      .maybeSingle();
    const onboardingData = (profile as { onboarding_data: Record<string, unknown> | null } | null)?.onboarding_data ?? null;

    // ── Anthropic ──
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[chat] ANTHROPIC_API_KEY missing");
      return NextResponse.json({ error: "Server misconfigured — missing ANTHROPIC_API_KEY" }, { status: 500 });
    }
    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = await buildSystemPrompt(message, onboardingData);
    const claudeMessages = (history as { role: "user" | "assistant"; content: string }[])
      .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

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
      console.error("[chat] Anthropic error:", status, err instanceof Error ? err.message : err);
      const msg =
        status === 401 ? "AI service authentication failed"
        : status === 429 ? "Too many requests right now. Please try again in a moment."
        : status === 529 || status === 503 ? "AI service is temporarily overloaded. Please try again."
        : "AI service error. Please try again.";
      const code = status === 429 ? 429 : status === 503 || status === 529 ? 503 : 502;
      return NextResponse.json({ error: msg, sessionId }, { status: code });
    }

    const textContent = response.content.find((c) => c.type === "text");
    const reply = textContent && "text" in textContent
      ? textContent.text
      : "I'm having trouble responding right now. Please try again.";

    // ── Insert assistant message ──
    const { data: asstMsg, error: aErr } = await supabase
      .from("chat_messages")
      .insert({ session_id: sessionId, role: "assistant", content: reply, attachments: [] })
      .select("id, session_id, role, content, attachments, created_at")
      .single();
    if (aErr || !asstMsg) {
      console.error("[chat] assistant msg insert failed:", aErr);
      // Best effort: return reply anyway
      return NextResponse.json({
        sessionId,
        userMessage: userMsg as ChatMessageRow,
        assistantMessage: { id: "tmp", session_id: sessionId, role: "assistant", content: reply, attachments: [], created_at: new Date().toISOString() },
        warning: "assistant message not persisted",
      });
    }

    // ── Touch session updated_at ──
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    return NextResponse.json({
      sessionId,
      userMessage: userMsg as ChatMessageRow,
      assistantMessage: asstMsg as ChatMessageRow,
    });
  } catch (err) {
    console.error("[chat] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
