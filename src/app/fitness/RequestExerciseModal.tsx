'use client';

// ── Request an exercise ──────────────────────────────────────────────────────
// Lifted verbatim out of FitnessDashboard, where it was an inline block, so the
// Profile screen opens THIS modal rather than a second copy of it. Only the
// state moved inward — the markup and every value are unchanged.

import { useState } from 'react';
import { submitExerciseRequest } from './planData';

// ── Palette (1:1 with FitnessDashboard.tsx, its former home) ─────────────────
const BG = 'var(--nura-bg)';
const SAGE = 'var(--nura-sage)';
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';

export default function RequestExerciseModal({ onClose }: { onClose: () => void }) {
  const [reqName, setReqName] = useState('');
  const [reqDetails, setReqDetails] = useState('');
  const [reqState, setReqState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="nura-card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: BG, border: `1px solid ${LINE}`, borderRadius: 18, padding: 20, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Request an exercise</div>
        <div style={{ fontSize: 12.5, color: MUT, marginBottom: 14 }}>Tell us what&apos;s missing — we review every request.</div>
        {reqState === 'sent' ? (
          <div style={{ fontSize: 13.5, color: SAGE, padding: '8px 0 4px' }}>Request sent — thank you. We&apos;ll review it soon.</div>
        ) : (
          <>
            <input value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Exercise name (e.g. Nordic curl)"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 11, fontSize: 14, color: TEXT, background: 'var(--nura-inset-dark)', border: `1px solid ${LINE}`, outline: 'none', marginBottom: 9 }} />
            <textarea value={reqDetails} onChange={(e) => setReqDetails(e.target.value)} placeholder="Anything else? Equipment, variation… (optional)" rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 11, fontSize: 13.5, color: TEXT, background: 'var(--nura-inset-dark)', border: `1px solid ${LINE}`, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            {reqState === 'error' && (
              <div style={{ fontSize: 12, color: 'var(--nura-danger-soft)', marginTop: 8 }}>Couldn&apos;t send your request — try again.</div>
            )}
            <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${LINE}`, background: 'transparent', color: TEXT, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="button" disabled={reqState === 'busy' || !reqName.trim()} onClick={async () => {
                setReqState('busy');
                const res = await submitExerciseRequest(reqName, reqDetails);
                if (res.ok) { setReqState('sent'); setReqName(''); setReqDetails(''); }
                else setReqState('error');
              }} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: SAGE, color: BG, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', opacity: reqState === 'busy' || !reqName.trim() ? 0.6 : 1 }}>
                {reqState === 'busy' ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
