// NŪRA clean-food score.
//
// A transparent, rules-based score from 0–100 (higher = cleaner). Every product
// carries the plain-English reasons behind its number, so the score can always
// be explained and defended rather than being a black box.
//
// Inputs are objective, published measures:
//  • NOVA group — the peer-reviewed food-processing classification (1 = whole
//    food, 4 = ultra-processed). Weighted most heavily: NŪRA is about whole food.
//  • Additive count — cosmetic and industrial additives declared on the label.
//  • Added sugar, sodium and saturated fat per 100 g.
//  • Organic certification, where the label declares it.

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
  score: number;                   // 0–100
  label: string;                   // Excellent / Good / Fair / Poor
  rationale: string;               // human-readable sentence
  reasons: string[];               // individual contributing factors
  confident: boolean;              // false when key inputs were missing
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

export function labelFor(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

export function scoreProduct(input: ScoreInput): ScoreResult {
  let score = 100;
  const reasons: string[] = [];
  let known = 0;

  // ── Processing level (up to −45) ─────────────────────────────────────────
  if (typeof input.nova === "number" && input.nova >= 1 && input.nova <= 4) {
    known++;
    const penalty = { 1: 0, 2: 8, 3: 22, 4: 45 }[input.nova] ?? 0;
    score -= penalty;
    if (input.nova === 1) reasons.push("Unprocessed or minimally processed");
    else if (input.nova === 2) reasons.push("Processed culinary ingredient");
    else if (input.nova === 3) reasons.push("Processed food");
    else reasons.push("Ultra-processed (NOVA 4)");
  }

  // ── Additives (up to −20) ────────────────────────────────────────────────
  if (typeof input.additivesCount === "number") {
    known++;
    const n = input.additivesCount;
    score -= clamp(n * 4, 0, 20);
    if (n === 0) reasons.push("No declared additives");
    else reasons.push(`${n} declared additive${n === 1 ? "" : "s"}`);
  }

  // ── Added sugar (up to −20) ──────────────────────────────────────────────
  if (typeof input.sugars100g === "number") {
    known++;
    const g = input.sugars100g;
    if (g <= 5) { reasons.push("Low sugar"); }
    else if (g <= 12) { score -= 6; reasons.push("Moderate sugar"); }
    else if (g <= 22) { score -= 13; reasons.push("High sugar"); }
    else { score -= 20; reasons.push("Very high sugar"); }
  }

  // ── Sodium (up to −10) ───────────────────────────────────────────────────
  if (typeof input.sodium100g === "number") {
    known++;
    const mg = input.sodium100g * 1000;
    if (mg <= 120) { reasons.push("Low sodium"); }
    else if (mg <= 400) { score -= 4; }
    else if (mg <= 800) { score -= 7; reasons.push("High sodium"); }
    else { score -= 10; reasons.push("Very high sodium"); }
  }

  // ── Saturated fat (up to −10) ────────────────────────────────────────────
  if (typeof input.satFat100g === "number") {
    known++;
    const g = input.satFat100g;
    if (g <= 1.5) { /* fine */ }
    else if (g <= 5) score -= 4;
    else if (g <= 10) score -= 7;
    else { score -= 10; reasons.push("High saturated fat"); }
  }

  // ── Organic bonus (+6) ───────────────────────────────────────────────────
  if (input.organic) {
    score += 6;
    reasons.push("Certified organic");
  }

  const final = Math.round(clamp(score));
  const confident = known >= 3;
  const label = labelFor(final);

  const rationale = reasons.length
    ? `${label} — ${reasons.join("; ")}.${confident ? "" : " Limited label data, so this is provisional."}`
    : "Not enough label data to score this product yet.";

  return { score: final, label, rationale, reasons, confident };
}
