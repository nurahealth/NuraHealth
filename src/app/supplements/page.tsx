"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  getUserSupplements,
  addSupplement,
  updateSupplement,
  deleteSupplement,
  logSupplementTaken,
  unlogSupplementTaken,
  getTodaysLogs,
  getSupplementStreak,
  type Supplement,
} from "@/lib/supplements";
import { saveItem } from "@/lib/saved";
import NuraPageShell from "@/components/NuraPageShell";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const SAGE_RGB = "155,176,165";
const RED = "var(--nura-danger)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

interface FormState { name: string; dose: string; timing: string; frequency: string; notes: string }
const EMPTY_FORM: FormState = { name: "", dose: "", timing: "", frequency: "daily", notes: "" };

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily", every_other_day: "EOD", weekly: "Weekly", as_needed: "As needed",
};

const detailLine = (s: Supplement, streak: number): string => {
  const parts: string[] = [];
  if (s.dose) parts.push(s.dose);
  if (s.timing) parts.push(s.timing);
  parts.push(FREQ_LABELS[s.frequency] ?? s.frequency);
  if (s.frequency === "daily" && streak > 0) parts.push(`${streak}d streak`);
  return parts.join(" · ");
};

export default function SupplementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<string[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedWhy, setExpandedWhy] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [modalAnimated, setModalAnimated] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<Supplement | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [stackSaved, setStackSaved] = useState(false);
  const [stackSaving, setStackSaving] = useState(false);
  const [showStackForm, setShowStackForm] = useState(false);
  const [stackTitle, setStackTitle] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getUserSupplements(user.id), getTodaysLogs(user.id)])
      .then(([supps, logs]) => {
        setSupplements(supps);
        setTodaysLogs(logs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const daily = supplements.filter((s) => s.frequency === "daily");
    if (daily.length === 0) return;
    Promise.all(daily.map((s) => getSupplementStreak(s.id).then((streak) => ({ id: s.id, streak }))))
      .then((results) => {
        const map: Record<string, number> = {};
        results.forEach(({ id, streak }) => { map[id] = streak; });
        setStreaks(map);
      }).catch(() => {});
  }, [supplements]);

  useEffect(() => {
    if (showModal) {
      const raf = requestAnimationFrame(() => setModalAnimated(true));
      return () => cancelAnimationFrame(raf);
    } else { setModalAnimated(false); }
  }, [showModal]);

  const handleCheck = async (id: string, isLogged: boolean) => {
    if (!user || pendingIds.has(id)) return;
    setPendingIds((prev) => new Set(prev).add(id));
    setTodaysLogs((prev) => isLogged ? prev.filter((x) => x !== id) : [...prev, id]);
    try {
      if (isLogged) await unlogSupplementTaken(user.id, id);
      else await logSupplementTaken(user.id, id);
    } catch {
      setTodaysLogs((prev) => isLogged ? [...prev, id] : prev.filter((x) => x !== id));
    } finally {
      setPendingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM); setFormError(""); setEditTarget(null);
    setModalMode("add"); setShowModal(true);
  };

  const openEditModal = (s: Supplement) => {
    setForm({
      name: s.name, dose: s.dose ?? "", timing: s.timing ?? "",
      frequency: s.frequency, notes: s.notes ?? "",
    });
    setFormError(""); setEditTarget(s); setModalMode("edit");
    setOpenMenuId(null); setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); setEditTarget(null);
    setForm(EMPTY_FORM); setFormError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!user) return;
    setSubmitting(true); setFormError("");
    try {
      if (modalMode === "add") {
        const created = await addSupplement(user.id, {
          name: form.name, dose: form.dose || undefined, timing: form.timing || undefined,
          frequency: form.frequency, notes: form.notes || undefined,
        });
        setSupplements((prev) => [created, ...prev]);
      } else if (editTarget) {
        const updated = await updateSupplement(editTarget.id, {
          name: form.name, dose: form.dose || null, timing: form.timing || null,
          frequency: form.frequency, notes: form.notes || null,
        });
        setSupplements((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      }
      closeModal();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSupplement(deleteTarget);
      setSupplements((prev) => prev.filter((s) => s.id !== deleteTarget));
      setTodaysLogs((prev) => prev.filter((x) => x !== deleteTarget));
      setDeleteTarget(null);
    } catch {} finally { setDeleting(false); }
  };

  const handleSaveStack = async () => {
    if (!user || !stackTitle.trim()) return;
    setStackSaving(true);
    try {
      const content = supplements
        .map((s) => `${s.name}${s.dose ? ` · ${s.dose}` : ""}${s.timing ? ` · ${s.timing}` : ""} (${s.frequency})`)
        .join("\n");
      await saveItem(user.id, {
        type: "stack",
        title: stackTitle.trim(),
        description: `${supplements.length} supplement${supplements.length !== 1 ? "s" : ""} snapshot`,
        content,
        metadata: { supplement_count: supplements.length },
      });
      setStackSaved(true); setShowStackForm(false);
    } catch {} finally { setStackSaving(false); }
  };

  if (authLoading) return <NuraPageShell><div /></NuraPageShell>;

  const stackItems = supplements.filter((s) => !s.recommended_by_nura);
  const recommended = supplements.filter((s) => s.recommended_by_nura);

  const targetName = supplements.find((s) => s.id === deleteTarget)?.name ?? "this supplement";

  return (
    <NuraPageShell maxWidth={600}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* HERO */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Supplements
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>Your stack.</p>
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={openAddModal}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 11, border: "none",
          background: SAGE, color: SAGE_ON,
          fontFamily: SANS, fontSize: 14, fontWeight: 500, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          marginBottom: 22, transition: "background 200ms ease",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Add supplement
      </button>

      {loading ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>Loading…</div>
      ) : supplements.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center", borderRadius: 14,
          background: SURFACE, border: `0.5px dashed ${BORDER}`,
        }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, margin: "0 0 6px" }}>No supplements yet</h2>
          <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
            Add what you take daily.
          </p>
        </div>
      ) : (
        <>
          {/* MY STACK */}
          <SectionLabel>My stack · {stackItems.length}</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {stackItems.map((s) => (
              <SuppCard
                key={s.id}
                s={s}
                isLogged={todaysLogs.includes(s.id)}
                pending={pendingIds.has(s.id)}
                streak={streaks[s.id] ?? 0}
                menuOpen={openMenuId === s.id}
                onCheck={() => handleCheck(s.id, todaysLogs.includes(s.id))}
                onMenuToggle={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                onEdit={() => openEditModal(s)}
                onDelete={() => { setDeleteTarget(s.id); setOpenMenuId(null); }}
              />
            ))}
            {stackItems.length === 0 && (
              <div style={{ padding: "16px", borderRadius: 12, background: SURFACE, border: `0.5px solid ${BORDER}`, color: TEXT_TER, fontSize: 13, textAlign: "center" }}>
                Nothing in your stack yet.
              </div>
            )}
          </div>

          {/* RECOMMENDED BY NŪRA */}
          {recommended.length > 0 && (
            <>
              <SectionLabel>Recommended by NŪRA · {recommended.length}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {recommended.map((s) => (
                  <SuppCard
                    key={s.id}
                    s={s}
                    isLogged={todaysLogs.includes(s.id)}
                    pending={pendingIds.has(s.id)}
                    streak={streaks[s.id] ?? 0}
                    menuOpen={openMenuId === s.id}
                    expanded={expandedWhy.has(s.id)}
                    isRecommended
                    onCheck={() => handleCheck(s.id, todaysLogs.includes(s.id))}
                    onMenuToggle={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                    onEdit={() => openEditModal(s)}
                    onDelete={() => { setDeleteTarget(s.id); setOpenMenuId(null); }}
                    onToggleWhy={() => {
                      setExpandedWhy((prev) => {
                        const next = new Set(prev);
                        if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                        return next;
                      });
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Save stack */}
          {supplements.length >= 2 && (
            <div style={{ marginTop: 8 }}>
              {stackSaved ? (
                <div style={{ textAlign: "center", padding: "10px 0", fontSize: 11, color: SAGE, letterSpacing: "0.5px" }}>
                  ✓ Stack saved
                </div>
              ) : showStackForm ? (
                <div style={{ padding: 14, borderRadius: 12, background: SURFACE, border: `0.5px solid ${BORDER}` }}>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: TEXT_TER, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>
                    Snapshot title
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={stackTitle}
                      onChange={(e) => setStackTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveStack(); if (e.key === "Escape") setShowStackForm(false); }}
                      autoFocus
                      style={{
                        flex: 1, padding: "9px 12px", borderRadius: 9,
                        background: "var(--nura-surface-elevated)", border: `0.5px solid ${BORDER}`,
                        color: TEXT, fontFamily: SANS, fontSize: 13, outline: "none",
                      }}
                    />
                    <button onClick={handleSaveStack} disabled={stackSaving || !stackTitle.trim()} style={{
                      padding: "9px 16px", borderRadius: 9, border: "none",
                      background: SAGE, color: SAGE_ON,
                      fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      opacity: stackSaving ? 0.5 : 1, whiteSpace: "nowrap",
                    }}>
                      {stackSaving ? "…" : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    setStackTitle(`My Stack — ${today}`);
                    setShowStackForm(true);
                  }}
                  style={{
                    width: "100%", padding: "10px 0", borderRadius: 10,
                    background: "transparent", border: `0.5px solid rgba(var(--nura-sage-rgb),0.35)`,
                    color: SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  + Save current stack
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Backdrop for closing menu */}
      {openMenuId && <div onClick={() => setOpenMenuId(null)} style={{ position: "fixed", inset: 0, zIndex: 55 }} />}

      {/* Add/Edit modal */}
      {showModal && (
        <SuppModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          formError={formError}
          submitting={submitting}
          animated={modalAnimated}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div onClick={() => !deleting && setDeleteTarget(null)} style={{
          position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "var(--nura-bg)", border: `1px solid rgba(212,87,77,0.4)`,
            borderRadius: 14, padding: "22px 20px", maxWidth: 320, width: "100%",
          }}>
            <h3 style={{ fontFamily: SERIF, fontSize: 22, color: TEXT, margin: "0 0 8px", fontWeight: 500 }}>Remove supplement?</h3>
            <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 20px", lineHeight: 1.6 }}>
              <strong style={{ color: TEXT }}>{targetName}</strong> and all its logs will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: SURFACE, border: `0.5px solid ${BORDER}`,
                color: TEXT, fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: "11px 0", borderRadius: 10,
                background: "rgba(212,87,77,0.12)", border: `1px solid rgba(212,87,77,0.4)`,
                color: RED, fontFamily: SANS, fontSize: 13, fontWeight: 500,
                cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1,
              }}>
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </NuraPageShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
      color: TEXT_TER, textTransform: "uppercase", marginBottom: 10,
    }}>{children}</div>
  );
}

// ── Supplement card ──────────────────────────────────────────────────────────
function SuppCard({
  s, isLogged, pending, streak, menuOpen,
  isRecommended = false, expanded = false,
  onCheck, onMenuToggle, onEdit, onDelete, onToggleWhy,
}: {
  s: Supplement; isLogged: boolean; pending: boolean; streak: number; menuOpen: boolean;
  isRecommended?: boolean; expanded?: boolean;
  onCheck: () => void; onMenuToggle: () => void;
  onEdit: () => void; onDelete: () => void; onToggleWhy?: () => void;
}) {
  return (
    <div style={{
      position: "relative", padding: "14px 16px", borderRadius: 14,
      background: SURFACE, border: `0.5px solid ${BORDER}`,
      borderLeft: isRecommended ? `2px solid ${SAGE}` : `0.5px solid ${BORDER}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Check button */}
        <button
          onClick={onCheck}
          disabled={pending}
          aria-label={isLogged ? "Mark as not taken" : "Mark as taken"}
          style={{
            width: 28, height: 28, borderRadius: 8, padding: 0, flexShrink: 0,
            background: isLogged ? SAGE : "transparent",
            border: `1.5px solid ${isLogged ? SAGE : "rgba(var(--nura-fg-rgb),0.2)"}`,
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.5 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: SAGE_ON, transition: "all 160ms",
          }}
        >
          {isLogged && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: SANS, fontSize: 14, fontWeight: 500,
            color: isLogged ? TEXT_SEC : TEXT,
            textDecoration: isLogged ? "line-through" : "none",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {s.name}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, marginTop: 3 }}>
            {detailLine(s, streak)}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
          aria-label="Menu"
          style={{
            width: 28, height: 28, padding: 0, flexShrink: 0, borderRadius: 7,
            background: "transparent", border: "none", cursor: "pointer", color: TEXT_TER,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>⋮</span>
        </button>
      </div>

      {/* Why expandable for recommended */}
      {isRecommended && s.recommendation_reason && onToggleWhy && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${BORDER}` }}>
          <button
            onClick={onToggleWhy}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: SANS, fontSize: 11, color: SAGE, fontWeight: 500, letterSpacing: "0.3px",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            Why
            <span style={{
              display: "inline-block",
              transition: "transform 200ms",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </span>
          </button>
          {expanded && (
            <p style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.6, margin: "8px 0 0" }}>
              {s.recommendation_reason}
            </p>
          )}
        </div>
      )}

      {/* Dropdown menu */}
      {menuOpen && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: "absolute", right: 10, top: "calc(100% + 4px)",
          background: "var(--nura-bg)", border: `0.5px solid ${BORDER}`,
          borderRadius: 10, padding: "6px 0", minWidth: 160, zIndex: 60,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        }}>
          <button onClick={onEdit} style={{
            width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
            fontFamily: SANS, fontSize: 13, color: TEXT, textAlign: "left",
          }}>
            Edit
          </button>
          <div style={{ height: 0.5, background: BORDER, margin: "4px 0" }} />
          <button onClick={onDelete} style={{
            width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
            fontFamily: SANS, fontSize: 13, color: RED, textAlign: "left",
          }}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Add/Edit Modal ────────────────────────────────────────────────────────────
function SuppModal({
  mode, form, setForm, formError, submitting, animated, onClose, onSubmit,
}: {
  mode: "add" | "edit"; form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>;
  formError: string; submitting: boolean; animated: boolean;
  onClose: () => void; onSubmit: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "11px 12px", borderRadius: 10,
    background: "var(--nura-surface-elevated)", border: `0.5px solid ${BORDER}`,
    color: TEXT, fontFamily: SANS, fontSize: 14, outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
    letterSpacing: "1.5px", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 600, margin: "0 auto",
        background: "var(--nura-bg)", borderRadius: "18px 18px 0 0",
        border: `0.5px solid ${BORDER}`, borderBottom: "none",
        maxHeight: "92vh", overflowY: "auto",
        transform: animated ? "translateY(0)" : "translateY(100%)",
        transition: "transform 350ms cubic-bezier(0.32,0.72,0.34,1.01)",
        paddingBottom: 32,
      }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: BORDER }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 22px 0" }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, color: TEXT, fontWeight: 500 }}>
            {mode === "add" ? "Add supplement" : "Edit supplement"}
          </span>
          <button onClick={onClose} aria-label="Close" style={{
            width: 32, height: 32, borderRadius: 9,
            background: SURFACE, border: `0.5px solid ${BORDER}`, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_SEC, padding: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: "20px 22px 0" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Name <span style={{ color: RED }}>*</span></label>
            <input
              type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Magnesium Glycinate"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Dose</label>
            <input
              type="text" value={form.dose}
              onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
              placeholder="e.g. 400mg"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Timing</label>
            <select
              value={form.timing}
              onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
              style={{ ...inputStyle, appearance: "none", color: form.timing ? TEXT : TEXT_TER }}
            >
              <option value="">Select timing…</option>
              {["AM", "PM", "With food", "Empty stomach", "Anytime"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Frequency</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: "daily", label: "Daily" },
                { value: "every_other_day", label: "EOD" },
                { value: "weekly", label: "Weekly" },
                { value: "as_needed", label: "As needed" },
              ].map((opt) => {
                const active = form.frequency === opt.value;
                return (
                  <button
                    key={opt.value} type="button"
                    onClick={() => setForm((f) => ({ ...f, frequency: opt.value }))}
                    style={{
                      padding: "7px 14px", borderRadius: 20,
                      background: active ? `rgba(var(--nura-sage-rgb),0.15)` : "transparent",
                      border: `0.5px solid ${active ? `rgba(var(--nura-sage-rgb),0.4)` : BORDER}`,
                      color: active ? SAGE : TEXT_SEC,
                      fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      transition: "all 160ms",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes…"
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          {formError && (
            <div style={{
              padding: "9px 12px", borderRadius: 9, marginBottom: 12,
              background: "rgba(212,87,77,0.08)", border: `1px solid rgba(212,87,77,0.3)`,
              color: RED, fontFamily: SANS, fontSize: 12,
            }}>{formError}</div>
          )}

          <button
            onClick={onSubmit}
            disabled={submitting}
            onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = SAGE_HOV; }}
            onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = SAGE; }}
            style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none",
              background: submitting ? `rgba(var(--nura-sage-rgb),0.4)` : SAGE,
              color: SAGE_ON, fontFamily: SANS, fontSize: 14, fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer", transition: "background 200ms",
            }}
          >
            {submitting ? "Saving…" : mode === "add" ? "Add to stack" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
