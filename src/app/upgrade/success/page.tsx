"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { FONTS } from "@/lib/theme";
import { Check, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PRO_BENEFITS = [
  "Unlimited AI conversations with NŪRA",
  "Advanced bloodwork analysis & insights",
  "Full knowledge base access",
  "Save unlimited protocols & stacks",
  "Priority support",
];

type SyncState = "syncing" | "success" | "error" | "no-session";

function SuccessContent() {
  const router = useRouter();
  const { colors } = useTheme();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [syncState, setSyncState] = useState<SyncState>(sessionId ? "syncing" : "no-session");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    async function sync() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (!cancelled) setSyncState("no-session"); return; }

        const res = await fetch("/api/stripe/sync-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, userId: user.id }),
        });
        const data = await res.json() as { success?: boolean; error?: string };

        if (cancelled) return;

        if (res.ok && data.success) {
          setSyncState("success");
        } else {
          setSyncError(data.error ?? "Unknown error");
          setSyncState("error");
        }
      } catch (e) {
        if (!cancelled) {
          setSyncError(e instanceof Error ? e.message : "Network error");
          setSyncState("error");
        }
      }
    }

    void sync();
    return () => { cancelled = true; };
  }, [sessionId]);

  const showWelcome = syncState === "success" || syncState === "no-session";

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONTS.sans, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <style>{`
        @keyframes confetti-bounce { 0%, 100% { transform: translateY(0) scale(1); opacity: 1; } 50% { transform: translateY(-14px) scale(1.2); opacity: 0.8; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes glow-ring { 0%, 100% { box-shadow: 0 0 20px rgba(94,234,212,0.4); } 50% { box-shadow: 0 0 40px rgba(94,234,212,0.7); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Confetti — only on success */}
      {showWelcome && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i % 3 === 0 ? colors.mint : i % 3 === 1 ? colors.mintDeep : `${colors.mint}60`,
                left: `${(i * 8.5) % 100}%`,
                top: `${(i * 13) % 80}%`,
                animation: `confetti-bounce ${1.2 + (i % 4) * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      )}

      <div style={{ maxWidth: 400, width: "100%", position: "relative", zIndex: 1 }}>

        {/* ── Syncing state ── */}
        {syncState === "syncing" && (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid ${colors.mintBorder}`, borderTopColor: colors.mint, animation: "spin 0.9s linear infinite" }} />
            </div>
            <h1 style={{ fontFamily: FONTS.serif, fontSize: 26, fontWeight: 400, color: colors.text, margin: "0 0 8px" }}>
              Just a moment...
            </h1>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: colors.mint }}>
              ACTIVATING YOUR SUBSCRIPTION
            </div>
          </>
        )}

        {/* ── Error state ── */}
        {syncState === "error" && (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: colors.dangerBg, border: `1px solid ${colors.dangerBorder}`, marginBottom: 24 }}>
              <AlertTriangle size={28} color={colors.danger} />
            </div>
            <h1 style={{ fontFamily: FONTS.serif, fontSize: 24, fontWeight: 400, color: colors.text, margin: "0 0 12px" }}>
              Activation issue
            </h1>
            <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textDim, marginBottom: 16, lineHeight: 1.6 }}>
              We couldn&apos;t activate your subscription automatically. Please contact support.
            </div>
            <div style={{ background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, borderRadius: 8, padding: "10px 14px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: colors.textFaint, letterSpacing: "1px", marginBottom: 4 }}>SESSION ID</div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textMuted, wordBreak: "break-all" }}>{sessionId}</div>
              {syncError && (
                <div style={{ fontFamily: FONTS.mono, fontSize: 8, color: colors.danger, letterSpacing: "0.5px", marginTop: 6 }}>{syncError}</div>
              )}
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ width: "100%", padding: "13px", background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, borderRadius: 12, fontFamily: FONTS.mono, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: colors.mint, cursor: "pointer" }}
            >
              GO TO DASHBOARD
            </button>
          </>
        )}

        {/* ── Welcome / success state ── */}
        {showWelcome && (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`, marginBottom: 28, animation: "float 3s ease-in-out infinite, glow-ring 2s ease-in-out infinite" }}>
              <Sparkles size={36} color={colors.textOnAccent} />
            </div>

            <h1 style={{ fontFamily: FONTS.serif, fontSize: 30, fontWeight: 400, color: colors.text, margin: "0 0 8px", lineHeight: 1.2 }}>
              Welcome to NŪRA Pro
            </h1>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: colors.mint, marginBottom: 32 }}>
              YOUR SUBSCRIPTION IS ACTIVE
            </div>

            <div style={{ background: colors.mintBgSubtle, border: `1px solid ${colors.mintBorder}`, borderRadius: 14, padding: "20px", marginBottom: 28, textAlign: "left" }}>
              <div style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", color: colors.textFaint, marginBottom: 14 }}>WHAT YOU GET</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PRO_BENEFITS.map((b) => (
                  <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${colors.mint}20`, border: `1px solid ${colors.mintBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={11} color={colors.mint} strokeWidth={2.5} />
                    </div>
                    <span style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textMuted }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              style={{
                width: "100%",
                padding: "14px",
                background: `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
                border: "none",
                borderRadius: 12,
                fontFamily: FONTS.mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "1.5px",
                color: colors.textOnAccent,
                cursor: "pointer",
                boxShadow: `0 0 20px ${colors.mintGlow}`,
              }}
            >
              GO TO DASHBOARD
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000814", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.4)", fontSize: 12, letterSpacing: "1.5px" }}>LOADING...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
