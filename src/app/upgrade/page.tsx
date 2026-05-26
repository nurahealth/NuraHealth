"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const TEXT_SEC = "var(--nura-text-secondary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const BORDER = "var(--nura-border)";
const SAGE = "var(--nura-sage)";
const SAGE_HOV = "var(--nura-sage-hover)";
const SAGE_ON = "var(--nura-bg)";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const FEATURES = [
  { icon: "✦", text: "Unlimited AI conversations with NŪRA" },
  { icon: "✦", text: "Advanced bloodwork analysis & insights" },
  { icon: "✦", text: "Full knowledge base access" },
  { icon: "✦", text: "Save unlimited protocols & stacks" },
  { icon: "✦", text: "Priority support" },
];

export default function UpgradePage() {
  const router = useRouter();
  const [trialLoading, setTrialLoading] = useState(false);
  const [nowLoading, setNowLoading] = useState(false);
  const [hovCta, setHovCta] = useState(false);
  const [hovSecondary, setHovSecondary] = useState(false);
  const [proCheck, setProCheck] = useState<"checking" | "free" | "redirecting">("checking");

  const anyLoading = trialLoading || nowLoading;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { setProCheck("free"); return; }
      try {
        const res = await fetch(`/api/subscription/status?userId=${user.id}`);
        const data = await res.json() as { status?: string | null };
        if (cancelled) return;
        if (data.status === "active" || data.status === "trialing") {
          setProCheck("redirecting");
          router.replace("/settings");
          return;
        }
      } catch {
        // fall through — show upgrade UI on error
      }
      if (!cancelled) setProCheck("free");
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (proCheck !== "free") {
    return <div style={{ minHeight: "100dvh", background: BG }} />;
  }

  const handleStartTrial = () => {
    if (anyLoading) return;
    setTrialLoading(true);
    router.push("/upgrade/checkout");
  };

  const handleSubscribeNow = () => {
    if (anyLoading) return;
    setNowLoading(true);
    router.push("/upgrade/checkout?skipTrial=1");
  };

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px 80px" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(var(--nura-sage-rgb),0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(var(--nura-sage-rgb),0); }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo wordmark */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: BG, border: `0.5px solid rgba(var(--nura-sage-rgb),0.45)`, marginBottom: 20, animation: "pulse-ring 2.8s ease-in-out infinite" }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: "#fff" }}>nūra</span>
          </div>

          {/* Trial badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `rgba(var(--nura-sage-rgb),0.12)`, border: `1px solid rgba(var(--nura-sage-rgb),0.3)`, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: SAGE }} />
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", color: SAGE }}>3-DAY FREE TRIAL</span>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 600, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            Try NŪRA Pro free
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SEC, margin: 0, fontFamily: MONO, letterSpacing: "0.5px" }}>
            $9.99/mo after trial · Cancel anytime
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
          {FEATURES.map((f) => (
            <div key={f.text} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "13px 16px", borderRadius: 12,
              background: "rgba(var(--nura-bg-tint-rgb),0.03)", border: `1px solid ${BORDER}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: `rgba(var(--nura-sage-rgb),0.12)`, border: `1px solid rgba(var(--nura-sage-rgb),0.25)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, color: SAGE,
              }}>
                {f.icon}
              </div>
              <span style={{ fontSize: 14, color: TEXT_SEC }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Trial callout */}
        <div style={{
          padding: "14px 16px", borderRadius: 12, marginBottom: 20,
          background: `rgba(var(--nura-sage-rgb),0.07)`, border: `1px solid rgba(var(--nura-sage-rgb),0.2)`,
        }}>
          <div style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.6 }}>
            <span style={{ color: SAGE, fontWeight: 600 }}>Free for 3 days.</span>
            {" "}Your card is saved now but won&apos;t be charged until day 4. Cancel any time before then — no cost.
          </div>
        </div>

        {/* Primary CTA — START FREE TRIAL */}
        <button
          onClick={handleStartTrial}
          disabled={anyLoading}
          onMouseEnter={() => setHovCta(true)}
          onMouseLeave={() => setHovCta(false)}
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: anyLoading ? `rgba(var(--nura-sage-rgb),0.5)` : hovCta ? SAGE_HOV : SAGE,
            color: SAGE_ON, fontFamily: MONO, fontSize: 12, fontWeight: 700,
            letterSpacing: "1.5px", cursor: anyLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 200ms",
          }}
        >
          {trialLoading ? "LOADING..." : "START FREE TRIAL"}
          {!trialLoading && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          )}
        </button>

        {/* Secondary text link — subscribe now */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            type="button"
            onClick={handleSubscribeNow}
            disabled={anyLoading}
            onMouseEnter={() => setHovSecondary(true)}
            onMouseLeave={() => setHovSecondary(false)}
            style={{
              background: "none", border: "none", padding: 0,
              cursor: anyLoading ? "not-allowed" : "pointer",
              fontFamily: SANS, fontSize: 14,
              color: hovSecondary ? TEXT_SEC : TEXT_TER,
              textDecoration: hovSecondary ? "underline" : "none",
              transition: "color 160ms",
            }}
          >
            {nowLoading ? "Loading…" : "or subscribe now — $9.99/month, no trial"}
          </button>
        </div>

        {/* Manage subscription link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            href="/billing"
            style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: "1.2px", color: TEXT_TER, textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Already Pro? Manage subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
