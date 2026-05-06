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
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

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

export default function Sidebar({ open, onClose, userName, userInitial }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [chatsOpen, setChatsOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { colors } = useTheme();

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
            background: colors.overlay,
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
          background: colors.bgSidebar,
          zIndex: 201,
          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${colors.mintBorder}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <span style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.mint }}>
            NŪRA
          </span>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: colors.mintBgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              cursor: "pointer",
              color: colors.textMuted,
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  marginBottom: 2,
                  background: active ? colors.mintBgMedium : "transparent",
                  border: `1px solid ${active ? colors.mintBorder : "transparent"}`,
                  borderRadius: 10,
                  fontFamily: FONTS.sans,
                  fontSize: 14,
                  color: active ? colors.mint : colors.textMuted,
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: active ? 500 : 400,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      fontWeight: 600,
                      color: colors.mintDeep,
                      background: colors.mintBgMedium,
                      border: `1px solid ${colors.mintBorder}`,
                      borderRadius: 4,
                      padding: "2px 5px",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin nav item */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/knowledge")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                marginBottom: 2,
                background: isActive("/admin") ? colors.mintBgMedium : "transparent",
                border: `1px solid ${isActive("/admin") ? colors.mintBorder : "transparent"}`,
                borderRadius: 10,
                fontFamily: FONTS.sans,
                fontSize: 14,
                color: isActive("/admin") ? colors.mint : colors.textMuted,
                cursor: "pointer",
                textAlign: "left",
                fontWeight: isActive("/admin") ? 500 : 400,
                transition: "all 0.15s",
              }}
            >
              <Shield size={16} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>Admin</span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  fontWeight: 600,
                  color: colors.mintDeep,
                  background: colors.mintBgMedium,
                  border: `1px solid ${colors.mintBorder}`,
                  borderRadius: 4,
                  padding: "2px 5px",
                  letterSpacing: "0.08em",
                }}
              >
                ADMIN
              </span>
            </button>
          )}

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: colors.border,
              margin: "12px 4px",
            }}
          />

          {/* Recent Chats */}
          <button
            onClick={() => setChatsOpen((v) => !v)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: colors.textFaint,
              fontFamily: FONTS.mono,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              textAlign: "left",
            }}
          >
            <MessageSquare size={12} />
            <span style={{ flex: 1 }}>Recent Chats</span>
            {chatsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {chatsOpen && (
            <div style={{ paddingBottom: 8 }}>
              {RECENT_CHATS.map((chat, i) => (
                <button
                  key={i}
                  onClick={() => navigate("/")}
                  style={{
                    width: "100%",
                    display: "block",
                    padding: "8px 14px 8px 38px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONTS.sans,
                    fontSize: 12.5,
                    color: colors.textGhost,
                    textAlign: "left",
                    borderRadius: 8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {chat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 10px", borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={() => navigate("/settings")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: colors.mintBgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONTS.serif,
                fontSize: 15,
                color: colors.textOnAccent,
                flexShrink: 0,
                fontWeight: 700,
              }}
            >
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: 13,
                  color: colors.text,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: colors.textFaint,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 1,
                }}
              >
                Settings
              </div>
            </div>
            <Settings size={14} color={colors.textFaint} />
          </button>
        </div>
      </div>
    </>
  );
}
