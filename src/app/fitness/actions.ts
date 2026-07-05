'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// Answers collected by the fitness onboarding flow. Mirrors the columns on the
// `fitness_profiles` table (minus the bookkeeping columns).
export interface FitnessProfileData {
  primary_goal: string;
  experience_level: string;
  equipment: string[];
  days_per_week: number | null;
  limitations: string;
}

export type SaveFitnessResult = { ok: true } | { ok: false; error: string };

// Upserts the signed-in user's fitness profile and marks onboarding complete.
// Uses the user-scoped server client so RLS guarantees a user can only write
// their own row. Unlike the main onboarding action this does NOT redirect — the
// /fitness page flips from the flow to the home view in place.
export async function saveFitnessOnboarding(data: FitnessProfileData): Promise<SaveFitnessResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { error } = await supabase
    .from('fitness_profiles')
    .upsert(
      {
        user_id: user.id,
        primary_goal: data.primary_goal || null,
        experience_level: data.experience_level || null,
        equipment: data.equipment,
        days_per_week: data.days_per_week,
        limitations: data.limitations || null,
        onboarded: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Plan Settings (post-onboarding customisation) ────────────────────────────

// The full set of knobs the Plan Settings screen can change. `split`,
// `focus_areas` and `session_length` are newer columns (migration
// 20260619000001); the rest already exist from onboarding.
export interface PlanSettingsData {
  primary_goal: string;
  equipment: string[];
  days_per_week: number | null;
  split: string;
  focus_areas: string[];
  session_length: number | null;
}

// Saving still succeeds when the new columns haven't been migrated onto the
// hosted DB yet — we persist what we can and flag the rest, so a setting is
// never *silently* dropped (the caller surfaces `needsMigration`, and the
// generate route still honors all settings this run via its request body).
export type SavePlanSettingsResult =
  | { ok: true; needsMigration: boolean }
  | { ok: false; error: string };

// True when a write failed only because one of the newer columns isn't in the
// schema yet (PostgREST PGRST204 / Postgres 42703).
function isMissingNewColumn(err: { code?: string; message?: string }): boolean {
  if (err.code === 'PGRST204' || err.code === '42703') return true;
  const m = (err.message ?? '').toLowerCase();
  return m.includes('column') && /(split|focus_areas|session_length)/.test(m);
}

export async function saveFitnessPlanSettings(data: PlanSettingsData): Promise<SavePlanSettingsResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Columns that already exist for every onboarded user.
  const core = {
    primary_goal: data.primary_goal || null,
    equipment: data.equipment,
    days_per_week: data.days_per_week,
    updated_at: new Date().toISOString(),
  };
  const withNew = {
    ...core,
    split: data.split || null,
    focus_areas: data.focus_areas,
    session_length: data.session_length,
  };

  const first = await supabase.from('fitness_profiles').update(withNew).eq('user_id', user.id);
  if (!first.error) return { ok: true, needsMigration: false };

  // New columns not migrated yet → persist the core settings so nothing else is
  // lost, and tell the caller the three preference columns need the migration.
  if (isMissingNewColumn(first.error)) {
    const retry = await supabase.from('fitness_profiles').update(core).eq('user_id', user.id);
    if (retry.error) return { ok: false, error: retry.error.message };
    return { ok: true, needsMigration: true };
  }

  return { ok: false, error: first.error.message };
}
