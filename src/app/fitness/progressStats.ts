// ── Fitness stat derivations — ONE definition, shared by every screen ─────────
// The Progress screen owns these numbers; the Profile screen shows the same
// three of them in its "This week" row. They live here so the two can never
// disagree: a second, hand-rolled copy on Profile is exactly how a "workouts
// this week" that reads 2 on one screen and 3 on the other gets built.
//
// Everything is LOCAL time and Monday-first, matching the rest of the fitness UI.

import { localDateKey, type SetLog, type WorkoutCompletion } from './planData';

export function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  return addDays(x, -dow);
}

/** Completions falling inside the current (Monday-first) week. */
export function completionsThisWeek(completions: WorkoutCompletion[], today: Date): number {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 7);
  return completions.filter((c) => {
    const d = new Date(c.completed_at);
    return d >= weekStart && d < weekEnd;
  }).length;
}

// Streaks measured in consecutive WEEKS with ≥1 completion (a 3×/week plan
// rarely trains on back-to-back days, so a day streak would sit at 1).
export function weekStreaks(completions: WorkoutCompletion[], today: Date): {
  currentStreak: number; bestStreak: number;
} {
  const weekSet = new Set(completions.map((c) => localDateKey(startOfWeek(new Date(c.completed_at)))));
  // Current: walk back from this week. An empty in-progress week doesn't break it.
  let cur = 0;
  let cursor = startOfWeek(today);
  if (!weekSet.has(localDateKey(cursor))) cursor = addDays(cursor, -7);
  while (weekSet.has(localDateKey(cursor))) { cur++; cursor = addDays(cursor, -7); }
  // Best: longest run of consecutive week-starts (exactly 7 days apart).
  const times = [...weekSet].map((k) => new Date(`${k}T00:00:00`).getTime()).sort((a, b) => a - b);
  let best = 0, run = 0, prev: number | null = null;
  for (const t of times) {
    run = prev !== null && Math.round((t - prev) / 86400000) === 7 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return { currentStreak: cur, bestStreak: best };
}

/**
 * Σ (weight × reps) per Monday-first week, oldest → newest, for the last
 * `weeks` weeks. The final entry is always the current week — which is what
 * Profile's "volume this week" tile reads.
 */
export function weeklyVolumeSeries(
  setLogs: SetLog[], today: Date, weeks: number,
): { key: string; date: string; value: number }[] {
  const volByWeek = new Map<string, number>();
  for (const s of setLogs) {
    if (s.weight == null || s.reps == null) continue;
    const wk = localDateKey(startOfWeek(new Date(`${s.day_key}T00:00:00`)));
    volByWeek.set(wk, (volByWeek.get(wk) ?? 0) + s.weight * s.reps);
  }
  const wk0 = startOfWeek(today);
  return Array.from({ length: weeks }, (_, k) => {
    const d = addDays(wk0, -7 * (weeks - 1 - k));
    const key = localDateKey(d);
    return { key, date: key, value: volByWeek.get(key) ?? 0 };
  });
}
