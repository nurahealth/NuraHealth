import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidDay, isValidMeal, type Schedule } from "@/lib/supplements";

export const dynamic = "force-dynamic";

interface UpdateBody {
  name?: string;
  dose?: string | null;
  notes?: string | null;
  timing?: string | null;
  frequency?: string;
  schedule?: { days?: unknown; meals?: unknown };
}

function parseSchedule(input: UpdateBody["schedule"]): { schedule: Schedule } | { error: string } {
  if (input == null || typeof input !== "object") return { error: "schedule must be an object" };
  const days = Array.isArray(input.days) ? input.days : null;
  const meals = Array.isArray(input.meals) ? input.meals : null;
  if (!days || !meals) return { error: "schedule.days and schedule.meals must be arrays" };
  for (const d of days) if (!isValidDay(d)) return { error: `invalid day: ${String(d)}` };
  for (const m of meals) if (!isValidMeal(m)) return { error: `invalid meal: ${String(m)}` };
  return { schedule: { days: days as Schedule["days"], meals: meals as Schedule["meals"] } };
}

async function ensureOwnership(userId: string, id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("supplements")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { user_id: string }).user_id === userId;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await ensureOwnership(user.id, id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as UpdateBody;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed) return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      update.name = trimmed;
    }
    if (body.dose !== undefined) update.dose = body.dose || null;
    if (body.notes !== undefined) update.notes = body.notes || null;
    if (body.timing !== undefined) update.timing = body.timing || null;
    if (body.frequency !== undefined) update.frequency = body.frequency;

    if (body.schedule !== undefined) {
      const parsed = parseSchedule(body.schedule);
      if ("error" in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      update.schedule = parsed.schedule;
    }

    const { data, error } = await supabaseAdmin
      .from("supplements")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("[supplements/:id] update failed:", error);
      return NextResponse.json({ error: "Could not update supplement" }, { status: 500 });
    }

    return NextResponse.json({ success: true, supplement: data });
  } catch (err) {
    console.error("[supplements/:id] PATCH error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update supplement" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await ensureOwnership(user.id, id))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("supplements")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[supplements/:id] delete failed:", error);
      return NextResponse.json({ error: "Could not delete supplement" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[supplements/:id] DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete supplement" },
      { status: 500 }
    );
  }
}
