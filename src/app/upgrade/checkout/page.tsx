"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabase";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Design tokens ──────────────────────────────────────────────────────────────
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

// Stripe Elements appearance — dark sage theme
const ELEMENTS_APPEARANCE: StripeElementsOptions["appearance"] = {
  theme: "night",
  variables: {
    colorPrimary: SAGE,
    colorBackground: "#111214",
    colorText: TEXT,
    colorDanger: "#ff4c5c",
    colorTextSecondary: TEXT_SEC,
    colorTextPlaceholder: "rgba(235,230,216,0.28)",
    fontFamily: SANS,
    borderRadius: "10px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      backgroundColor: "rgba(235,230,216,0.04)",
      border: `1.5px solid ${BORDER}`,
      color: TEXT,
      boxShadow: "none",
    },
    ".Input:focus": {
      border: `1.5px solid rgba(${SAGE_RGB},0.5)`,
      boxShadow: "none",
      outline: "none",
    },
    ".Input--invalid": {
      border: "1.5px solid rgba(255,76,92,0.6)",
      boxShadow: "none",
    },
    ".Label": {
      color: TEXT_TER,
      fontSize: "10px",
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontFamily: MONO,
      fontWeight: "600",
    },
    ".Tab": {
      backgroundColor: "rgba(235,230,216,0.03)",
      border: `1px solid ${BORDER}`,
      color: TEXT_SEC,
      boxShadow: "none",
    },
    ".Tab:hover": {
      backgroundColor: "rgba(235,230,216,0.06)",
      color: TEXT,
    },
    ".Tab--selected": {
      backgroundColor: `rgba(${SAGE_RGB},0.1)`,
      border: `1px solid rgba(${SAGE_RGB},0.35)`,
      color: SAGE,
      boxShadow: "none",
    },
    ".Tab--selected:focus": {
      boxShadow: "none",
    },
    ".Error": {
      color: "#ff4c5c",
      fontSize: "12px",
    },
    ".Block": {
      backgroundColor: "transparent",
    },
  },
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div>
      <style>{`
        @keyframes sk-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
      {[56, 56, 56, 48].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 10, background: "rgba(235,230,216,0.04)", position: "relative", overflow: "hidden", marginBottom: 12 }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, rgba(${SAGE_RGB},0.07), transparent)`, animation: `sk-shimmer 1.5s ease ${i * 0.12}s infinite` }} />
        </div>
      ))}
    </div>
  );
}

// ── Inner payment form (must be inside <Elements>) ─────────────────────────────
function PaymentForm({ subscriptionId }: { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [hovBtn, setHovBtn] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;
    setProcessing(true);
    setError("");

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/upgrade/success?subscription_id=${subscriptionId}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message ?? "Payment setup failed. Please try again.");
      setProcessing(false);
      return;
    }

    if (setupIntent?.status === "succeeded") {
      router.push(`/upgrade/success?subscription_id=${subscriptionId}`);
      return;
    }

    // Redirect happened — browser follows return_url, nothing to do here
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ minHeight: ready ? "auto" : 220, transition: "min-height 300ms ease" }}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs" }}
        />
      </div>

      {!ready && <Skeleton />}

      {error && (
        <div style={{ marginTop: 14, padding: "11px 14px", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.28)", borderRadius: 10, fontSize: 13, color: "#ff4c5c", lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || !ready}
        onMouseEnter={() => setHovBtn(true)}
        onMouseLeave={() => setHovBtn(false)}
        style={{
          marginTop: 20, width: "100%", padding: "14px", borderRadius: 12, border: "none",
          background: (!stripe || processing || !ready) ? `rgba(${SAGE_RGB},0.45)` : hovBtn ? SAGE_HOV : SAGE,
          color: SAGE_ON, fontFamily: MONO, fontSize: 11, fontWeight: 700,
          letterSpacing: "1.5px", cursor: (!stripe || processing || !ready) ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "background 200ms",
        }}
      >
        {processing ? (
          <>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid rgba(13,13,14,0.3)`, borderTopColor: SAGE_ON, animation: "spin 0.8s linear infinite" }} />
            STARTING TRIAL...
          </>
        ) : (
          <>
            START FREE TRIAL
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </>
        )}
      </button>

      <p style={{ textAlign: "center", marginTop: 12, fontSize: 11, fontFamily: MONO, color: TEXT_TER, letterSpacing: "0.3px" }}>
        No charge for 3 days · $9.99/mo after · Cancel anytime
      </p>
    </form>
  );
}

// ── Outer page (fetches secret, owns layout) ───────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string>("");
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
        const data = await res.json() as { clientSecret?: string; subscriptionId?: string; error?: string };
        if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Checkout failed");
        if (!cancelled) {
          setClientSecret(data.clientSecret);
          setSubscriptionId(data.subscriptionId ?? "");
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      }
    }
    void init();
    return () => { cancelled = true; };
  }, [router]);

  const elementsOptions: StripeElementsOptions = clientSecret
    ? { clientSecret, appearance: ELEMENTS_APPEARANCE }
    : {};

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
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
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 64px", animation: "fade-up 350ms ease both" }}>

        {/* ── Order summary ── */}
        <div style={{ background: "rgba(235,230,216,0.03)", border: `0.5px solid rgba(${SAGE_RGB},0.2)`, borderRadius: 16, padding: "20px", marginBottom: 24 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: SAGE, marginBottom: 14 }}>
            ORDER SUMMARY
          </div>

          <div style={{ fontSize: 18, fontWeight: 500, color: TEXT, marginBottom: 4 }}>NŪRA Pro</div>
          <div style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.6, marginBottom: 16 }}>
            Unlimited AI conversations, personalized protocols, full knowledge base
          </div>

          <div style={{ borderTop: `0.5px solid rgba(235,230,216,0.1)`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: TEXT_SEC }}>Today</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>$0.00</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: TEXT_SEC }}>After 3-day trial</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>$9.99/mo</span>
            </div>
          </div>

          <p style={{ fontSize: 11, fontFamily: MONO, color: TEXT_TER, margin: "14px 0 0", letterSpacing: "0.3px" }}>
            You won&apos;t be charged today. Cancel anytime before the trial ends.
          </p>
        </div>

        {/* ── Payment form ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", color: TEXT_TER, marginBottom: 16 }}>
            PAYMENT DETAILS
          </div>

          {error && (
            <div style={{ padding: "12px 14px", background: "rgba(255,76,92,0.08)", border: "1px solid rgba(255,76,92,0.28)", borderRadius: 12, marginBottom: 16, fontSize: 13, color: "#ff4c5c" }}>
              {error}
            </div>
          )}

          {clientSecret ? (
            <Elements stripe={stripePromise} options={elementsOptions}>
              <PaymentForm subscriptionId={subscriptionId} />
            </Elements>
          ) : !error ? (
            <Skeleton />
          ) : null}
        </div>

        {/* Reassurance */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TEXT_TER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize: 11, fontFamily: MONO, color: TEXT_TER, letterSpacing: "0.5px" }}>
            Secure payment by Stripe
          </span>
        </div>
      </div>
    </div>
  );
}
