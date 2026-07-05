'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NuraPlexus from '@/components/NuraPlexus';
import { hexA, smooth } from '@/components/dashboard/cardChartHelpers';
import {
  loadActiveProgram,
  loadBodyMetrics,
  loadCompletions,
  localDateKey,
  logBodyMetric,
  type BodyMetric,
  type Program,
  type WorkoutCompletion,
} from './planData';

// ── Palette (1:1 with ExerciseDetail.tsx — the fitness detail screens) ────────
const BG = '#0d0d0e';
const SAGE = '#9bb0a5';
const TEXT = '#ebe6d8';
const MUT = 'rgba(235,230,216,.5)';
const SURF = 'rgba(235,230,216,.045)';
const LINE = 'rgba(235,230,216,.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'JetBrains Mono', monospace";

// ── Date helpers — LOCAL, Monday-first, matching the rest of the fitness UI ────
function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const dow = (x.getDay() + 6) % 7; // 0 = Monday
  return addDays(x, -dow);
}

// duration_seconds → "42 min" / "1h 05m" / "—" (matches how the completion is logged).
function fmtDuration(s: number | null): string {
  if (!s || s <= 0) return '—';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, '0')}m`;
}

// Trim trailing ".0" so weights read cleanly (180 not 180.0, but 180.5 stays).
const fmtWeight = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
// recorded_on 'YYYY-MM-DD' → compact 'M/D' axis label (local, no TZ shift).
function fmtDay(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(m)}/${Number(d)}`;
}

const HEATMAP_WEEKS = 13;

// ── Weight trend chart — same SVG line + sage area-fill as the dashboard metric
// charts (VO2/HRV/sleep), via the shared smooth()/hexA() helpers. Unique
// gradient id per instance (useId). Needs ≥2 points; caller shows the empty
// prompt otherwise.
function WeightTrendChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const data = points.slice(-12); // keep the axis readable on long histories
  const n = data.length;
  const values = data.map((d) => d.value);
  const X0 = 42, X1 = 300, top = 28, bot = 150;
  const lo = Math.min(...values), hi = Math.max(...values);
  const pad = (hi - lo) * 0.18 || 1; // headroom so the line never touches the frame
  const LO = lo - pad, HI = hi + pad;
  const yOf = (v: number) => top + (1 - (v - LO) / (HI - LO)) * (bot - top);
  const xOf = (i: number) => (n > 1 ? X0 + (i * (X1 - X0)) / (n - 1) : X0);
  const pts: [number, number][] = data.map((d, i) => [xOf(i), yOf(d.value)]);
  const line = smooth(pts);
  const area = `${line} L ${pts[n - 1][0].toFixed(1)},${bot} L ${pts[0][0].toFixed(1)},${bot} Z`;
  const FAINT = 'rgba(235,230,216,0.45)';

  return (
    <svg viewBox="0 0 340 176" shapeRendering="geometricPrecision" style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hexA(SAGE, 0.3)} />
          <stop offset="100%" stopColor={hexA(SAGE, 0)} />
        </linearGradient>
      </defs>

      {/* faint per-point vertical guides */}
      {pts.map(([x], i) => (
        <line key={i} x1={x.toFixed(1)} y1={top} x2={x.toFixed(1)} y2={bot} stroke="rgba(235,230,216,0.06)" strokeWidth={1} />
      ))}

      {/* y labels — high / low of the range, in mono */}
      {[HI - pad, LO + pad].map((v) => (
        <text key={v} x={34} y={(yOf(v) + 3).toFixed(1)} textAnchor="end" fontSize={10} fill={FAINT} style={{ fontFamily: MONO }}>{fmtWeight(v)}</text>
      ))}

      {/* sage gradient fill flush beneath the line, then the smooth line */}
      <path d={area} fill={`url(#${uid}-fill)`} />
      <path d={line} fill="none" stroke={SAGE} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />

      {/* points — latest gets a halo dot + value label */}
      {pts.map(([x, y], i) => {
        const last = i === n - 1;
        return last ? (
          <g key={i}>
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={9} fill={hexA(SAGE, 0.16)} />
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r={4.5} fill={SAGE} stroke={BG} strokeWidth={1.8} />
            <text x={x.toFixed(1)} y={(y - 12).toFixed(1)} textAnchor="end" fontSize={11} fontWeight={700} fill={SAGE} style={{ fontFamily: MONO }}>{fmtWeight(values[i])} {unit}</text>
          </g>
        ) : (
          <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={2.6} fill={SAGE} />
        );
      })}

      {/* x labels — first & last dates only, to stay uncluttered */}
      <text x={pts[0][0].toFixed(1)} y={170} textAnchor="start" fontSize={10} fill={FAINT} style={{ fontFamily: MONO }}>{fmtDay(data[0].date)}</text>
      <text x={pts[n - 1][0].toFixed(1)} y={170} textAnchor="end" fontSize={10} fill={FAINT} style={{ fontFamily: MONO }}>{fmtDay(data[n - 1].date)}</text>
    </svg>
  );
}

// ── Log weigh-in modal — reuses the centered modal shell (backdrop blur, fade +
// scale enter/exit, ✕, Escape, scroll-lock) shared by Add-exercise / the
// calendar day modal. Fields: weight (required), body fat %, waist, notes.
function LogWeightModal({ defaultUnit, onClose, onSaved }: {
  defaultUnit: string; onClose: () => void; onSaved: () => void;
}) {
  const [unit, setUnit] = useState(defaultUnit === 'kg' ? 'kg' : 'lb');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const requestClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => closeRef.current(), 200);
  }, []);

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

  const save = useCallback(async () => {
    const w = parseFloat(weight);
    if (!Number.isFinite(w) || w <= 0) { setErr('Enter a weight.'); return; }
    setSaving(true); setErr(null);
    const num = (s: string) => { const v = parseFloat(s); return Number.isFinite(v) ? v : null; };
    const res = await logBodyMetric({
      weight: w, unit,
      bodyFatPct: num(bodyFat), waist: num(waist),
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (!res.ok) {
      setErr(res.needsMigration
        ? 'Weight logging needs a quick database migration — run it to start tracking.'
        : (res.error || 'Could not save. Please try again.'));
      return;
    }
    onSaved();
    requestClose();
  }, [weight, unit, bodyFat, waist, notes, onSaved, requestClose]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 11, fontFamily: MONO, fontSize: 14,
    color: TEXT, background: SURF, border: `1px solid ${LINE}`, outline: 'none',
  };
  const label = (text: string) => (
    <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT, margin: '0 0 6px' }}>{text}</div>
  );
  const unitBtn = (u: 'lb' | 'kg'): React.CSSProperties => ({
    flex: 1, appearance: 'none', cursor: 'pointer', border: 'none', borderRadius: 9, padding: 8,
    fontFamily: MONO, fontSize: 13, fontWeight: 700,
    background: unit === u ? SAGE : 'transparent', color: unit === u ? BG : MUT, transition: '.18s',
  });

  return (
    <div onClick={requestClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
      opacity: visible ? 1 : 0, transition: 'opacity 200ms ease',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 420, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        background: '#161918', borderRadius: 22, overflow: 'hidden',
        border: `1px solid ${LINE}`, padding: '18px 16px', fontFamily: FONT,
        opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(.96)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}>
        {/* header — pinned */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Log weigh-in</span>
          <button type="button" aria-label="Close" onClick={requestClose} style={{
            appearance: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, color: MUT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(235,230,216,.05)', border: `1px solid ${LINE}`,
          }}>✕</button>
        </div>

        {/* body — scrolls if tall */}
        <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* unit toggle */}
          <div>
            {label('UNIT')}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: SURF, border: `1px solid ${LINE}` }}>
              <button type="button" onClick={() => setUnit('lb')} style={unitBtn('lb')}>lb</button>
              <button type="button" onClick={() => setUnit('kg')} style={unitBtn('kg')}>kg</button>
            </div>
          </div>

          <div>
            {label(`WEIGHT (${unit})`)}
            <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="0" autoFocus style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('BODY FAT %')}
              <input value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} inputMode="decimal" placeholder="—" style={inputStyle} />
            </div>
            <div>
              {label(`WAIST (${unit === 'kg' ? 'cm' : 'in'})`)}
              <input value={waist} onChange={(e) => setWaist(e.target.value)} inputMode="decimal" placeholder="—" style={inputStyle} />
            </div>
          </div>

          <div>
            {label('NOTES')}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2}
              style={{ ...inputStyle, fontFamily: FONT, resize: 'none', lineHeight: 1.5 }} />
          </div>

          {err && <div style={{ fontSize: 12.5, color: '#e0a4a4' }}>{err}</div>}

          <button type="button" onClick={save} disabled={saving} style={{
            width: '100%', marginTop: 2, background: SAGE, color: BG, border: 'none', borderRadius: 14,
            padding: 14, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, boxShadow: '0 8px 24px rgba(155,176,165,.28)',
          }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FitnessProgress() {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ program }, comps, body] = await Promise.all([loadActiveProgram(), loadCompletions(), loadBodyMetrics()]);
      if (cancelled) return;
      setProgram(program);
      setCompletions(comps);
      setBodyMetrics(body);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Re-pull weigh-ins after logging one (keeps the number + chart in sync).
  const refreshBody = useCallback(async () => { setBodyMetrics(await loadBodyMetrics()); }, []);

  // Current/previous weigh-in, the display unit, and the change vs the last entry.
  const body = useMemo(() => {
    const withWeight = bodyMetrics.filter((m) => m.weight != null);
    const latest = withWeight[withWeight.length - 1] ?? null;
    const prev = withWeight[withWeight.length - 2] ?? null;
    const unit = latest?.unit ?? 'lb';
    const delta = latest?.weight != null && prev?.weight != null ? latest.weight - prev.weight : null;
    const chartPoints = withWeight.map((m) => ({ date: m.recorded_on, value: m.weight as number }));
    return { latest, unit, delta, chartPoints };
  }, [bodyMetrics]);

  // Days that have at least one completion, keyed by local calendar day.
  const dayKeys = useMemo(() => {
    const s = new Set<string>();
    for (const c of completions) s.add(localDateKey(new Date(c.completed_at)));
    return s;
  }, [completions]);

  // Weekly target = training days in the active plan (fallback to days_per_week, else 3).
  const weeklyTarget = useMemo(() => {
    const trainingDays = program?.workouts.filter((w) => !w.is_rest && w.exercises.length > 0).length ?? 0;
    return trainingDays || program?.days_per_week || 3;
  }, [program]);

  // Completions falling inside the current (Monday-first) week.
  const completedThisWeek = useMemo(() => {
    const weekStart = startOfWeek(today);
    const weekEnd = addDays(weekStart, 7);
    return completions.filter((c) => {
      const d = new Date(c.completed_at);
      return d >= weekStart && d < weekEnd;
    }).length;
  }, [completions, today]);

  // Streaks measured in consecutive WEEKS with ≥1 completion (a 3×/week plan
  // rarely trains on back-to-back days, so a day streak would sit at 1).
  const { currentStreak, bestStreak } = useMemo(() => {
    const weekSet = new Set(completions.map((c) => localDateKey(startOfWeek(new Date(c.completed_at)))));
    // Current: walk back from this week. An empty in-progress week doesn't break it.
    let cur = 0;
    let cursor = startOfWeek(today);
    if (!weekSet.has(localDateKey(cursor))) cursor = addDays(cursor, -7);
    while (weekSet.has(localDateKey(cursor))) { cur++; cursor = addDays(cursor, -7); }
    // Best: longest run of consecutive week-starts (exactly 7 days apart).
    const times = [...weekSet].map((k) => new Date(`${k}T00:00:00`).getTime()).sort((a, b) => a - b);
    let best = 0, run = 0, prev: number | null = null;
    for (const t of times) {
      run = prev !== null && Math.round((t - prev) / 86400000) === 7 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = t;
    }
    return { currentStreak: cur, bestStreak: best };
  }, [completions, today]);

  // 13-week grid (oldest → newest), each column a Mon-first week of 7 day cells.
  const heatmapWeeks = useMemo(() => {
    const gridStart = addDays(startOfWeek(today), -7 * (HEATMAP_WEEKS - 1));
    return Array.from({ length: HEATMAP_WEEKS }, (_, w) =>
      Array.from({ length: 7 }, (_, day) => {
        const date = addDays(gridStart, w * 7 + day);
        return { key: localDateKey(date), done: dayKeys.has(localDateKey(date)), future: date > today };
      }),
    );
  }, [dayKeys, today]);

  // Recent completions (loadCompletions returns newest-first) with their workout name.
  const recent = useMemo(() => {
    const byId = new Map(program?.workouts.map((w) => [w.id, w]) ?? []);
    return completions.slice(0, 6).map((c) => {
      const w = byId.get(c.program_workout_id);
      return {
        id: c.id,
        name: w?.focus || w?.title || 'Workout',
        date: new Date(c.completed_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        duration: fmtDuration(c.duration_seconds),
      };
    });
  }, [completions, program]);

  const remaining = Math.max(0, weeklyTarget - completedThisWeek);
  const statusLine = completedThisWeek === 0
    ? "Let's get the first one in."
    : remaining === 0 ? 'Weekly goal met ✓' : `${remaining} to go`;

  // Ring geometry.
  const R = 42, STROKE = 8, CIRC = 2 * Math.PI * R;
  const pct = weeklyTarget > 0 ? Math.min(1, completedThisWeek / weeklyTarget) : 0;

  // ── Shared styles (1:1 with ExerciseDetail.tsx) ─────────────────────────────
  const wrap: React.CSSProperties = {
    position: 'relative', minHeight: '100dvh',
    background: 'radial-gradient(120% 40% at 50% -5%, #16191780 0%, #0d0d0e 50%)',
    fontFamily: FONT, color: TEXT,
  };
  const tile = (label: string, value: string) => (
    <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, letterSpacing: '.05em', color: MUT, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: MONO }}>{value}</div>
    </div>
  );
  const secHead = (text: string, extra?: React.CSSProperties) => (
    <div style={{ fontSize: 12, letterSpacing: '.16em', color: MUT, textTransform: 'uppercase', margin: '0 0 14px', ...extra }}>{text}</div>
  );

  return (
    <div style={wrap}>
      <NuraPlexus opacity={0.3} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 440, paddingBottom: 100 }}>

          {/* header — eyebrow + serif title */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: '.22em', color: MUT }}>FITNESS</div>
            <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: '4px 0 0', lineHeight: 1.1 }}>Progress</h1>
          </div>

          {/* hero — weekly ring */}
          <div style={{
            position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 20, marginBottom: 20,
            background: 'linear-gradient(135deg,rgba(155,176,165,.20),rgba(155,176,165,.04))',
            border: '1px solid rgba(155,176,165,.25)',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            {/* soft radial corner-glow (matches the dashboard hero) */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(155,176,165,.35),transparent 70%)', pointerEvents: 'none' }} />

            {/* ring */}
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={R} fill="none" stroke={LINE} strokeWidth={STROKE} />
                <circle
                  cx="55" cy="55" r={R} fill="none" stroke={SAGE} strokeWidth={STROKE} strokeLinecap="round"
                  strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - pct)} transform="rotate(-90 55 55)"
                  style={{ transition: 'stroke-dashoffset .5s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{completedThisWeek}</div>
                <div style={{ fontFamily: MONO, fontSize: 12, color: MUT, marginTop: 2 }}>/ {weeklyTarget}</div>
              </div>
            </div>

            {/* short line beside it */}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, letterSpacing: '.16em', color: SAGE }}>THIS WEEK</div>
              <div style={{ fontSize: 18, fontWeight: 700, margin: '6px 0 4px' }}>Workouts completed</div>
              <div style={{ fontSize: 13, color: MUT }}>{statusLine}</div>
            </div>
          </div>

          {/* stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 30 }}>
            {tile('CURRENT STREAK', `${currentStreak} wk`)}
            {tile('BEST STREAK', `${bestStreak} wk`)}
            {tile('TOTAL', String(completions.length))}
          </div>

          {/* body & weight */}
          {secHead('Body')}
          <div style={{ marginBottom: 30 }}>
            {/* current weight + change + log button */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: 18, marginBottom: 12,
            }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.05em', color: MUT, marginBottom: 6 }}>CURRENT</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
                    {body.latest?.weight != null ? fmtWeight(body.latest.weight) : '—'}
                  </span>
                  <span style={{ fontSize: 13, color: MUT }}>{body.unit}</span>
                </div>
                {body.delta != null && (
                  <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 6, color: body.delta <= 0 ? SAGE : MUT }}>
                    {body.delta <= 0 ? '−' : '+'}{fmtWeight(Math.abs(body.delta))} {body.unit} vs last
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setLogOpen(true)} style={{
                appearance: 'none', cursor: 'pointer', flexShrink: 0,
                color: SAGE, background: 'rgba(155,176,165,.12)', border: '1px solid rgba(155,176,165,.3)',
                borderRadius: 11, padding: '9px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
              }}>+ Log</button>
            </div>

            {/* trend chart, or first-weigh-in prompt when there's nothing to plot */}
            {body.chartPoints.length >= 2 ? (
              <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 14px' }}>
                <WeightTrendChart points={body.chartPoints} unit={body.unit} />
              </div>
            ) : (
              <div style={{
                textAlign: 'center', background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Log your first weigh-in</div>
                <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>Track your weight over time to see the trend here.</div>
              </div>
            )}
          </div>

          {/* consistency heatmap */}
          {secHead('Consistency')}
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {week.map((cell) => (
                    <div
                      key={cell.key}
                      title={cell.key}
                      style={{
                        width: 14, height: 14, borderRadius: 3,
                        background: cell.future ? 'transparent' : cell.done ? SAGE : 'rgba(235,230,216,.06)',
                        border: cell.future ? '1px solid transparent' : `1px solid ${cell.done ? SAGE : LINE}`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: MUT, marginBottom: 30 }}>Last {HEATMAP_WEEKS} weeks</div>

          {/* recent activity */}
          {secHead('Recent activity')}
          {loading ? (
            <div style={{ fontSize: 14, color: MUT }}>Loading…</div>
          ) : recent.length === 0 ? (
            <div style={{ fontSize: 14, color: MUT }}>No completed workouts yet — finish one to see it here.</div>
          ) : (
            recent.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(235,230,216,.06)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{r.date}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: SAGE }}>{r.duration}</div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* bottom nav — same block as the dashboard, Progress active */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 'calc(100% - 40px)', maxWidth: 400,
        background: 'rgba(20,22,21,.9)', backdropFilter: 'blur(12px)', border: `1px solid ${LINE}`, borderRadius: 20,
        display: 'flex', justifyContent: 'space-around', padding: 12, zIndex: 40,
      }}>
        {[
          { label: 'Home', on: false, to: '/fitness', path: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
          { label: 'Calendar', on: false, to: '/fitness/calendar', path: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></> },
          { label: 'Progress', on: true, to: null, path: <path d="M3 3v18h18M7 14l3-3 3 3 5-5" /> },
          { label: 'Profile', on: false, to: null, path: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></> },
        ].map((n) => (
          <div
            key={n.label}
            onClick={n.to ? () => router.push(n.to!) : undefined}
            style={{ color: n.on ? SAGE : MUT, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 9, cursor: n.to ? 'pointer' : 'default' }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{n.path}</svg>
            {n.label}
          </div>
        ))}
      </div>

      {logOpen && (
        <LogWeightModal defaultUnit={body.unit} onClose={() => setLogOpen(false)} onSaved={refreshBody} />
      )}
    </div>
  );
}
