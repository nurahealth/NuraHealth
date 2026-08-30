// ─────────────────────────────────────────────────────────────────────────────
// Library — Pain & body.
//
// Content only. See ../types.ts for the shape and the rules every entry obeys.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const PAIN_BODY_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "migraines-headaches",
    name: "Migraines & headaches",
    nameEmphasis: "& headaches",
    icon: "brain",
    category: "pain-body",
    blurb: "Regularity prevents more attacks than any supplement does.",
    matchRules: [
      { markerId: "mg-rbc", label: "magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "ferritin", label: "ferritin", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "A migraine is not a bad headache — it's a neurological event. The migraine brain is more excitable than average, and what it reacts to is **change**: a skipped meal, a short night, a weather front, a hormonal shift.\n\nThat's why the most effective prevention is boring. Regularity of sleep, meals, fluid and caffeine removes the changes the brain is reacting to, and it does more than any supplement on this page.\n\nThe other half is knowing when to escalate. Migraine has genuinely good prescription treatments now, and the people who suffer longest are usually the ones who never took it to a doctor.",
    matchedIntro:
      "One of the nutrients with real preventive data for migraine is low on your panel.",
    signals: [
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "homocysteine", label: "Homocysteine", unit: "μmol/L", flagAbove: 10 },
    ],
    steps: [
      {
        id: "diary",
        title: "Keep a two-week headache diary before you change anything",
        detailTitle: "The two-week diary",
        why: "You cannot find a pattern you aren't recording, and most people are wrong about their own triggers.",
        grade: "B+",
        gradeNote: "American Headache Society — patient guidance",
        how: "For `14 days`, log: the date, when it started, hours slept, meals and gaps between them, caffeine, alcohol, stress, and menstrual day if that applies.\n\nThe triggers that actually show up most are **skipped meals, short sleep and a change in caffeine** — not the foods people expect.",
        extra: {
          label: "What usually isn't the trigger",
          body: "Chocolate and cheese get blamed constantly. The craving is often part of the **prodrome** — the migraine had already started hours earlier, and the food arrived after it. A diary is what separates the two.",
        },
        evidence: [
          "American Headache Society — patient guidance on headache diaries and trigger identification.",
          "NIH / NINDS — migraine information page.",
        ],
        checkFirst:
          "A headache that is the worst of your life, peaks within seconds, follows a head injury, or comes with fever, a stiff neck, weakness, confusion or vision loss is an emergency. Go — don't write it down.",
      },
      {
        id: "regularity",
        title: "Anchor sleep, meals and caffeine to the same schedule",
        why: "The migraine brain reacts to change more than to any particular substance, so removing the changes removes attacks.",
        grade: "A−",
        gradeNote: "AHS / NINDS — evidence summary",
        how: "Same wake time every day, `3 meals` without long gaps, water through the day, and **the same caffeine dose at the same time**.\n\nCaffeine withdrawal is one of the most reliable migraine triggers there is. The Saturday-morning headache is usually the Saturday lie-in plus the late coffee.",
        evidence: [
          "American Headache Society — lifestyle and trigger management guidance.",
          "NIH / NINDS — migraine information page.",
        ],
        checkFirst:
          "If you're reaching for acute painkillers `10 or more days a month` — or `15+` for simple analgesics — you may have medication-overuse headache, where the treatment is causing the problem. That needs a doctor, and stopping abruptly on your own can backfire.",
      },
      {
        id: "magnesium-migraine",
        title: "Magnesium for prevention",
        why: "Magnesium is one of the few supplements that appears by name in a neurology guideline for migraine prevention.",
        grade: "B+",
        gradeNote: "AAN / AHS guideline — Level B",
        supplement: true,
        labNote:
          "Form is the whole decision. Glycinate and citrate absorb well; oxide is cheap, poorly absorbed and mostly a laxative. Check the elemental magnesium per serving on the Lab Report — the front-of-pack number is usually the salt, not the metal.",
        how: "`400–600 mg` of elemental magnesium a day, as glycinate or citrate. Give it `8–12 weeks` before judging it.\n\nLoose stools mean the dose is too high for you — split it across the day or drop back.",
        evidence: [
          "American Academy of Neurology / American Headache Society — evidence-based guideline on NSAIDs and complementary treatments for episodic migraine prevention (magnesium rated Level B).",
          "NIH Office of Dietary Supplements — Magnesium fact sheet for health professionals.",
        ],
        checkFirst:
          "Magnesium is cleared by the kidneys — don't supplement without your doctor if yours are impaired. It also blocks absorption of some antibiotics and thyroid medication, so separate those doses by several hours.",
      },
      {
        id: "riboflavin",
        title: "Riboflavin (vitamin B2)",
        why: "Cheap, well tolerated, and carries the same guideline-level rating as magnesium for episodic migraine prevention.",
        grade: "B+",
        gradeNote: "AAN / AHS guideline — Level B",
        supplement: true,
        labNote:
          "A simple single-ingredient product is all this needs — the risk here is paying for a proprietary blend where the B2 dose is a fraction of what the trials used. Check the per-serving amount.",
        how: "`400 mg` a day, with food, for `at least 3 months`. It's a slow preventive, not something you take during an attack.\n\nIt turns urine bright yellow. That's the riboflavin, it's harmless, and it's how you know you're taking it.",
        evidence: [
          "American Academy of Neurology / American Headache Society — evidence-based guideline on migraine prevention (riboflavin rated Level B).",
          "NIH Office of Dietary Supplements — Riboflavin fact sheet for health professionals.",
        ],
        checkFirst:
          "`400 mg` is far above the dietary requirement. It's well tolerated, but clear it first if you're pregnant, breastfeeding, or taking anything for a chronic condition.",
      },
      {
        id: "treat-early",
        title: "Treat the attack early, and with the right thing",
        why: "Acute migraine treatment works far better taken in the first hour than after three hours of hoping it passes.",
        grade: "A",
        gradeNote: "American Headache Society consensus statement",
        supervised: true,
        how: "Take your acute treatment **at the first sign**, not once it's established.\n\nIf paracetamol and ibuprofen aren't touching it, that's the conversation to have: migraine-specific options — triptans, and the newer gepants and ditans — exist and are widely prescribed.",
        evidence: [
          "American Headache Society — consensus statement on integrating new migraine treatments into clinical practice.",
          "NIH / NINDS — migraine treatment overview.",
        ],
        checkFirst:
          "Triptans aren't for everyone — they're avoided in uncontrolled high blood pressure, coronary artery disease and some stroke histories. That assessment belongs to your doctor, not to a page.",
      },
      {
        id: "prevention-threshold",
        title: "Ask about prevention if you're losing four days a month",
        why: "There's a recognised threshold at which preventive treatment is offered, and most people who qualify have never been told it exists.",
        grade: "A",
        gradeNote: "AHS consensus · AAN guideline",
        supervised: true,
        how: "`4 or more` headache days a month — or any month where migraine is genuinely disabling — is the usual point to discuss prevention.\n\nBring your diary. Options range from beta-blockers and topiramate to the CGRP monoclonal antibodies, and for chronic migraine, botulinum toxin.",
        evidence: [
          "American Headache Society — consensus statement on preventive treatment thresholds.",
          "American Academy of Neurology — guideline on pharmacologic treatment for episodic migraine prevention.",
        ],
        checkFirst:
          "If you're pregnant or planning to be, say so at the start of that conversation. Several standard preventives — topiramate and valproate especially — are not safe in pregnancy.",
      },
    ],
    skipTheHype: {
      remedy: "Butterbur (Petasites)",
      why: "It genuinely has preventive data — and that's what makes it dangerous. Unpurified butterbur contains pyrrolizidine alkaloids that cause liver injury, the certified PA-free products were pulled in several countries, and you can't verify from a label which you've bought. The American Headache Society stopped recommending it for exactly this reason.",
    },
    bookTitle: "The Migraine Manual — triggers, prevention and the rescue plan",
    bookUrl: null,
    landingSlug: "migraines-headaches",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "chronic-back-pain",
    name: "Chronic back pain",
    nameEmphasis: "back pain",
    icon: "personStanding",
    category: "pain-body",
    blurb: "Bed rest is the wrong prescription, and scans mislead more than they help.",
    matchRules: [],
    intro:
      "For the overwhelming majority of back pain there is no single damaged structure to find. The pain is real; the search for a mechanical culprit usually isn't productive.\n\nThat's why the guidelines look the way they do: **stay active, keep working if you can, and skip the early scan.** Imaging in the first six weeks of non-specific back pain doesn't improve outcomes, and it reliably finds age-related changes that scare people into moving less.\n\nWhat helps is movement, time, and — for pain that has outlasted three months — a programme that treats the nervous system as well as the back.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    steps: [
      {
        id: "keep-moving-back",
        title: "Keep moving — bed rest makes it worse",
        why: "Every major back pain guideline for the last two decades has recommended staying active, and advising against prolonged rest.",
        grade: "A",
        gradeNote: "ACP guideline · NICE guidance",
        how: "Stay at work if you can, walk daily, and keep your normal routine at a reduced intensity rather than stopping.\n\n**More than `1–2 days` of bed rest actively slows recovery** — muscles deconditon fast and the fear of moving grows faster.",
        evidence: [
          "American College of Physicians — clinical practice guideline on noninvasive treatments for acute, subacute and chronic low back pain.",
          "NICE — guidance on low back pain and sciatica in over-16s.",
        ],
        checkFirst:
          "Some back pain is not ordinary back pain. Loss of bladder or bowel control, numbness in the saddle area, progressive leg weakness, fever with back pain, or pain after a significant fall or with a cancer history are all same-day assessments.",
      },
      {
        id: "no-early-scan",
        title: "Don't chase an early scan",
        detailTitle: "Why the scan can hurt you",
        why: "Imaging in the first six weeks doesn't improve outcomes, and it finds things that are normal for your age but sound alarming.",
        grade: "A",
        gradeNote: "ACP / ACR Choosing Wisely",
        how: "Unless you have a red flag, the guidelines say **no imaging in the first `6 weeks`** of non-specific low back pain.\n\nDisc bulges and degenerative changes show up on MRI in a large share of people with **no pain at all**. Finding one in you doesn't mean it's the cause — but reading the report often makes people move less, and moving less is what prolongs the pain.",
        evidence: [
          "American College of Physicians — Choosing Wisely recommendation against routine imaging for low back pain without red flags.",
          "American College of Radiology — appropriateness criteria for low back pain.",
        ],
        checkFirst:
          "Red flags change this completely: significant trauma, unexplained weight loss, fever, a history of cancer, IV drug use, steroid use, age over 50 with new pain, or any neurological deficit. Those get imaged.",
      },
      {
        id: "strengthen-back",
        title: "Build a boring, consistent exercise habit",
        why: "Exercise is the single intervention with the most consistent long-term benefit in chronic low back pain — and which kind matters far less than doing it.",
        grade: "A",
        gradeNote: "ACP guideline · Cochrane reviews",
        how: "`2–3 sessions a week`, something you'll actually keep doing: walking, swimming, Pilates, yoga, or general strength work with hips and trunk included.\n\nThe evidence does **not** favour one method over another. The best programme is the one still happening in six months.",
        evidence: [
          "American College of Physicians — clinical practice guideline (exercise recommended for chronic low back pain).",
          "Cochrane systematic reviews of exercise therapy for chronic low back pain.",
        ],
        checkFirst:
          "Pain that flares and settles within a day is expected while you build capacity. Pain that keeps climbing session on session, or new leg symptoms, means stop and get a physiotherapist to set the load.",
      },
      {
        id: "pain-education",
        title: "Learn how persistent pain actually works",
        why: "In pain lasting over three months, the nervous system's sensitivity is often a bigger driver than tissue damage — and that's treatable.",
        grade: "A−",
        gradeNote: "ACP guideline · NICE (CBT / mindfulness)",
        how: "Ask about **pain neuroscience education**, CBT for pain, or a mindfulness-based programme. Several are free or low-cost through health systems.\n\nThis isn't \"the pain is in your head\". It's that a sensitised alarm system can be turned down, and the methods for doing it have real trial data behind them.",
        evidence: [
          "American College of Physicians — guideline support for cognitive behavioural therapy and mindfulness-based stress reduction in chronic low back pain.",
          "NICE — low back pain and sciatica guidance on psychological therapies within a treatment package.",
        ],
        checkFirst:
          "If low mood or anxiety has arrived alongside the pain, say so. They amplify each other, and treating only one of them tends to fail.",
      },
      {
        id: "sleep-weight-back",
        title: "Protect sleep, and address weight if it applies",
        why: "Short sleep measurably lowers pain thresholds, and carried weight adds load to a spine that's already sensitised.",
        grade: "B+",
        gradeNote: "Evidence summary · NICE",
        how: "Run the sleep protocol in this section first — poor sleep and back pain feed each other in both directions.\n\nIf you carry extra weight, losing some reduces spinal load, but do it **with resistance training** so you keep the muscle the back depends on.",
        evidence: [
          "Evidence summary — experimental studies of sleep restriction and pain sensitivity.",
          "NICE — self-management advice within low back pain guidance.",
        ],
        checkFirst:
          "Aggressive dieting costs muscle and bone, which is the opposite of what a painful back needs. Get a dietitian involved if there's any history of disordered eating.",
      },
    ],
    skipTheHype: {
      remedy: "Spinal traction and inversion tables",
      why: "Traction is one of the few back pain treatments that guidelines specifically do not recommend — reviews consistently find no meaningful benefit over sham. Inversion tables add a genuine risk on top for anyone with high blood pressure, glaucoma or heart disease.",
    },
    bookTitle: "The Back Pain Truth — movement over rest, and what imaging can't tell you",
    bookUrl: null,
    landingSlug: "chronic-back-pain",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "gout",
    name: "Gout",
    icon: "thermometer",
    category: "pain-body",
    blurb: "A treatable disease people keep managing as a diet problem.",
    matchRules: [
      { markerId: "uric-acid", label: "uric acid", unit: "mg/dL", flagAbove: 6.8 },
    ],
    intro:
      "Gout is uric acid crystallising inside a joint. When blood uric acid stays above roughly `6.8 mg/dL`, crystals form; when they shift, the joint becomes furiously inflamed within hours.\n\nHere's the part that gets missed: **gout is a disease of the uric acid level, not of last night's dinner.** Diet moves urate by a small amount. Genetics and kidney handling do most of the work.\n\nThat matters because gout is one of the most treatable chronic diseases there is — and one of the worst treated, because people keep attacking the menu instead of the number.",
    matchedIntro:
      "Your uric acid is above the level at which crystals can form, which is why this is near the top of your list.",
    signals: [
      { markerId: "uric-acid", label: "Uric acid", unit: "mg/dL", flagAbove: 6.8 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "creatinine", label: "Creatinine", unit: "mg/dL" },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
    ],
    doctorBanner: {
      title: "Gout is treated with medication, not with a menu",
      body: "Urate-lowering therapy is the treatment that prevents attacks, joint damage and tophi. Everything on this page supports it. Nothing here is a reason to delay that conversation or to change a dose.",
    },
    steps: [
      {
        id: "get-diagnosed",
        title: "Get it properly diagnosed and get your urate number",
        why: "Not every hot toe is gout, and the whole treatment plan is built on a number most people have never been told.",
        grade: "A",
        gradeNote: "ACR gout management guideline",
        supervised: true,
        how: "Ask for a **serum urate** level and a proper diagnosis — joint fluid aspiration is the gold standard, and ultrasound or dual-energy CT are used too.\n\nThe treatment target most guidelines use is **urate below `6 mg/dL`**, and below `5` if you have tophi. Know your number and your target.",
        evidence: [
          "American College of Rheumatology — guideline for the management of gout.",
          "NIH / NIAMS — gout overview.",
        ],
        checkFirst:
          "A single hot, red, swollen, exquisitely painful joint can also be a joint infection, which destroys cartilage within days. If you have a fever with it, or a prosthetic joint, that's an emergency assessment — not a gout flare to ride out.",
      },
      {
        id: "urate-lowering",
        title: "Ask about urate-lowering therapy if flares keep coming",
        why: "Allopurinol and its alternatives prevent attacks and dissolve deposits; nothing on the food side comes close to that effect.",
        grade: "A",
        gradeNote: "ACR guideline — strong recommendation",
        supervised: true,
        how: "The usual thresholds for starting therapy are **`2 or more` flares a year, any tophi, joint damage on imaging, or gout with kidney stones or chronic kidney disease**.\n\nTwo things worth knowing so you don't quit early: it's started low and titrated to the target, and **flares can increase in the first few months** — that's expected, it's covered with prophylaxis, and it isn't a sign it's failing.",
        evidence: [
          "American College of Rheumatology — guideline for the management of gout (urate-lowering therapy indications and treat-to-target).",
          "NIH / NIAMS — gout treatment overview.",
        ],
        checkFirst:
          "Never start, stop or change a urate-lowering dose around a flare on your own. Allopurinol also needs dose care in kidney impairment, and in some ancestries an HLA-B*58:01 test is recommended before starting — your doctor will know.",
      },
      {
        id: "drinks",
        title: "Cut beer, spirits and fructose-sweetened drinks",
        why: "Of everything you consume, these three move urate the most — and unlike most \"gout foods\", the evidence here is consistent.",
        grade: "A−",
        gradeNote: "ACR guideline — conditional; consistent cohort data",
        how: "**Beer is the worst offender** — it carries purines *and* alcohol. Spirits raise urate too. Sugar-sweetened soda and fruit juice raise it through fructose.\n\nWater through the day is the easy other half. Aim for pale urine, and more in heat or after exercise.",
        extra: {
          label: "What you can stop avoiding",
          body: "**Purine-rich vegetables — spinach, asparagus, mushrooms, peas — do not raise gout risk** in the cohort data, and neither do legumes. Low-fat dairy actually associates with lower risk. The vegetable-purine rule is a myth that has cost people years of pointless restriction.",
        },
        evidence: [
          "American College of Rheumatology — guideline on lifestyle recommendations in gout.",
          "NIH / NIAMS — gout diet and lifestyle guidance.",
        ],
        checkFirst:
          "If you drink daily and heavily, stopping abruptly is a medical event in its own right. Plan that taper with a doctor.",
      },
      {
        id: "flare-plan",
        title: "Have a written flare plan before the next one",
        why: "Gout attacks start fast and peak within a day; the difference between a bad week and a bad day is having the treatment already at hand.",
        grade: "A",
        gradeNote: "ACR guideline",
        supervised: true,
        how: "Ask your doctor for a plan you can start **within the first `24 hours`** — the standard options are an NSAID, colchicine, or a steroid, chosen around your kidneys, stomach and heart.\n\nRest and ice the joint. Keep the bedsheet off it. Keep taking your urate-lowering therapy through a flare if you're already on it.",
        evidence: [
          "American College of Rheumatology — guideline on the management of gout flares.",
          "NIH / NIAMS — managing a gout attack.",
        ],
        checkFirst:
          "Colchicine has serious interactions — with clarithromycin, some antifungals, statins, and in kidney or liver impairment. NSAIDs are not for everyone either. This plan has to be written for you specifically.",
      },
      {
        id: "gout-metabolic",
        title: "Treat gout as a metabolic warning, not just a joint problem",
        why: "High urate travels with high blood pressure, insulin resistance, kidney disease and cardiovascular risk far more often than chance.",
        grade: "A−",
        gradeNote: "ACR guideline · AHA context",
        how: "Ask for a blood pressure check, a lipid panel, HbA1c and kidney function alongside your urate.\n\nOne useful detail: **losartan and some other blood pressure medicines lower urate**, while thiazide diuretics raise it. If you're already on something, that's worth reviewing with your prescriber.",
        evidence: [
          "American College of Rheumatology — guideline discussion of comorbidities in gout.",
          "American Heart Association — cardiovascular risk factor assessment guidance.",
        ],
        checkFirst:
          "Never change a blood pressure medication yourself on the basis of its effect on urate. Raise it as a question; the swap is your prescriber's decision.",
      },
    ],
    skipTheHype: {
      remedy: "Tart cherry juice and cherry extract",
      why: "It's the most-recommended gout remedy on the internet and the evidence is thin — small, mostly observational, and the ACR does not recommend it. It's also frequently sold as a sweetened juice, and fructose raises urate. If you enjoy cherries, eat cherries; don't treat gout with them.",
    },
    bookTitle: "The Gout Handbook — purines, urate and the myths that keep flares coming",
    bookUrl: null,
    landingSlug: "gout",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "muscle-cramps-spasms",
    name: "Muscle cramps & spasms",
    nameEmphasis: "& spasms",
    icon: "dumbbell",
    category: "pain-body",
    blurb: "Mostly nerve, not mostly minerals — and that changes what works.",
    matchRules: [
      { markerId: "mg-rbc", label: "magnesium RBC", unit: "mg/dL", flagBelow: 6 },
    ],
    intro:
      "The popular story is dehydration and low electrolytes. The research has moved: exercise-associated cramp looks mostly like **premature muscle fatigue and over-excitable nerves**, not a mineral deficit.\n\nThat explains a lot — why cramps hit the muscle you just worked hardest, why they start near the end of an effort, and why drinking more doesn't reliably stop them.\n\nIt also changes the fix. Stretching, load management and — oddly — strong flavours that stimulate nerve endings in the mouth do more than another scoop of electrolytes.",
    matchedIntro: "Your magnesium is on the low side, which is worth correcting on its own merits.",
    signals: [
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "creatinine", label: "Creatinine", unit: "mg/dL" },
    ],
    steps: [
      {
        id: "stretch",
        title: "Stretch the cramping muscle — during and afterwards",
        why: "Passive stretching is the fastest way to stop a cramp in progress, and the most consistent thing that reduces the next one.",
        grade: "B+",
        gradeNote: "ACSM — evidence summary",
        how: "In the moment: straighten the leg and pull the toes toward your shin for a calf cramp; hold `20–30 seconds` and repeat.\n\nAs prevention, stretch the muscles that cramp on you **daily**, especially before bed if the cramps come at night.",
        evidence: [
          "American College of Sports Medicine — position and consensus material on exercise-associated muscle cramps.",
          "Evidence summary — trials of stretching for nocturnal leg cramps.",
        ],
        checkFirst:
          "Cramping with dark or cola-coloured urine after hard exercise is rhabdomyolysis territory and needs urgent assessment. So does a calf that is swollen, hot and painful at rest — that can be a clot, not a cramp.",
      },
      {
        id: "load",
        title: "Manage the load that triggers them",
        why: "Cramps cluster around efforts that are new, longer, or harder than what you're conditioned for — which is a training problem, not a hydration one.",
        grade: "B+",
        gradeNote: "Evidence summary — sports medicine literature",
        how: "Build distance or intensity by roughly `10% a week`, not in jumps. Cramps in the last third of an event usually mean the event was longer than the training.\n\nStrength work for the muscles that cramp raises the threshold at which they misfire.",
        evidence: [
          "Evidence summary — sports medicine research on the neuromuscular fatigue model of exercise-associated cramping.",
          "American College of Sports Medicine — training progression guidance.",
        ],
        checkFirst:
          "Cramps plus muscle weakness, or cramps that started within weeks of a new medication, deserve a doctor. Statins, diuretics and some asthma medicines are known causes.",
      },
      {
        id: "fluid-salt",
        title: "Fix fluid and sodium if you're a heavy sweater",
        why: "Dehydration isn't the main cause of most cramps, but in long efforts in heat with heavy salt loss it genuinely contributes.",
        grade: "B",
        gradeNote: "Evidence summary — mixed findings",
        how: "This applies to endurance in heat, not to a cramp on the sofa. Drink to thirst and add sodium during efforts over about `90 minutes`.\n\n**Salty sweat leaves white marks on your kit** — if that's you, an electrolyte drink is reasonable. If it isn't, more fluid probably won't change anything.",
        evidence: [
          "Evidence summary — trials of hydration and electrolyte replacement for exercise-associated cramp; findings are inconsistent.",
          "American College of Sports Medicine — fluid replacement guidance for exercise.",
        ],
        checkFirst:
          "Overdrinking plain water in long events causes hyponatraemia, which is more dangerous than the cramp. If you have heart, kidney or blood pressure conditions, get your sodium target from your doctor.",
      },
      {
        id: "magnesium-cramp",
        title: "Magnesium — honestly, only if you're low",
        why: "It's the default recommendation everywhere, and the trial evidence for cramps in the general population is weak.",
        grade: "B",
        gradeNote: "Cochrane — evidence summary",
        supplement: true,
        labNote:
          "Glycinate and citrate absorb; oxide mostly doesn't. Check the elemental magnesium per serving on the Lab Report rather than the headline number.",
        how: "Cochrane reviews of magnesium for cramps in older adults found **no meaningful benefit**, and the pregnancy data is mixed.\n\nIf your level is genuinely low, correcting it is worth doing for other reasons: `200–400 mg` of elemental magnesium as glycinate, with food. Judge it at `4 weeks`, then stop if nothing changed.",
        evidence: [
          "Cochrane systematic review of magnesium for skeletal muscle cramps.",
          "NIH Office of Dietary Supplements — Magnesium fact sheet for health professionals.",
        ],
        checkFirst:
          "Not without your doctor if you have reduced kidney function. Separate it by several hours from antibiotics and thyroid medication.",
      },
      {
        id: "night-cramps",
        title: "Night cramps: rule out the causes that aren't muscles",
        why: "Nocturnal cramps have a specific list of medical causes, and several are easy to find and fix.",
        grade: "A−",
        gradeNote: "Evidence summary — clinical review literature",
        supervised: true,
        how: "Worth checking with your doctor: **thyroid function, kidney function, blood sugar, vitamin D**, and a review of your medications — diuretics, statins, some asthma inhalers and certain blood pressure drugs all cause cramps.\n\nAlso worth naming: restless legs syndrome and peripheral artery disease both get mistaken for night cramps and have completely different treatments.",
        evidence: [
          "Evidence summary — clinical reviews of nocturnal leg cramps and secondary causes.",
          "NIH / NINDS — restless legs syndrome information page.",
        ],
        checkFirst:
          "Quinine is still sometimes suggested for night cramps. The FDA has warned against it for this use — serious blood disorders have occurred, and it is not approved for cramps.",
      },
    ],
    skipTheHype: {
      remedy: "Pickle juice as an electrolyte fix",
      why: "The odd part is that it does seem to help — but not for the reason it's sold. The volume is far too small and too fast to replace electrolytes; the working theory is that the strong flavour triggers a reflex in the mouth and throat that damps the nerve firing. Fine as a trick. It is not rehydration.",
    },
    bookTitle: "The Cramp Guide — electrolytes, nerves and what actually stops them",
    bookUrl: null,
    landingSlug: "muscle-cramps-spasms",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "plantar-fasciitis",
    name: "Plantar fasciitis",
    nameEmphasis: "fasciitis",
    icon: "footprints",
    category: "pain-body",
    blurb: "Slow to settle, and stretching alone rarely finishes the job.",
    matchRules: [],
    intro:
      "The signature is unmistakable: the first few steps out of bed hurt sharply under the heel, ease as you move, and come back after sitting.\n\nDespite the name, it isn't really inflammation. It's a degenerative overload of the plantar fascia where it attaches to the heel — which is why anti-inflammatories give short-lived relief and loading gives lasting relief.\n\nThe honest headline: **most cases resolve, and most take `6–12 months`.** Knowing that in advance is what stops people cycling through six treatments in eight weeks.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "uric-acid", label: "Uric acid", unit: "mg/dL", flagAbove: 7 },
    ],
    steps: [
      {
        id: "morning-stretch",
        title: "Stretch the fascia before your first steps",
        why: "The fascia tightens overnight, and the first steps re-tear it — stretching before you stand is what breaks that cycle.",
        grade: "A−",
        gradeNote: "APTA clinical practice guideline",
        how: "Before you get up: pull your toes back toward your shin and hold `30 seconds`, three times.\n\nRepeat after any long sit. **Plantar-fascia-specific stretching outperformed generic calf stretching** in the trials — pulling the toes back is the part that matters.",
        evidence: [
          "American Physical Therapy Association — clinical practice guideline on heel pain / plantar fasciitis.",
          "Evidence summary — randomised trials of plantar-fascia-specific stretching.",
        ],
        checkFirst:
          "Heel pain that's numb, burning or shooting into the foot may be a nerve problem rather than the fascia, and it's treated differently. Pain after a sudden pop during activity needs urgent assessment.",
      },
      {
        id: "loading",
        title: "Load it — high-load strength beats stretching alone",
        why: "Stretching manages the symptom; progressive loading changes the tissue, and it's the step most people never get to.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials",
        how: "Heel raises on a step with the toes propped up on a rolled towel, going slowly up and slowly down.\n\nStart at `3 sets of 12`, **every other day**, and add load in a backpack as it gets easier. Some discomfort during is acceptable; it should settle within `24 hours`.",
        evidence: [
          "Evidence summary — randomised trials comparing high-load strength training with plantar-fascia stretching.",
          "American Physical Therapy Association — heel pain guideline (exercise and loading).",
        ],
        checkFirst:
          "If you have diabetes with any nerve or circulation involvement in the feet, get a clinician to set this rather than self-prescribing load. Foot injuries there behave very differently.",
      },
      {
        id: "footwear",
        title: "Change what's under your foot all day",
        why: "The fascia is loaded with every step you take, so the surface and support you spend the most hours on matters more than any single exercise.",
        grade: "B+",
        gradeNote: "APTA guideline — orthoses",
        how: "**Stop walking barefoot on hard floors** while it's angry — that's the most common thing keeping it going. Supportive shoes indoors too.\n\nOff-the-shelf arch supports are recommended in the guideline and perform about as well as custom ones for this. Try them for `2–4 weeks` before spending on custom.",
        evidence: [
          "American Physical Therapy Association — heel pain guideline (foot orthoses recommended).",
          "Cochrane systematic reviews of custom versus prefabricated orthoses for plantar heel pain.",
        ],
        checkFirst:
          "If one foot has changed shape, collapsed, or become warm and swollen — especially with diabetes — that needs urgent assessment rather than an insole.",
      },
      {
        id: "night-splint",
        title: "Try a night splint if mornings are the worst part",
        why: "It holds the fascia at length overnight so the first steps aren't re-tearing a shortened tissue.",
        grade: "B",
        gradeNote: "APTA guideline — conditional",
        how: "Worn overnight for `1–3 months`, most useful for people whose main complaint is that first-step pain.\n\nThey're bulky and sleep quality often suffers, which is the usual reason people abandon them. A softer sock-style version is a reasonable compromise.",
        evidence: [
          "American Physical Therapy Association — heel pain guideline (night splints, conditional recommendation).",
          "Evidence summary — trials of night splinting for plantar heel pain.",
        ],
        checkFirst:
          "Not appropriate if you have peripheral neuropathy or circulation problems in the feet — a device you can't feel pressing is a device that can cause a sore you don't notice.",
      },
      {
        id: "escalate-foot",
        title: "Give it months, then escalate properly",
        why: "There are real second-line options, and the mistake is either quitting the basics at six weeks or never escalating at all.",
        grade: "B+",
        gradeNote: "APTA guideline · orthopaedic society guidance",
        supervised: true,
        supplement: false,
        how: "Run the loading, footwear and stretching consistently for `3 months` before judging it.\n\nIf you're still stuck, options with real evidence include extracorporeal shockwave therapy and a supervised physiotherapy programme. **Steroid injection gives short-term relief but carries a fascia rupture and fat-pad atrophy risk** — that's a considered decision, not a first move.",
        evidence: [
          "American Physical Therapy Association — heel pain clinical practice guideline (shockwave therapy).",
          "Evidence summary — orthopaedic society guidance on corticosteroid injection risks in plantar fasciitis.",
        ],
        checkFirst:
          "Heel pain in both feet, or with morning stiffness in the back and other joints, can point at an inflammatory arthritis rather than overload. That needs a rheumatology opinion, not another insole.",
      },
    ],
    skipTheHype: {
      remedy: "Rolling your foot on a frozen bottle as the treatment",
      why: "It feels good and it's harmless, so use it — but it's pain relief for a few minutes, not a treatment. It doesn't load the tissue, and the trials that changed outcomes were all about stretching, orthoses and progressive strength work. Rolling instead of loading is the most common way people stay stuck for a year.",
    },
    bookTitle: "The Plantar Fasciitis Fix — loading, not resting",
    bookUrl: null,
    landingSlug: "plantar-fasciitis",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Companion page. Fibromyalgia is a real, diagnosable condition managed by a
  // clinician; nothing here treats it. The evidence-based core is movement,
  // sleep and pain education — in that order.
  {
    slug: "fibromyalgia-companion",
    name: "Fibromyalgia companion",
    nameEmphasis: "companion",
    icon: "network",
    category: "pain-body",
    blurb: "Real pain from a real mechanism — and the plan starts smaller than you'd expect.",
    matchRules: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "Fibromyalgia is widespread pain lasting months, with fatigue, unrefreshing sleep and cognitive difficulty — \"fibro fog\" — alongside it. It affects roughly `2–4%` of people, most often women, and it is a **recognised diagnosis with defined criteria**, not a label for pain nobody can explain.\n\nThe mechanism has a name: **nociplastic pain**, or central sensitisation. The problem isn't damage in the muscles and joints where you feel it — imaging is usually normal, which is exactly why people get dismissed. The problem is in how the central nervous system **processes** pain signals. The volume is turned up: ordinary sensations register as painful, and painful ones register as worse. Brain imaging studies show measurably altered pain processing.\n\n**That is the sentence worth carrying out of here: the pain is real, the mechanism is real, and \"nothing showed up on the scan\" is consistent with the diagnosis rather than an argument against it.**\n\nWhat follows is companion support alongside a clinician who is managing this. The interventions with the strongest evidence are unglamorous — graded movement, sleep, pain education, and psychological approaches aimed at the nervous system's volume control rather than at your character.",
    matchedIntro:
      "Your vitamin D is low, which is common in widespread pain and worth correcting on its own merits. It is not the cause of fibromyalgia, and correcting it won't resolve it — but low vitamin D adds its own muscle aching and fatigue, and there's no reason to carry both.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
    ],
    pillarRule: { key: "recovery", label: "Recovery", below: 60 },
    doctorBanner: {
      title: "Get the diagnosis made properly first",
      body: "Widespread pain has other causes — inflammatory arthritis, polymyalgia rheumatica, thyroid disease, vitamin D deficiency, and some medication side effects among them. Several are treatable in ways fibromyalgia isn't. This page supports care alongside a clinician; it doesn't diagnose and it doesn't treat.",
    },
    steps: [
      {
        id: "diagnosis",
        title: "Get it named — and get the mimics ruled out",
        detailTitle: "Why the diagnosis itself helps",
        why: "Widespread pain has several treatable causes that look similar, and being given a name is itself associated with better outcomes.",
        grade: "A−",
        gradeNote: "EULAR recommendations · American College of Rheumatology criteria",
        supervised: true,
        how: "Fibromyalgia is diagnosed **clinically**, on criteria: widespread pain across defined body regions for at least `3` months, with fatigue, unrefreshing sleep and cognitive symptoms. **There is no blood test that confirms it** — and beware anyone selling one.\n\nBloods are done to exclude the mimics: **thyroid function, full blood count, inflammatory markers (CRP/ESR), vitamin D, calcium and creatine kinase**, with more depending on the picture. Inflammatory arthritis, polymyalgia rheumatica, hypothyroidism and statin-related muscle problems all present similarly and are managed completely differently.\n\n**The old tender-point exam is outdated.** Current criteria don't require it, so a clinician pressing eighteen points is working from a superseded version.\n\nAnd this is worth knowing: **receiving the diagnosis is itself associated with better outcomes** — fewer investigations, less distress. Being told what you have ends a search that is exhausting in its own right.",
        extra: {
          label: "What travels alongside it",
          body: "Fibromyalgia frequently coexists with **IBS, migraine, endometriosis, restless legs, sleep apnoea, anxiety and depression.** Several of those are separately treatable, and treating them meaningfully lowers total load. It also commonly sits alongside inflammatory disease — having rheumatoid arthritis does not exclude having fibromyalgia too, and conflating the two leads to years of escalating the wrong treatment.",
        },
        evidence: [
          "EULAR — revised recommendations for the management of fibromyalgia.",
          "American College of Rheumatology — fibromyalgia diagnostic criteria (2010/2016 revisions).",
          "Evidence summary — impact of formal diagnosis on healthcare utilisation and patient distress in fibromyalgia.",
        ],
        checkFirst:
          "New weakness, joint swelling, fever, weight loss, or pain that started suddenly is not fibromyalgia's pattern and needs investigating. So does new severe pain and stiffness in the shoulders and hips over 50 — polymyalgia rheumatica is very treatable and easy to miss.",
      },
      {
        id: "movement",
        title: "Move — start absurdly small, and go up slowly",
        detailTitle: "The intervention with the best evidence",
        why: "Exercise has the strongest evidence base in fibromyalgia of anything, medication included — and doing too much too soon is the most common reason people abandon it.",
        grade: "A",
        gradeNote: "EULAR — strong recommendation · Cochrane reviews",
        how: "**EULAR gives exercise its only strong recommendation** in fibromyalgia. Cochrane reviews support aerobic and resistance training for pain, function and quality of life.\n\n**Start smaller than feels worth doing.** `5` minutes of walking. Two or three exercises with light resistance. If that sounds pointless, it's probably the right starting dose — the classic pattern is a good week, an ambitious session, a flare, and then giving up on exercise entirely.\n\n**Increase by around `10%` a week**, and hold when you flare rather than quitting.\n\n**Warm water works well** — pool-based exercise has particularly good evidence here, because warmth eases the muscular pain and buoyancy lowers the load.\n\n**Consistency beats intensity, always.** Ten minutes most days beats an hour on Saturday, and by a wide margin in this condition.\n\n**Expect it to hurt more at first.** Increased pain in the early weeks is normal and does not mean damage — a fact worth having in advance, because without it most people stop in week two.",
        extra: {
          label: "Fibromyalgia and ME/CFS are not the same here",
          body: "If you have **post-exertional malaise** — a delayed crash `12–72` hours after exertion — that changes the plan and the pacing approach applies instead. The two conditions overlap and are often confused, but graded exercise is appropriate in fibromyalgia and not in PEM-predominant illness. If you're unsure which describes you, say the words \"post-exertional malaise\" to your clinician and let them sort it out before you start.",
        },
        evidence: [
          "EULAR — revised recommendations for the management of fibromyalgia: exercise as the sole strong recommendation.",
          "Cochrane systematic reviews — aerobic and resistance exercise for fibromyalgia.",
          "Cochrane review — aquatic exercise training for fibromyalgia.",
        ],
        checkFirst:
          "If you have heart or lung disease, or haven't exercised in a long time, get clearance first. And if exertion reliably causes a delayed crash lasting days, stop and discuss post-exertional malaise before continuing a graded programme.",
      },
      {
        id: "sleep",
        title: "Treat sleep as a pain intervention",
        why: "Poor sleep measurably lowers pain thresholds the next day, and in fibromyalgia the two run in a self-reinforcing loop.",
        grade: "A−",
        gradeNote: "Evidence summary — sleep restriction and pain sensitivity · CBT-I trials",
        how: "Experimental studies are consistent: **restricting sleep lowers pain tolerance in healthy people the following day.** In fibromyalgia, unrefreshing sleep and pain feed each other, and breaking into that loop at the sleep end is often more productive than attacking the pain directly.\n\n**CBT-I — cognitive behavioural therapy for insomnia — is the first-line treatment for chronic insomnia** and has trials specifically in fibromyalgia showing improvements in both sleep and pain. It is more effective than sleeping tablets and it lasts. Ask for a referral or a digital programme.\n\n**The basics still matter:** a consistent wake time (more important than bedtime), a cool dark room, morning light, and getting out of bed if you're lying awake.\n\n**Screen for sleep apnoea and restless legs.** Both are more common here and both are treatable — restless legs in particular has a specific ferritin threshold worth checking.\n\n**Alcohol is a poor trade.** It shortens sleep onset and fragments the second half of the night, which is where the restorative sleep you're short of lives.",
        evidence: [
          "Evidence summary — experimental sleep restriction and reduced pain thresholds.",
          "Randomised trials of CBT-I in fibromyalgia: effects on sleep and pain outcomes.",
          "American Academy of Sleep Medicine — CBT-I as first-line treatment for chronic insomnia.",
        ],
        checkFirst:
          "Loud snoring, witnessed breathing pauses or severe daytime sleepiness need a sleep study rather than sleep hygiene. Untreated apnoea makes every part of this worse and it's genuinely common.",
      },
      {
        id: "pain-education",
        title: "Learn how the pain system works — it changes the pain",
        detailTitle: "Pain neuroscience education",
        why: "Understanding that pain output isn't a direct readout of tissue damage measurably reduces pain and disability — this is one of the more surprising well-supported findings in the field.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials of pain neuroscience education",
        how: "**Pain is produced by the brain, not delivered by the tissues.** It's an output — the nervous system's assessment of threat — and in nociplastic pain the assessment system has become over-protective. That's why hurt does not reliably equal harm in fibromyalgia, and why movement can be safe while painful.\n\n**Randomised trials of pain neuroscience education** — structured teaching about how the pain system works — show reductions in pain, disability and fear of movement. Understanding the mechanism is itself part of the treatment, which is not true of most conditions.\n\n**Where to get it:** an NHS or hospital pain management programme, a physiotherapist trained in persistent pain, or reputable pain-science resources. The book *Explain Pain* and the **Curable** and **Retrain Pain** style programmes work from this evidence base.\n\n**The critical distinction:** this says the pain-processing system is over-protective. It does **not** say the pain is imagined, exaggerated or your fault. Anyone presenting it that way has misunderstood it, and you're entitled to say so.",
        evidence: [
          "Evidence summary — randomised trials and systematic reviews of pain neuroscience education in chronic pain.",
          "EULAR — recommendations on patient education in fibromyalgia management.",
          "Evidence summary — central sensitisation and altered pain processing on functional imaging in fibromyalgia.",
        ],
        checkFirst:
          "Pain education is for pain that has already been assessed. New pain, or a clear change in an established pattern, still needs looking at — persistent pain doesn't make you immune to new problems.",
      },
      {
        id: "psychological",
        title: "Use the psychological therapies for what they actually do",
        why: "CBT and ACT have real evidence in fibromyalgia — for function and distress — and the reason people refuse them is a misunderstanding worth clearing up.",
        grade: "A−",
        gradeNote: "EULAR — recommended · Cochrane reviews",
        how: "**Why people bristle:** being offered therapy for pain reads as \"they think it's in my head\", especially after years of being dismissed. That reading is understandable and it's wrong. These therapies target the nervous system's threat processing and the practical business of living with pain — the same reason they're offered in cancer pain, which nobody suggests is imaginary.\n\n**CBT for chronic pain** has consistent evidence for improving function, mood and distress, and modest evidence for pain itself.\n\n**ACT — acceptance and commitment therapy** — focuses on doing what matters to you alongside the pain rather than waiting for it to go. It's a good fit for a condition without a cure.\n\n**Mindfulness-based stress reduction** has trial evidence in fibromyalgia too.\n\nRealistic framing: these usually improve **function and quality of life more than they lower pain scores.** That is still a large amount of life back, and it's a fair thing to know going in.",
        evidence: [
          "EULAR — revised recommendations for the management of fibromyalgia: psychological therapies.",
          "Cochrane systematic reviews — psychological therapies for fibromyalgia and chronic pain.",
          "Evidence summary — acceptance and commitment therapy and mindfulness-based interventions in fibromyalgia.",
        ],
        checkFirst:
          "Depression and anxiety are common alongside fibromyalgia and are separately treatable. If low mood, hopelessness or thoughts of self-harm are present, that needs treatment in its own right and it needs it now.",
      },
      {
        id: "pacing-flares",
        title: "Pace the good days, and have a flare plan written down",
        why: "Boom-and-bust is the most common self-defeating pattern in fibromyalgia, and flares are far less frightening when the response is decided in advance.",
        grade: "B+",
        gradeNote: "Evidence summary — activity pacing in chronic pain",
        how: "**The boom-and-bust loop:** a good day arrives, you catch up on everything you've been unable to do, and you pay for it for three days. Repeat, and your overall capacity falls.\n\n**Pace by time, not by feel.** Decide in advance — `20` minutes of a task, then a break, regardless of whether you feel fine at `20` minutes. Feeling fine is precisely when the trap springs.\n\n**Write a flare plan while you're well.** What you drop, what you keep, what helps (heat, gentle movement, rest, a bath), who you tell, and when you'd contact your clinician. Flares are far less frightening when the plan already exists and you don't have to think it up while in pain.\n\n**Keep moving during a flare, at a reduced dose.** Complete rest tends to lengthen them. Half the usual walk beats none.\n\n**Heat helps many people** — baths, heat packs, warm pools. Cheap, safe, worth using.",
        evidence: [
          "Evidence summary — activity pacing interventions in chronic pain populations.",
          "EULAR — self-management and multimodal approaches in fibromyalgia.",
          "Evidence summary — heat therapy and warm-water immersion for musculoskeletal pain.",
        ],
        checkFirst:
          "A flare that doesn't settle in the usual way, or that comes with new symptoms — swelling, fever, weakness, numbness — needs medical review rather than the flare plan.",
      },
      {
        id: "supplements-meds",
        title: "Supplements and medication — the honest ranking",
        why: "This is a heavily targeted market, and knowing what has evidence saves both money and hope.",
        grade: "B",
        gradeNote: "Evidence summary — small trials, inconsistent results",
        supplement: true,
        labNote:
          "The fibromyalgia supplement market is full of expensive proprietary blends with no trials behind the finished product. If you trial anything here, prefer single ingredients with a declared dose and check the Purity Score — a blend that hides doses inside a \"proprietary matrix\" can't be evaluated at all.",
        how: "**Worth correcting if low:** **vitamin D** (deficiency causes its own muscle aching and is common here) and **B12 and iron** if the workup found them low. Real, cheap, and not a treatment for fibromyalgia.\n\n**Modest and mixed evidence:** **magnesium** — small trials, plausible mechanism, safe to trial for a month at `200–400 mg` elemental. **Coenzyme Q10** — a few small positive trials, not established. **Omega-3** — general anti-inflammatory support, not specific here.\n\n**Not supported despite heavy marketing:** most proprietary \"fibro\" blends, high-dose antioxidant stacks, and detox protocols.\n\n**On medication**, so you know the landscape: **duloxetine, milnacipran, pregabalin and low-dose amitriptyline** have the best evidence, and they work through the central nervous system, which fits the mechanism. **Opioids are not recommended** — they perform poorly in nociplastic pain and carry real harm. **NSAIDs and paracetamol are largely ineffective** here, which surprises people and is worth knowing before you spend years on them.",
        evidence: [
          "EULAR — pharmacological recommendations in fibromyalgia, including advice against opioids.",
          "Cochrane systematic reviews — duloxetine, pregabalin and amitriptyline for fibromyalgia.",
          "Evidence summary — magnesium, CoQ10 and vitamin D trials in fibromyalgia.",
        ],
        checkFirst:
          "Never start or stop a prescribed medication based on this page. Duloxetine and pregabalin both need supervised tapering, and opioid reduction in particular has to be planned with your prescriber rather than attempted alone.",
      },
    ],
    skipTheHype: {
      remedy: "Expensive \"fibromyalgia detox\" and proprietary supplement protocols",
      why: "The pitch is familiar: fibromyalgia is caused by toxins, mould, parasites or heavy metals, and a multi-month protocol of proprietary supplements, chelation or colonics will clear it. **There is no evidence that fibromyalgia is a toxic or infectious condition**, and no trial showing any detox protocol improves it. Some of the interventions carry direct risk — chelation therapy has caused deaths, and colonic irrigation has caused bowel perforation. The pattern is what marks it out: an unfalsifiable cause, a proprietary product, and relapse blamed on the patient's incomplete adherence. Meanwhile the interventions that genuinely work in this condition — graded movement, sleep treatment, pain education — are inexpensive, unglamorous and have nobody selling them.",
    },
    bookTitle: "The Fibromyalgia Companion — turning down the volume on persistent pain",
    bookUrl: null,
    landingSlug: "fibromyalgia-companion",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Doctor-forward because the cause dictates everything. Diabetic neuropathy,
  // B12 deficiency and a compressive lesion are three different problems that
  // present identically and are managed nothing alike.
  {
    slug: "peripheral-neuropathy-companion",
    name: "Peripheral neuropathy companion",
    nameEmphasis: "companion",
    icon: "cable",
    category: "pain-body",
    blurb: "The cause decides everything — and some causes are reversible if caught early.",
    matchRules: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 300 },
    ],
    intro:
      "Peripheral neuropathy is damage to the nerves outside the brain and spinal cord. The classic presentation is **symmetrical, starting in the feet and moving upward** — the \"stocking and glove\" pattern — because the longest nerves fail first. Numbness, burning, pins and needles, electric-shock pains, and often worse at night.\n\nThe single most important thing about it is that **it is a symptom of something, and the something dictates the entire plan.** Diabetes and prediabetes are the most common causes in developed countries. But **B12 deficiency, thyroid disease, alcohol, chemotherapy, some antibiotics and other medications, kidney disease, autoimmune conditions and vitamin B6 toxicity** all cause it too — and several of those are **reversible if caught early and permanent if not.**\n\nThat's the argument for urgency. Nerves regenerate slowly, roughly a millimetre a day at best, and the window for recovery narrows with time. Two years of assuming it's \"just getting older\" while an undiagnosed B12 deficiency runs is how reversible damage becomes permanent.\n\nThis page supports care — it doesn't diagnose the cause, and finding the cause is the work that matters most.",
    matchedIntro:
      "One of your markers is directly relevant to nerve health — blood sugar and B12 are the two most common correctable causes of peripheral neuropathy. That's a specific thing to raise with your doctor rather than a general concern.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "glucose", label: "Fasting glucose", unit: "mg/dL", flagAbove: 100 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "mma", label: "Methylmalonate", unit: "nmol/L", flagAbove: 270 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "folate", label: "Folate", unit: "ng/mL", flagBelow: 4 },
    ],
    doctorBanner: {
      title: "Find the cause — several are reversible",
      body: "Peripheral neuropathy always needs a medical workup. B12 deficiency, thyroid disease, diabetes and some medication effects are treatable, and treating them early can prevent permanent nerve damage. Sudden onset, rapidly progressive weakness, symptoms on one side only, or bladder and bowel changes are urgent — those patterns suggest something other than a slow metabolic neuropathy.",
    },
    steps: [
      {
        id: "find-cause",
        title: "Get the cause identified — this is the whole page",
        detailTitle: "The workup that decides everything else",
        why: "Diabetic, B12-related, alcohol-related and compressive neuropathies present identically and are managed completely differently.",
        grade: "A",
        gradeNote: "American Academy of Neurology · AAN diagnostic guideline",
        supervised: true,
        how: "A standard first-line workup: **HbA1c or a glucose tolerance test, B12 (with MMA if borderline), thyroid function, full blood count, kidney and liver function, and serum protein electrophoresis.** More follows depending on the picture, and **nerve conduction studies** may be arranged.\n\n**Why the glucose tolerance test specifically:** neuropathy can appear in **prediabetes**, before HbA1c crosses the diabetes threshold. A normal HbA1c doesn't clear blood sugar as the cause, and this is a common miss.\n\n**Bring your full medication and supplement list.** Some chemotherapy agents, metronidazole, isoniazid, some HIV medications and — importantly — **high-dose vitamin B6** all cause neuropathy. B6 toxicity is the one people give themselves: doses above roughly `100 mg` daily, taken for months in an ordinary B-complex or \"energy\" supplement, can damage nerves, and it is often missed because nobody thinks to ask about supplements.\n\n**Be honest about alcohol.** It is a leading cause and the conversation only works if it's accurate.",
        extra: {
          label: "When it isn't the usual pattern",
          body: "Symptoms that are **asymmetrical**, start in the hands rather than the feet, come on rapidly, or include significant weakness point away from the common metabolic causes and toward something needing faster assessment — inflammatory neuropathies, nerve compression, or a spinal problem. Rapidly ascending weakness is an emergency. The stocking-and-glove pattern is the reassuring-in-context one.",
        },
        evidence: [
          "American Academy of Neurology — evidence-based guideline on the evaluation of distal symmetric polyneuropathy.",
          "NIH / NINDS — peripheral neuropathy: causes and diagnosis.",
          "NIH Office of Dietary Supplements — vitamin B6: sensory neuropathy at high chronic intakes.",
        ],
        checkFirst:
          "Rapidly progressive weakness, weakness spreading upward over days, symptoms on one side only, or new bladder or bowel changes need urgent medical assessment — not a supplement and not a wait-and-see.",
      },
      {
        id: "treat-cause",
        title: "Treat the cause hard — that's what protects the nerves",
        why: "Nothing on this page slows nerve damage the way addressing the underlying cause does.",
        grade: "A",
        gradeNote: "ADA Standards of Care · AAN guidance",
        supervised: true,
        how: "**If it's diabetes:** tight glucose control is the intervention with the strongest evidence for preventing progression — and the evidence is much stronger in **type 1** than type 2, which is worth knowing so the expectations are right. It reliably slows progression; it does not usually reverse established damage. Blood pressure and lipids matter too, since the small blood vessels supplying nerves are part of the mechanism.\n\n**If it's prediabetes:** this is the best-case scenario, because lifestyle change at this stage may genuinely improve small-fibre neuropathy. Weight loss and exercise have evidence here.\n\n**If it's B12:** replacement, promptly, via the route your doctor decides. Early B12 neuropathy can recover substantially; long-standing damage often doesn't. **This is the one where speed matters most.**\n\n**If it's alcohol:** stopping halts progression and some recovery is possible. Thiamine and other B vitamins are usually given alongside, under supervision.\n\n**If it's a medication:** never stop it yourself — some are essential and some have alternatives. That's a prescriber conversation, and often an urgent one.",
        evidence: [
          "American Diabetes Association — Standards of Medical Care: neuropathy screening and management.",
          "Evidence summary — glycaemic control and progression of distal symmetric polyneuropathy in type 1 versus type 2 diabetes.",
          "British Society for Haematology — treatment of cobalamin deficiency with neurological involvement.",
        ],
        checkFirst:
          "Don't stop chemotherapy or any other prescribed medication because of neuropathy. Tell your team — dose adjustments and alternatives exist, and unilateral stopping can be dangerous.",
      },
      {
        id: "foot-care",
        title: "Protect your feet — daily, without exception",
        detailTitle: "The step that prevents amputations",
        why: "Numbness removes the warning system, and an unnoticed injury on an insensate foot is how ulcers and amputations begin.",
        grade: "A",
        gradeNote: "ADA Standards of Care — strong recommendation",
        supervised: true,
        how: "This is the highest-stakes practical item in the entire condition, and it is unglamorous.\n\n**Look at your feet every single day** — tops, soles, between the toes, heels. Use a mirror or your phone camera for the soles. You are checking for cuts, blisters, redness, swelling, cracks and colour changes, because **you can no longer feel them.**\n\n**Never walk barefoot**, indoors included. **Check inside your shoes with your hand before putting them on** — a stone or a rucked-up sock can cause an ulcer over a single day on a numb foot.\n\n**Test bathwater with your elbow or a thermometer**, not your foot. Burns from hot water and hot-water bottles are a classic and preventable injury here.\n\n**Wash and dry daily**, especially between the toes. Moisturise the soles and heels, **not between the toes**. Cut nails straight across.\n\n**See a podiatrist regularly** if you have diabetes with neuropathy — this is standard care, not a luxury. And **any new wound, blister or area of redness that doesn't settle within a day or two needs seeing urgently.**",
        evidence: [
          "American Diabetes Association — Standards of Medical Care: comprehensive foot care recommendations.",
          "NICE — diabetic foot problems: prevention and management.",
          "Evidence summary — foot self-examination and podiatry access in preventing diabetic foot ulceration.",
        ],
        checkFirst:
          "A foot wound with redness spreading, warmth, swelling, discharge or fever is an emergency in a neuropathic foot. Infection moves fast and is often painless. Same-day medical care, not wound care at home.",
      },
      {
        id: "movement-balance",
        title: "Train balance — and keep moving",
        why: "Neuropathy takes away the position sense your balance depends on, and falls are the most common serious consequence after foot injury.",
        grade: "B+",
        gradeNote: "Evidence summary — exercise and balance training trials in peripheral neuropathy",
        how: "**Exercise has genuine evidence here** — aerobic and resistance training improve nerve function measures and symptoms in diabetic neuropathy, and improve quality of life. It also treats the cause when the cause is metabolic.\n\n**Balance training specifically.** You lose proprioception — the sense of where your feet are — so balance degrades and falls become likely, especially in the dark when vision can no longer compensate. Tai chi, standing balance work and dedicated programmes all have supporting evidence. Practise near a counter, not in the middle of a room.\n\n**Practical fall-proofing:** a nightlight on the route to the bathroom, no loose rugs, handrails, good shoes indoors. Simple, and it prevents the fracture.\n\n**Non-weight-bearing options** — cycling, swimming, rowing — are useful if you have foot ulceration risk or existing wounds. **Check with your podiatrist before starting weight-bearing exercise if you have an active foot problem.**",
        evidence: [
          "Evidence summary — randomised trials of aerobic and resistance exercise in diabetic peripheral neuropathy.",
          "Evidence summary — balance training and fall prevention in peripheral neuropathy.",
          "American Diabetes Association — physical activity recommendations with neuropathy present.",
        ],
        checkFirst:
          "If you have an active foot ulcer or a Charcot foot, weight-bearing exercise needs specific clearance — the wrong activity on the wrong foot causes lasting damage.",
      },
      {
        id: "pain-management",
        title: "Manage the nerve pain — and know what doesn't work",
        why: "Neuropathic pain responds to a different class of treatment than ordinary pain, and the usual painkillers largely don't touch it.",
        grade: "A−",
        gradeNote: "AAN guideline · NICE neuropathic pain guidance",
        supervised: true,
        how: "**The medications that work are not painkillers in the ordinary sense.** First-line options are **gabapentin, pregabalin, duloxetine and amitriptyline** — they act on nerve signalling rather than inflammation. Your doctor picks based on your other conditions and medications; several have meaningful side effects and all need proper titration.\n\n**Paracetamol and ibuprofen are largely ineffective for neuropathic pain.** Many people spend years on them assuming nothing works. Something might; it's just a different drawer.\n\n**Opioids are not recommended** for chronic neuropathic pain — poor long-term evidence, real harm.\n\n**Topical options** worth asking about: **capsaicin cream or the high-concentration patch**, and **lidocaine patches** for a localised area. Both act locally, which suits people already on several medications.\n\n**Practical, free and genuinely useful:** a **bed cradle** to keep sheets off hypersensitive feet at night, cool (not cold) foot soaks, and loose cotton socks. Night is when this is worst for most people, and small comfort measures are worth more than they sound.",
        evidence: [
          "American Academy of Neurology — guideline on oral and topical treatments for painful diabetic neuropathy.",
          "NICE — neuropathic pain in adults: pharmacological management in non-specialist settings.",
          "Evidence summary — capsaicin and lidocaine topical therapy in localised neuropathic pain.",
        ],
        checkFirst:
          "Gabapentin and pregabalin cause drowsiness and dizziness, raise fall risk in older adults, and must be tapered rather than stopped abruptly. Amitriptyline and duloxetine interact with several common medications. All of this needs a prescriber.",
      },
      {
        id: "supplements",
        title: "Supplements — one has real evidence, the rest don't",
        why: "This category is heavily marketed to neuropathy patients, and one ingredient genuinely stands apart from the rest.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials of alpha-lipoic acid",
        supplement: true,
        labNote:
          "Neuropathy supplement blends frequently combine a token dose of alpha-lipoic acid with high-dose B6 — the exact vitamin that causes neuropathy at sustained high intake. Check the B6 content of anything you're considering, and prefer single ingredients with declared doses. This is a category where reading the label matters more than usual.",
        how: "**Alpha-lipoic acid** has the best evidence of anything in this category — several randomised trials, mostly of **intravenous** ALA in diabetic neuropathy, showing reduced pain and paraesthesia; oral trials at around `600 mg` daily are more mixed but not nothing. It's reasonable to discuss with your doctor. **It can lower blood sugar**, so if you're on diabetes medication that needs coordinating.\n\n**Benfotiamine** (a fat-soluble thiamine derivative) has some supportive trial data, particularly where thiamine status is poor.\n\n**B12** — essential if you're deficient, useless if you aren't.\n\n**The one to actively avoid: high-dose vitamin B6.** Sustained intake above roughly `100 mg` daily **causes** sensory neuropathy. It is in a great many B-complexes, energy drinks and — perversely — some products sold **for** neuropathy. Check every label you take.\n\n**Not established despite the marketing:** acetyl-L-carnitine (mixed), most proprietary \"nerve repair\" blends, and anything promising regeneration.",
        evidence: [
          "Evidence summary — randomised controlled trials of alpha-lipoic acid in diabetic peripheral neuropathy.",
          "NIH Office of Dietary Supplements — vitamin B6: upper intake level and neuropathy risk.",
          "Evidence summary — benfotiamine and acetyl-L-carnitine trials in peripheral neuropathy.",
        ],
        checkFirst:
          "Alpha-lipoic acid can lower blood glucose — if you take insulin or a sulfonylurea, that's a conversation with your diabetes team first. And check every supplement you take for vitamin B6 content; more than about `100 mg` daily long-term is a known cause of the exact problem you're treating.",
      },
    ],
    skipTheHype: {
      remedy: "\"Nerve regeneration\" supplement blends and infrared nerve-repair devices",
      why: "The category is enormous and the promise is always the same: regrow damaged nerves, reverse neuropathy, no doctor required. **No supplement has been shown to regenerate damaged peripheral nerves in humans**, and the proprietary blends typically combine an under-dosed ingredient with real evidence (alpha-lipoic acid) with several that have none — and frequently with **high-dose vitamin B6, which causes neuropathy at sustained intake**. Infrared and low-level laser devices sold for home nerve repair have inconsistent trial results and none showing structural nerve recovery. The genuine harm here is delay: the causes that are actually reversible — B12 deficiency, prediabetes, a medication effect, alcohol — are reversible **early**, and every month spent on a `$70` bottle is a month the nerve damage becomes more permanent.",
    },
    bookTitle: "The Neuropathy Guide — finding the cause before the damage sticks",
    bookUrl: null,
    landingSlug: "peripheral-neuropathy-companion",
  },
];
