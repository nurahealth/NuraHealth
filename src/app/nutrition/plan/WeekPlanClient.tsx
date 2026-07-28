"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { withFrom } from "@/lib/backNav";
import { ArrowLeft, RefreshCw, Plus, Clock, Repeat, Trash2, X, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import {
  recipePassesPrefs,
  type NutritionPrefs,
  type CandidateRecipe,
} from "@/lib/nutrition";
import {
  scoreRecipe,
  buildWeekPlan,
  buildMealReason,
  type FlaggedMarker,
  type MarkerFoodMap,
  type RecipeScore,
} from "@/lib/mealScoring";
import { insertPlannedMeals, toInsertRows, updatePlannedMeal } from "@/lib/plannedMealsIO";

// ── Design tokens (locked system — same as the rest of /nutrition) ────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

const card: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };
const heading: React.CSSProperties = { fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: 0, letterSpacing: "-0.02em" };

const SLOT_LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };
const SLOTS = ["breakfast", "lunch", "dinner", "snack"];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PlanCandidate extends CandidateRecipe { title: string }

export interface PlanMeal {
  id: string;
  recipeSlug: string;
  recipeTitle: string;
  totalMinutes: number | null;
  targetMarkerSlug: string | null;
  targetMarkerName: string | null;
  reason: string | null;
}
export interface PlanSlot { slot: string; meal: PlanMeal | null }
export interface PlanDay { date: string; weekday: string; dateLabel: string; isToday: boolean; meals: PlanSlot[] }

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WeekPlanClient({ days, totalPlanned, candidates, prefs, flaggedMarkers, markerFoods, markerNames, dates, userId }: {
  days: PlanDay[];
  totalPlanned: number;
  candidates: PlanCandidate[];
  prefs: NutritionPrefs;
  flaggedSlugs: string[];
  flaggedMarkers: FlaggedMarker[];
  markerFoods: MarkerFoodMap;
  markerNames: Record<string, string>;
  dates: string[];
  userId: string;
}) {
  const router = useRouter();
  const [picker, setPicker] = useState<{ date: string; slot: string; meal: PlanMeal | null } | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [removingSlot, setRemovingSlot] = useState<string | null>(null);
  const [error, setError] = useState("");

  const flaggedBySlug = useMemo(
    () => Object.fromEntries(flaggedMarkers.map((m) => [m.slug, m])),
    [flaggedMarkers],
  );
  // Same marker-driven scoring the generator uses, so swaps stay truthful.
  const scoreFor = useCallback(
    (c: PlanCandidate): RecipeScore => scoreRecipe(c, flaggedMarkers, markerFoods),
    [flaggedMarkers, markerFoods],
  );

  // Build the swap/add picker options for a given slot: prefs-passing recipes,
  // same-category-as-slot first, then by marker score, then quicker.
  const pickerOptions = useMemo(() => {
    if (!picker) return [] as PlanCandidate[];
    const currentId = picker.meal ? candidates.find((c) => c.slug === picker.meal!.recipeSlug)?.id : undefined;
    const eligible = candidates.filter((c) => recipePassesPrefs(c, prefs) && c.id !== currentId);
    const rank = (c: PlanCandidate): number =>
      (c.category === picker.slot ? 1000 : 0) + scoreRecipe(c, flaggedMarkers, markerFoods).total;
    return eligible
      .sort((a, b) => rank(b) - rank(a) || (a.total_minutes ?? 999) - (b.total_minutes ?? 999) || a.title.localeCompare(b.title))
      .slice(0, 12);
  }, [picker, candidates, prefs, flaggedMarkers, markerFoods]);

  // ── Persist: swap an existing meal, or add into an empty slot ────────────────
  const choose = async (c: PlanCandidate) => {
    if (!picker) return;
    setBusySlot(`${picker.date}__${picker.slot}`);
    setError("");
    const s = scoreFor(c);
    const target = s.bestMarkerSlug;
    const reason = buildMealReason(s, flaggedBySlug);
    try {
      if (picker.meal) {
        const e = await updatePlannedMeal(supabase, picker.meal.id, userId, {
          recipe_id: c.id, target_marker_slug: target, reason,
        });
        if (e) throw new Error(e.message);
      } else {
        const e = await insertPlannedMeals(
          supabase,
          toInsertRows(
            [{ recipe_id: c.id, meal_slot: picker.slot, target_marker_slug: target, order_index: SLOTS.indexOf(picker.slot), reason }],
            userId,
            picker.date,
          ),
        );
        if (e) throw new Error(e.message);
      }
      setPicker(null);
      router.refresh();
    } catch {
      setError("Couldn't save that change. Please try again.");
    } finally {
      setBusySlot(null);
    }
  };

  // ── Remove a meal: delete the row, returning the slot to its empty state ────
  const removeMeal = async (mealId: string, slotKey: string) => {
    if (removingSlot) return;
    setRemovingSlot(slotKey);
    setError("");
    try {
      const { error: e } = await supabase
        .from("planned_meals")
        .delete()
        .eq("id", mealId)
        .eq("user_id", userId);
      if (e) throw e;
      router.refresh();
    } catch {
      setError("Couldn't remove that meal. Please try again.");
    } finally {
      setRemovingSlot(null);
    }
  };

  // ── Regenerate the whole week with the daily generator logic ────────────────
  const regenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    setError("");
    try {
      const { error: dErr } = await supabase
        .from("planned_meals")
        .delete()
        .eq("user_id", userId)
        .gte("plan_date", dates[0])
        .lte("plan_date", dates[dates.length - 1]);
      if (dErr) throw dErr;

      // One marker-driven pass across all 7 days, with cross-day variety.
      const plan = buildWeekPlan({ dates, recipes: candidates, flagged: flaggedMarkers, markerFoods, prefs });
      const inserts = dates.flatMap((date) => toInsertRows(plan[date] ?? [], userId, date));
      const iErr = await insertPlannedMeals(supabase, inserts);
      if (iErr) throw new Error(iErr.message);
      router.refresh();
    } catch {
      setError("Couldn't regenerate your week. Please try again.");
    } finally {
      setRegenerating(false);
    }
  };

  const Back = (
    <Link href="/nutrition" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none", alignSelf: "flex-start" }}>
      <ArrowLeft size={15} /> Nutrition
    </Link>
  );

  const errorBar = error ? (
    <div style={{ ...card, padding: "11px 14px", borderColor: "var(--nura-tint-danger-border)", background: "var(--nura-tint-danger)", fontFamily: SANS, fontSize: 13, color: "var(--nura-danger)" }}>{error}</div>
  ) : null;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (totalPlanned === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {Back}
        {errorBar}
        <div style={{ ...card, padding: "44px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)` }}>
            <CalendarDays size={22} color={SAGE} />
          </div>
          <h1 style={{ ...heading, fontSize: 20 }}>No meals planned this week</h1>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: 0, maxWidth: 360 }}>
            Build a 7-day plan around your flagged markers and preferences.
          </p>
          <button onClick={regenerate} disabled={regenerating} style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "var(--nura-sage-bg-on)", background: SAGE, border: "none", borderRadius: 999, padding: "11px 20px", cursor: regenerating ? "default" : "pointer", opacity: regenerating ? 0.7 : 1 }}>
            {regenerating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={14} />}
            Generate this week
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {Back}

      {/* Header + regenerate */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, marginBottom: 8 }}>Next 7 days</div>
          <h1 style={heading}>This week&rsquo;s plan</h1>
        </div>
        <button onClick={regenerate} disabled={regenerating} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.10)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 999, padding: "8px 14px", cursor: regenerating ? "default" : "pointer", opacity: regenerating ? 0.7 : 1 }}>
          {regenerating ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={13} />}
          Regenerate week
        </button>
      </div>

      {errorBar}

      {/* Day cards */}
      {days.map((day) => (
        <section key={day.date} style={{ ...card, padding: "14px 16px", borderColor: day.isToday ? `rgba(${SAGE_RGB},0.4)` : BORDER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: TEXT }}>{day.weekday}</span>
            <span style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER }}>{day.dateLabel}</span>
            {day.isToday && (
              <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: SAGE, background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.35)`, borderRadius: 8, padding: "3px 8px" }}>Today</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {day.meals.map(({ slot, meal }) => (
              <div key={slot} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flexShrink: 0, width: 64, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TEXT_TER }}>{SLOT_LABEL[slot]}</span>

                {meal ? (
                  <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <Link
                      href={withFrom(`/recipes/${meal.recipeSlug}`, "/nutrition/plan", "This week's plan")}
                      className="wp-meal"
                      style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10, textDecoration: "none", background: `rgba(${SAGE_RGB},0.05)`, border: `0.5px solid rgba(${SAGE_RGB},0.18)`, borderRadius: 11, padding: "9px 12px" }}
                    >
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meal.recipeTitle}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                          {meal.totalMinutes != null && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 11.5, color: TEXT_TER }}>
                              <Clock size={11} /> {meal.totalMinutes} min
                            </span>
                          )}
                          {meal.targetMarkerName && (
                            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em", color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 999, padding: "2px 8px" }}>
                              For {meal.targetMarkerName}
                            </span>
                          )}
                        </span>
                        {meal.reason && (
                          <span style={{ display: "block", fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 4, lineHeight: 1.4 }}>
                            {meal.reason}
                          </span>
                        )}
                      </span>
                      <ChevronRight size={15} color={TEXT_TER} style={{ flexShrink: 0 }} />
                    </Link>
                    <button
                      onClick={() => setPicker({ date: day.date, slot, meal })}
                      aria-label={`Swap ${SLOT_LABEL[slot]}`}
                      className="wp-icon"
                      style={{ flexShrink: 0, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer" }}
                    >
                      {busySlot === `${day.date}__${slot}` ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Repeat size={13} />}
                    </button>
                    <button
                      onClick={() => removeMeal(meal.id, `${day.date}__${slot}`)}
                      aria-label={`Remove ${SLOT_LABEL[slot]}`}
                      className="wp-trash"
                      style={{ flexShrink: 0, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer" }}
                    >
                      {removingSlot === `${day.date}__${slot}` ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPicker({ date: day.date, slot, meal: null })}
                    className="wp-add"
                    style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: TEXT_TER, background: "transparent", border: `0.5px dashed rgba(${SAGE_RGB},0.3)`, borderRadius: 11, padding: "9px 12px", cursor: "pointer" }}
                  >
                    {busySlot === `${day.date}__${slot}` ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} color={SAGE} />}
                    Add {SLOT_LABEL[slot].toLowerCase()}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Swap / add picker */}
      {picker && (
        <div onClick={() => busySlot === null && setPicker(null)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, maxHeight: "82dvh", overflowY: "auto", background: "var(--nura-bg)", borderRadius: 22, border: `0.5px solid ${BORDER}`, padding: "12px 16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "2px 0 10px" }}>
              <span style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(var(--nura-bg-tint-rgb),0.22)" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: TEXT }}>
                {picker.meal ? "Swap" : "Add"} {SLOT_LABEL[picker.slot].toLowerCase()}
              </span>
              <button onClick={() => setPicker(null)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8, color: TEXT_SEC, cursor: "pointer" }}><X size={13} /></button>
            </div>

            {pickerOptions.length === 0 ? (
              <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_TER, textAlign: "center", padding: "24px 0" }}>
                No alternative recipes match your preferences right now.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
                {pickerOptions.map((c) => {
                  const tgt = scoreFor(c).bestMarkerSlug;
                  return (
                    <button key={c.id} onClick={() => choose(c)} disabled={busySlot !== null} className="wp-opt" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px", cursor: busySlot !== null ? "default" : "pointer" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER }}>{pretty(c.category)}</span>
                          {c.total_minutes != null && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 11, color: TEXT_TER }}><Clock size={10} /> {c.total_minutes} min</span>
                          )}
                          {tgt && markerNames[tgt] && (
                            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 999, padding: "2px 8px" }}>For {markerNames[tgt]}</span>
                          )}
                        </span>
                      </span>
                      <ChevronRight size={15} color={TEXT_TER} style={{ flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .wp-meal:hover { border-color: rgba(${SAGE_RGB},0.4) !important; }
        .wp-icon:hover, .wp-add:hover { border-color: rgba(${SAGE_RGB},0.45) !important; color: ${SAGE} !important; }
        .wp-trash:hover { border-color: rgba(var(--nura-danger-rgb),0.45) !important; color: var(--nura-danger) !important; }
        .wp-opt:hover { border-color: rgba(${SAGE_RGB},0.4) !important; background: rgba(${SAGE_RGB},0.05) !important; }
      `}</style>
    </div>
  );
}
