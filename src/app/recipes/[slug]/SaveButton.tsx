"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TEXT = "var(--nura-text-primary)";
const SAGE = "var(--nura-sage)";

// Save / un-save a recipe for the current user. Writes to public.saved_recipes
// (PK user_id+recipe_id) — RLS owner-only, so the browser anon client is fine.
export default function SaveButton({ recipeId, userId, initialSaved }: {
  recipeId: string;
  userId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      if (next) {
        const { error } = await supabase
          .from("saved_recipes")
          .upsert({ user_id: userId, recipe_id: recipeId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_recipes")
          .delete()
          .eq("user_id", userId)
          .eq("recipe_id", recipeId);
        if (error) throw error;
      }
    } catch {
      setSaved(!next); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save recipe"}
      aria-pressed={saved}
      style={{
        width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(13,13,14,0.55)", backdropFilter: "blur(4px)",
        border: `0.5px solid ${saved ? SAGE : "rgba(255,255,255,0.18)"}`,
        borderRadius: 11, cursor: busy ? "default" : "pointer",
        color: saved ? SAGE : TEXT, padding: 0,
        transition: "border-color 180ms, color 180ms",
      }}
    >
      <Bookmark size={16} fill={saved ? SAGE : "none"} />
    </button>
  );
}
