// Rule-based fitness program generator — PURE logic, no I/O.
// Input: a user's onboarding profile + the exercises catalog (rows from Supabase).
// Output: a weekly plan (7 days; training + rest) with selected exercises.
// Designed to ALWAYS return a usable plan, even against a partial catalog.

export interface CatalogExercise {
  id: string;
  name: string;
  target_muscles: string[] | null;
  secondary_muscles: string[] | null;
  body_part: string | null;
  equipment: string | null;
  gif_url?: string | null;
}

export interface GeneratorProfile {
  primary_goal: string;          // onboarding id: muscle|fat|strength|endurance|mobility|general (labels also accepted)
  experience_level: string;      // Beginner|Intermediate|Advanced
  equipment: string[];           // equipment ids (onboarding OR Plan-Settings vocabulary — both accepted)
  days_per_week: number | null;  // 1..7
  limitations?: string | null;
  // Plan-Settings additions (all optional — absence preserves the legacy behavior):
  split?: string | null;         // 'Full Body' | 'Push-Pull-Legs' | 'Upper-Lower'. Overrides the days→split default.
  focus_areas?: string[] | null; // muscle chips to give EXTRA volume (Chest, Back, Quads, …). Optional.
  session_length?: number | null;// minutes per session (20|30|45|60) → drives exercises per workout.
}

export interface PlannedExercise {
  exercise_id: string;
  name: string;
  sort_order: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes: string | null;
  // display-only (ignored by the persist route, handy for preview)
  target_muscles: string[];
  body_part: string | null;
  equipment: string | null;
  gif_url: string | null;
}

export interface PlannedWorkout {
  day_index: number;
  title: string;
  focus: string;
  is_rest: boolean;
  sort_order: number;
  exercises: PlannedExercise[];
}

export interface GeneratedProgram {
  goal: string;
  split_type: string;
  days_per_week: number;
  status: 'active';
  limitations: string | null;
  workouts: PlannedWorkout[];
}

// ── Rules ────────────────────────────────────────────────────────────────────

// Sets are stored as a single int (the table column is int); reps keep the range.
const GOAL_PRESCRIPTION: Record<string, { sets: number; reps: string; rest_seconds: number }> = {
  muscle:    { sets: 4, reps: '8-12',  rest_seconds: 75 },  // spec: 3–4 sets
  fat:       { sets: 3, reps: '12-15', rest_seconds: 40 },
  strength:  { sets: 5, reps: '4-6',   rest_seconds: 150 }, // spec: 4–5 sets
  endurance: { sets: 3, reps: '15-20', rest_seconds: 30 },  // spec: 2–3 sets
  mobility:  { sets: 2, reps: '10-15', rest_seconds: 30 },  // spec line was garbled; 30s rest given
  general:   { sets: 3, reps: '10-12', rest_seconds: 60 },
};

const GOAL_ALIAS: Record<string, string> = {
  'build muscle': 'muscle',
  'lose fat': 'fat',
  'build strength': 'strength',
  'improve endurance': 'endurance',
  'mobility & flexibility': 'mobility',
  'general fitness': 'general',
};

const EXP_COUNT: Record<string, number> = { beginner: 4, intermediate: 5, advanced: 6 };

// Session length (minutes) → exercises per workout. A 20-min session fits ~3
// movements; an hour fits ~6. When set, this takes precedence over experience
// (the user is telling us how much time they actually have).
const SESSION_COUNT: Record<number, number> = { 20: 3, 30: 4, 45: 5, 60: 6 };

// Split sequence (focus per training day) keyed by days/week.
const SPLITS: Record<number, string[]> = {
  1: ['Full Body'],
  2: ['Full Body', 'Full Body'],
  3: ['Full Body', 'Full Body', 'Full Body'],
  4: ['Upper', 'Lower', 'Upper', 'Lower'],
  5: ['Push', 'Pull', 'Legs', 'Upper', 'Lower'],
  6: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs'],
  7: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Full Body'], // beyond spec — handled gracefully
};

const SPLIT_TYPE: Record<number, string> = {
  1: 'Full Body', 2: 'Full Body', 3: 'Full Body',
  4: 'Upper / Lower',
  5: 'Push / Pull / Legs + Upper / Lower',
  6: 'Push / Pull / Legs',
  7: 'Push / Pull / Legs + Full Body',
};

// An EXPLICIT split choice (from Plan Settings) overrides the days→split default
// above. We build a focus sequence of exactly `days` entries by cycling the
// chosen split's pattern, so e.g. PPL across 4 days = Push/Pull/Legs/Push.
const SPLIT_PATTERNS: Record<string, { pattern: string[]; label: string }> = {
  'full body':        { pattern: ['Full Body'],            label: 'Full Body' },
  'push-pull-legs':   { pattern: ['Push', 'Pull', 'Legs'], label: 'Push / Pull / Legs' },
  'upper-lower':      { pattern: ['Upper', 'Lower'],       label: 'Upper / Lower' },
};

// Normalise a free-form split label to a SPLIT_PATTERNS key (or null = use default).
function splitKey(s: string | null | undefined): string | null {
  const k = lower(s).trim();
  if (!k) return null;
  if (k.includes('full')) return 'full body';
  if (k.includes('push') || k.includes('ppl') || k.includes('pull')) return 'push-pull-legs';
  if (k.includes('upper') || k.includes('lower')) return 'upper-lower';
  return null;
}

// Build the focus sequence + a human split-type label, honoring an explicit
// split choice when present, else falling back to the days→split defaults.
function resolveSplit(splitChoice: string | null | undefined, days: number): { focuses: string[]; label: string } {
  const key = splitKey(splitChoice);
  if (key && SPLIT_PATTERNS[key]) {
    const { pattern, label } = SPLIT_PATTERNS[key];
    const focuses = Array.from({ length: days }, (_, i) => pattern[i % pattern.length]);
    return { focuses, label };
  }
  return { focuses: SPLITS[days] ?? SPLITS[3], label: SPLIT_TYPE[days] ?? 'Full Body' };
}

// Focus → catalog target_muscles / body_part keywords (all lower-cased).
const FOCUS: Record<string, { targets: string[]; bodyParts: string[] }> = {
  Push:  { targets: ['pectorals', 'delts', 'triceps'], bodyParts: ['chest', 'shoulders'] },
  Pull:  { targets: ['lats', 'upper back', 'traps', 'biceps'], bodyParts: ['back'] },
  Legs:  { targets: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'], bodyParts: ['upper legs', 'lower legs'] },
  Upper: { targets: ['pectorals', 'delts', 'triceps', 'lats', 'upper back', 'traps', 'biceps', 'forearms'], bodyParts: ['chest', 'back', 'shoulders', 'upper arms', 'lower arms'] },
  Lower: { targets: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'], bodyParts: ['upper legs', 'lower legs'] },
  Core:  { targets: ['abs', 'spine'], bodyParts: ['waist'] },
  // 'Full Body' is handled specially (round-robin across groups).
};

// Equipment id → allowed catalog equipment tokens (lower-cased substrings).
// 'any' means no equipment restriction. Keys are matched case-insensitively so
// BOTH the onboarding vocabulary AND the newer Plan-Settings chips resolve here.
const EQUIP_MAP: Record<string, string[] | 'any'> = {
  // ── Onboarding vocabulary ──
  'full gym': 'any',
  'home equipment': ['dumbbell', 'body weight', 'band', 'kettlebell'],
  'bodyweight only': ['body weight'],
  'resistance bands': ['band', 'body weight'],
  'dumbbells only': ['dumbbell', 'body weight'],
  'group classes': ['body weight'],
  // ── Plan-Settings chips (each is one specific class of equipment) ──
  'dumbbells': ['dumbbell'],
  'barbell': ['barbell'],
  'kettlebell': ['kettlebell'],
  'bands': ['band'],
  'machines': ['machine', 'cable', 'leverage', 'smith', 'sled'],
  'bodyweight': ['body weight'],
};

// Focus-area chip → catalog target-muscle tokens (lower-cased substrings). Used
// to add EXTRA volume for muscles the user wants to prioritise.
const FOCUS_MUSCLE_MAP: Record<string, string[]> = {
  chest:      ['pectoral', 'chest'],
  back:       ['lat', 'upper back', 'trap', 'back'],
  shoulders:  ['delt', 'shoulder'],
  biceps:     ['bicep'],
  triceps:    ['tricep'],
  core:       ['abs', 'core', 'oblique', 'spine'],
  quads:      ['quad'],
  hamstrings: ['hamstring'],
  glutes:     ['glute'],
  calves:     ['calv', 'calf'],
};

const COMPOUND_RE = /\b(squat|deadlift|bench|press|row|pull[ -]?up|chin[ -]?up|lunge|dip|push[ -]?up|clean|snatch|thrust|overhead|pulldown)\b/i;

// ── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const lower = (s: string | null | undefined) => (s ?? '').toLowerCase();
const targetsLower = (ex: CatalogExercise) => (ex.target_muscles ?? []).map((t) => t.toLowerCase());

function normGoal(g: string): string {
  const k = lower(g).trim();
  if (GOAL_PRESCRIPTION[k]) return k;
  if (GOAL_ALIAS[k]) return GOAL_ALIAS[k];
  return 'general';
}

function resolveEquipment(sel: string[] | null | undefined): string[] | null {
  if (!sel || sel.length === 0) return null; // no restriction
  const set = new Set<string>();
  for (const s of sel) {
    const m = EQUIP_MAP[lower(s).trim()];
    if (m === 'any') return null;
    if (Array.isArray(m)) m.forEach((x) => set.add(x));
  }
  return set.size ? [...set] : null;
}

// Selected focus chips → a list of token-groups (one per muscle). Unknown chips
// are dropped. Returns [] when nothing is selected (→ balanced plan, no extra).
function resolveFocusAreas(sel: string[] | null | undefined): string[][] {
  if (!sel || sel.length === 0) return [];
  const out: string[][] = [];
  for (const s of sel) {
    const tokens = FOCUS_MUSCLE_MAP[lower(s).trim()];
    if (tokens) out.push(tokens);
  }
  return out;
}

// Does an exercise target ANY of the given muscle tokens?
function targetsAny(ex: CatalogExercise, tokens: string[]): boolean {
  const tl = targetsLower(ex);
  return tokens.some((tok) => tl.some((t) => t.includes(tok)));
}

// Pick ONE extra exercise for a focus muscle, honoring equipment, preferring an
// unused compound. Relaxes "unused" then "equipment" before giving up (null).
function pickFocusExercise(
  catalog: CatalogExercise[],
  tokens: string[],
  allowed: string[] | null,
  programUsed: Set<string>,
): CatalogExercise | null {
  const tiers: CatalogExercise[][] = [
    compoundFirst(catalog.filter((e) => targetsAny(e, tokens) && equipAllowed(e, allowed) && !programUsed.has(e.id))),
    compoundFirst(catalog.filter((e) => targetsAny(e, tokens) && equipAllowed(e, allowed))),
    compoundFirst(catalog.filter((e) => targetsAny(e, tokens) && !programUsed.has(e.id))),
    compoundFirst(catalog.filter((e) => targetsAny(e, tokens))),
  ];
  for (const tier of tiers) {
    for (const ex of tier) {
      if (!programUsed.has(ex.id)) { programUsed.add(ex.id); return ex; }
    }
    // tier exhausted with only already-used rows → allow a repeat from this tier
    if (tier.length) { const ex = tier[0]; programUsed.add(ex.id); return ex; }
  }
  return null;
}

function equipAllowed(ex: CatalogExercise, allowed: string[] | null): boolean {
  if (!allowed) return true;
  const e = lower(ex.equipment);
  return allowed.some((tok) => e.includes(tok));
}

function matchesFocus(ex: CatalogExercise, key: string): boolean {
  if (key === 'Full Body') return true;
  const f = FOCUS[key];
  if (!f) return true;
  const tl = targetsLower(ex);
  const bp = lower(ex.body_part);
  return f.targets.some((t) => tl.includes(t)) || f.bodyParts.includes(bp);
}

const isCompound = (ex: CatalogExercise) =>
  COMPOUND_RE.test(ex.name ?? '') || (ex.secondary_muscles?.length ?? 0) >= 2;

const compoundFirst = (list: CatalogExercise[]) =>
  [...list].sort((a, b) => (isCompound(b) ? 1 : 0) - (isCompound(a) ? 1 : 0));

// Pick up to `count` exercises for a single focus, preferring (in order):
// focus+equipment+unused → focus+equipment → focus(any equip) → equip(any group)
// → unused(anything) → anything. Compounds first within each tier. Never throws.
function pickForFocus(
  catalog: CatalogExercise[],
  key: string,
  count: number,
  allowed: string[] | null,
  programUsed: Set<string>,
): CatalogExercise[] {
  const out: CatalogExercise[] = [];
  const here = new Set<string>();
  const add = (ex: CatalogExercise) => {
    if (out.length >= count || here.has(ex.id)) return;
    out.push(ex);
    here.add(ex.id);
    programUsed.add(ex.id);
  };

  // Order = strongest preference first. Equipment is kept as long as ANY allowed
  // exercise remains (a bodyweight user can't use a barbell); the muscle group is
  // relaxed first ("closest group"), and equipment only as a last resort.
  const tiers: CatalogExercise[][] = [
    compoundFirst(catalog.filter((e) => matchesFocus(e, key) && equipAllowed(e, allowed) && !programUsed.has(e.id))),
    compoundFirst(catalog.filter((e) => equipAllowed(e, allowed) && !programUsed.has(e.id))),  // other group, allowed equip, unused
    compoundFirst(catalog.filter((e) => matchesFocus(e, key) && equipAllowed(e, allowed))),    // repeat focus+equip
    compoundFirst(catalog.filter((e) => equipAllowed(e, allowed))),                            // repeat any allowed-equip
    compoundFirst(catalog.filter((e) => matchesFocus(e, key) && !programUsed.has(e.id))),      // relax equipment, keep focus
    compoundFirst(catalog.filter((e) => matchesFocus(e, key))),
    compoundFirst(catalog.filter((e) => !programUsed.has(e.id))),
    catalog,
  ];

  for (const tier of tiers) {
    for (const ex of tier) {
      if (out.length >= count) break;
      add(ex);
    }
    if (out.length >= count) break;
  }
  return out;
}

// Full Body: round-robin across Push/Pull/Legs/Core for a balanced spread.
function pickFullBody(
  catalog: CatalogExercise[],
  count: number,
  allowed: string[] | null,
  programUsed: Set<string>,
): CatalogExercise[] {
  const groups = ['Push', 'Pull', 'Legs', 'Core'];
  const out: CatalogExercise[] = [];
  const here = new Set<string>();
  let gi = 0;
  let guard = 0;
  while (out.length < count && guard < count * 4 + 8) {
    guard++;
    const [one] = pickForFocus(catalog, groups[gi % groups.length], 1, allowed, programUsed);
    gi++;
    if (one && !here.has(one.id)) {
      out.push(one);
      here.add(one.id);
    }
  }
  if (out.length < count) {
    for (const ex of pickForFocus(catalog, 'Full Body', count, allowed, programUsed)) {
      if (out.length >= count) break;
      if (!here.has(ex.id)) { out.push(ex); here.add(ex.id); }
    }
  }
  return out.slice(0, count);
}

// Evenly spread `days` training sessions across the 7-day week (indices 0..6).
function spreadTrainingDays(days: number): number[] {
  const idx = new Set<number>();
  for (let i = 0; i < days; i++) idx.add(clamp(Math.round((i * 7) / days), 0, 6));
  for (let k = 0; k < 7 && idx.size < days; k++) idx.add(k);
  return [...idx].sort((a, b) => a - b).slice(0, days);
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function generateProgram(profile: GeneratorProfile, catalog: CatalogExercise[]): GeneratedProgram {
  const days = clamp(profile.days_per_week ?? 3, 1, 7);
  // Split: explicit choice (Plan Settings) wins; else the days→split default.
  const { focuses: split, label: splitType } = resolveSplit(profile.split, days);
  const presc = GOAL_PRESCRIPTION[normGoal(profile.primary_goal)] ?? GOAL_PRESCRIPTION.general;
  // Exercises per workout: session length wins (the user's real time budget);
  // else experience level; else 4.
  const sessionCount = profile.session_length != null ? SESSION_COUNT[profile.session_length] : undefined;
  const perWorkout = sessionCount ?? EXP_COUNT[lower(profile.experience_level).trim()] ?? 4;
  const allowed = resolveEquipment(profile.equipment);
  const focusAreas = resolveFocusAreas(profile.focus_areas); // [] = balanced, no extra volume
  const safeCatalog = Array.isArray(catalog) ? catalog : [];

  const trainingIdx = spreadTrainingDays(days);
  const idxToFocus = new Map<number, string>();
  trainingIdx.forEach((d, i) => idxToFocus.set(d, split[i] ?? split[split.length - 1]));

  const programUsed = new Set<string>();
  const workouts: PlannedWorkout[] = [];
  let trainingOrdinal = 0; // counts training days, to rotate focus muscles across the week

  for (let d = 0; d < 7; d++) {
    const focus = idxToFocus.get(d);
    if (!focus) {
      workouts.push({ day_index: d, title: 'Rest', focus: 'Rest', is_rest: true, sort_order: d, exercises: [] });
      continue;
    }
    let picks = focus === 'Full Body'
      ? pickFullBody(safeCatalog, perWorkout, allowed, programUsed)
      : pickForFocus(safeCatalog, focus, perWorkout, allowed, programUsed);

    // Hard guarantee: a training day must never be empty when the catalog has
    // anything in it. If every preference tier missed (thin/partial catalog),
    // fall back to ANY available exercises so we never emit an all-rest plan.
    if (picks.length === 0 && safeCatalog.length > 0) {
      picks = safeCatalog.slice(0, Math.max(1, Math.min(perWorkout, safeCatalog.length)));
    }

    // Focus areas: ADD one extra movement for a prioritised muscle on top of the
    // base split (rotating through the selected muscles across training days).
    // This is additive — the day keeps its full base split, so it never collapses
    // into an isolation-only session.
    if (focusAreas.length && safeCatalog.length) {
      const tokens = focusAreas[trainingOrdinal % focusAreas.length];
      const extra = pickFocusExercise(safeCatalog, tokens, allowed, programUsed);
      if (extra && !picks.some((p) => p.id === extra.id)) picks = [...picks, extra];
    }
    trainingOrdinal++;

    const exercises: PlannedExercise[] = picks.map((ex, i) => ({
      exercise_id: ex.id,
      name: ex.name,
      sort_order: i + 1,
      sets: presc.sets,
      reps: presc.reps,
      rest_seconds: presc.rest_seconds,
      notes: null,
      target_muscles: ex.target_muscles ?? [],
      body_part: ex.body_part ?? null,
      equipment: ex.equipment ?? null,
      gif_url: ex.gif_url ?? null,
    }));

    workouts.push({ day_index: d, title: focus, focus, is_rest: false, sort_order: d, exercises });
  }

  return {
    goal: profile.primary_goal,
    split_type: splitType,
    days_per_week: days,
    status: 'active',
    limitations: profile.limitations ?? null,
    workouts,
  };
}
