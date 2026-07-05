// One-time: replace the exercises catalog with MoveKit, and clear old test
// programs (they reference the old WorkoutX ids). Re-run-safe. Run from repo root.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const META = '/Users/austin/Desktop/full-library-metadata/metadata.json';
const BUCKET = 'exercise-media';

const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '');
const SUPABASE_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const sb = createClient(SUPABASE_URL, get('SUPABASE_SERVICE_ROLE_KEY'));

const mediaUrl = (slug) => `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/clips/${slug}.mp4`;

// MoveKit primaryMuscle → body_part token, chosen so the existing muscle-group
// mapping (muscleGroups.ts) and the program generator's focus matching work
// against MoveKit unchanged (they already match on body_part).
const BODY_PART = {
  Chest: 'chest',
  Back: 'back', Trapezius: 'back',
  Shoulders: 'shoulders',
  Biceps: 'upper arms', Triceps: 'upper arms', Forearms: 'lower arms',
  Quadriceps: 'upper legs', Hamstrings: 'upper legs', Glutes: 'upper legs', Calves: 'lower legs',
  Core: 'waist',
};
const bodyPartOf = (primary) => {
  for (const m of primary ?? []) if (BODY_PART[m]) return BODY_PART[m];
  return null;
};
// Normalise so the generator's equipment matching ("body weight") still works.
const normEquip = (e) => (e === 'Bodyweight' ? 'Body Weight' : e);

const meta = JSON.parse(fs.readFileSync(META, 'utf8'));
console.log(`MoveKit manifest: ${meta.length} exercises.`);

// 1. Clear old test programs (children first to satisfy FKs).
for (const t of ['workout_exercises', 'program_workouts', 'fitness_programs']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
  const { error } = await sb.from(t).delete().not('id', 'is', null);
  console.log(`cleared ${t}: ${count ?? '?'} rows ${error ? '(ERROR: ' + error.message + ')' : 'deleted'}`);
}

// 2. Replace the catalog: drop old (WorkoutX) rows, insert MoveKit.
{
  const { count } = await sb.from('exercises').select('*', { count: 'exact', head: true });
  const { error } = await sb.from('exercises').delete().not('id', 'is', null);
  console.log(`cleared exercises: ${count ?? '?'} old rows ${error ? '(ERROR: ' + error.message + ')' : 'deleted'}`);
}

const rows = meta.map((m) => ({
  id: m.slug,
  name: m.name,
  target_muscles: m.primaryMuscles ?? [],
  secondary_muscles: m.secondaryMuscles ?? [],
  body_part: bodyPartOf(m.primaryMuscles),
  equipment: (m.equipment ?? []).map(normEquip).join(', ') || null,
  gif_url: mediaUrl(m.slug),
  instructions: m.instructions ?? [],
  difficulty: m.difficulty ?? null,
}));

// Insert in chunks.
let inserted = 0;
for (let i = 0; i < rows.length; i += 100) {
  const chunk = rows.slice(i, i + 100);
  const { error } = await sb.from('exercises').upsert(chunk, { onConflict: 'id' });
  if (error) { console.error('insert error:', error.message); process.exit(1); }
  inserted += chunk.length;
}
console.log(`upserted ${inserted} MoveKit exercises.`);

// 3. Verify.
const { count: total } = await sb.from('exercises').select('*', { count: 'exact', head: true });
const { data: sample } = await sb.from('exercises').select('id,name,body_part,equipment,gif_url,difficulty').eq('id', 'band-curl').maybeSingle();
const bp = {};
const { data: all } = await sb.from('exercises').select('body_part');
all.forEach((e) => { bp[e.body_part ?? '(null)'] = (bp[e.body_part ?? '(null)'] || 0) + 1; });
console.log('\n──────── SUMMARY ────────');
console.log('exercises now in table:', total);
console.log('body_part distribution:', JSON.stringify(bp));
console.log('sample (band-curl):', JSON.stringify(sample));
