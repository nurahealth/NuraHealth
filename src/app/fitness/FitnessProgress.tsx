'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NuraPlexus from '@/components/NuraPlexus';
import FitnessBackButton from './FitnessBackButton';
import MetricLineChart from '@/components/dashboard/MetricLineChart';
import { useMetricPaint } from '@/lib/metricColors';
import {
  addProgressPhoto,
  loadActiveProgram,
  loadBodyMetrics,
  loadCompletions,
  loadProgressPhotos,
  loadSetLogs,
  localDateKey,
  logBodyMetric,
  updatePhotoFit,
  type BodyMetric,
  type PhotoFit,
  type Program,
  type ProgressPhoto,
  type SetLog,
  type WorkoutCompletion,
} from './planData';
import ThemeToggle from "@/components/ThemeToggle";

// ── Palette (1:1 with ExerciseDetail.tsx — the fitness detail screens) ────────
const BG = 'var(--nura-bg)';
const SAGE = 'var(--nura-sage)';
// Data marks (volume bars, the progress ring) take the series token instead:
// identical to SAGE in dark, charcoal in light. Buttons keep SAGE.
const SERIES = 'var(--nura-series)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
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

// ── Weight trend chart ───────────────────────────────────────────────────────
// The shared single-series treatment. Body weight has no row in the metric
// colour map — it is not one of the dashboard metrics — so it draws in
// --nura-series, the neutral colour a chart wears when it has no identity of
// its own to express. That is the same answer the map gives for anything
// unrecognised, which is why this needs no special case.
//
// It was a bespoke SVG at 2.4px stroke with a translucent halo disc behind the
// latest point and its own hardcoded 42/300/28/150 plot box. Now it inherits
// the app's stroke weight, marker, tooltip, axis type and gridline spacing.
function WeightTrendChart({ points, unit }: { points: { date: string; value: number }[]; unit: string }) {
  const paint = useMetricPaint("__weight__");   // no row → the neutral series
  const data = points.slice(-12);               // keep the axis readable
  const labels = data.map((d) => fmtDay(d.date));

  return (
    <MetricLineChart
      data={data.map((d) => d.value)}
      color={paint}
      unit={unit}
      xLabels={[labels[0], labels[labels.length - 1]]}
      pointLabels={labels}
      format={(v) => fmtWeight(v)}
      height={190}
      ariaLabel={`Body weight over the last ${data.length} readings, in ${unit}.`}
    />
  );
}

// Shared field styles for the centered modals (Body-log / Add-photo), so inputs
// look identical across them.
const modalInputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11,
  fontFamily: MONO, fontSize: 14, color: TEXT, background: SURF, border: `1px solid ${LINE}`, outline: 'none',
};
const modalLabel = (text: string) => (
  <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT, margin: '0 0 6px' }}>{text}</div>
);

// ── Log weigh-in modal — renders inside the shared CenteredModal shell (same
// wrapper / padding / scroll structure as every other modal here). Fields:
// weight (required), body fat %, waist, notes.
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

  const save = useCallback(async (close: () => void) => {
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
    close();
  }, [weight, unit, bodyFat, waist, notes, onSaved]);

  const unitBtn = (u: 'lb' | 'kg'): React.CSSProperties => ({
    flex: 1, appearance: 'none', cursor: 'pointer', border: 'none', borderRadius: 9, padding: 8,
    fontFamily: MONO, fontSize: 13, fontWeight: 700,
    background: unit === u ? SAGE : 'transparent', color: unit === u ? BG : MUT, transition: '.18s',
  });

  return (
    <CenteredModal title="Log weigh-in" onClose={onClose}>
      {(close) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* unit toggle */}
          <div>
            {modalLabel('UNIT')}
            <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: SURF, border: `1px solid ${LINE}` }}>
              <button type="button" onClick={() => setUnit('lb')} style={unitBtn('lb')}>lb</button>
              <button type="button" onClick={() => setUnit('kg')} style={unitBtn('kg')}>kg</button>
            </div>
          </div>

          <div>
            {modalLabel(`WEIGHT (${unit})`)}
            <input value={weight} onChange={(e) => setWeight(e.target.value)} inputMode="decimal" placeholder="0" autoFocus style={modalInputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {modalLabel('BODY FAT %')}
              <input value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} inputMode="decimal" placeholder="—" style={modalInputStyle} />
            </div>
            <div>
              {modalLabel(`WAIST (${unit === 'kg' ? 'cm' : 'in'})`)}
              <input value={waist} onChange={(e) => setWaist(e.target.value)} inputMode="decimal" placeholder="—" style={modalInputStyle} />
            </div>
          </div>

          <div>
            {modalLabel('NOTES')}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2}
              style={{ ...modalInputStyle, fontFamily: FONT, resize: 'none', lineHeight: 1.5 }} />
          </div>

          {err && <div style={{ fontSize: 12.5, color: 'var(--nura-danger-soft)' }}>{err}</div>}

          <button className="nura-lift" type="button" onClick={() => save(close)} disabled={saving} style={{
            width: '100%', marginTop: 2, background: SAGE, color: BG, border: 'none', borderRadius: 14,
            padding: 14, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.28)',
          }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </CenteredModal>
  );
}

// ── Centered modal shell — the single centered-modal component every modal on
// this screen uses (backdrop blur, fade+scale enter/exit, ✕, Escape, scroll-lock,
// never a bottom sheet). The Body-log / Add-photo / photo-viewer modals all route
// through this so their wrapper, padding and scroll structure are identical.
//
// Padding contract (fixes off-centre content once, at the root):
//  • the card carries VERTICAL padding only;
//  • the header and the scrollable body each carry the SAME horizontal inset
//    (H_INSET) with box-sizing: border-box, so title/✕, the photo area and every
//    field line up on identical left/right edges;
//  • the body reserves a scrollbar gutter on BOTH sides (scrollbar-gutter: stable
//    both-edges), so the scrollbar can never overlap or crowd content and the
//    content stays optically centred whether or not a scrollbar is showing.
//
// `children` may be a render function receiving `close` — an animated close the
// child calls after a successful save (so programmatic closes fade out too).
const H_INSET = 16;
function CenteredModal({ title, onClose, maxWidth = 420, children }: {
  title: React.ReactNode; onClose: () => void; maxWidth?: number;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}) {
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

  return (
    <div onClick={requestClose} style={{
      position: 'fixed', inset: 0, zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(2px)',
      opacity: visible ? 1 : 0, transition: 'opacity 200ms ease',
    }}>
      {/* Subtle, inset scrollbar for the (rare) tall-content case — thin, rounded,
          sage-neutral, sitting inside the reserved gutter so it never touches the
          card's rounded edge or the content. WebKit rule + standard fallback. */}
      <style>{`
        .nura-modal-scroll::-webkit-scrollbar { width: 6px; }
        .nura-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .nura-modal-scroll::-webkit-scrollbar-thumb { background: rgba(var(--nura-sage-rgb),.35); border-radius: 999px; }
        .nura-modal-scroll::-webkit-scrollbar-thumb:hover { background: rgba(var(--nura-sage-rgb),.55); }
      `}</style>
      <div className="nura-card" onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth, maxHeight: '86vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
        background: 'var(--nura-card)', borderRadius: 22, overflow: 'hidden',
        border: `1px solid ${LINE}`, padding: '18px 0', fontFamily: FONT,
        opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(.96)',
        transition: 'opacity 200ms ease, transform 200ms ease',
      }}>
        {/* header — same H_INSET as the body */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14, padding: `0 ${H_INSET}px`, boxSizing: 'border-box', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{title}</span>
          <button type="button" aria-label="Close" onClick={requestClose} style={{
            appearance: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 9, color: MUT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(var(--nura-bg-tint-rgb),.05)', border: `1px solid ${LINE}`,
          }}>✕</button>
        </div>
        {/* scrollable body — equal L/R inset, border-box, gutter reserved both
            sides, subtle thin scrollbar (see .nura-modal-scroll above). */}
        <div className="nura-modal-scroll" style={{
          overflowY: 'auto', minHeight: 0, padding: `0 ${H_INSET}px`, boxSizing: 'border-box',
          scrollbarGutter: 'stable both-edges',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(var(--nura-sage-rgb),.35) transparent',
        }}>
          {typeof children === 'function' ? children(requestClose) : children}
        </div>
      </div>
    </div>
  );
}

// 'YYYY-MM-DD' → 'Mon D, YYYY' for photo captions (local, no TZ shift).
function fmtPhotoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Portrait frame — progress photos are usually full-body vertical shots. Used by
// the modal preview, the gallery thumbnails, and the enlarged view so a vertical
// photo never gets squished into a wide box.
const PHOTO_ASPECT = '3 / 4';
// 'fill' → object-fit: cover (crops), 'contain' → whole photo letterboxed.
const objectFitFor = (fit: PhotoFit): React.CSSProperties['objectFit'] => (fit === 'contain' ? 'contain' : 'cover');

// Small, subtle Fill / Fit segmented toggle sitting over the preview corner.
function FitToggle({ value, onChange }: { value: PhotoFit; onChange: (f: PhotoFit) => void }) {
  const seg = (f: PhotoFit, text: string): React.CSSProperties => ({
    appearance: 'none', cursor: 'pointer', border: 'none', borderRadius: 7, padding: '4px 9px',
    fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '.02em',
    background: value === f ? SAGE : 'transparent', color: value === f ? BG : TEXT, transition: '.15s',
  });
  return (
    <div style={{
      display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10,
      background: 'var(--nura-scrim-panel)', backdropFilter: 'blur(6px)', border: `1px solid ${LINE}`,
    }}>
      <button type="button" onClick={() => onChange('fill')} style={seg('fill', 'Fill')}>Fill</button>
      <button type="button" onClick={() => onChange('contain')} style={seg('contain', 'Fit')}>Fit</button>
    </div>
  );
}

// ── Add-photo modal — pick/upload an image with optional pose + notes, upload to
// the private progress-photos bucket and insert the row. Centered shell above.
function AddPhotoModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fit, setFit] = useState<PhotoFit>('fill');
  const [takenOn, setTakenOn] = useState(localDateKey(new Date()));
  const [pose, setPose] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Two inputs feeding one flow: camera (capture) opens the device camera on
  // mobile; gallery (no capture) opens the library / file picker. On desktop
  // both fall back to the file picker.
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Revoke the object URL when the picked file changes / on unmount.
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const save = useCallback(async (close: () => void) => {
    if (!file) { setErr('Add a photo first.'); return; }
    setSaving(true); setErr(null);
    const res = await addProgressPhoto({
      file, takenOn, pose: pose.trim() || null, notes: notes.trim() || null, fit,
    });
    setSaving(false);
    if (!res.ok) {
      setErr(res.needsMigration
        ? 'Progress photos need a quick database migration — run it to start tracking.'
        : (res.error || 'Could not save. Please try again.'));
      return;
    }
    onSaved();
    close();
  }, [file, takenOn, pose, notes, fit, onSaved]);

  // Take Photo / Choose Photo — same sage-tinted pill, side by side.
  const pickBtn: React.CSSProperties = {
    flex: 1, appearance: 'none', cursor: 'pointer', boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    color: "var(--nura-accent-text)", background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.3)',
    borderRadius: 11, padding: '11px 12px', fontSize: 13.5, fontWeight: 700, fontFamily: FONT,
  };

  return (
    <CenteredModal title="Add photo" onClose={onClose}>
      {(close) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* hidden inputs — camera (capture) + gallery (no capture), one handler */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <input ref={galleryRef} type="file" accept="image/*" hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />

          {/* photo area — portrait (3:4) frame; preview when chosen, else a
              dashed placeholder. The Fill/Fit toggle sits in the top-right when a
              photo is loaded and controls how it sits in the frame. */}
          <div className="nura-card" style={{
            position: 'relative', width: '100%', boxSizing: 'border-box', aspectRatio: PHOTO_ASPECT, overflow: 'hidden',
            borderRadius: 16, background: SURF, border: `1px ${preview ? 'solid' : 'dashed'} ${LINE}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: MUT,
          }}>
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selected photo" style={{ width: '100%', height: '100%', objectFit: objectFitFor(fit) }} />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <FitToggle value={fit} onChange={setFit} />
                </div>
              </>
            ) : (
              <>
                <span style={{ fontSize: 26, color: SAGE }}>+</span>
                <span style={{ fontSize: 13 }}>Take or choose a photo</span>
              </>
            )}
          </div>

          {/* Take Photo / Choose Photo */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => cameraRef.current?.click()} style={pickBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
              {preview ? 'Retake' : 'Take Photo'}
            </button>
            <button type="button" onClick={() => galleryRef.current?.click()} style={pickBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
              </svg>
              {preview ? 'Replace' : 'Choose Photo'}
            </button>
          </div>

          <div>
            {modalLabel('DATE')}
            <input type="date" value={takenOn} max={localDateKey(new Date())}
              onChange={(e) => setTakenOn(e.target.value)} style={modalInputStyle} />
          </div>
          <div>
            {modalLabel('POSE')}
            <input value={pose} onChange={(e) => setPose(e.target.value)} placeholder="Optional — e.g. front relaxed"
              style={{ ...modalInputStyle, fontFamily: FONT }} />
          </div>
          <div>
            {modalLabel('NOTES')}
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" rows={2}
              style={{ ...modalInputStyle, fontFamily: FONT, resize: 'none', lineHeight: 1.5 }} />
          </div>

          {err && <div style={{ fontSize: 12.5, color: 'var(--nura-danger-soft)' }}>{err}</div>}

          <button className="nura-lift" type="button" onClick={() => save(close)} disabled={saving} style={{
            width: '100%', marginTop: 2, background: SAGE, color: BG, border: 'none', borderRadius: 14,
            padding: 14, fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.28)',
          }}>
            {saving ? 'Uploading…' : 'Save'}
          </button>
        </div>
      )}
    </CenteredModal>
  );
}

// ── Photo viewer — the tapped photo large with date + notes, plus a Compare flow
// that picks any second photo and shows them side-by-side (before / after,
// ordered by date). Same centered shell.
function PhotoViewerModal({ photo, photos, onClose, onUpdate }: {
  photo: ProgressPhoto; photos: ProgressPhoto[]; onClose: () => void;
  onUpdate: (id: string, fit: PhotoFit) => void;
}) {
  const [mode, setMode] = useState<'single' | 'pick'>('single');
  const [other, setOther] = useState<ProgressPhoto | null>(null);
  const [fit, setFit] = useState<PhotoFit>(photo.fit);

  // Persist the fit change and reflect it in the parent (thumbnails/list) too.
  const changeFit = (f: PhotoFit) => {
    setFit(f);
    updatePhotoFit(photo.id, f);
    onUpdate(photo.id, f);
  };

  const caption = (p: ProgressPhoto, align: 'left' | 'center' = 'center') => (
    <div style={{ textAlign: align, marginTop: 8 }}>
      <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--nura-accent-text)" }}>{fmtPhotoDate(p.taken_on)}</div>
      {p.pose && <div style={{ fontSize: 12, color: MUT, marginTop: 3 }}>{p.pose}</div>}
      {p.notes && <div style={{ fontSize: 12.5, color: TEXT, marginTop: 6, lineHeight: 1.5 }}>{p.notes}</div>}
    </div>
  );
  const img = (fitVal: PhotoFit): React.CSSProperties => ({
    width: '100%', aspectRatio: PHOTO_ASPECT, objectFit: objectFitFor(fitVal),
    borderRadius: 14, background: SURF, border: `1px solid ${LINE}`, display: 'block',
  });
  const others = photos.filter((p) => p.id !== photo.id);

  // Compare view: order the pair oldest → newest so it reads before → after.
  if (other) {
    const pair = [photo, other].sort((a, b) => (a.taken_on < b.taken_on ? -1 : 1));
    return (
      <CenteredModal title="Compare" onClose={onClose} maxWidth={560}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {pair.map((p, i) => (
            <div key={p.id}>
              <div style={{ fontSize: 10, letterSpacing: '.14em', color: MUT, marginBottom: 6 }}>
                {i === 0 ? 'BEFORE' : 'AFTER'}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url ?? ''} alt={`Progress photo ${p.taken_on}`} style={img(p.id === photo.id ? fit : p.fit)} />
              <div style={{ fontFamily: MONO, fontSize: 12, color: "var(--nura-accent-text)", marginTop: 8, textAlign: 'center' }}>{fmtPhotoDate(p.taken_on)}</div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setOther(null)} style={{
          width: '100%', marginTop: 16, background: 'rgba(var(--nura-sage-rgb),.12)', color: SAGE,
          border: '1px solid rgba(var(--nura-sage-rgb),.3)', borderRadius: 12, padding: 12,
          fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
        }}>Back</button>
      </CenteredModal>
    );
  }

  // Pick-a-second-photo view.
  if (mode === 'pick') {
    return (
      <CenteredModal title="Compare with…" onClose={onClose}>
        {others.length === 0 ? (
          <div style={{ fontSize: 13.5, color: MUT, lineHeight: 1.6, padding: '8px 2px' }}>
            Add another photo to compare before &amp; after.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {others.map((p) => (
              <button key={p.id} type="button" onClick={() => setOther(p)} style={{
                appearance: 'none', cursor: 'pointer', padding: 0, background: 'none', border: 'none',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url ?? ''} alt={`Progress photo ${p.taken_on}`} style={{
                  width: '100%', aspectRatio: PHOTO_ASPECT, objectFit: objectFitFor(p.fit),
                  borderRadius: 11, background: SURF, border: `1px solid ${LINE}`, display: 'block',
                }} />
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: MUT, marginTop: 5, textAlign: 'center' }}>{fmtPhotoDate(p.taken_on)}</div>
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setMode('single')} style={{
          width: '100%', marginTop: 16, background: 'rgba(var(--nura-bg-tint-rgb),.05)', color: MUT,
          border: `1px solid ${LINE}`, borderRadius: 12, padding: 12,
          fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
        }}>Back</button>
      </CenteredModal>
    );
  }

  // Single large view.
  return (
    <CenteredModal title={fmtPhotoDate(photo.taken_on)} onClose={onClose} maxWidth={460}>
      <div style={{ position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url ?? ''} alt={`Progress photo ${photo.taken_on}`} style={img(fit)} />
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <FitToggle value={fit} onChange={changeFit} />
        </div>
      </div>
      {(photo.pose || photo.notes) && caption(photo)}
      <button type="button" onClick={() => setMode('pick')} style={{
        width: '100%', marginTop: 16, background: 'rgba(var(--nura-sage-rgb),.12)', color: SAGE,
        border: '1px solid rgba(var(--nura-sage-rgb),.3)', borderRadius: 12, padding: 12,
        fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
      }}>Compare</button>
    </CenteredModal>
  );
}

// ── Weekly volume bars — Σ (weight × reps) per week over the last 8 weeks. Same
// SAGE / faint-track visual language as the consistency heatmap. Mono numbers.
function VolumeBars({ weeks }: { weeks: { key: string; date: string; value: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.value));
  const anyVol = weeks.some((w) => w.value > 0);
  const latest = weeks[weeks.length - 1]?.value ?? 0;
  const FAINT = 'var(--nura-text-tertiary)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "var(--nura-accent-text)" }}>
          {Math.round(latest).toLocaleString()} <span style={{ fontSize: 10, color: MUT, fontWeight: 400 }}>this wk</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 92 }}>
        {weeks.map((w) => {
          const h = anyVol ? Math.max(3, Math.round((w.value / max) * 92)) : 3;
          return (
            <div key={w.key} title={`${fmtDay(w.date)} · ${Math.round(w.value).toLocaleString()}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
              <div style={{ height: h, borderRadius: 4, background: w.value > 0 ? SERIES : 'rgba(var(--nura-bg-tint-rgb),.08)', transition: 'height .4s ease' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 10, color: FAINT }}>{fmtDay(weeks[0].date)}</span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: FAINT }}>{fmtDay(weeks[weeks.length - 1].date)}</span>
      </div>
    </div>
  );
}

// ── Per-exercise strength modal — best set + weight-over-time line chart (same
// chart component / style as the weight trend). Centered shell, never a sheet.
function ExerciseStrengthModal({ name, unit, points, pr, onClose }: {
  name: string; unit: string;
  points: { date: string; value: number }[];
  pr: { weight: number; reps: number; unit: string } | null;
  onClose: () => void;
}) {
  return (
    <CenteredModal title={name} onClose={onClose} maxWidth={460}>
      {pr && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT }}>BEST SET</div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: "var(--nura-accent-text)" }}>{fmtWeight(pr.weight)} {pr.unit} × {pr.reps}</div>
        </div>
      )}
      <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT, marginBottom: 8 }}>WEIGHT OVER TIME</div>
      {points.length >= 2 ? (
        <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 14px' }}>
          <WeightTrendChart points={points} unit={unit} />
        </div>
      ) : (
        <div className="nura-card" style={{ textAlign: 'center', background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px' }}>
          <div style={{ fontSize: 13, color: MUT, lineHeight: 1.5 }}>Log this exercise on another day to see a trend.</div>
        </div>
      )}
    </CenteredModal>
  );
}

// ── Milestone badge icons — inner SVG paths, same stroke style as the bottom-nav
// icons (viewBox 24, currentColor, no fill, round joins). Colour comes from the
// badge (SAGE unlocked / MUT locked).
const BADGE_ICON: Record<string, React.ReactNode> = {
  check: <path d="M20 6L9 17l-5-5" />,
  flame: <path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 3 3c2 0 3-2 3-4 2 1 3 3 3 5a6 6 0 0 1-12 0c0-4 3-6 4-10z" />,
  star: <path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3 9.4l6-.8z" />,
  medal: <><circle cx="12" cy="15" r="6" /><path d="M9 9.5L6 3M15 9.5L18 3" /></>,
  trophy: <><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 21h6M12 16v5" /></>,
  zap: <path d="M13 2L4 14h6l-1 8 9-12h-6z" />,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></>,
  scale: <><circle cx="12" cy="12" r="9" /><path d="M12 12l4-4M12 3v2M3 12h2M19 12h2" /></>,
  trend: <><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};

export default function FitnessProgress() {
  const router = useRouter();
  const [program, setProgram] = useState<Program | null>(null);
  const [completions, setCompletions] = useState<WorkoutCompletion[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetric[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [setLogs, setSetLogs] = useState<SetLog[]>([]);
  const [logOpen, setLogOpen] = useState(false);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null);
  const [strengthEx, setStrengthEx] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ program }, comps, body, pics, sets] = await Promise.all([
        loadActiveProgram(), loadCompletions(), loadBodyMetrics(), loadProgressPhotos(), loadSetLogs(),
      ]);
      if (cancelled) return;
      setProgram(program);
      setCompletions(comps);
      setBodyMetrics(body);
      setPhotos(pics);
      setSetLogs(sets);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Re-pull weigh-ins after logging one (keeps the number + chart in sync).
  const refreshBody = useCallback(async () => { setBodyMetrics(await loadBodyMetrics()); }, []);
  // Re-pull photos after an upload (fresh signed URLs, newest first).
  const refreshPhotos = useCallback(async () => { setPhotos(await loadProgressPhotos()); }, []);

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

  // ── Milestones & achievements — all derived from workout_completions +
  // body_metrics (no new tables). Each badge carries a current/target count so
  // locked ones can show progress toward the next tier; the grid is ordered
  // unlocked-first, then by how close it is.
  const milestones = useMemo(() => {
    const total = completions.length;

    // Completions per Monday-first week → best single week + longest run of
    // consecutive weeks that MET the plan target (same week logic as the streak).
    const weekCounts = new Map<string, number>();
    for (const c of completions) {
      const k = localDateKey(startOfWeek(new Date(c.completed_at)));
      weekCounts.set(k, (weekCounts.get(k) ?? 0) + 1);
    }
    const bestWeekCount = weekCounts.size ? Math.max(...weekCounts.values()) : 0;
    const metWeekTimes = [...weekCounts.entries()]
      .filter(([, n]) => n >= weeklyTarget)
      .map(([k]) => new Date(`${k}T00:00:00`).getTime())
      .sort((a, b) => a - b);
    let bestMetRun = 0, run = 0, prevT: number | null = null;
    for (const t of metWeekTimes) {
      run = prevT !== null && Math.round((t - prevT) / 86400000) === 7 ? run + 1 : 1;
      bestMetRun = Math.max(bestMetRun, run);
      prevT = t;
    }

    // Body: weigh-in count + how many distinct weeks have a weigh-in.
    const weighIns = bodyMetrics.filter((m) => m.weight != null);
    const weighWeeks = new Set(weighIns.map((m) => localDateKey(startOfWeek(new Date(`${m.recorded_on}T00:00:00`)))));

    const mk = (id: string, icon: React.ReactNode, title: string, desc: string, current: number, target: number) => ({
      id, icon, title, desc, target,
      current: Math.max(0, Math.min(current, target)),   // capped for display
      unlocked: current >= target,
      progress: target > 0 ? Math.min(1, current / target) : 0,
    });

    const list = [
      mk('first-workout', BADGE_ICON.check, 'First Workout', 'Complete your first workout', total, 1),
      mk('getting-started', BADGE_ICON.flame, 'Getting Started', 'Log 10 workouts', total, 10),
      mk('committed', BADGE_ICON.star, 'Committed', 'Log 25 workouts', total, 25),
      mk('dedicated', BADGE_ICON.medal, 'Dedicated', 'Log 50 workouts', total, 50),
      mk('century', BADGE_ICON.trophy, 'Century', 'Log 100 workouts', total, 100),
      mk('streak-1', BADGE_ICON.zap, 'On the Board', 'Reach a 1-week streak', bestStreak, 1),
      mk('streak-4', BADGE_ICON.zap, 'Four in a Row', 'Reach a 4-week streak', bestStreak, 4),
      mk('streak-8', BADGE_ICON.zap, 'Two Months', 'Reach an 8-week streak', bestStreak, 8),
      mk('streak-12', BADGE_ICON.zap, 'Quarter Strong', 'Reach a 12-week streak', bestStreak, 12),
      mk('perfect-week', BADGE_ICON.calendar, 'Perfect Week', 'Hit your weekly plan target', bestWeekCount, weeklyTarget),
      mk('perfect-month', BADGE_ICON.calendar, 'Perfect Month', '4 straight weeks on target', bestMetRun, 4),
      mk('first-weighin', BADGE_ICON.scale, 'First Weigh-in', 'Log your first weight', weighIns.length, 1),
      mk('tracker', BADGE_ICON.trend, 'Tracker', 'Log weight in 4 different weeks', weighWeeks.size, 4),
    ];

    // Unlocked first, then most-progressed; keep declaration order as tiebreak.
    return list
      .map((b, i) => ({ b, i }))
      .sort((a, z) =>
        (Number(z.b.unlocked) - Number(a.b.unlocked)) ||
        (z.b.progress - a.b.progress) ||
        (a.i - z.i))
      .map(({ b }) => b);
  }, [completions, bodyMetrics, weeklyTarget, bestStreak]);

  // ── Strength — derived from set_logs. Best (heaviest) set per exercise (PRs),
  // per-exercise weight-over-time series, and weekly training volume (Σ w×reps)
  // over the last 8 weeks. Null when nothing's logged → the section shows its
  // empty prompt.
  const VOL_WEEKS = 8;
  const strength = useMemo(() => {
    const withWeight = setLogs.filter((s) => s.weight != null);
    if (withWeight.length === 0) return null;

    // Group by exercise → heaviest set (tie-break on reps) becomes the PR.
    const byEx = new Map<string, SetLog[]>();
    for (const s of withWeight) {
      const arr = byEx.get(s.exercise_id) ?? [];
      arr.push(s);
      byEx.set(s.exercise_id, arr);
    }
    const weekAgo = addDays(today, -7);
    const prs = [...byEx.entries()].map(([exId, logs]) => {
      const best = logs.reduce((a, b) => {
        const aw = a.weight ?? 0, bw = b.weight ?? 0;
        if (bw > aw) return b;
        if (bw === aw && (b.reps ?? 0) > (a.reps ?? 0)) return b;
        return a;
      });
      return {
        exId,
        name: best.exercise_name || 'Exercise',
        weight: best.weight ?? 0,
        reps: best.reps ?? 0,
        unit: best.unit,
        achievedOn: best.performed_on,
        isRecent: new Date(`${best.performed_on}T00:00:00`) >= weekAgo,
      };
    });
    // Newest PR first, then heaviest.
    prs.sort((a, z) => (a.achievedOn < z.achievedOn ? 1 : a.achievedOn > z.achievedOn ? -1 : z.weight - a.weight));

    // Weekly volume, oldest → newest, last VOL_WEEKS Monday-first weeks.
    const volByWeek = new Map<string, number>();
    for (const s of withWeight) {
      if (s.reps == null) continue;
      const wk = localDateKey(startOfWeek(new Date(`${s.performed_on}T00:00:00`)));
      volByWeek.set(wk, (volByWeek.get(wk) ?? 0) + (s.weight ?? 0) * s.reps);
    }
    const wk0 = startOfWeek(today);
    const weeklyVolume = Array.from({ length: VOL_WEEKS }, (_, k) => {
      const d = addDays(wk0, -7 * (VOL_WEEKS - 1 - k));
      const key = localDateKey(d);
      return { key, date: key, value: volByWeek.get(key) ?? 0 };
    });

    // Per-exercise weight-over-time — top weight per day, oldest → newest.
    const seriesFor = (exId: string) => {
      const perDay = new Map<string, number>();
      for (const s of byEx.get(exId) ?? []) {
        if (s.weight == null) continue;
        perDay.set(s.performed_on, Math.max(perDay.get(s.performed_on) ?? 0, s.weight));
      }
      return [...perDay.entries()].sort((a, z) => (a[0] < z[0] ? -1 : 1)).map(([date, value]) => ({ date, value }));
    };

    return { prs, weeklyVolume, seriesFor };
  }, [setLogs, today]);

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
    background: 'var(--nura-page-gradient)',
    fontFamily: FONT, color: TEXT,
  };
  const tile = (label: string, value: string) => (
    <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 14px' }}>
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
        <div style={{ width: '100%', maxWidth: 'var(--fit-frame, 440px)', paddingBottom: 100 }}>

          {/* header — back + eyebrow, then serif title (1:1 with ExerciseDetail) */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <FitnessBackButton onClick={() => router.push('/fitness')} />
              <div style={{ fontSize: 11, letterSpacing: '.22em', color: MUT, flex: 1 }}>FITNESS</div>
              <ThemeToggle size={36} />
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, letterSpacing: '-.02em', margin: '4px 0 0', lineHeight: 1.1 }}>Progress</h1>
          </div>

          {/* hero — weekly ring */}
          <div className="nura-flat-accent" style={{
            position: 'relative', overflow: 'hidden', borderRadius: 22, padding: 20, marginBottom: 20,
            background: 'linear-gradient(135deg,rgba(var(--nura-sage-rgb),.20),rgba(var(--nura-sage-rgb),.04))',
            border: '1px solid rgba(var(--nura-sage-rgb),.25)',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            {/* soft radial corner-glow (matches the dashboard hero) */}
            <div className="nura-halo" style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(var(--nura-sage-rgb),.35),transparent 70%)', pointerEvents: 'none' }} />

            {/* ring */}
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={R} fill="none" stroke={LINE} strokeWidth={STROKE} />
                <circle
                  cx="55" cy="55" r={R} fill="none" stroke={SERIES} strokeWidth={STROKE} strokeLinecap="round"
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
              <div style={{ fontSize: 11, letterSpacing: '.16em', color: "var(--nura-accent-text)" }}>THIS WEEK</div>
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
            <div className="nura-card" style={{
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
                color: SAGE, background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.3)',
                borderRadius: 11, padding: '9px 14px', fontSize: 13, fontWeight: 700, fontFamily: FONT,
              }}>+ Log</button>
            </div>

            {/* trend chart, or first-weigh-in prompt when there's nothing to plot */}
            {body.chartPoints.length >= 2 ? (
              <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 14px' }}>
                <WeightTrendChart points={body.chartPoints} unit={body.unit} />
              </div>
            ) : (
              <div className="nura-card" style={{
                textAlign: 'center', background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Log your first weigh-in</div>
                <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>Track your weight over time to see the trend here.</div>
              </div>
            )}
          </div>

          {/* progress photos */}
          {secHead('Progress Photos')}
          <div style={{ marginBottom: 30 }}>
            {photos.length === 0 ? (
              <button className="nura-card" type="button" onClick={() => setAddPhotoOpen(true)} style={{
                appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'center',
                background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px', color: TEXT,
              }}>
                <div style={{ fontSize: 26, color: SAGE, marginBottom: 8 }}>+</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Add your first photo</div>
                <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>Track visible change over time.</div>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                {/* + Add photo tile */}
                <button className="nura-card" type="button" onClick={() => setAddPhotoOpen(true)} style={{
                  appearance: 'none', cursor: 'pointer', flex: '0 0 auto', width: 96, aspectRatio: '3 / 4',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: SURF, border: `1px dashed ${LINE}`, borderRadius: 14, color: MUT, padding: 0,
                }}>
                  <span style={{ fontSize: 22, color: SAGE }}>+</span>
                  <span style={{ fontSize: 11 }}>Add photo</span>
                </button>

                {/* thumbnails, newest first */}
                {photos.map((p) => (
                  <button key={p.id} type="button" onClick={() => setViewing(p)} style={{
                    appearance: 'none', cursor: 'pointer', flex: '0 0 auto', width: 96, padding: 0, background: 'none', border: 'none',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url ?? ''} alt={`Progress photo ${p.taken_on}`} style={{
                      width: 96, aspectRatio: PHOTO_ASPECT, objectFit: objectFitFor(p.fit),
                      borderRadius: 14, background: SURF, border: `1px solid ${LINE}`, display: 'block',
                    }} />
                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: MUT, marginTop: 6, textAlign: 'center' }}>{fmtPhotoDate(p.taken_on)}</div>
                  </button>
                ))}
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
                        background: cell.future ? 'transparent' : cell.done ? SAGE : 'rgba(var(--nura-bg-tint-rgb),.06)',
                        border: cell.future ? '1px solid transparent' : `1px solid ${cell.done ? SAGE : LINE}`,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: MUT, marginBottom: 30 }}>Last {HEATMAP_WEEKS} weeks</div>

          {/* milestones & achievements */}
          {secHead('Milestones')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 30 }}>
            {milestones.map((b) => (
              <div className="nura-card" key={b.id} style={{
                display: 'flex', flexDirection: 'column', gap: 9,
                background: SURF, borderRadius: 14, padding: 13,
                border: `1px solid ${b.unlocked ? 'rgba(var(--nura-sage-rgb),.35)' : LINE}`,
                opacity: b.unlocked ? 1 : 0.7,
              }}>
                {/* icon + locked marker */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: b.unlocked ? 'rgba(var(--nura-sage-rgb),.14)' : 'rgba(var(--nura-bg-tint-rgb),.05)',
                    border: `1px solid ${b.unlocked ? 'rgba(var(--nura-sage-rgb),.3)' : LINE}`,
                    color: b.unlocked ? SAGE : MUT,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{b.icon}</svg>
                  </div>
                  {!b.unlocked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" stroke={MUT} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>{BADGE_ICON.lock}</svg>
                  )}
                </div>

                {/* title + description */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: b.unlocked ? TEXT : MUT }}>{b.title}</div>
                  <div style={{ fontSize: 11, color: MUT, marginTop: 3, lineHeight: 1.4 }}>{b.desc}</div>
                </div>

                {/* progress — count in mono + a thin bar (bottom-aligned) */}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: b.unlocked ? SAGE : TEXT }}>{b.current} / {b.target}</span>
                    {b.unlocked && <span style={{ fontSize: 9, letterSpacing: '.12em', color: "var(--nura-accent-text)" }}>UNLOCKED</span>}
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(var(--nura-bg-tint-rgb),.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.round(b.progress * 100)}%`, background: b.unlocked ? SAGE : 'rgba(var(--nura-sage-rgb),.45)', borderRadius: 3, transition: 'width .5s ease' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* strength & PRs */}
          {secHead('Strength')}
          {!strength ? (
            <div className="nura-card" style={{
              textAlign: 'center', background: SURF, border: `1px dashed ${LINE}`, borderRadius: 18, padding: '26px 20px', marginBottom: 30,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No lifts logged yet</div>
              <div style={{ fontSize: 12.5, color: MUT, lineHeight: 1.5 }}>Log the weights you lift to start tracking strength.</div>
            </div>
          ) : (
            <div style={{ marginBottom: 30 }}>
              {/* recent PRs — heaviest set per exercise, newest first, tap for trend */}
              <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT, marginBottom: 10 }}>RECENT PRs</div>
              <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, overflow: 'hidden', marginBottom: 18 }}>
                {strength.prs.slice(0, 6).map((pr, i) => (
                  <button key={pr.exId} type="button" onClick={() => setStrengthEx(pr.exId)} style={{
                    appearance: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '13px 15px', border: 'none', borderTop: i === 0 ? 'none' : `1px solid ${LINE}`, color: TEXT, fontFamily: FONT,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pr.name}</div>
                      <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>Best set</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {pr.isRecent && (
                        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: BG, background: SAGE, borderRadius: 999, padding: '3px 7px' }}>NEW PR</span>
                      )}
                      <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "var(--nura-accent-text)" }}>{fmtWeight(pr.weight)} {pr.unit} × {pr.reps}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* weekly volume — Σ weight×reps over the last 8 weeks */}
              <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT, marginBottom: 10 }}>WEEKLY VOLUME · LAST {VOL_WEEKS} WEEKS</div>
              <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '16px 14px' }}>
                <VolumeBars weeks={strength.weeklyVolume} />
              </div>
            </div>
          )}

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
                padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid rgba(var(--nura-bg-tint-rgb),.06)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>{r.date}</div>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 13, color: "var(--nura-accent-text)" }}>{r.duration}</div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* bottom nav — same block as the dashboard, Progress active */}
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
      {addPhotoOpen && (
        <AddPhotoModal onClose={() => setAddPhotoOpen(false)} onSaved={refreshPhotos} />
      )}
      {viewing && (
        <PhotoViewerModal
          photo={viewing}
          photos={photos}
          onClose={() => setViewing(null)}
          onUpdate={(id, fit) => {
            // Optimistic — keep the signed URLs, just swap the fit locally.
            setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, fit } : p)));
            setViewing((prev) => (prev && prev.id === id ? { ...prev, fit } : prev));
          }}
        />
      )}
      {strengthEx && strength && (() => {
        const pr = strength.prs.find((p) => p.exId === strengthEx) ?? null;
        return (
          <ExerciseStrengthModal
            name={pr?.name ?? 'Exercise'}
            unit={pr?.unit ?? 'lb'}
            points={strength.seriesFor(strengthEx)}
            pr={pr ? { weight: pr.weight, reps: pr.reps, unit: pr.unit } : null}
            onClose={() => setStrengthEx(null)}
          />
        );
      })()}
    </div>
  );
}
