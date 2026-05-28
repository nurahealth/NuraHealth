"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  BarChart2,
  Pill,
  Zap,
  FlaskConical,
  Bookmark,
  ChevronDown,
  ChevronRight,
  X,
  Settings,
  MessageSquare,
  Shield,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Design tokens (locked NŪRA system) ────────────────────────────────────────
const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SURFACE_ELEV = "var(--nura-surface-elevated)";
const SAGE = "var(--nura-sage)";
const SAGE_ON = "var(--nura-sage-bg-on)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userInitial: string;
}

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard", icon: BarChart2, href: "/dashboard" },
  { id: "supplements", label: "Supplements", icon: Pill, href: "/supplements" },
  { id: "integrations", label: "Integrations", icon: Zap, href: "/integrations" },
  { id: "bloodwork", label: "Bloodwork Panel", icon: FlaskConical, href: "/bloodwork", badge: "NEW" },
  { id: "saved", label: "Saved", icon: Bookmark, href: "/saved" },
];

const RECENT_CHATS = [
  "What supplements reduce inflammation?",
  "Gut healing protocol for beginners",
  "Balancing cortisol naturally",
];

// ── Shared sage outlined pill ─────────────────────────────────────────────────
function SageBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: SANS,
      fontSize: 9,
      fontWeight: 600,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: SAGE,
      background: "transparent",
      border: `0.5px solid rgba(${SAGE_RGB},0.5)`,
      borderRadius: 8,
      padding: "2px 7px",
    }}>
      {children}
    </span>
  );
}

// ── Nav item with hover ───────────────────────────────────────────────────────
function NavItem({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        marginBottom: 2,
        background: active ? `rgba(${SAGE_RGB},0.15)` : hov ? SURFACE : "transparent",
        border: `0.5px solid ${active ? `rgba(${SAGE_RGB},0.5)` : "transparent"}`,
        borderRadius: 10,
        fontFamily: SANS,
        fontSize: 14,
        color: active ? SAGE : TEXT,
        cursor: "pointer",
        textAlign: "left",
        fontWeight: active ? 500 : 400,
        transition: "background 180ms, border-color 180ms, color 180ms",
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <SageBadge>{badge}</SageBadge>}
    </button>
  );
}

// ── Chat row with hover ───────────────────────────────────────────────────────
function ChatRow({ text, onClick }: { text: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        display: "block",
        padding: "8px 14px 8px 38px",
        background: hov ? SURFACE : "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: SANS,
        fontSize: 12.5,
        color: TEXT,
        textAlign: "left",
        borderRadius: 8,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        transition: "background 180ms",
      }}
    >
      {text}
    </button>
  );
}

export default function Sidebar({ open, onClose, userName, userInitial }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [chatsOpen, setChatsOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [hovClose, setHovClose] = useState(false);
  const [hovChats, setHovChats] = useState(false);
  const [hovUpgrade, setHovUpgrade] = useState(false);
  const [hovUser, setHovUser] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.is_admin) setIsAdmin(true);
        });
      fetch(`/api/subscription/status?userId=${user.id}`)
        .then((r) => r.json())
        .then((d: { isPro?: boolean }) => setIsPro(d.isPro ?? false))
        .catch(() => setIsPro(false));
    });
  }, []);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 200,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          left: open ? 0 : -300,
          top: 0,
          bottom: 0,
          width: 280,
          background: BG,
          zIndex: 201,
          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          borderRight: `0.5px solid ${BORDER}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `0.5px solid ${BORDER}`,
          }}
        >
          <span style={{
            fontFamily: SERIF,
            fontSize: 22,
            fontWeight: 500,
            color: SAGE,
            letterSpacing: "0.3px",
          }}>
            nūra
          </span>
          <button
            onClick={onClose}
            onMouseEnter={() => setHovClose(true)}
            onMouseLeave={() => setHovClose(false)}
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: SURFACE,
              border: `0.5px solid ${BORDER}`,
              borderRadius: 8,
              cursor: "pointer",
              color: hovClose ? SAGE : TEXT_SEC,
              padding: 0,
              transition: "color 180ms",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              badge={item.badge}
              onClick={() => navigate(item.href)}
            />
          ))}

          {/* Admin nav item */}
          {isAdmin && (
            <NavItem
              icon={Shield}
              label="Admin"
              active={isActive("/admin")}
              badge="ADMIN"
              onClick={() => navigate("/admin/knowledge")}
            />
          )}

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: BORDER,
              margin: "12px 4px",
            }}
          />

          {/* Recent Chats */}
          <button
            onClick={() => setChatsOpen((v) => !v)}
            onMouseEnter={() => setHovChats(true)}
            onMouseLeave={() => setHovChats(false)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: hovChats ? TEXT : TEXT_SEC,
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textAlign: "left",
              transition: "color 180ms",
            }}
          >
            <MessageSquare size={12} />
            <span style={{ flex: 1 }}>Recent Chats</span>
            {chatsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {chatsOpen && (
            <div style={{ paddingBottom: 8 }}>
              {RECENT_CHATS.map((chat, i) => (
                <ChatRow key={i} text={chat} onClick={() => navigate("/")} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 10px", borderTop: `0.5px solid ${BORDER}` }}>
          {/* Upgrade CTA — shown only for non-Pro users once loaded */}
          {isPro === false && (
            <button
              onClick={() => navigate("/upgrade")}
              onMouseEnter={() => setHovUpgrade(true)}
              onMouseLeave={() => setHovUpgrade(false)}
              style={{
                width: "100%",
                marginBottom: 8,
                padding: "10px 14px",
                background: hovUpgrade ? SURFACE_ELEV : SURFACE,
                border: `0.5px solid ${hovUpgrade ? `rgba(${SAGE_RGB},0.3)` : BORDER}`,
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                textAlign: "left",
                transition: "background 180ms, border-color 180ms",
              }}
            >
              <Sparkles size={14} color="var(--nura-sage)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: SAGE,
                }}>
                  Upgrade to Pro
                </div>
                <div style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  color: TEXT_SEC,
                  marginTop: 2,
                }}>
                  $9.99/mo · Cancel anytime
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => navigate("/settings")}
            onMouseEnter={() => setHovUser(true)}
            onMouseLeave={() => setHovUser(false)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: hovUser ? SURFACE_ELEV : SURFACE,
              border: `0.5px solid ${BORDER}`,
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
              transition: "background 180ms",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: SAGE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SERIF,
                fontSize: 15,
                fontWeight: 500,
                color: SAGE_ON,
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: TEXT,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userName}
                </div>
                {isPro && <SageBadge>PRO</SageBadge>}
              </div>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  fontWeight: 600,
                  color: TEXT_SEC,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                Settings
              </div>
            </div>
            <Settings size={14} color="var(--nura-text-secondary)" />
          </button>
        </div>
      </div>
    </>
  );
}
