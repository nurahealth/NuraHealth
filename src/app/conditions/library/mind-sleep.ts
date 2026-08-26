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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
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
    bookTitle: null,
    bookUrl: null,
    landingSlug: null,
  },
];
