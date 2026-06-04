'use client';

import { useState, useCallback } from 'react';
import {
  BG, TEXT, TEXT_SEC, TEXT_TER, BORDER, SAGE, SAGE_HOV, SAGE_ON, SANS, MONO,
  GLOBAL_CSS, Icon, StepQuestion, Hint, FieldLabel, SegmentedControl,
  ChipToggle, GoalCard, ProgressBar, WelcomeCanvas, DoneCheck,
  type GoalOption,
} from '@/components/onboarding/kit';
import { saveFitnessOnboarding, type FitnessProfileData } from './actions';

const TOTAL_STEPS = 7;

// ─── Fitness goal icons (kit Icon wrapper — 22px, 1.5 stroke) ────────────────
const MuscleIcon = () => <Icon><path d="M3 14c2-1 3-1 4 0l3 3M14 4l1 5 5 1M14 4c-2 1-2 3-1 5l3 6c1 2 3 3 5 2"/><circle cx="6" cy="11" r="1.4"/></Icon>;
const FlameIcon = () => <Icon><path d="M12 3c1 4 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 2-4M12 21a4 4 0 0 0 4-4c0-2-2-3-4-6-2 3-4 4-4 6a4 4 0 0 0 4 4z"/></Icon>;
const DumbbellIcon = () => <Icon><path d="M4 9v6M7 6.5v11M7 12h10M17 6.5v11M20 9v6"/></Icon>;
const PulseIcon = () => <Icon><path d="M3 12h4l2-6 4 12 2-6h6"/></Icon>;
const StretchIcon = () => <Icon><circle cx="12" cy="4" r="1.4"/><path d="M12 6v6m0 0l-4 8m4-8l4 8M7 9l5 1 5-1"/></Icon>;
const SparkIcon = () => <Icon><path d="M12 3l1.6 4.8L18 9l-4.4 1.2L12 15l-1.6-4.8L6 9l4.4-1.2L12 3z"/></Icon>;

const FITNESS_GOALS: GoalOption[] = [
  { id: 'muscle',    icon: <MuscleIcon />,   label: 'Build muscle' },
  { id: 'fat',       icon: <FlameIcon />,    label: 'Lose fat' },
  { id: 'strength',  icon: <DumbbellIcon />, label: 'Build strength' },
  { id: 'endurance', icon: <PulseIcon />,    label: 'Improve endurance' },
  { id: 'mobility',  icon: <StretchIcon />,  label: 'Mobility & flexibility' },
  { id: 'general',   icon: <SparkIcon />,    label: 'General fitness' },
];

export const GOAL_LABELS: Record<string, string> = Object.fromEntries(
  FITNESS_GOALS.map(g => [g.id, g.label]),
);

const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const EQUIPMENT_OPTIONS = ['Full gym', 'Home equipment', 'Bodyweight only', 'Resistance bands', 'Dumbbells only'];
const DAYS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7'];

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
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(var(--nura-sage-rgb),0.25)', animation: 'ripple 2.8s ease-out infinite' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(var(--nura-sage-rgb),0.15)', animation: 'ripple 2.8s ease-out 1.4s infinite' }} />
          <div style={{
            width: 88, height: 88, borderRadius: '50%', background: BG,
            border: '0.5px solid rgba(var(--nura-sage-rgb),0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'heartbeat 2.8s ease-in-out infinite', position: 'relative', zIndex: 1,
            color: SAGE,
          }}>
            <DumbbellIcon />
          </div>
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 500, color: TEXT, fontFamily: SANS, margin: '0 0 12px', letterSpacing: '-0.6px', lineHeight: 1.2 }}>
          Let&apos;s build your training.
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SEC, maxWidth: 280, margin: '0 auto 36px', lineHeight: 1.65, fontFamily: SANS }}>
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
    </div>
  );
}

// ─── Step 2: Primary goal (single-select goal cards) ─────────────────────────
function Step2Goal({ value, onSelect, animKey }: {
  value: string; onSelect: (id: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={{ minWidth: '100%', padding: '8px 0 24px', animation: 'step-in 450ms ease 200ms both' }}>
      <StepQuestion text="What's your main goal?" active />
      <Hint text="Pick the one that matters most right now." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FITNESS_GOALS.map(g => (
          <GoalCard key={g.id} goal={g} selected={value === g.id}
            onSelect={() => onSelect(value === g.id ? '' : g.id)} shaking={false} />
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
    <div key={animKey} style={{ minWidth: '100%', padding: '8px 0 24px', animation: 'step-in 450ms ease 200ms both' }}>
      <StepQuestion text="How experienced are you?" active />
      <Hint text="This sets the starting intensity NŪRA suggests." />
      <FieldLabel>Experience level</FieldLabel>
      <SegmentedControl options={EXPERIENCE_OPTIONS} value={value} onChange={onChange} />
    </div>
  );
}

// ─── Step 4: Equipment (chip-pill multi-select) ──────────────────────────────
function Step4Equipment({ value, onToggle, animKey }: {
  value: string[]; onToggle: (e: string) => void; animKey: number;
}) {
  return (
    <div key={animKey} style={{ minWidth: '100%', padding: '8px 0 24px', animation: 'step-in 450ms ease 200ms both' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: TEXT, fontFamily: SANS, marginBottom: 6, letterSpacing: '-0.3px' }}>
        What do you have access to?
      </div>
      <Hint text="Select all that apply — NŪRA only programs what you can use." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {EQUIPMENT_OPTIONS.map(e => (
          <ChipToggle key={e} label={e} selected={value.includes(e)} onToggle={() => onToggle(e)} />
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
    <div key={animKey} style={{ minWidth: '100%', padding: '8px 0 24px', animation: 'step-in 450ms ease 200ms both' }}>
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
    <div key={animKey} style={{ minWidth: '100%', padding: '8px 0 24px', animation: 'step-in 450ms ease 200ms both' }}>
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
    <div key={animKey} style={{
      minWidth: '100%', padding: '8px 0 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', animation: 'step-in 450ms ease 200ms both',
    }}>
      <DoneCheck />

      <h2 style={{ fontSize: 26, fontWeight: 600, color: TEXT, fontFamily: SANS, margin: '0 0 10px', letterSpacing: '-0.4px' }}>
        You&apos;re all set.
      </h2>
      <p style={{ fontSize: 14, color: TEXT_SEC, fontFamily: SANS, margin: '0 0 28px', lineHeight: 1.6, maxWidth: 360 }}>
        {echo}
      </p>

      {state.equipment.length > 0 && (
        <div style={{
          width: '100%', background: 'var(--nura-surface)', border: `1px solid ${BORDER}`,
          borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'left',
        }}>
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: SAGE, textTransform: 'uppercase', marginBottom: 12 }}>
            TRAINING WITH
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {state.equipment.map(e => (
              <span key={e} style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                background: `rgba(var(--nura-sage-rgb),0.15)`, border: `1px solid rgba(var(--nura-sage-rgb),0.3)`,
                color: SAGE, fontSize: 12, fontWeight: 500,
              }}>{e}</span>
            ))}
          </div>
        </div>
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
    transform: `translateX(-${(step - 1) * 100}%)`,
    transition: 'transform 550ms cubic-bezier(.32,.72,.34,1.01)',
    willChange: 'transform',
  };
  const slideStyle: React.CSSProperties = {
    minWidth: '100%', width: '100%', flexShrink: 0, minHeight: '100%', overflowY: 'auto',
  };
  const stepLabel = String(step).padStart(2, '0') + ' / ' + String(TOTAL_STEPS).padStart(2, '0');

  return (
    <div style={{ minHeight: '100dvh', background: BG, fontFamily: SANS, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ width: '100%', maxWidth: 480, flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        {/* Top bar */}
        <div style={{ paddingTop: 20, paddingBottom: 0, flexShrink: 0 }}>
          {isEdit && (
            <div style={{
              padding: '10px 14px', marginBottom: 14, borderRadius: 10,
              background: `rgba(var(--nura-sage-rgb),0.10)`,
              border: `0.5px solid rgba(var(--nura-sage-rgb),0.35)`,
              fontFamily: SANS, fontSize: 12, color: SAGE, lineHeight: 1.5,
            }}>
              Editing your fitness profile — changes save when you finish the flow
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: TEXT_TER }}>
              {stepLabel}
            </span>
          </div>
          <ProgressBar step={step} total={TOTAL_STEPS} />
        </div>

        {/* Slide track */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={trackStyle}>
            <div style={slideStyle}>
              <Step1Welcome onNext={next} animKey={animKeys[0]} />
            </div>
            <div style={slideStyle}>
              <Step2Goal value={state.primary_goal} onSelect={id => update('primary_goal', id)} animKey={animKeys[1]} />
            </div>
            <div style={slideStyle}>
              <Step3Experience value={state.experience_level} onChange={v => update('experience_level', v)} animKey={animKeys[2]} />
            </div>
            <div style={slideStyle}>
              <Step4Equipment value={state.equipment} onToggle={toggleEquipment} animKey={animKeys[3]} />
            </div>
            <div style={slideStyle}>
              <Step5Days value={state.days_per_week} onChange={v => update('days_per_week', v)} animKey={animKeys[4]} />
            </div>
            <div style={slideStyle}>
              <Step6Limitations value={state.limitations} onChange={v => update('limitations', v)} animKey={animKeys[5]} />
            </div>
            <div style={slideStyle}>
              <Step7Done state={state} animKey={animKeys[6]} />
            </div>
          </div>
        </div>

        {/* Bottom controls (steps 2-TOTAL_STEPS) */}
        {step > 1 && (
          <div style={{ flexShrink: 0, paddingBottom: 40 }}>
            {error && (
              <div style={{
                marginBottom: 12, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(220,80,80,0.10)', border: '0.5px solid rgba(220,80,80,0.4)',
                color: '#e08a8a', fontFamily: SANS, fontSize: 12, lineHeight: 1.5,
              }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button onClick={back} disabled={step <= (isEdit ? 2 : 1)} style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'var(--nura-surface-elevated)', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: step <= (isEdit ? 2 : 1) ? 'not-allowed' : 'pointer', color: TEXT_SEC,
                opacity: step <= (isEdit ? 2 : 1) ? 0.4 : 1,
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
                  {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Enter Fitness'}
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
