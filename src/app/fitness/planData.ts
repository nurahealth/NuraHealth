'use client';

import { supabase } from '@/lib/supabase';

// Shared types + loaders for a user's active training program. Used by both the
// Workout Plan screen and the Calendar so they stay in sync.

export type CatalogEx = {
  id: string;
  name: string;
  target_muscles: string[] | null;
  secondary_muscles: string[] | null;
  body_part: string | null;
  equipment: string | null;
  gif_url: string | null;
};

export type WEx = {
  id: string;
  sort_order: number;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
  exercise: CatalogEx | null;
};

export type Workout = {
  id: string;
  day_index: number;
  title: string | null;
  focus: string | null;
  is_rest: boolean;
  sort_order: number;
  exercises: WEx[];
};

export type Program = {
  id: string;
  goal: string | null;
  split_type: string | null;
  days_per_week: number | null;
  status: string;
  limitations: string | null;
  workouts: Workout[];
};

// PostgREST embedded read. Columns match the DB exactly (sort_order, rest_seconds).
export const PROGRAM_SELECT = `
  id, goal, split_type, days_per_week, status, limitations,
  program_workouts (
    id, day_index, title, focus, is_rest, sort_order,
    workout_exercises (
      id, sort_order, sets, reps, rest_seconds, notes,
      exercise:exercises ( id, name, target_muscles, secondary_muscles, body_part, equipment, gif_url )
    )
  )
`;

// Sort + normalise the raw embedded rows into our typed Program.
export function mapProgram(row: Record<string, unknown>): Program {
  const workoutsRaw = (row.program_workouts as Record<string, unknown>[] | null) ?? [];
  const workouts: Workout[] = workoutsRaw
    .map((w) => {
      const exRaw = (w.workout_exercises as Record<string, unknown>[] | null) ?? [];
      const exercises: WEx[] = exRaw
        .map((e) => ({
          id: e.id as string,
          sort_order: (e.sort_order as number) ?? 0,
          sets: (e.sets as number | null) ?? null,
          reps: (e.reps as string | null) ?? null,
          rest_seconds: (e.rest_seconds as number | null) ?? null,
          notes: (e.notes as string | null) ?? null,
          exercise: (e.exercise as CatalogEx | null) ?? null,
        }))
        .sort((a, b) => a.sort_order - b.sort_order);
      return {
        id: w.id as string,
        day_index: (w.day_index as number) ?? 0,
        title: (w.title as string | null) ?? null,
        focus: (w.focus as string | null) ?? null,
        is_rest: !!(w.is_rest as boolean),
        sort_order: (w.sort_order as number) ?? 0,
        exercises,
      };
    })
    .sort((a, b) => a.day_index - b.day_index);
  return {
    id: row.id as string,
    goal: (row.goal as string | null) ?? null,
    split_type: (row.split_type as string | null) ?? null,
    days_per_week: (row.days_per_week as number | null) ?? null,
    status: (row.status as string) ?? 'active',
    limitations: (row.limitations as string | null) ?? null,
    workouts,
  };
}

// Full exercise row including the fields the detail screen needs (instructions,
// difficulty) that the lighter catalog select omits.
export type ExerciseFull = CatalogEx & {
  instructions: string[] | null;
  difficulty: string | null;
  // Self-hosted WorkoutX gif demo. Optional: the column is added by
  // 20260617000002_exercises_demo_gif_url.sql. Once that migration is applied,
  // add `demo_gif_url` to the select below and the detail screen prefers it over
  // the deterministic public-bucket path.
  demo_gif_url?: string | null;
};

export async function loadExercise(id: string): Promise<ExerciseFull | null> {
  const { data } = await supabase
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url,instructions,difficulty')
    .eq('id', id)
    .maybeSingle();
  return (data as ExerciseFull | null) ?? null;
}

// Load the full exercise catalog (used for swaps / add-exercise). Any authed
// user may read it (RLS). Stays small (~140 rows today).
export async function loadCatalog(): Promise<CatalogEx[]> {
  const { data } = await supabase
    .from('exercises')
    .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url');
  return (data as CatalogEx[] | null) ?? [];
}

// ── Write helpers (RLS scopes every write to the owner) ──────────────────────
// All return an error string on failure, or null on success.

export async function updateExerciseFields(
  id: string,
  fields: Partial<Pick<WEx, 'sets' | 'reps' | 'rest_seconds'>>,
): Promise<string | null> {
  const { error } = await supabase.from('workout_exercises').update(fields).eq('id', id);
  return error?.message ?? null;
}

export async function swapExerciseRow(id: string, exerciseId: string): Promise<string | null> {
  const { error } = await supabase.from('workout_exercises').update({ exercise_id: exerciseId }).eq('id', id);
  return error?.message ?? null;
}

export async function removeExerciseRow(id: string): Promise<string | null> {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', id);
  return error?.message ?? null;
}

// Insert a new exercise into a workout day; returns the new row id (or error).
export async function addExerciseRow(
  workoutId: string,
  row: { exercise_id: string; sort_order: number; sets: number; reps: string; rest_seconds: number },
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({ workout_id: workoutId, notes: null, ...row })
    .select('id')
    .single();
  return { id: (data?.id as string) ?? null, error: error?.message ?? null };
}

// Move a workout to a different weekday (drag-to-day on the calendar).
export async function updateWorkoutDay(workoutId: string, dayIndex: number): Promise<string | null> {
  const { error } = await supabase.from('program_workouts').update({ day_index: dayIndex }).eq('id', workoutId);
  return error?.message ?? null;
}

// Persist a new ordering: write sort_order for each id in turn.
export async function reorderExerciseRows(ordered: { id: string; sort_order: number }[]): Promise<string | null> {
  for (const { id, sort_order } of ordered) {
    const { error } = await supabase.from('workout_exercises').update({ sort_order }).eq('id', id);
    if (error) return error.message;
  }
  return null;
}

export type ActiveProgramResult = { program: Program | null; error: string | null };

// Read the signed-in user's most recent active program (RLS scopes to owner).
export async function loadActiveProgram(): Promise<ActiveProgramResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { program: null, error: null };

  const { data, error } = await supabase
    .from('fitness_programs')
    .select(PROGRAM_SELECT)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { program: null, error: error.message };
  return { program: data ? mapProgram(data as Record<string, unknown>) : null, error: null };
}

export type ProgramSummary = {
  id: string;
  goal: string | null;
  split_type: string | null;
  days_per_week: number | null;
  status: string;
  created_at: string;
};

// All of the user's programs (newest first) for the "Continue" list.
export async function loadProgramSummaries(): Promise<ProgramSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('fitness_programs')
    .select('id, goal, split_type, days_per_week, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (data as ProgramSummary[] | null) ?? [];
}

// ── Workout completions (consistency log) ────────────────────────────────────
// One row per completed workout. Foundation for a future Progress tab.

export type WorkoutCompletion = {
  id: string;
  program_workout_id: string;
  completed_at: string;     // ISO timestamptz
  duration_seconds: number | null;
};

// Local calendar-day key (YYYY-MM-DD) — what the week/month grids match on. Uses
// LOCAL date parts so a completion lines up with the day the user sees, matching
// how `today`/`selected` are computed throughout the fitness UI.
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// PostgREST raises PGRST205 (and Postgres 42P01) until the migration has been
// applied. Treat that as "no completions yet" so the app degrades cleanly.
function isMissingTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === 'PGRST205' || err.code === '42P01') return true;
  return /workout_completions/.test(err.message ?? '') && /(schema cache|does not exist)/i.test(err.message ?? '');
}

// All completions for the signed-in user (RLS scopes to owner). Returns [] when
// the table isn't there yet, so the calendar simply shows nothing "done".
export async function loadCompletions(): Promise<WorkoutCompletion[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('workout_completions')
    .select('id, program_workout_id, completed_at, duration_seconds')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });
  if (error) return []; // missing table or any read error → treat as no completions
  return (data as WorkoutCompletion[] | null) ?? [];
}

export type LogCompletionResult = { ok: true } | { ok: false; needsMigration: boolean; error: string };

// Record one completed workout. `needsMigration` is true when the only problem
// is that the table hasn't been created yet (so the UI can prompt for the SQL).
export async function logWorkoutCompletion(args: {
  programWorkoutId: string;
  completedAt?: string;            // defaults to now
  durationSeconds?: number | null;
}): Promise<LogCompletionResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, needsMigration: false, error: 'Not signed in.' };
  const { error } = await supabase.from('workout_completions').insert({
    user_id: user.id,
    program_workout_id: args.programWorkoutId,
    completed_at: args.completedAt ?? new Date().toISOString(),
    duration_seconds: args.durationSeconds ?? null,
  });
  if (error) return { ok: false, needsMigration: isMissingTable(error), error: error.message };
  return { ok: true };
}

// ── Body & weight metrics ────────────────────────────────────────────────────
// One row per weigh-in. Powers the Progress screen's "Body" section.

export type BodyMetric = {
  id: string;
  recorded_on: string;      // 'YYYY-MM-DD'
  weight: number | null;
  unit: string;             // 'lb' | 'kg'
  body_fat_pct: number | null;
  waist: number | null;
  notes: string | null;
  created_at: string;
};

// Same missing-table guard as loadCompletions — degrade cleanly until the
// body_metrics migration is applied.
function isMissingBodyTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === 'PGRST205' || err.code === '42P01') return true;
  return /body_metrics/.test(err.message ?? '') && /(schema cache|does not exist)/i.test(err.message ?? '');
}

// All weigh-ins for the signed-in user, oldest → newest (chart order). Returns
// [] when the table isn't there yet, so the Body section shows the empty prompt.
export async function loadBodyMetrics(): Promise<BodyMetric[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('body_metrics')
    .select('id, recorded_on, weight, unit, body_fat_pct, waist, notes, created_at')
    .eq('user_id', user.id)
    .order('recorded_on', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data as BodyMetric[] | null) ?? [];
}

export type LogBodyMetricResult = { ok: true } | { ok: false; needsMigration: boolean; error: string };

// Insert one weigh-in dated today (recorded_on defaults to current_date in DB).
export async function logBodyMetric(args: {
  weight: number;
  unit: string;
  bodyFatPct?: number | null;
  waist?: number | null;
  notes?: string | null;
}): Promise<LogBodyMetricResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, needsMigration: false, error: 'Not signed in.' };
  const { error } = await supabase.from('body_metrics').insert({
    user_id: user.id,
    weight: args.weight,
    unit: args.unit,
    body_fat_pct: args.bodyFatPct ?? null,
    waist: args.waist ?? null,
    notes: args.notes ?? null,
  });
  if (error) return { ok: false, needsMigration: isMissingBodyTable(error), error: error.message };
  return { ok: true };
}

// ── Progress photos ──────────────────────────────────────────────────────────
// One row per uploaded photo. Images live in the PRIVATE `progress-photos`
// storage bucket; we never expose a public URL — every image is fetched through
// a short-lived signed URL so it stays owner-only.

const PROGRESS_BUCKET = 'progress-photos';
const SIGNED_URL_TTL = 60 * 60; // 1h — long enough for a browsing session

// How the image sits in its portrait frame: 'fill' = cover, 'contain' = letterboxed.
export type PhotoFit = 'fill' | 'contain';

export type ProgressPhoto = {
  id: string;
  taken_on: string;         // 'YYYY-MM-DD'
  storage_path: string;
  pose: string | null;
  notes: string | null;
  fit: PhotoFit;            // defaults to 'fill'
  created_at: string;
  url: string | null;       // resolved signed URL (null if signing failed)
};

// Same missing-table guard as the others — degrade cleanly until the migration
// is applied so the section just shows its empty prompt.
function isMissingPhotoTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === 'PGRST205' || err.code === '42P01') return true;
  return /progress_photos/.test(err.message ?? '') && /(schema cache|does not exist)/i.test(err.message ?? '');
}

// The `fit` column ships in a later migration (20260705000003). Until it's run,
// selecting/inserting it 42703s — detect that so we can fall back to no-fit.
function isMissingFitColumn(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === '42703' || err.code === 'PGRST204') return true;
  return /fit/.test(err.message ?? '') && /(column|schema cache|does not exist)/i.test(err.message ?? '');
}

const normFit = (v: unknown): PhotoFit => (v === 'contain' ? 'contain' : 'fill');

// All photos for the signed-in user, NEWEST FIRST, each with a fresh signed URL.
// Returns [] when the table isn't there yet.
export async function loadProgressPhotos(): Promise<ProgressPhoto[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const run = (cols: string) => supabase
    .from('progress_photos')
    .select(cols)
    .eq('user_id', user.id)
    .order('taken_on', { ascending: false })
    .order('created_at', { ascending: false });

  let { data, error } = await run('id, taken_on, storage_path, pose, notes, fit, created_at');
  // Fall back to selecting without `fit` if that column isn't there yet.
  if (error && isMissingFitColumn(error)) {
    ({ data, error } = await run('id, taken_on, storage_path, pose, notes, created_at'));
  }
  if (error) return [];
  const raw = (data as Record<string, unknown>[] | null) ?? [];
  if (raw.length === 0) return [];

  // Batch-sign every path in one call, then zip the URLs back onto the rows.
  const paths = raw.map((r) => r.storage_path as string);
  const { data: signed } = await supabase.storage
    .from(PROGRESS_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl] as const));
  return raw.map((r) => ({
    id: r.id as string,
    taken_on: r.taken_on as string,
    storage_path: r.storage_path as string,
    pose: (r.pose as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    fit: normFit(r.fit),
    created_at: r.created_at as string,
    url: urlByPath.get(r.storage_path as string) ?? null,
  }));
}

export type AddProgressPhotoResult = { ok: true } | { ok: false; needsMigration: boolean; error: string };

// Upload a photo to the private bucket, then insert its row. Files are keyed
// under `<uid>/<uuid>.<ext>` so storage RLS (folder = uid) scopes them to owner.
export async function addProgressPhoto(args: {
  file: File;
  takenOn?: string;         // 'YYYY-MM-DD'; DB defaults to current_date
  pose?: string | null;
  notes?: string | null;
  fit?: PhotoFit;           // how it sits in the frame; DB defaults to 'fill'
}): Promise<AddProgressPhotoResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, needsMigration: false, error: 'Not signed in.' };

  const ext = (args.file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(PROGRESS_BUCKET)
    .upload(path, args.file, { contentType: args.file.type || 'image/jpeg', upsert: false });
  if (upErr) return { ok: false, needsMigration: false, error: upErr.message };

  const base = {
    user_id: user.id,
    storage_path: path,
    taken_on: args.takenOn || undefined,   // let DB default to current_date when unset
    pose: args.pose ?? null,
    notes: args.notes ?? null,
  };
  let { error } = await supabase.from('progress_photos').insert({ ...base, fit: args.fit ?? 'fill' });
  // Retry without `fit` if that column hasn't been added yet.
  if (error && isMissingFitColumn(error)) {
    ({ error } = await supabase.from('progress_photos').insert(base));
  }
  if (error) {
    // Roll back the orphaned object so a failed insert doesn't leak storage.
    await supabase.storage.from(PROGRESS_BUCKET).remove([path]).catch(() => {});
    return { ok: false, needsMigration: isMissingPhotoTable(error), error: error.message };
  }
  return { ok: true };
}

// Persist a fit change for an existing photo (owner-scoped by RLS). Best-effort:
// no-ops silently if the `fit` column isn't there yet.
export async function updatePhotoFit(id: string, fit: PhotoFit): Promise<void> {
  await supabase.from('progress_photos').update({ fit }).eq('id', id);
}

// ── Strength / set logging ───────────────────────────────────────────────────
// One row per performed set (set_logs). Captures weight + reps per set, the
// exercise, the date, and an optional link to the workout_completions session.

export type SetLog = {
  id: string;
  exercise_id: string;
  exercise_name: string | null;   // embedded from exercises
  completion_id: string | null;
  performed_on: string;           // 'YYYY-MM-DD'
  set_index: number;
  weight: number | null;
  reps: number | null;
  unit: string;
  created_at: string;
};

// Missing-table guard — degrade cleanly until the set_logs migration is applied
// so the Strength section shows its empty prompt instead of erroring.
function isMissingSetLogsTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  if (err.code === 'PGRST205' || err.code === '42P01') return true;
  return /set_logs/.test(err.message ?? '') && /(schema cache|does not exist)/i.test(err.message ?? '');
}

// All performed sets for the signed-in user, oldest → newest, with exercise name.
// Returns [] when the table isn't there yet.
export async function loadSetLogs(): Promise<SetLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('set_logs')
    .select('id, exercise_id, completion_id, performed_on, set_index, weight, reps, unit, created_at, exercise:exercises(name)')
    .eq('user_id', user.id)
    .order('performed_on', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) return [];
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => {
    const exRaw = r.exercise as { name?: string } | { name?: string }[] | null;
    const ex = Array.isArray(exRaw) ? exRaw[0] : exRaw;
    return {
      id: r.id as string,
      exercise_id: r.exercise_id as string,
      exercise_name: ex?.name ?? null,
      completion_id: (r.completion_id as string | null) ?? null,
      performed_on: r.performed_on as string,
      set_index: (r.set_index as number) ?? 1,
      weight: (r.weight as number | null) ?? null,
      reps: (r.reps as number | null) ?? null,
      unit: (r.unit as string) ?? 'lb',
      created_at: r.created_at as string,
    };
  });
}

export type LogSetsResult = { ok: true; count: number } | { ok: false; needsMigration: boolean; error: string };

// Persist a batch of performed sets for one exercise (RLS scopes to owner).
// `completionId` links them to a tracked session when there is one; otherwise
// null (standalone per-exercise logging). `performedOn` defaults to today.
export async function logSets(args: {
  exerciseId: string;
  sets: { setIndex: number; weight: number; reps: number }[];
  unit?: string;
  completionId?: string | null;
  performedOn?: string;
}): Promise<LogSetsResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, needsMigration: false, error: 'Not signed in.' };
  if (args.sets.length === 0) return { ok: true, count: 0 };

  const rows = args.sets.map((s) => ({
    user_id: user.id,
    exercise_id: args.exerciseId,
    completion_id: args.completionId ?? null,
    performed_on: args.performedOn || undefined,   // DB defaults to current_date
    set_index: s.setIndex,
    weight: s.weight,
    reps: s.reps,
    unit: args.unit ?? 'lb',
  }));
  const { error } = await supabase.from('set_logs').insert(rows);
  if (error) return { ok: false, needsMigration: isMissingSetLogsTable(error), error: error.message };
  return { ok: true, count: rows.length };
}
