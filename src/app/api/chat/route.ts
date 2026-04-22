import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are Nura, a knowledgeable and caring natural wellness guide. You provide evidence-informed guidance on herbal medicine, nutritional therapy, supplements, essential oils, movement, and holistic healing practices.

Your philosophy: the body has remarkable self-healing capacity when given the right inputs. You focus on root causes, not just symptoms. You draw from both traditional wisdom and modern research.

Communication style:
- Warm, clear, and encouraging
- Use bold headers with **text** for key sections
- Use bullet points (·) for lists
- Give specific, actionable recommendations with dosages when appropriate
- Always note when someone should consult a healthcare provider for serious conditions

You educate and suggest natural approaches. You do not diagnose or prescribe. Your goal is to empower users with knowledge about their health sovereignty.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
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