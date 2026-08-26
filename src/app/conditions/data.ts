// ─────────────────────────────────────────────────────────────────────────────
// Conditions — the public data entry point.
//
// The section grew past the point where one file was readable, so the content
// lives in `library/*.ts`, one module per index category, and this file is the
// seam: it re-exports the contract from ./types and assembles the library into
// a single ordered array. Everything else in the app imports from here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Condition, ConditionCategory } from "./types";
import { CATEGORY_ORDER } from "./types";

import { CORE_CONDITIONS } from "./library/core";
import { PAIN_BODY_CONDITIONS } from "./library/pain-body";
import { DIGESTION_CONDITIONS } from "./library/digestion";
import { MIND_SLEEP_CONDITIONS } from "./library/mind-sleep";
import { METABOLIC_HEART_CONDITIONS } from "./library/metabolic-heart";
import { HORMONAL_CONDITIONS } from "./library/hormonal";
import { SKIN_IMMUNE_CONDITIONS } from "./library/skin-immune";
import { EVERYDAY_CONDITIONS } from "./library/everyday";

export * from "./types";

export const CONDITIONS: Condition[] = [
  ...CORE_CONDITIONS,
  ...PAIN_BODY_CONDITIONS,
  ...DIGESTION_CONDITIONS,
  ...MIND_SLEEP_CONDITIONS,
  ...METABOLIC_HEART_CONDITIONS,
  ...HORMONAL_CONDITIONS,
  ...SKIN_IMMUNE_CONDITIONS,
  ...EVERYDAY_CONDITIONS,
];

export const CONDITION_BY_SLUG: Map<string, Condition> = new Map(
  CONDITIONS.map((c) => [c.slug, c])
);

export interface CategoryGroup {
  key: ConditionCategory;
  label: string;
  conditions: Condition[];
}

/**
 * Group a set of conditions for the index, in CATEGORY_ORDER. Empty categories
 * are dropped, so this is safe to call on a filtered subset.
 */
export function groupByCategory(
  conditions: Condition[],
  labels: Record<ConditionCategory, string>
): CategoryGroup[] {
  const groups = new Map<ConditionCategory, Condition[]>();
  for (const c of conditions) {
    const list = groups.get(c.category);
    if (list) list.push(c);
    else groups.set(c.category, [c]);
  }
  return CATEGORY_ORDER.filter((k) => groups.has(k)).map((k) => ({
    key: k,
    label: labels[k],
    conditions: groups.get(k)!,
  }));
}
