"use client";

import { Bookmark } from "lucide-react";
import { useSavedRecipes } from "./SavedRecipesProvider";

const TEXT = "var(--nura-text-primary)";
const SAGE = "var(--nura-sage)";

// Bookmark toggle for a recipe. Reads live saved state from SavedRecipesProvider
// and no-ops (renders nothing) when no provider is present, so it's safe to drop
// into RecipeCard everywhere the card is reused. Filled sage = saved.
export default function SaveRecipeButton({
  recipeId,
  size = 38,
}: {
  recipeId: string;
  size?: number;
}) {
  const ctx = useSavedRecipes();
  if (!ctx) return null;

  const saved = ctx.isSaved(recipeId);
  const busy = ctx.isBusy(recipeId);

  return (
    <button
      onClick={(e) => {
        // The card behind this button is a Link — don't navigate on save.
        e.preventDefault();
        e.stopPropagation();
        ctx.toggle(recipeId);
      }}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save recipe"}
      aria-pressed={saved}
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(var(--nura-bg-rgb),0.55)",
        backdropFilter: "blur(4px)",
        border: `0.5px solid ${saved ? SAGE : "rgba(var(--nura-bg-tint-rgb),0.18)"}`,
        borderRadius: 11,
        cursor: busy ? "default" : "pointer",
        color: saved ? SAGE : TEXT,
        padding: 0,
        transition: "border-color 180ms, color 180ms",
      }}
    >
      <Bookmark size={Math.round(size * 0.42)} fill={saved ? SAGE : "none"} />
    </button>
  );
}
