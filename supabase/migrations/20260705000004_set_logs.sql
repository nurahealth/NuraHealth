-- Strength logging — one row per performed set. There was no prior per-set /
-- weight-logging table (workout_exercises holds only the PRESCRIBED plan;
-- workout_completions is session/date-level), so this is a fresh table, not a
-- parallel of anything. Powers the Progress screen's "Strength" section (recent
-- PRs, per-exercise weight-over-time, weekly volume trend).
--
-- Links to workout_completions via completion_id (nullable): sets logged inside
-- a tracked session point at it; standalone per-exercise logging leaves it null.
-- Owner-only, matching every other fitness table. Idempotent (safe to re-run).

create table if not exists public.set_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  exercise_id    text not null references public.exercises(id),
  completion_id  uuid references public.workout_completions(id) on delete set null,
  performed_on   date not null default current_date,
  set_index      int not null default 1,
  weight         numeric,
  reps           int,
  unit           text not null default 'lb',
  created_at     timestamptz not null default now()
);

create index if not exists set_logs_user_id_idx
  on public.set_logs(user_id);
create index if not exists set_logs_user_exercise_idx
  on public.set_logs(user_id, exercise_id);
create index if not exists set_logs_user_performed_idx
  on public.set_logs(user_id, performed_on);

alter table public.set_logs enable row level security;

drop policy if exists set_logs_select_own on public.set_logs;
create policy set_logs_select_own on public.set_logs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists set_logs_insert_own on public.set_logs;
create policy set_logs_insert_own on public.set_logs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists set_logs_update_own on public.set_logs;
create policy set_logs_update_own on public.set_logs
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists set_logs_delete_own on public.set_logs;
create policy set_logs_delete_own on public.set_logs
  for delete to authenticated using (auth.uid() = user_id);

-- Reload PostgREST's schema cache so the new table is immediately queryable.
notify pgrst, 'reload schema';
