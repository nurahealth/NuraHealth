// Full-catalog backfill: download EVERY exercise's WorkoutX GIF into the public
// `exercise-demos` bucket and (when the column exists) record the public URL on
// exercises.demo_gif_url. Idempotent: already-stored gifs are skipped, so re-runs
// are cheap and a post-migration run just populates the column.
//
//   node scripts/backfill-demo-gifs.mjs
//
// • Pace: ≥420ms between WorkoutX fetches (~143/min) to stay under the 150/min cap.
// • Resilience: each gif retried up to 3× with a pause, then skipped — never restarts.
// • Progress printed as it goes; final succeeded/failed/skipped summary.

import { readFileSync } from 'node:fs';

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

const PACE_MS = 420;        // ≥ this between WorkoutX fetch starts → ~143/min
const RETRIES = 3;          // attempts per gif before skipping
const RETRY_PAUSE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const publicUrl = (id) => `${URL_}/storage/v1/object/public/${BUCKET}/${id}.gif`;
const isWorkoutXGif = (u) => !!u && /workoutxapp\.com/.test(u) && !/\.mp4(\?|$)/i.test(u);

async function ensureBucket() {
  const got = await fetch(`${URL_}/storage/v1/bucket/${BUCKET}`, { headers: supa });
  if (got.ok) return;
  const res = await fetch(`${URL_}/storage/v1/bucket`, {
    method: 'POST', headers: { ...supa, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (!res.ok) throw new Error(`bucket create failed (${res.status}): ${await res.text()}`);
}

// All exercises whose demo source is a WorkoutX gif (paginated).
async function allCandidates() {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${URL_}/rest/v1/exercises?select=id,gif_url&gif_url=like.*workoutxapp*&limit=1000&offset=${offset}`, { headers: supa });
    if (!res.ok) throw new Error(`candidate fetch failed (${res.status}): ${await res.text()}`);
    const page = await res.json();
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out.filter((r) => isWorkoutXGif(r.gif_url));
}

// ids already present in storage (so we never re-fetch).
async function alreadyStored() {
  const ids = new Set();
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${URL_}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST', headers: { ...supa, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`storage list failed (${res.status}): ${await res.text()}`);
    const page = await res.json();
    for (const o of page) if (o.name?.endsWith('.gif')) ids.add(o.name.replace(/\.gif$/, ''));
    if (page.length < 1000) break;
  }
  return ids;
}

async function columnExists() {
  const res = await fetch(`${URL_}/rest/v1/exercises?select=demo_gif_url&limit=1`, { headers: supa });
  return res.ok;
}

async function fetchGif(url) {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'X-WorkoutX-Key': WX_KEY, accept: 'image/gif' } });
      if (res.status === 429) { await sleep(5000); throw new Error('429'); }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (attempt === RETRIES) throw e;
      await sleep(RETRY_PAUSE_MS);
    }
  }
}

async function upload(id, bytes) {
  const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${id}.gif`, {
    method: 'POST',
    headers: { ...supa, 'Content-Type': 'image/gif', 'x-upsert': 'true', 'cache-control': '31536000' },
    body: bytes,
  });
  if (!res.ok) throw new Error(`upload ${res.status}: ${(await res.text()).slice(0, 120)}`);
}

async function patchUrl(id) {
  const res = await fetch(`${URL_}/rest/v1/exercises?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', headers: { ...supa, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ demo_gif_url: publicUrl(id) }),
  });
  return res.ok;
}

// ── run ───────────────────────────────────────────────────────────────────────
await ensureBucket();
const canSave = await columnExists();
const candidates = await allCandidates();
const stored = await alreadyStored();
const todo = candidates.filter((r) => !stored.has(r.id));
const total = candidates.length;

console.log(`Catalog: ${total} WorkoutX-gif exercises | already stored: ${stored.size} | to download: ${todo.length}`);
console.log(`demo_gif_url column: ${canSave ? 'present — will save URLs' : 'MISSING — downloads only; apply the migration then re-run to populate it'}\n`);

let ok = 0, failed = 0, savedCol = 0;
const failures = [];
let done = stored.size; // count toward the catalog-wide progress

for (let i = 0; i < todo.length; i++) {
  const row = todo[i];
  const started = Date.now();
  try {
    const bytes = await fetchGif(row.gif_url);
    await upload(row.id, bytes);
    ok++;
    if (canSave && await patchUrl(row.id)) savedCol++;
  } catch (e) {
    failed++; failures.push(row.id);
    console.log(`  ✗ ${row.id}: ${e.message} — skipped`);
  }
  done++;
  if (ok % 25 === 0 && ok > 0) console.log(`  ${done} / ${total} downloaded (${ok} new this run, ${failed} failed)`);
  const elapsed = Date.now() - started;
  if (i < todo.length - 1 && elapsed < PACE_MS) await sleep(PACE_MS - elapsed);
}

// If the column exists, make sure previously-stored rows (e.g. the sample) are recorded too.
if (canSave) {
  for (const row of candidates) {
    if (todo.includes(row)) continue; // already patched above when newly downloaded
    if (await patchUrl(row.id)) savedCol++;
  }
}

console.log(`\n══════════════ BACKFILL COMPLETE ══════════════`);
console.log(`Catalog WorkoutX-gif exercises : ${total}`);
console.log(`Newly downloaded this run      : ${ok}`);
console.log(`Skipped (already stored)       : ${stored.size}`);
console.log(`Failed                         : ${failed}${failures.length ? ' — ' + failures.join(', ') : ''}`);
console.log(`demo_gif_url saved             : ${canSave ? savedCol : 'n/a (column missing)'}`);
console.log(`Total now in storage           : ${stored.size + ok}`);
