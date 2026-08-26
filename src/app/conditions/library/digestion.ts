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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
