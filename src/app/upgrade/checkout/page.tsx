"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

function Skeleton() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${BORDER}` }}>
      <style>{`
        @keyframes sk-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      {[320, 260, 200, 260, 200].map((h, i) => (
        <div key={i} style={{ height: h, background: "rgba(235,230,216,0.04)", position: "relative", overflow: "hidden", borderBottom: i < 4 ? `1px solid ${BORDER}` : "none" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(90deg, transparent, rgba(${SAGE_RGB},0.06), transparent)`,
            animation: `sk-shimmer 1.6s ease-in-out ${i * 0.1}s infinite`,
          }} />
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json() as { clientSecret?: string; error?: string };
        if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Checkout failed");
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      }
    }
    void init();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        /* Stripe iframe integration */
        #stripe-checkout-container iframe { border-radius: 14px !important; }
      `}</style>

      {/* Header */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={() => router.push("/upgrade")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: TEXT_SEC, fontFamily: SANS, fontSize: 14, cursor: "pointer", padding: "4px 0" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6"/>
          </svg>
          Back
        </button>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 16, color: "#fff" }}>nūra</span>
        <div style={{ width: 52 }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, color: TEXT, margin: "0 0 6px", letterSpacing: "-0.3px" }}>
            Complete your free trial
          </h1>
          <p style={{ fontSize: 13, color: TEXT_SEC, margin: 0 }}>
            Free for 3 days. Then $9.99/mo. Cancel anytime.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.3)", borderRadius: 12, marginBottom: 16, fontSize: 13, color: "#ff4c5c" }}>
            {error}
          </div>
        )}

        {/* Checkout area */}
        <div style={{ borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden", background: "rgba(235,230,216,0.02)" }} id="stripe-checkout-container">
          {clientSecret ? (
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : !error ? (
            <Skeleton />
          ) : null}
        </div>

        {/* Reassurance */}
        {(clientSecret || !error) && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEXT_TER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={{ fontSize: 11, fontFamily: MONO, color: TEXT_TER, letterSpacing: "0.5px" }}>
              Secure payment by Stripe
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
