// ─────────────────────────────────────────────────────────────────────────────
// Conditions — personalization. Pure functions, no I/O.
//
// The Conditions section does NOT fetch anything of its own. The index page
// loads the user's latest biomarkers with `getLatestBiomarkersWith` — the same
// loader the Nutrition page uses — and reads pillar scores from
// `getOverallHealth()`. Everything below turns those two inputs into:
//
//   • which conditions rise into "Matched to your data", and why, in the
//     user's own numbers ("Flagged by triglycerides 169 · HDL 37");
//   • the YOUR SIGNALS chips on a protocol screen.
//
// A ref resolves through `resolveMarkerValue` when it names a biomarkerCatalog
// id, and falls back to matching the raw biomarker name against its own
// `aliases` for markers the catalog doesn't carry yet (alpha-gal IgE, tryptase).
// ─────────────────────────────────────────────────────────────────────────────

import type { Biomarker } from "@/lib/bloodwork";
import {
  BIOMARKER_CATALOG, matchBiomarker,
  type CatalogMarker, type CatalogSection,
} from "@/lib/biomarkerCatalog";
import { resolveMarkerValue, SAMPLE_VALUES, SAMPLE_COLLECTED } from "@/lib/nutrition";
import type { Condition, MarkerRef } from "./data";

/** One of the user's numbers, resolved and judged against a ref's thresholds. */
export interface ResolvedSignal {
  label: string;
  value: number;
  unit: string;
  /** Outside the ref's thresholds — renders amber rather than sage. */
  flagged: boolean;
  collectedDate: string | null;
}

export interface PillarScore {
  key: string;
  label: string;
  score: number;
}

export interface ConditionMatch {
  /** Why it matched, in the user's own values: "triglycerides 169 · HDL 37". */
  reason: string;
  /** True when a bloodwork marker (rather than a pillar) fired. */
  fromMarkers: boolean;
}

/** Trims a value for display: 169, 4.2, 5.7 — never 169.00000001. */
export function formatValue(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return String(Math.round(v * 100) / 100);
}

function isFlagged(ref: MarkerRef, value: number): boolean {
  if (ref.flagAbove !== undefined && value > ref.flagAbove) return true;
  if (ref.flagBelow !== undefined && value < ref.flagBelow) return true;
  return false;
}

/**
 * Resolve one ref against the user's latest biomarkers.
 * Returns null when the user simply doesn't have that number — every screen
 * treats "no bloodwork" as "hide it", never as "show a zero".
 */
export function resolveRef(ref: MarkerRef, biomarkers: Biomarker[]): ResolvedSignal | null {
  // Catalog path — same alias table the Nutrition and Lab pages resolve through.
  if (ref.markerId) {
    const hit = resolveMarkerValue(ref.markerId, biomarkers);
    if (hit) {
      return {
        label: ref.label,
        value: hit.value,
        unit: hit.unit || ref.unit || "",
        flagged: isFlagged(ref, hit.value),
        collectedDate: hit.collected_date,
      };
    }
  }
  // Fallback path — a marker the catalog doesn't carry yet.
  if (ref.aliases?.length) {
    const match = biomarkers.find((b) => matchBiomarker(b.name, ref.aliases!));
    if (match) {
      return {
        label: ref.label,
        value: match.value,
        unit: match.unit || ref.unit || "",
        flagged: isFlagged(ref, match.value),
        collectedDate: match.collected_date,
      };
    }
  }
  return null;
}

/** Every signal a protocol screen can show, in declaration order. */
export function resolveSignals(condition: Condition, biomarkers: Biomarker[]): ResolvedSignal[] {
  return condition.signals
    .map((ref) => resolveRef(ref, biomarkers))
    .filter((s): s is ResolvedSignal => s !== null);
}

/** The most recent collection date across a set of signals, for the caption. */
export function latestCollected(signals: ResolvedSignal[]): string | null {
  const dates = signals.map((s) => s.collectedDate).filter((d): d is string => !!d);
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

/** "Jun 14" — the caption under the signal chips. */
export function formatCollected(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Does this condition belong in "Matched to your data"?
 *
 * Markers win over pillars: a real blood value is a stronger reason than a
 * seeded pillar score, and the reason line says so in the user's own numbers.
 */
export function matchCondition(
  condition: Condition,
  biomarkers: Biomarker[],
  pillars: PillarScore[]
): ConditionMatch | null {
  const fired: string[] = [];
  for (const rule of condition.matchRules) {
    const hit = resolveRef(rule, biomarkers);
    if (hit && hit.flagged) fired.push(`${rule.label} ${formatValue(hit.value)}`);
  }
  if (fired.length > 0) {
    return { reason: `Flagged by ${fired.slice(0, 3).join(" · ")}`, fromMarkers: true };
  }

  const pillarRule = condition.pillarRule;
  if (pillarRule) {
    const pillar = pillars.find((p) => p.key === pillarRule.key);
    if (pillar && pillar.score < pillarRule.below) {
      return {
        reason: `Flagged by your ${pillarRule.label} pillar at ${pillar.score}`,
        fromMarkers: false,
      };
    }
  }
  return null;
}

export interface IndexRow {
  slug: string;
  match: ConditionMatch | null;
}

/**
 * Match every condition once. Marker-backed matches sort above pillar-backed
 * ones; everything else keeps the authored order from data.ts.
 */
export function matchAll(
  conditions: Condition[],
  biomarkers: Biomarker[],
  pillars: PillarScore[]
): IndexRow[] {
  const rows = conditions.map((c) => ({ slug: c.slug, match: matchCondition(c, biomarkers, pillars) }));
  const matched = rows
    .filter((r) => r.match !== null)
    .sort((a, b) => Number(b.match!.fromMarkers) - Number(a.match!.fromMarkers));
  const rest = rows.filter((r) => r.match === null);
  return [...matched, ...rest];
}

// ── Review fallback ──────────────────────────────────────────────────────────
// With no panels on file the Nutrition page renders the same four-marker sample
// set rather than an empty screen. Conditions reuses THAT set — not one of its
// own — so the two screens never disagree about what the demo panel says. Both
// screens label it as sample data.

function flattenCatalog(sections: CatalogSection[]): CatalogMarker[] {
  const out: CatalogMarker[] = [];
  for (const section of sections) {
    if (section.markers) out.push(...section.markers);
    if (section.subgroups) for (const sg of section.subgroups) out.push(...sg.markers);
  }
  return out;
}
const CATALOG_BY_ID = new Map(flattenCatalog(BIOMARKER_CATALOG).map((m) => [m.id, m]));

/** Biomarker-shaped rows built from the Nutrition page's SAMPLE_VALUES. */
export function sampleBiomarkers(): Biomarker[] {
  const rows: Biomarker[] = [];
  for (const [id, value] of Object.entries(SAMPLE_VALUES)) {
    const cat = CATALOG_BY_ID.get(id);
    if (!cat) continue;
    rows.push({
      id: `sample-${id}`,
      user_id: "sample",
      panel_id: "sample",
      name: cat.name,
      value,
      unit: cat.unit ?? "",
      reference_range_low: null,
      reference_range_high: null,
      optimal_range_low: cat.optimalLow ?? null,
      optimal_range_high: cat.optimalHigh ?? null,
      status: "optimal",
      notes: null,
      collected_date: SAMPLE_COLLECTED,
    });
  }
  return rows;
}
