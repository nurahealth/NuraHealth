// ─────────────────────────────────────────────────────────────────────────────
// planned_meals persistence helpers — resilient to the `reason` column not yet
// existing. The reason explainer is stored via a NEW migration
// (20260705000001_planned_meals_reason.sql); until that's applied, these helpers
// transparently drop `reason` so generation and the plan views keep working.
//
// Isomorphic: the caller passes the Supabase client (supabaseAdmin on the server,
// the anon browser client on the client), so there's no client/server coupling.
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlannedRow } from "./nutrition";

// A ready-to-insert planned_meals row (engine row + owner/date context).
export interface PlannedMealInsert {
  user_id: string;
  plan_date: string;
  meal_slot: string;
  recipe_id: string;
  target_marker_slug: string | null;
  order_index: number;
  reason: string | null;
}

// PostgREST signals a missing column with 42703 (undefined_column) or PGRST204
// (not found in schema cache). We only ever add/omit `reason`, so match on that.
function isMissingReasonColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === "42703" || err.code === "PGRST204") return true;
  return /reason/i.test(err.message ?? "") && /(column|schema cache)/i.test(err.message ?? "");
}

// Turn engine rows into insert rows for a given user + date.
export function toInsertRows(rows: PlannedRow[], userId: string, planDate: string): PlannedMealInsert[] {
  return rows.map((r) => ({
    user_id: userId,
    plan_date: planDate,
    meal_slot: r.meal_slot,
    recipe_id: r.recipe_id,
    target_marker_slug: r.target_marker_slug,
    order_index: r.order_index,
    reason: r.reason,
  }));
}

// Insert planned_meals rows, retrying without `reason` if that column is absent.
// Returns an error object on failure (null on success), mirroring supabase-js.
export async function insertPlannedMeals(
  client: SupabaseClient,
  rows: PlannedMealInsert[],
): Promise<{ message: string } | null> {
  if (rows.length === 0) return null;
  const { error } = await client.from("planned_meals").insert(rows);
  if (!error) return null;
  if (isMissingReasonColumn(error)) {
    const stripped = rows.map(({ user_id, plan_date, meal_slot, recipe_id, target_marker_slug, order_index }) => ({
      user_id, plan_date, meal_slot, recipe_id, target_marker_slug, order_index,
    }));
    const retry = await client.from("planned_meals").insert(stripped);
    return retry.error ? { message: retry.error.message } : null;
  }
  return { message: error.message };
}

// Update one planned_meals row (swap / retarget), retrying without `reason` if
// that column isn't there yet. Returns an error object on failure (null on ok).
export async function updatePlannedMeal(
  client: SupabaseClient,
  id: string,
  userId: string,
  fields: { recipe_id?: string; target_marker_slug: string | null; reason: string | null },
): Promise<{ message: string } | null> {
  const { error } = await client.from("planned_meals").update(fields).eq("id", id).eq("user_id", userId);
  if (!error) return null;
  if (isMissingReasonColumn(error)) {
    const rest: { recipe_id?: string; target_marker_slug: string | null } = { target_marker_slug: fields.target_marker_slug };
    if (fields.recipe_id !== undefined) rest.recipe_id = fields.recipe_id;
    const retry = await client.from("planned_meals").update(rest).eq("id", id).eq("user_id", userId);
    return retry.error ? { message: retry.error.message } : null;
  }
  return { message: error.message };
}

// Run a planned_meals SELECT that includes `reason`; if the column doesn't exist
// yet, retry without it. `build(extraCols)` must return the awaitable query with
// `extraCols` appended to its select list (e.g. `, reason`).
export async function selectPlannedMealsWithReason<T>(
  build: (extraCols: string) => PromiseLike<{ data: unknown; error: { code?: string; message?: string } | null }>,
): Promise<T[]> {
  const withReason = await build(", reason");
  if (!withReason.error) return (withReason.data ?? []) as T[];
  if (isMissingReasonColumn(withReason.error)) {
    const without = await build("");
    return (without.data ?? []) as T[];
  }
  return (withReason.data ?? []) as T[];
}
