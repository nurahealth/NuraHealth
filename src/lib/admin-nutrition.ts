// Shared helpers for the Nutrition admin API routes (recipes + ingredients).
// Writes always go through these on the server with the service-role client
// (supabaseAdmin), exactly like the Lab catalog admin — the service key is
// never exposed to the browser.
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Enums (kept in sync with the public /recipes and /foods pages) ────────────
export const RECIPE_CATEGORIES = ["breakfast", "lunch", "dinner", "baking", "snack", "drink"] as const;
export const INGREDIENT_CATEGORIES = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit", "grains", "staple"] as const;
export const STATUSES = ["draft", "published"] as const;

// Build recipe_ingredients rows from a payload's `ingredients` array. Skips rows
// without an ingredient_id and DEDUPES by ingredient_id (keeping the first
// occurrence) — recipe_ingredients has a UNIQUE(recipe_id, ingredient_id)
// constraint, so a duplicate would abort the whole batch insert (23505) and, in
// replaceLinks, that abort lands AFTER the delete has already cleared the old
// links. Order is renumbered sequentially over the survivors.
export interface RecipeLinkRow {
  recipe_id: string;
  ingredient_id: string;
  amount_text: string | null;
  primary_system: string | null;
  context_note: string | null;
  order_index: number;
}
export function buildLinkRows(recipeId: string, links: unknown): RecipeLinkRow[] {
  if (!Array.isArray(links)) return [];
  const seen = new Set<string>();
  const rows: RecipeLinkRow[] = [];
  for (const l of links) {
    const o = (l ?? {}) as Record<string, unknown>;
    const ingredient_id = typeof o.ingredient_id === "string" ? o.ingredient_id : "";
    if (!ingredient_id || seen.has(ingredient_id)) continue;
    seen.add(ingredient_id);
    rows.push({
      recipe_id: recipeId,
      ingredient_id,
      amount_text: typeof o.amount_text === "string" && o.amount_text.trim() ? o.amount_text.trim() : null,
      primary_system: typeof o.primary_system === "string" && o.primary_system.trim() ? o.primary_system.trim() : null,
      context_note: typeof o.context_note === "string" && o.context_note.trim() ? o.context_note.trim() : null,
      order_index: rows.length + 1,
    });
  }
  return rows;
}

// PostgREST/Postgres report an unknown column as PGRST204 / 42703. Lets writes
// degrade gracefully when an optional column (e.g. image_url) hasn't been
// migrated yet, instead of failing the whole insert/update.
export function isMissingColumnError(err: { code?: string; message?: string } | null, column: string): boolean {
  if (!err) return false;
  const code = err.code ?? "";
  return (code === "42703" || code === "PGRST204") && (err.message ?? "").includes(column);
}

// Optional recipe columns added by later migrations; dropped from writes if the
// target DB hasn't run the migration yet.
export const RECIPE_OPTIONAL_COLS = ["image_url", "focal_x", "focal_y"];

// Run an insert/update of a recipes row, progressively dropping any optional
// photo column the DB doesn't have yet. Returns the row plus which optional
// columns were dropped (so the UI can warn, e.g. "photo not saved").
export async function writeRecipeResilient(
  run: (row: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>,
  row: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null; dropped: string[] }> {
  const payload = { ...row };
  const dropped: string[] = [];
  for (let i = 0; i <= RECIPE_OPTIONAL_COLS.length; i++) {
    const { data, error } = await run(payload);
    if (!error) return { data, error: null, dropped };
    const code = error.code ?? "";
    const missing = (code === "42703" || code === "PGRST204")
      ? RECIPE_OPTIONAL_COLS.find((c) => c in payload && (error.message ?? "").includes(c))
      : undefined;
    if (!missing) return { data: null, error: { message: error.message ?? "Write failed" }, dropped };
    delete payload[missing];
    dropped.push(missing);
  }
  return { data: null, error: { message: "Write failed" }, dropped };
}

// ── Slug helpers ──────────────────────────────────────────────────────────────
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

// True if another row in `table` already owns `slug` (excluding `excludeId` on edit).
export async function slugTaken(
  table: "recipes" | "ingredients",
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const { data } = await supabaseAdmin.from(table).select("id").eq("slug", slug);
  const rows = (data ?? []) as { id: string }[];
  return rows.some((r) => r.id !== excludeId);
}

// ── JSON normalizers ──────────────────────────────────────────────────────────
// Tag/multi-select inputs → clean string[] (trimmed, de-duped, non-empty).
export function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of v) {
    const s = typeof item === "string" ? item.trim() : "";
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

// Repeatable text rows → [{ n, text }] (auto-numbered, blank rows dropped).
// Accepts either ["step one", …] or [{ text }] / [{ n, text }].
export function toNumberedSteps(v: unknown): { n: number; text: string }[] {
  if (!Array.isArray(v)) return [];
  const texts = v
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "text" in item) {
        const t = (item as { text?: unknown }).text;
        return typeof t === "string" ? t.trim() : "";
      }
      return "";
    })
    .filter((t) => t.length > 0);
  return texts.map((text, i) => ({ n: i + 1, text }));
}

// cellular_explainer → [{ heading, body }] (a block needs at least one field).
export function toBlocks(v: unknown): { heading: string; body: string }[] {
  if (!Array.isArray(v)) return [];
  const out: { heading: string; body: string }[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const heading = typeof (item as { heading?: unknown }).heading === "string" ? (item as { heading: string }).heading.trim() : "";
    const body = typeof (item as { body?: unknown }).body === "string" ? (item as { body: string }).body.trim() : "";
    if (heading || body) out.push({ heading, body });
  }
  return out;
}
