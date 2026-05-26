import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidDay, isValidMeal, type Schedule } from "@/lib/supplements";

export const dynamic = "force-dynamic";

interface CreateBody {
  name?: string;
  dose?: string;
  timing?: string;
  frequency?: string;
  notes?: string;
  rationale?: string;
  source?: string;
  source_narrative_id?: string;
  schedule?: { days?: unknown; meals?: unknown };
}

function parseSchedule(input: CreateBody["schedule"]): { schedule: Schedule } | { error: string } {
  if (input == null) {
    // No schedule supplied → persist as unscheduled. The supplement still shows
    // up in the Stack view; the user can schedule it later by editing.
    return { schedule: { days: [], meals: [] } };
  }
  if (typeof input !== "object") return { error: "schedule must be an object" };

  const days = Array.isArray(input.days) ? input.days : null;
  const meals = Array.isArray(input.meals) ? input.meals : null;
  if (!days || !meals) return { error: "schedule.days and schedule.meals must be arrays" };

  for (const d of days) if (!isValidDay(d)) return { error: `invalid day: ${String(d)}` };
  for (const m of meals) if (!isValidMeal(m)) return { error: `invalid meal: ${String(m)}` };

  return { schedule: { days: days as Schedule["days"], meals: meals as Schedule["meals"] } };
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("supplements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[supplements] list failed:", error);
      return NextResponse.json({ error: "Could not load supplements" }, { status: 500 });
    }

    return NextResponse.json({ supplements: data ?? [] });
  } catch (err) {
    console.error("[supplements] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load supplements" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as CreateBody;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const parsed = parseSchedule(body.schedule);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const schedule = parsed.schedule;

    const recommendationReason = (() => {
      const parts: string[] = [];
      if (body.rationale) parts.push(body.rationale);
      if (body.source === "bloodwork_recommendation") {
        parts.push(
          body.source_narrative_id
            ? `[bloodwork narrative ${body.source_narrative_id}]`
            : "[bloodwork narrative]"
        );
      }
      return parts.length > 0 ? parts.join(" ") : null;
    })();

    const { data, error } = await supabaseAdmin
      .from("supplements")
      .insert({
        user_id: user.id,
        name,
        dose: body.dose ?? null,
        timing: body.timing ?? null,
        frequency: body.frequency ?? "daily",
        notes: body.notes ?? null,
        recommended_by_nura: body.source === "bloodwork_recommendation",
        recommendation_reason: recommendationReason,
        started_at: new Date().toISOString(),
        schedule,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[supplements] insert failed:", error);
      return NextResponse.json({ error: "Could not add supplement" }, { status: 500 });
    }

    return NextResponse.json({ success: true, supplement: data });
  } catch (err) {
    console.error("[supplements] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add supplement" },
      { status: 500 }
    );
  }
}
