'use client';

// ── Skipped dates ────────────────────────────────────────────────────────────
// "Skip today" drops a single DATE's occurrence of a workout. The schedule is
// untouched — next week comes back on its own.
//
// A weekday schedule (program_workouts.day_index) has nowhere to record "not
// this one date", and none of the existing tables has a free column to keep it
// in: every column on fitness_profiles is read by the generator, and writing a
// workout_completions row would count the skip as done and inflate streaks.
// Rather than add a table, skips live in localStorage under the same
// 'YYYY-MM-DD' key the calendar already uses for completions (localDateKey).
//
// The tradeoff is deliberate and worth knowing: skips are per-device and do not
// sync. Nothing else depends on them, so a device that has never seen a skip
// simply shows the workout as scheduled.

const KEY = 'nura:fitness:skipped-dates';
// Skips are only meaningful around now; anything older is dropped on write so
// the entry can't grow without bound.
const KEEP_DAYS = 120;

/** One skipped occurrence — a date plus the workout that was scheduled on it. */
const entry = (dateKey: string, workoutId: string) => `${dateKey}|${workoutId}`;

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    // Corrupt or unavailable storage is not worth breaking the screen over.
    return [];
  }
}

function write(values: string[]): void {
  if (typeof window === 'undefined') return;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
  const floor = cutoff.toISOString().slice(0, 10);   // 'YYYY-MM-DD' sorts lexically
  const kept = values.filter((v) => v.slice(0, 10) >= floor);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(kept));
  } catch {
    // Quota or private mode — the skip just doesn't persist. Never throw here.
  }
}

export function loadSkips(): Set<string> {
  return new Set(read());
}

export function isSkipped(skips: Set<string>, dateKey: string, workoutId: string | undefined): boolean {
  return !!workoutId && skips.has(entry(dateKey, workoutId));
}

export function addSkip(dateKey: string, workoutId: string): Set<string> {
  const next = new Set(read());
  next.add(entry(dateKey, workoutId));
  write([...next]);
  return next;
}

export function removeSkip(dateKey: string, workoutId: string): Set<string> {
  const next = new Set(read());
  next.delete(entry(dateKey, workoutId));
  write([...next]);
  return next;
}
