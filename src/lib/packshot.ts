import sharp from "sharp";
import { supabaseAdmin } from "./supabase-admin";

// ── Packshot normalisation ────────────────────────────────────────────────────
// Brands ship product photography in wildly different shapes: transparent PNGs
// cropped tight to the wrapper (IQ Bar is 1206×3466), 2:1 landscape JPEGs with
// large white margins (Larabar), 1:1 squares (Clif), and some on a flat brand
// tint rather than white (Perfect Bar, ALOHA). Dropped into a grid as-is they
// look like a junk drawer.
//
// Every source is reduced to the same asset: background removed to TRANSPARENT
// (never white — a white plate on a dark card reads as a box floating inside
// the tile instead of a product sitting on it), trimmed to the product's true
// bounding box, then re-centred on a fixed square canvas with a consistent
// margin. Output is a PNG with alpha, so the card's own surface shows through
// and the tile is seamless in either theme.

const CANVAS = 1000;
// Margin left on the tightest edge, as a fraction of the canvas. Enough that a
// landscape bar is not hugging the tile edge, tight enough that it still reads
// at the same optical weight as a tall product like a bottle.
const PAD = 0.08;
// Ceiling on how much of the canvas a product may cover. Keeps a landscape bar
// and a tall bottle at comparable visual weight in the same grid.
const MAX_AREA = 0.2;
// How far a pixel may drift from the sampled backdrop and still count as
// background.
const KEY_TOLERANCE = 26;
// Alpha above which a pixel counts as product when measuring the bounding box.
const SOLID = 24;
// Model used for background removal. The medium model cuts noticeably cleaner
// edges on packaging than the small one. Keep in sync with next.config.ts,
// which ships only this model's files with the server functions.
const BG_MODEL = "medium" as const;
// A cutout whose subject covers less than this fraction of the frame lost the
// product; more than the upper bound, and it removed nothing.
const CUTOUT_MIN = 0.03;
const CUTOUT_MAX = 0.97;
// Inputs are capped before inference — the model works at ~1024 px anyway,
// and a 4000 px phone photo is a lot of memory for nothing.
const CUTOUT_INPUT_MAX = 2000;

export interface PackshotMeta {
  sourceW: number;
  sourceH: number;
  keyedTint: string | null;
  /** Fraction of the source the product occupies once the backdrop is removed. */
  coverage: number;
  /** Whether this looks like studio product photography rather than a snapshot. */
  isPackshot: boolean;
  /** Why the gate rejected it, when it did. */
  rejected?: string;
  /** The classifier rejected it, so the background was removed by the model. */
  cutout?: boolean;
  /** Fraction of the cutout frame the model kept as subject. */
  subjectCoverage?: number;
}

export interface PackshotResult {
  ok: boolean;
  url?: string;
  error?: string;
  meta?: PackshotMeta;
}

interface RGB { r: number; g: number; b: number }

const near = (a: RGB, b: RGB, tol: number) =>
  Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol;

/**
 * Erase a flat backdrop by flood-filling inward from the border.
 *
 * A global colour replace would also punch holes through the product wherever
 * its packaging happens to use the same shade — a white RXBAR wrapper on a
 * white backdrop would lose its middle. Filling only from the edges means
 * anything enclosed by product pixels is untouched.
 */
function keyBackdrop(data: Buffer, width: number, height: number, backdrop: RGB): void {
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
    const o = i * 4;
    if (data[o + 3] === 0) {
      // Already transparent — keep walking through it.
    } else {
      const px = { r: data[o], g: data[o + 1], b: data[o + 2] };
      if (!near(px, backdrop, KEY_TOLERANCE)) continue;
      data[o + 3] = 0;
    }
    const x = i % width;
    const y = (i / width) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
}

/** Tightest rectangle containing every non-transparent pixel. */
function boundingBox(data: Buffer, width: number, height: number) {
  let top = -1, left = width, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < SOLID) continue;
      if (top === -1) top = y;
      bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }
  if (top === -1 || right === -1) return null;
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}


async function fetchImage(sourceUrl: string): Promise<Buffer | { error: string }> {
  try {
    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "NURA-catalog/1.0 (+https://nura.health)" },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { error: `source returned ${res.status}` };
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return { error: `source is ${type || "not an image"}` };
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    return { error: e instanceof Error ? e.message : "fetch failed" };
  }
}

/**
 * Cut the subject out of a photo with a real scene behind it.
 *
 * Flat-backdrop keying cannot help here — there is no single colour to key —
 * so the ONNX segmentation model separates product from background. It is
 * imported dynamically: the model and runtime are server-only and large, and
 * must never be pulled into a client bundle or loaded by routes that don't
 * process images.
 */
async function removeBackgroundCutout(input: Buffer): Promise<
  | { data: Buffer; info: { width: number; height: number }; subjectCoverage: number }
  | { error: string }
> {
  try {
    const png = await sharp(input, { failOn: "none" })
      .resize(CUTOUT_INPUT_MAX, CUTOUT_INPUT_MAX, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    const { removeBackground } = await import("@imgly/background-removal-node");
    const blob = await removeBackground(new Blob([new Uint8Array(png)], { type: "image/png" }), {
      model: BG_MODEL,
      output: { format: "image/png" },
    });
    const { data, info } = await sharp(Buffer.from(await blob.arrayBuffer()))
      .ensureAlpha()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Sanity check. The model always returns *something*; a cutout that kept
    // a sliver, or kept the whole frame, is a failure dressed as a result.
    let solid = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] >= SOLID) solid++;
    const subjectCoverage = solid / (info.width * info.height);
    const pct = `${(subjectCoverage * 100).toFixed(1)}%`;
    if (subjectCoverage < CUTOUT_MIN) return { error: `background removal kept almost nothing (${pct} subject)` };
    if (subjectCoverage > CUTOUT_MAX) return { error: `background removal removed almost nothing (${pct} subject)` };
    return { data, info, subjectCoverage };
  } catch (e) {
    return { error: `background removal failed: ${e instanceof Error ? e.message : "unknown error"}` };
  }
}

/** Trim to the product, size it, and centre it on the transparent canvas. */
async function fitToCanvas(
  data: Buffer,
  info: { width: number; height: number },
  box: { left: number; top: number; width: number; height: number }
): Promise<Buffer> {
  const cropped = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(box)
    .png()
    .toBuffer();

  // Size the product, then pad out to the canvas.
  //
  // Two constraints. It must fit inside the inner box so it never touches the
  // tile edge. And its area must not exceed a ceiling: fitting purely by
  // bounding box makes a wide bar span the full width and read far heavier
  // than a tall bottle of the same height, so anything over the ceiling is
  // scaled down until it carries the same optical weight.
  const inner = Math.round(CANVAS * (1 - PAD * 2));
  const fitScale = Math.min(inner / box.width, inner / box.height);
  let w = box.width * fitScale;
  let h = box.height * fitScale;
  const areaFraction = (w * h) / (CANVAS * CANVAS);
  if (areaFraction > MAX_AREA) {
    const k = Math.sqrt(MAX_AREA / areaFraction);
    w *= k;
    h *= k;
  }
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));

  const fitted = await sharp(cropped)
    .resize(w, h, { fit: "fill" })
    .png()
    .toBuffer();

  // Centre it by padding to the canvas. Note this is an extend, not a second
  // resize: resizing again here would scale the product back up to fill the
  // canvas and destroy the margin we just created.
  const left = Math.floor((CANVAS - w) / 2);
  const top = Math.floor((CANVAS - h) / 2);
  return sharp(fitted)
    .extend({
      left,
      right: CANVAS - w - left,
      top,
      bottom: CANVAS - h - top,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Turn any source image into a transparent-background product cutout.
 *
 * Studio packshots (transparent, or on a flat backdrop that keys away) take
 * the cheap exact path. Anything the classifier calls a photo is cut out by
 * the segmentation model instead. There is no third outcome: the result is
 * a transparent cutout or an error — never the original photo.
 */
export async function normalisePackshot(sourceUrl: string): Promise<
  | { buffer: Buffer; meta: PackshotMeta }
  | { error: string; meta?: PackshotMeta }
> {
  const input = await fetchImage(sourceUrl);
  if (!Buffer.isBuffer(input)) return input;

  try {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    const sourceW = meta.width ?? 0;
    const sourceH = meta.height ?? 0;
    if (!sourceW || !sourceH) return { error: "could not read image dimensions" };

    const { data, info } = await sharp(input, { failOn: "none" })
      .ensureAlpha()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Sample the corners. If they agree, that is the backdrop and it gets
    // erased — white, brand tint, or anything else flat.
    const at = (x: number, y: number): RGB => {
      const o = (y * info.width + x) * 4;
      return { r: data[o], g: data[o + 1], b: data[o + 2] };
    };
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
    const pts: [number, number][] = [
      [1, 1], [info.width - 2, 1], [1, info.height - 2], [info.width - 2, info.height - 2],
    ];
    const opaqueCorners = pts.filter(([x, y]) => alphaAt(x, y) > SOLID);

    let keyedTint: string | null = null;
    // Three possible backdrops. Already transparent (the brand cut it out —
    // the ideal case), a flat colour we can key away, or a real scene we
    // cannot. The first two are product photography; the third is a snapshot.
    let backdrop: "transparent" | "keyed" | "scene" =
      opaqueCorners.length === 0 ? "transparent" : "scene";
    if (opaqueCorners.length) {
      const c0 = at(...opaqueCorners[0]);
      if (opaqueCorners.every(([x, y]) => near(at(x, y), c0, 14))) {
        keyBackdrop(data, info.width, info.height, c0);
        keyedTint = `rgb(${c0.r},${c0.g},${c0.b})`;
        backdrop = "keyed";
      }
    }

    const box = boundingBox(data, info.width, info.height);

    // ── Is this actually product photography? ──────────────────────────────
    // Studio packshots sit on a flat backdrop, so the corners agree and the
    // backdrop keys away cleanly, leaving the product occupying part of the
    // frame. A snapshot — a bar on a carpet, in someone's hand, on a table —
    // has corners that disagree, nothing keys, and the "product" ends up being
    // the entire image. Those two facts separate the two cases reliably and
    // cheaply.
    const coverage = box ? (box.width * box.height) / (info.width * info.height) : 0;
    let rejected: string | undefined;
    if (!box) rejected = "image is entirely background";
    else if (backdrop === "scene") rejected = "background is a scene, not a flat backdrop";
    else if (backdrop === "keyed" && coverage > 0.92) {
      rejected = "product fills the frame — likely a photo, not a packshot";
    }

    if (!rejected && box) {
      const buffer = await fitToCanvas(data, info, box);
      return { buffer, meta: { sourceW, sourceH, keyedTint, coverage, isPackshot: true } };
    }

    // ── Not a packshot: cut the product out of the photo ───────────────────
    // Starts again from the original pixels — a partial key from the flat-
    // backdrop pass would only confuse the model.
    const base: PackshotMeta = { sourceW, sourceH, keyedTint: null, coverage, isPackshot: false, rejected };
    const cut = await removeBackgroundCutout(input);
    if ("error" in cut) return { error: cut.error, meta: { ...base, cutout: false } };
    const cutBox = boundingBox(cut.data, cut.info.width, cut.info.height);
    if (!cutBox) return { error: "background removal left no subject", meta: { ...base, cutout: false } };

    const buffer = await fitToCanvas(cut.data, cut.info, cutBox);
    return { buffer, meta: { ...base, cutout: true, subjectCoverage: cut.subjectCoverage } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "processing failed" };
  }
}

/**
 * Normalise a source image and store the transparent cutout in the public
 * catalog-images bucket. Nothing but a cutout is ever stored: when neither
 * keying nor background removal produces a clean one, this fails and stores
 * nothing, and the caller decides between dropping the image and dropping the
 * product.
 */
export async function storePackshot(sourceUrl: string): Promise<PackshotResult> {
  const out = await normalisePackshot(sourceUrl);
  if ("error" in out) return { ok: false, error: out.error, meta: out.meta };

  const path = `products/${crypto.randomUUID()}.png`;
  const { error } = await supabaseAdmin.storage
    .from("catalog-images")
    .upload(path, out.buffer, { contentType: "image/png", upsert: false });
  if (error) return { ok: false, error: `upload failed: ${error.message}`, meta: out.meta };

  const { data } = supabaseAdmin.storage.from("catalog-images").getPublicUrl(path);
  return { ok: true, url: data.publicUrl, meta: out.meta };
}
