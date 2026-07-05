-- Plan Settings — let users customise the program beyond the onboarding answers.
-- Adds three preference columns to fitness_profiles so the generator can honor an
-- explicit split, prioritised muscles, and a per-session time budget. Idempotent.
--
-- split          'Full Body' | 'Push-Pull-Legs' | 'Upper-Lower' (null ⇒ derive from days)
-- focus_areas    muscle chips to give extra volume, e.g. {'Chest','Glutes'} (empty ⇒ balanced)
-- session_length minutes per session: 20 | 30 | 45 | 60 (null ⇒ fall back to experience level)

alter table public.fitness_profiles add column if not exists split          text;
alter table public.fitness_profiles add column if not exists focus_areas    text[] not null default '{}';
alter table public.fitness_profiles add column if not exists session_length int;

-- RLS already covers every column on this table (owner-only select/insert/update),
-- so the new columns inherit the existing policies — nothing else to grant.

-- Reload PostgREST's schema cache so the new columns are immediately queryable.
notify pgrst, 'reload schema';
