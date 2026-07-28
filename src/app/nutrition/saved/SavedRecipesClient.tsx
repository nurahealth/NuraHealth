"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import { SavedRecipesProvider, useSavedRecipes } from "@/components/SavedRecipesProvider";
import { RecipeCard, type Recipe } from "../../recipes/RecipesBrowseClient";

// ── Design tokens (locked NŪRA system) ──────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const BORDER = "var(--nura-border)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// Canonical category order + labels — mirrors CATEGORY_CHIPS on /recipes (with
// Lunch added). Only the categories the user actually has saved get a chip.
const CATEGORY_ORDER: { value: string; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "baking", label: "Baking" },
  { value: "snack", label: "Snacks" },
  { value: "drink", label: "Drinks" },
];

const ALL = "__all__";

export default function SavedRecipesClient({
  recipes,
  userId,
}: {
  recipes: Recipe[];
  userId: string;
}) {
  return (
    <SavedRecipesProvider userId={userId} initialSavedIds={recipes.map((r) => r.id)}>
      <SavedGrid recipes={recipes} />
    </SavedRecipesProvider>
  );
}

function SavedGrid({ recipes }: { recipes: Recipe[] }) {
  const ctx = useSavedRecipes();
  const [filter, setFilter] = useState<string>(ALL); // ALL or a category value

  // Un-saving a card flips its state in the provider — drop it from the list live.
  const isSaved = (id: string) => ctx?.isSaved(id) ?? true;
  const savedRecipes = recipes.filter((r) => isSaved(r.id));
  const visible = savedRecipes.filter((r) => filter === ALL || r.category === filter);

  // Chips derive from the saved-at-load set (stable through the session) so an
  // emptied filter still shows its own empty state rather than vanishing.
  const presentCategories = CATEGORY_ORDER.filter((c) => recipes.some((r) => r.category === c.value));
  const showChips = savedRecipes.length > 0 && presentCategories.length > 0;

  // Count line reflects the active filter, with correct singular/plural + spacing.
  const n = visible.length;
  const noun = n === 1 ? "recipe" : "recipes";
  const countLine =
    filter === ALL ? `${n} ${noun} you've kept.` : `${n} ${filter} ${noun} you've kept.`;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    flexShrink: 0,
    padding: "8px 16px",
    background: active ? SAGE : "transparent",
    border: `0.5px solid ${active ? SAGE : BORDER}`,
    borderRadius: 999,
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
    color: active ? "var(--nura-sage-bg-on)" : TEXT_SEC,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 180ms, border-color 180ms, color 180ms",
  });

  return (
    <div>
      <style>{`
        .rx-card { transition: background 180ms, border-color 180ms, transform 180ms; }
        .rx-card:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-2px); }
        .rx-row { scrollbar-width: none; }
        .rx-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Back to Nutrition */}
      <Link
        href="/nutrition"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18,
          fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none",
        }}
      >
        <ArrowLeft size={15} /> Nutrition
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--nura-accent-label)" }}>
          Your collection
        </span>
        <h1 style={{ fontFamily: SANS, fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 600, color: TEXT, margin: "6px 0 8px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Saved recipes
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, margin: 0, lineHeight: 1.55 }}>
          {countLine}
        </p>
      </div>

      {/* Category filter chips — same styling as /recipes, only categories present */}
      {showChips && (
        <div className="rx-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24, WebkitOverflowScrolling: "touch" }}>
          <button onClick={() => setFilter(ALL)} style={chipStyle(filter === ALL)}>All</button>
          {presentCategories.map((c) => (
            <button key={c.value} onClick={() => setFilter(c.value)} style={chipStyle(filter === c.value)}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {savedRecipes.length === 0 ? (
        // Nothing saved at all.
        <div style={{ textAlign: "center", padding: "72px 20px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52,
            borderRadius: 15, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, marginBottom: 16,
          }}>
            <Bookmark size={22} color={SAGE} />
          </span>
          <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC, margin: "0 auto", lineHeight: 1.6, maxWidth: 340 }}>
            No saved recipes yet — tap the bookmark on any recipe to keep it here.
          </p>
          <Link
            href="/recipes"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, padding: "10px 18px",
              background: SAGE, borderRadius: 999, textDecoration: "none",
              fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "var(--nura-sage-bg-on)",
            }}
          >
            Browse recipes
          </Link>
        </div>
      ) : visible.length === 0 ? (
        // Saved recipes exist, but none in the active category filter.
        <div style={{ textAlign: "center", padding: "56px 20px" }}>
          <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC, margin: "0 auto 16px", lineHeight: 1.6, maxWidth: 340 }}>
            No saved {filter} recipes yet.
          </p>
          <button
            onClick={() => setFilter(ALL)}
            style={{
              appearance: "none", cursor: "pointer", padding: "9px 16px", borderRadius: 999,
              background: `rgba(${SAGE_RGB},0.10)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
              fontFamily: SANS, fontSize: 13, fontWeight: 600, color: SAGE,
            }}
          >
            Show all saved
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 14 }}>
          {visible.map((r) => <RecipeCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}
