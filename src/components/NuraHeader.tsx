"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "@/lib/sidebarStore";

const TEXT = "var(--nura-text-primary)";
const BORDER = "var(--nura-border)";
const SURFACE = "var(--nura-surface)";
const SAGE = "var(--nura-sage)";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

interface Props {
  rightAction?: React.ReactNode;
  title?: string;
}

function DefaultProfile() {
  const router = useRouter();
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata as { name?: string; full_name?: string } | undefined;
      const fromMeta = meta?.name ?? meta?.full_name ?? "";
      if (fromMeta) setInitial(fromMeta.trim().charAt(0).toUpperCase());
      else setInitial((user.email ?? "?").trim().charAt(0).toUpperCase());
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
        .then(({ data }) => {
          const fn = (data?.full_name as string | null | undefined) ?? "";
          if (fn) setInitial(fn.trim().charAt(0).toUpperCase());
        });
    });
  }, []);

  return (
    <button
      onClick={() => router.push("/settings")}
      aria-label="Profile"
      style={{
        width: 40, height: 40, borderRadius: "50%",
        background: `rgba(var(--nura-sage-rgb),0.18)`,
        border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
        color: SAGE, fontFamily: SANS, fontSize: 14, fontWeight: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {initial}
    </button>
  );
}

export default function NuraHeader({ rightAction, title }: Props) {
  const openSidebar = useSidebar((s) => s.open);

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

      <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: SAGE, letterSpacing: "0.3px" }}>
        {title ?? "nūra"}
      </span>

      {rightAction !== undefined ? rightAction : <DefaultProfile />}
    </header>
  );
}
