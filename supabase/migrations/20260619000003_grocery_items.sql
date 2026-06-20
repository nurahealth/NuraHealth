-- Grocery list — user-owned, fully editable shopping list.
--
-- Replaces the previous client-only (localStorage) checked state with a real
-- per-user table. Items are either pulled from the current week's plan
-- (source='plan', populated from planned_meals → recipe_ingredients, deduped)
-- or added by hand (source='manual'). From first load on, the grocery page reads
-- and writes this table: check off, edit name/amount, add, and remove.
--
-- gen_random_uuid() is available by default on Supabase (pgcrypto).
-- Idempotent: safe to re-run.

create table if not exists public.grocery_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  amount_text text,
  category    text not null default 'other',
  is_checked  boolean not null default false,
  source      text not null default 'manual' check (source in ('plan', 'manual')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists grocery_items_user_idx on public.grocery_items (user_id);

alter table public.grocery_items enable row level security;

-- Owner-only access (same pattern as fitness_programs / planned_meals).
drop policy if exists grocery_items_select_own on public.grocery_items;
create policy grocery_items_select_own on public.grocery_items
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists grocery_items_insert_own on public.grocery_items;
create policy grocery_items_insert_own on public.grocery_items
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists grocery_items_update_own on public.grocery_items;
create policy grocery_items_update_own on public.grocery_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists grocery_items_delete_own on public.grocery_items;
create policy grocery_items_delete_own on public.grocery_items
  for delete to authenticated using (auth.uid() = user_id);

-- Reload PostgREST's schema cache so the new table is immediately queryable.
notify pgrst, 'reload schema';
