'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useThemeStore } from '@/lib/themeStore';
import {
  BG, TEXT, TEXT_SEC, TEXT_TER, BORDER, SAGE, SAGE_HOV, SAGE_ON, SANS, MONO,
  GLOBAL_CSS, StepQuestion, Hint, FieldLabel, SegmentedControl,
  DoneCheck,
  STEP_SHELL_STYLE, STEP_SHELL_CENTERED_STYLE,
} from '@/components/onboarding/kit';
import { Dumbbell, Flame, Weight, Activity, PersonStanding, Sparkles, Building2, Home, Spline, Users } from 'lucide-react';
import { saveFitnessOnboarding, type FitnessProfileData } from './actions';

const TOTAL_STEPS = 7;

// ─── Design-system palette (explicit, per spec) ──────────────────────────────
const SAGE_HEX = 'var(--nura-sage)';
const SAGE_HOVER = 'var(--nura-sage-hover)';
const DARK = 'var(--nura-bg)';
const TILE_BG = `rgba(var(--nura-bg-tint-rgb),0.045)`;
const TILE_BORDER = `rgba(var(--nura-bg-tint-rgb),0.12)`;
const TILE_LABEL = `var(--nura-text-primary)`;
const TILE_DESC = `var(--nura-text-secondary)`;

// Fitness-only overrides. The shared GLOBAL_CSS presses every button to
// scale(.97); the CTA / back instead nudge down 1px (higher specificity wins).
const FIT_CSS = `
  .fit-press:active { transform: translateY(1px) !important; }
  .fit-tile { outline: none; }
  .fit-tile:focus { outline: none; }
  .fit-tile:focus-visible { outline: 2px solid rgba(var(--nura-sage-rgb),0.55); outline-offset: 2px; }
`;

// BodyScan hero uses WebGL/canvas — load client-side only.
const BodyScan = dynamic(() => import('@/components/BodyScan'), { ssr: false });

// ─── Fitness goals (lucide icons, sage) ──────────────────────────────────────
type IconCmp = React.ComponentType<{ size?: number; strokeWidth?: number; color?: string; style?: React.CSSProperties }>;
interface FitGoal { id: string; Icon: IconCmp; label: string; desc: string }

const FITNESS_GOALS: FitGoal[] = [
  { id: 'muscle',    Icon: Dumbbell,       label: 'Build muscle',           desc: 'Add size' },
  { id: 'fat',       Icon: Flame,          label: 'Lose fat',               desc: 'Lean out and drop weight' },
  { id: 'strength',  Icon: Weight,         label: 'Build strength',         desc: 'Get stronger, lift heavier' },
  { id: 'endurance', Icon: Activity,       label: 'Improve endurance',      desc: 'Boost stamina and cardio' },
  { id: 'mobility',  Icon: PersonStanding, label: 'Mobility & flexibility', desc: 'Move better, stay loose' },
  { id: 'general',   Icon: Sparkles,       label: 'General fitness',        desc: 'Stay healthy and active' },
];

export const GOAL_LABELS: Record<string, string> = Object.fromEntries(
  FITNESS_GOALS.map(g => [g.id, g.label]),
);

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const DAYS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'];

// Equipment tiles — id matches the stored value; icons all visually distinct
// (building/facility for Full gym, never a dumbbell).
const EQUIPMENT: FitGoal[] = [
  { id: 'Full gym',         Icon: Building2,      label: 'Full gym',         desc: 'Machines & free weights' },
  { id: 'Home equipment',   Icon: Home,           label: 'Home equipment',   desc: 'A few basics at home' },
  { id: 'Bodyweight only',  Icon: PersonStanding, label: 'Bodyweight only',  desc: 'No equipment needed' },
  { id: 'Resistance bands', Icon: Spline,         label: 'Resistance bands', desc: 'Loops or tubes' },
  { id: 'Dumbbells only',   Icon: Dumbbell,       label: 'Dumbbells only',   desc: 'Adjustable or fixed' },
  { id: 'Group classes',    Icon: Users,          label: 'Group classes',    desc: 'Studio, gym, or online classes' },
];

interface FitState {
  primary_goal: string;
  experience_level: string;
  equipment: string[];
  days_per_week: string; // '' or '1'..'7'
  limitations: string;
}

const EMPTY_STATE: FitState = {
  primary_goal: '',
  experience_level: '',
  equipment: [],
  days_per_week: '',
  limitations: '',
};

export function fitStateFromData(data: FitnessProfileData | null): FitState {
  if (!data) return EMPTY_STATE;
  return {
    primary_goal: data.primary_goal ?? '',
    experience_level: data.experience_level ?? '',
    equipment: data.equipment ?? [],
    days_per_week: data.days_per_week != null ? String(data.days_per_week) : '',
    limitations: data.limitations ?? '',
  };
}

// ─── Welcome plexus (drifting particles only — no DNA helix) ─────────────────
// Scoped to this screen so the shared WelcomeCanvas (which also draws a helix)
// stays untouched on every other onboarding step/flow.
function WelcomePlexus() {
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
    <div key={animKey} className="min-h-[100svh] flex flex-col items-center px-7 pt-[5vh]" style={{
      position: 'relative', width: '100%', overflow: 'hidden',
      animation: 'step-in 450ms ease 200ms both',
    }}>
      <WelcomePlexus />

      {/* Copy block — centered: heading, subtext, CTA */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center', width: '100%',
      }}>
        <h1 style={{ fontSize: 30, fontWeight: 500, color: TEXT, fontFamily: SANS, margin: '0 0 12px', letterSpacing: '-0.6px', lineHeight: 1.2 }}>
          Let&apos;s build your training.
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SEC, maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.65, fontFamily: SANS }}>
          A few quick questions so NŪRA can shape fitness around your goals, gear, and schedule — takes 30 seconds.
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
      </div>

      {/* Hero — explicit, non-collapsing height so the canvas always has room */}
      <div className="w-full h-[54vh] mt-10 flex items-center justify-center" style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>
        <BodyScan autoRotate />
      </div>
    </div>
  );
}

// ─── Shared selectable tile (goal cards + equipment) ─────────────────────────
function OptionTile({ icon: Icon, label, desc, selected, onToggle }: {
  icon: IconCmp; label: string; desc: string; selected: boolean; onToggle: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button type="button" className="fit-tile" onClick={onToggle}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', width: '100%', textAlign: 'left', cursor: 'pointer',
        appearance: 'none', WebkitAppearance: 'none', fontFamily: SANS,
        padding: '14px 14px 15px', borderRadius: 16,
        border: `1px solid ${selected || hover ? SAGE_HEX : TILE_BORDER}`,
        background: selected ? SAGE_HEX : TILE_BG,
        boxShadow: selected ? '0 8px 24px rgba(var(--nura-sage-rgb),0.22)' : 'none',
        color: selected ? DARK : TILE_LABEL,
        transition: 'background 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
        display: 'flex', flexDirection: 'column', gap: 9,
      }}>
      {/* circular check — fills on select */}
      <span style={{
        position: 'absolute', top: 11, right: 11, width: 20, height: 20, borderRadius: '50%',
        background: selected ? DARK : 'transparent',
        border: selected ? 'none' : `1px solid var(--nura-ink-faint)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 160ms ease',
      }}>
        {selected && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
            stroke={SAGE_HEX} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l3 3 5-5" strokeDasharray="14" strokeDashoffset="14"
              style={{ animation: 'check-draw 280ms ease forwards' }} />
          </svg>
        )}
      </span>
      <Icon size={22} strokeWidth={1.7} color={selected ? DARK : SAGE_HEX}
        style={{ width: 22, height: 22, flexShrink: 0 }} />
      <span style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, color: selected ? DARK : TILE_LABEL }}>
          {label}
        </span>
        <span style={{ display: 'block', fontSize: 11.5, lineHeight: 1.35, marginTop: 3, color: selected ? 'var(--nura-sage-bg-on)' : TILE_DESC }}>
          {desc}
        </span>
      </span>
    </button>
  );
}

// ─── Step 2: Primary goal (single-select) ────────────────────────────────────
function Step2Goal({ value, onSelect, animKey }: {
  value: string; onSelect: (id: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={STEP_SHELL_STYLE}>
      <StepQuestion text="What's your main goal?" active />
      <Hint text="Pick the one that matters most right now." />
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FITNESS_GOALS.map(g => (
          <OptionTile key={g.id} icon={g.Icon} label={g.label} desc={g.desc}
            selected={value === g.id} onToggle={() => onSelect(value === g.id ? '' : g.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Step 3: Experience (segmented control) ──────────────────────────────────
function Step3Experience({ value, onChange, animKey }: {
  value: string; onChange: (v: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={STEP_SHELL_STYLE}>
      <StepQuestion text="How experienced are you?" active />
      <Hint text="This sets the starting intensity NŪRA suggests." />
      <FieldLabel>Experience level</FieldLabel>
      <SegmentedControl options={EXPERIENCE_OPTIONS} value={value} onChange={onChange} />
    </div>
  );
}

// ─── Step 4: Equipment (multi-select tile grid) ──────────────────────────────
function Step4Equipment({ value, onToggle, animKey }: {
  value: string[]; onToggle: (e: string) => void; animKey: number;
}) {
  const count = value.length;
  return (
    <div key={animKey} style={STEP_SHELL_STYLE}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, marginBottom: 6, letterSpacing: '-0.3px' }}>
        What do you have access to?
      </div>
      <Hint text="Select all that apply — NŪRA only programs what you can use." />
      <div style={{
        fontSize: 11, fontFamily: MONO, letterSpacing: '1.5px', color: "var(--nura-accent-label)",
        textTransform: 'uppercase', marginTop: 2, marginBottom: 14, minHeight: 14,
        opacity: count ? 1 : 0, transition: 'opacity 160ms ease',
      }}>
        {count} selected
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {EQUIPMENT.map(e => (
          <OptionTile key={e.id} icon={e.Icon} label={e.label} desc={e.desc}
            selected={value.includes(e.id)} onToggle={() => onToggle(e.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Step 5: Training days per week (segmented control) ──────────────────────
function Step5Days({ value, onChange, animKey }: {
  value: string; onChange: (v: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={STEP_SHELL_STYLE}>
      <StepQuestion text="How many days a week?" active />
      <Hint text="Be realistic — consistency beats ambition." />
      <FieldLabel>Training days per week</FieldLabel>
      <SegmentedControl options={DAYS_OPTIONS} value={value} onChange={onChange} fontSize={13} />
    </div>
  );
}

// ─── Step 6: Limitations (optional text) ─────────────────────────────────────
function Step6Limitations({ value, onChange, animKey }: {
  value: string; onChange: (v: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={STEP_SHELL_STYLE}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, marginBottom: 6, letterSpacing: '-0.3px' }}>
        Anything to work around?
      </div>
      <Hint text="Injuries, limitations, or areas to avoid. Optional — skip if nothing comes to mind." />
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder="e.g. bad left knee, recovering shoulder, lower-back caution..."
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

// ─── Step 7: Done (bouncing check + personalized echo) ───────────────────────
function Step7Done({ state, animKey }: { state: FitState; animKey: number }) {
  const goalLabel = FITNESS_GOALS.find(g => g.id === state.primary_goal)?.label;
  const days = state.days_per_week;
  const exp = state.experience_level;

  const parts: string[] = [];
  if (goalLabel) parts.push(goalLabel);
  if (days) parts.push(`${days} day${days === '1' ? '' : 's'} a week`);
  if (exp) parts.push(exp.toLowerCase());
  const echo = parts.length ? `${parts.join(', ')} — let's get to work.` : "Your plan is ready — let's get to work.";

  return (
    <div key={animKey} style={STEP_SHELL_CENTERED_STYLE}>
      <DoneCheck />

      <h2 style={{ fontSize: 26, fontWeight: 600, color: TEXT, fontFamily: SANS, margin: '0 0 10px', letterSpacing: '-0.4px' }}>
        You&apos;re all set.
      </h2>
      <p style={{ fontSize: 14, color: TEXT_SEC, fontFamily: SANS, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 360 }}>
        {echo}
      </p>

      {state.equipment.length > 0 && (
        <div className="nura-card" style={{
          width: '100%', background: 'var(--nura-surface)', border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'left',
        }}>
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: "var(--nura-accent-label)", textTransform: 'uppercase', marginBottom: 12 }}>
            TRAINING WITH
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {state.equipment.map(e => (
              <span key={e} style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                background: `rgba(var(--nura-sage-rgb),0.15)`, border: `1px solid rgba(var(--nura-sage-rgb),0.3)`,
                color: "var(--nura-accent-text)", fontSize: 12, fontWeight: 500,
              }}>{e}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Thin segmented progress bar ─────────────────────────────────────────────
function FitProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 18 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 99,
          background: i + 1 <= step ? SAGE_HEX : `rgba(var(--nura-bg-tint-rgb),0.12)`,
          transition: 'background 260ms ease',
        }} />
      ))}
    </div>
  );
}

// ─── In-flow footer (back / Continue|Save / Skip) ────────────────────────────
// Lives inside each step's slide (steps 2+), directly below the content, so the
// buttons sit right under the cards instead of pinned to the screen bottom.
function StepFooter({ step, isEdit, error, submitting, hovCta, setHovCta, onBack, onNext, onSubmit }: {
  step: number; isEdit: boolean; error: string; submitting: boolean;
  hovCta: boolean; setHovCta: (v: boolean) => void;
  onBack: () => void; onNext: () => void; onSubmit: () => void;
}) {
  const backDisabled = step <= (isEdit ? 2 : 1);
  return (
    <div style={{ marginTop: 28, paddingBottom: 24 }}>
      {error && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 10,
          background: 'var(--nura-tint-danger)', border: '0.5px solid var(--nura-tint-danger-border)',
          color: 'var(--nura-danger-soft)', fontFamily: SANS, fontSize: 12, lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="fit-press" onClick={onBack} disabled={backDisabled} style={{
          width: 54, height: 54, borderRadius: 14, flexShrink: 0,
          background: `rgba(var(--nura-bg-tint-rgb),0.04)`, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.14)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: backDisabled ? 'not-allowed' : 'pointer', color: `var(--nura-text-primary)`,
          opacity: backDisabled ? 0.4 : 1, transition: 'border-color 160ms ease',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6"/>
          </svg>
        </button>

        {step < TOTAL_STEPS ? (
          <button
            className="fit-press"
            onClick={onNext}
            onMouseEnter={() => setHovCta(true)}
            onMouseLeave={() => setHovCta(false)}
            style={{
              flex: 1, height: 54, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: hovCta ? SAGE_HOVER : SAGE_HEX, color: DARK,
              fontFamily: SANS, fontSize: 15, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: hovCta ? '0 12px 40px rgba(var(--nura-sage-rgb),0.38)' : '0 10px 34px rgba(var(--nura-sage-rgb),0.28)',
              transition: 'background 160ms ease, box-shadow 160ms ease',
            }}
          >
            Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>
        ) : (
          <button
            className="fit-press"
            onClick={onSubmit}
            disabled={submitting}
            onMouseEnter={() => setHovCta(true)}
            onMouseLeave={() => setHovCta(false)}
            style={{
              flex: 1, height: 54, borderRadius: 14, border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: hovCta && !submitting ? SAGE_HOVER : SAGE_HEX, color: DARK,
              fontFamily: SANS, fontSize: 15, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: submitting ? 'none' : hovCta ? '0 12px 40px rgba(var(--nura-sage-rgb),0.38)' : '0 10px 34px rgba(var(--nura-sage-rgb),0.28)',
              transition: 'background 160ms ease, box-shadow 160ms ease', opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Enter Fitness'}
            {!submitting && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {step >= 2 && step < TOTAL_STEPS && (
        <button onClick={onNext} style={{
          display: 'block', width: '100%', marginTop: 16,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: MONO, fontSize: 9.5, letterSpacing: '2.5px', color: `var(--nura-text-tertiary)`,
          textTransform: 'uppercase', textAlign: 'center', padding: '6px 0',
        }}>
          SKIP THIS STEP
        </button>
      )}
    </div>
  );
}

// ─── Flow orchestrator ────────────────────────────────────────────────────────
export default function FitnessOnboarding({ initial, onComplete }: {
  initial?: FitnessProfileData | null;
  onComplete: () => void;
}) {
  const isEdit = !!initial;
  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [animKeys, setAnimKeys] = useState(() => Array.from({ length: TOTAL_STEPS }, () => 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hovCta, setHovCta] = useState(false);
  const [state, setState] = useState<FitState>(() => fitStateFromData(initial ?? null));

  const goTo = useCallback((n: number) => {
    setStep(n);
    setAnimKeys(prev => { const next = [...prev]; next[n - 1]++; return next; });
  }, []);
  const next = useCallback(() => { if (step < TOTAL_STEPS) goTo(step + 1); }, [step, goTo]);
  const back = useCallback(() => { if (step > (isEdit ? 2 : 1)) goTo(step - 1); }, [step, goTo, isEdit]);

  const update = useCallback(<K extends keyof FitState>(k: K, v: FitState[K]) => {
    setState(prev => ({ ...prev, [k]: v }));
  }, []);

  const toggleEquipment = useCallback((e: string) => {
    setState(prev => ({
      ...prev,
      equipment: prev.equipment.includes(e)
        ? prev.equipment.filter(x => x !== e)
        : [...prev.equipment, e],
    }));
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const payload: FitnessProfileData = {
      primary_goal: state.primary_goal,
      experience_level: state.experience_level,
      equipment: state.equipment,
      days_per_week: state.days_per_week ? parseInt(state.days_per_week, 10) : null,
      limitations: state.limitations.trim(),
    };
    const res = await saveFitnessOnboarding(payload);
    if (res.ok) {
      onComplete();
    } else {
      setError(res.error || 'Could not save. Try again.');
      setSubmitting(false);
    }
  };

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    flex: 1,
    minHeight: 0,
    transform: `translateX(-${(step - 1) * 100}%)`,
    transition: 'transform 550ms cubic-bezier(.32,.72,.34,1.01)',
    willChange: 'transform',
  };
  const slideStyle: React.CSSProperties = {
    minWidth: '100%', width: '100%', flexShrink: 0, height: '100%', overflowY: 'auto',
  };
  const stepLabel = String(step).padStart(2, '0') + ' / ' + String(TOTAL_STEPS).padStart(2, '0');

  return (
    <div style={{ position: 'relative', height: '100dvh', background: BG, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <style>{GLOBAL_CSS}</style>
      <style>{FIT_CSS}</style>

      {/* Faint drifting sage plexus behind every step */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.4, pointerEvents: 'none' }}>
        <WelcomePlexus />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        {/* Top bar */}
        <div style={{ paddingTop: 20, paddingBottom: 0, flexShrink: 0 }}>
          {isEdit && (
            <div style={{
              padding: '10px 14px', marginBottom: 14, borderRadius: 10,
              background: `rgba(var(--nura-sage-rgb),0.10)`,
              border: `0.5px solid rgba(var(--nura-sage-rgb),0.35)`,
              fontFamily: SANS, fontSize: 12, color: "var(--nura-accent-text)", lineHeight: 1.5,
            }}>
              Editing your fitness profile — changes save when you finish the flow
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: TEXT_TER }}>
              {stepLabel}
            </span>
          </div>
          <FitProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {/* Slide track */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={trackStyle}>
            <div style={slideStyle}>
              <Step1Welcome onNext={next} animKey={animKeys[0]} />
            </div>
            <div style={slideStyle}>
              <Step2Goal value={state.primary_goal} onSelect={id => update('primary_goal', id)} animKey={animKeys[1]} />
              <StepFooter step={2} isEdit={isEdit} error={error} submitting={submitting} hovCta={hovCta} setHovCta={setHovCta} onBack={back} onNext={next} onSubmit={handleSubmit} />
            </div>
            <div style={slideStyle}>
              <Step3Experience value={state.experience_level} onChange={v => update('experience_level', v)} animKey={animKeys[2]} />
              <StepFooter step={3} isEdit={isEdit} error={error} submitting={submitting} hovCta={hovCta} setHovCta={setHovCta} onBack={back} onNext={next} onSubmit={handleSubmit} />
            </div>
            <div style={slideStyle}>
              <Step4Equipment value={state.equipment} onToggle={toggleEquipment} animKey={animKeys[3]} />
              <StepFooter step={4} isEdit={isEdit} error={error} submitting={submitting} hovCta={hovCta} setHovCta={setHovCta} onBack={back} onNext={next} onSubmit={handleSubmit} />
            </div>
            <div style={slideStyle}>
              <Step5Days value={state.days_per_week} onChange={v => update('days_per_week', v)} animKey={animKeys[4]} />
              <StepFooter step={5} isEdit={isEdit} error={error} submitting={submitting} hovCta={hovCta} setHovCta={setHovCta} onBack={back} onNext={next} onSubmit={handleSubmit} />
            </div>
            <div style={slideStyle}>
              <Step6Limitations value={state.limitations} onChange={v => update('limitations', v)} animKey={animKeys[5]} />
              <StepFooter step={6} isEdit={isEdit} error={error} submitting={submitting} hovCta={hovCta} setHovCta={setHovCta} onBack={back} onNext={next} onSubmit={handleSubmit} />
            </div>
            <div style={slideStyle}>
              <Step7Done state={state} animKey={animKeys[6]} />
              <StepFooter step={7} isEdit={isEdit} error={error} submitting={submitting} hovCta={hovCta} setHovCta={setHovCta} onBack={back} onNext={next} onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
