"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Clock, Leaf, Flame, Sprout, Heart, Zap, Droplet,
  UtensilsCrossed, ArrowRight, Globe,
} from "lucide-react";
import { sageGradient } from "@/lib/sageGradient";

// ── Design tokens (locked NŪRA system) ─────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const FG_RGB = "var(--nura-fg-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

// ── Types ───────────────────────────────────────────────────────────────────
export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  total_minutes: number | null;
  servings: number | null;
  is_organic: boolean;
  goal_tags: string[];
  system_tags: string[];
  status: string;
  ingredientNames: string[];
}

// ── Shared label maps ─────────────────────────────────────────────────────────
const CATEGORY_CHIPS: { value: string; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "dinner", label: "Dinner" },
  { value: "baking", label: "Baking" },
  { value: "snack", label: "Snacks" },
  { value: "drink", label: "Drinks" },
];

const GOALS: { tag: string; label: string; Icon: typeof Flame }[] = [
  { tag: "anti-inflammatory", label: "Anti-inflammatory", Icon: Flame },
  { tag: "gut-health", label: "Gut health", Icon: Sprout },
  { tag: "heart", label: "Heart & lipids", Icon: Heart },
  { tag: "energy", label: "Energy", Icon: Zap },
  { tag: "blood-sugar", label: "Blood sugar", Icon: Droplet },
];

const GOAL_LABEL: Record<string, string> = Object.fromEntries(
  GOALS.map((g) => [g.tag, g.label])
);

function prettyTag(t: string): string {
  return GOAL_LABEL[t] ?? t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function categoryLabel(v: string): string {
  const found = CATEGORY_CHIPS.find((c) => c.value === v);
  if (found) return found.label;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

// ── Recipe card (reused on detail page too) ───────────────────────────────────
export function RecipeCard({ r }: { r: Recipe }) {
  const primaryGoal = r.goal_tags[0];
  return (
    <Link
      href={`/recipes/${r.slug}`}
      className="rx-card"
      style={{
        display: "flex", flexDirection: "column",
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
        overflow: "hidden", textDecoration: "none", color: "inherit",
      }}
    >
      {/* Gradient placeholder */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4 / 3", background: sageGradient(r.slug) }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <UtensilsCrossed size={26} color={`rgba(${FG_RGB},0.20)`} strokeWidth={1.5} />
        </div>
        {r.is_organic && (
          <span style={{
            position: "absolute", top: 8, left: 8, display: "inline-flex", alignItems: "center", gap: 4,
            fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: SAGE, background: "rgba(13,13,14,0.55)", backdropFilter: "blur(4px)",
            border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 7, padding: "3px 7px",
          }}>
            <Leaf size={10} /> Organic
          </span>
        )}
        {r.status !== "published" && (
          <span style={{
            position: "absolute", top: 8, right: 8,
            fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
            color: TEXT_TER, background: "rgba(13,13,14,0.55)", backdropFilter: "blur(4px)",
            border: `0.5px solid ${BORDER}`, borderRadius: 6, padding: "2px 6px",
          }}>
            Draft
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TEXT_TER }}>
          {categoryLabel(r.category)}{r.cuisine ? ` · ${r.cuisine}` : ""}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 15.5, fontWeight: 600, color: TEXT, lineHeight: 1.25, letterSpacing: "-0.01em",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {r.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
          {r.total_minutes !== null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 11.5, color: TEXT_SEC }}>
              <Clock size={12} /> {r.total_minutes} min
            </span>
          )}
          {primaryGoal && (
            <span style={{
              fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em",
              color: SAGE, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`,
              borderRadius: 6, padding: "2px 7px",
            }}>
              {prettyTag(primaryGoal)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Filter model ──────────────────────────────────────────────────────────────
type Filter =
  | { kind: "all" }
  | { kind: "category"; value: string }
  | { kind: "goal"; value: string }
  | { kind: "cuisine"; value: string };

const ALL: Filter = { kind: "all" };

// ── Main client ──────────────────────────────────────────────────────────────
export default function RecipesBrowseClient({ recipes }: { recipes: Recipe[] }) {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [query, setQuery] = useState("");

  // Featured "recipe of the day": the most complete published recipe.
  const featured = useMemo(() => {
    const ranked = [...recipes].sort((a, b) => {
      const pub = (b.status === "published" ? 1 : 0) - (a.status === "published" ? 1 : 0);
      if (pub !== 0) return pub;
      return (b.description?.length ?? 0) - (a.description?.length ?? 0);
    });
    return ranked[0] ?? null;
  }, [recipes]);

  const cuisines = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.cuisine).filter((c): c is string => !!c))).sort(),
    [recipes]
  );

  const goalCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of recipes) for (const g of r.goal_tags) m[g] = (m[g] ?? 0) + 1;
    return m;
  }, [recipes]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      // active filter
      if (filter.kind === "category" && r.category !== filter.value) return false;
      if (filter.kind === "goal" && !r.goal_tags.includes(filter.value)) return false;
      if (filter.kind === "cuisine" && r.cuisine !== filter.value) return false;
      // search across title + ingredient names + cuisine
      if (q) {
        const hay = [r.title, r.cuisine ?? "", ...r.ingredientNames].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recipes, filter, query]);

  const filterLabel =
    filter.kind === "category" ? categoryLabel(filter.value)
    : filter.kind === "goal" ? prettyTag(filter.value)
    : filter.kind === "cuisine" ? filter.value
    : null;

  const sectionTitle: React.CSSProperties = {
    fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.02em",
    color: TEXT, margin: "0 0 12px",
  };

  return (
    <div>
      <style>{`
        .rx-card { transition: background 180ms, border-color 180ms, transform 180ms; }
        .rx-card:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-2px); }
        .rx-row { scrollbar-width: none; }
        .rx-row::-webkit-scrollbar { display: none; }
        .rx-tile { transition: background 180ms, border-color 180ms, transform 180ms; }
        .rx-tile:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-2px); }
        .rx-search:focus-within { border-color: rgba(var(--nura-sage-rgb),0.45); }
        .rx-search input::placeholder { color: var(--nura-text-tertiary); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: SAGE }}>
          Real food · real science
        </span>
        <h1 style={{ fontFamily: SANS, fontSize: "clamp(30px, 5vw, 40px)", fontWeight: 600, color: TEXT, margin: "6px 0 8px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Recipes
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, margin: 0, lineHeight: 1.55, maxWidth: 540 }}>
          Every dish, down to what it does in your cells.
        </p>
      </div>

      {/* Search */}
      <label
        className="rx-search"
        style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "11px 14px",
          transition: "border-color 180ms",
        }}
      >
        <Search size={16} color={TEXT_TER} style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes or ingredients…"
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontFamily: SANS, fontSize: 14, color: TEXT,
          }}
        />
      </label>

      {/* Recipe of the day */}
      {featured && query.trim() === "" && filter.kind === "all" && (
        <Link
          href={`/recipes/${featured.slug}`}
          className="rx-tile"
          style={{
            display: "block", position: "relative", borderRadius: 18, overflow: "hidden",
            border: `0.5px solid ${BORDER}`, textDecoration: "none", color: "inherit",
            marginBottom: 26, minHeight: 200, background: sageGradient(featured.slug),
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(13,13,14,0.82) 100%)" }} />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 200, padding: 18, gap: 6 }}>
            <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: SAGE }}>
              Recipe of the day
            </span>
            <h2 style={{ fontFamily: SANS, fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 600, color: "#f0ebde", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              {featured.title}
            </h2>
            {featured.description && (
              <p style={{
                fontFamily: SANS, fontSize: 13, color: "rgba(235,230,216,0.78)", margin: 0, lineHeight: 1.5, maxWidth: 520,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {featured.description}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              {featured.total_minutes !== null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontSize: 12, color: "rgba(235,230,216,0.78)" }}>
                  <Clock size={13} /> {featured.total_minutes} min
                </span>
              )}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: SAGE }}>
                View recipe <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* Category chips */}
      <div className="rx-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 24, WebkitOverflowScrolling: "touch" }}>
        {[{ value: "__all__", label: "All" }, ...CATEGORY_CHIPS].map((c) => {
          const active = c.value === "__all__" ? filter.kind === "all" : (filter.kind === "category" && filter.value === c.value);
          return (
            <button
              key={c.value}
              onClick={() => setFilter(c.value === "__all__" ? ALL : { kind: "category", value: c.value })}
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

      {/* Browse by goal */}
      <section style={{ marginBottom: 26 }}>
        <h3 style={sectionTitle}>Browse by goal</h3>
        <div className="rx-row" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {GOALS.map(({ tag, label, Icon }) => {
            const count = goalCounts[tag] ?? 0;
            const active = filter.kind === "goal" && filter.value === tag;
            return (
              <button
                key={tag}
                onClick={() => setFilter(active ? ALL : { kind: "goal", value: tag })}
                className="rx-tile"
                style={{
                  flexShrink: 0, width: 132, textAlign: "left",
                  display: "flex", flexDirection: "column", gap: 10,
                  background: SURFACE, border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                  borderRadius: 14, padding: 14, cursor: "pointer",
                }}
              >
                <span style={{ width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)` }}>
                  <Icon size={16} color={SAGE} />
                </span>
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: TEXT, lineHeight: 1.25 }}>{label}</div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 2 }}>
                    {count} {count === 1 ? "recipe" : "recipes"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Browse by cuisine */}
      {cuisines.length > 0 && (
        <section style={{ marginBottom: 26 }}>
          <h3 style={sectionTitle}>Browse by cuisine</h3>
          <div className="rx-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {cuisines.map((c) => {
              const active = filter.kind === "cuisine" && filter.value === c;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(active ? ALL : { kind: "cuisine", value: c })}
                  className="rx-tile"
                  style={{
                    flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 14px",
                    background: SURFACE, border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                    borderRadius: 999, cursor: "pointer",
                    fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: TEXT_SEC, whiteSpace: "nowrap",
                  }}
                >
                  <Globe size={13} color={SAGE} /> {c}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Explore by ingredient → /foods */}
      <Link
        href="/foods"
        className="rx-tile"
        style={{
          display: "flex", alignItems: "center", gap: 14, marginBottom: 28,
          background: `rgba(${SAGE_RGB},0.06)`, border: `0.5px solid rgba(${SAGE_RGB},0.22)`,
          borderRadius: 16, padding: 16, textDecoration: "none", color: "inherit",
        }}
      >
        <span style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)` }}>
          <Leaf size={20} color={SAGE} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: TEXT, letterSpacing: "-0.01em" }}>Explore by ingredient</div>
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, marginTop: 2 }}>Browse the foods knowledge base and what each does in your body.</div>
        </div>
        <ArrowRight size={18} color={SAGE} style={{ flexShrink: 0 }} />
      </Link>

      {/* Popular now / results */}
      <section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
          <h3 style={{ ...sectionTitle, margin: 0 }}>
            {filterLabel ? filterLabel : query.trim() ? "Results" : "Popular now"}
          </h3>
          {(filterLabel || query.trim()) && (
            <button
              onClick={() => { setFilter(ALL); setQuery(""); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 12, fontWeight: 600, color: SAGE, padding: 0 }}
            >
              Clear
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "56px 0" }}>
            <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: `rgba(${SAGE_RGB},0.7)`, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Nothing here yet
            </div>
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${SAGE_RGB},0.45)` }}>
              Try another filter
            </span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 14 }}>
            {visible.map((r) => <RecipeCard key={r.id} r={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}
