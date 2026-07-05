-- Consistency logging — record COMPLETED workouts (foundation for a Progress tab).
-- One row per completed workout: which program_workout, when, and how long.
-- No weight / per-set logging yet (intentionally out of scope).
--
-- duration_seconds is nullable: we only have it when the user used Start→Finish;
-- a bare "Mark complete" still records the date + which workout (duration null).

create table if not exists public.workout_completions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  program_workout_id uuid not null references public.program_workouts(id) on delete cascade,
  completed_at       timestamptz not null default now(),
  duration_seconds   int,
  created_at         timestamptz not null default now()
);

create index if not exists workout_completions_user_id_idx
  on public.workout_completions(user_id);
create index if not exists workout_completions_user_completed_idx
  on public.workout_completions(user_id, completed_at);

alter table public.workout_completions enable row level security;

-- Owner-only access, matching every other fitness table.
drop policy if exists workout_completions_select_own on public.workout_completions;
create policy workout_completions_select_own on public.workout_completions
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists workout_completions_insert_own on public.workout_completions;
create policy workout_completions_insert_own on public.workout_completions
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists workout_completions_update_own on public.workout_completions;
create policy workout_completions_update_own on public.workout_completions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists workout_completions_delete_own on public.workout_completions;
create policy workout_completions_delete_own on public.workout_completions
  for delete to authenticated using (auth.uid() = user_id);

-- Reload PostgREST's schema cache so the new table is immediately queryable.
notify pgrst, 'reload schema';
