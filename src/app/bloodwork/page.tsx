"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  getUserPanels,
  getPanelsBiomarkers,
  deletePanelAndBiomarkers,
  type LabPanel,
  type Biomarker,
} from "@/lib/bloodwork";
import NuraPageShell from "@/components/NuraPageShell";
import StoryMode, { StoryModeSkeleton, type Narrative } from "./StoryMode";

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
const AMBER = "var(--nura-watch)";
const RED = "var(--nura-danger)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return d; }
};

function countsByStatus(bm: Biomarker[]) {
  return {
    optimal: bm.filter((b) => b.status === "optimal").length,
    watch: bm.filter((b) => b.status === "watch").length,
    alert: bm.filter((b) => b.status === "low" || b.status === "high" || b.status === "critical").length,
  };
}

function BloodworkPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: "labs" | "report" = viewParam === "report" ? "report" : "labs";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [panelBM, setPanelBM] = useState<Record<string, Biomarker[]>>({});
  const [panelsLoading, setPanelsLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Story Mode state
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [narrativeId, setNarrativeId] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const setView = useCallback((next: "labs" | "report") => {
    const target = next === "report" ? "/bloodwork?view=report" : "/bloodwork?view=labs";
    router.replace(target, { scroll: false });
  }, [router]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  const loadPanels = useCallback(async (userId: string) => {
    setPanelsLoading(true);
    try {
      const fetched = await getUserPanels(userId);
      setPanels(fetched);
      const ids = fetched.filter((p) => p.status === "analyzed").map((p) => p.id);
      if (ids.length > 0) {
        const bm = await getPanelsBiomarkers(ids);
        setPanelBM(bm);
      }
    } catch {
      // silent
    } finally {
      setPanelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadPanels(user.id);
  }, [user, loadPanels]);

  // Fetch or generate the latest narrative for the most-recent analyzed panel.
  const ensureNarrative = useCallback(async (panelId: string, forceGenerate: boolean) => {
    setNarrativeError(null);
    if (!forceGenerate) {
      const { data: existing, error } = await supabase
        .from("bloodwork_narratives")
        .select("id, narrative, created_at")
        .eq("panel_id", panelId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && existing) {
        const row = existing as { id: string; narrative: Narrative };
        setNarrative(row.narrative);
        setNarrativeId(row.id);
        return;
      }
    }

    if (forceGenerate) setRegenerating(true);
    else setNarrativeLoading(true);

    try {
      const res = await fetch("/api/bloodwork/narrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panelId }),
      });
      const data = await res.json() as { narrative?: Narrative; narrativeId?: string; error?: string };
      if (!res.ok || !data.narrative || !data.narrativeId) {
        throw new Error(data.error ?? "Could not generate narrative");
      }
      setNarrative(data.narrative);
      setNarrativeId(data.narrativeId);
    } catch (e) {
      setNarrativeError(e instanceof Error ? e.message : "Could not generate narrative");
    } finally {
      setNarrativeLoading(false);
      setRegenerating(false);
    }
  }, []);

  // When panels load and we have at least one analyzed panel, ensure a narrative.
  useEffect(() => {
    if (panelsLoading) return;
    const latest = panels.find((p) => p.status === "analyzed");
    if (!latest) {
      setNarrative(null);
      setNarrativeId(null);
      return;
    }
    void ensureNarrative(latest.id, false);
  }, [panels, panelsLoading, ensureNarrative]);

  const handleRegenerate = useCallback(async () => {
    const latest = panels.find((p) => p.status === "analyzed");
    if (!latest) return;
    await ensureNarrative(latest.id, true);
  }, [panels, ensureNarrative]);

  const handleFile = async (file: File) => {
    if (!user) return;
    setUploadError(null);
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are supported.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10MB.");
      return;
    }
    setUploadStatus("uploading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      setUploadStatus("processing");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/bloodwork/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(body.error ?? "Upload failed");
      }
      setUploadStatus("done");
      await loadPanels(user.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploadStatus("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePanelAndBiomarkers(deleteTarget);
      setPanels((prev) => prev.filter((p) => p.id !== deleteTarget));
      setPanelBM((prev) => { const next = { ...prev }; delete next[deleteTarget]; return next; });
      setDeleteTarget(null);
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";
  const analyzed = panels.filter((p) => p.status === "analyzed");
  const latestPanel = analyzed[0];

  if (authLoading) return <NuraPageShell><div /></NuraPageShell>;

  return (
    <NuraPageShell maxWidth={680}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* HERO */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Bloodwork
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>
          Upload labs. NŪRA reads them.
        </p>
      </div>

      {/* LABS / REPORT TOGGLE */}
      <div style={{ marginBottom: 32 }}>
        <div
          role="tablist"
          style={{
            display: "inline-flex", padding: 3, borderRadius: 9999,
            background: "transparent", border: `0.5px solid ${BORDER}`,
          }}
        >
          <ViewTab label="Labs" active={view === "labs"} onClick={() => setView("labs")} />
          <ViewTab label="Report" active={view === "report"} onClick={() => setView("report")} />
        </div>
      </div>

      {/* REPORT VIEW */}
      {view === "report" && (
        <>
          {!latestPanel ? (
            <ReportEmpty onGoToLabs={() => setView("labs")} />
          ) : narrative ? (
            <StoryMode
              narrative={narrative}
              narrativeId={narrativeId ?? ""}
              panelDate={latestPanel.collected_date}
              onRegenerate={handleRegenerate}
              regenerating={regenerating}
            />
          ) : narrativeLoading ? (
            <StoryModeSkeleton />
          ) : narrativeError ? (
            <div style={{
              margin: "32px 0", padding: "14px 16px", borderRadius: 12,
              background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.3)`,
              color: RED, fontFamily: SANS, fontSize: 13, lineHeight: 1.6,
            }}>
              {narrativeError}
              <button
                onClick={handleRegenerate}
                style={{
                  marginLeft: 10, padding: "4px 10px", borderRadius: 8,
                  background: "transparent", border: `0.5px solid rgba(212,87,77,0.4)`,
                  color: RED, fontFamily: SANS, fontSize: 12, cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <StoryModeSkeleton />
          )}
        </>
      )}

      {/* LABS VIEW (default) */}
      {view === "labs" && (
        <>
      {/* UPLOAD ZONE */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? SAGE : `rgba(var(--nura-sage-rgb),0.35)`}`,
          background: dragging ? `rgba(var(--nura-sage-rgb),0.08)` : `rgba(var(--nura-sage-rgb),0.04)`,
          borderRadius: 14, padding: 28,
          display: "flex", flexDirection: "column", alignItems: "center",
          textAlign: "center", gap: 10,
          cursor: isUploading ? "wait" : "pointer",
          transition: "all 200ms ease",
          marginBottom: 22,
        }}
      >
        {isUploading ? (
          <>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              border: `2.5px solid rgba(var(--nura-sage-rgb),0.2)`, borderTopColor: SAGE,
              animation: "spin 0.9s linear infinite",
            }} />
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT }}>
              {uploadStatus === "uploading" ? "Uploading…" : "NŪRA reading your labs…"}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, letterSpacing: "0.5px" }}>
              Extracting biomarkers
            </div>
          </>
        ) : uploadStatus === "done" ? (
          <>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: `rgba(var(--nura-sage-rgb),0.15)`, border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
              display: "flex", alignItems: "center", justifyContent: "center", color: SAGE,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: SAGE }}>
              Analysis complete
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER, letterSpacing: "1px", textTransform: "uppercase" }}>
              Upload another
            </div>
          </>
        ) : (
          <>
            <div style={{ color: SAGE }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8a6 6 0 0 0-11.6-1A4.5 4.5 0 1 0 6 17h10a4 4 0 0 0 1-7.9z"/>
                <path d="M12 11v6M9 14l3-3 3 3"/>
              </svg>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 500, color: TEXT }}>
              Upload your bloodwork
            </div>
            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
              color: SAGE, textTransform: "uppercase",
            }}>
              PDF · LABCORP · QUEST · OTHERS
            </div>
            <button
              onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
              style={{
                marginTop: 4, padding: "10px 20px", borderRadius: 11, border: "none",
                background: SAGE, color: SAGE_ON,
                fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "background 200ms ease",
              }}
            >
              Choose file
            </button>
          </>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" style={{ display: "none" }} onChange={handleFileInput} />

      {uploadError && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: 16,
          background: "rgba(212,87,77,0.08)", border: `1px solid rgba(212,87,77,0.28)`,
          color: RED, fontSize: 13, fontFamily: SANS,
        }}>
          {uploadError}
        </div>
      )}

      {/* LATEST INSIGHT */}
      {latestPanel?.insight && (
        <div style={{
          padding: "16px 18px", marginBottom: 22, borderRadius: 14,
          background: SURFACE, border: `0.5px solid ${BORDER}`, borderLeft: `2px solid ${SAGE}`,
        }}>
          <div style={{
            fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
            color: SAGE, textTransform: "uppercase", marginBottom: 8,
          }}>
            Latest read
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT, margin: 0, lineHeight: 1.6 }}>
            {latestPanel.insight}
          </p>
        </div>
      )}

      {/* PANELS LIST */}
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
        color: TEXT_TER, textTransform: "uppercase", marginBottom: 10,
      }}>
        Recent panels · {panels.length}
      </div>

      {panelsLoading ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>Loading…</div>
      ) : panels.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>
          No panels yet. Upload your first lab report above.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {panels.map((p) => {
            const bm = panelBM[p.id] ?? [];
            const counts = countsByStatus(bm);
            const clickable = p.status === "analyzed";

            return (
              <div
                key={p.id}
                onClick={() => clickable && router.push(`/bloodwork/${p.id}`)}
                style={{
                  position: "relative", padding: "14px 16px", borderRadius: 14,
                  background: SURFACE, border: `0.5px solid ${BORDER}`,
                  cursor: clickable ? "pointer" : "default",
                  transition: "background 160ms, border-color 160ms",
                }}
                onMouseEnter={(e) => {
                  if (clickable) {
                    e.currentTarget.style.background = "var(--nura-surface-elevated)";
                    e.currentTarget.style.borderColor = `rgba(var(--nura-sage-rgb),0.25)`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = SURFACE;
                  e.currentTarget.style.borderColor = BORDER;
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT,
                      marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>
                      {fmtDate(p.collected_date)}
                    </div>

                    {p.status === "processing" && (
                      <div style={{ marginTop: 8 }}>
                        <StatusPill color={AMBER} label="Processing" />
                      </div>
                    )}
                    {p.status === "failed" && (
                      <div style={{ marginTop: 8 }}>
                        <StatusPill color={RED} label="Failed" />
                      </div>
                    )}

                    {p.status === "analyzed" && (counts.optimal + counts.watch + counts.alert) > 0 && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {counts.optimal > 0 && <StatusPill color={SAGE} label={`${counts.optimal} optimal`} />}
                        {counts.watch > 0 && <StatusPill color={AMBER} label={`${counts.watch} watch`} />}
                        {counts.alert > 0 && <StatusPill color={RED} label={`${counts.alert} alert`} />}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    {p.status === "analyzed" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT_TER} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 6l6 6-6 6"/>
                      </svg>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(p.id); }}
                      aria-label="Delete"
                      style={{
                        width: 28, height: 28, padding: 0, borderRadius: 7,
                        background: "transparent", border: "none", cursor: "pointer",
                        color: TEXT_TER, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>⋮</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {deleteTarget && (
        <DeleteModal
          onCancel={() => !deleting && setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </NuraPageShell>
  );
}

function ReportEmpty({ onGoToLabs }: { onGoToLabs: () => void }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", padding: "48px 20px 32px",
    }}>
      <h2 style={{
        fontFamily: SERIF, fontWeight: 500, color: TEXT,
        fontSize: "clamp(22px, 3.4vw, 28px)", lineHeight: 1.25, letterSpacing: "-0.3px",
        margin: "0 0 14px",
      }}>
        Your report starts with your first lab upload.
      </h2>
      <p style={{
        fontFamily: SANS, fontSize: 16, color: TEXT_SEC, lineHeight: 1.6,
        maxWidth: 480, margin: "0 0 24px",
      }}>
        Upload bloodwork in the Labs tab to generate your personalized health report.
      </p>
      <button
        type="button"
        onClick={onGoToLabs}
        onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
        style={{
          padding: "11px 20px", borderRadius: 11, border: "none",
          background: SAGE, color: SAGE_ON,
          fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 6,
          transition: "background 200ms",
        }}
      >
        Go to Labs →
      </button>
    </div>
  );
}

function ViewTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = TEXT_SEC; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = TEXT_TER; }}
      style={{
        padding: "8px 18px", borderRadius: 9999, border: "none",
        background: active ? SAGE : "transparent",
        color: active ? SAGE_ON : TEXT_TER,
        fontFamily: SANS, fontSize: 13, fontWeight: active ? 500 : 400,
        cursor: "pointer", transition: "background 160ms, color 160ms",
      }}
    >
      {label}
    </button>
  );
}

export default function BloodworkPage() {
  return (
    <Suspense fallback={null}>
      <BloodworkPageInner />
    </Suspense>
  );
}

function StatusPill({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 8px", borderRadius: 4,
      background: `${color}1f`, border: `1px solid ${color}40`,
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.8px",
      color, textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

function DeleteModal({ onCancel, onConfirm, deleting }: { onCancel: () => void; onConfirm: () => void; deleting: boolean }) {
  return (
    <div onClick={onCancel} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "var(--nura-bg)", border: `1px solid rgba(212,87,77,0.4)`,
        borderRadius: 14, padding: "22px 20px", maxWidth: 320, width: "100%",
      }}>
        <h3 style={{ fontFamily: SERIF, fontSize: 22, color: TEXT, margin: "0 0 8px", fontWeight: 500 }}>Delete panel?</h3>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: "0 0 20px", lineHeight: 1.6 }}>
          This panel and all extracted biomarkers will be permanently removed.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} disabled={deleting} style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            color: TEXT, fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting} style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            background: "rgba(212,87,77,0.12)", border: `1px solid rgba(212,87,77,0.4)`,
            color: RED, fontFamily: SANS, fontSize: 13, fontWeight: 500,
            cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1,
          }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
