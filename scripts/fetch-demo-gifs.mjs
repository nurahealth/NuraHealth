// Download WorkoutX GIF demos server-side (auth'd with WORKOUTX_API_KEY) and
// self-host them in Supabase Storage so they survive cancelling the WorkoutX plan.
//
//   node scripts/fetch-demo-gifs.mjs [exerciseId ...]
//
// Defaults to the current sample (Monday workout + Air Bike). For each id it:
//   • skips rows that already have a MoveKit clip (mp4) or no WorkoutX gif,
//   • downloads the gif using the API key,
//   • uploads it to the public `exercise-demos` bucket as <id>.gif,
//   • records the public URL on exercises.demo_gif_url (skipped gracefully if that
//     column doesn't exist yet — the app falls back to the deterministic URL).

import { readFileSync } from 'node:fs';

// ── env ──────────────────────────────────────────────────────────────────────
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim().replace(/\r$/, '');
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, '');
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WX_KEY = process.env.WORKOUTX_API_KEY;
const BUCKET = 'exercise-demos';
const supa = { apikey: SRK, Authorization: `Bearer ${SRK}` };

const SAMPLE = [
  'barbell-close-grip-bench-press', 'cable-bench-straight-leg-kickback',
  'bulgarian-split-squat', 'kettlebell-single-arm-row', '0003', // 0003 = Air Bike
];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : SAMPLE;

const isWorkoutXGif = (u) => !!u && /workoutxapp\.com/.test(u) && !/\.mp4(\?|$)/i.test(u);
const publicUrl = (id) => `${URL_}/storage/v1/object/public/${BUCKET}/${id}.gif`;

// ── ensure the public bucket exists ───────────────────────────────────────────
async function ensureBucket() {
  const got = await fetch(`${URL_}/storage/v1/bucket/${BUCKET}`, { headers: supa });
  if (got.ok) { console.log(`bucket "${BUCKET}" already exists`); return; }
  const res = await fetch(`${URL_}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...supa, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!res.ok) throw new Error(`bucket create failed (${res.status}): ${await res.text()}`);
  console.log(`bucket "${BUCKET}" created (public)`);
}

async function rowsFor(idList) {
  const inList = idList.map((i) => `"${i}"`).join(',');
  const res = await fetch(`${URL_}/rest/v1/exercises?select=id,name,gif_url&id=in.(${inList})`, { headers: supa });
  if (!res.ok) throw new Error(`row fetch failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function downloadAndStore(row) {
  // download from WorkoutX with the API key
  const dl = await fetch(row.gif_url, { headers: { 'X-WorkoutX-Key': WX_KEY, accept: 'image/gif' } });
  if (!dl.ok) throw new Error(`download failed (${dl.status})`);
  const bytes = Buffer.from(await dl.arrayBuffer());

  // upload to our storage (upsert)
  const up = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${row.id}.gif`, {
    method: 'POST',
    headers: { ...supa, 'Content-Type': 'image/gif', 'x-upsert': 'true', 'cache-control': '31536000' },
    body: bytes,
  });
  if (!up.ok) throw new Error(`upload failed (${up.status}): ${await up.text()}`);

  // record on the row (no-op if the column isn't there yet)
  const patch = await fetch(`${URL_}/rest/v1/exercises?id=eq.${encodeURIComponent(row.id)}`, {
    method: 'PATCH',
    headers: { ...supa, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ demo_gif_url: publicUrl(row.id) }),
  });
  const saved = patch.ok;
  return { bytes: bytes.length, saved, savedNote: saved ? '' : `(demo_gif_url not saved: ${patch.status} — column missing?)` };
}

// ── run ───────────────────────────────────────────────────────────────────────
await ensureBucket();
const rows = await rowsFor(ids);
console.log(`\nProcessing ${rows.length} exercise(s):`);
let stored = 0;
for (const row of rows) {
  if (!isWorkoutXGif(row.gif_url)) {
    console.log(`  – ${row.name}: skip (already MoveKit / no WorkoutX gif)`);
    continue;
  }
  try {
    const r = await downloadAndStore(row);
    stored++;
    console.log(`  ✓ ${row.name}: ${(r.bytes / 1024).toFixed(0)} KB → ${publicUrl(row.id)} ${r.savedNote}`);
  } catch (e) {
    console.log(`  ✗ ${row.name}: ${e.message}`);
  }
}
console.log(`\nDone. Stored ${stored} demo gif(s) in "${BUCKET}".`);
