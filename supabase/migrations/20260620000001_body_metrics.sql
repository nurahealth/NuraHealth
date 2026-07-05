-- Body & weight tracking — one row per weigh-in. Powers the Progress screen's
-- "Body" section (current weight, change vs last, weight trend chart).
-- Owner-only, matching every other fitness table. Idempotent (safe to re-run).

create table if not exists public.body_metrics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  recorded_on   date not null default current_date,
  weight        numeric,
  unit          text default 'lb',
  body_fat_pct  numeric,
  waist         numeric,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists body_metrics_user_id_idx
  on public.body_metrics(user_id);
create index if not exists body_metrics_user_recorded_idx
  on public.body_metrics(user_id, recorded_on);

alter table public.body_metrics enable row level security;

drop policy if exists body_metrics_select_own on public.body_metrics;
create policy body_metrics_select_own on public.body_metrics
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists body_metrics_insert_own on public.body_metrics;
create policy body_metrics_insert_own on public.body_metrics
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists body_metrics_update_own on public.body_metrics;
create policy body_metrics_update_own on public.body_metrics
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists body_metrics_delete_own on public.body_metrics;
create policy body_metrics_delete_own on public.body_metrics
  for delete to authenticated using (auth.uid() = user_id);

-- Reload PostgREST's schema cache so the new table is immediately queryable.
notify pgrst, 'reload schema';
