import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

export const maxDuration = 60;

const ALLOWED = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

// ── POST: upload a product image to the public `catalog-images` bucket ──────────
// Multipart form with a single `file` field. Authenticated with the same Bearer
// admin check as the other catalog routes; the actual upload runs through the
// service role so no per-user storage policies are needed.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdminFromRequest(req);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.has(ext)) {
      return NextResponse.json({ error: "Use JPG, PNG, WEBP, GIF, or AVIF" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `products/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("catalog-images")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[admin/catalog/products/upload-image] upload failed:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const url = supabaseAdmin.storage.from("catalog-images").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/products/upload-image] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
