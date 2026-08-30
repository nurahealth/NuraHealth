// ─────────────────────────────────────────────────────────────────────────────
// Library — Mind & sleep.
//
// The most safety-sensitive category in the section after alpha-gal. Every
// entry here names a threshold at which the answer is a clinician, and the
// anxiety and low-mood protocols both carry the crisis line explicitly.
//
// Insomnia lives inside "Sleep support" rather than as its own entry: the
// protocol for chronic insomnia IS that page's protocol, ending in CBT-I, and
// splitting it would have produced two pages with the same six steps.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition } from "../types";

export const MIND_SLEEP_CONDITIONS: Condition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "anxiety-support",
    name: "Anxiety support",
    nameEmphasis: "support",
    icon: "wind",
    category: "mind-sleep",
    blurb: "The levers with real trial data, and the threshold for getting help.",
    matchRules: [
      { markerId: "cortisol-pm", label: "evening cortisol", unit: "μg/dL", flagAbove: 5 },
    ],
    pillarRule: { key: "resilience", label: "Resilience", below: 75 },
    intro:
      "Anxiety is a threat-detection system running hot. The physical symptoms — racing heart, tight chest, shallow breathing, churning stomach — are the body doing exactly what it's designed to do, at a moment when there's nothing to run from.\n\nWhat helps is a short list, and it's ranked honestly below: **movement, sleep, and reducing the things that mimic anxiety** first; breathing practice second; supplements a distant third.\n\nAnd there's a line. Anxiety that's persistent, that's shrinking your life, or that's arriving as panic attacks has genuinely effective treatments — CBT and, where appropriate, medication. This page supports that care. It doesn't stand in for it.",
    matchedIntro:
      "Some of your markers are consistent with a body carrying sustained load.",
    signals: [
      { markerId: "cortisol-am", label: "Cortisol AM", unit: "μg/dL", flagAbove: 18 },
      { markerId: "cortisol-pm", label: "Cortisol PM", unit: "μg/dL", flagAbove: 5 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagBelow: 0.4 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "hrv", label: "HRV", unit: "ms", flagBelow: 45 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
    ],
    doctorBanner: {
      title: "This supports treatment — it isn't a substitute for it",
      body: "Anxiety disorders are common and highly treatable. If anxiety is interfering with work, sleep or relationships, the most effective thing on this page is the step that says talk to someone. Nothing here is a reason to change or stop a prescribed medication.",
    },
    steps: [
      {
        id: "rule-out-mimics",
        title: "Rule out the things that imitate anxiety",
        detailTitle: "What else looks like anxiety",
        why: "An overactive thyroid, anaemia, some medications and heavy caffeine all produce the exact physical picture of anxiety.",
        grade: "A−",
        gradeNote: "NIMH · clinical review literature",
        supervised: true,
        how: "Worth asking your doctor to check: **thyroid function, a full blood count and ferritin, and blood sugar**, plus a review of your medications.\n\nCommon offenders: decongestants, some asthma inhalers, thyroid replacement that's slightly too high, steroids, and stimulant medication.",
        evidence: [
          "National Institute of Mental Health — anxiety disorders overview.",
          "Evidence summary — clinical reviews of medical conditions presenting as anxiety.",
        ],
        checkFirst:
          "Chest pain, a racing heart that won't settle, breathlessness at rest or fainting is a medical assessment first — every time. Do not assume a new symptom is a panic attack until someone has looked.",
      },
      {
        id: "caffeine-anxiety",
        title: "Cut caffeine — properly, and taper it",
        why: "Caffeine is a direct anxiogenic at everyday doses, and it's the most-overlooked reversible cause of daily anxiety symptoms.",
        grade: "A−",
        gradeNote: "Evidence summary — controlled trials",
        how: "Caffeine reliably induces anxiety symptoms in controlled studies, and more so in people already prone to them.\n\nTaper over `1–2 weeks` rather than stopping dead — abrupt withdrawal gives headaches and a rebound that feels like worse anxiety. Watch energy drinks and pre-workout, which carry far more than coffee.",
        evidence: [
          "Evidence summary — controlled trials of caffeine administration and induced anxiety symptoms.",
          "FDA — guidance on caffeine intake in adults.",
        ],
        checkFirst:
          "If you use caffeine to manage fatigue caused by a sleep disorder, cutting it without addressing the sleep just moves the problem. Do the sleep protocol alongside.",
      },
      {
        id: "move-anxiety",
        title: "Move — it's the strongest non-prescription lever",
        why: "Regular aerobic exercise has the largest and most consistent effect on anxiety of anything available without a prescription.",
        grade: "A",
        gradeNote: "HHS Physical Activity Guidelines · NIMH",
        how: "`150 minutes a week` of moderate activity, spread across most days. Outdoors beats indoors on the mood measures.\n\nConsistency beats intensity by a distance here. Three brisk `30-minute` walks you actually take outperform a training plan you abandon in week two.",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition (mental health outcomes).",
          "National Institute of Mental Health — physical activity and mental health information.",
        ],
        checkFirst:
          "If exercise reliably triggers panic for you, that's a known pattern — the raised heart rate gets misread as danger. It responds well to graded exposure with a therapist rather than to pushing through alone.",
      },
      {
        id: "paced-breathing",
        title: "Practise a longer exhale daily — not only in a crisis",
        why: "A longer out-breath than in-breath shifts autonomic balance toward the calming side, and a practised skill works far better than an improvised one.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials",
        how: "`In for 4, out for 6`, through the nose, for `5 minutes` a day.\n\nDo it when you're calm so it's available when you aren't. Trying to learn it mid-panic almost never works.",
        evidence: [
          "Evidence summary — randomised trials of slow-paced and cyclic breathing on anxiety and heart-rate variability; consistent short-term effects, small samples.",
          "NCCIH — relaxation techniques for health.",
        ],
        checkFirst:
          "If breathwork brings on dizziness, tingling or panic, stop and switch to ordinary slow nasal breathing. Skip breath-holding practices entirely in pregnancy or with cardiac or seizure history.",
      },
      {
        id: "cbt-anxiety",
        title: "Ask about CBT — it's first-line, and it's underused",
        why: "Cognitive behavioural therapy is a first-line treatment for anxiety disorders with durable effects, and most people who'd benefit have never been referred.",
        grade: "A",
        gradeNote: "NICE · APA clinical guidance",
        supervised: true,
        how: "Ask your doctor for a referral, or look for a validated digital CBT programme — several are offered free through health systems.\n\nThe active ingredient is **exposure**: approaching what you avoid, in graded steps, with support. That's why avoidance-based coping tends to make anxiety grow over time.",
        evidence: [
          "NICE — guidance on generalised anxiety disorder and panic disorder in adults.",
          "American Psychological Association — clinical practice guidance on treatments for anxiety disorders.",
        ],
        checkFirst:
          "If you're already on medication for anxiety, keep taking it. Therapy is added alongside — starting it is never a reason to reduce or stop a prescription without your prescriber.",
      },
      {
        id: "alcohol-anxiety",
        title: "Retire the drink that takes the edge off",
        why: "Alcohol sedates and then rebounds, and the rebound arrives as anxiety — usually the next morning.",
        grade: "A−",
        gradeNote: "NIAAA — evidence summary",
        how: "Try `2 weeks` without and watch your morning anxiety rather than your intentions.\n\nThe pattern to look for: calm at 9pm, awake and anxious at 4am. That's the second half of the night after alcohol, and it feeds the next day's anxiety directly.",
        evidence: [
          "National Institute on Alcohol Abuse and Alcoholism — alcohol and mental health.",
          "Evidence summary — controlled studies of evening alcohol and sleep architecture.",
        ],
        checkFirst:
          "Stopping heavy daily drinking abruptly can be dangerous — withdrawal is a medical event, and it can look like severe anxiety. If you drink daily and in quantity, plan the taper with a doctor.",
      },
    ],
    skipTheHype: {
      remedy: "CBD gummies for anxiety",
      why: "The trial evidence in humans for over-the-counter CBD doses is thin, and independent testing repeatedly finds products containing far less — or far more — CBD than the label claims, sometimes with detectable THC. The one CBD product with strong evidence is a prescription epilepsy medication at doses nothing on a shop shelf reaches.",
    },
    bookTitle: "The Anxiety Toolkit — what the evidence supports, and what it doesn't",
    bookUrl: null,
    landingSlug: "anxiety-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "low-mood-support",
    name: "Low mood support",
    nameEmphasis: "support",
    icon: "smile",
    category: "mind-sleep",
    blurb: "What genuinely helps, and the two-week line where it stops being self-help.",
    matchRules: [
      { markerId: "vit-d", label: "vitamin D", unit: "ng/mL", flagBelow: 20 },
    ],
    intro:
      "Low mood and depression aren't the same thing, and the difference is duration and reach. A flat week after a hard month is normal. Most of the day, most days, for two weeks or more — with loss of interest in things you used to enjoy — is the threshold clinicians use.\n\nBelow that line, the things on this page genuinely help: movement, light, sleep, and contact with other people. The evidence for those is real and it's better than for anything you can buy.\n\nAbove that line, they're still worth doing — but they're an addition to treatment, not a replacement for it. **Depression is one of the most treatable conditions in medicine, and it responds better the earlier it's treated.**",
    matchedIntro: "Your vitamin D is low, which is worth correcting on its own merits.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "folate", label: "Folate", unit: "ng/mL", flagBelow: 4 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    doctorBanner: {
      title: "If this has lasted two weeks, start with a doctor",
      body: "Everything below supports treatment for low mood — it does not replace it, and it is not a reason to change or stop any prescribed medication. If you are having thoughts of harming yourself, call or text 988 in the US for the Suicide and Crisis Lifeline, any time.",
    },
    steps: [
      {
        id: "two-week-line",
        title: "Know the two-week line, and say it plainly",
        detailTitle: "When this stops being self-help",
        why: "There's a standard duration threshold clinicians use, and naming it removes the guesswork about whether you're \"bad enough\" to ask for help.",
        grade: "A",
        gradeNote: "NIMH · USPSTF screening guidance",
        supervised: true,
        how: "If low mood, **or loss of interest in things you normally enjoy**, has been there most of the day, most days, for `2 weeks or more` — that's the threshold.\n\nSay it in those words to your doctor. Effective treatment exists, and it works better the earlier it starts.",
        evidence: [
          "National Institute of Mental Health — depression signs, symptoms and treatment.",
          "U.S. Preventive Services Task Force — recommendation on screening for depression in adults.",
        ],
        checkFirst:
          "If you are having thoughts of harming yourself, this page is the wrong place. In the US, call or text 988 for the Suicide and Crisis Lifeline, any time, or go to an emergency department.",
      },
      {
        id: "rule-out-mood",
        title: "Check the physical causes first",
        why: "Thyroid disease, anaemia, B12 deficiency and sleep apnoea all present as low mood, and all four are straightforward to test.",
        grade: "A−",
        gradeNote: "NIMH · clinical review literature",
        supervised: true,
        how: "Ask for **thyroid function, a full blood count with ferritin, B12 and folate, and vitamin D**.\n\nMention snoring or daytime sleepiness if either applies — untreated sleep apnoea is a common and very treatable driver of low mood that gets missed for years.",
        evidence: [
          "National Institute of Mental Health — depression and co-occurring medical conditions.",
          "NIH Office of Dietary Supplements — vitamin B12 and vitamin D fact sheets.",
        ],
        checkFirst:
          "Low mood that started within weeks of a new medication is worth flagging. Some contraceptives, steroids, beta-blockers and acne treatments are known contributors — but never stop one yourself.",
      },
      {
        id: "behavioural-activation",
        title: "Do the thing before you feel like it",
        detailTitle: "Behavioural activation",
        why: "Waiting for motivation is the trap — in depression, action reliably comes before mood improves, not after.",
        grade: "A",
        gradeNote: "NICE · evidence summary",
        how: "Pick `1–2 small` scheduled activities a day that used to give you something — a walk, a call, a task with a visible end.\n\n**Schedule them by time, not by mood.** This is behavioural activation, and in head-to-head trials it performs comparably to full CBT for depression.",
        evidence: [
          "NICE — guidance on depression in adults (behavioural activation as a first-line psychological intervention).",
          "Evidence summary — randomised trials of behavioural activation versus cognitive therapy.",
        ],
        checkFirst:
          "If you can't get out of bed, can't work, or aren't eating, this step is too big to start alone. That's the point at which the answer is a clinician, not a bigger effort.",
      },
      {
        id: "move-mood",
        title: "Move, and get morning light while you do it",
        why: "Exercise has consistent antidepressant effects, and morning light anchors the body clock that low mood tends to drag out of phase.",
        grade: "A",
        gradeNote: "HHS Physical Activity Guidelines · NIMH",
        how: "`150 minutes a week` of moderate activity. A walk counts.\n\nTake `10 minutes` of it outdoors within an hour of waking, no sunglasses. Even an overcast morning delivers many times more light than a bright room.",
        evidence: [
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans, 2nd edition (mental health outcomes).",
          "NIH / NIMH — seasonal affective disorder and light therapy information.",
        ],
        checkFirst:
          "If your low mood is clearly seasonal, ask about proper light therapy — a `10,000 lux` box used correctly in the morning. It can trigger agitation in bipolar disorder, so it's set up with a clinician.",
      },
      {
        id: "connection",
        title: "Protect contact with people, even at low volume",
        why: "Social withdrawal is both a symptom and an accelerant, and reversing it is one of the few things that reliably interrupts the loop.",
        grade: "B+",
        gradeNote: "Evidence summary — NIMH / population research",
        how: "One low-effort contact a day. A message counts; a walk with someone counts more.\n\nThe aim isn't socialising well. It's **not disappearing** — the withdrawal is the part that makes everything else harder.",
        evidence: [
          "National Institute of Mental Health — coping with depression guidance.",
          "Evidence summary — population research on social connection and depression outcomes.",
        ],
        checkFirst:
          "If you've been withdrawing for weeks and can't reverse it, tell someone that specifically. It's a meaningful clinical detail, not a character failing.",
      },
      {
        id: "supplements-mood",
        title: "Be sceptical about mood supplements",
        why: "The two most-sold ones have real interaction risks, and neither replaces treatment that works.",
        grade: "B",
        gradeNote: "NCCIH — evidence summary",
        supplement: true,
        labNote:
          "St John's wort products vary enormously in hypericin content between brands, which makes the interaction risk unpredictable. If you're considering anything in this category, read the Lab Report and then talk to a pharmacist.",
        how: "**St John's wort** has trial data for mild-to-moderate depression — and one of the worst interaction profiles of any herb sold.\n\n**Omega-3** has modest evidence, mostly in EPA-predominant formulas. Correcting a genuinely low vitamin D or B12 is worth doing on its own merits, but it isn't a treatment for depression.",
        evidence: [
          "National Center for Complementary and Integrative Health — St John's wort and omega-3 summaries.",
          "NIH Office of Dietary Supplements — vitamin D and omega-3 fact sheets.",
        ],
        checkFirst:
          "St John's wort induces liver enzymes and reduces the effectiveness of hormonal contraception, warfarin, some HIV and transplant medicines, and several others. Combined with an SSRI it can cause serotonin syndrome. **Do not start it without a pharmacist or doctor reviewing your full medication list.**",
      },
    ],
    skipTheHype: {
      remedy: "\"Serotonin-boosting\" 5-HTP supplements",
      why: "The chemical-imbalance story they're sold on is a simplification the research moved past years ago, and the human evidence for 5-HTP in depression is weak. Taken with an SSRI, SNRI, triptan or tramadol it carries a real serotonin syndrome risk. This is a supplement with poor upside and a genuinely bad downside.",
    },
    bookTitle: "The Low Mood Guide — light, movement and knowing when to get help",
    bookUrl: null,
    landingSlug: "low-mood-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "focus-support",
    name: "Focus & attention support",
    nameEmphasis: "& attention support",
    icon: "target",
    category: "mind-sleep",
    blurb: "Sleep, structure and honest limits — not a nootropic stack.",
    matchRules: [
      { markerId: "ferritin", label: "ferritin", unit: "ng/mL", flagBelow: 30 },
    ],
    pillarRule: { key: "sleep", label: "Sleep", below: 75 },
    intro:
      "Attention problems have a long list of causes, and most of them are not ADHD. Short sleep, untreated sleep apnoea, anxiety, depression, iron deficiency, thyroid disease and simple chronic overload all present the same way: you can't hold a thought, you re-read the same paragraph, you start five things.\n\nThis page is about the inputs that make attention possible for anyone. It is **not** a substitute for an ADHD assessment, and nothing here treats ADHD.\n\nIf attention problems have been present since childhood, across more than one setting, and are genuinely costing you at work or at home — that's an assessment, not a routine to optimise.",
    matchedIntro: "Low iron stores are one of the reversible causes worth ruling out first.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "sleep-eff", label: "Sleep efficiency", unit: "%", flagBelow: 85 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
    ],
    doctorBanner: {
      title: "This supports attention — it does not diagnose or treat ADHD",
      body: "ADHD is a clinical diagnosis made by a qualified professional, and it has effective treatments. Nothing on this page assesses it, replaces it, or is a reason to change or stop a prescribed medication.",
    },
    steps: [
      {
        id: "sleep-focus",
        title: "Fix sleep before you judge your attention",
        why: "Short and fragmented sleep degrades sustained attention and working memory more reliably than almost any other input.",
        grade: "A",
        gradeNote: "AASM · NIH sleep research",
        how: "`7 hours or more`, at a consistent time, for `2 weeks` before you draw any conclusions about your focus.\n\nRun the sleep protocol in this section. The fixed wake time and the caffeine curfew are the two that matter most here.",
        evidence: [
          "American Academy of Sleep Medicine — sleep duration recommendations and cognitive consequences of insufficient sleep.",
          "NIH / NHLBI — sleep deprivation and cognitive performance research.",
        ],
        checkFirst:
          "Loud snoring, gasping, or being told you stop breathing is sleep apnoea until proven otherwise — and untreated apnoea produces exactly this attention picture. That needs a sleep study, not a productivity system.",
      },
      {
        id: "rule-out-focus",
        title: "Rule out the medical causes of poor concentration",
        why: "Iron deficiency, B12 deficiency and thyroid disease all cause attention problems, and all three are cheap to check and correctable.",
        grade: "A−",
        gradeNote: "NIH ODS · clinical review literature",
        supervised: true,
        how: "Ask for **ferritin, B12, thyroid function and a full blood count**.\n\n`Ferritin` matters even when haemoglobin is normal — you can be iron-depleted without being anaemic, and cognitive symptoms show up in that gap.",
        evidence: [
          "NIH Office of Dietary Supplements — iron and vitamin B12 fact sheets for health professionals.",
          "Evidence summary — clinical reviews of medical causes of cognitive complaints in adults.",
        ],
        checkFirst:
          "Don't self-supplement iron without a ferritin result. Iron overload is a real condition, and taking iron you don't need is harmful rather than neutral.",
      },
      {
        id: "structure",
        title: "Build external structure instead of relying on willpower",
        why: "The interventions with the best evidence for adult attention difficulties are environmental and behavioural, not chemical.",
        grade: "B+",
        gradeNote: "Evidence summary — behavioural intervention research",
        how: "Three that carry most of the weight: **one capture list** for everything, **time-blocking** so decisions are made in advance, and **removing the phone from the room** rather than resisting it.\n\nWork in defined blocks — `25–50 minutes` — with real breaks. The break is not optional; attention is a depleting resource.",
        evidence: [
          "Evidence summary — research on environmental and behavioural strategies for attention difficulties in adults.",
          "CDC — ADHD behavioural treatment overview (principles applicable more broadly).",
        ],
        checkFirst:
          "If structure keeps collapsing no matter how well you design it, that itself is clinically meaningful. It's information for an assessment, not evidence you didn't try hard enough.",
      },
      {
        id: "move-focus",
        title: "Move before the work that needs the most attention",
        why: "A single bout of aerobic exercise measurably improves attention and executive function for the hours afterwards.",
        grade: "B+",
        gradeNote: "Evidence summary — controlled trials",
        how: "`20–30 minutes` of moderate aerobic activity before your hardest block.\n\nThe acute effect is well replicated in controlled studies; the long-term effect is smaller but goes the same way. Outdoors adds a little more.",
        evidence: [
          "Evidence summary — controlled trials of acute aerobic exercise and executive function.",
          "U.S. Department of Health and Human Services — Physical Activity Guidelines for Americans (cognitive outcomes).",
        ],
        checkFirst:
          "If you're using exercise to compensate for chronic sleep loss, you're spending capital you don't have. Fix the sleep first — that's the step above for a reason.",
      },
      {
        id: "caffeine-honestly",
        title: "Use caffeine honestly — and don't stack it",
        why: "Caffeine genuinely helps alertness and genuinely costs you sleep, and most people are paying the second price without noticing the trade.",
        grade: "B+",
        gradeNote: "FDA guidance — evidence summary",
        supplement: true,
        labNote:
          "Pre-workout and \"nootropic\" blends often hide `200–400 mg` of caffeine plus stimulants that aren't clearly labelled. If you use one, check what's actually in it on the Lab Report before you add coffee on top.",
        how: "One fixed dose, early, at the same time daily. Stop `8–10 hours` before bed.\n\n**Escalating the dose to chase yesterday's effect is the failure mode** — tolerance builds, sleep degrades, and the attention problem you were treating gets worse.",
        evidence: [
          "FDA — guidance on caffeine intake in adults.",
          "Evidence summary — controlled trials of caffeine timing, tolerance and sleep quality.",
        ],
        checkFirst:
          "Never combine a caffeine stack with prescribed stimulant medication without your prescriber. And if caffeine gives you palpitations, tremor or anxiety, that's the signal to stop, not to push through.",
      },
      {
        id: "assessment",
        title: "If it's been lifelong and it's costing you, get assessed",
        why: "Adult ADHD is under-diagnosed, especially in women, and effective treatment exists — but only after a proper assessment.",
        grade: "A",
        gradeNote: "CDC · professional society guidance",
        supervised: true,
        how: "The pattern that warrants assessment: difficulties present **since childhood**, showing up in **more than one setting**, and causing real impairment now.\n\nBring examples — school reports, work reviews, what a partner has noticed. Self-report questionnaires online are a prompt to seek assessment, not a diagnosis.",
        evidence: [
          "CDC — ADHD diagnosis in adults and children.",
          "Professional society guidance on adult ADHD assessment and management.",
        ],
        checkFirst:
          "Attention problems that are new in adulthood are more likely to be sleep, mood, thyroid, medication or another medical cause — and that's a good thing, because most of those are fixable. Say clearly when it started.",
      },
    ],
    skipTheHype: {
      remedy: "Nootropic \"focus\" stacks",
      why: "Most sell a proprietary blend, which means you can't see the doses; independent testing of this category has repeatedly found undeclared and sometimes unapproved stimulants. Where a single ingredient does have evidence, it's usually just the caffeine — which you can buy for pennies and dose deliberately.",
    },
    bookTitle: "The Focus Handbook — attention, sleep and the stimulant question",
    bookUrl: null,
    landingSlug: "focus-support",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "restless-legs",
    name: "Restless legs",
    nameEmphasis: "legs",
    icon: "vibrate",
    category: "mind-sleep",
    blurb: "The one sleep complaint with a specific, checkable blood test behind it.",
    matchRules: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 75 },
    ],
    intro:
      "Restless legs syndrome — also called Willis-Ekbom disease — is a **neurological** condition, not a circulation problem or a muscle problem. The defining features are specific: an urge to move the legs, usually with an uncomfortable sensation, that is **worse at rest, worse in the evening, and temporarily relieved by moving.** If all four fit, that's the picture.\n\nWhat makes this page different from everything else in this category is that there is a **specific, cheap blood test that changes treatment.** Brain iron availability is central to the mechanism — iron is a cofactor for dopamine synthesis — and correcting low iron stores genuinely improves symptoms in a substantial share of people. Crucially, the threshold used here is **much higher than the one for anaemia**: many people with restless legs have a \"normal\" ferritin that is still too low for their brain.\n\nSo the honest order is: get ferritin measured, look at the medications and habits that provoke it, and treat what's underneath. This is one of the conditions where the natural route and the medical route point at exactly the same first step.",
    matchedIntro:
      "Your ferritin is below the level used in restless legs specifically — which is set considerably higher than the anaemia threshold. That's worth raising directly with your doctor, because it's one of the few findings here that changes what treatment actually helps.",
    signals: [
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 75 },
      { markerId: "tsat", label: "Transferrin saturation", unit: "%", flagBelow: 20 },
      { markerId: "egfr", label: "eGFR", unit: "mL/min/1.73m²", flagBelow: 60 },
      { markerId: "mg-rbc", label: "Magnesium RBC", unit: "mg/dL", flagBelow: 6 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 6.4 },
    ],
    steps: [
      {
        id: "ferritin",
        title: "Get ferritin tested — and know the higher threshold",
        detailTitle: "The number that's different for restless legs",
        why: "Iron is the mechanism, and the cut-off that matters here is far above the one your lab prints as normal.",
        grade: "A",
        gradeNote: "American Academy of Sleep Medicine · International RLS Study Group",
        supervised: true,
        how: "Ask for **ferritin and transferrin saturation**, drawn **fasting in the morning** — ferritin rises after meals and with any inflammation, and an afternoon non-fasting sample can read falsely reassuring.\n\nThe threshold is the whole point. In restless legs, guidance supports considering iron treatment when **ferritin is at or below `75 ng/mL`** or transferrin saturation is under `20%` — not the `15–30` your lab flags as low. Plenty of people are told their iron is \"fine\" on a result that is, for this condition, clearly not.\n\n**If it's low, iron replacement is a real treatment**, and it is supervised — dose, route and duration are your clinician's call, and intravenous iron is used in some cases where tablets don't get there. Everything on the iron page in this library applies: never dose blind, and find out why it's low.",
        extra: {
          label: "Why the brain threshold is higher",
          body: "Ferritin measures iron in the body as a whole, but restless legs is about iron availability **in the brain** — and iron crosses into the brain less readily than it circulates. Studies of spinal fluid and brain imaging in restless legs consistently find low brain iron in people whose blood levels look ordinary. That gap between a normal blood test and a low brain level is exactly why the treatment threshold sits where it does.",
        },
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline on the treatment of restless legs syndrome.",
          "International Restless Legs Syndrome Study Group — consensus guidance on iron treatment in RLS.",
          "Evidence summary — brain iron status in restless legs syndrome (imaging and CSF studies).",
        ],
        checkFirst:
          "Don't start iron on your own because of this page. The threshold being higher does not make blind supplementation safe — iron overload is a real condition, and the reason your iron is low still needs finding.",
      },
      {
        id: "triggers",
        title: "Audit the triggers — several are in your medicine cabinet",
        detailTitle: "The provokers, ranked",
        why: "A number of extremely common medications make restless legs dramatically worse, and most people are never told which ones.",
        grade: "A−",
        gradeNote: "AASM guideline · pharmacological reviews",
        supervised: true,
        how: "The drugs most often implicated: **sedating antihistamines** (diphenhydramine — which is in most over-the-counter sleep aids, an especially cruel irony here), **most antidepressants** (SSRIs, SNRIs, mirtazapine — bupropion is the usual exception), **antinausea drugs** like metoclopramide and prochlorperazine, and **antipsychotics**. All act on dopamine or histamine pathways tied to the mechanism.\n\n**Take the list to your prescriber rather than stopping anything.** For several of these an alternative exists, and the swap can be transformative. Stopping an antidepressant abruptly is its own problem.\n\nThe non-drug provokers: **alcohol** (reliably worsens it, especially in the second half of the night), **caffeine**, **nicotine**, and **sleep deprivation** — which is a loop, because the condition causes it.\n\nAlso worth knowing: **pregnancy** commonly triggers restless legs, especially in the third trimester, and it usually resolves after delivery. **Kidney disease** and **diabetes with neuropathy** are two medical causes that need managing in their own right.",
        evidence: [
          "American Academy of Sleep Medicine — RLS guideline: exacerbating medications.",
          "Evidence summary — antidepressant, antihistamine and antidopaminergic drugs in restless legs syndrome.",
          "Evidence summary — restless legs syndrome in pregnancy and chronic kidney disease.",
        ],
        checkFirst:
          "Never stop a prescribed antidepressant, antipsychotic or antinausea medication on your own. This is a list to bring to an appointment — several of them have alternatives, and the conversation takes five minutes.",
      },
      {
        id: "movement",
        title: "Use movement deliberately — timing beats intensity",
        why: "Moderate regular exercise has trial evidence in restless legs; late intense exercise reliably makes it worse.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised exercise trials in RLS",
        how: "**Moderate aerobic exercise plus lower-body resistance work, done regularly, reduces symptom severity** in randomised trials — including in dialysis populations, where the condition is common and the effect has been studied most.\n\n**The timing rule matters more than the programme.** Exercise **earlier in the day**, and avoid hard training within a few hours of bed. Intense late exercise is one of the more consistent aggravators.\n\n**Stretching before bed** — calves, hamstrings, hip flexors — is low-cost and helps some people. So does a warm bath or a warm-then-cool shower on the legs.\n\nAnd during an episode, **do the thing your body is asking for.** Getting up and walking genuinely relieves it; the urge is not something to override. Lying still and enduring makes it worse, not better.",
        evidence: [
          "Evidence summary — randomised trials of exercise interventions in restless legs syndrome.",
          "American Academy of Sleep Medicine — non-pharmacological approaches in RLS.",
          "Evidence summary — pneumatic compression and stretching in RLS symptom relief.",
        ],
        checkFirst:
          "If your leg discomfort is a cramp, a burning pain in a fixed spot, or pain that comes on with walking and eases with rest, that isn't restless legs — that pattern points at circulation or nerve problems and needs a different assessment.",
      },
      {
        id: "sleep-hygiene",
        title: "Rebuild the sleep window around the evening pattern",
        why: "Restless legs follows a circadian rhythm — it peaks in the evening and the early part of the night — and the schedule can be worked with rather than fought.",
        grade: "B",
        gradeNote: "Evidence summary — circadian pattern and behavioural management in RLS",
        how: "Symptoms track a daily rhythm, worst in the evening and overnight and often **noticeably better in the early morning.** Some people do considerably better on a **later bedtime and a later wake time**, sleeping through the calmer end of the cycle rather than lying awake through the worst of it. If your life allows it, that shift is worth testing for a fortnight.\n\n**Keep the bedroom cool** — heat aggravates it for many people.\n\n**Don't lie in bed fighting it.** If an episode starts, get up, walk, come back when it settles. Hours spent awake in bed teach your brain that bed is a place to be alert, and that conditioned insomnia becomes a second problem on top of the first.\n\n**Skip over-the-counter sleep aids.** Almost all of them are antihistamines — the exact drug class that makes this worse. It's the single most common self-inflicted wound in restless legs.",
        evidence: [
          "Evidence summary — circadian variation in restless legs symptom severity.",
          "American Academy of Sleep Medicine — behavioural management and sleep scheduling in RLS.",
          "Evidence summary — antihistamine sleep aids and RLS exacerbation.",
        ],
        checkFirst:
          "If your partner reports that your legs jerk repeatedly through the night, mention it — periodic limb movements of sleep often accompany this and are assessed differently. And if daytime sleepiness is severe, that needs a sleep clinic rather than a schedule tweak.",
      },
      {
        id: "supplements",
        title: "Magnesium and the rest — what the evidence actually shows",
        why: "Magnesium is what everyone recommends for this, and the honest evidence is thinner than the internet suggests.",
        grade: "B",
        gradeNote: "Evidence summary — small and inconsistent trials",
        supplement: true,
        labNote:
          "If you trial magnesium here, the form determines whether you absorb it or simply run to the bathroom — oxide is the cheapest and the worst on both counts. Check the declared form and elemental dose rather than the headline number on the front.",
        how: "**Magnesium** is the most-recommended and least-proven option in restless legs. A few small studies suggest benefit, particularly where magnesium intake is genuinely low or where cramps are part of the picture; the systematic reviews are unimpressed. It's cheap, it's safe at sensible doses, and it's a reasonable `4`-week trial at around `200–400 mg` of elemental magnesium in the evening — glycinate for tolerability. If nothing changes in a month, it isn't your answer.\n\n**Vitamin D** has a small and inconsistent signal, mostly in people who were deficient. Worth correcting if you're low, for other reasons anyway.\n\n**Folate and B12** are worth checking if they haven't been, especially alongside iron.\n\n**Iron is the exception to all of this** — it is the one supplement with a real, guideline-backed role here, and it is the one you must not take without testing first. That order is not negotiable.",
        extra: {
          label: "Why the internet is so confident about magnesium",
          body: "Restless legs gets routinely confused with nocturnal leg cramps, which are a different thing entirely — a cramp is a painful muscle contraction, restless legs is an urge to move without a cramp. Magnesium has more support for cramps than for restless legs, and the two recommendations have been quietly merged across a decade of health articles. If your problem is a cramp, look at the muscle cramps protocol instead; the answers there are different.",
        },
        evidence: [
          "Evidence summary — systematic reviews of magnesium supplementation for restless legs and nocturnal cramps.",
          "American Academy of Sleep Medicine — RLS guideline: iron as the evidence-based supplement intervention.",
          "NIH Office of Dietary Supplements — magnesium fact sheet.",
        ],
        checkFirst:
          "Magnesium needs care in kidney disease and interacts with some antibiotics and thyroid medication. And no supplement here replaces the ferritin test — that's the step that changes outcomes.",
      },
      {
        id: "escalate",
        title: "Know when it's time for a sleep specialist",
        why: "Effective prescription treatment exists, and the first-line choice has changed — which matters, because the older drugs have a serious long-term failure mode.",
        grade: "A−",
        gradeNote: "AASM 2025 clinical practice guideline",
        supervised: true,
        how: "If symptoms happen most nights, wreck your sleep, or are affecting your daytime function, that's the point to see a doctor — ideally one who treats sleep disorders.\n\nOne thing worth walking in knowing: **guidance has moved away from dopamine agonists** (pramipexole, ropinirole) as first-line treatment, because of **augmentation** — a phenomenon where, over months to years, the drug causes symptoms to start earlier in the day, spread to the arms, and become more severe than before treatment. It's common, it's under-recognised, and it's difficult to unwind. The American Academy of Sleep Medicine's current guideline reflects that shift, and **alpha-2-delta ligands (gabapentin enacarbil, pregabalin, gabapentin) are now generally preferred.**\n\nIf you are already on a dopamine agonist and your symptoms have crept earlier in the day, **that is augmentation and it needs review — not a dose increase.**\n\nAsk about **intravenous iron** too if oral iron hasn't worked or isn't tolerated; it is an established option in this condition specifically.",
        evidence: [
          "American Academy of Sleep Medicine — 2025 clinical practice guideline on the treatment of restless legs syndrome in adults.",
          "Evidence summary — augmentation with long-term dopamine agonist therapy in RLS.",
          "International Restless Legs Syndrome Study Group — guidance on intravenous iron therapy.",
        ],
        checkFirst:
          "If you're on a dopamine agonist and symptoms are appearing earlier in the day or spreading to your arms, book a review. Increasing the dose makes augmentation worse, and it's the standard first instinct.",
      },
    ],
    skipTheHype: {
      remedy: "A bar of soap under the bedsheets",
      why: "It is one of the most persistent folk remedies on the internet, endorsed in newspaper columns for decades, and the proposed mechanisms — magnesium absorbed through skin, lavender vapour, static electricity — are all physiologically implausible. **The one attempt at a controlled test found no effect beyond placebo.** It is harmless and it costs a pound, which is exactly why it survives. The real cost is that restless legs has an actual, cheap, guideline-endorsed first test — ferritin — and every month spent on the soap is a month that test isn't ordered.",
    },
    bookTitle: "The Restless Legs Guide — iron, triggers and getting your nights back",
    bookUrl: null,
    landingSlug: "restless-legs",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Adherence support only. This page exists to help people STAY on CPAP and
  // stay in the diagnostic pathway — it is never an alternative to either.
  {
    slug: "sleep-apnea-companion",
    name: "Snoring & sleep apnea companion",
    nameEmphasis: "companion",
    icon: "volume",
    category: "mind-sleep",
    blurb: "Support for getting diagnosed and staying on treatment — never a substitute for it.",
    matchRules: [
      { markerId: "spo2", label: "SpO2", unit: "%", flagBelow: 94 },
    ],
    intro:
      "Snoring is the noise of a partly obstructed airway. **Obstructive sleep apnoea** is when that airway closes enough to stop your breathing — repeatedly, sometimes hundreds of times a night — each pause ending in a micro-arousal you never remember. You can be in bed for nine hours and get almost no restorative sleep.\n\nThe consequences are not cosmetic. Untreated sleep apnoea is associated with **high blood pressure, atrial fibrillation, stroke, type 2 diabetes and heart failure**, and it multiplies the risk of a road traffic accident. It is also strikingly under-diagnosed — a large share of people with it have no idea, and \"I just snore\" is the most common way it stays that way.\n\n**Let this page be clear about what it is.** Obstructive sleep apnoea is diagnosed with a sleep study and treated with CPAP, an oral appliance, or surgery — and those treatments work. Nothing here replaces any of it. What this page is for is the two things that actually go wrong in practice: **people never get the sleep study, and people who do get a CPAP machine stop using it.** Adherence is the weak link in the entire pathway, and that is a problem worth solving.",
    matchedIntro:
      "Your recorded oxygen saturation is below the threshold this protocol flags. Overnight desaturation is one of the things a sleep study measures directly, and a single reading is not a diagnosis — but it is a reason to have the conversation rather than to keep monitoring it yourself.",
    signals: [
      { markerId: "spo2", label: "SpO2", unit: "%", flagBelow: 94 },
      { markerId: "rhr", label: "Resting heart rate", unit: "bpm", flagAbove: 75 },
      { markerId: "sleep-eff", label: "Sleep efficiency", unit: "%", flagBelow: 85 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "total-t", label: "Total testosterone", unit: "ng/dL", flagBelow: 300 },
    ],
    pillarRule: { key: "sleep", label: "Sleep", below: 65 },
    doctorBanner: {
      title: "This never replaces a sleep study or your treatment",
      body: "Untreated obstructive sleep apnoea carries serious cardiovascular and road-safety risk. If you snore loudly, have been seen to stop breathing in your sleep, wake unrefreshed, or fall asleep during the day, ask for a sleep study. If you already have CPAP or an oral appliance, everything here is designed to help you use it — never to replace it, and never as a reason to skip a night.",
    },
    steps: [
      {
        id: "get-studied",
        title: "Get the sleep study — stop trying to rule it out yourself",
        detailTitle: "What the assessment involves, and why apps can't do it",
        why: "This is a diagnosis with real consequences either way, and consumer devices cannot make or exclude it.",
        grade: "A",
        gradeNote: "American Academy of Sleep Medicine — diagnostic guideline",
        supervised: true,
        how: "**The flags worth acting on:** loud snoring, witnessed pauses in breathing, gasping or choking awakenings, waking unrefreshed however long you slept, morning headaches, daytime sleepiness, nocturia, and difficult-to-control blood pressure.\n\n**Ask your doctor for a sleep study.** For most adults with a straightforward picture, that now means a **home sleep apnoea test** — a small kit you wear for a night in your own bed. In-lab polysomnography is reserved for more complex situations.\n\n**Take your partner's account with you.** They have watched you stop breathing; you have not. It is frequently the most useful piece of history in the room.\n\n**And understand what a smartwatch can and can't do.** Consumer oxygen and snore tracking can prompt a useful conversation, and that's a genuine benefit. What it cannot do is measure airflow and respiratory effort together, which is what defines an apnoea — so a normal-looking app result **does not rule this out.**",
        extra: {
          label: "Why the driving question gets asked",
          body: "Untreated sleep apnoea substantially raises crash risk, and if you drive professionally there are legal reporting obligations in most jurisdictions. Clinicians ask about sleepiness at the wheel for that reason. It can feel like a threat to your livelihood — but treated apnoea generally means keeping your licence, and an undiagnosed one is the version that ends badly.",
        },
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline for diagnostic testing for adult obstructive sleep apnea.",
          "Evidence summary — untreated OSA and cardiovascular, metabolic and motor vehicle accident risk.",
          "Evidence summary — accuracy limits of consumer wearables for detecting sleep-disordered breathing.",
        ],
        checkFirst:
          "Falling asleep while driving, or gasping awake regularly, needs an urgent appointment rather than a wait for a routine one. Don't drive when sleepy while this is unresolved.",
      },
      {
        id: "cpap-adherence",
        title: "If you have CPAP, make it survivable — that's the whole game",
        detailTitle: "The fixes for the reasons people quit",
        why: "CPAP works extremely well when it's worn, and a large proportion of people abandon it in the first few weeks over problems that are all fixable.",
        grade: "A",
        gradeNote: "AASM guideline · randomised adherence trials",
        supervised: true,
        how: "Nearly every reason people quit has a specific fix, and almost none of them require giving up:\n\n**The mask leaks or hurts.** Mask fit is the single biggest driver of adherence, and there are many shapes and sizes. Go back and get refitted — as many times as it takes. This is normal, not a complaint.\n**Your nose or mouth dries out.** Ask about **heated humidification** and heated tubing. It resolves most of it.\n**You can't stand the pressure on exhale.** Ask about **pressure relief settings** or an **APAP** device that varies through the night.\n**You're congested.** Treating rhinitis or allergies properly makes a large difference; a blocked nose makes CPAP nearly impossible.\n**Claustrophobia.** Wear the mask while awake — watching TV, reading — for a week before trying to sleep in it. Desensitisation is a recognised technique and it works.\n\n**Use it every night, and all night.** Benefit tracks hours used, and part-night use through the first half of the night misses the REM-heavy second half, when apnoeas are usually worst.\n\n**Read your own data.** Most machines report usage, leak and residual events, and the app version is genuinely motivating.",
        extra: {
          label: "The first month decides it",
          body: "Adherence patterns established in the **first few weeks** strongly predict long-term use. That is exactly the window when the mask is least comfortable and the benefit is least obvious — which is a bad combination. If it is going badly, get seen within that first month rather than after six. Trials show structured early support meaningfully improves long-term use.",
        },
        evidence: [
          "American Academy of Sleep Medicine — positive airway pressure treatment guideline for OSA.",
          "Randomised trials and systematic reviews of interventions to improve CPAP adherence.",
          "Evidence summary — early adherence patterns as predictors of long-term PAP use.",
        ],
        checkFirst:
          "Never simply stop using CPAP because it's uncomfortable. Tell your sleep team instead — stopping returns you to full untreated risk, and almost every comfort problem has an adjustment that solves it.",
      },
      {
        id: "position",
        title: "Sort your sleeping position — and side-sleep properly",
        why: "For a meaningful share of people, apnoeas are far worse on the back, and positional therapy has real trial evidence as an adjunct.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised positional therapy trials",
        how: "**Positional obstructive sleep apnoea** — substantially worse on your back than on your side — accounts for a large minority of cases. Gravity lets the tongue and soft palate fall back into the airway.\n\n**What works:** a **positional trainer** — a worn device that vibrates when you roll onto your back — has randomised evidence and outperforms the folk versions. The classic **tennis ball sewn into the back of a shirt** works on the same principle for less money and less comfort.\n\n**Raising the head of the bed** by a few inches helps some people; propping your head on more pillows does not, and can kink the airway further.\n\n**Be clear about the ceiling.** Positional therapy is an **adjunct**, not a replacement for CPAP in moderate or severe apnoea, and it only helps if your study actually showed a positional pattern. Ask whether yours did — the report says.",
        evidence: [
          "Evidence summary — randomised trials of positional therapy devices in positional OSA.",
          "American Academy of Sleep Medicine — adjunctive therapies in OSA management.",
          "Evidence summary — head-of-bed elevation and upper airway collapsibility.",
        ],
        checkFirst:
          "Don't substitute positional therapy for prescribed CPAP. If you want to try it as an addition, tell your sleep team so it can be checked against your study rather than assumed.",
      },
      {
        id: "weight-alcohol",
        title: "Weight, alcohol and sedatives — the three that move the numbers",
        why: "These are the modifiable factors with the clearest effect on apnoea severity, and one of them acts the very night you change it.",
        grade: "A−",
        gradeNote: "AASM guideline · randomised weight-loss trials",
        how: "**Weight.** Fat around the neck and tongue narrows the airway, and weight loss reduces apnoea severity in randomised trials — a `10%` loss is associated with a substantial fall in the apnoea-hypopnoea index. It genuinely helps, and it rarely resolves moderate or severe apnoea on its own, so it belongs alongside treatment rather than instead of it. Note the loop: untreated apnoea worsens insulin resistance and appetite regulation, which makes weight loss harder — treating the apnoea often makes this step more achievable, not less.\n\n**Alcohol.** It relaxes the upper airway muscles and suppresses the arousal that ends an apnoea, so events get longer and oxygen dips deeper. **This one acts tonight** — skipping the evening drink is the fastest change on this page. Aim for no alcohol within `3–4` hours of bed.\n\n**Sedatives and opioids** do the same thing pharmacologically. If you're on a benzodiazepine, a Z-drug or an opioid and you have sleep apnoea, that combination needs your prescriber's eyes on it — never stop one abruptly on your own.\n\n**Smoking** inflames and swells the upper airway; stopping helps here as everywhere.",
        evidence: [
          "Randomised controlled trials of weight loss interventions and apnoea-hypopnoea index reduction.",
          "Evidence summary — alcohol, sedative-hypnotics and opioids on upper airway collapsibility.",
          "American Academy of Sleep Medicine — lifestyle and behavioural management of OSA.",
        ],
        checkFirst:
          "Never stop a prescribed sedative or opioid abruptly — withdrawal from some is dangerous. Raise the interaction with your prescriber instead. And weight loss is an addition to treatment, never a reason to pause it.",
      },
      {
        id: "airway-tone",
        title: "Consider myofunctional therapy — modest, real, adjunct only",
        detailTitle: "Training the airway muscles",
        why: "Oropharyngeal exercises have genuine randomised evidence for reducing snoring and mild apnoea severity — and the effect size is small enough to be honest about.",
        grade: "B+",
        gradeNote: "Evidence summary — randomised trials and meta-analysis of oropharyngeal exercises",
        how: "**Myofunctional therapy** is a structured programme of tongue, soft palate and throat exercises that improves upper airway muscle tone. Meta-analyses of randomised trials find a **modest reduction in the apnoea-hypopnoea index** and a clearer reduction in snoring and daytime sleepiness.\n\n**Wind instruments and singing** work on the same pathway. The **didgeridoo** has an actual randomised trial behind it — one of the more entertaining entries in sleep medicine, and a genuine one.\n\nWhat this is: a reasonable **adjunct** for snoring and mild disease, done under a trained therapist for around `3` months, most usefully alongside treatment rather than instead of it. It's also useful for people who genuinely cannot tolerate any device.\n\nWhat this is not: a replacement for CPAP in moderate or severe apnoea. The effect size does not come close, and the risk of using it that way is measured in cardiovascular events rather than in disappointment.",
        evidence: [
          "Meta-analyses of randomised trials of oropharyngeal (myofunctional) exercises in obstructive sleep apnoea.",
          "Randomised controlled trial of didgeridoo playing for moderate obstructive sleep apnoea.",
          "American Academy of Sleep Medicine — adjunctive therapy evidence in OSA.",
        ],
        checkFirst:
          "Do not use airway exercises as a reason to stop or delay CPAP. If your apnoea is moderate or severe, this is an addition — the difference between the two matters more here than almost anywhere else in this library.",
      },
      {
        id: "nose-and-alternatives",
        title: "Open the nose, and know the alternatives to CPAP",
        why: "Nasal obstruction sabotages every treatment option, and people who can't tolerate CPAP often don't know there are other real choices.",
        grade: "B+",
        gradeNote: "AASM guideline · evidence summary",
        supervised: true,
        how: "**Fix the nose first.** Chronic congestion from allergic rhinitis, a deviated septum or nasal polyps makes CPAP miserable and mouth-breathing inevitable. **Saline rinses**, treating allergies properly with a **steroid nasal spray**, and an ENT opinion for structural problems are all worth doing before concluding you can't tolerate a machine. Nasal strips and dilators help snoring for some people and don't treat apnoea.\n\n**The real alternatives**, if CPAP genuinely doesn't work for you:\n\n**Mandibular advancement devices** — a custom oral appliance from a dentist trained in sleep medicine that holds the jaw forward. Recommended for mild-to-moderate apnoea and for people who can't tolerate CPAP; less effective than CPAP on average, but far better than nothing and often better tolerated. **The pharmacy boil-and-bite versions are not equivalent** and can move your teeth.\n\n**Surgical options** and **hypoglossal nerve stimulation** exist for selected people. These are specialist decisions.\n\nThe principle throughout: **the best treatment is the one you'll actually use every night.** An imperfect treatment used consistently beats a perfect one in a drawer.",
        evidence: [
          "American Academy of Sleep Medicine / American Academy of Dental Sleep Medicine — oral appliance therapy for OSA.",
          "Evidence summary — nasal obstruction and CPAP adherence.",
          "Evidence summary — hypoglossal nerve stimulation and surgical options in selected patients.",
        ],
        checkFirst:
          "Over-the-counter mouthguards sold for snoring are not treatment for sleep apnoea and can damage your bite. A mandibular advancement device is fitted by a dentist with sleep training, after a diagnosis.",
      },
    ],
    skipTheHype: {
      remedy: "Anti-snoring mouth tape",
      why: "Taping the mouth shut has become a mainstream sleep hack, sold on the idea that forced nasal breathing fixes snoring and \"trains\" your airway. The evidence is thin — a few small studies in **mild** sleep apnoea in people who could already breathe well through the nose — and it does not support the claims being made. The safety concern is the serious part: **in someone with untreated obstructive sleep apnoea or a blocked nose, deliberately obstructing the mouth removes the backup airway**, and clinicians have raised exactly this alarm. The deeper problem is what it's used for. Snoring is the symptom that gets people diagnosed; silencing it while the apnoeas continue removes the alarm without touching the fire.",
    },
    bookTitle: "The CPAP Companion — getting diagnosed, and actually sticking with treatment",
    bookUrl: null,
    landingSlug: "sleep-apnea-companion",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Pacing-first and deliberately conservative. The most important sentence on
  // this page is the one warning against graded exercise.
  {
    slug: "long-covid-recovery",
    name: "Long COVID recovery support",
    nameEmphasis: "recovery support",
    icon: "hourglass",
    category: "mind-sleep",
    blurb: "Pacing first — because pushing through is the one thing that reliably backfires.",
    matchRules: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    intro:
      "Long COVID — post-COVID-19 condition — is symptoms that persist or appear months after the infection, in someone whose acute illness may have been mild. It is recognised by the WHO, the CDC and NICE, it affects a substantial number of people, and **it is not deconditioning and not anxiety.**\n\nThe symptom list is wide: fatigue, breathlessness, brain fog, palpitations, dizziness on standing, sleep disruption, loss of smell, muscle and joint pain. The feature that shapes every recommendation on this page is **post-exertional malaise (PEM)** — a disproportionate worsening of symptoms, often delayed by `12–72` hours, after physical, cognitive or emotional exertion that would once have been trivial.\n\nThat single feature is why this page is conservative and why it leads with pacing. **In people with PEM, the standard rehabilitation instinct — push a bit more each week — makes things worse**, and both NICE and the CDC have updated their guidance to say so. Recovery for many people is real but slow, and the most reliable thing anyone can do early is stop paying for good days with bad weeks.",
    matchedIntro:
      "Your inflammatory marker is raised, which is worth reviewing with your doctor. It doesn't diagnose or rule out anything here — long COVID has no single confirmatory test — but persistent inflammation is a finding that deserves a look for its own sake.",
    signals: [
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "rhr", label: "Resting heart rate", unit: "bpm", flagAbove: 80 },
    ],
    pillarRule: { key: "recovery", label: "Recovery", below: 60 },
    doctorBanner: {
      title: "Rule out the treatable things first",
      body: "Several conditions mimic or accompany long COVID and are separately treatable — anaemia, thyroid disease, diabetes, heart and lung complications, and blood clots. New chest pain, severe breathlessness, fainting, or a swollen painful calf need urgent assessment rather than pacing. Get assessed before you assume everything belongs to one diagnosis.",
    },
    steps: [
      {
        id: "rule-out",
        title: "Get assessed — some of this may be something else",
        detailTitle: "The workup worth asking for",
        why: "There is no single test for long COVID, which makes it a diagnosis of exclusion — and several of the things it gets confused with have specific treatments.",
        grade: "A−",
        gradeNote: "NICE guideline · CDC clinical guidance",
        supervised: true,
        how: "A reasonable initial workup includes **full blood count, ferritin, thyroid function, HbA1c, kidney and liver function, B12 and folate, vitamin D, calcium and an inflammatory marker (CRP)**. Depending on symptoms, that may extend to an **ECG, chest imaging, or lying and standing blood pressure and heart rate**.\n\nWhy it matters: **anaemia, thyroid disease, new diabetes, heart or lung complications and clotting problems** all present with fatigue and breathlessness, and all are treatable in their own right. Assuming everything belongs to long COVID is how those get missed.\n\nAsk specifically about **dysautonomia and POTS** if you get dizzy, breathless or palpitant on standing. It is common after viral illness, frequently missed, and has its own management. A simple lying-to-standing heart rate check in clinic is often the first step.\n\nAnd ask for a **referral to a post-COVID service** if one exists in your area.",
        evidence: [
          "NICE — COVID-19 rapid guideline: managing the long-term effects of COVID-19.",
          "CDC — clinical guidance for post-COVID conditions: evaluation and management.",
          "Evidence summary — POTS and autonomic dysfunction following SARS-CoV-2 infection.",
        ],
        checkFirst:
          "New or worsening chest pain, severe breathlessness, fainting, a swollen painful calf, or confusion are emergencies — not symptoms to pace around. Blood clots are a recognised complication and they are time-critical.",
      },
      {
        id: "pacing",
        title: "Learn pacing properly — this is the whole protocol",
        detailTitle: "The energy envelope, and how to find it",
        why: "If post-exertional malaise is part of your picture, pacing is the intervention with the best chance of preventing the boom-and-bust cycle that entrenches this.",
        grade: "A−",
        gradeNote: "NICE guideline · CDC · specialist consensus",
        how: "**Find your baseline first.** Not what you can do on a good day — what you can do **every** day without paying for it `24–72` hours later. It will feel insultingly small. That is the point, and going under it deliberately for a few weeks is how you find stable ground.\n\n**Stop before you feel you need to.** The delayed nature of PEM means the warning arrives long after the decision. Working to a timer rather than to how you feel is the most reliable method most people find.\n\n**Count all three kinds of exertion.** Cognitive work, emotional strain and social time draw on the same budget as physical activity. Brain fog after a hard meeting is the same mechanism as leg heaviness after a walk.\n\n**Break activity into chunks** with real rest between — lying down, low stimulation, not scrolling.\n\n**Only increase when you have been stable for weeks**, and increase by a little. If a step up triggers PEM, drop back to what was stable and hold there longer. **Progress here is not linear and setbacks are not failures.**",
        extra: {
          label: "Why heart rate monitoring helps",
          body: "Many people find a **heart rate ceiling** easier to obey than a feeling. A common approach is watching for the point where heart rate climbs disproportionately and using a wearable alarm to stop before it. It is an imperfect proxy — and it converts a vague instruction into a number, which is exactly what makes it usable on a foggy day.",
        },
        evidence: [
          "NICE — managing the long-term effects of COVID-19: energy management and pacing.",
          "CDC — post-COVID conditions: activity management and post-exertional malaise.",
          "Evidence summary — pacing and symptom-contingent activity management in post-viral illness.",
        ],
        checkFirst:
          "If you have post-exertional malaise, do not follow a standard graded exercise programme, and be cautious with any rehabilitation that increases activity on a fixed schedule regardless of symptoms. Say the words \"post-exertional malaise\" to whoever is guiding your rehab — it should change the plan.",
      },
      {
        id: "breathing",
        title: "Retrain your breathing — the overlooked one",
        why: "Dysfunctional breathing patterns are extremely common after COVID and cause breathlessness, dizziness and chest tightness that are entirely treatable.",
        grade: "B+",
        gradeNote: "Evidence summary — breathing pattern retraining after COVID-19",
        how: "A large proportion of people are left breathing **shallowly, from the upper chest, and too fast**, often without noticing. It produces real breathlessness, chest tightness, light-headedness and tingling — and it responds well to retraining.\n\n**The basic pattern:** breathe in gently through the nose, let your **belly** rise rather than your chest, and make the out-breath longer than the in-breath. A few minutes, several times a day, is more useful than one long session.\n\n**Ask for a referral to a respiratory physiotherapist.** Breathing pattern retraining is a genuine speciality and the difference between guided and self-taught is significant here.\n\n**One caution specific to this page:** breathwork should be **gentle**. Intense breathing practices — Wim Hof style hyperventilation rounds, breath-holds, hot yoga — can themselves trigger PEM and are not appropriate while you are unstable. Slow and small is the direction.",
        evidence: [
          "Evidence summary — breathing pattern disorders following COVID-19 and response to physiotherapy-led retraining.",
          "NICE — managing the long-term effects of COVID-19: breathlessness management.",
          "Evidence summary — diaphragmatic breathing interventions in post-viral breathlessness.",
        ],
        checkFirst:
          "Breathlessness that is new, severe, or comes with chest pain needs assessment before it's assumed to be a breathing pattern. Retraining is for a diagnosed pattern problem, not for undiagnosed breathlessness.",
      },
      {
        id: "orthostatic",
        title: "Manage the standing symptoms — salt, fluid, compression",
        detailTitle: "If you get dizzy or breathless upright",
        why: "Orthostatic intolerance after viral illness is common and responds to some genuinely simple measures — once someone identifies it.",
        grade: "B+",
        gradeNote: "Evidence summary · autonomic society consensus",
        supervised: true,
        how: "If standing brings on dizziness, palpitations, breathlessness or brain fog that eases when you sit or lie down, that's **orthostatic intolerance**, and it has its own management.\n\n**Fluid and salt.** Increased fluid — often `2–3` litres daily — and **increased dietary salt** are first-line in POTS and related conditions. **This one needs clearing with your doctor first**, because it is exactly wrong if you have high blood pressure, heart failure or kidney disease.\n\n**Compression garments.** Waist-high compression, or abdominal binders, reduce blood pooling in the legs and abdomen. More effective than knee-highs for this purpose.\n\n**Counter-manoeuvres** for a bad moment: crossing your legs and tensing, squatting, tensing your calves before standing. Rise slowly and in stages.\n\n**Sleep with the head of the bed slightly raised**, and be careful in heat and hot showers — both worsen pooling.\n\n**Recumbent exercise** — rowing, recumbent bike, swimming — is generally better tolerated than upright exercise if you are working within your envelope.",
        evidence: [
          "Evidence summary — non-pharmacological management of POTS and orthostatic intolerance (autonomic society consensus statements).",
          "CDC — post-COVID conditions: autonomic symptoms and management.",
          "Evidence summary — compression garments and volume expansion in orthostatic intolerance.",
        ],
        checkFirst:
          "Do not increase salt without medical advice if you have high blood pressure, heart failure or kidney disease. And fainting — actually losing consciousness — needs proper cardiac assessment rather than self-management.",
      },
      {
        id: "sleep-and-fog",
        title: "Protect sleep, and work with the brain fog",
        why: "Unrefreshing sleep and cognitive difficulty are among the most disabling parts of this, and both have practical handles.",
        grade: "B",
        gradeNote: "Evidence summary — observational and small interventional data",
        how: "**Sleep first, without the usual hectoring.** Keep the schedule regular, keep the room dark and cool, and get light in your eyes early. But be realistic: this is often **unrefreshing sleep** rather than insufficient sleep, and no amount of hygiene fixes that — it's a symptom, and it's worth reporting rather than absorbing.\n\n**Naps are allowed here**, which is a departure from standard insomnia advice. Short rests are part of pacing. Long late-afternoon sleep will cost you at night, so keep them earlier and bounded.\n\n**For brain fog, externalise everything.** Lists, alarms, notes, one task at a time, and the hardest thinking in whatever window is reliably your best. Cognitive exertion counts against the same energy budget as physical — a demanding meeting can trigger PEM exactly as a walk can.\n\n**Alcohol tolerance is frequently reduced** after COVID, sometimes dramatically. That's a widely reported pattern, not a moral instruction — but it's worth testing carefully rather than discovering the hard way.",
        evidence: [
          "Evidence summary — sleep disturbance and cognitive dysfunction in post-COVID condition.",
          "CDC — post-COVID conditions: cognitive symptoms and practical strategies.",
          "NICE — managing the long-term effects of COVID-19: symptom-based support.",
        ],
        checkFirst:
          "New or worsening confusion, difficulty speaking, weakness on one side, or a sudden change in cognition is not brain fog — that's an emergency. And persistent low mood or hopelessness deserves treatment in its own right rather than being folded into the diagnosis.",
      },
      {
        id: "supplements-honestly",
        title: "The supplement question, answered honestly",
        why: "This is a condition with a desperate market attached, and being straight about what has and hasn't been shown is more useful than a list.",
        grade: "B",
        gradeNote: "Evidence summary — trials remain preliminary",
        supplement: true,
        labNote:
          "If you do correct a documented deficiency here, this is a category where verification matters — the post-COVID supplement market has attracted a lot of opportunistic products with unverified claims and unverified contents. Check the Purity Score, and prefer single-ingredient products over proprietary \"recovery\" blends.",
        how: "**Correct what's actually low.** If your workup found low **vitamin D, B12, iron or folate**, treat that — it is a real and fixable contributor to fatigue, and it is the only supplement recommendation on this page with solid ground under it.\n\n**What is genuinely under investigation but not established:** coenzyme Q10, nicotinamide riboflavin derivatives, L-arginine, omega-3, probiotics. Some early trials are mildly encouraging and none is at the point where a confident recommendation is honest. If you trial one, trial **one at a time**, for a defined period, and be willing to conclude it didn't work.\n\n**What to avoid:** high-dose \"immune boosting\" stacks, chelation, ozone therapy, hyperbaric oxygen sold outside a trial, and anything marketed specifically as a long COVID cure. This population is being actively targeted, and the prices are extraordinary.\n\n**And tell your doctor everything you take.** Interactions matter more when several systems are already unsettled.",
        evidence: [
          "Evidence summary — preliminary supplement and nutraceutical trials in post-COVID condition.",
          "NICE — managing the long-term effects of COVID-19: caution regarding unproven treatments.",
          "NIH Office of Dietary Supplements — fact sheets on vitamin D, B12 and iron.",
        ],
        checkFirst:
          "Be sceptical of any clinic offering expensive infusions, blood-filtering procedures or hyperbaric oxygen for long COVID outside a registered trial. The evidence isn't there, the costs are large, and the harm is not always only financial.",
      },
      {
        id: "long-game",
        title: "Play the long game — and protect your work and support",
        why: "Recovery is often slow and non-linear, and the practical scaffolding around it determines how survivable that timeline is.",
        grade: "B+",
        gradeNote: "Evidence summary — longitudinal cohorts · occupational guidance",
        how: "**Many people do improve substantially**, and the trajectory is usually months rather than weeks, with peaks and troughs rather than a straight line. Judging your progress week to week will make you feel like you're failing; **compare against three months ago instead.**\n\n**Return to work gradually and in writing.** A phased return with reduced hours, flexible timing and rest breaks works far better than a full return that collapses in a fortnight. In many jurisdictions long COVID can meet the definition of a disability, which brings a right to reasonable adjustments — worth knowing before you negotiate.\n\n**Keep a simple symptom and activity log.** It shows patterns you can't feel in the moment, it makes appointments far more productive, and it is often necessary for occupational health or benefits.\n\n**Get support from people who understand it.** Being disbelieved is one of the most consistently reported harms in this condition, and it is corrosive. Patient-led groups have been ahead of formal medicine on pacing and PEM for years.",
        evidence: [
          "Evidence summary — longitudinal cohort studies of recovery trajectories in post-COVID condition.",
          "NICE — managing the long-term effects of COVID-19: rehabilitation and return to work.",
          "CDC — post-COVID conditions and disability considerations.",
        ],
        checkFirst:
          "If symptoms are worsening rather than plateauing, or new symptoms appear, go back to your doctor rather than assuming it's the same condition. New problems still happen to people who already have one.",
      },
    ],
    skipTheHype: {
      remedy: "Graded exercise therapy as a fixed, push-through programme",
      why: "For years the standard advice for post-viral fatigue was to increase activity on a set schedule regardless of symptoms, on the theory that the problem was deconditioning. **That advice has been formally withdrawn.** NICE removed graded exercise therapy from its ME/CFS guidance in 2021 after re-examining the evidence, and post-COVID guidance now explicitly cautions against fixed incremental exercise in anyone with post-exertional malaise. Patient surveys have repeatedly reported worsening rather than improvement. This is the rare case where the discredited intervention is the *conventional* one and the cautious approach is the evidence-based one — which is exactly why it's named here. Movement still matters, and it has to be symptom-led, within your envelope, and free to go backwards.",
    },
    bookTitle: "The Long COVID Pacing Guide — recovering without paying for it later",
    bookUrl: null,
    landingSlug: "long-covid-recovery",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Supportive-only. Pacing over pushing, and no claim to treat anything.
  {
    slug: "chronic-fatigue-me-cfs",
    name: "Chronic fatigue & ME/CFS companion",
    nameEmphasis: "companion",
    icon: "batteryLow",
    category: "mind-sleep",
    blurb: "Supportive care built around pacing — never around pushing harder.",
    matchRules: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
    ],
    intro:
      "Myalgic encephalomyelitis / chronic fatigue syndrome is a **serious, long-term multi-system illness.** It is not the same as being tired, it is not deconditioning, and it is not a psychological disorder — the CDC, NICE and the National Academy of Medicine are all explicit on that.\n\nThe defining feature, again, is **post-exertional malaise**: a disproportionate crash in symptoms after exertion that was previously routine, typically delayed by `12–72` hours and lasting days or longer. Alongside it sit unrefreshing sleep, cognitive impairment, and often orthostatic intolerance. Severity ranges from people who work reduced hours to people who are housebound or bedbound.\n\n**There is no cure and no disease-modifying treatment.** Anyone who tells you otherwise is selling something, and this population is one of the most heavily targeted in wellness marketing. What genuinely helps is symptom management, treating the treatable things that travel alongside it, and — above all — **pacing**, which is the one approach that consistently avoids making things worse.\n\nThis page is a companion to specialist care, not a protocol that manages the illness. Everything here is designed to reduce harm and preserve function, which is the honest scope.",
    matchedIntro:
      "One of your markers is low and worth correcting on its own merits. Fixing a deficiency doesn't treat ME/CFS — but it removes one avoidable load, and that is worth doing.",
    signals: [
      { markerId: "vit-d", label: "Vitamin D", unit: "ng/mL", flagBelow: 30 },
      { markerId: "ferritin", label: "Ferritin", unit: "ng/mL", flagBelow: 30 },
      { markerId: "b12", label: "B12", unit: "pg/mL", flagBelow: 400 },
      { markerId: "tsh", label: "TSH", unit: "mIU/L", flagAbove: 4 },
      { markerId: "cortisol-am", label: "Cortisol AM", unit: "μg/dL", flagBelow: 10 },
      { markerId: "hs-crp", label: "hs-CRP", unit: "mg/L", flagAbove: 3 },
    ],
    pillarRule: { key: "recovery", label: "Recovery", below: 55 },
    doctorBanner: {
      title: "Companion support only",
      body: "ME/CFS needs medical assessment and, where available, specialist care. Nothing here treats the illness. Its main purpose is to help you avoid the interventions that make it worse and to make sure the treatable conditions that travel alongside it — thyroid disease, anaemia, sleep disorders, orthostatic intolerance, depression — actually get treated.",
    },
    steps: [
      {
        id: "diagnosis",
        title: "Get properly assessed — and get the treatable things treated",
        why: "The diagnosis requires excluding conditions that look similar and are curable, and those are worth finding even after the diagnosis is made.",
        grade: "A−",
        gradeNote: "CDC · NICE NG206 · National Academy of Medicine",
        supervised: true,
        how: "Diagnosis is **clinical**, based on defined criteria — substantial reduction in function for over `6` months, **post-exertional malaise**, unrefreshing sleep, and either cognitive impairment or orthostatic intolerance. There is no confirmatory blood test, which is not the same as there being nothing wrong.\n\n**The exclusion workup matters**: thyroid disease, anaemia and iron deficiency, coeliac disease, diabetes, sleep apnoea, vitamin D and B12 deficiency, and depression. Some of these are curable and some travel alongside ME/CFS rather than instead of it — either way, treating them removes real load.\n\n**Ask specifically about orthostatic intolerance and POTS.** Very common here, frequently missed, and it has its own management.\n\nNICE's 2021 guideline (NG206) was a significant change in direction and is worth knowing exists — **if a clinician tells you this is deconditioning and prescribes graded exercise, that is out of step with current UK guidance**, and you are entitled to say so.",
        evidence: [
          "NICE NG206 — myalgic encephalomyelitis (or encephalopathy) / chronic fatigue syndrome: diagnosis and management.",
          "CDC — ME/CFS: diagnosis, clinical care and management for healthcare providers.",
          "National Academy of Medicine — Beyond Myalgic Encephalomyelitis/Chronic Fatigue Syndrome: redefining an illness.",
        ],
        checkFirst:
          "Don't accept fatigue as fully explained until the basic workup has been done. Anaemia, thyroid disease and sleep apnoea are all common, all treatable, and all capable of hiding behind this diagnosis.",
      },
      {
        id: "pacing",
        title: "Pacing — the core of everything here",
        detailTitle: "Staying inside the envelope",
        why: "Pacing is the single intervention with consistent support in ME/CFS, and it works by preventing harm rather than by producing improvement.",
        grade: "A−",
        gradeNote: "NICE NG206 · CDC · patient-reported outcome data",
        how: "**Find your energy envelope.** The amount of physical, cognitive and emotional activity you can do **without triggering PEM** — measured against how you feel two or three days later, not how you feel during.\n\n**Stay inside it deliberately, including on good days.** The boom-and-bust cycle — doing everything on a good day, crashing for a week — is the pattern that entrenches this illness, and resisting a good day is the hardest discipline in the whole condition.\n\n**Aggressive rest early in a crash** shortens it for many people. Lie down, low light, low stimulation, no screens.\n\n**Track it.** A simple log of activity and symptoms, with the two-to-three day delay in mind, is what makes the invisible pattern visible. Some people use heart rate as a ceiling; some use time blocks. Either beats guessing.\n\n**Split tasks, sit for things you'd normally stand for, and accept help.** Aids — a shower stool, a wheelchair for longer distances — extend your world rather than shrinking it, and the reluctance people feel about them costs more than the aids do.",
        extra: {
          label: "The hardest part is other people",
          body: "Pacing looks like laziness from the outside and it is frequently misread by employers, family and even clinicians. Having something to point at — the CDC page, the NICE guideline, a symptom log — moves the conversation from your character to the illness. That's not a small thing; being disbelieved is one of the most consistently reported harms in this condition.",
        },
        evidence: [
          "NICE NG206 — energy management and pacing in ME/CFS.",
          "CDC — ME/CFS: activity management (pacing) guidance.",
          "Evidence summary — patient-reported outcomes of pacing versus incremental activity programmes.",
        ],
        checkFirst:
          "If a programme asks you to increase activity on a fixed schedule regardless of how you feel, that is not pacing and it is not recommended in current guidance. Say so, and ask for a symptom-led approach instead.",
      },
      {
        id: "sleep",
        title: "Work on sleep — while accepting it may stay unrefreshing",
        why: "Sleep in ME/CFS is broken in a way sleep hygiene alone doesn't fix, and pretending otherwise sets people up to feel like they failed.",
        grade: "B",
        gradeNote: "Evidence summary · NICE NG206",
        how: "**Do the basics** — regular timing, dark and cool room, morning light, limited caffeine. They're worth doing and they help at the margin.\n\n**And be realistic.** Unrefreshing sleep is a **core diagnostic feature** of ME/CFS. No routine makes that go away, and being told to try harder at sleeping is its own kind of exhausting.\n\n**Rest is not the same as sleep.** Lying down quietly without sleeping is legitimate, restorative and part of pacing. It doesn't have to earn its place by producing sleep.\n\n**Napping is generally allowed here**, which departs from standard insomnia advice — the trade-off calculation is different in this illness. Keep naps earlier and bounded so they don't wreck the night.\n\n**Ask about sleep apnoea** if you snore or your partner has seen you stop breathing. It is common, it is treatable, and it makes everything about this worse while it's missed.",
        evidence: [
          "NICE NG206 — sleep management in ME/CFS.",
          "CDC — ME/CFS: managing sleep problems.",
          "Evidence summary — sleep architecture abnormalities in ME/CFS.",
        ],
        checkFirst:
          "Sedating sleep medications need care in this population — several worsen daytime cognition and some are habit-forming. That's a prescriber conversation, and it's worth having rather than self-medicating with over-the-counter antihistamines.",
      },
      {
        id: "orthostatic",
        title: "Manage orthostatic symptoms — fluid, salt, compression",
        why: "Orthostatic intolerance is common in ME/CFS, frequently undiagnosed, and among the more responsive parts of the picture.",
        grade: "B+",
        gradeNote: "Evidence summary · CDC guidance",
        supervised: true,
        how: "If standing makes you dizzy, foggy, breathless or palpitant, this is worth naming — it's often treated as \"just the fatigue\" when it has its own management.\n\n**Fluid and salt**, typically increased — **clear this with your doctor first**, because it's wrong for high blood pressure, heart failure or kidney disease.\n\n**Waist-high compression garments** reduce pooling more effectively than knee-highs.\n\n**Practical adjustments**: rise in stages, sit for showers, keep the room cool, avoid long still standing, and raise the head of the bed slightly.\n\n**Recumbent positions for activity.** If you're going to do something demanding, doing it lying down or reclined costs less. That includes cognitive work.",
        evidence: [
          "CDC — ME/CFS: orthostatic intolerance management.",
          "Evidence summary — non-pharmacological management of orthostatic intolerance and POTS.",
          "NICE NG206 — symptom management in ME/CFS.",
        ],
        checkFirst:
          "Don't increase salt without medical advice, and get actual fainting assessed properly. Losing consciousness needs a cardiac look rather than a compression garment.",
      },
      {
        id: "nutrition",
        title: "Keep nutrition simple and achievable",
        why: "Cooking is exertion, and the most common nutritional problem in ME/CFS is not the wrong diet — it's not eating enough because food preparation costs too much energy.",
        grade: "B",
        gradeNote: "Evidence summary · dietetic guidance",
        how: "**Lower the cost of eating.** Batch cooking on better days, frozen and pre-prepared vegetables, ready meals without apology, delivery, and food kept within reach when you're resting. This is a legitimate strategy, not a compromise.\n\n**Eat regularly and don't skip.** Long gaps worsen fatigue and cognitive symptoms for many people.\n\n**Be very cautious with elimination diets.** They are common in this community and the evidence base is thin. They also cost energy to run, narrow the diet nutritionally, and add another thing to fail at. If bowel symptoms are prominent, do a **structured low-FODMAP trial with a dietitian** rather than an open-ended elimination.\n\n**Correct documented deficiencies** — vitamin D, B12, iron. Worth doing, not curative.\n\n**Alcohol intolerance is a very commonly reported feature.** If it hits you far harder than it used to, that's a recognised pattern rather than something you're imagining.",
        evidence: [
          "CDC — ME/CFS: nutrition and practical management.",
          "NICE NG206 — dietary management and referral to dietetic support.",
          "Evidence summary — reported alcohol intolerance in ME/CFS cohorts.",
        ],
        checkFirst:
          "Unintended weight loss, difficulty swallowing, or an inability to eat enough needs medical and dietetic input. Severe ME/CFS can genuinely compromise nutrition, and that is a clinical situation rather than a diet question.",
      },
      {
        id: "support",
        title: "Build the scaffolding — work, benefits, people",
        why: "The practical and social side determines how survivable this is, and it's the part that gets no clinical time at all.",
        grade: "B+",
        gradeNote: "Evidence summary — psychosocial and occupational outcomes",
        how: "**Work adjustments, in writing.** Reduced or flexible hours, remote work, rest breaks, and a phased return. ME/CFS often meets the legal definition of a disability, which brings a right to reasonable adjustments in many jurisdictions.\n\n**Keep records.** Symptom and activity logs, appointment notes, letters. Benefits and occupational health processes ask for evidence, and gathering it retrospectively while ill is brutal.\n\n**Find people who get it.** Isolation is one of the heaviest costs of this illness, and being disbelieved is one of the most reported harms. Patient organisations have been ahead of formal medicine here for a long time.\n\n**Psychological support is for the burden, not the cause.** Living with a poorly understood, disabling illness is legitimately hard, and support for that is not an admission that it's psychological. NICE is explicit that CBT, where offered, is for coping and comorbidity — **not a treatment for the illness itself.**",
        evidence: [
          "NICE NG206 — support, information and access to care in ME/CFS, including the role of CBT.",
          "CDC — ME/CFS: support for patients, families and caregivers.",
          "Evidence summary — social and occupational impact of ME/CFS.",
        ],
        checkFirst:
          "If you are experiencing hopelessness or thoughts of self-harm, please reach out for help now. Living with this illness carries a real mental health burden, and that burden deserves treatment in its own right.",
      },
    ],
    skipTheHype: {
      remedy: "\"Brain retraining\" programmes sold as a cure",
      why: "Expensive residential and online programmes — often costing thousands — market themselves as retraining a stuck stress response and curing ME/CFS. The problems are stacked. **The evidence is largely testimonial**, with no adequately controlled trials supporting a cure. The framing implies the illness is generated by the patient's own thought patterns, which contradicts the National Academy of Medicine's conclusion that this is a physiological disease. And the structure is self-sealing: participants are frequently told not to discuss symptoms and that a relapse means insufficient commitment — so failure is always the patient's fault and never the programme's. Some also encourage pushing through symptoms, which in an illness defined by post-exertional malaise is the specific thing most likely to cause lasting harm. Support, coping and mental health care are all worth having. A cure sold on a testimonial is not.",
    },
    bookTitle: "The Pacing Handbook — living inside your energy envelope",
    bookUrl: null,
    landingSlug: "chronic-fatigue-me-cfs",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    slug: "jet-lag-shift-work",
    name: "Jet lag & shift work",
    nameEmphasis: "& shift work",
    icon: "plane",
    category: "mind-sleep",
    blurb: "Light is the lever — and the timing decides whether it helps or hurts.",
    matchRules: [],
    intro:
      "Your body clock sits in the **suprachiasmatic nucleus** of the hypothalamus and runs on a cycle slightly longer than 24 hours. It is set every day, primarily by **light hitting your eyes** — and it shifts slowly, roughly `1` hour per day, which is why crossing eight time zones takes the better part of a week to absorb.\n\nJet lag is the mismatch between that internal clock and local time: broken sleep, daytime fatigue, poor concentration, and gut symptoms, because your digestion runs on the same clock. **Shift work is the same physiology without the holiday** — a chronic circadian misalignment that is associated with real long-term health risks, which is why it deserves more than a coffee and a shrug.\n\nThe entire practical content of this page comes down to one idea: **light at the wrong time will drag your clock the wrong way.** Get the timing right and you can shift a couple of hours a day. Get it backwards and you make it worse. Everything else — melatonin, caffeine, meal timing, naps — is a supporting act to that.",
    signals: [
      { markerId: "sleep-eff", label: "Sleep efficiency", unit: "%", flagBelow: 85 },
      { markerId: "rhr", label: "Resting heart rate", unit: "bpm", flagAbove: 75 },
      { markerId: "hrv", label: "HRV", unit: "ms", flagBelow: 40 },
      { markerId: "hba1c", label: "HbA1c", unit: "%", flagAbove: 5.7 },
      { markerId: "trig", label: "Triglycerides", unit: "mg/dL", flagAbove: 150 },
    ],
    pillarRule: { key: "sleep", label: "Sleep", below: 65 },
    steps: [
      {
        id: "light-timing",
        title: "Get the light timing right — everything else is secondary",
        detailTitle: "Which direction to shift, and when",
        why: "Light is by far the most powerful signal to your body clock, and its effect flips depending on whether you get it before or after your internal night.",
        grade: "A",
        gradeNote: "American Academy of Sleep Medicine · circadian phase-response research",
        how: "The rule underneath everything: **light in your biological morning shifts your clock earlier; light in your biological evening shifts it later.** \"Biological\" means according to your body's current clock, not the one on the wall — which is the whole complication after a flight.\n\n**Flying east (harder — you need to get earlier):** seek **bright light in the local morning** and avoid it in the local evening. Sunglasses on the late afternoon of arrival day are a real tactic.\n\n**Flying west (easier — you need to get later):** seek **light in the local late afternoon and evening**, and avoid bright morning light for the first day or two.\n\n**The trap:** in the first day or two after a long eastward flight, local morning light can land on the wrong side of your body clock and push you the wrong way. If you've crossed more than about `8` zones going east, delay seeking morning light until mid-morning for the first couple of days.\n\n**Outdoor light beats any lamp** — even an overcast day is many times brighter than indoor lighting.",
        extra: {
          label: "The rough arithmetic",
          body: "Your clock shifts about **`1` hour per day going east** and up to **`1.5` hours per day going west**, which is why westward travel is easier: it's the direction your naturally-longer-than-24-hour clock already wants to go. Six time zones east is roughly a week. Knowing that in advance stops you from concluding on day three that something is wrong with you.",
        },
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline for the treatment of intrinsic circadian rhythm sleep-wake disorders.",
          "Evidence summary — light phase-response curves and circadian entrainment in humans.",
          "Evidence summary — direction-dependent rates of circadian re-entrainment after transmeridian travel.",
        ],
        checkFirst:
          "If you have bipolar disorder, bright light therapy and sleep deprivation can both trigger episodes — plan travel and shift changes with your psychiatrist. Certain eye conditions and photosensitising medications also make bright light therapy something to check first.",
      },
      {
        id: "melatonin",
        title: "Use melatonin as a clock signal, not a sleeping pill",
        detailTitle: "Dose and timing — both smaller and earlier than you think",
        why: "Melatonin has decent evidence for jet lag specifically, and most people take too much of it at the wrong time, which wastes it.",
        grade: "B+",
        gradeNote: "Cochrane review — melatonin for jet lag prevention",
        supplement: true,
        labNote:
          "Melatonin content is one of the worst-documented in the supplement industry — independent analyses have found products containing anywhere from a fraction to several times the labelled dose, and some containing serotonin. Since the whole point here is a small, precisely timed dose, actual content accuracy matters. Check the Purity Score before choosing on price.",
        how: "**The dose is small: `0.5–3 mg`.** More is not better and the higher doses sold everywhere (`5–10 mg`) are more likely to leave you groggy the next day without shifting your clock any further. Low-dose immediate release is what the jet lag research uses.\n\n**Timing is the active ingredient.** For **eastward** travel, take it **at local bedtime** at your destination — that's the direction it's most useful. For **westward** travel it helps less; melatonin's phase-shifting works best for advancing the clock.\n\n**It is not a sedative.** It's a darkness signal. If you expect it to knock you out you'll conclude it doesn't work, and take more, which makes it worse.\n\nCochrane's review found melatonin **effective for preventing or reducing jet lag** when crossing five or more time zones, with best results going east.\n\n**Combine it with the light plan.** Melatonin and light pull in the same direction when timed together and cancel each other out when they aren't.",
        evidence: [
          "Cochrane systematic review — melatonin for the prevention and treatment of jet lag.",
          "American Academy of Sleep Medicine — melatonin timing in circadian rhythm sleep-wake disorders.",
          "Evidence summary — independent analyses of melatonin supplement content accuracy.",
        ],
        checkFirst:
          "Melatonin interacts with anticoagulants, immunosuppressants, some diabetes medications and some seizure medications. Avoid in pregnancy and breastfeeding, and don't drive within `5` hours of a dose. It's prescription-only in several countries for a reason.",
      },
      {
        id: "caffeine",
        title: "Use caffeine deliberately, then cut it off",
        why: "Caffeine is genuinely effective for alertness during misalignment, and the cut-off time is what stops it from wrecking the recovery.",
        grade: "A−",
        gradeNote: "Evidence summary — randomised trials of caffeine in shift work and jet lag",
        how: "**Caffeine works.** Randomised trials support it for alertness in both jet lag and shift work, and it is the most effective legal countermeasure most people have access to.\n\n**Use it in your biological morning and early afternoon**, not as an all-day drip. `100–200 mg` — roughly one to two coffees — is where most of the benefit sits.\n\n**Cut it off `8–10` hours before you intend to sleep.** Caffeine's half-life is around `5–6` hours, so an afternoon coffee is still measurably in you at midnight. Trials have shown caffeine `6` hours before bed measurably disrupting sleep even in people who insisted it didn't affect them.\n\n**For night shifts:** caffeine early in the shift, and **stop by roughly the midpoint** so you can sleep when you get home. Caffeine at 5am on a shift ending at 7am is the single most common self-sabotage in shift work.\n\n**The nap-plus-caffeine trick** is real: caffeine, then a `20`-minute nap immediately. You wake as it kicks in — the two effects stack rather than compete.",
        evidence: [
          "Evidence summary — randomised trials of caffeine for alertness in shift workers and jet-lagged travellers.",
          "Randomised trial of caffeine administered 0, 3 and 6 hours before bedtime and its effect on sleep.",
          "American Academy of Sleep Medicine — countermeasures for shift work disorder.",
        ],
        checkFirst:
          "Caffeine worsens anxiety, palpitations, reflux and some arrhythmias, and it interacts with several medications. If you're pregnant, keep total intake under about `200 mg` a day.",
      },
      {
        id: "sleep-strategy",
        title: "Plan the sleep, including the naps",
        detailTitle: "What to do on the plane and on arrival",
        why: "The decisions on the flight and the first arrival day set up how the whole trip goes.",
        grade: "B+",
        gradeNote: "Evidence summary — behavioural countermeasures for jet lag",
        how: "**Shift before you fly, if the trip is long enough to justify it.** Moving your bedtime `1` hour per day toward the destination for `2–3` days beforehand takes a real chunk out of the arrival cost. Earlier for eastward, later for westward.\n\n**On the plane, set your watch to destination time and behave accordingly.** Sleep if it's night there; stay awake if it isn't. Eye mask, earplugs, neck support.\n\n**Short trips — under about `3` days — are often better spent staying on home time** if your schedule allows it. Shifting and shifting back for two days costs more than it returns.\n\n**On arrival, the single biggest decision is not to nap for hours.** If you're desperate, a `20–30` minute nap before mid-afternoon is fine. Longer or later and you lose the night.\n\n**Get outside on arrival day** — with the light-direction rule above in mind. Outdoor light plus gentle movement beats lying in a dark hotel room.\n\n**Alcohol on the flight is a bad trade.** It fragments sleep, dehydrates you and doesn't shift anything.",
        evidence: [
          "Evidence summary — pre-flight phase advancement and behavioural countermeasures for jet lag.",
          "American Academy of Sleep Medicine — jet lag disorder: management recommendations.",
          "Evidence summary — nap duration, sleep inertia and subsequent night sleep.",
        ],
        checkFirst:
          "Long-haul flights carry a small clot risk — move regularly, stay hydrated, and if you have risk factors ask your doctor about compression stockings beforehand. A swollen painful calf after a flight needs urgent assessment.",
      },
      {
        id: "shift-work",
        title: "Shift work: protect the day sleep, and take the risks seriously",
        detailTitle: "The chronic version of the same problem",
        why: "Shift work is circadian misalignment repeated for years, and it carries documented long-term health risks that deserve managing rather than enduring.",
        grade: "A−",
        gradeNote: "AASM guideline · IARC · occupational health evidence",
        supervised: true,
        how: "**Defend the sleep period like a night shift.** **Blackout blinds, an eye mask, earplugs or white noise**, phone silenced, and a household that treats your sleep window as real. Day sleep is shorter and lighter than night sleep by default — every environmental advantage counts.\n\n**Wear sunglasses on the commute home** after a night shift. That morning light is the strongest possible signal telling your brain to wake up, and blocking it protects the sleep you're about to attempt.\n\n**Bright light during the night shift** improves alertness and helps shift your clock toward the schedule.\n\n**Rotate forward, not backward, if you have any say in it** — days to evenings to nights is markedly easier to adapt to than the reverse.\n\n**Anchor sleep.** If your schedule flips constantly, keeping a fixed core block of sleep at the same time each day — even a shorter one — is easier on the body than a fully random pattern.\n\n**Eat on a schedule and keep the big meal out of the middle of the night.** Overnight metabolism handles food poorly, and night eating is a real part of why shift work is associated with metabolic problems.",
        extra: {
          label: "Why this is worth taking seriously",
          body: "Long-term shift work is associated with **cardiovascular disease, type 2 diabetes, obesity and gastrointestinal problems**, and the International Agency for Research on Cancer has classified shift work involving circadian disruption as a **probable human carcinogen (Group 2A)**. That is not a reason to panic or to quit your job — it is a reason to take sleep, cardiovascular screening and metabolic checks seriously, and to say so to your doctor. Shift workers are entitled to occupational health support, and it is under-used.",
        },
        evidence: [
          "American Academy of Sleep Medicine — clinical practice guideline for shift work disorder.",
          "International Agency for Research on Cancer — evaluation of night shift work involving circadian disruption.",
          "Evidence summary — cardiometabolic outcomes in long-term shift workers.",
        ],
        checkFirst:
          "Falling asleep while driving home is a genuine and common danger in shift work. If you're fighting sleep at the wheel, that's a reason to arrange a lift, nap before driving, or change how you commute — not something to push through.",
      },
      {
        id: "meals-movement",
        title: "Use meals and movement as secondary clock signals",
        why: "Light is the master signal, but meal timing and exercise timing shift peripheral clocks in the liver, gut and muscle — and those are what the gut symptoms come from.",
        grade: "B",
        gradeNote: "Evidence summary — peripheral circadian entrainment",
        how: "**Eat on destination time as soon as you land.** The clocks in your liver and gut respond strongly to feeding time, and the digestive misery of jet lag is largely those clocks running on a different schedule from the one you're eating on.\n\n**A period of fasting before the first destination breakfast** may help realignment — the research is preliminary, the mechanism is plausible, and the practical version is simply skipping the airline meals that fall in your destination's night.\n\n**Keep meals lighter and earlier when misaligned.** Glucose handling is genuinely worse overnight, and heavy late food sits badly on top of a confused gut.\n\n**Exercise nudges the clock too.** Morning and early afternoon exercise advances it; late evening exercise delays it. Use that in the same direction as your light plan. Hard training right before a sleep attempt is unhelpful whichever direction you're going.\n\n**Hydrate.** Cabin air is very dry, dehydration mimics and worsens jet lag symptoms, and this is the cheapest item on the page.",
        evidence: [
          "Evidence summary — meal timing and entrainment of peripheral circadian clocks.",
          "Evidence summary — exercise timing and human circadian phase shifting.",
          "Evidence summary — overnight glucose tolerance and metabolic responses in circadian misalignment.",
        ],
        checkFirst:
          "If you have diabetes, especially on insulin or sulfonylureas, changing meal timing and skipping meals across time zones needs planning with your diabetes team before you travel — not improvising at altitude.",
      },
    ],
    skipTheHype: {
      remedy: "\"Jet lag\" homeopathic pellets and anti-jet-lag supplement blends",
      why: "Sold in every airport pharmacy, usually as homeopathic arnica and cocculus preparations or as multi-ingredient \"travel recovery\" formulas. **Homeopathic preparations are diluted past the point where any original substance remains**, and the trials of them for jet lag have found no effect beyond placebo. The proprietary blends are the same problem with more ingredients: no published trials of the finished product, and doses of anything active generally too small to matter. What's frustrating is that this is a solved problem — **light timing, low-dose melatonin and caffeine strategy all have real evidence**, cost almost nothing, and are sitting on the same page as the pellets. Buying the pellets isn't just wasted money; it's usually a substitute for the plan that works.",
    },
    bookTitle: "The Body Clock Playbook — jet lag, night shifts and getting your rhythm back",
    bookUrl: null,
    landingSlug: "jet-lag-shift-work",
  },
];
