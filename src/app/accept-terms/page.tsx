"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NuraPlexus from "@/components/NuraPlexus";

// ── Tokens ────────────────────────────────────────────────────────────────────
const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
const RED = "#d4574d";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Helpers ───────────────────────────────────────────────────────────────────
function Checkbox({
  checked, onToggle, children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onToggle(); } }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        cursor: "pointer", userSelect: "none",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        marginTop: 1,
        background: checked ? SAGE : "transparent",
        border: `0.5px solid ${checked ? SAGE : "rgba(235,230,216,0.25)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 160ms, border-color 160ms",
      }}>
        {checked && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        )}
      </div>
      <span style={{
        fontFamily: SANS, fontSize: 12.5, lineHeight: 1.5,
        color: "rgba(235,230,216,0.75)",
      }}>
        {children}
      </span>
    </div>
  );
}

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      style={{ color: SAGE, textDecoration: "none" }}
      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
    >
      {children}
    </a>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      border: `2px solid ${SAGE_ON}33`, borderTopColor: SAGE_ON,
      animation: "accept-spin 0.8s linear infinite",
    }} />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AcceptTermsPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedMedical, setAgreedMedical] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Ensure there's a logged-in user; if not, send to /auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/auth"); return; }
      setAuthReady(true);
    });
  }, [router]);

  const handleContinue = async () => {
    if (!(agreedTerms && agreedMedical) || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { data: { user }, error: updateErr } = await supabase.auth.updateUser({
        data: {
          terms_accepted: true,
          terms_accepted_at: now,
          medical_disclaimer_accepted: true,
          medical_disclaimer_accepted_at: now,
        },
      });
      if (updateErr) throw updateErr;
      if (!user) throw new Error("No user session");

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded")
        .eq("id", user.id)
        .maybeSingle();

      const onboarded = (profile as { onboarded?: boolean } | null)?.onboarded === true;
      // Hard navigation to ensure proxy reads the refreshed session metadata
      window.location.href = onboarded ? "/" : "/onboarding";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save. Please try again.");
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  if (!authReady) {
    return <div style={{ minHeight: "100dvh", background: BG }} />;
  }

  const consentReady = agreedTerms && agreedMedical;
  const disabled = !consentReady || submitting;

  return (
    <div style={{
      minHeight: "100dvh", background: BG, color: TEXT,
      fontFamily: SANS, position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "max(env(safe-area-inset-top), 32px) 20px max(env(safe-area-inset-bottom), 32px)",
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
        @keyframes accept-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <NuraPlexus opacity={0.25} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 460 }}>

        {/* Top brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <div style={{
            fontFamily: SERIF, fontWeight: 500, fontSize: 28, color: SAGE,
            letterSpacing: "-0.3px", lineHeight: 1,
          }}>
            nūra
          </div>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 500, fontSize: 28, color: TEXT,
            margin: "12px 0 6px", letterSpacing: "-0.3px", textAlign: "center", lineHeight: 1.15,
          }}>
            Welcome to NŪRA
          </h1>
          <p style={{
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
            margin: 0, textAlign: "center", lineHeight: 1.5,
          }}>
            One quick thing before we begin.
          </p>
        </div>

        {/* Consent block */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
            color: SAGE, textTransform: "uppercase", marginBottom: 14,
          }}>
            Required agreements
          </div>

          <div style={{ marginBottom: 12 }}>
            <Checkbox checked={agreedTerms} onToggle={() => setAgreedTerms((v) => !v)}>
              I agree to NŪRA&apos;s{" "}
              <LegalLink href="/terms">Terms of Service</LegalLink>
              {" "}and{" "}
              <LegalLink href="/privacy">Privacy Policy</LegalLink>.
            </Checkbox>
          </div>

          <Checkbox checked={agreedMedical} onToggle={() => setAgreedMedical((v) => !v)}>
            I understand NŪRA provides wellness information based on natural healing protocols, herbal medicine, and nutritional therapy — not medical advice. I will consult a licensed healthcare provider for medical conditions, medications, and emergencies.
          </Checkbox>
        </div>

        {/* Error chip */}
        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: 10, marginBottom: 12,
            background: "rgba(212,87,77,0.08)", border: `0.5px solid rgba(212,87,77,0.35)`,
            fontFamily: SANS, fontSize: 12.5, color: RED, lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={disabled}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = SAGE_HOV; }}
          onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = SAGE; }}
          style={{
            width: "100%", height: 48, borderRadius: 11, border: "none",
            background: SAGE, color: SAGE_ON,
            fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: submitting ? 0.75 : !consentReady ? 0.5 : 1,
            transition: "background 200ms, opacity 160ms",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {submitting ? <Spinner /> : "Continue to NŪRA"}
        </button>

        {/* Sign out link */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT_SEC }}>
            Or{" "}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: SANS, fontSize: 12, color: SAGE, fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            sign out
          </button>
        </div>

        {/* Footer */}
        <p style={{
          marginTop: 32, textAlign: "center",
          fontFamily: SANS, fontSize: 10, color: "rgba(235,230,216,0.32)",
          letterSpacing: "1px", textTransform: "uppercase",
        }}>
          Wellness information · not medical advice
        </p>

        {/* Subtle pointer to disclaimer */}
        <p style={{
          marginTop: 8, textAlign: "center",
          fontFamily: SANS, fontSize: 11, color: TEXT_SEC,
        }}>
          <LegalLink href="/medical-disclaimer">Read the full medical disclaimer</LegalLink>
        </p>
      </div>
    </div>
  );
}

