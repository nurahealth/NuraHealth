// One-off repair: fill the EMPTY training days of a user's active program.
//
//   node scripts/backfill-empty-program-days.mjs <email>          # dry run
//   node scripts/backfill-empty-program-days.mjs <email> --apply  # write
//
// STRICTLY ADDITIVE. It only ever INSERTs workout_exercises rows, and only into
// generated workouts that currently have none. It never deletes, never updates,
// and never touches:
//   • rest days
//   • days that already have exercises (including hand-edited ones)
//   • custom workouts the user built themselves (title "nura:custom:<id>")
//
// Use this when a program was written with empty days — e.g. one generated
// against an unavailable exercise catalog, before the route learned to refuse
// (see the 3c guard in app/api/fitness/generate-program/route.ts). A full
// regenerate would work too, but it archives the program, taking the user's own
// custom workouts with it; this repairs in place instead.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { generateProgram } from '../src/lib/program-generator.ts';
import { MOVEKIT_GIF_LIKE } from '../src/lib/movekit.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Custom workouts carry their identity in the title (see planData.ts). Inlined
// rather than imported: that module is 'use client' and pulls in the browser
// Supabase client, which has no place in a service-role script.
const CUSTOM_TAG = 'nura:custom:';

function loadEnv() {
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
const apply = process.argv.includes('--apply');
if (!email) throw new Error('Usage: backfill-empty-program-days.mjs <email> [--apply]');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function findUserId(target) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? '').toLowerCase() === target.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`No auth user with email ${target}`);
}

async function main() {
  const userId = await findUserId(email);
  console.log(`user ${email} → ${userId}`);
  console.log(apply ? 'mode: APPLY (will insert)' : 'mode: DRY RUN (no writes — pass --apply to write)');

  const { data: program, error: progErr } = await supabase
    .from('fitness_programs')
    .select('id, goal, split_type, days_per_week, status, created_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (progErr) throw progErr;
  if (!program) throw new Error('No active program for this user');
  console.log(`active program ${program.id} — split="${program.split_type}" days=${program.days_per_week}`);

  const { data: workouts, error: wErr } = await supabase
    .from('program_workouts')
    .select('id, day_index, title, focus, is_rest')
    .eq('program_id', program.id)
    .order('day_index');
  if (wErr) throw wErr;

  const { data: existing, error: eErr } = await supabase
    .from('workout_exercises')
    .select('workout_id, exercise_id')
    .in('workout_id', (workouts ?? []).map((w) => w.id));
  if (eErr) throw eErr;

  const countByWorkout = new Map();
  const usedExerciseIds = new Set();
  for (const row of existing ?? []) {
    countByWorkout.set(row.workout_id, (countByWorkout.get(row.workout_id) ?? 0) + 1);
    usedExerciseIds.add(row.exercise_id);
  }

  // Targets: generated, non-rest, currently empty. Everything else is left alone.
  const targets = [];
  for (const w of workouts ?? []) {
    const count = countByWorkout.get(w.id) ?? 0;
    const custom = !!w.title?.startsWith(CUSTOM_TAG);
    const label = `${DOW[w.day_index]} "${w.focus ?? w.title ?? '—'}"`;
    if (w.is_rest) { console.log(`  skip ${label} — rest day`); continue; }
    if (count > 0) { console.log(`  skip ${label} — already has ${count} exercise(s)`); continue; }
    if (custom) { console.log(`  skip ${label} — custom workout (yours to fill, not mine)`); continue; }
    targets.push(w);
    console.log(`  TARGET ${label} — empty generated day`);
  }
  if (targets.length === 0) { console.log('\nNothing to backfill.'); return; }

  const { data: profile, error: pErr } = await supabase
    .from('fitness_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile?.onboarded) throw new Error('User has not completed fitness onboarding');

  const genProfile = {
    primary_goal: profile.primary_goal ?? 'general',
    experience_level: profile.experience_level ?? 'Intermediate',
    equipment: profile.equipment ?? [],
    days_per_week: profile.days_per_week ?? 3,
    limitations: profile.limitations ?? null,
    split: profile.split ?? null,
    focus_areas: profile.focus_areas ?? null,
    session_length: profile.session_length ?? null,
  };

  const { data: catalog, error: cErr } = await supabase
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url')
    .like('gif_url', MOVEKIT_GIF_LIKE);
  if (cErr) throw cErr;
  console.log(`\ncatalog: ${catalog?.length ?? 0} MoveKit-covered exercises`);
  if (!catalog?.length) throw new Error('Catalog is empty — refusing to backfill (that is the bug, not the fix)');

  // Generate a fresh week and take each target day's list from it. Same profile,
  // same generator, same prescription the day would have been born with.
  const plan = generateProgram(genProfile, catalog);
  const trainingDays = plan.workouts.filter((w) => !w.is_rest);
  const generatedByDay = new Map(trainingDays.map((w) => [w.day_index, w.exercises]));
  // Days the fresh plan happens not to train (its spread can differ from the
  // stored program's) fall back to its training days in order, so every target
  // still gets a real, balanced list rather than nothing.
  const spares = trainingDays.map((w) => w.exercises);
  let spareCursor = 0;

  const rows = [];
  for (const w of targets) {
    const source = generatedByDay.get(w.day_index) ?? spares[spareCursor++ % spares.length] ?? [];
    // Don't re-add something the program already uses elsewhere (e.g. the day
    // the user kept). If that would empty the day, keep the duplicates — a day
    // that repeats a movement still beats a day that says "Empty".
    const fresh = source.filter((ex) => !usedExerciseIds.has(ex.exercise_id));
    const picks = fresh.length > 0 ? fresh : source;
    picks.forEach((ex) => usedExerciseIds.add(ex.exercise_id));

    console.log(`\n${DOW[w.day_index]} — ${w.focus ?? w.title} (+${picks.length})`);
    picks.forEach((ex, i) => {
      console.log(`  • ${ex.name}  ${ex.sets}×${ex.reps}, ${ex.rest_seconds}s`);
      rows.push({
        workout_id: w.id,
        exercise_id: ex.exercise_id,
        sort_order: i + 1,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: null,
      });
    });
  }

  if (!apply) { console.log(`\nDRY RUN — would insert ${rows.length} workout_exercises row(s). Re-run with --apply.`); return; }

  const { error: insErr } = await supabase.from('workout_exercises').insert(rows);
  if (insErr) throw insErr;
  console.log(`\n✅ inserted ${rows.length} workout_exercises row(s) into ${targets.length} day(s). Nothing was deleted or overwritten.`);
}

main().catch((e) => { console.error('FAILED:', e.message ?? e); process.exit(1); });
