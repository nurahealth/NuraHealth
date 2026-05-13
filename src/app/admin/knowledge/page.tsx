"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  Upload, FileText, Image, AlignLeft, Search, Trash2,
  RefreshCw, AlertTriangle, ChevronDown, X, Shield,
} from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";

// ─── Primitives ──────────────────────────────────────────────────────────────

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

function MonoLabel({ children, color, size = 9 }: { children: React.ReactNode; color?: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: size, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { colors } = useTheme();
  return (
    <div style={{ position: "relative", background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`, border: `1px solid ${colors.mintBorder}`, borderRadius: 12, padding: "16px", ...style }}>
      <CornerBrackets />
      {children}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeSource {
  id: string;
  title: string;
  author: string | null;
  source_type: "book" | "research" | "article" | "other";
  topics: string[] | null;
  conditions: string[] | null;
  summary: string | null;
  status: "processing" | "analyzed" | "failed";
  error_message: string | null;
  file_size: number | null;
  chunk_count: number | null;
  created_at: string;
}

interface SearchResult {
  id: string;
  source_id: string;
  content: string;
  similarity: number;
  source_title: string;
  source_author: string | null;
}

type UploadTab = "file" | "photos" | "text";
type UploadStage = "idle" | "uploading" | "reading" | "embedding" | "saving" | "done" | "error";
type FilterType = "all" | "book" | "research" | "article";

const STAGE_LABELS: Record<UploadStage, string> = {
  idle: "", uploading: "Uploading...", reading: "Reading content...",
  embedding: "Generating embeddings...", saving: "Saving chunks...",
  done: "Done!", error: "Error",
};

function formatBytes(n: number | null): string {
  if (!n) return "—";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ userId, token, onClose, onSuccess }: {
  userId: string;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { colors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<UploadTab>("file");
  const [stage, setStage] = useState<UploadStage>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileAuthor, setFileAuthor] = useState("");
  const [fileDragOver, setFileDragOver] = useState(false);
  const [fileDropError, setFileDropError] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoAuthor, setPhotoAuthor] = useState("");
  const [photosDragOver, setPhotosDragOver] = useState(false);
  const [photosDropError, setPhotosDropError] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const [textTitle, setTextTitle] = useState("");
  const [textAuthor, setTextAuthor] = useState("");
  const [textBody, setTextBody] = useState("");

  const busy = stage !== "idle" && stage !== "done" && stage !== "error";

  useEffect(() => {
    const urls = photos.map((p) => URL.createObjectURL(p));
    setPhotoUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  // ── File drag handlers ──────────────────────────────────────────────────────
  const handleFileDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!busy) setFileDragOver(true); };
  const handleFileDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!busy) setFileDragOver(true); };
  const handleFileDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setFileDragOver(false); };
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDragOver(false);
    if (busy) return;
    setFileDropError("");
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    const ext = dropped.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "md", "txt"].includes(ext)) { setFileDropError("File type not supported"); return; }
    if (dropped.size > 50 * 1024 * 1024) { setFileDropError("File must be under 50MB"); return; }
    setFile(dropped);
    setFileTitle(dropped.name.replace(/\.[^.]+$/, ""));
  };

  // ── Photos drag handlers ────────────────────────────────────────────────────
  const handlePhotosDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!busy) setPhotosDragOver(true); };
  const handlePhotosDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!busy) setPhotosDragOver(true); };
  const handlePhotosDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setPhotosDragOver(false); };
  const handlePhotosDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotosDragOver(false);
    if (busy) return;
    setPhotosDropError("");
    const dropped = Array.from(e.dataTransfer.files);
    const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    const MAX = 10 * 1024 * 1024;
    const valid: File[] = [];
    let skipped = 0;
    for (const f of dropped) {
      const ok = ACCEPTED.includes(f.type) || f.name.toLowerCase().endsWith(".heic") || f.name.toLowerCase().endsWith(".heif");
      if (!ok || f.size > MAX) { skipped++; continue; }
      valid.push(f);
    }
    if (valid.length > 0) {
      setPhotos((prev) => [...prev, ...valid]);
      if (!photoTitle && valid[0]) setPhotoTitle(valid[0].name.replace(/\.[^.]+$/, ""));
    }
    if (skipped > 0) setPhotosDropError(`${skipped} file${skipped > 1 ? "s" : ""} skipped — invalid type or over 10MB`);
  };

  const removePhoto = (idx: number) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const upload = async () => {
    setErrorMsg("");
    const fd = new FormData();

    const parseError = async (res: Response, fallback: string): Promise<string> => {
      try { const b = await res.json() as { error?: string }; return b.error ?? fallback; } catch { return res.statusText || fallback; }
    };

    if (tab === "file") {
      if (!file) return;
      fd.append("file", file);
      fd.append("title", fileTitle || file.name);
      if (fileAuthor) fd.append("author", fileAuthor);
      fd.append("userId", userId);
      fd.append("token", token);
      setStage("uploading");
      try {
        const res = await fetch("/api/admin/knowledge/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await parseError(res, "Upload failed"));
        setStage("done");
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      } catch (e) {
        setStage("error");
        setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      }
    } else if (tab === "photos") {
      if (photos.length === 0) return;
      photos.forEach((p) => fd.append("files", p));
      fd.append("title", photoTitle || "Photo Upload");
      if (photoAuthor) fd.append("author", photoAuthor);
      fd.append("userId", userId);
      fd.append("token", token);
      setStage("uploading");
      try {
        const res = await fetch("/api/admin/knowledge/photos", { method: "POST", body: fd });
        if (!res.ok) throw new Error(await parseError(res, "Upload failed"));
        setStage("done");
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      } catch (e) {
        setStage("error");
        setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      }
    } else {
      if (!textBody.trim()) return;
      console.log("[admin/text/submit] sending userId:", userId, "title:", textTitle || "Pasted Text");
      setStage("uploading");
      try {
        const res = await fetch("/api/admin/knowledge/text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: textTitle || "Pasted Text", author: textAuthor || undefined, content: textBody, userId, token }),
        });
        if (!res.ok) throw new Error(await parseError(res, "Save failed"));
        setStage("done");
        setTimeout(() => { onSuccess(); onClose(); }, 1200);
      } catch (e) {
        setStage("error");
        setErrorMsg(e instanceof Error ? e.message : "Save failed");
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    background: colors.mintBgSubtle,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontFamily: FONTS.sans, fontSize: 13.5,
    color: colors.text, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600,
    letterSpacing: "1.2px", textTransform: "uppercase", color: colors.textFaint, marginBottom: 6,
  };

  const tabs: { id: UploadTab; label: string; Icon: React.ElementType }[] = [
    { id: "file", label: "PDF / Doc", Icon: FileText },
    { id: "photos", label: "Photos", Icon: Image },
    { id: "text", label: "Paste Text", Icon: AlignLeft },
  ];

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: "0 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: colors.bgSidebar, borderRadius: 20, border: `1px solid ${colors.mintBorder}`, maxHeight: "90vh", overflowY: "auto", paddingBottom: 32 }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0" }}>
          <span style={{ fontFamily: FONTS.serif, fontSize: 20, color: colors.text }}>Add Knowledge Source</span>
          <button onClick={onClose} disabled={busy} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 7, cursor: "pointer", color: colors.textMuted, padding: 0 }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "14px 20px 0" }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => !busy && setTab(id)}
              style={{
                flex: 1, padding: "8px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                background: tab === id ? colors.mintBgMedium : "transparent",
                border: `1px solid ${tab === id ? colors.mintBorder : colors.borderFaint}`,
                borderRadius: 8, fontFamily: FONTS.mono, fontSize: 8.5, fontWeight: 700,
                letterSpacing: "0.8px", color: tab === id ? colors.mint : colors.textFaint,
                cursor: "pointer",
              }}
            >
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px 0" }}>
          {stage !== "idle" && (
            <div style={{ padding: "10px 12px", background: stage === "error" ? "rgba(255,76,92,0.08)" : stage === "done" ? `${colors.mint}15` : colors.mintBgSubtle, border: `1px solid ${stage === "error" ? "rgba(255,76,92,0.4)" : stage === "done" ? colors.mintBorder : colors.borderFaint}`, borderRadius: 8, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              {stage !== "done" && stage !== "error" && (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${colors.mintBorder}`, borderTopColor: colors.mint, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              )}
              <MonoLabel color={stage === "error" ? "#FF4C5C" : stage === "done" ? colors.mint : colors.textMuted}>
                {stage === "error" ? errorMsg : STAGE_LABELS[stage]}
              </MonoLabel>
            </div>
          )}

          {tab === "file" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                onClick={() => !busy && fileInputRef.current?.click()}
                onDragEnter={handleFileDragEnter}
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
                onDrop={handleFileDrop}
                style={{
                  border: fileDragOver ? `2px solid ${colors.mint}` : file ? `2px solid ${colors.mintBorder}` : "2px dashed rgba(94,234,212,0.3)",
                  borderRadius: 10,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: busy ? "not-allowed" : fileDragOver ? "copy" : "pointer",
                  background: fileDragOver ? `${colors.mint}0d` : file ? colors.mintBgSubtle : "transparent",
                  boxShadow: fileDragOver ? `0 0 0 4px ${colors.mint}20` : "none",
                  animation: fileDragOver ? "drop-pulse 1.2s ease-in-out infinite" : "none",
                  transition: "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <FileText size={22} color={fileDragOver ? colors.mint : file ? colors.mint : colors.textFaint} />
                <MonoLabel color={fileDragOver ? colors.mint : file ? colors.mint : colors.textGhost}>
                  {fileDragOver ? "DROP FILE HERE" : file ? file.name : "CLICK OR DROP FILE HERE"}
                </MonoLabel>
                <MonoLabel color={colors.textGhost} size={8}>PDF · MD · TXT · MAX 50MB</MonoLabel>
                <input ref={fileInputRef} type="file" accept=".pdf,.md,.txt" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileTitle(f.name.replace(/\.[^.]+$/, "")); setFileDropError(""); } }} />
              </div>
              {fileDropError && (
                <MonoLabel color="#FF4C5C" size={8}>{fileDropError}</MonoLabel>
              )}
              <div><label style={labelStyle}>TITLE</label><input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="Auto-detected from filename" style={inputStyle} /></div>
              <div><label style={labelStyle}>AUTHOR</label><input value={fileAuthor} onChange={(e) => setFileAuthor(e.target.value)} placeholder="Optional" style={inputStyle} /></div>
            </div>
          )}

          {tab === "photos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                onClick={() => !busy && photosInputRef.current?.click()}
                onDragEnter={handlePhotosDragEnter}
                onDragOver={handlePhotosDragOver}
                onDragLeave={handlePhotosDragLeave}
                onDrop={handlePhotosDrop}
                style={{
                  border: photosDragOver ? `2px solid ${colors.mint}` : photos.length ? `2px solid ${colors.mintBorder}` : "2px dashed rgba(94,234,212,0.3)",
                  borderRadius: 10,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: busy ? "not-allowed" : photosDragOver ? "copy" : "pointer",
                  background: photosDragOver ? `${colors.mint}0d` : photos.length ? colors.mintBgSubtle : "transparent",
                  boxShadow: photosDragOver ? `0 0 0 4px ${colors.mint}20` : "none",
                  animation: photosDragOver ? "drop-pulse 1.2s ease-in-out infinite" : "none",
                  transition: "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <Image size={22} color={photosDragOver ? colors.mint : photos.length ? colors.mint : colors.textFaint} />
                <MonoLabel color={photosDragOver ? colors.mint : photos.length ? colors.mint : colors.textGhost}>
                  {photosDragOver ? "DROP IMAGES HERE" : photos.length ? `${photos.length} IMAGE${photos.length > 1 ? "S" : ""} SELECTED` : "CLICK OR DROP IMAGES HERE"}
                </MonoLabel>
                <MonoLabel color={colors.textGhost} size={8}>JPEG · PNG · WEBP · HEIC · MAX 10MB EACH</MonoLabel>
                <input ref={photosInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length > 0) { setPhotos((prev) => [...prev, ...fs]); if (!photoTitle && fs[0]) setPhotoTitle(fs[0].name.replace(/\.[^.]+$/, "")); setPhotosDropError(""); } }} />
              </div>
              {photosDropError && (
                <MonoLabel color="#FF4C5C" size={8}>{photosDropError}</MonoLabel>
              )}
              {photoUrls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {photoUrls.map((url, i) => (
                    <div key={i} style={{ position: "relative", width: 60, height: 60, borderRadius: 6, overflow: "hidden", border: `1px solid ${colors.mintBorder}`, flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={photos[i]?.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                        style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.65)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, color: "#fff" }}
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div><label style={labelStyle}>TITLE</label><input value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} placeholder="Book or document title" style={inputStyle} /></div>
              <div><label style={labelStyle}>AUTHOR</label><input value={photoAuthor} onChange={(e) => setPhotoAuthor(e.target.value)} placeholder="Optional" style={inputStyle} /></div>
            </div>
          )}

          {tab === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>TITLE <span style={{ color: "#FF4C5C" }}>*</span></label><input value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="Source title" style={inputStyle} /></div>
              <div><label style={labelStyle}>AUTHOR</label><input value={textAuthor} onChange={(e) => setTextAuthor(e.target.value)} placeholder="Optional" style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>CONTENT <span style={{ color: "#FF4C5C" }}>*</span></label>
                <textarea value={textBody} onChange={(e) => setTextBody(e.target.value)} placeholder="Paste text here..." rows={8}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          )}

          <button
            onClick={upload}
            disabled={busy || (tab === "file" && !file) || (tab === "photos" && photos.length === 0) || (tab === "text" && !textBody.trim())}
            style={{
              marginTop: 20, width: "100%", padding: 13,
              background: busy ? colors.mintBgMedium : `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              border: "none", borderRadius: 10,
              fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, letterSpacing: "1px",
              color: busy ? colors.textFaint : colors.textOnAccent,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy ? STAGE_LABELS[stage].toUpperCase() : tab === "text" ? "SAVE TEXT" : "UPLOAD"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminKnowledgePage() {
  const router = useRouter();
  const { colors } = useTheme();

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [authStatus, setAuthStatus] = useState<"checking" | "allowed" | "denied">("checking");
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();
      if (!profile?.is_admin) {
        router.push("/");
        return;
      }
      setUser(session.user);
      setUserId(session.user.id);
      setToken(session.access_token);
      setAuthStatus("allowed");
    }
    checkAdmin();
  }, [router]);

  // ── Knowledge state ─────────────────────────────────────────────────────────
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<SearchResult[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("knowledge_sources")
        .select("*")
        .order("created_at", { ascending: false });
      setSources((data ?? []) as KnowledgeSource[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "allowed") return;
    loadSources();
  }, [authStatus, loadSources]);

  useEffect(() => {
    const hasProcessing = sources.some((s) => s.status === "processing");
    if (!hasProcessing) return;
    const t = setInterval(loadSources, 3000);
    return () => clearInterval(t);
  }, [sources, loadSources]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await supabase.from("knowledge_chunks").delete().eq("source_id", id);
      await supabase.from("knowledge_sources").delete().eq("id", id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
      setMenuOpenId(null);
    }
  };

  const handleTestQuery = async () => {
    if (!testQuery.trim() || !userId) return;
    setTestLoading(true);
    setTestResults(null);
    try {
      const res = await fetch("/api/admin/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery, userId, token }),
      });
      const data = await res.json() as { results: SearchResult[] };
      setTestResults(data.results ?? []);
    } catch {
      setTestResults([]);
    } finally {
      setTestLoading(false);
    }
  };

  // ── Loading / denied ────────────────────────────────────────────────────────
  if (authStatus === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.mint, animation: "live-pulse 1.5s ease-in-out infinite" }} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: colors.textFaint, letterSpacing: "1.5px" }}>
          VERIFYING ACCESS...
        </span>
        <style>{`@keyframes live-pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }`}</style>
      </div>
    );
  }

  // ── Admin UI ────────────────────────────────────────────────────────────────
  const filtered = sources.filter((s) => {
    if (filter !== "all" && s.source_type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q) || s.topics?.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  const totalChunks = sources.reduce((acc, s) => acc + (s.chunk_count ?? 0), 0);
  const totalSize = sources.reduce((acc, s) => acc + (s.file_size ?? 0), 0);
  const processingCount = sources.filter((s) => s.status === "processing").length;

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Admin";
  const userInitial = userName.charAt(0).toUpperCase();

  const TYPE_COLOR: Record<string, string> = {
    book: colors.mint,
    research: "#7C9CF5",
    article: "#FFB400",
    other: colors.textFaint,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "9px 12px",
    background: colors.mintBgSubtle,
    border: `1px solid ${colors.border}`,
    borderRadius: 8, fontFamily: FONTS.sans, fontSize: 13.5,
    color: colors.text, outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes drop-pulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(94,234,212,0.15); } 50% { box-shadow: 0 0 0 6px rgba(94,234,212,0.3); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, background: colors.bgTopbar, backdropFilter: "blur(20px)", borderBottom: `1px solid ${colors.border}` }}>
        <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.textMuted, borderRadius: 8, padding: 0 }}>
          <Shield size={18} color={colors.mint} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FONTS.serif, fontSize: 17, color: colors.text }}>Knowledge Base</span>
          <span style={{ fontFamily: FONTS.mono, fontSize: 8, fontWeight: 700, letterSpacing: "1px", color: colors.mint, background: `${colors.mint}20`, border: `1px solid ${colors.mintBorder}`, borderRadius: 4, padding: "2px 6px" }}>ADMIN</span>
        </div>
        <button onClick={loadSources} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.textFaint, borderRadius: 8, padding: 0 }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 4px" }}>
            Knowledge Base
          </h1>
          <MonoLabel color={colors.textFaint}>NŪRA&apos;S BRAIN · TRAINING CORPUS</MonoLabel>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "SOURCES", value: sources.length.toString(), color: colors.mint },
            { label: "CHUNKS", value: totalChunks > 999 ? `${(totalChunks / 1000).toFixed(1)}K` : totalChunks.toString(), color: colors.mint },
            { label: "STORAGE", value: formatBytes(totalSize), color: colors.textMuted },
            { label: "QUERIES", value: "—", color: colors.textGhost },
          ].map((s) => (
            <Panel key={s.label} style={{ padding: "10px 8px", textAlign: "center" }}>
              <CornerBrackets size={5} />
              <div style={{ fontFamily: FONTS.mono, fontSize: 15, fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: 3 }}>{s.value}</div>
              <MonoLabel color={colors.textGhost} size={7.5}>{s.label}</MonoLabel>
            </Panel>
          ))}
        </div>

        {processingCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: `${colors.mint}15`, border: `1px solid ${colors.mintBorder}`, borderRadius: 10, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.mint, animation: "live-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
            <MonoLabel color={colors.mint}>{processingCount} SOURCE{processingCount > 1 ? "S" : ""} PROCESSING...</MonoLabel>
          </div>
        )}

        <button
          onClick={() => setShowUploadModal(true)}
          style={{ width: "100%", padding: "12px 0", marginBottom: 16, background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, border: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, letterSpacing: "1px", color: colors.textOnAccent, cursor: "pointer" }}
        >
          <Upload size={14} />
          ADD KNOWLEDGE SOURCE
        </button>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 10 }}>
            <Search size={13} color={colors.textFaint} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sources..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: FONTS.sans, fontSize: 13, color: colors.text }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textFaint, padding: 0 }}><X size={12} /></button>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {(["all", "book", "research", "article"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flexShrink: 0, padding: "5px 12px", background: filter === f ? colors.mintBgMedium : "transparent", border: `1px solid ${filter === f ? colors.mintBorder : colors.borderFaint}`, borderRadius: 20, fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: filter === f ? colors.mint : colors.textFaint, cursor: "pointer", whiteSpace: "nowrap" }}>
              {f === "all" ? `ALL · ${sources.length}` : f.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: colors.textFaint, letterSpacing: "1.4px", textAlign: "center", padding: "40px 0" }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: 20, fontWeight: 400, color: colors.text, margin: "0 0 8px" }}>No sources yet</h2>
            <MonoLabel color={colors.textGhost}>ADD YOUR FIRST KNOWLEDGE SOURCE ABOVE</MonoLabel>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s) => {
              const tc = TYPE_COLOR[s.source_type] ?? colors.textFaint;
              const isProcessing = s.status === "processing";
              const isFailed = s.status === "failed";
              const menuOpen = menuOpenId === s.id;

              return (
                <div key={s.id} style={{ position: "relative", padding: "14px 16px", background: colors.mintBgSubtle, border: `1px solid ${isProcessing ? colors.mintBorder : isFailed ? "rgba(255,76,92,0.35)" : colors.border}`, borderRadius: 12 }}>
                  <CornerBrackets size={7} color={isFailed ? "#FF4C5C" : colors.mint} />
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: 7.5, fontWeight: 700, letterSpacing: "1px", color: tc, background: `${tc}20`, border: `1px solid ${tc}35`, borderRadius: 3, padding: "2px 6px" }}>
                          {s.source_type.toUpperCase()}
                        </span>
                        {isProcessing && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFB400", animation: "live-pulse 1.5s ease-in-out infinite" }} />
                            <MonoLabel color="#FFB400" size={7.5}>PROCESSING</MonoLabel>
                          </span>
                        )}
                        {isFailed && <MonoLabel color="#FF4C5C" size={7.5}>FAILED</MonoLabel>}
                        {s.status === "analyzed" && <MonoLabel color={colors.textGhost} size={7.5}>{s.chunk_count ?? 0} CHUNKS · {relativeTime(s.created_at)}</MonoLabel>}
                      </div>
                      <div style={{ fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: 600, color: colors.text, marginBottom: s.author ? 2 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </div>
                      {s.author && <div style={{ fontFamily: FONTS.sans, fontSize: 11.5, color: colors.textDim }}>{s.author}</div>}
                      {s.topics && s.topics.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                          {s.topics.slice(0, 4).map((t) => (
                            <span key={t} style={{ fontFamily: FONTS.mono, fontSize: 7.5, color: colors.textFaint, background: colors.mintBgMedium, border: `1px solid ${colors.borderFaint}`, borderRadius: 3, padding: "2px 6px" }}>{t}</span>
                          ))}
                        </div>
                      )}
                      {isFailed && s.error_message && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 5, marginTop: 6 }}>
                          <AlertTriangle size={11} color="#FF4C5C" style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontFamily: FONTS.mono, fontSize: 8, color: "#FF4C5C", letterSpacing: "0.5px" }}>{s.error_message}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpen ? null : s.id); }}
                        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: colors.textFaint, borderRadius: 6, padding: 0 }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {menuOpen && (
                        <div style={{ position: "absolute", right: 0, top: 32, background: colors.bgSidebar, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "4px 0", zIndex: 60, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: FONTS.sans, fontSize: 13, color: "#FF4C5C", textAlign: "left", display: "flex", alignItems: "center", gap: 8, opacity: deletingId === s.id ? 0.5 : 1 }}
                          >
                            <Trash2 size={13} />
                            {deletingId === s.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <MonoLabel color={colors.textMuted}>TEST QUERY</MonoLabel>
          </div>
          <Panel style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestQuery()}
                placeholder="Ask a test question..."
                style={inputStyle}
              />
              <button
                onClick={handleTestQuery}
                disabled={testLoading || !testQuery.trim()}
                style={{ padding: "9px 16px", background: testLoading ? colors.mintBgMedium : `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, border: "none", borderRadius: 8, fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, color: testLoading ? colors.textFaint : colors.textOnAccent, cursor: testLoading ? "not-allowed" : "pointer", letterSpacing: "1px", whiteSpace: "nowrap" }}
              >
                {testLoading ? "..." : "SEARCH"}
              </button>
            </div>

            {testResults !== null && (
              <div style={{ marginTop: 14 }}>
                {testResults.length === 0 ? (
                  <MonoLabel color={colors.textGhost}>NO RESULTS FOUND</MonoLabel>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {testResults.map((r, i) => (
                      <div key={r.id} style={{ padding: "10px 12px", background: colors.mintBgSubtle, border: `1px solid ${colors.borderFaint}`, borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <MonoLabel color={colors.mint} size={8}>{r.source_title}</MonoLabel>
                          <MonoLabel color={colors.textGhost} size={8}>
                            {r.similarity > 0 ? `${Math.round(r.similarity * 100)}% MATCH` : `RESULT ${i + 1}`}
                          </MonoLabel>
                        </div>
                        <div style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: colors.textMuted, lineHeight: 1.6, maxHeight: 80, overflowY: "auto" }}>
                          {r.content.slice(0, 300)}{r.content.length > 300 ? "..." : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {menuOpenId && <div onClick={() => setMenuOpenId(null)} style={{ position: "fixed", inset: 0, zIndex: 55 }} />}

      {showUploadModal && userId && token && (
        <UploadModal
          userId={userId}
          token={token}
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadSources}
        />
      )}
    </div>
  );
}
