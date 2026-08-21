'use client';

// ── Workout Builder ──────────────────────────────────────────────────────────
// Two steps in one full-screen overlay: build the workout (name + exercises),
// then schedule it onto weekdays. Saving writes ordinary program_workouts rows
// into the user's active program — see the custom-workout notes in planData.ts.
//
// Same fixed-overlay pattern as ExerciseDetail and GuidedWorkout: it starts at
// the content edge so it never slides under the docked desktop rail.

import { useEffect, useMemo, useState } from 'react';
import { createCustomWorkout, type CatalogEx, type CustomWorkoutDraft } from './planData';
import { muscleLabel } from './workoutFormat';
import ExerciseMedia, { CLIP_BG } from './ExerciseMedia';
import FitnessBackButton from './FitnessBackButton';

// ── Palette — theme tokens only, so both skins render from one set of values ──
const SAGE = 'var(--nura-sage)';
const ON_SAGE = 'var(--nura-sage-bg-on)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const FAINT = 'var(--nura-ink-faint)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'JetBrains Mono', monospace";
const ACCENT_TEXT = 'var(--nura-accent-text)';

// Defaults for a freshly added exercise, matching the generated plans.
const DEFAULT_SETS = 3;
const DEFAULT_REPS = '8-12';
const DEFAULT_REST = 60;

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']; // index = day_index, 0=Mon

type Picked = { ex: CatalogEx; sets: number; reps: string };

type Props = {
  programId: string;
  catalog: CatalogEx[];
  /** Weekdays that already hold a generated workout, for the schedule step's hint. */
  generatedDays: Set<number>;
  onClose: () => void;
  /** Called after a successful save with the first scheduled day_index (0=Mon). */
  onSaved: (firstDay: number) => void;
  /** Preselect this day_index (0=Mon) — used by "Create a workout for this day". */
  initialDay?: number;
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: '0 0 0 var(--nura-content-left)', zIndex: 100, overflowY: 'auto',
  minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: 20,
  background: 'var(--nura-page-gradient)',
  fontFamily: FONT, color: TEXT,
};

const column: React.CSSProperties = { width: '100%', maxWidth: 'var(--fit-detail, 440px)', paddingBottom: 40 };

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, letterSpacing: '.16em', color: MUT, textTransform: 'uppercase', margin: '0 0 14px' }}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button className="nura-lift" type="button" onClick={onClick} disabled={disabled} style={{
      width: '100%', background: SAGE, color: ON_SAGE, border: 'none', borderRadius: 13,
      padding: 16, fontSize: 15.5, fontWeight: 700, fontFamily: FONT,
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1,
      boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.3)',
      transition: 'opacity var(--nura-dur) var(--nura-ease)',
    }}>{children}</button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', background: 'transparent', color: MUT, border: `1px solid ${LINE}`,
      borderRadius: 13, padding: 14, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
      transition: 'color var(--nura-dur) var(--nura-ease)',
    }}>{children}</button>
  );
}

// Validation and save failures both surface here — never a silent no-op.
function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={{ fontSize: 12.5, color: 'var(--nura-danger-soft)', margin: '0 0 12px', lineHeight: 1.45 }}>
      {children}
    </div>
  );
}

// ── Step 1 — build your workout ──────────────────────────────────────────────

function BuildStep({
  name, picked, catalog, error, onName, onAdd, onRemove, onStep, onNext, onClose,
}: {
  name: string; picked: Picked[]; catalog: CatalogEx[]; error: string | null;
  onName: (v: string) => void;
  onAdd: (c: CatalogEx) => void;
  onRemove: (id: string) => void;
  onStep: (id: string, delta: number) => void;
  onNext: () => void; onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const chosen = useMemo(() => new Set(picked.map((p) => p.ex.id)), [picked]);

  // Search the catalog by name, muscle and equipment. Capped so a bare query
  // doesn't render the whole catalog into the overlay.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((c) => !chosen.has(c.id))
      .filter((c) => `${c.name} ${muscleLabel(c)} ${c.equipment ?? ''}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 24);
  }, [query, catalog, chosen]);

  return (
    <div style={overlay}>
      <div style={column}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <FitnessBackButton onClick={onClose} />
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: MUT }}>STEP 1 OF 2</div>
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-.01em', margin: '0 0 22px' }}>
          Build your <em style={{ color: ACCENT_TEXT, fontStyle: 'italic' }}>workout</em>
        </h1>

        {error && <ErrorLine>{error}</ErrorLine>}

        <SectionHead>Name</SectionHead>
        <input
          aria-label="Workout name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Push day"
          maxLength={60}
          style={{
            width: '100%', boxSizing: 'border-box', background: SURF, border: `1px solid ${LINE}`,
            borderRadius: 13, padding: '14px 15px', fontSize: 15, color: TEXT, fontFamily: FONT,
            marginBottom: 26, outline: 'none',
          }}
        />

        <SectionHead>Add exercises</SectionHead>
        <input
          aria-label="Search the exercise catalog"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — bench, squat, biceps…"
          style={{
            width: '100%', boxSizing: 'border-box', background: SURF, border: `1px solid ${LINE}`,
            borderRadius: 13, padding: '13px 15px', fontSize: 14.5, color: TEXT, fontFamily: FONT,
            marginBottom: 12, outline: 'none',
          }}
        />

        {query.trim() && results.length === 0 && (
          <div style={{ fontSize: 13, color: MUT, padding: '4px 2px 16px' }}>
            Nothing in the catalog matches “{query.trim()}”.
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 22 }}>
            {results.map((c) => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px',
                borderRadius: 11, border: `1px solid ${LINE}`, background: SURF,
              }}>
                <span style={{ width: 40, height: 40, borderRadius: 9, overflow: 'hidden', flexShrink: 0, background: CLIP_BG, border: '1px solid rgba(var(--nura-sage-rgb),.18)' }}>
                  {c.gif_url && <ExerciseMedia src={c.gif_url} alt={c.name} fit="cover" thumb />}
                </span>
                <span style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: 11, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {muscleLabel(c)}{c.equipment ? ` — ${c.equipment}` : ''}
                  </span>
                </span>
                <button type="button" onClick={() => onAdd(c)} aria-label={`Add ${c.name}`} style={{
                  flexShrink: 0, appearance: 'none', cursor: 'pointer', padding: '8px 12px', borderRadius: 10,
                  fontSize: 12.5, fontWeight: 700, fontFamily: FONT, color: ACCENT_TEXT,
                  background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.3)',
                }}>+ Add</button>
              </div>
            ))}
          </div>
        )}

        <SectionHead>Your workout</SectionHead>
        {picked.length === 0 ? (
          <div className="nura-card" style={{ background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '22px 16px', marginBottom: 24, textAlign: 'center', fontSize: 13, color: MUT }}>
            Search above and tap + Add to start building.
          </div>
        ) : (
          <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '4px 16px 6px', marginBottom: 24 }}>
            {picked.map((p, i) => (
              <div key={p.ex.id} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '12px 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(var(--nura-bg-tint-rgb),.06)',
              }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT, width: 16, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.ex.name}</span>
                  <span style={{ display: 'block', fontSize: 11, color: MUT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{muscleLabel(p.ex)}</span>
                </span>
                {/* sets stepper — same 1..6 clamp as the dashboard's edit panel */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                  <button type="button" aria-label={`Fewer sets of ${p.ex.name}`} onClick={() => onStep(p.ex.id, -1)} style={{
                    width: 26, height: 26, borderRadius: 8, border: `1px solid ${LINE}`,
                    background: 'rgba(var(--nura-bg-tint-rgb),.05)', color: TEXT, fontSize: 15, cursor: 'pointer', lineHeight: 1,
                  }}>−</button>
                  <span style={{ minWidth: 42, textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{p.sets} × {p.reps}</span>
                    <span style={{ fontSize: 9, color: MUT, display: 'block', letterSpacing: '.05em' }}>SETS×REPS</span>
                  </span>
                  <button type="button" aria-label={`More sets of ${p.ex.name}`} onClick={() => onStep(p.ex.id, 1)} style={{
                    width: 26, height: 26, borderRadius: 8, border: `1px solid ${LINE}`,
                    background: 'rgba(var(--nura-bg-tint-rgb),.05)', color: TEXT, fontSize: 15, cursor: 'pointer', lineHeight: 1,
                  }}>+</button>
                </span>
                <button type="button" aria-label={`Remove ${p.ex.name}`} onClick={() => onRemove(p.ex.id)} style={{
                  appearance: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--nura-danger-soft)', background: 'var(--nura-tint-danger)', border: '1px solid var(--nura-tint-danger-border)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <PrimaryButton onClick={onNext}>Next — pick your days</PrimaryButton>

      </div>
    </div>
  );
}

// ── Step 2 — when do you train? ──────────────────────────────────────────────

function ScheduleStep({
  name, count, days, generatedDays, saving, error, onToggleDay, onBack, onSave,
}: {
  name: string; count: number; days: Set<number>; generatedDays: Set<number>;
  saving: boolean; error: string | null;
  onToggleDay: (d: number) => void; onBack: () => void; onSave: () => void;
}) {
  const shadowed = [...days].filter((d) => generatedDays.has(d)).sort();

  return (
    <div style={overlay}>
      <div style={column}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <FitnessBackButton onClick={onBack} />
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: MUT }}>STEP 2 OF 2</div>
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-.01em', margin: '0 0 10px' }}>
          When do you <em style={{ color: ACCENT_TEXT, fontStyle: 'italic' }}>train?</em>
        </h1>
        <div style={{ fontSize: 13.5, color: MUT, marginBottom: 26 }}>
          {name} · {count} exercise{count === 1 ? '' : 's'}
        </div>

        {error && <ErrorLine>{error}</ErrorLine>}

        <SectionHead>Days</SectionHead>
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {DAYS.map((label, i) => {
            const on = days.has(i);
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleDay(i)}
                style={{
                  flex: 1, minWidth: 0, appearance: 'none', cursor: 'pointer', padding: '12px 0',
                  borderRadius: 11, fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', fontFamily: FONT,
                  color: on ? ON_SAGE : MUT,
                  background: on ? SAGE : 'rgba(var(--nura-bg-tint-rgb),.05)',
                  border: `1px solid ${on ? SAGE : LINE}`,
                  transition: 'background var(--nura-dur) var(--nura-ease), color var(--nura-dur) var(--nura-ease)',
                }}
              >{label}</button>
            );
          })}
        </div>

        {/* Where the mockup's Replace? YES/NO toggle sits. A workout day holds
            exactly one workout — every screen resolves it through a single-slot
            map keyed by day_index — so "add alongside" isn't expressible and a
            two-state toggle would be a lie. The behaviour is stated instead. */}
        <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, marginBottom: 26 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>This replaces the generated workout</div>
          <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>
            A day holds one workout, so <strong style={{ color: TEXT, fontWeight: 600 }}>{name || 'your workout'}</strong> takes over the days you pick.
            {shadowed.length > 0
              ? ` Right now that replaces the generated workout on ${shadowed.map((d) => DAYS[d]).join(', ')}. Nothing is deleted — delete this workout and the generated one comes back.`
              : ' The days you have picked are free, so nothing is replaced.'}
          </div>
        </div>

        <PrimaryButton onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save workout'}
        </PrimaryButton>
        <div style={{ height: 10 }} />
        <GhostButton onClick={onBack}>Back to exercises</GhostButton>

      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

export default function WorkoutBuilder({ programId, catalog, generatedDays, onClose, onSaved, initialDay }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [days, setDays] = useState<Set<number>>(() => new Set(initialDay != null ? [initialDay] : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape closes the builder, matching the other overlays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const add = (c: CatalogEx) => {
    setError(null);
    setPicked((prev) => prev.some((p) => p.ex.id === c.id)
      ? prev
      : [...prev, { ex: c, sets: DEFAULT_SETS, reps: DEFAULT_REPS }]);
  };
  const remove = (id: string) => setPicked((prev) => prev.filter((p) => p.ex.id !== id));
  const step_ = (id: string, delta: number) => setPicked((prev) => prev.map((p) =>
    p.ex.id === id ? { ...p, sets: Math.max(1, Math.min(6, p.sets + delta)) } : p));

  const toggleDay = (d: number) => {
    setError(null);
    setDays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  // Name and at least one exercise are step 1's gate; days are step 2's.
  const goToDays = () => {
    if (!name.trim()) { setError('Give your workout a name first.'); return; }
    if (picked.length === 0) { setError('Add at least one exercise before picking your days.'); return; }
    setError(null);
    setStep(2);
  };

  const save = async () => {
    if (days.size === 0) { setError('Pick at least one day to train.'); return; }
    setSaving(true);
    setError(null);
    const sortedDays = [...days].sort((a, b) => a - b);
    const draft: CustomWorkoutDraft = {
      name: name.trim(),
      days: sortedDays,
      exercises: picked.map((p) => ({
        exercise_id: p.ex.id, sets: p.sets, reps: p.reps, rest_seconds: DEFAULT_REST,
      })),
    };
    const res = await createCustomWorkout(programId, draft);
    setSaving(false);
    if (res.error) { setError(`Couldn't save your workout — ${res.error}`); return; }
    onSaved(sortedDays[0]);
  };

  if (step === 1) {
    return (
      <BuildStep
        name={name}
        picked={picked}
        catalog={catalog}
        error={error}
        onName={(v) => { setError(null); setName(v); }}
        onAdd={add}
        onRemove={remove}
        onStep={step_}
        onNext={goToDays}
        onClose={onClose}
      />
    );
  }

  return (
    <ScheduleStep
      name={name.trim()}
      count={picked.length}
      days={days}
      generatedDays={generatedDays}
      saving={saving}
      error={error}
      onToggleDay={toggleDay}
      onBack={() => { setError(null); setStep(1); }}
      onSave={save}
    />
  );
}
