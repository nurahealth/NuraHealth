import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { generateProgram, type CatalogExercise, type GeneratorProfile } from '@/lib/program-generator';
import { MOVEKIT_GIF_LIKE } from '@/lib/movekit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate + persist the signed-in user's weekly program. Uses the user-scoped
// client throughout so RLS guarantees they only read/write their own data.
//
// Optional JSON body: { overrides?: Partial<GeneratorProfile> }. Plan Settings
// passes the just-chosen settings here so generation honors them THIS run even
// before the (newer) preference columns are migrated onto the DB. Overrides win
// over the stored profile; with no body it behaves exactly as before.
export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const overrides = (body && typeof body === 'object' ? (body as Record<string, unknown>).overrides : null) as
    | Partial<GeneratorProfile>
    | null
    | undefined;

  // 1. The user's profile. select('*') so the newer preference columns come back
  // when present, and we don't 400 on databases where they don't exist yet.
  const { data: profile, error: profErr } = await supabase
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
  if (!profile || !profile.onboarded) {
    return NextResponse.json({ error: 'Complete fitness onboarding first' }, { status: 400 });
  }

  // 2. The exercises catalog — MoveKit-covered only (see @/lib/movekit). Only
  // exercises with a 3D clip are eligible for generated programs.
  const { data: catalog, error: catErr } = await supabase
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url')
    .like('gif_url', MOVEKIT_GIF_LIKE);
  if (catErr) return NextResponse.json({ error: `Catalog read failed: ${catErr.message}` }, { status: 500 });

  // 2b. Merge any request overrides over the stored profile (?? keeps [] and 0).
  const p = profile as Record<string, unknown>;
  const o = overrides ?? {};
  const genProfile: GeneratorProfile = {
    primary_goal: (o.primary_goal ?? p.primary_goal ?? 'general') as string,
    experience_level: (o.experience_level ?? p.experience_level ?? 'Intermediate') as string,
    equipment: (o.equipment ?? p.equipment ?? []) as string[],
    days_per_week: (o.days_per_week ?? p.days_per_week ?? 3) as number,
    limitations: (o.limitations ?? p.limitations ?? null) as string | null,
    split: (o.split ?? p.split ?? null) as string | null,
    focus_areas: (o.focus_areas ?? p.focus_areas ?? null) as string[] | null,
    session_length: (o.session_length ?? p.session_length ?? null) as number | null,
  };

  // 3. Generate (pure logic; always returns a usable plan).
  const plan = generateProgram(genProfile, (catalog ?? []) as CatalogExercise[]);

  // 3b. Diagnostics: how many exercises got matched into each day. If the catalog
  // is non-empty but training days come back empty, that's the bug to chase.
  const trainingDays = plan.workouts.filter((w) => !w.is_rest);
  const totalMatched = trainingDays.reduce((n, w) => n + w.exercises.length, 0);
  console.log(
    `[generate-program] user=${user.id} catalog=${catalog?.length ?? 0} ` +
    `split="${plan.split_type}" days=${plan.days_per_week} ` +
    `training=${trainingDays.length} totalExercises=${totalMatched}`,
  );
  for (const w of plan.workouts) {
    console.log(
      `[generate-program]   day ${w.day_index}: ${w.is_rest ? 'REST' : `focus="${w.focus}"`} ` +
      `→ ${w.exercises.length} exercise(s)`,
    );
  }

  // 3c. Refuse to persist a plan with empty training days. The generator only
  // returns an empty day when the catalog read came back with nothing usable
  // (see its hard-guarantee fallback), and writing that anyway is how a user
  // ends up with an ACTIVE program whose days say "Empty — add exercises" with
  // nothing to explain it. Failing here leaves the previous plan in place,
  // which is always better than replacing it with an unusable one.
  const emptyDays = trainingDays.filter((w) => w.exercises.length === 0);
  if (emptyDays.length > 0) {
    console.error(
      `[generate-program] refusing to persist: ${emptyDays.length}/${trainingDays.length} training ` +
      `day(s) came back empty (catalog=${catalog?.length ?? 0}). Days: ${emptyDays.map((w) => w.day_index).join(', ')}`,
    );
    return NextResponse.json(
      {
        error:
          catalog?.length
            ? 'Could not build a full week from the exercise catalog. Your existing plan is unchanged.'
            : 'The exercise catalog is unavailable right now, so the plan could not be rebuilt. Your existing plan is unchanged.',
      },
      { status: 503 },
    );
  }

  // 4. Insert the new program FIRST (status active). We only archive the previous
  // active program once this one is fully built, so a failure never leaves the
  // user with an empty / all-rest plan as their active program.
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

  // Roll back the just-created program (cascade drops workouts + exercises) so a
  // mid-build failure can't strand a broken active program.
  const rollback = async (msg: string, status = 500) => {
    await supabase.from('fitness_programs').delete().eq('id', prog.id);
    return NextResponse.json({ error: msg }, { status });
  };

  // 5. Insert workouts, get their ids back, map by day_index.
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
  if (wErr) return rollback(`Workout insert failed: ${wErr.message}`);

  const workoutIdByDay = new Map<number, string>((workoutRows ?? []).map((w) => [w.day_index as number, w.id as string]));

  // 6. Insert workout_exercises.
  const exerciseRows = plan.workouts.flatMap((w) => {
    const workoutId = workoutIdByDay.get(w.day_index);
    if (!workoutId) return [];
    return w.exercises.map((ex) => ({
      workout_id: workoutId,
      exercise_id: ex.exercise_id,
      sort_order: ex.sort_order,
      sets: ex.sets,
      reps: ex.reps,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
    }));
  });
  if (exerciseRows.length) {
    const { error: exErr } = await supabase.from('workout_exercises').insert(exerciseRows);
    if (exErr) return rollback(`Exercise insert failed: ${exErr.message}`);
  }
  console.log(`[generate-program] inserted ${exerciseRows.length} workout_exercises for program ${prog.id}`);

  // 7. Now that the new program is fully built, archive the user's OTHER active
  // programs (everything except the one we just created).
  const { error: archErr } = await supabase
    .from('fitness_programs')
    .update({ status: 'archived' })
    .eq('user_id', user.id)
    .eq('status', 'active')
    .neq('id', prog.id);
  if (archErr) return rollback(`Archive failed: ${archErr.message}`);

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
