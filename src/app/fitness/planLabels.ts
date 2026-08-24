// ── Plan vocabulary — the goal / split labels the fitness screens speak ───────
// Owned here rather than by PlanSettings so the Profile screen's one-line plan
// summary ("Build Muscle · 4 days/week · Full Body") reads the SAME words the
// settings screen writes. Two copies would drift the moment a label changed.

export const SPLIT_OPTS = ['Full Body', 'Push-Pull-Legs', 'Upper-Lower'];

export const GOAL_OPTS: { label: string; id: string }[] = [
  { label: 'General Fitness', id: 'general' },
  { label: 'Build Muscle', id: 'muscle' },
  { label: 'Strength', id: 'strength' },
  { label: 'Weight Loss', id: 'fat' },
  { label: 'Endurance', id: 'endurance' },
];

export const GOAL_ID_TO_LABEL = (id: string): string =>
  GOAL_OPTS.find((g) => g.id === id)?.label ?? 'General Fitness';

/** Derive a split chip from a stored fitness_programs.split_type label. */
export function splitFromProgramType(t: string | null | undefined): string | null {
  const k = (t ?? '').toLowerCase();
  if (!k) return null;
  if (k.includes('push') || k.includes('pull')) return 'Push-Pull-Legs';
  if (k.includes('upper') || k.includes('lower')) return 'Upper-Lower';
  if (k.includes('full')) return 'Full Body';
  return null;
}
