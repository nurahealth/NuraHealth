'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Shared onboarding kit — the exact primitives, animations, and design tokens
// used by the main NŪRA onboarding flow, extracted so other guided flows (e.g.
// the Fitness onboarding) reuse the identical look and motion. Nothing here is
// flow-specific. Keep byte-for-byte parity with the originals.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useThemeStore } from '@/lib/themeStore';

// ─── Design tokens ────────────────────────────────────────────────────────────
export const BG = 'var(--nura-bg)';
export const TEXT = 'var(--nura-text-primary)';
export const TEXT_SEC = 'var(--nura-text-secondary)';
export const TEXT_TER = 'var(--nura-text-tertiary)';
export const BORDER = 'var(--nura-border)';
export const SAGE = 'var(--nura-sage)';
export const SAGE_HOV = 'var(--nura-sage-hover)';
export const SAGE_ON = 'var(--nura-bg)';
export const SAGE_RGB = 'var(--nura-sage-rgb)';
export const SANS = "var(--font-inter), system-ui, sans-serif";
export const MONO = "'JetBrains Mono', monospace";

// ─── CSS keyframes (injected once per flow) ──────────────────────────────────
export const GLOBAL_CSS = `
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.04); }
  }
  @keyframes ripple {
    0%   { transform: scale(0.92); opacity: 0.7; }
    100% { transform: scale(1.45); opacity: 0; }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-200%); }
    100% { transform: translateX(200%); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes check-draw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes bounce-in {
    0%   { transform: scale(0); }
    70%  { transform: scale(1.15); }
    100% { transform: scale(1); }
  }
  @keyframes step-in {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0) translateY(-2px) scale(1.02); }
    20%, 60%  { transform: translateX(-5px) translateY(-2px) scale(1.02); }
    40%, 80%  { transform: translateX(5px) translateY(-2px) scale(1.02); }
  }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  
  ::-webkit-scrollbar { width: 0; }
  input::placeholder { color: rgba(var(--nura-fg-rgb),0.3) !important; }
  textarea::placeholder { color: rgba(var(--nura-fg-rgb),0.3) !important; }
  button:active { transform: scale(0.97) !important; }
`;

// ─── SVG icon wrapper ─────────────────────────────────────────────────────────
export function Icon({ children, color = 'currentColor' }: { children: React.ReactNode; color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// ─── Typed question heading + blinking cursor ────────────────────────────────
export function StepQuestion({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setShown(''); setDone(false); return; }
    setShown(''); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) { setDone(true); clearInterval(iv); }
    }, 32);
    return () => clearInterval(iv);
  }, [text, active]);

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
      <span style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, lineHeight: 1.3 }}>
        {shown}
      </span>
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '1.1em',
          background: SAGE, animation: 'blink 0.9s step-end infinite',
          verticalAlign: 'text-bottom', borderRadius: 1,
        }} />
      )}
    </div>
  );
}

export function Hint({ text }: { text: string }) {
  return <p style={{ fontSize: 14, color: TEXT_SEC, margin: '0 0 24px', lineHeight: 1.6, fontFamily: SANS }}>{text}</p>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '1.2px', color: TEXT_TER, textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>;
}

export function TextInput({ value, onChange, placeholder, type = 'text', min, max }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; min?: number; max?: number;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      min={min} max={max}
      style={{
        width: '100%', padding: '13px 16px',
        background: 'var(--nura-surface)', border: `1.5px solid ${BORDER}`,
        borderRadius: 12, fontSize: 15, fontFamily: SANS, color: TEXT,
        outline: 'none', transition: 'border-color 200ms',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = `rgba(var(--nura-sage-rgb),0.45)`; }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
    />
  );
}

export function SegmentedControl({ options, value, onChange, fontSize = 12 }: {
  options: string[]; value: string; onChange: (v: string) => void; fontSize?: number;
}) {
  const idx = Math.max(0, options.indexOf(value));
  const pct = (idx / options.length) * 100;
  const w = 100 / options.length;

  return (
    <div style={{
      position: 'relative', display: 'flex',
      background: 'var(--nura-surface)', border: `1px solid ${BORDER}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 3, bottom: 3,
        width: `calc(${w}% - 6px)`,
        left: `calc(${pct}% + 3px)`,
        background: SAGE, borderRadius: 9,
        transition: 'left 200ms cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'none',
      }} />
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex: 1, padding: '11px 4px', background: 'none', border: 'none',
          color: value === opt ? SAGE_ON : TEXT_SEC,
          fontSize, fontFamily: SANS, fontWeight: 500, cursor: 'pointer',
          position: 'relative', zIndex: 1, lineHeight: 1.2,
          transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
        }}>{opt}</button>
      ))}
    </div>
  );
}

// 2-row segmented grid for >4 options that don't fit a single sliding-thumb row
export function GridSegmented({ options, value, onChange, columns = 3 }: {
  options: string[]; value: string; onChange: (v: string) => void; columns?: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 6 }}>
      {options.map(opt => {
        const selected = value === opt;
        return (
          <button key={opt} onClick={() => onChange(selected ? '' : opt)} style={{
            padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
            background: selected ? SAGE : 'var(--nura-surface)',
            border: `1px solid ${selected ? SAGE : BORDER}`,
            color: selected ? SAGE_ON : TEXT_SEC,
            fontSize: 12, fontFamily: SANS, fontWeight: 500, lineHeight: 1.25,
            transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
          }}>{opt}</button>
        );
      })}
    </div>
  );
}

export function ChipToggle({ label, selected, onToggle }: {
  label: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} style={{
      padding: '7px 14px',
      background: selected ? SAGE : 'rgba(var(--nura-bg-tint-rgb),0.05)',
      border: `1px solid ${selected ? SAGE : BORDER}`,
      borderRadius: 20, fontSize: 13, fontFamily: SANS, fontWeight: 500,
      color: selected ? SAGE_ON : TEXT_SEC, cursor: 'pointer',
      transform: selected ? 'scale(1.06)' : 'none',
      transition: 'all 150ms ease', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 6px 5px 12px', borderRadius: 18,
      border: `1px solid rgba(var(--nura-sage-rgb),0.45)`,
      background: 'var(--nura-tint-accent)',
      fontSize: 12, fontFamily: SANS, color: "var(--nura-accent-text)", fontWeight: 500,
    }}>
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: SAGE, padding: 2, display: 'inline-flex',
      }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6l-12 12"/>
        </svg>
      </button>
    </span>
  );
}

export function TagInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (idx: number) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const v = draft.trim().replace(/,+$/, '').trim();
    if (v && !tags.some(t => t.toLowerCase() === v.toLowerCase())) onAdd(v);
    setDraft('');
  };

  return (
    <div>
      <input
        type="text"
        value={draft}
        onChange={e => {
          const v = e.target.value;
          if (v.includes(',')) {
            const t = v.replace(/,/g, '').trim();
            if (t && !tags.some(x => x.toLowerCase() === t.toLowerCase())) onAdd(t);
            setDraft('');
          } else {
            setDraft(v);
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
            onRemove(tags.length - 1);
          }
        }}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '13px 16px',
          background: 'var(--nura-surface)', border: `1.5px solid ${BORDER}`,
          borderRadius: 12, fontSize: 15, fontFamily: SANS, color: TEXT,
          outline: 'none', transition: 'border-color 200ms',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = `rgba(var(--nura-sage-rgb),0.45)`; }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; commit(); }}
      />
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {tags.map((t, i) => <RemovableChip key={`${t}-${i}`} label={t} onRemove={() => onRemove(i)} />)}
        </div>
      )}
    </div>
  );
}

export function AddOtherInput({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft('');
  };
  return (
    <input
      type="text"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
      onBlur={commit}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '11px 14px',
        background: 'var(--nura-surface)', border: `1.5px solid ${BORDER}`,
        borderRadius: 12, fontSize: 13, fontFamily: SANS, color: TEXT,
        outline: 'none', transition: 'border-color 200ms',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = `rgba(var(--nura-sage-rgb),0.45)`; }}
    />
  );
}

// ─── Icon goal card with draw-in check (single- or multi-select) ─────────────
export interface GoalOption { id: string; icon: React.ReactNode; label: string }

export function GoalCard({ goal, selected, onSelect, shaking }: {
  goal: GoalOption; selected: boolean; onSelect: () => void; shaking: boolean;
}) {
  const baseTransform = selected ? 'translateY(-2px) scale(1.02)' : 'none';
  return (
    <div onClick={onSelect} style={{
      position: 'relative', padding: '16px 12px', borderRadius: 14, cursor: 'pointer',
      border: `1.5px solid ${selected ? `rgba(var(--nura-sage-rgb),0.5)` : BORDER}`,
      background: selected ? `rgba(var(--nura-sage-rgb),0.08)` : 'rgba(var(--nura-bg-tint-rgb),0.02)',
      transform: shaking ? undefined : baseTransform,
      transition: shaking ? 'none' : 'all 200ms ease',
      animation: shaking ? 'shake 300ms ease' : 'none',
    }}>
      {selected && (
        <div style={{
          position: 'absolute', top: 8, right: 8, width: 20, height: 20,
          borderRadius: '50%', background: SAGE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
            stroke={SAGE_ON} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-5" strokeDasharray="14" strokeDashoffset="14"
              style={{ animation: 'check-draw 280ms ease forwards' }} />
          </svg>
        </div>
      )}
      <div style={{ color: selected ? SAGE : TEXT_TER, marginBottom: 8, lineHeight: 0 }}>
        {goal.icon}
      </div>
      <div style={{ fontSize: 12, fontFamily: SANS, fontWeight: 500, color: selected ? TEXT : TEXT_SEC, lineHeight: 1.3 }}>
        {goal.label}
      </div>
    </div>
  );
}

// ─── Step container ──────────────────────────────────────────────────────────
// Stacks a step's content at the TOP of the slide (heading → fields → in-flow
// footer) so items group together, with any leftover space falling at the
// bottom. Content-height (no forced fill / centering) lets tall steps scroll
// within the slide. Shared so every step uses the same frame, not a one-off.
export const STEP_SHELL_STYLE: CSSProperties = {
  minWidth: '100%',
  display: 'flex', flexDirection: 'column',
  padding: '24px 0 0',
  animation: 'step-in 450ms ease 200ms both',
};

// Same frame, but also centers content horizontally (for the Done screen).
export const STEP_SHELL_CENTERED_STYLE: CSSProperties = {
  ...STEP_SHELL_STYLE,
  alignItems: 'center',
  textAlign: 'center',
};

// ─── Progress bar (one segment per step) ─────────────────────────────────────
export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i + 1 < step;
        const curr = i + 1 === step;
        return (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99, overflow: 'hidden',
            background: done ? SAGE : curr ? `rgba(var(--nura-sage-rgb),0.45)` : 'rgba(var(--nura-bg-tint-rgb),0.07)',
            position: 'relative',
          }}>
            {curr && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(90deg, transparent, rgba(var(--nura-sage-rgb),0.5), transparent)`,
                animation: 'shimmer 1.8s ease-in-out infinite',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── DNA helix + plexus canvas (welcome-step background) ─────────────────────
export function WelcomeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const sageRgb = theme === 'light' ? '125,147,133' : '155,176,165';
    const boost = theme === 'light' ? 1.5 : 1;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const particles = Array.from({ length: 28 }, () => {
      const a = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: Math.cos(a) * 0.25, vy: Math.sin(a) * 0.25,
        r: 0.5 + Math.random() * 1.1,
      };
    });

    let t = 0;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sageRgb},${0.38 * boost})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 95) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${sageRgb},${(1 - d / 95) * 0.16 * boost})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }

      const N = 22, helH = 260, amp = 62, freq = 2.4 * Math.PI;
      const cx = W / 2, cy = H / 2, top = cy - helH / 2;
      const s1: [number, number, number][] = [];
      const s2: [number, number, number][] = [];

      for (let i = 0; i < N; i++) {
        const phase = t * 0.6 + (i / (N - 1)) * freq;
        const y = top + (i / (N - 1)) * helH;
        const x1 = cx + amp * Math.cos(phase);
        const x2 = cx + amp * Math.cos(phase + Math.PI);
        const d1 = (Math.cos(phase) + 1) / 2;
        const d2 = (Math.cos(phase + Math.PI) + 1) / 2;
        s1.push([x1, y, d1]); s2.push([x2, y, d2]);
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < N - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(s1[i][0], s1[i][1]); ctx.lineTo(s1[i + 1][0], s1[i + 1][1]);
        ctx.strokeStyle = `rgba(${sageRgb},${0.22 * boost})`; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s2[i][0], s2[i][1]); ctx.lineTo(s2[i + 1][0], s2[i + 1][1]);
        ctx.strokeStyle = `rgba(${sageRgb},${0.22 * boost})`; ctx.stroke();
      }

      ctx.lineWidth = 0.7;
      for (let i = 0; i < N; i += 2) {
        const [x1, y1] = s1[i]; const [x2, y2] = s2[i];
        const sep = Math.abs(x1 - x2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${sageRgb},${(sep / (2 * amp)) * 0.4 * boost})`; ctx.stroke();
      }

      for (let i = 0; i < N; i++) {
        const [x1, y1, d1] = s1[i]; const [x2, y2, d2] = s2[i];
        ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sageRgb},${(0.35 + d1 * 0.55) * boost})`; ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${sageRgb},${(0.35 + d2 * 0.55) * boost})`; ctx.fill();
      }

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [theme]);

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
    }} />
  );
}

// ─── Done-screen bouncing check (sage circle + draw-in tick) ─────────────────
export function DoneCheck() {
  return (
    <div style={{
      width: 64, height: 64, borderRadius: '50%', background: SAGE,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 24, animation: 'bounce-in 600ms cubic-bezier(0.175,0.885,0.32,1.275) both',
    }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
        stroke={SAGE_ON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" strokeDasharray="26" strokeDashoffset="26"
          style={{ animation: 'check-draw 420ms ease 450ms both' }} />
      </svg>
    </div>
  );
}
