// One-time: upload MoveKit clips + posters to the public `exercise-media` bucket.
// Re-run-safe: skips files already in the bucket. Run from repo root.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SRC = '/Users/austin/Desktop';
const CLIPS_DIR = path.join(SRC, 'full-library');
const POSTERS_DIR = path.join(SRC, 'posters');
const BUCKET = 'exercise-media';
const CONCURRENCY = 6;

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'));

// 1. Ensure public bucket.
{
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) { console.error('createBucket:', error.message); process.exit(1); }
    console.log(`Created public bucket "${BUCKET}".`);
  } else { console.log(`Bucket "${BUCKET}" exists.`); }
}

// 2. List what's already uploaded (to skip on re-run).
async function existing(prefix) {
  const have = new Set();
  for (let page = 0; ; page++) {
    const { data } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000, offset: page * 1000 });
    if (!data?.length) break;
    data.forEach((f) => have.add(`${prefix}/${f.name}`));
    if (data.length < 1000) break;
  }
  return have;
}
const haveClips = await existing('clips');
const havePosters = await existing('posters');

// 3. Build the work list.
const clips = fs.readdirSync(CLIPS_DIR).filter((f) => f.endsWith('.mp4'))
  .map((f) => ({ local: path.join(CLIPS_DIR, f), key: `clips/${f}`, ct: 'video/mp4' }));
const posters = fs.readdirSync(POSTERS_DIR).filter((f) => f.endsWith('.webp'))
  .map((f) => ({ local: path.join(POSTERS_DIR, f), key: `posters/${f}`, ct: 'image/webp' }));
const work = [...clips, ...posters].filter((w) => !(w.key.startsWith('clips') ? haveClips : havePosters).has(w.key));

console.log(`To upload: ${work.length} (clips ${clips.length}, posters ${posters.length}; skipping ${clips.length + posters.length - work.length} already present).`);

let done = 0, bytes = 0, failed = 0;
async function worker(items) {
  for (const w of items) {
    try {
      const buf = fs.readFileSync(w.local);
      const { error } = await sb.storage.from(BUCKET).upload(w.key, buf, { contentType: w.ct, upsert: true });
      if (error) { failed++; console.error(`  FAIL ${w.key}: ${error.message}`); continue; }
      done++; bytes += buf.length;
      if (done % 20 === 0) console.log(`  ${done}/${work.length} uploaded (${(bytes / 1e6).toFixed(0)} MB)…`);
    } catch (e) { failed++; console.error(`  ERR ${w.key}: ${e.message}`); }
  }
}
// Round-robin split across workers.
const lanes = Array.from({ length: CONCURRENCY }, () => []);
work.forEach((w, i) => lanes[i % CONCURRENCY].push(w));
await Promise.all(lanes.map(worker));

console.log(`\nUploaded ${done} files (${(bytes / 1e6).toFixed(1)} MB), ${failed} failed.`);
