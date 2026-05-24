'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface OnboardingData {
  name: string;
  dob: string;
  sex: string;
  height_cm: number | null;
  weight_kg: number | null;
  unit_preference: 'imperial' | 'metric';
  goals: string[];
  symptoms_text: string;
  symptom_chips: string[];
  diet: string;
  sleep: string;
  stress: string;
  activity_level: string;
  pregnancy_status: string | null;
  conditions: string[];
  medications: string[];
  allergies: string[];
}

export async function saveOnboarding(data: OnboardingData, isEdit: boolean = false) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const update: Record<string, unknown> = {
    onboarding_data: data,
    onboarded: true,
  };
  if (!isEdit) {
    update.onboarding_completed_at = new Date().toISOString();
  }

  await supabaseAdmin.from('profiles').update(update).eq('id', user.id);

  redirect(isEdit ? '/settings' : '/');
}

export async function resetOnboarding() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  await supabaseAdmin.from('profiles').update({
    onboarded: false,
    onboarding_completed_at: null,
  }).eq('id', user.id);

  redirect('/onboarding');
}
