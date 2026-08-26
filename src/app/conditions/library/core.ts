// ─────────────────────────────────────────────────────────────────────────────
// Library — the nine conditions the section launched with.
//
// Content only. See ../types.ts for the shape and the rules every entry obeys.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const CORE_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "low-energy-metabolism",
    name: "Low energy & metabolism",
    nameEmphasis: "& metabolism",
    icon: "zap",
    category: "metabolic-heart",
    blurb: "Tired through the afternoon, and the reason is usually measurable.",
    matchRules: [
      { markerId: "trig", label: "triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 45 },
    ],
    pillarRule: { key: "metabolic", label: "Metabolic", below: 75 },
    intro:
      "Persistent tiredness is rarely about willpower.\n\nMost of the time it is one of a short list of things: blood sugar that swings instead of holding steady, a nutrient you are genuinely low on, sleep that looks long enough but isn't restorative, or a thyroid that has quietly drifted.\n\n**High triglycerides with low HDL is one of the clearest patterns** — it usually means your body is handling carbohydrate and fat less efficiently than it could, and the afternoon crash is what that feels like from the inside. The good news is that this cluster moves faster than almost anything else on a lab panel.",
    matchedIntro:
      "Your panel shows that pattern, which is why this one is at the top of your list.",
    signals: [
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 45 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
    ],
    steps: [
      {
        id: "rule-out",
        title: "Rule out the boring causes first",
        detailTitle: "The four tests worth having",
        why: "Iron, B12, vitamin D and thyroid explain a large share of real fatigue, and all four are cheap to check and straightforward to correct.",
        grade: "A",
        gradeNote: "NIH Office of Dietary Supplements · USPSTF",
        supervised: true,
        how: "Ask for **ferritin, B12, vitamin D 25-OH and TSH** — plus a free T4 if the TSH is off. If you menstruate, or you've donated blood recently, or you eat little to no red meat, ferritin is the one to look at hardest. Bring the results back here; NŪRA reads them into your markers automatically once you upload the panel.",
        evidence: [
          "NIH Office of Dietary Supplements — fact sheets on iron, vitamin B12 and vitamin D.",
          "U.S. Preventive Services Task Force — recommendation statements on screening in adults.",
        ],
        checkFirst:
          "Fatigue that arrives suddenly, comes with breathlessness, chest pain, unexplained weight loss or drenching night sweats is not a wellness question. That is a same-week appointment.",
      },
      {
        id: "protein-breakfast",
        title: "Anchor breakfast with 30 g of protein",
        why: "A protein-forward first meal flattens the glucose curve for the rest of the morning, which is what removes the 11 a.m. dip and the 3 p.m. one after it.",
        grade: "B+",
        gradeNote: "Evidence summary — controlled feeding studies",
        how: "Three eggs plus cottage cheese, a bowl of Greek yoghurt with seeds, or a shake with 30 g of protein powder — anything that clears `30 g` before the carbohydrate. If you currently skip breakfast and feel fine, you can leave it alone; this step is for people who crash.",
        evidence: [
          "Evidence summary — controlled feeding studies of protein-forward breakfasts and postprandial glucose. Consistent short-term findings; long-term outcome data is limited.",
          "Dietary Guidelines for Americans — protein distribution across the day.",
        ],
        checkFirst:
          "If you have reduced kidney function, protein targets are set by your care team, not by a general guideline. Ask them for your number before you raise it.",
      },
      {
        id: "liquid-sugar",
        title: "Cut the liquid sugar",
        why: "Sugary drinks are the single biggest driver of high triglycerides in most people's diets, and triglycerides are the marker that moves fastest when they stop.",
        grade: "A−",
        gradeNote: "American Heart Association science advisory",
        how: "Soda, sweet tea, energy drinks, juice, and the flavoured coffee that is dessert in a cup. Replace, don't just remove: sparkling water, coffee without the syrup, tea. **Give it six weeks and retest** — triglycerides are one of the most responsive numbers on the whole panel.",
        extra: {
          label: "Where the alcohol fits",
          body: "Alcohol raises triglycerides directly, and it does it fast. If your triglycerides are high, a few dry weeks is one of the most informative experiments you can run on yourself.",
        },
        evidence: [
          "American Heart Association — science advisory on added sugars and cardiovascular health.",
          "Dietary Guidelines for Americans — added sugars limit.",
        ],
        checkFirst:
          "Triglycerides over 500 mg/dL carry a pancreatitis risk and are managed medically, not with diet alone. Take that number to your doctor.",
      },
      {
        id: "morning-light",
        title: "Get daylight in your eyes within an hour of waking",
        why: "Light is the signal that sets your body clock, and a clock that runs late produces exactly the flat-morning, wired-evening pattern most tired people describe.",
        grade: "A−",
        gradeNote: "AASM · NIH circadian research",
        how: "`10 minutes` outside, no sunglasses, ideally before 9 a.m. An overcast morning still delivers many times more light than a bright room. Walking while you do it counts twice — see the movement step.",
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guidance on circadian rhythm sleep-wake disorders.",
          "NIH — circadian rhythm and light exposure research summaries.",
        ],
        checkFirst:
          "If you take a photosensitising medication (some antibiotics, retinoids and diuretics), get your sun exposure with cover and check the label.",
      },
      {
        id: "movement",
        title: "Move 150 minutes a week, in whatever shape fits",
        why: "Aerobic movement improves how your muscle takes up glucose, which is the mechanism underneath both the triglyceride number and the energy.",
        grade: "A",
        gradeNote: "HHS Physical Activity Guidelines",
        how: "`150 minutes a week` of moderate activity — brisk walking counts — plus two sessions of resistance work. Split it however it fits your week; the guideline stopped requiring ten-minute blocks years ago because the shorter bouts count too.",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition.",
          "CDC — physical activity basics for adults.",
        ],
        checkFirst:
          "If you have known heart disease, chest symptoms on exertion, or you have been sedentary for years, get cleared before you start something intense. Walking is almost always fine to begin today.",
      },
      {
        id: "vitamin-d",
        title: "Correct vitamin D if you are actually low",
        why: "Low vitamin D is common, it does track with fatigue, and it is one of the few supplements where testing before and after tells you something real.",
        grade: "B+",
        gradeNote: "NIH Office of Dietary Supplements",
        supplement: true,
        labNote:
          "Vitamin D is a cheap supplement where the dose on the front and the dose in the capsule don't always agree. Check the Purity Score before you buy, and prefer D3 with a fat-containing meal.",
        how: "Only worth it if you have a number. Under 30 ng/mL is the usual threshold for repletion; **take it with a meal that has fat in it**, and retest in three months rather than guessing. If you are severely low, your doctor may want a loading protocol instead of a maintenance dose.",
        evidence: [
          "NIH Office of Dietary Supplements — Vitamin D fact sheet for health professionals.",
          "Endocrine Society — clinical practice guidance on vitamin D evaluation and treatment.",
        ],
        checkFirst:
          "Vitamin D is fat-soluble and it does accumulate. Don't stack high doses on top of a multivitamin without testing, and clear it first if you have sarcoidosis, kidney stones or high calcium.",
      },
    ],
    skipTheHype: {
      remedy: "\"Adrenal fatigue\" protocols and cortisol-support stacks",
      why: "Adrenal fatigue is not a recognised diagnosis — the Endocrine Society reviewed the literature and found no evidence it exists as a condition. Real adrenal insufficiency is rare, serious, and diagnosed with a blood test, not a saliva kit sold with a supplement.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "sleep-support",
    name: "Sleep support",
    nameEmphasis: "support",
    icon: "moon",
    category: "mind-sleep",
    blurb: "Insomnia, short nights, and the treatment that outlasts a pill.",
    matchRules: [],
    pillarRule: { key: "sleep", label: "Sleep", below: 80 },
    intro:
      "Sleep is not one thing going wrong — it is usually timing, pressure, or arousal. **Timing** is your body clock sitting later than your alarm. **Pressure** is how much sleep drive you've built up, which caffeine and long naps quietly drain.\n\n**Arousal** is the wired-and-tired state where the lights are off and your nervous system hasn't got the message.\n\nMost of what follows is aimed at the first two, because they are mechanical and they respond fast. The third one has a real treatment, and it isn't a supplement.",
    matchedIntro:
      "Your Sleep pillar is sitting below where it should, which is why this is near the top.",
    signals: [
      { markerId: "sleep-eff", label: "Sleep efficiency", unit: "%", flagBelow: 85 },
      { markerId: "deep-sleep", label: "Deep sleep", unit: "h", flagBelow: 1 },
      { markerId: "rem-sleep", label: "REM sleep", unit: "h", flagBelow: 1.2 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 50 },
      { markerId: "cortisol-pm", label: "Cortisol PM", unit: "μg/dL", flagAbove: 5 },
    ],
    steps: [
      {
        id: "fixed-wake",
        title: "Fix your wake time first — weekends included",
        why: "A steady wake time is the anchor the whole clock hangs off. Bedtime follows it on its own within about two weeks; chasing bedtime directly almost never works.",
        grade: "A",
        gradeNote: "AASM behavioural sleep guidance",
        how: "Pick a wake time you can hold **seven days a week** and hold it even after a bad night. Sleeping in on Saturday is the equivalent of flying two time zones west and back every weekend. Get light within the hour of that alarm and the anchor sets much faster.",
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline on behavioural and psychological treatment of chronic insomnia.",
          "CDC — sleep and sleep disorders, adult sleep recommendations.",
        ],
        checkFirst:
          "If you work nights or rotating shifts, this rule needs adapting rather than applying — a sleep clinician can build a schedule around your rota instead of against it.",
      },
      {
        id: "caffeine-curfew",
        title: "Put a curfew on caffeine — 8 to 10 hours",
        why: "Caffeine's half-life runs about five to six hours, so a 3 p.m. coffee still has a live quarter-dose in you at bedtime, blunting deep sleep even when you fall asleep fine.",
        grade: "A−",
        gradeNote: "Evidence summary — controlled trials",
        how: "Count back `8–10 hours` from your bedtime and make that your last cup. If you wake at 6 and sleep at 10, that's a noon cutoff. Watch the hidden sources: green tea, pre-workout, dark chocolate, and most energy drinks carry far more than a coffee.",
        extra: {
          label: "The tell",
          body: "If you sleep through the night and still wake unrefreshed, caffeine timing is one of the first things to test. Falling asleep easily doesn't mean the caffeine wasn't working.",
        },
        evidence: [
          "Evidence summary — controlled trials of caffeine timing and objective sleep quality.",
          "FDA — guidance on caffeine intake in adults.",
        ],
        checkFirst:
          "Stopping abruptly gives most regular drinkers a headache for a few days. Taper the timing rather than the amount and it's much easier.",
      },
      {
        id: "wind-down",
        title: "Make the last hour boring on purpose",
        why: "Arousal, not tiredness, is what keeps most people awake. The last hour is where you either wind the nervous system down or keep feeding it.",
        grade: "B+",
        gradeNote: "AASM · evidence summary",
        how: "**Dim the lights an hour before bed** — the overhead light is the problem more than the phone screen. Keep the bedroom cool, dark and for sleep only. If you're lying awake more than about twenty minutes, get up, sit somewhere dim and dull, and go back when you're sleepy. Lying there trains the bed as a place where you're awake.",
        evidence: [
          "American Academy of Sleep Medicine — behavioural treatment guideline, stimulus control and sleep restriction components.",
          "NIH / NHLBI — healthy sleep habits guidance.",
        ],
        checkFirst:
          "Loud snoring, gasping, or being told you stop breathing is sleep apnoea until proven otherwise. No wind-down routine touches that — it needs a sleep study.",
      },
      {
        id: "magnesium",
        title: "Try magnesium glycinate if you're low",
        why: "Magnesium is genuinely involved in the pathways that quiet the nervous system, and low intake is common — but the sleep evidence is modest and it should be sold that way.",
        grade: "B",
        gradeNote: "NIH Office of Dietary Supplements — evidence summary",
        supplement: true,
        labNote:
          "The form is the whole decision. Glycinate and citrate absorb well; oxide is cheap, poorly absorbed and mostly a laxative. Check the Purity Score and the actual elemental magnesium per serving, which is often a fraction of the number on the front.",
        how: "`200–400 mg` of elemental magnesium, as glycinate, about an hour before bed. Start at the low end. Expect a mild effect on how easily you settle, not a sedative — if something knocks you out, it isn't the magnesium.",
        evidence: [
          "NIH Office of Dietary Supplements — Magnesium fact sheet for health professionals.",
          "Evidence summary — small randomised trials of magnesium supplementation and sleep quality; results are mixed and trials are short.",
        ],
        checkFirst:
          "Magnesium is cleared by the kidneys — if yours are impaired, do not supplement without your doctor. It also interferes with the absorption of some antibiotics and thyroid medication, so separate doses by several hours.",
      },
      {
        id: "melatonin",
        title: "Use melatonin for timing, not for sedation",
        why: "Melatonin shifts the clock. Used at the right dose and hour it helps a late clock; used as a sleeping pill at bedtime it mostly does nothing.",
        grade: "B+",
        gradeNote: "AASM guidance on circadian disorders",
        supplement: true,
        labNote:
          "Melatonin content is notoriously inconsistent between products and often far exceeds the label. This is a category where third-party testing matters more than brand — check the Purity Score.",
        how: "`0.5–1 mg`, **two to three hours before your target bedtime**, not at lights-out. The high-dose gummies are the wrong tool for this job. Use it to move a late clock earlier over a week or two, then stop — it isn't a nightly habit.",
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline for the treatment of intrinsic circadian rhythm sleep-wake disorders.",
          "Cochrane systematic review of melatonin for jet lag.",
        ],
        checkFirst:
          "Melatonin interacts with blood thinners, some blood-pressure medicines, and immunosuppressants. It is not the answer for children's sleep without a paediatrician, and it isn't a long-term insomnia treatment.",
      },
      {
        id: "cbti",
        title: "Three months of bad nights means CBT-I",
        why: "For chronic insomnia the first-line treatment is not a supplement and not a sleeping pill — it's a short structured behavioural programme, and it outperforms both.",
        grade: "A",
        gradeNote: "AASM · ACP first-line recommendation",
        supervised: true,
        how: "If you've had trouble falling or staying asleep `3 nights a week for 3 months` or more, ask your doctor for a referral to CBT-I — cognitive behavioural therapy for insomnia. It runs four to eight sessions, in person or through a validated app, and the gains hold after it ends in a way medication doesn't.",
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline on behavioural and psychological treatment of chronic insomnia.",
          "American College of Physicians — clinical practice guideline naming CBT-I as first-line for chronic insomnia.",
        ],
        checkFirst:
          "Insomnia travels with depression, anxiety, thyroid disease and sleep apnoea, and treating it alone can miss what's driving it. That's a conversation to have with your doctor, not a page to read.",
      },
    ],
    skipTheHype: {
      remedy: "High-dose melatonin gummies",
      why: "More is not better with melatonin — it is a clock-setter, not a sedative, and the `5–10 mg` doses on the shelf are far above what the timing studies used. Independent testing has repeatedly found gummy content far off the label.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "gut-health-digestion",
    name: "Gut health & digestion",
    nameEmphasis: "& digestion",
    icon: "leaf",
    category: "digestion",
    blurb: "Fibre, variety and patience — in that order.",
    // No match rule by design: nothing on a standard panel says "your gut".
    // hs-CRP appears below as a signal, which is context — not a reason to lift
    // this above a condition the bloodwork actually points at.
    matchRules: [],
    intro:
      "Most digestive complaints that aren't a diagnosed disease come down to three things: **not enough fibre, not enough variety, and too little time**. The bacteria in your colon live on the parts of plants you can't digest; feed them a narrow diet and the community narrows with it.\n\nThe fix is genuinely dull — more plants, more different plants, introduced slowly enough that the first two weeks aren't miserable.\n\nWhat follows is aimed at everyday bloating, irregularity and discomfort. It is not aimed at inflammatory bowel disease, coeliac disease or anything with blood in it.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "fibre",
        title: "Climb to 30 g of fibre a day — slowly",
        why: "Most adults eat about half of what they need, and fibre is the single input with the most consistent effect on stool form, regularity and the microbiome.",
        grade: "A",
        gradeNote: "Dietary Guidelines · ACG guidance",
        how: "Add `5 g` a week, **not `15 g` tomorrow.** A fast jump is what produces the gas and bloating that makes people quit and conclude fibre doesn't agree with them. Beans, oats, berries, chia, whole grains. Water goes up with it — fibre without fluid makes constipation worse, not better.",
        evidence: [
          "Dietary Guidelines for Americans — dietary fibre recommendations.",
          "American College of Gastroenterology — clinical guideline on irritable bowel syndrome (soluble fibre recommendation).",
        ],
        checkFirst:
          "If you have a known stricture, recent bowel surgery, or you're managing an IBD flare, fibre targets come from your gastroenterologist. Generic advice can be actively wrong there.",
      },
      {
        id: "plant-variety",
        title: "Aim for 30 different plants a week",
        why: "Diversity of the diet tracks diversity of the microbiome better than sheer quantity does — thirty different plants beats a lot of the same three.",
        grade: "B+",
        gradeNote: "Evidence summary — population microbiome research",
        how: "Herbs, spices, nuts, seeds, wholegrains and pulses all count, and they're the cheap way to get the number up. **A mixed bag of frozen vegetables and a jar of mixed seeds does more for this than any supplement.** Count over a week, not a day.",
        evidence: [
          "Evidence summary — large population cohort research on dietary plant diversity and gut microbiome composition. Associational; the number 30 is a practical target, not a validated threshold.",
          "NIH Human Microbiome Project — background on diet and microbial diversity.",
        ],
        checkFirst:
          "If you have diagnosed food allergies, variety stops at the boundary your allergist set. Broaden inside it, not through it.",
      },
      {
        id: "fermented",
        title: "Eat a fermented food most days",
        why: "In controlled feeding work, fermented foods moved microbiome diversity and inflammatory markers more reliably than a high-fibre diet alone did.",
        grade: "B+",
        gradeNote: "Stanford controlled feeding trial",
        how: "Live yoghurt, kefir, kimchi, sauerkraut from the chilled section, miso, tempeh. **The word to look for is 'live' or 'raw'** — anything pasteurised after fermenting has had the point removed. One serving a day is a reasonable target; start with half if you're sensitive.",
        evidence: [
          "Stanford School of Medicine — randomised controlled feeding trial of fermented foods versus high-fibre diet on microbiome diversity and immune markers (published in Cell, 2021).",
          "Evidence summary — reviews of fermented foods and gut health.",
        ],
        checkFirst:
          "If you're immunocompromised, pregnant, or on a low-histamine protocol, live-culture foods need a clinician's sign-off first.",
      },
      {
        id: "peppermint-oil",
        title: "Peppermint oil for IBS-type cramping",
        why: "Enteric-coated peppermint oil is one of the few over-the-counter options that appears by name in a gastroenterology guideline for abdominal pain in IBS.",
        grade: "B+",
        gradeNote: "American College of Gastroenterology guideline",
        supplement: true,
        labNote:
          "The enteric coating is the entire product. Uncoated peppermint oil releases in the stomach and causes heartburn instead of relief. Check that the Lab Report confirms an enteric or delayed-release capsule.",
        how: "**Enteric-coated capsules, taken before meals**, for a trial of two to four weeks. If it hasn't helped by then it isn't going to. This is for cramping and pain specifically — it does little for bloating or stool form.",
        evidence: [
          "American College of Gastroenterology — clinical guideline on the management of irritable bowel syndrome.",
          "Systematic reviews of peppermint oil for IBS symptom relief.",
        ],
        checkFirst:
          "Peppermint oil relaxes the valve at the top of the stomach, so it can worsen reflux. Avoid it if you have significant GERD or a hiatus hernia, and skip it in pregnancy without advice.",
      },
      {
        id: "probiotic",
        title: "Be specific about probiotics, or skip them",
        why: "Probiotics work strain by strain and indication by indication. The evidence for a general daily probiotic in a healthy adult is genuinely weak, and gastroenterology guidance says so.",
        grade: "B",
        gradeNote: "ACG · Cochrane — evidence summary",
        supplement: true,
        labNote:
          "Look for the full strain designation (genus, species and strain code) and a CFU count guaranteed through the expiry date, not at manufacture. Most of what's sold names only the species. The Lab Report flags this.",
        how: "Have a reason. **The best-supported use is alongside a course of antibiotics** to reduce antibiotic-associated diarrhoea. Otherwise, pick a strain studied for your specific symptom, give it four weeks, and stop if nothing changes. Don't stack five products.",
        evidence: [
          "American College of Gastroenterology — clinical guideline position on probiotics in IBS (evidence insufficient to recommend routine use).",
          "Cochrane systematic reviews of probiotics for antibiotic-associated diarrhoea.",
        ],
        checkFirst:
          "Live probiotics are not safe for everyone — avoid them if you are significantly immunocompromised, have a central line, or are critically ill, unless your doctor has specifically recommended one.",
      },
      {
        id: "red-flags",
        title: "Know the symptoms that skip this page",
        detailTitle: "The red flags",
        why: "A handful of digestive symptoms are never a diet problem, and the cost of treating them as one is measured in months.",
        grade: "A",
        gradeNote: "ACG · NHS alarm-feature guidance",
        supervised: true,
        how: "Book an appointment, don't troubleshoot, if you have: **blood in your stool or black stools**, unintentional weight loss, difficulty swallowing, persistent vomiting, a change in bowel habit lasting more than a few weeks after 45, symptoms that wake you at night, iron-deficiency anaemia, or a family history of bowel cancer or IBD.",
        evidence: [
          "American College of Gastroenterology — alarm features in the evaluation of chronic GI symptoms.",
          "CDC — colorectal cancer screening guidance.",
        ],
        checkFirst:
          "Persistent symptoms deserve a diagnosis even when every test so far has been normal. Ask for the next step rather than absorbing it as your baseline.",
      },
    ],
    skipTheHype: {
      remedy: "\"Leaky gut\" cleanses and detox kits",
      why: "Intestinal permeability is a real research finding. The commercial protocols built on top of it are not — no cleanse has been shown to change it, and your liver and kidneys already do the detoxing.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "stress-mood",
    name: "Stress & mood",
    nameEmphasis: "& mood",
    icon: "waves",
    category: "mind-sleep",
    blurb: "The levers with real evidence, in the order they work.",
    matchRules: [
      { markerId: "cortisol-pm", label: "evening cortisol", unit: "μg/dL", flagAbove: 5 },
    ],
    pillarRule: { key: "resilience", label: "Resilience", below: 75 },
    intro:
      "Chronic stress isn't only a feeling — it's a physiology. Sustained load keeps cortisol and adrenaline elevated, which shortens sleep, raises blood pressure and blood sugar, and makes the next stressor land harder.\n\nThat's the loop worth breaking, and the honest ranking of what breaks it is: **movement, sleep, and connection first; breathing practices second; herbs a distant third.** Anything that sells you the third without the first two is selling you something.",
    matchedIntro:
      "Some of your markers are consistent with a body carrying elevated load, which is why this rose to the top.",
    signals: [
      { markerId: "cortisol-am", label: "Cortisol AM", unit: "μg/dL", flagAbove: 18 },
      { markerId: "cortisol-pm", label: "Cortisol PM", unit: "μg/dL", flagAbove: 5 },
      { markerId: "dhea-s", label: "DHEA-S", unit: "μg/dL", flagBelow: 100 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "hrv", label: "HRV", unit: "ms", flagBelow: 45 },
    ],
    steps: [
      {
        id: "move",
        title: "Move — it's the strongest lever here",
        why: "Across the whole category, regular aerobic exercise has the largest and most consistent effect on mood and anxiety of anything you can do without a prescription.",
        grade: "A",
        gradeNote: "HHS Physical Activity Guidelines · NIMH",
        how: "`150 minutes a week` of moderate activity, ideally spread across most days. Outdoors beats indoors on the mood measures. Consistency beats intensity here by a distance — three brisk 30-minute walks you actually take outperform a training plan you abandon.",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition (mental health outcomes).",
          "National Institute of Mental Health — information on exercise and depression.",
        ],
        checkFirst:
          "Exercise is an addition to treatment, not a replacement for it. If you're already in care for depression or anxiety, tell your clinician what you're changing.",
      },
      {
        id: "sleep-first",
        title: "Protect sleep before you try anything else",
        why: "Short sleep amplifies emotional reactivity the next day, so a stress protocol built on four hours of sleep is fighting itself.",
        grade: "A−",
        gradeNote: "AASM · NIH sleep research",
        how: "Take the sleep protocol in this section and run it for two weeks before you judge anything else you're trying. **The fixed wake time and the caffeine curfew are the two that matter most here.**",
        evidence: [
          "American Academy of Sleep Medicine — sleep and mental health position statements.",
          "NIH / NHLBI — sleep deprivation and mood research summaries.",
        ],
        checkFirst:
          "Sleeping far more than usual, or waking hours before you want to and being unable to return, are both symptoms worth naming to a doctor rather than optimising around.",
      },
      {
        id: "breathing",
        title: "Lengthen your exhale for five minutes a day",
        why: "A longer exhale than inhale reliably shifts autonomic balance toward the parasympathetic side — it's the fastest self-administered lever available.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials",
        how: "**In for four, out for six**, through the nose, five minutes. Or two slow inhales through the nose followed by a long exhale, repeated. Do it daily rather than only in a crisis; the effect is bigger when the practice is already established.",
        evidence: [
          "Evidence summary — randomised trials of slow-paced and cyclic breathing on stress, mood and heart-rate variability. Consistent short-term effects; small samples.",
          "NCCIH — relaxation techniques for health.",
        ],
        checkFirst:
          "If breathwork brings on dizziness, tingling or panic, stop and switch to ordinary slow nasal breathing. Skip breath-holding practices entirely if you're pregnant or have cardiovascular or seizure history.",
      },
      {
        id: "alcohol",
        title: "Retire the nightcap",
        why: "Alcohol sedates you into sleep and then fragments the second half of the night, which is why a drink to unwind so often produces a more anxious next day.",
        grade: "A−",
        gradeNote: "NIAAA · evidence summary",
        how: "**Try two weeks without it** and watch your morning anxiety and your sleep data rather than your intentions. If you drink most nights, taper rather than stop dead, and tell your doctor first.",
        evidence: [
          "National Institute on Alcohol Abuse and Alcoholism — alcohol's effects on sleep and mental health.",
          "Evidence summary — controlled studies of evening alcohol and sleep architecture.",
        ],
        checkFirst:
          "Stopping heavy daily drinking abruptly can be dangerous — withdrawal is a medical event. If you drink daily and in quantity, that taper is planned with a doctor, not alone.",
      },
      {
        id: "ashwagandha",
        title: "Ashwagandha — modest, and not for everyone",
        why: "It has the most human trial data of the popular adaptogens for perceived stress, but the trials are small, short, and mostly industry-funded. Worth trying; not worth overselling.",
        grade: "B",
        gradeNote: "NCCIH — evidence summary",
        supplement: true,
        labNote:
          "Ashwagandha products vary enormously in extract type and standardisation, and adulteration is a known problem in the category. This is one to check the Purity Score and the extract spec on before you buy.",
        how: "Typical trials use a a standardised root extract, `300–600 mg a day`, for `8–12 weeks`. Take it with food. If nothing has shifted by twelve weeks, stop — this isn't a compound to take indefinitely on hope.",
        evidence: [
          "National Center for Complementary and Integrative Health — ashwagandha herb-at-a-glance summary.",
          "Evidence summary — small randomised trials of standardised ashwagandha extract on perceived stress scales.",
        ],
        checkFirst:
          "Rare but real cases of liver injury have been reported. Avoid ashwagandha in pregnancy, and clear it with your doctor if you have thyroid disease, an autoimmune condition, or take sedatives, thyroid medication or immunosuppressants.",
      },
      {
        id: "when-to-call",
        title: "Two weeks of most days is a doctor conversation",
        detailTitle: "When this stops being a wellness question",
        why: "There's a line between stress you manage and a mood disorder that needs treatment, and the standard screening question is a duration question.",
        grade: "A",
        gradeNote: "NIMH · USPSTF screening guidance",
        supervised: true,
        how: "If low mood, or loss of interest in things you normally enjoy, has been present most of the day, most days, for `2 weeks or more`, that's the threshold clinicians use. Say it plainly to your doctor. Effective treatment exists and it works better the earlier it starts.",
        evidence: [
          "National Institute of Mental Health — depression signs, symptoms and treatment.",
          "U.S. Preventive Services Task Force — recommendation on screening for depression and anxiety in adults.",
        ],
        checkFirst:
          "If you are having thoughts of harming yourself, this page is the wrong place. In the US, call or text 988 for the Suicide and Crisis Lifeline, any time, or go to an emergency department.",
      },
    ],
    skipTheHype: {
      remedy: "Saliva \"cortisol curve\" tests and the stacks sold with them",
      why: "Four-point saliva cortisol testing is not used to diagnose anything in mainstream endocrinology, and the supplement protocols sold off the result are treating a number that was never validated.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "joint-recovery",
    name: "Joint & recovery",
    nameEmphasis: "& recovery",
    icon: "activity",
    category: "pain-body",
    blurb: "Loading the joint is the treatment, not the risk.",
    // Uric acid is specific enough to be a trigger; hs-CRP is not — a raised CRP
    // has a dozen causes and none of them are "your knee". It stays a signal.
    matchRules: [
      { markerId: "uric-acid", label: "uric acid", unit: "mg/dL", flagAbove: 7 },
    ],
    intro:
      "The most counter-intuitive fact about aching joints is that **rest is usually the wrong prescription**. For osteoarthritis, the strongest recommendation in every major guideline is exercise — loading the joint and strengthening what surrounds it.\n\nCartilage has no blood supply of its own; movement is how it gets fed. Where supplements sit in all of this is honestly quite low, and the marketing around them is far ahead of the evidence.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "uric-acid", label: "Uric acid", unit: "mg/dL", flagAbove: 7 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "creatinine", label: "Creatinine", unit: "mg/dL" },
    ],
    steps: [
      {
        id: "strength",
        title: "Strengthen the muscle around the joint",
        why: "Strong quadriceps change knee pain more than almost anything else available, and this is the highest-graded recommendation in the osteoarthritis guidelines.",
        grade: "A",
        gradeNote: "ACR / Arthritis Foundation guideline",
        how: "**Two or three sessions a week**, targeting the muscles that cross the sore joint — quads and glutes for knees and hips, rotator cuff and scapular work for shoulders. Start with bodyweight and add load. Some ache during and after is expected; it should settle within 24 hours.",
        evidence: [
          "American College of Rheumatology / Arthritis Foundation — guideline for the management of osteoarthritis of the hand, hip and knee (exercise strongly recommended).",
          "OARSI — non-surgical management of knee osteoarthritis guidelines.",
        ],
        checkFirst:
          "Pain that spikes and stays worse for more than 24 hours after a session means the load was too high, not that exercise is wrong. Drop the weight, keep the movement, and get a physiotherapist to set the progression if you can.",
      },
      {
        id: "keep-moving",
        title: "Keep moving on the bad days too",
        why: "Motion maintains range and keeps the joint nourished. Long rest stiffens it and weakens the support around it, which is what makes the next flare worse.",
        grade: "A",
        gradeNote: "ACR · CDC arthritis guidance",
        how: "Low-impact and daily beats heroic and occasional: **walking, cycling, swimming, or a pool class**. On a flare day, reduce the range and the load rather than stopping. Warmth before, and gentle movement through the day, does more than a long lie-down.",
        evidence: [
          "CDC — physical activity for arthritis.",
          "American College of Rheumatology / Arthritis Foundation — osteoarthritis management guideline.",
        ],
        checkFirst:
          "A joint that locks, gives way, or won't take weight at all is a mechanical problem, not a stiffness problem. That gets looked at.",
      },
      {
        id: "weight",
        title: "If you carry extra weight, 5–10% changes the load",
        why: "Every pound off is several pounds less through the knee with each step, and weight loss is a strongly-recommended intervention for knee and hip osteoarthritis.",
        grade: "A",
        gradeNote: "ACR / Arthritis Foundation guideline",
        how: "`5–10%` of body weight is the threshold where the guidelines report meaningful symptom change. Pair it with the strength work — losing weight without loading the joint gives away muscle you need. If this doesn't apply to you, skip it; it isn't a moral step.",
        evidence: [
          "American College of Rheumatology / Arthritis Foundation — osteoarthritis guideline (weight loss strongly recommended for knee and hip OA).",
          "CDC — arthritis and body weight.",
        ],
        checkFirst:
          "Aggressive calorie restriction costs muscle and bone density, which is the opposite of what a sore joint needs. Do this with enough protein and enough resistance training, and with a dietitian if there's any history of disordered eating.",
      },
      {
        id: "omega-3-joint",
        title: "Omega-3 — better for inflammatory arthritis than for wear",
        detailTitle: "Omega-3 (EPA+DHA)",
        why: "The evidence for omega-3 is meaningfully stronger in rheumatoid arthritis than in osteoarthritis, and it's worth knowing which one you have before you buy.",
        grade: "B+",
        gradeNote: "Evidence summary — systematic reviews",
        supplement: true,
        labNote:
          "Fish oil is where product quality genuinely separates — oxidation is the thing to look for and it is never on the label. Check the Purity Score and the Evidence Grade before you buy.",
        how: "`2–3 g` of combined EPA + DHA a day, with a meal containing fat. Give it `12 weeks` before judging — joint symptom studies run long for a reason. Keep it in the fridge; rancid fish oil is both useless and unpleasant.",
        evidence: [
          "Systematic reviews and meta-analyses of omega-3 supplementation in rheumatoid arthritis symptom scores.",
          "American Heart Association — science advisory on omega-3 fatty acids (dosing and safety context).",
        ],
        checkFirst:
          "High-dose omega-3 has a mild blood-thinning effect. If you take an anticoagulant or antiplatelet, or you have surgery coming up, clear the dose with your doctor first.",
      },
      {
        id: "curcumin",
        title: "Curcumin — modest, and absorption is the catch",
        why: "Several trials show a small improvement in knee osteoarthritis pain, but plain turmeric powder is poorly absorbed and most of the positive studies used specific enhanced extracts.",
        grade: "B",
        gradeNote: "NCCIH — evidence summary",
        supplement: true,
        labNote:
          "This category has a documented adulteration problem, including synthetic dyes and undeclared additives. Do not buy a turmeric product without a Lab Report — check the Purity Score first.",
        how: "`500–1,000 mg a day` of a standardised curcumin extract, taken with food. Look for a formulation designed for absorption (piperine-paired or a phytosome/lipid preparation) — the spice jar in your cupboard will not reproduce the trial results.",
        evidence: [
          "National Center for Complementary and Integrative Health — turmeric herb-at-a-glance summary.",
          "Systematic reviews of curcumin extracts for knee osteoarthritis pain and function.",
        ],
        checkFirst:
          "Curcumin can increase bleeding risk with anticoagulants, may worsen gallbladder disease, and can affect the absorption of some medicines. Liver-injury cases have been reported with high-dose extracts. Clear it with your doctor if you take anything regularly.",
      },
      {
        id: "hot-joint",
        title: "A hot, red, swollen joint is not a wellness problem",
        detailTitle: "The joint emergency",
        why: "Septic arthritis and acute gout both present as a single furious joint, and one of them destroys cartilage within days.",
        grade: "A",
        gradeNote: "ACR · CDC clinical guidance",
        supervised: true,
        how: "**A single joint that becomes hot, red, visibly swollen and severely painful over hours — especially with a fever — is an urgent same-day assessment.** Don't stretch it, ice it and wait. The same goes for a joint that swells rapidly after an injury, or morning stiffness lasting over an hour in several joints, which points at inflammatory arthritis.",
        evidence: [
          "American College of Rheumatology — guidance on the acutely inflamed joint and gout management.",
          "CDC — arthritis types and when to seek care.",
        ],
        checkFirst:
          "If you have a prosthetic joint, are immunocompromised, or inject anything, the threshold for being seen is lower still. Go the same day.",
      },
    ],
    skipTheHype: {
      remedy: "Glucosamine and chondroitin",
      why: "The ACR conditionally recommends against both for knee and hip osteoarthritis. The largest independent trials found no benefit over placebo — this is the most-sold joint supplement with some of the weakest evidence.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "immune-support",
    name: "Immune support",
    nameEmphasis: "support",
    icon: "shield",
    category: "skin-immune",
    blurb: "What actually holds up, and what the marketing invented.",
    matchRules: [
      { markerId: "vit-d", label: "vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "zinc", label: "zinc", unit: "μg/dL", flagBelow: 70 },
    ],
    intro:
      "\"Immune support\" is the most oversold phrase in the supplement aisle. You cannot boost an immune system — an over-active one is an autoimmune disease.\n\nWhat you can do is remove the things that measurably suppress it and correct genuine deficiencies. **Sleep, vaccination and handwashing are the three highest-evidence interventions on this page**, and none of them are for sale.\n\nThe supplements below are real but small, and they matter most in people who are actually short of something.",
    matchedIntro:
      "One of the nutrients that genuinely affects immune function is low on your panel.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "zinc", label: "Zinc", unit: "μg/dL", flagBelow: 70 },
      { markerId: "vit-a", label: "Vitamin A", unit: "μg/dL", flagBelow: 30 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "selenium", label: "Selenium", unit: "μg/L", flagBelow: 70 },
    ],
    steps: [
      {
        id: "sleep-immune",
        title: "Sleep is the immune intervention",
        why: "Experimental work is unusually direct here: people restricted to short sleep before exposure to a cold virus get sick substantially more often than people who slept normally.",
        grade: "A−",
        gradeNote: "NIH-funded controlled exposure studies",
        how: "`7 hours or more`, consistently. Around a vaccination it matters even more — short sleep the nights either side is associated with a weaker antibody response. Take the sleep protocol in this section rather than a supplement if you have to pick one.",
        evidence: [
          "NIH-funded controlled viral-exposure studies of sleep duration and infection susceptibility.",
          "CDC — sleep and health.",
        ],
        checkFirst:
          "Sleeping badly because you're unwell is expected. Sleeping badly for months with recurring infections is worth a doctor's look rather than a longer supplement stack.",
      },
      {
        id: "vaccines",
        title: "Vaccines are the highest-evidence step here",
        why: "Nothing else on this page has an evidence base within an order of magnitude of routine vaccination, and it's the part people skip while buying elderberry.",
        grade: "A",
        gradeNote: "CDC immunisation schedules",
        supervised: true,
        how: "**Ask your doctor or pharmacist which of the adult schedule applies to you** — flu each autumn, COVID per current guidance, and depending on your age and history, shingles, pneumococcal, Tdap and RSV. This is a five-minute conversation that outperforms years of supplementation.",
        evidence: [
          "CDC — recommended adult immunisation schedule.",
          "CDC / ACIP — vaccine recommendations by age and risk group.",
        ],
        checkFirst:
          "If you're pregnant, immunocompromised, or have had a serious reaction to a vaccine before, the schedule is individualised — that's exactly the conversation to have rather than a reason to avoid it.",
      },
      {
        id: "vit-d-immune",
        title: "Correct vitamin D if you're actually low",
        why: "Vitamin D is genuinely involved in immune signalling, and the benefit in respiratory infection studies concentrates almost entirely in people who were deficient to begin with.",
        grade: "B+",
        gradeNote: "NIH ODS · systematic reviews",
        supplement: true,
        labNote:
          "A cheap category where labelled dose and actual dose can diverge. Check the Purity Score, and prefer D3 over D2.",
        how: "**Test, then treat.** Under 30 ng/mL is the usual threshold. Daily dosing with a fat-containing meal, retest at three months. High-dose monthly bolus regimens performed worse than daily in the trials, so daily is the default.",
        evidence: [
          "NIH Office of Dietary Supplements — Vitamin D fact sheet for health professionals.",
          "Systematic reviews and meta-analyses of vitamin D supplementation for acute respiratory tract infection.",
        ],
        checkFirst:
          "Fat-soluble and cumulative. Don't stack products, and clear it with your doctor if you have sarcoidosis, a history of kidney stones or elevated calcium.",
      },
      {
        id: "zinc-cold",
        title: "Zinc, started within 24 hours of symptoms",
        why: "Zinc lozenges shorten cold duration modestly in several reviews — but only when started almost immediately, and only in lozenge form.",
        grade: "B+",
        gradeNote: "Cochrane — evidence summary",
        supplement: true,
        labNote:
          "Form and dose both matter: acetate and gluconate lozenges are what was studied. Check the elemental zinc per lozenge on the Lab Report — the label number is often the salt, not the metal.",
        how: "**Start immediately** — within `24 hours` of the first symptom and use lozenges that dissolve slowly in the mouth, not swallowed capsules. Stop when the cold does. This is a short course, not a daily habit.",
        extra: {
          label: "Two things not to do",
          body: "**Never use intranasal zinc** — it has been linked to permanent loss of smell. And don't take high-dose zinc long-term: sustained intake blocks copper absorption and can cause a real deficiency.",
        },
        evidence: [
          "Cochrane systematic reviews of zinc for the common cold and for acute respiratory infection.",
          "NIH Office of Dietary Supplements — Zinc fact sheet for health professionals.",
        ],
        checkFirst:
          "Zinc reduces absorption of some antibiotics and of copper. Doses above 40 mg a day long-term are not safe without supervision, and it can cause nausea on an empty stomach.",
      },
      {
        id: "elderberry-echinacea",
        title: "Elderberry and echinacea — what the evidence really says",
        detailTitle: "Elderberry & echinacea",
        why: "Both are popular, both have some small positive trials, and both have reviews that come out neutral. That's an honest B, not the A the packaging implies.",
        grade: "B",
        gradeNote: "NCCIH — evidence summary",
        supplement: true,
        labNote:
          "Botanical extracts are among the most variable products in the aisle — species, plant part and extract strength all differ between brands, and mislabelling is documented. Check the Lab Report before you spend.",
        how: "If you want to try one, use it as a **short course at the onset of symptoms**, not year-round, and don't let it displace sleep, vaccination or seeing a doctor when you should. Expect a small effect at best.",
        evidence: [
          "National Center for Complementary and Integrative Health — elderberry and echinacea herb-at-a-glance summaries.",
          "Cochrane systematic review of echinacea for preventing and treating the common cold.",
        ],
        checkFirst:
          "Raw or unripe elderberry is toxic — only use properly prepared products. Echinacea is in the daisy family, so avoid it with ragweed allergies, and both should be cleared first if you take immunosuppressants or have an autoimmune condition.",
      },
      {
        id: "handwashing",
        title: "Wash your hands — genuinely",
        why: "It's unglamorous and it has a better effect size for respiratory and gastrointestinal infection than anything you can swallow.",
        grade: "A",
        gradeNote: "CDC hygiene guidance",
        how: "`20 seconds` with soap and water, especially before eating and after public transport, shared keyboards and bathrooms. Alcohol gel at 60%+ when there's no sink. Keep your hands off your face — that's the actual route in.",
        evidence: [
          "CDC — handwashing: clean hands save lives.",
          "Cochrane systematic reviews of physical interventions to interrupt the spread of respiratory viruses.",
        ],
        checkFirst:
          "Antibacterial soap has no proven advantage over plain soap for everyday use, and triclosan-containing washes were removed from the US market. Plain soap is the recommendation.",
      },
    ],
    skipTheHype: {
      remedy: "Mega-dose vitamin C, taken daily to prevent colds",
      why: "Cochrane reviews are clear: routine vitamin C does not prevent colds in the general population. It shaves a small amount off duration in people under extreme physical stress, and that is the whole finding.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "heart-circulation",
    name: "Heart & circulation",
    nameEmphasis: "& circulation",
    icon: "heart",
    category: "metabolic-heart",
    blurb: "The lipid numbers move faster than almost anything else you track.",
    matchRules: [
      { markerId: "trig", label: "triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 40 },
      { markerId: "ldl-c", label: "LDL", unit: "mg/dL", flagAbove: 130 },
      { markerId: "apob", label: "ApoB", unit: "mg/dL", flagAbove: 90 },
      { markerId: "non-hdl", label: "non-HDL", unit: "mg/dL", flagAbove: 130 },
    ],
    pillarRule: { key: "heart", label: "Heart", below: 75 },
    intro:
      "Cardiovascular risk is built from a small number of things you can actually see: **how many atherogenic particles are circulating** (ApoB, or non-HDL cholesterol as a stand-in), your blood pressure, whether you smoke, and how your body handles sugar.\n\nTriglycerides and HDL move quickly with diet and movement — often within weeks. LDL and ApoB move more slowly and are more genetic. Knowing which of your numbers is which tells you where effort is worth spending.",
    matchedIntro:
      "Your lipid panel has flagged, which is why this condition is at the top of your list.",
    signals: [
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 40 },
      { markerId: "ldl-c", label: "LDL-C", unit: "mg/dL", flagAbove: 130 },
      { markerId: "apob", label: "ApoB", unit: "mg/dL", flagAbove: 90 },
      { markerId: "lpa", label: "Lp(a)", unit: "nmol/L", flagAbove: 125 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "total-chol", label: "Total cholesterol", unit: "mg/dL", flagAbove: 200 },
    ],
    steps: [
      {
        id: "move-150",
        title: "150 minutes a week, and two of them lifting",
        why: "Aerobic work raises HDL and lowers triglycerides, and it's the intervention with the broadest cardiovascular benefit per hour spent.",
        grade: "A",
        gradeNote: "AHA · HHS Physical Activity Guidelines",
        how: "`150 minutes a week` of moderate activity — brisk enough that talking is possible and singing isn't — or 75 minutes of vigorous. Add **two resistance sessions**. Spread it across the week rather than banking it all on Sunday.",
        evidence: [
          "American Heart Association — recommendations for physical activity in adults.",
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition.",
        ],
        checkFirst:
          "Chest pressure, unusual breathlessness, or light-headedness on exertion needs assessment before you push intensity. If you have known heart disease, ask about cardiac rehab — it's supervised and it's better than doing this alone.",
      },
      {
        id: "omega-3",
        title: "Omega-3 (EPA+DHA)",
        why: "Omega-3 at supplement doses lowers triglycerides reliably, and it's one of the few things on the shelf with an AHA advisory and a landmark trial behind it.",
        grade: "A−",
        gradeNote: "AHA advisory · REDUCE-IT · Cochrane",
        supplement: true,
        labNote:
          "Fish oil is where quality actually separates products — oxidation is the thing to look for, and it isn't on the label. Check the Purity Score and Evidence Grade before you buy.",
        how: "`1–2 g` combined EPA + DHA a day, with a meal that has some fat in it — that's what it needs to absorb. Split the dose if 2 g at once sits badly. Give it `8–12 weeks` before you judge it; triglycerides move slowly.",
        extra: {
          label: "Prescription is a different thing",
          body: "The large cardiovascular-outcome trial used a **prescription-strength purified EPA**, not an over-the-counter fish oil. If your triglycerides are high enough to matter, ask your doctor whether the prescription version is appropriate — don't try to reach that dose with capsules.",
        },
        evidence: [
          "American Heart Association science advisory on omega-3 fatty acids and triglyceride lowering.",
          "REDUCE-IT trial of icosapent ethyl (New England Journal of Medicine, 2019).",
          "Cochrane systematic review of omega-3 for cardiovascular prevention.",
        ],
        checkFirst:
          "High-dose omega-3 thins the blood a little. If you take a blood thinner, or you have surgery coming up, clear the dose with your doctor before you start.",
      },
      {
        id: "soluble-fibre",
        title: "Get soluble fibre into most meals",
        why: "Soluble fibre binds bile acids in the gut, which pulls cholesterol out of circulation to replace them. It's one of the few dietary levers with a direct mechanism on LDL.",
        grade: "A−",
        gradeNote: "AHA dietary guidance · FDA health claim",
        how: "`5–10 g` of soluble fibre a day moves LDL measurably. Oats and oat bran, barley, beans and lentils, psyllium husk, apples and citrus. Psyllium is the concentrated option if food alone doesn't get you there — start at one teaspoon with a full glass of water.",
        evidence: [
          "American Heart Association — dietary guidance to improve cardiovascular health.",
          "FDA — authorised health claim for soluble fibre from oats/psyllium and coronary heart disease risk.",
        ],
        checkFirst:
          "Psyllium taken without enough water can cause an obstruction, and it can delay absorption of medication — take other medicines at least two hours apart from it.",
      },
      {
        id: "sodium-sugar",
        title: "Cut sodium and added sugar together",
        why: "Sodium drives blood pressure and added sugar drives triglycerides — the two most modifiable numbers on the panel, and they usually travel in the same foods.",
        grade: "A−",
        gradeNote: "AHA · Dietary Guidelines",
        how: "Under `2,300 mg` of sodium a day, with 1,500 mg as the ideal target if your blood pressure is already up. Most of it isn't the salt shaker — it's bread, deli meat, sauces, soup and restaurant food. Added sugar under about 6 teaspoons a day for women, 9 for men.",
        evidence: [
          "American Heart Association — sodium and added sugar recommendations.",
          "Dietary Guidelines for Americans — sodium and added sugars limits.",
        ],
        checkFirst:
          "Salt substitutes are usually potassium chloride, which is not safe for everyone — avoid them if you have kidney disease or take an ACE inhibitor, ARB or potassium-sparing diuretic without asking your doctor.",
      },
      {
        id: "know-numbers",
        title: "Get the numbers that actually predict risk",
        detailTitle: "ApoB, Lp(a) and your blood pressure",
        why: "LDL-C alone under-reads risk in a lot of people. ApoB counts the particles, Lp(a) is a once-in-a-lifetime genetic test most people never get, and blood pressure is the number most often measured badly.",
        grade: "A",
        gradeNote: "AHA / ACC guidance",
        supervised: true,
        how: "Ask your doctor about **ApoB or non-HDL cholesterol**, and about **Lp(a) once** — it's largely genetic and doesn't need repeating. Take your own blood pressure at home: seated, back supported, feet flat, arm at heart height, twice each morning and evening for a week. Bring the log with you. Your doctor decides what any of it means and whether medication belongs in the picture — this page doesn't.",
        evidence: [
          "American Heart Association / American College of Cardiology — cholesterol and blood pressure clinical practice guidelines.",
          "American Heart Association — scientific statement on home blood pressure monitoring.",
        ],
        checkFirst:
          "Nothing on this page is a reason to change, delay or stop a prescribed medication. If you're on a statin or a blood-pressure medicine and want to change something, that decision belongs with the person who prescribed it.",
      },
    ],
    skipTheHype: {
      remedy: "Red yeast rice",
      why: "It works because it contains monacolin K, which is chemically lovastatin — so it is an unregulated statin at an unpredictable dose, carrying the same muscle and liver risks without the monitoring. If a statin is right for you, get a real one.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "alpha-gal-syndrome",
    name: "Alpha-gal syndrome",
    nameEmphasis: "syndrome",
    icon: "bug",
    category: "skin-immune",
    blurb: "A tick-bite allergy to mammal meat — and the one NŪRA knows best.",
    matchRules: [
      {
        aliases: ["alpha-gal", "alpha gal", "alpha-gal ige", "galactose-alpha-1,3-galactose"],
        label: "alpha-gal IgE",
        unit: "kU/L",
        flagAbove: 0.35,
      },
    ],
    intro:
      "Alpha-gal syndrome is an allergy to a sugar called **galactose-α-1,3-galactose** — found in most mammals, but not in people.\n\nIn the US it usually begins after a bite from a lone star tick. Your immune system starts treating that sugar as a threat, so beef, pork, lamb and venison can set off a reaction.\n\nThe timing is what throws people: symptoms often arrive **two to six hours after eating**, so the meal rarely gets blamed.",
    matchedIntro:
      "Your alpha-gal IgE is above the detection threshold, which is why this is at the top of your list. What that number means is a conversation for your allergist — it is read alongside your history, never on its own.",
    signals: [
      {
        aliases: ["alpha-gal", "alpha gal", "alpha-gal ige", "galactose-alpha-1,3-galactose"],
        label: "Alpha-gal IgE",
        unit: "kU/L",
        flagAbove: 0.35,
      },
      { aliases: ["total ige", "ige, total", "immunoglobulin e"], label: "Total IgE", unit: "kU/L", flagAbove: 214 },
      { aliases: ["tryptase", "serum tryptase"], label: "Tryptase", unit: "µg/L", flagAbove: 11.4 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    doctorBanner: {
      title: "This one belongs with an allergist",
      body: "Alpha-gal reactions can be severe, and diagnosis needs a blood test read against your history. Everything below supports that care — it doesn't stand in for it.",
    },
    steps: [
      {
        id: "confirm",
        title: "Confirm it with an allergist",
        detailTitle: "Getting a real diagnosis",
        why: "Alpha-gal is diagnosed with a specific IgE blood test read alongside what actually happened to you. This is a diagnosis to confirm, not one to settle on your own.",
        grade: "A",
        gradeNote: "AAAAI & NIAID clinical guidance",
        supervised: true,
        how: "Ask for **alpha-gal specific IgE**. Bring a written timeline: what you ate, how long after, what happened, how long it lasted. **The delay is the diagnostic clue** — a reaction three to six hours after a meal is unusual enough in food allergy that it points here. A positive test on its own doesn't make the diagnosis; a positive test plus a matching history does.",
        evidence: [
          "CDC — Alpha-gal Syndrome, clinical overview and diagnosis.",
          "American Academy of Allergy, Asthma & Immunology — alpha-gal syndrome guidance for patients and clinicians.",
          "NIH / NIAID — alpha-gal syndrome research and food allergy guidelines.",
        ],
        checkFirst:
          "If you have already had a severe reaction — breathing difficulty, throat tightness, faintness, a whole-body rash — say that first and say it plainly. It changes the urgency and it changes whether you leave with an epinephrine auto-injector.",
      },
      {
        id: "cut-mammal",
        title: "Cut mammalian meat completely",
        why: "Beef, pork, lamb, venison, bison, goat and rabbit all carry alpha-gal. Poultry, fish and shellfish don't — they stay on the plate.",
        grade: "A",
        gradeNote: "CDC clinical overview",
        how: "**Every mammal is out: beef, pork, lamb, venison, bison, goat, rabbit.** That includes the ones that don't feel like red meat — bacon, ham, sausage, pepperoni, prosciutto, and organ meats, which carry more alpha-gal than muscle does. **Poultry, fish, shellfish and eggs are not affected.** Reactions are dose-dependent and inconsistent, which is exactly why partial avoidance fails people: getting away with it once tells you nothing about next time.",
        extra: {
          label: "Why it's worse some days",
          body: "Alcohol, exercise, NSAIDs, heat and a poor night's sleep all lower the threshold. The same portion that was fine on a quiet Tuesday can produce a reaction after a workout or a drink — these are called cofactors, and they're well described.",
        },
        evidence: [
          "CDC — Alpha-gal Syndrome, clinical overview and patient guidance.",
          "American Academy of Allergy, Asthma & Immunology — food allergy avoidance guidance.",
        ],
        checkFirst:
          "Cutting a whole food group can leave you short on iron, B12 and zinc. Ask your doctor to check ferritin and B12 within the first year, especially if you menstruate.",
      },
      {
        id: "labels",
        title: "Learn the hidden sources — gelatin first",
        detailTitle: "Reading a label",
        why: "Gelatin is mammal collagen: gummies, marshmallows, some capsule shells, broths and gravies. Tallow, lard and suet count too. Dairy affects some people and not others.",
        grade: "A−",
        gradeNote: "CDC & NIAID",
        how: "Scan for the four words that matter most: **gelatin, tallow, lard, suet**. Then the quieter ones — beef or pork broth, collagen, and capsule shells on supplements and medicines. Tell every prescriber and pharmacist you have alpha-gal; some capsules and surgical products are mammal-derived.",
        extra: {
          label: "One thing you can stop worrying about",
          body: "**Carrageenan is seaweed, not mammal.** It contains no alpha-gal. It gets passed around in alpha-gal circles because it's a galactose polymer, but avoiding it isn't part of any standard guidance — don't spend your label-reading attention there.",
        },
        evidence: [
          "CDC — Alpha-gal Syndrome, clinical overview and patient guidance.",
          "NIH / NIAID — alpha-gal syndrome research and food allergy guidance.",
        ],
        checkFirst:
          "If you have ever had trouble breathing, throat tightness, faintness or a whole-body rash after eating, that is anaphylaxis territory. You need an allergist — and, if they prescribe one, an epinephrine auto-injector you carry.",
      },
      {
        id: "dairy",
        title: "Test dairy carefully, with your allergist — not on your own",
        detailTitle: "Where dairy fits",
        why: "Dairy contains small amounts of alpha-gal. Some people with alpha-gal syndrome react to it and many don't, and working out which you are is not a solo experiment.",
        grade: "B+",
        gradeNote: "AAAAI · CDC — evidence summary",
        supervised: true,
        how: "**Don't self-challenge.** If your reactions continue despite strict meat avoidance, or they follow ice cream, cream sauces or full-fat dairy, bring that pattern to your allergist. Higher-fat dairy is reported more often than skimmed. Any structured reintroduction is planned and supervised — a food challenge belongs in a clinical setting with rescue medication present.",
        evidence: [
          "CDC — Alpha-gal Syndrome, foods and products to consider.",
          "American Academy of Allergy, Asthma & Immunology — oral food challenge guidance.",
        ],
        checkFirst:
          "A supervised oral food challenge is the only safe way to test a suspected trigger. Never do one at home, and never alone.",
      },
      {
        id: "tick-prevention",
        title: "Stop the next tick bite",
        why: "This is the step that changes your trajectory. Further bites can push alpha-gal IgE back up and undo months of progress. Permethrin-treated clothing, EPA-registered repellent, and a full tick check within two hours of coming inside.",
        grade: "A",
        gradeNote: "CDC tick-bite prevention",
        how: "**Permethrin-treated clothing and boots** — it survives several washes and it's the single most effective measure. **EPA-registered repellent** (DEET, picaridin, oil of lemon eucalyptus) on exposed skin. Walk the centre of trails. Then, within two hours of coming in: **shower, tumble-dry your clothes on high for ten minutes, and do a full-body check** — behind the knees, waistband, armpits, hairline, groin. Remove anything attached with fine-tipped tweezers, straight out, close to the skin.",
        extra: {
          label: "Why this is step four and not step ten",
          body: "Alpha-gal IgE tends to fall over months to years once the bites stop. Every new bite restarts that clock. Prevention isn't a side note here — it's the mechanism by which this condition improves.",
        },
        evidence: [
          "CDC — preventing tick bites and tick removal guidance.",
          "EPA — registered insect repellents and permethrin-treated clothing.",
        ],
        checkFirst:
          "Permethrin is for fabric, never for skin, and it is toxic to cats until it dries. Watch a bite site for an expanding rash or fever over the following weeks — that's a different tick-borne illness and it needs seeing.",
      },
      {
        id: "histamine",
        title: "Keep total histamine load down on reactive days",
        why: "Some people find flares are milder when they go easy on other histamine-heavy foods while they're already reacting. Treat it as a comfort measure — it is not a substitute for avoidance.",
        grade: "B",
        gradeNote: "Evidence summary — not guideline-backed",
        how: "On a day you've already reacted, going easy on **aged cheese, cured fish, leftovers kept for days, alcohol and fermented foods** is a reasonable comfort measure. Keep it to reactive days. **A permanent low-histamine diet is not standard alpha-gal care**, it narrows your nutrition, and the evidence behind it is thin.",
        evidence: [
          "Evidence summary — histamine intolerance literature; small studies, inconsistent methodology, no guideline endorsement for use in alpha-gal syndrome.",
          "American Academy of Allergy, Asthma & Immunology — general guidance on elimination diets.",
        ],
        checkFirst:
          "If you find yourself cutting more and more foods to control symptoms, that's a signal to go back to your allergist rather than to keep going. Progressive restriction is a well-recognised way to end up malnourished and no better.",
      },
      {
        id: "retest",
        title: "Retest your IgE over time",
        why: "Alpha-gal IgE can fall over months to years once the bites stop, and some people regain tolerance. Your allergist is the only one who can tell you whether — and when — anything comes back on the plate.",
        grade: "A−",
        gradeNote: "NIAID & AAAAI",
        supervised: true,
        how: "**Retesting is usually discussed at yearly intervals**, and the trend matters more than any single value. Falling IgE is encouraging; it is not permission. Any reintroduction is your allergist's decision and, if they agree to it, happens as a supervised challenge — not at your kitchen table.",
        evidence: [
          "NIH / NIAID — alpha-gal syndrome research on IgE decline and tolerance over time.",
          "American Academy of Allergy, Asthma & Immunology — monitoring and food challenge guidance.",
        ],
        checkFirst:
          "Keep carrying your epinephrine auto-injector while you are still under investigation, whatever the last number said. A falling IgE does not mean the next reaction will be mild.",
      },
    ],
    skipTheHype: {
      remedy: "\"Alpha-gal detox\" protocols and enzyme supplements",
      why: "Nothing you can swallow removes an IgE sensitisation. What lowers alpha-gal IgE over time is avoiding mammalian products and stopping further tick bites — there is no shortcut being sold that works.",
    },
    bookTitle: "The Alpha-Gal Recovery Roadmap — the existing NŪRA guide",
    bookUrl: "/books/alpha-gal-recovery-roadmap",
    landingSlug: "alpha-gal",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "blood-sugar-support",
    name: "Blood sugar & type 2 support",
    nameEmphasis: "& type 2 support",
    icon: "droplets",
    category: "metabolic-heart",
    blurb: "Supporting the care you're already getting — never replacing it.",
    matchRules: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "glucose", label: "fasting glucose", unit: "mg/dL", flagAbove: 100 },
      { markerId: "insulin", label: "fasting insulin", unit: "μIU/mL", flagAbove: 8 },
    ],
    pillarRule: { key: "metabolic", label: "Metabolic", below: 75 },
    intro:
      "This protocol **supports** the care you're getting from your doctor. It does not treat, reverse or cure diabetes, and nothing here is a reason to change or stop a medication — that decision is your prescriber's alone, always.\n\nWhat these steps do is well documented: the daily habits around meals, movement and sleep have a real, measurable effect on blood glucose, and they work alongside whatever your care team has prescribed. **The medication and the habits are not competing with each other.**",
    matchedIntro:
      "Your glucose markers are above the usual reference points, which is why this is near the top. Take the numbers to your doctor — reading them is their job, not this page's.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "glucose", label: "Fasting glucose", unit: "mg/dL", flagAbove: 100 },
      { markerId: "insulin", label: "Fasting insulin", unit: "μIU/mL", flagAbove: 8 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "hdl-c", label: "HDL", unit: "mg/dL", flagBelow: 40 },
      { markerId: "alt", label: "ALT", unit: "U/L", flagAbove: 30 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
    ],
    doctorBanner: {
      title: "This supports your care — it never replaces it",
      body: "Diabetes is managed with a care team. Nothing on this page is a reason to change, reduce or stop a prescribed medication, and two of these steps can interact with glucose-lowering drugs. Take this protocol to your next appointment rather than running it alone.",
    },
    steps: [
      {
        id: "post-meal-walk",
        title: "Walk for 10 minutes after your biggest meal",
        why: "Working muscle pulls glucose out of the blood without needing insulin, so a short walk in the window after eating blunts the post-meal rise more than the same walk taken hours later.",
        grade: "B+",
        gradeNote: "Evidence summary — systematic reviews",
        how: "`10–15 minutes`, starting within about half an hour of finishing. Easy pace — this isn't exercise, it's a glucose-disposal errand. After the largest or most carbohydrate-heavy meal is where it earns the most. Do it after every meal if you can; after dinner if you can only manage one.",
        evidence: [
          "Systematic reviews of short post-meal walking bouts and postprandial glycaemic response.",
          "American Diabetes Association — Standards of Care, physical activity and breaking up sedentary time.",
        ],
        checkFirst:
          "If you take insulin or a sulfonylurea, added activity can drop your glucose lower than expected. Talk to your care team about how to handle that before you make it a routine, and know your own hypoglycaemia symptoms.",
      },
      {
        id: "fibre-first",
        title: "Eat the vegetables and protein before the starch",
        detailTitle: "Meal ordering",
        why: "The same meal eaten in a different order produces a measurably smaller glucose and insulin rise — fibre and protein first slow how fast the carbohydrate arrives.",
        grade: "B+",
        gradeNote: "Diabetes Care research — evidence summary",
        how: "**Vegetables and protein first, starch last** — salad, then chicken, then the rice. Nothing is removed from the plate; only the order changes, which is why this one tends to stick. It works best on mixed meals and does nothing for a glass of juice on its own.",
        evidence: [
          "Diabetes Care — research on food order and postprandial glucose and insulin in type 2 diabetes.",
          "American Diabetes Association — nutrition therapy consensus report.",
        ],
        checkFirst:
          "This changes the shape of the glucose curve, not your carbohydrate needs. If you're on insulin and counting carbohydrates, keep counting them — the dose maths doesn't change.",
      },
      {
        id: "resistance",
        title: "Strength train twice a week",
        why: "Muscle is the largest site of glucose disposal in the body. Adding muscle raises the size of the tank, which is a structural improvement rather than a daily one.",
        grade: "A",
        gradeNote: "ADA Standards of Care",
        how: "`2–3 sessions a week`, covering the major muscle groups, alongside the ADA's 150 minutes of aerobic activity. Bands and bodyweight count. Don't go more than two days without some activity — the insulin-sensitivity benefit of a session fades within about 48 hours.",
        evidence: [
          "American Diabetes Association — Standards of Care in Diabetes, physical activity recommendations.",
          "CDC — physical activity for people with diabetes.",
        ],
        checkFirst:
          "If you have diabetic retinopathy, neuropathy, or known heart disease, some kinds of training need modifying — ask your care team which. Check your feet after exercise if you have any neuropathy.",
      },
      {
        id: "sleep-consistency",
        title: "Sleep the same hours, most nights",
        why: "Short and irregular sleep measurably worsens insulin sensitivity, and it does it within days — this shows up in your morning numbers faster than most people expect.",
        grade: "A−",
        gradeNote: "ADA Standards of Care · sleep research",
        how: "`7 hours or more`, at a consistent time. The ADA now includes sleep assessment in routine diabetes care for exactly this reason. Take the sleep protocol in this section and run the fixed wake time and the caffeine curfew first.",
        evidence: [
          "American Diabetes Association — Standards of Care in Diabetes, sleep health assessment.",
          "NIH-funded experimental studies of sleep restriction and insulin sensitivity.",
        ],
        checkFirst:
          "Obstructive sleep apnoea is far more common with type 2 diabetes and it worsens glucose control. Loud snoring or daytime sleepiness is worth raising — it's treatable, and treating it helps the diabetes.",
      },
      {
        id: "cinnamon-berberine",
        title: "Cinnamon and berberine",
        detailTitle: "Cinnamon & berberine",
        why: "Both have some glucose-lowering signal in trials, and both can stack with glucose-lowering medication to push you too low. That combination is exactly why this step is supervised.",
        grade: "B",
        gradeNote: "NCCIH — evidence summary",
        supervised: true,
        supplement: true,
        labNote:
          "Berberine products vary widely in actual content, and cassia cinnamon carries coumarin, which is liver-toxic at sustained high intake. Both are categories where a Lab Report is worth reading before you buy.",
        how: "**Bring this to your doctor before you start, not after.** If they agree: cinnamon trials mostly used `1–6 g a day` of cassia, with inconsistent results, and Ceylon cinnamon is the lower-coumarin choice for regular use. Berberine trials commonly used `500 mg` two or three times a day, with meals. Monitor more often for the first few weeks, and stop if you get hypoglycaemia symptoms.",
        evidence: [
          "National Center for Complementary and Integrative Health — cinnamon and berberine summaries (evidence limited and inconsistent).",
          "American Diabetes Association — Standards of Care position that no herbal supplement is recommended for glycaemic management.",
        ],
        checkFirst:
          "Berberine interacts with a long list of medicines — it inhibits CYP3A4, which affects statins, some blood pressure medicines, anticoagulants and immunosuppressants. It's not safe in pregnancy or breastfeeding, and it should not be given to infants. Combined with metformin, insulin or a sulfonylurea it can cause hypoglycaemia. Do not start either of these without your prescriber.",
      },
      {
        id: "monitoring",
        title: "Keep the monitoring with your care team",
        detailTitle: "Monitoring, and what belongs to your doctor",
        why: "Habit changes shift glucose, sometimes quickly. If you're on medication, that shift needs to be seen by the person who set the dose.",
        grade: "A",
        gradeNote: "ADA Standards of Care",
        supervised: true,
        how: "**HbA1c at the interval your doctor sets** — usually every three to six months — plus whatever home monitoring you've been asked to do. Bring the trend, not one reading. Keep the annual eye exam, the foot check and the kidney bloods; those catch the complications that matter most. **If your numbers improve, that is your doctor's cue to review your medication — not yours.**",
        evidence: [
          "American Diabetes Association — Standards of Care in Diabetes, glycaemic assessment and complication screening.",
          "CDC — diabetes management and care team guidance.",
        ],
        checkFirst:
          "Never reduce or stop a diabetes medication on your own, however good the numbers look. Rapid changes in glucose can also affect vision and nerve symptoms temporarily — tell your doctor rather than absorbing it.",
      },
    ],
    skipTheHype: {
      remedy: "Apple cider vinegar as a blood sugar fix",
      why: "The studies are small, short and inconsistent, and the effect where it appears is a fraction of what a ten-minute walk after the meal does. It also erodes tooth enamel taken neat.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
