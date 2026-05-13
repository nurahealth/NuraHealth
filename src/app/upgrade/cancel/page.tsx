"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

export default function UpgradeCancelPage() {
  const router = useRouter();
  const [hovTry, setHovTry] = useState(false);

  return (
    <div style={{ minHeight: "100dvh", background: BG, fontFamily: SANS, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ maxWidth: 360, width: "100%", animation: "fade-up 400ms ease both" }}>
        {/* Icon */}
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "rgba(235,230,216,0.04)", border: `1px solid ${BORDER}`, marginBottom: 24 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TEXT_TER} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 600, color: TEXT, margin: "0 0 10px", letterSpacing: "-0.4px" }}>
          No problem.
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SEC, margin: "0 0 12px", lineHeight: 1.65 }}>
          No charges were made. Your free trial is still waiting whenever you&apos;re ready.
        </p>
        <p style={{ fontSize: 13, color: TEXT_TER, margin: "0 0 32px", lineHeight: 1.6 }}>
          3 days free · $9.99/mo after · Cancel any time
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => router.push("/upgrade")}
            onMouseEnter={() => setHovTry(true)}
            onMouseLeave={() => setHovTry(false)}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none",
              background: hovTry ? SAGE_HOV : SAGE,
              color: SAGE_ON, fontFamily: MONO, fontSize: 11, fontWeight: 700,
              letterSpacing: "1.5px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background 200ms",
            }}
          >
            START FREE TRIAL
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>

          <button
            onClick={() => router.push("/")}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${BORDER}`,
              background: "transparent", color: TEXT_TER, fontFamily: MONO,
              fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", cursor: "pointer",
            }}
          >
            BACK TO NŪRA
          </button>
        </div>
      </div>
    </div>
  );
}
