// Shared muscle-group → target_muscles / body_part mapping. Single source of
// truth so the "Train by muscle" list and the "Add exercise" grouping stay
// consistent across the app.

export interface MuscleGroup {
  key: string;
  label: string;
  targets: string[];   // matched against exercise.target_muscles (lower-cased)
  bodyParts: string[]; // matched against exercise.body_part (lower-cased)
}

// The six standard groups shown in "Train by muscle".
export const MUSCLE_GROUPS: MuscleGroup[] = [
  { key: 'chest',     label: 'Chest',     targets: ['pectorals'], bodyParts: ['chest'] },
  { key: 'back',      label: 'Back',      targets: ['lats', 'upper back', 'traps', 'spine'], bodyParts: ['back'] },
  { key: 'shoulders', label: 'Shoulders', targets: ['delts'], bodyParts: ['shoulders'] },
  { key: 'arms',      label: 'Arms',      targets: ['biceps', 'triceps', 'forearms'], bodyParts: ['upper arms', 'lower arms'] },
  { key: 'legs',      label: 'Legs',      targets: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'], bodyParts: ['upper legs', 'lower legs'] },
  { key: 'core',      label: 'Core',      targets: ['abs'], bodyParts: ['waist'] },
];

// Cardio is shown only when the catalog actually has cardio exercises.
export const CARDIO_GROUP: MuscleGroup = {
  key: 'cardio', label: 'Cardio', targets: ['cardiovascular system'], bodyParts: ['cardio'],
};

const lc = (s: string | null | undefined) => (s ?? '').toLowerCase();

export function inGroup(
  ex: { target_muscles: string[] | null; body_part: string | null },
  g: MuscleGroup,
): boolean {
  const tl = (ex.target_muscles ?? []).map((t) => t.toLowerCase());
  return g.targets.some((t) => tl.includes(t)) || g.bodyParts.includes(lc(ex.body_part));
}
