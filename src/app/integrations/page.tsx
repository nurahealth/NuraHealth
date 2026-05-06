"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Zap, Watch, Activity, Heart, MapPin, Bike, Smartphone } from "lucide-react";
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

const CONNECTED = [
  { name: "Oura Ring", Icon: Activity, description: "Sleep · HRV · Recovery", connected: true },
  { name: "Apple Health", Icon: Heart, description: "Steps · Activity · Vitals", connected: true },
];

const AVAILABLE = [
  { name: "Apple Watch", Icon: Watch, description: "HEART RATE · ECG · WORKOUTS" },
  { name: "Whoop", Icon: Activity, description: "STRAIN · RECOVERY · SLEEP" },
  { name: "Fitbit", Icon: Zap, description: "STEPS · SLEEP · STRESS" },
  { name: "Garmin", Icon: MapPin, description: "GPS · VO2 MAX · TRAINING" },
  { name: "Strava", Icon: Bike, description: "ACTIVITIES · SEGMENTS · POWER" },
  { name: "Google Health", Icon: Smartphone, description: "HEALTH CONNECT · UNIFIED DATA" },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            Integrations
          </h1>
          <MonoLabel color={colors.textFaint}>CONNECT YOUR DEVICES & APPS</MonoLabel>
        </div>

        {/* Connected section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MonoLabel color={colors.mint}>CONNECTED</MonoLabel>
            <div style={{ width: 20, height: 16, background: colors.mintBgMedium, border: `1px solid ${colors.mintBorder}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MonoLabel color={colors.mint}>{CONNECTED.length}</MonoLabel>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {CONNECTED.map((item) => {
              const Icon = item.Icon;
              return (
                <div
                  key={item.name}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "16px",
                    background: `linear-gradient(135deg, ${colors.mintBgSubtle}, ${colors.mintBgSubtle})`,
                    border: `1px solid ${colors.mintBorder}`,
                    borderRadius: 12,
                  }}
                >
                  <CornerBrackets size={8} />
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: colors.mintBgMedium,
                      border: `1px solid ${colors.mintBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={colors.mint} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONTS.sans, fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 3 }}>
                      {item.name}
                    </div>
                    <MonoLabel color={colors.textFaint}>{item.description}</MonoLabel>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.mint, animation: "live-pulse 2s ease-in-out infinite" }} />
                    <MonoLabel color={colors.mint}>LIVE</MonoLabel>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <MonoLabel color={colors.textMuted}>AVAILABLE</MonoLabel>
            <div style={{ width: 20, height: 16, background: colors.mintBgSubtle, border: `1px solid ${colors.border}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MonoLabel color={colors.textFaint}>{AVAILABLE.length}</MonoLabel>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {AVAILABLE.map((item) => {
              const Icon = item.Icon;
              return (
                <div
                  key={item.name}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    background: colors.mintBgSubtle,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: colors.mintBgSubtle,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={colors.textDim} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONTS.sans, fontSize: 13.5, fontWeight: 500, color: colors.textMuted, marginBottom: 3 }}>
                      {item.name}
                    </div>
                    <MonoLabel color={colors.textGhost}>{item.description}</MonoLabel>
                  </div>
                  <button
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: `1px solid ${colors.mintBorder}`,
                      borderRadius: 6,
                      fontFamily: FONTS.mono,
                      fontSize: 9,
                      fontWeight: 700,
                      color: colors.mint,
                      letterSpacing: "1px",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    CONNECT
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
