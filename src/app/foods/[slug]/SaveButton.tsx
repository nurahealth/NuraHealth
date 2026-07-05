"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";

const TEXT = "var(--nura-text-primary)";
const SAGE = "var(--nura-sage)";

// Visual-only bookmark. There is no `saved_foods` table in schema 5.0, so this
// toggles local state for the look/feel but does NOT persist. Wire to a real
// table in a later phase if we decide to let users save individual foods.
export default function SaveButton() {
  const [saved, setSaved] = useState(false);

  return (
    <button
      onClick={() => setSaved((s) => !s)}
      aria-label={saved ? "Saved (not persisted)" : "Save food"}
      aria-pressed={saved}
      title="Saving foods isn't wired up yet"
      style={{
        width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(13,13,14,0.55)", backdropFilter: "blur(4px)",
        border: `0.5px solid ${saved ? SAGE : "rgba(255,255,255,0.18)"}`,
        borderRadius: 11, cursor: "pointer",
        color: saved ? SAGE : TEXT, padding: 0,
        transition: "border-color 180ms, color 180ms",
      }}
    >
      <Bookmark size={16} fill={saved ? SAGE : "none"} />
    </button>
  );
}
