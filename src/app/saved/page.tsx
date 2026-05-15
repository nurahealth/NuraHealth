"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  getUserSavedItems,
  getSavedItemCounts,
  deleteSavedItem,
  type SavedItem,
  type SavedItemType,
  type SavedItemCounts,
} from "@/lib/saved";
import NuraPageShell from "@/components/NuraPageShell";

// ── Tokens ────────────────────────────────────────────────────────────────────
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-bg)";
const SAGE_RGB = "155,176,165";
const RED = "var(--nura-danger)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

type Filter = "all" | SavedItemType;

const TYPE_LABEL: Record<SavedItemType, string> = {
  protocol: "Protocol", stack: "Stack", insight: "Insight", chat: "Chat",
};

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return "1w ago";
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SavedPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [counts, setCounts] = useState<SavedItemCounts>({ all: 0, protocol: 0, stack: 0, insight: 0, chat: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
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
    } catch {} finally {
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
      const removed = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (removed) {
        setCounts((prev) => ({
          ...prev,
          all: Math.max(0, prev.all - 1),
          [removed.type]: Math.max(0, prev[removed.type] - 1),
        }));
      }
      if (expandedId === id) setExpandedId(null);
    } catch {} finally { setDeletingId(null); }
  };

  if (authLoading) return <NuraPageShell><div /></NuraPageShell>;

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "protocol", label: "Protocols", count: counts.protocol },
    { id: "stack", label: "Stacks", count: counts.stack },
    { id: "insight", label: "Insights", count: counts.insight },
    { id: "chat", label: "Chats", count: counts.chat },
  ];

  const EMPTY_MSG: Record<Filter, { title: string; sub: string }> = {
    all: { title: "Nothing saved yet", sub: "Save insights, protocols, and stacks as you go." },
    protocol: { title: "No protocols saved", sub: "Save an action plan from a bloodwork panel." },
    stack: { title: "No stacks saved", sub: "Snapshot your supplement stack from the supplements page." },
    insight: { title: "No insights saved", sub: "Save NŪRA insights as you discover them." },
    chat: { title: "No chats saved", sub: "Bookmark useful AI messages from chat." },
  };

  const empty = EMPTY_MSG[filter];

  return (
    <NuraPageShell maxWidth={680}>
      {/* HERO */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Saved
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>Your library.</p>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginBottom: 22, paddingBottom: 2 }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setExpandedId(null); }}
              style={{
                flexShrink: 0, padding: "8px 14px", borderRadius: 8,
                background: active ? SAGE : SURFACE,
                border: `0.5px solid ${active ? SAGE : BORDER}`,
                color: active ? SAGE_ON : TEXT,
                fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                transition: "all 160ms ease", whiteSpace: "nowrap",
              }}
            >
              {f.label} · {f.count}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: TEXT_TER, fontSize: 13 }}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center", borderRadius: 14,
          background: SURFACE, border: `0.5px dashed ${BORDER}`,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: "0 auto 18px",
            background: `rgba(var(--nura-sage-rgb),0.1)`, border: `0.5px solid rgba(var(--nura-sage-rgb),0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center", color: SAGE,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, margin: "0 0 6px" }}>{empty.title}</h2>
          <p style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC, margin: 0 }}>{empty.sub}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => !isExpanded && setExpandedId(item.id)}
                style={{
                  position: "relative", padding: "14px 16px", borderRadius: 14,
                  background: SURFACE, border: `0.5px solid ${isExpanded ? `rgba(var(--nura-sage-rgb),0.3)` : BORDER}`,
                  cursor: isExpanded ? "default" : "pointer",
                  transition: "border-color 160ms",
                }}
              >
                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 4,
                    background: `rgba(var(--nura-sage-rgb),0.14)`,
                    fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.8px",
                    color: SAGE, textTransform: "uppercase",
                  }}>
                    {TYPE_LABEL[item.type].toUpperCase()}
                  </span>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: TEXT_TER }}>{relativeTime(item.created_at)}</span>
                </div>

                {/* Title */}
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT, marginBottom: 5 }}>
                  {item.title}
                </div>

                {/* Description (truncated) */}
                {!isExpanded && (
                  <div style={{
                    fontFamily: SANS, fontSize: 12, color: TEXT_SEC, lineHeight: 1.55,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>
                    {item.description ?? item.content ?? ""}
                  </div>
                )}

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ marginTop: 4 }}>
                    {item.description && (
                      <div style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, lineHeight: 1.6, marginBottom: item.content ? 12 : 0 }}>
                        {item.description}
                      </div>
                    )}
                    {item.content && (
                      <div style={{
                        fontFamily: SANS, fontSize: 12.5, color: TEXT, lineHeight: 1.65,
                        background: "rgba(var(--nura-bg-tint-rgb),0.02)", border: `0.5px solid ${BORDER}`,
                        borderRadius: 10, padding: "12px 14px",
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                        maxHeight: 280, overflowY: "auto",
                      }}>
                        {item.content}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                        style={{
                          flex: 1, padding: "9px 0", borderRadius: 9,
                          background: "transparent", border: `0.5px solid ${BORDER}`,
                          color: TEXT_SEC, fontFamily: SANS, fontSize: 12, fontWeight: 500, cursor: "pointer",
                        }}
                      >
                        Close
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        disabled={isDeleting}
                        style={{
                          padding: "9px 16px", borderRadius: 9,
                          background: "rgba(212,87,77,0.1)", border: `1px solid rgba(212,87,77,0.35)`,
                          color: RED, fontFamily: SANS, fontSize: 12, fontWeight: 500,
                          cursor: isDeleting ? "not-allowed" : "pointer", opacity: isDeleting ? 0.5 : 1,
                          display: "flex", alignItems: "center", gap: 5,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                        {isDeleting ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </NuraPageShell>
  );
}
