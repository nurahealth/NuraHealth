"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreRing from "../lab/ScoreRing";
import { withFrom } from "@/lib/backNav";
import { UtensilsCrossed, Sparkles, ChevronRight, SlidersHorizontal, CalendarDays, ShoppingBasket, Bookmark } from "lucide-react";
import NutritionCustomizeSheet from "./NutritionCustomizeSheet";
import type { NutritionPrefs, CandidateRecipe } from "@/lib/nutrition";
import type { FlaggedMarker, MarkerFoodMap } from "@/lib/mealScoring";

// ── Shared view-models (built server-side in page.tsx) ───────────────────────
export interface MarkerCardVM {
  slug: string;
  name: string;
  unit: string | null;
  value: number;
  status: "optimal" | "attention";
  rangeLabel: string;
  bandStartPct: number;
  bandEndPct: number;
  dotPct: number;
  foodHint: string | null;
  collectedDate: string | null;
}
export interface MealVM {
  id: string;
  recipeSlug: string;
  recipeTitle: string;
  slot: string;
  targetMarkerSlug: string | null;
  targetMarkerName: string | null;
  reason: string | null;
}
export interface SummaryVM {
  narrative: string;
  onPlanPct: number;
  markersInFocus: number;
  mealsPlanned: number;
  markersImproving: number;
}

// ── Design tokens (locked system) ────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const AMBER = "var(--nura-good)";
const AMBER_RGB = "211,162,83";
const SANS = "var(--font-inter), system-ui, sans-serif";

// Card lists stack on phones and split into two columns once the shell widens
// at lg, so rows don't run the full 1200 and turn into ribbons.
const CARD_LIST_CSS = `
  .nut-list { display: flex; flex-direction: column; gap: 11px; }
  @media (min-width: 1024px) {
    .nut-list { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
  }
`;

const card: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };
const heading: React.CSSProperties = { fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 12px", letterSpacing: "-0.02em" };

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function StatusPill({ status }: { status: "optimal" | "attention" }) {
  const optimal = status === "optimal";
  const color = optimal ? SAGE : AMBER;
  const rgb = optimal ? SAGE_RGB : AMBER_RGB;
  return (
    <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", color, background: `rgba(${rgb},0.12)`, border: `0.5px solid rgba(${rgb},0.32)`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
      {optimal ? "Optimal" : "Needs attention"}
    </span>
  );
}

function MarkerCard({ m }: { m: MarkerCardVM }) {
  const color = m.status === "optimal" ? SAGE : AMBER;
  const rgb = m.status === "optimal" ? SAGE_RGB : AMBER_RGB;
  const bandLeft = Math.min(m.bandStartPct, m.bandEndPct);
  const bandWidth = Math.max(2, Math.abs(m.bandEndPct - m.bandStartPct));
  return (
    <Link href={`/nutrition/markers/${m.slug}`} className="nt-card" style={{ ...card, padding: "15px 17px", textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 600, color: TEXT, letterSpacing: "-0.01em" }}>{m.name}</span>
        <StatusPill status={m.status} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 10 }}>
        <span style={{ fontFamily: SANS, fontSize: 26, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em", lineHeight: 1 }}>{m.value}</span>
        {m.unit && <span style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC }}>{m.unit}</span>}
        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, marginLeft: "auto" }}>Optimal {m.rangeLabel}</span>
      </div>

      {/* Range bar */}
      <div style={{ position: "relative", height: 6, borderRadius: 999, background: `rgba(var(--nura-bg-tint-rgb),0.08)`, marginTop: 12 }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${bandLeft}%`, width: `${bandWidth}%`, borderRadius: 999, background: `rgba(${SAGE_RGB},0.30)` }} />
        <div style={{ position: "absolute", top: "50%", left: `${m.dotPct}%`, width: 11, height: 11, borderRadius: "50%", background: color, border: "2px solid var(--nura-bg)", transform: "translate(-50%,-50%)", boxShadow: `0 0 0 1px rgba(${rgb},0.5)` }} />
      </div>

      {m.foodHint && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12 }}>
          <Sparkles size={13} color={SAGE} style={{ flexShrink: 0 }} />
          {/* Out-of-range markers get a corrective "Try …"; in-range markers read
              as upkeep ("Maintain with …") so they don't look like they need fixing. */}
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC }}>
            {m.status === "optimal" ? "Maintain with" : "Try"} {m.foodHint}
          </span>
          <ChevronRight size={14} color={TEXT_TER} style={{ marginLeft: "auto", flexShrink: 0 }} />
        </div>
      )}
    </Link>
  );
}

export default function NutritionHome({
  dateLabel,
  isSample,
  summary,
  markers,
  meals,
  prefs,
  candidates,
  flaggedMarkers,
  markerFoods,
  userId,
}: {
  dateLabel: string;
  isSample: boolean;
  summary: SummaryVM;
  markers: MarkerCardVM[];
  meals: MealVM[];
  prefs: NutritionPrefs;
  candidates: CandidateRecipe[];
  flaggedMarkers: FlaggedMarker[];
  markerFoods: MarkerFoodMap;
  userId: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <style>{CARD_LIST_CSS}</style>
      {/* Header */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", marginBottom: 8 }}>{dateLabel}</div>
        <h1 style={{ fontFamily: SANS, fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 600, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>Nutrition</h1>
        <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>Your plan, built around your latest bloodwork.</p>
      </div>

      {/* Sample banner */}
      {isSample && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderRadius: 12, background: `rgba(${AMBER_RGB},0.08)`, border: `0.5px solid rgba(${AMBER_RGB},0.25)` }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />
          <span style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, lineHeight: 1.4 }}>
            <strong style={{ color: TEXT, fontWeight: 600 }}>Sample data</strong> — add your bloodwork to personalize this plan.
          </span>
        </div>
      )}

      {/* Summary card */}
      <section style={{ ...card, padding: "20px 20px 18px" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ flexShrink: 0 }}>
            <ScoreRing score={summary.onPlanPct} size={66} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", marginBottom: 6 }}>This week&rsquo;s focus</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.55, margin: 0 }}>{summary.narrative}</p>
          </div>
        </div>

        {/* 3-stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 18, paddingTop: 16, borderTop: `0.5px solid ${BORDER}` }}>
          {[
            { v: summary.markersInFocus, l: "In focus" },
            { v: summary.mealsPlanned, l: "Meals planned" },
            { v: summary.markersImproving, l: "Improving" },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: 24, fontWeight: 600, color: TEXT, letterSpacing: "-0.02em" }}>{s.v}</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Eat to improve your bloodwork */}
      {markers.length > 0 && (
        <section>
          <h2 style={heading}>Eat to improve your bloodwork</h2>
          <div className="nut-list">
            {markers.map((m) => (
              <MarkerCard key={m.slug} m={m} />
            ))}
          </div>
        </section>
      )}

      {/* Today's meals */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
          <h2 style={{ ...heading, margin: 0 }}>Today&rsquo;s meals</h2>
          <button
            onClick={() => setSheetOpen(true)}
            className="nt-customize"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.10)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 999, padding: "7px 13px", cursor: "pointer" }}
          >
            <SlidersHorizontal size={13} /> Customize meals
          </button>
        </div>

        {meals.length > 0 ? (
          <div className="nut-list">
            {meals.map((m) => (
              <Link
                key={m.id}
                href={withFrom(`/recipes/${m.recipeSlug}`, "/nutrition", "Nutrition")}
                className="nt-card"
                style={{ ...card, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, textDecoration: "none", color: "inherit" }}
              >
                <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.26)` }}>
                  <UtensilsCrossed size={17} color={SAGE} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 2 }}>{SLOT_LABEL[m.slot] ?? m.slot}</div>
                  <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.recipeTitle}</div>
                  {m.reason && (
                    <div style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, marginTop: 3, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {m.reason}
                    </div>
                  )}
                </div>
                {m.targetMarkerName && (
                  <span style={{ flexShrink: 0, fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: AMBER, background: `rgba(${AMBER_RGB},0.10)`, border: `0.5px solid rgba(${AMBER_RGB},0.28)`, borderRadius: 999, padding: "4px 10px" }}>
                    For {m.targetMarkerName}
                  </span>
                )}
                <ChevronRight size={16} color={TEXT_TER} style={{ flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ ...card, padding: "18px 18px", textAlign: "center" }}>
            <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>
              No meals planned for today yet. Use <strong style={{ color: TEXT }}>Customize meals</strong> to build a plan around your markers.
            </p>
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          <QuickAction icon={<CalendarDays size={18} color={SAGE} />} label="This week's plan" href="/nutrition/plan" />
          <QuickAction icon={<ShoppingBasket size={18} color={SAGE} />} label="Grocery list" href="/nutrition/grocery" />
          <QuickAction icon={<Bookmark size={18} color={SAGE} />} label="Saved" href="/nutrition/saved" />
        </div>
      </section>

      <NutritionCustomizeSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        initialPrefs={prefs}
        userId={userId}
        candidates={candidates}
        flaggedMarkers={flaggedMarkers}
        markerFoods={markerFoods}
      />

      <style>{`
        .nt-card { transition: border-color 160ms, background 160ms; }
        .nt-card:hover { border-color: rgba(${SAGE_RGB},0.4); background: rgba(${SAGE_RGB},0.05); }
        .nt-customize:hover { background: rgba(${SAGE_RGB},0.18); }
      `}</style>
    </div>
  );
}

function QuickAction({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const inner = (
    <div className="nt-card" style={{ ...card, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9, cursor: href ? "pointer" : "default", textDecoration: "none", color: "inherit" }}>
      {icon}
      <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: TEXT, textAlign: "center" }}>{label}</span>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}
