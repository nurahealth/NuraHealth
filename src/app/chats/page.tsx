"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/lib/sidebarStore";

const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

interface SessionRow { id: string; title: string | null; updated_at: string }

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ChatsListPage() {
  const router = useRouter();
  const openSidebar = useSidebar((s) => s.open);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/chat/sessions");
        if (res.status === 401) { router.push("/auth"); return; }
        if (!res.ok) throw new Error("Could not load chats");
        const data = await res.json() as { sessions: SessionRow[] };
        setSessions(data.sessions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load");
      }
    })();
  }, [router]);

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
      `}</style>

      <header style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top), 16px) 18px 14px",
        borderBottom: `0.5px solid ${BORDER}`,
      }}>
        <button
          onClick={openSidebar}
          aria-label="Menu"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            color: TEXT_SEC, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 500, color: SAGE }}>nūra</span>
        <div style={{ width: 40 }} />
      </header>

      <main style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "28px 22px 60px" }}>
        <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.3px" }}>
          Your conversations
        </h1>
        <p style={{ fontSize: 13, color: TEXT_SEC, margin: "0 0 24px" }}>
          Everything you&apos;ve asked NŪRA.
        </p>

        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.25)", borderRadius: 10, color: "#ff8a96", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {sessions === null && !error && (
          <div style={{ color: TEXT_TER, fontSize: 13 }}>Loading…</div>
        )}

        {sessions && sessions.length === 0 && (
          <div style={{
            padding: "32px 20px", textAlign: "center", borderRadius: 14,
            background: SURFACE, border: `0.5px solid ${BORDER}`, color: TEXT_SEC, fontSize: 13,
          }}>
            No conversations yet. Start one from the home page.
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/chat/${s.id}`)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "14px 16px", borderRadius: 12,
                  background: SURFACE, border: `0.5px solid ${BORDER}`,
                  color: TEXT, fontFamily: SANS, fontSize: 14, cursor: "pointer", textAlign: "left",
                  transition: "background 160ms, border-color 160ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(235,230,216,0.06)";
                  e.currentTarget.style.borderColor = `rgba(${SAGE_RGB},0.3)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = SURFACE;
                  e.currentTarget.style.borderColor = BORDER;
                }}
              >
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.title || "Untitled chat"}
                </span>
                <span style={{ fontSize: 11, color: TEXT_TER, flexShrink: 0 }}>{relativeTime(s.updated_at)}</span>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
