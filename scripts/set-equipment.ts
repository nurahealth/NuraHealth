// One-off: set a user's fitness_profiles.equipment to a given JSON array.
//   node --experimental-strip-types scripts/set-equipment.ts <email> '["Dumbbells only","Bodyweight only"]'
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim().replace(/\r$/, '');
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (process.env[m[1]] === undefined) process.env[m[1]] = v;
}

const email = process.argv[2];
const equipment = JSON.parse(process.argv[3]);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
const u = list.users.find((x) => (x.email ?? '').toLowerCase() === email.toLowerCase());
if (!u) throw new Error(`no user ${email}`);

const { data: before } = await supabase.from('fitness_profiles').select('equipment').eq('user_id', u.id).single();
console.log('before:', JSON.stringify(before?.equipment));
const { error } = await supabase.from('fitness_profiles').update({ equipment }).eq('user_id', u.id);
if (error) throw error;
console.log('after: ', JSON.stringify(equipment));
