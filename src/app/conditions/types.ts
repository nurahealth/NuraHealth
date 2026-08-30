// ─────────────────────────────────────────────────────────────────────────────
// Conditions — the content contract.
//
// Types only. The content itself lives in `library/*.ts`, one module per
// category, and `data.ts` is the single public entry point that assembles them.
// Import from "./data", never from here or from a library module directly.
//
// Three rules the shape exists to enforce:
//
//  1. NO INVENTED CITATIONS. Every `evidence` line names a real, checkable
//     institution or a real landmark trial / systematic review. Where the
//     honest answer is "the literature is thin", the grade drops and the note
//     says "evidence summary" rather than dressing it up with a study count.
//  2. DOCTOR-FORWARD. Any step that could interact with a prescription, needs a
//     diagnosis, or carries real risk is marked `supervised` — the UI dims it
//     and appends "— talk to your doctor first" to the title. Nothing here
//     treats, reverses or cures anything, and nothing suggests changing or
//     stopping a medication.
//  3. FUNNEL-READY. `bookTitle` / `bookUrl` / `landingSlug` are the hooks for
//     the NŪRA book + marketing landing page each condition will pair with.
//
// Rich text: two markers, neither nestable.
//   **bold**  → emphasis, in ink
//   `1–2 g`   → a mono dose chip, for numbers, doses and durations
// Everything else renders literally, so authored copy can't inject markup.
// ─────────────────────────────────────────────────────────────────────────────

/** Icon key → a lucide icon, resolved in ui.tsx. */
export type ConditionIcon =
  | "zap" | "moon" | "leaf" | "waves" | "activity" | "shield" | "heart"
  | "bug" | "droplets" | "brain" | "bone" | "flame" | "wind" | "scale"
  | "sparkles" | "thermometer" | "sun" | "footprints" | "hand" | "salad"
  | "pill" | "testTube" | "smile" | "flower" | "droplet" | "gauge"
  | "bed" | "wheat" | "wheatOff" | "stethoscope" | "snowflake" | "wine" | "dumbbell"
  | "venus" | "mars" | "sprout" | "layers" | "microscope" | "bubbles"
  | "target" | "personStanding" | "bandage" | "ribbon"
  | "syringe" | "sunrise" | "tablets" | "calendarHeart" | "orbit" | "baby"
  | "heartPulse" | "vibrate" | "volume" | "hourglass" | "batteryLow" | "plane"
  | "network" | "cable" | "milk" | "armchair" | "cloud" | "brush"
  | "scissors" | "eye";

/** Conservative four-step scale. Nothing in this section grades above A. */
export type EvidenceGrade = "A" | "A−" | "B+" | "B";

/** Index grouping. Order is CATEGORY_ORDER, not declaration order. */
export type ConditionCategory =
  | "nutrition"
  | "pain-body"
  | "digestion"
  | "mind-sleep"
  | "metabolic-heart"
  | "hormonal"
  | "skin-immune"
  | "everyday";

export const CATEGORY_LABELS: Record<ConditionCategory, string> = {
  nutrition: "Nutrition & deficiency",
  "pain-body": "Pain & nerve",
  digestion: "Digestion",
  "mind-sleep": "Mind, sleep & energy",
  "metabolic-heart": "Metabolic & heart",
  hormonal: "Hormonal & reproductive",
  "skin-immune": "Skin & immune",
  everyday: "Everyday",
};

export const CATEGORY_ORDER: ConditionCategory[] = [
  "metabolic-heart",
  "nutrition",
  "mind-sleep",
  "digestion",
  "pain-body",
  "hormonal",
  "skin-immune",
  "everyday",
];

/**
 * A pointer at one of the user's real numbers.
 *
 * `markerId` is an id from biomarkerCatalog.ts and resolves through the same
 * alias matcher the Nutrition and Lab pages use. `aliases` is the escape hatch
 * for a marker the catalog doesn't carry yet (alpha-gal IgE, tryptase) — it is
 * matched against the raw biomarker name with the same matcher.
 *
 * `flagAbove` / `flagBelow` decide amber vs sage. A ref with neither is
 * informational: it renders, but never flags and never fires a match.
 */
export interface MarkerRef {
  markerId?: string;
  aliases?: string[];
  /** Display name on the chip and in the match reason. */
  label: string;
  /** Fallback unit when the stored biomarker has none. */
  unit?: string;
  flagAbove?: number;
  flagBelow?: number;
}

/** Matches on a dashboard pillar score rather than a blood marker. */
export interface PillarRef {
  /** Pillar key from dashboardData.ts — recovery | heart | metabolic | activity | sleep | resilience. */
  key: string;
  label: string;
  /** Fires when the pillar score is under this. */
  below: number;
}

export interface StepExtra {
  label: string;
  body: string;
}

export interface ConditionStep {
  /** Unique within the condition. */
  id: string;
  /** The bold action, as it reads in the numbered list. */
  title: string;
  /** Heading of the detail card — defaults to `title`. */
  detailTitle?: string;
  /** One line on why it's here. Keep it to a single sentence. */
  why: string;
  grade: EvidenceGrade;
  /** What the grade rests on: an institution, or an honest "evidence summary". */
  gradeNote: string;
  /**
   * Needs medical supervision. The list dims the step and appends
   * "— talk to your doctor first" to the title.
   */
  supervised?: boolean;
  /** A pill, powder or oil — shows the "Pick a good one" card linking to /lab. */
  supplement?: boolean;
  /** Body of that card. Only read when `supplement` is true. */
  labNote?: string;
  /** "How to take it" for supplements, "How to do it" for everything else. */
  how: string;
  /** Optional second card — a myth to retire, a caveat, a shortcut. */
  extra?: StepExtra;
  /** Real, checkable sources. Institution-level or a named landmark trial. */
  evidence: string[];
  /** The red-bordered CHECK FIRST card. Every step has one. */
  checkFirst: string;
}

/**
 * The Consumer-Reports line. Every condition names one popular remedy whose
 * evidence does not hold up, and says so plainly. This is the section's
 * credibility: a library that only ever says yes is an advertisement.
 */
export interface SkipTheHype {
  /** The remedy, named. */
  remedy: string;
  /** Why it doesn't hold up — one or two sentences, sourced in spirit. */
  why: string;
}

export interface Condition {
  slug: string;
  name: string;
  /** Trailing words of the title, set in italic accent. Must be a suffix of `name`. */
  nameEmphasis?: string;
  icon: ConditionIcon;
  category: ConditionCategory;
  /** One line under the name in the index row and in search results. */
  blurb: string;

  /** Any ref that flags lifts this condition into "Matched to your data". */
  matchRules: MarkerRef[];
  /** Optional second route in: a low pillar score. */
  pillarRule?: PillarRef;

  /** "What your body is doing", always shown. Short paragraphs only. */
  intro: string;
  /** Appended to the intro only when the condition matched. */
  matchedIntro?: string;

  /** YOUR SIGNALS chips. Hidden entirely when none resolve. */
  signals: MarkerRef[];

  /** Amber banner above the protocol, for the conditions that need one. */
  doctorBanner?: { title: string; body: string };

  steps: ConditionStep[];

  /** Required. See SkipTheHype. */
  skipTheHype: SkipTheHype;

  // ── Funnel ────────────────────────────────────────────────────────────────
  /** Title of the NŪRA book this condition pairs with. */
  bookTitle: string | null;
  /** Where the book lives. When set, the protocol shows the "Go deeper" card. */
  bookUrl: string | null;
  /** Slug of the marketing landing page for this condition. */
  landingSlug: string | null;
}

export const DISCLAIMER =
  "Wellness information · Not medical advice · Never a replacement for your doctor.";
