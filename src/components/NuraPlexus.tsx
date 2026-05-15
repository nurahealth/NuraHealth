"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "@/lib/themeStore";

interface Props {
  opacity?: number;
  particleCount?: number;
}

export default function NuraPlexus({ opacity = 0.3, particleCount = 22 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

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
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.05 + Math.random() * 0.13),
      r: 0.6 + Math.random() * 1.2,
    }));

    // Canvas can't read CSS vars — resolve concrete sage RGB + bump opacity
    // slightly in light mode for visibility against cream.
    const sageRgb = theme === "light" ? "125,147,133" : "155,176,165";
    const particleAlpha = theme === "light" ? 0.55 : 0.35;
    const linkAlphaMax = theme === "light" ? 0.20 : 0.12;

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
        ctx.fillStyle = `rgba(${sageRgb},${particleAlpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${sageRgb},${(1 - d / 100) * linkAlphaMax})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [particleCount, theme]);

  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity }}
    />
  );
}
