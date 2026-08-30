// ─────────────────────────────────────────────────────────────────────────────
// Library — Metabolic & heart.
//
// Every entry here is medication-adjacent. The banner-and-supervision pattern
// is deliberate and non-negotiable: these protocols support prescribed care,
// and no step anywhere in this file suggests changing or stopping a medication.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const METABOLIC_HEART_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "blood-pressure-support",
    name: "High blood pressure support",
    nameEmphasis: "support",
    icon: "gauge",
    category: "metabolic-heart",
    blurb: "The one number where measuring it properly is half the work.",
    matchRules: [
      { aliases: ["systolic", "blood pressure systolic", "bp systolic"], label: "systolic BP", unit: "mmHg", flagAbove: 130 },
      { aliases: ["diastolic", "blood pressure diastolic", "bp diastolic"], label: "diastolic BP", unit: "mmHg", flagAbove: 80 },
    ],
    pillarRule: { key: "heart", label: "Heart", below: 75 },
    intro:
      "Blood pressure is the highest-value number in preventive medicine, and the one most often measured badly. A reading taken in a rush, arm unsupported, after a coffee, is not your blood pressure.\n\nThe lifestyle levers here are genuinely powerful — the trials behind sodium reduction, the DASH pattern and regular movement produce drops comparable to a starting dose of medication.\n\nWhat they don't do is replace medication when it's indicated. **Untreated high blood pressure damages arteries, kidneys, eyes and brain silently for years.** This page supports your doctor's plan.",
    matchedIntro: "Your recorded blood pressure is above the usual threshold — take that to your doctor.",
    signals: [
      { aliases: ["systolic", "blood pressure systolic"], label: "Systolic", unit: "mmHg", flagAbove: 130 },
      { aliases: ["diastolic", "blood pressure diastolic"], label: "Diastolic", unit: "mmHg", flagAbove: 80 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "creatinine", label: "Creatinine", unit: "mg/dL" },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "uric-acid", label: "Uric acid", unit: "mg/dL", flagAbove: 7 },
    ],
    doctorBanner: {
      title: "This supports treatment — it never replaces it",
      body: "High blood pressure is managed with a care team. Nothing on this page is a reason to change, reduce or stop a prescribed medication, and several steps here can lower your readings enough that your prescriber will want to know.",
    },
    steps: [
      {
        id: "measure-properly",
        title: "Measure it properly at home for a week",
        detailTitle: "How to take a real reading",
        why: "Clinic readings are a poor snapshot, and home readings taken correctly predict outcomes better than office ones.",
        grade: "A",
        gradeNote: "AHA scientific statement on home monitoring",
        how: "Validated **upper-arm cuff**, correct size. Sit `5 minutes` first. Back supported, feet flat, arm at heart height, no talking. No caffeine, exercise or smoking for `30 minutes` before.\n\nTake `2 readings` a minute apart, **morning and evening, for 7 days**. Discard day one. Bring the average.",
        extra: {
          label: "Wrist cuffs and why they mislead",
          body: "Wrist devices are highly position-sensitive — a few centimetres of height changes the number substantially. Home-monitoring guidance favours a **validated upper-arm cuff**. If you already own a wrist one, don't make decisions on it.",
        },
        evidence: [
          "American Heart Association — scientific statement on self-measured blood pressure monitoring.",
          "AHA / ACC — guideline for the prevention, detection, evaluation and management of high blood pressure in adults.",
        ],
        checkFirst:
          "A reading at or above `180/120` with chest pain, breathlessness, weakness, vision change, difficulty speaking or severe headache is an emergency. Call emergency services — don't re-measure and wait.",
      },
      {
        id: "sodium-potassium",
        title: "Cut sodium and raise potassium together",
        why: "Sodium reduction is the single most-studied dietary lever on blood pressure, and it works better when potassium goes up alongside it.",
        grade: "A",
        gradeNote: "AHA · Dietary Guidelines",
        how: "Target under `2,300 mg` of sodium a day, `1,500 mg` if your pressure is already up.\n\nMost of it isn't the shaker — it's **bread, deli meat, sauces, soup and restaurant food**. Raise potassium with vegetables, beans, potatoes and fruit rather than a supplement.",
        evidence: [
          "American Heart Association — sodium reduction recommendations and scientific statements.",
          "Dietary Guidelines for Americans — sodium and potassium intake.",
        ],
        checkFirst:
          "**Salt substitutes are usually potassium chloride, and they are not safe for everyone.** Avoid them — and potassium supplements — if you have kidney disease or take an ACE inhibitor, ARB, or potassium-sparing diuretic, unless your doctor says otherwise.",
      },
      {
        id: "dash",
        title: "Eat the DASH pattern — it was designed for exactly this",
        why: "DASH is one of the few diets tested in a controlled feeding trial specifically for blood pressure, and it lowered it meaningfully.",
        grade: "A",
        gradeNote: "NHLBI DASH trials · AHA guidance",
        how: "Vegetables, fruit, wholegrains, beans, nuts, low-fat dairy, lean protein. Less red and processed meat, less added sugar.\n\nCombined with sodium reduction, the DASH trials produced drops **comparable to a starting dose of a blood pressure medication** — which is why it's worth doing properly rather than approximately.",
        evidence: [
          "NIH / NHLBI — DASH eating plan and the DASH and DASH-Sodium controlled feeding trials.",
          "American Heart Association — dietary guidance to improve cardiovascular health.",
        ],
        checkFirst:
          "If you have chronic kidney disease, DASH's potassium and phosphorus load may need modifying. Get the version that fits your kidney function from your care team.",
      },
      {
        id: "move-bp",
        title: "Move most days, and add isometrics",
        why: "Aerobic exercise lowers blood pressure reliably, and isometric work has emerged with a surprisingly strong effect for the time it costs.",
        grade: "A",
        gradeNote: "AHA · HHS Physical Activity Guidelines",
        how: "`150 minutes a week` of moderate aerobic activity, plus `2` resistance sessions.\n\nWorth adding: **isometric holds** — wall sits or handgrip, roughly `4 × 2 minutes` with rests, `3 days a week`. Recent meta-analyses put this among the more effective exercise modes for blood pressure specifically.",
        evidence: [
          "American Heart Association — recommendations on physical activity and blood pressure.",
          "Evidence summary — network meta-analyses of exercise modes for resting blood pressure, including isometric training.",
        ],
        checkFirst:
          "Isometric holds raise blood pressure sharply during the effort. Clear them first if you have uncontrolled hypertension, known heart disease, an aneurysm or retinopathy — and never hold your breath through them.",
      },
      {
        id: "alcohol-weight-bp",
        title: "Address alcohol, weight and sleep apnoea",
        why: "These three are the most common reversible causes of blood pressure that won't come down despite everything else.",
        grade: "A−",
        gradeNote: "AHA / ACC guideline",
        how: "Alcohol raises blood pressure dose-dependently — cutting back lowers it within weeks.\n\nWeight loss of about `1 mmHg per kg` is the usual rule of thumb. And **untreated sleep apnoea is a leading cause of resistant hypertension** — snoring plus daytime sleepiness deserves a sleep study.",
        evidence: [
          "AHA / ACC — high blood pressure guideline (alcohol, weight and secondary causes).",
          "American Academy of Sleep Medicine — obstructive sleep apnoea and cardiovascular risk.",
        ],
        checkFirst:
          "If you drink daily and heavily, don't stop abruptly — withdrawal itself spikes blood pressure and can be dangerous. Plan the taper with a doctor.",
      },
      {
        id: "bp-medication",
        title: "Take the readings back to your prescriber",
        why: "Lifestyle changes can lower pressure enough to need a dose review, and that review is a medical decision, not a personal one.",
        grade: "A",
        gradeNote: "AHA / ACC guideline",
        supervised: true,
        how: "Bring your `7-day` average, not one reading. Ask what your personal target is — it differs with age, kidney function and other conditions.\n\n**If your numbers improve, that is your doctor's cue to review your medication — not yours.** Stopping a blood pressure medicine on your own can cause a dangerous rebound.",
        evidence: [
          "AHA / ACC — guideline on the management of high blood pressure in adults.",
          "CDC — high blood pressure management and self-measured monitoring.",
        ],
        checkFirst:
          "Some over-the-counter products raise blood pressure — NSAIDs, decongestants like pseudoephedrine, and some herbal stimulants. Mention everything you take, including supplements.",
      },
    ],
    skipTheHype: {
      remedy: "Beetroot shots as a blood pressure treatment",
      why: "Dietary nitrate does produce a small, real, short-lived drop — and that's the whole finding. The effect is a fraction of what sodium reduction, weight loss or medication achieve, it fades with regular use, and no hypertension guideline recommends it. Enjoy beetroot as food; don't build a plan on it.",
    },
    bookTitle: "The Blood Pressure Book — sodium, potassium and the numbers that count",
    bookUrl: null,
    landingSlug: "blood-pressure-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "high-cholesterol-support",
    name: "High cholesterol support",
    nameEmphasis: "support",
    icon: "droplet",
    category: "metabolic-heart",
    blurb: "Particle count beats total cholesterol, and diet moves it less than people expect.",
    matchRules: [
      { markerId: "ldl-c", label: "LDL", unit: "mg/dL", flagAbove: 130 },
      { markerId: "apob", label: "ApoB", unit: "mg/dL", flagAbove: 90 },
      { markerId: "non-hdl", label: "non-HDL", unit: "mg/dL", flagAbove: 130 },
      { markerId: "lpa", label: "Lp(a)", unit: "nmol/L", flagAbove: 125 },
    ],
    intro:
      "The thing that drives atherosclerosis is the **number of atherogenic particles** in circulation, not the total cholesterol on your report. ApoB counts those particles directly; non-HDL cholesterol is a decent free stand-in.\n\nThe honest part people find frustrating: for many, diet moves LDL by a modest amount. Genetics set a lot of the baseline, and one specific inherited condition — familial hypercholesterolaemia — is common enough to matter and routinely missed.\n\nSo the plan is: get the right numbers, do the things with real effect sizes, and let your doctor decide whether medication belongs in the picture.",
    matchedIntro: "Your lipid numbers are above the usual thresholds, which is why this is near the top.",
    signals: [
      { markerId: "ldl-c", label: "LDL-C", unit: "mg/dL", flagAbove: 130 },
      { markerId: "apob", label: "ApoB", unit: "mg/dL", flagAbove: 90 },
      { markerId: "non-hdl", label: "Non-HDL", unit: "mg/dL", flagAbove: 130 },
      { markerId: "lpa", label: "Lp(a)", unit: "nmol/L", flagAbove: 125 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 40 },
      { markerId: "total-chol", label: "Total cholesterol", unit: "mg/dL", flagAbove: 200 },
    ],
    doctorBanner: {
      title: "This supports treatment — it never replaces it",
      body: "Whether you need lipid-lowering medication is a risk calculation your doctor makes, not a number you can read off alone. Nothing here is a reason to delay that conversation, or to reduce or stop a statin.",
    },
    steps: [
      {
        id: "right-numbers",
        title: "Get ApoB, and get Lp(a) once",
        why: "LDL-C under-reads risk in a meaningful minority of people, and Lp(a) is a once-in-a-lifetime test almost nobody is offered.",
        grade: "A",
        gradeNote: "AHA / ACC · NLA guidance",
        supervised: true,
        how: "Ask for **ApoB** — or non-HDL cholesterol, which is free on any standard panel and better than LDL alone.\n\nAsk for **Lp(a) once**. It's largely genetic, it doesn't need repeating, and a high result changes how aggressively everything else gets managed.",
        evidence: [
          "AHA / ACC — guideline on the management of blood cholesterol.",
          "National Lipid Association — scientific statements on ApoB and Lp(a) measurement.",
        ],
        checkFirst:
          "LDL above `190 mg/dL`, or a family history of heart attacks before 55 in men or 65 in women, raises the question of familial hypercholesterolaemia. That's a specific diagnosis with specific management — say it out loud in the appointment.",
      },
      {
        id: "soluble-fibre-chol",
        title: "Soluble fibre, every day, at a dose that matters",
        why: "It binds bile acids so the liver pulls cholesterol out of circulation to replace them — one of the few dietary levers with a direct mechanism on LDL.",
        grade: "A−",
        gradeNote: "AHA guidance · FDA health claim",
        supplement: true,
        labNote:
          "Psyllium is the concentrated option, and the additives are what varies — sweeteners, colours and sugar alcohols. Check the Lab Report for a plain formulation.",
        how: "`5–10 g` of soluble fibre a day moves LDL measurably. Oats and oat bran, barley, beans, lentils, apples, citrus.\n\nIf food alone doesn't get you there, psyllium: start at `1 teaspoon` with a full glass of water and build.",
        evidence: [
          "American Heart Association — dietary guidance to improve cardiovascular health.",
          "FDA — authorised health claim for soluble fibre from oats and psyllium and coronary heart disease risk.",
        ],
        checkFirst:
          "Psyllium without enough water can cause an obstruction, and it delays absorption of some medicines — take others at least `2 hours` apart.",
      },
      {
        id: "fat-swap",
        title: "Swap saturated fat for unsaturated — don't just remove it",
        why: "What replaces the saturated fat determines whether the swap helps; replacing it with refined carbohydrate does nothing.",
        grade: "A",
        gradeNote: "AHA presidential advisory",
        how: "Replace butter, fatty and processed meat and coconut oil with **olive oil, nuts, seeds, oily fish and avocado**.\n\nThe AHA advisory is specifically about substitution: swapping saturated for polyunsaturated fat lowers cardiovascular events. Swapping it for white bread doesn't.",
        extra: {
          label: "Where dietary cholesterol fits",
          body: "Eggs and shellfish are not the lever they were treated as for decades. **Saturated fat raises blood cholesterol far more than dietary cholesterol does**, which is why the specific cholesterol limit was dropped from the Dietary Guidelines. Spend your effort on the fat swap.",
        },
        evidence: [
          "American Heart Association — presidential advisory on dietary fats and cardiovascular disease.",
          "Dietary Guidelines for Americans — dietary fats guidance.",
        ],
        checkFirst:
          "If your triglycerides are very high rather than your LDL, the priorities change — alcohol, sugar and weight matter more than the fat swap. Ask which of your numbers is actually driving your risk.",
      },
      {
        id: "plant-sterols",
        title: "Plant sterols and stanols, if you want a measurable add-on",
        why: "They block cholesterol absorption in the gut and produce a small, consistent LDL reduction with an authorised health claim behind them.",
        grade: "B+",
        gradeNote: "FDA health claim · NLA guidance",
        supplement: true,
        labNote:
          "Sold in fortified spreads, drinks and capsules, and the delivered dose varies a lot between formats. Check the sterol content per serving on the Lab Report — under `2 g a day` and you're unlikely to see anything.",
        how: "`2 g a day` of plant sterols or stanols, **with meals** — they work by competing with cholesterol at absorption, so timing matters.\n\nExpect a modest LDL reduction, not a transformation. This is an add-on to the fibre and fat steps, not a substitute.",
        evidence: [
          "FDA — authorised health claim for plant sterol and stanol esters and coronary heart disease risk.",
          "National Lipid Association — position on plant sterols and stanols.",
        ],
        checkFirst:
          "Not recommended in pregnancy, breastfeeding, or for children, and avoid entirely in the rare condition sitosterolaemia. If you're on ezetimibe, ask your doctor whether adding these makes sense.",
      },
      {
        id: "move-weight-chol",
        title: "Move and lose visceral weight — for HDL and triglycerides",
        why: "Exercise and weight loss move triglycerides and HDL far more than they move LDL, and knowing that prevents disappointment.",
        grade: "A−",
        gradeNote: "AHA · HHS Physical Activity Guidelines",
        how: "`150 minutes a week` of moderate aerobic activity plus `2` resistance sessions.\n\nSet expectations correctly: this reliably drops **triglycerides** and raises **HDL**. It moves LDL and ApoB much less — that's what the fibre, fat swap and, if needed, medication are for.",
        evidence: [
          "American Heart Association — physical activity recommendations for cardiovascular health.",
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition.",
        ],
        checkFirst:
          "Chest pressure, unusual breathlessness or light-headedness on exertion needs assessment before you increase intensity. If you have known heart disease, ask about cardiac rehab instead of going it alone.",
      },
      {
        id: "statin-conversation",
        title: "Have the medication conversation on the real risk numbers",
        why: "The decision isn't made on cholesterol alone — it's a whole-risk calculation, and the highest-benefit group is often the most reluctant.",
        grade: "A",
        gradeNote: "AHA / ACC guideline",
        supervised: true,
        how: "Ask for your **10-year risk estimate**, and whether a coronary artery calcium score would refine it if you're on the fence.\n\nIf muscle aches have stopped you before, say so — dose changes, alternative statins and non-statin options all exist. **Don't just quietly stop taking it.**",
        evidence: [
          "AHA / ACC — guideline on the management of blood cholesterol (risk assessment and treatment decisions).",
          "American College of Cardiology — coronary artery calcium scoring in risk refinement.",
        ],
        checkFirst:
          "Nothing on this page is a reason to reduce or stop a prescribed lipid-lowering medication. If you want to change something, that decision belongs with whoever prescribed it.",
      },
    ],
    skipTheHype: {
      remedy: "Red yeast rice",
      why: "It lowers cholesterol because it contains monacolin K, which is chemically identical to lovastatin. So it's an unregulated statin at a dose that varies wildly between batches, carrying the same muscle and liver risks with none of the monitoring — and some products have tested positive for citrinin, a kidney toxin. If a statin is right for you, get a real one.",
    },
    bookTitle: "The Cholesterol Guide — ApoB, LDL and what actually lowers risk",
    bookUrl: null,
    landingSlug: "high-cholesterol-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "fatty-liver-support",
    name: "Fatty liver support",
    nameEmphasis: "support",
    icon: "layers",
    category: "metabolic-heart",
    blurb: "Very common, largely reversible, and mostly silent until it isn't.",
    matchRules: [
      { markerId: "alt", label: "ALT", unit: "U/L", flagAbove: 30 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
    ],
    pillarRule: { key: "metabolic", label: "Metabolic", below: 75 },
    intro:
      "Metabolic fatty liver disease — now usually called MASLD — is fat accumulating in liver cells, and it affects roughly a quarter of adults worldwide. Most people have no symptoms at all.\n\nIt matters because in a subset it progresses to inflammation and scarring. It also matters because the leading cause of death in people with fatty liver is **cardiovascular**, not liver-related — so this is a heart problem as much as a liver one.\n\nThe good news is unusually good: **weight loss reverses it**, and the dose-response is well characterised. This is one of the most modifiable conditions in the section.",
    matchedIntro: "Your liver enzymes and metabolic markers are consistent with this pattern — take them to your doctor.",
    signals: [
      { markerId: "alt", label: "ALT", unit: "U/L", flagAbove: 30 },
      { markerId: "ast", label: "AST", unit: "U/L", flagAbove: 30 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 40 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "insulin", label: "Fasting insulin", unit: "μIU/mL", flagAbove: 8 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagAbove: 300 },
    ],
    doctorBanner: {
      title: "Raised liver enzymes need a doctor's interpretation",
      body: "Fatty liver is common, but it is not the only cause of abnormal liver tests — viral hepatitis, autoimmune disease, iron overload and medication effects all need excluding. This page supports that assessment; it doesn't substitute for it.",
    },
    steps: [
      {
        id: "get-staged",
        title: "Find out whether there's scarring — that's the number that matters",
        why: "Fat in the liver is common and mostly benign; fibrosis is what predicts outcomes, and it's assessed with simple non-invasive tools.",
        grade: "A",
        gradeNote: "AASLD guidance",
        supervised: true,
        how: "Ask about a **FIB-4 score** — it's calculated from age, ALT, AST and platelets, so it costs nothing extra.\n\nIf that's raised, the usual next steps are transient elastography (FibroScan) or an ELF blood test. Staging changes everything about how closely you're followed.",
        evidence: [
          "American Association for the Study of Liver Diseases — clinical practice guidance on metabolic dysfunction-associated steatotic liver disease.",
          "NIH / NIDDK — nonalcoholic fatty liver disease information.",
        ],
        checkFirst:
          "Jaundice, swelling of the abdomen or legs, vomiting blood, black stools or confusion are signs of advanced liver disease and need urgent care — not a lifestyle plan.",
      },
      {
        id: "weight-liver",
        title: "Lose 7–10% of body weight — the effect is dose-dependent",
        why: "This is the best-evidenced treatment for fatty liver there is, and the thresholds for each level of improvement are well defined.",
        grade: "A",
        gradeNote: "AASLD guidance — strong recommendation",
        how: "The published thresholds: about `3–5%` reduces liver fat, `7%` improves inflammation, and `10%` can improve fibrosis.\n\nAim for `0.5–1 kg` a week. Pair it with resistance training so the loss comes from fat rather than muscle.",
        evidence: [
          "American Association for the Study of Liver Diseases — MASLD guidance (weight loss thresholds).",
          "NIH / NIDDK — treatment of nonalcoholic fatty liver disease.",
        ],
        checkFirst:
          "Very rapid weight loss — including after bariatric surgery or on a crash diet — can transiently worsen liver inflammation. Steady is genuinely better here, and it should be supervised if you're losing fast.",
      },
      {
        id: "fructose",
        title: "Cut liquid fructose first",
        why: "The liver metabolises fructose directly into fat, and sugar-sweetened drinks are the most concentrated source most people have.",
        grade: "A−",
        gradeNote: "AASLD · AHA guidance",
        how: "Soda, sweet tea, energy drinks, **fruit juice included**. Whole fruit is fine — the fibre and the volume change everything.\n\nThis is usually the single highest-yield dietary change, and it's the one that shows up fastest in triglycerides.",
        evidence: [
          "American Association for the Study of Liver Diseases — dietary guidance in MASLD.",
          "American Heart Association — science advisory on added sugars.",
        ],
        checkFirst:
          "If you're using sugary drinks to manage low blood sugar on diabetes medication, don't just remove them — that's a conversation with your care team about the medication side.",
      },
      {
        id: "alcohol-liver",
        title: "Be honest about alcohol — the two causes stack",
        why: "Metabolic fatty liver and alcohol-related liver injury add together, and the combination progresses faster than either alone.",
        grade: "A",
        gradeNote: "AASLD guidance",
        how: "If you have any degree of fibrosis, the guidance is **no alcohol**. With simple fat and no scarring, it's still the most useful thing to minimise.\n\nBe accurate with your doctor about the amount. The staging and the follow-up interval depend on it.",
        evidence: [
          "American Association for the Study of Liver Diseases — guidance on alcohol use in steatotic liver disease.",
          "National Institute on Alcohol Abuse and Alcoholism — alcohol and the liver.",
        ],
        checkFirst:
          "Stopping heavy daily drinking abruptly is a medical event — withdrawal can be dangerous. Plan that with a doctor rather than going cold turkey alone.",
      },
      {
        id: "move-liver",
        title: "Exercise — it lowers liver fat even without weight loss",
        why: "Trials show reduced liver fat from exercise alone, which makes this worth doing from day one rather than after the scales move.",
        grade: "A−",
        gradeNote: "AASLD · evidence summary",
        how: "`150 minutes a week` of moderate aerobic activity, plus `2–3` resistance sessions.\n\nBoth aerobic and resistance training reduce liver fat in trials, and **resistance work does it at a lower energy cost** — useful if aerobic volume is hard for you.",
        evidence: [
          "American Association for the Study of Liver Diseases — MASLD guidance (physical activity).",
          "Evidence summary — randomised trials of aerobic and resistance exercise on hepatic fat content.",
        ],
        checkFirst:
          "If you have advanced liver disease with varices, high-intensity straining needs clearing with your hepatologist first.",
      },
      {
        id: "meds-liver",
        title: "Ask what else is on the table — including medication",
        why: "This field moved fast, and there are now approved and off-label options for the people with inflammation and fibrosis.",
        grade: "B+",
        gradeNote: "AASLD guidance",
        supervised: true,
        how: "Worth asking about if you're staged with inflammation or fibrosis: the newer approved therapy for MASH, and the roles of **GLP-1 receptor agonists**, pioglitazone and vitamin E in selected patients.\n\nAlso ask whether any of your current medicines contribute — several do.",
        evidence: [
          "American Association for the Study of Liver Diseases — MASLD/MASH pharmacotherapy guidance.",
          "NIH / NIDDK — nonalcoholic steatohepatitis treatment overview.",
        ],
        checkFirst:
          "Vitamin E at the doses studied here is a prescription-level decision, not a supplement aisle one — it isn't appropriate for everyone and carries its own risks. Do not self-prescribe it.",
      },
    ],
    skipTheHype: {
      remedy: "Milk thistle (silymarin) as a liver treatment",
      why: "It's the default \"liver support\" supplement and the evidence doesn't support it. NCCIH's summary is that studies in liver disease have been largely negative or inconclusive, and no liver society recommends it for fatty liver. The weight, sugar and alcohol steps above are what actually change liver fat.",
    },
    bookTitle: "The Liver Reset — reversing fatty liver with evidence",
    bookUrl: null,
    landingSlug: "fatty-liver-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "weight-management",
    name: "Weight management",
    nameEmphasis: "management",
    icon: "scale",
    category: "metabolic-heart",
    blurb: "Protein, muscle, sleep and honesty about what maintenance costs.",
    matchRules: [
      { markerId: "insulin", label: "fasting insulin", unit: "μIU/mL", flagAbove: 10 },
    ],
    intro:
      "Weight is regulated by biology that actively defends against loss. Appetite hormones shift, resting metabolism falls somewhat, and the drive to eat goes up — which is why the hard part isn't losing, it's the two years afterwards.\n\nThat's not a reason for pessimism. It's a reason to build a plan around the things that survive contact with real life: **enough protein, enough resistance training, enough sleep, and a pace you can hold.**\n\nAnd worth saying plainly: health improvements from movement, sleep and food quality happen whether or not the scale moves. Weight is one input, not the scoreboard.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 40 },
      { markerId: "insulin", label: "Fasting insulin", unit: "μIU/mL", flagAbove: 8 },
      { markerId: "alt", label: "ALT", unit: "U/L", flagAbove: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
    ],
    steps: [
      {
        id: "protein-target",
        title: "Set a protein floor before you set a calorie ceiling",
        why: "Protein protects muscle during a deficit and does more for fullness per calorie than anything else on the plate.",
        grade: "A−",
        gradeNote: "Evidence summary — controlled trials · Dietary Guidelines",
        how: "A common working target in the trial literature is `1.2–1.6 g per kg` of body weight a day, spread across meals rather than loaded at dinner.\n\n**Set this first.** A deficit built without a protein floor takes muscle with the fat, and muscle is the thing you need to keep the weight off.",
        evidence: [
          "Evidence summary — controlled trials of higher-protein diets on satiety and lean mass retention during energy restriction.",
          "Dietary Guidelines for Americans — protein intake and distribution.",
        ],
        checkFirst:
          "If you have reduced kidney function, your protein target is set by your care team, not by a general guideline. Ask for your number before raising it.",
      },
      {
        id: "resistance-weight",
        title: "Lift — the deficit decides how much muscle you keep",
        why: "Resistance training is what tells the body to preserve muscle while it's losing, and preserved muscle is most of why maintenance works.",
        grade: "A",
        gradeNote: "HHS Physical Activity Guidelines · evidence summary",
        how: "`2–3 sessions a week`, covering the major muscle groups, progressing the load over time.\n\nThe scale will move slower than a cardio-only approach for the first months. That's the trade you want — **weight lost as muscle is weight regained as fat.**",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition.",
          "Evidence summary — trials of resistance training during energy restriction and lean mass preservation.",
        ],
        checkFirst:
          "If you have significant joint problems, heart disease, or you've been sedentary for years, get the programme set by a professional. Starting is almost always safe; starting badly is what causes injuries.",
      },
      {
        id: "sleep-weight",
        title: "Protect sleep — short nights change what you eat",
        why: "Sleep restriction reliably increases hunger, appetite for energy-dense food, and the share of weight lost that comes from muscle.",
        grade: "A−",
        gradeNote: "Evidence summary — controlled sleep trials",
        how: "`7 hours or more`, consistently. This isn't a soft recommendation — in controlled studies, the same calorie deficit produced **worse body composition** on short sleep.\n\nRun the sleep protocol in this section alongside, not afterwards.",
        evidence: [
          "Evidence summary — randomised controlled trials of sleep restriction on appetite regulation and body composition during energy restriction.",
          "CDC — sleep and obesity.",
        ],
        checkFirst:
          "Loud snoring or daytime sleepiness with excess weight is a strong signal for sleep apnoea. Treating it often makes everything else easier — and untreated, it works against you.",
      },
      {
        id: "pace",
        title: "Pick a pace you could hold for a year",
        why: "The rate of loss predicts almost nothing about long-term outcome; whether you can sustain the method predicts most of it.",
        grade: "B+",
        gradeNote: "Evidence summary — behavioural weight management research",
        how: "`0.5–1%` of body weight a week is a reasonable pace for most people.\n\nHead-to-head trials of low-carb, low-fat, Mediterranean and others come out **broadly similar** at a year. Adherence is the variable that separates them, so choose on what you can live with, not on the mechanism.",
        evidence: [
          "Evidence summary — randomised trials comparing dietary patterns for weight loss at 12 months.",
          "U.S. Preventive Services Task Force — behavioural weight loss interventions in adults.",
        ],
        checkFirst:
          "If food, weight or exercise has become a source of distress, or you're restricting hard and hiding it, stop and get help. Disordered eating is more common in weight-loss attempts than most people expect, and it needs a different kind of support.",
      },
      {
        id: "maintenance",
        title: "Plan maintenance before you need it",
        why: "Regain is the norm, not the exception, and the people who keep it off do specific, describable things.",
        grade: "B+",
        gradeNote: "Evidence summary — weight-loss registry research",
        how: "The patterns that show up repeatedly in long-term maintainers: **regular self-monitoring, high physical activity, consistent eating patterns, and catching a small regain early** rather than waiting.\n\nDecide now what your \"reset trigger\" is — a specific number that prompts action, not a feeling.",
        evidence: [
          "Evidence summary — long-term weight-loss maintenance registry research.",
          "U.S. Preventive Services Task Force — behavioural interventions for weight maintenance.",
        ],
        checkFirst:
          "Regain is not a moral failure and it isn't evidence you lack discipline — it's the biology doing what it does. Treat it as information about the plan, not about you.",
      },
      {
        id: "medical-weight",
        title: "Ask what medical options apply to you",
        why: "The treatment landscape changed substantially, and eligibility is broader than most people assume.",
        grade: "A",
        gradeNote: "Professional society obesity guidance",
        supervised: true,
        how: "Worth a conversation if you have a BMI of `30+`, or `27+` with a weight-related condition.\n\nAlso worth checking: **thyroid function, and whether any of your medications drive weight gain** — some antidepressants, antipsychotics, steroids and beta-blockers do.",
        evidence: [
          "Professional society clinical practice guidance on the medical management of obesity.",
          "NIH / NIDDK — prescription medications to treat overweight and obesity.",
        ],
        checkFirst:
          "Never stop a prescribed medication because you suspect it's causing weight gain. Raise it — the alternative is your prescriber's call, and stopping some of them abruptly is dangerous.",
      },
    ],
    skipTheHype: {
      remedy: "Apple cider vinegar, raspberry ketones and \"metabolism boosters\"",
      why: "This whole shelf shares one problem: effects that are tiny where they exist at all, measured over weeks, in small studies. The FDA has repeatedly found weight-loss supplements spiked with undeclared prescription drugs including sibutramine, which was withdrawn for cardiovascular risk. Nothing in this category comes close to protein, resistance training and sleep.",
    },
    bookTitle: "The Weight Handbook — metabolism, appetite and the honest levers",
    bookUrl: null,
    landingSlug: "weight-management",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "glp1-companion-support",
    name: "GLP-1 companion support",
    nameEmphasis: "companion support",
    icon: "pill",
    category: "metabolic-heart",
    blurb: "Protecting muscle, protein and nutrition while the appetite signal is off.",
    matchRules: [],
    intro:
      "GLP-1 medications work by reducing appetite and slowing gastric emptying. That's the benefit — and it's also the thing this page exists for.\n\nWhen you're eating substantially less, three risks rise at once: **losing muscle along with fat, falling short on protein and micronutrients, and dehydration.** A meaningful share of the weight lost on these medications is lean mass unless you actively defend it.\n\nEverything below supports your prescriber's plan. Nothing here is a reason to change a dose, skip one, or stop — that is entirely their decision.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "alt", label: "ALT", unit: "U/L", flagAbove: 30 },
    ],
    doctorBanner: {
      title: "This supports your prescriber's plan — nothing more",
      body: "Dose, timing, escalation and whether to continue are decisions for the clinician who prescribed it. Never adjust, skip or stop a dose based on anything on this page, and take any new or severe symptom to them rather than to a protocol.",
    },
    steps: [
      {
        id: "protein-glp1",
        title: "Hit a protein target every single day",
        why: "Appetite suppression makes it very easy to under-eat protein, and protein is what keeps the loss coming from fat rather than muscle.",
        grade: "A−",
        gradeNote: "Obesity society guidance — evidence summary",
        how: "Aim for `1.2–1.6 g per kg` of body weight a day, spread across meals.\n\nWhen appetite is low, **eat the protein first** at every meal. Liquid protein — shakes, Greek yoghurt, milk — is often much easier to get down than a plate of chicken.",
        evidence: [
          "Professional society guidance on nutritional management during pharmacological weight management.",
          "Evidence summary — trials of protein intake and lean mass retention during energy restriction.",
        ],
        checkFirst:
          "If you have reduced kidney function, your protein target comes from your care team. Bring this step to them rather than adopting a general number.",
      },
      {
        id: "resistance-glp1",
        title: "Resistance train — this is the muscle-protection step",
        why: "Body composition studies on these medications show a substantial share of the loss is lean mass, and training is the main counter-measure.",
        grade: "A",
        gradeNote: "HHS Physical Activity Guidelines · evidence summary",
        how: "`2–3 sessions a week`, major muscle groups, progressive load. Start light if you're new — consistency beats intensity here.\n\nThis is not the optional part of the plan. **Protein without training, or training without protein, both underperform** — they only work as a pair.",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition.",
          "Evidence summary — body composition studies during GLP-1 receptor agonist treatment.",
        ],
        checkFirst:
          "If you're feeling faint, unusually weak, or your heart rate is high at rest — common when intake has dropped sharply — pause and speak to your prescriber before training hard.",
      },
      {
        id: "hydration-glp1",
        title: "Drink deliberately — thirst goes quiet too",
        why: "Reduced intake plus nausea and vomiting makes dehydration common, and it's the most frequent avoidable reason people end up in hospital on these drugs.",
        grade: "A−",
        gradeNote: "Manufacturer prescribing information · clinical guidance",
        how: "Set a target and drink on a schedule rather than waiting to feel thirsty — the same signal that suppressed your appetite blunts thirst.\n\nSip through the day rather than in large volumes, which sit badly on a slow stomach.",
        evidence: [
          "FDA-approved prescribing information for GLP-1 receptor agonists (adverse reactions: dehydration and acute kidney injury).",
          "Clinical guidance on managing gastrointestinal side effects of GLP-1 therapy.",
        ],
        checkFirst:
          "Dehydration on these medications has caused acute kidney injury. Persistent vomiting, inability to keep fluids down, dizziness on standing or markedly reduced urine output needs same-day medical contact.",
      },
      {
        id: "gi-management",
        title: "Manage the GI side effects instead of white-knuckling them",
        why: "Most of the nausea and reflux is predictable from the mechanism, and a few adjustments handle a lot of it.",
        grade: "B+",
        gradeNote: "Clinical guidance — evidence summary",
        how: "Smaller meals, eaten slowly. Go easy on high-fat and very large meals, which sit worst on a slow stomach. **Stop at comfortable, not at full** — the fullness signal arrives late.\n\nDon't lie down straight after eating. Constipation is common too: fibre, fluid and movement.",
        evidence: [
          "Clinical guidance on gastrointestinal tolerability of GLP-1 receptor agonists.",
          "FDA-approved prescribing information — common adverse reactions.",
        ],
        checkFirst:
          "**Severe, persistent abdominal pain — especially radiating to the back with vomiting — needs urgent assessment for pancreatitis.** Stop and get seen; don't wait it out.",
      },
      {
        id: "nutrition-glp1",
        title: "Keep micronutrients monitored, not assumed",
        why: "Eating substantially less food for months means eating substantially fewer nutrients, and the shortfalls are silent until they aren't.",
        grade: "B+",
        gradeNote: "Professional society nutrition guidance",
        supervised: true,
        supplement: true,
        labNote:
          "If your clinician recommends a multivitamin here, the category is worth choosing carefully — dose accuracy and contamination vary widely. Check the Purity Score rather than buying on brand.",
        how: "Ask your prescriber about periodic checks of **B12, iron and ferritin, vitamin D, and calcium**, and whether a multivitamin is appropriate for you.\n\nBuild meals around nutrient density: when total volume is small, every mouthful has to work harder.",
        evidence: [
          "Professional society guidance on nutritional monitoring during medical weight management.",
          "NIH Office of Dietary Supplements — fact sheets on vitamin B12, iron and vitamin D.",
        ],
        checkFirst:
          "Don't start a supplement stack on your own alongside this medication. Some supplements affect gastric emptying or blood sugar, and your prescriber needs the full list.",
      },
      {
        id: "plan-ahead",
        title: "Ask about the plan beyond the medication",
        why: "Weight regain after stopping is well documented, and the habits built during treatment are what carry over.",
        grade: "B+",
        gradeNote: "Evidence summary — withdrawal trial data",
        supervised: true,
        how: "Ask your prescriber early: how long is this expected to continue, what happens if you stop, and what the plan is either way.\n\nTrial data shows substantial regain after discontinuation. **The protein and resistance-training habits are the part that transfers** — build them now, not later.",
        evidence: [
          "Evidence summary — randomised withdrawal trials of GLP-1 receptor agonists and weight regain.",
          "Professional society guidance on long-term obesity pharmacotherapy.",
        ],
        checkFirst:
          "Never stop one of these medications abruptly on your own, particularly if you also have type 2 diabetes — your blood sugar management depends on it, and that transition has to be planned.",
      },
    ],
    skipTheHype: {
      remedy: "\"Nature's Ozempic\" — berberine sold as a GLP-1 alternative",
      why: "Berberine is not a GLP-1 agonist and does not work by the same mechanism. The weight effects in studies are small and inconsistent, it has a long list of drug interactions through CYP3A4, and it is unsafe in pregnancy. Compounded or grey-market versions of the real medications carry their own serious risks — the FDA has warned about dosing errors and adverse events from them.",
    },
    bookTitle: "The GLP-1 Companion — protecting muscle, nutrition and the gut",
    bookUrl: null,
    landingSlug: "glp1-companion-support",
  },
];
