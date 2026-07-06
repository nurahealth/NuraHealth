-- recipes.image_url — optional hero/card photo. When null, the UI falls back to
-- the deterministic sage gradient (the design-system default), so this is purely
-- additive. Also provisions the public `recipe-images` Storage bucket that the
-- admin upload writes to. Idempotent — safe to re-run.

alter table public.recipes
  add column if not exists image_url text;

-- ── Public storage bucket for recipe photos ──────────────────────────────────
-- Recipe photos are non-sensitive, so the bucket is public (served via plain
-- public URLs). Admin uploads run through the service role, which bypasses RLS;
-- the read policy below lets the resulting <img> URLs resolve for everyone.
-- Upsert public=true: if the bucket was already created (e.g. privately, by
-- hand), still flip it public — recipe photos are served via public URLs.
insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do update set public = true;

drop policy if exists recipe_images_public_read on storage.objects;
create policy recipe_images_public_read on storage.objects
  for select to public using (bucket_id = 'recipe-images');

-- Reload PostgREST's schema cache so the new column is immediately queryable.
notify pgrst, 'reload schema';
