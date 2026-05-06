"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";

function CornerBrackets({ size = 10, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  const s = `${size}px`;
  const t = "2px";
  return (
    <>
      <div style={{ position: "absolute", top: 6, left: 6, width: s, height: s, borderTop: `${t} solid ${c}`, borderLeft: `${t} solid ${c}` }} />
      <div style={{ position: "absolute", bottom: 6, right: 6, width: s, height: s, borderBottom: `${t} solid ${c}`, borderRight: `${t} solid ${c}` }} />
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

const RECENT_PANELS = [
  { name: "Comprehensive Metabolic", date: "Apr 12, 2026", inRange: 14, watch: 2, total: 16 },
  { name: "Hormone Panel", date: "Mar 28, 2026", inRange: 8, low: 1, total: 9 },
];

export default function BloodworkPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

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

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        @keyframes live-pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.4); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} userInitial={userInitial} />

      <div style={{ padding: "20px 20px 100px", maxWidth: 480, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 4px" }}>
            Bloodwork Panel
          </h1>
          <MonoLabel color={colors.textFaint}>UPLOAD LABS · NŪRA READS THEM</MonoLabel>
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); }}
          style={{
            position: "relative",
            border: `2px dashed ${dragging ? colors.mint : colors.mintBorder}`,
            borderRadius: 16,
            padding: "36px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            background: dragging ? colors.mintBgMedium : colors.mintBgSubtle,
            transition: "all 0.2s",
            marginBottom: 24,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: colors.mintBgMedium,
              border: `1px solid ${colors.mintBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Upload size={24} color={colors.mint} />
          </div>
          <div style={{ fontFamily: FONTS.sans, fontSize: 15, fontWeight: 500, color: colors.textMuted, textAlign: "center" }}>
            Upload bloodwork
          </div>
          <MonoLabel color={colors.textGhost}>PDF · JPG · PNG</MonoLabel>
          <label
            htmlFor="file-upload"
            style={{
              marginTop: 4,
              padding: "9px 20px",
              background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              border: "none",
              borderRadius: 8,
              fontFamily: FONTS.mono,
              fontSize: 10,
              fontWeight: 700,
              color: colors.textOnAccent,
              letterSpacing: "1px",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Choose File
          </label>
          <input id="file-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} />
        </div>

        {/* Recent Panels */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <MonoLabel color={colors.textMuted}>RECENT PANELS</MonoLabel>
            <div style={{ width: 16, height: 14, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MonoLabel color={colors.textFaint}>{RECENT_PANELS.length}</MonoLabel>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RECENT_PANELS.map((panel, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  padding: "16px",
                  background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 12,
                }}
              >
                <CornerBrackets size={8} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: colors.mintBgMedium,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={18} color={colors.mint} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                      {panel.name}
                    </div>
                    <MonoLabel color={colors.textGhost}>{panel.date}</MonoLabel>
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <CheckCircle size={12} color={colors.mint} />
                        <MonoLabel color={colors.mint}>{panel.inRange} IN RANGE</MonoLabel>
                      </div>
                      {panel.watch !== undefined && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <AlertTriangle size={11} color={colors.warn} />
                          <MonoLabel color={colors.warn}>{panel.watch} WATCH</MonoLabel>
                        </div>
                      )}
                      {panel.low !== undefined && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <AlertTriangle size={11} color={colors.danger} />
                          <MonoLabel color={colors.danger}>{panel.low} LOW</MonoLabel>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NŪRA Latest Read */}
        <div
          style={{
            position: "relative",
            marginTop: 20,
            padding: "16px",
            background: `linear-gradient(135deg, ${colors.mintBgMedium}, ${colors.mintBgSubtle})`,
            border: `1px solid ${colors.mintBorder}`,
            borderRadius: 12,
          }}
        >
          <CornerBrackets />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite", flexShrink: 0 }} />
            <MonoLabel color={colors.mint}>NŪRA LATEST READ</MonoLabel>
          </div>
          <p style={{ fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textMuted, margin: 0, lineHeight: 1.7 }}>
            Your <strong style={{ color: colors.warn }}>Vitamin D (22 ng/mL)</strong> is below the optimal range of 40–80. At this level, immune function, mood regulation, and calcium absorption may be compromised. Consider 5,000–10,000 IU D3 with K2.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
