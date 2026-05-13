'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { saveOnboarding, type OnboardingData } from './actions';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = '#0d0d0e';
const TEXT = '#f0ebde';
const TEXT_SEC = 'rgba(235,230,216,0.55)';
const TEXT_TER = 'rgba(235,230,216,0.4)';
const BORDER = 'rgba(235,230,216,0.09)';
const SAGE = '#9bb0a5';
const SAGE_HOV = '#abc0b5';
const SAGE_ON = '#0d0d0e';
const SAGE_RGB = '155,176,165';
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ─── CSS keyframes (injected once) ───────────────────────────────────────────
const GLOBAL_CSS = `
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
  html, body { margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 0; }
  input::placeholder { color: rgba(235,230,216,0.3) !important; }
  textarea::placeholder { color: rgba(235,230,216,0.3) !important; }
  button:active { transform: scale(0.97) !important; }
`;

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function Icon({ children, color = 'currentColor' }: { children: React.ReactNode; color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const BoltIcon = () => <Icon><path d="M13 3L6 13h6l-2 9 10-12h-6l1.5-9z"/></Icon>;
const MoonIcon = () => <Icon><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></Icon>;
const YogaIcon = () => <Icon><circle cx="12" cy="4" r="1"/><path d="M9 10h6M9 10v8M15 10v8M9 18h6"/></Icon>;
const ScaleIcon = () => <Icon><path d="M12 3v18M5 8l-2 8h4l-2-8zM19 8l2 8h-4l2-8zM5 8h14"/></Icon>;
const SeedingIcon = () => <Icon><path d="M12 22V12M12 12c0 0-4-5-8-3s0 7 8 3M12 12c0 0 4-5 8-3s0 7-8 3"/></Icon>;
const DropletIcon = () => <Icon><path d="M12 2c0 0-8 11-8 14.5a8 8 0 0 0 16 0C20 13 12 2 12 2z"/></Icon>;
const ShieldIcon = () => <Icon><path d="M12 3l8 4v5c0 5.5-3.5 9.5-8 10.5C7.5 21.5 4 17.5 4 12V7z"/></Icon>;
const BrainIcon = () => <Icon><path d="M9 3a4.5 4.5 0 0 0 0 9h6a4.5 4.5 0 0 0 0-9M9 12v9M15 12v9M6 17h12"/></Icon>;
const SparklesIcon = () => <Icon><path d="M12 3l1.5 4.5h4.5l-3.5 2.5 1.5 4.5L12 12l-3.5 2.5 1.5-4.5L6.5 7.5H11L12 3zM4.5 3l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2zM19.5 17l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5.5-2z"/></Icon>;
const RunIcon = () => <Icon><circle cx="14" cy="4" r="1"/><path d="M7 17l4-4 2 2 4-4 3 3M8 12l2-5h6l-2 5"/></Icon>;

const GOALS = [
  { id: 'energy',    icon: <BoltIcon />,    label: 'Energy & fatigue' },
  { id: 'sleep',     icon: <MoonIcon />,    label: 'Sleep quality' },
  { id: 'stress',    icon: <YogaIcon />,    label: 'Stress & anxiety' },
  { id: 'hormones',  icon: <ScaleIcon />,   label: 'Hormone balance' },
  { id: 'gut',       icon: <SeedingIcon />, label: 'Gut health' },
  { id: 'detox',     icon: <DropletIcon />, label: 'Detox & cleanse' },
  { id: 'immune',    icon: <ShieldIcon />,  label: 'Immune support' },
  { id: 'mental',    icon: <BrainIcon />,   label: 'Mental clarity' },
  { id: 'skin',      icon: <SparklesIcon />,label: 'Skin & hair' },
  { id: 'perform',   icon: <RunIcon />,     label: 'Performance' },
];

const SYMPTOM_CHIPS = [
  'Brain fog', 'Low energy', 'Trouble sleeping',
  'Anxious', 'Bloating', 'Joint pain',
  'Headaches', 'Mood swings', 'Cravings',
];
const DIET_OPTIONS   = ['Whole foods', 'Standard', 'Keto', 'Vegetarian', 'Carnivore'];
const EXERCISE_OPTS  = ['Sedentary', 'Light', 'Moderate', 'Heavy'];
const SLEEP_OPTS     = ['<5h', '5-6h', '6-7h', '7-8h', '8+h'];
const STRESS_OPTS    = ['Low', 'Moderate', 'High', 'Very high'];

// ─── Shared sub-components ────────────────────────────────────────────────────
function StepQuestion({ text, active }: { text: string; active: boolean }) {
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

function Hint({ text }: { text: string }) {
  return <p style={{ fontSize: 14, color: TEXT_SEC, margin: '0 0 24px', lineHeight: 1.6, fontFamily: SANS }}>{text}</p>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '1.2px', color: TEXT_TER, textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>;
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', padding: '13px 16px',
        background: 'rgba(235,230,216,0.04)', border: `1.5px solid ${BORDER}`,
        borderRadius: 12, fontSize: 15, fontFamily: SANS, color: TEXT,
        outline: 'none', transition: 'border-color 200ms',
      }}
      onFocus={e => { e.currentTarget.style.borderColor = `rgba(${SAGE_RGB},0.45)`; }}
      onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
    />
  );
}

function SegmentedControl({ options, value, onChange }: {
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  const idx = Math.max(0, options.indexOf(value));
  const pct = (idx / options.length) * 100;
  const w = 100 / options.length;

  return (
    <div style={{
      position: 'relative', display: 'flex',
      background: 'rgba(235,230,216,0.04)', border: `1px solid ${BORDER}`,
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
          fontSize: 12, fontFamily: SANS, fontWeight: 500, cursor: 'pointer',
          position: 'relative', zIndex: 1,
          transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
        }}>{opt}</button>
      ))}
    </div>
  );
}

function ChipToggle({ label, selected, onToggle }: {
  label: string; selected: boolean; onToggle: () => void;
}) {
  return (
    <button onClick={onToggle} style={{
      padding: '7px 14px',
      background: selected ? SAGE : 'rgba(235,230,216,0.05)',
      border: `1px solid ${selected ? SAGE : BORDER}`,
      borderRadius: 20, fontSize: 13, fontFamily: SANS, fontWeight: 500,
      color: selected ? SAGE_ON : TEXT_SEC, cursor: 'pointer',
      transform: selected ? 'scale(1.06)' : 'none',
      transition: 'all 150ms ease', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function GoalCard({ goal, selected, onSelect, shaking }: {
  goal: typeof GOALS[0]; selected: boolean; onSelect: () => void; shaking: boolean;
}) {
  const baseTransform = selected ? 'translateY(-2px) scale(1.02)' : 'none';
  return (
    <div onClick={onSelect} style={{
      position: 'relative', padding: '16px 12px', borderRadius: 14, cursor: 'pointer',
      border: `1.5px solid ${selected ? `rgba(${SAGE_RGB},0.5)` : BORDER}`,
      background: selected ? `rgba(${SAGE_RGB},0.08)` : 'rgba(235,230,216,0.02)',
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

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {Array.from({ length: 6 }, (_, i) => {
        const done = i + 1 < step;
        const curr = i + 1 === step;
        return (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99, overflow: 'hidden',
            background: done ? SAGE : curr ? `rgba(${SAGE_RGB},0.45)` : 'rgba(235,230,216,0.07)',
            position: 'relative',
          }}>
            {curr && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(90deg, transparent, rgba(${SAGE_RGB},0.5), transparent)`,
                animation: 'shimmer 1.8s ease-in-out infinite',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Canvas (step 1 background) ───────────────────────────────────────────────
function WelcomeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // init plexus particles
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

      // — plexus —
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${SAGE_RGB},0.38)`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 95) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(${SAGE_RGB},${(1 - d / 95) * 0.16})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }

      // — double helix —
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

      // strands
      ctx.lineWidth = 1;
      for (let i = 0; i < N - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(s1[i][0], s1[i][1]); ctx.lineTo(s1[i + 1][0], s1[i + 1][1]);
        ctx.strokeStyle = `rgba(${SAGE_RGB},0.22)`; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s2[i][0], s2[i][1]); ctx.lineTo(s2[i + 1][0], s2[i + 1][1]);
        ctx.strokeStyle = `rgba(${SAGE_RGB},0.22)`; ctx.stroke();
      }

      // rung lines every other dot
      ctx.lineWidth = 0.7;
      for (let i = 0; i < N; i += 2) {
        const [x1, y1] = s1[i]; const [x2, y2] = s2[i];
        const sep = Math.abs(x1 - x2);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(${SAGE_RGB},${(sep / (2 * amp)) * 0.4})`; ctx.stroke();
      }

      // dots
      for (let i = 0; i < N; i++) {
        const [x1, y1, d1] = s1[i]; const [x2, y2, d2] = s2[i];
        ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${SAGE_RGB},${0.35 + d1 * 0.55})`; ctx.fill();
        ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${SAGE_RGB},${0.35 + d2 * 0.55})`; ctx.fill();
      }

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
    }} />
  );
}

// ─── Step components ──────────────────────────────────────────────────────────
function Step1({ onNext, animKey }: { onNext: () => void; animKey: number }) {
  const [hover, setHover] = useState(false);
  return (
    <div key={animKey} style={{
      position: 'relative', minWidth: '100%', minHeight: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 32px 56px', overflow: 'hidden',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <WelcomeCanvas />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
        {/* Logo */}
        <div style={{ position: 'relative', width: 88, height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(155,176,165,0.25)', animation: 'ripple 2.8s ease-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(155,176,165,0.15)', animation: 'ripple 2.8s ease-out 1.4s infinite' }} />
          <div style={{
            width: 88, height: 88, borderRadius: '50%', background: BG,
            border: '0.5px solid rgba(155,176,165,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'heartbeat 2.8s ease-in-out infinite', position: 'relative', zIndex: 1,
          }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 19, color: '#ffffff' }}>nūra</span>
          </div>
        </div>
        {/* Title */}
        <h1 style={{ fontSize: 30, fontWeight: 500, color: TEXT, fontFamily: SANS, margin: '0 0 12px', letterSpacing: '-0.6px', lineHeight: 1.2 }}>
          Hi, I&apos;m NŪRA
        </h1>
        {/* Sub */}
        <p style={{ fontSize: 14, color: TEXT_SEC, maxWidth: 270, margin: '0 auto 36px', lineHeight: 1.65, fontFamily: SANS }}>
          Your AI companion for natural wellness. Let me get to know you — takes 90 seconds.
        </p>
        {/* CTA */}
        <button
          onClick={onNext}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 28px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: hover ? SAGE_HOV : SAGE, color: SAGE_ON,
            fontFamily: SANS, fontSize: 15, fontWeight: 600,
            transition: 'background 200ms',
          }}
        >
          Let&apos;s begin
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </button>
        {/* Sign in */}
        <div style={{ marginTop: 20, fontSize: 13, color: TEXT_TER, fontFamily: SANS }}>
          Already a member?{' '}
          <a href="/auth" style={{ color: SAGE, textDecoration: 'none', fontWeight: 500 }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}

function Step2({ state, update, animKey }: {
  state: OnboardingData; update: (k: keyof OnboardingData, v: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <StepQuestion text="Let's start with the basics." active />
      <Hint text="A few details so I can personalize for you." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <FieldLabel>Preferred name</FieldLabel>
          <TextInput value={state.name} onChange={v => update('name', v)} placeholder="What should I call you?" />
        </div>
        <div>
          <FieldLabel>Date of birth</FieldLabel>
          <TextInput value={state.dob} onChange={v => update('dob', v)} placeholder="MM/DD/YYYY" />
        </div>
        <div>
          <FieldLabel>Biological sex</FieldLabel>
          <SegmentedControl options={['Male', 'Female', 'Other']} value={state.sex} onChange={v => update('sex', v)} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Height</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TextInput value={state.height_ft} onChange={v => update('height_ft', v)} placeholder="ft" type="number" />
              </div>
              <div style={{ flex: 1 }}>
                <TextInput value={state.height_in} onChange={v => update('height_in', v)} placeholder="in" type="number" />
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Weight (lbs)</FieldLabel>
            <TextInput value={state.weight} onChange={v => update('weight', v)} placeholder="lbs" type="number" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3({ goals, onToggle, animKey }: {
  goals: string[]; onToggle: (id: string) => void; animKey: number;
}) {
  const [shake, setShake] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    if (!goals.includes(id) && goals.length >= 3) {
      setShake(id);
      setTimeout(() => setShake(null), 350);
      return;
    }
    onToggle(id);
  }, [goals, onToggle]);

  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, marginBottom: 6, letterSpacing: '-0.3px' }}>
        What do you want to focus on?
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: TEXT_SEC, fontFamily: SANS }}>Pick up to 3 — what matters most right now.</span>
        <span style={{
          fontSize: 11, fontFamily: MONO, letterSpacing: '0.5px',
          padding: '4px 10px', borderRadius: 20,
          background: goals.length === 3 ? `rgba(${SAGE_RGB},0.18)` : 'rgba(235,230,216,0.06)',
          color: goals.length === 3 ? SAGE : TEXT_TER,
          border: `1px solid ${goals.length === 3 ? `rgba(${SAGE_RGB},0.35)` : BORDER}`,
          transition: 'all 250ms ease', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {goals.length} / 3
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {GOALS.map(g => (
          <GoalCard key={g.id} goal={g} selected={goals.includes(g.id)}
            onSelect={() => handleToggle(g.id)} shaking={shake === g.id} />
        ))}
      </div>
    </div>
  );
}

function Step4({ state, update, toggleChip, animKey }: {
  state: OnboardingData;
  update: (k: keyof OnboardingData, v: string) => void;
  toggleChip: (chip: string) => void;
  animKey: number;
}) {
  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, marginBottom: 6, letterSpacing: '-0.3px' }}>
        What&apos;s bothering you most?
      </div>
      <Hint text="Tap a chip or describe it in your own words." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {SYMPTOM_CHIPS.map(chip => (
          <ChipToggle key={chip} label={chip}
            selected={state.symptom_chips.includes(chip)}
            onToggle={() => toggleChip(chip)} />
        ))}
      </div>
      <textarea value={state.symptoms_text} onChange={e => update('symptoms_text', e.target.value)}
        placeholder="Tell me what's been off lately..."
        style={{
          width: '100%', minHeight: 110, padding: '13px 16px',
          background: 'rgba(235,230,216,0.04)', border: `1.5px solid ${BORDER}`,
          borderRadius: 12, fontSize: 14, fontFamily: SANS, color: TEXT,
          outline: 'none', resize: 'none', lineHeight: 1.6,
          transition: 'border-color 200ms',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = `rgba(${SAGE_RGB},0.45)`; }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
      />
    </div>
  );
}

function Step5({ state, update, animKey }: {
  state: OnboardingData; update: (k: keyof OnboardingData, v: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, marginBottom: 20, letterSpacing: '-0.3px' }}>
        Tell me about your lifestyle.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <FieldLabel>Diet</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DIET_OPTIONS.map(d => (
              <ChipToggle key={d} label={d} selected={state.diet === d}
                onToggle={() => update('diet', state.diet === d ? '' : d)} />
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Exercise level</FieldLabel>
          <SegmentedControl options={EXERCISE_OPTS} value={state.exercise} onChange={v => update('exercise', v)} />
        </div>
        <div>
          <FieldLabel>Sleep duration</FieldLabel>
          <SegmentedControl options={SLEEP_OPTS} value={state.sleep} onChange={v => update('sleep', v)} />
        </div>
        <div>
          <FieldLabel>Stress level</FieldLabel>
          <SegmentedControl options={STRESS_OPTS} value={state.stress} onChange={v => update('stress', v)} />
        </div>
      </div>
    </div>
  );
}

function Step6({ state, animKey }: {
  state: OnboardingData; animKey: number;
}) {
  const displayGoals = state.goals.map(id => GOALS.find(g => g.id === id)?.label ?? id);
  const name = state.name || 'there';

  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', animation: 'step-in 450ms ease 200ms both',
    }}>
      {/* Bounce-in check circle */}
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

      <h2 style={{ fontSize: 26, fontWeight: 600, color: TEXT, fontFamily: SANS, margin: '0 0 10px', letterSpacing: '-0.4px' }}>
        You&apos;re all set, {name}.
      </h2>
      <p style={{ fontSize: 14, color: TEXT_SEC, fontFamily: SANS, margin: '0 0 28px', lineHeight: 1.6 }}>
        Your personalized protocol is ready.
      </p>

      {displayGoals.length > 0 && (
        <div style={{
          width: '100%', background: 'rgba(235,230,216,0.04)', border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'left',
        }}>
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: SAGE, textTransform: 'uppercase', marginBottom: 12 }}>
            NŪRA FOCUS ON
          </div>
          <p style={{ fontSize: 13.5, color: TEXT_SEC, fontFamily: SANS, lineHeight: 1.7, margin: '0 0 14px' }}>
            Based on what you shared, I&apos;ll start with{' '}
            {displayGoals.map((g, i) => (
              <span key={g}>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                  background: `rgba(${SAGE_RGB},0.15)`, border: `1px solid rgba(${SAGE_RGB},0.3)`,
                  color: SAGE, fontSize: 12, fontWeight: 500, margin: '0 2px',
                }}>{g}</span>
                {i < displayGoals.length - 1 ? ', ' : ''}
              </span>
            ))}
            . Expect daily protocols, supplement guidance, and check-ins tuned to where you are right now.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main onboarding page ─────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [animKeys, setAnimKeys] = useState([1, 1, 1, 1, 1, 1]);
  const [submitting, setSubmitting] = useState(false);
  const [hovCta, setHovCta] = useState(false);
  const [state, setState] = useState<OnboardingData>({
    name: '', dob: '', sex: 'Female', height_ft: '5', height_in: '7',
    weight: '', goals: [], symptoms_text: '', symptom_chips: [],
    diet: '', exercise: 'Moderate', sleep: '7-8h', stress: 'Moderate',
  });

  // Prefill name from user profile
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const name = (user.user_metadata?.name || user.user_metadata?.full_name || '') as string;
      if (name) setState(prev => ({ ...prev, name }));
      supabase.from('profiles').select('full_name').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.full_name) setState(prev => ({ ...prev, name: data.full_name as string }));
        });
    });
  }, []);

  const update = useCallback((k: keyof OnboardingData, v: string) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const toggleGoal = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.includes(id)
        ? prev.goals.filter(g => g !== id)
        : [...prev.goals, id],
    }));
  }, []);

  const toggleChip = useCallback((chip: string) => {
    setState(prev => ({
      ...prev,
      symptom_chips: prev.symptom_chips.includes(chip)
        ? prev.symptom_chips.filter(c => c !== chip)
        : [...prev.symptom_chips, chip],
    }));
  }, []);

  const goTo = useCallback((n: number) => {
    setStep(n);
    setAnimKeys(prev => { const next = [...prev]; next[n - 1]++; return next; });
  }, []);

  const next = useCallback(() => { if (step < 6) goTo(step + 1); }, [step, goTo]);
  const back = useCallback(() => { if (step > 1) goTo(step - 1); }, [step, goTo]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveOnboarding(state);
    } catch {
      // redirect() in server actions throws — navigation handled by framework
    }
  };

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    transform: `translateX(-${(step - 1) * 100}%)`,
    transition: 'transform 550ms cubic-bezier(.32,.72,.34,1.01)',
    willChange: 'transform',
  };

  const slideStyle: React.CSSProperties = {
    minWidth: '100%', width: '100%', flexShrink: 0,
    minHeight: '100%', overflowY: 'auto',
  };

  const stepLabel = String(step).padStart(2, '0') + ' / 06';

  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ width: '100%', maxWidth: 480, flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        {/* Top bar */}
        <div style={{ paddingTop: 20, paddingBottom: 0, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: TEXT_TER }}>
              {stepLabel}
            </span>
          </div>
          <ProgressBar step={step} />
        </div>

        {/* Slide track */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={trackStyle}>
            <div style={slideStyle}>
              <Step1 onNext={next} animKey={animKeys[0]} />
            </div>
            <div style={slideStyle}>
              <Step2 state={state} update={update} animKey={animKeys[1]} />
            </div>
            <div style={slideStyle}>
              <Step3 goals={state.goals} onToggle={toggleGoal} animKey={animKeys[2]} />
            </div>
            <div style={slideStyle}>
              <Step4 state={state} update={update} toggleChip={toggleChip} animKey={animKeys[3]} />
            </div>
            <div style={slideStyle}>
              <Step5 state={state} update={update} animKey={animKeys[4]} />
            </div>
            <div style={slideStyle}>
              <Step6 state={state} animKey={animKeys[5]} />
            </div>
          </div>
        </div>

        {/* Bottom controls (steps 2-6) */}
        {step > 1 && (
          <div style={{ flexShrink: 0, paddingBottom: 40 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Back */}
              <button onClick={back} style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(235,230,216,0.06)', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: TEXT_SEC,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M11 6l-6 6 6 6"/>
                </svg>
              </button>

              {/* CTA */}
              {step < 6 ? (
                <button
                  onClick={next}
                  onMouseEnter={() => setHovCta(true)}
                  onMouseLeave={() => setHovCta(false)}
                  style={{
                    flex: 1, height: 50, borderRadius: 14, border: 'none', cursor: 'pointer',
                    background: hovCta ? SAGE_HOV : SAGE, color: SAGE_ON,
                    fontFamily: SANS, fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'background 200ms',
                  }}
                >
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  onMouseEnter={() => setHovCta(true)}
                  onMouseLeave={() => setHovCta(false)}
                  style={{
                    flex: 1, height: 50, borderRadius: 14, border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    background: hovCta && !submitting ? SAGE_HOV : SAGE,
                    color: SAGE_ON, fontFamily: SANS, fontSize: 15, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'background 200ms', opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Saving...' : 'Enter NŪRA'}
                  {!submitting && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Skip (steps 2-5) */}
            {step >= 2 && step <= 5 && (
              <button onClick={next} style={{
                display: 'block', width: '100%', marginTop: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: MONO, fontSize: 9, letterSpacing: '2px', color: TEXT_TER,
                textTransform: 'uppercase', textAlign: 'center', padding: '4px 0',
              }}>
                SKIP THIS STEP
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
