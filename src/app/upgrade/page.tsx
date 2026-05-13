"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import { Check, Sparkles, ArrowRight } from "lucide-react";

const FEATURES = [
  "Unlimited AI conversations with NŪRA",
  "Advanced bloodwork analysis & insights",
  "Full knowledge base access",
  "Save unlimited protocols & stacks",
  "Priority support",
];

function CornerBrackets({ color }: { color?: string }) {
  const { colors } = useTheme();
  const c = color ?? colors.mint;
  return (
    <>
      <div style={{ position: "absolute", top: 8, left: 8, width: 10, height: 10, borderTop: `1.5px solid ${c}`, borderLeft: `1.5px solid ${c}` }} />
      <div style={{ position: "absolute", bottom: 8, right: 8, width: 10, height: 10, borderBottom: `1.5px solid ${c}`, borderRight: `1.5px solid ${c}` }} />
    </>
  );
}

export default function UpgradePage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Portal failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPortalLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px 80px" }}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.mint}30, ${colors.mintDeep}20)`, border: `1px solid ${colors.mintBorder}`, marginBottom: 24, animation: "float 3s ease-in-out infinite" }}>
            <Sparkles size={28} color={colors.mint} />
          </div>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 34, fontWeight: 400, color: colors.text, margin: "0 0 10px", lineHeight: 1.15 }}>
            Unlock NŪRA Pro
          </h1>
          <div style={{ fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, letterSpacing: "2px", color: colors.mint }}>
            $9.99/MO · CANCEL ANYTIME
          </div>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ position: "relative", background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, borderRadius: 12, padding: "14px 16px 14px 44px" }}>
              <CornerBrackets />
              <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: `${colors.mint}20`, border: `1px solid ${colors.mintBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={12} color={colors.mint} strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: FONTS.sans, fontSize: 14, color: colors.textMuted }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", background: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, borderRadius: 8, marginBottom: 16, fontFamily: FONTS.mono, fontSize: 10, color: colors.danger, letterSpacing: "0.5px" }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            background: loading ? colors.mintBgMedium : `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
            border: "none",
            borderRadius: 14,
            fontFamily: FONTS.mono,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "1.5px",
            color: loading ? colors.textFaint : colors.textOnAccent,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: loading ? "none" : `0 0 24px ${colors.mintGlow}`,
            transition: "all 0.2s",
            marginBottom: 16,
          }}
        >
          {loading ? "REDIRECTING..." : "UPGRADE TO PRO"}
          {!loading && <ArrowRight size={16} />}
        </button>

        {/* Portal link */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            style={{ background: "none", border: "none", cursor: portalLoading ? "not-allowed" : "pointer", fontFamily: FONTS.mono, fontSize: 9, fontWeight: 600, letterSpacing: "1.2px", color: colors.textFaint, textTransform: "uppercase" }}
          >
            {portalLoading ? "LOADING..." : "Already Pro? Manage subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}
