-- The fitness onboarding writes here (one row per user). Was referenced by the
-- app but never created in this database, so onboarding never persisted and the
-- flow re-ran every visit. Idempotent: safe to run even if it already exists.

create table if not exists public.fitness_profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  primary_goal     text,
  experience_level text,
  equipment        text[] not null default '{}',
  days_per_week    int,
  limitations      text,
  onboarded        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.fitness_profiles enable row level security;

drop policy if exists fitness_profiles_select_own on public.fitness_profiles;
create policy fitness_profiles_select_own on public.fitness_profiles
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists fitness_profiles_insert_own on public.fitness_profiles;
create policy fitness_profiles_insert_own on public.fitness_profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists fitness_profiles_update_own on public.fitness_profiles;
create policy fitness_profiles_update_own on public.fitness_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists fitness_profiles_delete_own on public.fitness_profiles;
create policy fitness_profiles_delete_own on public.fitness_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- If the table already existed but PostgREST 404s it, reload its schema cache:
notify pgrst, 'reload schema';
