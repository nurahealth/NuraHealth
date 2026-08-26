// ─────────────────────────────────────────────────────────────────────────────
// Library — Skin & immune.
//
// Content only. See ../types.ts for the shape and the rules every entry obeys.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const SKIN_IMMUNE_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "eczema-skin-barrier",
    name: "Eczema & skin barrier",
    nameEmphasis: "& skin barrier",
    icon: "hand",
    category: "skin-immune",
    blurb: "A barrier problem first — which is why moisturiser is treatment, not comfort.",
    matchRules: [],
    intro:
      "Eczema is a barrier problem before it's an inflammation problem. The skin loses water too fast and lets irritants in too easily, and the immune response follows.\n\nThat's why the single most effective daily habit is **moisturiser, applied far more often and far more generously than most people do** — and why treating flares early with what your doctor prescribed prevents the cycle that makes everything harder.\n\nThe biggest avoidable mistake in eczema is fear of topical steroids. Undertreating a flare keeps skin inflamed for weeks; used properly, short courses are safe and effective.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { aliases: ["total ige", "ige, total", "immunoglobulin e"], label: "Total IgE", unit: "kU/L", flagAbove: 214 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "zinc", label: "Zinc", unit: "μg/dL", flagBelow: 70 },
    ],
    steps: [
      {
        id: "moisturise",
        title: "Moisturise like it's a prescription — because it is one",
        why: "Emollients are first-line therapy in every eczema guideline, and the usual reason they \"don't work\" is that they're used at a fraction of the effective amount.",
        grade: "A",
        gradeNote: "AAD guideline — strong recommendation",
        how: "Apply **at least twice a day**, and within `3 minutes` of getting out of the bath or shower while skin is still damp.\n\nThe quantities in the guidelines surprise people: a reasonable target is `250–500 g a week` for a whole adult body. Thick ointments and creams beat lotions; fragrance-free always.",
        evidence: [
          "American Academy of Dermatology — guidelines of care for the management of atopic dermatitis with topical therapies.",
          "NIH / NIAMS — atopic dermatitis overview.",
        ],
        checkFirst:
          "Skin that is weeping, crusted golden-yellow, spreading fast, or painful with fever may be infected. That needs a doctor, not more moisturiser.",
      },
      {
        id: "washing",
        title: "Change how you wash",
        why: "Hot water and ordinary soap strip the lipids the barrier is made of, which undoes the moisturising you just did.",
        grade: "A−",
        gradeNote: "AAD guideline",
        how: "**Lukewarm, `5–10 minutes`, once a day.** Fragrance-free non-soap cleanser, only where you actually need it.\n\nPat dry — don't rub — and moisturise immediately. Skip bubble bath, bath oils with fragrance, and anything that foams enthusiastically.",
        evidence: [
          "American Academy of Dermatology — atopic dermatitis bathing and skin care recommendations.",
          "NIH / NIAMS — living with atopic dermatitis.",
        ],
        checkFirst:
          "Dilute bleach baths are sometimes recommended for recurrent infection, but the concentration matters and it isn't right for everyone. Get the instructions from your dermatologist rather than the internet.",
      },
      {
        id: "treat-flares",
        title: "Treat flares properly and early — don't ration the steroid",
        why: "Steroid phobia leads to undertreatment, which prolongs flares and drives the itch-scratch cycle that damages the barrier further.",
        grade: "A",
        gradeNote: "AAD guideline",
        supervised: true,
        how: "Use what you were prescribed, at the strength prescribed, for the **full course** — usually until the skin is smooth, not just less red.\n\nThe **fingertip unit** is the measure: one fingertip's worth covers about two adult palms. Undertreating with a too-weak product for too long causes more steroid exposure overall, not less.",
        extra: {
          label: "Where the fear came from",
          body: "Skin thinning is a real effect of **potent steroids used continuously on thin skin for long periods** — not of appropriate short courses on a flare. The guidelines are clear on this, and the risks of chronic uncontrolled inflammation are greater.",
        },
        evidence: [
          "American Academy of Dermatology — guidelines on topical corticosteroid use in atopic dermatitis.",
          "National Eczema Association — topical steroid guidance.",
        ],
        checkFirst:
          "Face, eyelids, armpits and groin need lower-potency products — skin absorbs differently there. Never use someone else's prescription, and check with your doctor for children.",
      },
      {
        id: "triggers-eczema",
        title: "Find your irritants before you cut foods",
        why: "Contact irritants explain far more everyday eczema than food does, and food elimination in eczema carries real risks.",
        grade: "A−",
        gradeNote: "AAD guideline · AAAAI",
        how: "The common culprits: **fragrance, wool, detergent residue, heat and sweat, and hand sanitiser**. Fragrance-free laundry detergent, extra rinse cycle, cotton next to the skin.\n\nFood allergy does play a role in some children with moderate-to-severe eczema — but that's assessed by an allergist, not by an elimination diet at home.",
        evidence: [
          "American Academy of Dermatology — atopic dermatitis trigger avoidance guidance.",
          "American Academy of Allergy, Asthma & Immunology — food allergy and atopic dermatitis position.",
        ],
        checkFirst:
          "**Eliminating foods from a child with eczema without allergist supervision can cause a new food allergy** by removing tolerance. That's a well-documented harm — do not do it unsupervised.",
      },
      {
        id: "escalate-eczema",
        title: "Escalate if it's not controlled — the options changed",
        why: "Moderate-to-severe eczema now has targeted treatments that didn't exist a decade ago, and many people are still cycling through creams.",
        grade: "A",
        gradeNote: "AAD guideline — systemic therapies",
        supervised: true,
        how: "If flares are frequent, sleep is disrupted, or topicals aren't holding it, ask for a **dermatology referral**.\n\nCurrent options include phototherapy, targeted biologics and oral JAK inhibitors. These are prescription decisions with real monitoring — but they've changed outcomes substantially.",
        evidence: [
          "American Academy of Dermatology — guidelines of care for atopic dermatitis with phototherapy and systemic agents.",
          "NIH / NIAMS — atopic dermatitis treatment overview.",
        ],
        checkFirst:
          "Mention sleep loss and mental health explicitly. Eczema severity is scored partly on impact, and those symptoms often unlock treatment that a skin exam alone doesn't.",
      },
    ],
    skipTheHype: {
      remedy: "Coconut oil and \"natural\" balms as the main moisturiser",
      why: "Coconut oil has some antibacterial data, but it's a poor occlusive compared with a proper emollient and a recognised contact allergen for some people. The bigger problem is the category: essential-oil-containing balms and \"natural\" creams are among the most common causes of contact dermatitis layered on top of eczema. Fragrance-free and boring wins here.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "acne-support",
    name: "Acne support",
    nameEmphasis: "support",
    icon: "sparkles",
    category: "skin-immune",
    blurb: "Consistency and time — and scarring is the reason not to wait.",
    matchRules: [],
    intro:
      "Acne is four things at once: too much oil, blocked pores, bacteria, and inflammation. Anything that only addresses one of them underperforms — which is why the effective routines combine ingredients rather than chasing a single hero product.\n\nThe second thing to know is the timeline. **Nothing in acne works in a week.** Most treatments need `8–12 weeks`, and things often look slightly worse before they look better.\n\nThe third is the reason not to wait it out: scarring is permanent, and it's far easier to prevent than to treat. Persistent or scarring acne is a dermatology appointment, not a longer skincare routine.",
    signals: [
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "insulin", label: "Fasting insulin", unit: "μIU/mL", flagAbove: 8 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagAbove: 60 },
      { markerId: "shbg", label: "SHBG", unit: "nmol/L", flagBelow: 30 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    steps: [
      {
        id: "core-routine",
        title: "Build a boring routine and give it twelve weeks",
        why: "The active ingredients with real evidence are few, cheap and widely available — the failure is almost always inconsistency or impatience.",
        grade: "A",
        gradeNote: "AAD acne guideline",
        how: "A gentle cleanser twice daily, **benzoyl peroxide** (`2.5–5%` works as well as `10%` with less irritation), and a **topical retinoid** at night — adapalene is available over the counter.\n\nApply to the whole affected area, not to spots. Moisturise, and use sunscreen with a retinoid. Judge it at `12 weeks`.",
        extra: {
          label: "The purge is real, and it ends",
          body: "Retinoids commonly make skin look worse for the first `4–6 weeks` as blocked pores clear. Start `2–3 nights a week` and build up. Stopping during this phase is the single most common reason people conclude retinoids don't work for them.",
        },
        evidence: [
          "American Academy of Dermatology — guidelines of care for the management of acne vulgaris.",
          "NIH / NIAMS — acne overview.",
        ],
        checkFirst:
          "Retinoids are not used in pregnancy. If you're pregnant, trying, or could become pregnant, get your routine set by a clinician — this applies to over-the-counter adapalene too.",
      },
      {
        id: "stop-over-washing",
        title: "Stop scrubbing, stripping and picking",
        why: "Aggressive cleansing damages the barrier and triggers more oil, and picking is what converts a spot into a scar.",
        grade: "B+",
        gradeNote: "AAD guideline",
        how: "**Twice a day, gentle, lukewarm.** No physical scrubs, no astringent toners, no washing after every workout beyond a rinse.\n\nMoisturiser is not the enemy — a stripped barrier makes actives intolerable, and intolerable actives get abandoned.",
        evidence: [
          "American Academy of Dermatology — acne skin care recommendations.",
          "NIH / NIAMS — acne self-care guidance.",
        ],
        checkFirst:
          "If picking is compulsive rather than occasional, that's a recognised condition — excoriation disorder — with real treatment. Worth naming to a clinician rather than fighting alone.",
      },
      {
        id: "diet-acne",
        title: "Know what the diet evidence actually says",
        why: "Two dietary associations have reasonable support and the rest don't, and the difference is worth knowing before you cut anything.",
        grade: "B",
        gradeNote: "AAD guideline — evidence summary",
        how: "The two with the most consistent signal: **high-glycaemic-load diets** and, more weakly, **skim milk** specifically.\n\nThe AAD's position is that evidence is limited and doesn't support recommending dietary changes as acne treatment. Chocolate and greasy food are not supported. If you want to test dairy, do it for `12 weeks` and reintroduce properly.",
        evidence: [
          "American Academy of Dermatology — acne guideline section on diet.",
          "Evidence summary — cohort and trial data on glycaemic load, dairy and acne.",
        ],
        checkFirst:
          "Restricting food groups for skin has a poor risk-reward ratio, especially in teenagers. Don't cut dairy entirely without replacing calcium and vitamin D.",
      },
      {
        id: "hormonal-acne",
        title: "If it's jawline, cyclical and adult — ask about the hormonal route",
        why: "Adult female acne with that distribution responds to treatments aimed at androgens, and those are prescription options many people are never offered.",
        grade: "A−",
        gradeNote: "AAD guideline",
        supervised: true,
        how: "The pattern: **jawline and lower face, flaring before periods, persisting into your 20s–40s**.\n\nAsk about combined oral contraceptives and spironolactone, both of which appear in the guideline for this. If you also have irregular cycles or excess hair growth, mention PCOS as a question.",
        evidence: [
          "American Academy of Dermatology — acne guideline (hormonal therapies).",
          "American College of Obstetricians and Gynecologists — clinical guidance on hormonal treatment of acne.",
        ],
        checkFirst:
          "Spironolactone is not used in pregnancy and needs monitoring; combined contraceptives aren't appropriate with certain migraine, clot or blood pressure histories. These are prescriber decisions.",
      },
      {
        id: "scarring",
        title: "Treat scarring risk as the reason to escalate early",
        why: "Scars are permanent, and by the time you're weighing whether it's \"bad enough\" for a dermatologist, some may already be forming.",
        grade: "A",
        gradeNote: "AAD guideline",
        supervised: true,
        how: "See a dermatologist if you have **nodules or cysts, any scarring, or no response after `12 weeks`** of a proper routine.\n\nOptions include prescription topicals, oral antibiotics as a short course alongside topicals, hormonal therapy, and isotretinoin for severe or scarring acne.",
        evidence: [
          "American Academy of Dermatology — acne guideline (systemic therapy and referral).",
          "NIH / NIAMS — acne treatment overview.",
        ],
        checkFirst:
          "Isotretinoin causes severe birth defects and is managed under a strict pregnancy prevention programme. It also requires monitoring. It is highly effective — and it is a decision made with a dermatologist, never sourced online.",
      },
    ],
    skipTheHype: {
      remedy: "Pore strips, DIY lemon juice and toothpaste on spots",
      why: "Pore strips pull out the top of a sebaceous filament — a normal structure, not a blackhead — and it refills within days while the strip irritates the surrounding skin. Lemon juice is a photosensitiser that causes real chemical burns in sunlight, and toothpaste irritates skin without touching any of the four causes of acne. All three are barrier damage sold as progress.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "seasonal-allergies",
    name: "Seasonal allergies",
    nameEmphasis: "allergies",
    icon: "flower",
    category: "skin-immune",
    blurb: "Start before the season, and use the spray properly.",
    matchRules: [
      { aliases: ["total ige", "ige, total", "immunoglobulin e"], label: "total IgE", unit: "kU/L", flagAbove: 214 },
    ],
    intro:
      "Allergic rhinitis is an immune response to a protein your body has decided is a threat. The symptoms are the response, not the pollen — which is why the timing of treatment matters as much as the choice of it.\n\nTwo things account for most of the difference between people who suffer and people who don't: **starting treatment before the season rather than after symptoms build**, and **using a nasal steroid spray correctly**, which almost nobody is shown how to do.\n\nAnd for anyone whose season is genuinely miserable year after year, there's a treatment that changes the underlying allergy rather than masking it.",
    signals: [
      { aliases: ["total ige", "ige, total", "immunoglobulin e"], label: "Total IgE", unit: "kU/L", flagAbove: 214 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    steps: [
      {
        id: "start-early",
        title: "Start before your season, not after it starts",
        why: "Nasal steroids take days to reach full effect, so starting once you're already inflamed means weeks of avoidable symptoms.",
        grade: "A",
        gradeNote: "AAAAI / ACAAI practice parameter",
        how: "Begin **`2 weeks` before your usual season**. Tree pollen comes first in spring, grass late spring to summer, weeds and ragweed in late summer and autumn.\n\nKeep it going daily through the season. These are not as-needed treatments — the benefit builds and then holds.",
        evidence: [
          "American Academy of Allergy, Asthma & Immunology / ACAAI — practice parameter on the management of allergic rhinitis.",
          "CDC — seasonal allergies information.",
        ],
        checkFirst:
          "Wheeze, chest tightness or breathlessness with your allergy season isn't hay fever — that's asthma, and it needs assessment and its own treatment plan.",
      },
      {
        id: "spray-technique",
        title: "Use the nasal spray properly — the technique is the treatment",
        why: "Intranasal corticosteroids are the most effective single treatment for allergic rhinitis, and most people aim them at the wrong place.",
        grade: "A",
        gradeNote: "AAAAI / ACAAI practice parameter — first-line",
        how: "**Cross hands**: right hand to left nostril, left to right. Aim **outward, toward the ear on that side** — never at the septum in the middle.\n\nDon't sniff hard; a gentle breath in. Sniffing sends it down the throat, where it does nothing. Aiming at the septum causes nosebleeds — the usual reason people quit.",
        evidence: [
          "American Academy of Allergy, Asthma & Immunology — intranasal corticosteroid technique guidance.",
          "AAAAI / ACAAI — allergic rhinitis practice parameter (INCS as first-line therapy).",
        ],
        checkFirst:
          "Recurrent nosebleeds mean stop and check your technique with a pharmacist. Long-term use in children, and use with glaucoma or cataracts, should be reviewed with a doctor.",
      },
      {
        id: "saline-rinse",
        title: "Rinse with saline — before the spray",
        why: "Saline irrigation reduces symptoms on its own and clears mucus so the steroid spray reaches the tissue.",
        grade: "B+",
        gradeNote: "AAAAI practice parameter · Cochrane",
        how: "A neti pot or squeeze bottle, once or twice daily, **then the spray afterwards**.\n\n**Use distilled, sterile or previously boiled and cooled water — never straight from the tap.** Clean and dry the device after every use.",
        evidence: [
          "Cochrane systematic review of saline irrigation for allergic rhinitis.",
          "CDC — safe use of nasal rinsing devices.",
        ],
        checkFirst:
          "Tap water in a nasal rinse has caused fatal amoebic infections. This is the one instruction on this page with no flexibility in it.",
      },
      {
        id: "antihistamine-choice",
        title: "Pick the right antihistamine — and skip the sedating one",
        why: "The older sedating antihistamines impair driving and next-day function measurably, and newer ones work as well without it.",
        grade: "A−",
        gradeNote: "AAAAI / ACAAI practice parameter",
        supplement: true,
        labNote:
          "Combination allergy products often add a decongestant that raises blood pressure, or a sedating antihistamine, without making that obvious on the front of the box. Check what's actually in it before buying.",
        how: "Use a **second-generation** antihistamine — cetirizine, loratadine, fexofenadine — daily through the season.\n\nAvoid diphenhydramine for allergies: it's sedating, impairs next-day performance, and is specifically discouraged in older adults. Nasal antihistamine sprays are also an option and work faster.",
        evidence: [
          "AAAAI / ACAAI — allergic rhinitis practice parameter (antihistamine selection).",
          "American Geriatrics Society — Beers Criteria on first-generation antihistamines in older adults.",
        ],
        checkFirst:
          "**Oral decongestants raise blood pressure** — avoid with hypertension, heart disease or glaucoma. And decongestant nasal sprays used beyond `3 days` cause rebound congestion that's worse than what you started with.",
      },
      {
        id: "exposure",
        title: "Reduce the exposure that's easy to reduce",
        why: "You can't avoid pollen outdoors, but a few household habits meaningfully cut the dose you sleep in.",
        grade: "B",
        gradeNote: "AAAAI — evidence summary",
        how: "**Shower and change clothes when you come in**, especially before bed — otherwise you take the pollen into the sheets.\n\nWindows closed on high-count days, dry laundry indoors during your season, and wraparound sunglasses outdoors. A HEPA filter in the bedroom is the one with the most plausible benefit.",
        evidence: [
          "American Academy of Allergy, Asthma & Immunology — environmental control measures for allergic rhinitis.",
          "CDC — reducing pollen exposure.",
        ],
        checkFirst:
          "If pets sleep in your bed and you have year-round symptoms on top of seasonal ones, that's worth testing for rather than assuming. Perennial and seasonal allergy often coexist.",
      },
      {
        id: "immunotherapy",
        title: "Ask about immunotherapy if every season is miserable",
        why: "Allergen immunotherapy is the only treatment that modifies the underlying allergy rather than suppressing symptoms.",
        grade: "A",
        gradeNote: "AAAAI / ACAAI practice parameter",
        supervised: true,
        how: "Two forms: **allergy shots**, and **sublingual tablets** for grass, ragweed and dust mite that you take at home.\n\nIt's a `3–5 year` commitment, and the benefit persists after stopping. Worth raising if your season costs you weeks every year or your medication isn't holding.",
        evidence: [
          "AAAAI / ACAAI — practice parameter on allergen immunotherapy.",
          "NIH / NIAID — allergen immunotherapy overview.",
        ],
        checkFirst:
          "Immunotherapy carries a risk of allergic reactions, so the first sublingual dose is given in a clinic and shots are given where anaphylaxis can be treated. It isn't appropriate with severe uncontrolled asthma.",
      },
    ],
    skipTheHype: {
      remedy: "Local honey for pollen allergy",
      why: "The logic sounds right and the biology doesn't cooperate: the pollen that triggers hay fever is wind-borne from trees, grasses and weeds, while honey contains heavy flower pollen carried by bees — largely different proteins. The controlled trials that tested it found no benefit over placebo.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "psoriasis-support",
    name: "Psoriasis support",
    nameEmphasis: "support",
    icon: "bandage",
    category: "skin-immune",
    blurb: "A systemic immune condition that happens to show on the skin.",
    matchRules: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    intro:
      "Psoriasis looks like a skin condition and behaves like a systemic one. Skin cells turn over far too fast because the immune system is driving them, and the same inflammation shows up elsewhere.\n\nThat's why the associated risks matter: **psoriatic arthritis affects a substantial minority and can cause permanent joint damage if it's missed**, and cardiovascular and metabolic risk are meaningfully raised.\n\nSo this page has two jobs. Support the skin, and make sure the things that travel with psoriasis are being looked for.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "ldl-c", label: "LDL-C", unit: "mg/dL", flagAbove: 130 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
      { markerId: "uric-acid", label: "Uric acid", unit: "mg/dL", flagAbove: 7 },
    ],
    doctorBanner: {
      title: "Psoriasis is a treatable immune condition — and it's under-treated",
      body: "Effective systemic and biologic therapies exist and have changed outcomes substantially. Everything here supports dermatology care. Nothing on this page treats psoriasis or is a reason to change a prescription.",
    },
    steps: [
      {
        id: "joint-screen",
        title: "Get screened for psoriatic arthritis — every year",
        why: "Joint damage from psoriatic arthritis can be permanent, and skin psoriasis usually appears years before the joints do.",
        grade: "A",
        gradeNote: "AAD / NPF joint guideline",
        supervised: true,
        how: "Tell your doctor about **any joint pain, morning stiffness lasting over `30 minutes`, a swollen finger or toe, or heel pain**.\n\nAnnual screening is recommended for everyone with psoriasis. Nail changes — pitting, lifting, ridging — raise the likelihood further and are worth pointing out.",
        evidence: [
          "American Academy of Dermatology / National Psoriasis Foundation — joint guidelines on the management of psoriasis with awareness of comorbid disease.",
          "NIH / NIAMS — psoriatic arthritis overview.",
        ],
        checkFirst:
          "A finger or toe swollen along its whole length — dactylitis, or \"sausage digit\" — is close to specific for psoriatic arthritis. Don't wait for a routine appointment with that.",
      },
      {
        id: "moisturise-psoriasis",
        title: "Moisturise heavily, and treat plaques as prescribed",
        why: "Emollients reduce scale and itch and make prescribed topicals work better on the plaque underneath.",
        grade: "A−",
        gradeNote: "AAD / NPF topical guideline",
        supervised: true,
        how: "Thick ointments, applied generously, especially after bathing.\n\nUse prescribed topicals as directed — usually a corticosteroid with a vitamin D analogue. **Scale has to be softened before anything can get through it**, which is why the moisturiser isn't optional.",
        evidence: [
          "American Academy of Dermatology / National Psoriasis Foundation — guidelines of care for the management of psoriasis with topical therapy.",
          "NIH / NIAMS — psoriasis treatment overview.",
        ],
        checkFirst:
          "Potent steroids on the face, groin or skin folds need lower-strength alternatives. And stopping a potent steroid abruptly over a large area can trigger a severe flare — follow the taper you were given.",
      },
      {
        id: "triggers-psoriasis",
        title: "Know your flare triggers — including the medication ones",
        why: "Several triggers are avoidable, and a few of them are common prescriptions that nobody connects to the skin.",
        grade: "B+",
        gradeNote: "AAD / NPF guideline — evidence summary",
        how: "The recognised ones: **skin injury** (the Koebner phenomenon — psoriasis appears where skin is scratched, cut or sunburnt), **streptococcal throat infection**, stress, smoking and alcohol.\n\nMedications that can trigger or worsen it include **lithium, beta-blockers, antimalarials, and rapid withdrawal of oral steroids**.",
        evidence: [
          "American Academy of Dermatology / National Psoriasis Foundation — psoriasis guideline (triggers and exacerbating factors).",
          "NIH / NIAMS — psoriasis causes and triggers.",
        ],
        checkFirst:
          "Never stop a prescribed medication because it might be a trigger — several on that list are treating something serious. Raise it; the substitution is your prescriber's decision.",
      },
      {
        id: "smoking-alcohol-weight",
        title: "Smoking, alcohol and weight all change severity",
        why: "All three are independently associated with more severe psoriasis, and weight loss improves both severity and how well treatment works.",
        grade: "A−",
        gradeNote: "AAD / NPF guideline · evidence summary",
        how: "Smoking is strongly associated with psoriasis severity — quitting is the highest-value change available here.\n\nWeight loss in people with obesity improves severity **and improves response to systemic treatment**, which is a rare double benefit. Alcohol is associated with severity and interacts with several psoriasis medications.",
        evidence: [
          "American Academy of Dermatology / National Psoriasis Foundation — guideline on lifestyle measures and comorbidity management.",
          "Evidence summary — randomised trials of weight loss and psoriasis severity.",
        ],
        checkFirst:
          "If you're on methotrexate or acitretin, alcohol matters a great deal more — both affect the liver. Get your limit from your prescriber, not a general guideline.",
      },
      {
        id: "cardio-psoriasis",
        title: "Have your cardiovascular and metabolic risk checked",
        why: "Moderate-to-severe psoriasis carries meaningfully raised cardiovascular, diabetes and fatty liver risk, and it's a recognised screening indication.",
        grade: "A",
        gradeNote: "AAD / NPF comorbidity guideline · AHA",
        supervised: true,
        how: "Ask for **blood pressure, a lipid panel, HbA1c and liver enzymes**, and say that psoriasis is the reason.\n\nThe guidelines treat psoriasis as a risk-enhancing factor in cardiovascular risk assessment, which can change how aggressively other risks get managed.",
        evidence: [
          "American Academy of Dermatology / National Psoriasis Foundation — guidelines on the management of psoriasis with attention to comorbidities.",
          "AHA / ACC — cholesterol guideline (psoriasis as a risk-enhancing factor).",
        ],
        checkFirst:
          "Depression is markedly more common with psoriasis and is part of the condition's burden, not a separate weakness. It belongs in the same appointment.",
      },
      {
        id: "escalate-psoriasis",
        title: "Escalate if topicals aren't holding it",
        why: "Biologics and targeted oral therapies have transformed outcomes, and undertreatment is the most common problem in psoriasis care.",
        grade: "A",
        gradeNote: "AAD / NPF biologics guideline",
        supervised: true,
        how: "Ask for a dermatology referral if topicals aren't controlling it, if it covers a significant area, or if it's affecting your hands, feet, face or genitals — where small areas cause large impact.\n\nOptions include phototherapy, targeted biologics and oral small-molecule drugs.",
        evidence: [
          "American Academy of Dermatology / National Psoriasis Foundation — guidelines of care for the management of psoriasis with biologics.",
          "NIH / NIAMS — psoriasis systemic treatment overview.",
        ],
        checkFirst:
          "Biologics affect immune function — screening for tuberculosis and hepatitis happens before starting, and vaccinations are reviewed. That's routine, not a reason to avoid them.",
      },
    ],
    skipTheHype: {
      remedy: "The \"psoriasis diet\" — gluten-free for everyone, and Dead Sea salt cures",
      why: "The AAD/NPF dietary guidance supports weight loss in people with obesity, and a gluten-free trial **only** in people who test positive for coeliac markers. For everyone else the evidence doesn't support it. Salt baths can soften scale and feel good — that's symptom relief, not disease modification, and it's often sold as the latter.",
    },
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
