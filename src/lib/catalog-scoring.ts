// NŪRA clean-food score — the SCORE LEDGER edition.
//
// Every product starts at 60 and earns or loses points for reasons a
// five-year-old could follow. The rationale is written in the exact ledger
// template the product page's ScoreLedger renderer parses, and the numbers
// always sum to the score. Inputs are objective, published measures: NOVA
// processing group, declared additives, sugar/sodium/saturated fat per 100 g,
// and organic certification.

export interface ScoreInput {
  nova?: number | null;            // 1–4
  additivesCount?: number | null;
  sugars100g?: number | null;      // g
  sodium100g?: number | null;      // g (OFF reports sodium in grams)
  satFat100g?: number | null;      // g
  organic?: boolean;
  ingredientCount?: number | null;
}

export interface ScoreResult {
  score: number;                   // 25–95
  label: string;                   // TOP SHELF / STRONG / DECENT / COMPROMISED / AVOID
  rationale: string;               // ledger-format text (ScoreLedger parses it)
  reasons: string[];               // individual contributing factors
  confident: boolean;              // false when key inputs were missing
}

export function labelFor(score: number): string {
  if (score >= 85) return "TOP SHELF";
  if (score >= 70) return "STRONG";
  if (score >= 55) return "DECENT";
  if (score >= 40) return "COMPROMISED";
  return "AVOID";
}

const VERDICT: Record<string, string> = {
  "TOP SHELF": "Top shelf.",
  STRONG: "A strong pick.",
  DECENT: "Okay, with trade-offs.",
  COMPROMISED: "Compromised — read the flags before you buy.",
  AVOID: "Bottom of the aisle. The label tells you why.",
};

export function scoreProduct(input: ScoreInput): ScoreResult {
  let s = 60;
  const steps: Array<[number, string]> = [];
  const reasons: string[] = [];
  let known = 0;

  // ── Processing level ──────────────────────────────────────────────────────
  if (typeof input.nova === "number" && input.nova >= 1 && input.nova <= 4) {
    known++;
    if (input.nova === 1) { s += 15; steps.push([15, "it's a whole food, barely touched by a factory"]); reasons.push("Unprocessed or minimally processed"); }
    else if (input.nova === 2) { s += 8; steps.push([8, "it's a simple kitchen ingredient"]); reasons.push("Processed culinary ingredient"); }
    else if (input.nova === 3) { s -= 8; steps.push([-8, "it's a processed food"]); reasons.push("Processed food"); }
    else { s -= 20; steps.push([-20, "it's ultra-processed — built in a factory, not a kitchen"]); reasons.push("Ultra-processed (NOVA 4)"); }
  }

  // ── Additives ─────────────────────────────────────────────────────────────
  if (typeof input.additivesCount === "number") {
    known++;
    const n = input.additivesCount;
    if (n === 0) { s += 5; steps.push([5, "no additives declared on the label"]); reasons.push("No declared additives"); }
    else {
      const pen = Math.min(n * 3, 15);
      s -= pen; steps.push([-pen, `the label declares ${n} additive${n === 1 ? "" : "s"}`]);
      reasons.push(`${n} declared additive${n === 1 ? "" : "s"}`);
    }
  }

  // ── Sugar per 100 g ───────────────────────────────────────────────────────
  if (typeof input.sugars100g === "number") {
    known++;
    const g = input.sugars100g;
    if (g <= 5) { s += 4; steps.push([4, "low in sugar"]); reasons.push("Low sugar"); }
    else if (g <= 12) { s -= 4; steps.push([-4, "a moderate amount of sugar"]); reasons.push("Moderate sugar"); }
    else if (g <= 22) { s -= 10; steps.push([-10, "high in sugar"]); reasons.push("High sugar"); }
    else { s -= 15; steps.push([-15, "very high in sugar"]); reasons.push("Very high sugar"); }
  }

  // ── Sodium ────────────────────────────────────────────────────────────────
  if (typeof input.sodium100g === "number") {
    known++;
    const mg = input.sodium100g * 1000;
    if (mg <= 120) { s += 2; steps.push([2, "low in sodium"]); reasons.push("Low sodium"); }
    else if (mg <= 400) { /* neutral */ }
    else if (mg <= 800) { s -= 4; steps.push([-4, "high in sodium"]); reasons.push("High sodium"); }
    else { s -= 7; steps.push([-7, "very high in sodium"]); reasons.push("Very high sodium"); }
  }

  // ── Saturated fat ─────────────────────────────────────────────────────────
  if (typeof input.satFat100g === "number") {
    known++;
    const g = input.satFat100g;
    if (g <= 1.5) { /* neutral */ }
    else if (g <= 5) { s -= 2; steps.push([-2, "some saturated fat"]); }
    else if (g <= 10) { s -= 4; steps.push([-4, "high in saturated fat"]); }
    else { s -= 6; steps.push([-6, "very high in saturated fat"]); reasons.push("High saturated fat"); }
  }

  // ── Organic ───────────────────────────────────────────────────────────────
  if (input.organic) {
    s += 12; steps.push([12, "it's certified organic — and an inspector checks"]);
    reasons.push("Certified organic");
  }

  const raw = s;
  const final = Math.max(25, Math.min(95, Math.round(s)));
  const confident = known >= 3;
  const label = labelFor(final);

  const parts = ["Every food here starts with 60 points."];
  for (const [d, why] of steps) {
    parts.push(`${d > 0 ? "+" : "\u2212"}${Math.abs(d)} \u2014 ${why}.`);
  }
  if (raw < 25) parts.push("That lands below our floor, so it stops at 25.");
  if (raw > 95) parts.push("That's above our cap, so it stops at 95.");
  parts.push(`Add it up: ${final}. ${VERDICT[label]}${confident ? "" : " Limited label data, so this score is provisional."}`);

  return { score: final, label, rationale: parts.join(" "), reasons, confident };
}
