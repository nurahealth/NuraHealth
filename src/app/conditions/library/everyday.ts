// ─────────────────────────────────────────────────────────────────────────────
// Library — Everyday.
//
// Content only. See ../types.ts for the shape and the rules every entry obeys.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const EVERYDAY_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "kidney-stone-prevention",
    name: "Kidney stone prevention",
    nameEmphasis: "prevention",
    icon: "snowflake",
    category: "everyday",
    blurb: "Fluid volume is the whole game — and cutting calcium backfires.",
    matchRules: [
      { markerId: "uric-acid", label: "uric acid", unit: "mg/dL", flagAbove: 7 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
    ],
    intro:
      "Once you've had one stone, the odds of another within ten years are roughly one in two. That's why prevention is worth real effort rather than hoping.\n\nAlmost all of it comes down to **urine volume**. Dilute urine can't form crystals, and the fluid target in the guidelines is set by output, not by how much you drink.\n\nThe counter-intuitive part, and the most common mistake people make: **cutting dietary calcium increases stone risk.** Calcium in food binds oxalate in the gut so it leaves in the stool instead of the urine. Take the calcium out and more oxalate reaches the kidney.",
    matchedIntro: "Some of your markers are relevant here — worth reviewing with your doctor.",
    signals: [
      { markerId: "uric-acid", label: "Uric acid", unit: "mg/dL", flagAbove: 7 },
      { markerId: "creatinine", label: "Creatinine", unit: "mg/dL" },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "urine-volume",
        title: "Drink to 2.5 litres of urine a day — measured, not guessed",
        why: "Increasing urine volume is the single most effective preventive measure, and it's the one with a hard target attached.",
        grade: "A",
        gradeNote: "AUA guideline — strong recommendation",
        how: "The guideline target is **more than `2.5 L` of urine daily**, which usually means drinking around `3 L`.\n\nSpread it through the day and include a glass at night — urine is most concentrated overnight. **Pale straw colour is your everyday check.** More again in heat or with exercise.",
        evidence: [
          "American Urological Association — guideline on the medical management of kidney stones.",
          "NIH / NIDDK — preventing kidney stones.",
        ],
        checkFirst:
          "If you have heart failure or kidney disease, your fluid target is set by your doctor and may be much lower. Don't adopt this number without asking.",
      },
      {
        id: "keep-calcium",
        title: "Keep dietary calcium normal — do not cut it",
        detailTitle: "Why cutting calcium backfires",
        why: "Low dietary calcium raises oxalate absorption and increases stone risk, and it's the single most common self-inflicted mistake in stone prevention.",
        grade: "A",
        gradeNote: "AUA guideline — strong recommendation",
        how: "Aim for `1,000–1,200 mg` a day **from food**, and eat it **with the meals containing oxalate** — that's when the binding happens.\n\nCalcium *supplements* are a different question: taken away from food they may raise risk. If you take one, take it with a meal, and ask whether you need it.",
        evidence: [
          "American Urological Association — guideline on kidney stone prevention (dietary calcium).",
          "NIH / NIDDK — eating, diet and nutrition for kidney stones.",
        ],
        checkFirst:
          "**High-dose vitamin C supplements raise urinary oxalate** and are associated with stone risk in men. If you form calcium oxalate stones, that supplement is worth stopping.",
      },
      {
        id: "sodium-protein-stones",
        title: "Cut sodium and go easy on animal protein",
        why: "Sodium drags calcium into the urine, and animal protein raises acid load and uric acid — both push toward stones.",
        grade: "A−",
        gradeNote: "AUA guideline",
        how: "Under `2,300 mg` of sodium a day. **High sodium raises urinary calcium directly**, which is why this matters more than it sounds.\n\nModerate — don't eliminate — meat, poultry and fish. And keep fruit and vegetables high: they raise urinary citrate, which is a natural stone inhibitor.",
        evidence: [
          "American Urological Association — kidney stone guideline (sodium and animal protein).",
          "NIH / NIDDK — kidney stone diet guidance.",
        ],
        checkFirst:
          "Salt substitutes are potassium-based and are not safe with kidney disease or with ACE inhibitors, ARBs or potassium-sparing diuretics. Ask before switching.",
      },
      {
        id: "know-stone-type",
        title: "Find out what your stone was made of",
        why: "Calcium oxalate, uric acid, struvite and cystine stones need genuinely different prevention, and generic advice can be wrong for yours.",
        grade: "A",
        gradeNote: "AUA guideline",
        supervised: true,
        how: "**Catch the stone and have it analysed** — strain your urine if you're passing one.\n\nFor recurrent stones, ask about a **24-hour urine collection**, which measures volume, calcium, oxalate, citrate, uric acid and pH. That's what turns generic advice into a plan for you.",
        evidence: [
          "American Urological Association — guideline on metabolic evaluation in recurrent stone formers.",
          "NIH / NIDDK — kidney stone diagnosis and tests.",
        ],
        checkFirst:
          "Uric acid stones respond to urine alkalinisation, which is the opposite direction from some calcium stone advice. Following the wrong protocol for your stone type wastes months.",
      },
      {
        id: "oxalate-targeted",
        title: "Only restrict oxalate if your stones and urine say to",
        why: "Blanket oxalate restriction removes some of the healthiest foods available and only helps a subset of stone formers.",
        grade: "B+",
        gradeNote: "AUA guideline — conditional",
        how: "This applies to **calcium oxalate stone formers with high urinary oxalate**, not to everyone who has had a stone.\n\nThe genuinely high-oxalate items are few: **spinach, rhubarb, almonds, beets and, notably, black tea and nuts in quantity**. Pair them with calcium at the same meal rather than removing them.",
        evidence: [
          "American Urological Association — kidney stone guideline (oxalate restriction, conditional recommendation).",
          "NIH / NIDDK — oxalate and kidney stones.",
        ],
        checkFirst:
          "Severe flank pain with fever, chills, vomiting or inability to pass urine is an emergency — an obstructed, infected kidney can become life-threatening within hours.",
      },
    ],
    skipTheHype: {
      remedy: "The \"olive oil and lemon juice\" stone flush",
      why: "It's everywhere and it does nothing to a stone already formed — stones pass because of size and anatomy, not solvent. The only kernel of truth is that citrate genuinely inhibits stone formation, which is why lemonade therapy is sometimes used **preventively** on a doctor's advice. A one-off flush during an attack is a delay, and delay with an obstructed kidney is dangerous.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "bone-density-support",
    name: "Bone density support",
    nameEmphasis: "support",
    icon: "bone",
    category: "everyday",
    blurb: "Load-bearing exercise does what calcium alone can't.",
    matchRules: [
      { markerId: "vit-d", label: "vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "Bone is living tissue that remodels constantly. It responds to load — which is why the mineral you eat matters far less than most people assume, and the force you put through your skeleton matters far more.\n\nPeak bone mass is set by about your late twenties. After that the job is holding on to it, and the losses accelerate in the years around menopause and with age in everyone.\n\nThe outcome that matters isn't the scan number, it's whether you break a bone. **Fall prevention counts as bone health**, and it's the half of the plan that usually gets left out.",
    matchedIntro: "Your vitamin D is low, which matters directly for bone.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagBelow: 0.4 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagBelow: 300 },
      { markerId: "estradiol", label: "Estradiol", unit: "pg/mL" },
    ],
    steps: [
      {
        id: "load-bone",
        title: "Load the skeleton — resistance and impact, not walking",
        why: "Bone adapts to force. Walking maintains general health but doesn't apply enough load to drive bone formation.",
        grade: "A",
        gradeNote: "BHOF guideline · evidence summary",
        how: "`2–3` sessions a week of **progressive resistance training** — squats, deadlifts, presses, rows — plus impact work like jumping, hopping or skipping if your joints and spine allow it.\n\nThe stimulus has to be **novel and progressive**. Bone adapts to loads it isn't used to, then stops adapting.",
        evidence: [
          "Bone Health & Osteoporosis Foundation — clinician's guide to prevention and treatment of osteoporosis.",
          "Evidence summary — randomised trials of high-intensity resistance and impact training on bone mineral density.",
        ],
        checkFirst:
          "If you already have osteoporosis or a spinal fracture, **high-impact work and loaded spinal flexion can cause fractures**. That programme is set by a physiotherapist who knows your scan, not from a general guideline.",
      },
      {
        id: "calcium-vitd",
        title: "Get calcium from food, and vitamin D to a real number",
        why: "Both are necessary and neither is sufficient, and supplementing calcium beyond need has its own downsides.",
        grade: "A−",
        gradeNote: "BHOF · NIH ODS",
        supplement: true,
        labNote:
          "Calcium supplements vary in form and elemental content — carbonate needs food to absorb, citrate doesn't. Check the elemental calcium per serving on the Lab Report rather than the tablet weight.",
        how: "**Calcium `1,000–1,200 mg` a day, food first** — dairy, fortified plant milks, tinned fish with bones, tofu set with calcium, leafy greens.\n\nVitamin D `800–1,000 IU` daily unless a test says otherwise. If you do supplement calcium, **split the dose** — absorption drops above about `500 mg` at once.",
        evidence: [
          "Bone Health & Osteoporosis Foundation — calcium and vitamin D recommendations.",
          "NIH Office of Dietary Supplements — calcium and vitamin D fact sheets for health professionals.",
        ],
        checkFirst:
          "High-dose calcium supplements have been associated with kidney stones and possibly cardiovascular risk. Food first, supplement only to fill the gap, and ask if you have a stone history.",
      },
      {
        id: "protein-bone",
        title: "Eat enough protein — bone is a protein matrix",
        why: "Bone is roughly half protein by volume, and low protein intake is associated with lower bone density and more fractures, especially in older adults.",
        grade: "B+",
        gradeNote: "Evidence summary — bone society guidance",
        how: "`1.0–1.2 g per kg` of body weight a day for older adults, spread across meals.\n\nThe old worry that protein leaches calcium from bone has not held up — **adequate protein with adequate calcium is associated with better bone outcomes**, not worse.",
        evidence: [
          "Evidence summary — bone society position statements on dietary protein and bone health.",
          "NIH Office of Dietary Supplements — calcium fact sheet (protein interaction context).",
        ],
        checkFirst:
          "With reduced kidney function, your protein target comes from your care team. Ask for your number.",
      },
      {
        id: "falls",
        title: "Prevent the fall, not just the fracture",
        why: "Almost all fragility fractures happen because someone falls, and fall prevention has strong trial evidence that's routinely overlooked.",
        grade: "A",
        gradeNote: "USPSTF · CDC STEADI",
        how: "**Balance training is the highest-value piece** — tai chi and specific balance programmes both have good trial data.\n\nThen the boring wins: check vision and hearing, review medications that cause dizziness, remove loose rugs, light the route to the bathroom, and wear shoes with backs indoors.",
        evidence: [
          "U.S. Preventive Services Task Force — recommendation on falls prevention in community-dwelling older adults.",
          "CDC — STEADI initiative on older adult fall prevention.",
        ],
        checkFirst:
          "If you've already had a fall, tell your doctor — one fall substantially raises the risk of another, and a proper falls assessment finds causes like blood pressure drops, inner-ear problems and medication effects.",
      },
      {
        id: "dexa",
        title: "Get scanned at the right time, and ask about treatment if it's low",
        why: "Osteoporosis is silent until a fracture, and effective treatments exist that markedly reduce fracture risk.",
        grade: "A",
        gradeNote: "USPSTF · BHOF guideline",
        supervised: true,
        how: "DEXA is generally recommended for **women at `65`**, men at `70`, and earlier with risk factors — early menopause, steroid use, low body weight, smoking, a parental hip fracture, or a fracture from a minor fall.\n\nIf your score is low, ask about the FRAX fracture risk tool and about treatment. **A fracture from standing height or less after 50 warrants assessment regardless of scan timing.**",
        evidence: [
          "U.S. Preventive Services Task Force — screening for osteoporosis to prevent fractures.",
          "Bone Health & Osteoporosis Foundation — clinician's guide (treatment thresholds and FRAX).",
        ],
        checkFirst:
          "Long-term oral steroid use causes bone loss quickly and is an indication for earlier assessment. Never stop a steroid on your own — raise it, and ask about bone protection alongside.",
      },
    ],
    skipTheHype: {
      remedy: "Whole-body vibration plates for bone density",
      why: "They're marketed hard at exactly this audience, and the trial results have been small and inconsistent — nothing close to what progressive resistance training produces. No bone society guideline recommends them as a substitute for loading. If you have one, use it after your strength session, not instead of it.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "uti-prevention",
    name: "UTI prevention",
    nameEmphasis: "prevention",
    icon: "microscope",
    category: "everyday",
    blurb: "Two things with real evidence, and a lot of folklore around them.",
    matchRules: [],
    intro:
      "Recurrent urinary tract infections are common, miserable, and surrounded by advice that has been tested and mostly failed.\n\nTwo measures have genuine trial support: **drinking substantially more water**, and, for women after menopause, **vaginal oestrogen**. Cranberry is a distant, uncertain third.\n\nThe other half of this page is about antibiotic use. Recurrent UTIs are a leading driver of antibiotic resistance, and the current guidance is deliberate about when to treat and when not to.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "glucose", label: "Fasting glucose", unit: "mg/dL", flagAbove: 100 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "water-uti",
        title: "Drink substantially more water — this one was actually tested",
        why: "A randomised trial in women with recurrent UTIs found that adding 1.5 litres of water a day roughly halved the number of episodes.",
        grade: "A−",
        gradeNote: "Randomised trial · AUA/CUA/SUFU guideline",
        how: "Add about **`1.5 L` a day** on top of what you already drink, spread through the day.\n\nThis is the single best-evidenced self-directed measure for recurrent UTIs, and it's free. Aim for pale urine as the daily check.",
        evidence: [
          "Randomised controlled trial of increased daily water intake for recurrent cystitis in premenopausal women (JAMA Internal Medicine, 2018).",
          "AUA / CUA / SUFU — guideline on recurrent uncomplicated urinary tract infections in women.",
        ],
        checkFirst:
          "If you have heart failure or kidney disease, your fluid limit is set by your doctor. Don't add 1.5 litres a day without asking.",
      },
      {
        id: "vaginal-oestrogen",
        title: "After menopause, ask about vaginal oestrogen",
        why: "It's one of the most effective preventive measures for recurrent UTIs after menopause and one of the least often offered.",
        grade: "A",
        gradeNote: "AUA / CUA / SUFU guideline — strong recommendation",
        supervised: true,
        how: "Low-dose vaginal oestrogen restores the tissue and the local microbiome that keep bacteria out.\n\n**Systemic absorption is minimal**, which is why the safety profile is very different from systemic hormone therapy. It's recommended specifically for this indication in the guideline.",
        evidence: [
          "AUA / CUA / SUFU — recurrent uncomplicated UTI guideline (vaginal oestrogen, strong recommendation).",
          "The Menopause Society — position statement on genitourinary syndrome of menopause.",
        ],
        checkFirst:
          "There are situations where even local oestrogen needs a considered discussion — a history of breast cancer especially. That's an individual decision with your clinician.",
      },
      {
        id: "habits-uti",
        title: "The behavioural measures — and which ones are folklore",
        why: "Several long-standing recommendations have been tested and don't hold up, and knowing which is which saves effort.",
        grade: "B",
        gradeNote: "AUA guideline — evidence summary",
        how: "Reasonable and low-cost: **urinate after sex**, don't hold urine for long periods, and wipe front to back.\n\nNot supported by the evidence: avoiding baths, avoiding tight clothing, avoiding hot tubs, changing what you wear, or douching — **douching is actively harmful** and disrupts the protective flora.",
        evidence: [
          "AUA / CUA / SUFU — recurrent UTI guideline (behavioural measures, limited evidence).",
          "CDC / Office on Women's Health — urinary tract infection prevention guidance.",
        ],
        checkFirst:
          "Spermicide and spermicide-coated condoms are associated with higher UTI risk. If you use them and get recurrent infections, that's worth raising as a specific question.",
      },
      {
        id: "cranberry-honestly",
        title: "Cranberry — modest at best, and only in the right form",
        why: "The evidence has swung both ways for decades, and where a benefit shows up it's small and limited to specific groups.",
        grade: "B",
        gradeNote: "Cochrane · AUA — evidence summary",
        supplement: true,
        labNote:
          "The active compounds are proanthocyanidins, and content varies enormously between products — many list none at all. If you try it, the Lab Report is the only way to see whether there's a meaningful dose in the bottle.",
        how: "Cochrane's updated review found some reduction in recurrent UTIs in women with recurrent infections — a smaller effect than water or vaginal oestrogen.\n\n**Sweetened cranberry juice cocktail is mostly sugar** and isn't what was studied. If you try it, use a standardised product with stated proanthocyanidin content.",
        evidence: [
          "Cochrane systematic review of cranberry products for preventing urinary tract infections.",
          "AUA / CUA / SUFU — recurrent UTI guideline (cranberry as an option, evidence limited).",
        ],
        checkFirst:
          "Cranberry interacts with warfarin and can raise urinary oxalate, which matters if you form kidney stones. Check with a pharmacist before making it a daily habit.",
      },
      {
        id: "antibiotic-stewardship",
        title: "Get infections confirmed — and don't treat what doesn't need treating",
        why: "Repeated empirical antibiotics drive resistance, and one common finding is specifically recommended against treating.",
        grade: "A",
        gradeNote: "AUA / IDSA guidelines",
        supervised: true,
        how: "For recurrent infections, ask for a **urine culture** rather than repeated empirical courses — it identifies the organism and what actually works.\n\n**Asymptomatic bacteriuria — bacteria without symptoms — should not be treated** in most adults. Treating it drives resistance without benefit. The main exceptions are pregnancy and before certain urological procedures.",
        evidence: [
          "AUA / CUA / SUFU — recurrent uncomplicated UTI guideline (culture-directed therapy).",
          "Infectious Diseases Society of America — guideline on asymptomatic bacteriuria.",
        ],
        checkFirst:
          "Fever, flank or back pain, nausea, vomiting or confusion means the infection may have reached the kidney — that's urgent, not a home-management situation. In older adults, new confusion alone can be the presenting sign.",
      },
    ],
    skipTheHype: {
      remedy: "D-mannose",
      why: "It became the default recommendation on the strength of small, low-quality studies. A larger, well-conducted randomised trial published since found no reduction in recurrent UTIs compared with placebo, and current guidelines don't recommend it. Water and — after menopause — vaginal oestrogen are where the actual evidence sits.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "prostate-health",
    name: "Prostate health",
    nameEmphasis: "health",
    icon: "ribbon",
    category: "everyday",
    blurb: "Two different problems that get confused — and one shared decision.",
    matchRules: [
      { aliases: ["psa", "prostate specific antigen", "prostate-specific antigen"], label: "PSA", unit: "ng/mL", flagAbove: 4 },
    ],
    intro:
      "Two separate things get filed under \"prostate\", and confusing them causes a lot of unnecessary fear. **Benign enlargement (BPH)** is extremely common with age and causes urinary symptoms. **Prostate cancer** is a different disease, and it usually causes no symptoms at all in its early, treatable stage.\n\nThat second fact is why urinary symptoms are a poor guide to cancer risk — and why the screening conversation exists at all.\n\nPSA screening is genuinely a shared decision: it reduces prostate cancer deaths somewhat, and it also finds cancers that would never have caused harm. That trade-off is yours to make with your doctor, informed.",
    matchedIntro: "Your PSA is above the usual reference threshold — that needs a doctor's interpretation, not a supplement.",
    signals: [
      { aliases: ["psa", "prostate specific antigen", "prostate-specific antigen"], label: "PSA", unit: "ng/mL", flagAbove: 4 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagBelow: 300 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "PSA is not a number to interpret alone",
      body: "PSA rises with benign enlargement, infection, recent ejaculation and cycling, as well as with cancer. A single raised result is a reason for a conversation, not a diagnosis — and nothing on this page substitutes for that conversation.",
    },
    steps: [
      {
        id: "screening-decision",
        title: "Have the screening conversation properly",
        why: "PSA screening has real benefits and real harms, and the guidelines explicitly frame it as a decision to make together rather than a default.",
        grade: "A",
        gradeNote: "USPSTF · AUA guideline",
        supervised: true,
        how: "The USPSTF frames screening as an **individual decision for men aged `55–69`**, and recommends against routine screening after `70`.\n\nStart earlier — around `40–45` — if you're Black or have a father or brother with prostate cancer, both of which raise risk meaningfully.",
        evidence: [
          "U.S. Preventive Services Task Force — recommendation on prostate cancer screening.",
          "American Urological Association — early detection of prostate cancer guideline.",
        ],
        checkFirst:
          "Blood in urine or semen, bone pain, unexplained weight loss, or being unable to pass urine at all are not routine symptoms. Those need prompt assessment regardless of your screening decision.",
      },
      {
        id: "bph-symptoms",
        title: "Track urinary symptoms rather than tolerating them",
        why: "BPH symptoms are treatable, and quantifying them is what turns a vague complaint into a plan.",
        grade: "A",
        gradeNote: "AUA BPH guideline",
        supervised: true,
        how: "Ask about the **IPSS questionnaire** — a short standard score covering weak stream, hesitancy, urgency, frequency and night-time trips.\n\nSimple measures first: **stop fluids `2 hours` before bed**, cut evening alcohol and caffeine, and double-void. Then medication options if that isn't enough.",
        evidence: [
          "American Urological Association — guideline on the management of benign prostatic hyperplasia / lower urinary tract symptoms.",
          "NIH / NIDDK — prostate enlargement information.",
        ],
        checkFirst:
          "**Being unable to pass urine at all is a urological emergency.** And some over-the-counter decongestants and antihistamines can precipitate exactly that in men with BPH — check labels.",
      },
      {
        id: "lifestyle-prostate",
        title: "The lifestyle levers are the general cardiovascular ones",
        why: "The factors most consistently associated with better prostate outcomes are the same ones that protect the heart, which makes them an easy call.",
        grade: "B+",
        gradeNote: "Evidence summary — cohort research",
        how: "Regular physical activity, a healthy weight, not smoking, and a pattern high in vegetables and low in processed meat.\n\nThe evidence here is largely observational, so treat it as **worth doing anyway** rather than as a proven prostate intervention. It's the same list that lowers cardiovascular risk.",
        evidence: [
          "Evidence summary — cohort research on physical activity, obesity and prostate cancer outcomes.",
          "American Cancer Society — diet and physical activity guidance for cancer prevention.",
        ],
        checkFirst:
          "No diet or supplement prevents prostate cancer, and claims otherwise are not supported. Don't let a lifestyle plan substitute for the screening conversation.",
      },
      {
        id: "supplements-prostate",
        title: "Be sceptical of prostate supplements — including the popular ones",
        why: "The two best-known have been tested in large trials, and one of them increased risk.",
        grade: "B",
        gradeNote: "NIH trials · NCCIH — evidence summary",
        supplement: true,
        labNote:
          "\"Prostate support\" blends routinely combine saw palmetto, zinc, selenium and beta-sitosterol at unstated doses. Given the trial results below, this is a category to read carefully before buying.",
        how: "**Saw palmetto** was tested in large NIH-funded randomised trials for BPH symptoms and **did not beat placebo**.\n\n**Vitamin E and selenium** were tested for prostate cancer prevention in the SELECT trial — vitamin E was associated with an **increased** risk of prostate cancer. That trial is the reason routine supplementation isn't recommended.",
        evidence: [
          "NIH-funded randomised trials of saw palmetto for benign prostatic hyperplasia (CAMUS and STEP trials).",
          "SELECT — Selenium and Vitamin E Cancer Prevention Trial (JAMA, 2011).",
        ],
        checkFirst:
          "Some supplements lower PSA, which can mask a rising trend and delay a diagnosis. Tell your doctor everything you take before a PSA test.",
      },
      {
        id: "psa-interpretation",
        title: "Understand what raises PSA before you panic about a number",
        why: "Most raised PSA results are not cancer, and knowing the confounders prevents both false alarm and unnecessary biopsy.",
        grade: "A",
        gradeNote: "AUA guideline",
        supervised: true,
        how: "PSA rises with benign enlargement, prostatitis, urinary infection, recent ejaculation, and vigorous cycling. **Avoid ejaculation and hard cycling for `48 hours` before the test.**\n\nA single raised result is usually repeated. Ask about free/total PSA ratio, PSA density, and MRI before biopsy — the pathway now avoids a lot of unnecessary biopsies.",
        evidence: [
          "American Urological Association — early detection of prostate cancer guideline (PSA interpretation and MRI pathway).",
          "NIH / National Cancer Institute — prostate-specific antigen test fact sheet.",
        ],
        checkFirst:
          "Finasteride and dutasteride roughly halve PSA. If you take either, your doctor needs to know so the result can be interpreted correctly — otherwise a meaningful rise can look normal.",
      },
    ],
    skipTheHype: {
      remedy: "Saw palmetto for urinary symptoms",
      why: "It's the most-sold prostate supplement in the world, and it has been tested properly. Two large NIH-funded randomised trials — including one that escalated to triple the usual dose — found no benefit over placebo for BPH symptoms. Effective treatments for BPH exist; this isn't one of them.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "cold-flu-recovery",
    name: "Cold & flu recovery",
    nameEmphasis: "& flu recovery",
    icon: "bed",
    category: "everyday",
    blurb: "Most of it is time — and knowing the few things that shorten it.",
    matchRules: [],
    intro:
      "A cold runs `7–10 days` and a cough can linger for three weeks. Influenza is a different illness — it arrives suddenly, with fever and aching, and it knocks people flat.\n\nThe distinction matters because flu has an actual treatment that works, and it works **within the first `48 hours`**. Most people miss that window because they assume it's a bad cold.\n\nEverything else on this page is honest symptom management. Very little shortens a cold; quite a lot makes it more bearable, and a few things help you avoid the complications.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "zinc", label: "Zinc", unit: "μg/dL", flagBelow: 70 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    steps: [
      {
        id: "flu-window",
        title: "Know the 48-hour flu window",
        why: "Antiviral treatment for influenza works best started within two days of symptoms, and most people don't call in time.",
        grade: "A",
        gradeNote: "CDC / IDSA influenza guidance",
        supervised: true,
        how: "The flu pattern: **sudden onset, fever, body aches, headache, exhaustion**. Colds build gradually and stay in the nose and throat.\n\nIf that's you — and especially if you're `65+`, pregnant, or have asthma, heart disease, diabetes or a weakened immune system — **call within `48 hours`** and ask about testing and antivirals.",
        evidence: [
          "CDC — influenza antiviral medications: summary for clinicians and patients.",
          "Infectious Diseases Society of America — clinical practice guidelines on seasonal influenza.",
        ],
        checkFirst:
          "Emergency signs: difficulty breathing, chest pain, confusion, persistent dizziness, blue lips, seizures, or symptoms that improve then return with worse fever. Those need urgent care immediately.",
      },
      {
        id: "rest-fluids",
        title: "Rest properly and keep fluids up",
        why: "It's the most repeated advice for a reason — fever raises fluid losses, and pushing through delays recovery and spreads it.",
        grade: "A−",
        gradeNote: "CDC guidance — evidence summary",
        how: "Actually rest. **Stay home while you're feverish and for `24 hours` after the fever goes** without medication.\n\nFluids, warm drinks, and a humidified room for the cough. Honey has modest evidence for night-time cough in adults and children over `1 year`.",
        extra: {
          label: "Honey, and the age limit",
          body: "Honey performed as well as some over-the-counter cough remedies for night-time cough in trials, and it's cheap and safe — **except under `12 months`, where it carries a risk of infant botulism.** Never give honey to a baby.",
        },
        evidence: [
          "CDC — common cold and flu self-care guidance.",
          "Cochrane systematic review of honey for acute cough in children.",
        ],
        checkFirst:
          "Fever above `39°C` / `102°F` that won't come down, lasting more than three days, or with a stiff neck, rash or severe headache needs medical assessment.",
      },
      {
        id: "what-works",
        title: "Use what actually helps symptoms — and skip what doesn't",
        why: "The over-the-counter aisle is mostly aimed at symptoms, and a few of the products have specific problems worth knowing.",
        grade: "B+",
        gradeNote: "FDA · Cochrane — evidence summary",
        how: "Reasonable: paracetamol or ibuprofen for fever and aches, saline nasal spray or rinse, and a short course of a decongestant spray — **no more than `3 days`**, or you get rebound congestion.\n\nWorth knowing: the FDA advisory committee concluded that **oral phenylephrine — the most common oral decongestant — is not effective** at the approved dose.",
        evidence: [
          "FDA — advisory committee findings on oral phenylephrine efficacy.",
          "Cochrane systematic reviews of over-the-counter medications for the common cold.",
        ],
        checkFirst:
          "Don't double up on paracetamol — it's in many combination cold products, and accidental overdose is one of the most common causes of acute liver failure. Read every label.",
      },
      {
        id: "antibiotics",
        title: "Don't ask for antibiotics for a cold",
        why: "Colds and flu are viral, antibiotics do nothing for them, and green mucus is not evidence of a bacterial infection.",
        grade: "A",
        gradeNote: "CDC antibiotic stewardship",
        how: "**Coloured mucus is normal in a viral cold** — it's immune cells, not bacteria. It's not a reason for antibiotics.\n\nWhat *does* warrant a call: symptoms improving then clearly worsening, fever returning after several days, facial pain with fever beyond `10 days`, or an earache with fever.",
        evidence: [
          "CDC — antibiotic prescribing and use: colds and runny nose.",
          "CDC — Be Antibiotics Aware programme guidance.",
        ],
        checkFirst:
          "Antibiotics carry real risks — allergic reactions, C. difficile infection, and resistance. Asking for them \"just in case\" is a trade with a genuine downside.",
      },
      {
        id: "recovery-return",
        title: "Come back to training gradually",
        why: "Returning to hard exercise too soon prolongs recovery, and exercising with a fever carries a small but real cardiac risk.",
        grade: "B+",
        gradeNote: "Sports medicine guidance — evidence summary",
        how: "The common rule of thumb: **symptoms above the neck** — runny nose, mild sore throat — light activity is usually fine. **Below the neck** — chest congestion, body aches, fever — rest.\n\n**Never exercise with a fever.** Return at reduced intensity and build over several days.",
        evidence: [
          "Evidence summary — sports medicine guidance on exercise during acute respiratory infection.",
          "American College of Sports Medicine — return-to-activity considerations after illness.",
        ],
        checkFirst:
          "Chest pain, palpitations, unusual breathlessness or marked fatigue on returning to exercise after a viral illness needs assessment — myocarditis is rare but serious, and it presents exactly that way.",
      },
      {
        id: "prevent-next",
        title: "Reduce the next one — and get vaccinated",
        why: "Flu vaccination is the highest-evidence preventive step available, and it reduces severity even when it doesn't prevent infection.",
        grade: "A",
        gradeNote: "CDC / ACIP recommendations",
        supervised: true,
        how: "Annual flu vaccination, ideally in **early autumn**. Ask your doctor or pharmacist which others on the adult schedule apply — COVID, pneumococcal and RSV depending on age and risk.\n\nThen the boring one that works: **hand washing, `20 seconds`, with soap.**",
        evidence: [
          "CDC / ACIP — recommended adult immunisation schedule and seasonal influenza vaccination guidance.",
          "Cochrane systematic reviews of physical interventions to interrupt the spread of respiratory viruses.",
        ],
        checkFirst:
          "If you're pregnant, immunocompromised, or have had a serious reaction to a vaccine before, the schedule is individualised — that's the conversation to have, not a reason to skip it.",
      },
    ],
    skipTheHype: {
      remedy: "Vitamin C mega-doses and echinacea at the first sniffle",
      why: "Cochrane's verdict on vitamin C is that routine supplementation doesn't prevent colds in the general population, and starting it after symptoms begin doesn't reliably help either. Echinacea reviews come out broadly neutral. Both are harmless and both are sold as if they were the reason you got better on day seven — which is when a cold ends anyway.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
