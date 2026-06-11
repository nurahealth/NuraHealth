// SERVER-ONLY. Central adapter for the WorkoutX exercise catalog.
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

/** Raw exercise as returned by WorkoutX GET /v1/exercises (inside `data`). */
interface RawExercise {
  id: string | number;
  name: string;
  bodyPart?: string;
  target?: string;
  secondaryMuscles?: unknown;
  equipment?: string;
  gifUrl?: string;
  instructions?: unknown;
  difficulty?: string;
}

/** Envelope WorkoutX wraps the list in: { total, count, data: [...] }. */
interface ListResponse {
  total?: number;
  count?: number;
  data?: RawExercise[];
}

const BASE_URL = (process.env.WORKOUTX_BASE_URL ?? 'https://api.workoutxapp.com').replace(/\/+$/, '');
// Larger pages ⇒ fewer requests ⇒ stays well under the free 500/month quota.
const PAGE_SIZE = 100;
const MAX_PAGES = 1000; // hard safety stop
// WorkoutX free tier: 30 requests / 60s. Space requests to stay under that
// (~27/min) and back off when a 429 says the window is already full.
const THROTTLE_MS = 2200;
const MAX_RETRIES = 5;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** How long to wait after a 429, from Retry-After header or `resetAt` body, capped. */
function rateLimitWaitMs(res: Response, body: { resetAt?: string } | null): number {
  const retryAfter = res.headers.get('retry-after');
  if (retryAfter && Number.isFinite(Number(retryAfter))) {
    return Math.min(Math.max(Number(retryAfter) * 1000, 1000), 65000);
  }
  if (body?.resetAt) {
    const delta = new Date(body.resetAt).getTime() - Date.now();
    if (Number.isFinite(delta)) return Math.min(Math.max(delta + 500, 1000), 65000);
  }
  return 5000;
}

function authHeaders(): Record<string, string> {
  const key = process.env.WORKOUTX_API_KEY;
  if (!key) {
    throw new Error('WORKOUTX_API_KEY is not set — required to ingest the exercise catalog');
  }
  return {
    'X-WorkoutX-Key': key,
    accept: 'application/json',
  };
}

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
    : typeof v === 'string' && v.trim() !== ''
      ? [v]
      : [];

const cleanString = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v : null;

/**
 * THE central mapping function — one place to remap when the source changes.
 * Returns null for records missing the minimum required fields (id + name).
 */
export function mapExercise(raw: RawExercise): ExerciseRecord | null {
  if (raw.id === undefined || raw.id === null || !raw.name) return null;
  return {
    id: String(raw.id),
    name: String(raw.name),
    // WorkoutX exposes a single `target` muscle — wrap it into our array column.
    target_muscles: asStringArray(raw.target),
    secondary_muscles: asStringArray(raw.secondaryMuscles),
    body_part: cleanString(raw.bodyPart),
    equipment: cleanString(raw.equipment),
    gif_url: cleanString(raw.gifUrl),
    instructions: asStringArray(raw.instructions),
    difficulty: cleanString(raw.difficulty),
  };
}

/**
 * Pull the full catalog via the paginated LIST endpoint:
 *   GET /v1/exercises?limit=&offset=  →  { total, count, data: [...] }
 * Advances `offset` until we've fetched `total` rows (one request per page,
 * never one-per-exercise), so a full ingest is ~total/PAGE_SIZE requests.
 */
export async function fetchAllExercises(
  opts?: { onPage?: (info: { offset: number; received: number; total: number }) => void },
): Promise<ExerciseRecord[]> {
  const out: ExerciseRecord[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  for (let page = 0; page < MAX_PAGES; page++) {
    if (offset >= total) break;

    const url = `${BASE_URL}/v1/exercises?limit=${PAGE_SIZE}&offset=${offset}`;

    // Fetch one page, retrying with backoff while the rate-limit window is full.
    let json: ListResponse | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(url, { headers: authHeaders(), cache: 'no-store' });

      if (res.status === 429) {
        const body = (await res.json().catch(() => null)) as { resetAt?: string } | null;
        if (attempt === MAX_RETRIES) {
          throw new Error(`WorkoutX rate limit not clearing at offset ${offset} after ${MAX_RETRIES} retries`);
        }
        await sleep(rateLimitWaitMs(res, body));
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`WorkoutX request failed (${res.status}) at offset ${offset}: ${body.slice(0, 300)}`);
      }
      json = (await res.json()) as ListResponse;
      break;
    }

    const rows = Array.isArray(json?.data) ? json!.data! : [];
    if (typeof json?.total === 'number') total = json.total;

    for (const r of rows) {
      const mapped = mapExercise(r);
      if (mapped) out.push(mapped);
    }

    opts?.onPage?.({ offset, received: rows.length, total: Number.isFinite(total) ? total : out.length });

    if (rows.length === 0) break;      // nothing more to read
    offset += rows.length;             // advance by what this page returned

    if (offset < total) await sleep(THROTTLE_MS); // proactive throttle between pages
  }

  return out;
}
