-- Store the user's stated limitations on the program (for later injury-aware
-- exercise filtering; not filtered on yet). Required by POST /api/fitness/generate-program.
alter table public.fitness_programs add column if not exists limitations text;
