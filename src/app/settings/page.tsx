"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const C = {
  bg: "#FAF8F4",
  bgContent: "#FFFFFF",
  text: "#1B3022",
  textMuted: "#5A6B5E",
  textLight: "#8A9488",
  border: "rgba(0,0,0,0.08)",
  terracotta: "#C17A56",
  logoBg: "#1B3022",
  logoText: "#F5F1E9",
  cardBorder: "rgba(0,0,0,0.06)",
  danger: "#C95444",
};

const serif = "'DM Serif Display', Georgia, serif";
const sans = "'Outfit', system-ui, sans-serif";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth");
      } else {
        setUser(user);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, color: C.textMuted, fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Friend";
  const userEmail = user?.email || "";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px", padding: "0 4px" }}>
        {title}
      </h3>
      <div style={{ background: C.bgContent, border: `1px solid ${C.cardBorder}`, borderRadius: 14, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, last = false }: { label: string; value: string; last?: boolean }) => (
    <div style={{ padding: "14px 18px", borderBottom: last ? "none" : `1px solid ${C.cardBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontFamily: sans, fontSize: 13.5, color: C.textMuted }}>{label}</span>
      <span style={{ fontFamily: sans, fontSize: 13.5, color: C.text, fontWeight: 500 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "rgba(250,248,244,0.85)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: C.text, fontFamily: sans, fontSize: 14, cursor: "pointer", padding: "4px 8px" }}>
          ← Back
        </button>
        <span style={{ fontFamily: serif, fontSize: 18, color: C.text }}>Settings</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "32px 20px 60px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.terracotta, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 32, marginBottom: 14 }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 22, color: C.text, margin: "0 0 4px", fontWeight: 400 }}>{userName}</h2>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, margin: 0 }}>{userEmail}</p>
        </div>

        <Section title="Account">
          <Row label="Name" value={userName} />
          <Row label="Email" value={userEmail} />
          <Row label="Plan" value="Free" last />
        </Section>

        <Section title="Subscription">
          <div style={{ padding: "18px" }}>
            <div style={{ fontFamily: serif, fontSize: 18, color: C.text, marginBottom: 6 }}>Upgrade to Nura Pro</div>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
              Unlimited AI conversations · Save unlimited protocols · Priority access to new features · $19.99/month
            </div>
            <button style={{ padding: "10px 20px", background: C.logoBg, color: C.logoText, border: "none", borderRadius: 10, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Upgrade
            </button>
          </div>
        </Section>

        <Section title="Preferences">
          <Row label="Theme" value="Auto" />
          <Row label="Notifications" value="Enabled" last />
        </Section>

        <Section title="Support">
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.cardBorder}`, fontFamily: sans, fontSize: 13.5, color: C.text, cursor: "pointer" }}>
            Help Center
          </div>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.cardBorder}`, fontFamily: sans, fontSize: 13.5, color: C.text, cursor: "pointer" }}>
            Contact Support
          </div>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.cardBorder}`, fontFamily: sans, fontSize: 13.5, color: C.text, cursor: "pointer" }}>
            Privacy Policy
          </div>
          <div style={{ padding: "14px 18px", fontFamily: sans, fontSize: 13.5, color: C.text, cursor: "pointer" }}>
            Terms of Service
          </div>
        </Section>

        <button onClick={handleLogout} style={{ width: "100%", padding: "14px", background: "transparent", color: C.danger, border: `1px solid ${C.danger}`, borderRadius: 12, fontFamily: sans, fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 8 }}>
          Sign Out
        </button>

        <p style={{ marginTop: 32, textAlign: "center", fontFamily: sans, fontSize: 11, color: C.textLight }}>
          Nura provides wellness information, not medical advice.
        </p>
      </div>
    </div>
  );
}