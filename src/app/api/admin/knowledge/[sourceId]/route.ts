import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
): Promise<NextResponse> {
  console.log('🔥 DELETE route hit');
  try {
    await requireAdminFromRequest(req);

    const { sourceId } = await params;
    console.log('🔥 DELETE route hit with sourceId:', sourceId);
    if (!sourceId) {
      return NextResponse.json({ error: "sourceId required" }, { status: 400 });
    }

    // Look up the source to get file_url for storage cleanup
    const { data: source, error: fetchErr } = await supabaseAdmin
      .from("knowledge_sources")
      .select("file_url")
      .eq("id", sourceId)
      .single();
    if (fetchErr || !source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Delete chunks first (explicit — FK cascade may also be set, but be safe)
    const { error: chunksErr } = await supabaseAdmin
      .from("knowledge_chunks")
      .delete()
      .eq("source_id", sourceId);
    if (chunksErr) {
      console.error("[admin/knowledge/delete] chunks delete failed:", chunksErr.message);
      return NextResponse.json({ error: `Failed to delete chunks: ${chunksErr.message}` }, { status: 500 });
    }

    // Delete the source row
    const { error: sourceErr } = await supabaseAdmin
      .from("knowledge_sources")
      .delete()
      .eq("id", sourceId);
    if (sourceErr) {
      console.error("[admin/knowledge/delete] source delete failed:", sourceErr.message);
      return NextResponse.json({ error: `Failed to delete source: ${sourceErr.message}` }, { status: 500 });
    }

    // Best-effort storage cleanup — only for files in the `knowledge` bucket on this project
    let fileRemoved = false;
    const fileUrl = (source as { file_url: string | null }).file_url;
    if (fileUrl) {
      try {
        const u = new URL(fileUrl);
        const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host;
        const marker = "/storage/v1/object/public/knowledge/";
        const markerIdx = u.pathname.indexOf(marker);
        if (u.host === supabaseHost && markerIdx !== -1) {
          const path = decodeURIComponent(u.pathname.slice(markerIdx + marker.length));
          if (path) {
            const { error: storageErr } = await supabaseAdmin.storage.from("knowledge").remove([path]);
            if (storageErr) {
              console.warn("[admin/knowledge/delete] storage remove failed (non-fatal):", storageErr.message);
            } else {
              fileRemoved = true;
            }
          }
        }
      } catch (err) {
        console.warn("[admin/knowledge/delete] storage cleanup error (non-fatal):", err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json({ success: true, deletedId: sourceId, fileRemoved });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/knowledge/delete] unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 }
    );
  }
}
