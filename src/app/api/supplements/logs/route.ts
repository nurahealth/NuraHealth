import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const date = req.nextUrl.searchParams.get("date");
    if (!date || !ISO_DATE.test(date)) {
      return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", date);

    if (error) {
      console.error("[supplements/logs] fetch failed:", error);
      return NextResponse.json({ error: "Could not load logs" }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (err) {
    console.error("[supplements/logs] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load logs" },
      { status: 500 }
    );
  }
}
