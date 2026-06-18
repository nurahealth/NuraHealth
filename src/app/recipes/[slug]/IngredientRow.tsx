"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

export interface RecipeIngredient {
  slug: string | null;          // ingredient slug (null if the ingredient row is missing)
  name: string;                 // resolved ingredient name, or join fallback
  amountText: string | null;
  primarySystem: string | null;
  contextNote: string | null;
  primaryCompound: string | null;
  explainerHeading: string | null;
  explainerBody: string | null;
  tagline: string | null;
}

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// A single expandable ingredient row. Collapsed: name + amount + system tag.
// Expanded: a concise cellular note (primary compound + first explainer block,
// or the context note / tagline as a fallback) plus a link to the full profile.
export default function IngredientRow({ ing }: { ing: RecipeIngredient }) {
  const [open, setOpen] = useState(false);

  const hasDetail = !!(ing.explainerBody || ing.contextNote || ing.tagline || ing.primaryCompound);

  return (
    <div style={{ background: SURFACE, border: `0.5px solid ${open ? `rgba(${SAGE_RGB},0.3)` : BORDER}`, borderRadius: 12, transition: "border-color 180ms" }}>
      <button
        type="button"
        onClick={() => hasDetail && setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "13px 14px", background: "none", border: "none",
          cursor: hasDetail ? "pointer" : "default", color: "inherit", textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: TEXT, letterSpacing: "-0.01em" }}>
            {ing.name}
          </div>
          {ing.amountText && (
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, marginTop: 2 }}>{ing.amountText}</div>
          )}
        </div>

        {ing.primarySystem && (
          <span style={{
            flexShrink: 0, fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em",
            color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`,
            borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
          }}>
            {pretty(ing.primarySystem)}
          </span>
        )}

        {hasDetail && (
          <ChevronDown
            size={17} color={TEXT_TER}
            style={{ flexShrink: 0, transition: "transform 260ms cubic-bezier(0.4,0,0.2,1)", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        )}
      </button>

      {/* Expandable body */}
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 280ms cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ padding: "0 14px 14px" }}>
            <div style={{ borderTop: `0.5px solid ${BORDER}`, paddingTop: 12 }}>
              {ing.primaryCompound && (
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: SAGE, marginBottom: 6 }}>
                  Key compound · {ing.primaryCompound}
                </div>
              )}
              {ing.explainerHeading && (
                <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: TEXT, marginBottom: 4, letterSpacing: "-0.01em" }}>
                  {ing.explainerHeading}
                </div>
              )}
              <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, lineHeight: 1.6, margin: 0 }}>
                {ing.explainerBody ?? ing.contextNote ?? ing.tagline}
              </p>
              {ing.contextNote && ing.explainerBody && (
                <p style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, lineHeight: 1.55, margin: "8px 0 0", fontStyle: "italic" }}>
                  {ing.contextNote}
                </p>
              )}
              {ing.slug && (
                <Link
                  href={`/foods/${ing.slug}`}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, textDecoration: "none" }}
                >
                  Full food profile <ArrowRight size={13} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
