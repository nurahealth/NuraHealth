-- Per-photo fit preference — how the image sits in its portrait (3:4) frame:
--   'fill'    → object-fit: cover  (fills the frame, may crop edges) — default
--   'contain' → object-fit: contain (whole photo, letterboxed)
-- Idempotent (safe to re-run).

alter table public.progress_photos
  add column if not exists fit text not null default 'fill';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'progress_photos_fit_chk') then
    alter table public.progress_photos
      add constraint progress_photos_fit_chk check (fit in ('fill', 'contain'));
  end if;
end $$;

-- Reload PostgREST's schema cache so the new column is immediately queryable.
notify pgrst, 'reload schema';
