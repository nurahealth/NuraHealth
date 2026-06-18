"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { sageGradient } from "@/lib/sageGradient";

// ── Design tokens ───────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const FG_RGB = "var(--nura-fg-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

export interface Food {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  is_organic: boolean;
  supports_systems: string[];
}

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Food card (reused on recipe/ingredient detail pages) ──────────────────────
export function FoodCard({ f }: { f: Food }) {
  return (
    <Link
      href={`/foods/${f.slug}`}
      className="fd-card"
      style={{
        display: "flex", flexDirection: "column",
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
        overflow: "hidden", textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 2", background: sageGradient(f.slug) }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Leaf size={24} color={`rgba(${FG_RGB},0.20)`} strokeWidth={1.5} />
        </div>
      </div>
      <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT, letterSpacing: "-0.01em" }}>{f.name}</div>
        {f.supports_systems.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {f.supports_systems.slice(0, 2).map((s) => (
              <span key={s} style={{
                fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em",
                color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`,
                borderRadius: 6, padding: "2px 7px",
              }}>
                {pretty(s)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main client ──────────────────────────────────────────────────────────────
const ALL = "__all__";

export default function FoodsBrowseClient({ foods }: { foods: Food[] }) {
  const [selected, setSelected] = useState<string>(ALL);

  const categories = useMemo(
    () => Array.from(new Set(foods.map((f) => f.category))).sort(),
    [foods]
  );

  const visible = useMemo(
    () => (selected === ALL ? foods : foods.filter((f) => f.category === selected)),
    [foods, selected]
  );

  const chips = [{ id: ALL, label: "All" }, ...categories.map((c) => ({ id: c, label: pretty(c) }))];

  return (
    <div>
      <style>{`
        .fd-card { transition: background 180ms, border-color 180ms, transform 180ms; }
        .fd-card:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-2px); }
        .fd-row { scrollbar-width: none; }
        .fd-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: SAGE }}>
          The knowledge base
        </span>
        <h1 style={{ fontFamily: SANS, fontSize: "clamp(30px, 5vw, 40px)", fontWeight: 600, color: TEXT, margin: "6px 0 8px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Foods
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, margin: 0, lineHeight: 1.55, maxWidth: 540 }}>
          Explore whole foods and what each one does in your body.
        </p>
      </div>

      {/* Category chips */}
      <div className="fd-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20, WebkitOverflowScrolling: "touch" }}>
        {chips.map((c) => {
          const active = c.id === selected;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              style={{
                flexShrink: 0, padding: "8px 16px",
                background: active ? SAGE : "transparent",
                border: `0.5px solid ${active ? SAGE : BORDER}`,
                borderRadius: 999,
                fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
                color: active ? "var(--nura-sage-bg-on)" : TEXT_SEC,
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "background 180ms, border-color 180ms, color 180ms",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 0" }}>
          <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: `rgba(${SAGE_RGB},0.7)`, marginBottom: 6, letterSpacing: "-0.02em" }}>
            No foods yet
          </div>
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${SAGE_RGB},0.45)` }}>
            Check back soon
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
          {visible.map((f) => <FoodCard key={f.id} f={f} />)}
        </div>
      )}
      <div style={{ height: 6 }} />
      <div style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_TER, marginTop: 18 }}>
        {visible.length} {visible.length === 1 ? "food" : "foods"}
      </div>
    </div>
  );
}
