import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, updated_at, created_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[chat/sessions] list failed:", error);
      return NextResponse.json({ error: "Could not load sessions" }, { status: 500 });
    }

    return NextResponse.json({ sessions: data ?? [] });
  } catch (err) {
    console.error("[chat/sessions] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
