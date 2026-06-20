// Shared helpers for the Nutrition admin API routes (recipes + ingredients).
// Writes always go through these on the server with the service-role client
// (supabaseAdmin), exactly like the Lab catalog admin — the service key is
// never exposed to the browser.
import { supabaseAdmin } from "@/lib/supabase-admin";

// ── Enums (kept in sync with the public /recipes and /foods pages) ────────────
export const RECIPE_CATEGORIES = ["breakfast", "lunch", "dinner", "baking", "snack", "drink"] as const;
export const INGREDIENT_CATEGORIES = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit"] as const;
export const STATUSES = ["draft", "published"] as const;

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
