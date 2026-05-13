'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface OnboardingData {
  name: string;
  dob: string;
  sex: string;
  height_ft: string;
  height_in: string;
  weight: string;
  goals: string[];
  symptoms_text: string;
  symptom_chips: string[];
  diet: string;
  exercise: string;
  sleep: string;
  stress: string;
}

export async function saveOnboarding(data: OnboardingData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  await supabaseAdmin.from('profiles').update({
    onboarding_data: data,
    onboarded: true,
    onboarding_completed_at: new Date().toISOString(),
  }).eq('id', user.id);

  redirect('/');
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
