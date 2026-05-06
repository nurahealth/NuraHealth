"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

type FilterType = "all" | "insights" | "chats";

const SAVED_ITEMS = [
  {
    type: "PROTOCOL" as const,
    age: "2 days ago",
    title: "Anti-Inflammation Stack",
    description: "Omega-3, Curcumin, Boswellia, and Quercetin protocol for systemic inflammation reduction.",
    filter: "insights",
  },
  {
    type: "INSIGHT" as const,
    age: "4 days ago",
    title: "HRV & Sleep Quality Link",
    description: "Magnesium glycinate before bed increases deep sleep by up to 17% and improves HRV recovery.",
    filter: "insights",
  },
  {
    type: "CHAT" as const,
    age: "1 week ago",
    title: "Cortisol Balancing Protocol",
    description: "Full conversation on managing morning cortisol spikes with adaptogens and lifestyle timing.",
    filter: "chats",
  },
  {
    type: "STACK" as const,
    age: "1 week ago",
    title: "Testosterone Optimization",
    description: "Zinc, vitamin D3, ashwagandha, and tongkat ali stack with timing and dosage guidelines.",
    filter: "insights",
  },
  {
    type: "CHAT" as const,
    age: "2 weeks ago",
    title: "Gut Microbiome Repair",
    description: "Comprehensive gut healing conversation covering probiotics, prebiotics, and elimination diet.",
    filter: "chats",
  },
  {
    type: "INSIGHT" as const,
    age: "3 weeks ago",
    title: "Vitamin D & Immune Function",
    description: "Why maintaining 60–80 ng/mL Vitamin D is critical for innate immune response and autoimmune prevention.",
    filter: "insights",
  },
];

export default function SavedPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth");
      else { setUser(user); setAuthLoading(false); }
    });
  }, [router]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const PILL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    PROTOCOL: { bg: `${colors.mint}15`, text: colors.mint, border: `${colors.mint}30` },
    STACK: { bg: `${colors.mintDeep}15`, text: colors.mintDeep, border: `${colors.mintDeep}30` },
    CHAT: { bg: colors.mintBgSubtle, text: colors.textMuted, border: colors.border },
    INSIGHT: { bg: `${colors.warn}15`, text: colors.warn, border: `${colors.warn}30` },
  };

  const filtered = filter === "all" ? SAVED_ITEMS : SAVED_ITEMS.filter((item) => item.filter === filter);

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "insights", label: "Insights" },
    { id: "chats", label: "Chats" },
  ];

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
          <MonoLabel color={colors.textFaint}>YOUR LIBRARY · INSIGHTS & PROTOCOLS</MonoLabel>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  padding: "7px 16px",
                  background: active ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})` : colors.mintBgSubtle,
                  border: `1px solid ${active ? "transparent" : colors.border}`,
                  borderRadius: 20,
                  fontFamily: FONTS.mono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "1.2px",
                  color: active ? colors.textOnAccent : colors.textDim,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((item, i) => {
            const pillStyle = PILL_COLORS[item.type];
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  padding: "16px",
                  background: colors.mintBgSubtle,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span
                    style={{
                      fontFamily: FONTS.mono,
                      fontSize: 8,
                      fontWeight: 700,
                      letterSpacing: "1px",
                      color: pillStyle.text,
                      background: pillStyle.bg,
                      border: `1px solid ${pillStyle.border}`,
                      borderRadius: 4,
                      padding: "3px 7px",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.type}
                  </span>
                  <MonoLabel color={colors.textGhost}>{item.age}</MonoLabel>
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 6 }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 12.5, color: colors.textDim, lineHeight: 1.6 }}>
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
