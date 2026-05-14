"use client";

import { useState, useEffect, useRef } from "react";
import NuraPageShell from "@/components/NuraPageShell";

// ── Design tokens ─────────────────────────────────────────────────────────────
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const TEXT_TER = "rgba(235,230,216,0.4)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SURFACE_HOV = "rgba(235,230,216,0.08)";
const SAGE = "#9bb0a5";
const SAGE_HOV = "#abc0b5";
const SAGE_ON = "#0d0d0e";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Icons (Tabler-style) ──────────────────────────────────────────────────────
type IconProps = { size?: number };
const Watch = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="3"/>
    <path d="M9 4l1-2h4l1 2M9 20l1 2h4l1-2"/>
    <path d="M12 10v2.5l1.5 1"/>
  </svg>
);
const CircleDot = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </svg>
);
const Bolt = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3L6 13h6l-2 9 10-12h-6l1.5-9z"/>
  </svg>
);
const Heartbeat = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572z"/>
    <path d="M3 12h4l1.5-3 3 6 2-4 1.5 1H21"/>
  </svg>
);
const Run = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="14" cy="4" r="1.5"/>
    <path d="M7 17l4-4 2 2 4-4 3 3M8 12l2-5h6l-2 5"/>
  </svg>
);
const Heart = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12.572L12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572z"/>
  </svg>
);
const Google = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.2A9 9 0 1 1 12 3a8.5 8.5 0 0 1 6 2.3l-2.6 2.5A5 5 0 1 0 17 13h-5"/>
  </svg>
);
const X = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const Check = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7"/>
  </svg>
);

// ── Providers ─────────────────────────────────────────────────────────────────
interface Provider {
  id: string;
  name: string;
  tagline: string;
  Icon: (p: IconProps) => React.ReactElement;
}

const APPLE_WATCH: Provider = {
  id: "apple-watch",
  name: "Apple Watch",
  tagline: "Heart rate, HRV, sleep & workouts",
  Icon: Watch,
};

const PROVIDERS: Provider[] = [
  { id: "oura",      name: "Oura Ring",            tagline: "Sleep & recovery tracking",    Icon: CircleDot },
  { id: "whoop",     name: "Whoop",                tagline: "Strain & recovery",            Icon: Bolt },
  { id: "fitbit",    name: "Fitbit",               tagline: "Activity & sleep",             Icon: Heartbeat },
  { id: "garmin",    name: "Garmin",               tagline: "Performance & GPS",            Icon: Run },
  { id: "apple-health", name: "Apple Health",      tagline: "iPhone & iPad health data",    Icon: Heart },
  { id: "google-hc", name: "Google Health Connect", tagline: "Android health hub",          Icon: Google },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const [modalDevice, setModalDevice] = useState<Provider | null>(null);

  return (
    <NuraPageShell maxWidth={920}>
      <style>{`
        @keyframes ig-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ig-pop-in {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .ig-featured { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; }
        @media (min-width: 640px) {
          .ig-featured { flex-direction: row; align-items: center; gap: 22px; }
        }
        .ig-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (min-width: 1024px) {
          .ig-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>

      {/* HERO */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 500, color: TEXT,
          margin: "0 0 6px", lineHeight: 1.15, letterSpacing: "-0.5px",
          fontSize: "clamp(32px, 5vw, 44px)",
        }}>
          Integrations
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, margin: 0, lineHeight: 1.5 }}>
          Connect your devices so NŪRA sees your full picture.
        </p>
      </div>

      {/* FEATURED CARD */}
      <div style={{
        background: SURFACE, border: `0.5px solid ${BORDER}`, borderRadius: 16,
        padding: 24, marginBottom: 32,
      }}>
        <div className="ig-featured">
          <div style={{
            width: 80, height: 80, borderRadius: 14, flexShrink: 0,
            background: `rgba(${SAGE_RGB},0.12)`,
            border: `0.5px solid rgba(${SAGE_RGB},0.35)`,
            color: SAGE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Watch size={36} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
              color: SAGE, textTransform: "uppercase", marginBottom: 6,
            }}>
              Featured
            </div>
            <h3 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT, margin: "0 0 8px", letterSpacing: "-0.2px" }}>
              Apple Watch
            </h3>
            <p style={{ fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC, lineHeight: 1.6, margin: "0 0 16px" }}>
              Sync your heart rate, HRV, sleep, recovery, and workouts directly into your dashboard.
            </p>
            <button
              onClick={() => setModalDevice(APPLE_WATCH)}
              onMouseEnter={(e) => { e.currentTarget.style.background = SAGE_HOV; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = SAGE; }}
              style={{
                height: 40, padding: "0 18px", borderRadius: 11, border: "none",
                background: SAGE, color: SAGE_ON,
                fontFamily: SANS, fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "background 200ms ease",
              }}
            >
              Connect Apple Watch
            </button>
          </div>
        </div>
      </div>

      {/* ALL DEVICES */}
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
        color: SAGE, textTransform: "uppercase", marginBottom: 12,
      }}>
        All devices
      </div>

      <div className="ig-grid">
        {PROVIDERS.map((p) => (
          <ProviderCard key={p.id} provider={p} onClick={() => setModalDevice(p)} />
        ))}
      </div>

      {/* MODAL */}
      {modalDevice && (
        <ConnectModal device={modalDevice} onClose={() => setModalDevice(null)} />
      )}
    </NuraPageShell>
  );
}

// ── Provider card ─────────────────────────────────────────────────────────────
function ProviderCard({ provider, onClick }: { provider: Provider; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const Icon = provider.Icon;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: "left",
        background: hov ? SURFACE_HOV : SURFACE,
        border: `0.5px solid ${hov ? `rgba(${SAGE_RGB},0.25)` : BORDER}`,
        borderRadius: 14, padding: 16, cursor: "pointer",
        fontFamily: SANS, display: "flex", flexDirection: "column", gap: 12,
        transition: "background 180ms, border-color 180ms",
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `rgba(${SAGE_RGB},0.12)`,
        border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
        color: SAGE,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={20} />
      </div>

      <div>
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 500, color: TEXT, marginBottom: 4 }}>
          {provider.name}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_SEC, lineHeight: 1.4 }}>
          {provider.tagline}
        </div>
      </div>

      <span style={{
        alignSelf: "flex-start",
        padding: "3px 8px", borderRadius: 4,
        background: `rgba(${SAGE_RGB},0.12)`,
        fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.8px",
        color: SAGE, textTransform: "uppercase",
      }}>
        Coming soon
      </span>
    </button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function ConnectModal({ device, onClose }: { device: Provider; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hovCta, setHovCta] = useState(false);
  const timerRef = useRef<number | null>(null);
  const Icon = device.Icon;

  // Auto-close 2s after submit
  useEffect(() => {
    if (!submitted) return;
    timerRef.current = window.setTimeout(() => onClose(), 2000);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [submitted, onClose]);

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = () => {
    if (!email.trim() || submitted) return;
    setSubmitted(true);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "ig-fade-in 200ms ease both",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          maxWidth: 460, width: "100%",
          padding: 28, borderRadius: 16,
          background: "#0d0d0e",
          border: "0.5px solid rgba(235,230,216,0.15)",
          fontFamily: SANS,
          animation: "ig-pop-in 240ms cubic-bezier(0.32,0.72,0.34,1.01) both",
        }}
      >
        {/* Close X */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: 9,
            background: "transparent", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: TEXT_TER, cursor: "pointer",
          }}
        >
          <X />
        </button>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 14, margin: "0 auto 16px",
          background: `rgba(${SAGE_RGB},0.12)`,
          border: `0.5px solid rgba(${SAGE_RGB},0.4)`,
          color: SAGE,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={28} />
        </div>

        {/* Heading */}
        <h3 style={{
          fontFamily: SANS, fontSize: 22, fontWeight: 500, color: TEXT,
          margin: "0 0 12px", textAlign: "center", letterSpacing: "-0.2px",
        }}>
          Coming soon
        </h3>

        {/* Body */}
        <p style={{
          fontFamily: SANS, fontSize: 13.5, color: TEXT_SEC,
          lineHeight: 1.6, margin: "0 0 20px", textAlign: "center",
        }}>
          NŪRA Companion for iOS is in development. It&apos;ll bring real-time syncing from your Apple Watch and other connected devices directly into your dashboard. Get notified the moment it launches.
        </p>

        {/* Email input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="you@example.com"
          disabled={submitted}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            background: SURFACE,
            border: `0.5px solid ${emailFocused ? `rgba(${SAGE_RGB},0.5)` : BORDER}`,
            fontFamily: SANS, fontSize: 14, color: TEXT,
            outline: "none", marginBottom: 12,
            transition: "border-color 200ms ease",
          }}
        />

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={submitted || !email.trim()}
          onMouseEnter={() => setHovCta(true)}
          onMouseLeave={() => setHovCta(false)}
          style={{
            width: "100%", height: 44, borderRadius: 11, border: "none",
            background: submitted
              ? `rgba(${SAGE_RGB},0.18)`
              : (!email.trim() ? `rgba(${SAGE_RGB},0.4)` : hovCta ? SAGE_HOV : SAGE),
            color: submitted ? SAGE : SAGE_ON,
            fontFamily: SANS, fontSize: 13.5, fontWeight: 500,
            cursor: submitted || !email.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 200ms ease",
          }}
        >
          {submitted ? (
            <>
              <Check size={14} />
              We&apos;ll let you know!
            </>
          ) : "Notify me"}
        </button>

        {/* Close link */}
        <button
          onClick={onClose}
          style={{
            display: "block", margin: "14px auto 0",
            background: "none", border: "none", padding: 0,
            fontFamily: SANS, fontSize: 12, color: TEXT_SEC, cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
