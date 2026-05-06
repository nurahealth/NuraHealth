"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Upload, FileText, AlertTriangle, CheckCircle, Trash2, RefreshCw } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import {
  getUserPanels,
  getPanelsBiomarkers,
  deletePanelAndBiomarkers,
  type LabPanel,
  type Biomarker,
} from "@/lib/bloodwork";

function CornerBrackets({ size = 10, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  const s = `${size}px`;
  return (
    <>
      <div style={{ position: "absolute", top: 6, left: 6, width: s, height: s, borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}` }} />
      <div style={{ position: "absolute", bottom: 6, right: 6, width: s, height: s, borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
    </>
  );
}

function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

type UploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

function countsByStatus(biomarkers: Biomarker[]) {
  return {
    optimal: biomarkers.filter((b) => b.status === "optimal").length,
    watch: biomarkers.filter((b) => b.status === "watch").length,
    low: biomarkers.filter((b) => b.status === "low").length,
    high: biomarkers.filter((b) => b.status === "high").length,
    critical: biomarkers.filter((b) => b.status === "critical").length,
    total: biomarkers.length,
  };
}

export default function BloodworkPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [panels, setPanels] = useState<LabPanel[]>([]);
  const [panelBiomarkers, setPanelBiomarkers] = useState<Record<string, Biomarker[]>>({});
  const [panelsLoading, setPanelsLoading] = useState(true);
  const [panelsError, setPanelsError] = useState<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedPanelId, setUploadedPanelId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  const loadPanels = async (userId: string) => {
    setPanelsLoading(true);
    setPanelsError(null);
    try {
      const fetchedPanels = await getUserPanels(userId);
      setPanels(fetchedPanels);
      const analyzedIds = fetchedPanels
        .filter((p) => p.status === "analyzed")
        .map((p) => p.id);
      if (analyzedIds.length > 0) {
        const bm = await getPanelsBiomarkers(analyzedIds);
        setPanelBiomarkers(bm);
      }
    } catch {
      setPanelsError("Failed to load panels.");
    } finally {
      setPanelsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadPanels(user.id);
  }, [user]);

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

      const result = await res.json() as { panelId: string };
      setUploadedPanelId(result.panelId);
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
      setPanelBiomarkers((prev) => {
        const next = { ...prev };
        delete next[deleteTarget];
        return next;
      });
      setDeleteTarget(null);
    } catch {
      // silent — leave modal open so user can retry
    } finally {
      setDeleting(false);
    }
  };

  const latestInsight = panels.find((p) => p.status === "analyzed" && p.insight)?.insight ?? null;

  const isUploading = uploadStatus === "uploading" || uploadStatus === "processing";

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 4px" }}>
            Bloodwork Panel
          </h1>
          <MonoLabel color={colors.textFaint}>UPLOAD LABS · NŪRA READS THEM</MonoLabel>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            position: "relative",
            border: `2px dashed ${dragging ? colors.mint : isUploading ? colors.mintBorderStrong : colors.mintBorder}`,
            borderRadius: 16,
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            background: dragging ? colors.mintBgMedium : isUploading ? colors.mintBgMedium : colors.mintBgSubtle,
            transition: "all 0.2s",
            marginBottom: 20,
            cursor: isUploading ? "not-allowed" : "pointer",
          }}
        >
          {isUploading ? (
            <>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: `3px solid ${colors.mintBorder}`,
                  borderTopColor: colors.mint,
                  animation: "spin 1s linear infinite",
                }}
              />
              <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500, color: colors.textMuted, textAlign: "center" }}>
                {uploadStatus === "uploading" ? "Uploading PDF..." : "NŪRA is analyzing your labs..."}
              </div>
              <MonoLabel color={colors.textGhost}>
                {uploadStatus === "processing" ? "THIS MAY TAKE 20–40 SECONDS" : "PLEASE WAIT"}
              </MonoLabel>
            </>
          ) : uploadStatus === "done" ? (
            <>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${colors.mint}20`, border: `1px solid ${colors.mintBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={24} color={colors.mint} />
              </div>
              <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 500, color: colors.mint, textAlign: "center" }}>
                Analysis complete
              </div>
              <MonoLabel color={colors.textGhost}>UPLOAD ANOTHER PDF</MonoLabel>
            </>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: colors.mintBgMedium, border: `1px solid ${colors.mintBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={24} color={colors.mint} />
              </div>
              <div style={{ fontFamily: FONTS.sans, fontSize: 15, fontWeight: 500, color: colors.textMuted, textAlign: "center" }}>
                Upload bloodwork
              </div>
              <MonoLabel color={colors.textGhost}>PDF ONLY · MAX 10MB</MonoLabel>
              <div
                style={{
                  marginTop: 4,
                  padding: "9px 20px",
                  background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                  borderRadius: 8,
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: colors.textOnAccent,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                }}
              >
                Choose File
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        {/* Upload error */}
        {uploadError && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: colors.dangerBg,
            border: `1px solid ${colors.dangerBorder}`,
            borderRadius: 10,
            marginBottom: 16,
          }}>
            <AlertTriangle size={14} color={colors.danger} />
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.danger, letterSpacing: "0.06em" }}>
              {uploadError}
            </span>
          </div>
        )}

        {/* Recent Panels */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <MonoLabel color={colors.textMuted}>RECENT PANELS</MonoLabel>
              {!panelsLoading && (
                <div style={{ width: 18, height: 16, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MonoLabel color={colors.textFaint}>{panels.length}</MonoLabel>
                </div>
              )}
            </div>
            {!panelsLoading && (
              <button
                onClick={() => user && loadPanels(user.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.textFaint, padding: 4, display: "flex", alignItems: "center" }}
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>

          {panelsLoading ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", textAlign: "center", padding: "24px 0" }}>
              LOADING...
            </div>
          ) : panelsError ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.danger, textAlign: "center", padding: "16px 0" }}>
              {panelsError}
            </div>
          ) : panels.length === 0 ? (
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textFaint, letterSpacing: "1.2px", textAlign: "center", padding: "24px 0" }}>
              NO PANELS YET — UPLOAD YOUR FIRST LAB REPORT
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {panels.map((panel) => {
                const bm = panelBiomarkers[panel.id] ?? [];
                const counts = countsByStatus(bm);
                const isProcessing = panel.status === "processing";
                const isFailed = panel.status === "failed";
                const isNew = panel.id === uploadedPanelId;

                return (
                  <div
                    key={panel.id}
                    style={{
                      position: "relative",
                      padding: "16px",
                      background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`,
                      border: `1px solid ${isNew ? colors.mintBorderStrong : colors.border}`,
                      borderRadius: 12,
                    }}
                  >
                    <CornerBrackets size={8} />
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: colors.mintBgMedium, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {isProcessing ? (
                          <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${colors.mintBorder}`, borderTopColor: colors.mint, animation: "spin 1s linear infinite" }} />
                        ) : (
                          <FileText size={18} color={isFailed ? colors.danger : colors.mint} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: 600, color: colors.text, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {panel.name}
                        </div>
                        <MonoLabel color={colors.textGhost}>{formatDate(panel.collected_date)}</MonoLabel>

                        {isProcessing && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: colors.warn, animation: "live-pulse 1.5s ease-in-out infinite" }} />
                            <MonoLabel color={colors.warn}>PROCESSING...</MonoLabel>
                          </div>
                        )}

                        {isFailed && (
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
                            <AlertTriangle size={11} color={colors.danger} />
                            <MonoLabel color={colors.danger}>ANALYSIS FAILED</MonoLabel>
                          </div>
                        )}

                        {panel.status === "analyzed" && counts.total > 0 && (
                          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                            {counts.optimal > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <CheckCircle size={11} color={colors.mint} />
                                <MonoLabel color={colors.mint}>{counts.optimal} OPTIMAL</MonoLabel>
                              </div>
                            )}
                            {counts.watch > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <AlertTriangle size={11} color={colors.warn} />
                                <MonoLabel color={colors.warn}>{counts.watch} WATCH</MonoLabel>
                              </div>
                            )}
                            {counts.low > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <AlertTriangle size={11} color={colors.danger} />
                                <MonoLabel color={colors.danger}>{counts.low} LOW</MonoLabel>
                              </div>
                            )}
                            {counts.high > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <AlertTriangle size={11} color={colors.danger} />
                                <MonoLabel color={colors.danger}>{counts.high} HIGH</MonoLabel>
                              </div>
                            )}
                            {counts.critical > 0 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <AlertTriangle size={11} color={colors.danger} />
                                <MonoLabel color={colors.danger}>{counts.critical} CRITICAL</MonoLabel>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeleteTarget(panel.id)}
                        style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: colors.textGhost, padding: 4, display: "flex", alignItems: "center" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NŪRA Latest Read */}
        {latestInsight && (
          <div
            style={{
              position: "relative",
              marginTop: 20,
              padding: "16px",
              background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})`,
              border: `1px solid ${colors.mintBorder}`,
              borderRadius: 12,
            }}
          >
            <CornerBrackets />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
              <MonoLabel color={colors.mint}>NŪRA LATEST READ</MonoLabel>
            </div>
            <p style={{ fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textMuted, margin: 0, lineHeight: 1.7 }}>
              {latestInsight}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          style={{ position: "fixed", inset: 0, background: colors.overlay, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: colors.bgSidebar, border: `1px solid ${colors.dangerBorder}`, borderRadius: 16, padding: "24px 20px", maxWidth: 320, width: "100%" }}
          >
            <h3 style={{ fontFamily: FONTS.serif, fontSize: 20, color: colors.text, margin: "0 0 8px", fontWeight: 400 }}>
              Delete panel?
            </h3>
            <p style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
              This panel and all extracted biomarkers will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{ flex: 1, padding: 11, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 10, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: colors.textMuted, cursor: "pointer" }}
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: 11, background: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, borderRadius: 10, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: colors.danger, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? "DELETING..." : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
