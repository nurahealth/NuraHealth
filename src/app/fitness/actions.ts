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
