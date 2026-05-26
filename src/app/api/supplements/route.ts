import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

interface CreateBody {
  name?: string;
  dose?: string;
  timing?: string;
  frequency?: string;
  rationale?: string;
  source?: string;
  source_narrative_id?: string;
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
        notes: null,
        recommended_by_nura: body.source === "bloodwork_recommendation",
        recommendation_reason: recommendationReason,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[supplements] insert failed:", error);
      return NextResponse.json({ error: "Could not add supplement" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: (data as { id: string }).id });
  } catch (err) {
    console.error("[supplements] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add supplement" },
      { status: 500 }
    );
  }
}
