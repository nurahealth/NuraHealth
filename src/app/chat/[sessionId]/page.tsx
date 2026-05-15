"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "@/lib/sidebarStore";
import { useThemeStore } from "@/lib/themeStore";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── Subtle plexus canvas (smaller, slower for chat backdrop) ─────────────────
function ChatPlexus() {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const sageRgb = theme === "light" ? "125,147,133" : "155,176,165";
    const particleAlpha = theme === "light" ? 0.52 : 0.32;
    const linkAlphaMax = theme === "light" ? 0.18 : 0.10;

    let W = window.innerWidth, H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      const c = canvas.getContext("2d"); if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;
    const particles = Array.from({ length: 18 }, () => {
      const a = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: Math.cos(a) * 0.12, vy: Math.sin(a) * 0.12,
        r: 0.5 + Math.random() * 1.0,
      };
    });

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sageRgb},${particleAlpha})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${sageRgb},${(1 - d / 130) * linkAlphaMax})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [theme]);
  return (
    <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.35 }} />
  );
}

// ── Web Speech types ──────────────────────────────────────────────────────────
interface SpeechRecResult { transcript: string }
interface SpeechRecResults { length: number; [i: number]: { 0: SpeechRecResult; isFinal: boolean } }
interface SpeechRecEvent { resultIndex: number; results: SpeechRecResults }
interface SpeechRecInstance {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void;
  onresult: ((e: SpeechRecEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type SpeechRecCtor = new () => SpeechRecInstance;

// ── Icons ─────────────────────────────────────────────────────────────────────
const Menu      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
const Bookmark  = ({ filled }: { filled?: boolean }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const Copy      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>;
const Refresh   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2 5.3M20 4v6h-6"/></svg>;
const Share     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>;
const Paperclip = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5l-9.5 9.5a5.5 5.5 0 0 1-7.78-7.78L13.5 3.5a3.5 3.5 0 0 1 4.95 4.95l-9.5 9.5a1.5 1.5 0 0 1-2.12-2.12L15 7.5"/></svg>;
const Mic       = ({ on }: { on?: boolean }) => on ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3M8 21h8"/></svg>
);
const ArrowUp   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>;

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, onClick, active, label }: {
  icon: React.ReactNode; onClick: () => void; active?: boolean; label: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30, borderRadius: 8, border: "none",
        background: hov ? `rgba(var(--nura-sage-rgb),0.08)` : "transparent",
        color: active ? SAGE : hov ? SAGE : "rgba(var(--nura-fg-rgb),0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 160ms",
      }}
    >
      {icon}
    </button>
  );
}

// ── Markdown components ──────────────────────────────────────────────────────
const MD = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ margin: "0 0 8px", lineHeight: 1.6 }}>{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: SAGE, fontWeight: 500 }}>{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={{ margin: "0 0 8px", paddingLeft: 14, listStyle: "none" }}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ margin: "0 0 8px", paddingLeft: 18, color: SAGE }}>{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={{ position: "relative", paddingLeft: 14, margin: "0 0 4px", color: TEXT, listStyle: "none" }}>
      <span style={{ position: "absolute", left: 0, top: 9, width: 4, height: 4, borderRadius: "50%", background: SAGE }} />
      <span>{children}</span>
    </li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code style={{ background: "var(--nura-surface-elevated)", color: SAGE, padding: "1px 5px", borderRadius: 3, fontSize: "0.85em", fontFamily: "'JetBrains Mono', monospace" }}>{children}</code>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: SAGE, textDecoration: "none" }}
       onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
       onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
      {children}
    </a>
  ),
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChatSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const openSidebar = useSidebar((s) => s.open);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<SpeechRecInstance | null>(null);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovSend, setHovSend] = useState(false);
  const [hovMic, setHovMic] = useState(false);
  const [hovAttach, setHovAttach] = useState(false);
  const [recording, setRecording] = useState(false);
  const [chatBookmarked, setChatBookmarked] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  // Load session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      try {
        const res = await fetch(`/api/chat/${sessionId}`);
        if (!res.ok) {
          if (res.status === 404) { router.push("/"); return; }
          throw new Error("Could not load conversation");
        }
        const data = await res.json() as { messages?: ChatMessage[] };
        if (!cancelled) setMessages(data.messages ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId, router]);

  // Scroll to bottom on message change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError("");

    // Optimistic user message
    const tempUser: ChatMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUser]);
    setValue("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });
      const data = await res.json() as { userMessage?: ChatMessage; assistantMessage?: ChatMessage; error?: string };
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);

      setMessages(prev => {
        // replace temp with real, append assistant
        const withoutTmp = prev.filter(m => m.id !== tempUser.id);
        const next = [...withoutTmp];
        if (data.userMessage) next.push(data.userMessage);
        if (data.assistantMessage) next.push(data.assistantMessage);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }, [sending, sessionId]);

  const regenerate = useCallback(async (assistantIdx: number) => {
    // Find the user message right before this assistant message
    const priorUser = [...messages].slice(0, assistantIdx).reverse().find(m => m.role === "user");
    if (!priorUser) return;
    // Strip last assistant
    setMessages(prev => prev.slice(0, assistantIdx));
    void send(priorUser.content);
  }, [messages, send]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(value); }
  };

  const onMicClick = () => {
    if (recording) { recRef.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { alert("Voice input not supported in this browser"); return; }
    const rec = new Ctor();
    rec.continuous = false; rec.interimResults = false; rec.lang = "en-US";
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      if (transcript) setValue(prev => (prev ? prev + " " : "") + transcript.trim());
    };
    rec.onend = () => { setRecording(false); recRef.current = null; };
    rec.onerror = () => { setRecording(false); recRef.current = null; };
    recRef.current = rec;
    setRecording(true);
    rec.start();
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", color: TEXT_TER, fontFamily: SANS, fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", height: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column", position: "relative" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
        ::-webkit-scrollbar { width: 0; }
        @keyframes msg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typing-dot { 0%, 80%, 100% { opacity: 0.25; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
        @keyframes toast-in { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,76,92,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(255,76,92,0); }
        }
      `}</style>

      <ChatPlexus />

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} />

      {/* Header */}
      <header style={{
        flexShrink: 0, position: "relative", zIndex: 3,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top), 8px) 22px 18px",
        background: "rgba(13,13,14,0.82)", backdropFilter: "blur(10px)",
        borderBottom: `0.5px solid rgba(var(--nura-bg-tint-rgb),0.06)`,
      }}>
        <button
          onClick={openSidebar}
          aria-label="Menu"
          style={{
            width: 38, height: 38, borderRadius: 11,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: TEXT_SEC,
          }}
        >
          <Menu />
        </button>

        <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: SAGE, letterSpacing: "0.3px" }}>
          nūra
        </span>

        <button
          onClick={() => { setChatBookmarked(v => !v); showToast(chatBookmarked ? "Removed from saved" : "Saved"); }}
          aria-label="Bookmark conversation"
          style={{
            width: 38, height: 38, borderRadius: 11,
            background: chatBookmarked ? `rgba(var(--nura-sage-rgb),0.12)` : SURFACE,
            border: `0.5px solid ${chatBookmarked ? `rgba(var(--nura-sage-rgb),0.35)` : BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: chatBookmarked ? SAGE : TEXT_SEC,
          }}
        >
          <Bookmark filled={chatBookmarked} />
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 18, position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, idx) => {
            if (m.role === "user") {
              return (
                <div key={m.id} style={{
                  alignSelf: "flex-end", maxWidth: "78%",
                  padding: "10px 14px", borderRadius: "14px 14px 4px 14px",
                  background: SAGE, color: SAGE_ON, fontSize: 13.5, lineHeight: 1.5,
                  wordBreak: "break-word",
                  animation: "msg-in 220ms ease both",
                }}>
                  {m.content}
                </div>
              );
            }
            return (
              <div key={m.id} style={{
                alignSelf: "flex-start", maxWidth: "88%",
                display: "flex", flexDirection: "column", gap: 6,
                animation: "msg-in 240ms ease both",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: `rgba(var(--nura-sage-rgb),0.18)`, border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: SAGE }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "1.2px", color: `rgba(var(--nura-sage-rgb),0.85)`, textTransform: "uppercase" }}>
                    NŪRA
                  </span>
                </div>

                <div style={{
                  background: SURFACE, border: `0.5px solid ${BORDER}`,
                  color: TEXT, padding: "12px 14px",
                  borderRadius: "14px 14px 14px 4px",
                  fontSize: 13.5, lineHeight: 1.6, wordBreak: "break-word",
                }}>
                  <ReactMarkdown components={MD}>{m.content}</ReactMarkdown>
                </div>

                <div style={{ display: "flex", gap: 4, paddingLeft: 4, marginTop: 2 }}>
                  <ActionBtn
                    icon={<Copy />}
                    label="Copy"
                    onClick={() => { void navigator.clipboard.writeText(m.content); showToast("Copied"); }}
                  />
                  <ActionBtn
                    icon={<Bookmark filled={savedIds.has(m.id)} />}
                    label="Save"
                    active={savedIds.has(m.id)}
                    onClick={() => {
                      setSavedIds(prev => {
                        const next = new Set(prev);
                        if (next.has(m.id)) { next.delete(m.id); showToast("Removed"); }
                        else { next.add(m.id); showToast("Saved"); }
                        return next;
                      });
                    }}
                  />
                  <ActionBtn icon={<Refresh />} label="Regenerate" onClick={() => regenerate(idx)} />
                  <ActionBtn icon={<Share />} label="Share" onClick={() => showToast("Share coming soon")} />
                </div>
              </div>
            );
          })}

          {sending && (
            <div style={{ alignSelf: "flex-start", maxWidth: "88%", display: "flex", flexDirection: "column", gap: 6, animation: "msg-in 240ms ease both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: `rgba(var(--nura-sage-rgb),0.18)`, border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: SAGE }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "1.2px", color: `rgba(var(--nura-sage-rgb),0.85)`, textTransform: "uppercase" }}>NŪRA</span>
              </div>
              <div style={{
                background: SURFACE, border: `0.5px solid ${BORDER}`,
                padding: "14px 16px", borderRadius: "14px 14px 14px 4px",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: SAGE,
                    display: "inline-block",
                    animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              alignSelf: "flex-start", padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.25)",
              color: "#ff8a96", fontSize: 13, maxWidth: "88%",
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 110, left: "50%", transform: "translateX(-50%)",
          background: "rgba(20,20,21,0.95)", border: `0.5px solid rgba(var(--nura-sage-rgb),0.3)`,
          color: TEXT, padding: "8px 14px", borderRadius: 20, fontSize: 12,
          zIndex: 60, animation: "toast-in 220ms ease both",
        }}>
          {toast}
        </div>
      )}

      {/* Composer */}
      <div style={{
        flexShrink: 0, position: "relative", zIndex: 3,
        padding: "8px 18px max(env(safe-area-inset-bottom), 14px)",
        background: "rgba(13,13,14,0.9)", backdropFilter: "blur(10px)",
        borderTop: `0.5px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: focused ? "var(--nura-surface-elevated)" : SURFACE,
            border: `0.5px solid ${focused ? `rgba(var(--nura-sage-rgb),0.5)` : "rgba(var(--nura-bg-tint-rgb),0.12)"}`,
            borderRadius: 14, padding: 6,
            transition: "background 200ms, border-color 200ms",
          }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={() => setHovAttach(true)}
              onMouseLeave={() => setHovAttach(false)}
              aria-label="Attach"
              style={{
                width: 38, height: 38, borderRadius: 9, border: "none",
                background: hovAttach ? `rgba(var(--nura-sage-rgb),0.08)` : "transparent",
                color: hovAttach ? SAGE : TEXT_SEC,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 200ms",
              }}
            >
              <Paperclip />
            </button>

            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
              placeholder="Ask a follow-up..."
              disabled={sending}
              style={{
                flex: 1, padding: "11px 8px", background: "transparent",
                border: "none", outline: "none",
                fontSize: 14, color: TEXT, fontFamily: SANS,
              }}
            />

            <button
              onClick={onMicClick}
              onMouseEnter={() => setHovMic(true)}
              onMouseLeave={() => setHovMic(false)}
              aria-label={recording ? "Stop recording" : "Voice input"}
              style={{
                width: 38, height: 38, borderRadius: 9, border: "none",
                background: recording ? "rgba(255,76,92,0.12)" : hovMic ? `rgba(var(--nura-sage-rgb),0.08)` : "transparent",
                color: recording ? "#ff4c5c" : hovMic ? SAGE : TEXT_SEC,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 200ms",
                animation: recording ? "mic-pulse 1.4s ease-in-out infinite" : "none",
              }}
            >
              <Mic on={recording} />
            </button>

            <button
              onClick={() => send(value)}
              disabled={sending || !value.trim()}
              onMouseEnter={() => setHovSend(true)}
              onMouseLeave={() => setHovSend(false)}
              aria-label="Send"
              style={{
                width: 38, height: 38, borderRadius: 11, border: "none",
                background: (sending || !value.trim()) ? `rgba(var(--nura-sage-rgb),0.4)` : hovSend ? SAGE_HOV : SAGE,
                color: SAGE_ON,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: (sending || !value.trim()) ? "not-allowed" : "pointer",
                flexShrink: 0, transition: "background 200ms",
              }}
            >
              <ArrowUp />
            </button>
          </div>

          <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 9.5, color: "rgba(var(--nura-fg-rgb),0.32)" }}>
            NŪRA provides wellness information, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
