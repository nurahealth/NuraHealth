'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadExercise, type ExerciseFull } from './planData';
import ExerciseMedia, { CLIP_BG } from './ExerciseMedia';

// ── Palette (ported verbatim from design-reference/exercise-howto.html) ───────
const BG = '#0d0d0e';
const SAGE = '#9bb0a5';
const TEXT = '#ebe6d8';
const MUT = 'rgba(235,230,216,.5)';
const SURF = 'rgba(235,230,216,.045)';
const LINE = 'rgba(235,230,216,.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';

// ── Demo viewer — plays the ORIGINAL MoveKit clip on its own light studio
// background, exactly as MoveKit ships it. No matting, dark backdrop, or tint.
const DEMO = {
  // MoveKit clips are all ≈1.806:1 (1936×1072 and 1300×720). Matching the card to
  // that aspect makes the video fill edge-to-edge — no letterbox / pillarbox.
  aspect: '1936 / 1072',
  radius: 14,                        // tight rounding so white reaches the corners
  bg: CLIP_BG,                       // matches the clip backdrop — sub-pixel safety net, never dark
  border: 'rgba(120,124,118,0.18)', // neutral hairline frame
};

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const fmtReps = (r: string | null | undefined) => (r ?? '').replace(/-/g, '–'); // en-dash, matching the design

// Static form tips (kept static for now, per spec).
const FORM_TIPS = [
  'Keep your wrists stacked over your elbows.',
  'Drive through your mid-back, not just your shoulders.',
  "Don't bounce the bar off your chest.",
];

type Props = {
  exerciseId: string;
  // Workout context (when opened from a workout). Absent → defaults.
  sets?: number | null;
  reps?: string | null;
  rest_seconds?: number | null;
  onClose: () => void;
};

export default function ExerciseDetail({ exerciseId, sets, reps, rest_seconds, onClose }: Props) {
  const [ex, setEx] = useState<ExerciseFull | null>(null);
  const [loading, setLoading] = useState(true);

  const setCount = Math.max(1, sets ?? 3);
  const [done, setDone] = useState<boolean[]>(() => Array(setCount).fill(false));
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setGifFailed(false);
    (async () => {
      const row = await loadExercise(exerciseId);
      if (cancelled) return;
      setEx(row); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [exerciseId]);

  // Keep the set checklist length in sync with the set count.
  useEffect(() => { setDone(Array(setCount).fill(false)); }, [setCount]);

  const primary = ex?.target_muscles ?? [];
  const secondary = ex?.secondary_muscles ?? [];
  const instructions = useMemo(() => (ex?.instructions ?? []).filter(Boolean), [ex]);

  const setsReps = sets != null && reps ? `${sets} × ${fmtReps(reps)}` : '—';
  const restVal = rest_seconds != null ? `${rest_seconds}s` : '—';
  const equipVal = ex?.equipment || '—';
  const levelVal = ex?.difficulty ? titleCase(ex.difficulty) : '—';
  const repsLabel = reps ? `${fmtReps(reps)} reps` : '—';

  const toggle = (i: number) => setDone((d) => d.map((v, j) => (j === i ? !v : v)));
  const markComplete = () => setDone(Array(setCount).fill(true));

  // ── Section styles (1:1 with the reference CSS) ─────────────────────────────
  const wrap: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto',
    minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: 20,
    background: 'radial-gradient(120% 40% at 50% -5%, #16191780 0%, #0d0d0e 50%)',
    fontFamily: FONT, color: TEXT,
  };
  const tile = (label: string, value: string) => (
    <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, letterSpacing: '.05em', color: MUT, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
    </div>
  );
  const secHead = (text: string, extra?: React.CSSProperties) => (
    <div style={{ fontSize: 12, letterSpacing: '.16em', color: MUT, textTransform: 'uppercase', margin: '0 0 14px', ...extra }}>{text}</div>
  );

  return (
    <div style={wrap}>
      <div style={{ width: '100%', maxWidth: 440, paddingBottom: 30 }}>

        {/* back */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button type="button" aria-label="Back" onClick={onClose} style={{
            appearance: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 12,
            background: SURF, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: MUT }}>EXERCISE</div>
        </div>

        {/* demo — plays the ORIGINAL MoveKit clip (looping, muted, autoplay). The
            card matches the clip's aspect ratio, so the video fills it exactly
            edge-to-edge: no letterbox/pillarbox, no crop, no dark gaps. */}
        <div style={{
          position: 'relative', borderRadius: DEMO.radius, overflow: 'hidden', aspectRatio: DEMO.aspect,
          marginBottom: 18, background: DEMO.bg, border: `1px solid ${DEMO.border}`,
        }}>
          {ex?.gif_url && !gifFailed ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <ExerciseMedia src={ex.gif_url} alt={ex.name} fit="cover" onError={() => setGifFailed(true)} />
            </div>
          ) : (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.3" strokeLinecap="round" style={{ animation: 'nuraFloat 2.6s ease-in-out infinite' }}>
                <path d="M6.5 6.5 17.5 17.5M3 8l3-3M16 21l3-3M8 3 5 6M21 16l-3 3" />
              </svg>
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 11, left: 13, fontSize: 10, letterSpacing: '.04em', color: 'rgba(90,96,92,0.8)', display: 'flex', alignItems: 'center', gap: 6, zIndex: 3 }}>
            <i style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE, display: 'inline-block' }} />
            Demo · loops automatically
          </div>
        </div>

        {/* title */}
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.01em', margin: '0 0 12px' }}>
          {loading ? '…' : (ex?.name ?? 'Exercise')}
        </h1>

        {/* chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {primary.map((m) => (
            <span key={`p-${m}`} style={{ fontSize: 11, borderRadius: 999, padding: '5px 12px', background: SAGE, color: BG, fontWeight: 700 }}>{titleCase(m)}</span>
          ))}
          {secondary.map((m) => (
            <span key={`s-${m}`} style={{ fontSize: 11, borderRadius: 999, padding: '5px 12px', border: '1px solid rgba(155,176,165,.4)', color: SAGE }}>{titleCase(m)}</span>
          ))}
        </div>

        {/* meta tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 26 }}>
          {tile('SETS × REPS', setsReps)}
          {tile('REST', restVal)}
          {tile('EQUIPMENT', equipVal)}
          {tile('LEVEL', levelVal)}
        </div>

        {/* how to */}
        {secHead('How to')}
        {instructions.length === 0 ? (
          <div style={{ fontSize: 14, color: MUT, marginBottom: 28 }}>No instructions available for this exercise yet.</div>
        ) : (
          instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 13, marginBottom: i === instructions.length - 1 ? 28 : 15 }}>
              <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'rgba(155,176,165,.16)', color: SAGE, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(235,230,216,.85)' }}>{step}</div>
            </div>
          ))
        )}

        {/* form tips */}
        {secHead('Form tips')}
        {FORM_TIPS.map((t) => (
          <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE, marginTop: 7, flexShrink: 0 }} />
            <div style={{ fontSize: 13.5, color: 'rgba(235,230,216,.8)', lineHeight: 1.45 }}>{t}</div>
          </div>
        ))}

        {/* your sets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '30px 0 6px' }}>
          {secHead('Your sets', { margin: 0 })}
          <div style={{ fontSize: 11, color: SAGE }}>tap to log</div>
        </div>
        {Array.from({ length: setCount }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderTop: '1px solid rgba(235,230,216,.06)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Set {i + 1}</div>
              <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{repsLabel}</div>
            </div>
            <div
              onClick={() => toggle(i)}
              style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '.15s',
                border: done[i] ? `1.5px solid ${SAGE}` : '1.5px solid rgba(235,230,216,.2)',
                background: done[i] ? SAGE : 'transparent',
              }}
            >
              {done[i] && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={markComplete} style={{
          width: '100%', marginTop: 22, background: SAGE, color: BG, border: 'none', borderRadius: 14,
          padding: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 24px rgba(155,176,165,.28)',
        }}>
          Mark complete
        </button>

      </div>
      <style>{`@keyframes nuraFloat{0%,100%{transform:translateY(-5px)}50%{transform:translateY(5px)}}`}</style>
    </div>
  );
}
