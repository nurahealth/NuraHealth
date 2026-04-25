"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const THEMES = {
  light: {
    bg: "#F5F1E9",
    bgContent: "#FAF8F4",
    sidebar: "#EFEBE2",
    sidebarHover: "#E6E1D6",
    text: "#1B3022",
    textMuted: "#5A6B5E",
    textLight: "#8A9488",
    textFaint: "#B5BDB7",
    terracotta: "#C17A56",
    terracottaLight: "#F5EBE3",
    moss: "#6B7F5E",
    mossLight: "#E8EDE5",
    sage: "#A4B89A",
    sageLight: "#EFF3EC",
    gold: "#C4A55A",
    goldLight: "#F7F2E4",
    card: "rgba(255,255,255,0.7)",
    cardSolid: "#FFFFFF",
    border: "rgba(0,0,0,0.06)",
    white: "#FFFFFF",
    overlay: "rgba(27,48,34,0.35)",
    glow: "0 1px 3px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04)",
    glowHover: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
    logoBg: "#1B3022",
    logoText: "#F5F1E9",
    inputBg: "rgba(255,255,255,0.85)",
    topBarBg: "rgba(250,248,244,0.8)",
    userBubbleBg: "#1B3022",
    userBubbleText: "#F5F1E9",
    toggleBg: "rgba(0,0,0,0.06)",
    toggleActive: "#1B3022",
  },
  dark: {
    bg: "#1B3022",
    bgContent: "#1F3627",
    sidebar: "#17291E",
    sidebarHover: "#243D2E",
    text: "#F5F1E9",
    textMuted: "#B0C4A8",
    textLight: "#7D9473",
    textFaint: "#4E6847",
    terracotta: "#D4956E",
    terracottaLight: "rgba(212,149,110,0.12)",
    moss: "#A4B89A",
    mossLight: "rgba(164,184,154,0.1)",
    sage: "#A4B89A",
    sageLight: "rgba(164,184,154,0.08)",
    gold: "#D4C5A0",
    goldLight: "rgba(212,197,160,0.1)",
    card: "rgba(255,255,255,0.04)",
    cardSolid: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.06)",
    white: "#F5F1E9",
    overlay: "rgba(0,0,0,0.5)",
    glow: "0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.12)",
    glowHover: "0 2px 8px rgba(0,0,0,0.15), 0 8px 32px rgba(0,0,0,0.2)",
    logoBg: "#F5F1E9",
    logoText: "#1B3022",
    inputBg: "rgba(255,255,255,0.06)",
    topBarBg: "rgba(31,54,39,0.85)",
    userBubbleBg: "rgba(255,255,255,0.1)",
    userBubbleText: "#F5F1E9",
    toggleBg: "rgba(255,255,255,0.08)",
    toggleActive: "#F5F1E9",
  }
};

const serif = "'DM Serif Display', Georgia, serif";
const sans = "'Outfit', system-ui, sans-serif";

const SUGGESTED_PROMPTS = [
  "What natural supplements reduce inflammation?",
  "Create a gut healing protocol for beginners",
  "Best herbs for anxiety without drowsiness",
  "How do I balance cortisol naturally?",
];

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "explore", label: "Explore", icon: "✦" },
  { id: "conditions", label: "Conditions", icon: "◈" },
  { id: "saved", label: "Saved", icon: "♡" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const C = THEMES[theme];

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
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

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
      setMessages(prev => [...prev, { role: "assistant", text: data.reply || "Sorry, something went wrong." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const Logo = ({ size = 36 }: { size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.22, background: C.logoBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontFamily: serif, fontSize: size * 0.5, color: C.logoText, lineHeight: 1, marginTop: 1 }}>N</span>
    </div>
  );

  const ThemeToggle = () => (
    <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} style={{ display: "flex", alignItems: "center", padding: 3, borderRadius: 20, background: C.toggleBg, border: "none", cursor: "pointer", width: 52, height: 28, position: "relative", transition: "background 0.3s" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.toggleActive, position: "absolute", left: theme === "light" ? 3 : 27, transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
        {theme === "light" ? "☀" : "🌙"}
      </div>
    </button>
  );

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF8F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, color: "#5A6B5E", fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: C.bgContent, fontFamily: sans, transition: "background 0.4s ease" }}>
      <style>{`
        @keyframes nura-pulse { 0%, 100% { opacity: 0.2; transform: scale(1); } 50% { opacity: 0.85; transform: scale(1.15); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder { color: ${C.textLight} !important; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: C.overlay, zIndex: 200, backdropFilter: "blur(4px)" }} />
      )}

      <div style={{ position: "fixed", left: sidebarOpen ? 0 : -300, top: 0, bottom: 0, width: 280, background: C.sidebar, zIndex: 201, transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", borderRight: `1px solid ${C.border}` }}>
        <div style={{ padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
          <Logo size={32} />
          <span style={{ fontFamily: serif, fontSize: 22, color: C.text }}>Nura</span>
        </div>

        <div style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); if (item.id !== "home") router.push(`/${item.id}`); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", marginBottom: 2, background: activeNav === item.id ? C.sidebarHover : "transparent", border: "none", borderRadius: 10, fontFamily: sans, fontSize: 14, color: activeNav === item.id ? C.text : C.textMuted, cursor: "pointer", textAlign: "left", fontWeight: activeNav === item.id ? 500 : 400 }}>
              <span style={{ fontSize: 16, color: activeNav === item.id ? C.terracotta : C.textLight, width: 18, textAlign: "center" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div style={{ marginTop: 24, padding: "0 14px 8px", fontFamily: sans, fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Recent Chats
          </div>
          <div style={{ padding: "8px 14px", fontFamily: sans, fontSize: 12.5, color: C.textFaint, fontStyle: "italic" }}>
            No saved chats yet
          </div>
        </div>

        <div style={{ padding: "12px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.terracotta, color: C.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 14, flexShrink: 0 }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: sans, fontSize: 13, color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: C.textMuted, fontFamily: sans, fontSize: 11.5, cursor: "pointer", padding: 0, textAlign: "left" }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: C.topBarBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: C.text, fontSize: 18 }}>
          ☰
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={24} />
          <span style={{ fontFamily: serif, fontSize: 18, color: C.text }}>Nura</span>
        </div>
        <ThemeToggle />
      </div>

      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 49px)" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
          {messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: "20px 0 40px" }}>
              <div style={{ marginBottom: 24 }}><Logo size={44} /></div>
              <h1 style={{ fontFamily: serif, fontSize: 24, fontWeight: 400, color: C.text, textAlign: "center", margin: "0 0 8px", lineHeight: 1.3 }}>
                {`Welcome back, ${userName}`}
              </h1>
              <p style={{ fontFamily: sans, fontSize: 13, color: C.textLight, textAlign: "center", margin: "0 0 28px" }}>
                Nutrition · Supplements · Movement · Natural Healing
              </p>

              <div style={{ width: "100%", maxWidth: 480 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.inputBg, backdropFilter: "blur(20px)", border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "5px 6px 5px 20px", boxShadow: C.glow }}>
                  <input ref={inputRef} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask Nura anything health related..." style={{ flex: 1, border: "none", outline: "none", fontFamily: sans, fontSize: 14, color: C.text, background: "transparent", padding: "11px 0" }} />
                  <button onClick={sendMessage} disabled={!chatInput.trim() || isTyping} style={{ width: 40, height: 40, borderRadius: 12, border: "none", cursor: chatInput.trim() && !isTyping ? "pointer" : "default", background: chatInput.trim() && !isTyping ? C.logoBg : C.toggleBg, color: chatInput.trim() && !isTyping ? C.logoText : C.textFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>↑</button>
                </div>
              </div>

              <p style={{ fontFamily: sans, fontSize: 10, color: C.textFaint, textAlign: "center", margin: "12px 0 28px" }}>
                Nura provides wellness information, not medical advice.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480 }}>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button key={i} onClick={() => { setChatInput(prompt); inputRef.current?.focus(); }} style={{ padding: "10px 16px", background: C.card, backdropFilter: "blur(8px)", border: `1px solid ${C.border}`, borderRadius: 24, fontFamily: sans, fontSize: 12.5, color: C.textMuted, cursor: "pointer" }}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: "24px 0", maxWidth: 600, margin: "0 auto" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 28 }}>
                  {msg.role === "assistant" ? (
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, marginTop: 3 }}><Logo size={24} /></div>
                      <div style={{ flex: 1, fontFamily: sans, fontSize: 14, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, `<strong style="font-weight:600">$1</strong>`).replace(/· /g, `<span style="color:${C.terracotta};margin-right:6px;font-weight:700">·</span> `) }} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ maxWidth: "82%", padding: "14px 18px", background: C.userBubbleBg, borderRadius: "20px 20px 4px 20px", fontFamily: sans, fontSize: 14, color: C.userBubbleText }}>{msg.text}</div>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, marginTop: 3 }}><Logo size={24} /></div>
                  <div style={{ display: "flex", gap: 5, padding: "14px 0" }}>
                    {[0, 1, 2].map(d => (
                      <div key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: C.sage, animation: `nura-pulse 1.4s ease-in-out ${d * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {messages.length > 0 && (
          <div style={{ padding: "12px 20px 16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.inputBg, backdropFilter: "blur(20px)", border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "5px 6px 5px 20px", boxShadow: C.glow }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Ask Nura anything health related..." style={{ flex: 1, border: "none", outline: "none", fontFamily: sans, fontSize: 14, color: C.text, background: "transparent", padding: "11px 0" }} />
              <button onClick={sendMessage} disabled={!chatInput.trim() || isTyping} style={{ width: 40, height: 40, borderRadius: 12, border: "none", cursor: chatInput.trim() && !isTyping ? "pointer" : "default", background: chatInput.trim() && !isTyping ? C.logoBg : C.toggleBg, color: chatInput.trim() && !isTyping ? C.logoText : C.textFaint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>↑</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}