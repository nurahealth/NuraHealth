// ─────────────────────────────────────────────────────────────────────────────
// Library — Nutrition & deficiency.
//
// Content only. See ../types.ts for the shape and the rules every entry obeys.
//
// This category is the most test-first in the section by design. Every entry
// here is a number a lab measures, which means the honest protocol always
// starts with "find out where you actually are" rather than "take this". The
// iron page in particular refuses to hand out a dose: blind iron is one of the
// few genuinely dangerous things a wellness app can talk someone into.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const NUTRITION_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // The hardest doctor-forward line in the library: no dose anywhere on the
  // page, because "tired, so I'll take iron" is how haemochromatosis and
  // undiagnosed bleeding both get missed.
  {
    slug: "iron-anemia-support",
    name: "Iron & anemia support",
    nameEmphasis: "& anemia support",
    icon: "syringe",
    category: "nutrition",
    blurb: "Test first, always — and find out why before you fix the number.",
    matchRules: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsat", label: "Transferrin saturation", unit: "%", flagBelow: 20 },
    ],
    intro:
      "Iron deficiency is the most common nutritional shortfall in the world, and the symptoms are famously unremarkable: tired, cold, breathless on the stairs, foggy, hair thinning, restless legs at night. Plenty of people have all of it with a completely normal haemoglobin, because **you run down your iron stores long before you become anaemic.** Ferritin is what falls first.\n\nHere is the part most supplement marketing skips. In an adult, low iron is **a finding, not a diagnosis.** Your body has no route to excrete iron on purpose, so if stores are dropping, iron is either not coming in or going out somewhere — and in adults over 50, and in anyone with gut symptoms, the \"going out somewhere\" possibilities are the ones that matter most to rule out.\n\nSo this page does something the rest of the library doesn't: **it names no dose.** Not because iron doesn't work — it works extremely well — but because the version of this that hurts people is taking it blind. Iron overload is real, some people carry the genes for it, and supplements can normalise a number while the reason for it goes unexamined for a year.",
    matchedIntro:
      "Your iron markers came back low, which is why this is near the top of your list. That is a result to take to your doctor rather than to a supplement aisle — not because it's alarming, but because the first question is *why*, and the answer changes what happens next.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "iron", label: "Serum iron", unit: "μg/dL", flagBelow: 60 },
      { markerId: "tsat", label: "Transferrin saturation", unit: "%", flagBelow: 20 },
      {
        aliases: ["hemoglobin", "haemoglobin", "hgb", "hb"],
        label: "Haemoglobin",
        unit: "g/dL",
        flagBelow: 12,
      },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "folate", label: "Folate", unit: "ng/mL", flagBelow: 4 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    doctorBanner: {
      title: "Never supplement iron blind",
      body: "Iron is the one nutrient in this library where guessing can do real damage. Some people absorb and store too much of it genetically, and in adults, unexplained iron loss occasionally has a cause that needs finding rather than topping up. Get the blood test, get the reason, then take what your clinician actually prescribes.",
    },
    steps: [
      {
        id: "test-first",
        title: "Get the blood test before you buy anything",
        detailTitle: "The panel that actually answers the question",
        why: "\"I'm tired so I'll try iron\" is the single most common mistake here, and it can hide something that needed looking at.",
        grade: "A",
        gradeNote: "British Society of Gastroenterology · American Society of Hematology",
        supervised: true,
        how: "Ask for a **full blood count (CBC) plus ferritin**, and ideally **transferrin saturation** alongside it. The CBC tells your doctor whether you are anaemic; ferritin tells them whether your *stores* are down, which happens far earlier.\n\nOne wrinkle worth knowing: **ferritin also rises with inflammation**, so a normal-looking ferritin during an infection, a flare or obesity can still sit on top of real deficiency. That's why transferrin saturation and a CRP are useful in the same draw — they keep a falsely reassuring number from closing the case.\n\nAnd because the same symptoms come from more than one shortfall, a sensible first panel usually includes **B12 and folate** too. Treating the wrong one wastes months.",
        extra: {
          label: "Why 'normal' ferritin often isn't the end of it",
          body: "Lab reference ranges for ferritin start startlingly low — some report `10–15 ng/mL` as the bottom of normal. Most clinicians treating symptomatic iron deficiency work to a considerably higher floor than that, and there is genuine, ongoing debate about where it should sit. If you feel like iron deficiency and your ferritin is technically in range but near the bottom, that is a conversation to have, not a door that's closed.",
        },
        evidence: [
          "British Society of Gastroenterology — guidelines for the management of iron deficiency anaemia in adults.",
          "American Society of Hematology — patient resources on iron-deficiency anemia.",
          "NIH Office of Dietary Supplements — iron fact sheet for health professionals.",
        ],
        checkFirst:
          "Black or tarry stools, visible blood, unexplained weight loss, or shortness of breath at rest are not \"take iron and see\" symptoms. Those go to a doctor the same week.",
      },
      {
        id: "find-the-cause",
        title: "Find out why it's low — that's the real work",
        detailTitle: "Low iron is a symptom, not a diagnosis",
        why: "Adults don't usually become iron-deficient out of nowhere. Something is either blocking intake or draining stores, and naming it is what actually fixes the problem.",
        grade: "A",
        gradeNote: "BSG guideline — strong recommendation",
        supervised: true,
        how: "The four routes your clinician will think through:\n\n**Blood loss.** Heavy periods are the single most common cause in menstruating people and are wildly under-reported — if you're changing protection hourly, flooding, or passing large clots, that is a medical finding, not a personality trait. In men and in post-menopausal women, the gut is the first place investigated, which is why iron deficiency in those groups usually earns a gastroenterology referral.\n\n**Absorption.** **Coeliac disease** is a classic hidden cause and gets screened routinely in unexplained iron deficiency. So do *H. pylori*, and long-term acid-suppressing medication.\n\n**Intake.** Genuinely low dietary iron — restrictive eating, some vegetarian and vegan patterns without attention to it.\n\n**Demand.** Pregnancy, growth, heavy endurance training, blood donation.",
        extra: {
          label: "The one that runs the other way",
          body: "**Haemochromatosis** is a common inherited condition where the body absorbs and stores too much iron, and it quietly damages the liver, heart and pancreas over decades. It is picked up by a high transferrin saturation and ferritin — the exact panel above. This is the concrete reason \"just take iron, it can't hurt\" is wrong: for a meaningful slice of the population, it can.",
        },
        evidence: [
          "British Society of Gastroenterology — investigating the cause of iron deficiency anaemia in adults.",
          "NIH / NIDDK — hemochromatosis: causes, diagnosis and treatment.",
          "CDC — iron deficiency and screening recommendations.",
        ],
        checkFirst:
          "If your iron corrects on supplements and then falls again once you stop, that is information. It means the drain was never found. Take that pattern back to your doctor rather than simply restarting the pills.",
      },
      {
        id: "take-it-right",
        title: "If iron is prescribed, take it the way it absorbs",
        detailTitle: "Getting the most out of a prescribed dose",
        why: "How and when you take iron changes how much of it you actually absorb, and how rough it feels — and most people are never told either part.",
        grade: "A−",
        gradeNote: "Randomised absorption trials · NIH ODS",
        supervised: true,
        supplement: true,
        labNote:
          "Iron supplements vary more than almost any other category — elemental iron content is often buried or absent from the front label, and \"gentle\" forms carry very different amounts per capsule. If your clinician has recommended one, check the Purity Score and confirm the elemental iron figure rather than the compound weight.",
        how: "**Your dose comes from your clinician**, not from this page and not from the bottle. What's worth knowing is the technique around it.\n\n**Every other day often beats every day.** Absorption trials found that a dose of iron raises hepcidin — the hormone that shuts iron absorption down — for roughly the following day, so alternate-day dosing can absorb as much or more in total while causing fewer side effects. Ask your doctor whether that suits your case.\n\n**Pair it with vitamin C** or a vitamin-C-rich food; the acid meaningfully improves uptake of the non-haem iron in supplements.\n\n**Keep a gap from the blockers**: coffee, tea, calcium and dairy, antacids and zinc all cut absorption. `2` hours either side is the usual advice.\n\nIf it wrecks your stomach, say so rather than quitting — dose, timing and form can all be changed.",
        extra: {
          label: "The side effects nobody warns you about",
          body: "Iron commonly causes constipation, nausea and **black stools**. Black from iron is expected and harmless; black and *tarry* with a distinctive smell is not, and needs urgent review. Also: liquid iron stains teeth — drink it through a straw and rinse.",
        },
        evidence: [
          "Randomised trials of alternate-day versus daily oral iron dosing and their effect on fractional absorption (hepcidin response).",
          "NIH Office of Dietary Supplements — iron: forms, absorption and interactions.",
          "British Society of Gastroenterology — oral iron therapy and tolerability.",
        ],
        checkFirst:
          "Never take iron \"just in case\", never give a child an adult iron supplement, and keep it out of reach — iron overdose is one of the leading causes of poisoning deaths in young children.",
      },
      {
        id: "food-side",
        title: "Build the food side around haem and vitamin C",
        why: "Food won't correct a real deficiency on its own, but it decides whether you slide back into one after treatment ends.",
        grade: "A−",
        gradeNote: "NIH Office of Dietary Supplements · dietetic guidance",
        how: "There are two kinds of dietary iron and they behave completely differently. **Haem iron** — red meat, liver, shellfish, sardines — is absorbed several times more efficiently and is barely affected by what else is on the plate. **Non-haem iron** — lentils, beans, tofu, pumpkin seeds, dark leafy greens, fortified cereal — absorbs poorly on its own and is heavily influenced by its neighbours.\n\nSo if you eat little or no meat, the technique matters more than the total: **put vitamin C alongside every plant iron source.** Peppers, tomatoes, citrus, strawberries. Lentils with tomato, beans with salsa, fortified cereal with orange juice — this can multiply absorption several-fold.\n\nAnd **move tea and coffee away from meals.** The polyphenols in both are potent iron blockers; a mug with dinner rather than an hour after it is a real, repeated cost.",
        extra: {
          label: "Soaking, sprouting and cast iron",
          body: "Phytates in whole grains and legumes bind iron; **soaking, sprouting, fermenting** (sourdough) and simply cooking reduce them. Cooking acidic food in a **cast-iron pan** genuinely adds a little iron to the food — modest, but free.",
        },
        evidence: [
          "NIH Office of Dietary Supplements — iron: dietary sources and bioavailability.",
          "Academy of Nutrition and Dietetics — iron in vegetarian and vegan diets.",
          "WHO — nutritional anaemias: guidance on dietary strategies.",
        ],
        checkFirst:
          "Diet alone will not correct established iron-deficiency anaemia in a sensible timeframe. If you've been diagnosed, food is what keeps the tank full after treatment — not the treatment.",
      },
      {
        id: "retest",
        title: "Re-test — and know how slow the tank refills",
        why: "People stop iron the week they feel better, which is usually months before their stores are actually replaced.",
        grade: "A−",
        gradeNote: "BSG guideline — monitoring and duration",
        supervised: true,
        how: "The rough sequence: **energy** often lifts in `2–4 weeks`. **Haemoglobin** typically responds over `4–8 weeks` — that is the number your doctor checks first. **Ferritin — the actual stores — takes months**, and treatment is usually continued for around `3` months *after* haemoglobin normalises for exactly that reason.\n\nStopping at the point you feel human again is why so many people do this twice. Finish the course your clinician set, and re-test **ferritin**, not just haemoglobin, before you decide it's done.\n\nIf your haemoglobin hasn't moved at all after a fair trial, that's a meaningful signal — it usually means absorption is blocked, the cause is still active, or the diagnosis needs revisiting.",
        evidence: [
          "British Society of Gastroenterology — monitoring response and duration of iron therapy.",
          "American Society of Hematology — treatment and follow-up of iron-deficiency anemia.",
          "NIH / NHLBI — iron-deficiency anemia: treatment and recovery.",
        ],
        checkFirst:
          "No response to oral iron is a reason to go back, not a reason to double up. Your clinician has better options — including intravenous iron — and they exist precisely for people who don't absorb the tablets.",
      },
    ],
    skipTheHype: {
      remedy: "Liquid chlorophyll for anaemia",
      why: "The pitch is that chlorophyll is \"plant blood\" and its resemblance to haemoglobin makes it an iron-builder. The molecule does have a similar ring structure, but the metal at the centre of chlorophyll is **magnesium, not iron** — it cannot donate iron you don't have. There are no clinical trials showing chlorophyll drops raise ferritin or haemoglobin in iron-deficient people. Its real cost isn't the money; it's the months someone spends on green water while the reason their iron is dropping goes unexamined.",
    },
    bookTitle: "The Iron Handbook — testing, causes and getting your energy back honestly",
    bookUrl: null,
    landingSlug: "iron-anemia-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "vitamin-d-deficiency",
    name: "Vitamin D deficiency",
    nameEmphasis: "deficiency",
    icon: "sunrise",
    category: "nutrition",
    blurb: "Genuinely common, genuinely fixable — and genuinely oversold.",
    matchRules: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "Vitamin D isn't really a vitamin. Your skin makes it from UVB light and your body converts it into a **hormone** that governs how you absorb calcium and phosphate — which is why the hard, undisputed evidence sits on bone: rickets in children, osteomalacia and fracture risk in adults.\n\nDeficiency is common and unevenly distributed. Living far from the equator, darker skin, being mostly indoors, covering up, older age, higher body weight, and conditions that impair fat absorption all push levels down. Many people at northern latitudes make effectively **none** through the winter months, regardless of how much time they spend outside.\n\nWhat it is *not* is the cure-all a decade of headlines promised. Large randomised trials — including **VITAL**, which followed over 25,000 adults — did not find that supplementing people who weren't deficient prevented cancer or cardiovascular disease. That's the honest shape of it: **correcting a real deficiency is worth doing and cheap; taking large doses when you're already replete is not.**",
    matchedIntro:
      "Your 25-hydroxy vitamin D came back below the threshold this protocol flags at. That's one of the more straightforward findings in a blood panel — it usually corrects on a sensible dose — but the dose and the recheck are still your clinician's call, especially if you take other medication.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D 25-OH", unit: "ng/mL", flagBelow: 30 },
      { markerId: "calcium", label: "Calcium", unit: "mg/dL", flagAbove: 10.2 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      {
        aliases: ["pth", "parathyroid hormone", "intact pth"],
        label: "PTH",
        unit: "pg/mL",
        flagAbove: 65,
      },
    ],
    steps: [
      {
        id: "test",
        title: "Measure 25-hydroxy vitamin D before you dose",
        detailTitle: "Which test, and what the number means",
        why: "Vitamin D is one of the few supplements where the right dose genuinely depends on where you're starting, and the test is cheap.",
        grade: "A",
        gradeNote: "Endocrine Society · NIH Office of Dietary Supplements",
        how: "The test is **serum 25-hydroxyvitamin D — 25(OH)D**. It is the storage form and the only one worth measuring. (The active form, 1,25-dihydroxy, is *not* a status test; it can look normal or even high in deficiency, and ordering it is a common way to get a falsely reassuring answer.)\n\nThe widely used bands, in ng/mL: **under `20` is deficiency**, `20–29` is insufficiency, `30–50` is the comfortable target most guidance lands on. Above `50` there is no added benefit on the evidence, and above `100` you are into the range where harm starts.\n\nIf you're in a group that's routinely low — darker skin, little sun exposure, over 65, higher body weight, coeliac or IBD, post-bariatric surgery — testing is the difference between guessing and knowing.",
        extra: {
          label: "The units trap",
          body: "The US reports **ng/mL**; most of the rest of the world reports **nmol/L**. They differ by a factor of `2.5` — a level of `30` ng/mL is `75` nmol/L. People reading international advice against a US result routinely think they are a third as low as they are. Check which unit your lab printed before you panic or relax.",
        },
        evidence: [
          "NIH Office of Dietary Supplements — vitamin D fact sheet for health professionals.",
          "Endocrine Society — clinical practice guideline on vitamin D deficiency evaluation and treatment.",
          "National Academy of Medicine (Institute of Medicine) — dietary reference intakes for calcium and vitamin D.",
        ],
        checkFirst:
          "If you have sarcoidosis, another granulomatous disease, hyperparathyroidism, kidney disease or a history of high calcium, vitamin D dosing is genuinely not a self-serve decision — those conditions change how your body handles it.",
      },
      {
        id: "supplement",
        title: "Take D3, daily, with fat",
        detailTitle: "Form, dose and timing",
        why: "This is the part that actually raises the number, and the details — form, food, frequency — change how well it works.",
        grade: "A",
        gradeNote: "NIH ODS · Endocrine Society",
        supplement: true,
        labNote:
          "Vitamin D is one of the most commonly mislabelled supplement categories — independent testing has repeatedly found capsules containing well under or well over the stated dose. Since this is a fat-soluble vitamin you take daily for months, content accuracy matters more here than in most aisles. Check the Purity Score before buying on price.",
        how: "**D3 (cholecalciferol)** over D2. Both work, but D3 raises and holds 25(OH)D more reliably.\n\n**Maintenance for most adults sits around `600–2,000 IU` daily** — the RDA is `600–800 IU`, and many clinicians use up to `2,000 IU` as a routine maintenance dose in people who run low. **Correcting a diagnosed deficiency is a higher, time-limited dose that your clinician sets**, often a loading course followed by maintenance.\n\n**Take it with the fattiest meal of the day.** It is fat-soluble, and absorption from a low-fat meal is meaningfully worse — this alone explains a lot of \"it didn't work for me\".\n\n**Daily beats a monthly mega-dose.** Very large intermittent bolus dosing has performed poorly in trials, including some showing *increased* falls in older adults.",
        extra: {
          label: "The ceiling, and what going over it does",
          body: "The tolerable upper intake level for adults is **`4,000 IU` per day**; going above it long-term without monitoring is where toxicity lives. Vitamin D toxicity works through **calcium**: it drives absorption up until blood calcium rises, which causes nausea, thirst, confusion, kidney stones and, given long enough, kidney damage. It's uncommon, it takes sustained very high doses — and it is essentially always self-inflicted with supplements, never with sunlight.",
        },
        evidence: [
          "NIH Office of Dietary Supplements — vitamin D: intakes, upper limits and toxicity.",
          "Endocrine Society — treatment of vitamin D deficiency in adults.",
          "Randomised trials comparing daily versus high-dose intermittent vitamin D supplementation.",
        ],
        checkFirst:
          "Don't take a high correction dose indefinitely. Loading doses are meant to end, and the most common route to a genuinely high level is a prescription course that nobody ever stopped.",
      },
      {
        id: "sun",
        title: "Get sensible sun — without trading one risk for another",
        why: "Skin synthesis is how humans were meant to get this, and a short exposure does more than most people assume.",
        grade: "B+",
        gradeNote: "Evidence summary — synthesis varies hugely by skin, latitude and season",
        how: "**Short and frequent beats long and burnt.** For lighter skin in summer, arms and legs uncovered for roughly `10–30` minutes around the middle of the day, a few times a week, is the ballpark. **Darker skin needs substantially longer** for the same synthesis — melanin is a natural sunscreen, which is a large part of why deficiency rates are higher.\n\nThe hard limits on this: **above roughly 37° latitude, essentially no vitamin D is made from about October to March**, whatever the weather does. Glass blocks UVB entirely, so a sunny window is worth nothing here.\n\n**Never burn for vitamin D.** Sunburn is the risk factor for skin cancer, and a supplement replicates the benefit at zero risk. If you have a history of skin cancer or are told to avoid sun, supplement — that recommendation stands.",
        extra: {
          label: "Why 'I'm outside all the time' still isn't enough",
          body: "Age flattens the curve: skin synthesis drops substantially over the decades, so an older adult outdoors gets far less than a younger one in the same sunshine. Body weight matters too — vitamin D distributes into fat tissue, so people with higher body weight often need a larger dose for the same blood level. \"I get plenty of sun\" and a low result are not a contradiction.",
        },
        evidence: [
          "Evidence summary — cutaneous vitamin D synthesis by latitude, season, skin type and age.",
          "NIH Office of Dietary Supplements — vitamin D: sunlight exposure.",
          "American Academy of Dermatology — position on vitamin D and sun exposure.",
        ],
        checkFirst:
          "Tanning beds are not a vitamin D strategy. They are a classified carcinogen, and any D you make from one is bought at a price no supplement asks.",
      },
      {
        id: "cofactors",
        title: "Sort magnesium and calcium — skip the rest",
        detailTitle: "The cofactors, honestly ranked",
        why: "Two of the things sold alongside vitamin D genuinely matter. The rest of the stack is marketing.",
        grade: "B+",
        gradeNote: "Evidence summary — mechanistic and observational",
        supplement: true,
        labNote:
          "If you add magnesium here, form and dose accuracy are the whole game — magnesium oxide is poorly absorbed and is what most cheap products use. Check what form the label actually declares.",
        how: "**Magnesium** is a real cofactor: the enzymes that convert vitamin D into its active form depend on it, and low magnesium is common. Food first — nuts, seeds, beans, leafy greens, dark chocolate. If you supplement, glycinate or citrate over oxide.\n\n**Calcium and vitamin D work as a pair for bone.** The point of correcting D is largely to absorb calcium properly, so if your calcium intake is poor, fixing D alone leaves the job half done. Food first here too — dairy, fortified plant milks, tinned fish with bones, tofu set with calcium.\n\n**Vitamin K2** is the popular add-on, on the theory that it directs calcium into bone rather than arteries. The mechanism is plausible and the trials are not settled. If you take a combined D3/K2 product, fine. Don't pay a premium for it, and **if you take warfarin, K2 interacts with it — ask first.**",
        evidence: [
          "NIH Office of Dietary Supplements — magnesium and calcium fact sheets.",
          "Evidence summary — magnesium's role in vitamin D metabolism (mechanistic and observational data).",
          "Evidence summary — vitamin K2 and vascular calcification: trial results remain inconsistent.",
        ],
        checkFirst:
          "Vitamin K interacts with warfarin and other anticoagulants. If you're on one, a D3/K2 combination product is a conversation with your prescriber, not a shelf decision.",
      },
      {
        id: "recheck",
        title: "Re-test at 3 months, then leave it alone",
        why: "Levels move slowly, and the two failure modes are checking too soon and never checking again.",
        grade: "A−",
        gradeNote: "Endocrine Society — monitoring guidance",
        how: "Give it **`3` months** before re-testing. 25(OH)D has a long half-life and a level drawn at three weeks tells you almost nothing.\n\nOnce you land in the `30–50 ng/mL` range, **drop to a maintenance dose** and stop chasing the number upward. Higher is not better here; the benefit curve flattens and then turns.\n\nAfter that, an annual check is plenty for most people — ideally at the **same time of year**, since a summer result and a February result on the same dose can differ substantially. Comparing across seasons is how people talk themselves into a dose change they don't need.",
        evidence: [
          "Endocrine Society — monitoring 25(OH)D during and after repletion.",
          "NIH Office of Dietary Supplements — vitamin D: assessing status over time.",
          "Evidence summary — seasonal variation in 25(OH)D at temperate latitudes.",
        ],
        checkFirst:
          "New nausea, unusual thirst, frequent urination, constipation or confusion on a high dose can be high blood calcium. Stop and get calcium checked rather than waiting for the next scheduled test.",
      },
    ],
    skipTheHype: {
      remedy: "Mega-dosing — the 10,000+ IU daily habit",
      why: "The wellness internet's position is that the official numbers are far too low and that five figures a day is where the real benefits start. Two things are wrong with it. First, the outcome trials went the other way: **VITAL**, with more than 25,000 participants, found no reduction in cancer or cardiovascular events from supplementation in people who weren't deficient — and a randomised dose-comparison trial in older adults found *higher* doses produced **more** falls, not fewer. Second, the upper intake level is `4,000 IU` for a reason: sustained mega-doses raise blood calcium, and the resulting kidney stones and kidney injury are the classic presentation of vitamin D toxicity. Correcting a deficiency is genuinely worth doing. Stacking a hormone past the point of benefit is not.",
    },
    bookTitle: "The Vitamin D Reset — what the sunshine hormone does and doesn't do",
    bookUrl: null,
    landingSlug: "vitamin-d-deficiency",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "b12-deficiency",
    name: "B12 deficiency",
    nameEmphasis: "deficiency",
    icon: "tablets",
    category: "nutrition",
    blurb: "The one deficiency where waiting can cost you nerve function.",
    matchRules: [
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 300 },
      { markerId: "mma", label: "Methylmalonate", unit: "nmol/L", flagAbove: 270 },
    ],
    intro:
      "B12 is needed to build red blood cells, to run the methylation reactions that recycle homocysteine, and — the part that makes this urgent — **to maintain the myelin sheath around your nerves.**\n\nThat's why the symptom list is so wide: fatigue and breathlessness from anaemia at one end, and pins and needles, numb feet, unsteadiness, memory trouble and low mood at the other. The neurological damage can begin **before** the blood count ever looks abnormal, and if it goes unaddressed long enough, some of it does not fully reverse. That is the whole reason this page is more urgent in tone than the others in this category.\n\nB12 comes almost entirely from animal foods, and absorbing it is a surprisingly elaborate process — stomach acid frees it, a protein called intrinsic factor carries it, and the last stretch of the small intestine takes it in. Anything that breaks that chain causes deficiency regardless of diet, which is why **vegans and people with absorption problems are two completely different situations wearing the same lab result.**",
    matchedIntro:
      "Your B12 markers came back in the range this protocol flags. Because low B12 has several very different causes — and because nerve symptoms are time-sensitive — the next step is a doctor working out which one you have, not a bottle from the shelf.",
    signals: [
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "mma", label: "Methylmalonate", unit: "nmol/L", flagAbove: 270 },
      { markerId: "homocysteine", label: "Homocysteine", unit: "μmol/L", flagAbove: 12 },
      { markerId: "folate", label: "Folate", unit: "ng/mL", flagBelow: 4 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
    ],
    doctorBanner: {
      title: "Nerve symptoms don't wait",
      body: "Numbness, tingling, burning feet, unsteadiness on your feet in the dark, or new memory and mood changes alongside a low B12 need medical assessment promptly. Nerve damage from B12 deficiency is reversible early and may not be later — this is the deficiency where the timeline genuinely matters.",
    },
    steps: [
      {
        id: "test",
        title: "Test B12 — and add MMA when it's borderline",
        detailTitle: "Why serum B12 alone misleads",
        why: "Serum B12 is a famously imperfect test, and a \"low-normal\" result in someone with symptoms is the exact situation where a second marker earns its keep.",
        grade: "A−",
        gradeNote: "British Society for Haematology · NIH ODS",
        how: "Start with **serum B12**, plus **full blood count, ferritin and folate** — these deficiencies travel together and treating one while missing another is the common failure.\n\nThe complication: serum B12 measures total circulating B12, most of which is bound to a protein your cells can't use. So a result in the `200–400 pg/mL` grey zone doesn't settle anything either way.\n\nWhen the number is borderline and the symptoms fit, ask about **methylmalonic acid (MMA)** — and sometimes homocysteine. MMA rises when cells are genuinely short of usable B12, which makes it a **functional** test rather than a stock-count. A normal MMA largely rules deficiency out.",
        extra: {
          label: "Two ways the test lies",
          body: "**Supplements taken before the draw** inflate serum B12 and can mask deficiency entirely — if you've been taking B12, say so, because the result may be uninterpretable. And **metformin, long-term acid blockers (PPIs and H2 blockers) and nitrous oxide use** all deplete or inactivate B12; each is common, each is easy to overlook, and none of them show up on a lab form unless someone asks.",
        },
        evidence: [
          "British Society for Haematology — guidelines for the diagnosis and treatment of cobalamin and folate disorders.",
          "NIH Office of Dietary Supplements — vitamin B12 fact sheet for health professionals.",
          "Evidence summary — methylmalonic acid as a functional marker of B12 status.",
        ],
        checkFirst:
          "Don't start B12 supplements in the week before your test unless a doctor tells you to. You will get a normal result that means nothing, and lose the chance to find the answer.",
      },
      {
        id: "cause",
        title: "Work out whether it's intake or absorption",
        detailTitle: "Same number, two different diseases",
        why: "A vegan with low B12 needs a tablet. Someone with pernicious anaemia needs injections for life. Telling them apart is the whole decision.",
        grade: "A",
        gradeNote: "British Society for Haematology guideline",
        supervised: true,
        how: "**Intake.** B12 is made by bacteria and reaches us almost entirely through animal foods. Anyone eating vegan, or nearly vegetarian, without supplementing or eating fortified foods will run out eventually — the liver holds years of stores, which is why it often takes a long time to appear.\n\n**Absorption**, which is more common in older adults and the reason a tablet sometimes isn't enough:\n\n**Pernicious anaemia** — an autoimmune condition that destroys intrinsic factor. Screened for with **intrinsic factor antibodies**, and it changes the treatment permanently.\n**Atrophic gastritis and low stomach acid** — very common with age; food-bound B12 can't be released.\n**Medication** — metformin and long-term PPIs.\n**Gut surgery or disease** — gastric bypass, ileal resection, Crohn's, coeliac.\n**Nitrous oxide** — inactivates B12 directly; recreational use is a genuine and rising cause of severe deficiency in young people.",
        evidence: [
          "British Society for Haematology — investigation of cobalamin deficiency, including intrinsic factor antibody testing.",
          "NIH Office of Dietary Supplements — vitamin B12: groups at risk of inadequacy.",
          "Evidence summary — metformin, proton pump inhibitors and nitrous oxide as causes of B12 depletion.",
        ],
        checkFirst:
          "If your B12 is low and you eat meat regularly, absorption is the likely story and it deserves a proper look. Quietly taking a supplement fixes the number and leaves the cause — which occasionally matters in its own right — undiagnosed.",
      },
      {
        id: "replace",
        title: "Replace it — tablets or injections, depending on why",
        detailTitle: "Getting the dose and route right",
        why: "B12 is safe and cheap to replace. The only thing that goes wrong is using the wrong route for the cause, or stopping too early.",
        grade: "A",
        gradeNote: "British Society for Haematology · NIH ODS",
        supervised: true,
        supplement: true,
        labNote:
          "B12 supplements are inexpensive and generally straightforward, but dose accuracy still varies and combination \"energy\" products often bury a token amount inside a stimulant blend. Check what the label actually declares before buying.",
        how: "**Dietary shortfall** usually responds to an oral supplement. Typical maintenance for someone avoiding animal foods is in the region of `25–100 mcg` daily, and higher oral doses (`500–1,000 mcg`) are common because absorption of a single large dose is inefficient — most of it passes straight through, harmlessly.\n\n**Absorption problems**, and **pernicious anaemia especially**, are usually treated with **intramuscular injections** — a loading course, then maintenance for life. High-dose oral B12 does work for some absorption problems via passive diffusion, but that decision belongs to your doctor, not to a forum.\n\n**Form:** cyanocobalamin and methylcobalamin are both effective and cyanocobalamin is the most studied and most stable. Ignore the premium on \"active\" forms unless your clinician has a specific reason.\n\nAnd it's water-soluble with no established upper limit — bright yellow urine is excess riboflavin in a B-complex, not a warning.",
        extra: {
          label: "The folate trap — this one is genuinely dangerous",
          body: "**High-dose folic acid corrects the anaemia of B12 deficiency while the nerve damage continues underneath.** The blood count looks better, everyone relaxes, and the neurological injury advances silently. This is exactly why B12 and folate get tested together and why B12 is corrected first. If a supplement has you on a large folate dose and nobody has checked your B12, that is worth raising this week.",
        },
        evidence: [
          "British Society for Haematology — treatment of cobalamin deficiency: oral versus parenteral routes.",
          "NIH Office of Dietary Supplements — vitamin B12: supplementation, forms and safety.",
          "Evidence summary — folate supplementation masking haematological signs of B12 deficiency.",
        ],
        checkFirst:
          "Do not self-treat suspected pernicious anaemia with tablets. It needs a diagnosis and, in most cases, injections — and getting it wrong means nerve damage accumulating while the blood test looks fine.",
      },
      {
        id: "food",
        title: "Cover it in food if you can — fortify if you can't",
        why: "Once the deficiency is corrected, staying out of it is mostly a shopping decision.",
        grade: "A−",
        gradeNote: "NIH ODS · dietetic guidance",
        how: "The RDA for adults is about **`2.4 mcg` a day** — a small amount, easily met by any regular animal-food intake. Richest sources: **clams, liver, sardines, salmon, beef, eggs and dairy.**\n\n**If you eat plant-based, B12 is not optional and food alone will not do it.** Nutritional yeast, fortified plant milks and fortified cereals are the food route; a supplement is the reliable one. This is not an argument against plant-based eating — it's the one nutrient it genuinely cannot supply, and it is solved by a cheap tablet.\n\nAnd two things sold as plant B12 that aren't: **spirulina, chlorella, nori and fermented foods contain B12 analogues** that your body can't use and that may even interfere with the real thing. They also inflate the serum B12 test, which is the worst combination — no benefit and a falsely reassuring number.",
        evidence: [
          "NIH Office of Dietary Supplements — vitamin B12: food sources and recommended intakes.",
          "Academy of Nutrition and Dietetics — position on vegetarian and vegan diets.",
          "Evidence summary — inactive B12 analogues in algae and fermented foods.",
        ],
        checkFirst:
          "If you are pregnant, breastfeeding, or feeding a plant-based diet to an infant or child, B12 adequacy is a clinical matter — deficiency in a developing nervous system is serious and moves fast. Get it supervised.",
      },
      {
        id: "monitor",
        title: "Re-test, and track the symptoms that are slowest to go",
        why: "Blood counts recover quickly. Nerves take far longer, and knowing that stops people from concluding treatment failed.",
        grade: "B+",
        gradeNote: "Evidence summary · BSH monitoring guidance",
        supervised: true,
        how: "**Blood** responds fast — reticulocytes rise within a week and the anaemia typically corrects over `1–2` months. **Nerve symptoms are the slow ones**, improving over `6–12` months, and improvement can be partial if the deficiency ran a long time.\n\nAsk your clinician to re-check **potassium** early in treatment if you were significantly anaemic; rapid red-cell production can pull potassium down. It's uncommon, it's manageable, and it's the reason for early follow-up rather than a six-month gap.\n\nIf the cause is permanent — pernicious anaemia, gastric surgery, a medication you need — **treatment is permanent too.** The most common reason someone relapses is that maintenance quietly stopped once they felt well.",
        evidence: [
          "British Society for Haematology — monitoring response to cobalamin replacement.",
          "Evidence summary — recovery timelines for haematological versus neurological features of B12 deficiency.",
          "NIH Office of Dietary Supplements — vitamin B12: response to treatment.",
        ],
        checkFirst:
          "Worsening numbness, new weakness, or unsteadiness that gets worse in the dark, while on treatment, is a same-week medical problem — not something to give more time.",
      },
    ],
    skipTheHype: {
      remedy: "B12 energy shots and IV \"vitamin drips\"",
      why: "Injected and infused B12 is sold at wellness bars and clinics as a same-day energy lift for anyone who's tired. If you are genuinely deficient, replacing B12 does restore energy — but a tablet does it for pennies, and an injection is only clinically necessary when absorption is broken. **If your B12 is normal, there is no evidence extra B12 raises energy at all**; the excess is filtered out within hours, which is the real explanation for the bright yellow that people mistake for it working. What you're buying is an expensive placebo with a needle attached, and — more to the point — a way to feel like you've handled fatigue without ever finding out what was causing it.",
    },
    bookTitle: "The B12 Guide — the deficiency that hides in plain sight",
    bookUrl: null,
    landingSlug: "b12-deficiency",
  },
];
