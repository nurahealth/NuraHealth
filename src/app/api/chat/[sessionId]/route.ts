import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const { sessionId } = await ctx.params;
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session, error: sErr } = await supabase
      .from("chat_sessions")
      .select("id, user_id, title, created_at, updated_at")
      .eq("id", sessionId)
      .maybeSingle();

    if (sErr) {
      console.error("[chat/[sessionId]] session fetch failed:", sErr);
      return NextResponse.json({ error: "Could not load session" }, { status: 500 });
    }
    if (!session || (session as { user_id: string }).user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: messages, error: mErr } = await supabase
      .from("chat_messages")
      .select("id, session_id, role, content, attachments, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (mErr) {
      console.error("[chat/[sessionId]] messages fetch failed:", mErr);
      return NextResponse.json({ error: "Could not load messages" }, { status: 500 });
    }

    return NextResponse.json({ session, messages: messages ?? [] });
  } catch (err) {
    console.error("[chat/[sessionId]] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
