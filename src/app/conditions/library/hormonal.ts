// ─────────────────────────────────────────────────────────────────────────────
// Library — Hormonal.
//
// The whole category is medication-adjacent and diagnosis-dependent, so every
// entry carries a doctor banner and at least two supervised steps. Nothing in
// this file suggests self-testing hormones, self-treating them, or altering a
// prescription.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const HORMONAL_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "pcos-support",
    name: "PCOS support",
    nameEmphasis: "support",
    icon: "venus",
    category: "hormonal",
    blurb: "A metabolic condition as much as a reproductive one.",
    matchRules: [
      { markerId: "insulin", label: "fasting insulin", unit: "μIU/mL", flagAbove: 10 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "total-t", label: "testosterone", unit: "ng/dL", flagAbove: 60 },
    ],
    intro:
      "Polycystic ovary syndrome is usually described as a reproductive condition. It's at least as much a **metabolic** one: insulin resistance sits underneath a large share of cases, and it drives the androgen excess rather than the other way round.\n\nThat's why the interventions that help most are the ones that improve insulin sensitivity — and why the international guideline is emphatic that lifestyle is first-line for everyone, at any weight.\n\nOne more thing worth saying, because it causes a lot of unnecessary distress: **the \"cysts\" aren't cysts.** They're follicles that stalled. And you don't need them on a scan to have PCOS.",
    matchedIntro: "Your metabolic markers fit the pattern that sits underneath most PCOS — worth taking to your doctor.",
    signals: [
      { markerId: "insulin", label: "Fasting insulin", unit: "μIU/mL", flagAbove: 8 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagAbove: 60 },
      { markerId: "free-t", label: "Free testosterone", unit: "pg/mL" },
      { markerId: "shbg", label: "SHBG", unit: "nmol/L", flagBelow: 30 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "PCOS is a diagnosis, and it needs one",
      body: "The same picture can be caused by thyroid disease, high prolactin, or a form of adrenal hyperplasia — all of which are treated differently. This page supports care from a clinician who has made the diagnosis; it does not make it, and it is not a reason to change any prescription.",
    },
    steps: [
      {
        id: "diagnosis-pcos",
        title: "Get the diagnosis made properly, and the mimics excluded",
        why: "PCOS is diagnosed on defined criteria after other causes are ruled out, and getting it wrong sends people down the wrong protocol for years.",
        grade: "A",
        gradeNote: "International PCOS Guideline · ACOG",
        supervised: true,
        how: "The usual criteria need **two of three**: irregular cycles, clinical or biochemical androgen excess, and polycystic ovarian morphology on ultrasound.\n\nAsk for exclusion of the mimics: **thyroid function, prolactin, and 17-hydroxyprogesterone**. In adolescents, ultrasound is not used for diagnosis at all.",
        evidence: [
          "International Evidence-Based Guideline for the Assessment and Management of Polycystic Ovary Syndrome.",
          "American College of Obstetricians and Gynecologists — PCOS clinical guidance.",
        ],
        checkFirst:
          "Rapidly worsening androgen symptoms — fast hair growth, voice deepening, clitoral enlargement — are not typical PCOS and need urgent assessment for another cause.",
      },
      {
        id: "insulin-first",
        title: "Treat the insulin resistance — it's upstream of the rest",
        why: "Improving insulin sensitivity lowers androgens, and lowering androgens is what improves cycles, skin and hair.",
        grade: "A",
        gradeNote: "International PCOS Guideline — first-line",
        how: "Resistance training `2–3×` a week plus `150 minutes` of aerobic activity, protein at each meal, and fibre-first meal ordering.\n\nThe guideline is clear that **no single diet outperforms another** in PCOS. Pick the pattern you can sustain, and judge it on cycles and symptoms rather than on the scale.",
        evidence: [
          "International Evidence-Based Guideline for PCOS — lifestyle as first-line management.",
          "American Diabetes Association — Standards of Care (insulin sensitivity and physical activity).",
        ],
        checkFirst:
          "If you're already on metformin or a GLP-1, keep taking it — these steps sit alongside. And if you have a history of disordered eating, work with a dietitian rather than restricting on your own; PCOS carries a raised risk there.",
      },
      {
        id: "cycle-tracking",
        title: "Track cycles — irregularity is a health signal, not just an inconvenience",
        why: "Long gaps between periods mean the uterine lining isn't shedding regularly, and that carries a real long-term risk that's easy to manage once it's known.",
        grade: "A",
        gradeNote: "ACOG · International PCOS Guideline",
        supervised: true,
        how: "Log every cycle. Cycles consistently longer than `35 days`, or **fewer than 8 periods a year**, are worth raising specifically.\n\nAsk about endometrial protection. There are several options, and the choice depends on whether you're trying to conceive.",
        evidence: [
          "American College of Obstetricians and Gynecologists — PCOS and endometrial protection guidance.",
          "International Evidence-Based Guideline for PCOS — menstrual management.",
        ],
        checkFirst:
          "Heavy, prolonged or unusual bleeding needs assessment rather than tracking. And if you're trying to conceive, say so early — it changes which management options are appropriate.",
      },
      {
        id: "inositol",
        title: "Inositol — the one supplement with real signal here",
        why: "Myo-inositol has the most credible evidence of any supplement in PCOS, and the guideline treats it honestly as promising rather than proven.",
        grade: "B",
        gradeNote: "International PCOS Guideline — evidence summary",
        supplement: true,
        labNote:
          "Ratios and doses vary enormously between products, and many are underdosed relative to the trials. Check the actual myo-inositol content per serving on the Lab Report.",
        how: "Trials typically use `2 g` of myo-inositol twice daily, often with `50 mcg` of D-chiro-inositol, for `3–6 months`.\n\nThe guideline's position is that evidence is **insufficient to recommend it routinely** — so treat it as a reasonable trial with modest expectations, not a cornerstone.",
        evidence: [
          "International Evidence-Based Guideline for PCOS — inositol and supplements.",
          "Evidence summary — randomised trials of myo-inositol on ovulation and metabolic markers in PCOS.",
        ],
        checkFirst:
          "Discuss it with your doctor if you're taking metformin, trying to conceive, or on any diabetes medication — inositol can affect blood sugar and the combination needs to be a considered one.",
      },
      {
        id: "screening-pcos",
        title: "Keep the long-term screening going",
        why: "PCOS raises the risk of type 2 diabetes, sleep apnoea, fatty liver and cardiovascular disease — all of which are manageable when caught.",
        grade: "A",
        gradeNote: "International PCOS Guideline",
        supervised: true,
        how: "Ask about an oral glucose tolerance test or HbA1c **every `1–3 years`**, a lipid panel, blood pressure, and liver enzymes.\n\nMention snoring or daytime sleepiness — sleep apnoea is markedly more common in PCOS and routinely missed.",
        evidence: [
          "International Evidence-Based Guideline for PCOS — cardiometabolic and sleep screening recommendations.",
          "American Diabetes Association — Standards of Care (screening in high-risk groups).",
        ],
        checkFirst:
          "PCOS also carries higher rates of anxiety and depression. That belongs in the appointment too — it's part of the condition, not a separate failing.",
      },
    ],
    skipTheHype: {
      remedy: "Spearmint tea and \"hormone balancing\" blends for androgen symptoms",
      why: "The spearmint studies are small, short and measured blood markers rather than symptoms people notice. \"Hormone balancing\" is a marketing phrase, not a physiological process — no supplement blend has been shown to normalise androgens in PCOS. The insulin-sensitivity work above is where the actual leverage is.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "menopause-support",
    name: "Menopause & perimenopause",
    nameEmphasis: "& perimenopause",
    icon: "sun",
    category: "hormonal",
    blurb: "Bone, heart and sleep matter as much as the hot flushes.",
    matchRules: [],
    intro:
      "Perimenopause can run for years before periods stop, and it's the fluctuation — not the low level — that produces most of the disruption. Cycles shorten then lengthen, sleep fragments, mood swings, and hot flushes arrive.\n\nThe symptoms get the attention. The quieter changes matter more over time: **bone density falls fastest in the years around the final period, and cardiovascular risk rises.** Those are worth acting on early.\n\nOn hormone therapy: the picture has been substantially revised since the early 2000s headlines, and for many women starting within ten years of menopause the benefit-risk balance is favourable. That's a conversation to have properly rather than one to rule out on reputation.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "ldl-c", label: "LDL-C", unit: "mg/dL", flagAbove: 130 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "estradiol", label: "Estradiol", unit: "pg/mL" },
    ],
    doctorBanner: {
      title: "Perimenopause is diagnosed on symptoms, not on a blood test",
      body: "Hormone levels fluctuate day to day in perimenopause, which is why guidelines advise against diagnosing it from a single blood test in women over 45. This page supports care from a clinician; it does not replace it, and it is not a reason to change any prescription.",
    },
    steps: [
      {
        id: "hrt-conversation",
        title: "Have a proper conversation about hormone therapy",
        why: "The evidence was revised substantially after the early trials were re-analysed by age, and many women are still being refused a discussion on out-of-date grounds.",
        grade: "A",
        gradeNote: "Menopause Society position statement · ACOG",
        supervised: true,
        how: "The current position statements support hormone therapy as the **most effective treatment for hot flushes and night sweats**, with a favourable benefit-risk profile for most healthy women under `60` or within `10 years` of menopause.\n\nAsk specifically about route — transdermal oestrogen carries a lower clot risk than oral — and about vaginal oestrogen, which is a separate, very low-risk local treatment.",
        evidence: [
          "The Menopause Society — position statement on hormone therapy.",
          "American College of Obstetricians and Gynecologists — clinical guidance on managing menopausal symptoms.",
        ],
        checkFirst:
          "Hormone therapy isn't for everyone — a history of breast cancer, oestrogen-sensitive cancer, unexplained vaginal bleeding, active liver disease, or a clotting history all change the calculation. That assessment is individual and it belongs with your clinician.",
      },
      {
        id: "bone-menopause",
        title: "Protect bone in the window where it's lost fastest",
        why: "Bone loss accelerates sharply around the final period, and what you do in those years shapes fracture risk decades later.",
        grade: "A",
        gradeNote: "Bone Health & Osteoporosis Foundation · NIH ODS",
        how: "**Resistance training and impact work** are the part that actually loads bone — `2–3` sessions a week. Walking alone is not enough stimulus.\n\nCalcium `1,000–1,200 mg` a day, from food first. Vitamin D `800–1,000 IU` unless your level says otherwise.",
        evidence: [
          "Bone Health & Osteoporosis Foundation — clinician's guide to prevention and treatment of osteoporosis.",
          "NIH Office of Dietary Supplements — calcium and vitamin D fact sheets.",
        ],
        checkFirst:
          "Ask when your first DEXA scan should be — usually `65`, or earlier with risk factors like early menopause, steroid use, low body weight, smoking or a parental hip fracture.",
      },
      {
        id: "vasomotor",
        title: "Handle hot flushes with what's actually been tested",
        why: "There are effective non-hormonal options, and knowing them matters if hormone therapy isn't right for you.",
        grade: "A−",
        gradeNote: "Menopause Society — non-hormonal position statement",
        supervised: true,
        how: "Backed by the non-hormonal position statement: **cognitive behavioural therapy, clinical hypnosis**, and certain prescription non-hormonal medications, including a newer class developed specifically for hot flushes.\n\nPractical layer: layered clothing, a cool bedroom, and identifying your own triggers — alcohol, spicy food and heat are the common ones.",
        evidence: [
          "The Menopause Society — position statement on non-hormonal management of vasomotor symptoms.",
          "NIH / NIA — hot flashes: what can I do?",
        ],
        checkFirst:
          "Several of the effective non-hormonal options are prescription medicines with their own interactions — particularly with tamoxifen. That's a prescriber conversation, not a self-selection.",
      },
      {
        id: "sleep-mood-meno",
        title: "Treat the sleep and mood changes as real",
        why: "Sleep disruption and mood change in perimenopause are well documented, and they're frequently dismissed as stress.",
        grade: "A−",
        gradeNote: "Menopause Society · NIH research",
        how: "Run the sleep protocol in this section. **CBT for insomnia works in menopause specifically** and is worth asking for by name.\n\nMood: perimenopause carries a raised risk of depressive symptoms, particularly in women with a history of them. That's worth naming to your doctor rather than absorbing.",
        evidence: [
          "The Menopause Society — guidance on sleep disturbance in menopause.",
          "NIH — Study of Women's Health Across the Nation (SWAN) findings on mood and sleep in the menopause transition.",
        ],
        checkFirst:
          "New or worsening low mood, anxiety or panic in this window deserves assessment on its own terms. Attributing everything to hormones can delay treatment that would work.",
      },
      {
        id: "heart-meno",
        title: "Re-baseline your cardiovascular risk",
        why: "Lipids and blood pressure shift unfavourably across the menopause transition, and this is the moment to catch it.",
        grade: "A",
        gradeNote: "AHA scientific statement",
        supervised: true,
        how: "Ask for a **lipid panel, blood pressure and HbA1c** around this transition, even if they were fine five years ago.\n\nThe AHA has a dedicated statement on menopause and cardiovascular risk for exactly this reason — the timing of the change is predictable, so the check is worth scheduling.",
        evidence: [
          "American Heart Association — scientific statement on menopause transition and cardiovascular disease risk.",
          "AHA / ACC — cholesterol and blood pressure guidelines.",
        ],
        checkFirst:
          "Early menopause — before `45` — raises long-term cardiovascular and bone risk further, and it changes the hormone therapy calculation substantially. Make sure your clinician knows if that applies to you.",
      },
      {
        id: "vaginal-health",
        title: "Don't put up with genitourinary symptoms",
        why: "Vaginal dryness, urinary urgency and recurrent UTIs after menopause are extremely common, progressive, and highly treatable — and rarely raised.",
        grade: "A",
        gradeNote: "Menopause Society position statement",
        supervised: true,
        how: "Unlike hot flushes, these symptoms **do not improve on their own** — they progress without treatment.\n\nLow-dose vaginal oestrogen is effective, and systemic absorption is minimal, which is why the safety profile is very different from systemic hormone therapy. Non-hormonal moisturisers and lubricants help too.",
        evidence: [
          "The Menopause Society — position statement on genitourinary syndrome of menopause.",
          "American College of Obstetricians and Gynecologists — guidance on vaginal oestrogen therapy.",
        ],
        checkFirst:
          "Any bleeding after menopause needs investigating, always — it should never be attributed to dryness or assumed to be nothing.",
      },
    ],
    skipTheHype: {
      remedy: "Compounded \"bioidentical\" hormone pellets",
      why: "Every major menopause and endocrine society advises against compounded bioidentical hormones: they aren't FDA-approved, potency varies between batches, they lack the safety labelling regulated products carry, and pellets can't be removed if the dose is wrong. Regulated body-identical hormone therapy exists and is well studied — ask for that instead.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "thyroid-support",
    name: "Thyroid support",
    nameEmphasis: "support",
    icon: "testTube",
    category: "hormonal",
    blurb: "Nutrition supports it. Medication treats it. Don't confuse the two.",
    matchRules: [
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "tpo", label: "TPO antibodies", unit: "IU/mL", flagAbove: 35 },
    ],
    intro:
      "The thyroid sets metabolic pace. When it runs slow, everything slows with it: energy, digestion, mood, temperature, heart rate. When it runs fast, the opposite.\n\nHere is the honest boundary this page will not cross. **Hypothyroidism is treated with thyroid hormone replacement. No food, supplement or protocol replaces it**, and stopping or reducing it causes real harm — including, in severe cases, a life-threatening emergency.\n\nWhat nutrition can do is support a thyroid that has what it needs, avoid the things that interfere with absorption, and make sure a deficiency isn't making things worse. That's a genuinely useful role. It just isn't treatment.",
    matchedIntro: "Your thyroid markers are outside the usual range — that belongs with your doctor.",
    signals: [
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "ft4", label: "Free T4", unit: "ng/dL" },
      { markerId: "ft3", label: "Free T3", unit: "pg/mL" },
      { markerId: "tpo", label: "TPO antibodies", unit: "IU/mL", flagAbove: 35 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "selenium", label: "Selenium", unit: "μg/L", flagBelow: 70 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "Thyroid disease is managed with medication and monitoring",
      body: "Nothing on this page treats an underactive or overactive thyroid, and nothing here is a reason to change, reduce or stop thyroid medication. Stopping replacement can be dangerous. Every step below supports care from your doctor.",
    },
    steps: [
      {
        id: "full-panel",
        title: "Get the full picture, not just a TSH",
        why: "TSH alone can miss or mislabel what's going on, and antibodies tell you whether it's autoimmune — which changes what to expect.",
        grade: "A",
        gradeNote: "ATA guidelines",
        supervised: true,
        how: "Ask for **TSH with free T4**, and **TPO antibodies** if you haven't had them.\n\nTPO-positive means Hashimoto's, the most common cause of hypothyroidism. That doesn't change today's treatment, but it does mean the thyroid warrants watching over time.",
        evidence: [
          "American Thyroid Association — guidelines for the treatment of hypothyroidism.",
          "NIH / NIDDK — hypothyroidism and Hashimoto's disease information.",
        ],
        checkFirst:
          "A rapid heart rate, tremor, unexplained weight loss, heat intolerance or eye changes points at an **overactive** thyroid, which is a different and sometimes urgent problem. Don't self-treat that as fatigue.",
      },
      {
        id: "absorption",
        title: "If you take thyroid medication, protect its absorption",
        why: "Levothyroxine absorption is genuinely fragile, and most \"my dose isn't working\" problems turn out to be timing.",
        grade: "A",
        gradeNote: "ATA guidelines",
        supervised: true,
        how: "Take it on an **empty stomach**, `30–60 minutes` before food, at the same time daily.\n\nSeparate by `4 hours`: **calcium, iron, magnesium, and antacids** — all of them bind it. Coffee too soon after reduces absorption. Soy and high-fibre meals can interfere.\n\nBe consistent about brand or formulation; switching can shift your levels.",
        evidence: [
          "American Thyroid Association — guidelines on levothyroxine administration and absorption.",
          "FDA-approved prescribing information for levothyroxine.",
        ],
        checkFirst:
          "Never adjust your own dose based on how you feel, and never stop it. Dose changes are made on blood tests, and the effect takes `6–8 weeks` to show — that's why it's checked at intervals rather than adjusted on symptoms.",
      },
      {
        id: "iodine-selenium",
        title: "Get iodine and selenium right — which mostly means not overdoing them",
        why: "Both are genuinely required for thyroid function, and both cause problems in excess — iodine especially.",
        grade: "B+",
        gradeNote: "NIH ODS · ATA guidance",
        supplement: true,
        labNote:
          "Kelp and \"thyroid support\" blends routinely contain iodine at many times the daily requirement, often without stating the amount clearly. This is a category where reading the Lab Report before buying genuinely matters.",
        how: "Iodine comes from iodised salt, dairy, eggs and fish. **The requirement is about `150 mcg` a day** — high-dose iodine supplements can trigger *or* worsen thyroid disease, in both directions.\n\nSelenium: `55 mcg` a day covers requirements; a couple of Brazil nuts will do it. Supplement doses above `400 mcg` are toxic.",
        evidence: [
          "NIH Office of Dietary Supplements — iodine and selenium fact sheets for health professionals.",
          "American Thyroid Association — statement on iodine supplementation.",
        ],
        checkFirst:
          "**Do not take high-dose iodine or kelp if you have thyroid disease** unless your doctor specifically recommends it. It's one of the few supplement mistakes that can precipitate a genuine thyroid crisis.",
      },
      {
        id: "iron-b12-thyroid",
        title: "Check iron, B12 and vitamin D — they travel with this",
        why: "Autoimmune thyroid disease clusters with other deficiencies and autoimmune conditions, and those overlaps explain a lot of residual symptoms.",
        grade: "B+",
        gradeNote: "Clinical review literature — evidence summary",
        supervised: true,
        how: "Ask for **ferritin, B12 and vitamin D**. Low iron impairs thyroid hormone synthesis and produces its own fatigue on top.\n\nCoeliac disease and pernicious anaemia are both more common with Hashimoto's. If symptoms persist on a well-controlled TSH, those are reasonable things to raise.",
        evidence: [
          "Evidence summary — clinical reviews of nutrient deficiencies and autoimmune comorbidity in Hashimoto's thyroiditis.",
          "NIH Office of Dietary Supplements — iron and vitamin B12 fact sheets.",
        ],
        checkFirst:
          "Don't supplement iron without a ferritin result — iron overload is a real condition. And remember iron must be separated from levothyroxine by `4 hours`.",
      },
      {
        id: "goitrogens",
        title: "Stop worrying about cruciferous vegetables",
        detailTitle: "The goitrogen myth",
        why: "The advice to avoid broccoli and kale with thyroid disease is one of the most persistent pieces of misinformation in this area.",
        grade: "A−",
        gradeNote: "ATA · NIH ODS",
        how: "Goitrogenic effects from cruciferous vegetables require **very large raw intakes with concurrent iodine deficiency** — not a normal diet.\n\n**Cooking largely deactivates them anyway.** Eat the broccoli. Soy is similar: it doesn't cause thyroid disease, though it can interfere with levothyroxine absorption if eaten close to the dose.",
        evidence: [
          "American Thyroid Association — patient guidance on thyroid and diet.",
          "NIH Office of Dietary Supplements — iodine fact sheet (goitrogens in context).",
        ],
        checkFirst:
          "If you're already on levothyroxine, keep soy and high-fibre foods away from the dose by a few hours. That's an absorption issue, not a reason to avoid them.",
      },
      {
        id: "persistent-symptoms",
        title: "If symptoms persist on a normal TSH, say so",
        why: "A meaningful minority of treated people still feel unwell, and there are legitimate avenues to explore rather than being told the number is fine.",
        grade: "B+",
        gradeNote: "ATA guidelines — evidence summary",
        supervised: true,
        how: "Bring it up directly. Things worth exploring: **whether your TSH is optimised within range**, absorption problems, coeliac disease, iron and B12, sleep apnoea, and mood.\n\nCombination T4/T3 therapy remains debated — the guidelines describe it as an option in selected patients who remain symptomatic, and it needs a specialist.",
        evidence: [
          "American Thyroid Association — guidelines on the treatment of hypothyroidism (persistent symptoms and combination therapy).",
          "Evidence summary — trials of combination levothyroxine/liothyronine therapy.",
        ],
        checkFirst:
          "Desiccated thyroid extract is not recommended in the major guidelines — hormone ratios differ from human physiology and potency varies between batches. If you're considering it, that decision belongs with an endocrinologist.",
      },
    ],
    skipTheHype: {
      remedy: "Over-the-counter \"thyroid support\" and glandular supplements",
      why: "Independent analyses have found actual thyroid hormone — T3 and T4 — in a large share of these products, unlabelled and at variable doses. That means you can be taking a real drug without knowing the amount, on top of a prescription. Several also carry high-dose iodine, which can worsen thyroid disease in either direction.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "low-testosterone-support",
    name: "Low testosterone support",
    nameEmphasis: "support",
    icon: "mars",
    category: "hormonal",
    blurb: "Sleep, weight and training first — and a real diagnosis before anything else.",
    matchRules: [
      { markerId: "total-t", label: "total testosterone", unit: "ng/dL", flagBelow: 300 },
    ],
    intro:
      "Low testosterone is real, and it's also the most aggressively marketed diagnosis in men's health. The symptoms — fatigue, low libido, low mood, poor recovery — overlap almost completely with **short sleep, excess weight, depression, alcohol and untreated sleep apnoea**.\n\nThat overlap is the whole problem. Those causes are common, reversible, and routinely skipped in favour of a prescription.\n\nSo the order matters here: fix the reversible drivers, get properly diagnosed if symptoms persist, and understand what testosterone therapy actually involves before starting something that is difficult to stop.",
    matchedIntro: "Your testosterone is below the usual reference range — that needs proper interpretation, not a supplement.",
    signals: [
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagBelow: 300 },
      { markerId: "free-t", label: "Free testosterone", unit: "pg/mL" },
      { markerId: "shbg", label: "SHBG", unit: "nmol/L" },
      { markerId: "estradiol", label: "Estradiol", unit: "pg/mL" },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
    ],
    doctorBanner: {
      title: "This is a diagnosis, and testosterone therapy is a serious commitment",
      body: "Diagnosis requires repeated morning blood tests plus symptoms, and treatment usually suppresses your own production and fertility. Nothing on this page diagnoses or treats low testosterone, and nothing here is a reason to start, change or stop any prescription.",
    },
    steps: [
      {
        id: "sleep-testosterone",
        title: "Fix sleep before you test anything",
        why: "Testosterone is largely produced during sleep, and restricting it to five hours drops daytime levels measurably in healthy young men within a week.",
        grade: "A−",
        gradeNote: "Evidence summary — controlled sleep trials",
        how: "`7 hours or more`, consistently, for at least `4 weeks` before you draw conclusions from a blood test.\n\nAnd get sleep apnoea excluded if you snore. **Untreated apnoea suppresses testosterone**, and treating it is a better first move than replacing the hormone.",
        evidence: [
          "Evidence summary — controlled trials of sleep restriction on daytime testosterone in healthy men.",
          "American Academy of Sleep Medicine — obstructive sleep apnoea and endocrine consequences.",
        ],
        checkFirst:
          "Testosterone therapy can worsen untreated sleep apnoea. That's one of the reasons apnoea gets excluded before treatment rather than after.",
      },
      {
        id: "weight-alcohol-t",
        title: "Address visceral weight and alcohol",
        why: "Fat tissue converts testosterone to oestrogen, and heavy alcohol suppresses production directly — both are reversible.",
        grade: "A−",
        gradeNote: "Endocrine Society guideline — evidence summary",
        how: "Weight loss raises testosterone in men with obesity, and the effect scales with the amount lost.\n\nHeavy drinking suppresses the whole axis. `2 weeks` off is a genuinely informative experiment before you test.",
        evidence: [
          "Endocrine Society — clinical practice guideline on testosterone therapy in men with hypogonadism (reversible causes).",
          "Evidence summary — studies of weight loss and endogenous testosterone in men with obesity.",
        ],
        checkFirst:
          "If you drink daily and heavily, don't stop abruptly — withdrawal is a medical event. Plan the taper with a doctor.",
      },
      {
        id: "train-t",
        title: "Train — but be realistic about what it does",
        why: "Resistance training improves the symptoms people attribute to low testosterone, even where it barely moves the number.",
        grade: "B+",
        gradeNote: "HHS Physical Activity Guidelines — evidence summary",
        how: "`2–3` resistance sessions a week, compound movements, progressive load, plus regular aerobic work.\n\nSet expectations honestly: this changes **energy, strength, body composition and mood** far more than it changes a lab value. That's the outcome you actually wanted.",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition.",
          "Evidence summary — trials of resistance training on body composition, mood and endogenous androgens.",
        ],
        checkFirst:
          "Overtraining with under-eating does the opposite — chronic energy deficit suppresses the same axis. If you're training hard and eating little, that's a plausible cause in its own right.",
      },
      {
        id: "test-properly",
        title: "Test properly — morning, fasting, and twice",
        why: "Testosterone varies through the day and between days, and a single afternoon sample is close to meaningless.",
        grade: "A",
        gradeNote: "Endocrine Society guideline",
        supervised: true,
        how: "**Total testosterone, before `10 am`, fasting, on `two separate mornings`.** Not after a night shift, not during an acute illness.\n\nIf total is borderline, ask about **free testosterone and SHBG**, plus **LH and FSH** — those distinguish a testicular cause from a pituitary one, and that changes the treatment entirely. Prolactin too.",
        evidence: [
          "Endocrine Society — clinical practice guideline on testosterone therapy in men with hypogonadism (diagnostic approach).",
          "American Urological Association — guideline on the evaluation and management of testosterone deficiency.",
        ],
        checkFirst:
          "Very low testosterone with low LH and FSH, headaches, or vision changes can indicate a pituitary problem and needs proper investigation — not a prescription for gel.",
      },
      {
        id: "therapy-tradeoffs",
        title: "Understand what therapy involves before you start",
        why: "Testosterone therapy suppresses your own production and sperm count, and coming off it is much harder than going on.",
        grade: "A",
        gradeNote: "Endocrine Society · AUA guidelines",
        supervised: true,
        how: "What to ask about: **fertility** — therapy usually suppresses sperm production, and that isn't always fully reversible. **Monitoring** — haematocrit, PSA and levels are checked on a schedule. **Duration** — this is generally long-term.\n\nIf fertility matters to you, say so up front. There are alternative approaches that preserve it.",
        evidence: [
          "Endocrine Society — clinical practice guideline on testosterone therapy (risks, monitoring and fertility).",
          "American Urological Association — testosterone deficiency guideline.",
        ],
        checkFirst:
          "Therapy is generally avoided with untreated sleep apnoea, a high haematocrit, uncontrolled heart failure, or a history of prostate or breast cancer. This is a decision for a clinician who has the full picture.",
      },
    ],
    skipTheHype: {
      remedy: "\"Testosterone booster\" supplements — tribulus, D-aspartic acid, fenugreek",
      why: "Independent reviews of this category have found the majority of products contain ingredients with no supporting human data, and some contain undeclared anabolic compounds. Tribulus and D-aspartic acid have both failed in controlled trials in men with normal levels. If your testosterone is genuinely low, this shelf won't fix it; if it isn't, there's nothing to fix.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
