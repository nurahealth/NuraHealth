// One-off / re-runnable WorkoutX catalog ingest.
//
//   node --experimental-strip-types scripts/ingest-workoutx.ts
//
// • Non-destructive: upserts on the WorkoutX id (on conflict → update). Existing
//   slug-keyed rows are left untouched.
// • Column-aware: only writes columns that actually exist on the live table, so it
//   works both before and after the richer-fields migration (re-run to backfill).
// • Resilient: retries a failed page up to 3× with a pause, then SKIPS that page and
//   continues — it never restarts the whole run. Throttles between pages.
// • Never downloads GIFs; gifUrl is stored as plain text only.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mapExercise, type ExerciseRecord } from '../src/lib/exercise-source.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnv(): void {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim().replace(/\r$/, '');
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv();

const WORKOUTX_KEY = process.env.WORKOUTX_API_KEY!;
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, '');
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const WX_BASE = (process.env.WORKOUTX_BASE_URL ?? 'https://api.workoutxapp.com').replace(/\/+$/, '');

const PAGE_SIZE = 100;
const PAGE_RETRIES = 3;       // hard retries per page before skipping
const RETRY_PAUSE_MS = 1500;
const THROTTLE_MS = 500;      // polite delay between pages
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const wxHeaders = { 'X-WorkoutX-Key': WORKOUTX_KEY, accept: 'application/json' };
const supaHeaders = { apikey: SRK, Authorization: `Bearer ${SRK}` };

// ── discover which columns the live table actually has ────────────────────────
async function liveColumns(): Promise<Set<string>> {
  const res = await fetch(`${SUPA_URL}/rest/v1/exercises?select=*&limit=1`, { headers: supaHeaders });
  if (!res.ok) throw new Error(`Could not read exercises columns (${res.status}): ${await res.text()}`);
  const rows = (await res.json()) as Record<string, unknown>[];
  if (!rows.length) throw new Error('exercises table returned no sample row to infer columns');
  return new Set(Object.keys(rows[0]));
}

// ── upsert one page (stripped to existing columns) ────────────────────────────
async function upsertPage(rows: ExerciseRecord[], cols: Set<string>): Promise<void> {
  const payload = rows.map((r) => {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) if (cols.has(k)) o[k] = v;
    return o;
  });
  const res = await fetch(`${SUPA_URL}/rest/v1/exercises?on_conflict=id`, {
    method: 'POST',
    headers: { ...supaHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Upsert failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

// ── fetch one page with bounded retries; returns null if it never succeeds ─────
async function fetchPage(offset: number): Promise<ExerciseRecord[] | null> {
  for (let attempt = 1; attempt <= PAGE_RETRIES; attempt++) {
    try {
      const res = await fetch(`${WX_BASE}/v1/exercises?limit=${PAGE_SIZE}&offset=${offset}`, {
        headers: wxHeaders,
        cache: 'no-store',
      });
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000;
        console.log(`  · 429 at offset ${offset}; backing off ${wait}ms (attempt ${attempt}/${PAGE_RETRIES})`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json = (await res.json()) as { total?: number; data?: unknown[] };
      if (typeof json.total === 'number') seenTotal = json.total;
      const raw = Array.isArray(json.data) ? json.data : [];
      return raw.map((r) => mapExercise(r as never)).filter((r): r is ExerciseRecord => r !== null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  · page offset ${offset} failed (attempt ${attempt}/${PAGE_RETRIES}): ${msg}`);
      if (attempt < PAGE_RETRIES) await sleep(RETRY_PAUSE_MS);
    }
  }
  return null;
}

// ── reporting helpers ─────────────────────────────────────────────────────────
async function countRows(): Promise<number> {
  const res = await fetch(`${SUPA_URL}/rest/v1/exercises?select=id`, {
    headers: { ...supaHeaders, Prefer: 'count=exact', Range: '0-0' },
  });
  const cr = res.headers.get('content-range') ?? '';
  return Number(cr.split('/')[1] ?? '0');
}
async function distinct(col: string): Promise<Map<string, number>> {
  const res = await fetch(`${SUPA_URL}/rest/v1/exercises?select=${col}`, { headers: supaHeaders });
  const rows = (await res.json()) as Record<string, string | null>[];
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = r[col] ?? '(null)';
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

// ── run ───────────────────────────────────────────────────────────────────────
let seenTotal = Number.POSITIVE_INFINITY;
const seenIds = new Set<string>();
const failedOffsets: number[] = [];
let fetched = 0;
let upserted = 0;

const cols = await liveColumns();
const writable = ['name','target_muscles','secondary_muscles','body_part','equipment','gif_url','instructions','difficulty','category','mechanic','force','met','calories_per_minute','description'].filter((c) => cols.has(c));
console.log(`Live columns present: ${[...cols].sort().join(', ')}`);
console.log(`Writing fields: id, ${writable.join(', ')}`);
console.log('Starting ingest…\n');

for (let offset = 0; offset < seenTotal; offset += PAGE_SIZE) {
  const page = await fetchPage(offset);
  if (page === null) {
    console.log(`  ✗ skipping offset ${offset} after ${PAGE_RETRIES} failed attempts`);
    failedOffsets.push(offset);
    await sleep(THROTTLE_MS);
    continue;
  }
  if (page.length === 0) {
    console.log(`  offset ${offset}: empty page → done`);
    break;
  }
  const fresh = page.filter((r) => !seenIds.has(r.id));
  fresh.forEach((r) => seenIds.add(r.id));
  fetched += page.length;
  if (fresh.length) {
    await upsertPage(fresh, cols);
    upserted += fresh.length;
  }
  console.log(`  offset ${offset}: fetched ${page.length}, upserted ${fresh.length} (running: ${upserted}/${Number.isFinite(seenTotal) ? seenTotal : '?'})`);
  if (offset + PAGE_SIZE < seenTotal) await sleep(THROTTLE_MS);
}

// ── report ──────────────────────────────────────────────────────────────────
const total = await countRows();
const equip = await distinct('equipment');
const body = await distinct('body_part');
const top = (m: Map<string, number>, n = 12) =>
  [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}:${v}`).join(', ');

console.log('\n══════════════ INGEST COMPLETE ══════════════');
console.log(`WorkoutX total reported : ${Number.isFinite(seenTotal) ? seenTotal : 'unknown'}`);
console.log(`Fetched this run        : ${fetched}`);
console.log(`Distinct WorkoutX ids   : ${seenIds.size}`);
console.log(`Upserted this run       : ${upserted}`);
console.log(`Failed/skipped offsets  : ${failedOffsets.length ? failedOffsets.join(', ') : 'none'}`);
console.log(`Rows now in table       : ${total}`);
console.log(`Distinct equipment (${equip.size}) : ${top(equip)}`);
console.log(`Distinct body_part (${body.size}) : ${top(body)}`);
