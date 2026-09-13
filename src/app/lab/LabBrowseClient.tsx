"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ScoreRing from "./ScoreRing";
import { categoryHeroImage, PRODUCTS_GRID } from "@/lib/category-heroes";

// ── Design tokens (locked NŪRA system) ─────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-sage-bg-on)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const FG_RGB = "var(--nura-fg-rgb)";
// Packshots are normalised to transparent PNGs, so the tile shows the card's
// own surface straight through. Anything opaque here would reappear as a plate
// sitting inside the card instead of a product sitting on it.
const PACKSHOT_BG = "transparent";
const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Types ───────────────────────────────────────────────────────────────────
export interface LabCategory {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number | null;
}

export interface LabProduct {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  score: number | null;
  lab_tested: boolean | null;
  image_url: string | null;
  category_id: string | null;
}

// ── Product card ────────────────────────────────────────────────────────────────
export function ProductCard({ p }: { p: LabProduct }) {
  return (
    <Link
      href={`/lab/${p.slug}`}
      className="lab-card"
      style={{
        display: "flex", flexDirection: "column",
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14,
        overflow: "hidden", textDecoration: "none", color: "inherit",
      }}
    >
      {/* Image */}
      {/* A locked square. The image is absolutely positioned so its intrinsic
          size can never push the tile taller than the aspect ratio — packshots
          arrive in every shape, and the grid has to stay uniform regardless.
          Contained, not cropped, on a white ground: product photography reads
          as premium only when the whole product is visible and every tile
          shares the same optical size. */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: PACKSHOT_BG, overflow: "hidden" }}>
        {p.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              // The square canvas already carries the margin, so the tile adds
              // none and the geometry is identical for every product.
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={`rgba(${FG_RGB},0.22)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        {p.score !== null && (
          <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(var(--nura-bg-rgb),0.72)", borderRadius: "50%", backdropFilter: "blur(4px)" }}>
            <ScoreRing score={p.score} />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
        {p.lab_tested && (
          <span style={{
            alignSelf: "flex-start",
            fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--nura-accent-label)", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
            borderRadius: 6, padding: "2px 6px", marginBottom: 2,
          }}>
            Lab tested
          </span>
        )}
        <div
          style={{
            fontFamily: SERIF, fontSize: 15.5, fontWeight: 500, color: TEXT, lineHeight: 1.25,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            // Reserve both lines so a one-line name and a two-line name produce
            // the same card height and the grid stays on a single baseline.
            minHeight: "calc(15.5px * 1.25 * 2)",
          }}
        >
          {p.name}
        </div>
        {p.brand && (
          <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.brand}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main client ──────────────────────────────────────────────────────────────
const ALL = "__all__";

export default function LabBrowseClient({ categories, products }: {
  categories: LabCategory[];
  products: LabProduct[];
}) {
  const [selected, setSelected] = useState<string>(ALL);
  const [view, setView] = useState<"products" | "browse">("products");

  // Parent groups (top-level categories), ordered
  const parents = useMemo(
    () => categories
      .filter((c) => c.parent_id === null)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories]
  );

  // Map every category id → its root (parent group) id
  const rootOf = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const cache = new Map<string, string>();
    const resolve = (id: string): string => {
      if (cache.has(id)) return cache.get(id)!;
      let cur = byId.get(id);
      const seen = new Set<string>();
      while (cur && cur.parent_id && !seen.has(cur.id)) {
        seen.add(cur.id);
        const next = byId.get(cur.parent_id);
        if (!next) break;
        cur = next;
      }
      const root = cur?.id ?? id;
      cache.set(id, root);
      return root;
    };
    const m = new Map<string, string>();
    for (const c of categories) m.set(c.id, resolve(c.id));
    return m;
  }, [categories]);

  // Category cards: the fixed list from the reference, each faced by the
  // best-scoring product in that category (or beneath it), falling back to
  // its curated flagship packshot until it has products of its own.
  const categoryCards = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const bySlug = new Map(categories.map((c) => [c.slug, c]));
    const ancestors = (id: string): string[] => {
      const out: string[] = [];
      let cur = byId.get(id);
      const seen = new Set<string>();
      while (cur && !seen.has(cur.id)) {
        seen.add(cur.id);
        out.push(cur.id);
        cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
      }
      return out;
    };
    const best = new Map<string, LabProduct>();
    for (const p of products) {
      if (!p.category_id) continue;
      for (const id of ancestors(p.category_id)) {
        const cur = best.get(id);
        if (!cur || (p.score ?? -1) > (cur.score ?? -1)) best.set(id, p);
      }
    }
    return PRODUCTS_GRID.map((entry) => {
      const cat = bySlug.get(entry.slug);
      const hero = cat ? best.get(cat.id) ?? null : null;
      return {
        key: entry.slug,
        label: entry.label,
        slug: entry.slug,
        image: hero?.image_url ?? categoryHeroImage(entry.heroSlug ?? entry.slug),
        alt: hero?.name ?? entry.label,
      };
    }).filter((c) => c.image);
  }, [categories, products]);

  const visible = useMemo(() => {
    if (selected === ALL) return products;
    return products.filter((p) => p.category_id && rootOf.get(p.category_id) === selected);
  }, [products, selected, rootOf]);

  const chips = [{ id: ALL, name: "All" }, ...parents.map((p) => ({ id: p.id, name: p.name }))];

  return (
    <div>
      <style>{`
        .lab-card { transition: background 180ms, border-color 180ms, transform 180ms; }
        .lab-card:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-2px); }
        .lab-chip-row { scrollbar-width: none; }
        .lab-chip-row::-webkit-scrollbar { display: none; }
        .lab-cat-card:hover .lab-cat-arrow { opacity: 1; transform: translateX(0); }
        @media (max-width: 560px) { .lab-cat-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* View toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
        <div
          role="tablist"
          style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: SURFACE, border: `0.5px solid ${BORDER}` }}
        >
          {([["products", "Products"], ["browse", "Browse all"]] as const).map(([key, label]) => {
            const active = view === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setView(key)}
                style={{
                  padding: "8px 20px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: active ? SAGE : "transparent",
                  color: active ? SAGE_ON : TEXT_SEC,
                  fontFamily: SANS, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.03em",
                  transition: "background 180ms, color 180ms",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "products" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 34 }}>
            <h1 style={{ fontFamily: SANS, fontSize: "clamp(26px, 4vw, 32px)", fontWeight: 500, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
              Top Rated Products
            </h1>
            <p style={{ fontFamily: SANS, fontSize: 15, color: TEXT_SEC, margin: "0 0 8px", lineHeight: 1.55 }}>
              The healthiest products ranked based on the latest science.
            </p>
            <Link href="/lab/how-we-score" style={{ fontFamily: SANS, fontSize: 13, color: SAGE, textDecoration: "none" }}>
              How we score
            </Link>
          </div>

          <div className="lab-cat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900, margin: "0 auto" }}>
            {categoryCards.map(({ key, label, slug, image, alt }) => (
              <Link
                key={key}
                href={`/lab/category/${slug}`}
                className="lab-card lab-cat-card"
                style={{
                  position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end",
                  minHeight: 204, padding: "18px 20px 16px",
                  background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 18,
                  textDecoration: "none", color: "inherit", overflow: "hidden",
                }}
              >
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={alt}
                    loading="lazy"
                    style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%) scale(1.18)", transformOrigin: "top center", height: 138, width: 138, objectFit: "contain", display: "block" }}
                  />
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontFamily: SANS, fontSize: 16.5, fontWeight: 600, color: TEXT, letterSpacing: "-0.01em" }}>
                    {label}
                  </span>
                  <span className="lab-cat-arrow" aria-hidden style={{ color: TEXT_TER, fontSize: 16, opacity: 0, transition: "opacity 160ms, transform 160ms", transform: "translateX(-4px)" }}>
                    ›
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {view === "browse" && (<>
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--nura-accent-label)" }}>
          Lab
        </span>
        <h1 style={{ fontFamily: SANS, fontSize: "clamp(30px, 5vw, 40px)", fontWeight: 600, color: TEXT, margin: "6px 0 8px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Product testing
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, margin: 0, lineHeight: 1.55, maxWidth: 540 }}>
          Independent scores for what you put in and on your body — from water to supplements to skincare.
        </p>
      </div>

      {/* Category chips */}
      <div
        className="lab-chip-row"
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20, WebkitOverflowScrolling: "touch" }}
      >
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
                color: active ? SAGE_ON : TEXT_SEC,
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "background 180ms, border-color 180ms, color 180ms",
              }}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Grid / empty state */}
      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: `rgba(${SAGE_RGB},0.7)`, marginBottom: 8, letterSpacing: "-0.02em" }}>
            No products yet
          </div>
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: `rgba(${SAGE_RGB},0.45)` }}>
            Check back soon
          </span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
          {visible.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
      </>)}
    </div>
  );
}
