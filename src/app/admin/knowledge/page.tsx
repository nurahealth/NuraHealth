"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  Upload, FileText, Image, AlignLeft, Search, Trash2,
  RefreshCw, AlertTriangle, ChevronDown, X, Shield, Video,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import NuraPlexus from "@/components/NuraPlexus";

// ── Design tokens (locked NŪRA system) ────────────────────────────────────────
const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const BORDER_STRONG = "var(--nura-border-strong)";
const SURFACE = "var(--nura-surface)";
const SURFACE_ELEV = "var(--nura-surface-elevated)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-sage-bg-on)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const FG_RGB = "var(--nura-fg-rgb)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

const DANGER = "#FF4C5C";
const WARN = "#FFB400";

// ─── Primitives ──────────────────────────────────────────────────────────────

function Eyebrow({ children, color, size = 10 }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <span style={{
      fontFamily: SANS,
      fontSize: size,
      fontWeight: 600,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: color ?? TEXT_TER,
    }}>
      {children}
    </span>
  );
}

function Panel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: SURFACE,
      border: `0.5px solid ${BORDER}`,
      borderRadius: 14,
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface KnowledgeSource {
  id: string;
  title: string;
  author: string | null;
  source_type: "book" | "research" | "article" | "other" | "video" | "audio";
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

type UploadTab = "file" | "photos" | "text" | "video";
type UploadStage = "idle" | "uploading" | "reading" | "embedding" | "saving" | "done" | "error";
type FilterType = "all" | "book" | "research" | "article" | "video" | "audio";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [videoDropError, setVideoDropError] = useState("");
  const [videoBusyMode, setVideoBusyMode] = useState<"youtube" | "file" | null>(null);

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

  // ── Video drag handlers ─────────────────────────────────────────────────────
  const VIDEO_ACCEPT = [
    "audio/mpeg", "audio/mp3", "audio/mp4", "audio/m4a", "audio/x-m4a",
    "audio/wav", "audio/x-wav", "audio/webm",
    "video/mp4", "video/mpeg", "video/webm",
  ];
  const handleVideoDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!busy) setVideoDragOver(true); };
  const handleVideoDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!busy) setVideoDragOver(true); };
  const handleVideoDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setVideoDragOver(false); };
  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVideoDragOver(false);
    if (busy) return;
    setVideoDropError("");
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (dropped.size > 25 * 1024 * 1024) { setVideoDropError("File too large. Whisper supports files up to 25MB."); return; }
    if (!VIDEO_ACCEPT.includes(dropped.type)) { setVideoDropError("Unsupported file type. Use MP3, MP4, M4A, WAV, or WEBM."); return; }
    setVideoFile(dropped);
    setVideoUrl("");
  };

  const submitYoutubeVideo = async () => {
    if (!videoUrl.trim() || videoBusyMode) return;
    setErrorMsg("");
    setVideoBusyMode("youtube");
    setStage("uploading");
    try {
      const res = await fetch("/api/admin/knowledge/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "youtube", youtubeUrl: videoUrl, userId, token }),
      });
      if (!res.ok) {
        let msg = "Fetch failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setStage("done");
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (e) {
      setStage("error");
      setErrorMsg(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setVideoBusyMode(null);
    }
  };

  const submitVideoFile = async () => {
    if (!videoFile || videoBusyMode) return;
    setErrorMsg("");
    setVideoBusyMode("file");
    setStage("uploading");
    const fd = new FormData();
    fd.append("mode", "file");
    fd.append("file", videoFile);
    fd.append("userId", userId);
    fd.append("token", token);
    try {
      const res = await fetch("/api/admin/knowledge/video", { method: "POST", body: fd });
      if (!res.ok) {
        let msg = "Transcription failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setStage("done");
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (e) {
      setStage("error");
      setErrorMsg(e instanceof Error ? e.message : "Transcription failed");
    } finally {
      setVideoBusyMode(null);
    }
  };

  const stageLabel = (() => {
    if (tab === "video" && stage === "uploading") {
      return videoBusyMode === "youtube" ? "Fetching transcript..." : "Transcribing audio...";
    }
    return STAGE_LABELS[stage];
  })();

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
    width: "100%", padding: "10px 12px",
    background: SURFACE,
    border: `0.5px solid ${BORDER}`,
    borderRadius: 10,
    fontFamily: SANS, fontSize: 14,
    color: TEXT, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: SANS, fontSize: 10, fontWeight: 600,
    letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_TER, marginBottom: 6,
  };

  const tabs: { id: UploadTab; label: string; Icon: React.ElementType }[] = [
    { id: "file", label: "PDF / Doc", Icon: FileText },
    { id: "photos", label: "Photos", Icon: Image },
    { id: "text", label: "Paste Text", Icon: AlignLeft },
    { id: "video", label: "Video / Audio", Icon: Video },
  ];

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "0 16px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: BG, borderRadius: 20, border: `0.5px solid ${BORDER_STRONG}`, maxHeight: "90vh", overflowY: "auto", paddingBottom: 32 }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `rgba(${FG_RGB},0.18)` }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 0" }}>
          <span style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT }}>Add Knowledge Source</span>
          <button onClick={onClose} disabled={busy} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", color: TEXT_SEC, padding: 0 }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "14px 20px 0" }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => !busy && setTab(id)}
              style={{
                flex: 1, padding: "9px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: tab === id ? `rgba(${SAGE_RGB},0.14)` : "transparent",
                border: `0.5px solid ${tab === id ? `rgba(${SAGE_RGB},0.4)` : BORDER}`,
                borderRadius: 10, fontFamily: SANS, fontSize: 10, fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: tab === id ? SAGE : TEXT_TER,
                cursor: "pointer",
                transition: "background 180ms, border-color 180ms, color 180ms",
              }}
            >
              <Icon size={12} />{label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px 0" }}>
          {stage !== "idle" && (
            <div style={{ padding: "10px 12px", background: stage === "error" ? "rgba(255,76,92,0.08)" : stage === "done" ? `rgba(${SAGE_RGB},0.10)` : SURFACE, border: `0.5px solid ${stage === "error" ? "rgba(255,76,92,0.4)" : stage === "done" ? `rgba(${SAGE_RGB},0.35)` : BORDER}`, borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              {stage !== "done" && stage !== "error" && (
                <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid rgba(${SAGE_RGB},0.25)`, borderTopColor: SAGE, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              )}
              <Eyebrow color={stage === "error" ? DANGER : stage === "done" ? SAGE : TEXT_SEC}>
                {stage === "error" ? errorMsg : stageLabel}
              </Eyebrow>
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
                  border: fileDragOver ? `2px solid ${SAGE}` : file ? `1px solid rgba(${SAGE_RGB},0.4)` : `2px dashed rgba(${SAGE_RGB},0.25)`,
                  borderRadius: 12,
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: busy ? "not-allowed" : fileDragOver ? "copy" : "pointer",
                  background: fileDragOver ? `rgba(${SAGE_RGB},0.08)` : file ? SURFACE : "transparent",
                  boxShadow: fileDragOver ? `0 0 0 4px rgba(${SAGE_RGB},0.18)` : "none",
                  animation: fileDragOver ? "drop-pulse 1.2s ease-in-out infinite" : "none",
                  transition: "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <FileText size={22} color={fileDragOver || file ? "var(--nura-sage)" : "var(--nura-text-tertiary)"} />
                <Eyebrow color={fileDragOver || file ? SAGE : TEXT_TER}>
                  {fileDragOver ? "Drop file here" : file ? file.name : "Click or drop file here"}
                </Eyebrow>
                <Eyebrow color={TEXT_TER} size={9}>PDF · MD · TXT · max 50MB</Eyebrow>
                <input ref={fileInputRef} type="file" accept=".pdf,.md,.txt" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileTitle(f.name.replace(/\.[^.]+$/, "")); setFileDropError(""); } }} />
              </div>
              {fileDropError && (
                <Eyebrow color={DANGER} size={9}>{fileDropError}</Eyebrow>
              )}
              <div><label style={labelStyle}>Title</label><input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="Auto-detected from filename" style={inputStyle} /></div>
              <div><label style={labelStyle}>Author</label><input value={fileAuthor} onChange={(e) => setFileAuthor(e.target.value)} placeholder="Optional" style={inputStyle} /></div>
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
                  border: photosDragOver ? `2px solid ${SAGE}` : photos.length ? `1px solid rgba(${SAGE_RGB},0.4)` : `2px dashed rgba(${SAGE_RGB},0.25)`,
                  borderRadius: 12,
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  cursor: busy ? "not-allowed" : photosDragOver ? "copy" : "pointer",
                  background: photosDragOver ? `rgba(${SAGE_RGB},0.08)` : photos.length ? SURFACE : "transparent",
                  boxShadow: photosDragOver ? `0 0 0 4px rgba(${SAGE_RGB},0.18)` : "none",
                  animation: photosDragOver ? "drop-pulse 1.2s ease-in-out infinite" : "none",
                  transition: "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <Image size={22} color={photosDragOver || photos.length ? "var(--nura-sage)" : "var(--nura-text-tertiary)"} />
                <Eyebrow color={photosDragOver || photos.length ? SAGE : TEXT_TER}>
                  {photosDragOver ? "Drop images here" : photos.length ? `${photos.length} image${photos.length > 1 ? "s" : ""} selected` : "Click or drop images here"}
                </Eyebrow>
                <Eyebrow color={TEXT_TER} size={9}>JPEG · PNG · WEBP · HEIC · max 10MB each</Eyebrow>
                <input ref={photosInputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={(e) => { const fs = Array.from(e.target.files ?? []); if (fs.length > 0) { setPhotos((prev) => [...prev, ...fs]); if (!photoTitle && fs[0]) setPhotoTitle(fs[0].name.replace(/\.[^.]+$/, "")); setPhotosDropError(""); } }} />
              </div>
              {photosDropError && (
                <Eyebrow color={DANGER} size={9}>{photosDropError}</Eyebrow>
              )}
              {photoUrls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {photoUrls.map((url, i) => (
                    <div key={i} style={{ position: "relative", width: 60, height: 60, borderRadius: 8, overflow: "hidden", border: `0.5px solid ${BORDER}`, flexShrink: 0 }}>
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
              <div><label style={labelStyle}>Title</label><input value={photoTitle} onChange={(e) => setPhotoTitle(e.target.value)} placeholder="Book or document title" style={inputStyle} /></div>
              <div><label style={labelStyle}>Author</label><input value={photoAuthor} onChange={(e) => setPhotoAuthor(e.target.value)} placeholder="Optional" style={inputStyle} /></div>
            </div>
          )}

          {tab === "text" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={labelStyle}>Title <span style={{ color: DANGER }}>*</span></label><input value={textTitle} onChange={(e) => setTextTitle(e.target.value)} placeholder="Source title" style={inputStyle} /></div>
              <div><label style={labelStyle}>Author</label><input value={textAuthor} onChange={(e) => setTextAuthor(e.target.value)} placeholder="Optional" style={inputStyle} /></div>
              <div>
                <label style={labelStyle}>Content <span style={{ color: DANGER }}>*</span></label>
                <textarea value={textBody} onChange={(e) => setTextBody(e.target.value)} placeholder="Paste text here..." rows={8}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
              </div>
            </div>
          )}

          {tab === "video" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Section 1 — YouTube URL */}
              <div>
                <label style={labelStyle}>From YouTube</label>
                <input
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); if (e.target.value) setVideoFile(null); }}
                  placeholder="Paste a YouTube URL..."
                  disabled={busy}
                  style={inputStyle}
                />
                <button
                  onClick={submitYoutubeVideo}
                  disabled={busy || !videoUrl.trim()}
                  className="nura-primary-btn"
                  style={{
                    marginTop: 10, width: "100%", padding: 12,
                    background: (busy || !videoUrl.trim()) ? `rgba(${SAGE_RGB},0.25)` : SAGE,
                    border: "none", borderRadius: 12,
                    fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                    color: (busy || !videoUrl.trim()) ? TEXT_TER : SAGE_ON,
                    cursor: (busy || !videoUrl.trim()) ? "not-allowed" : "pointer",
                    transition: "background 200ms, transform 100ms",
                  }}
                >
                  {videoBusyMode === "youtube" ? "Fetching transcript..." : "Fetch & Ingest"}
                </button>
                <div style={{ marginTop: 8 }}>
                  <Eyebrow color={TEXT_SEC} size={10}>
                    Free and instant. Works on any public YouTube video with captions.
                  </Eyebrow>
                </div>
              </div>

              {/* OR divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
                <Eyebrow color={TEXT_TER} size={9}>or</Eyebrow>
                <div style={{ flex: 1, height: 1, background: BORDER }} />
              </div>

              {/* Section 2 — Upload File */}
              <div>
                <label style={labelStyle}>Upload File</label>
                <div
                  onClick={() => !busy && videoInputRef.current?.click()}
                  onDragEnter={handleVideoDragEnter}
                  onDragOver={handleVideoDragOver}
                  onDragLeave={handleVideoDragLeave}
                  onDrop={handleVideoDrop}
                  style={{
                    border: videoDragOver ? `2px solid ${SAGE}` : videoFile ? `1px solid rgba(${SAGE_RGB},0.4)` : `2px dashed rgba(${SAGE_RGB},0.25)`,
                    borderRadius: 12,
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    cursor: busy ? "not-allowed" : videoDragOver ? "copy" : "pointer",
                    background: videoDragOver ? `rgba(${SAGE_RGB},0.08)` : videoFile ? SURFACE : "transparent",
                    boxShadow: videoDragOver ? `0 0 0 4px rgba(${SAGE_RGB},0.18)` : "none",
                    animation: videoDragOver ? "drop-pulse 1.2s ease-in-out infinite" : "none",
                    transition: "border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                  }}
                >
                  <Video size={22} color={videoDragOver || videoFile ? "var(--nura-sage)" : "var(--nura-text-tertiary)"} />
                  <Eyebrow color={videoDragOver || videoFile ? SAGE : TEXT_TER}>
                    {videoDragOver ? "Drop file here" : videoFile ? videoFile.name : "Drag MP3, MP4, M4A, or WAV here — or click to browse"}
                  </Eyebrow>
                  <Eyebrow color={TEXT_TER} size={9}>
                    {videoFile ? `${formatBytes(videoFile.size)} · max 25MB` : "max 25MB"}
                  </Eyebrow>
                  <input ref={videoInputRef} type="file" accept="audio/*,video/*" style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setVideoDropError("");
                      if (f.size > 25 * 1024 * 1024) { setVideoDropError("File too large. Whisper supports files up to 25MB."); return; }
                      if (!VIDEO_ACCEPT.includes(f.type)) { setVideoDropError("Unsupported file type. Use MP3, MP4, M4A, WAV, or WEBM."); return; }
                      setVideoFile(f);
                      setVideoUrl("");
                    }} />
                </div>
                {videoDropError && (
                  <div style={{ marginTop: 8 }}>
                    <Eyebrow color={DANGER} size={9}>{videoDropError}</Eyebrow>
                  </div>
                )}
                {videoFile && (
                  <button
                    onClick={submitVideoFile}
                    disabled={busy}
                    className="nura-primary-btn"
                    style={{
                      marginTop: 10, width: "100%", padding: 12,
                      background: busy ? `rgba(${SAGE_RGB},0.25)` : SAGE,
                      border: "none", borderRadius: 12,
                      fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                      color: busy ? TEXT_TER : SAGE_ON,
                      cursor: busy ? "not-allowed" : "pointer",
                      transition: "background 200ms, transform 100ms",
                    }}
                  >
                    {videoBusyMode === "file" ? "Transcribing audio..." : "Transcribe & Ingest"}
                  </button>
                )}
                <div style={{ marginTop: 8 }}>
                  <Eyebrow color={TEXT_SEC} size={10}>$0.006 per minute (Whisper transcription)</Eyebrow>
                </div>
              </div>
            </div>
          )}

          {tab !== "video" && (
            <button
              onClick={upload}
              disabled={busy || (tab === "file" && !file) || (tab === "photos" && photos.length === 0) || (tab === "text" && !textBody.trim())}
              className="nura-primary-btn"
              style={{
                marginTop: 22, width: "100%", padding: 14,
                background: busy ? `rgba(${SAGE_RGB},0.25)` : SAGE,
                border: "none", borderRadius: 14,
                fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                color: busy ? TEXT_TER : SAGE_ON,
                cursor: busy ? "not-allowed" : "pointer",
                transition: "background 200ms, transform 100ms",
              }}
            >
              {busy ? stageLabel : tab === "text" ? "Save text" : "Upload"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({ sourceTitle, busy, errorMsg, onCancel, onConfirm }: {
  sourceTitle: string;
  busy: boolean;
  errorMsg: string;
  onCancel: () => void;
  onConfirm: () => void;
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
          Delete source?
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.55, marginBottom: errorMsg ? 12 : 20 }}>
          Delete <span style={{ color: TEXT, fontWeight: 500 }}>&ldquo;{sourceTitle}&rdquo;</span>? This will also remove its chunks and embeddings. This cannot be undone.
        </div>

        {errorMsg && (
          <div style={{ marginBottom: 14, padding: "9px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10 }}>
            <Eyebrow color={DANGER} size={10}>{errorMsg}</Eyebrow>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1, padding: 12, background: "transparent",
              border: `0.5px solid ${BORDER}`, borderRadius: 12,
              fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              color: busy ? TEXT_TER : TEXT, cursor: busy ? "not-allowed" : "pointer",
              transition: "background 180ms",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 1, padding: 12,
              background: busy ? "rgba(255,76,92,0.30)" : DANGER,
              border: "none", borderRadius: 12,
              fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#fff", cursor: busy ? "not-allowed" : "pointer",
              transition: "background 180ms",
            }}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminKnowledgePage() {
  const router = useRouter();

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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleteError, setDeleteError] = useState("");
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
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        let msg = "Delete failed";
        try { const b = await res.json() as { error?: string }; if (b.error) msg = b.error; } catch {}
        throw new Error(msg);
      }
      setConfirmDelete(null);
      setMenuOpenId(null);
      await loadSources();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
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
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: SAGE, animation: "live-pulse 1.5s ease-in-out infinite" }} />
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: TEXT_TER, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Verifying access...
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

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: SANS, color: TEXT, position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes drop-pulse { 0%, 100% { box-shadow: 0 0 0 4px rgba(155,176,165,0.15); } 50% { box-shadow: 0 0 0 6px rgba(155,176,165,0.30); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: var(--nura-bg); }
        ::-webkit-scrollbar { width: 0; }
        .source-card { transition: background 200ms, border-color 200ms, transform 200ms; }
        .source-card:hover { background: var(--nura-surface-elevated); border-color: rgba(155,176,165,0.35); transform: translateY(-1px); }
        .nura-primary-btn:hover:not(:disabled) { background: var(--nura-sage-hover) !important; transform: translateY(-1px); }
        .nura-primary-btn:active:not(:disabled) { transform: translateY(0); }
        .filter-pill:hover { border-color: rgba(155,176,165,0.30); color: var(--nura-sage); }
      `}</style>

      <NuraPlexus opacity={0.35} />

      <div style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 56, background: "linear-gradient(180deg, rgba(13,13,14,0.92), rgba(13,13,14,0.75))", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${BORDER}` }}>
        <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_SEC, borderRadius: 8, padding: 0 }}>
          <Shield size={18} color="var(--nura-sage)" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: TEXT, letterSpacing: "0.3px" }}>Knowledge Base</span>
          <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: SAGE, background: "transparent", border: `0.5px solid rgba(${SAGE_RGB},0.5)`, borderRadius: 999, padding: "3px 8px" }}>Admin</span>
        </div>
        <button onClick={loadSources} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_TER, borderRadius: 8, padding: 0 }}>
          <RefreshCw size={14} />
        </button>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ position: "relative", zIndex: 2, padding: "24px 20px 100px", maxWidth: 480, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.3px", lineHeight: 1.2 }}>
            Knowledge Base
          </h1>
          <Eyebrow color={TEXT_TER}>NŪRA&apos;s brain · training corpus</Eyebrow>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
          {[
            { label: "Sources", value: sources.length.toString() },
            { label: "Chunks", value: totalChunks > 999 ? `${(totalChunks / 1000).toFixed(1)}K` : totalChunks.toString() },
            { label: "Storage", value: formatBytes(totalSize) },
            { label: "Queries", value: "—" },
          ].map((s) => (
            <Panel key={s.label} style={{ padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: SAGE, lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
              <Eyebrow color={TEXT_TER} size={9}>{s.label}</Eyebrow>
            </Panel>
          ))}
        </div>

        {processingCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `rgba(${SAGE_RGB},0.08)`, border: `0.5px solid rgba(${SAGE_RGB},0.25)`, borderRadius: 14, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: SAGE, animation: "live-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
            <Eyebrow color={SAGE}>{processingCount} source{processingCount > 1 ? "s" : ""} processing...</Eyebrow>
          </div>
        )}

        <button
          onClick={() => setShowUploadModal(true)}
          className="nura-primary-btn"
          style={{ width: "100%", padding: "13px 16px", marginBottom: 18, background: SAGE, border: "none", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE_ON, cursor: "pointer", transition: "background 200ms, transform 100ms" }}
        >
          <Upload size={14} />
          Add Knowledge Source
        </button>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 12 }}>
            <Search size={13} color="var(--nura-text-tertiary)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sources..."
              style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", outline: "none", fontFamily: SANS, fontSize: 14, color: TEXT }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_TER, padding: 0 }}><X size={12} /></button>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto" }}>
          {(["all", "book", "research", "article", "video", "audio"] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="filter-pill"
              style={{ flexShrink: 0, padding: "6px 12px", background: filter === f ? `rgba(${SAGE_RGB},0.14)` : "transparent", border: `0.5px solid ${filter === f ? `rgba(${SAGE_RGB},0.4)` : BORDER}`, borderRadius: 999, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: filter === f ? SAGE : TEXT_TER, cursor: "pointer", whiteSpace: "nowrap", transition: "background 180ms, border-color 180ms, color 180ms" }}>
              {f === "all" ? `All · ${sources.length}` : f}
            </button>
          ))}
        </div>

        {deleteError && (
          <div style={{ marginBottom: 12, padding: "10px 12px", background: "rgba(255,76,92,0.08)", border: `0.5px solid rgba(255,76,92,0.4)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <Eyebrow color={DANGER} size={10}>{deleteError}</Eyebrow>
            <button onClick={() => setDeleteError("")} style={{ background: "none", border: "none", cursor: "pointer", color: TEXT_SEC, padding: 0, display: "flex", alignItems: "center" }} aria-label="Dismiss">
              <X size={12} />
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, color: TEXT_TER, letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", padding: "40px 0" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "44px 0" }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, margin: "0 0 8px" }}>No sources yet</h2>
            <Eyebrow color={TEXT_TER}>Add your first knowledge source above</Eyebrow>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s) => {
              const isProcessing = s.status === "processing";
              const isFailed = s.status === "failed";
              const menuOpen = menuOpenId === s.id;

              return (
                <div key={s.id} className="source-card" style={{ position: "relative", padding: "14px 16px", background: SURFACE, border: `0.5px solid ${isProcessing ? `rgba(${SAGE_RGB},0.35)` : isFailed ? "rgba(255,76,92,0.35)" : BORDER}`, borderRadius: 14 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAGE, background: `rgba(${SAGE_RGB},0.14)`, border: `0.5px solid rgba(${SAGE_RGB},0.25)`, borderRadius: 8, padding: "3px 8px" }}>
                          {s.source_type}
                        </span>
                        {isProcessing && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: "50%", background: WARN, animation: "live-pulse 1.5s ease-in-out infinite" }} />
                            <Eyebrow color={WARN} size={9}>Processing</Eyebrow>
                          </span>
                        )}
                        {isFailed && <Eyebrow color={DANGER} size={9}>Failed</Eyebrow>}
                        {s.status === "analyzed" && <Eyebrow color={TEXT_TER} size={9}>{s.chunk_count ?? 0} chunks · {relativeTime(s.created_at)}</Eyebrow>}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: s.author ? 2 : 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.title}
                      </div>
                      {s.author && <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>{s.author}</div>}
                      {s.topics && s.topics.length > 0 && (
                        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                          {s.topics.slice(0, 4).map((t) => (
                            <span key={t} style={{ fontFamily: SANS, fontSize: 10, fontWeight: 500, color: TEXT_SEC, background: `rgba(${FG_RGB},0.06)`, border: `0.5px solid ${BORDER}`, borderRadius: 8, padding: "3px 7px" }}>{t}</span>
                          ))}
                        </div>
                      )}
                      {isFailed && s.error_message && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8 }}>
                          <AlertTriangle size={11} color={DANGER} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span style={{ fontFamily: SANS, fontSize: 11, color: DANGER, letterSpacing: "0.02em" }}>{s.error_message}</span>
                        </div>
                      )}
                    </div>

                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpen ? null : s.id); }}
                        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: TEXT_TER, borderRadius: 6, padding: 0 }}
                      >
                        <ChevronDown size={14} />
                      </button>
                      {menuOpen && (
                        <div style={{ position: "absolute", right: 0, top: 32, background: SURFACE_ELEV, border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: "4px 0", zIndex: 60, minWidth: 140, boxShadow: "0 8px 24px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => { setConfirmDelete({ id: s.id, title: s.title }); setMenuOpenId(null); }}
                            style={{ width: "100%", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13, color: DANGER, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}
                          >
                            <Trash2 size={13} />
                            Delete
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

        <div style={{ marginTop: 28 }}>
          <div style={{ marginBottom: 10 }}>
            <Eyebrow color={TEXT_SEC}>Test query</Eyebrow>
          </div>
          <Panel style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTestQuery()}
                placeholder="Ask a test question..."
                style={{ flex: 1, padding: "10px 12px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10, fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none" }}
              />
              <button
                onClick={handleTestQuery}
                disabled={testLoading || !testQuery.trim()}
                className="nura-primary-btn"
                style={{ padding: "0 16px", background: testLoading ? `rgba(${SAGE_RGB},0.25)` : SAGE, border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 10, fontWeight: 600, color: testLoading ? TEXT_TER : SAGE_ON, cursor: testLoading ? "not-allowed" : "pointer", letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap", transition: "background 200ms, transform 100ms" }}
              >
                {testLoading ? "…" : "Search"}
              </button>
            </div>

            {testResults !== null && (
              <div style={{ marginTop: 14 }}>
                {testResults.length === 0 ? (
                  <Eyebrow color={TEXT_TER}>No results found</Eyebrow>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {testResults.map((r, i) => (
                      <div key={r.id} style={{ padding: "12px 14px", background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                          <Eyebrow color={SAGE} size={9}>{r.source_title}</Eyebrow>
                          <Eyebrow color={TEXT_TER} size={9}>
                            {r.similarity > 0 ? `${Math.round(r.similarity * 100)}% match` : `Result ${i + 1}`}
                          </Eyebrow>
                        </div>
                        <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.6, maxHeight: 80, overflowY: "auto" }}>
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

      {confirmDelete && (
        <ConfirmDeleteModal
          sourceTitle={confirmDelete.title}
          busy={deletingId === confirmDelete.id}
          errorMsg={deleteError}
          onCancel={() => {
            if (deletingId === confirmDelete.id) return;
            setConfirmDelete(null);
          }}
          onConfirm={() => handleDelete(confirmDelete.id)}
        />
      )}
    </div>
  );
}
