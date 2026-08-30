// ─────────────────────────────────────────────────────────────────────────────
// Library — Digestion.
//
// Content only. See ../types.ts for the shape and the rules every entry obeys.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const DIGESTION_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "acid-reflux-gerd",
    name: "Acid reflux & GERD",
    nameEmphasis: "& GERD",
    icon: "flame",
    category: "digestion",
    blurb: "Timing, weight and gravity move this more than any food list.",
    matchRules: [],
    intro:
      "Reflux isn't usually too much acid. It's acid in the wrong place — the valve at the top of the stomach relaxes when it shouldn't, and pressure from below pushes contents up.\n\nThat's why the interventions with the best evidence are mechanical rather than dietary: **weight, meal timing, and the angle you sleep at.** Long trigger-food lists have surprisingly weak support and cost people a lot of enjoyment for little return.\n\nAnd there's a line worth knowing. Occasional heartburn is a nuisance. Reflux several times a week for years is a condition that needs following, because a small number of people develop changes in the oesophagus that matter.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
    ],
    steps: [
      {
        id: "meal-timing",
        title: "Stop eating three hours before you lie down",
        why: "A full stomach plus a horizontal body is the single most reproducible way to produce night-time reflux.",
        grade: "A−",
        gradeNote: "ACG clinical guideline",
        how: "**Finish eating `3 hours` before bed.** No late dinners, no bedtime snack — this is the highest-yield change on the page for anyone whose symptoms are worst at night.\n\nSmaller meals help too. Volume is pressure, and pressure is what pushes contents past the valve.",
        evidence: [
          "American College of Gastroenterology — clinical guideline for the diagnosis and management of gastroesophageal reflux disease.",
          "NIH / NIDDK — acid reflux and GERD information.",
        ],
        checkFirst:
          "Difficulty or pain swallowing, food sticking, vomiting blood, black stools, unexplained weight loss, or anaemia are alarm features. Those get an endoscopy, not a diet change.",
      },
      {
        id: "raise-head",
        title: "Raise the head of the bed — properly",
        why: "Gravity works overnight if you give it an angle, and this is a guideline-supported measure that costs nothing ongoing.",
        grade: "B+",
        gradeNote: "ACG clinical guideline",
        how: "Put `6–8 inch` blocks under the **head-end bed legs**, or use a wedge under the mattress.\n\nStacking pillows doesn't work — it bends you at the waist and raises abdominal pressure, which makes reflux worse. Sleeping on your **left side** helps too; the anatomy of the stomach favours it.",
        evidence: [
          "American College of Gastroenterology — GERD guideline (head-of-bed elevation).",
          "Evidence summary — trials of left lateral sleep position and nocturnal reflux.",
        ],
        checkFirst:
          "If reflux wakes you choking, or you have a chronic cough, hoarseness or new asthma symptoms, mention it — reflux can present that way and it's often missed.",
      },
      {
        id: "weight-reflux",
        title: "If you carry extra weight around the middle, that's the lever",
        why: "Abdominal weight raises the pressure gradient across the valve, and weight loss is one of the few interventions that changes reflux at the mechanism.",
        grade: "A−",
        gradeNote: "ACG guideline — strong lifestyle recommendation",
        how: "Even a modest loss helps; the guideline recommends weight loss for anyone overweight or who has gained recently.\n\nAlso in this category: **tight waistbands and shapewear** raise abdominal pressure directly. It sounds trivial and it isn't.",
        evidence: [
          "American College of Gastroenterology — GERD guideline (weight loss recommendation).",
          "NIH / NIDDK — GERD treatment overview.",
        ],
        checkFirst:
          "Unintentional weight loss with reflux is a red flag, not a win. If the weight is coming off without you trying, get seen.",
      },
      {
        id: "targeted-triggers",
        title: "Test your own triggers — don't adopt the list",
        why: "Blanket elimination of coffee, citrus, tomato and chocolate has weak evidence; personal triggers are real but individual.",
        grade: "B",
        gradeNote: "ACG guideline — evidence summary",
        how: "The guideline moved away from routine dietary elimination because the trials didn't support it. **Alcohol and smoking are the two with the most consistent data** — those are worth cutting regardless.\n\nFor everything else: remove one suspect for `2 weeks`, reintroduce it, and keep the restriction only if it earns its place.",
        evidence: [
          "American College of Gastroenterology — GERD guideline (routine dietary elimination not recommended without evidence of trigger).",
          "NIH / NIDDK — eating, diet and nutrition for GERD.",
        ],
        checkFirst:
          "Peppermint and peppermint oil relax the same valve, so they can make reflux worse even though they help IBS cramping. Don't run both protocols blindly.",
      },
      {
        id: "medication-review",
        title: "Take persistent symptoms — and long-term acid blockers — to your doctor",
        why: "Reflux that needs daily medication for years is a condition to follow, and several common drugs cause or worsen it.",
        grade: "A",
        gradeNote: "ACG guideline",
        supervised: true,
        how: "If you've been on a proton pump inhibitor for more than a few months, book a review. **Don't stop it on your own** — rebound acid is real and stopping abruptly usually backfires; it's stepped down with a plan.\n\nWorth asking about: whether any of your other medicines are contributing. NSAIDs, some blood pressure medicines, bisphosphonates and certain asthma drugs all can.",
        evidence: [
          "American College of Gastroenterology — GERD guideline (PPI use, step-down and long-term management).",
          "NIH / NIDDK — GERD medication overview.",
        ],
        checkFirst:
          "Chest pain is not always reflux. Pressure, tightness or pain with exertion, sweating, or pain into the jaw or arm is a cardiac assessment first, every time. Do not treat that with an antacid.",
      },
    ],
    skipTheHype: {
      remedy: "Apple cider vinegar for \"low stomach acid\"",
      why: "The idea that reflux is usually caused by too little acid isn't supported, and no major gastroenterology guideline recognises the hypochlorhydria-causes-GERD model. Pouring acid onto an already irritated oesophagus is a bad trade, and neat vinegar erodes tooth enamel on the way down.",
    },
    bookTitle: "The Reflux Playbook — mechanics, meals and getting off the pills safely",
    bookUrl: null,
    landingSlug: "acid-reflux-gerd",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "ibs-bloating",
    name: "IBS & bloating",
    nameEmphasis: "& bloating",
    icon: "bubbles",
    category: "digestion",
    blurb: "A real diagnosis with real treatments — and a lot of noise around it.",
    matchRules: [],
    intro:
      "IBS is a disorder of gut–brain interaction. The gut is structurally normal, but the signalling between it and the brain is turned up, so ordinary gas and movement register as pain and urgency.\n\nThat framing isn't a dismissal — it's the reason the treatments look odd from the outside. Things that act on the nerves (peppermint oil, gut-directed hypnotherapy, low-dose neuromodulators) work here, and things that act on \"cleaning out\" the gut don't.\n\nOne rule for this whole page: **IBS is diagnosed positively, not by exclusion of everything you can think of.** If you haven't been told you have IBS by a clinician, start there.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "rule-out-coeliac",
        title: "Get coeliac disease ruled out before you cut gluten",
        why: "Coeliac testing only works while you're still eating gluten, so cutting it first destroys your chance of a diagnosis.",
        grade: "A",
        gradeNote: "ACG guideline — strong recommendation",
        supervised: true,
        how: "Ask for **tissue transglutaminase IgA with a total IgA**, while still eating gluten regularly.\n\nWorth asking about at the same time: a coeliac screen, a full blood count, and inflammatory markers or faecal calprotectin if there's any suggestion of inflammatory bowel disease.",
        evidence: [
          "American College of Gastroenterology — clinical guideline on irritable bowel syndrome (serologic testing for coeliac disease).",
          "NIH / NIDDK — coeliac disease diagnosis.",
        ],
        checkFirst:
          "Rectal bleeding, unintentional weight loss, symptoms that wake you at night, a family history of bowel cancer or IBD, iron-deficiency anaemia, or new symptoms after 45 are alarm features. Those are not IBS until proven otherwise.",
      },
      {
        id: "low-fodmap",
        title: "Run a low-FODMAP trial — with a start and an end",
        why: "It's the best-evidenced dietary approach in IBS, and also the one most often turned into a permanent restriction it was never meant to be.",
        grade: "A−",
        gradeNote: "ACG guideline · Monash University",
        how: "Three phases, and **all three are required**: restriction for `4–6 weeks`, then structured reintroduction one group at a time, then a personalised long-term diet.\n\nGet a dietitian if you can. The restriction phase is the easy part; the reintroduction is where the value is, and it's the part people skip.",
        extra: {
          label: "Why staying in phase one is a bad idea",
          body: "The restriction phase starves the fibres your gut bacteria live on. Staying there long-term narrows the microbiome and your nutrition, and it doesn't make the underlying sensitivity better. **If you're still in phase one after `8 weeks`, something has gone wrong.**",
        },
        evidence: [
          "American College of Gastroenterology — IBS clinical guideline (limited trial of a low-FODMAP diet, conditional recommendation).",
          "Monash University — FODMAP research programme and clinical guidance.",
        ],
        checkFirst:
          "Not appropriate if you have a history of an eating disorder, are underweight, pregnant, or already eating a very restricted diet. In those situations this needs a dietitian from day one, or a different approach entirely.",
      },
      {
        id: "soluble-fibre-ibs",
        title: "Add soluble fibre — psyllium, not bran",
        why: "Guidelines separate the two clearly: soluble fibre helps IBS symptoms, insoluble bran can make them worse.",
        grade: "A−",
        gradeNote: "ACG guideline — strong recommendation",
        supplement: true,
        labNote:
          "Psyllium is a simple product where the additions are the problem — sweeteners, colours and sugar alcohols that are themselves FODMAPs. Check the Lab Report for a plain formulation.",
        how: "Start at `half a teaspoon` of psyllium in a full glass of water, once a day, and build slowly over a few weeks.\n\n**Going too fast is the usual reason people conclude fibre doesn't agree with them.** Wheat bran is the one to avoid here.",
        evidence: [
          "American College of Gastroenterology — IBS guideline (soluble fibre recommended; insoluble fibre not).",
          "Cochrane and systematic reviews of psyllium in irritable bowel syndrome.",
        ],
        checkFirst:
          "Psyllium without enough water can cause an obstruction. Take other medicines at least `2 hours` apart from it, and skip it entirely if you have a known stricture or recent bowel surgery.",
      },
      {
        id: "peppermint-ibs",
        title: "Enteric-coated peppermint oil for pain and cramping",
        why: "One of the few over-the-counter products named in a gastroenterology guideline, specifically for abdominal pain in IBS.",
        grade: "B+",
        gradeNote: "ACG guideline — conditional recommendation",
        supplement: true,
        labNote:
          "The enteric coating is the entire product — uncoated oil releases in the stomach and causes heartburn instead of relief. Confirm the Lab Report shows an enteric or delayed-release capsule.",
        how: "Enteric-coated capsules **before meals**, for a trial of `2–4 weeks`.\n\nThis targets cramping and pain specifically. It does little for stool form or bloating, so judge it on the right outcome.",
        evidence: [
          "American College of Gastroenterology — IBS guideline (peppermint oil for abdominal pain).",
          "Systematic reviews of peppermint oil in irritable bowel syndrome.",
        ],
        checkFirst:
          "It relaxes the valve at the top of the stomach, so it can worsen reflux. Avoid with significant GERD or a hiatus hernia, and get advice first in pregnancy.",
      },
      {
        id: "gut-brain",
        title: "Treat the gut–brain axis — it's the strongest lever here",
        why: "Gut-directed hypnotherapy and IBS-specific CBT have effect sizes that rival or beat the drugs, and almost nobody is offered them.",
        grade: "A−",
        gradeNote: "ACG guideline — gut-directed psychotherapies",
        supervised: true,
        how: "Ask your doctor about **gut-directed hypnotherapy** or **IBS-specific cognitive behavioural therapy**. Both are delivered in short courses, and validated app-based versions exist.\n\nIf symptoms are severe, low-dose neuromodulators are also a recognised option — used for gut nerve signalling, at doses well below antidepressant range.",
        evidence: [
          "American College of Gastroenterology — IBS guideline (gut-directed psychotherapies and neuromodulators).",
          "NIH / NIDDK — IBS treatment overview.",
        ],
        checkFirst:
          "Any medication decision here is your doctor's. Don't start, stop or adjust a neuromodulator on your own — dosing for gut symptoms is deliberately different from psychiatric dosing.",
      },
    ],
    skipTheHype: {
      remedy: "\"SIBO\" breath tests bought direct-to-consumer",
      why: "Breath testing is poorly standardised, false positives are common, and a positive result routinely sends people into repeated antibiotic or herbal-antimicrobial rounds for symptoms that were IBS all along. Gastroenterology guidance does not support routine breath testing in IBS. Get the IBS diagnosis and treat that.",
    },
    bookTitle: "The IBS Handbook — FODMAPs, the gut-brain axis and a diet you can live with",
    bookUrl: null,
    landingSlug: "ibs-bloating",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "constipation",
    name: "Constipation",
    icon: "sprout",
    category: "digestion",
    blurb: "Fibre, fluid, timing — and knowing which laxative is actually safe long-term.",
    matchRules: [],
    intro:
      "Constipation is about **stool form and effort**, not about hitting a daily quota. Anywhere from three times a day to three times a week can be normal; straining, hard pellets and a feeling of not being finished are what matter.\n\nMost of it responds to three unglamorous things: enough fibre, enough fluid, and a consistent time of day. The gut has a reflex after meals — using it is free and most people override it.\n\nThe other half is knowing which over-the-counter options are safe to lean on and which aren't.",
    signals: [
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "fibre-fluid",
        title: "Build to 25–30 g of fibre with the fluid to match",
        why: "Fibre without fluid makes constipation worse, not better — the two only work as a pair.",
        grade: "A",
        gradeNote: "ACG / AGA guidance · Dietary Guidelines",
        how: "Target `25–30 g` a day, adding about `5 g a week` so the gas settles as you go.\n\nKiwifruit, prunes, oats, beans and psyllium are the ones with the most direct evidence. **`2 kiwifruit a day` has held up surprisingly well in trials** against psyllium and prunes.",
        evidence: [
          "American Gastroenterological Association / American College of Gastroenterology — clinical practice guidance on chronic idiopathic constipation.",
          "Dietary Guidelines for Americans — dietary fibre recommendations.",
        ],
        checkFirst:
          "If you have a known stricture, recent bowel surgery, or you're being investigated for an obstruction, do not bulk up fibre. That advice comes from your surgeon or gastroenterologist.",
      },
      {
        id: "timing-position",
        title: "Use the after-meal reflex, and change your position",
        why: "The gut contracts after eating, and the sitting angle most toilets impose works against the anatomy.",
        grade: "B+",
        gradeNote: "Evidence summary · pelvic floor physiotherapy guidance",
        how: "Sit on the toilet for `10 minutes` about `20–30 minutes` after breakfast, every day, whether or not you feel the urge. You're training a reflex.\n\nPut your feet on a low stool so knees sit above hips, and **don't strain** — straining makes haemorrhoids and pelvic floor problems, not stools.",
        evidence: [
          "Evidence summary — studies of defecation posture and the gastrocolic response.",
          "American Gastroenterological Association — guidance on behavioural management of constipation.",
        ],
        checkFirst:
          "If you feel a blockage at the exit despite soft stool, or you need to press to evacuate, that suggests a pelvic floor problem. It's treated with physiotherapy and biofeedback, not with more laxatives.",
      },
      {
        id: "osmotic",
        title: "Use an osmotic laxative if you need one — not a stimulant",
        why: "Polyethylene glycol has the strongest evidence and the best long-term safety profile of the over-the-counter options.",
        grade: "A",
        gradeNote: "AGA / ACG guidance — strong recommendation",
        supplement: true,
        labNote:
          "Plain polyethylene glycol 3350 is the studied product. What varies between brands is the additives and flavourings — check the Lab Report for a plain formulation, especially if you're managing IBS alongside this.",
        how: "Polyethylene glycol (PEG 3350) is first-line, taken daily rather than as a rescue, and titrated to a soft formed stool.\n\nMagnesium-based osmotics work too. **Stimulant laxatives — senna, bisacodyl — are for occasional use**, not a nightly habit.",
        evidence: [
          "American Gastroenterological Association / American College of Gastroenterology — guidance on chronic idiopathic constipation (PEG strongly recommended).",
          "Cochrane systematic review of polyethylene glycol versus lactulose for chronic constipation.",
        ],
        checkFirst:
          "Magnesium-based laxatives are not safe with reduced kidney function. And any laxative used daily for more than a couple of weeks means it's time for a doctor to look at why, rather than for a bigger dose.",
      },
      {
        id: "causes",
        title: "Check the causes that aren't diet",
        why: "Thyroid disease, low potassium, diabetes, pregnancy and a long list of common medications all cause constipation, and none of them respond to more prunes.",
        grade: "A−",
        gradeNote: "AGA guidance · clinical review literature",
        supervised: true,
        how: "Worth reviewing with your doctor: **thyroid function, calcium, potassium and blood sugar**, plus your full medication list.\n\nCommon culprits: opioids, iron supplements, some antidepressants, calcium-channel blockers, antihistamines and anticholinergics.",
        evidence: [
          "American Gastroenterological Association — guidance on evaluating chronic constipation.",
          "NIH / NIDDK — causes of constipation.",
        ],
        checkFirst:
          "Never stop a prescribed medication because it might be constipating. Bring the list; the alternative or the counter-measure is your prescriber's call.",
      },
      {
        id: "red-flags-constipation",
        title: "Know which changes get investigated",
        detailTitle: "The red flags",
        why: "A new, persistent change in bowel habit is one of the symptoms bowel cancer screening exists for, and it is not something to manage at home.",
        grade: "A",
        gradeNote: "ACG · CDC screening guidance",
        supervised: true,
        how: "Book an appointment for: **blood in the stool or black stools**, unexplained weight loss, a new persistent change in habit after `45`, iron-deficiency anaemia, a family history of bowel cancer or IBD, or constipation that won't respond to any of the above.\n\nAnd keep your screening up to date — most guidance now starts at `45`.",
        evidence: [
          "American College of Gastroenterology — alarm features in chronic GI symptoms.",
          "CDC / US Preventive Services Task Force — colorectal cancer screening recommendations.",
        ],
        checkFirst:
          "Sudden constipation with abdominal pain, vomiting and no wind passing is a possible obstruction and an emergency. Do not take a laxative for that — go in.",
      },
    ],
    skipTheHype: {
      remedy: "Colon cleanses and \"detox\" tea",
      why: "There is no impacted matter lining a healthy colon waiting to be flushed out — that idea has no basis in anatomy. Most detox teas work because they contain senna, a stimulant laxative, sold without saying so. Colon hydrotherapy has caused perforations and electrolyte disturbances, and no gastroenterology body recommends it.",
    },
    bookTitle: "The Regularity Guide — fibre, fluid and the toilet habits nobody teaches",
    bookUrl: null,
    landingSlug: "constipation",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "food-sensitivities",
    name: "Food sensitivities",
    nameEmphasis: "sensitivities",
    icon: "wheat",
    category: "digestion",
    blurb: "Real, common, and surrounded by tests that don't work.",
    matchRules: [],
    intro:
      "Three different things get called \"food sensitivity\", and they need three different approaches. **Allergy** is IgE-mediated, fast and potentially dangerous. **Intolerance** — lactose being the classic — is an enzyme or absorption problem. **Non-allergic sensitivity** is everything else, and it's the murkiest.\n\nThe murkiness is why the testing industry around this is so large and so unreliable. IgG food panels are sold as sensitivity tests by the thousand and every major allergy society says the same thing about them.\n\nWhat does work is unglamorous: a diary, a structured elimination with a real reintroduction, and a clinician for anything that looks like allergy.",
    signals: [
      { aliases: ["total ige", "ige, total", "immunoglobulin e"], label: "Total IgE", unit: "kU/L", flagAbove: 214 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    doctorBanner: {
      title: "Anything that looks like allergy goes to an allergist",
      body: "Hives, swelling, throat tightness, wheeze or faintness after eating is not a sensitivity to troubleshoot at home. That is an allergy assessment, and it may come with an epinephrine auto-injector you carry.",
    },
    steps: [
      {
        id: "which-kind",
        title: "Work out which of the three you're dealing with",
        detailTitle: "Allergy, intolerance, or sensitivity",
        why: "The timing and the symptoms separate them, and the right next step is completely different for each.",
        grade: "A",
        gradeNote: "NIAID / AAAAI guidelines",
        how: "**Allergy**: minutes to two hours. Hives, swelling, vomiting, wheeze, faintness. Goes to an allergist.\n\n**Intolerance**: hours. Bloating, wind, cramps, loose stool. Dose-dependent — a little is usually fine.\n\n**Non-allergic sensitivity**: variable and slower. Least well defined, most over-diagnosed.",
        evidence: [
          "NIH / NIAID — guidelines for the diagnosis and management of food allergy in the United States.",
          "American Academy of Allergy, Asthma & Immunology — food allergy versus food intolerance guidance.",
        ],
        checkFirst:
          "If you have ever had trouble breathing, throat tightness, faintness or a whole-body rash after eating, stop here and get an allergist. That is anaphylaxis territory and it does not belong in an elimination diet experiment.",
      },
      {
        id: "diary-sensitivity",
        title: "Keep a two-week food and symptom diary first",
        why: "Elimination without a hypothesis means cutting foods at random, and it's how people end up with a diet of six ingredients.",
        grade: "B+",
        gradeNote: "AAAAI / dietetic guidance",
        how: "For `14 days`, log everything eaten with times, and symptoms with times.\n\nLook for a **consistent lag**. Minutes points at allergy; a few hours points at intolerance or FODMAPs; next-day symptoms usually point at something other than food.",
        evidence: [
          "American Academy of Allergy, Asthma & Immunology — patient guidance on identifying food triggers.",
          "Academy of Nutrition and Dietetics — practice guidance on elimination diets.",
        ],
        checkFirst:
          "If the diary shows you're already avoiding a lot, or eating is causing anxiety, bring in a dietitian before you cut anything else. Progressive restriction is a well-recognised route to malnutrition.",
      },
      {
        id: "structured-elimination",
        title: "Eliminate one thing at a time, then reintroduce it",
        why: "Reintroduction is the only part that proves anything — without it you've just adopted a restriction on a hunch.",
        grade: "A−",
        gradeNote: "AAAAI / dietetic guidance",
        how: "Remove **one** suspect food group for `2–4 weeks`, then reintroduce it deliberately over `3 days` and watch.\n\nIf symptoms don't return, it goes back on the menu permanently. **A restriction that isn't earned by a reintroduction shouldn't survive.**",
        evidence: [
          "American Academy of Allergy, Asthma & Immunology — elimination and reintroduction guidance.",
          "Academy of Nutrition and Dietetics — medical nutrition therapy for adverse food reactions.",
        ],
        checkFirst:
          "Never re-challenge a food that caused an allergic reaction. Supervised oral food challenges happen in a clinic with rescue medication present, and never at home.",
      },
      {
        id: "lactose",
        title: "Test lactose properly — most people don't need to cut dairy",
        why: "Lactose intolerance is dose-dependent, and the majority of people who have it can still handle small amounts and fermented dairy.",
        grade: "A−",
        gradeNote: "NIH / NIDDK guidance",
        how: "Most people with lactose intolerance tolerate about `12 g` — roughly a cup of milk — spread through the day and taken with food.\n\n**Hard cheeses and yoghurt are usually fine**; the lactose is largely gone. Lactase enzyme tablets work if you want the rest.",
        evidence: [
          "NIH / NIDDK — lactose intolerance definition, diagnosis and management.",
          "NIH Consensus Development Conference statement on lactose intolerance and health.",
        ],
        checkFirst:
          "Cutting dairy entirely puts calcium and vitamin D at risk, which matters for bone density. If you do drop it, replace them deliberately.",
      },
      {
        id: "gluten-order",
        title: "If gluten is the suspect, test for coeliac disease first",
        why: "Coeliac testing only works while you're still eating gluten — cutting it first can cost you the diagnosis for a year.",
        grade: "A",
        gradeNote: "ACG guideline — strong recommendation",
        supervised: true,
        how: "Ask for **tissue transglutaminase IgA plus a total IgA**, while still eating gluten regularly.\n\nOnly after that is negative does non-coeliac gluten sensitivity become the working idea — and even then, part of the response is often the fructans in wheat rather than the gluten itself.",
        evidence: [
          "American College of Gastroenterology — clinical guideline on the diagnosis and management of coeliac disease.",
          "NIH / NIDDK — coeliac disease testing.",
        ],
        checkFirst:
          "Coeliac disease is not an intolerance — untreated, it damages the small intestine and causes nutrient deficiencies and long-term complications. It is worth the correct diagnosis rather than a self-imposed gluten-free diet.",
      },
    ],
    skipTheHype: {
      remedy: "IgG food sensitivity panels",
      why: "The AAAAI, the European allergy academy and multiple other societies explicitly recommend against them. IgG to a food is a normal marker of **exposure and tolerance** — it means you've eaten it, not that it harms you. These panels routinely return 20–40 \"reactive\" foods and send people into restrictions they never needed.",
    },
    bookTitle: "The Food Sensitivity Guide — testing honestly, eliminating carefully",
    bookUrl: null,
    landingSlug: "food-sensitivities",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "celiac-disease",
    name: "Celiac disease",
    nameEmphasis: "disease",
    icon: "wheatOff",
    category: "digestion",
    blurb: "An autoimmune disease, not an intolerance — and the treatment is total.",
    matchRules: [
      {
        aliases: [
          "ttg iga", "ttg-iga", "tissue transglutaminase", "transglutaminase iga",
          "anti-ttg", "ttg antibody, iga",
        ],
        label: "tTG-IgA",
        unit: "U/mL",
        flagAbove: 3,
      },
    ],
    intro:
      "Celiac disease isn't an allergy and it isn't an intolerance. It's an **autoimmune disease**: in people who carry the genes for it, gluten turns the immune system on the lining of the small intestine, and the finger-like villi that absorb your food flatten out. (Spelled \"coeliac\" outside the US — same disease.)\n\nThat's why the shortfalls arrive as a set — iron, B12, vitamin D, calcium — and why fatigue, anaemia and bone loss often show up long before anything digestive does. A large share of people diagnosed never had the classic gut symptoms at all.\n\nThe treatment is one thing, and it works: **a strictly gluten-free diet, for life.** Not mostly gluten-free. The immune response doesn't scale down with the dose the way an intolerance does — small, repeated exposures keep the damage running even when you feel completely fine.",
    matchedIntro:
      "Your tissue transglutaminase IgA is above the reporting threshold, which is why this is at the top of your list. That number is read by a gastroenterologist alongside a total IgA and, in most adults, a biopsy — never on its own, and never as a reason to start a gluten-free diet before they have seen you.",
    signals: [
      {
        aliases: [
          "ttg iga", "ttg-iga", "tissue transglutaminase", "transglutaminase iga",
          "anti-ttg", "ttg antibody, iga",
        ],
        label: "tTG-IgA",
        unit: "U/mL",
        flagAbove: 3,
      },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "folate", label: "Folate", unit: "ng/mL", flagBelow: 4 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "calcium", label: "Calcium", unit: "mg/dL", flagBelow: 8.5 },
    ],
    doctorBanner: {
      title: "Get tested before you go gluten-free",
      body: "Every celiac test only works while gluten is still in your diet. Cutting it first can wipe out the result and cost you months of eating gluten again to re-test. The order matters: test first, then change the diet.",
    },
    steps: [
      {
        id: "test-first",
        title: "Get tested before you cut a single slice",
        detailTitle: "Getting the diagnosis in the right order",
        why: "Every celiac test — blood and biopsy — only works while you are still eating gluten. Going gluten-free first is the most common way people lose their diagnosis.",
        grade: "A",
        gradeNote: "ACG clinical guideline — strong recommendation",
        supervised: true,
        how: "Ask for **tissue transglutaminase IgA (tTG-IgA) with a total IgA**, while still eating gluten regularly. The total IgA is not optional: people who are IgA-deficient get a falsely normal tTG-IgA, and IgA deficiency is more common in celiac disease than in everyone else.\n\nIn adults a positive result is usually confirmed by **upper endoscopy with duodenal biopsies** before the diagnosis is made. That sequence is deliberate — the diagnosis commits you to a lifelong diet, so it is worth being certain rather than nearly certain.\n\nIf you have already gone gluten-free, don't just start eating it again on your own. **A gluten challenge before re-testing is planned with your doctor.**",
        extra: {
          label: "What the gene test can and can't do",
          body: "**HLA-DQ2/DQ8 testing does not diagnose celiac disease.** Roughly a third of the population carries those genes and almost none of them develop it. Its real use is the other direction: a negative gene test makes celiac disease very unlikely, which is genuinely useful when someone has already gone gluten-free and can't face a challenge.",
        },
        evidence: [
          "American College of Gastroenterology — clinical guideline on the diagnosis and management of celiac disease.",
          "NIH / NIDDK — celiac disease: diagnosis and testing.",
          "American Gastroenterological Association — clinical practice update on the diagnosis and monitoring of celiac disease.",
        ],
        checkFirst:
          "Do not adopt a gluten-free diet to 'see if it helps' before testing. It is the one self-experiment in this section that actively destroys the information your doctor needs, and getting it back means eating gluten daily for weeks while feeling unwell.",
      },
      {
        id: "strict-gf",
        title: "Go strictly gluten-free — wheat, barley, rye",
        why: "This is the entire treatment, and it is the one intervention in this library that is genuinely all-or-nothing.",
        grade: "A",
        gradeNote: "ACG guideline · NIDDK",
        how: "Out: **wheat in every form** — including spelt, farro, einkorn, durum, semolina, kamut and triticale — plus **barley and rye**.\n\nIn: rice, corn, potato, quinoa, buckwheat, millet, sorghum, amaranth, teff, and every unprocessed meat, fish, egg, legume, fruit, vegetable, nut and dairy product. Most of a normal diet is already gluten-free.\n\n**Dose does not behave the way it does with an intolerance.** Repeated small exposures — the stray crumb, the shared toaster, the 'it's only a bit' — keep the immune response running and the lining damaged. Plenty of people with ongoing damage feel perfectly well, which is exactly why feeling fine is not the test.",
        extra: {
          label: "Oats, honestly",
          body: "Pure oats are safe for most people with celiac disease, but ordinary oats are routinely cross-contacted with wheat in the field and at the mill. Use **certified gluten-free oats** only, and bring them in after you're settled and your antibodies have come down — that way, if something changes, you know what changed. A small minority react to oats themselves.",
        },
        evidence: [
          "NIH / NIDDK — celiac disease: eating, diet and nutrition.",
          "American College of Gastroenterology — clinical guideline on celiac disease management.",
          "Celiac Disease Foundation — sources of gluten.",
        ],
        checkFirst:
          "Don't start this before you have been tested. And once you are diagnosed, a gluten-free diet is a medical treatment rather than a preference — say that plainly to hosts, caterers and restaurant staff instead of softening it into a diet choice.",
      },
      {
        id: "hidden-gluten",
        title: "Learn the hidden sources — malt first",
        detailTitle: "Reading a label",
        why: "The obvious foods are easy. What catches people is barley sitting in a cereal, a sauce or a drink under a completely different name.",
        grade: "A−",
        gradeNote: "Celiac Disease Foundation · FDA labeling rule",
        how: "Scan for **malt** in all its forms first — malt extract, malt syrup, malt flavouring, malt vinegar, malted milk. Malt is barley, and it hides in breakfast cereals, sauces and sweets that look nothing like bread.\n\nThen the rest: **soy sauce** (traditionally brewed with wheat — tamari usually isn't), **brewer's yeast**, beer and ale, and the quiet thickeners — wheat starch, 'modified food starch' where the source isn't named, soups, gravies, stock cubes and some processed meats.\n\nIn the US a **gluten-free label is a legal claim**: the FDA requires under `20 ppm`. On packaged food, trust that label over your own reading of the ingredient list.",
        extra: {
          label: "The two non-food ones worth knowing",
          body: "Some **medicines and supplements** use wheat-derived starch in a binder or capsule shell — ask your pharmacist to check rather than assuming. And **communion wafers** are wheat; low-gluten options exist but are still not gluten-free. Shampoos and cosmetics are not a route in unless they end up in your mouth, so don't spend your label-reading attention there.",
        },
        evidence: [
          "Celiac Disease Foundation — sources of gluten and label reading.",
          "U.S. Food and Drug Administration — 'Gluten-Free' labeling of foods, final rule.",
          "NIH / NIDDK — celiac disease: eating, diet and nutrition.",
        ],
        checkFirst:
          "'Wheat-free' is not gluten-free — barley and rye are still in play. And a product with no gluten ingredients made on shared equipment can still carry enough to matter; the certified label exists for exactly that gap.",
      },
      {
        id: "cross-contact",
        title: "Shut down cross-contact in your own kitchen",
        why: "Once the shopping is right, most of the remaining exposure in a mixed household is a shared toaster, a shared fryer and flour dust.",
        grade: "A−",
        gradeNote: "Celiac Disease Foundation · dietetic guidance",
        how: "In a shared kitchen, the ones that actually matter: a **dedicated toaster** (or toaster bags), a **separate colander**, and **your own jars** of butter, jam, peanut butter and spreads — a knife going back in twice is a real route in.\n\nEating out, two questions do most of the work: **is there a separate fryer**, and **is there a separate prep area**. Shared fryer oil carries gluten off breaded food, so gluten-free chips from a shared fryer are not gluten-free.\n\nFlour is airborne and settles for hours. If someone bakes in your kitchen, that surface needs wiping down before you use it.",
        evidence: [
          "Celiac Disease Foundation — cross-contact guidance for shared households and dining out.",
          "Academy of Nutrition and Dietetics — medical nutrition therapy for celiac disease.",
        ],
        checkFirst:
          "If you're still symptomatic and your antibodies aren't falling, hidden gluten is the likeliest explanation — not a new food to cut. That's a job for a dietitian with celiac experience, who will find the exposures you can't see.",
      },
      {
        id: "replete",
        title: "Get the deficiencies found and corrected",
        detailTitle: "The nutrients this costs you",
        why: "A damaged small intestine absorbs badly, so most people arrive at diagnosis short on several things at once — and those shortfalls, not the gluten itself, are what cause much of the fatigue.",
        grade: "A−",
        gradeNote: "ACG guideline · NIDDK",
        supervised: true,
        supplement: true,
        labNote:
          "If your clinician recommends iron, B12 or vitamin D here, this is a category worth choosing carefully — dose accuracy and contamination vary widely, and a 'gluten-free' claim on a supplement label isn't always verified. Check the Purity Score rather than buying on brand.",
        how: "Ask your doctor to check **ferritin and iron, B12, folate, vitamin D and calcium** at diagnosis, and again once you have been gluten-free for a while. Iron-deficiency anaemia is the most common non-digestive presentation of celiac disease, and it often corrects on the diet alone.\n\nAsk about a **bone density scan** too. Years of calcium and vitamin D malabsorption is why low bone density is common at diagnosis, including in people who felt fine throughout.\n\nRepletion doses are your clinician's call, not a shelf's — iron in particular is easy to overdo and unpleasant to get wrong.",
        extra: {
          label: "The gluten-free-aisle trap",
          body: "Gluten-free breads, pastas and cereals are usually **not fortified** the way wheat products are, and they tend to run lower in fibre, iron and B vitamins and higher in sugar and fat. A diet built out of the free-from aisle can leave you worse fed than before. Build it on naturally gluten-free whole foods — beans, rice, potatoes, certified oats, fruit, vegetables, nuts — and treat the packaged substitutes as occasional.",
        },
        evidence: [
          "American College of Gastroenterology — clinical guideline on celiac disease (nutritional assessment and monitoring).",
          "NIH / NIDDK — celiac disease: nutrient deficiencies and long-term complications.",
          "NIH Office of Dietary Supplements — fact sheets on iron, vitamin B12 and vitamin D.",
        ],
        checkFirst:
          "Don't self-prescribe iron. High-dose iron without a confirmed deficiency is harmful, and unexplained anaemia occasionally has a second cause that a supplement would simply mask.",
      },
      {
        id: "healing-timeline",
        title: "Know what heals when — and how long it really takes",
        why: "People expect to feel better within a week, and when they don't they start cutting more foods. The real timeline is longer than that, and that's normal.",
        grade: "B+",
        gradeNote: "Evidence summary — follow-up biopsy cohorts",
        how: "Roughly: **symptoms** often ease within `2–8 weeks`. **Antibodies** fall over `6–12 months`, and that is the number your doctor tracks. **The intestinal lining** is slowest — in adults, full healing commonly takes `1–2 years`, and in a meaningful minority it stays incomplete. Children heal faster.\n\nThe first weeks can be bumpy. Some people are briefly worse with lactose while the lining recovers, because the enzyme that digests it sits on the tips of the villi. That usually settles, so **don't drop dairy permanently over it** — you'd be cutting calcium at the exact moment your bones need it most.",
        extra: {
          label: "If you're not improving",
          body: "The most common reason someone doesn't get better on a gluten-free diet is **continued gluten**, almost always unintentional — not a second disease. Before you eliminate anything else, that's the thing to chase, with a dietitian. Only after that do the other explanations get investigated, and that investigation belongs to your gastroenterologist.",
        },
        evidence: [
          "Evidence summary — follow-up biopsy cohorts reporting mucosal recovery rates and timelines in treated adults.",
          "American Gastroenterological Association — clinical practice update on monitoring celiac disease.",
          "NIH / NIDDK — celiac disease: treatment and follow-up.",
        ],
        checkFirst:
          "Symptoms that return after a good stretch of being well, or new weight loss, night sweats or persistent abdominal pain, need your gastroenterologist rather than a stricter diet.",
      },
      {
        id: "follow-up",
        title: "Keep the follow-up testing going, and tell your family",
        why: "Celiac disease is followed for life, and the people who share your genes have roughly a one-in-ten chance of having it too.",
        grade: "A−",
        gradeNote: "ACG guideline · AGA practice update",
        supervised: true,
        how: "Expect **repeat tTG-IgA at around `6` and `12` months**, then periodically. A falling antibody is the objective sign the diet is working, and it catches exposure you never noticed. Some people are offered a repeat biopsy; that's a conversation with your gastroenterologist, not a default.\n\nAsk for a review with a **dietitian who knows celiac disease**. It is the part of the plan with the most evidence behind it and the part most often skipped.\n\nAnd tell your **parents, siblings and children.** First-degree relatives carry roughly a `1 in 10` risk and plenty of them have no symptoms at all. They need testing while still eating gluten normally.",
        evidence: [
          "American College of Gastroenterology — clinical guideline on celiac disease (follow-up and first-degree relative screening).",
          "American Gastroenterological Association — clinical practice update on the diagnosis and monitoring of celiac disease.",
          "Celiac Disease Foundation — screening for family members.",
        ],
        checkFirst:
          "Untreated or half-treated celiac disease carries real long-term risk — persistent malabsorption, low bone density, and a small increase in certain lymphomas. That is why the follow-up exists. It is not box-ticking.",
      },
    ],
    skipTheHype: {
      remedy: "\"Gluten-digesting\" enzyme supplements",
      why: "Sold as glutenase, AN-PEP or 'gluten defence' blends, these are marketed to cover an accidental exposure or, worse, a deliberate slice of real bread. No enzyme is approved to treat celiac disease, none has been shown to protect the intestinal lining from a real meal's worth of gluten, and the major celiac organisations advise against relying on them. The failure mode is the whole problem: they buy confidence, not protection.",
    },
    // Funnel — book copy is written; `bookUrl` stays null until /books ships, so
    // the "Go deeper" card can't render a dead link. Set it to
    // "/books/celiac-starter-guide" the day that route exists.
    bookTitle: "The Celiac Starter Guide — going gluten-free without losing your nutrition",
    bookUrl: null,
    landingSlug: "celiac-disease",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Supportive-only by design. This is the most doctor-forward page in the app:
  // it never manages the disease, and it carries no supplement step at all.
  {
    slug: "ibd-companion-support",
    name: "Crohn's & colitis companion",
    nameEmphasis: "companion",
    icon: "stethoscope",
    category: "digestion",
    blurb: "Support alongside your GI team for inflammatory bowel disease — never instead of it.",
    matchRules: [],
    intro:
      "Crohn's disease and ulcerative colitis are **inflammatory bowel disease (IBD)** — immune-mediated diseases that inflame and damage the bowel wall. They are diagnosed and managed by a gastroenterologist, with prescribed medication, objective monitoring, and sometimes surgery.\n\n**This page does not manage IBD.** Nothing on it treats inflammation, induces or maintains remission, or replaces a single dose of anything you have been prescribed. If any of it ever seems to be competing with your team's plan, your team's plan wins.\n\nWhat it does cover is the part appointments rarely have time for: **eating well between flares, finding your own trigger foods without shrinking your diet to nothing, protecting sleep, staying on the medication, and walking in with the right questions.**",
    signals: [
      {
        aliases: ["fecal calprotectin", "faecal calprotectin", "calprotectin", "stool calprotectin"],
        label: "Calprotectin",
        unit: "µg/g",
        flagAbove: 150,
      },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "This supports your gastroenterologist — it does not manage your disease",
      body: "IBD is controlled by prescribed medication and objective monitoring, and nothing on this page does either of those jobs. Never change, delay or stop a dose because of something you read here. New or worsening symptoms go to your team, not to a protocol.",
    },
    steps: [
      {
        id: "gi-centre",
        title: "Keep your gastroenterologist at the centre of this",
        detailTitle: "What your team is actually tracking",
        why: "IBD is managed against objective evidence of inflammation rather than against how you feel — and the two disagree more often than people expect.",
        grade: "A",
        gradeNote: "ACG clinical guidelines — Crohn's disease & ulcerative colitis in adults",
        how: "Know your own file: **which disease, where it sits, how much bowel is involved, what you're taking, and what your team is aiming at.**\n\nModern IBD care targets more than symptom relief — the goal is inflammation that has genuinely settled, measured with **faecal calprotectin, CRP, imaging and endoscopy.** You can feel well with active inflammation, and you can feel dreadful with none. That gap is the entire reason the tests exist.\n\nAsk what your last calprotectin was and when the next one is due. It's the number that tells you whether the plan is working.",
        evidence: [
          "American College of Gastroenterology — clinical guideline: management of Crohn's disease in adults.",
          "American College of Gastroenterology — clinical guideline: ulcerative colitis in adults.",
          "NIH / NIDDK — Crohn's disease and ulcerative colitis: diagnosis and treatment.",
        ],
        checkFirst:
          "Some symptoms don't wait for the next appointment. **Heavy rectal bleeding, fever with abdominal pain, severe pain with vomiting and no bowel movement, or many bloody stools a day** are same-day calls — and sometimes an emergency department.",
      },
      {
        id: "adherence",
        title: "Stay on the medication, especially once you feel well",
        why: "Stopping maintenance therapy during remission is one of the best-documented ways to bring a flare back, and feeling well is precisely when people stop.",
        grade: "A",
        gradeNote: "ACG guidelines · adherence cohort data",
        supervised: true,
        how: "Maintenance medication works by holding inflammation down while nothing appears to be happening. **Remission is the medication working — it isn't the disease being over.**\n\nIf something about the treatment is a genuine problem — side effects, cost, injections, the schedule, or simply wanting off it — that is a real conversation with your team, and they usually have options. What doesn't work is stopping quietly to see what happens.\n\nSteroids are never stopped abruptly; they come down on a plan your prescriber sets.",
        extra: {
          label: "The appointments people quietly fall out of",
          body: "Long-term IBD care includes things that feel unrelated to your gut: **vaccinations** (live vaccines are handled differently on immune-suppressing therapy, so they get planned with your team), **bone density** if you've had repeated steroid courses, and **colonoscopic surveillance** after years of colonic disease. Ask which of these apply to you — they're easy to lose track of between flares.",
        },
        evidence: [
          "American College of Gastroenterology — clinical guidelines on maintenance therapy in Crohn's disease and ulcerative colitis.",
          "Crohn's & Colitis Foundation — treatment adherence and long-term care guidance.",
        ],
        checkFirst:
          "Never stop, halve or delay a prescribed IBD medication on the strength of anything you read — here or anywhere else. If you want to come off it, that is planned with your gastroenterologist, with monitoring.",
      },
      {
        id: "nutrition-between-flares",
        title: "Eat for nutrition between flares — not for a cure",
        why: "No diet has been shown to control IBD the way medication does, but nutritional status genuinely affects how you cope, how you recover, and how you heal after surgery.",
        grade: "B+",
        gradeNote: "AGA clinical practice update · DINE-CD trial",
        how: "Between flares, the pattern with the best supportive evidence is an ordinary **Mediterranean-style diet**: vegetables, fruit, whole grains, legumes, fish, olive oil, and not much ultra-processed food.\n\nThe aim is unglamorous — **enough calories, enough protein, and as wide a range of foods as you can comfortably tolerate.** Undernutrition is common in IBD and it makes every other part of this harder.\n\nDuring an active flare, or with a known narrowing, your team may advise something quite different — a low-residue diet, or a formula feed. **That instruction comes from them and it overrides this step.**",
        extra: {
          label: "About the Specific Carbohydrate Diet",
          body: "The **DINE-CD** trial put the Specific Carbohydrate Diet head-to-head with a plain Mediterranean diet in adults with Crohn's disease. Both improved symptoms; neither beat the other, and neither reliably shifted inflammatory markers. Since the Mediterranean pattern is far easier to live on and better for your heart anyway, it's the sensible default — and it's a fair answer to anyone selling SCD as the thing that fixes IBD.",
        },
        evidence: [
          "American Gastroenterological Association — clinical practice update on diet and nutritional therapies in patients with inflammatory bowel disease.",
          "Lewis et al. — DINE-CD randomised trial, Specific Carbohydrate Diet versus Mediterranean diet in Crohn's disease, Gastroenterology 2021.",
          "Crohn's & Colitis Foundation — diet and nutrition guidance.",
        ],
        checkFirst:
          "If you have a stricture, or you've had bowel surgery, fibre advice changes completely and general 'eat more plants' guidance can cause an obstruction. Your fibre plan comes from your team.",
      },
      {
        id: "triggers-with-help",
        title: "Find your trigger foods with a dietitian, not alone",
        why: "Personal triggers are real, but self-directed elimination in IBD has a track record of shrinking the diet without improving the disease.",
        grade: "B+",
        gradeNote: "AGA practice update · dietetic guidance — evidence summary",
        how: "Keep a **`14-day` food and symptom diary** with times, then take it to a dietitian who works with IBD. Most IBD services have one, and it's usually a referral your gastroenterologist can make on the spot.\n\nThey will test one food group at a time and **put back whatever doesn't earn its removal.** That second half is what separates this from simply eating less each year.\n\nWorth knowing: when inflammation is well controlled, a lot of the day-to-day symptoms that remain behave more like IBS than like active disease — and that responds to completely different handling.",
        evidence: [
          "American Gastroenterological Association — clinical practice update on diet in inflammatory bowel disease.",
          "Crohn's & Colitis Foundation — working with a registered dietitian.",
          "Evidence summary — elimination diet studies in IBD; small trials, and a documented risk of nutritional harm without supervision.",
        ],
        checkFirst:
          "Unintended weight loss, or a diet that has narrowed to a handful of safe foods, is a reason to call your team now rather than at the next review. Malnutrition worsens IBD outcomes and complicates surgery.",
      },
      {
        id: "sleep-stress",
        title: "Treat sleep and stress as part of the plan",
        why: "Stress does not cause IBD and never did — but poor sleep and high stress track consistently with more symptoms and, in cohort studies, a higher chance of flaring.",
        grade: "B+",
        gradeNote: "Prospective cohort data · brain–gut therapy trials",
        how: "Treat **`7–9` hours** as part of the treatment rather than a luxury: same wake time daily, light early, screens down at night.\n\nOn the stress side, the approaches with real trial support are the structured ones — **cognitive behavioural therapy and gut-directed hypnotherapy.** Keep the distinction honest: they improve symptom burden and quality of life, not the inflammation itself. They help you live with the disease; they don't replace what's controlling it.\n\nAnxiety and low mood are markedly more common in IBD than in the general population. That's a reasonable response to an unpredictable illness, and it is treatable in its own right.",
        evidence: [
          "Crohn's & Colitis Foundation — mental health and IBD.",
          "Evidence summary — prospective cohort studies of sleep quality, psychological stress and IBD flare risk.",
          "Evidence summary — randomised trials of cognitive behavioural therapy and gut-directed hypnotherapy for symptom burden and quality of life in IBD.",
        ],
        checkFirst:
          "Waking repeatedly in the night to open your bowels, or waking with pain, is not a sleep problem. It is a red flag for active disease and it belongs with your gastroenterologist.",
      },
      {
        id: "smoking",
        title: "If you smoke and you have Crohn's, this is the biggest lever you have",
        detailTitle: "Smoking, and why the two diseases differ",
        why: "Smoking is the clearest modifiable factor in Crohn's disease — it tracks with more flares, more surgery, and more disease coming back after surgery.",
        grade: "A−",
        gradeNote: "ACG guideline · consistent cohort evidence",
        how: "In **Crohn's disease**, stopping smoking is the non-drug change with the strongest evidence behind it, and the benefit shows up in flare rates and surgical risk rather than in how you feel next week. Ask your team for real cessation support — nicotine replacement, medication, a service — instead of running it on willpower.\n\nIn **ulcerative colitis** the relationship runs the other way, and some people notice symptoms after quitting. That observation is well described and it is **not a reason to smoke.** Nicotine has been trialled as a UC treatment, works poorly, and carries significant side effects; the cardiovascular and cancer costs of smoking dwarf anything gained.",
        evidence: [
          "American College of Gastroenterology — clinical guideline: management of Crohn's disease in adults (smoking cessation).",
          "Crohn's & Colitis Foundation — smoking and IBD.",
          "NIH / NIDDK — Crohn's disease: risk factors.",
        ],
        checkFirst:
          "If quitting has coincided with worsening colitis symptoms, tell your gastroenterologist rather than restarting. There are ways to manage that period, and none of them involve going back to cigarettes.",
      },
      {
        id: "questions",
        title: "Walk into your next appointment with these questions",
        detailTitle: "What to ask your gastroenterologist",
        why: "Appointments are short. The people who get the most out of them are the ones who arrive with the list already written down.",
        grade: "A−",
        gradeNote: "Crohn's & Colitis Foundation patient guidance",
        how: "**About my disease** — which type is it, where exactly, and how active is it now? What was my last calprotectin or CRP, and what number are we aiming at?\n\n**About my treatment** — what is this medication doing, how will we know it's working, and by when? Which side effects should make me call? What's the plan if it stops working?\n\n**About everything else** — should I see a dietitian? Which vaccinations do I need, and when? Do I need a bone density scan? When is my next colonoscopy due? What should make me call you rather than wait?\n\nIf a lot has changed since last time, ask for a **longer appointment** when you book. That request is ordinary and it's usually granted.",
        evidence: [
          "Crohn's & Colitis Foundation — questions to ask your doctor and preparing for appointments.",
          "NIH / NIDDK — Crohn's disease and ulcerative colitis: patient information.",
        ],
        checkFirst:
          "Nothing urgent waits for an appointment slot. Heavy bleeding, fever with abdominal pain, uncontrolled vomiting or severe pain need your team the same day.",
      },
    ],
    skipTheHype: {
      remedy: "\"Leaky gut\" repair protocols sold as an alternative to IBD medication",
      why: "The glutamine, slippery-elm and bone-broth stacks marketed for Crohn's and colitis have no controlled evidence that they induce or maintain remission. The harm isn't in the ingredients — it's in the framing. People feel well, conclude the protocol is what's working, and taper off the maintenance therapy that is actually holding the disease down. Inflammation is often silent, so the bill arrives months later as a flare, an admission, or surgery.",
    },
    bookTitle: "The Crohn's & Colitis Companion — supportive care alongside your team",
    bookUrl: null,
    landingSlug: "ibd-companion-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Deliberately sceptical framing. Histamine intolerance is a real clinical
  // picture and a genuinely contested diagnosis — the honest page says both,
  // and spends most of its length on the things it gets confused with.
  {
    slug: "histamine-intolerance",
    name: "Histamine intolerance",
    nameEmphasis: "intolerance",
    icon: "wine",
    category: "digestion",
    blurb: "A real pattern, a contested diagnosis — and several look-alikes worth excluding.",
    matchRules: [],
    intro:
      "The proposed mechanism is simple: histamine arrives in food and is also released by your own cells, and the enzyme **diamine oxidase (DAO)** breaks it down in the gut. If the histamine load exceeds what your DAO can clear, symptoms follow — flushing, headache, hives, a runny or blocked nose, palpitations, bloating and diarrhoea, sometimes within an hour of eating.\n\nHere is the honest position. **The symptom pattern is real and people genuinely improve on a low-histamine diet.** What's contested is the mechanism and the diagnosis: **there is no validated test**. Serum DAO and histamine levels don't reliably identify who responds, and much of the underlying research is small and inconsistent. Several allergy and gastroenterology bodies treat histamine intolerance as a working hypothesis rather than a settled diagnosis.\n\nWhy that matters practically: the symptoms overlap heavily with **mast cell disorders, real IgE food allergy, scombroid fish poisoning, carcinoid, medication side effects and IBS** — some of which are serious and specifically treatable. So this page does the diagnosis-of-exclusion work first, then runs a **short, structured, time-limited trial** — never an open-ended elimination diet, which is where the real harm in this area lives.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      {
        aliases: ["tryptase", "serum tryptase", "baseline tryptase"],
        label: "Tryptase",
        unit: "ng/mL",
        flagAbove: 11.4,
      },
      {
        aliases: ["eosinophils", "eosinophil count", "absolute eosinophils"],
        label: "Eosinophils",
        unit: "K/µL",
        flagAbove: 0.5,
      },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "Rule out the serious look-alikes first",
      body: "Flushing, hives and gut symptoms after eating can also be IgE food allergy, a mast cell disorder, scombroid poisoning or a medication effect. If you have ever had throat tightness, difficulty breathing, swelling of the lips or tongue, or fainting with a reaction, that is possible anaphylaxis and needs allergy assessment — not a diet trial.",
    },
    steps: [
      {
        id: "exclude",
        title: "Get the look-alikes excluded before you cut anything",
        detailTitle: "What this shares a symptom list with",
        why: "Several conditions produce exactly this picture, and at least two of them are dangerous to manage as a food intolerance.",
        grade: "A−",
        gradeNote: "Allergy society position statements · evidence summary",
        supervised: true,
        how: "**IgE food allergy** is the first thing to exclude. Allergy causes reproducible reactions to a specific food and can be life-threatening; histamine intolerance is dose-dependent and doesn't cause anaphylaxis. **If you've ever had lip or tongue swelling, throat tightness, breathing difficulty or fainting, that's an allergy assessment, not a diet trial.**\n\n**Mast cell activation disorders**, including mastocytosis, produce overlapping symptoms and have specific treatment. A **baseline serum tryptase** is the usual screening test and is worth asking about if symptoms are severe, systemic or include fainting.\n\n**Scombroid poisoning** — histamine formed in poorly stored oily fish (tuna, mackerel, mahi-mahi) — causes flushing and palpitations within minutes of a specific meal. It's a food safety problem, not an intolerance, and it can affect everyone at the table.\n\n**Medication.** A long list of common drugs inhibit DAO or release histamine, including some antibiotics, NSAIDs, opioids, some antidepressants and contrast agents. Bring the list.\n\n**And the boring ones:** IBS, coeliac disease, SIBO, and perimenopause all produce overlapping symptoms and are far more common.",
        evidence: [
          "Evidence summary — allergy and gastroenterology society position statements on histamine intolerance as a contested diagnosis.",
          "American Academy of Allergy, Asthma & Immunology — evaluation of adverse food reactions and mast cell disorders.",
          "Evidence summary — scombroid (histamine) fish poisoning and drug-induced histamine release.",
        ],
        checkFirst:
          "Reactions involving breathing difficulty, throat tightness, widespread hives with faintness, or swelling of the lips and tongue are potential anaphylaxis. That needs emergency care and an allergy referral — never a food diary.",
      },
      {
        id: "diary",
        title: "Keep a proper food and symptom diary first",
        why: "The pattern in histamine intolerance is dose-dependent and delayed, which makes it nearly impossible to spot from memory.",
        grade: "B+",
        gradeNote: "Evidence summary — dietetic assessment practice",
        how: "Log **everything you eat and drink with times**, plus symptoms with times and severity, for `2–4` weeks. Note **how long the food had been open or stored**, because that is a genuine variable here — histamine accumulates in leftovers.\n\n**The pattern you're looking for** is different from allergy: symptoms that are **dose-dependent** (a little is fine, more is not), **cumulative** across a day, **inconsistent** with the same food on different days, and typically arriving **`30` minutes to a few hours** after eating.\n\n**Log the non-food variables too** — alcohol (a major DAO inhibitor and histamine source in its own right), stress, sleep, exercise, menstrual cycle and medications. In women, symptoms often track the cycle, since oestrogen interacts with histamine signalling.\n\n**Take it to a dietitian.** Interpreting this well is a skill, and the alternative — self-interpretation — reliably produces an ever-shrinking food list.",
        evidence: [
          "Evidence summary — food and symptom diaries in the assessment of suspected food intolerance.",
          "British Dietetic Association — guidance on food intolerance assessment.",
          "Evidence summary — alcohol as a DAO inhibitor and dietary histamine source.",
        ],
        checkFirst:
          "If your list of tolerated foods is already shrinking, stop and get dietetic help now. Progressive self-elimination is the main harm in this area and it's much easier to prevent than to unwind.",
      },
      {
        id: "trial",
        title: "Run a short, structured low-histamine trial — then reintroduce",
        detailTitle: "Four weeks, with an end date",
        why: "A time-limited trial answers the question. An open-ended one becomes a nutritional problem of its own.",
        grade: "B",
        gradeNote: "Evidence summary — small uncontrolled dietary studies",
        how: "**Set the end date before you start: `2–4` weeks.** That is long enough to know, and short enough not to cause harm. Anyone recommending months of this without reintroduction is doing it wrong.\n\n**The high-histamine list**, roughly ranked: **aged cheeses, cured and processed meats, fermented foods (sauerkraut, kimchi, soy sauce, miso, vinegar), alcohol — especially red wine and beer — and fish that wasn't fresh or frozen promptly.** Then the histamine-releasers and DAO inhibitors people also react to: tomatoes, spinach, aubergine, avocado, citrus, strawberries and chocolate.\n\n**Freshness is the biggest single lever.** Histamine accumulates as food sits — a piece of fish or meat eaten fresh may be fine and the same food as leftovers may not. **Cook and freeze in portions, and don't keep leftovers in the fridge for days.** Many people find this alone does most of the work.\n\n**Then reintroduce, one food every `3` days, in a normal portion.** This step is not optional — it's the half that tells you what's actually true, and it's the half most people skip.",
        extra: {
          label: "Why the lists on the internet disagree with each other",
          body: "There is **no reliable histamine content database for food.** Levels vary enormously with storage, ripeness, processing and the specific batch — two pieces of the same cheese can differ several-fold. That's why every low-histamine list contradicts the last one, and why treating any of them as authoritative leads to cutting far more than necessary. Use them as a starting hypothesis, not as a rulebook.",
        },
        evidence: [
          "Evidence summary — small uncontrolled trials of low-histamine diets in suspected histamine intolerance.",
          "Evidence summary — variability of histamine content in foods by storage and processing.",
          "British Dietetic Association — structured elimination and reintroduction protocols.",
        ],
        checkFirst:
          "Don't do this without a dietitian if you're pregnant, breastfeeding, underweight, have a history of disordered eating, or are already avoiding several food groups. This diet cuts across many nutrient-dense foods and the nutritional risk is real.",
      },
      {
        id: "dao-supplements",
        title: "DAO supplements — what's known, and what isn't",
        why: "It's the most-marketed product in this space and the evidence is genuinely thin, which is worth saying plainly.",
        grade: "B",
        gradeNote: "Evidence summary — few small trials, inconsistent",
        supplement: true,
        labNote:
          "DAO supplements are expensive, largely unregulated, and the enzyme content is rarely verified. Given how thin the evidence is, this is a category where checking the Purity Score before spending is the minimum — and where a short defined trial beats a standing order.",
        how: "**DAO enzyme capsules** are taken before meals on the theory that they supplement the enzyme that breaks histamine down in the gut. A small number of trials suggest symptom improvement; they're small, several are industry-funded, and results are inconsistent. **This is a maybe, not a treatment.**\n\nIf you trial one: take it **`15` minutes before a meal**, and give it a defined `2–4` week test with a clear yes-or-no at the end. They're expensive, so an open-ended subscription is a poor bet on this evidence.\n\n**Vitamin C and copper** are cofactors for DAO and are commonly recommended. The evidence is mechanistic rather than clinical. Correcting a genuine deficiency is sensible; dosing high on a theory is not.\n\n**Quercetin** is widely sold as a natural mast cell stabiliser. Test-tube plausible, clinically unproven at supplement doses.\n\n**Careful with probiotics.** Some bacterial strains **produce** histamine — several *Lactobacillus* species among them — so a generic probiotic can make this worse. If you use one, choose a strain-specific product, and stop if symptoms worsen.",
        evidence: [
          "Evidence summary — randomised and open-label trials of diamine oxidase supplementation.",
          "Evidence summary — histamine-producing bacterial strains in probiotic preparations.",
          "NIH Office of Dietary Supplements — vitamin C and copper fact sheets.",
        ],
        checkFirst:
          "DAO supplements are often derived from porcine kidney — relevant if that matters to you. And no supplement here substitutes for excluding mast cell disorders or allergy if your symptoms are severe.",
      },
      {
        id: "gut-and-load",
        title: "Work on the gut and the total load, not just the food list",
        why: "Most people who improve here do it by lowering total burden across several inputs — not by finding one villain food.",
        grade: "B",
        gradeNote: "Evidence summary — mechanistic and observational",
        how: "**Alcohol is usually the biggest single win**, and it's not primarily about the histamine in the drink — alcohol directly inhibits DAO and triggers histamine release. Red wine, champagne and beer are the usual worst offenders. Cutting it is often more effective than any food restriction.\n\n**Fix the gut underneath.** DAO is produced by the small intestinal lining, so anything damaging it — coeliac disease, inflammatory bowel disease, untreated infection — reduces capacity. If there's an underlying gut condition, treating it is more productive than trimming the food list.\n\n**Consider SIBO** if bloating dominates. It's a genuine overlap and it's treated specifically.\n\n**Think in load, not in banned foods.** Symptoms are cumulative across a day. A glass of wine *or* aged cheese may be fine; both plus leftovers may not. That framing keeps a diet liveable in a way a blacklist never does.\n\n**Stress and sleep are real inputs** — mast cells respond to stress signalling, and most people notice worse reactions in bad weeks.",
        evidence: [
          "Evidence summary — intestinal DAO expression and mucosal integrity.",
          "Evidence summary — alcohol, DAO inhibition and histamine release.",
          "Evidence summary — overlap of suspected histamine intolerance with SIBO and IBS.",
        ],
        checkFirst:
          "Ongoing diarrhoea, weight loss, blood in your stool or anaemia are not histamine intolerance and need investigating properly. Those point at coeliac disease, IBD or something else entirely.",
      },
      {
        id: "long-term",
        title: "Get back to a normal diet — that's the goal",
        why: "The endpoint here is the widest diet you can tolerate, and the failure mode is a permanently shrinking one.",
        grade: "B+",
        gradeNote: "Dietetic consensus on elimination diet management",
        how: "**Most people find a threshold rather than a set of forbidden foods.** Aim to identify your tolerance level and eat freely below it, rather than to eliminate categories permanently.\n\n**Retry things periodically.** Tolerance changes — with gut healing, with hormonal shifts, with time. A food that caused problems a year ago may be fine now, and you only find out by testing.\n\n**Watch the nutritional cost.** A strict long-term low-histamine diet cuts across fermented foods, many vegetables and fruits, and often fish and dairy. That's a genuine risk to fibre, calcium, vitamin C and gut microbial diversity. A dietitian can keep the diet wide while managing symptoms — that is exactly the expertise worth paying for.\n\n**And keep the door open on the diagnosis.** If a careful trial and reintroduction doesn't produce a clear pattern, the honest conclusion may be that this isn't the explanation — and that's useful information, not a failure. IBS, anxiety, perimenopause and mast cell disorders are all still on the table.",
        evidence: [
          "British Dietetic Association — long-term management and reintroduction after elimination diets.",
          "Evidence summary — nutritional adequacy risks of restrictive elimination diets.",
          "Evidence summary — variability and change in reported food tolerance over time.",
        ],
        checkFirst:
          "If food restriction is causing anxiety around eating, social withdrawal or weight loss, that needs addressing directly. Restrictive eating that starts for medical reasons can become a disorder in its own right, and it's common enough to name.",
      },
    ],
    skipTheHype: {
      remedy: "IgG food sensitivity panels",
      why: "Marketed as a shortcut to your personal trigger list — a blood test that returns dozens of \"reactive\" foods — and heavily sold to people investigating histamine intolerance. **Every major allergy organisation has issued statements against them.** The reason is not subtle: IgG antibodies to food indicate **exposure and normal immune tolerance**, not intolerance. A high IgG to eggs usually means you eat eggs. Used as a diagnostic, the test reliably returns a long list of common foods, which is exactly why it feels revelatory — and exactly why it leads to unnecessary elimination, nutritional shortfalls and, in a documented pattern, disordered eating. It costs several hundred pounds to be told to stop eating the things you eat most.",
    },
    bookTitle: "The Histamine Question — testing the theory without wrecking your diet",
    bookUrl: null,
    landingSlug: "histamine-intolerance",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "lactose-intolerance",
    name: "Lactose intolerance",
    nameEmphasis: "intolerance",
    icon: "milk",
    category: "digestion",
    blurb: "The normal adult state for most of the world — and rarely a reason to cut dairy entirely.",
    matchRules: [],
    intro:
      "Lactose is the sugar in milk. The enzyme **lactase** splits it so you can absorb it, and in most mammals — humans included — lactase production falls after weaning. **Lactase non-persistence is the genetic norm for roughly `65–70%` of the world's adults.** Continued production into adulthood is the evolutionary novelty, common in northern European ancestry and much rarer in East Asian, West African, Indigenous American and Southeast Asian populations.\n\nSo the framing matters: this usually isn't a disease or a damaged gut. It's the default human setting.\n\nUndigested lactose passes into the colon, where bacteria ferment it — producing gas, bloating, cramping and diarrhoea, typically **`30` minutes to `2` hours** after dairy.\n\nAnd the practical headline that most people never hear: **this is dose-dependent, and near-total avoidance is almost never necessary.** Studies consistently find that most people with lactose intolerance tolerate around **`12 g` of lactose — a cup of milk — in one sitting without significant symptoms**, especially with food. The people who cut all dairy for life usually did so on far less information than that.",
    signals: [
      { markerId: "calcium", label: "Calcium", unit: "mg/dL", flagBelow: 8.5 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    steps: [
      {
        id: "confirm",
        title: "Confirm it's lactose — and not the several things it mimics",
        detailTitle: "Self-diagnosis goes wrong here often",
        why: "Coeliac disease, IBS and a milk protein allergy all cause similar symptoms after dairy, and the treatment for each is different.",
        grade: "A−",
        gradeNote: "NIH / NIDDK · AGA guidance",
        supervised: true,
        how: "**The hydrogen breath test** is the usual clinical test: you drink a lactose solution and breath hydrogen is measured, since colonic fermentation produces it. There's also a **lactose tolerance blood test** and genetic testing for lactase persistence.\n\n**A structured home trial is reasonable too:** remove lactose for `2` weeks, then reintroduce a measured amount and watch. That's cheap and often sufficient.\n\n**What to rule out first, though:**\n\n**Coeliac disease** — it damages the intestinal lining where lactase lives, causing **secondary** lactose intolerance. Treat the coeliac disease and the lactose problem often resolves. **Test for coeliac before going dairy-free**, and while still eating gluten.\n**IBS** — extremely common, overlaps heavily, and dairy is often blamed for a broader FODMAP sensitivity.\n**Cow's milk protein allergy** — an immune reaction to the protein, not the sugar. Lactase pills won't help, and reactions can be severe.\n\n**Secondary lactose intolerance** also follows gastroenteritis, and it is usually **temporary** — weeks to months. Don't make a permanent decision on a temporary problem.",
        evidence: [
          "NIH / NIDDK — lactose intolerance: diagnosis and testing.",
          "American Gastroenterological Association — evaluation of chronic diarrhoea and carbohydrate malabsorption.",
          "Evidence summary — secondary lactose intolerance following gastroenteritis and in untreated coeliac disease.",
        ],
        checkFirst:
          "Weight loss, blood in your stool, symptoms that wake you at night, or a family history of coeliac disease or IBD need investigating — not a dairy-free trial. And get coeliac testing done before you change your diet, or the result is unreliable.",
      },
      {
        id: "dose",
        title: "Find your threshold instead of cutting dairy out",
        detailTitle: "The 12-gram finding",
        why: "Most people tolerate far more lactose than they think, and total avoidance costs calcium, protein and quality of life for no benefit.",
        grade: "A",
        gradeNote: "NIH consensus · systematic reviews of lactose tolerance",
        how: "**Most adults with lactose intolerance tolerate about `12 g` of lactose — roughly `250 ml` / one cup of milk — at a time with few or no symptoms**, particularly when it's taken with other food. That figure comes from an NIH consensus review of the evidence, and it is the single most useful fact on this page.\n\n**How to find your own line:** start with a small amount — say `50 ml` of milk with a meal — and increase every few days until symptoms appear. That number is your threshold, and you can eat freely below it.\n\n**Spread it across the day** rather than taking it all at once. Two small servings are usually tolerated where one large one isn't.\n\n**Always take dairy with a meal.** Food slows gastric emptying, which gives what lactase you have more time to work. Milk in coffee after lunch behaves quite differently from a glass of milk on an empty stomach.\n\n**Fat helps too** — whole milk is often better tolerated than skimmed for exactly that reason.",
        evidence: [
          "NIH Consensus Development Conference — lactose intolerance and health.",
          "Systematic reviews of tolerated lactose doses in adults with lactase non-persistence.",
          "NIH / NIDDK — eating, diet and nutrition for lactose intolerance.",
        ],
        checkFirst:
          "If even tiny amounts cause severe symptoms, or you get hives, swelling or breathing symptoms, that's not lactose intolerance — that pattern suggests milk protein allergy and needs allergy assessment.",
      },
      {
        id: "which-dairy",
        title: "Learn which dairy is already low in lactose",
        why: "A large amount of dairy contains little or no lactose, and most people avoiding it don't know which.",
        grade: "A−",
        gradeNote: "NIDDK · food composition data",
        how: "**Hard and aged cheeses are essentially lactose-free.** Cheddar, parmesan, Swiss, gouda, aged goat's cheese — the lactose is drained off with the whey and what remains is fermented during ageing. Parmesan has effectively none. This alone gives most people cheese back.\n\n**Butter** is almost entirely fat — trace lactose, tolerated by nearly everyone.\n\n**Yoghurt with live cultures is usually well tolerated** even though the lactose is still there: the bacteria carry their own lactase and continue digesting it in your gut. **Greek yoghurt is lower still**, since straining removes lactose-containing whey. **Kefir** is well tolerated for the same reason.\n\n**The higher-lactose ones:** milk, cream, ice cream, soft cheeses (ricotta, cottage cheese, cream cheese), condensed milk, and milk powder in processed foods.\n\n**Lactose-free milk is real milk** with lactase added — same protein, same calcium, same nutrition, just pre-digested. It's the simplest swap and it tastes slightly sweeter because the split sugars are sweeter than lactose.\n\n**A2 milk** is a different thing entirely — a protein variant, not lower in lactose. It won't help lactose intolerance, whatever the packaging implies.",
        evidence: [
          "NIH / NIDDK — lactose content of common dairy foods.",
          "Evidence summary — bacterial lactase activity in yoghurt and fermented dairy and its effect on tolerance.",
          "Evidence summary — A2 beta-casein milk and lactose content.",
        ],
        checkFirst:
          "If dairy causes symptoms regardless of lactose content — including hard cheese and butter — reconsider the diagnosis. That pattern points at milk protein rather than lactose.",
      },
      {
        id: "calcium",
        title: "Protect your calcium and vitamin D — this is the real risk",
        detailTitle: "What avoiding dairy actually costs",
        why: "The genuine health consequence of lactose intolerance isn't the symptoms — it's the bone health of people who cut dairy without replacing what it provided.",
        grade: "A",
        gradeNote: "NIH consensus · NIH Office of Dietary Supplements",
        supplement: true,
        labNote:
          "If you supplement calcium, the form and dose both matter — calcium carbonate needs stomach acid and must be taken with food, citrate doesn't. Split doses absorb better than one large one. Check the elemental calcium figure on the label rather than the compound weight.",
        how: "Adults need roughly **`1,000–1,200 mg` of calcium daily**, and dairy is where most people in Western diets get it. Cutting dairy without a plan is the actual harm in this condition, and the NIH consensus statement flags it specifically.\n\n**Non-dairy sources worth knowing:** **fortified plant milks** (shake them — the calcium settles), **tinned sardines and salmon with the bones**, **tofu set with calcium sulphate**, **kale, bok choy and broccoli** (better absorbed than spinach, whose oxalate binds calcium), **almonds**, **white beans**, and fortified orange juice.\n\n**But note:** most low-lactose dairy is still excellent calcium. **Hard cheese and yoghurt** deliver a lot with very little lactose — for most people that's the easiest route back to adequacy.\n\n**Vitamin D matters just as much**, since it governs calcium absorption. Milk is fortified in many countries; if you've cut it, check your intake.\n\n**Food first, supplements second** where you can. Calcium supplements have a less favourable safety profile than dietary calcium and are worth taking only for a genuine shortfall.",
        evidence: [
          "NIH Consensus Development Conference — lactose intolerance and health: calcium adequacy concerns.",
          "NIH Office of Dietary Supplements — calcium and vitamin D fact sheets.",
          "Evidence summary — calcium bioavailability from dairy and plant sources.",
        ],
        checkFirst:
          "If you've avoided dairy for years without replacing calcium — especially if you're post-menopausal, over 50, or have had a fracture — ask your doctor about bone density. This is the part of lactose intolerance that actually causes long-term harm.",
      },
      {
        id: "lactase",
        title: "Use lactase supplements for the meals that matter",
        why: "They work, they're cheap, and they're for the occasion rather than the everyday.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials of lactase supplementation",
        supplement: true,
        labNote:
          "Lactase products are dosed in FCC units and the strength varies widely between brands — the dose matters more than the price. Check the declared unit count rather than the pill count.",
        how: "**Take it with the first bite**, not afterwards — the enzyme has to be in the stomach with the lactose. If the meal runs long, a second dose partway through helps.\n\n**Dose to the meal.** A splash of milk in coffee needs little; a bowl of ice cream needs more. Trials support effectiveness, and individual responses vary enough that finding your own dose is worth a couple of tries.\n\n**Lactase drops** added to milk `24` hours in advance pre-digest it — cheaper than lactose-free milk if you use a lot.\n\n**This is a tool for the meal out, the birthday cake, the holiday**, not a licence to override your threshold three times a day. Working out your tolerance is a better long-term strategy than dosing enzymes around every meal.\n\n**If it doesn't work at all**, that's meaningful — reconsider whether lactose is really the problem.",
        evidence: [
          "Evidence summary — randomised trials of exogenous lactase supplementation and symptom reduction.",
          "NIH / NIDDK — lactase products and their use.",
          "Evidence summary — dose-response variability in commercial lactase preparations.",
        ],
        checkFirst:
          "Lactase supplements do nothing for milk protein allergy — and using one to push through a reaction that isn't lactose-related is how a genuine allergy gets missed.",
      },
      {
        id: "if-it-persists",
        title: "If cutting lactose doesn't fix it, look further",
        why: "A large proportion of people who self-diagnose lactose intolerance turn out to have something else, and staying dairy-free for the wrong reason has a cost.",
        grade: "B+",
        gradeNote: "Evidence summary — blinded lactose challenge studies",
        how: "**Blinded challenge studies are humbling reading.** A substantial share of people who identify as lactose intolerant do not report symptoms when given lactose blind, and many report symptoms after a placebo. Expectation is a genuinely powerful driver of gut symptoms, which is not a criticism — it's a reason to test rather than assume.\n\n**If you're dairy-free and still symptomatic, look at:**\n\n**IBS and other FODMAPs** — fructans in wheat and onion, sorbitol, fructose. A structured low-FODMAP trial with a dietitian sorts this out properly.\n**Coeliac disease** — test while still eating gluten.\n**SIBO** — if bloating dominates.\n**Bile acid diarrhoea** — often missed, and specifically treatable.\n\n**And be careful with the substitutes.** Many \"free-from\" products contain sorbitol, inulin or other sweeteners that cause exactly the symptoms you were avoiding — plenty of people swap milk for an oat drink and feel worse.",
        evidence: [
          "Evidence summary — blinded lactose challenge studies in self-reported lactose intolerance.",
          "Monash University — low FODMAP diet evidence base.",
          "Evidence summary — bile acid diarrhoea as an under-recognised cause of chronic diarrhoea.",
        ],
        checkFirst:
          "Persistent diarrhoea, unintended weight loss, blood in your stool, or night-time symptoms need proper investigation regardless of what you've cut out. Those aren't lactose symptoms.",
      },
    ],
    skipTheHype: {
      remedy: "Going completely dairy-free \"just in case\"",
      why: "The most common intervention in lactose intolerance is also the most over-applied one. **The NIH consensus review concluded that most people with lactose intolerance can tolerate around `12 g` of lactose at a time** — a cup of milk — and that unnecessary dairy avoidance is a genuine public health concern because of its effect on calcium intake and bone health. Meanwhile a large share of people who cut dairy never had lactose intolerance at all: blinded challenges routinely fail to reproduce their symptoms, and the real cause is often IBS, another FODMAP, or coeliac disease still undiagnosed. Cutting a nutrient-dense food group is not a free action. Find your threshold, keep the hard cheese and yoghurt, and spend the effort on finding out what's actually going on.",
    },
    bookTitle: "The Dairy Threshold — keeping the cheese, losing the symptoms",
    bookUrl: null,
    landingSlug: "lactose-intolerance",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "hemorrhoids",
    name: "Hemorrhoids",
    icon: "armchair",
    category: "digestion",
    blurb: "Common, treatable — and never something to self-diagnose from the symptom alone.",
    matchRules: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "Haemorrhoids are cushions of blood vessels that everyone has, sitting inside the anal canal, where they help with continence. They become a problem when they swell, prolapse or bleed — typically from **straining, constipation, prolonged sitting on the toilet, pregnancy, or heavy lifting.** Roughly half of adults will have symptoms at some point.\n\nThe symptoms are unmistakable enough that most people diagnose themselves: bright red blood on the paper or in the bowl, itching, a lump, discomfort. **That self-diagnosis is the danger.** Rectal bleeding is also the first sign of colorectal cancer, of inflammatory bowel disease, and of several other conditions — and colorectal cancer is rising in adults under 50. \"It's just piles\" is one of the most costly assumptions in medicine, precisely because it's usually correct.\n\nThe treatment itself is well established and mostly unglamorous: **fibre, fluid, and stopping the straining.** A large randomised evidence base supports fibre specifically. Almost everything else — creams, wipes, herbal capsules — is comfort care layered on top of that.",
    matchedIntro:
      "Your iron stores are low, which is worth taking seriously alongside any rectal bleeding. Haemorrhoids can cause iron deficiency, but so can several other sources of blood loss — and low iron plus bleeding is exactly the combination that earns a proper look rather than a cream.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      {
        aliases: ["hemoglobin", "haemoglobin", "hgb", "hb"],
        label: "Haemoglobin",
        unit: "g/dL",
        flagBelow: 12,
      },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    doctorBanner: {
      title: "Never assume rectal bleeding is haemorrhoids",
      body: "Bleeding from the back passage needs a doctor's assessment — even when haemorrhoids are the likely cause and even when you have had them before. Colorectal cancer, IBD and anal fissures all bleed too, and rates of colorectal cancer in younger adults are rising. Get it examined, then treat the haemorrhoids.",
    },
    steps: [
      {
        id: "get-examined",
        title: "Get it looked at before you treat it",
        detailTitle: "Why 'I know what this is' isn't enough",
        why: "Rectal bleeding has several causes and the serious ones are treatable when they're found early.",
        grade: "A",
        gradeNote: "ASCRS clinical practice guideline · NICE",
        supervised: true,
        how: "**See a doctor for any rectal bleeding**, even if you've had haemorrhoids before and even if it looks identical. Examination takes a couple of minutes and settles it.\n\n**These features mean go promptly, not eventually:** you're **over 40**, the bleeding is **dark or mixed into the stool** rather than bright red on the surface, there's been a **change in bowel habit lasting weeks**, **unintended weight loss**, **abdominal pain**, **anaemia**, or a **family history of bowel cancer or IBD**.\n\n**Colorectal cancer incidence in adults under 50 has been rising**, and young age is no longer the reassurance it once was. Screening guidance in the US now starts at `45`.\n\n**What to expect:** a visual inspection, a digital rectal examination, and often a **proctoscopy** — a short look into the anal canal. Uncomfortable, brief, and it distinguishes haemorrhoids from a fissure, which is treated differently. Depending on your risk, a colonoscopy may follow.\n\nThe embarrassment is real. It is also, without exception, a worse reason to wait than any reason to go.",
        evidence: [
          "American Society of Colon and Rectal Surgeons — clinical practice guideline for the management of hemorrhoids.",
          "NICE — suspected cancer: recognition and referral (lower gastrointestinal).",
          "Evidence summary — rising incidence of early-onset colorectal cancer.",
        ],
        checkFirst:
          "Heavy bleeding, dizziness or fainting, severe pain with a hard tender lump, or fever with anal pain needs urgent care. A thrombosed haemorrhoid is most treatable within the first 72 hours, and a perianal abscess is an emergency.",
      },
      {
        id: "fibre",
        title: "Fibre and fluid — the treatment with the actual evidence",
        detailTitle: "The intervention everything else is layered on",
        why: "Fibre supplementation has randomised evidence for reducing symptoms and bleeding, which is more than can be said for most of the shelf.",
        grade: "A",
        gradeNote: "Cochrane review — fibre for haemorrhoids",
        supplement: true,
        labNote:
          "Fibre supplements are simple products where dose and form are what matter — psyllium is the best-studied. Prefer plain psyllium husk over flavoured blends with added sweeteners, which often carry sugar alcohols that cause their own gut symptoms.",
        how: "**A Cochrane review of randomised trials found fibre reduces symptoms and bleeding** in haemorrhoids. It is the highest-graded intervention on this page and it's cheap.\n\n**Target around `25–30 g` of fibre a day.** Food first: beans and lentils, oats, fruit with the skin, vegetables, whole grains, nuts and seeds. Two kiwifruit a day has trial evidence for constipation specifically and is a pleasant way in.\n\n**Add a supplement if food doesn't get you there.** **Psyllium** is the best-studied. Start low — `1` teaspoon daily — and build over `2` weeks; going straight to a full dose causes bloating and makes people quit.\n\n**Fluid is not optional.** Fibre works by holding water; taken without it, it makes constipation worse. Roughly `2` litres a day, more in heat or with exercise.\n\n**Give it time.** Trials run over weeks, and the benefit builds. Judging fibre after three days is judging it too early.\n\nThe goal is a stool that's **soft and formed, passed without straining** — that's the whole mechanical target.",
        evidence: [
          "Cochrane systematic review — laxatives and fibre for the treatment of haemorrhoids.",
          "American Society of Colon and Rectal Surgeons — dietary and lifestyle management of hemorrhoids.",
          "Evidence summary — psyllium supplementation and stool consistency.",
        ],
        checkFirst:
          "Increase fibre gradually and with fluid — a sudden jump causes bloating and cramping. If you have a bowel stricture, a history of obstruction, or swallowing difficulty, check with your doctor before starting a bulking agent.",
      },
      {
        id: "toilet-habits",
        title: "Change what happens on the toilet — this is bigger than it sounds",
        detailTitle: "Straining, sitting time and the phone",
        why: "Prolonged sitting and straining are the mechanical cause, and both are habits rather than physiology.",
        grade: "A−",
        gradeNote: "ASCRS guideline · evidence summary",
        how: "**Don't take your phone in.** This is the most practical sentence on the page. Sitting on the toilet for `15` minutes reading keeps the anal cushions engorged, and the modern rise in sitting time is a genuine contributor. **Aim for under `5` minutes.**\n\n**Don't strain.** If nothing is happening, get up and come back later. Pushing hard against a closed system is exactly what damages the cushions.\n\n**Go when you get the urge.** Habitually postponing lets stool dry out in the rectum and guarantees straining later.\n\n**Use a footstool.** Raising your knees above your hips straightens the anorectal angle and lets things pass with less effort. A small stool, or a stack of books, does it.\n\n**Clean gently.** Wet wipes or water beat dry paper, but **avoid wipes with alcohol, fragrance or preservatives** — they're a common cause of contact dermatitis that people then mistake for worsening haemorrhoids. Pat dry rather than rubbing.\n\n**Don't scratch.** Itching is common and scratching damages already-inflamed skin, which itches more.",
        evidence: [
          "American Society of Colon and Rectal Surgeons — behavioural and toilet-habit recommendations.",
          "Evidence summary — defecation posture, anorectal angle and straining effort.",
          "Evidence summary — perianal contact dermatitis from wipes and topical preparations.",
        ],
        checkFirst:
          "Persistent itching that doesn't settle with these measures needs a look — it can be dermatitis, a fungal infection, threadworm or a skin condition rather than haemorrhoids, and each is treated differently.",
      },
      {
        id: "symptom-relief",
        title: "Use the comfort measures for what they are",
        why: "Sitz baths and topical treatments genuinely help symptoms — they just don't fix the cause, and knowing that keeps expectations right.",
        grade: "B+",
        gradeNote: "ASCRS guideline · evidence summary",
        how: "**Sitz baths** — sitting in warm water for `10–15` minutes, `2–3` times a day and after bowel movements — are the most useful comfort measure. They relax the anal sphincter and improve blood flow, and they cost nothing.\n\n**Cold packs** for `10–15` minutes reduce acute swelling, especially in the first day or two of a flare. Wrapped, never directly on skin.\n\n**Over-the-counter preparations**, honestly ranked: **plain barrier ointments and witch hazel pads** soothe and protect. **Short courses of hydrocortisone-containing creams** reduce inflammation, but should be used for no more than about `7` days — longer thins the skin and makes things worse. **Products containing local anaesthetics** relieve pain and are a common cause of allergic contact dermatitis, so watch for symptoms getting oddly worse.\n\n**Paracetamol for pain.** **Avoid opioid-containing painkillers** — codeine causes constipation, which is the mechanism you're trying to escape. NSAIDs are fine for most people but can irritate the stomach.\n\n**Flavonoid supplements** (diosmin, hesperidin, horse chestnut) have a real evidence base for haemorrhoidal symptoms and bleeding — used routinely in some countries, less so in others. Worth mentioning to your doctor; **avoid in pregnancy** without advice.",
        evidence: [
          "American Society of Colon and Rectal Surgeons — topical and conservative therapy for hemorrhoids.",
          "Evidence summary — systematic reviews of phlebotonic (flavonoid) therapy for haemorrhoids.",
          "Evidence summary — corticosteroid and local anaesthetic preparations: duration limits and contact dermatitis.",
        ],
        checkFirst:
          "Don't use steroid creams in this area for more than about a week without medical advice, and avoid codeine-containing painkillers entirely — constipation is the one thing you can least afford here.",
      },
      {
        id: "prevent",
        title: "Fix the load underneath — lifting, sitting, weight",
        why: "Haemorrhoids recur when the pressure that caused them is still there, and most of that pressure is habitual.",
        grade: "B+",
        gradeNote: "Evidence summary — risk factors and recurrence",
        how: "**Breathe out through the effort when you lift.** Holding your breath and bearing down — the Valsalva manoeuvre — spikes abdominal and pelvic venous pressure. This applies in the gym and when moving furniture, and it's a habit worth rebuilding if you lift heavy regularly.\n\n**Get up from your desk.** Prolonged sitting raises pressure in the same veins. A few minutes of movement each hour is enough.\n\n**Move daily.** Regular activity keeps the bowel working and reduces constipation, which is the upstream cause.\n\n**Weight matters** — higher body weight raises intra-abdominal pressure and is an associated risk factor.\n\n**Pregnancy is a special case.** Haemorrhoids are very common in the third trimester and after delivery, from pressure and hormonal changes, and they frequently resolve postpartum. **Get treatment cleared by your midwife or doctor** — several oral and topical products aren't recommended in pregnancy.\n\n**Review chronic cough and constipating medications** with your doctor — iron supplements, opioids and some antidepressants all constipate, and each has options.",
        evidence: [
          "Evidence summary — risk factors for haemorrhoidal disease including sedentary behaviour, obesity and heavy lifting.",
          "American Society of Colon and Rectal Surgeons — prevention and recurrence.",
          "Evidence summary — haemorrhoids in pregnancy and the postpartum period.",
        ],
        checkFirst:
          "If you're pregnant or breastfeeding, clear any oral or topical treatment with your midwife or doctor first — several standard options aren't recommended, and the safe list is short but real.",
      },
      {
        id: "procedures",
        title: "Know the procedures — and that they're quick",
        why: "People endure years of symptoms believing the only option is major surgery, when the common treatments are outpatient and take minutes.",
        grade: "A−",
        gradeNote: "ASCRS clinical practice guideline",
        supervised: true,
        how: "If conservative treatment hasn't worked after a few months, or symptoms are significant, there are effective office-based options — and most people are surprised how minor they are.\n\n**Rubber band ligation** is the most common: a small band is placed at the base of the haemorrhoid, cutting off its blood supply so it drops off within days. It takes a few minutes, needs no anaesthetic, and has the best evidence among the office procedures for internal haemorrhoids.\n\n**Sclerotherapy and infrared coagulation** are alternatives for smaller ones.\n\n**Surgical haemorrhoidectomy** is reserved for large, prolapsed or persistent disease. It is effective and it is genuinely painful to recover from — which is why it's the last option, not the first.\n\n**A thrombosed external haemorrhoid** — a sudden, exquisitely painful hard lump — is a special case: it can be **drained, and that's most effective within the first `72` hours.** After that, it settles on its own over a couple of weeks. If it's agony and it's new, that's a same-week appointment, not a wait-and-see.",
        evidence: [
          "American Society of Colon and Rectal Surgeons — clinical practice guideline: office-based and surgical treatment of hemorrhoids.",
          "Evidence summary — rubber band ligation versus sclerotherapy and infrared coagulation.",
          "Evidence summary — timing of intervention for acutely thrombosed external haemorrhoids.",
        ],
        checkFirst:
          "If you take anticoagulants or antiplatelet medication, say so before any procedure — bleeding risk after banding is higher and the plan may need adjusting. Never stop those medications yourself.",
      },
    ],
    skipTheHype: {
      remedy: "Herbal \"hemorrhoid cure\" capsules and detox suppositories sold online",
      why: "The category promises to shrink haemorrhoids permanently from the inside, usually with a proprietary herbal blend and often with an accompanying detox regimen. **There is no evidence that any oral herbal product cures haemorrhoids**, and the one class with genuine trial support — flavonoids like diosmin — improves symptoms and bleeding rather than eliminating the underlying vessels. Some imported products have been found to contain undeclared steroids, which cause real damage in this area with prolonged use. The most serious problem, though, is what they encourage: **treating rectal bleeding at home without an examination.** Colorectal cancer, inflammatory bowel disease and anal fissures all bleed the same way, and the months spent on capsules are months without a diagnosis. Fibre, fluid, five minutes on the toilet and a doctor who has actually looked — that's the protocol with evidence behind it.",
    },
    bookTitle: "The Hemorrhoid Handbook — what works, and what needs a doctor",
    bookUrl: null,
    landingSlug: "hemorrhoids",
  },
];
