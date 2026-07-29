'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadExercise, logSets, type ExerciseFull } from './planData';
import ExerciseMedia, { CLIP_BG, isVideo } from './ExerciseMedia';
import FitnessBackButton from './FitnessBackButton';

// Self-hosted demo store (public bucket). WorkoutX gifs are downloaded here so the
// demo box keeps working after the WorkoutX subscription is cancelled.
const DEMO_BUCKET = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/exercise-demos`;

// ── Palette (ported verbatim from design-reference/exercise-howto.html) ───────
const BG = 'var(--nura-bg)';
const SAGE = 'var(--nura-sage)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const MONO = "'JetBrains Mono', monospace";

// ── Demo viewer — plays the ORIGINAL MoveKit clip on its own light studio
// background, exactly as MoveKit ships it. No matting, dark backdrop, or tint.
const DEMO = {
  // MoveKit clips are all ≈1.806:1 (1936×1072 and 1300×720). Matching the card to
  // that aspect makes the video fill edge-to-edge — no letterbox / pillarbox.
  aspect: '1936 / 1072',
  radius: 14,                        // tight rounding so the panel is cleanly rounded
  // Solid white panel: WorkoutX gif placeholders ship on white, so they blend
  // edge-to-edge with no inner rectangle or side bars. MoveKit clips fill via
  // cover, so the same white panel keeps both demo types looking consistent.
  // Deliberately NOT themed: the demo panel matches the media asset, not the UI.
  // Both clip sources ship baked onto a white studio background, so this stays
  // white in dark mode too — theming it would put a dark frame around a white
  // video. The caption below sits on this panel, so it is fixed to suit white.
  bg: '#ffffff',
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
  // Per-set performed weight + reps (strings while editing). Reps default to the
  // low end of the prescribed range so the user usually just types the weight.
  const defaultReps = useMemo(() => {
    const m = (reps ?? '').match(/\d+/);
    return m ? m[0] : '';
  }, [reps]);
  const [weights, setWeights] = useState<string[]>(() => Array(setCount).fill(''));
  const [repsIn, setRepsIn] = useState<string[]>(() => Array(setCount).fill(''));
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  // Demo source preference: MoveKit clip → self-hosted WorkoutX gif → placeholder.
  // demoIdx walks that list; onError advances to the next candidate.
  const [demoIdx, setDemoIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDemoIdx(0);
    (async () => {
      const row = await loadExercise(exerciseId);
      if (cancelled) return;
      setEx(row); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [exerciseId]);

  // Keep the set checklist + input arrays in sync with the set count.
  useEffect(() => {
    setDone(Array(setCount).fill(false));
    setWeights(Array(setCount).fill(''));
    setRepsIn(Array(setCount).fill(''));
    setSaveMsg(null); setSaveErr(null);
  }, [setCount]);

  const primary = ex?.target_muscles ?? [];
  const secondary = ex?.secondary_muscles ?? [];
  const instructions = useMemo(() => (ex?.instructions ?? []).filter(Boolean), [ex]);

  // Ordered demo candidates: (1) MoveKit 3D clip if present, then (2) the
  // self-hosted WorkoutX gif (saved demo_gif_url, else the deterministic public
  // path). GIFs use object-fit:contain so the full square frame shows on the
  // card's off-white backdrop; MoveKit clips keep cover (they match the aspect).
  const demoSources = useMemo(() => {
    const list: { src: string; fit: 'cover' | 'contain' }[] = [];
    if (ex?.gif_url && isVideo(ex.gif_url)) list.push({ src: ex.gif_url, fit: 'cover' });
    const gif = ex?.demo_gif_url ?? (ex?.id ? `${DEMO_BUCKET}/${ex.id}.gif` : null);
    if (gif) list.push({ src: gif, fit: 'contain' });
    return list;
  }, [ex]);
  const activeDemo = demoSources[demoIdx] ?? null;

  const setsReps = sets != null && reps ? `${sets} × ${fmtReps(reps)}` : '—';
  const restVal = rest_seconds != null ? `${rest_seconds}s` : '—';
  const equipVal = ex?.equipment || '—';
  const levelVal = ex?.difficulty ? titleCase(ex.difficulty) : '—';
  const repsLabel = reps ? `${fmtReps(reps)} reps` : '—';

  const toggle = (i: number) => setDone((d) => d.map((v, j) => (j === i ? !v : v)));

  // Persist every set that has a weight entered (reps fall back to the plan's
  // low end). Marks saved sets done and shows a confirmation.
  const saveSets = async () => {
    const payload = Array.from({ length: setCount }, (_, i) => {
      const w = parseFloat(weights[i]);
      const r = parseInt(repsIn[i] || defaultReps, 10);
      return Number.isFinite(w) && w > 0 ? { setIndex: i + 1, weight: w, reps: Number.isFinite(r) ? r : 0 } : null;
    }).filter((s): s is { setIndex: number; weight: number; reps: number } => s !== null);

    if (payload.length === 0) { setSaveErr('Enter a weight on at least one set.'); return; }
    setSaving(true); setSaveErr(null); setSaveMsg(null);
    const res = await logSets({ exerciseId, sets: payload });
    setSaving(false);
    if (!res.ok) {
      setSaveErr(res.needsMigration
        ? 'Strength logging needs a quick database migration — run it to start tracking.'
        : (res.error || 'Could not save. Please try again.'));
      return;
    }
    setDone((d) => d.map((v, i) => (Number.isFinite(parseFloat(weights[i])) && parseFloat(weights[i]) > 0 ? true : v)));
    setSaveMsg(`Logged ${res.count} set${res.count === 1 ? '' : 's'} ✓`);
  };

  // ── Section styles (1:1 with the reference CSS) ─────────────────────────────
  const wrap: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto',
    minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: 20,
    // Radial tint layered over a SOLID base so the full-screen overlay is opaque
    // — otherwise the translucent top of the gradient lets the dashboard header
    // behind this screen bleed through and collide with our own header.
    background: 'var(--nura-page-gradient)',
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
      <div style={{ width: '100%', maxWidth: 440, paddingBottom: 40 }}>

        {/* back — the ONE header for this screen (dashboard header is covered by
            the opaque overlay behind us) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <FitnessBackButton onClick={onClose} />
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: MUT }}>EXERCISE</div>
        </div>

        {/* demo — compact (modest landscape height, not full-screen). Looping/
            muted/autoplay. A MoveKit clip fills the card via cover; a WorkoutX gif
            placeholder sits on the same solid-white panel so its white background
            blends edge-to-edge (no inner rectangle / side bars). */}
        <div style={{
          position: 'relative', borderRadius: DEMO.radius, overflow: 'hidden', aspectRatio: DEMO.aspect,
          marginBottom: 16, background: DEMO.bg, border: `1px solid ${DEMO.border}`,
        }}>
          {activeDemo ? (
            <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
              <ExerciseMedia key={activeDemo.src} src={activeDemo.src} alt={ex?.name ?? ''} fit={activeDemo.fit} onError={() => setDemoIdx((i) => i + 1)} style={{ backgroundColor: '#ffffff' }} />
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

        {/* chips — target muscle tags */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {primary.map((m) => (
            <span key={`p-${m}`} style={{ fontSize: 11, borderRadius: 999, padding: '5px 12px', background: SAGE, color: BG, fontWeight: 700 }}>{titleCase(m)}</span>
          ))}
          {secondary.map((m) => (
            <span key={`s-${m}`} style={{ fontSize: 11, borderRadius: 999, padding: '5px 12px', border: '1px solid rgba(var(--nura-sage-rgb),.4)', color: "var(--nura-accent-text)" }}>{titleCase(m)}</span>
          ))}
        </div>

        {/* meta tiles — prescribed sets × reps summary (+ rest / equipment / level) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 28 }}>
          {tile('SETS × REPS', setsReps)}
          {tile('REST', restVal)}
          {tile('EQUIPMENT', equipVal)}
          {tile('LEVEL', levelVal)}
        </div>

        {/* your sets — log weight × reps per set */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 6px' }}>
          {secHead('Your sets', { margin: 0 })}
          <div style={{ fontSize: 11, color: "var(--nura-accent-text)" }}>log weight × reps</div>
        </div>
        {Array.from({ length: setCount }, (_, i) => {
          const inp: React.CSSProperties = {
            width: 62, textAlign: 'center', padding: '9px 8px', borderRadius: 10, fontFamily: MONO, fontSize: 14,
            color: TEXT, background: SURF, border: `1px solid ${LINE}`, outline: 'none',
          };
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderTop: '1px solid rgba(var(--nura-bg-tint-rgb),.06)' }}>
              <div style={{ width: 46, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Set {i + 1}</div>
                <div style={{ fontSize: 10, color: MUT, marginTop: 2 }}>{repsLabel}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, justifyContent: 'center' }}>
                <input value={weights[i] ?? ''} onChange={(e) => setWeights((w) => w.map((v, j) => (j === i ? e.target.value : v)))}
                  inputMode="decimal" placeholder="lb" aria-label={`Set ${i + 1} weight`} style={inp} />
                <span style={{ fontFamily: MONO, fontSize: 13, color: MUT }}>×</span>
                <input value={repsIn[i] ?? ''} onChange={(e) => setRepsIn((r) => r.map((v, j) => (j === i ? e.target.value : v)))}
                  inputMode="numeric" placeholder={defaultReps || 'reps'} aria-label={`Set ${i + 1} reps`} style={inp} />
              </div>
              <div
                onClick={() => toggle(i)}
                style={{
                  width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '.15s',
                  border: done[i] ? `1.5px solid ${SAGE}` : '1.5px solid rgba(var(--nura-bg-tint-rgb),.2)',
                  background: done[i] ? SAGE : 'transparent',
                }}
              >
                {done[i] && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={BG} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                )}
              </div>
            </div>
          );
        })}

        {saveErr && <div style={{ fontSize: 12.5, color: 'var(--nura-danger-soft)', marginTop: 14 }}>{saveErr}</div>}
        {saveMsg && <div style={{ fontSize: 12.5, color: "var(--nura-accent-text)", marginTop: 14 }}>{saveMsg}</div>}

        {/* log sets — primary action for the set logging, centered & full-width
            within the padded column (matches the modal primary buttons), never
            flush against the screen edge. */}
        <button className="nura-lift" type="button" onClick={saveSets} disabled={saving} style={{
          display: 'block', width: '100%', margin: '18px 0 34px',
          background: SAGE, color: BG, border: 'none', borderRadius: 14,
          padding: 16, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1, boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.28)',
        }}>
          {saving ? 'Saving…' : 'Log sets'}
        </button>

        {/* how to — step-by-step reference at the bottom */}
        {secHead('How to')}
        {instructions.length === 0 ? (
          <div style={{ fontSize: 14, color: MUT, marginBottom: 28 }}>No instructions available for this exercise yet.</div>
        ) : (
          instructions.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 13, marginBottom: i === instructions.length - 1 ? 28 : 15 }}>
              <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'rgba(var(--nura-sage-rgb),.16)', color: "var(--nura-accent-text)", fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--nura-text-primary)' }}>{step}</div>
            </div>
          ))
        )}

        {/* form tips */}
        {secHead('Form tips')}
        {FORM_TIPS.map((t) => (
          <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SAGE, marginTop: 7, flexShrink: 0 }} />
            <div style={{ fontSize: 13.5, color: 'var(--nura-ink-strong)', lineHeight: 1.45 }}>{t}</div>
          </div>
        ))}

      </div>
      <style>{`@keyframes nuraFloat{0%,100%{transform:translateY(-5px)}50%{transform:translateY(5px)}}`}</style>
    </div>
  );
}
