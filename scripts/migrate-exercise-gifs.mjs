// One-time migration: copy exercise demo GIFs from WorkoutX into Supabase
// Storage (public bucket `exercise-gifs`) so they're permanent and free to serve.
//
// Safe to re-run after the WorkoutX quota resets: rows already pointing at
// Supabase Storage are skipped. Hard cap of 50 copies; stops immediately on a
// 429 / quota-exhausted response. Run from the repo root:  node scripts/migrate-exercise-gifs.mjs
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const BUCKET = 'exercise-gifs';
const HARD_CAP = 50;
const STORAGE_MARKER = '/storage/v1/object/public/';

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');

const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const WORKOUTX_KEY = get('WORKOUTX_API_KEY');

if (!SUPABASE_URL || !SERVICE_KEY || !WORKOUTX_KEY) {
  console.error('Missing env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / WORKOUTX_API_KEY)');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

// 1. Ensure the public bucket exists (idempotent).
{
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) {
      console.error('createBucket failed:', error.message);
      process.exit(1);
    }
    console.log(`Created public bucket "${BUCKET}".`);
  } else {
    console.log(`Bucket "${BUCKET}" already exists.`);
  }
}

// 2. Load exercises + which ones are referenced in real workouts.
const { data: exercises, error: exErr } = await sb.from('exercises').select('id, name, gif_url');
if (exErr) { console.error('read exercises failed:', exErr.message); process.exit(1); }

const { data: weRows, error: weErr } = await sb.from('workout_exercises').select('exercise_id');
if (weErr) { console.error('read workout_exercises failed:', weErr.message); process.exit(1); }
const referenced = new Set((weRows ?? []).map((r) => r.exercise_id));

// Candidates = rows NOT yet on Supabase Storage. Referenced-in-workouts first.
const candidates = (exercises ?? [])
  .filter((e) => e.gif_url && !e.gif_url.includes(STORAGE_MARKER))
  .sort((a, b) => (referenced.has(b.id) ? 1 : 0) - (referenced.has(a.id) ? 1 : 0));

const alreadyMigrated = (exercises ?? []).filter((e) => e.gif_url && e.gif_url.includes(STORAGE_MARKER)).length;
console.log(`Exercises: ${exercises.length} total | ${alreadyMigrated} already on Storage | ${candidates.length} candidates (cap ${HARD_CAP}).`);

// 3. Copy loop.
let copied = 0;
let lastQuota = null;
let stoppedForQuota = false;

for (const ex of candidates) {
  if (copied >= HARD_CAP) { console.log(`Reached hard cap of ${HARD_CAP}.`); break; }

  let res;
  try {
    res = await fetch(ex.gif_url, { headers: { 'X-WorkoutX-Key': WORKOUTX_KEY } });
  } catch (err) {
    console.error(`  fetch error for ${ex.id} (${ex.name}): ${err.message} — stopping.`);
    break;
  }

  const q = res.headers.get('x-quota-remaining');
  if (q !== null) lastQuota = q;

  if (res.status === 429) {
    console.log(`  WorkoutX 429 (rate/quota) on ${ex.id} — stopping immediately.`);
    stoppedForQuota = true;
    break;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (/quota/i.test(body) || res.status === 402 || res.status === 403) {
      console.log(`  WorkoutX ${res.status} quota-exhausted on ${ex.id} — stopping immediately.`);
      stoppedForQuota = true;
      break;
    }
    console.error(`  skip ${ex.id} (${ex.name}): upstream ${res.status}`);
    continue;
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  const path = `${ex.id}.gif`;

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/gif', upsert: true });
  if (upErr) { console.error(`  upload failed ${ex.id}: ${upErr.message}`); continue; }

  const publicUrl = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: updErr } = await sb.from('exercises').update({ gif_url: publicUrl }).eq('id', ex.id);
  if (updErr) { console.error(`  db update failed ${ex.id}: ${updErr.message}`); continue; }

  copied++;
  console.log(`  [${copied}] ${ex.id} ${ex.name}${referenced.has(ex.id) ? ' *' : ''} → ${publicUrl}  (quota left: ${q ?? '?'})`);
}

// 4. Summary.
const { data: after } = await sb.from('exercises').select('gif_url');
const stillWorkoutX = (after ?? []).filter((e) => e.gif_url && !e.gif_url.includes(STORAGE_MARKER)).length;

console.log('\n──────── SUMMARY ────────');
console.log(`GIFs copied this run:        ${copied}`);
console.log(`Still on WorkoutX urls:      ${stillWorkoutX}`);
console.log(`x-quota-remaining (last):    ${lastQuota ?? 'n/a'}`);
console.log(`Stopped early for quota:     ${stoppedForQuota ? 'YES' : 'no'}`);
