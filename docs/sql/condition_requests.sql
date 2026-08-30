-- ─────────────────────────────────────────────────────────────────────────────
-- condition_requests — "Request a condition" from the /conditions index.
--
-- RUN THIS BY HAND IN THE SUPABASE SQL EDITOR. It is NOT applied by the repo:
-- supabase/migrations/ is stale and does not match the live database (BRAIN.md),
-- so nothing in that folder should ever be run against this project.
--
-- Same shape and same owner-only RLS as exercise_requests, which the fitness
-- section's "Request an exercise" flow writes to. Until this runs, the modal
-- fails gracefully — the insert returns a PostgREST error, the user sees
-- "Couldn't send that just now — please try again later", and nothing throws.
--
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.condition_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  details     text,
  created_at  timestamptz not null default now()
);

create index if not exists condition_requests_user_id_idx
  on public.condition_requests(user_id);
create index if not exists condition_requests_created_at_idx
  on public.condition_requests(created_at desc);

alter table public.condition_requests enable row level security;

-- Users read and write only their own rows. Owner review happens in the
-- Supabase dashboard with the service role, which bypasses RLS — so there is
-- deliberately no update or delete policy here.
drop policy if exists condition_requests_select_own on public.condition_requests;
create policy condition_requests_select_own on public.condition_requests
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists condition_requests_insert_own on public.condition_requests;
create policy condition_requests_insert_own on public.condition_requests
  for insert to authenticated with check (auth.uid() = user_id);

grant select, insert on public.condition_requests to authenticated;

-- Reload PostgREST's schema cache so the table is queryable immediately.
notify pgrst, 'reload schema';
