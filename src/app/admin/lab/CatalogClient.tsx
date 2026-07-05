"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, X, Pencil, Trash2, RefreshCw, Shield, ImagePlus, Loader2, FileText, Link2, UploadCloud, Check, Search } from "lucide-react";
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
const SANS = "var(--font-inter), system-ui, sans-serif";
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
  score: number | null;
  lab_tested: boolean | null;
  microplastics_present: boolean | null;
  score_rationale: string | null;
  shop_url: string | null;
  affiliate_url: string | null;
  price_cents: number | null;
  currency: string | null;
  image_url: string | null;
  properties: Record<string, unknown> | null;
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

// ── Properties (key/value) helpers ──────────────────────────────────────────────
type PropRow = { key: string; value: string };
type Tri = "yes" | "no" | "unknown";

function propsToRows(p: Record<string, unknown> | null | undefined): PropRow[] {
  if (!p || typeof p !== "object" || Array.isArray(p)) return [];
  return Object.entries(p).map(([key, value]) => ({
    key,
    value: value === null || value === undefined ? "" : typeof value === "string" ? value : String(value),
  }));
}

function triFromBool(v: boolean | null | undefined): Tri {
  return v === true ? "yes" : v === false ? "no" : "unknown";
}

// ── Sources / Lab reports manager ────────────────────────────────────────────────
interface CatalogDocument {
  id: string;
  title: string;
  doc_type: string | null;
  year: number | null;
  source_url: string | null;
  storage_path: string | null;
}

// Accepted upload types — PDFs, common docs, and report images
const DOC_ACCEPT = "application/pdf,.pdf,.doc,.docx,image/*";

function DocumentsManager({ token, productId }: { token: string; productId: string }) {
  const [docs, setDocs] = useState<CatalogDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add-form state
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [year, setYear] = useState("");
  const [mode, setMode] = useState<"link" | "file">("link");
  const [sourceUrl, setSourceUrl] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [addError, setAddError] = useState("");
  const docFileRef = useRef<HTMLInputElement>(null);

  // Edit-in-place state (one document at a time)
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editSource, setEditSource] = useState<"keep" | "link" | "file">("keep");
  const [editSourceUrl, setEditSourceUrl] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const editFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setListError("");
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const b = await res.json() as { documents?: CatalogDocument[]; error?: string };
      if (!res.ok) throw new Error(b.error || "Failed to load documents");
      setDocs(b.documents ?? []);
    } catch (e) {
      console.error("[DocumentsManager] load documents error:", e);
      setListError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  useEffect(() => { load(); }, [load]);

  // Stop the browser from navigating to / opening a PDF that's dropped just
  // outside the drop zone — otherwise a near-miss drop looks like "drag & drop
  // doesn't work" because the page replaces itself with the file.
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const addDocument = async () => {
    if (!productId) { setAddError("Missing product — save the product first, then reopen it."); return; }
    if (mode === "link" && !sourceUrl.trim()) { setAddError("Paste a link or switch to Upload PDF"); return; }
    if (mode === "file" && !pendingFile) { setAddError("Choose a PDF or switch to Paste link"); return; }

    // Title is optional in the UI — default it (filename / link) so a dragged
    // PDF saves without forcing the admin to type a title first.
    const finalTitle =
      title.trim() ||
      (mode === "file" && pendingFile ? pendingFile.name.replace(/\.[^.]+$/, "") : "") ||
      (mode === "link" && sourceUrl.trim() ? sourceUrl.trim() : "") ||
      "Untitled document";

    setAdding(true);
    setAddError("");
    try {
      const fd = new FormData();
      fd.append("title", finalTitle);
      if (docType.trim()) fd.append("doc_type", docType.trim());
      if (year.trim()) fd.append("year", year.trim());
      if (mode === "link") fd.append("source_url", sourceUrl.trim());
      else if (pendingFile) fd.append("file", pendingFile);

      const res = await fetch(`/api/admin/catalog/products/${productId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      // Read the body as text first so we can surface non-JSON errors too (413/HTML/etc.)
      const rawBody = await res.text();
      let parsed: { document?: CatalogDocument; error?: string } = {};
      try { parsed = rawBody ? JSON.parse(rawBody) : {}; } catch { /* non-JSON */ }

      if (!res.ok) {
        const msg = parsed.error || rawBody.trim().slice(0, 200) || `Upload failed (HTTP ${res.status})`;
        console.error("[DocumentsManager] add document failed:", res.status, msg);
        throw new Error(msg);
      }

      // Show the new document immediately, then reconcile with the server list
      if (parsed.document) setDocs((d) => [...d, parsed.document!]);
      setTitle(""); setDocType(""); setYear(""); setSourceUrl(""); setPendingFile(null); setMode("link");
      if (docFileRef.current) docFileRef.current.value = "";
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2200);
      await load();
    } catch (e) {
      console.error("[DocumentsManager] addDocument error:", e);
      setAddError(e instanceof Error ? e.message : "Failed to add document");
    } finally {
      setAdding(false);
    }
  };

  const onPickFile = (f: File | null) => {
    if (!f) return;
    setPendingFile(f);
    setAddError("");
    setJustAdded(false);
  };

  const removeDocument = async (id: string) => {
    setRemovingId(id);
    setListError("");
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let msg = "Delete failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setDocs((d) => d.filter((x) => x.id !== id));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setRemovingId(null);
    }
  };

  const startEdit = (d: CatalogDocument) => {
    setEditId(d.id);
    setEditTitle(d.title);
    setEditType(d.doc_type ?? "");
    setEditYear(d.year != null ? String(d.year) : "");
    setEditSource("keep");
    setEditSourceUrl(d.source_url ?? "");
    setEditFile(null);
    setEditError("");
  };

  const cancelEdit = () => { setEditId(null); setEditFile(null); setEditError(""); };

  const saveEdit = async (d: CatalogDocument) => {
    if (editSource === "link" && !editSourceUrl.trim()) { setEditError("Enter a link or choose Keep current"); return; }
    if (editSource === "file" && !editFile) { setEditError("Choose a file or choose Keep current"); return; }
    setEditBusy(true);
    setEditError("");
    try {
      const fd = new FormData();
      fd.append("title", editTitle.trim() || d.title);
      fd.append("doc_type", editType.trim());
      fd.append("year", editYear.trim());
      if (editSource === "link") fd.append("source_url", editSourceUrl.trim());
      else if (editSource === "file" && editFile) fd.append("file", editFile);

      const res = await fetch(`/api/admin/catalog/products/${productId}/documents/${d.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const rawBody = await res.text();
      let parsed: { document?: CatalogDocument; error?: string } = {};
      try { parsed = rawBody ? JSON.parse(rawBody) : {}; } catch { /* non-JSON */ }
      if (!res.ok) {
        const msg = parsed.error || rawBody.trim().slice(0, 200) || `Save failed (HTTP ${res.status})`;
        console.error("[DocumentsManager] edit document failed:", res.status, msg);
        throw new Error(msg);
      }
      if (parsed.document) setDocs((arr) => arr.map((x) => (x.id === d.id ? parsed.document! : x)));
      setEditId(null);
      setEditFile(null);
    } catch (e) {
      console.error("[DocumentsManager] saveEdit error:", e);
      setEditError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setEditBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 11px", background: SURFACE,
    border: `0.5px solid ${BORDER}`, borderRadius: 10,
    fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
  };

  return (
    <div>
      <label style={labelStyle}>Sources / Lab reports</label>

      {/* Existing documents */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT_TER, fontFamily: SANS, fontSize: 12.5, padding: "2px 0" }}>
            <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Loading…
          </div>
        ) : docs.length === 0 ? (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, padding: "2px 0 2px" }}>
            No sources yet.
          </div>
        ) : (
          docs.map((d) => (
            editId === d.id ? (
              // ── Inline edit form ───────────────────────────────────────────
              <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: SURFACE, border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 10 }}>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" style={{ ...inputStyle, padding: "8px 11px" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input value={editType} onChange={(e) => setEditType(e.target.value)} placeholder="Type" style={{ ...inputStyle, flex: 2, minWidth: 120, padding: "8px 11px" }} />
                  <input value={editYear} onChange={(e) => setEditYear(e.target.value)} placeholder="Year" inputMode="numeric" style={{ ...inputStyle, flex: 1, minWidth: 70, padding: "8px 11px" }} />
                </div>

                {/* Source: keep / replace with link / replace with file */}
                <div style={{ display: "flex", gap: 6 }}>
                  {([["keep", "Keep current"], ["link", "Replace link"], ["file", "Replace file"]] as [typeof editSource, string][]).map(([m, lbl]) => {
                    const active = editSource === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setEditSource(m); setEditError(""); }}
                        style={{ flex: 1, padding: "8px 6px", background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 9, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: active ? SAGE : TEXT_TER, cursor: "pointer" }}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
                {editSource === "link" && (
                  <input value={editSourceUrl} onChange={(e) => setEditSourceUrl(e.target.value)} placeholder="https://… (link to the report)" style={{ ...inputStyle, padding: "8px 11px" }} />
                )}
                {editSource === "file" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <input ref={editFileRef} type="file" accept={DOC_ACCEPT} onChange={(e) => { setEditFile(e.target.files?.[0] ?? null); setEditError(""); }} style={{ display: "none" }} />
                    <button type="button" onClick={() => editFileRef.current?.click()} className="lab-icon-btn" style={{ padding: "8px 12px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: TEXT_SEC, cursor: "pointer", flexShrink: 0 }}>
                      {editFile ? "Change file" : "Choose file"}
                    </button>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: editFile ? TEXT : TEXT_TER, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                      {editFile ? editFile.name : "No file chosen"}
                    </span>
                  </div>
                )}

                {editError && (
                  <div style={{ padding: "8px 11px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 12, color: DANGER }}>{editError}</div>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" onClick={cancelEdit} disabled={editBusy} style={{ padding: "8px 14px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: TEXT_SEC, cursor: editBusy ? "default" : "pointer" }}>Cancel</button>
                  <button type="button" onClick={() => saveEdit(d)} disabled={editBusy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: SAGE, cursor: editBusy ? "default" : "pointer" }}>
                    {editBusy ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : <><Check size={13} /> Save</>}
                  </button>
                </div>
              </div>
            ) : (
              // ── Normal row with edit + remove controls ─────────────────────
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10 }}>
                {d.storage_path ? <FileText size={15} color={SAGE} style={{ flexShrink: 0 }} /> : <Link2 size={15} color={SAGE} style={{ flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
                  {(d.doc_type || d.year || d.storage_path) && (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {[d.doc_type, d.year ? String(d.year) : null, d.storage_path ? "PDF" : "Link"].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(d)}
                  disabled={removingId === d.id || !!editId}
                  aria-label="Edit document"
                  className="lab-icon-btn"
                  style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, cursor: "pointer" }}
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => removeDocument(d.id)}
                  disabled={removingId === d.id}
                  aria-label="Remove document"
                  className="lab-icon-btn"
                  style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, cursor: removingId === d.id ? "default" : "pointer" }}
                >
                  {removingId === d.id ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
                </button>
              </div>
            )
          ))
        )}
        {listError && (
          <div style={{ padding: "8px 11px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 12.5, color: DANGER }}>
            {listError}
          </div>
        )}
      </div>

      {/* Add document form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: `rgba(${FG_RGB},0.03)`, border: `0.5px solid ${BORDER}`, borderRadius: 12 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title — optional (defaults to file name)" style={inputStyle} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="Type (optional)" style={{ ...inputStyle, flex: 2, minWidth: 130 }} />
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" inputMode="numeric" style={{ ...inputStyle, flex: 1, minWidth: 80 }} />
        </div>

        {/* Link vs Upload toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["link", "file"] as const).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setAddError(""); }}
                style={{
                  flex: 1, padding: "9px 8px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent",
                  border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                  borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: active ? SAGE : TEXT_TER, cursor: "pointer",
                }}
              >
                {m === "link" ? <><Link2 size={13} /> Paste link</> : <><FileText size={13} /> Upload PDF</>}
              </button>
            );
          })}
        </div>

        {mode === "link" ? (
          <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://… (link to the report)" style={inputStyle} />
        ) : (
          <div
            onClick={() => !adding && docFileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!adding) setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (adding) return;
              onPickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !adding) docFileRef.current?.click(); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "18px 14px", borderRadius: 10, textAlign: "center",
              cursor: adding ? "default" : "pointer",
              border: `1px dashed ${dragOver ? SAGE : pendingFile ? `rgba(${SAGE_RGB},0.45)` : BORDER}`,
              background: dragOver ? `rgba(${SAGE_RGB},0.10)` : `rgba(${FG_RGB},0.02)`,
              transition: "background 160ms, border-color 160ms",
            }}
          >
            <input ref={docFileRef} type="file" accept={DOC_ACCEPT} onChange={(e) => { onPickFile(e.target.files?.[0] ?? null); }} style={{ display: "none" }} />
            {adding ? (
              <>
                <Loader2 size={20} color={SAGE} style={{ animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: SAGE }}>Uploading…</span>
              </>
            ) : pendingFile ? (
              <>
                <FileText size={20} color={SAGE} />
                <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: TEXT, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingFile.name}</span>
                <span style={{ fontFamily: SANS, fontSize: 10.5, color: TEXT_TER }}>Click to choose a different file</span>
              </>
            ) : (
              <>
                <UploadCloud size={20} color={dragOver ? SAGE : TEXT_TER} />
                <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 600, color: TEXT_SEC }}>Drag &amp; drop a file here</span>
                <span style={{ fontFamily: SANS, fontSize: 10.5, color: TEXT_TER }}>or click to browse · PDF, DOC, or image</span>
              </>
            )}
          </div>
        )}

        {addError && (
          <div style={{ padding: "9px 11px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: DANGER }}>
            {addError}
          </div>
        )}

        <button
          type="button"
          onClick={addDocument}
          disabled={adding}
          style={{
            alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
            background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 10,
            fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            color: SAGE, cursor: adding ? "default" : "pointer",
          }}
        >
          {adding
            ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Adding…</>
            : justAdded
              ? <><Check size={13} /> Added</>
              : <><Plus size={13} /> Add document</>}
        </button>
      </div>
    </div>
  );
}

// ── Measurements manager ─────────────────────────────────────────────────────────
interface MeasurementType {
  id: string; name: string; slug: string; kind: string | null; unit: string | null;
  description: string | null; guideline_limit: number | null; sort_order: number | null;
}
interface ProductMeasurement {
  id: string; value: number | null; risk_count: number | null; measurement_type_id: string;
  type: MeasurementType | null;
}
type Kind = "contaminant" | "nutrient" | "property";
const KIND_GROUPS: { kind: string; label: string }[] = [
  { kind: "contaminant", label: "Contaminants" },
  { kind: "nutrient", label: "Ingredients & minerals" },
  { kind: "property", label: "Properties" },
  { kind: "__other__", label: "Other" },
];

function MeasurementsManager({ token, productId }: { token: string; productId: string }) {
  const [measurements, setMeasurements] = useState<ProductMeasurement[]>([]);
  const [types, setTypes] = useState<MeasurementType[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add-form state
  const [addMode, setAddMode] = useState<"existing" | "new">("existing");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [showTypeList, setShowTypeList] = useState(false);
  const [ntName, setNtName] = useState("");
  const [ntKind, setNtKind] = useState<Kind>("contaminant");
  const [ntUnit, setNtUnit] = useState("");
  const [ntDesc, setNtDesc] = useState("");
  const [ntGuideline, setNtGuideline] = useState("");
  const [ntSort, setNtSort] = useState("");
  const [value, setValue] = useState("");
  const [riskCount, setRiskCount] = useState("0");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit-in-place (value + risk_count)
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editRisk, setEditRisk] = useState("0");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");

  const load = useCallback(async () => {
    setListError("");
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/measurements`, { headers: { Authorization: `Bearer ${token}` } });
      const b = await res.json() as { measurements?: ProductMeasurement[]; types?: MeasurementType[]; error?: string };
      if (!res.ok) throw new Error(b.error || "Failed to load measurements");
      setMeasurements(b.measurements ?? []);
      setTypes(b.types ?? []);
    } catch (e) {
      console.error("[MeasurementsManager] load error:", e);
      setListError(e instanceof Error ? e.message : "Failed to load measurements");
    } finally {
      setLoading(false);
    }
  }, [productId, token]);

  useEffect(() => { load(); }, [load]);

  const usedTypeIds = useMemo(() => new Set(measurements.map((m) => m.measurement_type_id)), [measurements]);
  const availableTypes = useMemo(
    () => types.filter((t) => !usedTypeIds.has(t.id)),
    [types, usedTypeIds]
  );
  const filteredTypes = useMemo(() => {
    const q = typeSearch.trim().toLowerCase();
    const base = q ? availableTypes.filter((t) => t.name.toLowerCase().includes(q)) : availableTypes;
    return base.slice(0, 40);
  }, [availableTypes, typeSearch]);
  const selectedType = useMemo(() => types.find((t) => t.id === selectedTypeId) ?? null, [types, selectedTypeId]);
  const activeUnit = addMode === "existing" ? (selectedType?.unit ?? "") : ntUnit.trim();

  const resetAddForm = () => {
    setSelectedTypeId(""); setTypeSearch(""); setShowTypeList(false);
    setNtName(""); setNtKind("contaminant"); setNtUnit(""); setNtDesc(""); setNtGuideline(""); setNtSort("");
    setValue(""); setRiskCount("0"); setAddMode("existing");
  };

  const addMeasurement = async () => {
    if (addMode === "existing" && !selectedTypeId) { setAddError("Pick a measurement type"); return; }
    if (addMode === "new" && !ntName.trim()) { setAddError("New type needs a name"); return; }
    setAdding(true);
    setAddError("");
    try {
      const payload: Record<string, unknown> = { value: value.trim() === "" ? null : value.trim(), risk_count: riskCount.trim() === "" ? 0 : riskCount.trim() };
      if (addMode === "existing") {
        payload.measurement_type_id = selectedTypeId;
      } else {
        payload.new_type = {
          name: ntName.trim(), kind: ntKind, unit: ntUnit.trim() || null, description: ntDesc.trim() || null,
          guideline_limit: ntGuideline.trim() === "" ? null : ntGuideline.trim(),
          sort_order: ntSort.trim() === "" ? null : ntSort.trim(),
        };
      }
      const res = await fetch(`/api/admin/catalog/products/${productId}/measurements`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let parsed: { measurement?: ProductMeasurement; error?: string } = {};
      try { parsed = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON */ }
      if (!res.ok) {
        const msg = parsed.error || raw.trim().slice(0, 200) || `Add failed (HTTP ${res.status})`;
        console.error("[MeasurementsManager] add failed:", res.status, msg);
        throw new Error(msg);
      }
      resetAddForm();
      await load(); // refresh measurements + types (a new inline type now appears in the picker)
    } catch (e) {
      console.error("[MeasurementsManager] addMeasurement error:", e);
      setAddError(e instanceof Error ? e.message : "Failed to add measurement");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (m: ProductMeasurement) => {
    setEditId(m.id);
    setEditValue(m.value != null ? String(m.value) : "");
    setEditRisk(m.risk_count != null ? String(m.risk_count) : "0");
    setEditError("");
  };
  const cancelEdit = () => { setEditId(null); setEditError(""); };

  const saveEdit = async (m: ProductMeasurement) => {
    setEditBusy(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/measurements/${m.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: editValue.trim() === "" ? null : editValue.trim(), risk_count: editRisk.trim() === "" ? 0 : editRisk.trim() }),
      });
      const raw = await res.text();
      let parsed: { measurement?: ProductMeasurement; error?: string } = {};
      try { parsed = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON */ }
      if (!res.ok) {
        const msg = parsed.error || raw.trim().slice(0, 200) || `Save failed (HTTP ${res.status})`;
        console.error("[MeasurementsManager] edit failed:", res.status, msg);
        throw new Error(msg);
      }
      if (parsed.measurement) setMeasurements((arr) => arr.map((x) => (x.id === m.id ? parsed.measurement! : x)));
      setEditId(null);
    } catch (e) {
      console.error("[MeasurementsManager] saveEdit error:", e);
      setEditError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setEditBusy(false);
    }
  };

  const removeMeasurement = async (id: string) => {
    setRemovingId(id);
    setListError("");
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/measurements/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        let msg = "Delete failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setMeasurements((arr) => arr.filter((x) => x.id !== id));
    } catch (e) {
      console.error("[MeasurementsManager] remove error:", e);
      setListError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setRemovingId(null);
    }
  };

  const valueLabel = (m: ProductMeasurement) => {
    if (m.value === null || m.value === undefined) return "—";
    return m.type?.unit ? `${m.value} ${m.type.unit}` : String(m.value);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 11px", background: SURFACE,
    border: `0.5px solid ${BORDER}`, borderRadius: 10,
    fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
  };

  // group measurements by kind in the fixed group order
  const grouped = KIND_GROUPS.map((g) => ({
    ...g,
    items: measurements.filter((m) => (g.kind === "__other__" ? !["contaminant", "nutrient", "property"].includes(m.type?.kind ?? "") : m.type?.kind === g.kind)),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <label style={labelStyle}>Measurements</label>

      {/* Existing measurements, grouped by kind */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: TEXT_TER, fontFamily: SANS, fontSize: 12.5, padding: "2px 0" }}>
            <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Loading…
          </div>
        ) : measurements.length === 0 ? (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, padding: "2px 0" }}>No measurements yet.</div>
        ) : (
          grouped.map((g) => (
            <div key={g.kind} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE }}>{g.label}</span>
              {g.items.map((m) => (
                editId === m.id ? (
                  <div key={m.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: SURFACE, border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 10 }}>
                    <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT }}>{m.type?.name ?? "—"}</span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ flex: 2, minWidth: 120 }}>
                        <label style={labelStyle}>Value{m.type?.unit ? ` (${m.type.unit})` : ""}</label>
                        <input value={editValue} onChange={(e) => setEditValue(e.target.value)} inputMode="decimal" placeholder="—" style={{ ...inputStyle, padding: "8px 11px" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 90 }}>
                        <label style={labelStyle}>Risk count</label>
                        <input value={editRisk} onChange={(e) => setEditRisk(e.target.value)} inputMode="numeric" placeholder="0" style={{ ...inputStyle, padding: "8px 11px" }} />
                      </div>
                    </div>
                    {editError && <div style={{ padding: "8px 11px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 12, color: DANGER }}>{editError}</div>}
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button" onClick={cancelEdit} disabled={editBusy} style={{ padding: "8px 14px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: TEXT_SEC, cursor: editBusy ? "default" : "pointer" }}>Cancel</button>
                      <button type="button" onClick={() => saveEdit(m)} disabled={editBusy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: SAGE, cursor: editBusy ? "default" : "pointer" }}>
                        {editBusy ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Saving…</> : <><Check size={13} /> Save</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.type?.name ?? "—"}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_SEC }}>{valueLabel(m)}</span>
                        {(m.risk_count ?? 0) > 0 && (
                          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: DANGER, background: "rgba(255,76,92,0.1)", border: `0.5px solid rgba(255,76,92,0.35)`, borderRadius: 6, padding: "1px 6px" }}>
                            {m.risk_count} {m.risk_count === 1 ? "risk" : "risks"}
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => startEdit(m)} disabled={!!editId} aria-label="Edit measurement" className="lab-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, cursor: "pointer" }}>
                      <Pencil size={13} />
                    </button>
                    <button type="button" onClick={() => removeMeasurement(m.id)} disabled={removingId === m.id} aria-label="Remove measurement" className="lab-icon-btn" style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 9, color: TEXT_SEC, cursor: removingId === m.id ? "default" : "pointer" }}>
                      {removingId === m.id ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                )
              ))}
            </div>
          ))
        )}
        {listError && (
          <div style={{ padding: "8px 11px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 12.5, color: DANGER }}>{listError}</div>
        )}
      </div>

      {/* Add measurement form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: `rgba(${FG_RGB},0.03)`, border: `0.5px solid ${BORDER}`, borderRadius: 12 }}>
        {/* existing vs new type */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["existing", "new"] as const).map((m) => {
            const active = addMode === m;
            return (
              <button key={m} type="button" onClick={() => { setAddMode(m); setAddError(""); }} style={{ flex: 1, padding: "9px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: active ? SAGE : TEXT_TER, cursor: "pointer" }}>
                {m === "existing" ? "Pick existing type" : "Create new type"}
              </button>
            );
          })}
        </div>

        {addMode === "existing" ? (
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color={TEXT_TER} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                value={selectedType && !showTypeList ? selectedType.name : typeSearch}
                onChange={(e) => { setTypeSearch(e.target.value); setSelectedTypeId(""); setShowTypeList(true); }}
                onFocus={() => setShowTypeList(true)}
                onBlur={() => setTimeout(() => setShowTypeList(false), 150)}
                placeholder="Search measurement types…"
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
            {showTypeList && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 20, maxHeight: 200, overflowY: "auto", background: BG, border: `0.5px solid ${BORDER_STRONG}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                {filteredTypes.length === 0 ? (
                  <div style={{ padding: "10px 12px", fontFamily: SANS, fontSize: 12.5, color: TEXT_TER }}>No matching types{availableTypes.length === 0 ? " (all are already added)" : ""}.</div>
                ) : filteredTypes.map((t) => (
                  <button key={t.id} type="button" onMouseDown={(e) => { e.preventDefault(); setSelectedTypeId(t.id); setTypeSearch(""); setShowTypeList(false); setAddError(""); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, width: "100%", padding: "9px 12px", background: selectedTypeId === t.id ? `rgba(${SAGE_RGB},0.12)` : "transparent", border: "none", borderBottom: `0.5px solid ${BORDER}`, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                    <span style={{ fontFamily: SANS, fontSize: 10, color: TEXT_TER, flexShrink: 0, textTransform: "capitalize" }}>{[t.kind, t.unit].filter(Boolean).join(" · ")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <input value={ntName} onChange={(e) => setNtName(e.target.value)} placeholder="Type name (e.g. Lead)" style={inputStyle} />
            <div style={{ display: "flex", gap: 6 }}>
              {(["contaminant", "nutrient", "property"] as Kind[]).map((k) => {
                const active = ntKind === k;
                return (
                  <button key={k} type="button" onClick={() => setNtKind(k)} style={{ flex: 1, padding: "8px 6px", background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 9, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase", color: active ? SAGE : TEXT_TER, cursor: "pointer" }}>{k}</button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input value={ntUnit} onChange={(e) => setNtUnit(e.target.value)} placeholder="Unit (e.g. mg/L)" style={{ ...inputStyle, flex: 1, minWidth: 110 }} />
              <input value={ntGuideline} onChange={(e) => setNtGuideline(e.target.value)} inputMode="decimal" placeholder="Guideline limit" style={{ ...inputStyle, flex: 1, minWidth: 110 }} />
              <input value={ntSort} onChange={(e) => setNtSort(e.target.value)} inputMode="numeric" placeholder="Sort order" style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
            </div>
            <textarea value={ntDesc} onChange={(e) => setNtDesc(e.target.value)} placeholder="Description (optional)" rows={2} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }} />
          </>
        )}

        {/* per-product value + risk count */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder={activeUnit ? `Value (${activeUnit})` : "Value"} style={{ ...inputStyle, flex: 2, minWidth: 120 }} />
          <input value={riskCount} onChange={(e) => setRiskCount(e.target.value)} inputMode="numeric" placeholder="Risk count" style={{ ...inputStyle, flex: 1, minWidth: 90 }} />
        </div>

        {addError && <div style={{ padding: "9px 11px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 9, fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: DANGER }}>{addError}</div>}

        <button type="button" onClick={addMeasurement} disabled={adding} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.4)`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: SAGE, cursor: adding ? "default" : "pointer" }}>
          {adding ? <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Adding…</> : <><Plus size={13} /> Add measurement</>}
        </button>
      </div>
    </div>
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

  // Extended fields
  const [score, setScore] = useState(editing?.score != null ? String(editing.score) : "");
  const [labTested, setLabTested] = useState<boolean>(editing?.lab_tested ?? false);
  const [microplastics, setMicroplastics] = useState<Tri>(triFromBool(editing?.microplastics_present));
  const [scoreRationale, setScoreRationale] = useState(editing?.score_rationale ?? "");
  const [shopUrl, setShopUrl] = useState(editing?.shop_url ?? "");
  const [affiliateUrl, setAffiliateUrl] = useState(editing?.affiliate_url ?? "");
  const [price, setPrice] = useState(editing?.price_cents != null ? (editing.price_cents / 100).toFixed(2) : "");
  const [imageUrl, setImageUrl] = useState<string | null>(editing?.image_url ?? null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [propRows, setPropRows] = useState<PropRow[]>(propsToRows(editing?.properties));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = name.trim().length > 0 && categoryId.length > 0 && !busy && !uploadingImage;

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError("");
    setLocalPreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/catalog/products/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const b = await res.json() as { url?: string; error?: string };
      if (!res.ok || !b.url) throw new Error(b.error || "Upload failed");
      setImageUrl(b.url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed");
      setLocalPreview(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => { setImageUrl(null); setLocalPreview(null); setImageError(""); };

  const addPropRow = () => setPropRows((r) => [...r, { key: "", value: "" }]);
  const removePropRow = (i: number) => setPropRows((r) => r.filter((_, idx) => idx !== i));
  const updatePropRow = (i: number, field: keyof PropRow, val: string) =>
    setPropRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setErrorMsg("");

    // Price (dollars) → integer cents
    const priceTrim = price.trim();
    let priceCents: number | null = null;
    if (priceTrim !== "") {
      const dollars = Number(priceTrim);
      if (!Number.isFinite(dollars) || dollars < 0) {
        setErrorMsg("Price must be a positive number");
        setBusy(false);
        return;
      }
      priceCents = Math.round(dollars * 100);
    }

    // Score → number or null
    const scoreTrim = score.trim();
    let scoreVal: number | null = null;
    if (scoreTrim !== "") {
      const n = Number(scoreTrim);
      if (!Number.isFinite(n)) {
        setErrorMsg("Score must be a number between 0 and 100");
        setBusy(false);
        return;
      }
      scoreVal = n;
    }

    // Properties → flat object (drop rows with an empty key)
    const properties: Record<string, string> = {};
    for (const { key, value } of propRows) {
      const k = key.trim();
      if (k) properties[k] = value;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category_id: categoryId,
      description: description.trim(),
      status,
      score: scoreVal,
      lab_tested: labTested,
      microplastics_present: microplastics === "yes" ? true : microplastics === "no" ? false : null,
      score_rationale: scoreRationale.trim(),
      shop_url: shopUrl.trim(),
      affiliate_url: affiliateUrl.trim(),
      price_cents: priceCents,
      image_url: imageUrl,
      properties,
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
  const previewSrc = localPreview ?? imageUrl;

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

          {/* Score + Price (collapses to one column on mobile) */}
          <div className="cat-field-row">
            <div>
              <label style={labelStyle}>Score (0–100)</label>
              <input
                value={score}
                onChange={(e) => setScore(e.target.value)}
                inputMode="numeric"
                placeholder="—"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Price (USD)</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontFamily: SANS, fontSize: 14, color: TEXT_TER, pointerEvents: "none" }}>$</span>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: 24 }}
                />
              </div>
            </div>
          </div>

          {/* Lab tested toggle */}
          <div>
            <label style={labelStyle}>Lab tested</label>
            <button
              type="button"
              onClick={() => setLabTested((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
                background: labTested ? `rgba(${SAGE_RGB},0.14)` : "transparent",
                border: `0.5px solid ${labTested ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                borderRadius: 10, cursor: "pointer", transition: "background 180ms, border-color 180ms",
              }}
            >
              <span style={{
                width: 38, height: 22, borderRadius: 999, flexShrink: 0, position: "relative",
                background: labTested ? SAGE : `rgba(${FG_RGB},0.18)`, transition: "background 180ms",
              }}>
                <span style={{
                  position: "absolute", top: 2, left: labTested ? 18 : 2, width: 18, height: 18, borderRadius: "50%",
                  background: "#fff", transition: "left 180ms",
                }} />
              </span>
              <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: labTested ? SAGE : TEXT_SEC }}>
                {labTested ? "Yes — lab tested" : "Not lab tested"}
              </span>
            </button>
          </div>

          {/* Microplastics — three-state */}
          <div>
            <label style={labelStyle}>Microplastics present</label>
            <div style={{ display: "flex", gap: 8 }}>
              {([["yes", "Yes"], ["no", "No"], ["unknown", "Unknown"]] as [Tri, string][]).map(([val, lbl]) => {
                const active = microplastics === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMicroplastics(val)}
                    style={{
                      flex: 1, padding: "10px 8px",
                      background: active ? `rgba(${SAGE_RGB},0.14)` : "transparent",
                      border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                      borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600,
                      letterSpacing: "0.06em", textTransform: "uppercase",
                      color: active ? SAGE : TEXT_TER, cursor: "pointer",
                      transition: "background 180ms, border-color 180ms, color 180ms",
                    }}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score rationale */}
          <div>
            <label style={labelStyle}>Why this score</label>
            <textarea
              value={scoreRationale}
              onChange={(e) => setScoreRationale(e.target.value)}
              placeholder="Optional — shown on the product detail page"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          {/* Shop + affiliate links */}
          <div>
            <label style={labelStyle}>Shop URL</label>
            <input value={shopUrl} onChange={(e) => setShopUrl(e.target.value)} placeholder="https://… (buy link)" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Affiliate URL</label>
            <input value={affiliateUrl} onChange={(e) => setAffiliateUrl(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>

          {/* Image upload */}
          <div>
            <label style={labelStyle}>Image</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{
                position: "relative", width: 72, height: 72, flexShrink: 0, borderRadius: 12, overflow: "hidden",
                background: `rgba(${FG_RGB},0.05)`, border: `0.5px solid ${BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <ImagePlus size={22} color={TEXT_TER} />
                )}
                {uploadingImage && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Loader2 size={20} color="#fff" style={{ animation: "spin 0.8s linear infinite" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 140 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="lab-icon-btn"
                  style={{
                    padding: "9px 12px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10,
                    fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: TEXT_SEC, cursor: uploadingImage ? "not-allowed" : "pointer",
                  }}
                >
                  {uploadingImage ? "Uploading…" : previewSrc ? "Replace image" : "Upload image"}
                </button>
                {previewSrc && !uploadingImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{ padding: 0, background: "none", border: "none", textAlign: "left", fontFamily: SANS, fontSize: 11, fontWeight: 600, color: TEXT_TER, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            {imageError && (
              <div style={{ marginTop: 8 }}><Eyebrow color={DANGER} size={10}>{imageError}</Eyebrow></div>
            )}
          </div>

          {/* Properties (key/value) editor */}
          <div>
            <label style={labelStyle}>Properties</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {propRows.length === 0 && (
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, padding: "2px 0 4px" }}>
                  No properties yet.
                </div>
              )}
              {propRows.map((row, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={row.key}
                    onChange={(e) => updatePropRow(i, "key", e.target.value)}
                    placeholder="Key"
                    style={{ ...inputStyle, flex: 1, minWidth: 0, padding: "9px 11px" }}
                  />
                  <input
                    value={row.value}
                    onChange={(e) => updatePropRow(i, "value", e.target.value)}
                    placeholder="Value"
                    style={{ ...inputStyle, flex: 1.4, minWidth: 0, padding: "9px 11px" }}
                  />
                  <button
                    type="button"
                    onClick={() => removePropRow(i)}
                    aria-label="Remove property"
                    className="lab-icon-btn"
                    style={{ width: 34, height: 34, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, color: TEXT_SEC, cursor: "pointer" }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addPropRow}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: "transparent", border: `0.5px solid ${BORDER}`, borderRadius: 10, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: SAGE, cursor: "pointer" }}
              >
                <Plus size={13} /> Add property
              </button>
            </div>
          </div>

          {/* Measurements — only for an existing (saved) product */}
          {editing ? (
            <MeasurementsManager token={token} productId={editing.id} />
          ) : (
            <div>
              <label style={labelStyle}>Measurements</label>
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, padding: "2px 0" }}>
                Save the product first, then reopen it to add measurements.
              </div>
            </div>
          )}

          {/* Sources / Lab reports — only for an existing (saved) product */}
          {editing ? (
            <DocumentsManager token={token} productId={editing.id} />
          ) : (
            <div>
              <label style={labelStyle}>Sources / Lab reports</label>
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_TER, padding: "2px 0" }}>
                Save the product first, then reopen it to attach lab reports and links.
              </div>
            </div>
          )}

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
        .lab-row:hover { background: var(--nura-surface-elevated); border-color: rgba(var(--nura-sage-rgb),0.35); transform: translateY(-1px); }
        .nura-primary-btn:hover:not(:disabled) { background: var(--nura-sage-hover) !important; transform: translateY(-1px); }
        .nura-primary-btn:active:not(:disabled) { transform: translateY(0); }
        .lab-icon-btn:hover { border-color: rgba(var(--nura-sage-rgb),0.4) !important; color: var(--nura-sage) !important; }
        .cat-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 420px) { .cat-field-row { grid-template-columns: 1fr; } }
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
          <h1 style={{ fontFamily: SANS, fontSize: 30, fontWeight: 600, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
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
            <h2 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 8px", letterSpacing: "-0.02em" }}>No products yet</h2>
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
