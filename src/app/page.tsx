"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#0d0d0e";
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

const PROMPTS = [
  "Ask NŪRA anything...",
  "Snap a photo of your supplements...",
  "Tell me how you're feeling...",
  "Describe what's been off lately...",
  "Hold to speak — NŪRA listens.",
];

const BoltIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 3L6 13h6l-2 9 10-12h-6l1.5-9z"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
  </svg>
);
const SeedingIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V12M12 12c0 0-4-5-8-3s0 7 8 3M12 12c0 0 4-5 8-3s0 7-8 3"/>
  </svg>
);

const CHIPS: { icon: React.ReactNode; text: string }[] = [
  { icon: <BoltIcon />,    text: "What helps with low energy in the afternoon?" },
  { icon: <MoonIcon />,    text: "Build me a wind-down routine for better sleep" },
  { icon: <SeedingIcon />, text: "How do I support gut health naturally?" },
];

// ── Plexus canvas (pollen drift) ──────────────────────────────────────────────
function PlexusCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      const ctx2 = canvas.getContext("2d");
      if (ctx2) ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;

    const particles = Array.from({ length: 26 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.08 + Math.random() * 0.18),
      r: 0.6 + Math.random() * 1.4,
    }));

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${SAGE_RGB},0.42)`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 105) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${SAGE_RGB},${(1 - d / 105) * 0.14})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}

// ── Web Speech types (browser-only, not in DOM lib by default) ────────────────
interface SpeechRecResult { transcript: string }
interface SpeechRecResults { length: number; [i: number]: { 0: SpeechRecResult; isFinal: boolean } }
interface SpeechRecEvent { resultIndex: number; results: SpeechRecResults }
interface SpeechRecInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type SpeechRecCtor = new () => SpeechRecInstance;

// ── Chip ──────────────────────────────────────────────────────────────────────
function ChipRow({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", textAlign: "left",
        background: hov ? SURFACE_HOV : SURFACE,
        border: `0.5px solid ${hov ? `rgba(${SAGE_RGB},0.3)` : BORDER}`,
        color: TEXT, fontFamily: SANS, fontSize: 13,
        padding: "11px 16px", borderRadius: 8, cursor: "pointer",
        transition: "background 180ms, border-color 180ms",
      }}
    >
      <span style={{ display: "flex", lineHeight: 0, flexShrink: 0 }}>{icon}</span>
      <span>{text}</span>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [initial, setInitial] = useState("");
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovAttach, setHovAttach] = useState(false);
  const [hovMic, setHovMic] = useState(false);
  const [hovSend, setHovSend] = useState(false);
  const [recording, setRecording] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [phShow, setPhShow] = useState(true);
  const recRef = useRef<SpeechRecInstance | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      const meta = user.user_metadata as { name?: string; full_name?: string } | undefined;
      const fromMeta = meta?.name ?? meta?.full_name ?? "";
      if (fromMeta) setInitial(fromMeta.trim().charAt(0).toUpperCase());
      supabase.from("profiles").select("full_name").eq("id", user.id).single()
        .then(({ data }) => {
          const fn = (data?.full_name as string | null | undefined) ?? "";
          if (fn) setInitial(fn.trim().charAt(0).toUpperCase());
          else if (!fromMeta) setInitial((user.email ?? "?").trim().charAt(0).toUpperCase());
        });
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhShow(false);
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PROMPTS.length);
        setPhShow(true);
      }, 350);
    }, 3000);
    return () => clearInterval(cycle);
  }, []);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try { sessionStorage.setItem("nura.initialMessage", trimmed); } catch {}
    router.push(`/chat?q=${encodeURIComponent(trimmed)}`);
  }, [router]);

  const onSubmit = () => send(value);
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(value); }
  };

  const onMicClick = () => {
    if (recording) { recRef.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) { alert("Voice input not supported in this browser"); return; }

    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      if (transcript) setValue(prev => (prev ? prev + " " : "") + transcript.trim());
    };
    rec.onend = () => { setRecording(false); recRef.current = null; };
    rec.onerror = () => { setRecording(false); recRef.current = null; };
    recRef.current = rec;
    setRecording(true);
    rec.start();
  };

  const onAttachClick = () => fileInputRef.current?.click();

  const hasValue = value.length > 0;
  const phHidden = focused || hasValue || !phShow;

  if (!authChecked) {
    return <div style={{ minHeight: "100dvh", background: BG }} />;
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, position: "relative", overflow: "hidden", fontFamily: SANS, display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,76,92,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(255,76,92,0); }
        }
        .nura-content {
          width: 100%;
          max-width: 340px;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .nura-greeting {
          font-size: 30px;
          line-height: 1.25;
          letter-spacing: -0.3px;
        }
        .nura-subgreeting {
          font-size: 13px;
          line-height: 1.5;
        }
        @media (min-width: 640px) {
          .nura-content { max-width: 560px; padding: 0 32px; }
          .nura-greeting { font-size: 40px; line-height: 1.2; letter-spacing: -0.5px; }
          .nura-subgreeting { font-size: 15px; line-height: 1.6; }
        }
        @media (min-width: 1024px) {
          .nura-content { max-width: 680px; padding: 0 40px; }
          .nura-greeting { font-size: 52px; line-height: 1.15; letter-spacing: -0.8px; }
          .nura-subgreeting { font-size: 15px; line-height: 1.65; }
        }
      `}</style>

      <PlexusCanvas />

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 3, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top), 16px) 18px 0",
      }}>
        <button
          onClick={() => router.push("/settings")}
          aria-label="Menu"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: SURFACE, border: `0.5px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: TEXT_SEC,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 500, color: SAGE, letterSpacing: "0.3px" }}>
          nūra
        </span>

        <button
          onClick={() => router.push("/settings")}
          aria-label="Profile"
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `rgba(${SAGE_RGB},0.18)`, border: `0.5px solid rgba(${SAGE_RGB},0.35)`,
            color: SAGE, fontFamily: SANS, fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          {initial || "?"}
        </button>
      </header>

      {/* Centered content */}
      <main style={{
        position: "relative", zIndex: 2,
        flex: 1,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "32px 0",
      }}>
        <div className="nura-content">
        <h1 className="nura-greeting" style={{
          fontFamily: SERIF, fontWeight: 500,
          color: TEXT, margin: "0 0 14px",
        }}>
          How can I help you on your{" "}
          <em style={{ fontStyle: "italic", color: SAGE, fontWeight: 500 }}>wellness</em>
          {" "}journey?
        </h1>

        <p className="nura-subgreeting" style={{ color: TEXT_SEC, margin: "0 0 24px" }}>
          Type, snap, or speak — NŪRA understands all three.
        </p>

        {/* Composer pill */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            background: focused ? "rgba(235,230,216,0.06)" : SURFACE,
            border: `0.5px solid ${focused ? `rgba(${SAGE_RGB},0.5)` : "rgba(235,230,216,0.12)"}`,
            borderRadius: 14, padding: "6px 6px 6px 8px",
            transition: "background 200ms, border-color 200ms",
          }}>
            <button
              onClick={onAttachClick}
              onMouseEnter={() => setHovAttach(true)}
              onMouseLeave={() => setHovAttach(false)}
              aria-label="Attach photo"
              style={{
                width: 38, height: 38, borderRadius: 9, border: "none",
                background: hovAttach ? `rgba(${SAGE_RGB},0.08)` : "transparent",
                color: hovAttach ? SAGE : TEXT_SEC,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 200ms",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5l-9.5 9.5a5.5 5.5 0 0 1-7.78-7.78L13.5 3.5a3.5 3.5 0 0 1 4.95 4.95l-9.5 9.5a1.5 1.5 0 0 1-2.12-2.12L15 7.5"/>
              </svg>
            </button>

            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={onKeyDown}
                placeholder=" "
                style={{
                  width: "100%", padding: "11px 0", background: "transparent",
                  border: "none", outline: "none",
                  fontSize: 14, color: TEXT, fontFamily: SANS,
                }}
              />
              <div style={{
                position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                fontSize: 14, color: "rgba(235,230,216,0.35)", fontFamily: SANS,
                pointerEvents: "none", whiteSpace: "nowrap", overflow: "hidden",
                maxWidth: "100%",
                opacity: phHidden ? 0 : 1,
                transition: "opacity 350ms ease",
              }}>
                {PROMPTS[placeholderIdx]}
              </div>
            </div>

            <button
              onClick={onMicClick}
              onMouseEnter={() => setHovMic(true)}
              onMouseLeave={() => setHovMic(false)}
              aria-label={recording ? "Stop recording" : "Voice input"}
              style={{
                width: 38, height: 38, borderRadius: 9, border: "none",
                background: recording ? "rgba(255,76,92,0.12)" : hovMic ? `rgba(${SAGE_RGB},0.08)` : "transparent",
                color: recording ? "#ff4c5c" : hovMic ? SAGE : TEXT_SEC,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, transition: "all 200ms",
                animation: recording ? "mic-pulse 1.4s ease-in-out infinite" : "none",
              }}
            >
              {recording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="9" y="3" width="6" height="12" rx="3"/>
                  <path d="M19 11a7 7 0 0 1-14 0M12 18v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="3" width="6" height="12" rx="3"/>
                  <path d="M19 11a7 7 0 0 1-14 0M12 18v3M8 21h8"/>
                </svg>
              )}
            </button>

            <button
              onClick={onSubmit}
              onMouseEnter={() => setHovSend(true)}
              onMouseLeave={() => setHovSend(false)}
              onMouseDown={e => { e.currentTarget.style.transform = "scale(0.94)"; }}
              onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
              aria-label="Send"
              style={{
                width: 40, height: 40, borderRadius: 11, border: "none",
                background: hovSend ? SAGE_HOV : SAGE, color: SAGE_ON,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0, marginLeft: 2,
                transition: "background 200ms, transform 100ms",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>

          {/* Prompt chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 4 }}>
            {CHIPS.map((chip, i) => (
              <ChipRow key={i} icon={chip.icon} text={chip.text} onClick={() => send(chip.text)} />
            ))}
          </div>
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 2, flexShrink: 0,
        textAlign: "center",
        padding: "16px 22px max(env(safe-area-inset-bottom), 18px)",
        fontSize: 10, color: TEXT_TER, fontFamily: SANS,
      }}>
        NŪRA provides wellness information, not medical advice.
      </footer>
    </div>
  );
}
