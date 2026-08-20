// ── Shared display helpers for the workout surfaces ──────────────────────────
// Pure formatting only, no React and no data access, so the dashboard and the
// guided-workout overlay can both use them without importing each other (which
// would be a cycle — the dashboard mounts the overlay).

import type { CatalogEx, WEx } from './planData';

export const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// "Chest · Triceps" — target muscles, falling back to the body part.
export function muscleLabel(ex: CatalogEx | null): string {
  if (!ex) return '';
  const t = (ex.target_muscles ?? []).filter(Boolean);
  return (t.length ? t : (ex.body_part ? [ex.body_part] : [])).map(titleCase).join(' · ');
}

// Rough session length: work + rest across every prescribed set, to the nearest
// 5 minutes. Deliberately an estimate — nothing downstream depends on it.
export function estimateMinutes(exs: WEx[]): number {
  let s = 0;
  for (const e of exs) s += (e.sets ?? 3) * (45 + (e.rest_seconds ?? 60));
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}

// Low end of a prescribed range ("8-12" → "8"), used to prefill the reps input
// so the user usually only types a weight. '' when the plan has no number.
export function repsLowEnd(reps: string | null | undefined): string {
  const m = (reps ?? '').match(/\d+/);
  return m ? m[0] : '';
}

// Prescribed sets × reps for a row, en-dashed to match the design.
export function setsRepsLabel(we: Pick<WEx, 'sets' | 'reps'>): string {
  if (we.sets == null || !we.reps) return '—';
  return `${we.sets} × ${we.reps.replace(/-/g, '–')}`;
}

// How many sets a row prescribes — the guided flow always walks at least one.
export const plannedSets = (we: Pick<WEx, 'sets'>) => Math.max(1, we.sets ?? 3);

// Elapsed session time: m:ss under an hour, h:mm:ss beyond it.
export function fmtElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Weights print without trailing zeros — 135 not 135.0, 22.5 stays 22.5.
export const fmtWeight = (n: number) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(1))));
