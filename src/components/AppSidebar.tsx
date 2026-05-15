"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "@/lib/sidebarStore";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";

// ── Icons (Tabler-inspired) ───────────────────────────────────────────────────
const I = ({ children, size = 17, color = "currentColor" }: { children: React.ReactNode; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icons = {
  x:        () => <I><path d="M18 6L6 18M6 6l12 12"/></I>,
  plus:     () => <I><path d="M12 5v14M5 12h14"/></I>,
  home:     () => <I><path d="M3 12L12 3l9 9M5 10v10h5v-6h4v6h5V10"/></I>,
  activity: () => <I><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M3.5 12h4l2-5 3 9 2-4h6"/></I>,
  droplet:  () => <I><path d="M12 2c0 0-8 11-8 14.5a8 8 0 0 0 16 0C20 13 12 2 12 2z"/></I>,
  pill:     () => <I><path d="M10 4l10 10a4 4 0 0 1-5.66 5.66L4 9.66A4 4 0 0 1 9.66 4z"/><path d="M9 11l4 4"/></I>,
  watch:    () => <I><circle cx="12" cy="12" r="6"/><path d="M9 4l1-2h4l1 2M9 20l1 2h4l1-2"/></I>,
  bookmark: () => <I><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></I>,
  message:  () => <I><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></I>,
  chevron:  () => <I><path d="M6 9l6 6 6-6"/></I>,
  settings: () => <I><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.05a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.05c.282.668.93 1.108 1.65 1.11H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></I>,
  moon:     () => <I><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></I>,
  logout:   () => <I><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></I>,
};

// ── Time formatting ───────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yest";
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatSessionRow { id: string; title: string | null; updated_at: string }
interface ProfileRow { full_name: string | null }
interface SubRow { status: string | null }

interface NavItem {
  key: string; label: string; href: string; icon: () => React.ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { key: "home",        label: "Home",         href: "/",             icon: Icons.home },
  { key: "dashboard",   label: "Dashboard",    href: "/dashboard",    icon: Icons.activity },
  { key: "bloodwork",   label: "Bloodwork",    href: "/bloodwork",    icon: Icons.droplet },
  { key: "supplements", label: "Supplements",  href: "/supplements",  icon: Icons.pill },
  { key: "integrations",label: "Integrations", href: "/integrations", icon: Icons.watch },
  { key: "saved",       label: "Saved",        href: "/saved",        icon: Icons.bookmark },
];

// ── Nav row ───────────────────────────────────────────────────────────────────
function NavRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const isHighlighted = hov || active;
  const iconColor = active || hov ? SAGE : "var(--nura-text-secondary)";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        width: "100%", padding: 10, borderRadius: 9,
        background: active ? `rgba(var(--nura-sage-rgb),0.1)` : hov ? "var(--nura-surface)" : "transparent",
        border: active ? `0.5px solid rgba(var(--nura-sage-rgb),0.28)` : "0.5px solid transparent",
        color: isHighlighted ? TEXT : "rgba(var(--nura-fg-rgb),0.85)",
        fontFamily: SANS, fontSize: 14, fontWeight: active ? 500 : 400,
        cursor: "pointer", textAlign: "left",
        transition: "background 160ms, border-color 160ms, color 160ms",
      }}
    >
      <span style={{ color: iconColor, display: "flex", lineHeight: 0, flexShrink: 0 }}>
        <item.icon />
      </span>
      <span>{item.label}</span>
    </button>
  );
}

function RecentChatRow({ id, title, updated_at, onClick }: { id: string; title: string | null; updated_at: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      key={id}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        width: "100%", padding: "9px 10px", borderRadius: 9,
        background: hov ? "var(--nura-surface)" : "transparent",
        border: "0.5px solid transparent",
        color: TEXT, fontFamily: SANS, fontSize: 12, cursor: "pointer", textAlign: "left",
        transition: "background 160ms",
      }}
    >
      <span style={{ color: hov ? SAGE : "rgba(var(--nura-fg-rgb),0.45)", display: "flex", lineHeight: 0, flexShrink: 0 }}>
        <Icons.message />
      </span>
      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {title || "Untitled chat"}
      </span>
      <span style={{ fontSize: 10, color: TEXT_TER, flexShrink: 0 }}>{relativeTime(updated_at)}</span>
    </button>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isOpen = useSidebar((s) => s.isOpen);
  const close = useSidebar((s) => s.close);
  const [profile, setProfile] = useState<{ name: string; email: string; status: string | null }>({ name: "", email: "", status: null });
  const [chats, setChats] = useState<ChatSessionRow[]>([]);
  const [chatsExpanded, setChatsExpanded] = useState(true);

  // Load profile + recent chats whenever sidebar opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const email = user.email ?? "";
      const meta = (user.user_metadata ?? {}) as { name?: string; full_name?: string };
      const baseName = meta.name ?? meta.full_name ?? "";

      const [{ data: prof }, { data: sub }, { data: sessions }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
        supabase.from("chat_sessions").select("id, title, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(5),
      ]);

      if (cancelled) return;
      const profRow = prof as ProfileRow | null;
      const subRow = sub as SubRow | null;
      setProfile({
        name: profRow?.full_name || baseName || email.split("@")[0] || "Friend",
        email,
        status: subRow?.status ?? null,
      });
      setChats((sessions as ChatSessionRow[] | null) ?? []);
    })();

    return () => { cancelled = true; };
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const navigate = useCallback((href: string) => {
    close();
    router.push(href);
  }, [close, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    close();
    router.push("/auth");
  };

  const initial = (profile.name || profile.email || "?").trim().charAt(0).toUpperCase();
  const subBadge = profile.status === "trialing" ? "PRO · TRIAL" : profile.status === "active" ? "PRO" : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, zIndex: 40,
          background: "rgba(0,0,0,0.55)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 250ms ease",
        }}
      />

      {/* Panel */}
      <aside
        aria-hidden={!isOpen}
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          width: "min(295px, 85vw)",
          background: BG, borderRight: `0.5px solid rgba(var(--nura-bg-tint-rgb),0.08)`,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 350ms cubic-bezier(0.32,0.72,0.34,1.01)",
          overflowY: "auto", overflowX: "hidden",
          display: "flex", flexDirection: "column",
          fontFamily: SANS,
        }}
      >
        <style>{`
          aside::-webkit-scrollbar { width: 0; }
          @keyframes sidebar-fade-in { from { opacity: 0; } to { opacity: 1; } }
        `}</style>

        {/* TOP: close + profile + new chat */}
        <div style={{ padding: "max(env(safe-area-inset-top), 22px) 22px 0" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button
              onClick={close}
              aria-label="Close menu"
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: SURFACE, border: `0.5px solid ${BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: TEXT_SEC, cursor: "pointer",
              }}
            >
              <Icons.x />
            </button>
          </div>

          {/* Profile row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
              background: `rgba(var(--nura-sage-rgb),0.18)`,
              border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
              color: SAGE, fontSize: 16, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {profile.name || "—"}
                </span>
                {subBadge && (
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.6px",
                    color: SAGE, background: `rgba(var(--nura-sage-rgb),0.16)`, border: `0.5px solid rgba(var(--nura-sage-rgb),0.3)`,
                    padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0,
                  }}>{subBadge}</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: TEXT_SEC, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile.email}
              </div>
            </div>
          </div>

          {/* New chat */}
          <button
            onClick={() => navigate("/")}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 14px", borderRadius: 11,
              background: `rgba(var(--nura-sage-rgb),0.12)`,
              border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
              color: SAGE, fontFamily: SANS, fontSize: 13, fontWeight: 500,
              cursor: "pointer", marginBottom: 18,
            }}
          >
            <Icons.plus />
            New chat
          </button>
        </div>

        {/* MAIN NAV */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 14px" }}>
          {NAV_ITEMS.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
              onClick={() => navigate(item.href)}
            />
          ))}
        </nav>

        {/* DIVIDER */}
        <div style={{ height: 0.5, background: "rgba(var(--nura-bg-tint-rgb),0.08)", margin: "14px 22px" }} />

        {/* RECENT CHATS */}
        <div style={{ padding: "0 14px" }}>
          <button
            onClick={() => setChatsExpanded((v) => !v)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "4px 10px 8px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: SANS,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.2px", color: SAGE, textTransform: "uppercase" }}>
              Recent chats
            </span>
            <span style={{
              color: TEXT_SEC, display: "flex", lineHeight: 0,
              transform: chatsExpanded ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 220ms cubic-bezier(0.4,0,0.2,1)",
            }}>
              <Icons.chevron />
            </span>
          </button>

          {chatsExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, animation: "sidebar-fade-in 200ms ease both" }}>
              {chats.length > 0 ? (
                <>
                  {chats.map((c) => (
                    <RecentChatRow
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      updated_at={c.updated_at}
                      onClick={() => navigate(`/chat/${c.id}`)}
                    />
                  ))}
                  <button
                    onClick={() => navigate("/chats")}
                    style={{
                      marginTop: 4, padding: "8px 10px", background: "none", border: "none",
                      color: SAGE, fontFamily: SANS, fontSize: 11, fontWeight: 500,
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    View all chats →
                  </button>
                </>
              ) : (
                <div style={{ padding: "8px 10px", fontSize: 12, color: TEXT_TER }}>
                  No chats yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM */}
        <div style={{
          marginTop: "auto",
          padding: "14px 22px 22px",
          borderTop: "0.5px solid rgba(var(--nura-bg-tint-rgb),0.06)",
          display: "flex", flexDirection: "column", gap: 1,
        }}>
          <BottomRow icon={<Icons.settings />} label="Settings" onClick={() => navigate("/settings")} />

          <BottomRow icon={<Icons.logout />} label="Sign out" muted onClick={handleSignOut} />
        </div>
      </aside>
    </>
  );
}

function BottomRow({ icon, label, onClick, muted, right }: {
  icon: React.ReactNode; label: string; onClick: () => void; muted?: boolean; right?: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 11,
        width: "100%", padding: "8px 4px", borderRadius: 8,
        background: hov ? "var(--nura-surface)" : "transparent",
        border: "none", color: muted ? TEXT_SEC : TEXT,
        fontFamily: SANS, fontSize: 13, cursor: "pointer", textAlign: "left",
        transition: "background 160ms",
      }}
    >
      <span style={{ color: hov ? SAGE : muted ? TEXT_TER : TEXT_SEC, display: "flex", lineHeight: 0, flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {right}
    </button>
  );
}
