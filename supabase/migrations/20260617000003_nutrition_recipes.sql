-- ─────────────────────────────────────────────────────────────────────────────
-- Nutrition & Recipes — data foundation (schema 5.0)
--
-- Adds the content + user data model behind the personalized Nutrition tab and
-- the standalone Recipes tab. NO UI in this migration.
--
-- Table groups
--   Content (admin-managed; read: any authed user, write: service role only):
--     recipes, ingredients, recipe_ingredients, health_markers, marker_foods
--   User-owned (RLS owner-only, modeled on dashboard_preferences):
--     nutrition_preferences, planned_meals, saved_recipes
--
-- Integration note — DO NOT duplicate user lab values.
--   The user's actual marker VALUES already live in the existing `biomarkers`
--   table (per `lab_panels`), keyed by `name`. This migration adds NO parallel
--   table of user lab values. Instead `health_markers` is the marker *catalog*
--   (metadata + nutrition guidance). Its `slug` is aligned to the stable ids in
--   src/lib/biomarkerCatalog.ts (vit-d, ldl-c, hs-crp, …) so the Nutrition tab
--   resolves a user's real value via the existing catalog alias→biomarkers.name
--   matcher. `marker_foods` and `planned_meals.target_marker_slug` reference
--   these slugs.
--
-- gen_random_uuid() is available by default on Supabase (pgcrypto).
-- ─────────────────────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════════════════════
-- CONTENT TABLES  (read: authenticated; write: service role only)
-- ═════════════════════════════════════════════════════════════════════════════

-- ── ingredients (foods knowledge base) ───────────────────────────────────────
-- The cellular deep-dive is written ONCE here and reused by every recipe row
-- that references the ingredient (recipe_ingredients only points at it).
create table if not exists public.ingredients (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,
  name               text not null,
  category           text not null
                       check (category in ('root-spice','greens','legumes',
                                           'good-fats','ferments','protein','fruit')),
  tagline            text,
  is_organic         boolean not null default false,
  supports_systems   text[] not null default '{}',   -- e.g. {inflammation,detox,joints}
  active_compounds   text[] not null default '{}',   -- e.g. {curcumin,turmerone}
  cellular_explainer jsonb  not null default '[]'::jsonb,  -- [{heading, body}] "what it does in your cells"
  how_to_use         jsonb  not null default '[]'::jsonb,  -- [{n, text}]
  pairs_with         text[] not null default '{}',   -- ingredient slugs (soft ref, no FK)
  status             text   not null default 'draft'
                       check (status in ('draft','published')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists ingredients_category_idx on public.ingredients(category);
create index if not exists ingredients_status_idx   on public.ingredients(status);

alter table public.ingredients enable row level security;

-- Any authenticated user may READ. No write policies ⇒ writes are service-role only.
drop policy if exists ingredients_read_authenticated on public.ingredients;
create policy ingredients_read_authenticated on public.ingredients
  for select to authenticated using (true);


-- ── recipes ──────────────────────────────────────────────────────────────────
create table if not exists public.recipes (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  description    text,
  category       text not null
                   check (category in ('breakfast','lunch','dinner','baking','snack','drink')),
  cuisine        text,
  total_minutes  int,
  servings       int,
  is_organic     boolean not null default false,
  goal_tags      text[] not null default '{}',   -- {anti-inflammatory,gut-health,heart,energy,blood-sugar}
  system_tags    text[] not null default '{}',   -- {mitochondria,gut-lining,inflammation,...}
  allergen_flags text[] not null default '{}',   -- {contains-dairy,contains-gluten,contains-shellfish,contains-soy,contains-red-meat}
  method_steps   jsonb  not null default '[]'::jsonb,  -- [{n, text}]
  hero_style     text,                            -- gradient placeholder key until real images exist
  status         text   not null default 'draft'
                   check (status in ('draft','published')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_status_idx   on public.recipes(status);

alter table public.recipes enable row level security;

drop policy if exists recipes_read_authenticated on public.recipes;
create policy recipes_read_authenticated on public.recipes
  for select to authenticated using (true);


-- ── recipe_ingredients (join: recipe ↔ ingredient) ───────────────────────────
-- Per-recipe presentation only; the cellular deep-dive lives on `ingredients`.
create table if not exists public.recipe_ingredients (
  id             uuid primary key default gen_random_uuid(),
  recipe_id      uuid not null references public.recipes(id)     on delete cascade,
  ingredient_id  uuid not null references public.ingredients(id) on delete restrict,
  amount_text    text,                       -- e.g. "1 tbsp grated"
  order_index    int  not null default 0,
  primary_system text,                       -- short tag shown on the row
  context_note   text,                       -- optional per-recipe override
  unique (recipe_id, ingredient_id)
);

create index if not exists recipe_ingredients_recipe_idx     on public.recipe_ingredients(recipe_id);
create index if not exists recipe_ingredients_ingredient_idx on public.recipe_ingredients(ingredient_id);

alter table public.recipe_ingredients enable row level security;

drop policy if exists recipe_ingredients_read_authenticated on public.recipe_ingredients;
create policy recipe_ingredients_read_authenticated on public.recipe_ingredients
  for select to authenticated using (true);


-- ── health_markers (marker catalog we map foods to) ──────────────────────────
-- Metadata only. User VALUES come from the existing `biomarkers` table — see the
-- integration note at the top of this file. `slug` is aligned to the ids in
-- src/lib/biomarkerCatalog.ts.
create table if not exists public.health_markers (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique,
  name                   text not null,
  unit                   text,
  optimal_min            numeric,
  optimal_max            numeric,
  direction              text not null default 'in-range'
                           check (direction in ('in-range','lower-better','higher-better')),
  category               text,
  description            text,             -- plain-language "what this is & why it matters"
  absorption_tip         text,
  is_nutrition_responsive boolean not null default true,
  display_order          int not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists health_markers_display_order_idx on public.health_markers(display_order);

alter table public.health_markers enable row level security;

drop policy if exists health_markers_read_authenticated on public.health_markers;
create policy health_markers_read_authenticated on public.health_markers
  for select to authenticated using (true);


-- ── marker_foods (marker → recommended foods) ────────────────────────────────
-- ingredient_id when the food exists in our knowledge base, else food_name fallback.
create table if not exists public.marker_foods (
  id             uuid primary key default gen_random_uuid(),
  marker_id      uuid not null references public.health_markers(id) on delete cascade,
  ingredient_id  uuid references public.ingredients(id) on delete set null,
  food_name      text,                       -- fallback label when no ingredient row
  why_text       text,
  frequency_text text,
  order_index    int not null default 0,
  -- must resolve to *some* food
  check (ingredient_id is not null or food_name is not null),
  -- one food per slot per marker (also makes the seed idempotent)
  unique (marker_id, order_index)
);

create index if not exists marker_foods_marker_idx     on public.marker_foods(marker_id);
create index if not exists marker_foods_ingredient_idx on public.marker_foods(ingredient_id);

alter table public.marker_foods enable row level security;

drop policy if exists marker_foods_read_authenticated on public.marker_foods;
create policy marker_foods_read_authenticated on public.marker_foods
  for select to authenticated using (true);


-- ═════════════════════════════════════════════════════════════════════════════
-- USER TABLES  (RLS owner-only — modeled on public.dashboard_preferences)
-- ═════════════════════════════════════════════════════════════════════════════

-- ── nutrition_preferences (one row per user) ─────────────────────────────────
-- `respect_allergens`: when true, recipes whose allergen_flags collide with the
-- user's profile are filtered/flagged. (Spec wrote this as the truncated
-- "respens"; named explicitly here.)
create table if not exists public.nutrition_preferences (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  dietary_pattern      text,
  excluded_ingredients text[]  not null default '{}',
  max_cook_minutes     int,
  prioritize_markers   boolean not null default true,
  respect_allergens    boolean not null default true,
  budget_friendly      boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table public.nutrition_preferences enable row level security;

drop policy if exists nutrition_preferences_select_own on public.nutrition_preferences;
create policy nutrition_preferences_select_own on public.nutrition_preferences
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists nutrition_preferences_insert_own on public.nutrition_preferences;
create policy nutrition_preferences_insert_own on public.nutrition_preferences
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists nutrition_preferences_update_own on public.nutrition_preferences;
create policy nutrition_preferences_update_own on public.nutrition_preferences
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists nutrition_preferences_delete_own on public.nutrition_preferences;
create policy nutrition_preferences_delete_own on public.nutrition_preferences
  for delete to authenticated using (auth.uid() = user_id);


-- ── planned_meals ────────────────────────────────────────────────────────────
create table if not exists public.planned_meals (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  plan_date          date not null,
  meal_slot          text not null
                       check (meal_slot in ('breakfast','lunch','dinner','snack')),
  recipe_id          uuid not null references public.recipes(id) on delete cascade,
  target_marker_slug text,                   -- which marker this meal serves (e.g. 'vit-d')
  order_index        int not null default 0,
  created_at         timestamptz not null default now()
);

create index if not exists planned_meals_user_date_idx on public.planned_meals(user_id, plan_date);

alter table public.planned_meals enable row level security;

drop policy if exists planned_meals_select_own on public.planned_meals;
create policy planned_meals_select_own on public.planned_meals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists planned_meals_insert_own on public.planned_meals;
create policy planned_meals_insert_own on public.planned_meals
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists planned_meals_update_own on public.planned_meals;
create policy planned_meals_update_own on public.planned_meals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists planned_meals_delete_own on public.planned_meals;
create policy planned_meals_delete_own on public.planned_meals
  for delete to authenticated using (auth.uid() = user_id);


-- ── saved_recipes ────────────────────────────────────────────────────────────
create table if not exists public.saved_recipes (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists saved_recipes_user_idx on public.saved_recipes(user_id);

alter table public.saved_recipes enable row level security;

drop policy if exists saved_recipes_select_own on public.saved_recipes;
create policy saved_recipes_select_own on public.saved_recipes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists saved_recipes_insert_own on public.saved_recipes;
create policy saved_recipes_insert_own on public.saved_recipes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists saved_recipes_delete_own on public.saved_recipes;
create policy saved_recipes_delete_own on public.saved_recipes
  for delete to authenticated using (auth.uid() = user_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- SEED DATA  (sample content so the UI can render; real content bulk-loaded later)
-- Idempotent via ON CONFLICT (slug). Runs as the migration role ⇒ bypasses RLS.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── ingredients ──────────────────────────────────────────────────────────────
-- turmeric: fully populated. The rest are lighter entries. coconut-milk &
-- olive-oil are included because the stew's recipe_ingredients reference them.
insert into public.ingredients
  (slug, name, category, tagline, is_organic, supports_systems, active_compounds,
   cellular_explainer, how_to_use, pairs_with, status)
values
  ('turmeric', 'Turmeric', 'root-spice',
   'The root that tells your cells to calm down', true,
   '{inflammation,detox,joints,brain}',
   '{curcumin,turmerone,curcuminoids}',
   '[
     {"heading":"Flips the NF-κB inflammation switch off",
      "body":"Curcumin down-regulates NF-κB, the master transcription factor that turns on dozens of inflammatory genes. Dialing it down means fewer inflammatory cytokines (TNF-α, IL-6) circulating day to day."},
     {"heading":"Recharges Nrf2 + glutathione defenses",
      "body":"It activates the Nrf2 pathway, prompting cells to manufacture their own antioxidants — including glutathione, the body''s master detox molecule — so they neutralize oxidative stress from the inside out."},
     {"heading":"Protects brain & joints",
      "body":"By lowering chronic low-grade inflammation, curcumin supports BDNF in the brain and helps preserve cartilage and joint comfort over time."}
   ]'::jsonb,
   '[
     {"n":1,"text":"Pair with black pepper — piperine boosts curcumin absorption by up to ~2000%."},
     {"n":2,"text":"Add a fat (olive oil, coconut milk) — curcumin is fat-soluble."},
     {"n":3,"text":"Warm it gently — light heat improves bioavailability."}
   ]'::jsonb,
   '{black-pepper,ginger,coconut-milk,leafy-greens,olive-oil}',
   'published'),

  ('black-pepper', 'Black Pepper', 'root-spice',
   'The tiny unlock for turmeric', false,
   '{inflammation,digestion}', '{piperine}',
   '[{"heading":"Unlocks curcumin","body":"Piperine inhibits the liver enzymes that would otherwise clear curcumin too quickly, dramatically raising how much reaches your bloodstream."}]'::jsonb,
   '[{"n":1,"text":"Always grind fresh over turmeric dishes."}]'::jsonb,
   '{turmeric}', 'published'),

  ('red-lentils', 'Red Lentils', 'legumes',
   'Slow-release plant protein with gut-feeding fiber', true,
   '{gut-lining,blood-sugar,energy}', '{resistant-starch,folate,polyphenols}',
   '[{"heading":"Feeds your gut bacteria","body":"Their fiber and resistant starch ferment into short-chain fatty acids like butyrate that nourish the cells lining your colon."}]'::jsonb,
   '[{"n":1,"text":"Rinse until water runs clear, then simmer 15–20 min."}]'::jsonb,
   '{turmeric,spinach,coconut-milk}', 'published'),

  ('spinach', 'Spinach', 'greens',
   'Dark leaves packed with magnesium and folate', true,
   '{detox,heart,energy}', '{magnesium,folate,lutein,nitrates}',
   '[{"heading":"Fuels cellular energy","body":"Magnesium is a cofactor for hundreds of enzymes, including those that produce ATP — your cells'' energy currency."}]'::jsonb,
   '[{"n":1,"text":"Wilt into warm dishes at the end to preserve folate."}]'::jsonb,
   '{olive-oil,garlic,wild-salmon}', 'published'),

  ('ginger', 'Ginger', 'root-spice',
   'Warming root that soothes the gut', true,
   '{inflammation,digestion,gut-lining}', '{gingerol,shogaol}',
   '[{"heading":"Calms the gut & inflammation","body":"Gingerol speeds gastric emptying and tempers inflammatory signaling, easing nausea and supporting digestion."}]'::jsonb,
   '[{"n":1,"text":"Grate fresh into stews, teas, and dressings."}]'::jsonb,
   '{turmeric,garlic}', 'published'),

  ('garlic', 'Garlic', 'root-spice',
   'The allium that supports heart and immunity', true,
   '{heart,immunity,detox}', '{allicin,sulfur-compounds}',
   '[{"heading":"Supports blood vessels","body":"Allicin and its sulfur compounds promote nitric-oxide signaling, helping vessels relax and supporting healthy blood pressure."}]'::jsonb,
   '[{"n":1,"text":"Crush and rest 10 min before cooking to preserve allicin."}]'::jsonb,
   '{ginger,spinach,olive-oil}', 'published'),

  ('coconut-milk', 'Coconut Milk', 'good-fats',
   'Creamy fat that carries fat-soluble nutrients', false,
   '{energy,brain}', '{mct,lauric-acid}',
   '[{"heading":"Carries fat-soluble compounds","body":"Its medium-chain fats help dissolve and transport fat-soluble nutrients like curcumin and vitamin D into your bloodstream."}]'::jsonb,
   '[{"n":1,"text":"Stir in near the end of cooking to keep it silky."}]'::jsonb,
   '{turmeric,red-lentils}', 'published'),

  ('olive-oil', 'Extra-Virgin Olive Oil', 'good-fats',
   'The cornerstone fat of longevity diets', true,
   '{heart,inflammation,brain}', '{oleocanthal,polyphenols,oleic-acid}',
   '[{"heading":"Anti-inflammatory like ibuprofen","body":"Oleocanthal inhibits the same COX enzymes as NSAIDs, giving extra-virgin olive oil a gentle, food-based anti-inflammatory effect."}]'::jsonb,
   '[{"n":1,"text":"Use raw or low-heat to protect its polyphenols."}]'::jsonb,
   '{spinach,garlic,turmeric}', 'published'),

  ('wild-salmon', 'Wild Salmon', 'protein',
   'Omega-3 powerhouse for brain and heart', false,
   '{heart,brain,inflammation}', '{epa,dha,vitamin-d,astaxanthin}',
   '[{"heading":"Builds anti-inflammatory cell membranes","body":"EPA and DHA incorporate into cell membranes and convert into resolvins that actively switch off inflammation."}]'::jsonb,
   '[{"n":1,"text":"Roast or pan-sear to medium to keep omega-3s intact."}]'::jsonb,
   '{spinach,olive-oil}', 'published'),

  ('wild-blueberries', 'Wild Blueberries', 'fruit',
   'Tiny berries with outsized antioxidant power', true,
   '{brain,inflammation,heart}', '{anthocyanins,polyphenols}',
   '[{"heading":"Protects neurons","body":"Anthocyanins cross into brain tissue and reduce oxidative stress, supporting memory and signaling."}]'::jsonb,
   '[{"n":1,"text":"Eat frozen-then-thawed — wild berries keep their anthocyanins well."}]'::jsonb,
   '{wild-salmon}', 'published')
on conflict (slug) do nothing;


-- ── recipes ──────────────────────────────────────────────────────────────────
insert into public.recipes
  (slug, title, description, category, cuisine, total_minutes, servings, is_organic,
   goal_tags, system_tags, allergen_flags, method_steps, hero_style, status)
values
  ('golden-turmeric-lentil-stew',
   'Golden Turmeric Lentil Stew',
   'A warming, deeply anti-inflammatory one-pot stew. Red lentils give slow-release plant protein and gut-feeding fiber, while turmeric — unlocked by black pepper and carried by coconut milk — calms inflammatory signaling at the cellular level.',
   'dinner', 'Indian-inspired', 35, 4, true,
   '{anti-inflammatory,gut-health,heart}',
   '{inflammation,gut-lining,mitochondria}',
   '{}',
   '[
     {"n":1,"text":"Warm olive oil in a heavy pot. Soften diced onion, then add grated ginger and crushed garlic for 1 minute."},
     {"n":2,"text":"Stir in turmeric and a generous grind of black pepper; toast 30 seconds until fragrant."},
     {"n":3,"text":"Add rinsed red lentils and vegetable stock. Simmer 15–18 minutes until lentils break down."},
     {"n":4,"text":"Pour in coconut milk and fold through spinach until just wilted."},
     {"n":5,"text":"Season, finish with a drizzle of olive oil, and serve warm."}
   ]'::jsonb,
   'amber-glow', 'published'),

  ('wild-salmon-roasted-beet-bowl',
   'Wild Salmon & Roasted Beet Bowl',
   'A vivid omega-3 bowl pairing wild salmon with earthy roasted beets and leafy greens.',
   'dinner', null, 40, 2, false,
   '{heart,anti-inflammatory,energy}', '{inflammation,mitochondria}',
   '{contains-shellfish}',
   '[]'::jsonb, 'beet-crimson', 'draft'),

  ('buckwheat-wild-berry-pancakes',
   'Buckwheat & Wild Berry Pancakes',
   'Naturally gluten-free buckwheat pancakes studded with antioxidant-rich wild blueberries.',
   'breakfast', null, 25, 2, false,
   '{energy,blood-sugar}', '{mitochondria}',
   '{contains-dairy}',
   '[]'::jsonb, 'berry-violet', 'draft'),

  ('sourdough-seed-loaf',
   'Sourdough Seed Loaf',
   'A slow-fermented seeded sourdough — gut-friendly thanks to the long ferment.',
   'baking', null, 240, 12, false,
   '{gut-health}', '{gut-lining}',
   '{contains-gluten}',
   '[]'::jsonb, 'crust-wheat', 'draft')
on conflict (slug) do nothing;


-- ── recipe_ingredients (Golden Turmeric Lentil Stew) ─────────────────────────
insert into public.recipe_ingredients
  (recipe_id, ingredient_id, amount_text, order_index, primary_system, context_note)
select r.id, i.id, v.amount_text, v.order_index, v.primary_system, v.context_note
from (values
  ('olive-oil',    '1 tbsp',              0, 'heart',        cast(null as text)),
  ('garlic',       '3 cloves, crushed',   1, 'heart',        null),
  ('ginger',       '1 tbsp grated',       2, 'digestion',    null),
  ('turmeric',     '1 tbsp grated',       3, 'inflammation', 'The anti-inflammatory engine of this dish.'),
  ('black-pepper', '½ tsp, fresh ground', 4, 'inflammation', 'Unlocks the turmeric — do not skip.'),
  ('red-lentils',  '1½ cups, rinsed',     5, 'gut-lining',   null),
  ('spinach',      '2 large handfuls',    6, 'energy',       null),
  ('coconut-milk', '1 can (400ml)',       7, 'energy',       null)
) as v(ing_slug, amount_text, order_index, primary_system, context_note)
join public.ingredients i on i.slug = v.ing_slug
cross join public.recipes r
where r.slug = 'golden-turmeric-lentil-stew'
on conflict (recipe_id, ingredient_id) do nothing;


-- ── health_markers (starter set, all nutrition-responsive) ───────────────────
-- slug aligned to src/lib/biomarkerCatalog.ts ids.
insert into public.health_markers
  (slug, name, unit, optimal_min, optimal_max, direction, category, description,
   absorption_tip, is_nutrition_responsive, display_order)
values
  ('vit-d', 'Vitamin D', 'ng/mL', 40, 60, 'in-range', 'Vitamins',
   'Vitamin D acts more like a hormone than a vitamin, regulating immune function, bone mineralization, and mood. Most people sit below the optimal range, especially in winter. Both too little and excessive levels carry risk, so the goal is a healthy middle band.',
   'Fat-soluble — take with a meal containing fat for best absorption.', true, 1),

  ('ldl-c', 'LDL Cholesterol', 'mg/dL', null, 100, 'lower-better', 'Lipids',
   'LDL carries cholesterol to your tissues; when oxidized and elevated it can deposit in artery walls and drive plaque. It is one of the most diet-responsive cardiovascular markers. Soluble fiber and unsaturated fats reliably lower it.',
   null, true, 2),

  ('hs-crp', 'hs-CRP', 'mg/L', null, 1, 'lower-better', 'Inflammation',
   'High-sensitivity C-reactive protein is a sensitive readout of systemic, low-grade inflammation. Chronically elevated hs-CRP is linked to cardiovascular and metabolic risk. It responds well to an anti-inflammatory diet.',
   null, true, 3),

  ('mg-rbc', 'Magnesium', 'mg/dL', 6.0, 6.5, 'in-range', 'Minerals',
   'Magnesium is a cofactor in hundreds of enzymatic reactions, including energy production, muscle relaxation, and sleep. RBC magnesium reflects intracellular stores better than serum. Deficiency is common and easily corrected with food.',
   null, true, 4),

  ('ferritin', 'Ferritin', 'ng/mL', 30, 150, 'in-range', 'Minerals',
   'Ferritin reflects your body''s stored iron. Too low causes fatigue and impaired oxygen transport; too high can signal inflammation or overload. The target is a comfortable middle range.',
   'Pair plant iron with vitamin C; keep coffee, tea, and calcium away from iron-rich meals.', true, 5),

  ('hba1c', 'HbA1c', '%', 4.8, 5.4, 'in-range', 'Metabolic',
   'HbA1c is your average blood sugar over roughly three months. It is a cornerstone of metabolic health and insulin sensitivity. Lower-glycemic eating, fiber, and movement keep it in a healthy band.',
   null, true, 6),

  ('trig', 'Triglycerides', 'mg/dL', null, 100, 'lower-better', 'Lipids',
   'Triglycerides are circulating fats strongly driven by refined carbohydrate and sugar intake. Elevated levels track with insulin resistance and cardiovascular risk. They drop quickly with dietary change.',
   null, true, 7),

  ('hdl-c', 'HDL Cholesterol', 'mg/dL', 60, null, 'higher-better', 'Lipids',
   'HDL helps clear cholesterol from your arteries back to the liver. Higher levels are generally protective for the heart. Omega-3 fats, olive oil, and aerobic exercise support it.',
   null, true, 8),

  ('b12', 'Vitamin B12', 'pg/mL', 500, null, 'higher-better', 'Vitamins',
   'B12 is essential for methylation, red blood cell formation, and nerve health. Deficiency causes fatigue and neurological symptoms and is common in plant-forward diets. Animal foods and supplementation restore it.',
   'Sublingual or with food; intrinsic factor in the gut is needed for absorption.', true, 9),

  ('omega3-idx', 'Omega-3 Index', '%', 8, 12, 'in-range', 'Fatty Acids',
   'The Omega-3 Index measures EPA and DHA built into your red blood cell membranes. A higher index is associated with cardiovascular and cognitive resilience. It rises with regular fatty-fish intake.',
   'Take omega-3s with a meal containing fat to improve uptake.', true, 10)
on conflict (slug) do nothing;


-- ── marker_foods (marker → recommended foods) ────────────────────────────────
insert into public.marker_foods
  (marker_id, ingredient_id, food_name, why_text, frequency_text, order_index)
select m.id, i.id, v.food_name, v.why_text, v.frequency_text, v.order_index
from (values
  -- Vitamin D
  ('vit-d', 'wild-salmon', cast(null as text), 'Among the richest natural food sources of vitamin D3.', '2–3 servings per week', 0),
  ('vit-d', null, 'Pastured egg yolks', 'Yolks from pastured hens carry meaningful vitamin D.', 'Daily', 1),
  ('vit-d', null, 'Sun-grown mushrooms', 'UV-exposed mushrooms provide vitamin D2.', '2–3 times per week', 2),
  ('vit-d', null, 'Sardines', 'Small oily fish dense in vitamin D and omega-3s.', '1–2 times per week', 3),
  -- LDL cholesterol
  ('ldl-c', null, 'Oats', 'Beta-glucan soluble fiber binds bile acids and lowers LDL.', 'Daily', 0),
  ('ldl-c', null, 'Beans', 'Soluble fiber and plant sterols reduce LDL absorption.', 'Most days', 1),
  ('ldl-c', null, 'Barley', 'Rich in beta-glucan, like oats, for LDL lowering.', 'Several times per week', 2),
  ('ldl-c', 'olive-oil', null, 'Replacing saturated fat with extra-virgin olive oil lowers LDL.', 'Daily, raw or low-heat', 3),
  -- hs-CRP
  ('hs-crp', 'wild-salmon', null, 'EPA/DHA resolve inflammation and lower CRP.', '2–3 servings per week', 0),
  ('hs-crp', 'turmeric', null, 'Curcumin down-regulates NF-κB inflammatory signaling.', 'Daily, with black pepper + fat', 1),
  ('hs-crp', 'wild-blueberries', null, 'Anthocyanins blunt oxidative and inflammatory stress.', 'Daily', 2),
  ('hs-crp', 'spinach', null, 'Leafy greens supply anti-inflammatory polyphenols and folate.', 'Daily', 3),
  -- Magnesium
  ('mg-rbc', 'spinach', null, 'Leafy greens are among the densest magnesium sources.', 'Daily', 0),
  ('mg-rbc', null, 'Pumpkin seeds', 'A concentrated, portable source of magnesium.', 'Daily handful', 1),
  ('mg-rbc', null, 'Dark cacao', 'High-percentage dark chocolate is rich in magnesium.', 'A few squares daily', 2)
) as v(marker_slug, ing_slug, food_name, why_text, frequency_text, order_index)
join public.health_markers m on m.slug = v.marker_slug
left join public.ingredients i on i.slug = v.ing_slug
on conflict (marker_id, order_index) do nothing;
