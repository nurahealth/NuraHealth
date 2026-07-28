"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  DIETARY_PATTERNS,
  type NutritionPrefs,
  type CandidateRecipe,
} from "@/lib/nutrition";
import { buildDayPlan, type FlaggedMarker, type MarkerFoodMap } from "@/lib/mealScoring";
import { insertPlannedMeals, toInsertRows } from "@/lib/plannedMealsIO";

// ─────────────────────────────────────────────────────────────────────────────
// Customize meals — bottom sheet (mirrors the dashboard CustomizeSheet pattern:
// fade backdrop + rise sheet + drag handle + sage primary button). Reads/writes
// nutrition_preferences and re-generates today's planned_meals, both via the
// browser anon client against RLS owner-only policies (same as recipes/SaveButton).
// ─────────────────────────────────────────────────────────────────────────────

const SANS = "var(--font-inter), system-ui, sans-serif";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";

const COOK_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Any" },
  { value: 15, label: "≤15 min" },
  { value: 30, label: "≤30 min" },
  { value: 45, label: "≤45 min" },
  { value: 60, label: "≤60 min" },
];

function Switch({ on }: { on: boolean }) {
  return (
    <span style={{ width: 42, height: 24, borderRadius: 999, flex: "none", position: "relative", transition: "background .18s", background: on ? SAGE : "rgba(var(--nura-bg-tint-rgb),0.14)", border: on ? "none" : `1px solid ${BORDER}` }}>
      <span style={{ position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .18s", boxShadow: "0 1px 3px rgba(0,0,0,0.45)" }} />
    </span>
  );
}

const labelStyle: React.CSSProperties = { fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-text)", margin: "18px 2px 9px" };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: SANS, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
        color: active ? "var(--nura-sage-bg-on)" : TEXT,
        background: active ? SAGE : `rgba(${SAGE_RGB},0.08)`,
        border: `0.5px solid ${active ? SAGE : `rgba(${SAGE_RGB},0.22)`}`,
        borderRadius: 999, padding: "7px 13px",
      }}
    >
      {children}
    </button>
  );
}

export default function NutritionCustomizeSheet({
  open,
  onClose,
  initialPrefs,
  userId,
  candidates,
  flaggedMarkers,
  markerFoods,
}: {
  open: boolean;
  onClose: () => void;
  initialPrefs: NutritionPrefs;
  userId: string;
  candidates: CandidateRecipe[];
  flaggedMarkers: FlaggedMarker[];
  markerFoods: MarkerFoodMap;
}) {
  const router = useRouter();
  const [pattern, setPattern] = useState(initialPrefs.dietary_pattern ?? "");
  const [excludedText, setExcludedText] = useState((initialPrefs.excluded_ingredients ?? []).join(", "));
  const [maxCook, setMaxCook] = useState<number | null>(initialPrefs.max_cook_minutes ?? null);
  const [prioritize, setPrioritize] = useState(initialPrefs.prioritize_markers);
  const [respectAllergens, setRespectAllergens] = useState(initialPrefs.respect_allergens);
  const [budget, setBudget] = useState(initialPrefs.budget_friendly);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  if (!open) return null;

  const update = async () => {
    if (busy) return;
    setBusy(true);
    setErr(false);
    const newPrefs: NutritionPrefs = {
      dietary_pattern: pattern || null,
      excluded_ingredients: excludedText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      max_cook_minutes: maxCook,
      prioritize_markers: prioritize,
      respect_allergens: respectAllergens,
      budget_friendly: budget,
    };
    const today = new Date().toISOString().slice(0, 10);
    try {
      const { error: pErr } = await supabase
        .from("nutrition_preferences")
        .upsert({ user_id: userId, ...newPrefs }, { onConflict: "user_id" });
      if (pErr) throw pErr;

      // Re-generate today's plan with the new prefs.
      const { error: dErr } = await supabase
        .from("planned_meals")
        .delete()
        .eq("user_id", userId)
        .eq("plan_date", today);
      if (dErr) throw dErr;

      const rows = buildDayPlan({ recipes: candidates, flagged: flaggedMarkers, markerFoods, prefs: newPrefs });
      const iErr = await insertPlannedMeals(supabase, toInsertRows(rows, userId, today));
      if (iErr) throw new Error(iErr.message);
      onClose();
      router.refresh();
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleRows: { label: string; sub: string; on: boolean; set: (v: boolean) => void }[] = [
    { label: "Prioritize my focus markers", sub: "Favor recipes that target your flagged markers.", on: prioritize, set: setPrioritize },
    { label: "Respect flagged allergens", sub: "Skip recipes that clash with your dietary pattern.", on: respectAllergens, set: setRespectAllergens },
    { label: "Budget-friendly swaps", sub: "Prefer affordable, everyday ingredients.", on: budget, set: setBudget },
  ];

  return (
    <>
      <style>{`
        @keyframes nt-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nt-rise { from { transform: translateY(100%); } to { transform: none; } }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", animation: "nt-fade .2s ease forwards" }} />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 81,
          margin: "0 auto", maxWidth: 480, width: "100%",
          background: "var(--nura-glass)",
          backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          borderTop: "1px solid var(--nura-glass-line)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: "0 -22px 60px rgba(0,0,0,.5)",
          padding: "10px 16px max(env(safe-area-inset-bottom), 18px)",
          color: TEXT, fontFamily: SANS,
          animation: "nt-rise .26s cubic-bezier(.2,.7,.2,1) forwards",
          maxHeight: "88dvh", overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 12px" }}>
          <span style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(var(--nura-bg-tint-rgb),0.22)" }} />
        </div>

        {/* Title */}
        <div style={{ padding: "0 2px" }}>
          <div style={{ fontFamily: SANS, fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", color: TEXT }}>Customize meals</div>
          <div style={{ fontSize: 12.5, color: TEXT_SEC, marginTop: 4, lineHeight: 1.45 }}>Tune how NŪRA builds your plan, then regenerate today&rsquo;s meals.</div>
        </div>

        {/* Dietary pattern */}
        <div style={labelStyle}>Dietary pattern</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {DIETARY_PATTERNS.map((p) => (
            <Chip key={p.value || "none"} active={pattern === p.value} onClick={() => setPattern(p.value)}>{p.label}</Chip>
          ))}
        </div>

        {/* Exclude ingredients */}
        <div style={labelStyle}>Exclude ingredients</div>
        <input
          value={excludedText}
          onChange={(e) => setExcludedText(e.target.value)}
          placeholder="e.g. cilantro, shellfish, dairy"
          style={{ width: "100%", fontFamily: SANS, fontSize: 13.5, color: TEXT, background: `rgba(${SAGE_RGB},0.06)`, border: `0.5px solid ${BORDER}`, borderRadius: 11, padding: "11px 13px", outline: "none" }}
        />
        <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, margin: "6px 2px 0" }}>Comma-separated. Recipes using these are skipped.</div>

        {/* Max cook time */}
        <div style={labelStyle}>Max cook time</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COOK_OPTIONS.map((o) => (
            <Chip key={o.label} active={maxCook === o.value} onClick={() => setMaxCook(o.value)}>{o.label}</Chip>
          ))}
        </div>

        {/* Toggles */}
        <div style={labelStyle}>Preferences</div>
        <div>
          {toggleRows.map((t) => (
            <div key={t.label} onClick={() => t.set(!t.on)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 2px", cursor: "pointer", borderTop: `1px solid ${BORDER}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{t.label}</div>
                <div style={{ fontSize: 11.5, color: TEXT_TER, marginTop: 1, lineHeight: 1.4 }}>{t.sub}</div>
              </div>
              <Switch on={t.on} />
            </div>
          ))}
        </div>

        {err && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--nura-danger)", margin: "14px 2px 0", textAlign: "center" }}>
            Couldn&rsquo;t update your meals. Please try again.
          </div>
        )}

        {/* Update */}
        <button
          onClick={update}
          disabled={busy}
          style={{ width: "100%", marginTop: 16, padding: "13px 0", borderRadius: 14, border: "none", cursor: busy ? "default" : "pointer", background: SAGE, color: "var(--nura-sage-bg-on)", fontFamily: SANS, fontSize: 14.5, fontWeight: 700, letterSpacing: "0.2px", opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Updating…" : "Update my meals"}
        </button>
      </div>
    </>
  );
}
