"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";

function MonoLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  const { colors } = useTheme();
  return (
    <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: color ?? colors.textFaint }}>
      {children}
    </span>
  );
}

function Toggle({ on }: { on: boolean }) {
  const { colors } = useTheme();
  return (
    <div
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: on ? `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})` : colors.mintBgSubtle,
        border: `1px solid ${on ? colors.mintBorder : colors.border}`,
        position: "relative",
        flexShrink: 0,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: on ? colors.textOnAccent : colors.textGhost,
          transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 10, padding: "0 2px" }}>
        <MonoLabel color={colors.textFaint}>{title}</MonoLabel>
      </div>
      <div
        style={{
          background: colors.mintBgSubtle,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  last = false,
  toggle,
}: {
  label: string;
  value?: string;
  last?: boolean;
  toggle?: boolean;
}) {
  const { colors } = useTheme();
  const [on, setOn] = useState(toggle !== undefined ? true : false);
  return (
    <div
      style={{
        padding: "14px 18px",
        borderBottom: last ? "none" : `1px solid ${colors.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: toggle !== undefined ? "pointer" : "default",
      }}
      onClick={toggle !== undefined ? () => setOn((v) => !v) : undefined}
    >
      <span style={{ fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textMuted }}>{label}</span>
      {toggle !== undefined ? (
        <Toggle on={on} />
      ) : (
        <span style={{ fontFamily: FONTS.sans, fontSize: 13.5, color: colors.textDim, fontWeight: 500 }}>{value}</span>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push("/auth");
      else { setUser(user); setLoading(false); }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.mono, color: colors.textFaint, fontSize: 12, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const userEmail = user?.email || "";

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      {/* Topbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 56,
          background: colors.bgTopbar,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            color: colors.mint,
            fontFamily: FONTS.sans,
            fontSize: 14,
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <span style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.text }}>Settings</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 80px" }}>
        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONTS.serif,
              fontSize: 34,
              color: colors.textOnAccent,
              fontWeight: 700,
              marginBottom: 14,
              boxShadow: `0 0 24px ${colors.mintGlow}`,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.text, margin: "0 0 4px", fontWeight: 400 }}>
            {userName}
          </h2>
          <p style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textDim, margin: 0 }}>{userEmail}</p>
        </div>

        <Section title="PREFERENCES">
          <Row label="Dark Mode" toggle />
          <Row label="Private Mode (Ollama)" toggle />
          <Row label="Notifications" toggle last />
        </Section>

        <Section title="SUBSCRIPTION">
          <div style={{ padding: "18px" }}>
            <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.text, marginBottom: 6 }}>
              Upgrade to NŪRA Pro
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textDim, marginBottom: 16, lineHeight: 1.6 }}>
              Unlimited AI conversations · Saved protocols · Priority features · $19.99/month
            </div>
            <button
              style={{
                padding: "10px 24px",
                background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                border: "none",
                borderRadius: 10,
                fontFamily: FONTS.mono,
                fontSize: 10,
                fontWeight: 700,
                color: colors.textOnAccent,
                letterSpacing: "1px",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              UPGRADE TO PRO
            </button>
          </div>
        </Section>

        <Section title="ACCOUNT">
          <Row label="Name" value={userName} />
          <Row label="Email" value={userEmail} />
          <Row label="Plan" value="Free" last />
        </Section>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            color: colors.danger,
            border: `1px solid ${colors.danger}`,
            borderRadius: 12,
            fontFamily: FONTS.mono,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1.5px",
            cursor: "pointer",
            textTransform: "uppercase",
            marginTop: 8,
          }}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
