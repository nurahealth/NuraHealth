// One-off: regenerate a user's active weekly program from the FULL exercises
// catalog, mirroring /api/fitness/generate-program exactly (generator + persist
// + archive-old), but run with the service-role client and resolved by email.
//
//   node --experimental-strip-types scripts/regen-program.ts austinwilkes95@gmail.com
//
// Non-destructive on failure: the new program is only made the sole active one
// after it's fully built; older active programs are archived (kept, not deleted).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { generateProgram, type CatalogExercise, type GeneratorProfile } from '../src/lib/program-generator.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(): void {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim().replace(/\r$/, '');
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv();

const email = process.argv[2];
if (!email) throw new Error('Usage: regen-program.ts <email>');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function findUserId(target: string): Promise<string> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === target.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`No auth user with email ${target}`);
}

async function main(): Promise<void> {
  const userId = await findUserId(email);
  console.log(`user ${email} → ${userId}`);

  const { data: profile, error: profErr } = await supabase
    .from('fitness_profiles')
    .select('primary_goal, experience_level, equipment, days_per_week, limitations, onboarded')
    .eq('user_id', userId)
    .maybeSingle();
  if (profErr) throw profErr;
  if (!profile || !profile.onboarded) throw new Error('User has not completed fitness onboarding');
  console.log('profile:', JSON.stringify(profile));

  const { data: catalog, error: catErr } = await supabase
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url');
  if (catErr) throw catErr;
  console.log(`catalog size: ${catalog?.length ?? 0} exercises`);

  const plan = generateProgram(profile as GeneratorProfile, (catalog ?? []) as CatalogExercise[]);

  const training = plan.workouts.filter((w) => !w.is_rest);
  const total = training.reduce((n, w) => n + w.exercises.length, 0);
  console.log(`generated split="${plan.split_type}" days=${plan.days_per_week} training=${training.length} totalExercises=${total}`);

  // Insert the new program FIRST (active), then archive others — same order as the route.
  const { data: prog, error: progErr } = await supabase
    .from('fitness_programs')
    .insert({
      user_id: userId,
      goal: plan.goal,
      split_type: plan.split_type,
      days_per_week: plan.days_per_week,
      status: 'active',
      limitations: plan.limitations,
    })
    .select('id, created_at')
    .single();
  if (progErr) throw progErr;

  const rollback = async (msg: string) => {
    await supabase.from('fitness_programs').delete().eq('id', prog.id);
    throw new Error(msg);
  };

  const { data: workoutRows, error: wErr } = await supabase
    .from('program_workouts')
    .insert(plan.workouts.map((w) => ({
      program_id: prog.id,
      day_index: w.day_index,
      title: w.title,
      focus: w.focus,
      is_rest: w.is_rest,
      sort_order: w.sort_order,
    })))
    .select('id, day_index');
  if (wErr) await rollback(`Workout insert failed: ${wErr.message}`);

  const workoutIdByDay = new Map<number, string>((workoutRows ?? []).map((w) => [w.day_index as number, w.id as string]));

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
    if (exErr) await rollback(`Exercise insert failed: ${exErr.message}`);
  }

  const { error: archErr } = await supabase
    .from('fitness_programs')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .neq('id', prog.id);
  if (archErr) await rollback(`Archive failed: ${archErr.message}`);

  console.log(`\n✅ new active program ${prog.id} — inserted ${exerciseRows.length} workout_exercises`);

  // Print a human-readable breakdown of every training day.
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (const w of plan.workouts) {
    if (w.is_rest) { console.log(`\n${DOW[w.day_index]} — Rest`); continue; }
    console.log(`\n${DOW[w.day_index]} — ${w.title} (${w.exercises.length})`);
    for (const ex of w.exercises) {
      console.log(`  • ${ex.name}  [${ex.equipment ?? 'n/a'}]  ${ex.sets}×${ex.reps}, ${ex.rest_seconds}s  — ${(ex.target_muscles ?? []).join(', ')}`);
    }
  }
}

main().catch((e) => { console.error('FAILED:', e.message ?? e); process.exit(1); });
