// ── Category faces ────────────────────────────────────────────────────────────
// One flagship product per category, shown on the category card until the
// category has products of its own (at which point its best-scoring product
// takes over). Every image is an official brand packshot, run through the
// same normaliser as the product tiles and stored in the catalog-images
// bucket. Sources with provenance: src/lib/category-hero-sources.json.

const BUCKET =
  "https://obkhzgvhxjdgbihuglrx.supabase.co/storage/v1/object/public/catalog-images/products/";

const FILES: Record<string, string> = {
  "adaptogens": "a24d5cef-6d23-450c-afb7-a5e52c3b56e1.png",
  "air-purifiers-filters": "1fcafc35-970a-435a-b9e9-bfa93300559d.png",
  "baby-care": "708310eb-13cc-4d08-bc2e-3c829346c226.png",
  "baby-food": "25cee21a-b846-44eb-87f4-4976345e6683.png",
  "bakery": "610ab719-ded6-4702-aa74-787f15121a33.png",
  "bedding-sleep": "8c0f1c58-96c3-4fd1-b9fc-8eda762d11c8.png",
  "beverages": "99caef98-3dbf-4e53-8120-fd5635b40edb.png",
  "bottled-water": "c43512af-3e24-4b46-b526-4e3408d59b25.png",
  "candles-home-fragrance": "655fb5a1-e852-4d1b-b5d5-864ba755a040.png",
  "cleaning-products": "1dfb70fa-696f-4a0c-9eeb-18ca9ad72ad0.png",
  "cleansers": "7d50ce67-a928-4ecc-a3dc-982a03a9ec0b.png",
  "clothes": "55095883-d653-4b1f-9ce4-bbe4b5101f3c.png",
  "coffee": "beda3bf8-a532-4e1b-ac58-3cb142192000.png",
  "collagen": "fa26bbe2-a21e-4b12-96dd-131d61158ac1.png",
  "condiments": "cd4b8df5-3569-4a7b-bdaa-515feba3932c.png",
  "cooking-oils": "f5267699-e00e-4385-83fa-ae50b3462df2.png",
  "cookware": "3d463827-acc0-4dae-b0da-533953e4b9e2.png",
  "dairy": "0b1f2257-08d7-4dde-a280-fcbb068a5cc3.png",
  "deodorant": "1540cf2c-b26a-43cb-949c-9dd788430b75.png",
  "dessert": "2c22ddb9-b9d9-451e-9bb7-88e2ba46dd72.png",
  "drinkware": "9354ccfc-5c9e-4165-9bd8-428201f7b1ff.png",
  "eggs": "e5779c3f-fccb-4521-b6c2-3a20d7864fa6.png",
  "electrolytes": "cc2a957a-07bc-49e8-8c01-7f8a4f819451.png",
  "essential-oils": "ae3e9956-f95c-49b5-ba80-5bb9d812b676.png",
  "fast-food": "e637fdbc-3125-4fec-a2c9-bbc1588f3af1.png",
  "feminine-care": "814cc197-32a4-468b-9b3c-2a00c687fef6.png",
  "food-prep": "9aea7528-43f7-44f4-85df-d1d3ee1e017f.png",
  "fragrances": "944048eb-2421-43b5-9bda-80d54e348b15.png",
  "frozen": "cdc908de-1ae7-4e87-8aff-769de33dbb24.png",
  "greens-powders": "bb57b3f2-77e9-436d-8a60-db44957a087c.png",
  "hair-care": "250c9454-541e-4c14-8bdb-7133d812ae1f.png",
  "herbal-teas": "711929e6-f46c-4808-8bbd-10c1d044dc2e.png",
  "home-essentials": "37691116-c0fb-492a-9fc7-2a59269731e9.png",
  "honey-sweeteners": "5f5e561a-a5ed-420f-b9d2-54ffe2844c59.png",
  "kids-food": "7ce47657-c622-498d-9f91-75b471871beb.png",
  "magnesium": "b8ae6d1a-a92f-4be0-ac29-3d1c63306464.png",
  "meat-seafood": "88877853-594f-4520-bf64-7e585a06584f.png",
  "medicinal-mushrooms": "0426b439-b5a4-4a4e-9590-af1eff7a79d3.png",
  "medicine": "1da60489-343c-4702-888e-7aa4bb29b2f2.png",
  "moisturizers-serums": "56d5bdcd-506f-4549-8856-dfb1d69006a0.png",
  "multivitamins": "e1873dc3-427c-43d0-af22-35d9e5eb4942.png",
  "nut-butters": "00b7ec36-f9d3-42b7-a7b9-48883505f9a4.png",
  "omega-3-fish-oil": "46a1ecae-5b27-4a0e-b962-4cdc3ce8659a.png",
  "oral-care": "e1539e3a-0da7-4dfe-b0a9-90c1ec2bf900.png",
  "pantry": "9543e1db-fbcc-4410-9799-41e759f60402.png",
  "personal-care": "e648fd4c-3f21-41c9-a2e9-907c54771d5e.png",
  "pet-care": "269e1162-ec6b-4d71-bbdb-2e839caeede6.png",
  "probiotics": "98671bbe-e2cc-4d38-bff1-a42d9da3d7f9.png",
  "produce": "78074112-16c2-49a0-9749-a70bc43ab28d.png",
  "protein-snack-bars": "bfe7bf8b-7ba9-4969-bcd9-ff6b669a0fdd.png",
  "protein-powder": "60469027-00b5-460e-b0cf-0156860792d1.png",
  "salt": "0ebf2837-ce6c-4d32-8ffc-0db9492fe833.png",
  "snacks-chips": "1c8e2111-7d52-4fe3-bfa6-70aa53872385.png",
  "sparkling-water": "656c6c1d-9ea4-4dcc-8873-fb70dbdd0512.png",
  "spreads": "dcaace23-e6c0-4e31-b64c-13745b22b166.png",
  "sunscreen": "170fc5a1-632d-4833-9c31-37d33745333f.png",
  "tea": "1aeada2d-06d8-468f-ad14-4c6f21d8001f.png",
  "tinctures-extracts": "c5506514-7249-43e4-9674-87f575a51ae2.png",
  "vitamin-d": "23ffba47-49e0-4e1f-a1ed-be0778056184.png",
  "water-filters": "f8694070-2425-4caa-9793-32ef7907ace2.png",
};

export function categoryHeroImage(slug: string): string | null {
  const f = FILES[slug];
  return f ? BUCKET + f : null;
}

// ── The Products grid ─────────────────────────────────────────────────────────
// Exactly the categories in the reference, with exactly those names, in that
// order. Each maps to a catalogue category (a parent covers everything beneath
// it). The catalogue itself holds more categories than this — those are for
// admin and browsing, not for this grid.
export const PRODUCTS_GRID: { label: string; slug: string; heroSlug?: string; also?: string[] }[] = [
  { label: "Bottled water", slug: "bottled-water" },
  { label: "Air Purifiers", slug: "air-purifiers-filters" },
  { label: "Baby Care", slug: "baby-care" },
  { label: "Baby Food", slug: "baby-food" },
  { label: "Bakery", slug: "bakery" },
  { label: "Bedding & Sleep", slug: "bedding-sleep" },
  { label: "Beverages", slug: "beverages" },
  { label: "Cleaning Supplies", slug: "cleaning-products" },
  { label: "Clothes", slug: "clothes" },
  { label: "Condiments", slug: "condiments" },
  { label: "Cookware", slug: "cookware" },
  { label: "Dairy", slug: "dairy" },
  { label: "Dessert", slug: "dessert" },
  { label: "Drinkware", slug: "drinkware" },
  { label: "Eggs", slug: "eggs" },
  { label: "Fast Food", slug: "fast-food" },
  { label: "Feminine Care", slug: "feminine-care" },
  { label: "Food Prep", slug: "food-prep" },
  { label: "Fragrances", slug: "fragrances" },
  { label: "Frozen", slug: "frozen" },
  { label: "Home Essentials", slug: "home-essentials" },
  { label: "Kids Food", slug: "kids-food" },
  { label: "Meat & Seafood", slug: "meat-seafood" },
  { label: "Medicine", slug: "medicine" },
  { label: "Pantry", slug: "pantry" },
  { label: "Personal Care", slug: "personal-care" },
  { label: "Pet Care", slug: "pet-care" },
  { label: "Produce", slug: "produce" },
  { label: "Snacks", slug: "protein-snack-bars", also: ["snacks-chips"] },
  { label: "Spreads", slug: "spreads", also: ["nut-butters"] },
  { label: "Supplements", slug: "supplements", heroSlug: "greens-powders" },
  { label: "Sweeteners", slug: "honey-sweeteners" },
  { label: "Toothcare", slug: "oral-care" },
  { label: "Water filters", slug: "water-filters" },
];
