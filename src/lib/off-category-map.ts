// ── NŪRA category → Open Food Facts category tags ─────────────────────────────
// Feeds POST /api/admin/catalog/import/off-bulk. Tags within one array are
// OR'd together in the OFF search. Categories absent from this map have no
// reliable OFF coverage — multivitamins in particular: supplements are sparse
// and inconsistently tagged on OFF, so they stay hand-curated.

export const OFF_CATEGORY_TAGS: Record<string, string[]> = {
  // meat-seafood is EXCLUDED from bulk imports (Austin, Sep 19): fresh meat
  // cannot be scored from a label — it stays hand-curated on the source rubric.
  // "meat-seafood": ["en:meats", "en:seafood", "en:canned-fishes"],
  dairy: ["en:dairies"],
  beverages: ["en:beverages"],
  bakery: ["en:breads"],
  condiments: ["en:condiments"],
  dessert: ["en:desserts"],
  frozen: ["en:frozen-foods"],
  pantry: ["en:groceries"],
  "snacks-chips": ["en:snacks"],
  spreads: ["en:spreads"],
  "nut-butters": ["en:nut-butters"],
  "honey-sweeteners": ["en:sweeteners", "en:honeys"],
  "baby-food": ["en:baby-foods"],
  "kids-food": ["en:baby-foods"],
  eggs: ["en:eggs"],
  "bottled-water": ["en:waters"],
};
