'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NuraPlexus from '@/components/NuraPlexus';
import { saveFitnessPlanSettings, type PlanSettingsData } from './actions';

// ── Palette (NŪRA) ───────────────────────────────────────────────────────────
const SAGE = 'var(--nura-sage)';
const SAGE_HI = 'var(--nura-sage-hover)';
const DARK = 'var(--nura-bg)';
const SANS = "var(--font-inter), system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";
const SERIF = "'DM Serif Display', Georgia, serif";

// Premium surface recipes — lit physical surfaces (gradient + inset highlight + drop shadow).
const SURFACE = 'linear-gradient(180deg, rgba(var(--nura-bg-tint-rgb),0.055), rgba(var(--nura-bg-tint-rgb),0.02))';
const SURFACE_SHADOW = 'inset 0 1px 0 rgba(var(--nura-bg-tint-rgb),0.07), 0 6px 20px rgba(0,0,0,0.28)';
const SAGE_GRAD = `linear-gradient(180deg, ${SAGE_HI}, ${SAGE})`;
const SAGE_ON_SHADOW = '0 6px 18px rgba(var(--nura-sage-rgb),0.38), inset 0 1px 0 rgba(255,255,255,0.4)';

// ── Option vocabularies ──────────────────────────────────────────────────────
const DAYS_OPTS = ['2', '3', '4', '5', '6'];
const SESSION_OPTS = ['20 min', '30 min', '45 min', '60 min'];

const SPLIT_OPTS = ['Full Body', 'Push-Pull-Legs', 'Upper-Lower'];
const SPLIT_HELP: Record<string, string> = {
  'Full Body': 'Every session trains the whole body — ideal at 2–3 days a week.',
  'Push-Pull-Legs': 'Rotates push, pull and leg days — strongest at 3 or 6 days a week.',
  'Upper-Lower': 'Alternates upper- and lower-body days — balanced at 4 days a week.',
};

const GOAL_OPTS: { label: string; id: string }[] = [
  { label: 'General Fitness', id: 'general' },
  { label: 'Build Muscle', id: 'muscle' },
  { label: 'Strength', id: 'strength' },
  { label: 'Weight Loss', id: 'fat' },
  { label: 'Endurance', id: 'endurance' },
];
const GOAL_ID_TO_LABEL = (id: string): string =>
  GOAL_OPTS.find((g) => g.id === id)?.label ?? 'General Fitness';

const FOCUS_OPTS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Core', 'Quads', 'Hamstrings', 'Glutes', 'Calves'];

const EQUIP_OPTS = ['Full Gym', 'Dumbbells', 'Barbell', 'Kettlebell', 'Bands', 'Machines', 'Bodyweight'];
// Map the older onboarding equipment vocabulary onto these chips so the screen
// reflects an existing profile even if it was set during onboarding.
const EQUIP_FROM_ONBOARDING: Record<string, string[]> = {
  'full gym': ['Full Gym'],
  'home equipment': ['Dumbbells', 'Kettlebell', 'Bands', 'Bodyweight'],
  'bodyweight only': ['Bodyweight'],
  'resistance bands': ['Bands', 'Bodyweight'],
  'dumbbells only': ['Dumbbells', 'Bodyweight'],
  'group classes': ['Bodyweight'],
};
function normalizeEquipment(stored: string[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const raw of stored ?? []) {
    const fromOnboarding = EQUIP_FROM_ONBOARDING[raw.toLowerCase().trim()];
    if (fromOnboarding) { fromOnboarding.forEach((x) => out.add(x)); continue; }
    const exact = EQUIP_OPTS.find((e) => e.toLowerCase() === raw.toLowerCase().trim());
    if (exact) out.add(exact);
  }
  return EQUIP_OPTS.filter((e) => out.has(e)); // keep canonical order
}

// Derive a split chip from a stored fitness_programs.split_type label.
function splitFromProgramType(t: string | null | undefined): string | null {
  const k = (t ?? '').toLowerCase();
  if (!k) return null;
  if (k.includes('push') || k.includes('pull')) return 'Push-Pull-Legs';
  if (k.includes('upper') || k.includes('lower')) return 'Upper-Lower';
  if (k.includes('full')) return 'Full Body';
  return null;
}

// ── Icons ────────────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
);
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={DARK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M2 6l3 3 5-6" strokeDasharray="14" strokeDashoffset="14" style={{ animation: 'ps-check 280ms ease forwards' }} />
  </svg>
);

// ── Atoms ────────────────────────────────────────────────────────────────────
function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const idx = Math.max(0, options.indexOf(value));
  const w = 100 / options.length;
  return (
    <div style={{
      position: 'relative', display: 'flex', borderRadius: 14, padding: 4,
      background: SURFACE, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.10)`, boxShadow: SURFACE_SHADOW,
    }}>
      <div style={{
        position: 'absolute', top: 4, bottom: 4,
        left: `calc(${idx * w}% + 4px)`, width: `calc(${w}% - 8px)`,
        borderRadius: 10, background: SAGE_GRAD, boxShadow: SAGE_ON_SHADOW,
        transition: 'left 260ms cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none',
      }} />
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)} style={{
          flex: 1, position: 'relative', zIndex: 1, padding: '11px 4px', border: 'none',
          background: 'none', cursor: 'pointer', fontFamily: SANS, fontSize: 13.5, fontWeight: 600,
          lineHeight: 1.2, color: value === opt ? DARK : `var(--nura-ink-muted)`, transition: 'color 220ms',
        }}>{opt}</button>
      ))}
    </div>
  );
}

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{
      position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: selected ? '9px 14px 9px 12px' : '9px 15px', borderRadius: 12, cursor: 'pointer',
      fontFamily: SANS, fontSize: 13, fontWeight: 600, lineHeight: 1, whiteSpace: 'nowrap',
      color: selected ? DARK : `var(--nura-ink-strong)`,
      background: selected ? SAGE_GRAD : SURFACE,
      border: `1px solid ${selected ? 'rgba(var(--nura-sage-rgb),0.6)' : `rgba(var(--nura-bg-tint-rgb),0.12)`}`,
      boxShadow: selected ? SAGE_ON_SHADOW : SURFACE_SHADOW,
      transition: 'background 180ms ease, color 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
    }}>
      {selected && <Check />}
      {label}
    </button>
  );
}

function Section({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{
        fontSize: 11, fontFamily: MONO, letterSpacing: '1.4px', textTransform: 'uppercase',
        color: `var(--nura-text-secondary)`, marginBottom: 11,
      }}>{label}</div>
      {children}
      {helper && (
        <p style={{ fontSize: 12.5, color: `var(--nura-text-secondary)`, fontFamily: SANS, lineHeight: 1.55, margin: '11px 2px 0' }}>
          {helper}
        </p>
      )}
    </section>
  );
}

const ChipRow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>{children}</div>
);

// ── Screen ───────────────────────────────────────────────────────────────────
export default function PlanSettings() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState('4');
  const [split, setSplit] = useState('Full Body');
  const [goalId, setGoalId] = useState('general');
  const [focus, setFocus] = useState<string[]>([]);
  const [session, setSession] = useState('45 min');
  const [equipment, setEquipment] = useState<string[]>([]);

  // Load current values so the screen reflects the existing plan.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.push('/auth'); return; }

      const [{ data: profile }, { data: prog }] = await Promise.all([
        supabase.from('fitness_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('fitness_programs').select('split_type').eq('user_id', user.id)
          .eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (cancelled) return;

      const p = (profile ?? {}) as Record<string, unknown>;

      const d = p.days_per_week as number | null;
      setDays(d != null && DAYS_OPTS.includes(String(d)) ? String(d) : '4');

      const storedSplit = (p.split as string | null) || splitFromProgramType((prog as { split_type?: string } | null)?.split_type);
      if (storedSplit && SPLIT_OPTS.includes(storedSplit)) setSplit(storedSplit);

      if (p.primary_goal && GOAL_OPTS.some((g) => g.id === p.primary_goal)) setGoalId(p.primary_goal as string);

      const fa = (p.focus_areas as string[] | null) ?? [];
      setFocus(FOCUS_OPTS.filter((m) => fa.includes(m)));

      const sl = p.session_length as number | null;
      if (sl != null && SESSION_OPTS.includes(`${sl} min`)) setSession(`${sl} min`);

      setEquipment(normalizeEquipment(p.equipment as string[] | null));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const goalLabel = GOAL_ID_TO_LABEL(goalId);
  const sessionMin = useMemo(() => Number.parseInt(session, 10), [session]);

  const runSave = useCallback(async () => {
    setSaving(true); setError(null);
    const settings: PlanSettingsData = {
      primary_goal: goalId,
      equipment,
      days_per_week: Number.parseInt(days, 10),
      split,
      focus_areas: focus,
      session_length: sessionMin,
    };

    const saved = await saveFitnessPlanSettings(settings);
    if (!saved.ok) { setError(saved.error); setSaving(false); return; }

    // Regenerate, passing the settings as overrides so the new plan honors them
    // immediately — even when the preference columns aren't migrated yet.
    try {
      const res = await fetch('/api/fitness/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: settings }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body?.error ?? 'Could not rebuild your plan. Please try again.'); setSaving(false); return; }
    } catch {
      setError('Could not reach the server. Please try again.'); setSaving(false); return;
    }
    router.push('/fitness'); // back to the freshly rebuilt plan
  }, [goalId, equipment, days, split, focus, sessionMin, router]);

  return (
    <div style={{
      minHeight: '100dvh', background: DARK, color: 'var(--nura-text-primary)',
      fontFamily: SANS, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes ps-check { to { stroke-dashoffset: 0; } }
        @keyframes ps-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .ps-back:hover { color: ${SAGE} !important; border-color: rgba(var(--nura-sage-rgb),0.4) !important; }
        .ps-cta:active { transform: translateY(1px); }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <NuraPlexus opacity={0.22} particleCount={20} />
      {/* soft sage glow near the top */}
      <div className="nura-halo" aria-hidden style={{
        position: 'absolute', top: -180, left: '50%', transform: 'translateX(-50%)',
        width: 720, height: 440, pointerEvents: 'none', zIndex: 1, filter: 'blur(18px)',
        background: 'radial-gradient(ellipse at center, rgba(var(--nura-sage-rgb),0.16), rgba(var(--nura-sage-rgb),0) 70%)',
      }} />

      <main style={{
        position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto',
        padding: '22px 18px 160px', animation: 'ps-rise 360ms ease',
      }}>
        {/* Header */}
        <button type="button" className="ps-back" onClick={() => router.push('/fitness')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 22, padding: '7px 12px 7px 9px',
          borderRadius: 10, cursor: 'pointer', fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
          color: `var(--nura-ink-muted)`, background: SURFACE, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.12)`,
          transition: 'color 160ms ease, border-color 160ms ease',
        }}>
          <ChevronLeft /> Plan
        </button>

        <div style={{
          fontSize: 11, fontFamily: MONO, letterSpacing: '2.4px', textTransform: 'uppercase',
          color: "var(--nura-accent-label)", marginBottom: 12,
        }}>Customize your plan</div>
        <h1 style={{
          fontFamily: SERIF, fontWeight: 400, fontSize: 38, lineHeight: 1.05, letterSpacing: '-0.5px',
          color: 'var(--nura-text-primary)', margin: '0 0 12px',
        }}>
          Plan <em style={{ fontFamily: SERIF, fontStyle: 'italic', color: "var(--nura-accent-text)" }}>settings</em>
        </h1>
        <p style={{ fontSize: 14.5, color: `var(--nura-ink-muted)`, fontFamily: SANS, lineHeight: 1.6, margin: '0 0 34px', maxWidth: 440 }}>
          Shape how NŪRA builds your training week. Adjust anything below, then regenerate.
        </p>

        {loading ? (
          <div style={{ fontSize: 13, color: `var(--nura-text-tertiary)`, padding: '8px 2px' }}>Loading your settings…</div>
        ) : (
          <>
            <Section label="Training days / week">
              <Segmented options={DAYS_OPTS} value={days} onChange={setDays} />
            </Section>

            <Section label="Split" helper={SPLIT_HELP[split]}>
              <ChipRow>
                {SPLIT_OPTS.map((s) => <Chip key={s} label={s} selected={split === s} onToggle={() => setSplit(s)} />)}
              </ChipRow>
            </Section>

            <Section label="Goal">
              <ChipRow>
                {GOAL_OPTS.map((g) => <Chip key={g.id} label={g.label} selected={goalId === g.id} onToggle={() => setGoalId(g.id)} />)}
              </ChipRow>
            </Section>

            <Section label="Focus areas" helper="Optional — pick muscles to give extra attention. Leave empty for a balanced plan.">
              <ChipRow>
                {FOCUS_OPTS.map((m) => <Chip key={m} label={m} selected={focus.includes(m)} onToggle={() => toggle(focus, setFocus, m)} />)}
              </ChipRow>
            </Section>

            <Section label="Session length">
              <Segmented options={SESSION_OPTS} value={session} onChange={setSession} />
            </Section>

            <Section label="Equipment available">
              <ChipRow>
                {EQUIP_OPTS.map((e) => <Chip key={e} label={e} selected={equipment.includes(e)} onToggle={() => toggle(equipment, setEquipment, e)} />)}
              </ChipRow>
            </Section>
          </>
        )}
      </main>

      {/* Sticky glassy footer */}
      {!loading && (
        <footer style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 5,
          background: 'var(--nura-scrim-panel)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
          borderTop: `1px solid rgba(var(--nura-bg-tint-rgb),0.10)`,
        }}>
          <div style={{
            maxWidth: 640, margin: '0 auto', padding: '13px 18px',
            paddingBottom: 'calc(13px + env(safe-area-inset-bottom))',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ fontSize: 12.5, color: `var(--nura-ink-muted)`, fontFamily: SANS, lineHeight: 1.5, minWidth: 0 }}>
              <div>
                <span style={{ fontFamily: SERIF, color: "var(--nura-accent-text)", fontSize: 15 }}>{days}</span> days
                {' · '}{split}{' · '}{goalLabel}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: SERIF, color: "var(--nura-accent-text)", fontSize: 15 }}>{sessionMin}</span> min
                {' · '}{equipment.length ? equipment.join(', ') : 'No equipment set'}
                {focus.length > 0 && <> · focus: {focus.join(', ')}</>}
              </div>
              {error && <div style={{ color: 'var(--nura-danger-soft)', marginTop: 4 }}>{error}</div>}
            </div>
            <button type="button" className="ps-cta nura-lift" onClick={() => setConfirm(true)} disabled={saving} style={{
              flexShrink: 0, padding: '12px 20px', borderRadius: 13, border: 'none',
              cursor: saving ? 'default' : 'pointer', fontFamily: SANS, fontSize: 13.5, fontWeight: 700,
              color: DARK, background: SAGE_GRAD, boxShadow: '0 8px 26px rgba(var(--nura-sage-rgb),0.45), inset 0 1px 0 rgba(255,255,255,0.4)',
              opacity: saving ? 0.7 : 1, transition: 'opacity 160ms ease',
            }}>
              {saving ? 'Rebuilding…' : 'Update & Regenerate Plan'}
            </button>
          </div>
        </footer>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 22, background: 'var(--nura-scrim-panel)', backdropFilter: 'blur(6px)',
        }} onClick={() => { if (!saving) setConfirm(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 380, borderRadius: 18, padding: 22,
            background: 'var(--nura-modal)',
            border: `1px solid rgba(var(--nura-bg-tint-rgb),0.12)`, boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          }}>
            <h3 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 21, color: 'var(--nura-text-primary)', margin: '0 0 8px', letterSpacing: '-0.2px' }}>
              Regenerate your plan?
            </h3>
            <p style={{ fontSize: 13.5, color: `var(--nura-ink-muted)`, fontFamily: SANS, lineHeight: 1.6, margin: '0 0 20px' }}>
              Regenerate your plan with these settings? This rebuilds your weekly workouts and discards any manual edits.
            </p>
            {error && <p style={{ fontSize: 12.5, color: 'var(--nura-danger-soft)', fontFamily: SANS, margin: '0 0 14px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setConfirm(false)} disabled={saving} style={{
                padding: '10px 16px', borderRadius: 11, cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: 600,
                color: `var(--nura-ink-strong)`, background: SURFACE, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.14)`,
              }}>Cancel</button>
              <button type="button" onClick={runSave} disabled={saving} style={{
                padding: '10px 18px', borderRadius: 11, border: 'none', cursor: saving ? 'default' : 'pointer',
                fontFamily: SANS, fontSize: 13, fontWeight: 700, color: DARK, background: SAGE_GRAD,
                boxShadow: SAGE_ON_SHADOW, opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Rebuilding…' : 'Update & Regenerate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
