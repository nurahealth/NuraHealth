'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GOAL_LABELS } from './FitnessOnboarding';
import ExerciseDetail from './ExerciseDetail';
import ExerciseMedia, { CLIP_BG } from './ExerciseMedia';
import { MUSCLE_GROUPS, CARDIO_GROUP, inGroup } from './muscleGroups';
import {
  loadActiveProgram, loadCatalog, loadProgramSummaries,
  updateExerciseFields, swapExerciseRow, removeExerciseRow, addExerciseRow, reorderExerciseRows,
  loadCompletions, logWorkoutCompletion, deleteCompletion, saveWorkoutLog, localDateKey,
  buildByDay, isCustomWorkout, customGroupId, renameCustomWorkout, deleteCustomWorkout,
  isTrainingWorkout as isTraining, isEmptyWorkout, dayLabel as focusOf,
  type CatalogEx, type Program, type ProgramSummary, type WEx, type Workout, type WorkoutCompletion,
} from './planData';
import { getBufferedSets, clearBufferedSets } from './sessionSets';
import { loadSkips, isSkipped, addSkip, removeSkip } from './skippedDates';
import { titleCase, muscleLabel, estimateMinutes } from './workoutFormat';
import GuidedWorkout from './GuidedWorkout';
import WorkoutBuilder from './WorkoutBuilder';
import RequestExerciseModal from './RequestExerciseModal';
import ThemeToggle from "@/components/ThemeToggle";

// ── Palette (ported verbatim from design-reference/fitness-dashboard.html) ────
const BG = 'var(--nura-bg)';
const SAGE = 'var(--nura-sage)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';

const WEEK_DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']; // week strip is Monday-first
const MONTH_DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];             // month grid is Sunday-first

// ── Date helpers ─────────────────────────────────────────────────────────────
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const programDayIndex = (d: Date) => (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
const startOfWeek = (d: Date) => addDays(d, -programDayIndex(d));
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// ── Display helpers ──────────────────────────────────────────────────────────
// titleCase / muscleLabel / estimateMinutes live in workoutFormat.ts — the
// guided-workout overlay needs the same formatting and can't import from here.
// isTraining / isEmptyWorkout / focusOf come from planData (imported above) so
// the dashboard, the calendar and the plan list share one definition of what an
// empty workout is — see the "What a day actually is" note there.
const lc = (s: string | null | undefined) => (s ?? '').toLowerCase();
function muscleChips(exs: WEx[]): string[] {
  const set = new Set<string>();
  for (const e of exs) {
    if (e.exercise?.body_part) set.add(titleCase(e.exercise.body_part));
    else (e.exercise?.target_muscles ?? []).forEach((m) => m && set.add(titleCase(m)));
  }
  return [...set].slice(0, 5);
}
function candidatesForMuscle(ex: CatalogEx | null, catalog: CatalogEx[]): CatalogEx[] {
  if (!ex) return catalog;
  const targets = new Set((ex.target_muscles ?? []).map(lc).filter(Boolean));
  const bp = lc(ex.body_part);
  return catalog
    .filter((c) => c.id !== ex.id)
    .filter((c) => (c.target_muscles ?? []).map(lc).some((m) => targets.has(m)) || (!!bp && lc(c.body_part) === bp))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function addCandidates(workout: Workout | undefined, catalog: CatalogEx[]): CatalogEx[] {
  const have = new Set(workout?.exercises.map((e) => e.exercise?.id).filter(Boolean));
  const groups = new Set<string>();
  workout?.exercises.forEach((e) => { if (e.exercise?.body_part) groups.add(lc(e.exercise.body_part)); });
  const pool = catalog.filter((c) => !have.has(c.id));
  const rel = pool.filter((c) => groups.has(lc(c.body_part))).sort((a, b) => a.name.localeCompare(b.name));
  const rest = pool.filter((c) => !groups.has(lc(c.body_part))).sort((a, b) => a.name.localeCompare(b.name));
  return [...rel, ...rest];
}
function goalLabel(goal: string | null): string {
  return goal ? (GOAL_LABELS[goal] ?? goal) : 'Training';
}
function programName(p: ProgramSummary): string {
  return p.split_type || goalLabel(p.goal);
}
function programProgress(createdAt: string): number {
  const days = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
  return Math.min(100, Math.round((days / 84) * 100));
}

// ── Catalog picker sheet (swap / add). Carries the same palette as the card. ──
function Sheet({ title, items, onPick, onClose, onRemove, busy }: {
  title: string; items: CatalogEx[]; onPick: (c: CatalogEx) => void; onClose: () => void;
  onRemove?: () => void; busy: boolean;
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 440, maxHeight: '78vh', display: 'flex', flexDirection: 'column',
        background: 'var(--nura-card)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
        border: `1px solid ${LINE}`, borderBottom: 'none', padding: '10px 16px 22px', fontFamily: FONT,
      }}>
        <div style={{ width: 38, height: 4, borderRadius: 999, background: 'rgba(var(--nura-bg-tint-rgb),.2)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{title}</span>
          <button type="button" aria-label="Close" onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, color: MUT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--nura-bg-tint-rgb),.05)', border: `1px solid ${LINE}`,
          }}>✕</button>
        </div>
        {onRemove && (
          <button type="button" disabled={busy} onClick={onRemove} style={{
            appearance: 'none', cursor: 'pointer', width: '100%', marginBottom: 10, padding: 12, borderRadius: 12,
            fontSize: 13, fontWeight: 600, color: 'var(--nura-danger-soft)', background: 'var(--nura-tint-danger)',
            border: '1px solid var(--nura-tint-danger-border)',
          }}>Remove from workout</button>
        )}
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: MUT, padding: '12px 4px' }}>Nothing else in the catalog for this muscle yet.</div>
        ) : (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {items.map((c) => (
              <button key={c.id} type="button" disabled={busy} onClick={() => onPick(c)} style={{
                appearance: 'none', textAlign: 'left', cursor: busy ? 'default' : 'pointer', padding: '11px 12px',
                borderRadius: 11, border: `1px solid ${LINE}`, background: SURF, color: TEXT,
                display: 'flex', flexDirection: 'column', gap: 3,
              }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: MUT }}>{muscleLabel(c)}{c.equipment ? ` — ${c.equipment}` : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Add-exercise sheet: two-level (muscle groups → exercises) ────────────────
function AddSheet({ workout, catalog, onPick, onClose, busy }: {
  workout: Workout | undefined; catalog: CatalogEx[];
  onPick: (c: CatalogEx) => void; onClose: () => void; busy: boolean;
}) {
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [visible, setVisible] = useState(false); // drives the fade + scale enter/exit

  // Animated dismissal: play the exit transition, then actually unmount via onClose.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const requestClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => closeRef.current(), 200);
  }, []);

  // While open: enter animation, Escape-to-close, and a background scroll lock.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestClose]);

  // Addable exercises (excludes ones already in the workout), grouped using the
  // SAME mapping as "Train by muscle". Cardio only appears when it has any.
  const candidates = useMemo(() => addCandidates(workout, catalog), [workout, catalog]);
  const groups = useMemo(() => {
    const base = [...MUSCLE_GROUPS];
    if (candidates.some((c) => inGroup(c, CARDIO_GROUP))) base.push(CARDIO_GROUP);
    return base.map((g) => ({ group: g, items: candidates.filter((c) => inGroup(c, g)) }));
  }, [candidates]);
  const active = groupKey ? groups.find((x) => x.group.key === groupKey) : null;

  return (
    <div onClick={requestClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
      opacity: visible ? 1 : 0, transition: 'opacity 200ms ease',
    }}>
      <div className="nura-card" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: 'var(--nura-card)', borderRadius: 22, overflow: 'hidden',
        border: `1px solid ${LINE}`, padding: '18px 16px', fontFamily: FONT,
        opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(.96)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}>
        {/* header (kept) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Add exercise</span>
          <button type="button" aria-label="Close" onClick={requestClose} style={{
            appearance: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, color: MUT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--nura-bg-tint-rgb),.05)', border: `1px solid ${LINE}`,
          }}>✕</button>
        </div>

        {!active ? (
          // Level 1 — muscle groups
          <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {groups.map(({ group, items }) => (
              <button key={group.key} type="button" onClick={() => setGroupKey(group.key)} style={{
                appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                padding: '14px 14px', borderRadius: 13, border: `1px solid ${LINE}`, background: SURF, color: TEXT,
              }}>
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{group.label}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--nura-accent-text)", padding: '3px 9px', borderRadius: 999, background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.3)' }}>
                    {items.length}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              </button>
            ))}
          </div>
        ) : (
          // Level 2 — exercises in the chosen group
          <>
            <button type="button" onClick={() => setGroupKey(null)} aria-label="Back to muscle groups" style={{
              appearance: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, flexShrink: 0,
              padding: '8px 4px', background: 'transparent', border: 'none', color: SAGE, fontSize: 13, fontWeight: 600, fontFamily: FONT,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              {active.group.label}
            </button>
            {active.items.length === 0 ? (
              <div style={{ fontSize: 13, color: MUT, padding: '12px 4px' }}>No exercises to add in this group right now.</div>
            ) : (
              <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {active.items.map((c) => (
                  <button key={c.id} type="button" disabled={busy} onClick={() => onPick(c)} style={{
                    appearance: 'none', textAlign: 'left', cursor: busy ? 'default' : 'pointer', padding: '10px 12px',
                    borderRadius: 11, border: `1px solid ${LINE}`, background: SURF, color: TEXT,
                    display: 'flex', alignItems: 'center', gap: 11,
                  }}>
                    <span style={{ width: 40, height: 40, borderRadius: 9, overflow: 'hidden', flexShrink: 0, background: CLIP_BG, border: '1px solid rgba(var(--nura-sage-rgb),.18)' }}>
                      {c.gif_url && <ExerciseMedia src={c.gif_url} alt={c.name} fit="cover" thumb />}
                    </span>
                    <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{muscleLabel(c)}{c.equipment ? ` — ${c.equipment}` : ''}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Day actions — the "•••" on a workout card ────────────────────────────────
// Deliberately quiet: two plain-language choices about THIS DATE only, never
// about the schedule. What it offers depends on where the day stands.
function DayActionsSheet({ title, isToday, done, skipped, busy, onMarkDone, onUndoDone, onSkip, onUnskip, onClose }: {
  title: string; isToday: boolean; done: boolean; skipped: boolean; busy: boolean;
  onMarkDone: () => void; onUndoDone: () => void; onSkip: () => void; onUnskip: () => void; onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dayWord = isToday ? 'today' : 'this day';

  const actions: { label: string; hint: string; run: () => void; danger?: boolean }[] = skipped
    ? [{ label: `Put ${dayWord} back`, hint: 'Undo the skip — the workout returns to this date.', run: onUnskip }]
    : done
      ? [{ label: 'Not done after all', hint: 'Removes the tick from this date.', run: onUndoDone, danger: true }]
      : [
          { label: 'Mark as done', hint: 'Ticks this date off without logging any sets.', run: onMarkDone },
          { label: `Skip ${dayWord}`, hint: 'Just this date. Next week is unaffected.', run: onSkip },
        ];

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)',
    }}>
      {/* Centered popup — the design system forbids bottom sheets. */}
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 400, background: 'var(--nura-card)',
        borderRadius: 18, border: `1px solid ${LINE}`, boxShadow: '0 24px 60px rgba(0,0,0,.45)',
        padding: '18px 18px 16px', fontFamily: FONT,
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: MUT, marginBottom: 14 }}>This date only — your weekly schedule stays as it is.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {actions.map((a) => (
            <button key={a.label} type="button" disabled={busy} onClick={a.run} style={{
              appearance: 'none', textAlign: 'left', width: '100%', cursor: busy ? 'default' : 'pointer',
              padding: '13px 14px', borderRadius: 13, background: SURF, opacity: busy ? 0.6 : 1,
              border: `1px solid ${a.danger ? 'var(--nura-tint-danger-border)' : LINE}`,
              color: a.danger ? 'var(--nura-danger-soft)' : TEXT, fontFamily: FONT,
            }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{a.label}</span>
              <span style={{ display: 'block', fontSize: 11.5, color: MUT, marginTop: 3 }}>{a.hint}</span>
            </button>
          ))}
          <button type="button" onClick={onClose} style={{
            appearance: 'none', width: '100%', cursor: 'pointer', padding: '12px 14px', borderRadius: 13,
            background: 'transparent', border: `1px solid ${LINE}`, color: MUT, fontSize: 13.5, fontWeight: 600, fontFamily: FONT,
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FitnessDashboard() {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [catalog, setCatalog] = useState<CatalogEx[]>([]);
  const [summaries, setSummaries] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()));
  const [picker, setPicker] = useState<{ kind: 'swap' | 'add'; weId?: string } | null>(null);
  const [savingCount, setSavingCount] = useState(0);
  // Edit-panel write failures (remove/add). Never swallowed — a failed delete
  // that looked like a success is how exercises appear to vanish.
  const [editErr, setEditErr] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [builderDay, setBuilderDay] = useState<number | null>(null);
  const [reqOpen, setReqOpen] = useState(false);
  const [detailEx, setDetailEx] = useState<{ id: string; sets: number | null; reps: string | null; rest_seconds: number | null } | null>(null);

  // ── Consistency log: real completions + an in-progress session timer ─────────
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  // Active Start→Finish session, scoped to a workout on a specific calendar day.
  const [session, setSession] = useState<{ workoutId: string; dateKey: string; startedAt: number } | null>(null);
  const [logging, setLogging] = useState(false);
  const [completeErr, setCompleteErr] = useState<string | null>(null);
  // Guided Workout Mode — full-screen overlay driving start → log → finish.
  const [guided, setGuided] = useState(false);
  // Workout Builder — user-built workouts scheduled onto weekdays.
  const [building, setBuilding] = useState(false);
  // Rename / delete for the selected custom workout.
  const [renaming, setRenaming] = useState<string | null>(null);   // draft name while editing
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [customBusy, setCustomBusy] = useState(false);
  const [customErr, setCustomErr] = useState<string | null>(null);
  // Per-date actions behind the card's "•••" — skip / mark done, this date only.
  const [skips, setSkips] = useState<Set<string>>(() => new Set());
  const [dayMenu, setDayMenu] = useState(false);
  const [dayBusy, setDayBusy] = useState(false);
  const [dayErr, setDayErr] = useState<string | null>(null);
  // Target for "Edit today's plan": the overlay closes and scrolls here.
  const editPanelRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const programRef = useRef<Program | null>(program);
  useEffect(() => { programRef.current = program; }, [program]);
  const dragIndexRef = useRef<number | null>(null);

  // `land` controls where the view sits after the reload:
  //   undefined → today, or the next training day (the mount behaviour)
  //   'keep'    → leave the user on the day they were looking at
  //   a Date    → go to that day (used after building a workout, to show it)
  const load = useCallback(async (land?: 'keep' | Date) => {
    // Never leave the UI stuck on "Loading…": if any loader rejects (network
    // drop, auth-refresh stall, a chunk that failed to fetch after a deploy),
    // surface it as a visible, retryable error instead of hanging forever.
    try {
      setLoadError(null);
      const [{ program }, cat, sums, comps] = await Promise.all([
        loadActiveProgram(), loadCatalog(), loadProgramSummaries(), loadCompletions(),
      ]);
      setProgram(program); setCatalog(cat); setSummaries(sums); setCompletions(comps); setLoading(false);
      // Land on a real workout: today if it trains, else the next training day.
      if (land instanceof Date) {
        setSelected(startOfDay(land));
      } else if (land !== 'keep' && program) {
        const baseIdx = programDayIndex(today);
        for (let k = 0; k < 7; k++) {
          const w = program.workouts.find((x) => x.day_index === (baseIdx + k) % 7);
          if (w && !w.is_rest && w.exercises.length > 0) { setSelected(addDays(today, k)); break; }
        }
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your fitness plan.');
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    // Arriving from the calendar's "Edit this day's workout" link: ?date=YYYY-MM-DD
    // must beat the auto-jump-to-next-training-day, so it rides load()'s `land`.
    const dp = new URLSearchParams(window.location.search).get('date');
    const explicit = dp && /^\d{4}-\d{2}-\d{2}$/.test(dp) ? new Date(`${dp}T00:00:00`) : undefined;
    void load(explicit);
  }, [load]);
  // Skips live in localStorage, so they can only be read once mounted.
  useEffect(() => { setSkips(loadSkips()); }, []);

  // No active program yet → generate one from the onboarding profile, then reload.
  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/fitness/generate-program', { method: 'POST' });
      if (res.ok) { setLoading(true); await load(); }
    } finally {
      setGenerating(false);
    }
  }, [load]);

  // Shared resolver — one workout per weekday, custom workouts winning their day.
  const byDay = useMemo(() => buildByDay(program?.workouts ?? []), [program]);
  // Days a generated workout already occupies — the builder warns which it shadows.
  const generatedDays = useMemo(() => {
    const s = new Set<number>();
    for (const w of program?.workouts ?? []) {
      if (!isCustomWorkout(w) && !w.is_rest && w.exercises.length > 0) s.add(w.day_index);
    }
    return s;
  }, [program]);
  const selWorkout = byDay.get(programDayIndex(selected));
  const training = isTraining(selWorkout);
  // A scheduled workout with nothing left in it. Never a rest day: it keeps its
  // name, its editor and (when custom) its badge, rename and delete.
  const emptyWorkout = isEmptyWorkout(selWorkout);
  const scrollToEditor = useCallback(() => {
    editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Real completions, indexed by local calendar day for O(1) "done" lookups.
  const completedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const c of completions) s.add(localDateKey(new Date(c.completed_at)));
    return s;
  }, [completions]);
  const selectedKey = localDateKey(selected);
  const selectedDone = completedKeys.has(selectedKey);
  // A skipped date drops that one occurrence — the schedule is untouched.
  const selectedSkipped = isSkipped(skips, selectedKey, selWorkout?.id);
  const sessionActiveHere = !!session && session.dateKey === selectedKey && session.workoutId === selWorkout?.id;

  const reloadCompletions = useCallback(async () => { setCompletions(await loadCompletions()); }, []);

  // Start the session timer (records when "Start workout" was tapped).
  const startWorkout = useCallback(() => {
    if (!selWorkout) return;
    setCompleteErr(null);
    setSession({ workoutId: selWorkout.id, dateKey: selectedKey, startedAt: Date.now() });
  }, [selWorkout, selectedKey]);

  // Finish → flush the sets logged during the session (workout_logs parent, then
  // one set_logs row per set), then INSERT the completion the calendar reads.
  // Sets go first so a failure there leaves nothing half-written and the user can
  // simply tap Finish again; a workout with no logged sets skips straight to the
  // completion.
  // Returns whether the workout was saved, so the guided summary knows to close.
  const finishWorkout = useCallback(async (): Promise<boolean> => {
    if (!selWorkout) return false;
    setLogging(true); setCompleteErr(null);
    const startedAt = sessionActiveHere ? session!.startedAt : null;
    const durationSeconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : null;
    const completedAt = new Date().toISOString();

    const pending = getBufferedSets();
    if (pending.length > 0) {
      const logRes = await saveWorkoutLog({
        programId: program?.id ?? null,
        workoutId: selWorkout.id,
        title: selWorkout.title ?? selWorkout.focus ?? null,
        completedAt,
        durationSeconds,
        sets: pending,
      });
      if (!logRes.ok) {
        // Buffer is intentionally left intact so Finish can be retried.
        console.error('[fitness] finishWorkout: saving sets failed', logRes.error);
        setLogging(false);
        setCompleteErr("Couldn't save your workout — try again");
        return false;
      }
      clearBufferedSets();
    }

    const res = await logWorkoutCompletion({ programWorkoutId: selWorkout.id, completedAt, durationSeconds });
    setLogging(false);
    if (!res.ok) {
      console.error('[fitness] finishWorkout: saving the completion failed', res.error);
      setCompleteErr("Couldn't save your workout — try again");
      return false;
    }
    setSession(null);
    await reloadCompletions();
    return true;
  }, [selWorkout, sessionActiveHere, session, program, reloadCompletions]);

  const runWrite = useCallback(async (fn: () => Promise<string | null>) => {
    setSavingCount((n) => n + 1);
    await fn();
    setSavingCount((n) => Math.max(0, n - 1));
  }, []);
  const mutateWorkout = useCallback((workoutId: string, fn: (exs: WEx[]) => WEx[]) => {
    setProgram((prev) => prev ? {
      ...prev, workouts: prev.workouts.map((w) => w.id === workoutId ? { ...w, exercises: fn(w.exercises) } : w),
    } : prev);
  }, []);

  // Stepper edits SETS (clamped 1..6, matching the reference) with debounced save.
  const stepSets = useCallback((workoutId: string, weId: string, delta: number) => {
    mutateWorkout(workoutId, (exs) => exs.map((e) =>
      e.id === weId ? { ...e, sets: Math.max(1, Math.min(6, (e.sets ?? 0) + delta)) } : e));
    clearTimeout(saveTimers.current[weId]);
    saveTimers.current[weId] = setTimeout(() => {
      const cur = programRef.current?.workouts.find((w) => w.id === workoutId)?.exercises.find((e) => e.id === weId);
      if (cur) runWrite(() => updateExerciseFields(weId, { sets: cur.sets }));
    }, 500);
  }, [mutateWorkout, runWrite]);

  const doSwap = useCallback((workoutId: string, weId: string, next: CatalogEx) => {
    mutateWorkout(workoutId, (exs) => exs.map((e) => e.id === weId ? { ...e, exercise: next } : e));
    setPicker(null);
    runWrite(() => swapExerciseRow(weId, next.id));
  }, [mutateWorkout, runWrite]);

  // Removing an exercise is the one edit that destroys data, so it never runs
  // blind: the previous list is kept and put back if the delete fails, and the
  // failure is shown instead of swallowed. Emptying a workout is recoverable —
  // an empty workout keeps its editor (see isEmptyWorkout in planData), so the
  // user can always add exercises back.
  const doRemove = useCallback((workoutId: string, weId: string) => {
    const before = programRef.current?.workouts.find((w) => w.id === workoutId)?.exercises ?? null;
    mutateWorkout(workoutId, (exs) => exs.filter((e) => e.id !== weId));
    setPicker(null);
    setEditErr(null);
    runWrite(async () => {
      const err = await removeExerciseRow(weId);
      if (err) {
        console.error('[fitness] removeExerciseRow failed', err);
        if (before) mutateWorkout(workoutId, () => before);
        setEditErr("Couldn't remove that exercise — it's still in your workout.");
      }
      return err;
    });
  }, [mutateWorkout, runWrite]);

  const doAdd = useCallback(async (next: CatalogEx) => {
    if (!selWorkout) return;
    setPicker(null);
    const last = selWorkout.exercises[selWorkout.exercises.length - 1];
    const sort_order = selWorkout.exercises.reduce((m, e) => Math.max(m, e.sort_order), 0) + 1;
    const sets = last?.sets ?? 3, reps = last?.reps ?? '8-12', rest_seconds = last?.rest_seconds ?? 75;
    setSavingCount((n) => n + 1);
    setEditErr(null);
    const { id, error } = await addExerciseRow(selWorkout.id, { exercise_id: next.id, sort_order, sets, reps, rest_seconds });
    setSavingCount((n) => Math.max(0, n - 1));
    if (id) mutateWorkout(selWorkout.id, (exs) => [...exs, { id, sort_order, sets, reps, rest_seconds, notes: null, exercise: next }]);
    else {
      // This is the only way back from an empty workout — say so when it fails.
      console.error('[fitness] addExerciseRow failed', error);
      setEditErr("Couldn't add that exercise — try again.");
    }
  }, [selWorkout, mutateWorkout]);

  // Drag-to-reorder (the grip). Authoritative index in a ref so StrictMode's
  // double-invoke of state updaters can't double-apply the move.
  const onDragStartRow = useCallback((i: number) => { dragIndexRef.current = i; setDragIndex(i); }, []);
  const onDragEnterRow = useCallback((workoutId: string, over: number) => {
    const from = dragIndexRef.current;
    if (from === null || from === over) return;
    mutateWorkout(workoutId, (exs) => { const n = [...exs]; const [m] = n.splice(from, 1); n.splice(over, 0, m); return n; });
    dragIndexRef.current = over; setDragIndex(over);
  }, [mutateWorkout]);
  const onDragEndRow = useCallback((workoutId: string) => {
    dragIndexRef.current = null; setDragIndex(null);
    const w = programRef.current?.workouts.find((x) => x.id === workoutId);
    if (!w) return;
    const ordered = w.exercises.map((e, i) => ({ id: e.id, sort_order: i + 1 }));
    mutateWorkout(workoutId, (exs) => exs.map((e, i) => ({ ...e, sort_order: i + 1 })));
    runWrite(() => reorderExerciseRows(ordered));
  }, [mutateWorkout, runWrite]);

  const pickerItems = picker?.kind === 'swap'
    ? candidatesForMuscle(selWorkout?.exercises.find((e) => e.id === picker.weId)?.exercise ?? null, catalog)
    : [];

  // ── Section styles (1:1 with the reference CSS) ─────────────────────────────
  const wrap: React.CSSProperties = {
    minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: 20,
    background: 'var(--nura-page-gradient)',
    fontFamily: FONT, color: TEXT,
  };
  // Standalone screen (own backdrop + bottom nav), so it does not go through
// NuraPageShell. Widened at lg via a CSS var rather than a JS branch.
const app: React.CSSProperties = { width: '100%', maxWidth: 'var(--fit-frame, 440px)', paddingBottom: 90 };
  const segBtn = (on: boolean): React.CSSProperties => ({
    flex: 1, border: 'none', background: on ? SAGE : 'transparent', color: on ? BG : MUT,
    fontSize: 13, fontWeight: 600, padding: 9, borderRadius: 9, cursor: 'pointer', transition: '.18s',
  });

  const heroEyebrow = sameDay(selected, today)
    ? `TODAY · ${selected.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}`
    : selected > today
      // Rest day: the card auto-jumps to the next training day — say so, or the
      // date reads like a mistake next to the week strip's "today" highlight.
      ? `NEXT WORKOUT · ${selected.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}`
      : selected.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
  const editEyebrow = sameDay(selected, today)
    ? "EDIT TODAY'S WORKOUT"
    : `EDIT ${selected.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}'S WORKOUT`;
  // ── Per-date actions ──────────────────────────────────────────────────────
  // All three touch only the selected DATE. None of them edits the schedule.
  const skipDay = useCallback(() => {
    if (!selWorkout) return;
    setSkips(addSkip(selectedKey, selWorkout.id));
    setDayMenu(false);
    setDayErr(null);
  }, [selWorkout, selectedKey]);

  const unskipDay = useCallback(() => {
    if (!selWorkout) return;
    setSkips(removeSkip(selectedKey, selWorkout.id));
    setDayMenu(false);
    setDayErr(null);
  }, [selWorkout, selectedKey]);

  // Mark done writes the same workout_completions row Finish writes, minus the
  // sets and duration — so the calendar tick and streaks behave identically.
  // Timestamped at midday local so no timezone shift can move it to another day.
  const markDone = useCallback(async () => {
    if (!selWorkout) return;
    setDayBusy(true); setDayErr(null);
    const at = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 12, 0, 0);
    const res = await logWorkoutCompletion({
      programWorkoutId: selWorkout.id,
      completedAt: at.toISOString(),
      durationSeconds: null,
    });
    setDayBusy(false);
    if (!res.ok) { setDayErr("Couldn't mark it done — try again"); return; }
    setDayMenu(false);
    setCompletions(await loadCompletions());
  }, [selWorkout, selected]);

  // Undo clears the tick for this date. It removes only the completion row —
  // any sets logged in a real session stay in workout_logs / set_logs.
  const undoDone = useCallback(async () => {
    const row = completions.find((c) => localDateKey(new Date(c.completed_at)) === selectedKey);
    if (!row) { setDayMenu(false); return; }
    setDayBusy(true); setDayErr(null);
    const err = await deleteCompletion(row.id);
    setDayBusy(false);
    if (err) { setDayErr("Couldn't undo it — try again"); return; }
    setDayMenu(false);
    setCompletions(await loadCompletions());
  }, [completions, selectedKey]);

  // ── Rename / delete a custom workout ──────────────────────────────────────
  // Both act on every day-row of the workout via its group id, and both match
  // on the tagged title, so a generated workout can never be caught by them.
  const selGroupId = selWorkout ? customGroupId(selWorkout) : null;

  const commitRename = useCallback(async () => {
    const name = (renaming ?? '').trim();
    if (!selGroupId) return;
    if (!name) { setCustomErr('Give your workout a name.'); return; }
    setCustomBusy(true); setCustomErr(null);
    const err = await renameCustomWorkout(selGroupId, name);
    setCustomBusy(false);
    if (err) { setCustomErr(`Couldn't rename it — ${err}`); return; }
    setRenaming(null);
    await load('keep');
  }, [renaming, selGroupId, load]);

  const doDeleteCustom = useCallback(async () => {
    if (!selGroupId) return;
    setCustomBusy(true); setCustomErr(null);
    const err = await deleteCustomWorkout(selGroupId);
    setCustomBusy(false);
    if (err) { setCustomErr(`Couldn't delete it — ${err}`); return; }
    setConfirmDelete(false);
    await load();
  }, [selGroupId, load]);

  // Guided overlay eyebrow — day + workout title, e.g. "TUESDAY · UPPER BODY".
  const guidedDayLabel = `${selected.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()} · ${focusOf(selWorkout).toUpperCase()}`;

  // Week strip dates (Monday-first week containing today).
  const weekDays = useMemo(() => {
    const mon = startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [today]);

  // Month grid cells (Sunday-first).
  const monthCells = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const firstDow = new Date(y, m, 1).getDay(); // 0=Sun
    const days = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [cursor]);

  return (
    <div style={wrap}>
      <div style={app}>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.22em', color: MUT }}>FITNESS</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.01em', margin: '3px 0 0' }}>Your week</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThemeToggle size={36} />
            {/* Plan Settings entry point — opens /fitness/settings */}
            <button
              type="button"
              aria-label="Customize plan"
              title="Customize plan"
              onClick={() => router.push('/fitness/settings')}
              style={{
                appearance: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', width: 34, height: 34, borderRadius: 11, color: SAGE,
                background: 'rgba(var(--nura-sage-rgb),.14)', border: '1px solid rgba(var(--nura-sage-rgb),.3)',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--nura-sage-rgb),.24)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(var(--nura-sage-rgb),.14)'; }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.78 1.05 1.51 1.05H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(var(--nura-sage-rgb),.14)',
              border: '1px solid rgba(var(--nura-sage-rgb),.3)', color: "var(--nura-accent-text)", fontSize: 11, fontWeight: 700,
              letterSpacing: '.08em', padding: '7px 12px', borderRadius: 999,
            }}>★ PRO</div>
          </div>
        </div>

        {/* segmented toggle */}
        <div style={{ display: 'flex', background: SURF, border: `1px solid ${LINE}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
          <button type="button" style={segBtn(view === 'week')} onClick={() => setView('week')}>Week</button>
          <button type="button" style={segBtn(view === 'month')} onClick={() => setView('month')}>Month</button>
        </div>

        {loadError ? (
          <div style={{ borderRadius: 18, padding: '24px 22px', textAlign: 'center', background: 'var(--nura-tint-danger)', border: '1px solid var(--nura-tint-danger-border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--nura-danger-soft)', marginBottom: 6 }}>Couldn&apos;t load your plan</div>
            <p style={{ fontSize: 13, color: MUT, lineHeight: 1.6, margin: '0 0 16px', wordBreak: 'break-word' }}>{loadError}</p>
            <button type="button" onClick={() => { setLoading(true); load(); }} style={{ appearance: 'none', cursor: 'pointer', border: 'none', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: BG, background: SAGE }}>
              Try again
            </button>
          </div>
        ) : loading ? (
          <div style={{ fontSize: 13, color: MUT, padding: '8px 2px' }}>Loading your week…</div>
        ) : !program ? (
          <div style={{ borderRadius: 18, padding: '28px 24px', textAlign: 'center', background: 'rgba(var(--nura-sage-rgb),.05)', border: '1px solid rgba(var(--nura-sage-rgb),.22)' }}>
            <p style={{ fontSize: 14.5, color: 'var(--nura-ink-strong)', lineHeight: 1.6, margin: '0 0 18px' }}>
              No active program yet — build your weekly plan and it&apos;ll appear here.
            </p>
            <button type="button" onClick={generate} disabled={generating} style={{ appearance: 'none', cursor: generating ? 'default' : 'pointer', border: 'none', padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: BG, background: generating ? 'rgba(var(--nura-sage-rgb),.5)' : SAGE }}>
              {generating ? 'Building your plan…' : 'Build my plan'}
            </button>
          </div>
        ) : (
          <>
            {/* WEEK */}
            {view === 'week' && (
              <div style={{ display: 'flex', gap: 7, marginBottom: 22 }}>
                {weekDays.map((date, i) => {
                  const w = byDay.get(i);
                  const dateKey = localDateKey(date);
                  // A skipped date reads as a rest day here — no training mark.
                  const train = isTraining(w) && !isSkipped(skips, dateKey, w?.id);
                  // An empty workout still owns its day, so the strip keeps its
                  // name (quietly) rather than showing a blank rest slot.
                  const named = train || isEmptyWorkout(w);
                  const isToday = sameDay(date, today);
                  const isSel = sameDay(date, selected);
                  const done = completedKeys.has(dateKey);
                  return (
                    <div
                      className="nura-radius-control"
                      key={i}
                      onClick={() => setSelected(date)}
                      style={{
                        flex: 1, textAlign: 'center', padding: '11px 0 9px', borderRadius: 14, cursor: 'pointer', transition: '.16s',
                        background: isToday ? SAGE : SURF,
                        border: `1px solid ${isToday ? SAGE : isSel ? SAGE : LINE}`,
                        boxShadow: isToday ? '0 8px 22px rgba(var(--nura-sage-rgb),.28)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: 10, letterSpacing: '.05em', color: isToday ? BG : MUT }}>{WEEK_DOW[i]}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 5, color: isToday ? BG : TEXT }}>{date.getDate()}</div>
                      {/* Indicator: a check = a REAL logged completion; a dot = scheduled training. */}
                      <div style={{ height: 12, marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {done ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={isToday ? BG : SAGE} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        ) : (
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? BG : train ? 'rgba(var(--nura-sage-rgb),.55)' : 'transparent' }} />
                        )}
                      </div>
                      {/* Which workout lives here — visible without tapping. */}
                      <div style={{ height: 11, marginTop: 2, padding: '0 4px', fontSize: 8.5, letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isToday ? BG : train ? 'var(--nura-accent-text)' : named ? MUT : 'transparent' }}>
                        {named ? focusOf(w) : '·'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MONTH */}
            {view === 'month' && (
              <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: 16, marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  <span style={{ color: MUT, fontSize: 13, display: 'flex', gap: 14 }}>
                    <span style={{ cursor: 'pointer' }} onClick={() => setCursor((c) => addMonths(c, -1))}>‹</span>
                    <span style={{ cursor: 'pointer' }} onClick={() => setCursor((c) => addMonths(c, 1))}>›</span>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {MONTH_DOW.map((d, i) => (
                    <div key={`h${i}`} style={{ fontSize: 10, color: MUT, textAlign: 'center', paddingBottom: 6 }}>{d}</div>
                  ))}
                  {monthCells.map((date, i) => {
                    if (!date) return <div key={i} style={{ aspectRatio: '1', color: 'transparent' }} />;
                    const w = byDay.get(programDayIndex(date));
                    const dateKey = localDateKey(date);
                    const train = isTraining(w) && !isSkipped(skips, dateKey, w?.id);
                    const named = train || isEmptyWorkout(w);
                    const isToday = sameDay(date, today);
                    const done = completedKeys.has(dateKey);
                    return (
                      <div
                        key={i}
                        onClick={() => { setSelected(date); setView('week'); }}
                        style={{
                          aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                          fontSize: 13, borderRadius: 10, cursor: 'pointer',
                          color: isToday ? BG : train ? TEXT : 'var(--nura-ink-strong)',
                          fontWeight: isToday || train ? 700 : 400,
                          background: isToday ? SAGE : train ? 'rgba(var(--nura-sage-rgb),.16)' : 'transparent',
                        }}
                      >
                        {date.getDate()}
                        {/* check = real completion; dot = scheduled-only */}
                        {done && !isToday ? (
                          <span style={{ position: 'absolute', bottom: 2.5, display: 'flex' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                          </span>
                        ) : named && !isToday ? (
                          <span style={{ position: 'absolute', bottom: 2, maxWidth: '94%', fontSize: 6.5, letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: train ? 'var(--nura-accent-text)' : MUT, fontWeight: 600 }}>{focusOf(w)}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TODAY HERO */}
            <div className={training ? 'nura-flat-accent' : undefined} style={{
              position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 20, marginBottom: 14,
              background: training ? 'linear-gradient(135deg,rgba(var(--nura-sage-rgb),.20),rgba(var(--nura-sage-rgb),.04))' : SURF,
              border: `1px solid ${training ? 'rgba(var(--nura-sage-rgb),.25)' : LINE}`,
            }}>
              <div className="nura-halo" style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(var(--nura-sage-rgb),.35),transparent 70%)', pointerEvents: 'none' }} />
              <svg className="nura-halo" style={{ position: 'absolute', right: -10, bottom: -30, opacity: 0.13 }} width="150" height="150" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.2">
                <path d="M6.5 6.5 17.5 17.5M3 8l3-3M16 21l3-3M8 3 5 6M21 16l-3 3" />
              </svg>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                <span style={{ fontSize: 11, letterSpacing: '.16em', color: "var(--nura-accent-text)" }}>{heroEyebrow}</span>
                {/* Marks a workout the user built themselves. */}
                {selWorkout && isCustomWorkout(selWorkout) && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '.14em', padding: '3px 8px', borderRadius: 999,
                    color: 'var(--nura-sage-bg-on)', background: SAGE,
                  }}>YOURS</span>
                )}
                {/* Quiet overflow: what to do about THIS DATE. */}
                {training && (
                  <button
                    type="button"
                    aria-label="More options for this day"
                    onClick={() => { setDayErr(null); setDayMenu(true); }}
                    style={{
                      marginLeft: 'auto', appearance: 'none', cursor: 'pointer', width: 28, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                      background: 'transparent', border: 'none', color: MUT, fontSize: 15, lineHeight: 1, letterSpacing: '.06em',
                    }}
                  >•••</button>
                )}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '6px 0 4px', position: 'relative' }}>
                {training || emptyWorkout ? focusOf(selWorkout) : 'Rest & recover'}
              </h2>
              <div style={{ fontSize: 13, color: MUT, position: 'relative' }}>
                {training
                  ? `${selWorkout!.exercises.length} exercises · ~${estimateMinutes(selWorkout!.exercises)} min`
                  : emptyWorkout
                    ? 'Empty workout — no exercises yet'
                    : 'Recovery day'}
              </div>
              {/* An empty workout is not a free day: it already owns this slot,
                  so the way forward is to fill it, not to build another one. */}
              {emptyWorkout && (
                <button type="button" className="nura-lift"
                  onClick={scrollToEditor}
                  style={{ position: 'relative', zIndex: 2, marginTop: 16, width: '100%', background: 'transparent', border: '1px dashed rgba(var(--nura-sage-rgb),.45)', color: SAGE, borderRadius: 13, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  + Add exercises
                </button>
              )}
              {!training && !emptyWorkout && (
                <button type="button" className="nura-lift"
                  onClick={() => { setBuilderDay(programDayIndex(selected)); setBuilding(true); }}
                  style={{ position: 'relative', zIndex: 2, marginTop: 16, width: '100%', background: 'transparent', border: '1px dashed rgba(var(--nura-sage-rgb),.45)', color: SAGE, borderRadius: 13, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  + Create a workout for this day
                </button>
              )}
              {training && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '14px 0 16px', position: 'relative' }}>
                  {muscleChips(selWorkout!.exercises).map((c) => (
                    <span key={c} style={{ fontSize: 11, background: 'var(--nura-inset-dark)', border: '1px solid rgba(var(--nura-bg-tint-rgb),.12)', color: TEXT, borderRadius: 999, padding: '5px 11px' }}>{c}</span>
                  ))}
                </div>
              )}
              {training && (
                <div style={{ position: 'relative', zIndex: 2, marginTop: muscleChips(selWorkout!.exercises).length ? 0 : 16 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {selectedSkipped ? (
                      // The occurrence is dropped for this date only.
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'rgba(var(--nura-bg-tint-rgb),.05)', color: MUT, border: `1px solid ${LINE}`, borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 700 }}>
                        Skipped
                      </div>
                    ) : selectedDone ? (
                      // Already logged for this day — show a clear "done" state.
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'rgba(var(--nura-sage-rgb),.16)', color: "var(--nura-accent-text)", border: '1px solid rgba(var(--nura-sage-rgb),.4)', borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 700 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        Completed
                      </div>
                    ) : sessionActiveHere ? (
                      <button className="nura-lift" type="button" onClick={finishWorkout} disabled={logging} style={{ flex: 1, background: SAGE, color: BG, border: 'none', borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 700, cursor: logging ? 'default' : 'pointer', opacity: logging ? 0.7 : 1, boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.3)' }}>
                        {logging ? 'Saving…' : 'Finish workout'}
                      </button>
                    ) : (
                      <button className="nura-lift" type="button" onClick={() => setGuided(true)} style={{ flex: 1, background: SAGE, color: BG, border: 'none', borderRadius: 13, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.3)' }}>
                        Start workout
                      </button>
                    )}
                  </div>
                  {selectedSkipped && (
                    <div style={{ fontSize: 11.5, color: MUT, marginTop: 9 }}>Skipped for this date. It&apos;s back on schedule next week.</div>
                  )}
                  {dayErr && (
                    <div role="alert" style={{ fontSize: 11.5, color: 'var(--nura-danger-soft)', marginTop: 9 }}>{dayErr}</div>
                  )}
                  {sessionActiveHere && !logging && (
                    <div style={{ fontSize: 11.5, color: MUT, marginTop: 9 }}>Workout in progress — tap Finish when you&apos;re done to log it.</div>
                  )}
                  {completeErr && (
                    <div style={{ fontSize: 11.5, color: 'var(--nura-danger-soft)', marginTop: 9 }}>{completeErr}</div>
                  )}
                </div>
              )}
            </div>

            {/* SIMPLE EDIT — also the recovery path for an empty workout, so it
                renders whenever a workout owns this day, exercises or not. */}
            {(training || emptyWorkout) && (
              <div ref={editPanelRef} className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '6px 16px 14px', marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0 6px' }}>
                  <span style={{ fontSize: 13, letterSpacing: '.04em', color: MUT }}>{editEyebrow}</span>
                  <span style={{ fontSize: 13, letterSpacing: '.04em', color: "var(--nura-accent-text)" }}>{savingCount > 0 ? 'saving…' : 'auto-saves'}</span>
                </div>
                <div style={{ fontSize: 11.5, color: MUT, marginTop: 6 }}>
                  {emptyWorkout
                    ? 'This workout has no exercises yet. Add one below and it trains again.'
                    : 'Tap an exercise to log your sets and see how to do it.'}
                </div>
                {editErr && (
                  <div role="alert" style={{ fontSize: 12, color: 'var(--nura-danger-soft)', marginTop: 10 }}>{editErr}</div>
                )}
                {selWorkout!.exercises.map((we, i) => (
                  <div
                    key={we.id}
                    onDragEnter={() => onDragEnterRow(selWorkout!.id, i)}
                    onDragOver={(e) => e.preventDefault()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                      borderTop: '1px solid rgba(var(--nura-bg-tint-rgb),.06)',
                      opacity: dragIndex === i ? 0.5 : 1,
                    }}
                  >
                    <span
                      draggable
                      onDragStart={() => onDragStartRow(i)}
                      onDragEnd={() => onDragEndRow(selWorkout!.id)}
                      style={{ color: 'var(--nura-ink-faint)', cursor: 'grab', touchAction: 'none', display: 'flex' }}
                      aria-label="Drag to reorder"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="9" cy="6" r="1" /><circle cx="15" cy="6" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="9" cy="18" r="1" /><circle cx="15" cy="18" r="1" />
                      </svg>
                    </span>
                    {/* Main tap target: thumbnail + name → how-to detail screen. */}
                    <button
                      type="button"
                      aria-label={`How to: ${we.exercise?.name ?? 'exercise'}`}
                      onClick={() => we.exercise && setDetailEx({ id: we.exercise.id, sets: we.sets, reps: we.reps, rest_seconds: we.rest_seconds })}
                      style={{ appearance: 'none', textAlign: 'left', border: 'none', background: 'transparent', padding: 0, flex: 1, minWidth: 0, cursor: 'pointer', color: TEXT, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 12 }}
                    >
                      <span style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', background: CLIP_BG, border: '1px solid rgba(var(--nura-sage-rgb),.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--nura-accent-text)", fontSize: 11, flexShrink: 0 }}>
                        {we.exercise?.gif_url ? <ExerciseMedia src={we.exercise.gif_url} alt={we.exercise.name} fit="cover" thumb /> : '▶'}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{we.exercise?.name ?? 'Exercise'}</span>
                        <span style={{ display: 'block', fontSize: 11, color: MUT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{muscleLabel(we.exercise)}</span>
                      </span>
                    </button>
                    {/* Sets steppers — their own controls. */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <button type="button" aria-label="Decrease sets" onClick={() => stepSets(selWorkout!.id, we.id, -1)} style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(var(--nura-bg-tint-rgb),.05)', color: TEXT, fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>−</button>
                      <div style={{ minWidth: 42, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, display: 'block' }}>{we.sets ?? 0} × {we.reps ?? '—'}</span>
                        <span style={{ fontSize: 9, color: MUT, display: 'block', letterSpacing: '.05em' }}>SETS×REPS</span>
                      </div>
                      <button type="button" aria-label="Increase sets" onClick={() => stepSets(selWorkout!.id, we.id, 1)} style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${LINE}`, background: 'rgba(var(--nura-bg-tint-rgb),.05)', color: TEXT, fontSize: 15, cursor: 'pointer', lineHeight: 1 }}>+</button>
                    </div>
                    {/* Swap — explicit, separate from the main tap target. */}
                    <button
                      type="button"
                      aria-label={`Swap ${we.exercise?.name ?? 'exercise'}`}
                      title="Swap exercise"
                      onClick={() => setPicker({ kind: 'swap', weId: we.id })}
                      style={{ appearance: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: SAGE, background: 'rgba(var(--nura-sage-rgb),.1)', border: '1px solid rgba(var(--nura-sage-rgb),.28)' }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" /></svg>
                    </button>
                    {/* Remove — its own control. */}
                    <button
                      type="button"
                      aria-label={`Remove ${we.exercise?.name ?? 'exercise'}`}
                      title="Remove exercise"
                      onClick={() => doRemove(selWorkout!.id, we.id)}
                      style={{ appearance: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--nura-danger-soft)', background: 'var(--nura-tint-danger)', border: '1px solid var(--nura-tint-danger-border)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setPicker({ kind: 'add' })} style={{ width: '100%', marginTop: 10, background: 'transparent', border: '1px dashed rgba(var(--nura-sage-rgb),.4)', color: SAGE, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Add exercise
                </button>
                <button type="button" onClick={() => setReqOpen(true)} style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: MUT, fontSize: 12, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Can&apos;t find an exercise? Request it
                </button>

                {/* Rename / delete — only for workouts the user built. Generated
                    workouts never show these and are never touched by them. */}
                {selWorkout && isCustomWorkout(selWorkout) && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${LINE}` }}>
                    {customErr && (
                      <div role="alert" style={{ fontSize: 12, color: 'var(--nura-danger-soft)', marginBottom: 10 }}>{customErr}</div>
                    )}

                    {renaming !== null ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          aria-label="Workout name"
                          value={renaming}
                          maxLength={60}
                          autoFocus
                          onChange={(e) => { setCustomErr(null); setRenaming(e.target.value); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') void commitRename(); if (e.key === 'Escape') { setRenaming(null); setCustomErr(null); } }}
                          style={{ flex: 1, minWidth: 0, background: 'rgba(var(--nura-bg-tint-rgb),.05)', border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 12px', fontSize: 13.5, color: TEXT, fontFamily: FONT, outline: 'none' }}
                        />
                        <button type="button" disabled={customBusy} onClick={() => void commitRename()} style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 10, border: 'none', background: SAGE, color: 'var(--nura-sage-bg-on)', fontSize: 12.5, fontWeight: 700, fontFamily: FONT, cursor: customBusy ? 'default' : 'pointer', opacity: customBusy ? 0.7 : 1 }}>
                          {customBusy ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => { setRenaming(null); setCustomErr(null); }} style={{ flexShrink: 0, padding: '10px 12px', borderRadius: 10, border: `1px solid ${LINE}`, background: 'transparent', color: MUT, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : confirmDelete ? (
                      <div>
                        <div style={{ fontSize: 12.5, color: MUT, marginBottom: 10, lineHeight: 1.5 }}>
                          Delete <strong style={{ color: TEXT, fontWeight: 600 }}>{focusOf(selWorkout)}</strong> from every day it runs? Its completed-day marks go with it. Your generated plan comes back on those days.
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" disabled={customBusy} onClick={() => void doDeleteCustom()} style={{ flex: 1, padding: '11px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: FONT, cursor: customBusy ? 'default' : 'pointer', color: 'var(--nura-danger-soft)', background: 'var(--nura-tint-danger)', border: '1px solid var(--nura-tint-danger-border)', opacity: customBusy ? 0.7 : 1 }}>
                            {customBusy ? 'Deleting…' : 'Yes, delete it'}
                          </button>
                          <button type="button" onClick={() => { setConfirmDelete(false); setCustomErr(null); }} style={{ flex: 1, padding: '11px 12px', borderRadius: 10, border: `1px solid ${LINE}`, background: 'transparent', color: MUT, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                            Keep it
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => { setCustomErr(null); setRenaming(focusOf(selWorkout)); }} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1px solid ${LINE}`, background: 'transparent', color: MUT, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>
                          Rename workout
                        </button>
                        <button type="button" onClick={() => { setCustomErr(null); setConfirmDelete(true); }} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', color: 'var(--nura-danger-soft)', background: 'transparent', border: '1px solid var(--nura-tint-danger-border)' }}>
                          Delete workout
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Build your own — sits with the plan, above the removed Continue list. */}
            {program && (
              <button type="button" onClick={() => { setBuilderDay(null); setBuilding(true); }} className="nura-lift" style={{
                width: '100%', marginBottom: 22, background: 'transparent',
                border: '1px dashed rgba(var(--nura-sage-rgb),.4)', color: SAGE, borderRadius: 14,
                padding: 14, fontSize: 13.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
              }}>
                + Create workout
              </button>
            )}

            {/* Old "Continue" program list removed 2026-08-20: it showed every
                regenerate leftover with age-based fake percentages. The active
                plan lives in the hero; real progress lives in /fitness/progress. */}
          </>
        )}

        {/* bottom nav */}
        <div className="nura-floating" style={{
          position: 'fixed', bottom: 16,
          // Centre on the content area, not the viewport: at lg the body is inset
          // by the docked rail but a fixed element does not inherit that.
          left: 'calc(var(--nura-content-left) + (100vw - var(--nura-content-left)) / 2)',
          transform: 'translateX(-50%)', width: 'min(calc(100% - 40px), 400px)', maxWidth: 400,
          background: 'var(--nura-elevated)', backdropFilter: 'blur(12px)', border: `1px solid ${LINE}`, borderRadius: 20,
          display: 'flex', justifyContent: 'space-around', padding: 12, zIndex: 40,
        }}>
          {[
            { label: 'Home', on: true, to: null, path: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
            { label: 'Calendar', on: false, to: '/fitness/calendar', path: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
            { label: 'Progress', on: false, to: '/fitness/progress', path: <path d="M3 3v18h18M7 14l3-3 3 3 5-5" /> },
            { label: 'Profile', on: false, to: '/fitness/profile', path: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
          ].map((n) => (
            <div key={n.label} onClick={n.to ? () => router.push(n.to!) : undefined} style={{ color: n.on ? SAGE : MUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 9, cursor: n.to ? 'pointer' : 'default' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.path}</svg>
              {n.label}
            </div>
          ))}
        </div>
      </div>

      {picker?.kind === 'swap' && (
        <Sheet
          title="Swap exercise"
          items={pickerItems}
          busy={savingCount > 0}
          onClose={() => setPicker(null)}
          onPick={(c) => picker.weId && doSwap(selWorkout!.id, picker.weId, c)}
        />
      )}

      {picker?.kind === 'add' && (
        <AddSheet
          workout={selWorkout}
          catalog={catalog}
          busy={savingCount > 0}
          onClose={() => setPicker(null)}
          onPick={(c) => doAdd(c)}
        />
      )}

      {dayMenu && selWorkout && (
        <DayActionsSheet
          title={focusOf(selWorkout)}
          isToday={sameDay(selected, today)}
          done={selectedDone}
          skipped={selectedSkipped}
          busy={dayBusy}
          onMarkDone={() => void markDone()}
          onUndoDone={() => void undoDone()}
          onSkip={skipDay}
          onUnskip={unskipDay}
          onClose={() => setDayMenu(false)}
        />
      )}

      {building && program && (
        <WorkoutBuilder
          programId={program.id}
          catalog={catalog}
          generatedDays={generatedDays}
          initialDay={builderDay ?? undefined}
          onClose={() => setBuilding(false)}
          onSaved={(firstDay) => {
            setBuilding(false);
            // Drop the user on the new workout's first day so they see it land.
            const offset = (firstDay - programDayIndex(today) + 7) % 7;
            void load(addDays(today, offset));
          }}
        />
      )}

      {guided && training && (
        <GuidedWorkout
          workout={selWorkout!}
          dayLabel={guidedDayLabel}
          startedAt={sessionActiveHere ? session!.startedAt : null}
          onStart={startWorkout}
          onOpenHowTo={setDetailEx}
          onSave={finishWorkout}
          saving={logging}
          saveError={completeErr}
          onViewProgress={() => router.push('/fitness/progress')}
          onClose={() => setGuided(false)}
          onEditPlan={() => {
            setGuided(false);
            // Let the overlay unmount before scrolling, or the panel isn't laid out yet.
            requestAnimationFrame(() => editPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
          }}
        />
      )}

      {reqOpen && <RequestExerciseModal onClose={() => setReqOpen(false)} />}


      {detailEx && (
        <ExerciseDetail
          exerciseId={detailEx.id}
          sets={detailEx.sets}
          reps={detailEx.reps}
          rest_seconds={detailEx.rest_seconds}
          onClose={() => setDetailEx(null)}
        />
      )}
    </div>
  );
}
