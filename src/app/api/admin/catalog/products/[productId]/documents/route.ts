import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

export const maxDuration = 60;

const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25MB
const DOC_SELECT = "id, title, doc_type, year, source_url, storage_path, sort_order, created_at";
const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp", "gif", "heic"]);

// ── GET: list a product's documents (sort_order, then created) ───────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    const { data, error } = await supabaseAdmin
      .from("catalog_product_documents")
      .select(DOC_SELECT)
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin/catalog/.../documents GET] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ documents: data ?? [] });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../documents GET] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load documents" },
      { status: 500 }
    );
  }
}

// ── POST: attach a document — either a pasted link or an uploaded PDF ─────────
// Multipart form: title (required), doc_type, year, and EITHER source_url OR file.
// The PDF (when present) is uploaded to the public `catalog-documents` bucket via
// the service role, and its storage path is saved on the row.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId } = await params;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    // Title is optional — defaulted from the file name (or link) below, so an
    // upload never silently fails just because a title wasn't typed.
    let title = String(formData.get("title") ?? "").trim();

    const docTypeRaw = formData.get("doc_type");
    const doc_type = docTypeRaw ? String(docTypeRaw).trim() || null : null;

    const yearRaw = formData.get("year") ? String(formData.get("year")).trim() : "";
    let year: number | null = null;
    if (yearRaw) {
      const n = parseInt(yearRaw, 10);
      if (!Number.isFinite(n) || n < 0 || n > 9999) {
        return NextResponse.json({ error: "Year must be a 4-digit number" }, { status: 400 });
      }
      year = n;
    }

    const file = formData.get("file");
    let storage_path: string | null = null;
    let source_url: string | null = null;

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_DOC_BYTES) {
        return NextResponse.json({ error: "File must be under 25MB" }, { status: 400 });
      }
      const ext = (file.name.split(".").pop()?.toLowerCase() ?? "").replace(/[^a-z0-9]/g, "");
      const accepted = ALLOWED_EXT.has(ext) || file.type === "application/pdf" || file.type.startsWith("image/");
      if (!accepted) {
        return NextResponse.json({ error: "Unsupported file type — use a PDF, DOC, or image" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const path = `documents/${productId}/${crypto.randomUUID()}.${ext || "bin"}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("catalog-documents")
        .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
      if (uploadError) {
        console.error("[admin/catalog/.../documents POST] upload failed:", uploadError.message);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
      storage_path = path;
      if (!title) title = file.name.replace(/\.[^.]+$/, "").trim();
    } else {
      source_url = formData.get("source_url") ? String(formData.get("source_url")).trim() : "";
      if (!source_url) {
        return NextResponse.json({ error: "Provide a link or upload a PDF" }, { status: 400 });
      }
      if (!title) title = source_url;
    }
    if (!title) title = "Untitled document";

    // Append to the end of the existing list
    const { count } = await supabaseAdmin
      .from("catalog_product_documents")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const { data, error } = await supabaseAdmin
      .from("catalog_product_documents")
      .insert({ product_id: productId, title, doc_type, year, source_url, storage_path, sort_order: count ?? 0 })
      .select(DOC_SELECT)
      .single();

    if (error) {
      // Roll back the just-uploaded file so we don't orphan it
      if (storage_path) {
        try { await supabaseAdmin.storage.from("catalog-documents").remove([storage_path]); } catch {}
      }
      console.error("[admin/catalog/.../documents POST] insert failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../documents POST] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add document" },
      { status: 500 }
    );
  }
}
