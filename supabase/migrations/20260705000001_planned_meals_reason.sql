-- ─────────────────────────────────────────────────────────────────────────────
-- planned_meals: add an explainability column.
--
-- `reason` is the short, human-readable rationale the meal-plan engine recorded
-- when it chose this recipe for this slot, e.g.
--   "Wild salmon is a top Vitamin D food — your last reading was 22 ng/mL."
--
-- Nullable: fallback picks (no flagged marker) and older rows simply have none.
-- Idempotent and additive — safe to run any time.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.planned_meals
  add column if not exists reason text;
