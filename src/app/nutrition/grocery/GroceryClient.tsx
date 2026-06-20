"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShoppingBasket } from "lucide-react";

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

export interface GroceryItem { slug: string; name: string; amounts: string[]; recipes: string[] }
export interface GrocerySection { category: string; label: string; items: GroceryItem[] }

export default function GroceryClient({ sections, totalItems, weekStart, userId }: {
  sections: GrocerySection[]; totalItems: number; weekStart: string; userId: string;
}) {
  // Checked state persists per-user, per-week in localStorage (v1 — per device,
  // survives refresh, no schema change). Resets naturally when the week rolls.
  const storageKey = useMemo(() => `nura-grocery-${userId}-${weekStart}`, [userId, weekStart]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify([...checked])); } catch { /* ignore */ }
  }, [checked, hydrated, storageKey]);

  const toggle = useCallback((slug: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }, []);

  const gotCount = useMemo(() => {
    let n = 0;
    for (const s of sections) for (const i of s.items) if (checked.has(i.slug)) n++;
    return n;
  }, [sections, checked]);

  const Back = (
    <Link href="/nutrition" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none", alignSelf: "flex-start" }}>
      <ArrowLeft size={15} /> Nutrition
    </Link>
  );

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (totalItems === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {Back}
        <div style={{ ...card, padding: "44px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)` }}>
            <ShoppingBasket size={22} color={SAGE} />
          </div>
          <h1 style={{ ...heading, fontSize: 20 }}>Your grocery list is empty</h1>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: 0, maxWidth: 360 }}>
            Plan some meals to build your list.
          </p>
          <Link href="/nutrition" style={{ marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.10)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 999, padding: "9px 16px", textDecoration: "none" }}>
            Plan meals
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {Back}

      {/* Title */}
      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, marginBottom: 8 }}>This week</div>
        <h1 style={heading}>Grocery list</h1>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, margin: "8px 0 0" }}>
          {gotCount} of {totalItems} got · {totalItems - gotCount} to go
        </p>
      </div>

      {/* Sections (aisles) */}
      {sections.map((section) => {
        // Unchecked first; checked items sink to the bottom of their aisle.
        const ordered = [...section.items].sort((a, b) => {
          const ca = checked.has(a.slug) ? 1 : 0, cb = checked.has(b.slug) ? 1 : 0;
          return ca - cb || a.name.localeCompare(b.name);
        });
        return (
          <section key={section.category}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, marginBottom: 10 }}>
              {section.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ordered.map((item) => {
                const isChecked = checked.has(item.slug);
                const detail = item.amounts.length
                  ? item.amounts.join(" · ")
                  : item.recipes.length
                    ? `for ${item.recipes.join(", ")}`
                    : null;
                return (
                  <button
                    key={item.slug}
                    onClick={() => toggle(item.slug)}
                    className="gl-row"
                    style={{
                      ...card,
                      display: "flex", alignItems: "flex-start", gap: 12, width: "100%",
                      padding: "13px 15px", textAlign: "left", cursor: "pointer",
                      background: isChecked ? `rgba(${SAGE_RGB},0.05)` : SURFACE,
                      opacity: isChecked ? 0.6 : 1,
                      transition: "opacity 180ms, background 180ms, border-color 180ms",
                    }}
                  >
                    <span style={{
                      flexShrink: 0, width: 22, height: 22, marginTop: 1, borderRadius: 7,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isChecked ? SAGE : "transparent",
                      border: `1.5px solid ${isChecked ? SAGE : `rgba(${SAGE_RGB},0.4)`}`,
                      transition: "background 160ms, border-color 160ms",
                    }}>
                      {isChecked && <Check size={13} color="var(--nura-sage-bg-on)" strokeWidth={3} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: "block", fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
                        color: isChecked ? TEXT_TER : TEXT,
                        textDecoration: isChecked ? "line-through" : "none",
                      }}>
                        {item.name}
                      </span>
                      {detail && (
                        <span style={{ display: "block", fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, marginTop: 3, lineHeight: 1.45 }}>
                          {detail}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <style>{`
        .gl-row:hover { border-color: rgba(${SAGE_RGB},0.4); }
      `}</style>
    </div>
  );
}
