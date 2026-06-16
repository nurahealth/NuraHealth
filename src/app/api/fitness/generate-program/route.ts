import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { generateProgram, type CatalogExercise, type GeneratorProfile } from '@/lib/program-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate + persist the signed-in user's weekly program. Uses the user-scoped
// client throughout so RLS guarantees they only read/write their own data.
export async function POST(): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // 1. The user's onboarding profile.
  const { data: profile, error: profErr } = await supabase
    .from('fitness_profiles')
    .select('primary_goal, experience_level, equipment, days_per_week, limitations, onboarded')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
  if (!profile || !profile.onboarded) {
    return NextResponse.json({ error: 'Complete fitness onboarding first' }, { status: 400 });
  }

  // 2. The exercises catalog (RLS allows any authenticated user to read).
  const { data: catalog, error: catErr } = await supabase
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url');
  if (catErr) return NextResponse.json({ error: `Catalog read failed: ${catErr.message}` }, { status: 500 });

  // 3. Generate (pure logic; always returns a usable plan).
  const plan = generateProgram(profile as GeneratorProfile, (catalog ?? []) as CatalogExercise[]);

  // 4. Archive any existing active program for this user.
  const { error: archErr } = await supabase
    .from('fitness_programs')
    .update({ status: 'archived' })
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (archErr) return NextResponse.json({ error: `Archive failed: ${archErr.message}` }, { status: 500 });

  // 5. Insert the new program.
  const { data: prog, error: progErr } = await supabase
    .from('fitness_programs')
    .insert({
      user_id: user.id,
      goal: plan.goal,
      split_type: plan.split_type,
      days_per_week: plan.days_per_week,
      status: 'active',
      limitations: plan.limitations, // stored for later injury-aware filtering (not used yet)
    })
    .select('id, created_at')
    .single();
  if (progErr) return NextResponse.json({ error: `Program insert failed: ${progErr.message}` }, { status: 500 });

  // 6. Insert workouts, get their ids back, map by day_index.
  const { data: workoutRows, error: wErr } = await supabase
    .from('program_workouts')
    .insert(
      plan.workouts.map((w) => ({
        program_id: prog.id,
        day_index: w.day_index,
        title: w.title,
        focus: w.focus,
        is_rest: w.is_rest,
        sort_order: w.sort_order,
      })),
    )
    .select('id, day_index');
  if (wErr) return NextResponse.json({ error: `Workout insert failed: ${wErr.message}` }, { status: 500 });

  const workoutIdByDay = new Map<number, string>((workoutRows ?? []).map((w) => [w.day_index as number, w.id as string]));

  // 7. Insert workout_exercises.
  const exerciseRows = plan.workouts.flatMap((w) => {
    const workoutId = workoutIdByDay.get(w.day_index);
    if (!workoutId) return [];
    return w.exercises.map((ex) => ({
      workout_id: workoutId,
      exercise_id: ex.exercise_id,
      order: ex.order,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
    }));
  });
  if (exerciseRows.length) {
    const { error: exErr } = await supabase.from('workout_exercises').insert(exerciseRows);
    if (exErr) return NextResponse.json({ error: `Exercise insert failed: ${exErr.message}` }, { status: 500 });
  }

  // 8. Return the full plan.
  return NextResponse.json({
    program: {
      id: prog.id,
      created_at: prog.created_at,
      goal: plan.goal,
      split_type: plan.split_type,
      days_per_week: plan.days_per_week,
      status: 'active',
      limitations: plan.limitations,
      workouts: plan.workouts,
    },
  });
}
