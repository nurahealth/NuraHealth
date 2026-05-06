"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Trash2 } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import {
  getUserSavedItems,
  getSavedItemCounts,
  deleteSavedItem,
  type SavedItem,
  type SavedItemType,
  type SavedItemCounts,
} from "@/lib/saved";

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

function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "TODAY";
  if (diffDays === 1) return "1D AGO";
  if (diffDays < 7) return `${diffDays}D AGO`;
  if (diffDays < 14) return "1W AGO";
  if (diffDays < 21) return "2W AGO";
  if (diffDays < 28) return "3W AGO";
  if (diffDays < 30) return "4W AGO";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

type FilterType = "all" | SavedItemType;

const TYPE_LABELS: Record<SavedItemType, string> = {
  protocol: "PROTOCOL",
  stack: "STACK",
  insight: "INSIGHT",
  chat: "CHAT",
};

export default function SavedPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [items, setItems] = useState<SavedItem[]>([]);
  const [counts, setCounts] = useState<SavedItemCounts>({ all: 0, protocol: 0, stack: 0, insight: 0, chat: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push("/auth"); return; }
      setUser(u);
      setAuthLoading(false);
    });
  }, [router]);

  const loadData = useCallback(async (userId: string, typeFilter?: SavedItemType) => {
    setLoading(true);
    try {
      const [fetched, c] = await Promise.all([
        getUserSavedItems(userId, typeFilter),
        getSavedItemCounts(userId),
      ]);
      setItems(fetched);
      setCounts(c);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData(user.id, filter === "all" ? undefined : filter);
  }, [user, filter, loadData]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteSavedItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setCounts((prev) => {
        const item = items.find((i) => i.id === id);
        if (!item) return prev;
        return {
          ...prev,
          all: Math.max(0, prev.all - 1),
          [item.type]: Math.max(0, prev[item.type] - 1),
        };
      });
      if (expandedId === id) setExpandedId(null);
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const FILTERS: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "protocol", label: "Protocols", count: counts.protocol },
    { id: "stack", label: "Stacks", count: counts.stack },
    { id: "insight", label: "Insights", count: counts.insight },
    { id: "chat", label: "Chats", count: counts.chat },
  ];

  const EMPTY_MESSAGES: Record<FilterType, { title: string; sub: string }> = {
    all: { title: "Nothing saved yet", sub: "SAVE INSIGHTS, PROTOCOLS, AND STACKS AS YOU GO" },
    protocol: { title: "No protocols saved", sub: "SAVE AN ACTION PLAN FROM A BLOODWORK PANEL" },
    stack: { title: "No stacks saved", sub: "SNAPSHOT YOUR SUPPLEMENT STACK FROM THE SUPPLEMENTS PAGE" },
    insight: { title: "No insights saved", sub: "SAVE NŪRA INSIGHTS AS YOU DISCOVER THEM" },
    chat: { title: "No chats saved", sub: "BOOKMARK USEFUL AI MESSAGES FROM THE CHAT" },
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  const empty = EMPTY_MESSAGES[filter];

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 4px" }}>
            Saved
          </h1>
          <MonoLabel color={colors.textFaint}>YOUR LIBRARY · INSIGHTS &amp; PROTOCOLS</MonoLabel>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 7, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
          {FILTERS.filter((f) => f.id === "all" || f.count > 0 || filter === f.id).map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setExpandedId(null); }}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  background: active ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})` : colors.mintBgSubtle,
                  border: `1px solid ${active ? "transparent" : colors.border}`,
                  borderRadius: 20,
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "1.1px",
                  color: active ? colors.textOnAccent : colors.textDim,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {f.label}{f.count > 0 ? ` · ${f.count}` : ""}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: colors.textFaint, letterSpacing: "1.4px", textAlign: "center", padding: "60px 0" }}>
            LOADING...
          </div>
        ) : items.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "60px 20px 40px" }}>
            <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, fontWeight: 400, color: colors.text, margin: "0 0 10px" }}>
              {empty.title}
            </h2>
            <MonoLabel color={colors.textGhost}>{empty.sub}</MonoLabel>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              const isDeleting = deletingId === item.id;
              const typeLabel = TYPE_LABELS[item.type];

              return (
                <div
                  key={item.id}
                  onClick={() => !isExpanded && setExpandedId(item.id)}
                  style={{
                    position: "relative",
                    padding: "14px 16px",
                    background: isExpanded ? `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})` : colors.mintBgSubtle,
                    border: `1px solid ${isExpanded ? colors.mintBorder : colors.border}`,
                    borderRadius: 12,
                    cursor: isExpanded ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <CornerBrackets size={7} />

                  {/* Top row: type pill + relative time */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{
                      fontFamily: FONTS.mono, fontSize: 8, fontWeight: 700, letterSpacing: "1px",
                      color: colors.mint,
                      background: `${colors.mint}18`,
                      border: `1px solid ${colors.mint}30`,
                      borderRadius: 4, padding: "3px 8px",
                    }}>
                      {typeLabel}
                    </span>
                    <MonoLabel color={colors.textGhost}>{relativeTime(item.created_at)}</MonoLabel>
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 5 }}>
                    {item.title}
                  </div>

                  {/* Description or truncated content */}
                  {!isExpanded && (
                    <div style={{
                      fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textDim, lineHeight: 1.6,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                    }}>
                      {item.description ?? item.content ?? ""}
                    </div>
                  )}

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ marginTop: 4 }}>
                      {item.description && (
                        <div style={{ fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textDim, lineHeight: 1.6, marginBottom: item.content ? 12 : 0 }}>
                          {item.description}
                        </div>
                      )}
                      {item.content && (
                        <div style={{
                          fontFamily: FONTS.mono, fontSize: 11, color: colors.textMuted, lineHeight: 1.7,
                          background: colors.mintBgSubtle, border: `1px solid ${colors.borderFaint}`,
                          borderRadius: 8, padding: "10px 12px", whiteSpace: "pre-wrap", wordBreak: "break-word",
                          maxHeight: 260, overflowY: "auto",
                        }}>
                          {item.content}
                        </div>
                      )}

                      {/* Action row */}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                          style={{
                            flex: 1, padding: "8px 0",
                            background: colors.mintBgSubtle, border: `1px solid ${colors.border}`,
                            borderRadius: 8, fontFamily: FONTS.mono, fontSize: 9.5, fontWeight: 700,
                            letterSpacing: "1px", color: colors.textMuted, cursor: "pointer",
                          }}
                        >
                          CLOSE
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          disabled={isDeleting}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "8px 16px",
                            background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.35)",
                            borderRadius: 8, fontFamily: FONTS.mono, fontSize: 9.5, fontWeight: 700,
                            letterSpacing: "1px", color: "#FF4C5C",
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            opacity: isDeleting ? 0.5 : 1,
                          }}
                        >
                          <Trash2 size={12} />
                          {isDeleting ? "DELETING..." : "DELETE"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
