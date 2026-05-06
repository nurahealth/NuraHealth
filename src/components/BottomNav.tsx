"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, BarChart2, Zap, FlaskConical, Bookmark } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";

const TABS = [
  { id: "home", label: "HOME", icon: Home, href: "/" },
  { id: "dashboard", label: "DASH", icon: BarChart2, href: "/dashboard" },
  { id: "sync", label: "SYNC", icon: Zap, href: "/integrations" },
  { id: "labs", label: "LABS", icon: FlaskConical, href: "/bloodwork" },
  { id: "saved", label: "SAVED", icon: Bookmark, href: "/saved" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: colors.bgBottomNav,
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${colors.border}`,
        display: "flex",
        padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.href);
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.href)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: active ? colors.mint : colors.textGhost,
              transition: "color 0.15s",
            }}
          >
            <Icon
              size={20}
              style={{
                filter: active ? `drop-shadow(0 0 4px ${colors.mint})` : "none",
              }}
            />
            <span
              style={{
                fontFamily: FONTS.mono,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "1.2px",
                color: active ? colors.mint : colors.textGhost,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
