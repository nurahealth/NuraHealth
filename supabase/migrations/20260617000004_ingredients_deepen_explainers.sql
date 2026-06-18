-- ─────────────────────────────────────────────────────────────────────────────
-- Deepen ingredient content (follow-up to schema 5.0)
--
-- UPDATEs the seeded ingredients so each `cellular_explainer` has 3–4 genuinely
-- mechanistic blocks (named compound/nutrient → specific cellular or molecular
-- mechanism → downstream effect, in plain language), benchmarked against the
-- original turmeric entry. Also enriches the previously single-step `how_to_use`
-- lists to ~3 steps each.
--
-- Framing rules: describe what foods SUPPORT or HELP. No claims to cure, treat,
-- or prevent disease. Conservative and accurate.
--
-- Idempotent: pure UPDATEs keyed by slug; safe to re-run. Does NOT touch the
-- already-applied 20260617000003 migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── turmeric (already strong — extended from 3 to 4 blocks) ───────────────────
update public.ingredients set cellular_explainer = '[
  {"heading":"Quiets the NF-κB inflammation switch",
   "body":"Curcumin blocks IKK, the enzyme that activates NF-κB — the master switch cells use to turn on inflammatory genes. With NF-κB held back, cells release fewer inflammatory messengers such as TNF-α and IL-6, which supports a calmer everyday level of inflammation."},
  {"heading":"Wakes up the Nrf2 antioxidant defense",
   "body":"Curcumin activates the Nrf2 pathway, which travels to the cell nucleus and switches on the genes for your own antioxidant enzymes — including the ones that build and recycle glutathione, the body''s master detox molecule. This helps cells clear reactive oxygen species and supports the liver''s routine detox work."},
  {"heading":"Supports the brain and joints",
   "body":"By lowering chronic low-grade inflammation and oxidative stress, curcumin supports healthy levels of BDNF (a growth factor that helps neurons form and maintain connections) and helps protect chondrocytes, the cells that build and maintain joint cartilage — supporting comfortable movement over time."},
  {"heading":"Why pepper and fat matter",
   "body":"On its own curcumin is poorly absorbed and the liver clears it quickly by tagging it for disposal (glucuronidation). Eaten with piperine from black pepper and a little fat, far more survives digestion and reaches the bloodstream — so how you pair it matters as much as how much you use."}
]'::jsonb
where slug = 'turmeric';

-- ── black-pepper ──────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Piperine unlocks other nutrients",
     "body":"Piperine temporarily slows the gut and liver enzymes (UDP-glucuronosyltransferases) that would otherwise tag compounds like curcumin for rapid removal. Easing that bottleneck lets far more stay in circulation — turmeric''s absorption can rise dramatically when the two are eaten together."},
    {"heading":"Switches on digestion",
     "body":"Piperine stimulates taste and gut receptors that signal the stomach and pancreas to release more digestive enzymes and bile. Food is broken down more completely, which supports how well you absorb its nutrients."},
    {"heading":"Adds its own antioxidant support",
     "body":"Piperine helps the body hold on to its antioxidant defenses, supporting cells against the everyday oxidative stress of normal metabolism."},
    {"heading":"Warmth that signals through TRPV1",
     "body":"The pungent heat comes from piperine activating TRPV1 receptors on sensory nerves — the same receptors chili heat uses. This gentle signal is linked to support for circulation and metabolic activity."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Grind it fresh over finished dishes — pre-ground pepper loses its piperine and aroma quickly."},
    {"n":2,"text":"Add a pinch to turmeric dishes, curries, or golden milk to multiply curcumin absorption."},
    {"n":3,"text":"A little goes a long way; season toward the end of cooking to keep it lively."}
  ]'::jsonb
where slug = 'black-pepper';

-- ── red-lentils ───────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Fiber becomes fuel for your gut lining",
     "body":"Their soluble fiber and resistant starch pass undigested into the colon, where resident bacteria ferment them into short-chain fatty acids — especially butyrate. Butyrate is the preferred energy source for colonocytes (the cells lining the colon) and supports the integrity of the gut barrier."},
    {"heading":"Steadies blood sugar",
     "body":"Fiber and plant protein slow how quickly the meal''s starches are broken into glucose and absorbed. That blunts the after-meal blood-sugar spike and eases the demand placed on insulin."},
    {"heading":"Plant protein and folate for building and repair",
     "body":"Lentils supply amino acids the body uses to build and repair tissue, plus folate — a B vitamin central to one-carbon (methylation) reactions that assemble DNA and help keep homocysteine in a healthy range."},
    {"heading":"Minerals and polyphenols",
     "body":"They deliver iron for oxygen transport and magnesium, a cofactor for hundreds of enzyme reactions, while their polyphenols add antioxidant support during digestion."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Rinse until the water runs clear, then simmer 15–20 minutes until soft."},
    {"n":2,"text":"Cook with turmeric, ginger, and a little fat for flavor and better nutrient absorption."},
    {"n":3,"text":"Pair with a vitamin-C food (tomato, lemon, peppers) to boost uptake of their plant iron."}
  ]'::jsonb
where slug = 'red-lentils';

-- ── spinach ───────────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Magnesium powers your cellular batteries",
     "body":"Spinach is rich in magnesium, a required partner for the enzymes that make and spend ATP inside mitochondria. Adequate magnesium supports steady energy production and normal muscle and nerve signaling."},
    {"heading":"Dietary nitrates support blood flow",
     "body":"Its natural nitrates are converted — first by mouth bacteria, then in the body — into nitric oxide, a signaling molecule that relaxes the smooth muscle in blood-vessel walls. This supports healthy circulation and blood pressure already in the normal range."},
    {"heading":"Folate for DNA and methylation",
     "body":"Spinach''s folate feeds one-carbon metabolism, the pathway cells use to build and repair DNA and to recycle homocysteine — important wherever cells divide quickly."},
    {"heading":"Lutein and zeaxanthin shield the eyes",
     "body":"These carotenoids concentrate in the macula of the retina, where they absorb high-energy blue light and neutralize free radicals — supporting long-term eye health."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Wilt it into warm dishes at the very end to preserve heat-sensitive folate."},
    {"n":2,"text":"Add a little olive oil — its fat helps you absorb spinach''s fat-soluble lutein and vitamins."},
    {"n":3,"text":"Light cooking or a squeeze of lemon improves how much iron and magnesium you take in."}
  ]'::jsonb
where slug = 'spinach';

-- ── wild-salmon ───────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Omega-3s rebuild your cell membranes",
     "body":"EPA and DHA are woven into the phospholipids of every cell membrane, making them more fluid and improving how receptors and signals pass through — especially in brain and retinal cells, which are naturally rich in DHA."},
    {"heading":"Helps inflammation resolve on schedule",
     "body":"From EPA and DHA the body makes specialized pro-resolving mediators (resolvins and protectins) that actively signal immune cells to wind down inflammation once a threat has passed — supporting balanced inflammation rather than simply blocking it."},
    {"heading":"Supports heart rhythm and triglycerides",
     "body":"Omega-3s help the liver package fewer triglycerides and support steady electrical signaling in heart-muscle cells — both of which support cardiovascular health."},
    {"heading":"Vitamin D and astaxanthin come along",
     "body":"Salmon supplies vitamin D for immune and bone signaling, plus astaxanthin — the antioxidant pigment that makes it pink — which helps protect its delicate fats from oxidizing."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Roast or pan-sear just to medium — gentle cooking keeps the omega-3 fats intact."},
    {"n":2,"text":"Choose wild-caught when you can for a favorable omega-3 profile."},
    {"n":3,"text":"Finish with lemon and olive oil; the acid and fat round out flavor and carry fat-soluble nutrients."}
  ]'::jsonb
where slug = 'wild-salmon';

-- ── ginger ────────────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Gingerol calms inflammatory signaling",
     "body":"Gingerol, ginger''s main active compound, helps dial down COX-2 and related enzymes that manufacture inflammatory prostaglandins — supporting a calmer inflammatory tone in the body."},
    {"heading":"Gets the stomach moving",
     "body":"Ginger stimulates the wave-like muscle contractions of the digestive tract (motility), helping the stomach empty more readily and easing the heavy, queasy feeling that drives nausea."},
    {"heading":"Antioxidant protection for cells",
     "body":"Its gingerols and shogaols help the body neutralize reactive oxygen species, supporting cells against everyday oxidative stress."},
    {"heading":"Supports healthy circulation",
     "body":"Compounds in ginger support normal blood flow and the function of the cells lining blood vessels, complementing its warming effect."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Grate fresh root into stews, dressings, and teas for the most gingerol."},
    {"n":2,"text":"Steep slices in hot water for a soothing, digestion-friendly tea."},
    {"n":3,"text":"Add it near the end of cooking — long, high heat converts some gingerol away."}
  ]'::jsonb
where slug = 'ginger';

-- ── garlic (was a single block — now four) ────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Allicin forms the moment you crush it",
     "body":"Garlic keeps a precursor (alliin) and an enzyme (alliinase) in separate compartments. Crushing or chopping mixes them and creates allicin, garlic''s signature active compound — which is why letting crushed garlic rest before cooking matters."},
    {"heading":"Sulfur compounds support blood vessels",
     "body":"Allicin and its breakdown products help the body generate hydrogen sulfide and nitric oxide — signaling molecules that relax the smooth muscle in artery walls, supporting healthy circulation and blood pressure already in the normal range."},
    {"heading":"Supports a healthy cholesterol balance",
     "body":"Garlic''s organosulfur compounds gently influence the liver enzymes involved in making cholesterol, supporting an already-healthy lipid profile."},
    {"heading":"Backs up everyday immune defense",
     "body":"Those same sulfur compounds support the activity of immune cells such as natural killer cells and macrophages, lending a hand to the body''s routine defenses."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Crush or chop, then let it rest about 10 minutes before cooking to let allicin form."},
    {"n":2,"text":"Use it raw or add it late to gentle heat — high heat destroys the active compounds."},
    {"n":3,"text":"Pair with olive oil and herbs; fat helps carry its sulfur compounds."}
  ]'::jsonb
where slug = 'garlic';

-- ── wild-blueberries ──────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Anthocyanins reach the brain",
     "body":"The deep blue-purple anthocyanins can cross into brain tissue, where they lower oxidative stress in neurons and support signaling between brain cells — which is associated with healthy memory and focus."},
    {"heading":"Support the lining of your blood vessels",
     "body":"Anthocyanins help endothelial cells (the inner lining of blood vessels) release nitric oxide, supporting flexible vessels and healthy circulation."},
    {"heading":"Train the cell''s own defenses",
     "body":"Like other polyphenols, blueberry compounds nudge the Nrf2 pathway, prompting cells to manufacture their own antioxidant enzymes — a benefit that outlasts the antioxidants in the berry itself."},
    {"heading":"Fiber feeds the microbiome",
     "body":"Their fiber and polyphenols nourish beneficial gut bacteria, which ferment them into short-chain fatty acids that support the gut lining."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Keep a bag in the freezer — wild berries hold their anthocyanins well when frozen."},
    {"n":2,"text":"Eat them with the skins on, where the anthocyanin pigments are most concentrated."},
    {"n":3,"text":"Stir into oats, yogurt, or smoothies rather than baking, to spare heat-sensitive polyphenols."}
  ]'::jsonb
where slug = 'wild-blueberries';

-- ── coconut-milk ──────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Medium-chain fats for quick energy",
     "body":"Coconut''s medium-chain triglycerides (MCTs) are absorbed and sent straight to the liver, which rapidly converts them into ketones — a fuel that brain and muscle cells can use quickly."},
    {"heading":"A carrier for fat-soluble nutrients",
     "body":"Its fat dissolves fat-soluble compounds like curcumin and vitamins A, D, E, and K, helping them survive digestion and cross the gut wall into the bloodstream."},
    {"heading":"Lauric acid offers gentle antimicrobial support",
     "body":"Lauric acid, a large share of coconut fat, is converted in the body to monolaurin, which lends support to the body''s defenses against some microbes."},
    {"heading":"Slows digestion for steadier energy",
     "body":"Adding its fat to a meal slows stomach emptying, which softens the blood-sugar rise from the rest of the dish and supports a longer sense of fullness."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Stir it in near the end of cooking to keep it silky and prevent it from splitting."},
    {"n":2,"text":"Use full-fat to carry fat-soluble nutrients like the curcumin in turmeric."},
    {"n":3,"text":"Shake the can well before opening — the cream and water naturally separate."}
  ]'::jsonb
where slug = 'coconut-milk';

-- ── olive-oil ─────────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"Oleocanthal echoes an anti-inflammatory drug",
     "body":"Extra-virgin olive oil contains oleocanthal, which inhibits the same COX-1 and COX-2 enzymes targeted by ibuprofen. The effect is gentle and food-based, supporting a calmer level of inflammation over time."},
    {"heading":"Polyphenols protect your cholesterol from oxidizing",
     "body":"Its polyphenols (such as hydroxytyrosol) are antioxidants that help keep LDL particles from oxidizing — and oxidized LDL is the form most associated with artery plaque — which supports cardiovascular health."},
    {"heading":"Monounsaturated fat steadies cell membranes",
     "body":"Oleic acid, its main fat, supports a healthy balance of HDL and LDL and makes cell membranes more stable and resilient."},
    {"heading":"Nudges the cell''s cleanup and energy sensors",
     "body":"Olive polyphenols can gently activate AMPK and autophagy — the cell''s energy-sensing and self-cleaning systems — supporting healthy cellular maintenance as we age."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Use it raw — drizzled over finished dishes — to protect its polyphenols."},
    {"n":2,"text":"Choose extra-virgin in a dark bottle; light and heat degrade it over time."},
    {"n":3,"text":"Pair it with vegetables to absorb their fat-soluble vitamins and antioxidants."}
  ]'::jsonb
where slug = 'olive-oil';
