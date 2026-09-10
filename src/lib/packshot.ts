import sharp from "sharp";
import { supabaseAdmin } from "./supabase-admin";

// ── Packshot normalisation ────────────────────────────────────────────────────
// Brands ship product photography in wildly different shapes: transparent PNGs
// cropped tight to the wrapper (IQ Bar is 1206×3466), 2:1 landscape JPEGs with
// huge white margins (Larabar), 1:1 squares (Clif), and a few on a flat brand
// tint instead of white (Perfect Bar, ALOHA). Dropped into a grid as-is they
// look like a junk drawer.
//
// This turns any of them into the same asset: product centred on white, trimmed
// of its original margin, re-padded to a fixed proportion, square, same pixel
// size every time.

const CANVAS = 1000;
// Fraction of the canvas left as breathing room on the tightest edge.
const PAD = 0.1;
const WHITE = { r: 255, g: 255, b: 255 };

export interface PackshotResult {
  ok: boolean;
  url?: string;
  error?: string;
  meta?: { sourceW: number; sourceH: number; keyedTint: string | null };
}

function near(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  tol: number
): boolean {
  return (
    Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol
  );
}

/**
 * Replace a flat background tint with white by flood-filling inward from the
 * border. A global colour replace would also punch holes in the product itself
 * wherever the packaging happens to use the same shade — filling only from the
 * edges means the product is never touched.
 */
function keyOutBorder(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  tint: { r: number; g: number; b: number },
  tol: number
): void {
  const seen = new Uint8Array(width * height);
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (seen[i]) return;
    seen[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }

  while (stack.length) {
    const i = stack.pop()!;
    const o = i * channels;
    const px = { r: data[o], g: data[o + 1], b: data[o + 2] };
    if (!near(px, tint, tol)) continue;
    data[o] = 255; data[o + 1] = 255; data[o + 2] = 255;
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}

export async function normalisePackshot(sourceUrl: string): Promise<{
  buffer: Buffer;
  meta: { sourceW: number; sourceH: number; keyedTint: string | null };
} | { error: string }> {
  let input: Buffer;
  try {
    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "NURA-catalog/1.0 (+https://nura.health)" },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { error: `source returned ${res.status}` };
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return { error: `source is ${type || "not an image"}` };
    input = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "fetch failed" };
  }

  try {
    const probe = sharp(input, { failOn: "none" });
    const meta = await probe.metadata();
    const sourceW = meta.width ?? 0;
    const sourceH = meta.height ?? 0;
    if (!sourceW || !sourceH) return { error: "could not read image dimensions" };

    // Composite onto white first so transparency and tint are handled the same.
    const flat = await sharp(input, { failOn: "none" })
      .flatten({ background: WHITE })
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = flat;
    const ch = info.channels;

    // Sample the four corners. If they agree on a colour that is not white,
    // that is a flat brand-tint backdrop and it gets keyed out.
    const at = (x: number, y: number) => {
      const o = (y * info.width + x) * ch;
      return { r: data[o], g: data[o + 1], b: data[o + 2] };
    };
    const corners = [
      at(1, 1),
      at(info.width - 2, 1),
      at(1, info.height - 2),
      at(info.width - 2, info.height - 2),
    ];
    let keyedTint: string | null = null;
    const c0 = corners[0];
    const agree = corners.every((c) => near(c, c0, 12));
    const isWhite = near(c0, WHITE, 10);
    if (agree && !isWhite) {
      keyOutBorder(data, info.width, info.height, ch, c0, 26);
      keyedTint = `rgb(${c0.r},${c0.g},${c0.b})`;
    }

    const keyed = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: ch as 3 | 4 },
    })
      .png()
      .toBuffer();

    // Trim the now-white margin, then rebuild it to a fixed proportion so every
    // product ends up optically the same size in the grid.
    const inner = Math.round(CANVAS * (1 - PAD * 2));
    const trimmed = await sharp(keyed)
      .trim({ background: WHITE, threshold: 12 })
      .toBuffer()
      .catch(() => keyed);

    // Scale the product to fill the inner box, then centre it on the full
    // canvas — every output is CANVAS×CANVAS with the same margin.
    const scaled = await sharp(trimmed)
      .resize(inner, inner, { fit: "inside", withoutEnlargement: false })
      .toBuffer();

    const buffer = await sharp(scaled)
      .resize(CANVAS, CANVAS, { fit: "contain", background: WHITE })
      .flatten({ background: WHITE })
      .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
      .toBuffer();

    return { buffer, meta: { sourceW, sourceH, keyedTint } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "processing failed" };
  }
}

/** Normalise a source image and store it in the public catalog-images bucket. */
export async function storePackshot(sourceUrl: string): Promise<PackshotResult> {
  const out = await normalisePackshot(sourceUrl);
  if ("error" in out) return { ok: false, error: out.error };

  const path = `products/${crypto.randomUUID()}.jpg`;
  const { error } = await supabaseAdmin.storage
    .from("catalog-images")
    .upload(path, out.buffer, { contentType: "image/jpeg", upsert: false });
  if (error) return { ok: false, error: `upload failed: ${error.message}` };

  const { data } = supabaseAdmin.storage.from("catalog-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl, meta: out.meta };
}
