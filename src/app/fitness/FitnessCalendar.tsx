'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FitnessBackButton from './FitnessBackButton';
import { loadActiveProgram, loadCompletions, localDateKey, buildByDay, type Program, type WEx, type Workout } from './planData';

// ── Palette (NŪRA) ───────────────────────────────────────────────────────────
const SAGE = 'var(--nura-sage)';
const BG = 'var(--nura-bg)';
const SANS = "var(--font-inter), system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAYS_MIN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Date helpers (Monday-first week; program day_index 0..6 → Mon..Sun) ───────
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => { const x = startOfDay(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
// JS getDay(): 0=Sun..6=Sat → Monday-based index.
const programDayIndex = (d: Date) => (d.getDay() + 6) % 7;
const startOfWeek = (d: Date) => addDays(d, -programDayIndex(d));
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// 42-cell (6×7) month matrix beginning on the Monday on/before the 1st.
function monthMatrix(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// ── Display helpers ──────────────────────────────────────────────────────────
function muscleLabel(ex: WEx['exercise']): string {
  if (!ex) return '';
  const t = (ex.target_muscles ?? []).filter(Boolean);
  return t.length ? t.join(', ') : (ex.body_part ?? '');
}
function prescription(we: WEx): string {
  const parts = [`${we.sets ?? 0} × ${we.reps ?? '—'}`];
  if (we.rest_seconds != null) parts.push(`${we.rest_seconds}s rest`);
  return parts.join(' · ');
}
// A day is "training" only if it has a non-rest workout with exercises.
function isTraining(w: Workout | undefined): w is Workout {
  return !!w && !w.is_rest && w.exercises.length > 0;
}
function focusOf(w: Workout | undefined): string {
  return isTraining(w) ? (w.focus || w.title || 'Training') : 'Rest';
}

// ── Icons ────────────────────────────────────────────────────────────────────
const I = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const Chevron = ({ dir }: { dir: 'left' | 'right' }) => (
  <I size={18}><path d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></I>
);
const RestIcon = ({ size = 16 }: { size?: number }) => <I size={size}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></I>;

// ── Segmented Week / Month toggle ────────────────────────────────────────────
function ViewToggle({ view, setView }: { view: 'week' | 'month'; setView: (v: 'week' | 'month') => void }) {
  return (
    <div style={{
      display: 'inline-flex', padding: 3, borderRadius: 11, gap: 2,
      background: `rgba(var(--nura-bg-tint-rgb),0.05)`, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.12)`,
    }}>
      {(['week', 'month'] as const).map((v) => {
        const active = view === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            style={{
              appearance: 'none', cursor: 'pointer', border: 'none',
              padding: '6px 16px', borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600,
              textTransform: 'capitalize', transition: 'all 150ms ease',
              color: active ? BG : `var(--nura-ink-muted)`,
              background: active ? SAGE : 'transparent',
            }}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

// ── Period navigator (‹ Label ›) ─────────────────────────────────────────────
function PeriodNav({ label, onPrev, onNext, onToday }: {
  label: string; onPrev: () => void; onNext: () => void; onToday: () => void;
}) {
  const navBtn: React.CSSProperties = {
    appearance: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 34, height: 34, borderRadius: 10, color: `var(--nura-ink-strong)`,
    background: `rgba(var(--nura-bg-tint-rgb),0.05)`, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.12)`,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" aria-label="Previous" onClick={onPrev} style={navBtn}><Chevron dir="left" /></button>
      <button
        type="button"
        onClick={onToday}
        style={{
          appearance: 'none', cursor: 'pointer', minWidth: 132, textAlign: 'center',
          fontFamily: SANS, fontSize: 15, fontWeight: 600, color: 'var(--nura-text-primary)',
          background: 'transparent', border: 'none', letterSpacing: '-0.2px',
        }}
      >
        {label}
      </button>
      <button type="button" aria-label="Next" onClick={onNext} style={navBtn}><Chevron dir="right" /></button>
    </div>
  );
}

// ── Week view (vertical, one row per day) ────────────────────────────────────
function WeekView({ cursor, byDay, today, completedKeys, onPick }: {
  cursor: Date; byDay: Map<number, Workout>; today: Date; completedKeys: Set<string>; onPick: (d: Date) => void;
}) {
  const monday = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {days.map((date, i) => {
        const w = byDay.get(i);
        const training = isTraining(w);
        const isToday = sameDay(date, today);
        const done = completedKeys.has(localDateKey(date));
        return (
          <button
            className="nura-radius-control"
            key={i}
            type="button"
            onClick={() => onPick(date)}
            style={{
              appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14,
              fontFamily: SANS,
              background: training ? 'rgba(var(--nura-sage-rgb),0.07)' : `rgba(var(--nura-bg-tint-rgb),0.02)`,
              border: `1px solid ${isToday ? 'rgba(var(--nura-sage-rgb),0.55)' : training ? 'rgba(var(--nura-sage-rgb),0.2)' : `rgba(var(--nura-bg-tint-rgb),0.08)`}`,
              transition: 'border-color 150ms ease',
            }}
          >
            <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '1px', color: `var(--nura-text-tertiary)`, textTransform: 'uppercase' }}>
                {WEEKDAYS[i]}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: isToday ? SAGE : 'var(--nura-text-primary)', marginTop: 2 }}>
                {date.getDate()}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, color: training ? 'var(--nura-text-primary)' : `var(--nura-text-secondary)`, letterSpacing: '-0.2px' }}>
                {focusOf(w)}
              </div>
              <div style={{ fontSize: 12, color: done ? SAGE : training ? SAGE : `var(--nura-text-tertiary)`, fontFamily: training ? MONO : SANS, marginTop: 3, letterSpacing: training ? '0.3px' : 0 }}>
                {done ? 'Completed ✓' : training ? `${w!.exercises.length} ${w!.exercises.length === 1 ? 'exercise' : 'exercises'}` : 'Recovery'}
              </div>
            </div>
            {done ? (
              <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: SAGE }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
            ) : training ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`var(--nura-ink-faint)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            ) : (
              <span style={{ color: `var(--nura-ink-faint)`, flexShrink: 0 }}><RestIcon size={18} /></span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Month view (6×7 grid) ────────────────────────────────────────────────────
function MonthView({ cursor, byDay, today, completedKeys, onPick }: {
  cursor: Date; byDay: Map<number, Workout>; today: Date; completedKeys: Set<string>; onPick: (d: Date) => void;
}) {
  const cells = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const month = cursor.getMonth();
  return (
    <div>
      {/* weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 8 }}>
        {WEEKDAYS_MIN.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontFamily: MONO, letterSpacing: '0.5px', color: `var(--nura-text-tertiary)`, textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>
      {/* grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {cells.map((date, i) => {
          const inMonth = date.getMonth() === month;
          const w = byDay.get(programDayIndex(date));
          const training = isTraining(w);
          const isToday = sameDay(date, today);
          const done = completedKeys.has(localDateKey(date));
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(date)}
              style={{
                appearance: 'none', cursor: 'pointer', fontFamily: SANS,
                aspectRatio: '1 / 1', minHeight: 0, padding: '6px 4px 5px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 3,
                borderRadius: 11, opacity: inMonth ? 1 : 0.32,
                background: training && inMonth ? 'rgba(var(--nura-sage-rgb),0.1)' : `rgba(var(--nura-bg-tint-rgb),0.02)`,
                border: `1px solid ${isToday ? 'rgba(var(--nura-sage-rgb),0.6)' : training && inMonth ? 'rgba(var(--nura-sage-rgb),0.22)' : `rgba(var(--nura-bg-tint-rgb),0.07)`}`,
                transition: 'border-color 150ms ease',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1, color: isToday ? SAGE : 'var(--nura-text-primary)' }}>
                {date.getDate()}
              </span>
              {done ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 15, height: 15, borderRadius: '50%', background: SAGE, marginTop: 1 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
              ) : training ? (
                <span style={{
                  fontSize: 8.5, fontFamily: MONO, letterSpacing: '0.2px', lineHeight: 1.1, textAlign: 'center',
                  color: "var(--nura-accent-text)", maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {(w!.focus || 'Train').split(' ')[0]}
                </span>
              ) : (
                <span style={{ width: 4, height: 4, borderRadius: 999, background: `rgba(var(--nura-bg-tint-rgb),0.18)`, marginTop: 2 }} />
              )}
            </button>
          );
        })}
      </div>
      {/* legend */}
      <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingLeft: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: `var(--nura-text-secondary)`, fontFamily: SANS }}>
          <span style={{ width: 11, height: 11, borderRadius: 4, background: 'rgba(var(--nura-sage-rgb),0.22)', border: '1px solid rgba(var(--nura-sage-rgb),0.4)' }} /> Training
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: `var(--nura-text-secondary)`, fontFamily: SANS }}>
          <span style={{ width: 4, height: 4, borderRadius: 999, background: `rgba(var(--nura-bg-tint-rgb),0.18)` }} /> Rest
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: `var(--nura-text-secondary)`, fontFamily: SANS }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 13, height: 13, borderRadius: '50%', background: SAGE }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span> Done
        </span>
      </div>
    </div>
  );
}

// ── Day workout modal (opens on tapping a day) ───────────────────────────────
// Centered modal — shell/animation/close reuse the "Add exercise" modal
// (FitnessDashboard → AddSheet) 1:1. The date/content/badge/button styling is
// kept verbatim from the previous bottom sheet.
function DaySheet({ date, workout, done, onClose }: {
  date: Date; workout: Workout | undefined; done: boolean; onClose: () => void;
}) {
  const training = isTraining(workout);
  const heading = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

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

  return (
    <div onClick={requestClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
      opacity: visible ? 1 : 0, transition: 'opacity 200ms ease',
    }}>
      <div className="nura-card" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: 'var(--nura-card)', borderRadius: 22, overflow: 'hidden',
        border: `1px solid rgba(var(--nura-bg-tint-rgb),.09)`, padding: '18px 16px',
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif',
        opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(.96)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}>
        {/* header (date + focus + completed badge, ✕ close) — pinned */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '1.4px', color: `var(--nura-text-tertiary)`, textTransform: 'uppercase' }}>
              {heading}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: training ? 'var(--nura-text-primary)' : `var(--nura-ink-strong)`, marginTop: 5, letterSpacing: '-0.4px' }}>
              {focusOf(workout)}
            </div>
            {done && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 10px', borderRadius: 999, background: 'rgba(var(--nura-sage-rgb),0.16)', border: '1px solid rgba(var(--nura-sage-rgb),0.4)', color: "var(--nura-accent-text)", fontSize: 12, fontWeight: 600, fontFamily: SANS }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                Completed
              </span>
            )}
          </div>
          <button type="button" aria-label="Close" onClick={requestClose} style={{
            appearance: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, color: `var(--nura-text-secondary)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: 'rgba(var(--nura-bg-tint-rgb),.05)', border: `1px solid rgba(var(--nura-bg-tint-rgb),.09)`,
          }}>✕</button>
        </div>

        {/* body — scrolls if taller than the modal, which stays centered */}
        <div style={{ overflowY: 'auto', minHeight: 0 }}>
          {!training ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px', borderRadius: 14,
              background: `rgba(var(--nura-bg-tint-rgb),0.02)`, border: `1px dashed rgba(var(--nura-bg-tint-rgb),0.1)`,
            }}>
              <span style={{ color: `var(--nura-text-tertiary)` }}><RestIcon size={20} /></span>
              <span style={{ fontSize: 14, color: `var(--nura-ink-muted)`, fontFamily: SANS }}>Rest &amp; recover — no training scheduled.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workout!.exercises.map((we) => (
                <div
                  key={we.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                    background: `rgba(var(--nura-bg-tint-rgb),0.03)`, border: `1px solid rgba(var(--nura-bg-tint-rgb),0.08)`,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500, color: 'var(--nura-text-primary)', lineHeight: 1.3 }}>
                      {we.exercise?.name ?? 'Exercise'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 8px', marginTop: 4 }}>
                      <span style={{ fontSize: 11.5, fontFamily: MONO, letterSpacing: '0.3px', color: "var(--nura-accent-label)" }}>{prescription(we)}</span>
                      {muscleLabel(we.exercise) && (
                        <span style={{ fontSize: 11.5, color: `var(--nura-text-tertiary)` }}>{muscleLabel(we.exercise)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/fitness"
            style={{
              display: 'block', textAlign: 'center', marginTop: 18, textDecoration: 'none',
              fontSize: 13, fontWeight: 500, color: SAGE, fontFamily: SANS,
              padding: '11px', borderRadius: 11, background: 'rgba(var(--nura-sage-rgb),0.1)',
              border: '1px solid rgba(var(--nura-sage-rgb),0.3)',
            }}
          >
            Edit in plan →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FitnessCalendar() {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(() => new Set());

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ program, error }, comps] = await Promise.all([loadActiveProgram(), loadCompletions()]);
      if (cancelled) return;
      setProgram(program);
      setError(error);
      setCompletedKeys(new Set(comps.map((c) => localDateKey(new Date(c.completed_at)))));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // day_index (0=Mon..6=Sun) → workout
  const byDay = useMemo(() => buildByDay(program?.workouts ?? []), [program]);

  const label = view === 'week'
    ? (() => {
        const mon = startOfWeek(cursor);
        const sun = addDays(mon, 6);
        const sameMonth = mon.getMonth() === sun.getMonth();
        const a = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const b = sun.toLocaleDateString('en-US', sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' });
        return `${a} – ${b}`;
      })()
    : cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const step = (dir: number) => setCursor((c) => (view === 'week' ? addDays(c, dir * 7) : addMonths(c, dir)));

  const subtitle = program
    ? [program.split_type, program.days_per_week ? `${program.days_per_week} days / week` : null].filter(Boolean).join(' · ')
    : 'Your training schedule at a glance.';

  return (
    <div>
      {/* Heading */}
      <div style={{ marginBottom: 20 }}>
        <FitnessBackButton onClick={() => router.push('/fitness')} style={{ marginBottom: 14 }} />
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--nura-text-primary)', fontFamily: SANS, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Calendar
        </h1>
        <p style={{ fontSize: 14, color: `var(--nura-text-secondary)`, fontFamily: SANS, margin: 0, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: `var(--nura-text-tertiary)`, fontFamily: SANS, padding: '8px 2px' }}>Loading your schedule…</div>
      ) : !program ? (
        <div style={{
          borderRadius: 18, padding: '28px 24px', textAlign: 'center',
          background: 'rgba(var(--nura-sage-rgb),0.05)', border: '1px solid rgba(var(--nura-sage-rgb),0.22)',
        }}>
          <p style={{ fontSize: 14.5, color: `var(--nura-ink-strong)`, fontFamily: SANS, lineHeight: 1.6, margin: '0 0 18px' }}>
            No active program yet — build your weekly plan and it&apos;ll show up here.
          </p>
          <Link
            href="/fitness"
            style={{
              display: 'inline-block', textDecoration: 'none', padding: '11px 22px', borderRadius: 12,
              fontFamily: SANS, fontSize: 14, fontWeight: 600, color: BG, background: SAGE,
            }}
          >
            Build my plan
          </Link>
        </div>
      ) : (
        <>
          {error && <div style={{ fontSize: 12.5, color: 'var(--nura-danger-soft)', fontFamily: SANS, marginBottom: 12 }}>{error}</div>}

          {/* controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <PeriodNav label={label} onPrev={() => step(-1)} onNext={() => step(1)} onToday={() => setCursor(startOfDay(new Date()))} />
            <ViewToggle view={view} setView={setView} />
          </div>

          {view === 'week'
            ? <WeekView cursor={cursor} byDay={byDay} today={today} completedKeys={completedKeys} onPick={setSelected} />
            : <MonthView cursor={cursor} byDay={byDay} today={today} completedKeys={completedKeys} onPick={setSelected} />}
        </>
      )}

      {selected && (
        <DaySheet date={selected} workout={byDay.get(programDayIndex(selected))} done={completedKeys.has(localDateKey(selected))} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
