/**
 * NŪRA biomarker catalog — the full universe of markers the dashboard
 * surfaces, grouped into 6 architectural sections.
 *
 * Pure data + matching helpers. No I/O. Safe to import on client or server.
 */

import type { Biomarker } from "./bloodwork";

// ── Types ─────────────────────────────────────────────────────────────────────
export type SourceType = "wearable" | "bloodwork";

export interface CatalogMarker {
  id: string;
  name: string;
  shortName?: string;
  unit: string;
  aliases: string[];
  description?: string;
  optimalLow?: number;
  optimalHigh?: number;
}

export interface CatalogSubgroup {
  title: string;
  markers: CatalogMarker[];
}

export interface CatalogSection {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  sourceType: SourceType;
  /** Either a single group of markers OR several subgroups. */
  markers?: CatalogMarker[];
  subgroups?: CatalogSubgroup[];
}

export interface EnrichedMarker extends CatalogMarker {
  match?: Biomarker;
}

export interface EnrichedSubgroup extends CatalogSubgroup {
  markers: EnrichedMarker[];
}

export interface EnrichedSection extends CatalogSection {
  markers?: EnrichedMarker[];
  subgroups?: EnrichedSubgroup[];
  hasAnyMatch: boolean;
}

// ── Helpers (alias matching) ──────────────────────────────────────────────────

/**
 * Returns true if any alias appears as a case-insensitive substring of the
 * user biomarker name (e.g. alias "ldl" matches "Cholesterol, LDL, Calculated").
 */
export function matchBiomarker(userBiomarkerName: string, aliases: string[]): boolean {
  const lower = userBiomarkerName.toLowerCase();
  return aliases.some((a) => lower.includes(a.toLowerCase()));
}

/**
 * Walks the catalog and attaches the most-recently-collected matching user
 * biomarker to each marker (if any). Assumes the input `userBiomarkers` is
 * already deduped to one row per name and sorted newest-first
 * (as returned by `getLatestBiomarkers`).
 */
export function enrichCatalogWithUserData(
  catalog: CatalogSection[],
  userBiomarkers: Biomarker[]
): EnrichedSection[] {
  const findMatch = (aliases: string[]): Biomarker | undefined =>
    userBiomarkers.find((b) => matchBiomarker(b.name, aliases));

  return catalog.map((section): EnrichedSection => {
    let hasAnyMatch = false;

    const enrichGroup = (markers: CatalogMarker[]): EnrichedMarker[] =>
      markers.map((m) => {
        const match = findMatch(m.aliases);
        if (match) hasAnyMatch = true;
        return { ...m, match };
      });

    if (section.subgroups && section.subgroups.length > 0) {
      const subgroups = section.subgroups.map((sg): EnrichedSubgroup => ({
        ...sg,
        markers: enrichGroup(sg.markers),
      }));
      return { ...section, subgroups, hasAnyMatch };
    }

    return {
      ...section,
      markers: enrichGroup(section.markers ?? []),
      hasAnyMatch,
    };
  });
}

// ── Catalog data ──────────────────────────────────────────────────────────────
export const BIOMARKER_CATALOG: CatalogSection[] = [
  // ── SECTION 1 ──────────────────────────────────────────────────────────────
  {
    id: "vitality-pulse",
    title: "The Vitality Pulse",
    subtitle: "Wearables & Real-Time",
    sourceType: "wearable",
    markers: [
      { id: "hrv",          name: "Heart Rate Variability",   shortName: "HRV",       unit: "ms",          aliases: ["hrv", "heart rate variability"],         description: "Autonomic nervous system balance.", optimalLow: 45 },
      { id: "rhr",          name: "Resting Heart Rate",       shortName: "RHR",       unit: "bpm",         aliases: ["rhr", "resting heart rate"],             description: "Baseline cardiovascular fitness.", optimalLow: 50, optimalHigh: 70 },
      { id: "resp-rate",    name: "Respiratory Rate",                                  unit: "breaths/min", aliases: ["respiratory rate", "breathing rate"],    description: "Breathing baseline at rest." },
      { id: "sleep-eff",    name: "Sleep Efficiency",                                  unit: "%",           aliases: ["sleep efficiency"],                       description: "Time asleep vs time in bed.", optimalLow: 85 },
      { id: "deep-sleep",   name: "Deep Sleep",                                        unit: "hours",       aliases: ["deep sleep"],                             description: "Restorative slow-wave sleep.", optimalLow: 1, optimalHigh: 1.8 },
      { id: "rem-sleep",    name: "REM Sleep",                                         unit: "hours",       aliases: ["rem sleep", "rem"],                       description: "Memory & emotional processing.", optimalLow: 1.2, optimalHigh: 2 },
      { id: "recovery",     name: "Recovery Score",                                    unit: "%",           aliases: ["recovery score", "readiness", "readiness score"], description: "Daily readiness from your wearable.", optimalLow: 70 },
      { id: "vo2max",       name: "VO2 Max",                                           unit: "ml/kg/min",   aliases: ["vo2 max", "vo2max"],                      description: "Peak oxygen utilization." },
      { id: "skin-temp",    name: "Skin Temperature",                                  unit: "°F dev",      aliases: ["skin temperature", "temp deviation"],     description: "Nightly temp deviation from baseline." },
      { id: "spo2",         name: "SpO2",                                              unit: "%",           aliases: ["spo2", "oxygen saturation"],              description: "Blood oxygen saturation.", optimalLow: 95 },
    ],
  },

  // ── SECTION 2 ──────────────────────────────────────────────────────────────
  {
    id: "metabolic-cardio",
    title: "Metabolic & Cardiovascular",
    subtitle: "Blood Work",
    sourceType: "bloodwork",
    subgroups: [
      {
        title: "Lipid Panel",
        markers: [
          { id: "apob",       name: "ApoB",                  unit: "mg/dL", aliases: ["apob", "apolipoprotein b"], description: "Causal driver of atherosclerosis.", optimalHigh: 80 },
          { id: "lpa",        name: "Lp(a)",                 unit: "nmol/L", aliases: ["lp(a)", "lipoprotein a"],   description: "Genetic cardiovascular risk.", optimalHigh: 75 },
          { id: "ldl-c",      name: "LDL-C",                 unit: "mg/dL", aliases: ["ldl", "ldl-c", "cholesterol, ldl, calculated", "cholesterol ldl", "ldl cholesterol"], description: "Low-density lipoprotein cholesterol.", optimalHigh: 100 },
          { id: "hdl-c",      name: "HDL-C",                 unit: "mg/dL", aliases: ["hdl", "hdl-c", "cholesterol, hdl", "hdl cholesterol"], description: "Protective lipoprotein.", optimalLow: 60 },
          { id: "trig",       name: "Triglycerides",         unit: "mg/dL", aliases: ["triglycerides", "tg"],       description: "Circulating fats from food/insulin.", optimalHigh: 100 },
          { id: "total-chol", name: "Total Cholesterol",     unit: "mg/dL", aliases: ["cholesterol, total", "total cholesterol"], description: "Sum of all lipoproteins.", optimalLow: 140, optimalHigh: 200 },
          { id: "non-hdl",    name: "Non-HDL Cholesterol",   unit: "mg/dL", aliases: ["cholesterol, non-hdl, calculated", "non-hdl"], description: "Total minus HDL — better than LDL alone.", optimalHigh: 130 },
        ],
      },
      {
        title: "Blood Sugar",
        markers: [
          { id: "hba1c",   name: "HbA1c",                  unit: "%",        aliases: ["hba1c", "a1c", "hemoglobin a1c"], description: "3-month average blood sugar.", optimalLow: 4.8, optimalHigh: 5.4 },
          { id: "glucose", name: "Fasting Glucose",        unit: "mg/dL",    aliases: ["glucose", "fasting glucose"],     description: "Morning baseline blood sugar.", optimalLow: 75, optimalHigh: 90 },
          { id: "insulin", name: "Fasting Insulin",        unit: "μIU/mL",   aliases: ["insulin", "fasting insulin"],     description: "Insulin sensitivity marker.", optimalHigh: 6 },
          { id: "cgm",     name: "Glycemic Variability",   unit: "mg/dL",    aliases: ["cgm", "glycemic variability"],    description: "Daily blood sugar swing." },
        ],
      },
      {
        title: "Inflammation",
        markers: [
          { id: "hs-crp",       name: "hs-CRP",        unit: "mg/L",   aliases: ["hs-crp", "crp", "c-reactive protein"], description: "Systemic inflammation.", optimalHigh: 1 },
          { id: "homocysteine", name: "Homocysteine",  unit: "μmol/L", aliases: ["homocysteine"],                       description: "Methylation & vascular health.", optimalHigh: 8 },
        ],
      },
      {
        title: "Organ Health",
        markers: [
          { id: "alt",        name: "ALT",        unit: "U/L",          aliases: ["alt", "sgpt"],         description: "Liver enzyme.", optimalHigh: 25 },
          { id: "ast",        name: "AST",        unit: "U/L",          aliases: ["ast", "sgot"],         description: "Liver/muscle enzyme.", optimalHigh: 25 },
          { id: "egfr",       name: "eGFR",       unit: "mL/min/1.73m²", aliases: ["egfr"],               description: "Kidney filtration rate.", optimalLow: 90 },
          { id: "creatinine", name: "Creatinine", unit: "mg/dL",        aliases: ["creatinine"],          description: "Kidney filtration marker." },
          { id: "uric-acid",  name: "Uric Acid",  unit: "mg/dL",        aliases: ["uric acid"],           description: "Purine metabolism marker." },
        ],
      },
    ],
  },

  // ── SECTION 3 ──────────────────────────────────────────────────────────────
  {
    id: "hormonal",
    title: "The Hormonal Blueprint",
    subtitle: "Sex · Stress · Thyroid",
    sourceType: "bloodwork",
    subgroups: [
      {
        title: "Sex Hormones",
        markers: [
          { id: "total-t",  name: "Total Testosterone", unit: "ng/dL",  aliases: ["testosterone, total", "total testosterone"], description: "Total circulating testosterone." },
          { id: "free-t",   name: "Free Testosterone",  unit: "pg/mL",  aliases: ["free testosterone"],                          description: "Bioavailable testosterone." },
          { id: "estradiol",name: "Estradiol",          unit: "pg/mL",  aliases: ["estradiol", "e2"],                            description: "Primary estrogen." },
          { id: "prog",     name: "Progesterone",       unit: "ng/mL",  aliases: ["progesterone"],                               description: "Calming sex hormone." },
          { id: "shbg",     name: "SHBG",               unit: "nmol/L", aliases: ["shbg"],                                       description: "Sex hormone binding globulin." },
        ],
      },
      {
        title: "Stress & Energy",
        markers: [
          { id: "dhea-s",      name: "DHEA-S",      unit: "μg/dL", aliases: ["dhea-s", "dhea sulfate"],                                description: "Adrenal reserve hormone." },
          { id: "cortisol-am", name: "Cortisol AM", unit: "μg/dL", aliases: ["cortisol am", "cortisol, am", "morning cortisol"],       description: "Morning cortisol pulse.", optimalLow: 10, optimalHigh: 18 },
          { id: "cortisol-pm", name: "Cortisol PM", unit: "μg/dL", aliases: ["cortisol pm", "cortisol, pm", "evening cortisol"],       description: "Evening cortisol level.", optimalHigh: 5 },
        ],
      },
      {
        title: "Thyroid",
        markers: [
          { id: "tsh",     name: "TSH",            unit: "mIU/L", aliases: ["tsh", "thyroid stimulating hormone"], description: "Brain's thyroid signal.", optimalLow: 0.5, optimalHigh: 2.5 },
          { id: "ft3",     name: "Free T3",        unit: "pg/mL", aliases: ["free t3", "ft3"],                     description: "Active thyroid hormone." },
          { id: "ft4",     name: "Free T4",        unit: "ng/dL", aliases: ["free t4", "ft4"],                     description: "Storage thyroid hormone." },
          { id: "rt3",     name: "Reverse T3",     unit: "ng/dL", aliases: ["reverse t3", "rt3"],                  description: "Stress-induced inactive form." },
          { id: "tpo",     name: "TPO Antibodies", unit: "IU/mL", aliases: ["tpo", "tpo antibodies", "anti-tpo"],  description: "Autoimmune thyroid marker.", optimalHigh: 9 },
        ],
      },
    ],
  },

  // ── SECTION 4 ──────────────────────────────────────────────────────────────
  {
    id: "micronutrients",
    title: "Micronutrients & Cellular Defense",
    subtitle: "Vitamins · Minerals · Iron · Antioxidants",
    sourceType: "bloodwork",
    subgroups: [
      {
        title: "Vitamins",
        markers: [
          { id: "vit-d",      name: "Vitamin D 25-OH",  unit: "ng/mL", aliases: ["vitamin d", "25-oh", "25-hydroxy", "vitamin d, 25-hydroxy"], description: "Hormone & immune anchor.", optimalLow: 40, optimalHigh: 60 },
          { id: "b12",        name: "B12",              unit: "pg/mL", aliases: ["b12", "vitamin b12"],                                       description: "Methylation & nerve health.", optimalLow: 500 },
          { id: "mma",        name: "Methylmalonate",   unit: "nmol/L", aliases: ["mma", "methylmalonate", "methylmalonic acid"],             description: "Functional B12 status.", optimalHigh: 270 },
          { id: "folate",     name: "Folate",           unit: "ng/mL", aliases: ["folate", "folic acid"],                                     description: "Methylation cofactor." },
          { id: "vit-a",      name: "Vitamin A",        unit: "μg/dL", aliases: ["vitamin a", "retinol"],                                     description: "Skin, vision, immunity." },
        ],
      },
      {
        title: "Minerals",
        markers: [
          { id: "mg-rbc",   name: "Magnesium RBC", unit: "mg/dL", aliases: ["magnesium", "magnesium, rbc", "rbc magnesium"], description: "Intracellular magnesium.", optimalLow: 6, optimalHigh: 6.5 },
          { id: "zinc",     name: "Zinc",          unit: "μg/dL", aliases: ["zinc"],                                          description: "Immune & enzyme cofactor.", optimalLow: 80, optimalHigh: 120 },
          { id: "copper",   name: "Copper",        unit: "μg/dL", aliases: ["copper"],                                        description: "Iron metabolism & connective tissue." },
          { id: "selenium", name: "Selenium",      unit: "μg/L",  aliases: ["selenium"],                                      description: "Thyroid & antioxidant defense." },
        ],
      },
      {
        title: "Iron Panel",
        markers: [
          { id: "ferritin", name: "Ferritin",                unit: "ng/mL", aliases: ["ferritin"],                                  description: "Iron storage." },
          { id: "iron",     name: "Serum Iron",              unit: "μg/dL", aliases: ["iron", "serum iron"],                        description: "Circulating iron." },
          { id: "tsat",     name: "Transferrin Saturation",  unit: "%",     aliases: ["transferrin saturation", "tsat"],            description: "How loaded transferrin is.", optimalLow: 25, optimalHigh: 45 },
        ],
      },
      {
        title: "Antioxidants",
        markers: [
          { id: "gsh",   name: "Glutathione", unit: "μmol/L", aliases: ["glutathione", "gsh"],         description: "Master antioxidant." },
          { id: "coq10", name: "CoQ10",       unit: "μmol/L", aliases: ["coq10", "coenzyme q10"],     description: "Mitochondrial energy." },
        ],
      },
    ],
  },

  // ── SECTION 5 ──────────────────────────────────────────────────────────────
  {
    id: "longevity",
    title: "Longevity & Toxic Load",
    subtitle: "Long-Term Health",
    sourceType: "bloodwork",
    subgroups: [
      {
        title: "Biological Age",
        markers: [
          { id: "bio-age",   name: "Biological Age",   unit: "years", aliases: ["biological age", "dna methylation age"], description: "Epigenetic age estimate." },
          { id: "chrono-age",name: "Chronological Age",unit: "years", aliases: ["chronological age"],                     description: "Years since birth." },
        ],
      },
      {
        title: "Heavy Metals",
        markers: [
          { id: "lead",    name: "Lead",    unit: "μg/dL", aliases: ["lead", "pb"],     description: "Lead burden.", optimalHigh: 1 },
          { id: "mercury", name: "Mercury", unit: "μg/L",  aliases: ["mercury", "hg"],  description: "Mercury burden.", optimalHigh: 5 },
          { id: "arsenic", name: "Arsenic", unit: "μg/L",  aliases: ["arsenic", "as"],  description: "Arsenic burden.", optimalHigh: 10 },
          { id: "cadmium", name: "Cadmium", unit: "μg/L",  aliases: ["cadmium", "cd"],  description: "Cadmium burden.", optimalHigh: 1 },
        ],
      },
      {
        title: "Gut Permeability",
        markers: [
          { id: "zonulin",  name: "Zonulin",        unit: "ng/mL", aliases: ["zonulin"],                          description: "Tight junction marker." },
          { id: "lps-ab",   name: "LPS Antibodies", unit: "EU/mL", aliases: ["lps antibodies", "lps", "endotoxin"], description: "Bacterial endotoxin exposure." },
        ],
      },
      {
        title: "Omega-3",
        markers: [
          { id: "omega3-idx", name: "Omega-3 Index", unit: "%", aliases: ["omega-3 index", "omega 3 index"], description: "EPA+DHA in red blood cells.", optimalLow: 8, optimalHigh: 12 },
        ],
      },
    ],
  },

  // ── SECTION 6 ──────────────────────────────────────────────────────────────
  {
    id: "electrolytes",
    title: "Electrolyte Balance",
    subtitle: "Hydration",
    sourceType: "bloodwork",
    markers: [
      { id: "sodium",    name: "Sodium",    unit: "mEq/L", aliases: ["sodium", "na"],    description: "Fluid balance.", optimalLow: 135, optimalHigh: 145 },
      { id: "potassium", name: "Potassium", unit: "mEq/L", aliases: ["potassium", "k"],  description: "Nerve & muscle function.", optimalLow: 3.5, optimalHigh: 5 },
      { id: "chloride",  name: "Chloride",  unit: "mEq/L", aliases: ["chloride", "cl"],  description: "Acid-base balance.", optimalLow: 98, optimalHigh: 107 },
      { id: "calcium",   name: "Calcium",   unit: "mg/dL", aliases: ["calcium", "ca"],   description: "Bone & signaling mineral.", optimalLow: 8.5, optimalHigh: 10.2 },
    ],
  },
];
