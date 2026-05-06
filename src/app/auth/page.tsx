"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FONTS } from "@/lib/theme";
import { useTheme } from "@/components/ThemeProvider";
import Logo from "@/components/Logo";

export default function AuthPage() {
  const router = useRouter();
  const { colors } = useTheme();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
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

  const inputStyle: React.CSSProperties = {
    padding: "14px 18px",
    background: colors.mintBgSubtle,
    border: `1.5px solid ${colors.mintBorder}`,
    borderRadius: 12,
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: colors.text,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        fontFamily: FONTS.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <style>{`
        @keyframes auth-breathe { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder { color: ${colors.textGhost} !important; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo + header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <div style={{ marginBottom: 20 }}>
            <Logo size={64} />
          </div>
          <h1 style={{ fontFamily: FONTS.serif, fontSize: 30, color: colors.text, margin: "0 0 8px", fontWeight: 400, textAlign: "center" }}>
            {mode === "signin" ? "Welcome to NŪRA" : "Create your account"}
          </h1>
          <p style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.mint, margin: 0, letterSpacing: "1.5px", textTransform: "uppercase" }}>
            YOUR PERSONAL HEALTH OS
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {error && (
            <div style={{ padding: "10px 14px", background: `${colors.danger}12`, border: `1px solid ${colors.danger}30`, borderRadius: 10, fontSize: 12.5, color: colors.danger }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ padding: "10px 14px", background: `${colors.mint}12`, border: `1px solid ${colors.mintBorder}`, borderRadius: 10, fontSize: 12.5, color: colors.mint }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "14px",
              background: loading
                ? colors.mintBgMedium
                : `linear-gradient(135deg, ${colors.mint}, ${colors.mintDeep})`,
              color: loading ? colors.textDim : colors.textOnAccent,
              border: "none",
              borderRadius: 12,
              fontFamily: FONTS.mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.5px",
              cursor: loading ? "wait" : "pointer",
              textTransform: "uppercase",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "LOADING..." : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        {/* OR divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: colors.textGhost, letterSpacing: "1px" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
        </div>

        {/* Social buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            style={{
              width: "100%",
              padding: "13px",
              background: colors.mintBgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              fontFamily: FONTS.sans,
              fontSize: 14,
              color: colors.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.5 0a8.5 8.5 0 1 0 0 17A8.5 8.5 0 0 0 8.5 0zm0 2c1.8 0 3.4.6 4.7 1.7L11 5.9a5 5 0 1 0 1.5 3.6h-4V7.4h6.4c.1.4.1.7.1 1.1A6.5 6.5 0 1 1 8.5 2z" fill={colors.textMuted} />
            </svg>
            Continue with Google
          </button>
          <button
            style={{
              width: "100%",
              padding: "13px",
              background: colors.mintBgSubtle,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              fontFamily: FONTS.sans,
              fontSize: 14,
              color: colors.textMuted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 814 1000" fill={colors.textMuted}>
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.2 0 128.5 46.2 172.7 46.2 42.4 0 109.2-48.7 188.3-48.7zm-163.8-97c37.8-44.6 64.7-106.3 64.7-168 0-8.7-.6-17.4-2-25.5-61.2 2.3-134.2 41.5-178.3 91.8-34 37.4-66.2 99-66.2 161.7 0 9.3 1.4 18.7 2 21.7 3.8.6 10 1.4 16.2 1.4 55.2 0 124.2-37.8 163.6-82.1z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        {/* Toggle mode */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ fontFamily: FONTS.sans, fontSize: 13, color: colors.textDim }}>
            {mode === "signin" ? "New to NŪRA?" : "Already have an account?"}{" "}
          </span>
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
            style={{ background: "none", border: "none", color: colors.mint, fontFamily: FONTS.sans, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </div>

        <p style={{ marginTop: 32, textAlign: "center", fontFamily: FONTS.mono, fontSize: 9, color: colors.textGhost, letterSpacing: "0.08em" }}>
          WELLNESS INFORMATION · NOT MEDICAL ADVICE
        </p>
      </div>
    </div>
  );
}
