'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GOAL_LABELS } from './FitnessOnboarding';

// ── Palette (NŪRA) ───────────────────────────────────────────────────────────
const SAGE = '#9bb0a5';
const OFF = '235,230,216'; // off-white rgb (#ebe6d8)
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ── Types (shape of the DB read) ─────────────────────────────────────────────
type CatalogEx = {
  id: string;
  name: string;
  target_muscles: string[] | null;
  secondary_muscles: string[] | null;
  body_part: string | null;
  equipment: string | null;
  gif_url: string | null;
};

type WEx = {
  id: string;
  position: number;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
  notes: string | null;
  exercise: CatalogEx | null;
};

type Workout = {
  id: string;
  day_index: number;
  title: string | null;
  focus: string | null;
  is_rest: boolean;
  sort_order: number;
  exercises: WEx[];
};

type Program = {
  id: string;
  goal: string | null;
  split_type: string | null;
  days_per_week: number | null;
  status: string;
  limitations: string | null;
  workouts: Workout[];
};

// PostgREST embedded read. "order" is a reserved word → alias it to `position`.
const PROGRAM_SELECT = `
  id, goal, split_type, days_per_week, status, limitations,
  program_workouts (
    id, day_index, title, focus, is_rest, sort_order,
    workout_exercises (
      id, position:"order", sets, reps, rest_seconds, notes,
      exercise:exercises ( id, name, target_muscles, secondary_muscles, body_part, equipment, gif_url )
    )
  )
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const lc = (s: string | null | undefined) => (s ?? '').toLowerCase();

function muscleLabel(ex: CatalogEx | null): string {
  if (!ex) return '';
  const t = (ex.target_muscles ?? []).filter(Boolean);
  if (t.length) return t.join(', ');
  return ex.body_part ?? '';
}

function prescription(we: WEx): string {
  const sets = we.sets ?? 0;
  const reps = we.reps ?? '—';
  const parts = [`${sets} × ${reps}`];
  if (we.rest_seconds != null) parts.push(`${we.rest_seconds}s rest`);
  return parts.join(' · ');
}

// Same-muscle alternatives from the (partial) catalog: any exercise sharing a
// target muscle, or the same body part. Never throws on a thin catalog.
function candidatesFor(ex: CatalogEx | null, catalog: CatalogEx[]): CatalogEx[] {
  if (!ex) return [];
  const targets = new Set((ex.target_muscles ?? []).map(lc).filter(Boolean));
  const bp = lc(ex.body_part);
  return catalog
    .filter((c) => c.id !== ex.id)
    .filter((c) => {
      const ct = (c.target_muscles ?? []).map(lc);
      return ct.some((m) => targets.has(m)) || (!!bp && lc(c.body_part) === bp);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function goalLabel(goal: string | null): string {
  if (!goal) return 'Training';
  return GOAL_LABELS[goal] ?? goal;
}

// Sort + normalise the raw embedded rows into our typed Program.
function mapProgram(row: Record<string, unknown>): Program {
  const workoutsRaw = (row.program_workouts as Record<string, unknown>[] | null) ?? [];
  const workouts: Workout[] = workoutsRaw
    .map((w) => {
      const exRaw = (w.workout_exercises as Record<string, unknown>[] | null) ?? [];
      const exercises: WEx[] = exRaw
        .map((e) => ({
          id: e.id as string,
          position: (e.position as number) ?? 0,
          sets: (e.sets as number | null) ?? null,
          reps: (e.reps as string | null) ?? null,
          rest_seconds: (e.rest_seconds as number | null) ?? null,
          notes: (e.notes as string | null) ?? null,
          exercise: (e.exercise as CatalogEx | null) ?? null,
        }))
        .sort((a, b) => a.position - b.position);
      return {
        id: w.id as string,
        day_index: (w.day_index as number) ?? 0,
        title: (w.title as string | null) ?? null,
        focus: (w.focus as string | null) ?? null,
        is_rest: !!(w.is_rest as boolean),
        sort_order: (w.sort_order as number) ?? 0,
        exercises,
      };
    })
    .sort((a, b) => a.day_index - b.day_index);
  return {
    id: row.id as string,
    goal: (row.goal as string | null) ?? null,
    split_type: (row.split_type as string | null) ?? null,
    days_per_week: (row.days_per_week as number | null) ?? null,
    status: (row.status as string) ?? 'active',
    limitations: (row.limitations as string | null) ?? null,
    workouts,
  };
}

// ── Icons ────────────────────────────────────────────────────────────────────
const I = ({ children, size = 16 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const PencilIcon = () => <I size={14}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></I>;
const TrashIcon = () => <I size={14}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></I>;
const SparkIcon = ({ size = 20 }: { size?: number }) => <I size={size}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></I>;
const RefreshIcon = () => <I size={14}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></I>;
const RestIcon = () => <I size={18}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></I>;

// ── Small UI atoms ───────────────────────────────────────────────────────────
function ChipButton({
  onClick, children, tone = 'neutral', disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'neutral' | 'sage' | 'danger';
  disabled?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const colors = {
    neutral: { fg: `rgba(${OFF},0.7)`, bg: `rgba(${OFF},0.05)`, bd: `rgba(${OFF},0.14)`, hov: `rgba(${OFF},0.1)` },
    sage: { fg: SAGE, bg: 'rgba(155,176,165,0.12)', bd: 'rgba(155,176,165,0.4)', hov: 'rgba(155,176,165,0.22)' },
    danger: { fg: '#d98b8b', bg: 'rgba(217,139,139,0.1)', bd: 'rgba(217,139,139,0.32)', hov: 'rgba(217,139,139,0.2)' },
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 12px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer',
        fontFamily: SANS, fontSize: 12.5, fontWeight: 500, lineHeight: 1,
        color: colors.fg, background: hov && !disabled ? colors.hov : colors.bg,
        border: `0.5px solid ${colors.bd}`, opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease',
      }}
    >
      {children}
    </button>
  );
}

// ── Exercise editor (inline, beneath a row) ──────────────────────────────────
function ExerciseEditor({
  we, catalog, onPatch, onSwap, onRemove, onClose,
}: {
  we: WEx;
  catalog: CatalogEx[];
  onPatch: (patch: { sets: number; reps: string; rest_seconds: number }) => Promise<string | null>;
  onSwap: (next: CatalogEx) => Promise<string | null>;
  onRemove: () => Promise<string | null>;
  onClose: () => void;
}) {
  const [sets, setSets] = useState(String(we.sets ?? ''));
  const [reps, setReps] = useState(we.reps ?? '');
  const [rest, setRest] = useState(String(we.rest_seconds ?? ''));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const candidates = useMemo(() => candidatesFor(we.exercise, catalog), [we.exercise, catalog]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 9, fontFamily: MONO, fontSize: 13,
    color: `rgb(${OFF})`, background: `rgba(${OFF},0.04)`, border: `1px solid rgba(${OFF},0.14)`,
    outline: 'none',
  };
  const fieldLabel: React.CSSProperties = {
    fontSize: 9.5, fontFamily: MONO, letterSpacing: '1.2px', textTransform: 'uppercase',
    color: `rgba(${OFF},0.45)`, marginBottom: 5, display: 'block',
  };

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true); setErr(null);
    const e = await fn();
    setBusy(false);
    if (e) setErr(e);
    return e;
  };

  const saveNumbers = () =>
    run(() => onPatch({
      sets: Math.max(0, Number.parseInt(sets, 10) || 0),
      reps: reps.trim() || '—',
      rest_seconds: Math.max(0, Number.parseInt(rest, 10) || 0),
    })).then((e) => { if (!e) onClose(); });

  return (
    <div style={{
      margin: '2px 6px 8px', padding: 14, borderRadius: 12,
      background: `rgba(${OFF},0.03)`, border: `1px solid rgba(${OFF},0.1)`,
    }}>
      {/* sets / reps / rest */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Sets</label>
          <input value={sets} onChange={(e) => setSets(e.target.value)} inputMode="numeric" style={inputStyle} />
        </div>
        <div style={{ flex: 1.4 }}>
          <label style={fieldLabel}>Reps</label>
          <input value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8-12" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={fieldLabel}>Rest (s)</label>
          <input value={rest} onChange={(e) => setRest(e.target.value)} inputMode="numeric" style={inputStyle} />
        </div>
      </div>

      {/* swap */}
      <div style={fieldLabel}>Swap for a similar exercise</div>
      {candidates.length === 0 ? (
        <div style={{ fontSize: 12, color: `rgba(${OFF},0.4)`, fontFamily: SANS, lineHeight: 1.5, padding: '2px 0 8px' }}>
          No alternatives in the catalog yet for this muscle.
        </div>
      ) : (
        <div style={{
          maxHeight: 168, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
          margin: '2px 0 4px', paddingRight: 2,
        }}>
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => run(() => onSwap(c))}
              style={{
                appearance: 'none', textAlign: 'left', cursor: busy ? 'default' : 'pointer',
                padding: '8px 10px', borderRadius: 9, border: '1px solid transparent',
                background: 'transparent', fontFamily: SANS, color: `rgb(${OFF})`,
                display: 'flex', flexDirection: 'column', gap: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${OFF},0.05)`; e.currentTarget.style.borderColor = 'rgba(155,176,165,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{c.name}</span>
              <span style={{ fontSize: 10.5, color: `rgba(${OFF},0.42)` }}>
                {muscleLabel(c)}{c.equipment ? ` — ${c.equipment}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {err && (
        <div style={{ fontSize: 11.5, color: '#d98b8b', fontFamily: SANS, marginTop: 8 }}>{err}</div>
      )}

      {/* footer actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <ChipButton tone="danger" disabled={busy} onClick={() => run(onRemove)}>
          <TrashIcon /> Remove
        </ChipButton>
        <div style={{ display: 'flex', gap: 8 }}>
          <ChipButton tone="neutral" disabled={busy} onClick={onClose}>Cancel</ChipButton>
          <ChipButton tone="sage" disabled={busy} onClick={saveNumbers}>Save</ChipButton>
        </div>
      </div>
    </div>
  );
}

// ── Exercise row ─────────────────────────────────────────────────────────────
function ExerciseRow({
  we, open, onToggle, catalog, onPatch, onSwap, onRemove,
}: {
  we: WEx;
  open: boolean;
  onToggle: () => void;
  catalog: CatalogEx[];
  onPatch: (patch: { sets: number; reps: string; rest_seconds: number }) => Promise<string | null>;
  onSwap: (next: CatalogEx) => Promise<string | null>;
  onRemove: () => Promise<string | null>;
}) {
  const [hov, setHov] = useState(false);
  const name = we.exercise?.name ?? 'Exercise';
  return (
    <div>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 11,
          background: open || hov ? `rgba(${OFF},0.045)` : 'transparent',
          transition: 'background 140ms ease',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: `rgb(${OFF})`, lineHeight: 1.3 }}>
            {name}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 4 }}>
            <span style={{ fontSize: 11.5, fontFamily: MONO, letterSpacing: '0.3px', color: SAGE }}>
              {prescription(we)}
            </span>
            {muscleLabel(we.exercise) && (
              <span style={{ fontSize: 11.5, color: `rgba(${OFF},0.42)` }}>
                {muscleLabel(we.exercise)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Close editor' : 'Edit exercise'}
          style={{
            appearance: 'none', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', width: 32, height: 32, borderRadius: 9,
            color: open ? SAGE : `rgba(${OFF},0.5)`,
            background: open ? 'rgba(155,176,165,0.14)' : `rgba(${OFF},0.05)`,
            border: `0.5px solid ${open ? 'rgba(155,176,165,0.4)' : `rgba(${OFF},0.12)`}`,
            transition: 'all 150ms ease',
          }}
        >
          <PencilIcon />
        </button>
      </div>
      {open && we.exercise && (
        <ExerciseEditor
          we={we}
          catalog={catalog}
          onPatch={onPatch}
          onSwap={onSwap}
          onRemove={onRemove}
          onClose={onToggle}
        />
      )}
    </div>
  );
}

// ── Day card ─────────────────────────────────────────────────────────────────
function DayCard({
  workout, index, catalog, openExId, setOpenExId, onPatch, onSwap, onRemove,
}: {
  workout: Workout;
  index: number;
  catalog: CatalogEx[];
  openExId: string | null;
  setOpenExId: (id: string | null) => void;
  onPatch: (weId: string, patch: { sets: number; reps: string; rest_seconds: number }) => Promise<string | null>;
  onSwap: (weId: string, next: CatalogEx) => Promise<string | null>;
  onRemove: (weId: string) => Promise<string | null>;
}) {
  const focus = workout.focus || workout.title || 'Training';

  if (workout.is_rest || workout.exercises.length === 0) {
    return (
      <div style={{
        borderRadius: 16, padding: '16px 18px',
        background: `rgba(${OFF},0.018)`, border: `1px dashed rgba(${OFF},0.1)`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span style={{
          width: 38, height: 38, borderRadius: 11, flexShrink: 0, color: `rgba(${OFF},0.45)`,
          background: `rgba(${OFF},0.04)`, border: `1px solid rgba(${OFF},0.1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <RestIcon />
        </span>
        <div>
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '1.6px', color: `rgba(${OFF},0.4)`, textTransform: 'uppercase' }}>
            Day {index + 1}
          </div>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: `rgba(${OFF},0.62)`, marginTop: 3, letterSpacing: '-0.2px' }}>
            Rest &amp; recover
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: `rgba(${OFF},0.025)`, border: `1px solid rgba(${OFF},0.09)`,
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 12px',
      }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '1.6px', color: `rgba(${OFF},0.42)`, textTransform: 'uppercase' }}>
            Day {index + 1}
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, color: `rgb(${OFF})`, marginTop: 3, letterSpacing: '-0.3px' }}>
            {focus}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontFamily: MONO, letterSpacing: '0.5px', color: SAGE,
          padding: '5px 11px', borderRadius: 999,
          background: 'rgba(155,176,165,0.12)', border: '1px solid rgba(155,176,165,0.28)',
        }}>
          {workout.exercises.length} {workout.exercises.length === 1 ? 'move' : 'moves'}
        </span>
      </div>

      {/* exercises */}
      <div style={{
        padding: '2px 6px 10px', margin: '0 8px', borderTop: `1px solid rgba(${OFF},0.07)`,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {workout.exercises.map((we) => (
          <ExerciseRow
            key={we.id}
            we={we}
            catalog={catalog}
            open={openExId === we.id}
            onToggle={() => setOpenExId(openExId === we.id ? null : we.id)}
            onPatch={(patch) => onPatch(we.id, patch)}
            onSwap={(next) => onSwap(we.id, next)}
            onRemove={() => onRemove(we.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Empty-state recommendation ───────────────────────────────────────────────
function RecommendCard({ onGenerate, generating, error }: {
  onGenerate: () => void;
  generating: boolean;
  error: string | null;
}) {
  return (
    <div style={{
      borderRadius: 18, padding: '28px 24px', textAlign: 'center',
      background: 'rgba(155,176,165,0.05)', border: '1px solid rgba(155,176,165,0.22)',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 52, height: 52, borderRadius: 16, color: SAGE, marginBottom: 16,
        background: 'rgba(155,176,165,0.12)', border: '1px solid rgba(155,176,165,0.3)',
      }}>
        <SparkIcon size={24} />
      </span>
      <div style={{ fontSize: 10.5, fontFamily: MONO, letterSpacing: '2px', color: SAGE, textTransform: 'uppercase', marginBottom: 10 }}>
        NŪRA recommends
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 600, color: `rgb(${OFF})`, margin: '0 0 8px', letterSpacing: '-0.4px' }}>
        Let&apos;s build your weekly plan
      </h3>
      <p style={{ fontSize: 14, color: `rgba(${OFF},0.6)`, fontFamily: SANS, lineHeight: 1.6, margin: '0 auto 20px', maxWidth: 380 }}>
        NŪRA will shape a training week around your goal, experience, available
        equipment and schedule. You can fine-tune every exercise afterward.
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={generating}
        style={{
          appearance: 'none', cursor: generating ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 9,
          padding: '12px 22px', borderRadius: 12, fontFamily: SANS, fontSize: 14, fontWeight: 600,
          color: '#0d0d0e', background: generating ? `rgba(155,176,165,0.5)` : SAGE,
          border: 'none', transition: 'background 160ms ease',
        }}
      >
        {generating ? 'Building your plan…' : (<><SparkIcon size={17} /> Build my plan</>)}
      </button>
      {error && (
        <div style={{ fontSize: 12.5, color: '#d98b8b', fontFamily: SANS, marginTop: 14 }}>{error}</div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function WorkoutPlan() {
  const [program, setProgram] = useState<Program | null>(null);
  const [catalog, setCatalog] = useState<CatalogEx[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openExId, setOpenExId] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);

  // Load the active program + the catalog (for swaps).
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [progRes, catRes] = await Promise.all([
      supabase
        .from('fitness_programs')
        .select(PROGRAM_SELECT)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('exercises')
        .select('id,name,target_muscles,secondary_muscles,body_part,equipment,gif_url'),
    ]);

    setCatalog((catRes.data as CatalogEx[] | null) ?? []);
    if (progRes.error) {
      setError(progRes.error.message);
      setProgram(null);
    } else {
      setProgram(progRes.data ? mapProgram(progRes.data as Record<string, unknown>) : null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await load(); })();
    return () => { cancelled = true; };
  }, [load]);

  // POST the generate route, then re-read from the DB (so we get workout_exercise
  // ids needed for editing). Used by both first build and regenerate.
  const generate = useCallback(async () => {
    setGenerating(true); setError(null); setConfirmRegen(false); setOpenExId(null);
    try {
      const res = await fetch('/api/fitness/generate-program', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? 'Could not build your plan. Please try again.');
        return;
      }
      await load();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [load]);

  // ── Edit operations (RLS scopes them to the owner) ──────────────────────────
  const applyToExercise = (weId: string, fn: (we: WEx) => WEx | null) => {
    setProgram((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workouts: prev.workouts.map((w) => ({
          ...w,
          exercises: w.exercises.flatMap((we) => {
            if (we.id !== weId) return [we];
            const next = fn(we);
            return next ? [next] : [];
          }),
        })),
      };
    });
  };

  const patchExercise = useCallback(async (
    weId: string,
    patch: { sets: number; reps: string; rest_seconds: number },
  ): Promise<string | null> => {
    const { error } = await supabase
      .from('workout_exercises')
      .update({ sets: patch.sets, reps: patch.reps, rest_seconds: patch.rest_seconds })
      .eq('id', weId);
    if (error) return error.message;
    applyToExercise(weId, (we) => ({ ...we, ...patch }));
    return null;
  }, []);

  const swapExercise = useCallback(async (weId: string, next: CatalogEx): Promise<string | null> => {
    const { error } = await supabase
      .from('workout_exercises')
      .update({ exercise_id: next.id })
      .eq('id', weId);
    if (error) return error.message;
    applyToExercise(weId, (we) => ({ ...we, exercise: next }));
    setOpenExId(null);
    return null;
  }, []);

  const removeExercise = useCallback(async (weId: string): Promise<string | null> => {
    const { error } = await supabase.from('workout_exercises').delete().eq('id', weId);
    if (error) return error.message;
    applyToExercise(weId, () => null);
    setOpenExId(null);
    return null;
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  const subtitle = useMemo(() => {
    if (!program) return '';
    const bits = [goalLabel(program.goal)];
    if (program.split_type) bits.push(program.split_type);
    if (program.days_per_week) bits.push(`${program.days_per_week} days / week`);
    return bits.join(' · ');
  }, [program]);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: `rgb(${OFF})`, fontFamily: SANS, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Your weekly plan
          </h2>
          <p style={{ fontSize: 13.5, color: `rgba(${OFF},0.55)`, fontFamily: SANS, margin: 0, lineHeight: 1.6 }}>
            {program ? subtitle : 'A training week, shaped around you.'}
          </p>
        </div>
        {program && (
          confirmRegen ? (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <ChipButton tone="neutral" disabled={generating} onClick={() => setConfirmRegen(false)}>Cancel</ChipButton>
              <ChipButton tone="sage" disabled={generating} onClick={generate}>
                {generating ? 'Rebuilding…' : 'Confirm regenerate'}
              </ChipButton>
            </div>
          ) : (
            <ChipButton tone="neutral" onClick={() => setConfirmRegen(true)}>
              <RefreshIcon /> Regenerate
            </ChipButton>
          )
        )}
      </div>

      {confirmRegen && (
        <div style={{
          fontSize: 12.5, color: `rgba(${OFF},0.6)`, fontFamily: SANS, lineHeight: 1.5,
          padding: '10px 14px', borderRadius: 11, marginBottom: 14,
          background: 'rgba(217,139,139,0.07)', border: '1px solid rgba(217,139,139,0.22)',
        }}>
          Regenerating builds a fresh plan from your profile and discards any edits you&apos;ve made.
        </div>
      )}

      {error && program && (
        <div style={{ fontSize: 12.5, color: '#d98b8b', fontFamily: SANS, marginBottom: 14 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ fontSize: 13, color: `rgba(${OFF},0.45)`, fontFamily: SANS, padding: '8px 2px' }}>Loading your plan…</div>
      ) : !program ? (
        <RecommendCard onGenerate={generate} generating={generating} error={error} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {program.workouts.map((w, i) => (
            <DayCard
              key={w.id}
              workout={w}
              index={i}
              catalog={catalog}
              openExId={openExId}
              setOpenExId={setOpenExId}
              onPatch={patchExercise}
              onSwap={swapExercise}
              onRemove={removeExercise}
            />
          ))}
        </div>
      )}
    </div>
  );
}
