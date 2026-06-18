-- ─────────────────────────────────────────────────────────────────────────────
-- Richer WorkoutX catalog fields
--
-- The paid WorkoutX plan returns metadata beyond the original columns. `difficulty`
-- already exists; this adds the rest. All columns are nullable and added IF NOT
-- EXISTS so the ingest can run before or after this migration and never errors on
-- a missing field (it just stores fewer columns until these exist).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.exercises add column if not exists category            text;
alter table public.exercises add column if not exists mechanic            text;    -- compound | isolation
alter table public.exercises add column if not exists force               text;    -- push | pull | static
alter table public.exercises add column if not exists met                 numeric; -- metabolic equivalent
alter table public.exercises add column if not exists calories_per_minute numeric;
alter table public.exercises add column if not exists description         text;
