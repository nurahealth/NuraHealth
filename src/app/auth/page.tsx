"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NuraPlexus from "@/components/NuraPlexus";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const BORDER = "rgba(235,230,216,0.12)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
const SAGE_RGB = "155,176,165";
const RED = "#d4574d";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Icons ─────────────────────────────────────────────────────────────────────
function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.2-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 1c.05 1.21-.46 2.43-1.2 3.27-.79.9-2.07 1.61-3.31 1.51-.06-1.19.51-2.38 1.25-3.18C13.9 1.62 15.23 1 16.36 1zM20.5 17.16c-.55 1.27-.81 1.84-1.52 2.97-.99 1.58-2.39 3.55-4.12 3.56-1.54.02-1.93-1-4.02-.99-2.09.01-2.53 1.02-4.06 1-1.73-.03-3.06-1.81-4.05-3.4-2.78-4.43-3.07-9.63-1.36-12.4 1.22-1.96 3.14-3.11 4.95-3.11 1.84 0 3 1.01 4.52 1.01 1.48 0 2.38-1.01 4.51-1.01 1.61 0 3.32.88 4.54 2.4-3.99 2.19-3.34 7.89.61 9.97z"/>
    </svg>
  );
}

function Spinner({ size = 18, color = SAGE_ON }: { size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${color}33`, borderTopColor: color,
      animation: "auth-spin 0.8s linear infinite",
    }} />
  );
}

function ConsentCheckbox({
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
      style={{
        color: SAGE, textDecoration: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
      onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
    >
      {children}
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Focus states for sage focus ring on inputs
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Signup consent
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedMedical, setAgreedMedical] = useState(false);

  // Apple "coming soon" toast
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "oauth_failed") {
      setError("Google sign-in failed. Please try again or use email.");
    }
  }, [searchParams]);

  // ── Auth handlers ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (mode === "signup" && !(agreedTerms && agreedMedical)) {
      setError("Please accept both agreements to continue.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              agreed_to_terms: true,
              agreed_to_medical_disclaimer: true,
              consent_timestamp: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        setMessage("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
      // Redirect handled by Supabase
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const handleAppleClick = () => {
    setToast("Apple sign-in coming soon");
    setTimeout(() => setToast(""), 2200);
  };

  const anyLoading = loading || googleLoading;
  const isSignup = mode === "signup";

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
        @keyframes auth-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes auth-toast-in {
          from { opacity: 0; transform: translate(-50%, 8px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .auth-cta:active { transform: scale(0.98); }
        input::placeholder { color: rgba(235,230,216,0.35) !important; }
      `}</style>

      <NuraPlexus opacity={0.3} />

      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 380 }}>

        {/* TOP BRAND */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{
            fontFamily: SERIF, fontWeight: 500, fontSize: 32, color: SAGE,
            letterSpacing: "-0.3px", lineHeight: 1,
          }}>
            nūra
          </div>
          <h1 style={{
            fontFamily: SERIF, fontWeight: 500, fontSize: 28, color: TEXT,
            margin: "18px 0 6px", letterSpacing: "-0.3px", textAlign: "center", lineHeight: 1.15,
          }}>
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p style={{
            fontFamily: SANS, fontSize: 13, color: TEXT_SEC,
            margin: 0, textAlign: "center", lineHeight: 1.5,
          }}>
            {isSignup ? "Start your wellness journey." : "Sign in to continue your wellness journey."}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            required
            autoComplete="email"
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              background: emailFocused ? "rgba(235,230,216,0.06)" : SURFACE,
              border: `0.5px solid ${emailFocused ? `rgba(${SAGE_RGB},0.5)` : BORDER}`,
              fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none",
              transition: "background 180ms, border-color 180ms",
              marginBottom: 10,
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12,
              background: passwordFocused ? "rgba(235,230,216,0.06)" : SURFACE,
              border: `0.5px solid ${passwordFocused ? `rgba(${SAGE_RGB},0.5)` : BORDER}`,
              fontFamily: SANS, fontSize: 14, color: TEXT, outline: "none",
              transition: "background 180ms, border-color 180ms",
              marginBottom: 14,
            }}
          />

          {isSignup && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 10 }}>
                <ConsentCheckbox checked={agreedTerms} onToggle={() => setAgreedTerms((v) => !v)}>
                  I agree to NŪRA&apos;s{" "}
                  <LegalLink href="/terms">Terms of Service</LegalLink>
                  {" "}and{" "}
                  <LegalLink href="/privacy">Privacy Policy</LegalLink>.
                </ConsentCheckbox>
              </div>
              <ConsentCheckbox checked={agreedMedical} onToggle={() => setAgreedMedical((v) => !v)}>
                I understand NŪRA provides wellness information based on natural healing protocols, herbal medicine, and nutritional therapy — not medical advice. I will consult a licensed healthcare provider for medical conditions, medications, and emergencies.
              </ConsentCheckbox>
            </div>
          )}

          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 12,
              background: `rgba(212,87,77,0.08)`, border: `0.5px solid rgba(212,87,77,0.35)`,
              fontFamily: SANS, fontSize: 12.5, color: RED, lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, marginBottom: 12,
              background: `rgba(${SAGE_RGB},0.08)`, border: `0.5px solid rgba(${SAGE_RGB},0.35)`,
              fontFamily: SANS, fontSize: 12.5, color: SAGE, lineHeight: 1.5,
            }}>
              {message}
            </div>
          )}

          {(() => {
            const consentBlocking = isSignup && !(agreedTerms && agreedMedical);
            const submitDisabled = anyLoading || consentBlocking;
            return (
              <button
                type="submit"
                disabled={submitDisabled}
                className="auth-cta"
                onMouseEnter={(e) => { if (!submitDisabled) e.currentTarget.style.background = SAGE_HOV; }}
                onMouseLeave={(e) => { if (!submitDisabled) e.currentTarget.style.background = SAGE; }}
                style={{
                  width: "100%", height: 48, borderRadius: 11, border: "none",
                  background: SAGE, color: SAGE_ON,
                  fontFamily: SANS, fontSize: 14, fontWeight: 500,
                  cursor: submitDisabled ? "not-allowed" : "pointer",
                  opacity: anyLoading ? 0.75 : consentBlocking ? 0.5 : 1,
                  transition: "background 200ms, transform 80ms, opacity 160ms",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {loading ? <Spinner /> : (isSignup ? "Create account" : "Sign in")}
              </button>
            );
          })()}
        </form>

        {/* OR DIVIDER */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
          <div style={{ flex: 1, height: 0.5, background: BORDER }} />
          <span style={{
            fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "2px",
            color: `rgba(${SAGE_RGB},0.55)`, textTransform: "uppercase",
          }}>
            OR
          </span>
          <div style={{ flex: 1, height: 0.5, background: BORDER }} />
        </div>

        {/* GOOGLE */}
        <button
          onClick={handleGoogleSignIn}
          disabled={anyLoading}
          className="auth-cta"
          onMouseEnter={(e) => { if (!anyLoading) e.currentTarget.style.background = SURFACE; }}
          onMouseLeave={(e) => { if (!anyLoading) e.currentTarget.style.background = "transparent"; }}
          style={{
            width: "100%", height: 48, borderRadius: 11,
            background: "transparent", border: `0.5px solid rgba(235,230,216,0.15)`,
            color: TEXT, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: anyLoading ? "not-allowed" : "pointer", opacity: googleLoading ? 0.8 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "background 180ms, opacity 180ms, transform 80ms",
          }}
        >
          {googleLoading ? <Spinner size={17} color={TEXT} /> : <GoogleLogo />}
          {googleLoading ? "Connecting…" : "Continue with Google"}
        </button>

        {/* APPLE (coming soon) */}
        <button
          onClick={handleAppleClick}
          disabled={anyLoading}
          className="auth-cta"
          style={{
            width: "100%", height: 48, borderRadius: 11, marginTop: 8,
            background: "transparent", border: `0.5px solid rgba(235,230,216,0.15)`,
            color: TEXT, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            cursor: anyLoading ? "not-allowed" : "pointer", opacity: 0.6,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            transition: "transform 80ms",
          }}
        >
          <AppleLogo />
          Continue with Apple
          <span style={{
            padding: "4px 6px", borderRadius: 4,
            background: `rgba(${SAGE_RGB},0.14)`,
            fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "1px",
            color: SAGE, textTransform: "uppercase",
          }}>
            Soon
          </span>
        </button>

        {/* FOOTER */}
        <div style={{ marginTop: 28, textAlign: "center" }}>
          <span style={{ fontFamily: SANS, fontSize: 13, color: TEXT_SEC }}>
            {isSignup ? "Already have an account?" : "New to NŪRA?"}{" "}
          </span>
          <button
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError("");
              setMessage("");
              setAgreedTerms(false);
              setAgreedMedical(false);
            }}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: SANS, fontSize: 13, fontWeight: 500, color: SAGE,
            }}
          >
            {isSignup ? "Sign in" : "Create account"}
          </button>
        </div>

        <p style={{
          marginTop: 28, textAlign: "center",
          fontFamily: SANS, fontSize: 10, color: "rgba(235,230,216,0.32)",
          letterSpacing: "1px", textTransform: "uppercase",
        }}>
          Wellness information · not medical advice
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%",
          background: "rgba(20,20,21,0.95)",
          border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
          color: TEXT, fontFamily: SANS, fontSize: 12.5,
          padding: "10px 16px", borderRadius: 22,
          zIndex: 80, whiteSpace: "nowrap",
          animation: "auth-toast-in 220ms ease both",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
