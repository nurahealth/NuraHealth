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
    bookTitle: "The PCOS Handbook — insulin, androgens and what changes the picture",
    bookUrl: null,
    landingSlug: "pcos-support",
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
    bookTitle: "The Menopause Guide — symptoms, evidence and the HRT conversation",
    bookUrl: null,
    landingSlug: "menopause-support",
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
    bookTitle: "The Thyroid Handbook — TSH, antibodies and what supplements can't do",
    bookUrl: null,
    landingSlug: "thyroid-support",
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
    bookTitle: "The Testosterone Guide — testing properly before treating",
    bookUrl: null,
    landingSlug: "low-testosterone-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "pms-period-pain",
    name: "PMS & period pain",
    nameEmphasis: "& period pain",
    icon: "calendarHeart",
    category: "hormonal",
    blurb: "Two different problems that get treated as one — and both have real answers.",
    matchRules: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "\"Period problems\" is usually two separate things wearing one name, and they respond to completely different interventions.\n\n**Period pain (dysmenorrhoea)** is cramping caused by **prostaglandins** — inflammatory messengers released as the uterine lining breaks down. They make the uterus contract hard enough to briefly cut off its own blood supply, which is exactly why it feels like a muscle cramp. That mechanism is the reason anti-prostaglandin timing works so well, and why starting a painkiller after the pain has peaked works so badly.\n\n**PMS** is the mood, sleep, bloating and breast-tenderness cluster in the `1–2` weeks before bleeding, driven by how sensitive your brain is to the normal fall in progesterone — not by \"too much\" or \"too little\" of any hormone. That's why a hormone test in a woman with textbook PMS almost always comes back normal.\n\nBoth are extremely common and both are consistently under-treated. But **pain that stops your life, or that has changed, is not something to manage with heat and hope** — that's secondary dysmenorrhoea until a gynaecologist says otherwise.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      {
        aliases: ["hemoglobin", "haemoglobin", "hgb", "hb"],
        label: "Haemoglobin",
        unit: "g/dL",
        flagBelow: 12,
      },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
    ],
    steps: [
      {
        id: "name-it",
        title: "Work out which problem you actually have",
        detailTitle: "Cramps, PMS, or something underneath",
        why: "The fix for prostaglandin cramping and the fix for premenstrual mood symptoms have almost nothing in common, so guessing wastes cycles.",
        grade: "A−",
        gradeNote: "ACOG · Royal College of Obstetricians and Gynaecologists",
        how: "**Primary dysmenorrhoea** — cramping that starts with or just before the bleed, peaks in the first `1–2` days, has been the same since your teens, and has no other gynaecological cause. This is the prostaglandin one.\n\n**PMS / PMDD** — symptoms in the luteal phase (after ovulation, before bleeding) that **reliably clear within a few days of the bleed starting.** That timing is the diagnosis. If your low mood doesn't lift after your period, it isn't PMS and treating it as such delays the right help.\n\n**Secondary dysmenorrhoea** — pain that started later in life, is getting worse, lasts beyond your period, or comes with pain during sex, heavy bleeding or bowel or bladder symptoms. That points at endometriosis, fibroids or adenomyosis, and it needs a gynaecologist.\n\nTrack **two full cycles** before deciding. Memory reconstructs symptoms around the story you already believe.",
        extra: {
          label: "PMDD is a different weight class",
          body: "**Premenstrual dysphoric disorder** affects a small percentage of menstruating people and is severe — depression, rage, hopelessness, sometimes suicidal thoughts — confined to the luteal phase and lifting with the bleed. It has recognised, effective medical treatment. It is not \"bad PMS\" and it should not be self-managed with magnesium. If that description lands, take a two-cycle symptom diary to a doctor.",
        },
        evidence: [
          "American College of Obstetricians and Gynecologists — dysmenorrhea and premenstrual syndrome patient guidance.",
          "Royal College of Obstetricians and Gynaecologists — management of premenstrual syndrome (Green-top guideline).",
          "NIH / Office on Women's Health — premenstrual syndrome and PMDD.",
        ],
        checkFirst:
          "Period pain that makes you miss work or school, pain during sex, bleeding through a pad or tampon every hour, or periods that have clearly changed all need a gynaecologist. Severe pain is common — that doesn't make it normal.",
      },
      {
        id: "nsaid-timing",
        title: "Time the anti-inflammatory before the pain arrives",
        detailTitle: "The single highest-yield change",
        why: "NSAIDs block the prostaglandins that cause the cramp — but only if they're on board before the prostaglandins are released.",
        grade: "A",
        gradeNote: "Cochrane review — NSAIDs for dysmenorrhoea",
        how: "This is the whole trick and almost nobody is told it: **start the day before, or at the very first twinge — not once you're curled up.** NSAIDs work by stopping prostaglandin production, so once the prostaglandins are already circulating you're playing catch-up against a chemical that's already out.\n\n**Then dose regularly for the first `1–2` days** rather than waiting for the pain to break through each time. Ibuprofen and naproxen both have good trial evidence; naproxen lasts longer, which suits people who wake in the night with it.\n\n**Take it with food**, and don't stack two NSAIDs. Paracetamol/acetaminophen is gentler on the stomach but genuinely less effective here, because it doesn't do the anti-prostaglandin job.\n\nCochrane's review across dozens of trials rates NSAIDs as clearly effective for period pain. Used properly, this outperforms every natural option on this page.",
        extra: {
          label: "Why the hormonal option is on the table too",
          body: "Combined hormonal contraception and the hormonal IUD are **first-line medical treatments** for period pain, not a last resort — they thin the lining, so there's less prostaglandin to release, and many people stop bleeding much at all on the IUD. Plenty of people avoid them believing they're \"unnatural\" while spending years in monthly pain. It's a real option, worth an informed conversation rather than an assumption.",
        },
        evidence: [
          "Cochrane systematic review — nonsteroidal anti-inflammatory drugs for dysmenorrhoea.",
          "American College of Obstetricians and Gynecologists — treatment of primary dysmenorrhea.",
          "NHS — period pain: treatment guidance.",
        ],
        checkFirst:
          "NSAIDs aren't for everyone. Avoid or check first if you have stomach ulcers or reflux, kidney disease, asthma made worse by aspirin, heart failure, or if you take blood thinners, steroids or SSRIs. Ask your pharmacist — it's a thirty-second conversation.",
      },
      {
        id: "heat",
        title: "Use real heat, at the right temperature",
        why: "Local heat performs comparably to ibuprofen in head-to-head trials, with no side effects and no pharmacy.",
        grade: "A−",
        gradeNote: "Randomised trials of topical heat versus oral analgesia",
        how: "A **continuous low-level heat wrap at around `104°F / 40°C`**, worn on the lower abdomen for hours rather than minutes, is what the trials tested — not a hot water bottle for ten minutes. Some studies found it as effective as ibuprofen, and combining the two beat either alone.\n\nHeat works by relaxing the uterine muscle and increasing local blood flow — it is genuinely doing something to the mechanism, not just distracting you.\n\n**Practically:** adhesive heat patches under clothing beat a hot water bottle because they stay on while you carry on with your day, which is the whole point. A warm bath does the same job when you're home.",
        evidence: [
          "Randomised controlled trials comparing continuous low-level topical heat with oral ibuprofen for primary dysmenorrhoea.",
          "Cochrane review — topical heat therapy for period pain.",
          "American College of Obstetricians and Gynecologists — non-pharmacological measures for dysmenorrhea.",
        ],
        checkFirst:
          "Don't sleep on an electric heat source or apply high heat directly to skin — low-temperature burns happen slowly and painlessly, especially overnight. Use the rated wraps and keep a layer of fabric in between.",
      },
      {
        id: "magnesium",
        title: "Trial magnesium — the best-supported supplement here",
        why: "Magnesium relaxes smooth muscle, and the trials in period pain and premenstrual symptoms are small but consistently positive.",
        grade: "B+",
        gradeNote: "Evidence summary — small randomised trials",
        supplement: true,
        labNote:
          "Form drives both absorption and side effects in this category. Magnesium oxide is cheap, poorly absorbed and the most likely to send you to the bathroom; glycinate and citrate are better tolerated. Check the declared form and elemental dose on the label rather than the headline milligrams.",
        how: "Typical trial doses sit around **`200–400 mg` of elemental magnesium daily**, taken through the whole cycle rather than only during the bleed — the evidence is for sustained intake, not a rescue dose.\n\n**Glycinate** if you want it gentle and calming (it also helps sleep), **citrate** if constipation is part of your picture. Skip oxide.\n\nFood first is real here: nuts, seeds, beans, leafy greens, dark chocolate. Most people fall short of the RDA, so this is often correcting a genuine shortfall rather than dosing a drug.\n\n**Vitamin B6** shows up in the PMS literature too, often paired with magnesium. If you try it, stay at or below `100 mg` daily and don't run it indefinitely — high-dose B6 over months can cause nerve damage, which is one of the few supplement harms that is well documented and not always reversible.",
        extra: {
          label: "Honest expectations",
          body: "The magnesium trials here are genuinely small and some are poorly blinded — this is a B+, not an A. It is cheap, safe at sensible doses, and has a plausible mechanism, which makes it a reasonable thing to trial for two or three cycles. If nothing has changed by then, it isn't your answer and stacking more won't make it one.",
        },
        evidence: [
          "Evidence summary — randomised trials of magnesium for dysmenorrhoea and premenstrual symptoms.",
          "NIH Office of Dietary Supplements — magnesium fact sheet, including upper intake levels.",
          "NIH Office of Dietary Supplements — vitamin B6: neuropathy at high chronic doses.",
        ],
        checkFirst:
          "Magnesium supplements need care if you have kidney disease, and they can interfere with the absorption of some antibiotics and thyroid medication — separate them by a few hours.",
      },
      {
        id: "omega3-exercise",
        title: "Move, and get omega-3 in",
        detailTitle: "The two lifestyle levers with actual trials",
        why: "Both act on the same inflammatory pathway the painkillers do, and both take a couple of cycles to show up.",
        grade: "B+",
        gradeNote: "Cochrane review (exercise) · randomised trials (omega-3)",
        supplement: true,
        labNote:
          "Fish oil is one of the categories where oxidation and actual EPA/DHA content vary most between products — a rancid oil is both less effective and unpleasant. Check the Purity Score and the declared EPA+DHA per serving, not the capsule size.",
        how: "**Exercise.** Cochrane's review found regular exercise reduces period pain intensity — roughly `30–45` minutes, `3` times a week, of anything that raises your heart rate. Counter-intuitively, moving during the painful days usually helps rather than hurts. The effect is on your regular routine, not on what you do the day it starts.\n\n**Omega-3.** Trials using around **`1–2 g` of combined EPA and DHA daily** found reduced period pain and lower painkiller use over `2–3` months. Same mechanism as the NSAIDs, gentler and slower. Oily fish twice a week is the food version.\n\nNeither of these is a rescue for a bad day. Both are things you do for two or three cycles before judging.",
        evidence: [
          "Cochrane systematic review — exercise for dysmenorrhoea.",
          "Randomised trials of omega-3 fatty acid supplementation for primary dysmenorrhoea and analgesic use.",
          "NIH Office of Dietary Supplements — omega-3 fatty acids fact sheet.",
        ],
        checkFirst:
          "High-dose fish oil mildly affects clotting. If you take an anticoagulant or antiplatelet, or have surgery scheduled, clear the dose with your doctor first.",
      },
      {
        id: "sleep-and-track",
        title: "Protect the luteal week, and keep the record",
        detailTitle: "Making the second half of the cycle survivable",
        why: "PMS symptoms are amplified by short sleep, alcohol and an overloaded schedule — and the pattern is only visible if you write it down.",
        grade: "B",
        gradeNote: "Evidence summary — observational and small interventional data",
        how: "**Sleep is the biggest lever in the luteal phase.** Core body temperature runs higher after ovulation and sleep quality genuinely drops for many people; a cooler room and a protected bedtime that week does more for premenstrual mood than any supplement on this page.\n\n**Alcohol is worth watching** in the premenstrual week specifically — it fragments sleep and reliably deepens the low mood people are already fighting.\n\n**Plan the week down, not up.** If you know which days are hard, moving the difficult conversation or the heavy training block off them is a legitimate intervention rather than an indulgence.\n\nAnd **keep a simple cycle log** — day of cycle, pain `0–10`, mood, bleeding, what you took. Two or three cycles of that is the single most useful thing you can hand a doctor, and it's what makes a fifteen-minute appointment count.",
        evidence: [
          "Evidence summary — sleep disruption across the luteal phase and its relationship to premenstrual symptom severity.",
          "American College of Obstetricians and Gynecologists — lifestyle measures in premenstrual syndrome.",
          "Royal College of Obstetricians and Gynaecologists — symptom diaries in PMS assessment.",
        ],
        checkFirst:
          "If premenstrual low mood includes hopelessness or thoughts of harming yourself, that is a reason to seek help now rather than to keep logging. PMDD is treatable and severe premenstrual mood symptoms are not something to ride out alone.",
      },
    ],
    skipTheHype: {
      remedy: "Seed cycling",
      why: "The protocol — flax and pumpkin seeds in the first half of your cycle, sesame and sunflower in the second — is everywhere on wellness social media, sold as a way to \"balance\" oestrogen and progesterone. **There are no clinical trials showing seed cycling changes hormone levels or menstrual symptoms in humans.** The proposed mechanism doesn't survive contact with physiology either: the lignans and vitamin E involved don't act as a phase-specific hormonal switch, and the amounts are small. Eating seeds is good for you and there is no harm in it — the harm is in believing you're treating a hormonal problem for six months while an actual cause, like endometriosis or a thyroid issue, goes unlooked-at.",
    },
    bookTitle: "The Period Playbook — cramps, PMS and what actually helps",
    bookUrl: null,
    landingSlug: "pms-period-pain",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Supportive-only, modelled on the IBD companion. This page never treats
  // endometriosis and carries no supplement step at all — the treatment is
  // gynaecological, and everything here sits alongside it.
  {
    slug: "endometriosis-companion",
    name: "Endometriosis companion",
    nameEmphasis: "companion",
    icon: "orbit",
    category: "hormonal",
    blurb: "Supportive care alongside your gynaecologist — never instead of them.",
    matchRules: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "Endometriosis is tissue similar to the uterine lining growing **outside** the uterus — on the ovaries, the pelvic lining, the bowel, occasionally further afield. It responds to the hormonal cycle, bleeds where it has no way out, and drives inflammation, adhesions and scarring. It affects roughly **1 in 10** women and people with a uterus of reproductive age.\n\nTwo facts define the experience. First, **diagnosis takes years** — commonly `7–10` from first symptoms, because the pain gets normalised, by patients and clinicians both. Second, **the severity of pain does not track the amount of disease.** Minimal disease can cause severe pain; extensive disease can be found incidentally. Anyone who tells you your pain reflects your stage is wrong.\n\nThis page is deliberately narrow about what it is. **Endometriosis is treated medically and surgically by a gynaecologist**, and nothing here treats it, shrinks it, or replaces any part of that. What the rest of this page can genuinely help with is the load around it: pain that has become centrally amplified, a pelvic floor that has spent years guarding, sleep, and going into appointments with the evidence you need to be taken seriously.",
    matchedIntro:
      "Your panel shows low iron stores, which is common alongside heavy bleeding and worth raising specifically with your gynaecologist — it's a fixable part of the fatigue that often gets attributed to the condition itself.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      {
        aliases: ["hemoglobin", "haemoglobin", "hgb", "hb"],
        label: "Haemoglobin",
        unit: "g/dL",
        flagBelow: 12,
      },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "This is companion care, not treatment",
      body: "Endometriosis is managed by a gynaecologist — hormonal therapy, excision surgery and specialist pain care are the treatments, and nothing on this page substitutes for any of them. Never delay, change or stop prescribed treatment based on what you read here. New or severe pain, and pain with fever, vomiting or fainting, needs urgent medical care.",
    },
    steps: [
      {
        id: "get-seen",
        title: "Get to a gynaecologist who takes it seriously",
        detailTitle: "Shortening the diagnostic delay",
        why: "The single biggest determinant of how this goes is being believed early, and that often means being specific rather than being stoic.",
        grade: "A",
        gradeNote: "ESHRE guideline · ACOG",
        supervised: true,
        how: "**Describe the impact, not just the pain.** \"Bad periods\" gets nodded at; \"I miss `2` days of work every month, painkillers don't touch it, sex is painful, and I've had this for `6` years\" gets referred.\n\nThe symptoms that raise suspicion: **severe period pain, pain during or after sex, chronic pelvic pain, painful bowel movements or urination during your period, heavy bleeding, and difficulty conceiving.**\n\nKnow how diagnosis actually works now. **A normal ultrasound or MRI does not rule endometriosis out** — superficial disease is frequently invisible on imaging. That misunderstanding ends a great many investigations early. Modern guidance also supports starting treatment on clinical suspicion rather than requiring surgical confirmation first.\n\nIf you're being dismissed, **ask for a referral to a specialist endometriosis centre.** Outcomes for complex disease are meaningfully better in units that do this work often.",
        extra: {
          label: "Two things that get people stuck",
          body: "**\"Get pregnant, it'll fix it\"** is outdated advice — pregnancy may suppress symptoms temporarily and they commonly return. And **a hysterectomy is not automatically a cure**: if disease outside the uterus is left behind, pain frequently continues. Both are worth knowing before an irreversible decision is put in front of you.",
        },
        evidence: [
          "ESHRE (European Society of Human Reproduction and Embryology) — guideline on the management of endometriosis.",
          "American College of Obstetricians and Gynecologists — management of endometriosis.",
          "NICE — endometriosis: diagnosis and management (NG73).",
        ],
        checkFirst:
          "Sudden severe pelvic pain, pain with fever or vomiting, or fainting is an emergency — an ovarian cyst can rupture or twist. That is an ambulance, not a heat pack.",
      },
      {
        id: "pain-plan",
        title: "Build a written pain plan with your team",
        why: "Reaching for whatever's in the drawer when a flare hits is how people end up under-treated on the worst days and over-medicated across the month.",
        grade: "A−",
        gradeNote: "ESHRE guideline · specialist pain guidance",
        supervised: true,
        how: "Ask your clinician to help you write down **exactly what to take, at what dose, and when to start it** — not \"take painkillers as needed\". For cyclical pain, that usually means starting an anti-inflammatory **before** the pain begins, since prostaglandins are easier to prevent than to chase.\n\nThe plan should also say **what to do when the usual plan fails**, and at what point you call. Having that written down removes the worst decision-making from the worst hours.\n\n**Heat is a legitimate part of it.** Continuous low-level heat on the lower abdomen is well-supported for pelvic pain and stacks with medication rather than replacing it.\n\nAnd if pain has become constant rather than cyclical, ask about referral to a **pelvic pain specialist**. Long-standing pain rewires how the nervous system processes signals, and that needs treating in its own right — not more of the same.",
        evidence: [
          "ESHRE — guideline on endometriosis: pain management recommendations.",
          "NICE NG73 — endometriosis: analgesia and referral to specialist pain services.",
          "Randomised trials of continuous low-level topical heat for pelvic pain.",
        ],
        checkFirst:
          "Don't escalate your own doses or combine painkillers without advice. Long-term NSAID use has real stomach and kidney costs, and opioids are a poor fit for chronic pelvic pain — both are conversations for your prescriber.",
      },
      {
        id: "pelvic-floor",
        title: "See a pelvic floor physiotherapist",
        why: "Years of pain teach the pelvic floor to guard, and a permanently tight pelvic floor becomes its own source of pain, painful sex and bladder symptoms.",
        grade: "B+",
        gradeNote: "Evidence summary — physiotherapy trials in chronic pelvic pain",
        supervised: true,
        how: "This is the most under-used effective intervention in endometriosis care, and most people are never offered it.\n\nA pelvic health physiotherapist assesses whether your pelvic floor is **overactive** — held tight — and treats it with manual therapy, breathing, graded relaxation and, where appropriate, dilator work. It is a normal part of specialist endometriosis care in good units.\n\n**Important:** if your pelvic floor is overactive, **Kegels can make things worse.** The default \"do your pelvic floor exercises\" advice is written for weakness, which is a different problem. Get assessed rather than guessing which one you have.\n\nAsk your gynaecologist or GP for a referral to a physiotherapist with **pelvic health** training specifically.",
        evidence: [
          "Evidence summary — pelvic floor physiotherapy trials in chronic pelvic pain and endometriosis-associated pain.",
          "ESHRE — guideline on endometriosis: adjunctive and multidisciplinary care.",
          "American Physical Therapy Association — pelvic health physical therapy for chronic pelvic pain.",
        ],
        checkFirst:
          "Don't start pelvic floor strengthening on your own if sex or tampon use is painful — that pattern usually means an overactive floor, and strengthening it is the wrong direction.",
      },
      {
        id: "movement-sleep",
        title: "Protect sleep and keep moving within your limits",
        detailTitle: "Turning down the amplifier",
        why: "Persistent pain sensitises the nervous system, and poor sleep measurably lowers pain thresholds — so these aren't soft extras, they change how much pain you feel from the same disease.",
        grade: "B+",
        gradeNote: "Evidence summary — sleep, exercise and central sensitisation",
        how: "**Sleep first.** Experimental studies consistently show that restricting sleep lowers pain tolerance the next day. If pain is waking you, that's a treatment problem to raise — not something to absorb.\n\n**Movement, scaled honestly.** Gentle regular activity — walking, swimming, yoga — is associated with better pain outcomes in chronic pelvic pain. The rule that keeps people out of trouble is **consistency over intensity**: a manageable amount most days beats a hard session followed by three days flat.\n\n**Stress work is not \"it's in your head\".** Endometriosis pain is real and physical. But the nervous system's volume control is genuinely turned up by chronic stress, and approaches like CBT, mindfulness-based pain programmes and pacing have trial support for reducing the impact of persistent pain. They work on the amplifier, not on the truth of the signal.",
        evidence: [
          "Evidence summary — experimental sleep restriction and reduced pain thresholds.",
          "Evidence summary — physical activity and psychological therapies in chronic pelvic pain.",
          "ESHRE — guideline on endometriosis: quality of life and multidisciplinary support.",
        ],
        checkFirst:
          "If pain regularly wakes you at night or is present every day rather than cyclically, tell your specialist. That pattern often means the plan needs changing, not that you need to cope better.",
      },
      {
        id: "eat-honestly",
        title: "Eat well — and know what that can and can't do",
        why: "Diet is where the most exaggerated claims in endometriosis live, and being straight about the ceiling keeps you from spending years on elimination.",
        grade: "B",
        gradeNote: "Evidence summary — observational, inconsistent",
        how: "**What the evidence supports:** a broadly anti-inflammatory pattern — plenty of vegetables, fruit, legumes, whole grains, oily fish, olive oil, and less ultra-processed food and alcohol. This is good for you, may modestly help symptoms, and costs nothing but effort.\n\n**A low-FODMAP trial is worth considering if bowel symptoms are prominent** — gut symptoms overlap heavily with endometriosis and a lot of people carry an IBS picture alongside it. Do it with a dietitian and reintroduce properly; it is a diagnostic exercise, not a way of life.\n\n**What the evidence does not support:** that any diet shrinks endometriotic lesions, that gluten or dairy cause endometriosis, or that cutting whole food groups changes the course of the disease. The observational studies here are inconsistent and confounded, and that is the honest summary.\n\nIf you're bleeding heavily, ask about **iron** — low ferritin is common and treatable, and it accounts for more fatigue than most people realise.",
        extra: {
          label: "Where elimination diets do harm",
          body: "The people who get hurt by this are the ones who cut food group after food group over years, end up nutritionally short and socially isolated, and are still in pain — because the disease was never dietary. If your list of \"safe foods\" is shrinking and your pain isn't, that's the moment to bring in a dietitian and put the effort somewhere with better odds.",
        },
        evidence: [
          "Evidence summary — observational studies of dietary patterns and endometriosis symptoms.",
          "ESHRE — guideline on endometriosis: nutrition and complementary approaches.",
          "Monash University — low FODMAP diet and its evidence base in gut symptoms.",
        ],
        checkFirst:
          "Unintended weight loss, new bowel changes or blood in your stool are not endometriosis symptoms to diet around — they need investigating.",
      },
      {
        id: "fertility-early",
        title: "Have the fertility conversation earlier than feels necessary",
        why: "Endometriosis can affect fertility, some treatments affect timing, and the options are wider when the conversation happens before it's urgent.",
        grade: "A−",
        gradeNote: "ESHRE · ASRM guidance",
        supervised: true,
        how: "Endometriosis is associated with reduced fertility, though **many people with it conceive without help** — the range is wide and stage doesn't predict it reliably.\n\nWhat's worth knowing early: some **medical treatments suppress ovulation** while you're on them, so they and family planning have to be sequenced together. Surgery decisions can affect ovarian reserve, particularly repeat ovarian surgery. And **fertility preservation** exists and is time-sensitive.\n\nNone of this means rushing anything. It means asking your gynaecologist **\"how does this affect my options, and what's the timeline?\"** at a point where the answer can still shape the plan — rather than discovering the constraints later.",
        evidence: [
          "ESHRE — guideline on endometriosis: fertility and reproductive outcomes.",
          "American Society for Reproductive Medicine — endometriosis and infertility: a committee opinion.",
          "NICE NG73 — endometriosis and fertility.",
        ],
        checkFirst:
          "Fertility questions belong with your gynaecologist and, where relevant, a reproductive specialist. No supplement, diet or protocol on the internet improves endometriosis-related fertility, and the ones sold for it are trading on a genuinely painful uncertainty.",
      },
      {
        id: "track",
        title: "Track it — so the appointment works",
        why: "Fifteen minutes is not long, and a written record turns a vague conversation into a clinical decision.",
        grade: "B+",
        gradeNote: "Evidence summary — symptom diaries in chronic pain care",
        how: "Log, briefly, every day: **pain `0–10`, where it is, bleeding, what you took and whether it worked, and what you couldn't do.** That last column is the one that moves clinicians — missed days are measurable in a way that \"it's bad\" isn't.\n\nBefore each appointment, write down **three questions** and put the most important one first. Appointments end early far more often than they run over.\n\n**Take someone with you** if you've been dismissed before. It shouldn't be necessary and it demonstrably helps.\n\nAnd keep your own copies of scans, operation notes and clinic letters. Endometriosis care often spans several clinicians over years, and being the reliable holder of your own history saves repeating investigations.",
        evidence: [
          "Evidence summary — symptom diaries and their effect on clinical decision-making in chronic pain.",
          "NICE NG73 — endometriosis: information and support for patients.",
          "Endometriosis UK — preparing for appointments and keeping records.",
        ],
        checkFirst:
          "Tracking is a tool for getting better care, not a substitute for it. If your symptoms are worsening, the log is a reason to bring the appointment forward rather than to keep collecting data.",
      },
    ],
    skipTheHype: {
      remedy: "Castor oil packs and \"endo diets\" sold as a way to dissolve lesions",
      why: "Both are marketed with the same promise: that with enough discipline you can clear endometriosis without a gynaecologist. **There are no clinical trials showing castor oil packs affect endometriotic tissue**, and none showing any diet shrinks lesions or changes the course of the disease. A warm pack on your abdomen feels good — that's the heat, and heat is on this page for exactly that reason. The cost isn't the oil. It's the months and sometimes years people spend on protocols while adhesions progress and the specialist referral that would actually change things sits unasked-for.",
    },
    bookTitle: "The Endometriosis Companion — getting believed, getting seen, getting support",
    bookUrl: null,
    landingSlug: "endometriosis-companion",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "fertility-support",
    name: "Fertility support",
    nameEmphasis: "support",
    icon: "baby",
    category: "hormonal",
    blurb: "Both partners, from day one — and a clear line for when to stop waiting.",
    matchRules: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 2.5 },
    ],
    intro:
      "About **1 in 6 couples** experience difficulty conceiving, and the single most useful correction to the popular story is this: **roughly a third of cases are male-factor, a third female-factor, and the rest a combination or unexplained.** Yet in practice the woman is investigated for months before anyone orders a semen analysis — which is fast, cheap and non-invasive.\n\nThe second correction is about odds. For a couple in their early thirties with no problems, the chance of conceiving in any given cycle is around **`20–25%`**. Most conceive within a year. That means several months of nothing happening is usually normal statistics rather than a sign of a problem — and also that \"just relax\" is not advice, it's a way of ending a conversation.\n\nWhat follows is the genuinely supportive layer: the things with evidence that either partner can do, and — more important than any of them — **when to stop optimising and get assessed.** Time is the one variable that can't be recovered, and the most common expensive mistake in fertility is spending a year on supplements before anyone runs a test.",
    matchedIntro:
      "One of the markers on your panel is in a range worth raising in a preconception appointment — thyroid function and vitamin D are both routinely checked before and during pregnancy, and both are straightforward to address.",
    signals: [
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 2.5 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.6 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "folate", label: "Folate", unit: "ng/mL", flagBelow: 4 },
    ],
    doctorBanner: {
      title: "Know the referral line before you start",
      body: "See a doctor after 12 months of trying if the female partner is under 35, after 6 months if she is 35 or older, and straight away — not after a wait — if there are irregular or absent periods, known endometriosis or PCOS, previous pelvic surgery or infection, two or more miscarriages, cancer treatment history, or a known problem on the male side. Waiting past those marks costs options.",
    },
    steps: [
      {
        id: "when-to-get-help",
        title: "Know exactly when to stop waiting",
        detailTitle: "The referral thresholds, in plain numbers",
        why: "This is the highest-value item on the page, and it's the one most often got wrong — in both directions.",
        grade: "A",
        gradeNote: "ASRM · NICE fertility guideline",
        supervised: true,
        how: "**Under 35: seek assessment after `12` months** of regular unprotected sex without conception.\n**35 and over: after `6` months.** The shorter window is deliberate — the decline in egg quantity and quality accelerates through the late thirties, and the cost of a delay is higher.\n**Over 40: seek advice straight away.**\n\n**Don't wait at all if any of these apply:** periods that are irregular, absent or very short cycles; known or suspected endometriosis or PCOS; previous pelvic infection, pelvic surgery or ectopic pregnancy; two or more miscarriages; previous chemotherapy or radiotherapy; undescended testes, testicular surgery, or a known low sperm count.\n\nAnd go **as a couple**. Being seen together is the fastest route to a complete picture and it stops the investigation running down one track for six months.",
        evidence: [
          "American Society for Reproductive Medicine — definitions of infertility and when to seek evaluation.",
          "NICE — fertility problems: assessment and treatment (CG156).",
          "NIH / NICHD — infertility: when to see a specialist.",
        ],
        checkFirst:
          "No supplement, diet, app or protocol on this page substitutes for assessment once you have passed those thresholds. Blocked tubes, absent ovulation and severe male-factor problems are not things lifestyle changes reach.",
      },
      {
        id: "test-both",
        title: "Test both partners — semen analysis first",
        detailTitle: "The cheapest test in fertility, done last",
        why: "Male factor is involved in around half of cases, and the test for it is a fraction of the cost and invasiveness of the female workup.",
        grade: "A",
        gradeNote: "ASRM · WHO laboratory manual",
        supervised: true,
        how: "**Semen analysis** measures count, motility (movement), morphology (shape) and volume against WHO reference values. It is quick and non-invasive, and it should be among the first tests done, not a formality after months of investigating one partner.\n\nTwo practical notes that change results: **abstain for `2–5` days** before the sample — shorter and longer both skew it — and **repeat an abnormal result after around `3` months** before drawing conclusions. Sperm production takes roughly `70–90` days, so a single sample can reflect an illness, a fever or a stressful stretch rather than a baseline.\n\nOn the female side, initial assessment typically covers **ovulation** (a mid-luteal progesterone), **thyroid function and prolactin**, **ovarian reserve** (AMH and/or antral follicle count) and **tubal patency** where indicated.\n\nBoth partners: check **rubella immunity** and, if relevant, genetic carrier screening — these are easier to sort before pregnancy than during it.",
        extra: {
          label: "What AMH does and doesn't tell you",
          body: "**AMH estimates how many eggs are left, not their quality, and it does not predict your chance of conceiving naturally.** It is genuinely useful for planning IVF stimulation and for context on timing. It is increasingly sold direct-to-consumer as a \"fertility score\", which is not what it measures — a low AMH in someone in their twenties with regular cycles frequently causes real distress for no clinical reason.",
        },
        evidence: [
          "World Health Organization — laboratory manual for the examination and processing of human semen.",
          "American Society for Reproductive Medicine — diagnostic evaluation of the infertile male and female.",
          "NICE CG156 — investigation of fertility problems.",
        ],
        checkFirst:
          "Don't accept a workup that only investigates one partner. If a semen analysis hasn't been offered in the first round of tests, ask for it directly — it is standard, and skipping it is the most common way months get wasted.",
      },
      {
        id: "timing",
        title: "Get the timing right — it's a narrower window than most people think",
        why: "The fertile window is about six days long and ends at ovulation, and a large proportion of couples time intercourse for after it.",
        grade: "A",
        gradeNote: "ASRM committee opinion on optimizing natural fertility",
        how: "The **fertile window is roughly the `5` days before ovulation plus the day of ovulation** — sperm survive several days in fertile cervical mucus; an egg survives around `12–24` hours. **Timing after ovulation is too late**, which is the flaw in relying on a temperature rise, since that only confirms ovulation once it has happened.\n\nThe simplest approach with the best evidence: **have sex every `1–2` days across the fertile window**, or simply every `2–3` days throughout the cycle and stop tracking. That covers the window without turning it into a scheduling exercise.\n\n**Signs of the window:** cervical mucus becoming clear, slippery and stretchy — like raw egg white — is the most useful real-time signal. **LH urine strips** predict ovulation `24–36` hours ahead and are more reliable than app predictions, which estimate from past cycles rather than measuring this one.\n\n**Skip the lubricant, or use a fertility-friendly one.** Most standard lubricants impair sperm motility.",
        extra: {
          label: "Two myths worth dropping",
          body: "**Position and lying still afterwards make no measurable difference** — sperm reach the cervix within minutes. And **\"saving up\" by abstaining for a week lowers, rather than raises, your chances**: motility falls with long abstinence. Every `1–2` days beats one carefully timed attempt.",
        },
        evidence: [
          "American Society for Reproductive Medicine — optimizing natural fertility: a committee opinion.",
          "NICE CG156 — advice on frequency and timing of intercourse.",
          "Evidence summary — cervical mucus and LH testing versus calendar-based prediction of the fertile window.",
        ],
        checkFirst:
          "If cycles are irregular, absent, shorter than 21 days or longer than 35, timing methods won't fix it — that pattern suggests ovulation isn't happening reliably and it needs assessing rather than tracking harder.",
      },
      {
        id: "folate",
        title: "Start folic acid before you conceive — this one is not optional",
        detailTitle: "The one supplement with an unarguable case",
        why: "Neural tube defects form in the first few weeks of pregnancy, usually before anyone knows they're pregnant. Starting after a positive test is too late.",
        grade: "A",
        gradeNote: "CDC · WHO · randomised trial evidence",
        supplement: true,
        labNote:
          "Prenatal vitamins vary widely in what they actually contain versus what the label claims, and some carry high doses of vitamin A, which is genuinely harmful in pregnancy. This is the supplement category where verification matters most — check the Purity Score and the vitamin A form and dose before buying.",
        how: "**`400 mcg` of folic acid daily, starting at least `1` month before you conceive** and continuing through the first `12` weeks. This is one of the best-established preventive measures in medicine — it reduces neural tube defects by a large margin, and the evidence comes from randomised trials, not observation.\n\n**A higher dose of `5 mg` daily** is recommended for some people — diabetes, epilepsy medication, coeliac disease, higher BMI, a previous affected pregnancy, or a family history. That's a prescription-level decision, so ask rather than assume.\n\nA general **prenatal vitamin** is a reasonable vehicle for it, and most also provide **vitamin D `10 mcg` / `400 IU`**, which is separately recommended.\n\n**What to avoid:** high-dose **vitamin A / retinol** is teratogenic — check any prenatal or multivitamin for it, and don't take cod liver oil in pregnancy for the same reason.",
        evidence: [
          "CDC — folic acid recommendations for the prevention of neural tube defects.",
          "World Health Organization — periconceptional folic acid supplementation guidance.",
          "NICE — antenatal care: supplement recommendations and vitamin A caution.",
        ],
        checkFirst:
          "Tell your doctor about every supplement before and during pregnancy. Several herbs and high-dose vitamins are unsafe in pregnancy, and \"natural\" carries no protection here at all.",
      },
      {
        id: "modifiables",
        title: "Fix the modifiables — both of you",
        detailTitle: "What actually moves the numbers",
        why: "Smoking, alcohol, weight and heat have real, measured effects on both eggs and sperm — and they are the levers you control.",
        grade: "A−",
        gradeNote: "ASRM · NICE · observational and interventional data",
        how: "**Stop smoking — both partners.** It reduces fertility in women, damages sperm quality and DNA in men, and raises miscarriage risk. It is the largest single modifiable factor here, and it includes vaping and cannabis, which is independently linked to lower sperm counts.\n\n**Alcohol down.** Heavy drinking clearly impairs fertility in both partners. Guidance in pregnancy is no alcohol; while trying, less is better and the male side matters too.\n\n**Weight in both directions.** A BMI meaningfully above or below the healthy range disrupts ovulation, and excess weight is associated with poorer sperm parameters. In PCOS specifically, modest loss — around `5–10%` — can restore ovulation. This is a place to be honest and kind at once: it matters, and shame is not a method.\n\n**Heat, for the male partner.** Sperm production needs the testes a couple of degrees below core temperature. Regular hot tubs and saunas, and a laptop on the lap, measurably reduce counts — and it's reversible over about `3` months.\n\n**Caffeine** under roughly `200 mg` a day (about one strong coffee) is the usual pregnancy guidance.",
        extra: {
          label: "Timescale — why nothing shows up next week",
          body: "Sperm take around **`70–90` days** to develop, so changes made today show up in a semen analysis about three months from now. Egg maturation runs on a similar multi-month arc. That's the honest timeline for every change on this page, and it's the reason to start them alongside the medical workup rather than instead of it.",
        },
        evidence: [
          "American Society for Reproductive Medicine — smoking, weight, alcohol and fertility committee opinions.",
          "NICE CG156 — lifestyle advice for couples trying to conceive.",
          "Evidence summary — scrotal heat exposure, cannabis use and semen parameters.",
        ],
        checkFirst:
          "Some prescription medications affect fertility — including certain treatments for testosterone, blood pressure, depression and inflammatory conditions. Never stop one on your own; ask your prescriber whether an alternative exists.",
      },
      {
        id: "stress-sleep",
        title: "Deal with the stress honestly — and protect the relationship",
        why: "Stress is not why you aren't pregnant, but the strain of trying is real, and it's what makes couples drop out of treatment that was working.",
        grade: "B+",
        gradeNote: "Evidence summary — psychological interventions in fertility care",
        how: "First, the correction: **there is no good evidence that everyday stress causes infertility.** \"Just relax and it'll happen\" is both unsupported and, for someone with a diagnosed problem, quietly cruel. Let it go, and let anyone who says it know.\n\nWhat *is* true: fertility treatment is one of the more distressing things people go through, and **psychological distress is a leading reason couples discontinue treatment** that might have worked. Support is worth having for its own sake.\n\nWhat helps, with evidence behind it: **counselling with a fertility-trained therapist**, **mind-body and CBT-based programmes**, and **peer support groups**. Regular exercise and adequate sleep support mood — though note that very intense endurance training can itself disrupt ovulation.\n\n**Protect some of your life from this.** Couples who ring-fence time where conception is not discussed tend to do better, and scheduling sex around a chart is corrosive over months. Every `2–3` days without tracking is a legitimate strategy for exactly this reason.",
        evidence: [
          "Evidence summary — psychological interventions and treatment discontinuation in fertility care.",
          "American Society for Reproductive Medicine — psychological support during fertility treatment.",
          "Evidence summary — exercise intensity and ovulatory function.",
        ],
        checkFirst:
          "If you're experiencing persistent low mood, anxiety or hopelessness through this, that deserves treatment in its own right. Ask your fertility clinic for a counsellor — most have one, and it's a normal part of care rather than a sign you're not coping.",
      },
    ],
    skipTheHype: {
      remedy: "\"Egg quality\" and fertility-booster supplement stacks",
      why: "The category is enormous and the promises are specific: restore egg quality, boost ovarian reserve, double your chances. **The clinical evidence does not support any of it.** Reviews of fertility supplements in women have repeatedly found the trials small, poorly designed and inconsistent, with no reliable effect on live birth. Some ingredients — myo-inositol in PCOS, CoQ10 in specific contexts, antioxidants for some male-factor cases — have genuine but modest signals worth discussing with a specialist. What none of them can do is change ovarian reserve or unblock a tube. The real cost is time: the year spent on a `$90`-a-month stack is a year not spent in a clinic, and in fertility, time is the one input that never comes back.",
    },
    bookTitle: "The Conception Guide — evidence, timing and knowing when to get help",
    bookUrl: null,
    landingSlug: "fertility-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "erectile-sexual-health",
    name: "Erectile & sexual health",
    nameEmphasis: "& sexual health",
    icon: "heartPulse",
    category: "hormonal",
    blurb: "Often the earliest warning sign your arteries will ever give you.",
    matchRules: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagBelow: 300 },
    ],
    intro:
      "An erection is a **vascular event.** It depends on the lining of small arteries releasing nitric oxide so they can dilate and fill. Those penile arteries are considerably narrower than the coronary arteries — which means when endothelial function starts to fail, they are frequently the **first place it shows.**\n\nThat is the single most important thing on this page, and it is the part the supplement aisle never mentions. Erectile dysfunction is an independent risk marker for cardiovascular disease, and it commonly precedes a cardiac event by **`3–5` years.** It is also strongly associated with undiagnosed diabetes, high blood pressure, sleep apnoea and high cholesterol.\n\nSo the framing here isn't \"here's how to fix a bedroom problem naturally.\" It's this: **your body has handed you an early, checkable warning, and the right response is a proper cardiovascular and metabolic assessment.** Nearly everything that improves erectile function — exercise, weight, blood pressure, blood sugar, not smoking — is the same list that protects your heart, which is not a coincidence. And the prescription treatments work well, so there is no good reason to suffer through this quietly.",
    matchedIntro:
      "One of your markers is in a range that's directly relevant here — blood sugar and testosterone both bear on erectile function, and both are worth reviewing with a doctor rather than working around.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagBelow: 300 },
      { markerId: "ldl-c", label: "LDL-C", unit: "mg/dL", flagAbove: 100 },
      { markerId: "hdl-c", label: "HDL-C", unit: "mg/dL", flagBelow: 40 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    doctorBanner: {
      title: "Treat this as a cardiovascular screening trigger",
      body: "New or worsening erectile dysfunction warrants a check of blood pressure, cholesterol, blood sugar and — where relevant — testosterone. It commonly appears years before a cardiac event, and finding the reason is more valuable than working around the symptom. Sudden onset, pain, or curvature with pain needs medical assessment promptly.",
    },
    steps: [
      {
        id: "get-checked",
        title: "Get the cardiovascular and metabolic workup",
        detailTitle: "What to ask for, and why",
        why: "This symptom earns you a screening you might otherwise not have had for years — and that is the most valuable thing on this page.",
        grade: "A",
        gradeNote: "American Urological Association · Princeton Consensus",
        supervised: true,
        how: "Ask for: **blood pressure**, a **lipid panel**, **HbA1c or fasting glucose**, and a **morning total testosterone** (drawn before `10am` — it follows a daily rhythm and an afternoon result is not interpretable). Add **thyroid function** and, if you snore or wake unrefreshed, a **sleep apnoea assessment**.\n\nThe reasoning is straightforward. Erectile dysfunction is an independent predictor of cardiovascular events, and it frequently arrives **years earlier** than chest symptoms. Diabetes commonly presents this way too — undiagnosed diabetes is a leading cause, and this is sometimes how it's caught.\n\n**Say it plainly to your doctor.** This is a routine consultation for them; the awkwardness is entirely on your side of the desk, and the workup it triggers is genuinely worth it.\n\n**Low testosterone is a real but less common cause** than most marketing implies — the majority of erectile dysfunction is vascular, not hormonal. Test it, don't assume it.",
        evidence: [
          "American Urological Association — guideline on erectile dysfunction: evaluation and cardiovascular risk.",
          "Princeton Consensus Panel — sexual dysfunction and cardiac risk assessment.",
          "Evidence summary — erectile dysfunction as a predictor of subsequent cardiovascular events.",
        ],
        checkFirst:
          "Chest pain, breathlessness on exertion, or erectile dysfunction that came on suddenly needs assessment now rather than at a routine appointment. Sudden onset in a younger man, or a painful curved erection, also needs urgent urology input.",
      },
      {
        id: "meds-review",
        title: "Review your medication list with your prescriber",
        why: "A long list of common medications cause or worsen this, and a swap is often possible — but stopping one on your own is genuinely dangerous.",
        grade: "A−",
        gradeNote: "AUA guideline · pharmacological reviews",
        supervised: true,
        how: "The frequent culprits: some **blood pressure medications** (particularly older beta-blockers and thiazide diuretics), **SSRI and SNRI antidepressants**, **finasteride and dutasteride**, some **antipsychotics**, and **opioids**.\n\nBring the full list — prescription, over-the-counter and supplements — to your prescriber and ask directly: **\"could any of these be contributing, and is there an alternative?\"** Very often there is. Within blood pressure medication, for instance, different classes carry quite different profiles here.\n\n**Never stop a blood pressure medication or an antidepressant on your own.** Uncontrolled blood pressure damages the same arteries you're trying to protect, and abruptly stopping an antidepressant causes withdrawal effects and relapse. This is a swap conversation, not a stop decision.\n\nAnd be honest about **alcohol and recreational drugs** in that conversation — both are common contributors and neither gets volunteered often enough.",
        evidence: [
          "American Urological Association — erectile dysfunction guideline: medication-associated causes.",
          "Evidence summary — antihypertensive drug classes and sexual function.",
          "Evidence summary — SSRI-associated sexual dysfunction and management options.",
        ],
        checkFirst:
          "Stopping prescribed medication to improve sexual function trades a manageable problem for a dangerous one. Every change here goes through the person who prescribed it.",
      },
      {
        id: "exercise",
        title: "Exercise — the intervention with the strongest evidence",
        detailTitle: "Aerobic work, and the pelvic floor",
        why: "Aerobic exercise improves endothelial function directly, and the trials in erectile dysfunction are consistently positive.",
        grade: "A",
        gradeNote: "Meta-analyses of randomised aerobic exercise trials",
        how: "**Aerobic exercise is the best-supported non-drug treatment here.** Meta-analyses of randomised trials find clinically meaningful improvement in erectile function, with larger effects in men who are more affected to begin with. The target that shows up repeatedly: **`40` minutes of moderate-to-vigorous aerobic activity, `4` times a week**, sustained for at least `6` months.\n\nThe mechanism is the point — exercise improves the endothelium's ability to produce nitric oxide, which is the same pathway the prescription treatments act on. You are repairing the machinery rather than working around it.\n\n**Pelvic floor training has real trial evidence too**, particularly for erectile dysfunction and for post-ejaculation dribble. Roughly `3` sets of `8–12` contractions daily, taught properly — a pelvic health physiotherapist gets the technique right in one session, and technique is most of it.\n\n**Cycling:** long-distance riding on a narrow saddle can compress the perineal nerves and arteries. A cut-out or wider saddle and a saddle-height check usually resolves it. Ordinary riding is not the problem.",
        evidence: [
          "Meta-analyses of randomised controlled trials of aerobic exercise for erectile dysfunction.",
          "Randomised trials of pelvic floor muscle training in erectile dysfunction.",
          "American Urological Association — lifestyle modification in ED management.",
        ],
        checkFirst:
          "If you have known heart disease or haven't exercised in a long time, get clearance before starting vigorous training — particularly relevant here, since erectile dysfunction is itself a marker of cardiovascular risk.",
      },
      {
        id: "diet-weight",
        title: "Eat for your arteries and shift the waistline",
        why: "The Mediterranean pattern has direct randomised evidence in erectile dysfunction, and abdominal fat drives both the vascular and hormonal sides.",
        grade: "A−",
        gradeNote: "Randomised trials of Mediterranean dietary patterns",
        how: "**The Mediterranean pattern has been tested here specifically** — randomised trials in men with metabolic syndrome found improved erectile function alongside better endothelial markers and lower inflammation. Olive oil, nuts, fish, vegetables, legumes, whole grains; less ultra-processed food, less red and processed meat.\n\n**Waist circumference matters more than the scale.** Abdominal fat raises aromatase activity, which converts testosterone to oestrogen, and drives insulin resistance — so it hits both the vascular and hormonal sides at once. Weight loss trials in obese men with erectile dysfunction show meaningful improvement, and roughly a `5–10%` loss is where it starts to show.\n\n**Stop smoking.** It directly damages the endothelium and is one of the strongest modifiable risk factors. Improvement after quitting is documented.\n\n**Alcohol** is worth a plain look. It is a depressant of sexual function acutely and, in sustained heavy use, damages nerves and lowers testosterone.",
        evidence: [
          "Randomised trials of Mediterranean diet interventions and erectile function in men with metabolic syndrome.",
          "Evidence summary — weight loss interventions and erectile function in obesity.",
          "American Urological Association — smoking cessation and ED outcomes.",
        ],
        checkFirst:
          "If you have diabetes, blood sugar control is a central part of this rather than a side note — diabetic erectile dysfunction involves nerve as well as vessel damage, and it needs your diabetes team involved.",
      },
      {
        id: "sleep-apnoea",
        title: "Get sleep and sleep apnoea sorted",
        why: "Testosterone is largely produced during sleep, and untreated sleep apnoea is a common, correctable and repeatedly overlooked cause.",
        grade: "B+",
        gradeNote: "Evidence summary — sleep apnoea, sleep restriction and testosterone",
        supervised: true,
        how: "**Testosterone is secreted mainly during sleep**, peaking in the early morning. Experimental sleep restriction — around `5` hours a night for a week in healthy young men — has been shown to lower daytime testosterone substantially. Chronic short sleep is a genuine hormonal input, not a soft factor.\n\n**Obstructive sleep apnoea is the one to actively rule out.** It is strongly associated with erectile dysfunction and with low testosterone, and it is both common and very treatable. The flags: **loud snoring, witnessed pauses in breathing, waking unrefreshed, daytime sleepiness, morning headaches.** If those fit, ask for a sleep study.\n\nTreating apnoea improves erectile function in a meaningful proportion of men — which makes it one of the higher-yield things on this list if it applies to you, and completely irrelevant if it doesn't. That's exactly why it's worth ten minutes to find out.",
        evidence: [
          "Evidence summary — experimental sleep restriction and daytime testosterone in healthy men.",
          "Evidence summary — obstructive sleep apnoea, erectile dysfunction and the effect of CPAP treatment.",
          "American Academy of Sleep Medicine — clinical consequences of untreated obstructive sleep apnoea.",
        ],
        checkFirst:
          "Untreated sleep apnoea carries cardiovascular and road-safety risk well beyond sexual function. If the flags fit, that's a sleep study, not a supplement.",
      },
      {
        id: "mind-and-partner",
        title: "Take the psychological side as seriously as the vascular one",
        why: "Anxiety and vascular problems feed each other — one bad experience creates the anticipatory anxiety that guarantees the next one.",
        grade: "B+",
        gradeNote: "Evidence summary — psychosexual therapy trials",
        how: "The pattern is a loop: a physical difficulty produces an episode, the episode produces anxiety, and **anxiety is sympathetically driven — the opposite of the parasympathetic state an erection requires.** The anxiety alone can then sustain the problem after the original cause is fixed.\n\nA useful clue: **morning erections and erections during masturbation** suggest the plumbing works and the problem is more situational. Their absence points more toward a physical cause. It's a rough signal, not a diagnosis, but it helps direct the conversation.\n\n**Psychosexual therapy has trial evidence**, alone and combined with medication, and combined tends to beat either. If a relationship is under strain, couple-based work outperforms individual work.\n\n**Two honest notes.** Depression and its treatment both affect sexual function, and untangling which is which needs your prescriber. And if heavy pornography use has narrowed what you respond to, that is worth raising with a therapist — the research is genuinely contested, the clinical experience is not nothing, and it is a reasonable thing to examine.",
        evidence: [
          "Evidence summary — psychosexual and couple-based therapy trials in erectile dysfunction.",
          "American Urological Association — psychological and relationship factors in ED evaluation.",
          "Evidence summary — depression, antidepressant treatment and sexual function.",
        ],
        checkFirst:
          "If low mood, loss of interest in everything, or hopelessness sit alongside this, treat that first and with a professional. Sexual difficulty is a common feature of depression, and it usually improves as the depression does.",
      },
      {
        id: "real-treatments",
        title: "Know that the prescription treatments work — and use a real pharmacy",
        why: "PDE5 inhibitors are effective, well-studied and cheap now — and the online market for \"natural\" alternatives is genuinely contaminated.",
        grade: "A",
        gradeNote: "AUA guideline · FDA safety communications",
        supervised: true,
        how: "**PDE5 inhibitors — sildenafil, tadalafil and others — work in a large majority of men**, are extensively studied, and are now inexpensive generics. They amplify the same nitric oxide pathway that exercise improves, which is why the two combine well.\n\nThey also come with a hard safety line: **they must never be combined with nitrate medication** (for angina) or certain other drugs, because the blood pressure drop can be fatal. That is precisely why they need a prescriber, and precisely why buying them without one is not a shortcut.\n\n**Get them from a licensed pharmacy or a regulated telehealth service.** The FDA has issued repeated warnings about \"all-natural\" male enhancement products found to contain **undeclared sildenafil or tadalafil**, sometimes at unpredictable doses — which means a man avoiding a prescription for safety reasons can end up taking the same drug blind, with no dose control and no interaction check.\n\nAnd if tablets don't suit or don't work, **there are other established options** — vacuum devices, injections, and more. A urologist has a full ladder here.",
        evidence: [
          "American Urological Association — guideline on the management of erectile dysfunction.",
          "U.S. Food and Drug Administration — public notifications on tainted sexual enhancement products.",
          "Evidence summary — efficacy and safety of PDE5 inhibitors, including nitrate contraindication.",
        ],
        checkFirst:
          "Never take a PDE5 inhibitor with nitrates, and never take one bought outside a regulated pharmacy. An erection lasting more than 4 hours is a medical emergency — go to A&E, because permanent damage starts within hours.",
      },
    ],
    skipTheHype: {
      remedy: "\"Natural Viagra\" and male-enhancement pills sold online",
      why: "This is not a case of a herb that doesn't quite work — it's a case of products that frequently aren't what they say they are. **The FDA has issued hundreds of public notifications about sexual enhancement supplements found to contain undeclared prescription drugs**, usually sildenafil or tadalafil, sometimes at doses well above the therapeutic range, and sometimes alongside other hidden ingredients. The danger is exact and predictable: a man who avoids a prescription because he's worried about drug interactions ends up taking that same drug unknowingly, with no dose control — and if he takes nitrates for angina, that combination can kill him. Meanwhile the genuine finding, that his arteries need looking at, goes unexamined. If you want the drug, get it from a pharmacy with a prescriber attached. It's cheap, it's studied, and it comes with someone checking your other medications.",
    },
    bookTitle: "The Vascular Signal — erectile health as an early warning system",
    bookUrl: null,
    landingSlug: "erectile-sexual-health",
  },
];
