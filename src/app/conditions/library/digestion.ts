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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
