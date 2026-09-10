"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ScoreRing from "./ScoreRing";

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
// Packshots are shot on white by every brand. Giving the tile its own light
// ground keeps them consistent in both themes instead of leaving each product
// floating on a halo of its own background.
const PACKSHOT_BG = "#f4f2ee";
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
              objectFit: "contain", padding: "13%",
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
      `}</style>

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
    </div>
  );
}
