'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useThemeStore } from '@/lib/themeStore';
import { saveOnboarding, type OnboardingData } from './actions';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BG = 'var(--nura-bg)';
const TEXT = 'var(--nura-text-primary)';
const TEXT_SEC = 'var(--nura-text-secondary)';
const TEXT_TER = 'var(--nura-text-tertiary)';
const BORDER = 'var(--nura-border)';
const SAGE = 'var(--nura-sage)';
const SAGE_HOV = 'var(--nura-sage-hover)';
const SAGE_ON = 'var(--nura-bg)';
const SAGE_RGB = '155,176,165';
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const TOTAL_STEPS = 7;

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
  input::placeholder { color: rgba(var(--nura-fg-rgb),0.3) !important; }
  textarea::placeholder { color: rgba(var(--nura-fg-rgb),0.3) !important; }
  button:active { transform: scale(0.97) !important; }
`;

// ─── Unit conversion ──────────────────────────────────────────────────────────
function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 30.48 + inches * 2.54) * 10) / 10;
}
function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}
function cmToFtIn(cm: number): { ft: number; in: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - ft * 12);
  return { ft, in: inches };
}
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

// ─── DOB parsing + age ────────────────────────────────────────────────────────
function parseDob(dob: string): Date | null {
  const m = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}
function calculateAge(dob: string): number | null {
  const d = parseDob(dob);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const mDiff = now.getMonth() - d.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age <= 130 ? age : null;
}

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
const SLEEP_OPTS     = ['<5h', '5-6h', '6-7h', '7-8h', '8+h'];
const STRESS_OPTS    = ['Low', 'Moderate', 'High', 'Very high'];

const UNIT_OPTIONS = ['Imperial · ft / lbs', 'Metric · cm / kg'];

const ACTIVITY_OPTIONS = ['Sedentary', 'Lightly active', 'Moderately active', 'Very active', 'Athlete'];
const PREGNANCY_OPTIONS = ['Not pregnant', 'Pregnant', 'Trying to conceive', 'Breastfeeding', 'Prefer not to say'];
const NONE_CONDITION = 'None of these';
const CONDITION_CHIPS = [
  'Diabetes / pre-diabetes',
  "Thyroid (Hashimoto's, hypo/hyper)",
  'Heart disease',
  'Kidney disease',
  'Liver disease',
  'Autoimmune',
  'Cancer history',
  'GI / IBS / SIBO',
  'Hormonal imbalance',
  'Mental health (anxiety/depression)',
  NONE_CONDITION,
];

// ─── Local form state (superset of persisted OnboardingData) ─────────────────
interface FormState {
  unitSystem: 'imperial' | 'metric';
  name: string;
  dob: string;
  sex: string;
  height_ft: string;
  height_in: string;
  height_cm: string;
  weight_lbs: string;
  weight_kg: string;
  goals: string[];
  symptoms_text: string;
  symptom_chips: string[];
  diet: string;
  sleep: string;
  stress: string;
  activity_level: string;
  pregnancy_status: string;
  conditions: string[];
  medications: string[];
  allergies: string[];
}

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

function TextInput({ value, onChange, placeholder, type = 'text', min, max }: {
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

function SegmentedControl({ options, value, onChange, fontSize = 12 }: {
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
function GridSegmented({ options, value, onChange, columns = 3 }: {
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

function ChipToggle({ label, selected, onToggle }: {
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

function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 6px 5px 12px', borderRadius: 18,
      border: `1px solid rgba(var(--nura-sage-rgb),0.45)`,
      background: `rgba(var(--nura-sage-rgb),0.10)`,
      fontSize: 12, fontFamily: SANS, color: SAGE, fontWeight: 500,
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

function TagInput({ tags, onAdd, onRemove, placeholder }: {
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

function GoalCard({ goal, selected, onSelect, shaking }: {
  goal: typeof GOALS[0]; selected: boolean; onSelect: () => void; shaking: boolean;
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

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
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

// ─── Canvas (step 1 background) ───────────────────────────────────────────────
function WelcomeCanvas() {
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

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────
function Step1Welcome({ onNext, animKey }: { onNext: () => void; animKey: number }) {
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
        <h1 style={{ fontSize: 30, fontWeight: 500, color: TEXT, fontFamily: SANS, margin: '0 0 12px', letterSpacing: '-0.6px', lineHeight: 1.2 }}>
          Hi, I&apos;m NŪRA
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SEC, maxWidth: 270, margin: '0 auto 36px', lineHeight: 1.65, fontFamily: SANS }}>
          Your AI companion for natural wellness. Let me get to know you — takes 90 seconds.
        </p>
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
        <div style={{ marginTop: 20, fontSize: 13, color: TEXT_TER, fontFamily: SANS }}>
          Already a member?{' '}
          <a href="/auth" style={{ color: SAGE, textDecoration: 'none', fontWeight: 500 }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Basics ──────────────────────────────────────────────────────────
function Step2Basics({ state, update, animKey }: {
  state: FormState; update: (k: keyof FormState, v: string) => void; animKey: number;
}) {
  const isMetric = state.unitSystem === 'metric';
  const onUnit = (label: string) => {
    update('unitSystem', label.startsWith('Metric') ? 'metric' : 'imperial');
  };
  const unitLabel = isMetric ? UNIT_OPTIONS[1] : UNIT_OPTIONS[0];

  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <StepQuestion text="Let's start with the basics." active />
      <Hint text="A few details so I can personalize for you." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <FieldLabel>Units</FieldLabel>
          <SegmentedControl options={UNIT_OPTIONS} value={unitLabel} onChange={onUnit} fontSize={11} />
        </div>
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

        {!isMetric ? (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Height</FieldLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <TextInput value={state.height_ft} onChange={v => update('height_ft', v)} placeholder="ft" type="number" min={3} max={8} />
                </div>
                <div style={{ flex: 1 }}>
                  <TextInput value={state.height_in} onChange={v => update('height_in', v)} placeholder="in" type="number" min={0} max={11} />
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Weight (lbs)</FieldLabel>
              <TextInput value={state.weight_lbs} onChange={v => update('weight_lbs', v)} placeholder="150" type="number" min={50} max={700} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Height (cm)</FieldLabel>
              <TextInput value={state.height_cm} onChange={v => update('height_cm', v)} placeholder="175" type="number" min={90} max={250} />
            </div>
            <div style={{ flex: 1 }}>
              <FieldLabel>Weight (kg)</FieldLabel>
              <TextInput value={state.weight_kg} onChange={v => update('weight_kg', v)} placeholder="68" type="number" min={22} max={320} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Health profile (NEW) ─────────────────────────────────────────────
function Step3Health({ state, update, toggleCondition, addCondition, removeCondition, addMedication, removeMedication, addAllergy, removeAllergy, animKey }: {
  state: FormState;
  update: (k: keyof FormState, v: string) => void;
  toggleCondition: (c: string) => void;
  addCondition: (c: string) => void;
  removeCondition: (idx: number) => void;
  addMedication: (m: string) => void;
  removeMedication: (idx: number) => void;
  addAllergy: (a: string) => void;
  removeAllergy: (idx: number) => void;
  animKey: number;
}) {
  const age = calculateAge(state.dob);
  const sexLower = (state.sex || '').toLowerCase();
  const showPregnancy = sexLower === 'female' && age !== null && age >= 13 && age <= 55;

  const presetSelected = new Set(state.conditions.filter(c => CONDITION_CHIPS.includes(c)));
  const customConditions = state.conditions.filter(c => !CONDITION_CHIPS.includes(c));

  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <StepQuestion text="Let's keep things safe." active />
      <Hint text="This helps NŪRA personalize protocols safely. All fields skippable." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* AGE confirmation */}
        <div>
          <FieldLabel>Age</FieldLabel>
          {age !== null ? (
            <div style={{
              padding: '13px 16px', borderRadius: 12,
              background: `rgba(var(--nura-sage-rgb),0.08)`,
              border: `1px solid rgba(var(--nura-sage-rgb),0.25)`,
              fontSize: 15, fontFamily: SANS, color: TEXT,
            }}>
              You&apos;re {age} years old
            </div>
          ) : (
            <div style={{
              padding: '13px 16px', borderRadius: 12,
              background: 'var(--nura-surface)',
              border: `1.5px solid ${BORDER}`,
              fontSize: 14, fontFamily: SANS, color: TEXT_TER, fontStyle: 'italic',
            }}>
              Enter date of birth in Basics first
            </div>
          )}
        </div>

        {/* Activity level */}
        <div>
          <FieldLabel>Activity level</FieldLabel>
          <SegmentedControl options={ACTIVITY_OPTIONS} value={state.activity_level} onChange={v => update('activity_level', v)} fontSize={10} />
        </div>

        {/* Pregnancy status (conditional) */}
        {showPregnancy && (
          <div>
            <FieldLabel>Pregnancy status</FieldLabel>
            <GridSegmented options={PREGNANCY_OPTIONS} value={state.pregnancy_status} onChange={v => update('pregnancy_status', v)} columns={3} />
          </div>
        )}

        {/* Conditions */}
        <div>
          <FieldLabel>Any of these conditions?</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {CONDITION_CHIPS.map(c => (
              <ChipToggle key={c} label={c}
                selected={presetSelected.has(c)}
                onToggle={() => toggleCondition(c)} />
            ))}
          </div>
          {customConditions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {customConditions.map((c) => {
                const idx = state.conditions.indexOf(c);
                return <RemovableChip key={c} label={c} onRemove={() => removeCondition(idx)} />;
              })}
            </div>
          )}
          <AddOtherInput onAdd={addCondition} placeholder="Add other condition..." />
        </div>

        {/* Medications */}
        <div>
          <FieldLabel>Current medications</FieldLabel>
          <TagInput
            tags={state.medications}
            onAdd={addMedication}
            onRemove={removeMedication}
            placeholder="Type a medication and press Enter"
          />
          <p style={{ fontSize: 12, color: TEXT_TER, margin: '8px 0 0', lineHeight: 1.5, fontFamily: SANS }}>
            List anything prescription or over-the-counter you take regularly. This helps NŪRA flag supplement interactions.
          </p>
        </div>

        {/* Allergies */}
        <div>
          <FieldLabel>Allergies</FieldLabel>
          <TagInput
            tags={state.allergies}
            onAdd={addAllergy}
            onRemove={removeAllergy}
            placeholder="Type an allergy and press Enter"
          />
          <p style={{ fontSize: 12, color: TEXT_TER, margin: '8px 0 0', lineHeight: 1.5, fontFamily: SANS }}>
            Foods, supplements, medications, or environmental.
          </p>
        </div>
      </div>
    </div>
  );
}

function AddOtherInput({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
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

// ─── Step 4: Goals ────────────────────────────────────────────────────────────
function Step4Goals({ goals, onToggle, animKey }: {
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
          background: goals.length === 3 ? `rgba(var(--nura-sage-rgb),0.18)` : 'var(--nura-surface-elevated)',
          color: goals.length === 3 ? SAGE : TEXT_TER,
          border: `1px solid ${goals.length === 3 ? `rgba(var(--nura-sage-rgb),0.35)` : BORDER}`,
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

// ─── Step 5: Symptoms ─────────────────────────────────────────────────────────
function Step5Symptoms({ state, update, toggleChip, animKey }: {
  state: FormState;
  update: (k: keyof FormState, v: string) => void;
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
          background: 'var(--nura-surface)', border: `1.5px solid ${BORDER}`,
          borderRadius: 12, fontSize: 14, fontFamily: SANS, color: TEXT,
          outline: 'none', resize: 'none', lineHeight: 1.6,
          transition: 'border-color 200ms',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = `rgba(var(--nura-sage-rgb),0.45)`; }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
      />
    </div>
  );
}

// ─── Step 6: Lifestyle ────────────────────────────────────────────────────────
function Step6Lifestyle({ state, update, animKey }: {
  state: FormState; update: (k: keyof FormState, v: string) => void; animKey: number;
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

// ─── Step 7: Done ─────────────────────────────────────────────────────────────
function Step7Done({ state, animKey }: { state: FormState; animKey: number }) {
  const displayGoals = state.goals.map(id => GOALS.find(g => g.id === id)?.label ?? id);
  const name = state.name || 'there';

  const activity = state.activity_level
    ? state.activity_level.charAt(0).toLowerCase() + state.activity_level.slice(1)
    : '';
  const realConditions = state.conditions.filter(c => c !== NONE_CONDITION);
  const conditionsCount = realConditions.length;
  const medsCount = state.medications.length;

  const summaryBits: string[] = [];
  if (activity) summaryBits.push(`${activity} activity level`);
  summaryBits.push(`tracking ${conditionsCount} condition${conditionsCount === 1 ? '' : 's'} and ${medsCount} medication${medsCount === 1 ? '' : 's'}`);
  const summary = summaryBits.length ? `Got it — ${summaryBits.join(', ')}. Let's begin.` : null;

  return (
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', animation: 'step-in 450ms ease 200ms both',
    }}>
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
      {summary && (
        <p style={{ fontSize: 14, color: TEXT_SEC, fontFamily: SANS, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 360 }}>
          {summary}
        </p>
      )}

      {displayGoals.length > 0 && (
        <div style={{
          width: '100%', background: 'var(--nura-surface)', border: `1px solid ${BORDER}`,
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
                  background: `rgba(var(--nura-sage-rgb),0.15)`, border: `1px solid rgba(var(--nura-sage-rgb),0.3)`,
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
  const [animKeys, setAnimKeys] = useState(() => Array.from({ length: TOTAL_STEPS }, () => 1));
  const [submitting, setSubmitting] = useState(false);
  const [hovCta, setHovCta] = useState(false);
  const [state, setState] = useState<FormState>({
    unitSystem: 'imperial',
    name: '', dob: '', sex: 'Female',
    height_ft: '5', height_in: '7', height_cm: '170',
    weight_lbs: '', weight_kg: '',
    goals: [], symptoms_text: '', symptom_chips: [],
    diet: '', sleep: '7-8h', stress: 'Moderate',
    activity_level: 'Moderately active',
    pregnancy_status: '',
    conditions: [], medications: [], allergies: [],
  });

  // Auto-detect metric for non-US locales (mount only)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const lang = navigator.language || '';
      if (lang && lang.toLowerCase() !== 'en-us') {
        setState(prev => ({ ...prev, unitSystem: 'metric' }));
      }
    }
  }, []);

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

  const update = useCallback((k: keyof FormState, v: string) => {
    setState(prev => {
      if (k === 'unitSystem' && v !== prev.unitSystem) {
        const target = v as 'imperial' | 'metric';
        const carry: Partial<FormState> = {};
        if (target === 'metric') {
          const ft = parseFloat(prev.height_ft);
          const inches = parseFloat(prev.height_in);
          if (!isNaN(ft) || !isNaN(inches)) {
            carry.height_cm = String(ftInToCm(isNaN(ft) ? 0 : ft, isNaN(inches) ? 0 : inches));
          }
          const lbs = parseFloat(prev.weight_lbs);
          if (!isNaN(lbs)) carry.weight_kg = String(lbsToKg(lbs));
        } else {
          const cm = parseFloat(prev.height_cm);
          if (!isNaN(cm)) {
            const { ft, in: inches } = cmToFtIn(cm);
            carry.height_ft = String(ft);
            carry.height_in = String(inches);
          }
          const kg = parseFloat(prev.weight_kg);
          if (!isNaN(kg)) carry.weight_lbs = String(kgToLbs(kg));
        }
        return { ...prev, ...carry, unitSystem: target };
      }
      return { ...prev, [k]: v };
    });
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

  const toggleCondition = useCallback((c: string) => {
    setState(prev => {
      const has = prev.conditions.includes(c);
      if (c === NONE_CONDITION) {
        return { ...prev, conditions: has ? [] : [NONE_CONDITION] };
      }
      if (has) {
        return { ...prev, conditions: prev.conditions.filter(x => x !== c) };
      }
      return { ...prev, conditions: [...prev.conditions.filter(x => x !== NONE_CONDITION), c] };
    });
  }, []);

  const addCondition = useCallback((c: string) => {
    setState(prev => {
      const trimmed = c.trim();
      if (!trimmed || prev.conditions.some(x => x.toLowerCase() === trimmed.toLowerCase())) return prev;
      return { ...prev, conditions: [...prev.conditions.filter(x => x !== NONE_CONDITION), trimmed] };
    });
  }, []);

  const removeCondition = useCallback((idx: number) => {
    setState(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
  }, []);

  const addMedication = useCallback((m: string) => {
    setState(prev => ({ ...prev, medications: [...prev.medications, m] }));
  }, []);
  const removeMedication = useCallback((idx: number) => {
    setState(prev => ({ ...prev, medications: prev.medications.filter((_, i) => i !== idx) }));
  }, []);
  const addAllergy = useCallback((a: string) => {
    setState(prev => ({ ...prev, allergies: [...prev.allergies, a] }));
  }, []);
  const removeAllergy = useCallback((idx: number) => {
    setState(prev => ({ ...prev, allergies: prev.allergies.filter((_, i) => i !== idx) }));
  }, []);

  const goTo = useCallback((n: number) => {
    setStep(n);
    setAnimKeys(prev => { const next = [...prev]; next[n - 1]++; return next; });
  }, []);

  const next = useCallback(() => { if (step < TOTAL_STEPS) goTo(step + 1); }, [step, goTo]);
  const back = useCallback(() => { if (step > 1) goTo(step - 1); }, [step, goTo]);

  const buildPayload = useCallback((): OnboardingData => {
    let height_cm: number | null = null;
    let weight_kg: number | null = null;

    if (state.unitSystem === 'imperial') {
      const ft = parseFloat(state.height_ft);
      const inches = parseFloat(state.height_in);
      if (!isNaN(ft) || !isNaN(inches)) {
        height_cm = ftInToCm(isNaN(ft) ? 0 : ft, isNaN(inches) ? 0 : inches);
      }
      const lbs = parseFloat(state.weight_lbs);
      if (!isNaN(lbs)) weight_kg = lbsToKg(lbs);
    } else {
      const cm = parseFloat(state.height_cm);
      if (!isNaN(cm)) height_cm = Math.round(cm * 10) / 10;
      const kg = parseFloat(state.weight_kg);
      if (!isNaN(kg)) weight_kg = Math.round(kg * 10) / 10;
    }

    return {
      name: state.name,
      dob: state.dob,
      sex: state.sex,
      height_cm,
      weight_kg,
      unit_preference: state.unitSystem,
      goals: state.goals,
      symptoms_text: state.symptoms_text,
      symptom_chips: state.symptom_chips,
      diet: state.diet,
      sleep: state.sleep,
      stress: state.stress,
      activity_level: state.activity_level,
      pregnancy_status: state.pregnancy_status ? state.pregnancy_status : null,
      conditions: state.conditions,
      medications: state.medications,
      allergies: state.allergies,
    };
  }, [state]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveOnboarding(buildPayload());
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

  const stepLabel = String(step).padStart(2, '0') + ' / ' + String(TOTAL_STEPS).padStart(2, '0');

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
              <Step1Welcome onNext={next} animKey={animKeys[0]} />
            </div>
            <div style={slideStyle}>
              <Step2Basics state={state} update={update} animKey={animKeys[1]} />
            </div>
            <div style={slideStyle}>
              <Step3Health
                state={state}
                update={update}
                toggleCondition={toggleCondition}
                addCondition={addCondition}
                removeCondition={removeCondition}
                addMedication={addMedication}
                removeMedication={removeMedication}
                addAllergy={addAllergy}
                removeAllergy={removeAllergy}
                animKey={animKeys[2]}
              />
            </div>
            <div style={slideStyle}>
              <Step4Goals goals={state.goals} onToggle={toggleGoal} animKey={animKeys[3]} />
            </div>
            <div style={slideStyle}>
              <Step5Symptoms state={state} update={update} toggleChip={toggleChip} animKey={animKeys[4]} />
            </div>
            <div style={slideStyle}>
              <Step6Lifestyle state={state} update={update} animKey={animKeys[5]} />
            </div>
            <div style={slideStyle}>
              <Step7Done state={state} animKey={animKeys[6]} />
            </div>
          </div>
        </div>

        {/* Bottom controls (steps 2-TOTAL_STEPS) */}
        {step > 1 && (
          <div style={{ flexShrink: 0, paddingBottom: 40 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={back} style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--nura-surface-elevated)', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: TEXT_SEC,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M11 6l-6 6 6 6"/>
                </svg>
              </button>

              {step < TOTAL_STEPS ? (
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

            {/* Skip (steps 2 through second-to-last) */}
            {step >= 2 && step < TOTAL_STEPS && (
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
