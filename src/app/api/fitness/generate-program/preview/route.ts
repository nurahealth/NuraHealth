import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateProgram, type CatalogExercise, type GeneratorProfile } from '@/lib/program-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DEV PREVIEW — no auth, no persistence. Runs the generator against the live
// catalog from query params so the logic can be eyeballed in a browser.
//   /api/fitness/generate-program/preview?goal=muscle&days=4&experience=Intermediate&equipment=Full%20gym
// `equipment` is a comma-separated list of onboarding equipment ids.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams;

  const goal = sp.get('goal') ?? 'muscle';
  const experience = sp.get('experience') ?? 'Intermediate';
  const days = Number.parseInt(sp.get('days') ?? '4', 10);
  const equipment = (sp.get('equipment') ?? 'Full gym')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const profile: GeneratorProfile = {
    primary_goal: goal,
    experience_level: experience,
    equipment,
    days_per_week: Number.isFinite(days) ? days : 4,
    limitations: sp.get('limitations'),
  };

  const { data: catalog, error } = await supabaseAdmin
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url');
  if (error) {
    return NextResponse.json({ error: `Failed to read catalog: ${error.message}` }, { status: 500 });
  }

  const plan = generateProgram(profile, (catalog ?? []) as CatalogExercise[]);

  return NextResponse.json({
    inputs: { goal, experience, days: profile.days_per_week, equipment },
    catalog_size: catalog?.length ?? 0,
    program: plan,
  });
}
