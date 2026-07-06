-- recipes focal point — where the photo should stay centered when cropped to
-- different aspect ratios (card vs hero). Two 0–1 floats; NULL means centered
-- (0.5, 0.5). Purely additive. Idempotent — safe to re-run.

alter table public.recipes
  add column if not exists focal_x real,
  add column if not exists focal_y real;

-- Reload PostgREST's schema cache so the new columns are immediately queryable.
notify pgrst, 'reload schema';
