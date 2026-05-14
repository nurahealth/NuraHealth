"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

type Msg = { role: "user" | "assistant"; text: string };

// Minimal markdown renderer for **bold** and bullet points (·)
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} style={{ color: TEXT, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return (
      <div key={i} style={{ minHeight: line ? undefined : "1em" }}>
        {rendered}
      </div>
    );
  });
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [initial, setInitial] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovSend, setHovSend] = useState(false);
  const sentInitial = useRef(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      const meta = user.user_metadata as { name?: string; full_name?: string } | undefined;
      const fromMeta = meta?.name ?? meta?.full_name ?? "";
      if (fromMeta) setInitial(fromMeta.trim().charAt(0).toUpperCase());
      else setInitial((user.email ?? "?").trim().charAt(0).toUpperCase());
      setAuthChecked(true);
    });
  }, [router]);

  // Scroll to bottom on new message
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const sendToBackend = useCallback(async (history: Msg[]) => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const reply = data.reply ?? "I'm not sure how to respond. Could you rephrase?";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      setError(msg);
    } finally {
      setSending(false);
    }
  }, []);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: Msg[] = [...messages, { role: "user", text: trimmed }];
    setMessages(next);
    setValue("");
    void sendToBackend(next);
  }, [messages, sending, sendToBackend]);

  // Auto-fire initial message from query param or sessionStorage
  useEffect(() => {
    if (!authChecked || sentInitial.current) return;
    const q = searchParams.get("q");
    let initialMsg = q;
    if (!initialMsg) {
      try { initialMsg = sessionStorage.getItem("nura.initialMessage"); } catch {}
    }
    if (initialMsg && initialMsg.trim()) {
      sentInitial.current = true;
      try { sessionStorage.removeItem("nura.initialMessage"); } catch {}
      const first: Msg[] = [{ role: "user", text: initialMsg.trim() }];
      setMessages(first);
      void sendToBackend(first);
    }
  }, [authChecked, searchParams, sendToBackend]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(value); }
  };

  if (!authChecked) {
    return <div style={{ minHeight: "100dvh", background: BG }} />;
  }

  return (
    <div style={{ minHeight: "100dvh", height: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
        ::-webkit-scrollbar { width: 0; }
        @keyframes typing-dot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40%            { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <header style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top), 16px) 18px 14px",
        background: "rgba(13,13,14,0.85)", backdropFilter: "blur(10px)",
        borderBottom: `0.5px solid ${BORDER}`,
      }}>
        <button
          onClick={() => router.push("/")}
          aria-label="Back"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: TEXT_SEC,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6"/>
          </svg>
        </button>

        <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 500, color: SAGE, letterSpacing: "0.3px" }}>
          nūra
        </span>

        <button
          onClick={() => router.push("/settings")}
          aria-label="Profile"
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `rgba(${SAGE_RGB},0.18)`, border: `0.5px solid rgba(${SAGE_RGB},0.35)`,
            color: SAGE, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {initial || "?"}
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto",
        padding: "20px 18px 12px",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              animation: "msg-in 280ms ease both",
            }}>
              <div style={{
                maxWidth: "82%",
                padding: m.role === "user" ? "10px 14px" : "12px 16px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? SAGE : SURFACE,
                color: m.role === "user" ? SAGE_ON : TEXT,
                border: m.role === "user" ? "none" : `0.5px solid ${BORDER}`,
                fontSize: 14, lineHeight: 1.55, fontFamily: SANS,
                wordBreak: "break-word",
              }}>
                {m.role === "user" ? m.text : renderMarkdown(m.text)}
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "14px 16px", borderRadius: "16px 16px 16px 4px",
                background: SURFACE, border: `0.5px solid ${BORDER}`,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: SAGE,
                    animation: `typing-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
                    display: "inline-block",
                  }} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.25)",
                color: "#ff8a96", fontSize: 13, maxWidth: "82%",
              }}>
                {error}
              </div>
            </div>
          )}

          {messages.length === 0 && !sending && (
            <div style={{ textAlign: "center", color: TEXT_TER, fontSize: 13, padding: "40px 20px" }}>
              Type a message to start a conversation with NŪRA.
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div style={{
        flexShrink: 0,
        padding: "10px 18px max(env(safe-area-inset-bottom), 14px)",
        background: "rgba(13,13,14,0.92)", backdropFilter: "blur(10px)",
        borderTop: `0.5px solid ${BORDER}`,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: focused ? "rgba(235,230,216,0.06)" : SURFACE,
            border: `0.5px solid ${focused ? `rgba(${SAGE_RGB},0.5)` : "rgba(235,230,216,0.12)"}`,
            borderRadius: 14, padding: "6px 6px 6px 14px",
            transition: "background 200ms, border-color 200ms",
          }}>
            <input
              ref={composerRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
              placeholder="Message NŪRA..."
              disabled={sending}
              style={{
                flex: 1, padding: "11px 0", background: "transparent",
                border: "none", outline: "none",
                fontSize: 14, color: TEXT, fontFamily: SANS,
              }}
            />
            <button
              onClick={() => send(value)}
              disabled={sending || !value.trim()}
              onMouseEnter={() => setHovSend(true)}
              onMouseLeave={() => setHovSend(false)}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.94)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              aria-label="Send"
              style={{
                width: 40, height: 40, borderRadius: 11, border: "none",
                background: (sending || !value.trim()) ? `rgba(${SAGE_RGB},0.4)` : hovSend ? SAGE_HOV : SAGE,
                color: SAGE_ON,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: (sending || !value.trim()) ? "not-allowed" : "pointer",
                flexShrink: 0, transition: "background 200ms, transform 100ms",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>

          <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 10, color: TEXT_TER }}>
            NŪRA provides wellness information, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: BG }} />}>
      <ChatContent />
    </Suspense>
  );
}
