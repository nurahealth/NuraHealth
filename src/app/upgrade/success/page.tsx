"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SAGE = "#9bb0a5";
const SAGE_ON = "#0d0d0e";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const PRO_BENEFITS = [
  "Unlimited AI conversations with NŪRA",
  "Advanced bloodwork analysis & insights",
  "Full knowledge base access",
  "Save unlimited protocols & stacks",
  "Priority support",
];

type SyncState = "syncing" | "success" | "trial" | "error" | "no-session";

function SuccessContent() {
  const router = useRouter();
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
        const data = await res.json() as { success?: boolean; status?: string; error?: string };

        if (cancelled) return;

        if (res.ok && data.success) {
          setSyncState(data.status === "trialing" ? "trial" : "success");
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

  const showWelcome = syncState === "success" || syncState === "trial" || syncState === "no-session";
  const isTrial = syncState === "trial";

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        @keyframes bounce-in {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        @keyframes check-draw { to { stroke-dashoffset: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 400, width: "100%", position: "relative", zIndex: 1 }}>

        {/* ── Syncing ── */}
        {syncState === "syncing" && (
          <div style={{ animation: "fade-up 400ms ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: `rgba(${SAGE_RGB},0.1)`, border: `1px solid rgba(${SAGE_RGB},0.2)`, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2.5px solid rgba(${SAGE_RGB},0.2)`, borderTopColor: SAGE, animation: "spin 0.9s linear infinite" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: TEXT, margin: "0 0 8px", letterSpacing: "-0.3px" }}>
              Just a moment...
            </h1>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "2px", color: SAGE }}>
              ACTIVATING YOUR ACCOUNT
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {syncState === "error" && (
          <div style={{ animation: "fade-up 400ms ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.3)", marginBottom: 24 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff4c5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: TEXT, margin: "0 0 10px" }}>Activation issue</h1>
            <p style={{ fontSize: 13, color: TEXT_SEC, margin: "0 0 20px", lineHeight: 1.6 }}>
              We couldn&apos;t activate your subscription automatically. Please contact support.
            </p>
            <div style={{ background: "rgba(235,230,216,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, color: TEXT_TER, letterSpacing: "1px", marginBottom: 4 }}>SESSION ID</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: TEXT_SEC, wordBreak: "break-all" }}>{sessionId}</div>
              {syncError && <div style={{ fontFamily: MONO, fontSize: 8, color: "#ff4c5c", marginTop: 6 }}>{syncError}</div>}
            </div>
            <button onClick={() => router.push("/")} style={ctaStyle(false)}>GO TO DASHBOARD</button>
          </div>
        )}

        {/* ── Welcome / trial / success ── */}
        {showWelcome && (
          <div style={{ animation: "fade-up 400ms ease both" }}>
            {/* Check circle */}
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 72, height: 72, borderRadius: "50%", background: SAGE,
              marginBottom: 28, animation: "bounce-in 550ms cubic-bezier(0.175,0.885,0.32,1.275) both",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke={SAGE_ON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" strokeDasharray="26" strokeDashoffset="26"
                  style={{ animation: "check-draw 400ms ease 400ms both" }} />
              </svg>
            </div>

            {/* Trial pill */}
            {isTrial && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: `rgba(${SAGE_RGB},0.12)`, border: `1px solid rgba(${SAGE_RGB},0.3)`, marginBottom: 14 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: SAGE }} />
                <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: SAGE }}>FREE TRIAL ACTIVE · 3 DAYS</span>
              </div>
            )}

            <h1 style={{ fontSize: 28, fontWeight: 600, color: TEXT, margin: "0 0 8px", letterSpacing: "-0.4px", lineHeight: 1.2 }}>
              {isTrial ? "Your trial has started." : "Welcome to NŪRA Pro."}
            </h1>
            <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 28px", lineHeight: 1.6 }}>
              {isTrial
                ? "Your card won't be charged for 3 days. Cancel any time before then."
                : "Your subscription is active. Everything is unlocked."}
            </p>

            {/* Benefits */}
            <div style={{ background: "rgba(235,230,216,0.03)", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px", marginBottom: 24, textAlign: "left" }}>
              <div style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: "2px", color: TEXT_TER, marginBottom: 14 }}>
                {isTrial ? "WHAT UNLOCKS NOW" : "WHAT YOU GET"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PRO_BENEFITS.map((b) => (
                  <div key={b} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: `rgba(${SAGE_RGB},0.12)`, border: `1px solid rgba(${SAGE_RGB},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 6l3 3 5-5"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, color: TEXT_SEC }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => router.push("/")} style={ctaStyle(false)}>
              ENTER NŪRA
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ctaStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "14px", borderRadius: 12, border: "none",
    background: disabled ? `rgba(${SAGE_RGB},0.5)` : SAGE,
    color: SAGE_ON, fontFamily: MONO, fontSize: 11, fontWeight: 700,
    letterSpacing: "1.5px", cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  };
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, color: TEXT_TER, fontSize: 11, letterSpacing: "1.5px" }}>
        LOADING...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
