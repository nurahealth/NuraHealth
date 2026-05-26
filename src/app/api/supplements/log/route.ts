import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidMeal, type Meal } from "@/lib/supplements";

export const dynamic = "force-dynamic";

interface LogBody {
  supplement_id?: string;
  log_date?: string;
  meal_slot?: string | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface ParsedLog {
  supplementId: string;
  logDate: string;
  mealSlot: Meal | null;
}

function parseBody(body: LogBody): ParsedLog | { error: string } {
  const supplementId = body.supplement_id?.trim();
  if (!supplementId) return { error: "supplement_id is required" };

  const logDate = body.log_date?.trim();
  if (!logDate || !ISO_DATE.test(logDate)) {
    return { error: "log_date must be YYYY-MM-DD" };
  }

  let mealSlot: Meal | null = null;
  if (body.meal_slot != null && body.meal_slot !== "") {
    if (!isValidMeal(body.meal_slot)) {
      return { error: `invalid meal_slot: ${String(body.meal_slot)}` };
    }
    mealSlot = body.meal_slot;
  }

  return { supplementId, logDate, mealSlot };
}

async function ensureOwnership(userId: string, supplementId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("supplements")
    .select("user_id")
    .eq("id", supplementId)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { user_id: string }).user_id === userId;
}

/**
 * Postgres treats NULLs as distinct in a default UNIQUE constraint, so the
 * (supplement_id, log_date, meal_slot) constraint won't catch a duplicate
 * meal_slot=NULL row. We pre-check explicitly.
 */
async function findExisting(parsed: ParsedLog, userId: string) {
  let q = supabaseAdmin
    .from("supplement_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("supplement_id", parsed.supplementId)
    .eq("log_date", parsed.logDate);
  if (parsed.mealSlot === null) q = q.is("meal_slot", null);
  else q = q.eq("meal_slot", parsed.mealSlot);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as LogBody;
    const parsed = parseBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (!(await ensureOwnership(user.id, parsed.supplementId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existing = await findExisting(parsed, user.id);
    if (existing) {
      return NextResponse.json({ success: true, log: existing });
    }

    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .insert({
        user_id: user.id,
        supplement_id: parsed.supplementId,
        log_date: parsed.logDate,
        meal_slot: parsed.mealSlot,
      })
      .select()
      .single();

    if (error) {
      // Race: another concurrent insert may have won. Re-fetch and return.
      const retry = await findExisting(parsed, user.id);
      if (retry) return NextResponse.json({ success: true, log: retry });
      console.error("[supplements/log] insert failed:", error);
      return NextResponse.json({ error: "Could not log supplement" }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (err) {
    console.error("[supplements/log] POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log supplement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as LogBody;
    const parsed = parseBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (!(await ensureOwnership(user.id, parsed.supplementId))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let q = supabaseAdmin
      .from("supplement_logs")
      .delete()
      .eq("user_id", user.id)
      .eq("supplement_id", parsed.supplementId)
      .eq("log_date", parsed.logDate);
    if (parsed.mealSlot === null) q = q.is("meal_slot", null);
    else q = q.eq("meal_slot", parsed.mealSlot);

    const { error } = await q;
    if (error) {
      console.error("[supplements/log] delete failed:", error);
      return NextResponse.json({ error: "Could not remove log" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[supplements/log] DELETE error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove log" },
      { status: 500 }
    );
  }
}
