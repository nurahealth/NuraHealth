"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreVertical, Check, X, BookmarkCheck } from "lucide-react";
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
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

interface FormState {
  name: string;
  dose: string;
  timing: string;
  frequency: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  dose: "",
  timing: "",
  frequency: "daily",
  notes: "",
};

type Filter = "all" | "daily" | "weekly" | "recommended";

function CornerBrackets({ size = 8, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  return (
    <>
      <div style={{ position: "absolute", top: 6, left: 6, width: size, height: size, borderTop: `1.5px solid ${c}`, borderLeft: `1.5px solid ${c}` }} />
      <div style={{ position: "absolute", bottom: 6, right: 6, width: size, height: size, borderBottom: `1.5px solid ${c}`, borderRight: `1.5px solid ${c}` }} />
    </>
  );
}

const FREQ_LABELS: Record<string, string> = {
  daily: "DAILY",
  every_other_day: "EOD",
  weekly: "WEEKLY",
  as_needed: "AS NEEDED",
};

function formatFreq(f: string): string {
  return FREQ_LABELS[f] ?? f.toUpperCase().replace(/_/g, " ");
}

function getDetailLine(s: Supplement, streak: number): string {
  const parts: string[] = [];
  if (s.dose) parts.push(s.dose);
  if (s.timing) parts.push(s.timing.toUpperCase());
  parts.push(formatFreq(s.frequency));
  if (s.frequency === "daily" && streak > 0) parts.push(`${streak}D`);
  return parts.join(" · ");
}

export default function SupplementsPage() {
  const router = useRouter();
  const { colors } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<string[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>("all");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalAnimated, setModalAnimated] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<Supplement | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stack save state
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
      .catch(() => {
        setFetchError("Failed to load supplements. Please refresh.");
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    const daily = supplements.filter((s) => s.frequency === "daily");
    if (daily.length === 0) return;
    Promise.all(
      daily.map((s) =>
        getSupplementStreak(s.id).then((streak) => ({ id: s.id, streak }))
      )
    )
      .then((results) => {
        const map: Record<string, number> = {};
        results.forEach(({ id, streak }) => { map[id] = streak; });
        setStreaks(map);
      })
      .catch(() => {});
  }, [supplements]);

  // Animate modal in after mount
  useEffect(() => {
    if (showModal) {
      const raf = requestAnimationFrame(() => setModalAnimated(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setModalAnimated(false);
    }
  }, [showModal]);

  const handleCheck = async (supplementId: string, isLogged: boolean) => {
    if (!user || pendingIds.has(supplementId)) return;
    setPendingIds((prev) => new Set(prev).add(supplementId));
    setTodaysLogs((prev) =>
      isLogged ? prev.filter((id) => id !== supplementId) : [...prev, supplementId]
    );
    try {
      if (isLogged) await unlogSupplementTaken(user.id, supplementId);
      else await logSupplementTaken(user.id, supplementId);
    } catch {
      // Revert optimistic update
      setTodaysLogs((prev) =>
        isLogged ? [...prev, supplementId] : prev.filter((id) => id !== supplementId)
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(supplementId);
        return next;
      });
    }
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditTarget(null);
    setModalMode("add");
    setShowModal(true);
  };

  const openEditModal = (s: Supplement) => {
    setForm({
      name: s.name,
      dose: s.dose ?? "",
      timing: s.timing ?? "",
      frequency: s.frequency,
      notes: s.notes ?? "",
    });
    setFormError("");
    setEditTarget(s);
    setModalMode("edit");
    setOpenMenuId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    if (!user) return;
    setSubmitting(true);
    setFormError("");
    try {
      if (modalMode === "add") {
        const created = await addSupplement(user.id, {
          name: form.name,
          dose: form.dose || undefined,
          timing: form.timing || undefined,
          frequency: form.frequency,
          notes: form.notes || undefined,
        });
        setSupplements((prev) => [created, ...prev]);
      } else if (editTarget) {
        const updated = await updateSupplement(editTarget.id, {
          name: form.name,
          dose: form.dose || null,
          timing: form.timing || null,
          frequency: form.frequency,
          notes: form.notes || null,
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
      setTodaysLogs((prev) => prev.filter((id) => id !== deleteTarget));
      setDeleteTarget(null);
    } catch {
      setDeleting(false);
    }
    setDeleting(false);
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
      setStackSaved(true);
      setShowStackForm(false);
    } catch {
      // silent
    } finally {
      setStackSaving(false);
    }
  };

  const allCount = supplements.length;
  const dailyCount = supplements.filter((s) => s.frequency === "daily").length;
  const weeklyCount = supplements.filter((s) => s.frequency === "weekly").length;
  const recommendedCount = supplements.filter((s) => s.recommended_by_nura).length;
  const takenTodayCount = todaysLogs.filter((id) =>
    supplements.some((s) => s.id === id)
  ).length;

  const filtered = supplements.filter((s) => {
    if (filter === "daily") return s.frequency === "daily";
    if (filter === "weekly") return s.frequency === "weekly";
    if (filter === "recommended") return s.recommended_by_nura;
    return true;
  });

  const deleteTargetName = supplements.find((s) => s.id === deleteTarget)?.name ?? "this supplement";
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "USER";
  const userInitial = userName.charAt(0).toUpperCase();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: colors.mintBgSubtle,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: colors.text,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: colors.textFaint,
    marginBottom: 6,
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes supp-pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
        @keyframes check-glow { 0%,100%{box-shadow:0 0 0 0 ${colors.mint}50} 50%{box-shadow:0 0 0 5px ${colors.mint}00} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder, textarea::placeholder { color: ${colors.textGhost}; }
        select option { background: ${colors.bgSidebar}; color: ${colors.text}; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userInitial={userInitial}
      />

      {/* Sticky filter chips */}
      <div
        style={{
          position: "sticky",
          top: 56,
          zIndex: 50,
          background: colors.bg,
          borderBottom: `1px solid ${colors.borderFaint}`,
          padding: "10px 20px",
          display: "flex",
          gap: 8,
          overflowX: "auto",
        }}
      >
        {[
          { key: "all" as Filter, label: `All · ${allCount}` },
          { key: "daily" as Filter, label: `Daily · ${dailyCount}` },
          { key: "weekly" as Filter, label: `Weekly · ${weeklyCount}` },
          ...(recommendedCount > 0
            ? [{ key: "recommended" as Filter, label: `Recommended · ${recommendedCount}` }]
            : []),
        ].map((chip) => {
          const active = filter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              style={{
                flexShrink: 0,
                fontFamily: FONTS.mono,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "5px 11px",
                borderRadius: 20,
                border: `1px solid ${active ? colors.mintBorderStrong : colors.border}`,
                background: active ? colors.mintBgMedium : "transparent",
                color: active ? colors.mint : colors.textFaint,
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 5px" }}>
              Your Stack
            </h1>
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: colors.textFaint }}>
              {allCount} ACTIVE · {takenTodayCount}/{allCount} TAKEN TODAY
            </span>
          </div>
          <button
            onClick={openAddModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 14px",
              background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              border: "none",
              borderRadius: 20,
              fontFamily: FONTS.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: colors.textOnAccent,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
            ADD
          </button>
        </div>

        {/* Error */}
        {fetchError && (
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.danger, letterSpacing: "0.06em", textAlign: "center", padding: "12px 0" }}>
            {fetchError}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: colors.textFaint, letterSpacing: "1.4px", textAlign: "center", padding: "60px 0" }}>
            LOADING...
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "60px 20px 40px" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                border: `1.5px solid ${colors.mintBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
                background: colors.mintBgSubtle,
              }}
            >
              <Plus size={26} color={colors.mint} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 400, color: colors.text, margin: "0 0 8px" }}>
              No supplements yet
            </h2>
            <p style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: colors.textFaint, margin: "0 0 28px" }}>
              ADD WHAT YOU TAKE DAILY
            </p>
            <button
              onClick={openAddModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 24px",
                background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                border: "none",
                borderRadius: 24,
                fontFamily: FONTS.mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: colors.textOnAccent,
                cursor: "pointer",
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Supplement
            </button>
          </div>
        ) : (
          /* Supplement list */
          <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s) => {
              const isLogged = todaysLogs.includes(s.id);
              const isPending = pendingIds.has(s.id);
              const menuOpen = openMenuId === s.id;
              const streak = streaks[s.id] ?? 0;
              const detailLine = getDetailLine(s, streak);

              return (
                <div
                  key={s.id}
                  style={{
                    position: "relative",
                    background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`,
                    border: `1px solid ${isLogged ? colors.mintBorder : colors.borderFaint}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <CornerBrackets />

                  {/* NURA recommendation badge */}
                  {s.recommended_by_nura && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: colors.mint,
                          animation: "supp-pulse 2s ease-in-out infinite",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: FONTS.mono,
                          fontSize: 9,
                          fontWeight: 600,
                          letterSpacing: "1.1px",
                          textTransform: "uppercase",
                          color: colors.mint,
                        }}
                      >
                        RECOMMENDED BY NŪRA
                      </span>
                    </div>
                  )}

                  {/* Main row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheck(s.id, isLogged)}
                      disabled={isPending}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        border: `1.5px solid ${isLogged ? colors.mint : colors.textGhost}`,
                        background: isLogged ? `${colors.mint}22` : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: isPending ? "not-allowed" : "pointer",
                        flexShrink: 0,
                        padding: 0,
                        opacity: isPending ? 0.5 : 1,
                        boxShadow: isLogged ? `0 0 8px ${colors.mint}50` : "none",
                        transition: "all 0.15s",
                        animation: isLogged ? "check-glow 1.5s ease-out" : "none",
                      }}
                    >
                      {isLogged && <Check size={13} color={colors.mint} strokeWidth={2.5} />}
                    </button>

                    {/* Name + detail line */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 13.5,
                          color: isLogged ? colors.textDim : colors.text,
                          fontWeight: 500,
                          textDecoration: isLogged ? "line-through" : "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </div>
                      {detailLine && (
                        <div
                          style={{
                            fontFamily: FONTS.mono,
                            fontSize: 9.5,
                            color: colors.textFaint,
                            letterSpacing: "0.05em",
                            marginTop: 3,
                          }}
                        >
                          {detailLine}
                        </div>
                      )}
                    </div>

                    {/* Three-dot menu trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(menuOpen ? null : s.id);
                      }}
                      style={{
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: colors.textFaint,
                        borderRadius: 6,
                        flexShrink: 0,
                        padding: 0,
                      }}
                    >
                      <MoreVertical size={15} />
                    </button>
                  </div>

                  {/* Dropdown menu */}
                  {menuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "calc(100% + 4px)",
                        background: colors.bgSidebar,
                        border: `1px solid ${colors.border}`,
                        borderRadius: 10,
                        padding: "6px 0",
                        minWidth: 188,
                        zIndex: 60,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.25)`,
                      }}
                    >
                      <button
                        onClick={() => openEditModal(s)}
                        style={{ width: "100%", padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textMuted, textAlign: "left", display: "block" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setOpenMenuId(null)}
                        style={{ width: "100%", padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textMuted, textAlign: "left", display: "block" }}
                      >
                        {/* TODO: implement pause logic */}
                        Pause for Today
                      </button>
                      <div style={{ height: 1, background: colors.borderFaint, margin: "4px 0" }} />
                      <button
                        onClick={() => { setDeleteTarget(s.id); setOpenMenuId(null); }}
                        style={{ width: "100%", padding: "9px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13.5, color: colors.danger, textAlign: "left", display: "block" }}
                      >
                        Delete from Stack
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Stack */}
          {supplements.length >= 2 && (
            <div style={{ marginTop: 16 }}>
              {stackSaved ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0" }}>
                  <BookmarkCheck size={13} color={colors.mint} />
                  <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: colors.mint }}>
                    STACK SAVED
                  </span>
                </div>
              ) : showStackForm ? (
                <div style={{ padding: "12px 14px", background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, borderRadius: 10 }}>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, color: colors.textFaint, letterSpacing: "1px", marginBottom: 8 }}>
                    STACK SNAPSHOT TITLE
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      value={stackTitle}
                      onChange={(e) => setStackTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveStack(); if (e.key === "Escape") setShowStackForm(false); }}
                      autoFocus
                      style={{ flex: 1, padding: "7px 10px", background: colors.mintBgMedium, border: `1px solid ${colors.mintBorder}`, borderRadius: 7, fontFamily: FONTS.sans, fontSize: 13, color: colors.text, outline: "none" }}
                    />
                    <button
                      onClick={handleSaveStack}
                      disabled={stackSaving || !stackTitle.trim()}
                      style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, border: "none", borderRadius: 7, fontFamily: FONTS.mono, fontSize: 8.5, fontWeight: 700, color: colors.textOnAccent, cursor: "pointer", letterSpacing: "0.8px", opacity: stackSaving ? 0.5 : 1, whiteSpace: "nowrap" }}
                    >
                      {stackSaving ? "..." : "SAVE"}
                    </button>
                    <button
                      onClick={() => setShowStackForm(false)}
                      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 7, cursor: "pointer", color: colors.textFaint, padding: 0, flexShrink: 0 }}
                    >
                      <X size={13} />
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
                    width: "100%", padding: "10px 0",
                    background: "transparent",
                    border: `1px solid ${colors.mintBorder}`,
                    borderRadius: 10,
                    fontFamily: FONTS.mono, fontSize: 9.5, fontWeight: 700,
                    letterSpacing: "1px", color: colors.mint,
                    cursor: "pointer",
                  }}
                >
                  + SAVE CURRENT STACK
                </button>
              )}
            </div>
          )}
          </>
        )}
      </div>

      {/* Menu close backdrop */}
      {openMenuId && (
        <div
          onClick={() => setOpenMenuId(null)}
          style={{ position: "fixed", inset: 0, zIndex: 55 }}
        />
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: colors.overlay,
            zIndex: 300,
            display: "flex",
            alignItems: "flex-end",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              margin: "0 auto",
              background: colors.bgSidebar,
              borderRadius: "20px 20px 0 0",
              border: `1px solid ${colors.mintBorder}`,
              borderBottom: "none",
              maxHeight: "92vh",
              overflowY: "auto",
              transform: modalAnimated ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
              paddingBottom: 32,
            }}
          >
            {/* Drag handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border }} />
            </div>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0" }}>
              <span style={{ fontFamily: FONTS.serif, fontSize: 20, color: colors.text }}>
                {modalMode === "add" ? "Add Supplement" : "Edit Supplement"}
              </span>
              <button
                onClick={closeModal}
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 8, cursor: "pointer", color: colors.textMuted, padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Form body */}
            <div style={{ padding: "20px 20px 0" }}>

              {/* NAME */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  NAME <span style={{ color: colors.danger }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Magnesium Glycinate"
                  style={{
                    ...inputStyle,
                    border: `1px solid ${formError && !form.name.trim() ? colors.danger : colors.border}`,
                  }}
                />
              </div>

              {/* DOSE */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>DOSE</label>
                <input
                  type="text"
                  value={form.dose}
                  onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
                  placeholder="e.g. 400mg"
                  style={inputStyle}
                />
              </div>

              {/* TIMING */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>TIMING</label>
                <select
                  value={form.timing}
                  onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
                  style={{ ...inputStyle, appearance: "none", color: form.timing ? colors.text : colors.textFaint }}
                >
                  <option value="">Select timing...</option>
                  {["AM", "PM", "With food", "Empty stomach", "Anytime"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* FREQUENCY chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>FREQUENCY</label>
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
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, frequency: opt.value }))}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: `1px solid ${active ? colors.mintBorderStrong : colors.border}`,
                          background: active ? colors.mintBgMedium : "transparent",
                          fontFamily: FONTS.mono,
                          fontSize: 10,
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          color: active ? colors.mint : colors.textFaint,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* NOTES */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>NOTES</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                />
              </div>

              {/* Form error */}
              {formError && (
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.danger, letterSpacing: "0.06em", marginBottom: 12 }}>
                  {formError}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: submitting
                    ? colors.mintBgMedium
                    : `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                  border: "none",
                  borderRadius: 12,
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: submitting ? colors.textFaint : colors.textOnAccent,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "SAVING..." : modalMode === "add" ? "ADD TO STACK" : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: colors.overlay,
            zIndex: 400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.bgSidebar,
              border: `1px solid ${colors.dangerBorder}`,
              borderRadius: 16,
              padding: "24px 20px",
              maxWidth: 320,
              width: "100%",
            }}
          >
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: colors.text, margin: "0 0 8px", fontWeight: 400 }}>
              Remove supplement?
            </h3>
            <p style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
              <strong style={{ color: colors.text }}>{deleteTargetName}</strong> and all its logs will be permanently removed from your stack.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: 11,
                  background: colors.mintBgSubtle,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: colors.textMuted,
                  cursor: "pointer",
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: 11,
                  background: colors.dangerBg,
                  border: `1px solid ${colors.dangerBorder}`,
                  borderRadius: 10,
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: colors.danger,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? "REMOVING..." : "REMOVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
