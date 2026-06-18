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
