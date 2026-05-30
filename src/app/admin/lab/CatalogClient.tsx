"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Pencil, Trash2, RefreshCw, Shield } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import NuraPlexus from "@/components/NuraPlexus";

// ── Design tokens (locked NŪRA system) ─────────────────────────────────────────
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
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";
const DANGER = "#FF4C5C";

// ── Types ───────────────────────────────────────────────────────────────────
export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number | null;
  active: boolean | null;
}

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string | null;
  category_id: string | null;
  description: string | null;
  status: "draft" | "published";
  slug: string;
  created_at: string;
  catalog_categories: { id: string; name: string; slug: string; parent_id: string | null } | null;
}

type Status = "draft" | "published";

// ── Primitives ────────────────────────────────────────────────────────────────
function Eyebrow({ children, color, size = 10 }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: size, fontWeight: 600,
      letterSpacing: "0.14em", textTransform: "uppercase",
      color: color ?? TEXT_TER,
    }}>
      {children}
    </span>
  );
}

function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14, padding: 16, ...style }}>
      {children}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Build a flat, hierarchical option list: parents followed by their children.
function buildCategoryOptions(categories: CatalogCategory[]): { id: string; label: string }[] {
  const parents = categories
    .filter((c) => c.parent_id === null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const childrenOf = (pid: string) =>
    categories
      .filter((c) => c.parent_id === pid)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const opts: { id: string; label: string }[] = [];
  for (const p of parents) {
    opts.push({ id: p.id, label: p.name });
    for (const child of childrenOf(p.id)) {
      opts.push({ id: child.id, label: `${p.name} › ${child.name}` });
    }
  }
  // Catch any orphaned children whose parent isn't in the list
  const seen = new Set(opts.map((o) => o.id));
  for (const c of categories) {
    if (!seen.has(c.id)) opts.push({ id: c.id, label: c.name });
  }
  return opts;
}

// ── Status badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const published = status === "published";
  return (
    <span style={{
      fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
      color: published ? SAGE : TEXT_TER,
      background: published ? `rgba(${SAGE_RGB},0.14)` : `rgba(${FG_RGB},0.06)`,
      border: `0.5px solid ${published ? `rgba(${SAGE_RGB},0.35)` : BORDER}`,
      borderRadius: 8, padding: "3px 8px",
    }}>
      {published ? "Published" : "Draft"}
    </span>
  );
}

// ── Product modal (add / edit) ──────────────────────────────────────────────────
function ProductModal({ token, editing, categoryOptions, onClose, onSuccess }: {
  token: string;
  editing: CatalogProduct | null;
  categoryOptions: { id: string; label: string }[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [brand, setBrand] = useState(editing?.brand ?? "");
  const [categoryId, setCategoryId] = useState(editing?.category_id ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [status, setStatus] = useState<Status>(editing?.status ?? "draft");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = name.trim().length > 0 && categoryId.length > 0 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErrorMsg("");
    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category_id: categoryId,
      description: description.trim(),
      status,
    };
    try {
      const url = editing
        ? `/api/admin/catalog/products/${editing.id}`
        : "/api/admin/catalog/products";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Save failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Save failed");
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", background: SURFACE,
    border: `0.5px solid ${BORDER}`, borderRadius: 10,
    fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
  };

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "0 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: BG, borderRadius: 20, border: `0.5px solid ${BORDER_STRONG}`, maxHeight: "90vh", overflowY: "auto", paddingBottom: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `rgba(${FG_RGB},0.18)` }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0" }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT }}>
            {editing ? "Edit Product" : "Add Product"}
          </span>
          <button onClick={onClose} disabled={busy} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", color: TEXT_SEC, padding: 0 }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {errorMsg && (
            <div style={{ padding: "10px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10 }}>
              <Eyebrow color={DANGER} size={10}>{errorMsg}</Eyebrow>
            </div>
          )}

          <div>
            <label style={labelStyle}>Name <span style={{ color: DANGER }}>*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Brand</label>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Category <span style={{ color: DANGER }}>*</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
              <option value="" disabled>Select a category…</option>
              {categoryOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={4}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["draft", "published"] as Status[]).map((s) => {
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    style={{
                      flex: 1, padding: "10px 12px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent",
                      border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                      borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      color: active ? SAGE : TEXT_TER, cursor: "pointer",
                      transition: "background 180ms, border-color 180ms, color 180ms",
                    }}
                  >
                    <span style={{
                      width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                      border: `1.5px solid ${active ? SAGE : BORDER}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: SAGE }} />}
                    </span>
                    {s === "draft" ? "Draft" : "Published"}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="nura-primary-btn"
            style={{
              marginTop: 8, width: "100%", padding: 14,
              background: !canSubmit ? `rgba(${SAGE_RGB},0.25)` : SAGE,
              border: "none", borderRadius: 14,
              fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              color: !canSubmit ? TEXT_TER : SAGE_ON,
              cursor: !canSubmit ? "not-allowed" : "pointer",
              transition: "background 200ms, transform 100ms",
            }}
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm delete modal ────────────────────────────────────────────────────────
function ConfirmDeleteModal({ name, busy, errorMsg, onCancel, onConfirm }: {
  name: string; busy: boolean; errorMsg: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div
      onClick={() => !busy && onCancel()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 310, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "0 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 380, background: BG, borderRadius: 20, border: `0.5px solid ${BORDER_STRONG}`, padding: 22 }}
      >
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, marginBottom: 10 }}>
          Delete product?
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.55, marginBottom: errorMsg ? 12 : 20 }}>
          Delete <span style={{ color: TEXT, fontWeight: 500 }}>&ldquo;{name}&rdquo;</span>? This cannot be undone.
        </div>
        {errorMsg && (
          <div style={{ marginBottom: 14, padding: "9px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10 }}>
            <Eyebrow color={DANGER} size={10}>{errorMsg}</Eyebrow>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} disabled={busy} style={{ flex: 1, padding: 12, background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: busy ? TEXT_TER : TEXT, cursor: busy ? "not-allowed" : "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} style={{ flex: 1, padding: 12, background: busy ? "rgba(255,76,92,0.30)" : DANGER, border: "none", borderRadius: 12, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff", cursor: busy ? "not-allowed" : "pointer" }}>
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main client ──────────────────────────────────────────────────────────────
export default function CatalogClient({ initialProducts, categories }: {
  initialProducts: CatalogProduct[];
  categories: CatalogCategory[];
}) {
  const [products, setProducts] = useState<CatalogProduct[]>(initialProducts);
  const [token, setToken] = useState("");
  const [userName, setUserName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CatalogProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const categoryLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of categoryOptions) m.set(o.id, o.label);
    return m;
  }, [categoryOptions]);

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
      const res = await fetch("/api/admin/catalog/products", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json() as { products: CatalogProduct[] };
      setProducts(data.products ?? []);
    } catch {
      // silent — keep current list
    }
  }, [token]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/catalog/products/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let msg = "Delete failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setConfirmDelete(null);
      await refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p: CatalogProduct) => { setEditing(p); setShowModal(true); };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const stats = [
    { label: "Products", value: products.length.toString() },
    { label: "Categories", value: categories.length.toString() },
    { label: "Published", value: publishedCount.toString() },
    { label: "Drafts", value: draftCount.toString() },
  ];

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: TEXT, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--nura-bg); }
        ::-webkit-scrollbar { width: 0; }
        .lab-row { transition: background 200ms, border-color 200ms, transform 200ms; }
        .lab-row:hover { background: var(--nura-surface-elevated); border-color: rgba(155,176,165,0.35); transform: translateY(-1px); }
        .nura-primary-btn:hover:not(:disabled) { background: var(--nura-sage-hover) !important; transform: translateY(-1px); }
        .nura-primary-btn:active:not(:disabled) { transform: translateY(0); }
        .lab-icon-btn:hover { border-color: rgba(155,176,165,0.4) !important; color: var(--nura-sage) !important; }
      `}</style>

      <NuraPlexus opacity={0.35} />

      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, background: "linear-gradient(180deg, rgba(13,13,14,0.92), rgba(13,13,14,0.75))", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${BORDER}` }}>
        <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_SEC, borderRadius: 8, padding: 0 }}>
          <Shield size={18} color="var(--nura-sage)" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: TEXT, letterSpacing: "0.3px" }}>Lab Catalog</span>
          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: SAGE, background: "transparent", border: `0.5px solid rgba(${SAGE_RGB},0.5)`, borderRadius: 999, padding: "3px 8px" }}>Admin</span>
        </div>
        <button onClick={refresh} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_TER, borderRadius: 8, padding: 0 }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ position: "relative", zIndex: 2, padding: "24px 32px 100px", width: "100%", maxWidth: 1100, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
            Lab Catalog
          </h1>
          <Eyebrow color={TEXT_TER}>Product testing · Admin</Eyebrow>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 18 }}>
          {stats.map((s) => (
            <Panel key={s.label} style={{ padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: SAGE, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <Eyebrow color={TEXT_TER} size={9}>{s.label}</Eyebrow>
            </Panel>
          ))}
        </div>

        <button
          onClick={openAdd}
          className="nura-primary-btn"
          style={{ width: "100%", padding: "13px 16px", marginBottom: 18, background: SAGE, border: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE_ON, cursor: "pointer", transition: "background 200ms, transform 100ms" }}
        >
          <Plus size={14} />
          Add Product
        </button>

        {deleteError && !confirmDelete && (
          <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Eyebrow color={DANGER} size={10}>{deleteError}</Eyebrow>
            <button onClick={() => setDeleteError("")} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_SEC, padding: 0, display: "flex" }}><X size={12} /></button>
          </div>
        )}

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, margin: "0 0 8px" }}>No products yet</h2>
            <Eyebrow color={TEXT_TER}>Add your first product above</Eyebrow>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.map((p) => {
              const catName = p.catalog_categories?.name ?? (p.category_id ? categoryLabel.get(p.category_id) : null) ?? "—";
              return (
                <div
                  key={p.id}
                  className="lab-row"
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 14 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                      <StatusBadge status={p.status} />
                      <Eyebrow color={TEXT_TER} size={9}>{catName}</Eyebrow>
                      <Eyebrow color={TEXT_TER} size={9}>· {formatDate(p.created_at)}</Eyebrow>
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </div>
                    {p.brand && <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, marginTop: 2 }}>{p.brand}</div>}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(p)}
                      aria-label="Edit product"
                      className="lab-icon-btn"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", transition: "border-color 180ms, color 180ms" }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => { setDeleteError(""); setConfirmDelete(p); }}
                      aria-label="Delete product"
                      className="lab-icon-btn"
                      style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer", transition: "border-color 180ms, color 180ms" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && token && (
        <ProductModal
          token={token}
          editing={editing}
          categoryOptions={categoryOptions}
          onClose={() => setShowModal(false)}
          onSuccess={refresh}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          name={confirmDelete.name}
          busy={deleting}
          errorMsg={deleteError}
          onCancel={() => { if (!deleting) { setConfirmDelete(null); setDeleteError(""); } }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
