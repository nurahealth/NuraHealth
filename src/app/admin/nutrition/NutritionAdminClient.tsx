"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, X, Pencil, Trash2, RefreshCw, Shield, Search,
  ChevronUp, ChevronDown, Loader2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import NuraPlexus from "@/components/NuraPlexus";

// ── Design tokens (locked NŪRA system — same as the Lab admin) ────────────────
const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const BORDER_STRONG = "var(--nura-border-strong)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-sage-bg-on)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const FG_RGB = "var(--nura-fg-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";
const DANGER = "#FF4C5C";

const RECIPE_CATEGORIES = ["breakfast", "lunch", "dinner", "baking", "snack", "drink"];
const INGREDIENT_CATEGORIES = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit"];
type Status = "draft" | "published";

// ── Types (mirror the public /recipes and /foods schema) ──────────────────────
interface Block { heading?: string; body?: string }
interface Step { n?: number; text?: string }

export interface AdminIngredient {
  id: string; slug: string; name: string; category: string;
  tagline: string | null; is_organic: boolean;
  supports_systems: string[] | null; active_compounds: string[] | null; pairs_with: string[] | null;
  cellular_explainer: Block[] | null; how_to_use: Step[] | null;
  status: string; created_at?: string;
}

export interface AdminRecipe {
  id: string; slug: string; title: string; description: string | null;
  category: string; cuisine: string | null; total_minutes: number | null; servings: number | null;
  is_organic: boolean; goal_tags: string[] | null; system_tags: string[] | null; allergen_flags: string[] | null;
  method_steps: Step[] | null; hero_style: string | null; status: string; created_at?: string;
}

interface RecipeLink {
  ingredient_id: string;
  amount_text: string;
  primary_system: string;
  context_note: string;
}

// ── Shared primitives ─────────────────────────────────────────────────────────
function Eyebrow({ children, color, size = 10 }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <span style={{ fontFamily: SANS, fontSize: size, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: color ?? TEXT_TER }}>
      {children}
    </span>
  );
}
function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: 16, ...style }}>{children}</div>;
}
function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: published ? SAGE : TEXT_TER, background: published ? `rgba(${SAGE_RGB},0.14)` : `rgba(${FG_RGB},0.06)`, border: `0.5px solid ${published ? `rgba(${SAGE_RGB},0.35)` : BORDER}`, borderRadius: 8, padding: "3px 8px" }}>
      {published ? "Published" : "Draft"}
    </span>
  );
}
function pretty(t: string): string {
  return t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", background: SURFACE, border: `0.5px solid ${BORDER}`,
  borderRadius: 10, fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
  letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
};
const miniBtn: React.CSSProperties = {
  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 8, color: TEXT_SEC, cursor: "pointer", flexShrink: 0,
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label} {required && <span style={{ color: DANGER }}>*</span>}</label>
      {children}
    </div>
  );
}

// ── Status pill selector ──────────────────────────────────────────────────────
function StatusSelect({ status, onChange }: { status: Status; onChange: (s: Status) => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {(["draft", "published"] as Status[]).map((s) => {
        const active = status === s;
        return (
          <button key={s} type="button" onClick={() => onChange(s)} style={{ flex: 1, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? SAGE : TEXT_TER, cursor: "pointer", transition: "background 180ms, border-color 180ms, color 180ms" }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${active ? SAGE : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: SAGE }} />}
            </span>
            {s === "draft" ? "Draft" : "Published"}
          </button>
        );
      })}
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle, onLabel, offLabel }: { on: boolean; onToggle: () => void; onLabel: string; offLabel: string }) {
  return (
    <button type="button" onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", background: on ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${on ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 10, cursor: "pointer", transition: "background 180ms, border-color 180ms" }}>
      <span style={{ width: 38, height: 22, borderRadius: 999, flexShrink: 0, position: "relative", background: on ? SAGE : `rgba(${FG_RGB},0.18)`, transition: "background 180ms" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 180ms" }} />
      </span>
      <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: on ? SAGE : TEXT_SEC }}>{on ? onLabel : offLabel}</span>
    </button>
  );
}

// ── Tag input (chips; add on Enter or comma) ──────────────────────────────────
function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const t = raw.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div style={{ ...inputStyle, padding: 8, display: "flex", flexWrap: "wrap", gap: 6, minHeight: 42, cursor: "text" }}>
      {value.map((t) => (
        <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 999, padding: "3px 9px", fontFamily: SANS, fontSize: 12, fontWeight: 500, color: SAGE }}>
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} style={{ background: "none", border: "none", cursor: "pointer", color: SAGE, display: "flex", padding: 0 }}><X size={11} /></button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1)); }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : (placeholder ?? "Type and press Enter")}
        style={{ flex: 1, minWidth: 120, background: "none", border: "none", outline: "none", fontFamily: SANS, fontSize: 13.5, color: TEXT, padding: "3px 2px" }}
      />
    </div>
  );
}

// ── Multi-select from existing ingredient slugs (pairs_with) ───────────────────
function SlugMultiSelect({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: { slug: string; name: string }[] }) {
  const available = options.filter((o) => !value.includes(o.slug));
  const nameOf = (slug: string) => options.find((o) => o.slug === slug)?.name ?? pretty(slug);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <select value="" onChange={(e) => { if (e.target.value) onChange([...value, e.target.value]); }} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
        <option value="">Add an ingredient…</option>
        {available.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
      </select>
      {value.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {value.map((slug) => (
            <span key={slug} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, borderRadius: 999, padding: "4px 10px", fontFamily: SANS, fontSize: 12, fontWeight: 500, color: SAGE }}>
              {nameOf(slug)}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== slug))} style={{ background: "none", border: "none", cursor: "pointer", color: SAGE, display: "flex", padding: 0 }}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reorder controls ──────────────────────────────────────────────────────────
function ReorderButtons({ i, len, move }: { i: number; len: number; move: (from: number, to: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
      <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} style={{ ...miniBtn, width: 26, height: 22, opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={13} /></button>
      <button type="button" disabled={i === len - 1} onClick={() => move(i, i + 1)} style={{ ...miniBtn, width: 26, height: 22, opacity: i === len - 1 ? 0.3 : 1 }}><ChevronDown size={13} /></button>
    </div>
  );
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ── Repeatable numbered text rows (method_steps / how_to_use) ─────────────────
function StepEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value.map((text, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ flexShrink: 0, width: 26, height: 26, marginTop: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: SAGE }}>{i + 1}</span>
          <textarea value={text} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} rows={2} placeholder={placeholder} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
          <ReorderButtons i={i} len={value.length} move={(f, t) => onChange(move(value, f, t))} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...miniBtn, marginTop: 0, color: DANGER }}><Trash2 size={13} /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, ""])} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "transparent", border: `0.5px dashed rgba(${SAGE_RGB},0.4)`, borderRadius: 10, color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Plus size={13} /> Add step</button>
    </div>
  );
}

// ── Repeatable heading + body blocks (cellular_explainer) ─────────────────────
function BlockEditor({ value, onChange }: { value: Block[]; onChange: (v: Block[]) => void }) {
  const set = (i: number, patch: Partial<Block>) => onChange(value.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {value.map((b, i) => (
        <div key={i} style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderLeft: `3px solid rgba(${SAGE_RGB},0.5)`, borderRadius: 12, padding: 12, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={b.heading ?? ""} onChange={(e) => set(i, { heading: e.target.value })} placeholder="Block heading (e.g. It quiets your master inflammation switch)" style={{ ...inputStyle, fontWeight: 600 }} />
            <textarea value={b.body ?? ""} onChange={(e) => set(i, { body: e.target.value })} rows={4} placeholder="The mechanistic explanation in plain language…" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <ReorderButtons i={i} len={value.length} move={(f, t) => onChange(move(value, f, t))} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...miniBtn, color: DANGER }}><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { heading: "", body: "" }])} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "transparent", border: `0.5px dashed rgba(${SAGE_RGB},0.4)`, borderRadius: 10, color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Plus size={13} /> Add block</button>
    </div>
  );
}

// ── Recipe ↔ ingredient link editor ──────────────────────────────────────────
function LinkEditor({ value, onChange, ingredients }: { value: RecipeLink[]; onChange: (v: RecipeLink[]) => void; ingredients: AdminIngredient[] }) {
  const set = (i: number, patch: Partial<RecipeLink>) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {value.map((l, i) => (
        <div key={i} style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 12, display: "flex", gap: 8 }}>
          <span style={{ flexShrink: 0, width: 24, height: 24, marginTop: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, fontFamily: SANS, fontSize: 11, fontWeight: 600, color: SAGE }}>{i + 1}</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <select value={l.ingredient_id} onChange={(e) => set(i, { ingredient_id: e.target.value })} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="">Select an ingredient…</option>
              {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={l.amount_text} onChange={(e) => set(i, { amount_text: e.target.value })} placeholder="Amount (e.g. 2 cloves)" style={inputStyle} />
              <input value={l.primary_system} onChange={(e) => set(i, { primary_system: e.target.value })} placeholder="Primary system (e.g. immune)" style={inputStyle} />
            </div>
            <input value={l.context_note} onChange={(e) => set(i, { context_note: e.target.value })} placeholder="Context note (optional)" style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <ReorderButtons i={i} len={value.length} move={(f, t) => onChange(move(value, f, t))} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} style={{ ...miniBtn, color: DANGER }}><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { ingredient_id: "", amount_text: "", primary_system: "", context_note: "" }])} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "transparent", border: `0.5px dashed rgba(${SAGE_RGB},0.4)`, borderRadius: 10, color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Plus size={13} /> Add ingredient</button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({ title, busy, onClose, error, children, onSave }: { title: string; busy: boolean; onClose: () => void; error: string; children: React.ReactNode; onSave: () => void }) {
  return (
    <div onClick={() => !busy && onClose()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "0 16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, background: BG, borderRadius: 20, border: `0.5px solid ${BORDER_STRONG}`, maxHeight: "92vh", overflowY: "auto", paddingBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `rgba(${FG_RGB},0.18)` }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0", position: "sticky", top: 0 }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT }}>{title}</span>
          <button onClick={onClose} disabled={busy} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", color: TEXT_SEC, padding: 0 }}><X size={13} /></button>
        </div>
        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div style={{ padding: "10px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10 }}><Eyebrow color={DANGER} size={10}>{error}</Eyebrow></div>}
          {children}
        </div>
        <div style={{ position: "sticky", bottom: 0, background: BG, padding: "16px 20px 24px", marginTop: 16, borderTop: `0.5px solid ${BORDER}` }}>
          <button onClick={onSave} disabled={busy} className="nura-primary-btn" style={{ width: "100%", padding: "13px 16px", background: SAGE, border: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE_ON, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, transition: "background 200ms, transform 100ms" }}>
            {busy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recipe modal ──────────────────────────────────────────────────────────────
function RecipeModal({ token, editing, ingredients, onClose, onSuccess }: { token: string; editing: AdminRecipe | null; ingredients: AdminIngredient[]; onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!editing);
  const [description, setDescription] = useState(editing?.description ?? "");
  const [category, setCategory] = useState(editing?.category ?? "");
  const [cuisine, setCuisine] = useState(editing?.cuisine ?? "");
  const [totalMinutes, setTotalMinutes] = useState(editing?.total_minutes != null ? String(editing.total_minutes) : "");
  const [servings, setServings] = useState(editing?.servings != null ? String(editing.servings) : "");
  const [isOrganic, setIsOrganic] = useState(editing?.is_organic ?? false);
  const [goalTags, setGoalTags] = useState<string[]>(editing?.goal_tags ?? []);
  const [systemTags, setSystemTags] = useState<string[]>(editing?.system_tags ?? []);
  const [allergenFlags, setAllergenFlags] = useState<string[]>(editing?.allergen_flags ?? []);
  const [heroStyle, setHeroStyle] = useState(editing?.hero_style ?? "");
  const [status, setStatus] = useState<Status>((editing?.status as Status) ?? "draft");
  const [steps, setSteps] = useState<string[]>((editing?.method_steps ?? []).slice().sort((a, b) => (a.n ?? 0) - (b.n ?? 0)).map((s) => s.text ?? ""));
  const [links, setLinks] = useState<RecipeLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(!!editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Load existing ingredient links for the edit form.
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/recipes/${editing.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json() as { ingredients?: { ingredient_id: string; amount_text: string | null; primary_system: string | null; context_note: string | null }[] };
        if (cancelled) return;
        setLinks((data.ingredients ?? []).map((l) => ({ ingredient_id: l.ingredient_id, amount_text: l.amount_text ?? "", primary_system: l.primary_system ?? "", context_note: l.context_note ?? "" })));
      } catch { /* keep empty */ } finally {
        if (!cancelled) setLoadingLinks(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editing, token]);

  // Auto-derive slug from title until the admin edits it directly.
  useEffect(() => { if (!slugEdited) setSlug(slugify(title)); }, [title, slugEdited]);

  const save = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!category) { setError("Category is required"); return; }
    setBusy(true); setError("");
    const payload = {
      title, slug, description, category, cuisine,
      total_minutes: totalMinutes, servings, is_organic: isOrganic,
      goal_tags: goalTags, system_tags: systemTags, allergen_flags: allergenFlags,
      hero_style: heroStyle, status, method_steps: steps,
      ingredients: links.filter((l) => l.ingredient_id),
    };
    try {
      const res = await fetch(editing ? `/api/admin/recipes/${editing.id}` : "/api/admin/recipes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Save failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      onSuccess(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); setBusy(false); }
  };

  return (
    <ModalShell title={editing ? "Edit Recipe" : "Add Recipe"} busy={busy} onClose={onClose} error={error} onSave={save}>
      <Field label="Title" required><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recipe title" style={inputStyle} /></Field>
      <Field label="Slug" required><input value={slug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="auto-from-title" style={inputStyle} /></Field>
      <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category" required>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
            <option value="" disabled>Select…</option>
            {RECIPE_CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
          </select>
        </Field>
        <Field label="Cuisine"><input value={cuisine} onChange={(e) => setCuisine(e.target.value)} placeholder="e.g. Mediterranean" style={inputStyle} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Total minutes"><input value={totalMinutes} onChange={(e) => setTotalMinutes(e.target.value)} inputMode="numeric" placeholder="—" style={inputStyle} /></Field>
        <Field label="Servings"><input value={servings} onChange={(e) => setServings(e.target.value)} inputMode="numeric" placeholder="—" style={inputStyle} /></Field>
      </div>
      <Field label="Organic"><Toggle on={isOrganic} onToggle={() => setIsOrganic((v) => !v)} onLabel="Yes — organic" offLabel="Not flagged organic" /></Field>
      <Field label="Goal tags"><TagInput value={goalTags} onChange={setGoalTags} placeholder="e.g. anti-inflammatory" /></Field>
      <Field label="System tags"><TagInput value={systemTags} onChange={setSystemTags} placeholder="e.g. gut, immune" /></Field>
      <Field label="Allergen flags"><TagInput value={allergenFlags} onChange={setAllergenFlags} placeholder="e.g. dairy, gluten" /></Field>
      <Field label="Hero style"><input value={heroStyle} onChange={(e) => setHeroStyle(e.target.value)} placeholder="Optional gradient key (defaults to slug)" style={inputStyle} /></Field>
      <Field label="Status"><StatusSelect status={status} onChange={setStatus} /></Field>
      <Field label="Method steps"><StepEditor value={steps} onChange={setSteps} placeholder="Describe this step…" /></Field>
      <Field label="Ingredients">
        {loadingLinks ? <Eyebrow color={TEXT_TER}>Loading ingredients…</Eyebrow> : <LinkEditor value={links} onChange={setLinks} ingredients={ingredients} />}
      </Field>
    </ModalShell>
  );
}

// ── Ingredient modal ──────────────────────────────────────────────────────────
function IngredientModal({ token, editing, ingredients, onClose, onSuccess }: { token: string; editing: AdminIngredient | null; ingredients: AdminIngredient[]; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!editing);
  const [category, setCategory] = useState(editing?.category ?? "");
  const [tagline, setTagline] = useState(editing?.tagline ?? "");
  const [isOrganic, setIsOrganic] = useState(editing?.is_organic ?? false);
  const [supports, setSupports] = useState<string[]>(editing?.supports_systems ?? []);
  const [compounds, setCompounds] = useState<string[]>(editing?.active_compounds ?? []);
  const [pairsWith, setPairsWith] = useState<string[]>(editing?.pairs_with ?? []);
  const [blocks, setBlocks] = useState<Block[]>(editing?.cellular_explainer ?? []);
  const [howTo, setHowTo] = useState<string[]>((editing?.how_to_use ?? []).slice().sort((a, b) => (a.n ?? 0) - (b.n ?? 0)).map((s) => s.text ?? ""));
  const [status, setStatus] = useState<Status>((editing?.status as Status) ?? "draft");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (!slugEdited) setSlug(slugify(name)); }, [name, slugEdited]);

  const pairOptions = useMemo(() => ingredients.filter((i) => !editing || i.id !== editing.id).map((i) => ({ slug: i.slug, name: i.name })), [ingredients, editing]);

  const save = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!category) { setError("Category is required"); return; }
    setBusy(true); setError("");
    const payload = {
      name, slug, category, tagline, is_organic: isOrganic,
      supports_systems: supports, active_compounds: compounds, pairs_with: pairsWith,
      cellular_explainer: blocks, how_to_use: howTo, status,
    };
    try {
      const res = await fetch(editing ? `/api/admin/ingredients/${editing.id}` : "/api/admin/ingredients", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Save failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      onSuccess(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); setBusy(false); }
  };

  return (
    <ModalShell title={editing ? "Edit Ingredient" : "Add Ingredient"} busy={busy} onClose={onClose} error={error} onSave={save}>
      <Field label="Name" required><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Garlic" style={inputStyle} /></Field>
      <Field label="Slug" required><input value={slug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="auto-from-name" style={inputStyle} /></Field>
      <Field label="Category" required>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
          <option value="" disabled>Select…</option>
          {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
        </select>
      </Field>
      <Field label="Tagline"><input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One-line summary" style={inputStyle} /></Field>
      <Field label="Organic"><Toggle on={isOrganic} onToggle={() => setIsOrganic((v) => !v)} onLabel="Yes — organic" offLabel="Not flagged organic" /></Field>
      <Field label="Supports systems"><TagInput value={supports} onChange={setSupports} placeholder="e.g. immune, cardiovascular" /></Field>
      <Field label="Active compounds"><TagInput value={compounds} onChange={setCompounds} placeholder="e.g. Allicin, Curcumin" /></Field>
      <Field label="Pairs with"><SlugMultiSelect value={pairsWith} onChange={setPairsWith} options={pairOptions} /></Field>
      <Field label="Cellular explainer"><BlockEditor value={blocks} onChange={setBlocks} /></Field>
      <Field label="How to use"><StepEditor value={howTo} onChange={setHowTo} placeholder="A practical tip…" /></Field>
      <Field label="Status"><StatusSelect status={status} onChange={setStatus} /></Field>
    </ModalShell>
  );
}

// ── Confirm delete ────────────────────────────────────────────────────────────
function ConfirmDelete({ name, busy, error, onCancel, onConfirm }: { name: string; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div onClick={() => !busy && onCancel()} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 310, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "0 16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: BG, borderRadius: 20, border: `0.5px solid ${BORDER_STRONG}`, padding: 24 }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, margin: "0 0 8px" }}>Delete “{name}”?</h2>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6, margin: "0 0 18px" }}>This permanently removes it from the public pages. This cannot be undone.</p>
        {error && <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10 }}><Eyebrow color={DANGER} size={10}>{error}</Eyebrow></div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={busy} style={{ flex: 1, padding: "12px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TEXT_SEC, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} style={{ flex: 1, padding: "12px", background: DANGER, border: "none", borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {busy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null} Delete
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = "recipes" | "ingredients";

// ── Main client ───────────────────────────────────────────────────────────────
export default function NutritionAdminClient({ initialRecipes, initialIngredients }: { initialRecipes: AdminRecipe[]; initialIngredients: AdminIngredient[] }) {
  const [recipes, setRecipes] = useState<AdminRecipe[]>(initialRecipes);
  const [ingredients, setIngredients] = useState<AdminIngredient[]>(initialIngredients);
  const [tab, setTab] = useState<Tab>("recipes");
  const [search, setSearch] = useState("");
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [recipeModal, setRecipeModal] = useState<{ editing: AdminRecipe | null } | null>(null);
  const [ingredientModal, setIngredientModal] = useState<{ editing: AdminIngredient | null } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: Tab; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) setToken(session.access_token);
      const u = session?.user;
      if (u) setUserName(u.user_metadata?.name || u.email?.split("@")[0] || "Admin");
    })();
    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [r, i] = await Promise.all([
        fetch("/api/admin/recipes", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/ingredients", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (r.ok) setRecipes(((await r.json()) as { recipes: AdminRecipe[] }).recipes ?? []);
      if (i.ok) setIngredients(((await i.json()) as { ingredients: AdminIngredient[] }).ingredients ?? []);
    } catch { /* keep current */ }
  }, [token]);

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true); setDeleteError("");
    try {
      const path = confirm.kind === "recipes" ? `/api/admin/recipes/${confirm.id}` : `/api/admin/ingredients/${confirm.id}`;
      const res = await fetch(path, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        let msg = "Delete failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setConfirm(null); await refresh();
    } catch (e) { setDeleteError(e instanceof Error ? e.message : "Delete failed"); } finally { setDeleting(false); }
  };

  const q = search.trim().toLowerCase();
  const filteredRecipes = useMemo(() => recipes.filter((r) => !q || r.title.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q) || (r.category ?? "").toLowerCase().includes(q)), [recipes, q]);
  const filteredIngredients = useMemo(() => ingredients.filter((i) => !q || i.name.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q) || (i.category ?? "").toLowerCase().includes(q)), [ingredients, q]);

  const list = tab === "recipes" ? filteredRecipes : filteredIngredients;
  const source = tab === "recipes" ? recipes : ingredients;
  const published = source.filter((x) => x.status === "published").length;
  const stats = [
    { label: tab === "recipes" ? "Recipes" : "Ingredients", value: String(source.length) },
    { label: "Published", value: String(published) },
    { label: "Drafts", value: String(source.length - published) },
  ];

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: TEXT, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--nura-bg); }
        ::-webkit-scrollbar { width: 0; }
        .nut-row { transition: background 200ms, border-color 200ms, transform 200ms; }
        .nut-row:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-1px); }
        .nura-primary-btn:hover:not(:disabled) { background: var(--nura-sage-hover) !important; transform: translateY(-1px); }
        .nut-icon-btn:hover { border-color: rgba(var(--nura-sage-rgb),0.4) !important; color: var(--nura-sage) !important; }
      `}</style>

      <NuraPlexus opacity={0.35} />

      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, background: "linear-gradient(180deg, rgba(13,13,14,0.92), rgba(13,13,14,0.75))", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${BORDER}` }}>
        <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_SEC, borderRadius: 8, padding: 0 }}>
          <Shield size={18} color="var(--nura-sage)" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: TEXT, letterSpacing: "0.3px" }}>Nutrition</span>
          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: SAGE, background: "transparent", border: `0.5px solid rgba(${SAGE_RGB},0.5)`, borderRadius: 999, padding: "3px 8px" }}>Admin</span>
        </div>
        <button onClick={refresh} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_TER, borderRadius: 8, padding: 0 }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ position: "relative", zIndex: 2, padding: "24px 32px 100px", width: "100%", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Nutrition</h1>
          <Eyebrow color={TEXT_TER}>Recipes & ingredients · Admin</Eyebrow>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {(["recipes", "ingredients"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button key={t} onClick={() => { setTab(t); setSearch(""); }} style={{ flex: 1, padding: "11px 12px", background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? SAGE : TEXT_TER, cursor: "pointer", transition: "background 180ms, border-color 180ms, color 180ms" }}>
                {t === "recipes" ? "Recipes" : "Ingredients"}
              </button>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 18 }}>
          {stats.map((s) => (
            <Panel key={s.label} style={{ padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: SAGE, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <Eyebrow color={TEXT_TER} size={9}>{s.label}</Eyebrow>
            </Panel>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} color={TEXT_TER} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "recipes" ? "Search recipes…" : "Search ingredients…"} style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>

        <button onClick={() => (tab === "recipes" ? setRecipeModal({ editing: null }) : setIngredientModal({ editing: null }))} className="nura-primary-btn" style={{ width: "100%", padding: "13px 16px", marginBottom: 18, background: SAGE, border: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE_ON, cursor: "pointer", transition: "background 200ms, transform 100ms" }}>
          <Plus size={14} /> {tab === "recipes" ? "Add Recipe" : "Add Ingredient"}
        </button>

        {deleteError && !confirm && (
          <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Eyebrow color={DANGER} size={10}>{deleteError}</Eyebrow>
            <button onClick={() => setDeleteError("")} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_SEC, padding: 0, display: "flex" }}><X size={12} /></button>
          </div>
        )}

        {list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <h2 style={{ fontFamily: SANS, fontSize: 20, fontWeight: 600, color: TEXT, margin: "0 0 8px" }}>{q ? "No matches" : `No ${tab} yet`}</h2>
            <Eyebrow color={TEXT_TER}>{q ? "Try a different search" : "Add your first above"}</Eyebrow>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tab === "recipes"
              ? filteredRecipes.map((r) => (
                  <div key={r.id} className="nut-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <StatusBadge status={r.status} />
                        <Eyebrow color={TEXT_TER} size={9}>{pretty(r.category ?? "—")}</Eyebrow>
                        {r.cuisine && <Eyebrow color={TEXT_TER} size={9}>· {r.cuisine}</Eyebrow>}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_TER, marginTop: 2 }}>/{r.slug}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setRecipeModal({ editing: r })} aria-label="Edit recipe" className="nut-icon-btn" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", transition: "border-color 180ms, color 180ms" }}><Pencil size={13} /></button>
                      <button onClick={() => { setDeleteError(""); setConfirm({ kind: "recipes", id: r.id, name: r.title }); }} aria-label="Delete recipe" className="nut-icon-btn" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", transition: "border-color 180ms, color 180ms" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))
              : filteredIngredients.map((ing) => (
                  <div key={ing.id} className="nut-row" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                        <StatusBadge status={ing.status} />
                        <Eyebrow color={TEXT_TER} size={9}>{pretty(ing.category ?? "—")}</Eyebrow>
                        {(ing.cellular_explainer?.length ?? 0) > 0 && <Eyebrow color={TEXT_TER} size={9}>· {ing.cellular_explainer!.length} blocks</Eyebrow>}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.name}</div>
                      {ing.tagline && <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ing.tagline}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setIngredientModal({ editing: ing })} aria-label="Edit ingredient" className="nut-icon-btn" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", transition: "border-color 180ms, color 180ms" }}><Pencil size={13} /></button>
                      <button onClick={() => { setDeleteError(""); setConfirm({ kind: "ingredients", id: ing.id, name: ing.name }); }} aria-label="Delete ingredient" className="nut-icon-btn" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", transition: "border-color 180ms, color 180ms" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>

      {recipeModal && token && (
        <RecipeModal token={token} editing={recipeModal.editing} ingredients={ingredients} onClose={() => setRecipeModal(null)} onSuccess={refresh} />
      )}
      {ingredientModal && token && (
        <IngredientModal token={token} editing={ingredientModal.editing} ingredients={ingredients} onClose={() => setIngredientModal(null)} onSuccess={refresh} />
      )}
      {confirm && (
        <ConfirmDelete name={confirm.name} busy={deleting} error={deleteError} onCancel={() => { if (!deleting) { setConfirm(null); setDeleteError(""); } }} onConfirm={handleDelete} />
      )}
    </div>
  );
}
