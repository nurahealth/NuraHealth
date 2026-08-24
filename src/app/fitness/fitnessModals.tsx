'use client';

// ── Shared fitness modals ────────────────────────────────────────────────────
// The centered-modal shell and the Log-weigh-in modal, lifted verbatim out of
// FitnessProgress so the Profile screen can open the SAME weigh-in flow rather
// than grow a second one. Nothing here is restyled — only moved.

import { useCallback, useEffect, useRef, useState } from 'react';
import { logBodyMetric } from './planData';

// ── Palette (1:1 with FitnessProgress.tsx, its former home) ──────────────────
const BG = 'var(--nura-bg)';
const SAGE = 'var(--nura-sage)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const MONO = "'JetBrains Mono', monospace";

// Shared field styles for the centered modals (Body-log / Add-photo), so inputs
// look identical across them.
export const modalInputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 11,
  fontFamily: MONO, fontSize: 14, color: TEXT, background: SURF, border: `1px solid ${LINE}`, outline: 'none',
};
export const modalLabel = (text: string) => (
  <div style={{ fontSize: 11, letterSpacing: '.05em', color: MUT, margin: '0 0 6px' }}>{text}</div>
);

// ── Log weigh-in modal — renders inside the shared CenteredModal shell (same
// wrapper / padding / scroll structure as every other modal here). Fields:
// weight (required), body fat %, waist, notes.
export function LogWeightModal({ defaultUnit, onClose, onSaved }: {
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
export function CenteredModal({ title, onClose, maxWidth = 420, children }: {
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
