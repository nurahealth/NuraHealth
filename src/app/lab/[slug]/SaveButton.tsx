"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TEXT = "var(--nura-text-primary)";
const SAGE = "var(--nura-sage)";

export default function SaveButton({ productId, userId, initialSaved }: {
  productId: string;
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
          .from("catalog_saved_products")
          .upsert({ user_id: userId, product_id: productId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("catalog_saved_products")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);
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
      aria-label={saved ? "Remove from saved" : "Save product"}
      aria-pressed={saved}
      style={{
        width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(13,13,14,0.72)", backdropFilter: "blur(4px)",
        border: `0.5px solid ${saved ? SAGE : "rgba(255,255,255,0.18)"}`,
        borderRadius: 10, cursor: busy ? "default" : "pointer",
        color: saved ? SAGE : TEXT, padding: 0,
        transition: "border-color 180ms, color 180ms",
      }}
    >
      <Bookmark size={15} fill={saved ? SAGE : "none"} />
    </button>
  );
}
