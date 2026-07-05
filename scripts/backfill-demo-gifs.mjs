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

// All exercises whose demo source is a WorkoutX gif (paginated). Includes
// demo_gif_url when the column exists so resume can skip already-recorded rows.
async function allCandidates(withUrl) {
  const select = withUrl ? 'id,gif_url,demo_gif_url' : 'id,gif_url';
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${URL_}/rest/v1/exercises?select=${select}&gif_url=like.*workoutxapp*&limit=1000&offset=${offset}`, { headers: supa });
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
const candidates = await allCandidates(canSave);
const stored = await alreadyStored();
const total = candidates.length;

// Resume-safe "done": file in storage AND (no column → fine; column → URL recorded).
const isDone = (r) => stored.has(r.id) && (!canSave || !!r.demo_gif_url);
const pending = candidates.filter((r) => !isDone(r));
const skipped = total - pending.length;

console.log(`Catalog: ${total} WorkoutX-gif exercises | already done: ${skipped} | to process: ${pending.length}`);
console.log(`demo_gif_url column: ${canSave ? 'present — saving URLs' : 'MISSING — storing gifs only; apply the migration then re-run to populate URLs'}\n`);

let downloaded = 0, savedCol = 0, failed = 0, processed = 0;
const failures = [];

for (let i = 0; i < pending.length; i++) {
  const row = pending[i];
  const started = Date.now();
  let didFetch = false;
  try {
    if (!stored.has(row.id)) {                 // download only if not already stored
      const bytes = await fetchGif(row.gif_url); // retries 3× internally, throws on give-up
      await upload(row.id, bytes);
      downloaded++; didFetch = true;
    }
    if (canSave && !row.demo_gif_url && await patchUrl(row.id)) savedCol++;
  } catch (e) {
    failed++; failures.push(row.id);
    console.log(`  ✗ ${row.id}: ${e.message} — skipped`);
  }
  processed++;
  if (processed % 25 === 0) console.log(`  ${skipped + processed} / ${total} done (${downloaded} downloaded, ${savedCol} url-saved, ${failed} failed)`);
  if (didFetch && i < pending.length - 1) {     // pace only when we actually called WorkoutX
    const elapsed = Date.now() - started;
    if (elapsed < PACE_MS) await sleep(PACE_MS - elapsed);
  }
}

console.log(`\n══════════════ BACKFILL COMPLETE ══════════════`);
console.log(`Catalog WorkoutX-gif exercises : ${total}`);
console.log(`Succeeded (downloaded this run): ${downloaded}`);
console.log(`Skipped (already done)         : ${skipped}`);
console.log(`demo_gif_url saved this run    : ${canSave ? savedCol : 'n/a (column missing)'}`);
console.log(`Failed (${failures.length})${failures.length ? ': ' + failures.join(', ') : ''}`);
console.log(`Total now in storage           : ${stored.size + downloaded}`);
