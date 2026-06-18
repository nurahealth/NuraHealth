-- ─────────────────────────────────────────────────────────────────────────────
-- Self-hosted demo gif URL
--
-- When an exercise has no MoveKit 3D clip, the detail screen falls back to its
-- WorkoutX gif. We download those server-side and store them in the public
-- `exercise-demos` Storage bucket so they survive cancelling the WorkoutX plan.
-- This column holds the resulting public URL (nullable; only set once downloaded).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.exercises add column if not exists demo_gif_url text;
