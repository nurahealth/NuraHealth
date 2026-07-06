import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";

export const maxDuration = 60;

// Recipe photos: JPEG/PNG/WebP only, capped at 5MB. Mirrors the catalog
// product-image upload — same Bearer admin check, upload via the service role
// (so no per-user storage policies are needed), returns a public URL.
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_TO_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "recipe";
}

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
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const name = (file.name || "").toLowerCase();
    const ext = name.includes(".") ? name.split(".").pop()! : "";
    if (file.type === "image/heic" || file.type === "image/heif" || ext === "heic" || ext === "heif") {
      return NextResponse.json({ error: "HEIC isn't supported — export as JPEG or PNG first." }, { status: 400 });
    }
    // Accept by extension OR MIME — drag-dropped files often have an empty type.
    const okExt = ALLOWED_EXT.has(ext);
    const okMime = file.type ? ALLOWED_MIME.has(file.type) : false;
    if (!okExt && !okMime) {
      return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image" }, { status: 400 });
    }

    const slugRaw = formData.get("slug");
    const slug = slugify(typeof slugRaw === "string" ? slugRaw : "recipe");
    const finalExt = okExt ? ext : (MIME_TO_EXT[file.type] ?? "jpg");
    const path = `recipes/${slug}-${Date.now()}.${finalExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from("recipe-images")
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("[admin/recipes/upload-image] upload failed:", uploadError.message);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const url = supabaseAdmin.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ url, path });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/recipes/upload-image] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
