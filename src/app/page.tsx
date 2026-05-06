"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Send } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Logo from "@/components/Logo";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

const SUGGESTED_PROMPTS = [
  "What natural supplements reduce inflammation?",
  "Create a gut healing protocol for beginners",
  "Best herbs for anxiety without drowsiness",
  "How do I balance cortisol naturally?",
];

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

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONTS.mono,
          color: colors.textFaint,
          fontSize: 12,
          letterSpacing: "1.5px",
        }}
      >
        LOADING...
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const userInitial = userName.charAt(0).toUpperCase();
  const hasMessages = messages.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes typing-dot { 0%, 100% { opacity: 0.25; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
        @keyframes panel-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder { color: ${colors.textFaint} !important; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userInitial={userInitial}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 56px)",
          paddingBottom: 65,
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {!hasMessages ? (
            /* Welcome state */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100%",
                padding: "24px 0 40px",
                animation: "panel-in 0.4s ease",
              }}
            >
              <div style={{ marginBottom: 24 }}>
                <Logo size={56} />
              </div>
              <h1
                style={{
                  fontFamily: FONTS.serif,
                  fontSize: 26,
                  fontWeight: 400,
                  color: colors.text,
                  textAlign: "center",
                  margin: "0 0 8px",
                  lineHeight: 1.3,
                }}
              >
                Welcome back, {userName}
              </h1>
              <p
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: colors.mintDeep,
                  textAlign: "center",
                  margin: "0 0 32px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                }}
              >
                NUTRITION · SUPPLEMENTS · HEALING
              </p>

              {/* Chat input in welcome state */}
              <div style={{ width: "100%", maxWidth: 480, marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: colors.mintBgSubtle,
                    border: `1.5px solid ${colors.mintBorder}`,
                    borderRadius: 16,
                    padding: "6px 6px 6px 18px",
                  }}
                >
                  <input
                    ref={inputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Ask NŪRA anything health related..."
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontFamily: FONTS.sans,
                      fontSize: 14,
                      color: colors.text,
                      background: "transparent",
                      padding: "10px 0",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isTyping}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: "none",
                      cursor: chatInput.trim() && !isTyping ? "pointer" : "default",
                      background:
                        chatInput.trim() && !isTyping
                          ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`
                          : colors.mintBgSubtle,
                      color: chatInput.trim() && !isTyping ? colors.textOnAccent : colors.textFaint,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              <p
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  color: colors.textGhost,
                  textAlign: "center",
                  margin: "0 0 28px",
                  letterSpacing: "0.08em",
                }}
              >
                WELLNESS INFORMATION · NOT MEDICAL ADVICE
              </p>

              {/* Prompt chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  maxWidth: 480,
                }}
              >
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatInput(prompt);
                      inputRef.current?.focus();
                    }}
                    style={{
                      padding: "10px 16px",
                      background: colors.mintBgSubtle,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 24,
                      fontFamily: FONTS.sans,
                      fontSize: 12.5,
                      color: colors.textMuted,
                      cursor: "pointer",
                    }}
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
                      <div style={{ flexShrink: 0, marginTop: 3 }}>
                        <Logo size={24} />
                      </div>
                      <div
                        style={{
                          flex: 1,
                          background: colors.mintBgSubtle,
                          border: `1px solid ${colors.border}`,
                          borderRadius: "4px 16px 16px 16px",
                          padding: "14px 18px",
                          fontFamily: FONTS.sans,
                          fontSize: 14,
                          color: colors.text,
                          lineHeight: 1.8,
                          whiteSpace: "pre-wrap",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, `<strong style="font-weight:600;color:${colors.mint}">$1</strong>`)
                            .replace(/· /g, `<span style="color:${colors.mint};margin-right:6px">·</span> `),
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div
                        style={{
                          maxWidth: "82%",
                          padding: "12px 18px",
                          background: `linear-gradient(135deg, ${colors.mintBgMedium}, rgba(94,234,212,0.12))`,
                          border: `1px solid ${colors.mintBorder}`,
                          borderRadius: "16px 16px 4px 16px",
                          fontFamily: FONTS.sans,
                          fontSize: 14,
                          color: colors.text,
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginTop: 3 }}>
                    <Logo size={24} />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 5,
                      padding: "14px 18px",
                      background: colors.mintBgSubtle,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "4px 16px 16px 16px",
                    }}
                  >
                    {[0, 1, 2].map((d) => (
                      <div
                        key={d}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: colors.mint,
                          animation: `typing-dot 1.4s ease-in-out ${d * 0.2}s infinite`,
                        }}
                      />
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
          <div
            style={{
              padding: "12px 20px",
              borderTop: `1px solid ${colors.border}`,
              background: colors.bg,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: colors.mintBgSubtle,
                border: `1.5px solid ${colors.mintBorder}`,
                borderRadius: 16,
                padding: "6px 6px 6px 18px",
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask NŪRA anything health related..."
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontFamily: FONTS.sans,
                  fontSize: 14,
                  color: colors.text,
                  background: "transparent",
                  padding: "10px 0",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim() || isTyping}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "none",
                  cursor: chatInput.trim() && !isTyping ? "pointer" : "default",
                  background:
                    chatInput.trim() && !isTyping
                      ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`
                      : colors.mintBgSubtle,
                  color: chatInput.trim() && !isTyping ? colors.textOnAccent : colors.textFaint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
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
