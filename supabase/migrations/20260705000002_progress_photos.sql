-- Progress photos — one row per uploaded photo. Powers the Progress screen's
-- "Progress Photos" section (thumbnail row, larger view, before/after compare).
-- Owner-only, matching every other fitness table. Images live in a PRIVATE
-- storage bucket and are served exclusively via short-lived signed URLs, so a
-- photo is never reachable without the owner's session. Idempotent (safe to re-run).

create table if not exists public.progress_photos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  taken_on      date not null default current_date,
  storage_path  text not null,
  pose          text,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists progress_photos_user_id_idx
  on public.progress_photos(user_id);
create index if not exists progress_photos_user_taken_idx
  on public.progress_photos(user_id, taken_on);

alter table public.progress_photos enable row level security;

drop policy if exists progress_photos_select_own on public.progress_photos;
create policy progress_photos_select_own on public.progress_photos
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists progress_photos_insert_own on public.progress_photos;
create policy progress_photos_insert_own on public.progress_photos
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists progress_photos_update_own on public.progress_photos;
create policy progress_photos_update_own on public.progress_photos
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists progress_photos_delete_own on public.progress_photos;
create policy progress_photos_delete_own on public.progress_photos
  for delete to authenticated using (auth.uid() = user_id);

-- ── Private storage bucket ───────────────────────────────────────────────────
-- Not public: objects are only accessible through signed URLs the owner mints.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Owner-only object access. Files are keyed under a per-user folder
-- (`<uid>/<file>`), so the first path segment must equal the caller's uid.
drop policy if exists progress_photos_obj_select on storage.objects;
create policy progress_photos_obj_select on storage.objects
  for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists progress_photos_obj_insert on storage.objects;
create policy progress_photos_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists progress_photos_obj_update on storage.objects;
create policy progress_photos_obj_update on storage.objects
  for update to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists progress_photos_obj_delete on storage.objects;
create policy progress_photos_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Reload PostgREST's schema cache so the new table is immediately queryable.
notify pgrst, 'reload schema';
