"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { supabase } from "@/lib/supabase";

// Shared saved-recipe state for a page subtree. Holds the set of the current
// user's saved recipe ids and an optimistic toggle that writes to
// public.saved_recipes (PK user_id+recipe_id) via the browser anon client —
// RLS is owner-only, so this is safe from the client.
//
// Any RecipeCard / SaveRecipeButton rendered *inside* a provider becomes an
// interactive bookmark that reflects live saved state. Rendered *outside* a
// provider (e.g. the server-rendered Foods / marker pages that reuse
// RecipeCard) the context is null and the bookmark simply doesn't render, so
// those call sites are unaffected.
interface SavedCtx {
  isSaved: (recipeId: string) => boolean;
  isBusy: (recipeId: string) => boolean;
  toggle: (recipeId: string) => void;
}

const Ctx = createContext<SavedCtx | null>(null);

export function useSavedRecipes(): SavedCtx | null {
  return useContext(Ctx);
}

export function SavedRecipesProvider({
  userId,
  initialSavedIds,
  children,
}: {
  userId: string;
  initialSavedIds: string[];
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState<Set<string>>(() => new Set(initialSavedIds));
  const [busy, setBusy] = useState<Set<string>>(() => new Set());

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);
  const isBusy = useCallback((id: string) => busy.has(id), [busy]);

  const toggle = useCallback(
    async (id: string) => {
      if (busy.has(id)) return;
      const wasSaved = saved.has(id);

      // Optimistic flip.
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });
      setBusy((prev) => new Set(prev).add(id));

      try {
        if (wasSaved) {
          const { error } = await supabase
            .from("saved_recipes")
            .delete()
            .eq("user_id", userId)
            .eq("recipe_id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("saved_recipes")
            .upsert({ user_id: userId, recipe_id: id });
          if (error) throw error;
        }
      } catch {
        // Revert on failure.
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
      } finally {
        setBusy((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [busy, saved, userId]
  );

  return <Ctx.Provider value={{ isSaved, isBusy, toggle }}>{children}</Ctx.Provider>;
}
