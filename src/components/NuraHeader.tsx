"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { useSidebar } from "@/lib/sidebarStore";
import { useIsDesktop } from "@/lib/useMediaQuery";
import Avatar from "@/components/Avatar";

const TEXT = "var(--nura-text-primary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "var(--nura-sage-rgb)";
const SANS = "var(--font-inter), system-ui, sans-serif";

interface Props {
  rightAction?: React.ReactNode;
  title?: string;
}

function DefaultProfile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, []);

  return (
    <button
      onClick={() => router.push("/settings")}
      aria-label="Profile"
      style={{
        width: 40, height: 40, borderRadius: "50%",
        padding: 0, border: "none", background: "transparent",
        cursor: "pointer", overflow: "hidden",
      }}
    >
      <Avatar user={user} size={40} />
    </button>
  );
}

export default function NuraHeader({ rightAction, title }: Props) {
  const openSidebar = useSidebar((s) => s.open);
  const isDesktop = useIsDesktop();

  return (
    <header style={{
      flexShrink: 0, position: "relative", zIndex: 3,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "max(env(safe-area-inset-top), 8px) 22px 18px",
      borderBottom: `0.5px solid rgba(var(--nura-bg-tint-rgb),0.06)`,
    }}>
      <button
        onClick={openSidebar}
        aria-label="Menu"
        style={{
          // The rail is always on screen at lg, so the trigger is redundant.
          // Kept in the layout (visibility, not display) so the header's
          // space-between rhythm is identical at every width.
          visibility: isDesktop ? "hidden" : "visible",
          width: 38, height: 38, borderRadius: 11,
          background: SURFACE, border: `0.5px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: TEXT,
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <span style={{
        fontFamily: SANS,
        fontSize: 18,
        fontWeight: 600,
        color: SAGE,
        letterSpacing: title ? "-0.02em" : "0.16em",
      }}>
        {title ?? "NŪRA"}
      </span>

      {rightAction !== undefined ? rightAction : <DefaultProfile />}
    </header>
  );
}
