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
    bookTitle: "The Kidney Stone Guide — fluid, oxalate and the myths about calcium",
    bookUrl: null,
    landingSlug: "kidney-stone-prevention",
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
    bookTitle: "The Bone Density Book — loading, calcium and fracture prevention",
    bookUrl: null,
    landingSlug: "bone-density-support",
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
    bookTitle: "The UTI Prevention Guide — cranberry, D-mannose and what the trials show",
    bookUrl: null,
    landingSlug: "uti-prevention",
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
    bookTitle: "The Prostate Handbook — symptoms, PSA and the supplement question",
    bookUrl: null,
    landingSlug: "prostate-health",
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
    bookTitle: "The Cold & Flu Guide — what shortens it, and what only feels like it does",
    bookUrl: null,
    landingSlug: "cold-flu-recovery",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "sinus-congestion",
    name: "Sinus & congestion",
    nameEmphasis: "& congestion",
    icon: "cloud",
    category: "everyday",
    blurb: "Rinse, steroid spray, patience — and the antibiotic you almost certainly don't need.",
    matchRules: [],
    intro:
      "Your sinuses are air-filled cavities in the bones of your face, lined with mucus-producing tissue and tiny hairs that sweep it toward small drainage openings. **Congestion is almost always swelling that blocks those openings** — the mucus can't leave, pressure builds, and you get the fullness, the facial pain and the blocked nose.\n\nThe distinction that decides everything: **acute sinusitis lasts under `4` weeks and is viral in the overwhelming majority of cases.** Chronic sinusitis — over `12` weeks — is a different condition, usually driven by ongoing inflammation, allergy or nasal polyps, and it needs proper assessment rather than repeated courses of the same thing.\n\nThe evidence-backed core is unglamorous and consistent: **saline rinsing, intranasal steroids and time.** Two things routinely get in the way. **Antibiotics are prescribed for acute sinusitis far more often than they're indicated**, since most cases are viral. And **decongestant sprays used for more than a few days cause rebound congestion** — a worse blockage than the one they were bought for, and a genuinely common trap.",
    signals: [
      {
        aliases: ["eosinophils", "eosinophil count", "absolute eosinophils"],
        label: "Eosinophils",
        unit: "K/µL",
        flagAbove: 0.5,
      },
      {
        aliases: ["ige", "total ige", "immunoglobulin e"],
        label: "Total IgE",
        unit: "IU/mL",
        flagAbove: 100,
      },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "saline",
        title: "Rinse with saline — properly, and with the right water",
        detailTitle: "The highest-yield thing you can do",
        why: "Nasal irrigation has consistent trial evidence in both acute and chronic sinus symptoms, and it's the closest thing to a free treatment here.",
        grade: "A−",
        gradeNote: "Cochrane review · AAO-HNS guideline",
        how: "**High-volume, low-pressure irrigation** — a neti pot or a squeeze bottle, `120–240 ml` per side — outperforms a small saline spray for sinus symptoms. Sprays moisten; rinses actually clear.\n\n**Water safety is not optional and it is the one genuinely dangerous part of this page.** Use **distilled, sterile, or previously boiled and cooled water** — never straight from the tap. Tap water is safe to drink and is not sterile; rare but fatal amoebic infections have been caused by nasal rinsing with untreated tap water. Boil for `1` minute (`3` at altitude) and cool.\n\n**Make it isotonic**: roughly `1/2` teaspoon of non-iodised salt and a pinch of baking soda per `250 ml`, or use pre-made sachets. Body-temperature.\n\n**Technique:** lean over the sink, head tilted, breathe through your mouth, and let it flow in one nostril and out the other. Then blow gently — one nostril at a time, never hard.\n\n**Clean the device after every use** and let it dry fully. Biofilms grow in damp bottles.",
        evidence: [
          "Cochrane systematic review — saline irrigation for chronic rhinosinusitis.",
          "American Academy of Otolaryngology–Head and Neck Surgery — clinical practice guideline on adult sinusitis.",
          "CDC — safe water use for nasal rinsing (Naegleria fowleri risk).",
        ],
        checkFirst:
          "Never use untreated tap water for nasal rinsing. And stop rinsing if you've had recent sinus or ear surgery, or if you have an ear infection, until your doctor clears it.",
      },
      {
        id: "steroid-spray",
        title: "Use a steroid nasal spray — and aim it correctly",
        detailTitle: "The technique failure that wastes the whole treatment",
        why: "Intranasal steroids are the best-evidenced medication for both allergic rhinitis and chronic sinus symptoms, and most people use them wrong enough to get nothing.",
        grade: "A",
        gradeNote: "AAO-HNS · allergy society guidelines",
        how: "**Fluticasone, mometasone and budesonide** are widely available over the counter and are first-line for allergic rhinitis and chronic rhinosinusitis.\n\n**Two things ruin them.** First, **timing**: they take `1–2` weeks of daily use to reach full effect. Used as a rescue on a bad day, they seem useless — and most people abandon them in week one.\n\nSecond, **aim**. Blow your nose first. Then **use your opposite hand** — left hand for the right nostril — and **aim outward, toward your ear on that side**, not up toward the middle. Spraying at the septum is the classic error: it does nothing for the sinuses and it's the cause of the nosebleeds people blame on the drug. **Don't sniff hard** afterwards; a gentle breath in is enough. Hard sniffing sends it straight down your throat.\n\n**Rinse first, then spray.** Clearing mucus lets the steroid reach the tissue.\n\n**These are safe for daily long-term use** at standard doses — minimal systemic absorption. They are not the same class as decongestant sprays and they don't cause rebound.",
        evidence: [
          "American Academy of Otolaryngology–Head and Neck Surgery — adult sinusitis guideline: intranasal corticosteroids.",
          "Evidence summary — intranasal corticosteroid technique and adverse effects (septal irritation, epistaxis).",
          "Cochrane review — intranasal steroids for chronic rhinosinusitis.",
        ],
        checkFirst:
          "Persistent nosebleeds, crusting or pain mean stop and see a doctor — usually a technique problem, occasionally something else. Tell your doctor if you use inhaled or oral steroids for other conditions so the total dose is accounted for.",
      },
      {
        id: "decongestant-trap",
        title: "Know the decongestant spray trap — 3 days, maximum",
        why: "Rebound congestion from overused decongestant sprays is one of the most common self-inflicted causes of a permanently blocked nose.",
        grade: "A",
        gradeNote: "AAO-HNS guideline · pharmacology consensus",
        how: "**Oxymetazoline and xylometazoline sprays work brilliantly — for about three days.** They constrict the blood vessels in the nose and open it within minutes, which is exactly what makes them so easy to keep using.\n\n**Beyond `3` days, the tissue rebounds**: it swells more each time the dose wears off, so you need it more often, and stopping produces a nose more blocked than the one you started with. It's called **rhinitis medicamentosa**, and people arrive at ENT clinics after years of it.\n\n**Getting off it:** stop one nostril at a time so you can still breathe, or stop entirely and accept a rough week. **Starting a steroid nasal spray a week beforehand** makes the withdrawal considerably easier. In stubborn cases a doctor can help with a short oral steroid course.\n\n**Oral decongestants** (pseudoephedrine) don't cause rebound but raise blood pressure and heart rate, disturb sleep, and are unsuitable if you have hypertension, heart disease, glaucoma or prostate problems.\n\n**Steroid sprays are the ones you can use every day.** Decongestants are the ones you cannot. Confusing the two is the whole problem.",
        evidence: [
          "American Academy of Otolaryngology–Head and Neck Surgery — topical decongestant duration limits.",
          "Evidence summary — rhinitis medicamentosa: mechanism, prevalence and management.",
          "Evidence summary — systemic effects of oral pseudoephedrine.",
        ],
        checkFirst:
          "If you've been using a decongestant spray for weeks or months, don't just push through alone — see a doctor. Getting off it is much easier with a steroid spray started first and, sometimes, a short oral course.",
      },
      {
        id: "acute-vs-chronic",
        title: "Know when it's viral, and when antibiotics are actually indicated",
        detailTitle: "The waiting rules, in specifics",
        why: "Most acute sinusitis is viral and resolves without antibiotics, and taking them anyway carries real cost with no benefit.",
        grade: "A",
        gradeNote: "AAO-HNS · IDSA guidelines",
        supervised: true,
        how: "**Most acute sinusitis is viral.** Green or yellow mucus is **not** evidence of bacterial infection — that colour comes from immune cells, and it's the single most common reason for an unnecessary prescription.\n\n**The criteria guidelines use for suspecting bacterial infection:**\n**Symptoms lasting `10` days or more without improving**, or\n**Severe symptoms** — high fever with purulent discharge and facial pain — for `3–4` consecutive days at the start, or\n**\"Double worsening\"** — you were getting better, then clearly got worse again after `5–6` days.\n\nWithout one of those, **watchful waiting is the guideline-recommended approach**, and even with them, delayed prescribing is often reasonable.\n\n**What actually helps meanwhile:** saline rinsing, a steroid spray, paracetamol or ibuprofen, hydration, steam, and sleeping propped up.\n\n**Chronic sinusitis — over `12` weeks — is a different animal.** Repeated antibiotic courses aren't the answer; it needs ENT assessment for polyps, allergy, structural problems and, occasionally, immune or fungal causes.",
        evidence: [
          "American Academy of Otolaryngology–Head and Neck Surgery — adult sinusitis clinical practice guideline.",
          "Infectious Diseases Society of America — guideline for acute bacterial rhinosinusitis.",
          "Evidence summary — mucus colour as a predictor of bacterial infection.",
        ],
        checkFirst:
          "Severe headache with neck stiffness, swelling or redness around the eye, vision changes, double vision, or confusion are emergencies — sinus infections can rarely spread to the eye socket or brain. Go now, not tomorrow.",
      },
      {
        id: "triggers",
        title: "Find and remove what's driving it",
        why: "Recurrent congestion usually has an ongoing cause, and treating the flare repeatedly without finding it is an endless loop.",
        grade: "B+",
        gradeNote: "Allergy society guidance · evidence summary",
        how: "**Allergy is the most common driver.** Dust mites, pets, pollen, mould. If congestion is year-round, worse in bed or worse at home, think dust mite: **hot-wash bedding weekly, allergy-proof covers on pillow and mattress**, reduce clutter, vacuum with a HEPA filter. Seasonal symptoms respond to a steroid spray started `2` weeks *before* the season.\n\n**Dry air** thickens mucus. A humidifier in winter helps — **cleaned regularly**, or it becomes a mould source and makes things worse.\n\n**Smoke and vaping** paralyse the cilia that clear your sinuses. This includes second-hand smoke.\n\n**Reflux** can cause chronic post-nasal drip and throat clearing that's often mistaken for sinus disease.\n\n**Structural issues** — a deviated septum, nasal polyps — cause one-sided or persistent blockage that no spray will fix. **Persistent one-sided blockage deserves an ENT opinion**, since it also needs other things excluded.\n\n**Aspirin sensitivity** with asthma and nasal polyps is a recognised triad worth knowing about if all three fit you.",
        evidence: [
          "Evidence summary — allergen avoidance measures in allergic rhinitis.",
          "American Academy of Otolaryngology–Head and Neck Surgery — evaluation of chronic nasal obstruction.",
          "Evidence summary — laryngopharyngeal reflux and upper airway symptoms.",
        ],
        checkFirst:
          "Persistent blockage on one side only, nosebleeds from one side, facial numbness, or a lump needs prompt ENT assessment. Those patterns need other causes excluded rather than treating as sinusitis.",
      },
      {
        id: "comfort",
        title: "The comfort measures — what helps, and what to skip",
        why: "Several traditional remedies genuinely ease symptoms; a couple carry avoidable risk, and it's worth knowing which is which.",
        grade: "B",
        gradeNote: "Evidence summary — symptomatic measures",
        supplement: true,
        labNote:
          "If you use a menthol or eucalyptus product, this is a category where concentration and purity vary widely and where essential oils are frequently sold with unverified claims. Check the Purity Score, and never take essential oils internally.",
        how: "**Steam inhalation** eases the sensation of blockage for many people. The evidence for changing the illness is weak; the comfort is real. **Use a bowl at a safe distance, not a face directly over boiling water** — scald injuries from this are common and entirely avoidable, especially in children.\n\n**A hot shower** does the same job with no burn risk.\n\n**Sleep propped up** on an extra pillow or two — gravity genuinely helps drainage and reduces the morning congestion.\n\n**Warm compress** on the face for pressure and pain.\n\n**Hydration** thins mucus. Ordinary fluid intake, not litres.\n\n**Menthol and eucalyptus** create a strong sensation of clearer breathing — worth knowing that the sensation outpaces the actual airflow change, which is fine when you understand what you're buying. **Never use menthol products on infants**, and don't put essential oils in a neti pot.\n\n**Zinc, vitamin C and echinacea** are marketed for this constantly; the evidence for shortening a viral upper respiratory illness is weak and inconsistent. **Never use intranasal zinc — it has caused permanent loss of smell** and products were withdrawn for exactly that reason.",
        evidence: [
          "Cochrane review — heated, humidified air for the common cold.",
          "Evidence summary — menthol and perceived versus measured nasal airflow.",
          "U.S. Food and Drug Administration — warnings on intranasal zinc products and anosmia.",
        ],
        checkFirst:
          "Never use intranasal zinc products. Keep steam inhalation away from children, and don't apply menthol or camphor products to the face of an infant or young child.",
      },
    ],
    skipTheHype: {
      remedy: "Colloidal silver nasal sprays",
      why: "Sold as a natural antibiotic for sinus infections, and popular precisely because guidelines discourage the actual antibiotics. **The FDA has stated that colloidal silver is not safe or effective for treating any disease**, and it has taken action against products making these claims. There is no good evidence it clears sinus infection. The harm isn't hypothetical either: prolonged use causes **argyria**, a permanent blue-grey discolouration of the skin that does not reverse. It's an odd bargain — an unproven treatment for a condition that is usually viral and resolves on its own, at the risk of permanently changing your skin colour. Saline rinsing and a steroid spray do the job, cost less, and have the evidence.",
    },
    bookTitle: "The Clear Sinus Guide — rinsing, sprays and knowing when it's not viral",
    bookUrl: null,
    landingSlug: "sinus-congestion",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "oral-gum-health",
    name: "Oral & gum health",
    nameEmphasis: "& gum health",
    icon: "brush",
    category: "everyday",
    blurb: "Bleeding gums are not normal — and gum disease tracks with your heart.",
    matchRules: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    intro:
      "Two things go wrong in your mouth and they run on the same fuel. **Tooth decay** happens when bacteria ferment sugars into acid that dissolves enamel. **Gum disease** starts as **gingivitis** — inflammation from plaque at the gumline, reversible with good cleaning — and can progress to **periodontitis**, where the inflammation destroys the bone holding your teeth in. That part is not reversible, which is why the early stage matters so much.\n\nThe single most useful correction: **bleeding gums are not normal.** Not from brushing, not from flossing. Healthy gums don't bleed. Bleeding is inflammation, and the instinct to brush that area more gently is exactly backwards — it's the area that needs cleaning most.\n\nAnd this connects outward. **Periodontitis is associated with cardiovascular disease and diabetes**, and the diabetes relationship runs both ways: high blood sugar worsens gum disease, and gum disease makes blood sugar harder to control. Severe gum disease is also linked to adverse pregnancy outcomes.\n\nThe fundamentals are dull and they work: **fluoride, cleaning between your teeth, less frequent sugar, no smoking, and a dentist who sees you regularly.**",
    matchedIntro:
      "One of your markers is relevant here — blood sugar and inflammation both interact with gum disease in both directions. That's worth mentioning to your dentist as well as your doctor, since it changes how closely your gums should be watched.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "fluoride",
        title: "Use fluoride toothpaste — and stop rinsing it off",
        detailTitle: "Spit, don't rinse",
        why: "Fluoride toothpaste is among the most evidence-backed preventive interventions in medicine, and most people wash it away seconds after applying it.",
        grade: "A",
        gradeNote: "Cochrane reviews · ADA · WHO essential medicines",
        how: "**Use a toothpaste with at least `1,350–1,500 ppm` fluoride.** The number is on the tube. Fluoride works by remineralising early damage and making enamel more acid-resistant, and the Cochrane evidence for it is about as solid as preventive dentistry gets.\n\n**Spit, don't rinse.** Rinsing with water after brushing washes away the fluoride that would otherwise sit on your teeth working for hours. This single change meaningfully increases the benefit and costs nothing. Same logic for mouthwash — **don't use it straight after brushing**; use it at a different time of day, or not at all.\n\n**Twice a day, and the one before bed is the important one** — saliva flow drops overnight, so whatever's on your teeth stays there.\n\n**Brush for `2` minutes.** Most people brush for under `1` and are confident it was longer. Use a timer for a week to recalibrate.\n\n**Electric toothbrushes clean better** — Cochrane found oscillating-rotating brushes reduce plaque and gingivitis more than manual. Not essential; genuinely better.\n\n**Soft bristles and gentle pressure.** Hard brushing causes gum recession and wears enamel at the gumline. You're removing a soft film, not scrubbing a pan.",
        evidence: [
          "Cochrane systematic reviews — fluoride toothpastes for preventing dental caries.",
          "Cochrane review — powered versus manual toothbrushing for oral health.",
          "American Dental Association — fluoride and toothbrushing recommendations.",
        ],
        checkFirst:
          "Children need age-appropriate fluoride amounts and supervision — too much during tooth development causes fluorosis. Follow your dentist's guidance on quantity by age, and keep toothpaste out of reach of toddlers.",
      },
      {
        id: "interdental",
        title: "Clean between your teeth — where the disease actually starts",
        why: "A toothbrush reaches about three-fifths of the tooth surface, and gum disease and decay begin in the part it misses.",
        grade: "A−",
        gradeNote: "Cochrane review · European Federation of Periodontology",
        how: "**Interdental brushes beat floss** where the gaps are big enough to take them — the evidence is clearer, and most people find them far easier to use well. Get sized by your dentist or hygienist; using the right size is most of the effect.\n\n**Floss for tight contacts** where a brush won't fit. Technique matters: curve it into a **C shape around each tooth** and move it up and down against the side, rather than snapping it straight down between them.\n\n**Water flossers** are a reasonable option, especially with braces, implants or bridges, or with dexterity problems. Evidence is decent for gingivitis, less strong than interdental brushes for plaque.\n\n**Once a day is enough** — most people do it before bed.\n\n**And the bleeding question.** If your gums bleed when you start, **keep going gently rather than stopping.** Bleeding from inflammation typically settles within `1–2` weeks of consistent cleaning. **If it's still bleeding after two weeks, see a dentist** — that's established gum disease, not a technique problem you can outlast.",
        evidence: [
          "Cochrane systematic review — interdental brushing and flossing for gingivitis and plaque control.",
          "European Federation of Periodontology — S3 level guideline on the treatment of gingivitis and periodontitis.",
          "American Dental Association — interdental cleaning recommendations.",
        ],
        checkFirst:
          "Gums that bleed heavily, are painful and swollen, or bleed spontaneously without brushing need a dentist. Spontaneous bleeding can also relate to blood disorders or medication, and it isn't something to persist through.",
      },
      {
        id: "sugar-frequency",
        title: "Cut the frequency of sugar, not just the amount",
        detailTitle: "Why grazing beats dessert for damage",
        why: "Every sugar exposure starts an acid attack lasting `20–40` minutes, so ten small hits do far more damage than one large one.",
        grade: "A",
        gradeNote: "WHO guideline · caries research consensus",
        how: "**Frequency is the variable, not quantity.** A dessert eaten in ten minutes causes one acid attack. The same sugar sipped across an afternoon causes a continuous one, and saliva never gets the chance to remineralise between them.\n\n**The practical version:** keep sugar to mealtimes. Cut the grazing and the sipping. A can of soft drink drunk in one go is far less damaging than the same can nursed for two hours.\n\n**Watch the drinks especially.** Soft drinks, fruit juice, sports drinks, sweetened coffee, and — often missed — **sparkling water and \"healthy\" fruit teas**, which are acidic even without sugar. Acid erodes enamel independently of bacteria.\n\n**The sticky and slow ones are the worst:** dried fruit, caramels, boiled sweets, biscuits that pack into the grooves of your molars.\n\n**Water and plain milk are the safe drinks** between meals. Milk is close to neutral and provides calcium.\n\n**Don't brush straight after anything acidic** — wait `30–60` minutes. Softened enamel brushes away. Rinse with water instead.\n\n**Sugar-free gum after meals** genuinely helps — it raises saliva flow, and xylitol gum has decent supporting evidence.",
        evidence: [
          "World Health Organization — guideline on sugars intake for adults and children.",
          "Evidence summary — frequency of sugar exposure and caries incidence.",
          "Evidence summary — sugar-free and xylitol chewing gum in caries prevention.",
        ],
        checkFirst:
          "Persistent dry mouth is a serious risk factor for rapid decay, and it's a common side effect of many medications. If your mouth is dry most of the time, tell your dentist and your doctor — there are treatments, and the decay risk is real.",
      },
      {
        id: "gum-disease",
        title: "Take gum disease seriously — and know it links outward",
        detailTitle: "Gingivitis, periodontitis and the systemic connection",
        why: "Periodontitis destroys bone irreversibly and is associated with cardiovascular disease and worse diabetes control.",
        grade: "A−",
        gradeNote: "EFP S3 guideline · AHA scientific statement",
        supervised: true,
        how: "**Gingivitis** — red, swollen, bleeding gums — is reversible with cleaning and professional scaling. **Periodontitis** is what follows if it isn't: the inflammation destroys the bone around the teeth, gums recede, teeth loosen. **That bone loss doesn't come back**, which is why acting at the gingivitis stage matters so much.\n\n**The signs to act on:** bleeding that doesn't settle in `2` weeks, persistent bad breath or taste, receding gums, sensitivity, loose teeth, or teeth that seem to have shifted.\n\n**The systemic links are real and worth stating carefully.** Periodontitis is associated with **cardiovascular disease**, and the American Heart Association's position is that the association is well established while a causal role isn't proven. The **diabetes relationship is bidirectional** and stronger: high blood sugar worsens gum disease, gum disease worsens glycaemic control, and treating periodontitis has been shown to modestly improve HbA1c. Severe gum disease is also associated with adverse pregnancy outcomes.\n\n**Smoking is the biggest modifiable risk factor**, and it does something particularly deceptive: it constricts blood vessels, so **gums bleed less** — the disease progresses silently while the warning sign is suppressed.\n\n**See a dentist and hygienist regularly.** Interval depends on risk; ask what yours should be.",
        evidence: [
          "European Federation of Periodontology — S3 level clinical practice guideline for the treatment of periodontitis.",
          "American Heart Association — scientific statement on periodontal disease and atherosclerotic cardiovascular disease.",
          "Evidence summary — bidirectional relationship between periodontitis and diabetes, including HbA1c effects of periodontal therapy.",
        ],
        checkFirst:
          "Loose teeth, gums pulling away, persistent bad taste, or facial swelling with dental pain need a dentist promptly. A spreading dental infection with facial swelling, fever or difficulty swallowing is an emergency.",
      },
      {
        id: "dry-mouth-erosion",
        title: "Protect against dry mouth, grinding and erosion",
        why: "These three cause a lot of damage quietly, and all three have straightforward countermeasures once identified.",
        grade: "B+",
        gradeNote: "Evidence summary · ADA guidance",
        how: "**Dry mouth (xerostomia)** is a major decay risk — saliva buffers acid, delivers minerals and clears debris. Common causes: **many medications** (antidepressants, antihistamines, blood pressure drugs, diuretics), dehydration, mouth-breathing, Sjögren's syndrome, and radiotherapy to the head and neck. Ask your doctor whether a medication can be changed; use **saliva substitutes, sugar-free gum and frequent water**, and ask your dentist about **high-fluoride toothpaste**, which is prescribed for exactly this.\n\n**Grinding and clenching (bruxism)** wears enamel flat, cracks teeth and causes jaw pain and headaches. Often stress- or sleep-related — **and it's associated with sleep apnoea**, which is worth screening for if you also snore. A **custom night guard** from a dentist protects the teeth; the boil-and-bite versions fit poorly and can move teeth.\n\n**Acid erosion** dissolves enamel without any bacteria involved. Sources: **reflux** (often silent, and a common cause of erosion on the inner surfaces), frequent vomiting, citrus, vinegar, wine and sparkling water. **After anything acidic: rinse with water, wait `30–60` minutes, then brush.**\n\n**Mouth-breathing** dries everything out. If your nose is blocked most of the time, treating that helps your teeth too.",
        evidence: [
          "American Dental Association — xerostomia: causes and management.",
          "Evidence summary — bruxism, sleep-disordered breathing and occlusal splint therapy.",
          "Evidence summary — dental erosion from gastro-oesophageal reflux and dietary acids.",
        ],
        checkFirst:
          "Erosion on the inner surfaces of your teeth often signals reflux — sometimes silent reflux you haven't noticed. Dentists frequently spot it first, and it's worth investigating rather than only patching the teeth.",
      },
      {
        id: "mouth-check",
        title: "Check your own mouth — and get the professional check",
        why: "Oral cancer is far more survivable when caught early, and the early signs are painless and easy to dismiss.",
        grade: "A−",
        gradeNote: "Evidence summary · dental association guidance",
        supervised: true,
        how: "**Look, once a month.** Good light, a mirror. Check your tongue — top, underside and both edges — the floor of your mouth, the inside of your cheeks and lips, and your gums. Feel your neck for lumps.\n\n**What needs checking if it lasts more than `3` weeks:** an **ulcer or sore that doesn't heal**, a **red or white patch**, a lump or thickening, persistent numbness, difficulty swallowing, a persistent hoarse voice, or unexplained bleeding or loose teeth.\n\n**Three weeks is the rule of thumb.** Most mouth ulcers heal in `10–14` days. One that doesn't needs looking at, and the early lesions are typically **painless** — which is exactly why they get ignored.\n\n**Risk factors:** tobacco in any form (including chewing and betel/paan), alcohol — and the two multiply each other — HPV infection, and sun exposure for lip cancer.\n\n**Your dentist screens for this at check-ups**, which is a genuinely underrated reason to go even when nothing hurts.",
        evidence: [
          "Evidence summary — early detection and survival outcomes in oral cavity cancer.",
          "American Dental Association — oral cancer screening in routine dental care.",
          "Evidence summary — tobacco, alcohol and HPV as risk factors for oral cancer.",
        ],
        checkFirst:
          "Any mouth ulcer, lump, or red or white patch lasting more than 3 weeks needs a dentist or doctor — soon, not eventually. Painless is not reassuring here; early oral cancer usually doesn't hurt.",
      },
    ],
    skipTheHype: {
      remedy: "Charcoal toothpaste and oil pulling",
      why: "Both are sold as natural alternatives to conventional oral care, and both have the same core problem: **most contain no fluoride**, so using them means giving up the single most evidence-backed thing you can do for your teeth. **Charcoal toothpaste is abrasive** — reviews in the dental literature have raised concerns that it wears enamel, and since enamel doesn't regenerate, that trade is permanent. Once enamel thins, the yellower dentine beneath shows through, so it can end up making teeth look darker rather than whiter. **Oil pulling** has a handful of small, low-quality studies and no evidence that it treats decay or gum disease; the American Dental Association does not recommend it. Neither is dangerous in itself. The danger is the substitution — swapping a proven intervention for an unproven one and finding out years later at a dental appointment.",
    },
    bookTitle: "The Mouth Manual — teeth, gums and the connections nobody mentions",
    bookUrl: null,
    landingSlug: "oral-gum-health",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "hair-loss-support",
    name: "Hair loss support",
    nameEmphasis: "support",
    icon: "scissors",
    category: "everyday",
    blurb: "Diagnosis first — because two of the causes are reversible and one isn't.",
    matchRules: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
    ],
    intro:
      "Hair grows in cycles — a long growing phase, a brief transition, and a resting phase ending in a shed. **Losing `50–100` hairs a day is normal.** What matters is whether the pattern has changed and whether hairs are being replaced.\n\nThe reason this page insists on diagnosis before treatment is that the common causes look different and are managed completely differently:\n\n**Androgenetic alopecia** — pattern hair loss — is the most common by far. Gradual, patterned (receding hairline and crown in men, widening part with retained hairline in women), progressive. **Treatable, not curable**, and earlier treatment protects more than late treatment restores.\n\n**Telogen effluvium** — diffuse shedding `2–4` months after a trigger: illness, surgery, childbirth, crash dieting, severe stress, a new medication. **It is usually reversible**, and the delay is why people so often blame the wrong thing.\n\n**Alopecia areata** — sudden smooth round patches. Autoimmune, needs a dermatologist, and has genuinely new treatments.\n\n**Nutritional and thyroid causes** — iron deficiency and thyroid disease are both correctable, and both are worth excluding before spending anything on a serum.\n\nThe honest headline: **only a few things have real evidence, and the supplement aisle isn't where they live.**",
    matchedIntro:
      "One of your markers is in a range that bears directly on hair — low iron stores and thyroid dysfunction are two of the most common reversible causes of shedding. Worth addressing with your doctor before you spend anything on treatment.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "zinc", label: "Zinc", unit: "μg/dL", flagBelow: 80 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagAbove: 700 },
    ],
    steps: [
      {
        id: "diagnose",
        title: "Get the type identified before you treat anything",
        detailTitle: "Four common causes, four different plans",
        why: "Pattern loss, shedding, autoimmune patches and scarring alopecia look superficially similar and are managed nothing alike — and one of them is a race against time.",
        grade: "A",
        gradeNote: "American Academy of Dermatology · BAD guidance",
        supervised: true,
        how: "**See a doctor or dermatologist**, ideally with photos taken over time. Diagnosis is largely clinical — the pattern, the history, a pull test, sometimes dermoscopy or a scalp biopsy.\n\n**Ask for bloods**: **ferritin, full blood count, thyroid function, vitamin D**, and where relevant **testosterone, DHEAS and prolactin** in women with signs of excess androgen. Zinc if diet is restricted.\n\n**The one that's urgent: scarring (cicatricial) alopecia.** If there's redness, scaling, pain, burning, itching or visible loss of follicle openings, that needs a **dermatologist quickly** — scarring destroys follicles permanently and the goal is stopping progression. This is the reason not to spend six months on a serum first.\n\n**On women specifically:** female pattern hair loss is common and under-treated, and thyroid disease, iron deficiency, PCOS and postpartum shedding all need excluding. **Any hair loss with irregular periods, acne or unwanted facial hair needs a hormonal workup.**",
        evidence: [
          "American Academy of Dermatology — evaluation and management of hair loss.",
          "British Association of Dermatologists — guidelines on the management of alopecia.",
          "Evidence summary — laboratory evaluation in diffuse hair loss.",
        ],
        checkFirst:
          "Redness, scaling, pain or scarring on the scalp needs a dermatologist urgently — scarring alopecia destroys follicles permanently. Sudden patchy loss, or hair loss with other symptoms, also needs proper assessment rather than a shelf product.",
      },
      {
        id: "minoxidil",
        title: "Minoxidil — the over-the-counter option that actually works",
        detailTitle: "How to use it, and what to expect",
        why: "It has decades of randomised evidence in pattern hair loss, and most people who try it quit before it could have worked.",
        grade: "A",
        gradeNote: "Cochrane review · FDA-approved indication",
        supervised: true,
        how: "**Topical minoxidil is one of only two treatments with strong randomised evidence** for androgenetic alopecia and is available without prescription. It prolongs the growth phase and enlarges miniaturised follicles.\n\n**The realistic expectations, which matter more than the mechanism:**\n**It takes `4–6` months** before you can judge it. Photographs, not mirror impressions.\n**An initial shed at weeks `2–8` is normal and expected** — synchronised follicles entering a new growth phase. It looks like failure and it is the single biggest reason people stop.\n**It maintains more than it regrows.** Most people hold ground and thicken; dramatic regrowth is the exception.\n**It only works while you use it.** Stop, and you lose the gains over `3–6` months. That's a genuine long-term commitment to weigh up front.\n\n**Practical:** apply to a dry scalp, not to hair, once or twice daily as directed. The foam causes less irritation than the solution (propylene glycol is the usual irritant).\n\n**Oral minoxidil at low dose** is increasingly used off-label by dermatologists with promising results. **Prescription only** — it's a blood pressure drug and needs monitoring.",
        evidence: [
          "Cochrane systematic review — interventions for female pattern hair loss.",
          "Evidence summary — randomised trials of topical minoxidil in androgenetic alopecia.",
          "Evidence summary — low-dose oral minoxidil in dermatological practice.",
        ],
        checkFirst:
          "Minoxidil isn't recommended in pregnancy or breastfeeding. Keep it away from pets — it is highly toxic to cats. And unexplained facial hair growth or a racing heart means stop and see your doctor.",
      },
      {
        id: "prescription",
        title: "Know the prescription options — and their real trade-offs",
        why: "The most effective treatment for male pattern loss is prescription-only, and it carries a genuine discussion rather than a simple yes.",
        grade: "A−",
        gradeNote: "AAD guidance · randomised trial evidence",
        supervised: true,
        how: "**Finasteride** blocks the conversion of testosterone to DHT, the hormone driving follicle miniaturisation. It has strong randomised evidence in male pattern hair loss and is more effective than minoxidil for most men — the two are often combined.\n\n**The honest discussion:** sexual side effects — reduced libido, erectile difficulty — occur in a small percentage in trials, and there are reports of symptoms persisting after stopping. The frequency and mechanism of persistent symptoms are genuinely debated. **It is worth knowing this before starting rather than after**, and it's a conversation with a doctor, not a checkbox on a telehealth form. It also lowers PSA readings, which your doctor needs to know when interpreting prostate screening.\n\n**For women:** finasteride is **not used in women who could become pregnant** — it causes birth defects. **Spironolactone** is commonly used off-label for female pattern hair loss, and requires contraception and monitoring.\n\n**Alopecia areata** now has genuinely effective options — **JAK inhibitors** have transformed treatment for severe cases, and they're specialist-prescribed with real monitoring requirements.\n\n**Hair transplantation** is an option for stable pattern loss, and works best alongside medical treatment to protect the hair you still have.",
        evidence: [
          "American Academy of Dermatology — guidelines on the management of androgenetic alopecia.",
          "Evidence summary — randomised trials of finasteride and reported adverse effects.",
          "Evidence summary — JAK inhibitors in severe alopecia areata.",
        ],
        checkFirst:
          "Finasteride must not be handled by anyone who is or may become pregnant, and it lowers PSA levels — tell any doctor arranging prostate screening. Never buy prescription hair loss medication from unregulated online sellers.",
      },
      {
        id: "nutrition",
        title: "Correct real deficiencies — and only real ones",
        detailTitle: "Where nutrition genuinely matters",
        why: "Nutritional causes are real and correctable, and supplementing without a deficiency does nothing — or, with a couple of nutrients, active harm.",
        grade: "B+",
        gradeNote: "Evidence summary · AAD guidance",
        supplement: true,
        labNote:
          "Hair supplements are among the most heavily marketed and least verified products on the shelf, and several deliver biotin at hundreds of times the daily requirement — which interferes with common blood tests. If you're correcting a documented deficiency, single-ingredient products with declared doses are the safer route. Check the Purity Score.",
        how: "**Iron.** Low ferritin is a genuine and common cause of shedding, particularly in menstruating women. Many dermatologists work to a **higher target for hair than the anaemia threshold**. **Test before supplementing — never take iron blind.**\n\n**Protein.** Hair is protein. Crash dieting, very low-calorie eating and inadequate protein reliably cause telogen effluvium — and this is one of the most common causes in people who've recently lost weight fast.\n\n**Vitamin D** — low levels are associated with several types of hair loss. Correct if deficient; don't mega-dose.\n\n**Zinc** — deficiency causes hair loss, but it's uncommon unless diet is restricted or absorption is impaired. **Excess zinc causes copper deficiency**, which causes its own problems. Test rather than assume.\n\n**Biotin** deserves a specific warning. **Biotin deficiency is rare, and supplementing without it does nothing for hair.** Worse: **high-dose biotin interferes with many laboratory immunoassays** — including troponin, the test used to diagnose heart attacks, and thyroid tests. The FDA has issued safety communications about this after documented harm. **Stop biotin for several days before blood tests and tell your doctor you take it.**\n\n**Vitamin A is the one to actively avoid.** Excess vitamin A *causes* hair loss.",
        evidence: [
          "Evidence summary — iron status, ferritin thresholds and hair loss.",
          "U.S. Food and Drug Administration — safety communication on biotin interference with laboratory tests.",
          "Evidence summary — zinc, vitamin D and vitamin A in hair loss and hypervitaminosis A.",
        ],
        checkFirst:
          "Tell any doctor ordering blood tests that you take biotin, and stop it several days beforehand — it can produce falsely normal troponin results, which has led to missed heart attacks. And never take iron without a test showing you need it.",
      },
      {
        id: "handling",
        title: "Stop the mechanical damage — especially traction",
        why: "Traction alopecia is entirely preventable and becomes permanent if it goes on long enough.",
        grade: "B+",
        gradeNote: "Evidence summary — traction alopecia and hair care practices",
        how: "**Traction alopecia** comes from sustained pulling — tight ponytails, braids, weaves, extensions, tight buns, some religious and occupational head coverings. It typically shows at the hairline and temples, and **early on it's reversible; sustained, it scars and becomes permanent.**\n\n**The warning signs to act on:** headache or soreness from a style, small bumps along the hairline, thinning at the temples. **If a style hurts, it is too tight** — that's the whole rule.\n\n**Rotate styles**, keep tension low, and take breaks between protective styles. This matters particularly with textured hair, where traction alopecia is more common and often not raised early enough.\n\n**Heat and chemical processing** — relaxers, bleach, repeated high-heat styling — damage the shaft and cause breakage. That's different from losing hair at the root, but it looks and feels the same.\n\n**Wet hair is fragile.** Don't brush it hard; use a wide-tooth comb and detangle from the ends up.\n\n**What doesn't cause hair loss:** hats, frequent washing, dandruff shampoo, or brushing normally. Not washing because you're afraid of the hairs in the drain simply moves them to a different day.",
        evidence: [
          "Evidence summary — traction alopecia: risk factors, reversibility and prevention.",
          "American Academy of Dermatology — hair care practices and hair loss.",
          "Evidence summary — chemical and thermal hair shaft damage.",
        ],
        checkFirst:
          "Bumps, tenderness or visible thinning at the hairline from a hairstyle is early traction alopecia — change the style now and see a dermatologist. Once follicles scar, no treatment brings them back.",
      },
      {
        id: "shedding",
        title: "If it's shedding, find the trigger 3 months back",
        why: "Telogen effluvium is usually reversible, and the delayed onset is exactly why people misidentify the cause.",
        grade: "A−",
        gradeNote: "AAD guidance · evidence summary",
        how: "**The delay is the diagnostic clue.** Shedding starts **`2–4` months after** the trigger, so look back a season, not a week. What was happening three months ago?\n\n**The usual triggers:** a significant illness (COVID is a common one), surgery or general anaesthesia, **childbirth** — postpartum shedding is normal and typically peaks around `3–4` months — **rapid or crash weight loss**, a severe emotional stressor, stopping or starting hormonal contraception, or a **new medication**.\n\n**On medication:** a long list can cause it — some antidepressants, blood pressure drugs, anticoagulants, retinoids, certain anticonvulsants. **Don't stop anything yourself**; ask whether it could be contributing and whether there's an alternative.\n\n**The reassuring part:** **telogen effluvium is usually self-limiting.** Once the trigger has passed, shedding typically settles within `3–6` months and hair density recovers over `6–12`. You are shedding resting hairs, not losing follicles.\n\n**What to do:** treat the trigger, correct any deficiency, eat adequately — this is not the moment for a restrictive diet — and be patient. **Chronic shedding beyond `6` months needs a dermatologist**, because that pattern sometimes signals underlying pattern hair loss becoming visible.",
        evidence: [
          "American Academy of Dermatology — telogen effluvium: causes and course.",
          "Evidence summary — postpartum and post-illness telogen effluvium and recovery timelines.",
          "Evidence summary — drug-induced hair loss.",
        ],
        checkFirst:
          "Shedding lasting more than 6 months, or shedding with fatigue, weight change, irregular periods or other symptoms, needs a proper workup rather than waiting it out.",
      },
    ],
    skipTheHype: {
      remedy: "Biotin \"hair, skin and nails\" gummies",
      why: "It is one of the best-selling supplement categories in the world and the case against it is unusually clean. **Biotin deficiency is genuinely rare**, and there is no good evidence that supplementing biotin improves hair growth in people who aren't deficient — which is nearly everyone taking it. The doses involved are extraordinary: products commonly contain `5,000–10,000 mcg` against a daily adequate intake of about `30 mcg`, hundreds of times over. And it isn't inert. **The FDA has issued a safety communication because high-dose biotin interferes with many laboratory immunoassays** — including **troponin**, the test used to diagnose a heart attack — and this has contributed to at least one reported death from a missed diagnosis. It also skews thyroid tests, which can lead to being treated for a thyroid problem you don't have. An ineffective supplement that can distort the test used to diagnose a heart attack is a bad trade at any price.",
    },
    bookTitle: "The Hair Loss Handbook — diagnosis first, treatment second",
    bookUrl: null,
    landingSlug: "hair-loss-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "eye-strain-dry-eyes",
    name: "Eye strain & dry eyes",
    nameEmphasis: "& dry eyes",
    icon: "eye",
    category: "everyday",
    blurb: "Mostly a blinking problem — and not the blue light you were sold.",
    matchRules: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 6.4 },
    ],
    intro:
      "Digital eye strain — computer vision syndrome — is tired, aching, dry or blurry eyes with headaches after screen work. It's extremely common and there's good news buried in it: **there is no evidence that screen use causes permanent damage to your eyes.** It's fatigue, and it's reversible.\n\nThe mechanisms are mundane. **Your blink rate drops by roughly half to two-thirds when you concentrate on a screen** — and incomplete blinks mean the tear film isn't spread or renewed, so the surface dries out. Meanwhile the focusing muscles hold a near position for hours, which is precisely how any muscle gets sore.\n\n**Dry eye is often a separate, treatable condition** underneath the strain. The most common form is **meibomian gland dysfunction** — the oil glands in your eyelid margins stop producing properly, so the tear film evaporates too fast. That's why the counterintuitive symptom of dry eye is **watery eyes**: a dry surface triggers reflex tearing.\n\nAnd the biggest correction of all: **blue light is not the villain it was marketed as.** The evidence for blue-blocking lenses reducing eye strain is poor — a Cochrane review found no meaningful benefit. What causes strain is the blinking, the focusing distance and the hours.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 6.4 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "vit-a", label: "Vitamin A", unit: "μg/dL", flagBelow: 30 },
      { markerId: "omega3-idx", label: "Omega-3 index", unit: "%", flagBelow: 8 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    steps: [
      {
        id: "blink-and-breaks",
        title: "Fix the blinking and take real breaks",
        detailTitle: "20-20-20, and full blinks",
        why: "The blink rate collapse is the single biggest driver of screen-related dryness, and it's free to fix.",
        grade: "A−",
        gradeNote: "American Academy of Ophthalmology · evidence summary",
        how: "**Blink rate drops by around half to two-thirds during focused screen work**, and many of the blinks that remain are **incomplete** — the lids don't fully meet, so the oil glands aren't compressed and the tear film isn't spread.\n\n**Practise complete blinks.** A few times an hour: close **fully**, pause for a second, then open. Squeezing gently at the end of the close helps express the oil glands.\n\n**The 20-20-20 rule:** every `20` minutes, look at something `20` feet (`6` metres) away for `20` seconds. It relaxes the focusing muscles and — just as importantly — you blink normally while you do it. Set a timer; nobody remembers on their own.\n\n**Take a proper break every `2` hours** — `15` minutes away from the screen.\n\n**Lower your screen.** The top of the monitor should be **at or slightly below eye level**, so you're looking slightly down, roughly `20–28` inches away. Looking down means your eyelids cover more of the eye surface, which reduces evaporation. Laptops on a desk are usually too low, and phones held low make you look down but at a much closer focus — the worst of both.",
        evidence: [
          "American Academy of Ophthalmology — computer use and digital eye strain guidance.",
          "Evidence summary — blink rate and completeness during visual display terminal work.",
          "Evidence summary — screen height, gaze angle and ocular surface exposure.",
        ],
        checkFirst:
          "Sudden vision changes, flashes of light, a shower of new floaters, a curtain across your vision, eye pain, or double vision need urgent eye care — those are not eye strain and some are sight-threatening.",
      },
      {
        id: "environment",
        title: "Fix the air and the light around you",
        why: "Air movement and humidity change evaporation rates directly, and glare makes your eyes work harder for no reason.",
        grade: "B+",
        gradeNote: "Evidence summary — environmental factors in dry eye",
        how: "**Move the airflow off your face.** Car vents, air conditioning, fans and forced-air heating all accelerate tear evaporation. This is one of the most immediately noticeable changes people make.\n\n**Add humidity** in dry indoor air, especially in winter. `40–50%` is comfortable. Clean the humidifier — a dirty one is a different problem.\n\n**Kill the glare.** Position screens **perpendicular to windows**, not facing or backing them. Use blinds. Matte finishes beat glossy.\n\n**Match your screen brightness to the room.** A screen much brighter than its surroundings — or a bright screen in a dark room — makes your eyes work harder. Increase text size rather than leaning in.\n\n**Contact lenses make everything worse.** They sit in the tear film and destabilise it. If you have dry eye, consider glasses for long screen days, take lenses out earlier, and talk to your optometrist about daily disposables or a different material.\n\n**Wraparound sunglasses outdoors** cut both wind and UV, and help more than people expect.",
        evidence: [
          "Evidence summary — humidity, air flow and tear film evaporation rates.",
          "American Academy of Ophthalmology — workstation ergonomics and glare management.",
          "Evidence summary — contact lens wear and tear film instability.",
        ],
        checkFirst:
          "Eye pain, redness with light sensitivity, or reduced vision with contact lenses means take them out and get seen urgently — a corneal infection or ulcer in a lens wearer is an emergency.",
      },
      {
        id: "eye-exam",
        title: "Get your eyes tested — and mention the screen work",
        why: "An uncorrected or slightly wrong prescription makes your focusing system work continuously, and it's a very common cause of headaches blamed on screens.",
        grade: "A−",
        gradeNote: "Optometric association guidance · AAO",
        supervised: true,
        how: "**Have a proper eye examination** and say explicitly how many hours you're on screens and at what distance. An intermediate prescription is different from a reading prescription, and it's the one that matters for a monitor.\n\n**Small uncorrected refractive errors** — including astigmatism — force constant focusing effort. So does **presbyopia**, the age-related loss of near focus that starts around `40` and creeps up.\n\n**If you wear varifocals**, tell your optometrist about your screen setup. The intermediate zone in standard varifocals is often narrow and badly placed for a monitor, and it makes people tilt their head back for hours — which is where the neck pain comes from. **Dedicated occupational or computer lenses** solve this and are widely under-prescribed.\n\n**Ask about binocular vision** if you get double vision, words swimming, or difficulty keeping focus. **Convergence insufficiency** is common, frequently missed, and treatable with exercises.\n\n**An exam checks for more than glasses** — glaucoma, diabetic changes, macular problems, all painless and symptomless early. That alone justifies the appointment.",
        evidence: [
          "American Academy of Ophthalmology — comprehensive eye examination recommendations.",
          "Evidence summary — uncorrected refractive error and asthenopia.",
          "Evidence summary — convergence insufficiency: prevalence and vision therapy outcomes.",
        ],
        checkFirst:
          "Persistent headaches with vision changes, new double vision, or eye pain need medical assessment rather than a new prescription. And if you have diabetes, annual retinal screening is essential regardless of symptoms.",
      },
      {
        id: "dry-eye-treatment",
        title: "Treat dry eye properly — warmth first, drops second",
        detailTitle: "The eyelid routine most people are never taught",
        why: "Most dry eye is evaporative, caused by blocked oil glands — and warm compresses treat that in a way drops alone can't.",
        grade: "A−",
        gradeNote: "TFOS DEWS II report · AAO guidance",
        how: "**Warm compresses are the foundation of evaporative dry eye treatment.** The meibomian glands in your lid margins secrete the oil layer that stops tears evaporating; when it thickens and blocks, the tear film fails.\n\n**How to do it properly:** a **microwavable eye mask** — sustained heat for `5–10` minutes, which a flannel can't provide because it cools within a minute. Then **massage the lids** gently toward the lash line to express the softened oil. **Then clean the lid margins** with a dedicated lid wipe or diluted baby shampoo on a cotton pad.\n\n**Daily for `4–6` weeks** before judging it. This is a routine, not a one-off.\n\n**Artificial tears** for symptom relief. **Preservative-free if you use them more than `4` times a day** — preservatives irritate the surface with frequent use, which is a self-perpetuating trap. Thicker gels or ointments at night for overnight dryness.\n\n**Omega-3** has mixed evidence — a large randomised trial (DREAM) found no benefit over placebo, while other trials and meta-analyses are more positive. Reasonable to try; don't expect much.\n\n**Avoid \"redness-relief\" drops.** They constrict blood vessels and cause **rebound redness** with regular use — the same trap as decongestant nasal sprays.",
        evidence: [
          "TFOS DEWS II — report on dry eye disease management and therapy.",
          "American Academy of Ophthalmology — dry eye syndrome preferred practice pattern.",
          "DREAM randomised trial — omega-3 supplementation for dry eye disease.",
        ],
        checkFirst:
          "Persistent dry eye with a dry mouth or joint pain can indicate Sjögren's syndrome and needs medical assessment. Severe dry eye that doesn't respond to these measures needs an ophthalmologist — untreated, it can damage the cornea.",
      },
      {
        id: "screen-habits",
        title: "Change the habits around the screen, not the screen's colour",
        why: "Total exposure, break patterns and night-time use matter far more than any display filter.",
        grade: "B+",
        gradeNote: "Evidence summary — display settings and visual fatigue",
        how: "**Text size and contrast.** Increase text size until you can read comfortably at a proper distance. Dark text on a light background is generally easier for extended reading; dark mode helps some people in dim rooms and isn't a universal answer.\n\n**Get your phone further away.** Reading distance on phones is typically much closer than on paper, which demands more focusing effort. Hold it further out and increase the text size.\n\n**The evening question, answered accurately.** The reason to reduce screens before bed is **sleep, not eye strain** — light in the evening suppresses melatonin and delays your body clock. That's real, and it's a circadian issue, not an ocular one. Night mode helps somewhat; **dimming the screen and reducing total light exposure helps more.**\n\n**Children need outdoor time.** This is the one area with strong evidence: **time spent outdoors reduces the risk of developing myopia in children**, and near-work is a risk factor. Roughly `2` hours a day outside is the figure that appears in the trials. It's about outdoor light, not about avoiding screens specifically.\n\n**And the honest reassurance:** screen use does not damage adult eyes. Uncomfortable is not the same as harmful.",
        evidence: [
          "Evidence summary — display luminance, contrast and visual fatigue during prolonged screen work.",
          "Evidence summary — randomised trials of outdoor time and myopia incidence in children.",
          "Evidence summary — evening light exposure, melatonin suppression and circadian phase.",
        ],
        checkFirst:
          "A child squinting, sitting very close to screens, tilting their head, or complaining of headaches needs an eye test — not screen restriction. Childhood vision problems need catching early.",
      },
    ],
    skipTheHype: {
      remedy: "Blue light blocking glasses",
      why: "They've been one of the most successful eyewear upsells of the past decade, sold on the promise of reducing digital eye strain and protecting the retina. **A Cochrane review of randomised trials found no meaningful benefit for visual fatigue** compared with standard lenses, and no evidence that blue-blocking lenses protect the retina from screen exposure. That second claim was always physically implausible: the blue light from a screen is a small fraction of what you receive from ordinary daylight. There *is* real evidence that evening light affects sleep — but that's about **total light exposure and timing**, and dimming the screen or turning it off does far more than a filter that removes a narrow slice of the spectrum. What actually reduces eye strain is on this page and costs nothing: blink completely, look away every twenty minutes, and move the screen to the right height.",
    },
    bookTitle: "The Screen Eyes Guide — strain, dryness and what the evidence really says",
    bookUrl: null,
    landingSlug: "eye-strain-dry-eyes",
  },
];
