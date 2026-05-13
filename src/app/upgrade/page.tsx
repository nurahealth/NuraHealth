"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
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
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");
  const [hovCta, setHovCta] = useState(false);

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
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px 80px" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(${SAGE_RGB},0.25); }
          50%       { box-shadow: 0 0 0 8px rgba(${SAGE_RGB},0); }
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Logo wordmark */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: BG, border: `0.5px solid rgba(${SAGE_RGB},0.45)`, marginBottom: 20, animation: "pulse-ring 2.8s ease-in-out infinite" }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: "#fff" }}>nūra</span>
          </div>

          {/* Trial badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 20, background: `rgba(${SAGE_RGB},0.12)`, border: `1px solid rgba(${SAGE_RGB},0.3)`, marginBottom: 16 }}>
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
              background: "rgba(235,230,216,0.03)", border: `1px solid ${BORDER}`,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: `rgba(${SAGE_RGB},0.12)`, border: `1px solid rgba(${SAGE_RGB},0.25)`,
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
          background: `rgba(${SAGE_RGB},0.07)`, border: `1px solid rgba(${SAGE_RGB},0.2)`,
        }}>
          <div style={{ fontSize: 12, color: TEXT_SEC, lineHeight: 1.6 }}>
            <span style={{ color: SAGE, fontWeight: 600 }}>Free for 3 days.</span>
            {" "}Your card is saved now but won&apos;t be charged until day 4. Cancel any time before then — no cost.
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.3)", borderRadius: 8, marginBottom: 16, fontFamily: MONO, fontSize: 10, color: "#ff4c5c", letterSpacing: "0.5px" }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          onMouseEnter={() => setHovCta(true)}
          onMouseLeave={() => setHovCta(false)}
          style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            background: loading ? `rgba(${SAGE_RGB},0.5)` : hovCta ? SAGE_HOV : SAGE,
            color: SAGE_ON, fontFamily: MONO, fontSize: 12, fontWeight: 700,
            letterSpacing: "1.5px", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 200ms", marginBottom: 14,
          }}
        >
          {loading ? "REDIRECTING..." : "START FREE TRIAL"}
          {!loading && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          )}
        </button>

        {/* Portal link */}
        <div style={{ textAlign: "center" }}>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            style={{ background: "none", border: "none", cursor: portalLoading ? "not-allowed" : "pointer", fontFamily: MONO, fontSize: 9, fontWeight: 600, letterSpacing: "1.2px", color: TEXT_TER, textTransform: "uppercase" }}
          >
            {portalLoading ? "LOADING..." : "Already Pro? Manage subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}
