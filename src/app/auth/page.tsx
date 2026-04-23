"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const C = {
  bg: "#FAF8F4",
  card: "#FFFFFF",
  text: "#1B3022",
  textMuted: "#5A6B5E",
  textLight: "#8A9488",
  border: "rgba(0,0,0,0.08)",
  terracotta: "#C17A56",
  logoBg: "#1B3022",
  logoText: "#F5F1E9",
  error: "#C95444",
};

const serif = "'DM Serif Display', Georgia, serif";
const sans = "'Outfit', system-ui, sans-serif";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Outfit:wght@300;400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

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

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: sans, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input::placeholder { color: ${C.textLight} !important; }
        html, body { margin: 0; padding: 0; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.logoBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: serif, fontSize: 32, color: C.logoText, lineHeight: 1, marginTop: 2 }}>N</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 28, color: C.text, margin: "0 0 6px", fontWeight: 400 }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, margin: 0 }}>
            {mode === "signin" ? "Sign in to continue your wellness journey" : "Begin your wellness journey with Nura"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required
              style={{ padding: "14px 16px", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: sans, fontSize: 14, color: C.text, outline: "none" }} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ padding: "14px 16px", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: sans, fontSize: 14, color: C.text, outline: "none" }} />
          <input type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
            style={{ padding: "14px 16px", background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, fontFamily: sans, fontSize: 14, color: C.text, outline: "none" }} />

          {error && <div style={{ padding: "10px 14px", background: "rgba(201,84,68,0.08)", border: `1px solid rgba(201,84,68,0.2)`, borderRadius: 10, fontSize: 12.5, color: C.error }}>{error}</div>}
          {message && <div style={{ padding: "10px 14px", background: "rgba(107,127,94,0.08)", border: `1px solid rgba(107,127,94,0.2)`, borderRadius: 10, fontSize: 12.5, color: "#6B7F5E" }}>{message}</div>}

          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: "14px", background: C.logoBg, color: C.logoText, border: "none", borderRadius: 12, fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ fontFamily: sans, fontSize: 13, color: C.textMuted }}>
            {mode === "signin" ? "New to Nura?" : "Already have an account?"}{" "}
          </span>
          <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
            style={{ background: "none", border: "none", color: C.terracotta, fontFamily: sans, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </div>

        <p style={{ marginTop: 32, textAlign: "center", fontFamily: sans, fontSize: 11, color: C.textLight }}>
          Nura provides wellness information, not medical advice.
        </p>
      </div>
    </div>
  );
}