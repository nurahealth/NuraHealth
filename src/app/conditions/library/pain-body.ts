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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
