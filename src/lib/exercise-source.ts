// SERVER-ONLY. Central adapter for the external exercise catalog (currently WorkoutX).
//
// To swap the data source later, change ONLY this file:
//   • BASE_URL / authHeaders()  — where & how we call the provider
//   • mapExercise()             — the single mapping into our `exercises` row shape
//   • fetchAllExercises()       — pagination strategy
// The rest of the app depends only on `ExerciseRecord`, never on the provider's shape.
//
// Keys come from env exclusively (process.env.WORKOUTX_API_KEY); never hardcode them.

/** Canonical shape that matches the `public.exercises` table. */
export interface ExerciseRecord {
  id: string;
  name: string;
  target_muscles: string[];
  secondary_muscles: string[];
  body_part: string | null;
  equipment: string | null;
  gif_url: string | null;
  instructions: string[];
  difficulty: string | null;
}

/**
 * Best-effort raw shape from WorkoutX. Field names mirror common exercise/GIF
 * APIs; the mapper is defensive about alternates so a provider tweak only
 * requires editing mapExercise(), not callers.
 */
interface RawExercise {
  id?: string | number;
  exerciseId?: string | number;
  name?: string;
  target?: string;
  targetMuscles?: unknown;
  secondaryMuscles?: unknown;
  bodyPart?: string;
  bodyParts?: unknown;
  equipment?: string;
  equipments?: unknown;
  gifUrl?: string;
  gif_url?: string;
  instructions?: unknown;
  difficulty?: string;
  [key: string]: unknown;
}

// Provider endpoint. Override via env to point at the real WorkoutX host/path
// without touching code. Default mirrors a RapidAPI-style host.
const BASE_URL = (process.env.WORKOUTX_BASE_URL ?? 'https://workoutx.p.rapidapi.com').replace(/\/+$/, '');
const PAGE_SIZE = 100;
const MAX_PAGES = 1000; // hard safety stop (≈100k exercises)

function requireApiKey(): string {
  const key = process.env.WORKOUTX_API_KEY;
  if (!key) {
    throw new Error('WORKOUTX_API_KEY is not set — required to ingest the exercise catalog');
  }
  return key;
}

function authHeaders(): Record<string, string> {
  const key = requireApiKey();
  // RapidAPI-style auth. If WorkoutX uses a plain bearer token instead, swap to:
  //   return { Authorization: `Bearer ${key}` };
  return {
    'x-rapidapi-key': key,
    'x-rapidapi-host': new URL(BASE_URL).host,
    accept: 'application/json',
  };
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    : typeof v === 'string' && v.trim() !== ''
      ? [v]
      : [];

const firstString = (...vals: unknown[]): string | null => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v;
    if (Array.isArray(v) && typeof v[0] === 'string' && v[0].trim() !== '') return v[0];
  }
  return null;
};

/**
 * THE central mapping function. One place to remap when the source changes.
 * Returns null for records missing the minimum required fields (id + name).
 */
export function mapExercise(raw: RawExercise): ExerciseRecord | null {
  const rawId = raw.id ?? raw.exerciseId;
  if (rawId === undefined || rawId === null || !raw.name) return null;

  // target_muscles: prefer an explicit array, else the single `target`.
  const target = raw.targetMuscles !== undefined ? asStringArray(raw.targetMuscles) : asStringArray(raw.target);

  return {
    id: String(rawId),
    name: String(raw.name),
    target_muscles: target,
    secondary_muscles: asStringArray(raw.secondaryMuscles),
    body_part: firstString(raw.bodyPart, raw.bodyParts),
    equipment: firstString(raw.equipment, raw.equipments),
    gif_url: firstString(raw.gifUrl, raw.gif_url),
    instructions: asStringArray(raw.instructions),
    difficulty: firstString(raw.difficulty),
  };
}

/** Extract the array of raw rows from whatever envelope the API returns. */
function extractRows(json: unknown): RawExercise[] {
  if (Array.isArray(json)) return json as RawExercise[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    for (const key of ['data', 'exercises', 'results', 'items']) {
      if (Array.isArray(obj[key])) return obj[key] as RawExercise[];
    }
  }
  return [];
}

/**
 * Pull the full catalog, paginating until a short/empty page is returned.
 * Returns mapped, source-shape-agnostic records (callers dedupe + upsert).
 */
export async function fetchAllExercises(
  opts?: { onPage?: (info: { page: number; received: number; total: number }) => void },
): Promise<ExerciseRecord[]> {
  const out: ExerciseRecord[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const url = `${BASE_URL}/exercises?limit=${PAGE_SIZE}&offset=${offset}`;

    const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`WorkoutX request failed (${res.status}) at offset ${offset}: ${body.slice(0, 300)}`);
    }

    const rows = extractRows(await res.json());
    for (const r of rows) {
      const mapped = mapExercise(r);
      if (mapped) out.push(mapped);
    }

    opts?.onPage?.({ page, received: rows.length, total: out.length });

    if (rows.length < PAGE_SIZE) break; // last page
  }

  return out;
}
