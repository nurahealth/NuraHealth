"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSidebar } from "@/lib/sidebarStore";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const TEXT_SEC = "rgba(235,230,216,0.55)";
const BORDER = "rgba(235,230,216,0.09)";
const SURFACE = "rgba(235,230,216,0.04)";
const SAGE = "#9bb0a5";
const SAGE_RGB = "155,176,165";
const SANS = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

// ── Plexus canvas (subtle, 30% opacity backdrop) ─────────────────────────────
function PlexusBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let W = window.innerWidth, H = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      const c = canvas.getContext("2d"); if (c) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    const ctx = canvas.getContext("2d")!;
    const particles = Array.from({ length: 22 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.14,
      vy: -(0.06 + Math.random() * 0.14),
      r: 0.6 + Math.random() * 1.2,
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${SAGE_RGB},0.38)`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${SAGE_RGB},${(1 - d / 110) * 0.12})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.3 }} />
  );
}

export default function IntegrationsPage() {
  const router = useRouter();
  const openSidebar = useSidebar((s) => s.open);

  const [initial, setInitial] = useState("?");
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth"); return; }
      const meta = user.user_metadata as { name?: string; full_name?: string } | undefined;
      const ch = (meta?.name ?? meta?.full_name ?? user.email ?? "?").trim().charAt(0).toUpperCase();
      setInitial(ch);
    });
  }, [router]);

  return (
    <div style={{ minHeight: "100dvh", background: BG, position: "relative", overflow: "hidden", fontFamily: SANS, display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
      `}</style>

      <PlexusBg />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 3, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top), 16px) 18px 0",
      }}>
        <button
          onClick={openSidebar}
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
          {initial}
        </button>
      </header>

      {/* Centered content */}
      <main style={{
        position: "relative", zIndex: 2, flex: 1,
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 420 }}>
          {/* ti-device-watch sage icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: "0 auto 22px",
            background: `rgba(${SAGE_RGB},0.1)`, border: `0.5px solid rgba(${SAGE_RGB},0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: SAGE,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="6" width="12" height="12" rx="3"/>
              <path d="M9 4l1-2h4l1 2M9 20l1 2h4l1-2"/>
            </svg>
          </div>

          <h1 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 500, color: TEXT, margin: "0 0 14px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
            Integrations
          </h1>

          <p style={{ fontSize: 14, color: TEXT_SEC, lineHeight: 1.65, margin: 0 }}>
            Connect Oura, Apple Health, Fitbit, Whoop and more — coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
