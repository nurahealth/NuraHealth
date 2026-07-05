-- ─────────────────────────────────────────────────────────────────────────────
-- Dashboard preferences — per-user dashboard customization.
--
-- Stores the set of metric cards the user has manually hidden (Layer 2 of the
-- Customize feature). Layer 1 (auto-hide by data availability) is computed
-- client-side from connection state and needs no storage.
--
-- A dedicated table (rather than a column on profiles) keeps client write access
-- scoped to this preference only — adding a broad UPDATE policy on profiles would
-- risk letting users edit privileged columns (is_admin, onboarded, …).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.dashboard_preferences (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  hidden_metrics text[] not null default '{}',   -- metric ids the user has hidden
  updated_at     timestamptz not null default now()
);

alter table public.dashboard_preferences enable row level security;

-- Owner-only access (a user can only see/write their own row).
drop policy if exists dashboard_preferences_select_own on public.dashboard_preferences;
create policy dashboard_preferences_select_own
  on public.dashboard_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists dashboard_preferences_insert_own on public.dashboard_preferences;
create policy dashboard_preferences_insert_own
  on public.dashboard_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists dashboard_preferences_update_own on public.dashboard_preferences;
create policy dashboard_preferences_update_own
  on public.dashboard_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
