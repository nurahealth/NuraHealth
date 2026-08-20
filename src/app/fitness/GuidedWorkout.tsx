'use client';

// ── Guided Workout Mode ──────────────────────────────────────────────────────
// A full-screen overlay that walks one workout: a start screen (Stage A), then
// logging one exercise — one SET — at a time (Stage B), then a finish summary
// that saves (Stage C).
//
// It owns no persistence of its own. Sets are handed to the existing
// `bufferSets` buffer (see sessionSets.ts) and written by the dashboard's
// existing `finishWorkout` flush, so the data path here is unchanged. Like the
// session timer it lives in memory only for v1 — a reload drops the session.
//
// Same fixed-overlay pattern as ExerciseDetail: it starts at the content edge so
// it never slides under the docked desktop rail.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadSetLogs, type CatalogEx, type Workout } from './planData';
import { bufferSets, type PendingSet } from './sessionSets';
import {
  muscleLabel, estimateMinutes, setsRepsLabel, plannedSets, repsLowEnd, fmtElapsed, fmtWeight,
} from './workoutFormat';
import FitnessBackButton from './FitnessBackButton';

// ── Palette — theme tokens only, so both skins render from one set of values ──
const SAGE = 'var(--nura-sage)';
const ON_SAGE = 'var(--nura-sage-bg-on)';       // ink that sits ON a filled sage surface
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const FAINT = 'var(--nura-ink-faint)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'JetBrains Mono', monospace";
// Sage in dark, ink in light — the token that keeps headings AA-legible in both.
const ACCENT_TEXT = 'var(--nura-accent-text)';

type Stage = 'start' | 'log' | 'done';

// Stable empty map so the summary's memo doesn't rerun while history loads.
const EMPTY_BEST: Map<string, number> = new Map();

/** One exercise the guided flow can actually walk (a row with a catalog match). */
export type Step = {
  weId: string;
  ex: CatalogEx;
  sets: number | null;
  reps: string | null;
  rest_seconds: number | null;
};

/** Most recent set + best ever weight per exercise_id, read from set_logs. */
type History = {
  last: Map<string, { weight: number; reps: number }>;
  best: Map<string, number>;
};

type Props = {
  workout: Workout;
  /** Eyebrow line — day + workout title, e.g. "TUESDAY · UPPER BODY". */
  dayLabel: string;
  /** Session clock, owned by the dashboard. Null until the session starts. */
  startedAt: number | null;
  /** Begin the session (starts the dashboard's Start→Finish timer). */
  onStart: () => void;
  /** Leave guided mode and go back to the dashboard. */
  onClose: () => void;
  /** Close and reveal the existing plan editor for today. */
  onEditPlan: () => void;
  /** Open the existing ExerciseDetail screen as how-to reference. */
  onOpenHowTo: (s: { id: string; sets: number | null; reps: string | null; rest_seconds: number | null }) => void;
  /** The dashboard's existing finishWorkout flush. Resolves true once saved. */
  onSave: () => Promise<boolean>;
  /** True while that flush is in flight. */
  saving: boolean;
  /** The dashboard's existing save error, shown verbatim. */
  saveError: string | null;
  /** Navigate to the progress screen (only ever called after a successful save). */
  onViewProgress: () => void;
};

// ── Shared bits ──────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  // A full-screen SCREEN, not a modal — same treatment as ExerciseDetail, so it
  // starts where the content does rather than under the docked rail.
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
    <button
      className="nura-lift"
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', background: SAGE, color: ON_SAGE, border: 'none', borderRadius: 13,
        padding: 16, fontSize: 15.5, fontWeight: 700, fontFamily: FONT,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1,
        boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.3)',
        transition: 'opacity var(--nura-dur) var(--nura-ease)',
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }: {
  children: React.ReactNode; onClick: () => void; style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', background: 'transparent', color: MUT, border: `1px solid ${LINE}`,
        borderRadius: 13, padding: 14, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
        transition: 'color var(--nura-dur) var(--nura-ease)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function MusclePill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10.5, borderRadius: 999, padding: '4px 9px', whiteSpace: 'nowrap',
      background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.24)',
      color: ACCENT_TEXT,
    }}>{children}</span>
  );
}

// ── Stage A — start screen ───────────────────────────────────────────────────

function StartScreen({ steps, dayLabel, estMinutes, onStart, onClose, onEditPlan }: {
  steps: Step[]; dayLabel: string; estMinutes: number;
  onStart: () => void; onClose: () => void; onEditPlan: () => void;
}) {
  return (
    <div style={overlay}>
      <div style={column}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <FitnessBackButton onClick={onClose} />
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: MUT }}>WORKOUT</div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: '.16em', color: ACCENT_TEXT, marginBottom: 10 }}>
          {dayLabel}
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, lineHeight: 1.08, letterSpacing: '-.01em', margin: '0 0 12px' }}>
          Ready to <em style={{ color: ACCENT_TEXT, fontStyle: 'italic' }}>train?</em>
        </h1>
        <div style={{ fontSize: 13.5, color: MUT, marginBottom: 28 }}>
          {steps.length} exercise{steps.length === 1 ? '' : 's'} · ~{estMinutes} min
        </div>

        <SectionHead>Today&apos;s lineup</SectionHead>
        <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '4px 16px 6px', marginBottom: 26 }}>
          {steps.map((s, i) => (
            <div key={s.weId} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(var(--nura-bg-tint-rgb),.06)',
            }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT, width: 16, flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.ex.name}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                  {muscleLabel(s.ex).split(' · ').filter(Boolean).slice(0, 2).map((m) => (
                    <MusclePill key={m}>{m}</MusclePill>
                  ))}
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 12, color: MUT, flexShrink: 0 }}>
                {setsRepsLabel(s)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton onClick={onStart}>Start workout</PrimaryButton>
          <GhostButton onClick={onEditPlan}>Edit today&apos;s plan</GhostButton>
        </div>

      </div>
    </div>
  );
}

// ── Stage B — logging, one exercise at a time ────────────────────────────────

function ElapsedClock({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ fontFamily: MONO, fontSize: 13, color: ACCENT_TEXT, fontVariantNumeric: 'tabular-nums' }}>
      {fmtElapsed(startedAt ? now - startedAt : 0)}
    </span>
  );
}

function ProgressDots({ total, current, done }: { total: number; current: number; done: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24 }} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{
          height: 6, borderRadius: 999, flex: 1,
          background: i < done ? SAGE : i === current ? 'rgba(var(--nura-sage-rgb),.45)' : 'rgba(var(--nura-bg-tint-rgb),.12)',
          transition: 'background var(--nura-dur) var(--nura-ease)',
        }} />
      ))}
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, background: 'rgba(var(--nura-bg-tint-rgb),.05)', border: `1px solid ${LINE}`,
      color: TEXT, borderRadius: 10, padding: '9px 6px', fontSize: 12.5, fontWeight: 600,
      fontFamily: FONT, cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'background var(--nura-dur) var(--nura-ease)',
    }}>{children}</button>
  );
}

const bigInput: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  fontFamily: MONO, fontSize: 30, fontWeight: 500, color: TEXT, textAlign: 'center',
  padding: 0, minWidth: 0,
};

function LogScreen({
  steps, exIdx, setIdx, weight, reps, history, elapsedFrom,
  onWeight, onReps, onDone, onSkip, onFinishEarly, onHowTo, onClose,
}: {
  steps: Step[]; exIdx: number; setIdx: number; weight: string; reps: string;
  history: History | null; elapsedFrom: number | null;
  onWeight: (v: string) => void; onReps: (v: string) => void;
  onDone: () => void; onSkip: () => void; onFinishEarly: () => void;
  onHowTo: () => void; onClose: () => void;
}) {
  const step = steps[exIdx];
  const total = plannedSets(step);
  const last = history?.last.get(step.ex.id) ?? null;
  const target = repsLowEnd(step.reps);

  // What follows this set — drives the hint under the primary button.
  const nextHint = setIdx + 1 < total
    ? `Set ${setIdx + 2} of ${total} up next`
    : exIdx + 1 < steps.length
      ? `Up next: ${steps[exIdx + 1].ex.name}`
      : 'Last set of the workout';

  return (
    <div style={overlay}>
      <div style={column}>

        {/* header — position in the workout + the session clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <FitnessBackButton onClick={onClose} />
          <div style={{ flex: 1, fontSize: 11, letterSpacing: '.18em', color: MUT }}>
            EXERCISE {exIdx + 1} OF {steps.length}
          </div>
          <ElapsedClock startedAt={elapsedFrom} />
        </div>

        <ProgressDots total={steps.length} current={exIdx} done={exIdx} />

        {/* exercise */}
        <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, lineHeight: 1.14, letterSpacing: '-.01em', margin: '0 0 10px' }}>
          {step.ex.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: MUT }}>
            {[muscleLabel(step.ex), target ? `${step.reps?.replace(/-/g, '–')} reps` : null].filter(Boolean).join(' · ')}
          </div>
          <button type="button" onClick={onHowTo} style={{
            appearance: 'none', background: 'transparent', border: 'none', padding: 0, flexShrink: 0,
            fontSize: 12.5, fontWeight: 600, color: ACCENT_TEXT, fontFamily: FONT, cursor: 'pointer',
          }}>
            How-to ›
          </button>
        </div>

        {/* the one set in play */}
        <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 12, letterSpacing: '.16em', color: ACCENT_TEXT, fontWeight: 700 }}>
              SET {setIdx + 1}
            </span>
            {last && (
              <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10.5, letterSpacing: '.06em', color: FAINT, whiteSpace: 'nowrap' }}>
                LAST TIME: {fmtWeight(last.weight)} × {last.reps}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                aria-label="Weight in pounds"
                inputMode="decimal"
                placeholder="0"
                value={weight}
                onChange={(e) => onWeight(e.target.value.replace(/[^\d.]/g, ''))}
                style={bigInput}
              />
              <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: FAINT, textAlign: 'center', marginTop: 4 }}>WEIGHT (LB)</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: 20, color: FAINT, flexShrink: 0, paddingBottom: 16 }}>×</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                aria-label="Reps"
                inputMode="numeric"
                placeholder="0"
                value={reps}
                onChange={(e) => onReps(e.target.value.replace(/[^\d]/g, ''))}
                style={bigInput}
              />
              <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: FAINT, textAlign: 'center', marginTop: 4 }}>REPS</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Chip onClick={() => onWeight(fmtWeight(Math.max(0, (parseFloat(weight) || 0) - 5)))}>− 5 lb</Chip>
            <Chip onClick={() => onWeight(fmtWeight((parseFloat(weight) || 0) + 5))}>+ 5 lb</Chip>
            <Chip onClick={() => onWeight('0')}>bodyweight</Chip>
          </div>
        </div>

        <PrimaryButton onClick={onDone}>Done — next set</PrimaryButton>
        <div style={{ fontSize: 11.5, color: MUT, textAlign: 'center', margin: '10px 0 20px' }}>{nextHint}</div>

        <div style={{ display: 'flex', gap: 10 }}>
          <GhostButton onClick={onSkip}>Skip exercise</GhostButton>
          <GhostButton onClick={onFinishEarly}>Finish early</GhostButton>
        </div>

      </div>
    </div>
  );
}

// ── Stage C — finish summary ─────────────────────────────────────────────────

/** One exercise's contribution to the summary. */
type SummaryRow = { id: string; name: string; sets: number; topWeight: number; volume: number; isPr: boolean };

/** Roll the buffered sets up into totals + per-exercise rows, flagging new PRs. */
function summarise(steps: Step[], logged: Record<string, PendingSet[]>, best: Map<string, number>) {
  const rows: SummaryRow[] = [];
  let sets = 0;
  let volume = 0;
  for (const step of steps) {
    const entries = logged[step.ex.id];
    if (!entries?.length) continue;
    const top = Math.max(...entries.map((e) => e.weight));
    const vol = entries.reduce((sum, e) => sum + e.weight * e.reps, 0);
    sets += entries.length;
    volume += vol;
    rows.push({
      id: step.ex.id,
      name: step.ex.name,
      sets: entries.length,
      topWeight: top,
      volume: vol,
      // A PR beats the user's previous best for this exercise. A bodyweight set
      // logs at 0 lb and is never a PR.
      isPr: top > 0 && top > (best.get(step.ex.id) ?? 0),
    });
  }
  return { rows, sets, volume, prs: rows.filter((r) => r.isPr).length };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 600, color: TEXT, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: FAINT, marginTop: 5 }}>{label}</div>
    </div>
  );
}

function FinishScreen({
  steps, logged, best, dayLabel, durationMs, saving, saveError, onSave, onViewProgress,
}: {
  steps: Step[]; logged: Record<string, PendingSet[]>; best: Map<string, number>;
  dayLabel: string; durationMs: number | null; saving: boolean; saveError: string | null;
  onSave: () => void; onViewProgress: () => void;
}) {
  const { rows, sets, volume, prs } = useMemo(() => summarise(steps, logged, best), [steps, logged, best]);

  return (
    <div style={overlay}>
      <div style={{ ...column, paddingTop: 24 }}>

        {/* mark — the one emphasis on the screen, so it carries the aura */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div className="nura-halo" aria-hidden style={{
            position: 'absolute', width: 150, height: 150, top: -34, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(circle,rgba(var(--nura-sage-rgb),.34),transparent 70%)',
          }} />
          <div style={{
            position: 'relative', width: 72, height: 72, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--nura-sage-rgb),.14)', border: '1.5px solid rgba(var(--nura-sage-rgb),.45)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 34, fontWeight: 400, lineHeight: 1.1, letterSpacing: '-.01em', margin: '0 0 10px', textAlign: 'center' }}>
          Workout <em style={{ color: ACCENT_TEXT, fontStyle: 'italic' }}>complete</em>
        </h1>
        <div style={{ fontSize: 12.5, color: MUT, textAlign: 'center', marginBottom: 26 }}>
          {dayLabel}{durationMs != null ? ` · ${fmtElapsed(durationMs)}` : ''}
        </div>

        {/* totals */}
        <div className="nura-card" style={{ display: 'flex', background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '18px 10px', marginBottom: 22 }}>
          <Stat label="SETS" value={String(sets)} />
          <Stat label="LB VOLUME" value={volume.toLocaleString('en-US')} />
          <Stat label="NEW PRS" value={String(prs)} />
        </div>

        {rows.length > 0 ? (
          <>
            <SectionHead>What you logged</SectionHead>
            <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '4px 16px 6px', marginBottom: 22 }}>
              {rows.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(var(--nura-bg-tint-rgb),.06)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    {r.isPr && (
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: ACCENT_TEXT, marginTop: 5 }}>
                        PR ▲
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: MUT, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {r.sets} × {fmtWeight(r.topWeight)} lb
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: MUT, textAlign: 'center', marginBottom: 22 }}>
            No sets logged — saving still marks the day complete.
          </div>
        )}

        {saveError && (
          <div style={{ fontSize: 12, color: 'var(--nura-danger-soft)', textAlign: 'center', marginBottom: 12 }}>{saveError}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save workout'}
          </PrimaryButton>
          <GhostButton onClick={onViewProgress}>View progress</GhostButton>
        </div>

      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

export default function GuidedWorkout({
  workout, dayLabel, startedAt, onStart, onClose, onEditPlan, onOpenHowTo,
  onSave, saving, saveError, onViewProgress,
}: Props) {
  const [stage, setStage] = useState<Stage>('start');
  // Frozen at the moment the summary opens, so the duration stops counting.
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [history, setHistory] = useState<History | null>(null);
  // Sets logged in this session, per exercise — state, because the summary
  // renders from it. bufferSets REPLACES an exercise's entries, so every flush
  // hands over that exercise's full cumulative list.
  const [logged, setLogged] = useState<Record<string, PendingSet[]>>({});

  // Only rows with a catalog match can be walked — the guided flow needs an
  // exercise id to log against and a name to show.
  const steps = useMemo<Step[]>(
    () => workout.exercises.flatMap((we) => we.exercise
      ? [{ weId: we.id, ex: we.exercise, sets: we.sets, reps: we.reps, rest_seconds: we.rest_seconds }]
      : []),
    [workout],
  );
  const estMinutes = useMemo(() => estimateMinutes(workout.exercises), [workout]);

  // History for "LAST TIME" and (in the summary) new PRs. One read on mount, so
  // Stage B never waits on the network mid-set.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await loadSetLogs();          // oldest → newest
      if (cancelled) return;
      const last = new Map<string, { weight: number; reps: number }>();
      const best = new Map<string, number>();
      for (const r of rows) {
        const w = r.weight ?? 0;
        last.set(r.exercise_id, { weight: w, reps: r.reps ?? 0 });   // later rows win
        best.set(r.exercise_id, Math.max(best.get(r.exercise_id) ?? 0, w));
      }
      setHistory({ last, best });
    })();
    return () => { cancelled = true; };
  }, []);

  // Seed the inputs for a set: reps default to the plan's low end, weight carries
  // over within an exercise (and starts empty on a new one).
  const seedInputs = useCallback((idx: number, carry: string) => {
    const s = steps[idx];
    setReps(s ? repsLowEnd(s.reps) : '');
    setWeight(carry);
  }, [steps]);

  const begin = () => {
    onStart();
    seedInputs(0, '');
    setStage('log');
  };

  // End of the walk — freeze the clock and show the summary.
  const finish = useCallback(() => {
    setFinishedAt(Date.now());
    setStage('done');
  }, []);

  // Move to the next set, the next exercise, or the end.
  const advance = useCallback((fromEx: number, fromSet: number, carry: string) => {
    const step = steps[fromEx];
    if (step && fromSet + 1 < plannedSets(step)) {
      setSetIdx(fromSet + 1);
      seedInputs(fromEx, carry);
      return;
    }
    if (fromEx + 1 < steps.length) {
      setExIdx(fromEx + 1);
      setSetIdx(0);
      seedInputs(fromEx + 1, '');
      return;
    }
    finish();
  }, [steps, seedInputs, finish]);

  const doneSet = useCallback(() => {
    const step = steps[exIdx];
    if (!step) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const entry: PendingSet = {
      exerciseId: step.ex.id,
      setNumber: setIdx + 1,
      // Weight is optional — bodyweight and stretch sets log at 0 lb.
      weight: Number.isFinite(w) && w > 0 ? w : 0,
      reps: Number.isFinite(r) ? r : 0,
    };
    const next = [...(logged[step.ex.id] ?? []).filter((s) => s.setNumber !== entry.setNumber), entry]
      .sort((a, b) => a.setNumber - b.setNumber);
    setLogged({ ...logged, [step.ex.id]: next });
    bufferSets(step.ex.id, next);
    advance(exIdx, setIdx, weight);
  }, [steps, exIdx, setIdx, weight, reps, logged, advance]);

  // Skip leaves the buffer alone — anything already logged for this exercise stands.
  const skipExercise = useCallback(() => {
    if (exIdx + 1 < steps.length) {
      setExIdx(exIdx + 1);
      setSetIdx(0);
      seedInputs(exIdx + 1, '');
    } else {
      finish();
    }
  }, [exIdx, steps.length, seedInputs, finish]);

  // Both summary actions save first; the ghost only navigates once that lands.
  const save = useCallback(async (then: () => void) => {
    if (saving) return;
    if (await onSave()) then();
  }, [saving, onSave]);

  if (steps.length === 0) return null;

  if (stage === 'start') {
    return (
      <StartScreen
        steps={steps}
        dayLabel={dayLabel}
        estMinutes={estMinutes}
        onStart={begin}
        onClose={onClose}
        onEditPlan={onEditPlan}
      />
    );
  }

  if (stage === 'done') {
    return (
      <FinishScreen
        steps={steps}
        logged={logged}
        best={history?.best ?? EMPTY_BEST}
        dayLabel={dayLabel}
        durationMs={startedAt != null && finishedAt != null ? finishedAt - startedAt : null}
        saving={saving}
        saveError={saveError}
        onSave={() => { void save(onClose); }}
        onViewProgress={() => { void save(onViewProgress); }}
      />
    );
  }

  return (
    <LogScreen
      steps={steps}
      exIdx={exIdx}
      setIdx={setIdx}
      weight={weight}
      reps={reps}
      history={history}
      elapsedFrom={startedAt}
      onWeight={setWeight}
      onReps={setReps}
      onDone={doneSet}
      onSkip={skipExercise}
      onFinishEarly={finish}
      onHowTo={() => onOpenHowTo({
        id: steps[exIdx].ex.id,
        sets: steps[exIdx].sets,
        reps: steps[exIdx].reps,
        rest_seconds: steps[exIdx].rest_seconds,
      })}
      onClose={onClose}
    />
  );
}
