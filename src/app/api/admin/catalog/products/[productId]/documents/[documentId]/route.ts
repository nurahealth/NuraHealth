import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

export const maxDuration = 60;

const MAX_DOC_BYTES = 25 * 1024 * 1024; // 25MB
const DOC_SELECT = "id, title, doc_type, year, source_url, storage_path, sort_order, created_at";
const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp", "gif", "heic"]);

interface DocRow {
  id: string;
  product_id: string;
  title: string;
  doc_type: string | null;
  year: number | null;
  source_url: string | null;
  storage_path: string | null;
}

// ── PATCH: edit a document in place — title/type/year, and optionally replace ──
// the uploaded file or the link. Multipart form (same shape as POST). Only the
// fields present in the form are changed.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; documentId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId, documentId } = await params;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("catalog_product_documents")
      .select("id, product_id, title, doc_type, year, source_url, storage_path")
      .eq("id", documentId)
      .maybeSingle();

    const cur = existing as DocRow | null;
    if (!cur || cur.product_id !== productId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {};

    if (formData.has("title")) {
      const t = String(formData.get("title") ?? "").trim();
      if (t) update.title = t; // never blank an existing title
    }
    if (formData.has("doc_type")) {
      update.doc_type = String(formData.get("doc_type") ?? "").trim() || null;
    }
    if (formData.has("year")) {
      const yr = String(formData.get("year") ?? "").trim();
      if (!yr) {
        update.year = null;
      } else {
        const n = parseInt(yr, 10);
        if (!Number.isFinite(n) || n < 0 || n > 9999) {
          return NextResponse.json({ error: "Year must be a 4-digit number" }, { status: 400 });
        }
        update.year = n;
      }
    }

    // Optional source replacement: a new file takes precedence over a link
    const file = formData.get("file");
    let oldPathToRemove: string | null = null;

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
        console.error("[admin/catalog/.../documents PATCH] upload failed:", uploadError.message);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
      update.storage_path = path;
      update.source_url = null;
      if (cur.storage_path) oldPathToRemove = cur.storage_path;
    } else if (formData.has("source_url")) {
      const su = String(formData.get("source_url") ?? "").trim();
      if (su) {
        update.source_url = su;
        update.storage_path = null;
        if (cur.storage_path) oldPathToRemove = cur.storage_path; // swapping an upload for a link
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ document: { ...cur } });
    }

    const { data, error } = await supabaseAdmin
      .from("catalog_product_documents")
      .update(update)
      .eq("id", documentId)
      .select(DOC_SELECT)
      .single();

    if (error) {
      // Roll back a freshly uploaded replacement so we don't orphan it
      if (typeof update.storage_path === "string") {
        try { await supabaseAdmin.storage.from("catalog-documents").remove([update.storage_path]); } catch {}
      }
      console.error("[admin/catalog/.../documents PATCH] update failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up the replaced file only after the row update succeeded
    if (oldPathToRemove) {
      try { await supabaseAdmin.storage.from("catalog-documents").remove([oldPathToRemove]); } catch {}
    }

    return NextResponse.json({ document: data });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../documents PATCH] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update document" },
      { status: 500 }
    );
  }
}

// ── DELETE: remove a document (and its uploaded PDF, if any) ──────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string; documentId: string }> }
): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);
    const { productId, documentId } = await params;

    const { data: doc } = await supabaseAdmin
      .from("catalog_product_documents")
      .select("id, product_id, storage_path")
      .eq("id", documentId)
      .maybeSingle();

    const row = doc as { id: string; product_id: string; storage_path: string | null } | null;
    if (!row || row.product_id !== productId) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Remove the stored PDF first (non-fatal — a missing object shouldn't block the row delete)
    if (row.storage_path) {
      try {
        await supabaseAdmin.storage.from("catalog-documents").remove([row.storage_path]);
      } catch (e) {
        console.warn("[admin/catalog/.../documents DELETE] storage remove failed (non-fatal):", e instanceof Error ? e.message : e);
      }
    }

    const { error } = await supabaseAdmin
      .from("catalog_product_documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      console.error("[admin/catalog/.../documents DELETE] failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, deletedId: documentId });
  } catch (err) {
    if (err instanceof AdminError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("[admin/catalog/.../documents DELETE] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete document" },
      { status: 500 }
    );
  }
}
