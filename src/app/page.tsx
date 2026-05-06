"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Send, Bookmark, BookmarkCheck, X } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Logo from "@/components/Logo";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import { saveItem, deleteSavedItem } from "@/lib/saved";

const SUGGESTED_PROMPTS = [
  "What natural supplements reduce inflammation?",
  "Create a gut healing protocol for beginners",
  "Best herbs for anxiety without drowsiness",
  "How do I balance cortisol naturally?",
];

function defaultTitle(text: string): string {
  return text.trim().split(/\s+/).slice(0, 8).join(" ").replace(/[*#_]/g, "").trim();
}

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save state (session-local)
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [savedItemIds, setSavedItemIds] = useState<Record<number, string>>({});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [toastIdx, setToastIdx] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        setAuthLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    const newMessages = [...messages, { role: "user", text: msg }];
    setMessages(newMessages);
    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleBookmarkClick = (idx: number, text: string) => {
    if (savedIndices.has(idx)) {
      // Unsave
      const itemId = savedItemIds[idx];
      if (itemId) deleteSavedItem(itemId).catch(() => {});
      setSavedIndices((prev) => { const next = new Set(prev); next.delete(idx); return next; });
      setSavedItemIds((prev) => { const next = { ...prev }; delete next[idx]; return next; });
    } else {
      setTitleDraft(defaultTitle(text));
      setEditingIdx(idx);
    }
  };

  const confirmSave = async (idx: number, text: string) => {
    if (!user || !titleDraft.trim()) return;
    setSavingIdx(idx);
    try {
      const item = await saveItem(user.id, {
        type: "chat",
        title: titleDraft.trim(),
        content: text,
        description: text.slice(0, 120),
      });
      setSavedIndices((prev) => new Set(prev).add(idx));
      setSavedItemIds((prev) => ({ ...prev, [idx]: item.id }));
      setEditingIdx(null);
      setToastIdx(idx);
      setTimeout(() => setToastIdx((t) => (t === idx ? null : t)), 2200);
    } catch {
      // silent
    } finally {
      setSavingIdx(null);
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const userInitial = userName.charAt(0).toUpperCase();
  const hasMessages = messages.length > 0;

  const msgHtml = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, `<strong style="font-weight:600;color:${colors.mint}">$1</strong>`)
      .replace(/· /g, `<span style="color:${colors.mint};margin-right:6px">·</span> `);

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes typing-dot { 0%, 100% { opacity: 0.25; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes panel-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toast-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder { color: ${colors.textFaint} !important; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)", paddingBottom: 65 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {!hasMessages ? (
            /* Welcome state */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "24px 0 40px", animation: "panel-in 0.4s ease" }}>
              <div style={{ marginBottom: 24 }}><Logo size={56} /></div>
              <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, textAlign: "center", margin: "0 0 8px", lineHeight: 1.3 }}>
                Welcome back, {userName}
              </h1>
              <p style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.mintDeep, textAlign: "center", margin: "0 0 32px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                NUTRITION · SUPPLEMENTS · HEALING
              </p>

              <div style={{ width: "100%", maxWidth: 480, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.mintBgSubtle, border: `1.5px solid ${colors.mintBorder}`, borderRadius: 16, padding: "6px 6px 6px 18px" }}>
                  <input
                    ref={inputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask NŪRA anything health related..."
                    style={{ flex: 1, border: "none", outline: "none", fontFamily: FONTS.sans, fontSize: 14, color: colors.text, background: "transparent", padding: "10px 0" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    style={{ width: 40, height: 40, borderRadius: 12, border: "none", cursor: chatInput.trim() && !isTyping ? "pointer" : "default", background: chatInput.trim() && !isTyping ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})` : colors.mintBgSubtle, color: chatInput.trim() && !isTyping ? colors.textOnAccent : colors.textFaint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              <p style={{ fontFamily: FONTS.mono, fontSize: 9, color: colors.textGhost, textAlign: "center", margin: "0 0 28px", letterSpacing: "0.08em" }}>
                WELLNESS INFORMATION · NOT MEDICAL ADVICE
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480 }}>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setChatInput(prompt); inputRef.current?.focus(); }}
                    style={{ padding: "10px 16px", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 24, fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textMuted, cursor: "pointer" }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat state */
            <div style={{ padding: "24px 0", maxWidth: 600, margin: "0 auto" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 28 }}>
                  {msg.role === "assistant" ? (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, marginTop: 3 }}><Logo size={24} /></div>
                      <div
                        style={{
                          flex: 1,
                          background: colors.mintBgSubtle,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "4px 16px 16px 16px",
                          padding: "14px 18px 10px",
                          fontFamily: FONTS.sans,
                          fontSize: 14,
                          color: colors.text,
                          lineHeight: 1.8,
                        }}
                      >
                        {/* Message content */}
                        <div
                          style={{ whiteSpace: "pre-wrap" }}
                          dangerouslySetInnerHTML={{ __html: msgHtml(msg.text) }}
                        />

                        {/* Inline title form */}
                        {editingIdx === i && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.borderFaint}` }}>
                            <div style={{ fontFamily: FONTS.mono, fontSize: 8.5, color: colors.textFaint, letterSpacing: "1px", marginBottom: 6 }}>
                              SAVE AS
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <input
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") confirmSave(i, msg.text); if (e.key === "Escape") setEditingIdx(null); }}
                                autoFocus
                                style={{
                                  flex: 1, padding: "6px 10px",
                                  background: colors.mintBgMedium,
                                  border: `1px solid ${colors.mintBorder}`,
                                  borderRadius: 7,
                                  fontFamily: FONTS.sans, fontSize: 12.5,
                                  color: colors.text, outline: "none",
                                }}
                              />
                              <button
                                onClick={() => confirmSave(i, msg.text)}
                                disabled={savingIdx === i || !titleDraft.trim()}
                                style={{ padding: "6px 12px", background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, border: "none", borderRadius: 7, fontFamily: FONTS.mono, fontSize: 8.5, fontWeight: 700, color: colors.textOnAccent, cursor: "pointer", letterSpacing: "0.8px", opacity: savingIdx === i ? 0.5 : 1, whiteSpace: "nowrap" }}
                              >
                                {savingIdx === i ? "..." : "SAVE"}
                              </button>
                              <button
                                onClick={() => setEditingIdx(null)}
                                style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 7, cursor: "pointer", color: colors.textFaint, padding: 0, flexShrink: 0 }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Save footer row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                          {toastIdx === i && (
                            <span style={{ fontFamily: FONTS.mono, fontSize: 8.5, color: colors.mint, letterSpacing: "0.8px", animation: "toast-in 0.2s ease" }}>
                              SAVED TO LIBRARY
                            </span>
                          )}
                          <button
                            onClick={() => handleBookmarkClick(i, msg.text)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 3, display: "flex", alignItems: "center", color: savedIndices.has(i) ? colors.mint : colors.textGhost, transition: "color 0.15s" }}
                          >
                            {savedIndices.has(i)
                              ? <BookmarkCheck size={15} />
                              : <Bookmark size={15} />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ maxWidth: "82%", padding: "12px 18px", background: `linear-gradient(135deg, ${colors.mintBgMedium}, rgba(94,234,212,0.12))`, border: `1px solid ${colors.mintBorder}`, borderRadius: "16px 16px 4px 16px", fontFamily: FONTS.sans, fontSize: 14, color: colors.text }}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginTop: 3 }}><Logo size={24} /></div>
                  <div style={{ display: "flex", gap: 5, padding: "14px 18px", background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: "4px 16px 16px 16px" }}>
                    {[0, 1, 2].map((d) => (
                      <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: colors.mint, animation: `typing-dot 1.4s ease-in-out ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Sticky chat input when messages exist */}
        {hasMessages && (
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${colors.border}`, background: colors.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: colors.mintBgSubtle, border: `1.5px solid ${colors.mintBorder}`, borderRadius: 16, padding: "6px 6px 6px 18px", maxWidth: 600, margin: "0 auto" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask NŪRA anything health related..."
                style={{ flex: 1, border: "none", outline: "none", fontFamily: FONTS.sans, fontSize: 14, color: colors.text, background: "transparent", padding: "10px 0" }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || isTyping}
                style={{ width: 40, height: 40, borderRadius: 12, border: "none", cursor: chatInput.trim() && !isTyping ? "pointer" : "default", background: chatInput.trim() && !isTyping ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})` : colors.mintBgSubtle, color: chatInput.trim() && !isTyping ? colors.textOnAccent : colors.textFaint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
