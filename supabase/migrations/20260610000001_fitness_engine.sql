-- ─────────────────────────────────────────────────────────────────────────────
-- Fitness training engine — data model (Step 1)
--
-- Tables:
--   exercises          reference catalog cache (read: any authed user; write: service role only)
--   fitness_programs   a user's training program          (RLS: owner-only)
--   program_workouts   days within a program              (RLS: via program ownership)
--   workout_exercises  exercises within a workout day      (RLS: via workout→program ownership)
--
-- gen_random_uuid() is available by default on Supabase (pgcrypto).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── exercises (catalog cache / reference data) ───────────────────────────────
create table if not exists public.exercises (
  id                text primary key,           -- stable id from the external source
  name              text not null,
  target_muscles    text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  body_part         text,
  equipment         text,
  gif_url           text,
  instructions      text[] not null default '{}',
  difficulty        text,
  updated_at        timestamptz not null default now()
);

alter table public.exercises enable row level security;

-- Any authenticated user may READ the catalog.
drop policy if exists exercises_read_authenticated on public.exercises;
create policy exercises_read_authenticated
  on public.exercises
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for authenticated/anon ⇒ writes are denied for
-- everyone EXCEPT the service role, which bypasses RLS. (That is the ingestion path.)


-- ── fitness_programs (owner-only) ────────────────────────────────────────────
create table if not exists public.fitness_programs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  goal          text,
  split_type    text,
  days_per_week int,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

create index if not exists fitness_programs_user_id_idx on public.fitness_programs(user_id);

alter table public.fitness_programs enable row level security;

drop policy if exists fitness_programs_select_own on public.fitness_programs;
create policy fitness_programs_select_own on public.fitness_programs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists fitness_programs_insert_own on public.fitness_programs;
create policy fitness_programs_insert_own on public.fitness_programs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists fitness_programs_update_own on public.fitness_programs;
create policy fitness_programs_update_own on public.fitness_programs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists fitness_programs_delete_own on public.fitness_programs;
create policy fitness_programs_delete_own on public.fitness_programs
  for delete to authenticated using (auth.uid() = user_id);


-- ── program_workouts (RLS via parent program ownership) ──────────────────────
create table if not exists public.program_workouts (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.fitness_programs(id) on delete cascade,
  day_index   int not null check (day_index between 0 and 6),
  title       text,
  focus       text,
  is_rest     boolean not null default false,
  sort_order  int not null default 0
);

create index if not exists program_workouts_program_id_idx on public.program_workouts(program_id);

alter table public.program_workouts enable row level security;

-- Owns the workout iff they own its program.
drop policy if exists program_workouts_select_own on public.program_workouts;
create policy program_workouts_select_own on public.program_workouts
  for select to authenticated
  using (exists (select 1 from public.fitness_programs p
                 where p.id = program_id and p.user_id = auth.uid()));

drop policy if exists program_workouts_insert_own on public.program_workouts;
create policy program_workouts_insert_own on public.program_workouts
  for insert to authenticated
  with check (exists (select 1 from public.fitness_programs p
                      where p.id = program_id and p.user_id = auth.uid()));

drop policy if exists program_workouts_update_own on public.program_workouts;
create policy program_workouts_update_own on public.program_workouts
  for update to authenticated
  using (exists (select 1 from public.fitness_programs p
                 where p.id = program_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.fitness_programs p
                      where p.id = program_id and p.user_id = auth.uid()));

drop policy if exists program_workouts_delete_own on public.program_workouts;
create policy program_workouts_delete_own on public.program_workouts
  for delete to authenticated
  using (exists (select 1 from public.fitness_programs p
                 where p.id = program_id and p.user_id = auth.uid()));


-- ── workout_exercises (RLS via workout → program ownership) ───────────────────
-- Note: "order" is a SQL reserved word, so it is quoted everywhere.
create table if not exists public.workout_exercises (
  id            uuid primary key default gen_random_uuid(),
  workout_id    uuid not null references public.program_workouts(id) on delete cascade,
  exercise_id   text not null references public.exercises(id),
  "order"       int not null default 0,
  sets          int,
  reps          text,         -- e.g. '8-12'
  rest_seconds  int,
  notes         text
);

create index if not exists workout_exercises_workout_id_idx  on public.workout_exercises(workout_id);
create index if not exists workout_exercises_exercise_id_idx on public.workout_exercises(exercise_id);

alter table public.workout_exercises enable row level security;

-- Ownership resolved by joining workout → program.
drop policy if exists workout_exercises_select_own on public.workout_exercises;
create policy workout_exercises_select_own on public.workout_exercises
  for select to authenticated
  using (exists (select 1 from public.program_workouts w
                 join public.fitness_programs p on p.id = w.program_id
                 where w.id = workout_id and p.user_id = auth.uid()));

drop policy if exists workout_exercises_insert_own on public.workout_exercises;
create policy workout_exercises_insert_own on public.workout_exercises
  for insert to authenticated
  with check (exists (select 1 from public.program_workouts w
                      join public.fitness_programs p on p.id = w.program_id
                      where w.id = workout_id and p.user_id = auth.uid()));

drop policy if exists workout_exercises_update_own on public.workout_exercises;
create policy workout_exercises_update_own on public.workout_exercises
  for update to authenticated
  using (exists (select 1 from public.program_workouts w
                 join public.fitness_programs p on p.id = w.program_id
                 where w.id = workout_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.program_workouts w
                      join public.fitness_programs p on p.id = w.program_id
                      where w.id = workout_id and p.user_id = auth.uid()));

drop policy if exists workout_exercises_delete_own on public.workout_exercises;
create policy workout_exercises_delete_own on public.workout_exercises
  for delete to authenticated
  using (exists (select 1 from public.program_workouts w
                 join public.fitness_programs p on p.id = w.program_id
                 where w.id = workout_id and p.user_id = auth.uid()));
