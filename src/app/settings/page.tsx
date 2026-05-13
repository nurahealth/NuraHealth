"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { ChevronLeft } from "lucide-react";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import UpgradeButton from "@/components/UpgradeButton";

interface SubStatus {
  isPro: boolean;
  status: string | null;
  plan: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

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
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      setUser(user);
      setLoading(false);
      fetch(`/api/subscription/status?userId=${user.id}`)
        .then((r) => r.json())
        .then((d: SubStatus) => setSubStatus(d))
        .catch(() => {});
    });
  }, [router]);

  const handlePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      // silent
    } finally {
      setPortalLoading(false);
    }
  };

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
            {subStatus?.isPro ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.text }}>NŪRA Pro</div>
                  <span style={{ fontFamily: FONTS.mono, fontSize: 8, fontWeight: 700, letterSpacing: "0.8px", color: colors.textOnAccent, background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, borderRadius: 4, padding: "2px 7px" }}>
                    ACTIVE
                  </span>
                </div>
                {subStatus.current_period_end && (
                  <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textDim, marginBottom: subStatus.cancel_at_period_end ? 4 : 16, lineHeight: 1.6 }}>
                    Renews on {new Date(subStatus.current_period_end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </div>
                )}
                {subStatus.cancel_at_period_end && (
                  <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.warn, marginBottom: 16, lineHeight: 1.6 }}>
                    Cancels at end of billing period
                  </div>
                )}
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    border: `1px solid ${colors.mintBorder}`,
                    borderRadius: 10,
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: colors.mint,
                    letterSpacing: "1px",
                    cursor: portalLoading ? "not-allowed" : "pointer",
                    textTransform: "uppercase",
                    opacity: portalLoading ? 0.6 : 1,
                  }}
                >
                  {portalLoading ? "LOADING..." : "MANAGE SUBSCRIPTION"}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontFamily: FONTS.serif, fontSize: 18, color: colors.text, marginBottom: 6 }}>
                  Upgrade to NŪRA Pro
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textDim, marginBottom: 16, lineHeight: 1.6 }}>
                  Unlimited AI conversations · Advanced analysis · Full knowledge base · $9.99/month
                </div>
                <UpgradeButton variant="compact" />
              </>
            )}
          </div>
        </Section>

        <Section title="ACCOUNT">
          <Row label="Name" value={userName} />
          <Row label="Email" value={userEmail} />
          <Row label="Plan" value={subStatus?.isPro ? "Pro" : "Free"} last />
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
