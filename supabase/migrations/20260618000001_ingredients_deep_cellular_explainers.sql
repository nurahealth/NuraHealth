-- ─────────────────────────────────────────────────────────────────────────────
-- Deep ingredient content (follow-up to 20260617000004)
--
-- UPDATEs every seeded ingredient so each `cellular_explainer` reaches a deeper
-- physiological standard: ~5 blocks per ingredient, each block built around ONE
-- named active compound, pathway, cell, or organelle → a specific cellular or
-- molecular mechanism → the downstream effect on the body, in plain language a
-- non-scientist can follow but that is genuinely mechanistic. Benchmarked to the
-- garlic entry. Also re-states `how_to_use` so every ingredient (incl. turmeric)
-- carries ~3 practical steps.
--
-- FRAMING (non-negotiable): describe what foods SUPPORT, HELP, or are STUDIED
-- FOR. Never claim a food cures, treats, or prevents disease. For any
-- disease-related research, say "studied for"/"researched for" and note it is
-- mechanistic / population research.
--
-- Idempotent: pure UPDATEs keyed by slug; safe to re-run. Does NOT touch any
-- already-applied migration; supersedes the shallower content in
-- 20260617000004 for the same rows.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── turmeric ──────────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"It quiets your master inflammation switch",
     "body":"Curcumin, turmeric''s active compound, blocks IKK — the enzyme that frees NF-κB to enter the cell nucleus. NF-κB is the master switch that turns on inflammatory genes, so holding it back means cells release fewer inflammatory messengers like TNF-α and IL-6, supporting a calmer everyday level of inflammation."},
    {"heading":"It recharges your own antioxidant defenses",
     "body":"Rather than just adding antioxidants, curcumin activates Nrf2 — a protein that travels into the nucleus and switches on the genes for your built-in defenses, including the enzymes that build and recycle glutathione (the cell''s master detox molecule) and the phase II enzymes your liver uses to neutralize reactive oxygen species."},
    {"heading":"It supports the brain''s growth signals",
     "body":"By lowering chronic oxidative stress and inflammation, curcumin is studied for supporting BDNF — a growth factor that helps neurons form and maintain connections. Framed as mechanistic and population research linked with healthy memory and mood, not a treatment claim."},
    {"heading":"It is an active subject of cellular cancer research",
     "body":"In the laboratory, curcumin is studied for how it influences cell-cycle checkpoints and promotes apoptosis (the body''s programmed clearance of damaged cells), and for boosting carcinogen-detoxifying phase II enzymes. Strictly mechanistic research — NOT a claim that turmeric prevents or treats disease."},
    {"heading":"It barely absorbs unless you help it",
     "body":"On its own curcumin is poorly absorbed and the liver tags it for rapid disposal by glucuronidation. Eaten with piperine from black pepper and a little fat, far more survives digestion and reaches the bloodstream — so how you pair it matters as much as how much you use."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Always pair it with a pinch of black pepper and a little fat — that combination is what carries curcumin into your blood."},
    {"n":2,"text":"Bloom it in warm oil or simmer it into dishes; gentle heat releases its color and flavor."},
    {"n":3,"text":"A teaspoon in golden milk, curry, soup, or roasted vegetables is plenty for a daily dose."}
  ]'::jsonb
where slug = 'turmeric';

-- ── black-pepper ──────────────────────────────────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"It unlocks nutrients other foods can''t deliver alone",
     "body":"Piperine, the molecule behind pepper''s bite, temporarily slows the gut and liver enzymes (UDP-glucuronosyltransferases) that would tag compounds like curcumin for rapid removal. Easing that bottleneck lets far more stay in circulation — turmeric''s curcumin absorption can rise many-fold when the two are eaten together."},
    {"heading":"It turns on your digestion before the meal lands",
     "body":"Piperine stimulates taste and gut receptors that signal the stomach and pancreas to release more acid, digestive enzymes, and bile. Food is then broken down more completely, which supports how fully you absorb its nutrients."},
    {"heading":"It signals through the same heat receptor as chili",
     "body":"The warmth comes from piperine activating TRPV1, a receptor on sensory nerves that also responds to chili heat. This gentle signal is studied for supporting circulation and metabolic activity."},
    {"heading":"It guards your own antioxidant reserves",
     "body":"Piperine helps the body hold on to antioxidant defenses such as glutathione, supporting cells against the everyday oxidative stress of normal metabolism."},
    {"heading":"It is studied for how cells handle fat and heat",
     "body":"In laboratory research, piperine influences signaling tied to thermogenesis (how cells generate heat) and fat metabolism. Frame as mechanistic research only, not a weight-loss claim."}
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
    {"heading":"It feeds the cells that line your colon",
     "body":"Their soluble fiber and resistant starch pass undigested into the colon, where resident bacteria ferment them into short-chain fatty acids — especially butyrate. Butyrate is the preferred fuel of colonocytes (the cells lining the colon) and supports the integrity of the gut barrier."},
    {"heading":"It flattens the blood-sugar curve",
     "body":"Fiber and plant protein slow how fast the meal''s starch is broken into glucose and absorbed. That blunts the after-meal blood-sugar spike and eases the demand placed on insulin."},
    {"heading":"It supplies the parts your body rebuilds with",
     "body":"Lentils provide amino acids the body uses to build and repair muscle and tissue, plus folate — a B vitamin central to one-carbon (methylation) reactions that assemble DNA and help keep homocysteine in a healthy range."},
    {"heading":"It carries iron for your oxygen supply",
     "body":"Their plant (non-heme) iron is a building block of hemoglobin, the protein in red blood cells that ferries oxygen to your tissues, while their magnesium acts as a cofactor for hundreds of enzyme reactions."},
    {"heading":"It resists digestion to nourish your microbiome",
     "body":"Resistant starch and polyphenols reach the large intestine intact and act as prebiotics, feeding the beneficial bacteria whose balance supports digestion and immune signaling."}
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
    {"heading":"It powers the batteries inside your cells",
     "body":"Spinach is rich in magnesium, a required partner for the enzymes that make and spend ATP inside mitochondria — the cell''s power plants. Adequate magnesium supports steady energy production and normal muscle and nerve signaling."},
    {"heading":"It widens your blood vessels through a gas",
     "body":"Its natural nitrates are converted — first by bacteria on your tongue, then in the body — into nitric oxide, a signaling gas that relaxes the smooth muscle in vessel walls. This supports healthy circulation and blood pressure already in the normal range."},
    {"heading":"It fuels the copying of your DNA",
     "body":"Spinach''s folate feeds one-carbon metabolism, the pathway cells use to build and repair DNA and to recycle homocysteine — especially important wherever cells divide quickly."},
    {"heading":"It filters blue light inside your eyes",
     "body":"The carotenoids lutein and zeaxanthin concentrate in the macula of the retina, where they absorb high-energy blue light and neutralize free radicals — supporting long-term eye health."},
    {"heading":"It helps your blood clot and your bones bind calcium",
     "body":"Spinach is rich in vitamin K1, which activates the proteins that let blood clot normally and that bind calcium into bone, supporting bone strength over time."}
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
    {"heading":"It rebuilds the membrane of every cell",
     "body":"EPA and DHA are woven into the phospholipids of cell membranes, making them more fluid so receptors and signals pass through cleanly — especially in brain and retinal cells, which are naturally rich in DHA."},
    {"heading":"It tells inflammation when to stop",
     "body":"From EPA and DHA the body makes specialized pro-resolving mediators (resolvins and protectins) that actively signal immune cells to wind down inflammation once a threat has passed — supporting balanced inflammation rather than simply blocking it."},
    {"heading":"It steadies your heartbeat and triglycerides",
     "body":"Omega-3s help the liver package fewer triglycerides into the blood and support stable electrical signaling in heart-muscle cells — both of which support cardiovascular health."},
    {"heading":"It delivers the sunshine vitamin as a hormone",
     "body":"Salmon supplies vitamin D, which the body converts into a hormone that binds receptors in immune and bone cells and regulates their genes — supporting immune balance and bone health."},
    {"heading":"It protects its own fragile fats with a pigment",
     "body":"Astaxanthin, the antioxidant that makes salmon pink, shields its delicate omega-3 fats from oxidizing and adds antioxidant support once you eat it."}
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
    {"heading":"It dials down inflammatory signaling",
     "body":"Gingerol, ginger''s main active compound, helps quiet COX-2 and related enzymes that manufacture inflammatory prostaglandins — supporting a calmer inflammatory tone in the body."},
    {"heading":"It gets your stomach moving",
     "body":"Ginger stimulates the wave-like muscle contractions of the digestive tract (motility), helping the stomach empty more readily and easing the heavy, queasy feeling that drives nausea."},
    {"heading":"It settles nausea through the gut-brain signal",
     "body":"Ginger''s compounds act on serotonin (5-HT3) receptors in the gut and the brain''s nausea center — which is why it is well researched as comfort support for queasiness, including motion and pregnancy-related nausea. Framed as research-supported symptom comfort."},
    {"heading":"It mops up reactive oxygen",
     "body":"Its gingerols and shogaols help the body neutralize reactive oxygen species, supporting cells against everyday oxidative stress."},
    {"heading":"It warms you by supporting circulation",
     "body":"Compounds in ginger support normal blood flow and the function of the endothelial cells lining your blood vessels, complementing its warming sensation."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Grate fresh root into stews, dressings, and teas for the most gingerol."},
    {"n":2,"text":"Steep slices in hot water for a soothing, digestion-friendly tea."},
    {"n":3,"text":"Add it near the end of cooking — long, high heat converts some gingerol away."}
  ]'::jsonb
where slug = 'ginger';

-- ── garlic (the depth benchmark — 5 blocks) ───────────────────────────────────
update public.ingredients set
  cellular_explainer = '[
    {"heading":"It activates the moment you crush it",
     "body":"Whole garlic is inert. Crushing ruptures the cells and lets the enzyme alliinase convert stored alliin into allicin — the sharp, pungent molecule. Allicin is unstable and breaks down into organosulfur compounds (diallyl disulfide, ajoene, and others) that do the real work. That is why letting crushed garlic rest about 10 minutes before heating matters: it lets the reaction finish before heat shuts the enzyme down."},
    {"heading":"It relaxes your blood vessels through a gas",
     "body":"Your red blood cells and vascular tissue convert garlic''s sulfur compounds into hydrogen sulfide (H2S), a gasotransmitter the body uses for signaling. H2S opens potassium channels in arterial smooth muscle, relaxing and widening the vessel, and garlic also supports endothelial nitric oxide — the other major vasodilator. Together they ease the pressure your heart pumps against."},
    {"heading":"It recharges your own antioxidant system",
     "body":"Rather than just adding antioxidants, garlic''s organosulfur compounds activate Nrf2 — a master switch that turns on built-in defenses including glutathione and the phase II detox enzymes your liver uses to neutralize reactive oxygen species and process toxins."},
    {"heading":"It is an active subject of cellular cancer research",
     "body":"Compounds like diallyl disulfide and ajoene are studied in the lab for how they influence cell-cycle checkpoints and promote apoptosis (the body''s programmed clearance of damaged cells), and for boosting carcinogen-detoxifying phase II enzymes; population studies link higher allium intake with certain outcomes. Strictly mechanistic and population research — NOT a claim that garlic prevents or treats disease."},
    {"heading":"It mobilizes your immune cells",
     "body":"Garlic''s sulfur compounds stimulate natural killer cells and macrophages — front-line immune cells — part of its long traditional cold-season reputation."}
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
    {"heading":"It carries pigment that reaches your brain",
     "body":"The deep blue-purple anthocyanins can cross into brain tissue, where they lower oxidative stress in neurons and support signaling between brain cells — associated in studies with healthy memory and focus."},
    {"heading":"It helps your blood vessels stay supple",
     "body":"Anthocyanins prompt endothelial cells (the inner lining of blood vessels) to release nitric oxide, supporting flexible vessels and healthy circulation."},
    {"heading":"It trains your cells to defend themselves",
     "body":"Like other polyphenols, blueberry compounds nudge the Nrf2 pathway, prompting cells to manufacture their own antioxidant enzymes — a benefit that outlasts the antioxidants in the berry itself."},
    {"heading":"It feeds your gut bacteria",
     "body":"Their fiber and polyphenols reach the colon and act as prebiotics, fermented by beneficial bacteria into short-chain fatty acids that nourish the gut lining."},
    {"heading":"It steadies blood sugar despite its sweetness",
     "body":"Anthocyanins are studied for supporting insulin sensitivity, and the berries'' fiber slows glucose absorption, so their natural sweetness lands gently. Framed as mechanistic research."}
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
    {"heading":"It sends fat straight to your liver for fast fuel",
     "body":"Coconut''s medium-chain triglycerides (MCTs) skip the slow route other fats take and travel directly to the liver, which rapidly converts them into ketones — a fuel that brain and muscle cells can burn quickly."},
    {"heading":"It ferries fat-soluble nutrients across your gut wall",
     "body":"Its fat dissolves fat-soluble compounds like curcumin and vitamins A, D, E, and K, helping them survive digestion and cross the intestinal lining into the bloodstream."},
    {"heading":"It converts into a microbe-fighting molecule",
     "body":"Lauric acid, a large share of coconut fat, is converted in the body to monolaurin, which lends support to the body''s defenses against some microbes."},
    {"heading":"It slows your meal for steadier energy",
     "body":"Adding its fat to a dish slows stomach emptying, which softens the blood-sugar rise from the rest of the meal and supports a longer sense of fullness."},
    {"heading":"It signals fullness through your gut hormones",
     "body":"Fat arriving in the small intestine triggers release of the satiety hormones CCK and GLP-1, which tell the brain you have eaten — part of why a coconut-rich dish feels satisfying."}
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
    {"heading":"It echoes an anti-inflammatory drug",
     "body":"Extra-virgin olive oil contains oleocanthal, which inhibits the same COX-1 and COX-2 enzymes targeted by ibuprofen — the peppery catch at the back of your throat is that compound at work. The effect is gentle and food-based, supporting a calmer level of inflammation over time."},
    {"heading":"It keeps your cholesterol from turning sticky",
     "body":"Its polyphenols (such as hydroxytyrosol) are antioxidants that help keep LDL particles from oxidizing — and oxidized LDL is the form most associated with artery plaque — which supports cardiovascular health."},
    {"heading":"It stabilizes the membranes around your cells",
     "body":"Oleic acid, its main fat, supports a healthy balance of HDL and LDL and makes cell membranes more stable and resilient."},
    {"heading":"It flips on your cells'' cleanup crew",
     "body":"Olive polyphenols can gently activate AMPK and autophagy — the cell''s energy-sensing and self-cleaning systems that recycle worn-out parts — supporting healthy cellular maintenance as we age."},
    {"heading":"It unlocks the nutrients in your vegetables",
     "body":"Eaten with vegetables, its fat dissolves their fat-soluble vitamins and carotenoids (like lycopene and beta-carotene), so your gut absorbs far more of them than from the vegetables alone."}
  ]'::jsonb,
  how_to_use = '[
    {"n":1,"text":"Use it raw — drizzled over finished dishes — to protect its polyphenols."},
    {"n":2,"text":"Choose extra-virgin in a dark bottle; light and heat degrade it over time."},
    {"n":3,"text":"Pair it with vegetables to absorb their fat-soluble vitamins and antioxidants."}
  ]'::jsonb
where slug = 'olive-oil';
