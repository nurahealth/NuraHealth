import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-opus-4-7";

const SYSTEM_PROMPT = `You are NŪRA — a warm, knowledgeable companion who speaks like a functional-medicine doctor friend at coffee, not a clinical lab report. Calm authority. Plain English. No alarm, no jargon dumps.

Voice rules:
- Talk to the user like a person, not a chart. Use "you" and "your."
- Functional/integrative-medicine framing: look for root causes, not just numbers off a reference range.
- Use words like "consider," "may suggest," "supports," "tends to," "often." Avoid "diagnose," "treat," "cure," "prescribe."
- This is wellness guidance, not medical prescription. Don't say that explicitly every time — just stay in that lane.
- Be specific and actionable. Vague encouragement is worse than no advice.
- Never recommend prescription-only medications. Stick to supplements, food, sleep, movement, stress, light.

Output rules:
- Return ONLY a single valid JSON object. No preamble. No trailing prose. No markdown code fences.
- Match the exact shape provided. Every field is required. Use empty arrays for sections that don't apply.
- markerStories should focus on flagged markers (high/low/watch/critical). Skip optimal markers unless context-relevant.
- supplementRecommendations: only suggest what the markers actually support. Max 5. No filler.
- lifestyleShifts: max 4. Concrete, not platitudes ("walk more" is bad; "20-min walk after dinner" is good).
- retestSchedule: one short sentence with a window (e.g. "Re-check inflammation panel in 8–12 weeks").`;

interface NarrativeJSON {
  headlineInsight: string;
  whyThisMatters: string;
  markerStories: Array<{
    marker: string;
    value: number | string;
    unit: string;
    range: string;
    status: string;
    whatItMeans: string;
    whyItsHappening: string;
    whatToDo: string;
  }>;
  supplementRecommendations: Array<{
    name: string;
    dose: string;
    timing: string;
    rationale: string;
  }>;
  lifestyleShifts: Array<{
    category: string;
    action: string;
    why: string;
  }>;
  retestSchedule: string;
}

interface MarkerRow {
  name: string;
  value: number;
  unit: string;
  reference_range_low: number | null;
  reference_range_high: number | null;
  optimal_range_low: number | null;
  optimal_range_high: number | null;
  status: string;
  notes: string | null;
}

interface PanelRow {
  id: string;
  user_id: string;
  name: string;
  collected_date: string | null;
  insight: string | null;
}

function buildUserPrompt(panel: PanelRow, markers: MarkerRow[]): string {
  const flagged = markers.filter((m) => m.status !== "optimal");
  const optimalCount = markers.length - flagged.length;

  const markerLines = markers.map((m) => {
    const range = m.reference_range_low != null && m.reference_range_high != null
      ? `${m.reference_range_low}–${m.reference_range_high} ${m.unit}`
      : "no range provided";
    const optimal = m.optimal_range_low != null && m.optimal_range_high != null
      ? ` (functional optimal: ${m.optimal_range_low}–${m.optimal_range_high})`
      : "";
    const noteSuffix = m.notes ? ` — note: ${m.notes}` : "";
    return `- ${m.name}: ${m.value} ${m.unit} [${m.status.toUpperCase()}] · ref ${range}${optimal}${noteSuffix}`;
  }).join("\n");

  return `Write a personalized bloodwork narrative for this user.

Panel: ${panel.name}
Collected: ${panel.collected_date ?? "date unknown"}
Total markers: ${markers.length} (${flagged.length} flagged, ${optimalCount} optimal)

Markers:
${markerLines || "(no markers provided)"}

Return ONLY this JSON shape — no preamble, no markdown:

{
  "headlineInsight": "One bold sentence summarizing the bloodwork story (max 25 words)",
  "whyThisMatters": "2–3 sentences in plain English about what's happening in their body",
  "markerStories": [
    {
      "marker": "marker name as shown above",
      "value": numeric_or_string,
      "unit": "unit",
      "range": "low–high unit",
      "status": "low|optimal|watch|high|critical",
      "whatItMeans": "1–2 sentences plain English",
      "whyItsHappening": "1–2 sentences on likely root cause",
      "whatToDo": "1–2 sentences on specific action"
    }
  ],
  "supplementRecommendations": [
    { "name": "supplement", "dose": "amount + unit", "timing": "when to take", "rationale": "why this helps based on their markers (1 sentence)" }
  ],
  "lifestyleShifts": [
    { "category": "Sleep|Movement|Stress|Nutrition|Light|...", "action": "concrete specific action", "why": "1 sentence on why" }
  ],
  "retestSchedule": "Re-check [which markers] in [timeframe]"
}

Focus markerStories on flagged markers. Skip optimal markers unless explaining a downstream relationship.`;
}

function parseNarrative(raw: string): NarrativeJSON {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON object in model response");

  const parsed = JSON.parse(jsonMatch[0]) as Partial<NarrativeJSON>;

  return {
    headlineInsight: String(parsed.headlineInsight ?? ""),
    whyThisMatters: String(parsed.whyThisMatters ?? ""),
    markerStories: Array.isArray(parsed.markerStories)
      ? parsed.markerStories.map((m) => ({
          marker: String(m.marker ?? ""),
          value: m.value as number | string,
          unit: String(m.unit ?? ""),
          range: String(m.range ?? ""),
          status: String(m.status ?? ""),
          whatItMeans: String(m.whatItMeans ?? ""),
          whyItsHappening: String(m.whyItsHappening ?? ""),
          whatToDo: String(m.whatToDo ?? ""),
        }))
      : [],
    supplementRecommendations: Array.isArray(parsed.supplementRecommendations)
      ? parsed.supplementRecommendations.map((s) => ({
          name: String(s.name ?? ""),
          dose: String(s.dose ?? ""),
          timing: String(s.timing ?? ""),
          rationale: String(s.rationale ?? ""),
        }))
      : [],
    lifestyleShifts: Array.isArray(parsed.lifestyleShifts)
      ? parsed.lifestyleShifts.map((l) => ({
          category: String(l.category ?? ""),
          action: String(l.action ?? ""),
          why: String(l.why ?? ""),
        }))
      : [],
    retestSchedule: String(parsed.retestSchedule ?? ""),
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as { panelId?: string };
    const panelId = body.panelId;
    if (!panelId) {
      return NextResponse.json({ error: "panelId is required" }, { status: 400 });
    }

    // Fetch panel + verify ownership
    const { data: panel, error: panelError } = await supabaseAdmin
      .from("lab_panels")
      .select("id, user_id, name, collected_date, insight")
      .eq("id", panelId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (panelError || !panel) {
      return NextResponse.json({ error: "Panel not found" }, { status: 404 });
    }

    const { data: markerRows, error: markersError } = await supabaseAdmin
      .from("biomarkers")
      .select("name, value, unit, reference_range_low, reference_range_high, optimal_range_low, optimal_range_high, status, notes")
      .eq("panel_id", panelId)
      .eq("user_id", user.id);

    if (markersError) {
      console.error("[bloodwork/narrate] markers fetch failed:", markersError);
      return NextResponse.json({ error: "Could not load markers" }, { status: 500 });
    }

    const markers = (markerRows ?? []) as MarkerRow[];
    if (markers.length === 0) {
      return NextResponse.json(
        { error: "No biomarkers found for this panel. Re-upload the PDF or wait for analysis to finish." },
        { status: 400 }
      );
    }

    const userPrompt = buildUserPrompt(panel as PanelRow, markers);

    let narrative: NarrativeJSON;
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((c) => c.type === "text");
      const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
      narrative = parseNarrative(rawText);
    } catch (err) {
      console.error("[bloodwork/narrate] generation failed:", err);
      return NextResponse.json(
        { error: "NŪRA couldn't compose your narrative right now. Please try again in a moment." },
        { status: 500 }
      );
    }

    const { data: row, error: insertError } = await supabaseAdmin
      .from("bloodwork_narratives")
      .insert({
        user_id: user.id,
        panel_id: panelId,
        narrative,
        model_used: MODEL,
      })
      .select("id, created_at")
      .single();

    if (insertError || !row) {
      console.error("[bloodwork/narrate] insert failed:", insertError);
      return NextResponse.json({ error: "Could not save narrative" }, { status: 500 });
    }

    const saved = row as { id: string; created_at: string };
    return NextResponse.json({
      narrative,
      narrativeId: saved.id,
      createdAt: saved.created_at,
    });
  } catch (err) {
    console.error("[bloodwork/narrate] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate narrative" },
      { status: 500 }
    );
  }
}
