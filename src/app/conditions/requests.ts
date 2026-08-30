"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Conditions — "request a condition".
//
// The library is finite and the section's whole promise is "what you're dealing
// with". When it isn't in here, the index offers a way to say so. Rows land in
// `condition_requests` (owner-reviewed), which is the exact shape and RLS
// pattern as `exercise_requests` — see submitExerciseRequest in
// app/fitness/planData.ts, which this mirrors deliberately.
//
// FAILS GRACEFULLY BY DESIGN. The table is created by hand in the Supabase SQL
// editor (migrations in this repo are stale — see BRAIN.md), so until that runs
// every insert returns a PostgREST "relation does not exist" error. That must
// read as a friendly "couldn't send" in the UI rather than an exception, so the
// caller only ever sees { ok: false } and the console carries the detail.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/lib/supabase";

export interface ConditionRequestResult {
  ok: boolean;
  /** Diagnostic only — never rendered. The modal shows its own copy. */
  error?: string;
}

export async function submitConditionRequest(
  name: string,
  details: string | null
): Promise<ConditionRequestResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Empty name." };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };

    const { error } = await supabase.from("condition_requests").insert({
      user_id: user.id,
      name: trimmed,
      details: details?.trim() || null,
    });

    if (error) {
      console.error("[conditions] condition request failed", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    // Network drop, or the table not existing yet — same user-facing outcome.
    console.error("[conditions] condition request threw", e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error." };
  }
}
