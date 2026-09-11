// Shared parsing/validation for the editable catalog product fields.
// Used by both the POST (create) and PATCH (update) admin routes so the two
// stay in lockstep. Only keys actually present in the body are returned, which
// preserves PATCH's partial-update semantics.

export class ProductFieldError extends Error {}

function trimmedOrNull(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
}

// Flatten an arbitrary value into a plain { key: string } object, dropping
// empty keys and null/undefined values. Anything non-string is stringified.
function normalizeProperties(v: unknown): Record<string, string> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const key = k.trim();
    if (!key) continue;
    if (val === null || val === undefined) continue;
    out[key] = typeof val === "string" ? val : String(val);
  }
  return out;
}

/**
 * Build the column updates for the extended product fields from a request body.
 * Only includes keys present in `body`. Throws ProductFieldError on invalid input.
 */
export function buildProductFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if ("score" in body) {
    const v = body.score;
    if (v === null || v === "") {
      out.score = null;
    } else {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new ProductFieldError("Score must be a number between 0 and 100");
      out.score = Math.max(0, Math.min(100, Math.round(n)));
    }
  }

  if ("lab_tested" in body) {
    out.lab_tested = body.lab_tested === true;
  }

  // Three-state: true / false / null (unknown)
  if ("microplastics_present" in body) {
    const v = body.microplastics_present;
    out.microplastics_present = v === true ? true : v === false ? false : null;
  }

  if ("score_rationale" in body) out.score_rationale = trimmedOrNull(body.score_rationale);
  // The declared ingredient list. Importers send this; without it here the
  // field was silently dropped and "What's inside" had nothing to render.
  if ("description" in body) out.description = trimmedOrNull(body.description);
  if ("shop_url" in body) out.shop_url = trimmedOrNull(body.shop_url);
  if ("affiliate_url" in body) out.affiliate_url = trimmedOrNull(body.affiliate_url);
  if ("image_url" in body) out.image_url = trimmedOrNull(body.image_url);

  // Stored as an integer count of cents; the UI sends already-converted cents.
  if ("price_cents" in body) {
    const v = body.price_cents;
    if (v === null || v === "") {
      out.price_cents = null;
    } else {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) throw new ProductFieldError("Price must be a positive amount");
      out.price_cents = Math.round(n);
    }
  }

  if ("properties" in body) {
    out.properties = normalizeProperties(body.properties);
  }

  return out;
}
