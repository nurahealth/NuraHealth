import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdminFromRequest, AdminError } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { storePackshot } from "@/lib/packshot";

// Bring existing catalogue images up to the cutout standard.
//
// Walks products (optionally one category), downloads each current image and
// checks whether it has any transparency. A fully opaque image is a photo or a
// flat-backdrop shot that was stored before every image became a cutout; it
// is run through the same pipeline as a new import — flat backdrops keyed
// away, real scenes through background removal — re-stored, and the product
// pointed at the new file. A product whose image won't cut out cleanly is
// reported and left untouched: the backfill never deletes an image.
//
// POST { category?: string, limit?: number (default 50, cap 100), dry_run?: boolean, after?: string }
// `limit` caps how many opaque images are reprocessed in one call. Products
// whose image already has transparency are counted and passed over. Pass the
// returned `next_after` back as `after` to resume past this call's products —
// otherwise images that failed are retried first on every call.

export const runtime = "nodejs";
export const maxDuration = 300;

const PAGE = 500;
// Leave headroom under maxDuration so the response always gets written.
const TIME_BUDGET_MS = 270_000;

/** True when the image is a genuine CUTOUT — not merely letterboxed.
 *  The store pads every image with transparent margins, so "has a transparent
 *  pixel" is meaningless. A photo's opaque pixels form a near-solid rectangle;
 *  a real cutout's silhouette fills far less of its own bounding box. */
async function hasTransparency(url: string): Promise<boolean | { error: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000), cache: "no-store" });
    if (!res.ok) return { error: `image returned ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    const img = sharp(buf, { failOn: "none" });
    const meta = await img.metadata();
    if (!meta.hasAlpha) return false; // no alpha channel at all = definitely a photo
    // Trim transparent padding to the opaque bounding box, then measure how much
    // of that box the opaque pixels actually cover.
    const trimmed = sharp(buf, { failOn: "none" }).trim({ threshold: 10 });
    const { data, info } = await trimmed.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let opaque = 0;
    const total = info.width * info.height;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 128) opaque++;
    const coverage = total > 0 ? opaque / total : 1;
    // >= 90% of the bounding box opaque = a rectangle = a photo, not a cutout.
    return coverage < 0.9;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "could not read image" };
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const started = Date.now();
  try {
    await requireAdminFromRequest(req);

    const body = (await req.json().catch(() => ({}))) as {
      category?: string;
      limit?: number;
      dry_run?: boolean;
      after?: string;
    };
    const limit = Math.min(Math.max(Math.floor(Number(body.limit ?? 50)) || 50, 1), 100);
    const dryRun = body.dry_run === true;

    let categoryId: string | null = null;
    const categorySlug = body.category?.trim();
    if (categorySlug) {
      const { data: cat, error } = await supabaseAdmin
        .from("catalog_categories")
        .select("id")
        .eq("slug", categorySlug.toLowerCase())
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!cat) return NextResponse.json({ error: `Unknown category "${categorySlug}"` }, { status: 400 });
      categoryId = (cat as { id: string }).id;
    }

    let scanned = 0;
    let alreadyTransparent = 0;
    let reprocessed = 0;
    let opaqueFound = 0;
    let timedOut = false;
    let lastId: string | null = null;
    const failed: { name: string; reason: string }[] = [];
    const wouldReprocess: string[] = [];

    outer: for (let from = 0; ; from += PAGE) {
      let q = supabaseAdmin
        .from("catalog_products")
        .select("id, name, image_url")
        .not("image_url", "is", null)
        .order("id")
        .range(from, from + PAGE - 1);
      if (categoryId) q = q.eq("category_id", categoryId);
      if (body.after) q = q.gt("id", body.after);
      const { data: rows, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!rows?.length) break;

      for (const row of rows as { id: string; name: string; image_url: string | null }[]) {
        if (opaqueFound >= limit) break outer;
        if (Date.now() - started > TIME_BUDGET_MS) { timedOut = true; break outer; }
        lastId = row.id;
        const url = row.image_url?.trim();
        if (!url) continue;

        scanned++;
        const transparent = await hasTransparency(url);
        if (typeof transparent === "object") {
          failed.push({ name: row.name, reason: transparent.error });
          continue;
        }
        if (transparent) { alreadyTransparent++; continue; }

        opaqueFound++;
        if (dryRun) { wouldReprocess.push(row.name); continue; }

        const shot = await storePackshot(url);
        if (!shot.ok || !shot.url) {
          failed.push({ name: row.name, reason: shot.error ?? "no clean cutout" });
          continue;
        }
        const { error: upErr } = await supabaseAdmin
          .from("catalog_products")
          .update({ image_url: shot.url })
          .eq("id", row.id);
        if (upErr) {
          failed.push({ name: row.name, reason: `update failed: ${upErr.message}` });
          continue;
        }
        reprocessed++;
      }
      if (rows.length < PAGE) break;
    }

    return NextResponse.json({
      scanned,
      already_transparent: alreadyTransparent,
      reprocessed,
      failed,
      ...(dryRun ? { dry_run: true, would_reprocess: wouldReprocess } : {}),
      ...(timedOut ? { stopped_early: "time budget reached — call again with next_after to continue" } : {}),
      next_after: lastId,
    });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/catalog/images/backfill] unexpected:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backfill failed" },
      { status: 500 }
    );
  }
}
