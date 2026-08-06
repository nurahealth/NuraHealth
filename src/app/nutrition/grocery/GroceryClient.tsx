"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ShoppingBasket, Plus, Check, Trash2, X, RefreshCw, RotateCcw, Loader2 } from "lucide-react";

// ── Design tokens (locked system — same as the rest of /nutrition) ────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const DANGER = "var(--nura-danger)";

const card: React.CSSProperties = { background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 };
const heading: React.CSSProperties = { fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: 0, letterSpacing: "-0.02em" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none", boxSizing: "border-box" };
const labelStyle: React.CSSProperties = { display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6 };

// Aisle ordering + labels (known categories first, then any others).
const CATEGORY_ORDER = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit", "other"];
const CATEGORY_LABELS: Record<string, string> = {
  "root-spice": "Roots & Spices", greens: "Greens", legumes: "Legumes",
  "good-fats": "Good Fats", ferments: "Ferments", protein: "Protein", fruit: "Fruit", other: "Other",
};
const CATEGORY_OPTIONS = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit", "other"];

function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Normalized ingredient key for dedup — trimmed, lower-cased name.
function nameKey(s: string): string {
  return s.trim().toLowerCase();
}

// Split an amount_text back into its individual " · "-joined parts.
function amountParts(s: string | null): string[] {
  return (s ?? "").split(" · ").map((p) => p.trim()).filter(Boolean);
}

export interface GroceryItem {
  id: string; name: string; amount_text: string | null; category: string;
  is_checked: boolean; source: "plan" | "manual"; sort_order: number;
}
export interface PlanItem { name: string; amount_text: string | null; category: string }

type Draft = { name: string; amount_text: string; category: string };
type ModalState = { mode: "add" } | { mode: "edit"; item: GroceryItem } | null;

export default function GroceryClient({ items: initial, planItems, tableReady, userId }: {
  items: GroceryItem[]; planItems: PlanItem[]; tableReady: boolean; userId: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<GroceryItem[]>(initial);
  const [modal, setModal] = useState<ModalState>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const nextSort = useCallback(() => items.reduce((m, i) => Math.max(m, i.sort_order), -1) + 1, [items]);

  // ── Check off (optimistic; persist in background) ───────────────────────────
  const toggleCheck = async (item: GroceryItem) => {
    const next = !item.is_checked;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_checked: next } : i)));
    const { error: e } = await supabase
      .from("grocery_items")
      .update({ is_checked: next, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("user_id", userId);
    if (e) { setError("Couldn't save that. Refreshing…"); router.refresh(); }
  };

  // ── Add / edit (shared modal) ───────────────────────────────────────────────
  const saveDraft = async (draft: Draft) => {
    setError(""); setInfo("");
    const name = draft.name.trim();
    if (!name) { setError("Name is required."); return; }
    const amount = draft.amount_text.trim() || null;

    if (modal?.mode === "edit") {
      const id = modal.item.id;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name, amount_text: amount, category: draft.category } : i)));
      setModal(null);
      const { error: e } = await supabase
        .from("grocery_items")
        .update({ name, amount_text: amount, category: draft.category, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userId);
      if (e) { setError("Couldn't save your edit. Refreshing…"); router.refresh(); }
    } else {
      const { data, error: e } = await supabase
        .from("grocery_items")
        .insert({ user_id: userId, name, amount_text: amount, category: draft.category, source: "manual", is_checked: false, sort_order: nextSort() })
        .select("id, name, amount_text, category, is_checked, source, sort_order")
        .single();
      if (e || !data) { setError("Couldn't add that item. Please try again."); return; }
      setItems((prev) => [...prev, data as GroceryItem]);
      setModal(null);
    }
  };

  // ── Remove ──────────────────────────────────────────────────────────────────
  const removeItem = async (id: string) => {
    if (removingId) return;
    setRemovingId(id); setError(""); setInfo("");
    const { error: e } = await supabase.from("grocery_items").delete().eq("id", id).eq("user_id", userId);
    if (e) { setError("Couldn't remove that item. Please try again."); setRemovingId(null); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setRemovingId(null);
  };

  // ── Refresh from plan ────────────────────────────────────────────────────────
  // Matches plan ingredients to existing rows by name: merges amounts into an
  // existing PLAN row, skips names already present as a MANUAL row (never touched),
  // and only inserts genuinely-new ingredients — so it can never make a duplicate.
  const refreshFromPlan = async () => {
    if (refreshing) return;
    setRefreshing(true); setError(""); setInfo("");

    const byName = new Map(items.map((i) => [nameKey(i.name), i]));

    // Collapse the incoming plan items by name first (defensive), unioning amounts.
    const planByName = new Map<string, PlanItem>();
    for (const p of planItems) {
      const k = nameKey(p.name);
      const prev = planByName.get(k);
      if (prev) {
        const amts = new Set([...amountParts(prev.amount_text), ...amountParts(p.amount_text)]);
        prev.amount_text = amts.size ? [...amts].join(" · ") : null;
      } else {
        planByName.set(k, { ...p });
      }
    }

    const toInsert: PlanItem[] = [];
    const toUpdate: { item: GroceryItem; amount_text: string | null }[] = [];
    for (const [k, p] of planByName) {
      const existing = byName.get(k);
      if (!existing) { toInsert.push(p); continue; }
      if (existing.source === "manual") continue; // leave manual items alone
      const amts = new Set([...amountParts(existing.amount_text), ...amountParts(p.amount_text)]);
      const merged = amts.size ? [...amts].join(" · ") : null;
      if (merged !== existing.amount_text) toUpdate.push({ item: existing, amount_text: merged });
    }

    if (toInsert.length === 0 && toUpdate.length === 0) {
      setInfo("Your list is already up to date with this week's plan.");
      setRefreshing(false);
      return;
    }

    try {
      for (const u of toUpdate) {
        const { error: e } = await supabase
          .from("grocery_items")
          .update({ amount_text: u.amount_text, updated_at: new Date().toISOString() })
          .eq("id", u.item.id)
          .eq("user_id", userId);
        if (e) throw e;
      }

      let inserted: GroceryItem[] = [];
      if (toInsert.length) {
        let s = nextSort();
        const rows = toInsert.map((p) => ({ user_id: userId, name: p.name, amount_text: p.amount_text, category: p.category, source: "plan" as const, is_checked: false, sort_order: s++ }));
        const { data, error: e } = await supabase
          .from("grocery_items")
          .insert(rows)
          .select("id, name, amount_text, category, is_checked, source, sort_order");
        if (e) throw e;
        inserted = (data ?? []) as GroceryItem[];
      }

      setItems((prev) => {
        const upd = new Map(toUpdate.map((u) => [u.item.id, u.amount_text]));
        const nextRows = prev.map((i) => (upd.has(i.id) ? { ...i, amount_text: upd.get(i.id)! } : i));
        return [...nextRows, ...inserted];
      });

      const parts: string[] = [];
      if (inserted.length) parts.push(`added ${inserted.length} new item${inserted.length === 1 ? "" : "s"}`);
      if (toUpdate.length) parts.push(`merged ${toUpdate.length}`);
      setInfo(`Refreshed from your plan — ${parts.join(", ")}.`);
    } catch {
      setError("Couldn't refresh from your plan. Please try again.");
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  // ── Uncheck all (reset the list for the next shopping trip) ──────────────────
  const uncheckAll = async () => {
    const checkedIds = items.filter((i) => i.is_checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    setItems((prev) => prev.map((i) => (i.is_checked ? { ...i, is_checked: false } : i)));
    const { error: e } = await supabase
      .from("grocery_items")
      .update({ is_checked: false, updated_at: new Date().toISOString() })
      .in("id", checkedIds)
      .eq("user_id", userId);
    if (e) { setError("Couldn't reset the list. Refreshing…"); router.refresh(); }
  };

  // ── Grouping + counter ──────────────────────────────────────────────────────
  const sections = useMemo(() => {
    const byCat = new Map<string, GroceryItem[]>();
    for (const it of items) { const a = byCat.get(it.category) ?? []; a.push(it); byCat.set(it.category, a); }
    const cats = [...byCat.keys()].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
    return cats.map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? pretty(cat),
      // Stable position — do NOT reorder on check, or a tapped row visibly jumps
      // past its neighbor and looks like the wrong item toggled. Checked rows dim
      // in place instead.
      items: byCat.get(cat)!.slice().sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    }));
  }, [items]);

  const total = items.length;
  const got = items.filter((i) => i.is_checked).length;

  const Back = (
    <Link href="/nutrition" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT_SEC, textDecoration: "none", alignSelf: "flex-start" }}>
      <ArrowLeft size={15} /> Nutrition
    </Link>
  );

  const banner = (
    <>
      {!tableReady && (
        <div className="nura-card" style={{ ...card, padding: "11px 14px", borderColor: "var(--nura-tint-warn-border)", background: "var(--nura-tint-warn)", fontFamily: SANS, fontSize: 12.5, color: "var(--nura-good)", lineHeight: 1.5 }}>
          Run the new migration (<code>20260619000003_grocery_items.sql</code>) to enable saving your grocery list.
        </div>
      )}
      {error && <div className="nura-card" style={{ ...card, padding: "11px 14px", borderColor: "var(--nura-tint-danger-border)", background: "var(--nura-tint-danger)", fontFamily: SANS, fontSize: 13, color: DANGER }}>{error}</div>}
      {info && <div className="nura-card" style={{ ...card, padding: "11px 14px", borderColor: `rgba(${SAGE_RGB},0.4)`, background: `rgba(${SAGE_RGB},0.08)`, fontFamily: SANS, fontSize: 13, color: "var(--nura-accent-text)" }}>{info}</div>}
    </>
  );

  const actionRow = (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button onClick={() => { setError(""); setInfo(""); setModal({ mode: "add" }); }} style={{ flex: 1, minWidth: 130, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: "var(--nura-sage-bg-on)", background: SAGE, border: "none", borderRadius: 12, padding: "11px 16px", cursor: "pointer" }}>
        <Plus size={15} /> Add item
      </button>
      <button onClick={refreshFromPlan} disabled={refreshing} style={{ flex: 1, minWidth: 130, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.10)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 12, padding: "11px 16px", cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.7 : 1 }}>
        {refreshing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={14} />} Refresh from plan
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {Back}

      <div>
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", marginBottom: 8 }}>This week</div>
        <h1 style={heading}>Grocery list</h1>
        {total > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 0", flexWrap: "wrap" }}>
            <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, margin: 0 }}>
              {got} of {total} got · {total - got} to go
            </p>
            {got > 0 && (
              <button
                onClick={uncheckAll}
                className="gl-uncheck"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: TEXT_SEC, background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 999, padding: "4px 10px", cursor: "pointer", transition: "color 160ms, border-color 160ms" }}
              >
                <RotateCcw size={11} /> Uncheck all
              </button>
            )}
          </div>
        )}
      </div>

      {banner}
      {actionRow}

      {total === 0 ? (
        <div className="nura-card" style={{ ...card, padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)` }}>
            <ShoppingBasket size={22} color={SAGE} />
          </div>
          <h2 style={{ ...heading, fontSize: 19 }}>Your grocery list is empty</h2>
          <p style={{ fontFamily: SANS, fontSize: 14, color: TEXT_SEC, lineHeight: 1.6, margin: 0, maxWidth: 360 }}>
            {planItems.length > 0 ? "Pull this week's ingredients from your plan, or add your own." : "Plan some meals, or add your own items to build your list."}
          </p>
        </div>
      ) : (
        sections.map((section) => (
          <section key={section.category}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--nura-accent-label)", marginBottom: 10 }}>{section.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {section.items.map((item) => {
                const checked = item.is_checked;
                return (
                  <div key={item.id} className="gl-row" style={{ ...card, display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: checked ? `rgba(${SAGE_RGB},0.05)` : SURFACE, opacity: checked ? 0.6 : 1, transition: "opacity 180ms, background 180ms, border-color 180ms" }}>
                    {/* Checkbox */}
                    <button onClick={() => toggleCheck(item)} aria-label={checked ? "Uncheck" : "Check off"} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: checked ? SAGE : "transparent", border: `1.5px solid ${checked ? SAGE : `rgba(${SAGE_RGB},0.4)`}`, cursor: "pointer", transition: "background 160ms, border-color 160ms" }}>
                      {checked && <Check size={14} color="var(--nura-sage-bg-on)" strokeWidth={3} />}
                    </button>

                    {/* Name + amount → tap to edit */}
                    <button onClick={() => { setError(""); setInfo(""); setModal({ mode: "edit", item }); }} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{ display: "block", fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: checked ? TEXT_TER : TEXT, textDecoration: checked ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                      {item.amount_text && <span style={{ display: "block", fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, marginTop: 3, lineHeight: 1.4 }}>{item.amount_text}</span>}
                    </button>

                    {/* Remove */}
                    <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} className="gl-trash" style={{ flexShrink: 0, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, cursor: "pointer" }}>
                      {removingId === item.id ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {modal && <ItemModal mode={modal.mode} initial={modal.mode === "edit" ? modal.item : null} onClose={() => setModal(null)} onSave={saveDraft} />}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .gl-row:hover { border-color: rgba(${SAGE_RGB},0.4); }
        .gl-trash:hover { border-color: rgba(var(--nura-danger-rgb),0.45) !important; color: ${DANGER} !important; }
        .gl-uncheck:hover { border-color: rgba(${SAGE_RGB},0.45); color: ${SAGE}; }
      `}</style>
    </div>
  );
}

// ── Add / edit modal (centered) ───────────────────────────────────────────────
function ItemModal({ mode, initial, onClose, onSave }: { mode: "add" | "edit"; initial: GroceryItem | null; onClose: () => void; onSave: (d: Draft) => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(initial?.amount_text ?? "");
  const [category, setCategory] = useState(initial?.category ?? "other");

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "var(--nura-bg)", borderRadius: 22, border: `0.5px solid var(--nura-border-strong)`, padding: "18px 18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: TEXT }}>{mode === "edit" ? "Edit item" : "Add item"}</span>
          <button onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8, color: TEXT_SEC, cursor: "pointer" }}><X size={13} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Name <span style={{ color: DANGER }}>*</span></label>
            <input value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder="e.g. Olive oil" style={inputStyle} onKeyDown={(e) => { if (e.key === "Enter") onSave({ name, amount_text: amount, category }); }} />
          </div>
          <div>
            <label style={labelStyle}>Amount</label>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Optional — e.g. 2 cloves" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Aisle</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] ?? pretty(c)}</option>)}
            </select>
          </div>
        </div>

        <button onClick={() => onSave({ name, amount_text: amount, category })} style={{ width: "100%", marginTop: 18, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", background: SAGE, color: "var(--nura-sage-bg-on)", fontFamily: SANS, fontSize: 13, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {mode === "edit" ? "Save" : "Add"}
        </button>
      </div>
    </div>
  );
}
