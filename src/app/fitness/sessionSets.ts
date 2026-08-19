'use client';

// ── Pending sets for the workout in progress ─────────────────────────────────
// set_logs.log_id is NOT NULL and points at a workout_logs row that only exists
// once the workout is finished. So sets the user enters on the exercise screen
// are buffered here first, and flushed to the DB by "Finish workout" (which
// creates the workout_logs parent row, then the child set_logs rows).
//
// Deliberately module-level (not React state): the exercise detail screen is
// rendered from two different places (the dashboard and the plan screen) and
// both feed the same in-progress workout. Lives in memory only — same lifetime
// as the session timer in FitnessDashboard, which is also lost on reload.

export type PendingSet = {
  exerciseId: string;      // set_logs.exercise_id (TEXT — never cast to uuid)
  setNumber: number;       // 1-based
  weight: number;
  reps: number;
};

let pending: PendingSet[] = [];

// Re-logging the same exercise replaces its earlier entries rather than
// doubling them, so a correction doesn't write the sets twice.
export function bufferSets(exerciseId: string, sets: PendingSet[]): void {
  pending = pending.filter((s) => s.exerciseId !== exerciseId).concat(sets);
}

export function getBufferedSets(): PendingSet[] {
  return pending.slice();
}

export function clearBufferedSets(): void {
  pending = [];
}
