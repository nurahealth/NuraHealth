'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ExerciseDetail from './ExerciseDetail';
import ExerciseMedia, { CLIP_BG } from './ExerciseMedia';
import { MUSCLE_GROUPS, inGroup } from './muscleGroups';
import { MOVEKIT_GIF_LIKE } from '@/lib/movekit';

// ── Palette (NŪRA) ───────────────────────────────────────────────────────────
const SAGE = 'var(--nura-sage)';
const SANS = "var(--font-inter), system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

type Ex = {
  id: string;
  name: string;
  gif_url: string | null;
  target_muscles: string[] | null;
  body_part: string | null;
  equipment: string | null;
};

// ── Group icons (minimal sage line glyphs) ───────────────────────────────────
const Ico = ({ children }: { children: React.ReactNode }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const ChestIcon = () => <Ico><path d="M4 8c2.4-2.2 5.6-2.2 8 0 2.4-2.2 5.6-2.2 8 0" /><path d="M4 8v2.5C4 13.5 6 15 8 15s4-1.5 4-4.5M20 8v2.5c0 3-2 4.5-4 4.5s-4-1.5-4-4.5" /></Ico>;
const BackIcon = () => <Ico><path d="M12 3v18" /><path d="M12 7c-2.2 1.2-5 1.4-7.5.4M12 7c2.2 1.2 5 1.4 7.5.4M12 13c-1.8 1-3.8 1.1-5.5.3M12 13c1.8 1 3.8 1.1 5.5.3" /></Ico>;
const ShouldersIcon = () => <Ico><path d="M3 15c0-5 4-8 9-8s9 3 9 8" /><circle cx="5.5" cy="15" r="2.2" /><circle cx="18.5" cy="15" r="2.2" /></Ico>;
const ArmsIcon = () => <Ico><path d="M7 4v7a4.5 4.5 0 0 0 4.5 4.5H14" /><path d="M7 10.5c2.2 1.6 4.4 1.1 5.5-1.2" /><path d="M14 15.5V20" /></Ico>;
const LegsIcon = () => <Ico><path d="M9.5 3 9 12l-1.2 9M14.5 3l.5 9 1.2 9" /><path d="M9 7h6" /></Ico>;
const CoreIcon = () => <Ico><rect x="8" y="3.5" width="8" height="17" rx="2.5" /><path d="M12 3.5v17M8 9h8M8 13.5h8" /></Ico>;

// ── Muscle group → catalog mapping (shared source of truth) ──────────────────
// Targets/body_part live in ./muscleGroups so the "Add exercise" grouping uses
// the exact same definitions. Icons are matched here by group key.
const GROUP_ICON: Record<string, () => React.ReactElement> = {
  chest: ChestIcon, back: BackIcon, shoulders: ShouldersIcon, arms: ArmsIcon, legs: LegsIcon, core: CoreIcon,
};
const GROUPS = MUSCLE_GROUPS.map((g) => ({ ...g, Icon: GROUP_ICON[g.key] }));

function ExerciseThumb({ ex }: { ex: Ex }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
      background: CLIP_BG, border: `1px solid rgba(var(--nura-sage-rgb),0.22)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {ex.gif_url ? (
        <ExerciseMedia src={ex.gif_url} alt={ex.name} fit="cover" thumb />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9v6M7 6.5v11M7 12h10M17 6.5v11M20 9v6" />
        </svg>
      )}
    </div>
  );
}

function ExerciseRow({ ex, onOpen }: { ex: Ex; onOpen: () => void }) {
  const [hover, setHover] = useState(false);
  const sub = ((ex.target_muscles ?? []).join(' · ') || ex.body_part || '') + (ex.equipment ? ` — ${ex.equipment}` : '');
  return (
    <button
      type="button"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      style={{
        appearance: 'none', width: '100%', textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 12,
        background: hover ? `rgba(var(--nura-bg-tint-rgb),0.04)` : 'transparent', border: 'none',
        transition: 'background 140ms ease', fontFamily: SANS,
      }}
    >
      <ExerciseThumb ex={ex} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--nura-text-primary)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ex.name}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: `var(--nura-text-tertiary)`, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sub}
          </div>
        )}
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`var(--nura-ink-faint)`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

export default function MuscleMap() {
  const [exercises, setExercises] = useState<Ex[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [detailExId, setDetailExId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('exercises')
        .select('id,name,gif_url,target_muscles,body_part,equipment')
        .like('gif_url', MOVEKIT_GIF_LIKE); // browse-by-muscle → MoveKit-covered only
      if (!cancelled) {
        setExercises((data as Ex[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Only groups that actually have exercises in the (partial) catalog.
  const rows = useMemo(
    () => GROUPS.map((g) => ({ group: g, items: exercises.filter((ex) => inGroup(ex, g)) })).filter((r) => r.items.length > 0),
    [exercises],
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--nura-text-primary)', fontFamily: SANS, margin: '0 0 4px', letterSpacing: '-0.3px' }}>
          Train by muscle
        </h2>
        <p style={{ fontSize: 13.5, color: `var(--nura-text-secondary)`, fontFamily: SANS, margin: 0, lineHeight: 1.6 }}>
          Browse exercises by muscle group.
        </p>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: `var(--nura-text-tertiary)`, fontFamily: SANS, padding: '8px 2px' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ fontSize: 13.5, color: `var(--nura-text-secondary)`, fontFamily: SANS, lineHeight: 1.6, padding: '8px 2px' }}>
          No exercises in the catalog yet — they’ll appear here as the library loads.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map(({ group, items }) => {
            const isOpen = open === group.key;
            return (
              <div key={group.key} style={{
                borderRadius: 16, overflow: 'hidden',
                background: `rgba(var(--nura-bg-tint-rgb),0.025)`,
                border: `1px solid ${isOpen ? `rgba(var(--nura-sage-rgb),0.4)` : `rgba(var(--nura-bg-tint-rgb),0.09)`}`,
                transition: 'border-color 180ms ease',
              }}>
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : group.key)}
                  style={{
                    appearance: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', border: 'none',
                    background: 'transparent', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', fontFamily: SANS,
                  }}
                >
                  <span style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0, color: SAGE,
                    background: `rgba(var(--nura-sage-rgb),0.12)`, border: `1px solid rgba(var(--nura-sage-rgb),0.22)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <group.Icon />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: 'var(--nura-text-primary)', letterSpacing: '-0.2px' }}>
                      {group.label}
                    </span>
                    <span style={{ display: 'block', fontSize: 11.5, fontFamily: MONO, letterSpacing: '0.5px', color: "var(--nura-accent-label)", marginTop: 3 }}>
                      {items.length} {items.length === 1 ? 'exercise' : 'exercises'}
                    </span>
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 240ms ease' }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Smoothly-expanding body (grid-rows 0fr→1fr) */}
                <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 280ms ease' }}>
                  <div style={{ minHeight: 0, overflow: 'hidden' }}>
                    <div style={{
                      padding: '4px 8px 10px', borderTop: `1px solid rgba(var(--nura-bg-tint-rgb),0.07)`,
                      margin: '0 8px', display: 'flex', flexDirection: 'column', gap: 2,
                    }}>
                      {items.map((ex) => <ExerciseRow key={ex.id} ex={ex} onOpen={() => setDetailExId(ex.id)} />)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detailExId && (
        <ExerciseDetail exerciseId={detailExId} onClose={() => setDetailExId(null)} />
      )}
    </div>
  );
}
