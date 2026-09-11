// ── "What's inside" ───────────────────────────────────────────────────────────
// Products carry a raw ingredients declaration copied from their source record
// ("Organic brown rice syrup, organic peanut butter (peanuts, salt), ...").
// This splits that string into the individual ingredients a person would
// recognise, and attaches a short factual note about what each one is doing in
// the product.
//
// Notes are a curated reference table, not generated text. An ingredient with
// no entry renders with no note rather than an invented one — a health app
// cannot afford to make up claims about what a substance does.

export interface ParsedIngredient {
  /** Display name, e.g. "Organic Peanut Butter". */
  name: string;
  /** Sub-ingredients declared in parentheses, e.g. ["peanuts", "salt"]. */
  contains: string[];
  /** Curated note, when one exists for this ingredient. */
  note?: string;
}

/** Split on separators that sit outside any bracket. */
function splitTopLevel(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of input) {
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === ";") && depth === 0) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  out.push(buf);
  return out;
}

const LOWERCASE_WORDS = new Set(["and", "or", "of", "with", "the", "in", "from"]);

function titleCase(raw: string): string {
  return raw
    .split(/\s+/)
    .map((w, i) => {
      const bare = w.toLowerCase();
      // Keep acronyms and vitamin designations as written.
      if (/^[A-Z0-9][A-Z0-9-]+$/.test(w)) return w;
      if (i > 0 && LOWERCASE_WORDS.has(bare)) return bare;
      return bare.charAt(0).toUpperCase() + bare.slice(1);
    })
    .join(" ");
}

/** Strip the decorations declarations carry: asterisks, daggers, percentages. */
function tidy(raw: string): string {
  return raw
    .replace(/[*†‡•]/g, " ")
    .replace(/\b\d+(\.\d+)?\s*%/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s.\-–—]+|[\s.\-–—]+$/g, "")
    .trim();
}

/** Key an ingredient for lookup: lowercase, no "organic"/"raw", no punctuation. */
export function ingredientKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(organic|certified|raw|natural|unsweetened|roasted|dry\s+roasted|non-?gmo|fair\s*trade)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseIngredients(raw: string | null | undefined): ParsedIngredient[] {
  if (!raw) return [];
  // Products imported from Open Food Facts store the declaration behind an
  // "Ingredients:" label.
  const body = raw.replace(/^\s*ingredients?\s*:\s*/i, "");

  const seen = new Set<string>();
  const out: ParsedIngredient[] = [];

  for (const chunk of splitTopLevel(body)) {
    const cleaned = tidy(chunk);
    if (!cleaned) continue;

    // Pull out any parenthesised sub-ingredients.
    const contains: string[] = [];
    const withoutParens = cleaned.replace(/[([{]([^)\]}]*)[)\]}]/g, (_m, inner: string) => {
      for (const sub of splitTopLevel(inner)) {
        const s = tidy(sub);
        if (s && s.length < 60) contains.push(titleCase(s));
      }
      return " ";
    });

    const name = titleCase(tidy(withoutParens));
    if (!name || name.length > 70) continue;
    // Skip trailing prose that is not an ingredient.
    if (/^(contains|may contain|made in|manufactured|allergen|produced)\b/i.test(name)) continue;

    const key = ingredientKey(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    out.push({ name, contains, note: INGREDIENT_NOTES[key] });
  }
  return out;
}

// ── Curated notes ─────────────────────────────────────────────────────────────
// Plain statements of what the ingredient is and the role it plays. Keyed by
// ingredientKey(), so "Organic Peanut Butter" and "peanut butter" both hit the
// same entry. Add an entry only where the fact is uncontroversial.
export const INGREDIENT_NOTES: Record<string, string> = {
  // Nuts, seeds and their butters
  "peanuts": "Legume high in protein and monounsaturated fat; a common allergen.",
  "peanut butter": "Ground peanuts; contributes most of the protein and fat in peanut-based bars.",
  "almonds": "Tree nut rich in vitamin E, magnesium and monounsaturated fat.",
  "almond butter": "Ground almonds; source of fat, fibre and vitamin E.",
  "cashews": "Tree nut providing protein, magnesium and monounsaturated fat.",
  "cashew butter": "Ground cashews; binds the bar and adds fat and magnesium.",
  "walnuts": "Tree nut and one of the few plant sources of omega-3 ALA.",
  "pecans": "Tree nut high in monounsaturated fat and manganese.",
  "hazelnuts": "Tree nut rich in vitamin E and monounsaturated fat.",
  "sunflower seeds": "Seed providing vitamin E, selenium and unsaturated fat.",
  "pumpkin seeds": "Seed high in magnesium, zinc and plant protein.",
  "chia seeds": "Seed high in soluble fibre and omega-3 ALA; gels with moisture.",
  "flax seeds": "Seed high in omega-3 ALA and lignans.",
  "sesame seeds": "Seed contributing fat, calcium and a savoury note.",
  "coconut": "Dried coconut flesh; high in saturated fat and fibre.",
  "coconut oil": "Fat pressed from coconut; largely saturated, solid at room temperature.",

  // Protein sources
  "brown rice protein": "Plant protein isolate from brown rice; hypoallergenic but low in lysine.",
  "pea protein": "Plant protein isolate from yellow peas; high in lysine and iron.",
  "whey protein": "Fast-absorbing dairy protein, complete in essential amino acids.",
  "whey protein isolate": "Whey filtered to raise protein and cut lactose and fat.",
  "milk protein isolate": "Concentrated dairy protein, mostly slower-digesting casein.",
  "soy protein isolate": "Complete plant protein concentrated from soybeans.",
  "egg whites": "Complete protein with virtually no fat or carbohydrate.",
  "collagen": "Protein from connective tissue; lacks the essential amino acid tryptophan.",

  // Sweeteners
  "dates": "Dried fruit used as a whole-food sweetener and binder; high in sugar and fibre.",
  "date paste": "Ground dates; sweetens and binds without refined sugar.",
  "brown rice syrup": "Sweetener from fermented rice starch; glucose-based, no fructose.",
  "cane sugar": "Refined sucrose; contributes added sugar.",
  "honey": "Sweetener of roughly equal glucose and fructose; counts as added sugar.",
  "maple syrup": "Concentrated maple sap; counts as added sugar.",
  "tapioca syrup": "Glucose syrup from cassava starch, used to bind and sweeten.",
  "tapioca fiber": "Resistant starch fibre used to sweeten with fewer digestible carbohydrates.",
  "chicory root fiber": "Inulin fibre used to replace sugar; can cause bloating in larger amounts.",
  "soluble corn fiber": "Added fibre used to bulk and sweeten with a low glycaemic impact.",
  "glycerin": "Sugar alcohol used to hold moisture and keep bars soft.",
  "erythritol": "Sugar alcohol, largely unabsorbed; minimal effect on blood glucose.",
  "stevia": "Non-nutritive sweetener from stevia leaf; no calories.",
  "monk fruit": "Non-nutritive sweetener from luo han guo fruit; no calories.",
  "sugar": "Refined sucrose; contributes added sugar.",
  "molasses": "Byproduct of sugar refining; adds colour, minerals and sugar.",

  // Grains and starches
  "oats": "Whole grain high in beta-glucan, a soluble fibre linked to cholesterol reduction.",
  "rolled oats": "Steamed and flattened oat groats; whole grain with soluble fibre.",
  "puffed brown rice": "Whole-grain rice expanded with heat; provides crunch and carbohydrate.",
  "brown rice": "Whole grain retaining bran and germ, so more fibre than white rice.",
  "rice flour": "Milled rice used as a gluten-free structural flour.",
  "tapioca starch": "Cassava starch used as a binder and to improve texture.",

  // Chocolate and flavour
  "cocoa": "Ground cacao solids; source of flavanols and a small amount of caffeine.",
  "cocoa butter": "Fat pressed from cacao; gives chocolate its melt.",
  "cocoa powder": "Cacao solids with most fat removed; bitter and flavanol-rich.",
  "chocolate": "Cocoa solids, cocoa butter and sugar.",
  "dark chocolate": "Chocolate with a higher cocoa fraction and less sugar than milk chocolate.",
  "chocolate chips": "Sweetened chocolate pieces; a source of added sugar and saturated fat.",
  "chocolate liquor": "Ground cacao nibs — the unsweetened base of all chocolate.",
  "vanilla": "Flavouring from cured vanilla pods.",
  "vanilla extract": "Vanilla flavour drawn out in alcohol.",
  "natural flavor": "Flavouring from a plant or animal source; the specific compounds are not disclosed.",
  "natural flavors": "Flavouring from a plant or animal source; the specific compounds are not disclosed.",
  "sea salt": "Unrefined salt; contributes sodium and balances sweetness.",
  "salt": "Sodium chloride; contributes sodium and balances sweetness.",
  "cinnamon": "Spice from cinnamon bark.",
  "pumpkin": "Squash providing fibre and beta-carotene.",
  "blueberries": "Fruit high in anthocyanins, the pigments behind its colour.",
  "apples": "Fruit contributing pectin, a soluble fibre, and natural sugar.",

  // Functional additions
  "mct oil": "Medium-chain triglycerides, absorbed faster than most dietary fat.",
  "lion s mane": "Mushroom (Hericium erinaceus) added for claimed cognitive benefit; evidence in humans is limited.",
  "sunflower lecithin": "Emulsifier from sunflower seed that keeps fat and water from separating.",
  "soy lecithin": "Emulsifier from soybeans that keeps fat and water from separating.",
  "citric acid": "Acidulant used to adjust tartness and act as a preservative.",
  "baking soda": "Sodium bicarbonate; leavening agent.",
  "tocopherols": "Vitamin E compounds used to stop fats going rancid.",
  "rosemary extract": "Natural antioxidant used to keep fats from oxidising.",
};
