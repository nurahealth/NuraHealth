"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus, X, Pencil, Trash2, RefreshCw, Shield, Search,
  ChevronUp, ChevronDown, Loader2, Check, Eye, ScanLine,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import NuraPlexus from "@/components/NuraPlexus";
import { sageGradient } from "@/lib/sageGradient";

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
const DANGER = "var(--nura-danger)";

const RECIPE_CATEGORIES = ["breakfast", "lunch", "dinner", "baking", "snack", "drink"];
const INGREDIENT_CATEGORIES = ["root-spice", "greens", "legumes", "good-fats", "ferments", "protein", "fruit", "grains", "staple"];
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
  method_steps: Step[] | null; hero_style: string | null; image_url: string | null; focal_x: number | null; focal_y: number | null; status: string; created_at?: string;
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

// Live detail page for published recipes; admin-only ?preview=1 for drafts.
function recipePreviewUrl(slug: string, status: string): string {
  return `/recipes/${slug}${status === "published" ? "" : "?preview=1"}`;
}

// Always read a FRESH access token at call time. The browser client refreshes
// the session in the background, so a token captured once at mount goes stale
// (~1h) and every admin write then 401s "Unauthorized". Reading getSession() per
// request returns the current (auto-refreshed) token, fixing create/edit/delete.
async function getFreshToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
// One validator shared by click AND drag. Drag-dropped files often have an empty
// file.type, so accept by MIME *or* extension. HEIC gets its own message.
function validateImageFile(file: File): string | null {
  const name = (file.name || "").toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop()! : "";
  if (file.type === "image/heic" || file.type === "image/heif" || ext === "heic" || ext === "heif") {
    return "HEIC isn't supported — export as JPEG or PNG first.";
  }
  const okMime = IMAGE_MIMES.includes(file.type);
  const okExt = IMAGE_EXTS.includes(ext);
  if (!okMime && !okExt) return "Use a JPEG, PNG, or WebP image.";
  if (file.size > 5 * 1024 * 1024) return "Image must be under 5MB.";
  return null;
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

// ── Combobox option sets (canonical strings pulled from the app's own code) ────
const CUISINE_OPTIONS = [
  "American", "Argentinian", "Brazilian", "British", "Cajun/Creole", "Caribbean", "Chinese",
  "Eastern European", "Ethiopian", "Filipino", "French", "Fusion", "German", "Greek", "Hawaiian",
  "Indian", "Indonesian", "Israeli", "Italian", "Japanese", "Korean", "Lebanese", "Mediterranean",
  "Mexican", "Middle Eastern", "Moroccan", "Nordic/Scandinavian", "North African", "Persian",
  "Peruvian", "Southern (US)", "Spanish", "Tex-Mex", "Thai", "Turkish", "Vietnamese", "West African",
].sort((a, b) => a.localeCompare(b));

// Exactly the canonical goal tags used by /recipes filtering + the meal engine
// (GOALS in RecipesBrowseClient / MARKER_GOALS in lib/nutrition).
const GOAL_TAG_OPTIONS = ["anti-inflammatory", "gut-health", "heart", "energy", "blood-sugar"];

// Distinct physiological system tags present in the recipes + ingredients seed.
const SYSTEM_TAG_OPTIONS = [
  "mitochondria", "gut-lining", "gut-health", "inflammation", "detox", "brain", "joints",
  "immunity", "heart", "energy", "digestion", "blood-sugar", "methylation", "absorption",
];

// Canonical allergen flags the dietary-pattern filter checks (lib/nutrition
// PATTERN_BLOCK) plus the common additions, all in the contains-x format.
const ALLERGEN_OPTIONS = [
  "contains-dairy", "contains-gluten", "contains-eggs", "contains-soy", "contains-fish",
  "contains-shellfish", "contains-red-meat", "contains-nuts", "contains-peanuts", "contains-sesame",
];

// Custom-value normalizers.
function normalizeTag(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function normalizeAllergen(raw: string): string {
  const t = normalizeTag(raw);
  if (!t) return "";
  return t.startsWith("contains-") ? t : `contains-${t}`;
}

// ── Combobox — searchable dropdown + "add custom", single or multi select ──────
type ComboboxProps = {
  options: string[];
  placeholder?: string;
  allowCustom?: boolean;
  normalize?: (raw: string) => string;
} & (
  | { mode: "single"; value: string; onChange: (v: string) => void }
  | { mode: "multi"; value: string[]; onChange: (v: string[]) => void }
);

function Combobox(props: ComboboxProps) {
  const { options, placeholder, allowCustom = true, normalize } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = props.mode === "multi" ? props.value : (props.value ? [props.value] : []);
  const selectedSet = new Set(selected);

  // Show preset options plus any already-selected custom values, so custom chips
  // can also be toggled from the list.
  const allOptions = [...options];
  for (const v of selected) if (!allOptions.includes(v)) allOptions.push(v);

  const q = query.trim().toLowerCase();
  const filtered = allOptions.filter((o) => o.toLowerCase().includes(q));
  const customValue = query.trim() ? (normalize ? normalize(query) : query.trim()) : "";
  const showAddCustom = allowCustom && !!customValue && !allOptions.some((o) => o.toLowerCase() === customValue.toLowerCase());

  const pick = (val: string) => {
    if (!val) return;
    if (props.mode === "single") { props.onChange(val); setOpen(false); setQuery(""); }
    else {
      if (selectedSet.has(val)) props.onChange(props.value.filter((v) => v !== val));
      else props.onChange([...props.value, val]);
      setQuery("");
    }
  };
  const remove = (val: string) => {
    if (props.mode === "single") props.onChange("");
    else props.onChange(props.value.filter((v) => v !== val));
  };

  const chip: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 6px 3px 9px", borderRadius: 999,
    background: `rgba(${SAGE_RGB},0.12)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
    fontFamily: SANS, fontSize: 12, fontWeight: 600, color: SAGE,
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ ...inputStyle, cursor: "pointer", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, minHeight: 42, paddingTop: 7, paddingBottom: 7 }}>
        {selected.length === 0 && <span style={{ color: TEXT_TER }}>{placeholder ?? "Select…"}</span>}
        {props.mode === "multi" && selected.map((v) => (
          <span key={v} style={chip}>
            {v}
            <button type="button" onClick={(e) => { e.stopPropagation(); remove(v); }} style={{ display: "flex", background: "transparent", border: "none", padding: 0, cursor: "pointer", color: SAGE }}><X size={12} /></button>
          </span>
        ))}
        {props.mode === "single" && selected.length > 0 && <span style={{ color: TEXT, flex: 1 }}>{selected[0]}</span>}
        <ChevronDown size={15} style={{ marginLeft: "auto", color: TEXT_TER, flexShrink: 0 }} />
      </div>

      {open && (
        <div style={{ position: "absolute", zIndex: 30, top: "calc(100% + 4px)", left: 0, right: 0, background: BG, border: `0.5px solid ${BORDER_STRONG}`, borderRadius: 12, boxShadow: "0 14px 36px rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <div style={{ padding: 8, borderBottom: `0.5px solid ${BORDER}` }}>
            <input
              autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or add…"
              onKeyDown={(e) => { if (e.key === "Enter" && showAddCustom) { e.preventDefault(); pick(customValue); } }}
              style={{ ...inputStyle, padding: "8px 10px" }}
            />
          </div>
          <div style={{ maxHeight: 224, overflowY: "auto", padding: 6 }}>
            {filtered.map((o) => {
              const on = selectedSet.has(o);
              return (
                <button key={o} type="button" onClick={() => pick(o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", background: on && props.mode === "multi" ? `rgba(${SAGE_RGB},0.08)` : "transparent", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: SANS, fontSize: 13.5, color: TEXT }}>
                  {props.mode === "multi" && (
                    <span style={{ width: 16, height: 16, flexShrink: 0, borderRadius: 4, border: `1.5px solid ${on ? SAGE : BORDER_STRONG}`, background: on ? SAGE : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Check size={11} color={SAGE_ON} strokeWidth={3} />}</span>
                  )}
                  <span style={{ flex: 1 }}>{o}</span>
                  {props.mode === "single" && on && <Check size={15} color={SAGE} />}
                </button>
              );
            })}
            {filtered.length === 0 && !showAddCustom && <div style={{ padding: 10, fontFamily: SANS, fontSize: 12.5, color: TEXT_TER }}>No matches</div>}
            {showAddCustom && (
              <button type="button" onClick={() => pick(customValue)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: SAGE }}>
                <Plus size={13} /> Add “{customValue}”
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label} {required && <span style={{ color: DANGER }}>*</span>}</label>
      {children}
      {error && <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DANGER, marginTop: 5 }}>{error}</div>}
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
        <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "var(--nura-text-strong)", transition: "left 180ms" }} />
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

// Fuzzy-match an extracted ingredient name to the knowledge base: exact name /
// slug first, then substring containment, then token (Jaccard) overlap.
function matchIngredient(name: string, ingredients: AdminIngredient[]): AdminIngredient | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const n = norm(name);
  if (!n) return null;
  const nslug = slugify(name);
  for (const ing of ingredients) {
    if (norm(ing.name) === n || (ing.slug && ing.slug === nslug)) return ing;
  }
  const nTokens = new Set(n.split(" ").filter(Boolean));
  let best: AdminIngredient | null = null;
  let bestScore = 0;
  for (const ing of ingredients) {
    const iName = norm(ing.name);
    if (!iName) continue;
    let score: number;
    if (n.includes(iName) || iName.includes(n)) {
      score = 0.85;
    } else {
      const iTokens = iName.split(" ").filter(Boolean);
      const inter = iTokens.filter((t) => nTokens.has(t)).length;
      const union = new Set([...iTokens, ...nTokens]).size;
      score = union ? inter / union : 0;
    }
    if (score > bestScore) { bestScore = score; best = ing; }
  }
  return bestScore >= 0.5 ? best : null;
}

// Strip prep/amount/descriptor words from a scanned line down to a clean
// canonical ingredient — "shallot, finely chopped" → "Shallot",
// "center-cut skinless salmon fillet" → "Salmon Fillet".
const SCAN_PREP_WORDS = new Set([
  "finely", "roughly", "coarsely", "thinly", "freshly", "fresh", "dried", "raw", "cooked",
  "chopped", "diced", "minced", "sliced", "grated", "shredded", "crushed", "ground", "peeled",
  "cored", "seeded", "deseeded", "trimmed", "halved", "quartered", "cubed", "julienned", "mashed",
  "whole", "large", "medium", "small", "ripe", "boneless", "skinless", "skin", "on", "off",
  "center", "centre", "cut", "lean", "extra", "virgin", "organic", "toasted", "roasted",
  "packed", "drained", "rinsed", "room", "temperature", "softened", "melted", "warm", "cold", "hot",
  "optional", "approximately", "about", "plus", "more", "for", "serving", "garnish", "to", "taste",
  "of", "your", "choice", "a", "an", "the", "and", "or", "into", "wedges", "florets",
]);
const SCAN_UNIT_WORDS = new Set([
  "cup", "cups", "tbsp", "tbsps", "tablespoon", "tablespoons", "tsp", "tsps", "teaspoon", "teaspoons",
  "g", "gram", "grams", "kg", "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds", "ml", "l", "liter", "liters", "litre", "litres",
  "can", "cans", "clove", "cloves", "bunch", "bunches", "handful", "handfuls", "pinch", "pinches",
  "slice", "slices", "piece", "pieces", "package", "packages", "packet", "packets", "stick", "sticks",
  "sprig", "sprigs", "head", "heads", "stalk", "stalks", "dash", "dashes", "knob",
]);
function canonicalScanName(raw: string): string {
  let s = raw.toLowerCase();
  s = s.replace(/\([^)]*\)/g, " "); // drop parentheticals
  s = s.split(",")[0];              // drop prep after the first comma
  s = s.replace(/[^a-z\s-]/g, " "); // drop digits/punctuation (keep hyphen for splitting)
  const tokens = s.split(/[\s-]+/).filter(Boolean).filter((t) => !SCAN_PREP_WORDS.has(t) && !SCAN_UNIT_WORDS.has(t));
  const name = tokens.join(" ").trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return name || raw.trim();
}

// Best-effort category for an auto-created scan ingredient. PINNED to
// INGREDIENT_CATEGORIES — every branch returns a value in that list and the
// final guard clamps anything unexpected, so this can never emit a category the
// table's CHECK constraint would reject. Unknown → "staple" (pantry catch-all).
function inferCategory(name: string): string {
  const n = name.toLowerCase();
  const has = (re: RegExp) => re.test(n);
  let cat = "staple";
  if (has(/\b(salmon|tuna|sardine|mackerel|cod|halibut|trout|shrimp|scallop|anchov|fish|chicken|turkey|beef|steak|pork|lamb|bacon|egg|tofu|tempeh|seitan|prawn|mussel|meat|fillet)\b/)) cat = "protein";
  else if (has(/\b(lentil|chickpea|bean|beans|edamame|split pea|hummus)\b/)) cat = "legumes";
  else if (has(/\b(oat|quinoa|rice|barley|buckwheat|farro|millet|bulgur|couscous|amaranth|teff|pasta|bread|tortilla|polenta|flour|noodle)\b/)) cat = "grains";
  else if (has(/\b(yogurt|yoghurt|kefir|sauerkraut|kimchi|miso|kombucha|natto|cheese|feta|parmesan|pickle)\b/)) cat = "ferments";
  else if (has(/\b(oil|avocado|coconut|tahini|almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia|pine nut|peanut|seed|seeds|butter|ghee|olive|chocolate|nut)\b/)) cat = "good-fats";
  else if (has(/\b(berry|berries|strawberr|blueberr|raspberr|blackberr|cranberr|lemon|lime|orange|grapefruit|apple|banana|pear|grape|mango|pineapple|peach|plum|cherr|pomegranate|kiwi|melon|watermelon|cantaloupe|date|dates|fig|figs|apricot|raisin)\b/)) cat = "fruit";
  else if (has(/\b(kale|spinach|chard|collard|arugula|lettuce|watercress|broccoli|cauliflower|brussels|cabbage|choy|asparagus|carrot|beet|radish|turnip|parsnip|celery|cucumber|zucchini|squash|pumpkin|potato|tomato|pepper|jalapeno|eggplant|mushroom|onion|shallot|leek|scallion|fennel|artichoke|okra|corn|endive|vegetable)\b/)) cat = "greens";
  else if (has(/\b(salt|honey|maple|mustard|vinegar|soy sauce|tamari|fish sauce|broth|stock|paste|starch|cornstarch|arrowroot|baking|sugar|molasses|nori|kelp|syrup)\b/)) cat = "staple";
  else if (has(/\b(turmeric|ginger|garlic|cumin|coriander|paprika|cinnamon|nutmeg|cardamom|clove|allspice|cayenne|chili|chilli|harissa|curry|garam|oregano|thyme|rosemary|sage|basil|parsley|cilantro|mint|dill|bay|saffron|sumac|zaatar|anise|fenugreek|horseradish|lemongrass|vanilla|pepper|spice|herb)\b/)) cat = "root-spice";
  return (INGREDIENT_CATEGORIES as readonly string[]).includes(cat) ? cat : "staple";
}

// ── Scan ingredients from a photo (AI extraction → review → add) ──────────────
type ScanRow = { name: string; amount_text: string; ingredient_id: string; matched: boolean; createdDraft?: boolean };

function ScanPanel({ ingredients, onCreateIngredient, onAdd, onClose }: {
  ingredients: AdminIngredient[];
  onCreateIngredient: (draft: { name: string; category: string; tagline: string }) => Promise<string | null>;
  onAdd: (links: RecipeLink[]) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"upload" | "scanning" | "review">("upload");
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [newFor, setNewFor] = useState<number | null>(null);
  const [nName, setNName] = useState("");
  const [nCat, setNCat] = useState("");
  const [nTag, setNTag] = useState("");
  const [creating, setCreating] = useState(false);
  const [nErr, setNErr] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const setRow = (i: number, patch: Partial<ScanRow>) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  // Auto-create a clean canonical draft ingredient from a scanned row and select it.
  const createOne = async (i: number) => {
    const r = rows[i];
    if (!r || r.ingredient_id) return;
    const name = canonicalScanName(r.name);
    setBulkBusy(true); setErr("");
    const id = await onCreateIngredient({ name, category: inferCategory(name), tagline: "" });
    setBulkBusy(false);
    if (id) setRow(i, { ingredient_id: id, name, matched: false, createdDraft: true });
    else setErr(`Couldn't create "${name}" — if this category is new, apply the latest category migration in Supabase, then retry.`);
  };

  const createAllUnmatched = async () => {
    setBulkBusy(true); setErr("");
    const snapshot = rows;
    const updates: { i: number; id: string; name: string }[] = [];
    let failed = 0;
    for (let i = 0; i < snapshot.length; i++) {
      if (snapshot[i].ingredient_id) continue;
      const name = canonicalScanName(snapshot[i].name);
      const id = await onCreateIngredient({ name, category: inferCategory(name), tagline: "" }); // sequential — avoids slug races
      if (id) updates.push({ i, id, name }); else failed++;
    }
    setRows((prev) => prev.map((r, i) => {
      const u = updates.find((x) => x.i === i);
      return u ? { ...r, ingredient_id: u.id, name: u.name, matched: false, createdDraft: true } : r;
    }));
    setBulkBusy(false);
    if (failed > 0) setErr(`Created ${updates.length}. ${failed} couldn't be created — if a category is new, apply the latest category migration in Supabase, then retry.`);
  };

  const scan = async (file: File) => {
    const invalid = validateImageFile(file);
    if (invalid) { setErr(invalid); return; }
    const tok = await getFreshToken();
    if (!tok) { setErr("Your admin session has expired — reload the page and sign in again."); return; }
    setErr(""); setPhase("scanning");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/recipes/scan-ingredients", { method: "POST", headers: { Authorization: `Bearer ${tok}` }, body: fd });
      const data = await res.json() as { items?: { name: string; amount_text: string | null }[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      const items = data.items ?? [];
      if (items.length === 0) { setErr("No ingredients found — use a clear, well-lit photo of just the ingredient list."); setPhase("upload"); return; }
      setRows(items.map((it) => {
        const m = matchIngredient(it.name, ingredients);
        return { name: it.name, amount_text: it.amount_text ?? "", ingredient_id: m?.id ?? "", matched: !!m };
      }));
      setPhase("review");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scan failed"); setPhase("upload");
    }
  };

  const openNew = (i: number, seed: string) => { setNewFor(i); setNName(seed); setNCat(""); setNTag(""); setNErr(""); };
  const submitNew = async () => {
    if (newFor === null) return;
    if (!nName.trim()) { setNErr("Name is required"); return; }
    if (!nCat) { setNErr("Category is required"); return; }
    setCreating(true); setNErr("");
    const id = await onCreateIngredient({ name: nName.trim(), category: nCat, tagline: nTag.trim() });
    setCreating(false);
    if (id) { setRow(newFor, { ingredient_id: id, matched: false }); setNewFor(null); }
    else setNErr("Couldn't create the ingredient — try again.");
  };

  const resolvedCount = rows.filter((r) => r.ingredient_id).length;
  const addAll = () => {
    const resolved = rows.filter((r) => r.ingredient_id);
    if (resolved.length === 0) { setErr("Match or create an ingredient for at least one row first."); return; }
    onAdd(resolved.map((r) => ({ ingredient_id: r.ingredient_id, amount_text: r.amount_text, primary_system: "", context_note: "" })));
    const remaining = rows.filter((r) => !r.ingredient_id);
    if (remaining.length > 0) { setRows(remaining); setErr(`Added ${resolved.length}. ${remaining.length} row(s) still need an ingredient — pick or create one, or remove them.`); }
    else onClose();
  };

  return (
    <div style={{ background: `rgba(${SAGE_RGB},0.05)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow color={SAGE} size={9}>Scan ingredients from a photo</Eyebrow>
        <button type="button" onClick={onClose} style={{ ...miniBtn, width: 26, height: 26 }}><X size={13} /></button>
      </div>

      {err && <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DANGER, lineHeight: 1.5 }}>{err}</div>}

      {phase !== "review" ? (
        <label
          onDragOver={(e) => { e.preventDefault(); if (phase === "upload" && !dragOver) setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (!f) { setErr("Drag an image file from Finder, or use Choose photo."); return; } scan(f); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 110, borderRadius: 10, cursor: phase === "scanning" ? "default" : "pointer", border: `1.5px dashed ${dragOver ? SAGE : `rgba(${SAGE_RGB},0.4)`}`, background: dragOver ? `rgba(${SAGE_RGB},0.10)` : "transparent", textAlign: "center", padding: 14 }}
        >
          {phase === "scanning" ? (
            <><Loader2 size={18} color={SAGE} style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE }}>Reading the photo…</span></>
          ) : (
            <>
              <ScanLine size={20} color={SAGE} />
              <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: TEXT, lineHeight: 1.4 }}>Drop a photo of an ingredient list, or <span style={{ color: SAGE }}>choose a photo</span></span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER }}>JPEG, PNG, or WebP · up to 5MB · the photo is only read, never stored</span>
            </>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={phase === "scanning"} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) scan(f); e.target.value = ""; }} />
        </label>
      ) : (
        <>
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_SEC, lineHeight: 1.5 }}>Review {rows.length} extracted item{rows.length === 1 ? "" : "s"} — edit names/amounts, confirm each match, then add. Nothing is added until you confirm.</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r, i) => (
              <div key={i} style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                  <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Ingredient name" style={inputStyle} />
                  <input value={r.amount_text} onChange={(e) => setRow(i, { amount_text: e.target.value })} placeholder="Amount (optional)" style={inputStyle} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {r.ingredient_id
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, fontFamily: SANS, fontSize: 11, fontWeight: 600, color: SAGE }}><Check size={12} /> {r.matched ? "Matched" : "Selected"}</span>
                    : <span style={{ flexShrink: 0, fontFamily: SANS, fontSize: 11, fontWeight: 600, color: "var(--nura-good)" }}>No match</span>}
                  {r.createdDraft && (
                    <span style={{ flexShrink: 0, fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.03em", color: "var(--nura-good)", background: "rgba(var(--nura-good-rgb),0.12)", border: "0.5px solid rgba(var(--nura-good-rgb),0.3)", borderRadius: 6, padding: "2px 7px" }}>draft · needs deep-dive</span>
                  )}
                  {!r.ingredient_id && (
                    <button type="button" onClick={() => createOne(i)} disabled={bulkBusy} style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", background: SAGE, border: "none", borderRadius: 8, color: SAGE_ON, fontFamily: SANS, fontSize: 11, fontWeight: 600, cursor: bulkBusy ? "default" : "pointer", opacity: bulkBusy ? 0.7 : 1 }}><Plus size={12} /> Create &amp; match</button>
                  )}
                  <select value={r.ingredient_id} onChange={(e) => { if (e.target.value === "__new__") openNew(i, r.name); else setRow(i, { ingredient_id: e.target.value, matched: false, createdDraft: false }); }} style={{ ...inputStyle, flex: 1, minWidth: 130, appearance: "none", cursor: "pointer" }}>
                    <option value="">Select an ingredient…</option>
                    {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                    <option value="__new__">+ New ingredient…</option>
                  </select>
                  <button type="button" onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove row" style={{ ...miniBtn, color: DANGER }}><Trash2 size={13} /></button>
                </div>
                {newFor === i && (
                  <div style={{ background: `rgba(${SAGE_RGB},0.06)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 9, padding: 10, display: "flex", flexDirection: "column", gap: 7 }}>
                    <Eyebrow color={SAGE} size={9}>New ingredient</Eyebrow>
                    <input value={nName} autoFocus onChange={(e) => { setNName(e.target.value); if (nErr) setNErr(""); }} placeholder="Name" style={inputStyle} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      <select value={nCat} onChange={(e) => { setNCat(e.target.value); if (nErr) setNErr(""); }} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                        <option value="" disabled>Category…</option>
                        {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                      </select>
                      <input value={nTag} onChange={(e) => setNTag(e.target.value)} placeholder="Tagline (optional)" style={inputStyle} />
                    </div>
                    <span style={{ fontFamily: SANS, fontSize: 10.5, color: TEXT_TER, lineHeight: 1.5 }}>Creates a draft ingredient and selects it. Add full deep-dive content later on the ingredient&rsquo;s own admin page.</span>
                    {nErr && <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: DANGER }}>{nErr}</div>}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" onClick={submitNew} disabled={creating} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", background: SAGE, border: "none", borderRadius: 9, color: SAGE_ON, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>{creating ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />} Create &amp; select</button>
                      <button type="button" onClick={() => setNewFor(null)} disabled={creating} style={{ padding: "7px 12px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={addAll} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", background: SAGE, border: "none", borderRadius: 10, color: SAGE_ON, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Plus size={13} /> Add all ({resolvedCount})</button>
            {rows.some((r) => !r.ingredient_id) && (
              <button type="button" onClick={createAllUnmatched} disabled={bulkBusy} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 15px", background: "transparent", border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 10, color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: bulkBusy ? "default" : "pointer", opacity: bulkBusy ? 0.7 : 1 }}>{bulkBusy ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />} Create all unmatched ({rows.filter((r) => !r.ingredient_id).length})</button>
            )}
            <button type="button" onClick={() => { setPhase("upload"); setRows([]); setErr(""); }} style={{ padding: "9px 15px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Scan another</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Recipe ↔ ingredient link editor ──────────────────────────────────────────
function LinkEditor({ value, onChange, ingredients, onCreateIngredient }: { value: RecipeLink[]; onChange: (v: RecipeLink[]) => void; ingredients: AdminIngredient[]; onCreateIngredient: (draft: { name: string; category: string; tagline: string }) => Promise<string | null> }) {
  const set = (i: number, patch: Partial<RecipeLink>) => onChange(value.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  // Inline "new ingredient" panel — scoped to the row that opened it.
  const [newFor, setNewFor] = useState<number | null>(null);
  const [nName, setNName] = useState("");
  const [nCat, setNCat] = useState("");
  const [nTag, setNTag] = useState("");
  const [creating, setCreating] = useState(false);
  const [nErr, setNErr] = useState("");

  const openNew = (i: number) => { setNewFor(i); setNName(""); setNCat(""); setNTag(""); setNErr(""); };
  const submitNew = async () => {
    if (newFor === null) return;
    if (!nName.trim()) { setNErr("Name is required"); return; }
    if (!nCat) { setNErr("Category is required"); return; }
    setCreating(true); setNErr("");
    const id = await onCreateIngredient({ name: nName.trim(), category: nCat, tagline: nTag.trim() });
    setCreating(false);
    if (id) { set(newFor, { ingredient_id: id }); setNewFor(null); }
    else setNErr("Couldn't create the ingredient — see the error above.");
  };

  const [scanOpen, setScanOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {scanOpen && (
        <ScanPanel
          ingredients={ingredients}
          onCreateIngredient={onCreateIngredient}
          onAdd={(links) => {
            // Only append ingredients not already linked — recipe_ingredients is
            // UNIQUE(recipe_id, ingredient_id), and duplicate rows can't both save.
            const have = new Set(value.map((l) => l.ingredient_id).filter(Boolean));
            const toAdd = links.filter((l) => l.ingredient_id && !have.has(l.ingredient_id));
            onChange([...value, ...toAdd]);
          }}
          onClose={() => setScanOpen(false)}
        />
      )}
      {value.map((l, i) => (
        <div key={i} style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 12, display: "flex", gap: 8 }}>
          <span style={{ flexShrink: 0, width: 24, height: 24, marginTop: 4, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${SAGE_RGB},0.14)`, fontFamily: SANS, fontSize: 11, fontWeight: 600, color: SAGE }}>{i + 1}</span>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <select value={l.ingredient_id} onChange={(e) => { if (e.target.value === "__new__") openNew(i); else set(i, { ingredient_id: e.target.value }); }} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="">Select an ingredient…</option>
              {ingredients.map((ing) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
              <option value="__new__">+ New ingredient…</option>
            </select>

            {/* Inline create panel for this row */}
            {newFor === i && (
              <div style={{ background: `rgba(${SAGE_RGB},0.05)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <Eyebrow color={SAGE} size={9}>New ingredient</Eyebrow>
                <input value={nName} autoFocus onChange={(e) => { setNName(e.target.value); if (nErr) setNErr(""); }} placeholder="Name (e.g. Ginger)" style={inputStyle} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <select value={nCat} onChange={(e) => { setNCat(e.target.value); if (nErr) setNErr(""); }} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                    <option value="" disabled>Category…</option>
                    {INGREDIENT_CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
                  </select>
                  <input value={nTag} onChange={(e) => setNTag(e.target.value)} placeholder="Tagline (optional)" style={inputStyle} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, lineHeight: 1.5 }}>
                  Creates a draft ingredient and selects it here. Add its full deep-dive content (cellular explainer, how-to-use) later on the ingredient&rsquo;s own admin page.
                </span>
                {nErr && <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DANGER }}>{nErr}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={submitNew} disabled={creating} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", background: SAGE, border: "none", borderRadius: 9, color: SAGE_ON, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}>
                    {creating ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />} Create & select
                  </button>
                  <button type="button" onClick={() => setNewFor(null)} disabled={creating} style={{ padding: "8px 14px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            )}

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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={() => onChange([...value, { ingredient_id: "", amount_text: "", primary_system: "", context_note: "" }])} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "transparent", border: `0.5px dashed rgba(${SAGE_RGB},0.4)`, borderRadius: 10, color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Plus size={13} /> Add ingredient</button>
        <button type="button" onClick={() => setScanOpen((o) => !o)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", background: scanOpen ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 10, color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 600, cursor: "pointer" }}><ScanLine size={13} /> Scan from photo</button>
      </div>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────
function ModalShell({ title, busy, onClose, error, warn, children, onSave, extraAction }: { title: string; busy: boolean; onClose: () => void; error: string; warn?: string; children: React.ReactNode; onSave: () => void; extraAction?: React.ReactNode }) {
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
          {error && <div style={{ padding: "10px 12px", background: "rgba(var(--nura-record-rgb),0.08)", border: `0.5px solid rgba(var(--nura-record-rgb),0.4)`, borderRadius: 10 }}><Eyebrow color={DANGER} size={10}>{error}</Eyebrow></div>}
          {children}
        </div>
        <div style={{ position: "sticky", bottom: 0, background: BG, padding: "16px 20px 24px", marginTop: 16, borderTop: `0.5px solid ${BORDER}` }}>
          {/* Error repeated at the action so a failed save is impossible to miss,
              even when the top of the long form is scrolled out of view. */}
          {error && <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(var(--nura-record-rgb),0.08)", border: `0.5px solid rgba(var(--nura-record-rgb),0.4)`, borderRadius: 10 }}><Eyebrow color={DANGER} size={10}>{error}</Eyebrow></div>}
          {warn && <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(var(--nura-good-rgb),0.10)", border: "0.5px solid rgba(var(--nura-good-rgb),0.4)", borderRadius: 10, fontFamily: SANS, fontSize: 12, color: "var(--nura-good)", lineHeight: 1.5 }}>{warn}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            {extraAction}
            <button onClick={onSave} disabled={busy} className="nura-primary-btn" style={{ flex: 1, padding: "13px 16px", background: SAGE, border: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE_ON, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, transition: "background 200ms, transform 100ms" }}>
              {busy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null} Save
            </button>
          </div>
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
  const [imageUrl, setImageUrl] = useState(editing?.image_url ?? "");
  const [focalX, setFocalX] = useState(editing?.focal_x ?? 0.5);
  const [focalY, setFocalY] = useState(editing?.focal_y ?? 0.5);
  const [draggingFocal, setDraggingFocal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Set the focal point from a pointer position within the preview box (0–1).
  const setFocalFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFocalX(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
    setFocalY(Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)));
  };
  const [status, setStatus] = useState<Status>((editing?.status as Status) ?? "draft");
  const [steps, setSteps] = useState<string[]>((editing?.method_steps ?? []).slice().sort((a, b) => (a.n ?? 0) - (b.n ?? 0)).map((s) => s.text ?? ""));
  const [links, setLinks] = useState<RecipeLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(!!editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [titleErr, setTitleErr] = useState("");
  const [categoryErr, setCategoryErr] = useState("");
  const [warn, setWarn] = useState("");
  const [dragOver, setDragOver] = useState(false);
  // After a create, remember the new id so subsequent saves UPDATE it instead of
  // re-creating (which would collide on slug and lose later edits).
  const [createdId, setCreatedId] = useState<string | null>(null);
  // Whether this recipe's ingredient links are safely loaded. New recipes have
  // none to load; for edits we only touch links once they've loaded, so a failed
  // load can never silently wipe them.
  const [linksLoaded, setLinksLoaded] = useState(!editing);
  // Local ingredient list so an inline-created ingredient shows in the picker
  // immediately without waiting for the parent to refetch.
  const [ingredientList, setIngredientList] = useState<AdminIngredient[]>(ingredients);

  // Create a new ingredient inline (draft), append it, and return its id so the
  // calling row can select it right away. Full deep-dive content is added later.
  const createIngredient = async (draft: { name: string; category: string; tagline: string }): Promise<string | null> => {
    try {
      const tok = (await getFreshToken()) || token;
      if (!tok) throw new Error("Your admin session has expired — reload the page and sign in again.");
      const res = await fetch("/api/admin/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ name: draft.name, category: draft.category, tagline: draft.tagline || null, status: "draft" }),
      });
      const data = await res.json() as { ingredient?: AdminIngredient; error?: string };
      if (!res.ok || !data.ingredient) throw new Error(data.error ?? "Couldn't create the ingredient");
      setIngredientList((prev) => [...prev, data.ingredient!].sort((a, b) => a.name.localeCompare(b.name)));
      return data.ingredient.id;
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      // Translate the raw Postgres CHECK-violation into something actionable.
      const friendly = /ingredients_category_check|violates check constraint/i.test(raw)
        ? "That ingredient category isn't enabled in the database yet — apply the latest category migration in Supabase, then retry."
        : (raw || "Couldn't create the ingredient");
      setError(friendly);
      return null;
    }
  };

  // Upload a photo to the recipe-images bucket; the returned public URL is saved
  // on the recipe when the form is submitted.
  const uploadImage = async (file: File) => {
    setError("");
    const invalid = validateImageFile(file);
    if (invalid) { setError(invalid); return; }
    const tok = (await getFreshToken()) || token;
    if (!tok) { setError("Your admin session has expired — reload the page and sign in again."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", slug || slugify(title) || "recipe");
      const res = await fetch("/api/admin/recipes/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
        body: fd,
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.url);
      setFocalX(0.5); setFocalY(0.5); // recenter for the new image
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Load existing ingredient links for the edit form.
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    (async () => {
      try {
        const tok = (await getFreshToken()) || token;
        const res = await fetch(`/api/admin/recipes/${editing.id}`, { headers: { Authorization: `Bearer ${tok}` } });
        if (!res.ok) throw new Error("Failed to load ingredients");
        const data = await res.json() as { ingredients?: { ingredient_id: string; amount_text: string | null; primary_system: string | null; context_note: string | null }[] };
        if (cancelled) return;
        setLinks((data.ingredients ?? []).map((l) => ({ ingredient_id: l.ingredient_id, amount_text: l.amount_text ?? "", primary_system: l.primary_system ?? "", context_note: l.context_note ?? "" })));
        setLinksLoaded(true); // safe to write links now
      } catch {
        // Don't mark links loaded — save() will then LEAVE existing links untouched.
        if (!cancelled) setWarn("Couldn't load this recipe's ingredients — saving will leave them unchanged. Reopen to edit them.");
      } finally {
        if (!cancelled) setLoadingLinks(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editing, token]);

  // Auto-derive slug from title until the admin edits it directly.
  useEffect(() => { if (!slugEdited) setSlug(slugify(title)); }, [title, slugEdited]);

  // thenPreview: save first (so preview reflects the latest SAVED state), then
  // open the recipe's detail page — live for published, ?preview=1 for drafts.
  const save = async (thenPreview = false) => {
    const tErr = !title.trim() ? "Title is required" : "";
    const cErr = !category ? "Category is required" : "";
    setTitleErr(tErr); setCategoryErr(cErr);
    if (tErr || cErr) { setError("Please fix the highlighted fields."); return; }
    // Don't save mid-upload — the photo URL wouldn't be in the payload yet.
    if (uploading) { setError("The photo is still uploading — give it a second, then Save."); return; }
    const tok = (await getFreshToken()) || token;
    if (!tok) { setError("Your admin session has expired — reload the page and sign in again."); return; }
    setBusy(true); setError(""); setWarn("");

    // Update the recipe we already created this session (or the one being edited);
    // otherwise create. This is what makes edits AFTER a "Save & preview" stick.
    const editId = editing?.id ?? createdId;
    const payload: Record<string, unknown> = {
      title, slug, description, category, cuisine,
      total_minutes: totalMinutes, servings, is_organic: isOrganic,
      goal_tags: goalTags, system_tags: systemTags, allergen_flags: allergenFlags,
      hero_style: heroStyle, image_url: imageUrl || null,
      focal_x: imageUrl ? focalX : null, focal_y: imageUrl ? focalY : null,
      status, method_steps: steps,
    };
    // Only send ingredient links when we actually have them loaded — never let a
    // failed load blank them out. Dedupe by ingredient_id: recipe_ingredients has
    // UNIQUE(recipe_id, ingredient_id), so a repeated ingredient would abort the
    // whole insert. (The server dedupes too; this lets us tell the user.)
    let dupCount = 0;
    if (linksLoaded) {
      const withId = links.filter((l) => l.ingredient_id);
      const seen = new Set<string>();
      const deduped = withId.filter((l) => (seen.has(l.ingredient_id) ? false : (seen.add(l.ingredient_id), true)));
      dupCount = withId.length - deduped.length;
      payload.ingredients = deduped;
    }

    try {
      const res = await fetch(editId ? `/api/admin/recipes/${editId}` : "/api/admin/recipes", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Save failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      const body = await res.json().catch(() => ({})) as { recipe?: { id?: string; slug?: string; status?: string }; linkError?: string | null; imageDropped?: boolean; focalDropped?: boolean };
      const saved = body.recipe;
      // Switch to edit mode after a create so the next save UPDATES this recipe.
      if (!editId && saved?.id) { setCreatedId(saved.id); setLinksLoaded(true); }
      if (saved?.slug) { setSlug(saved.slug); setSlugEdited(true); }
      // NEVER let a partial save pass silently: the recipe saved but its
      // ingredients did not. Show a loud red error naming the ingredients part.
      if (body.linkError) {
        setError(`The recipe saved, but its INGREDIENTS did NOT save: ${body.linkError} — fix and Save again.`);
        onSuccess();
        setBusy(false);
        return; // keep the form open so the error is seen and can be retried
      }
      const photoDropped = !!body.imageDropped && !!imageUrl;
      const focalUnsaved = !!body.focalDropped && !!imageUrl && (focalX !== 0.5 || focalY !== 0.5);
      if (photoDropped) setWarn("Photo uploaded to storage, but the database rejected image_url — the recipes.image_url column is missing in the connected project (or PostgREST's schema cache is stale). Apply the migration to THIS project, then run  notify pgrst, 'reload schema';  and Save again.");
      else if (focalUnsaved) setWarn("Focal point not saved — the recipes focal-point migration (focal_x / focal_y) hasn't been applied. Run it, then Save again.");
      else if (dupCount > 0) setWarn(`${dupCount} duplicate ingredient${dupCount > 1 ? "s were" : " was"} merged — a recipe can list each ingredient once.`);

      onSuccess(); // refresh the list

      if (thenPreview) {
        window.open(recipePreviewUrl(saved?.slug ?? slug, saved?.status ?? status), "_blank", "noopener,noreferrer");
        setBusy(false);
        return; // keep the form open
      }
      if (photoDropped || focalUnsaved) { setBusy(false); return; } // keep open so the warning is seen
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); setBusy(false); }
  };

  return (
    <ModalShell
      title={editing ? "Edit Recipe" : "Add Recipe"}
      busy={busy}
      onClose={onClose}
      error={error}
      warn={warn}
      onSave={() => save(false)}
      extraAction={
        <button
          type="button"
          onClick={() => save(true)}
          disabled={busy}
          title="Saves this recipe, then opens its page in a new tab"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "13px 16px", background: "transparent", border: `0.5px solid ${BORDER_STRONG}`, borderRadius: 14, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, whiteSpace: "nowrap" }}
        >
          <Eye size={13} /> Save &amp; preview
        </button>
      }
    >
      <Field label="Title" required error={titleErr}><input value={title} onChange={(e) => { setTitle(e.target.value); if (titleErr) setTitleErr(""); }} placeholder="Recipe title" style={inputStyle} /></Field>
      <Field label="Slug" required><input value={slug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="auto-from-title" style={inputStyle} /></Field>
      <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Category" required error={categoryErr}>
          <select value={category} onChange={(e) => { setCategory(e.target.value); if (categoryErr) setCategoryErr(""); }} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
            <option value="" disabled>Select…</option>
            {RECIPE_CATEGORIES.map((c) => <option key={c} value={c}>{pretty(c)}</option>)}
          </select>
        </Field>
        <Field label="Cuisine"><Combobox mode="single" value={cuisine} onChange={setCuisine} options={CUISINE_OPTIONS} placeholder="Select or add a cuisine" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Total minutes"><input value={totalMinutes} onChange={(e) => setTotalMinutes(e.target.value)} inputMode="numeric" placeholder="—" style={inputStyle} /></Field>
        <Field label="Servings"><input value={servings} onChange={(e) => setServings(e.target.value)} inputMode="numeric" placeholder="—" style={inputStyle} /></Field>
      </div>
      <Field label="Organic"><Toggle on={isOrganic} onToggle={() => setIsOrganic((v) => !v)} onLabel="Yes — organic" offLabel="Not flagged organic" /></Field>
      <Field label="Goal tags"><Combobox mode="multi" value={goalTags} onChange={setGoalTags} options={GOAL_TAG_OPTIONS} normalize={normalizeTag} placeholder="Add goal tags" /></Field>
      <Field label="System tags"><Combobox mode="multi" value={systemTags} onChange={setSystemTags} options={SYSTEM_TAG_OPTIONS} normalize={normalizeTag} placeholder="Add system tags" /></Field>
      <Field label="Allergen flags"><Combobox mode="multi" value={allergenFlags} onChange={setAllergenFlags} options={ALLERGEN_OPTIONS} normalize={normalizeAllergen} placeholder="Add allergen flags" /></Field>
      <Field label="Hero style"><input value={heroStyle} onChange={(e) => setHeroStyle(e.target.value)} placeholder="Optional gradient key (defaults to slug)" style={inputStyle} /></Field>
      <Field label="Photo">
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Drop target — also click-to-upload via the button. Shows a sage drop
              state while a file is dragged over it. */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (!uploading && !dragOver) setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              // Dragging an image FROM a browser/Photos yields no file, just a URL.
              if (!f) { setError("Drag an image file from Finder, or use Upload photo."); return; }
              uploadImage(f);
            }}
            // Click / drag on the photo to set the focal point.
            onPointerDown={(e) => { if (imageUrl && !uploading) { e.currentTarget.setPointerCapture(e.pointerId); setDraggingFocal(true); setFocalFromEvent(e); } }}
            onPointerMove={(e) => { if (draggingFocal) setFocalFromEvent(e); }}
            onPointerUp={() => setDraggingFocal(false)}
            onPointerCancel={() => setDraggingFocal(false)}
            style={{ width: 160, height: 108, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative", background: sageGradient(slug || "recipe"), border: dragOver ? `1.5px dashed ${SAGE}` : `0.5px solid ${BORDER}`, cursor: imageUrl ? "crosshair" : "default", transition: "border-color 150ms", touchAction: "none" }}
          >
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="Recipe" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: `${Math.round(focalX * 100)}% ${Math.round(focalY * 100)}%`, pointerEvents: "none" }} />
            )}
            {/* Focal-point marker */}
            {imageUrl && (
              <div style={{ position: "absolute", left: `${focalX * 100}%`, top: `${focalY * 100}%`, width: 16, height: 16, borderRadius: "50%", transform: "translate(-50%,-50%)", border: "2px solid #fff", boxShadow: "0 0 0 1.5px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.5)", pointerEvents: "none" }} />
            )}
            {(dragOver || !imageUrl) && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 6, background: dragOver ? `rgba(${SAGE_RGB},0.22)` : "transparent", pointerEvents: "none" }}>
                <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: dragOver ? SAGE : `rgba(${FG_RGB},0.5)`, lineHeight: 1.3 }}>
                  {dragOver ? "Drop photo" : "Drag a photo here"}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 7, cursor: uploading ? "default" : "pointer", fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE, background: `rgba(${SAGE_RGB},0.10)`, border: `0.5px solid rgba(${SAGE_RGB},0.28)`, borderRadius: 10, padding: "8px 14px", opacity: uploading ? 0.6 : 1 }}>
              {uploading ? "Uploading…" : imageUrl ? "Replace photo" : "Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
            </label>
            {imageUrl && (
              <button type="button" onClick={() => { setImageUrl(""); setFocalX(0.5); setFocalY(0.5); }} style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DANGER, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                Remove
              </button>
            )}
            <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, lineHeight: 1.5 }}>
              JPEG, PNG, or WebP · up to 5MB. Falls back to the gradient when empty.
              {imageUrl && <> Click or drag on the photo to set the focal point ({Math.round(focalX * 100)}%, {Math.round(focalY * 100)}%) — the part that stays in frame across crops.</>}
            </span>
          </div>
        </div>
      </Field>
      <Field label="Status"><StatusSelect status={status} onChange={setStatus} /></Field>
      <Field label="Method steps"><StepEditor value={steps} onChange={setSteps} placeholder="Describe this step…" /></Field>
      <Field label="Ingredients">
        {loadingLinks ? <Eyebrow color={TEXT_TER}>Loading ingredients…</Eyebrow> : <LinkEditor value={links} onChange={setLinks} ingredients={ingredientList} onCreateIngredient={createIngredient} />}
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
    const tok = (await getFreshToken()) || token;
    if (!tok) { setError("Your admin session has expired — reload the page and sign in again."); return; }
    setBusy(true); setError("");
    const payload = {
      name, slug, category, tagline, is_organic: isOrganic,
      supports_systems: supports, active_compounds: compounds, pairs_with: pairsWith,
      cellular_explainer: blocks, how_to_use: howTo, status,
    };
    try {
      const res = await fetch(editing ? `/api/admin/ingredients/${editing.id}` : "/api/admin/ingredients", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
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
        {error && <div style={{ marginBottom: 14, padding: "10px 12px", background: "rgba(var(--nura-record-rgb),0.08)", border: `0.5px solid rgba(var(--nura-record-rgb),0.4)`, borderRadius: 10 }}><Eyebrow color={DANGER} size={10}>{error}</Eyebrow></div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={busy} style={{ flex: 1, padding: "12px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: TEXT_SEC, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={busy} style={{ flex: 1, padding: "12px", background: DANGER, border: "none", borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--nura-text-strong)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
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
    const tok = (await getFreshToken()) || token;
    if (!tok) return;
    try {
      const [r, i] = await Promise.all([
        fetch("/api/admin/recipes", { headers: { Authorization: `Bearer ${tok}` } }),
        fetch("/api/admin/ingredients", { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (r.ok) setRecipes(((await r.json()) as { recipes: AdminRecipe[] }).recipes ?? []);
      if (i.ok) setIngredients(((await i.json()) as { ingredients: AdminIngredient[] }).ingredients ?? []);
    } catch { /* keep current */ }
  }, [token]);

  const handleDelete = async () => {
    if (!confirm) return;
    setDeleting(true); setDeleteError("");
    try {
      const tok = (await getFreshToken()) || token;
      if (!tok) throw new Error("Your admin session has expired — reload the page and sign in again.");
      const path = confirm.kind === "recipes" ? `/api/admin/recipes/${confirm.id}` : `/api/admin/ingredients/${confirm.id}`;
      const res = await fetch(path, { method: "DELETE", headers: { Authorization: `Bearer ${tok}` } });
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

      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, background: "linear-gradient(180deg, rgba(var(--nura-bg-rgb),0.92), rgba(var(--nura-bg-rgb),0.75))", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${BORDER}` }}>
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
          <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(var(--nura-record-rgb),0.08)", border: `0.5px solid rgba(var(--nura-record-rgb),0.4)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
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
                      <a href={recipePreviewUrl(r.slug, r.status)} target="_blank" rel="noopener noreferrer" aria-label="Preview recipe" title={r.status === "published" ? "Preview (live)" : "Preview draft"} className="nut-icon-btn" style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", textDecoration: "none", transition: "border-color 180ms, color 180ms" }}><Eye size={13} /></a>
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
