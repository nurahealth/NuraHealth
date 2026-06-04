'use client';

import { useState } from 'react';
import NuraPageShell from '@/components/NuraPageShell';
import { GOAL_LABELS } from './FitnessOnboarding';
import type { FitnessProfileData } from './actions';

const TEXT = 'var(--nura-text-primary)';
const TEXT_SEC = 'var(--nura-text-secondary)';
const TEXT_TER = 'var(--nura-text-tertiary)';
const BORDER = 'var(--nura-border)';
const SAGE = 'var(--nura-sage)';
const SAGE_HOV = 'var(--nura-sage-hover)';
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ── Icons (kit-matched: 18px, 1.5 stroke) ──────────────────────────────────────
const I = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const EditIcon = () => <I size={15}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></I>;
const PlannerIcon = () => <I><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></I>;
const LibraryIcon = () => <I><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></I>;
const ProgressIcon = () => <I><path d="M3 3v18h18M7 14l3-4 3 3 4-6"/></I>;
const TrophyIcon = () => <I><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3"/></I>;

interface PreviewCard { key: string; label: string; blurb: string; icon: () => React.ReactElement }
const PREVIEW_CARDS: PreviewCard[] = [
  { key: 'planner',    label: 'Workout Planner',   blurb: 'Personalized sessions built around your goal and schedule.', icon: PlannerIcon },
  { key: 'library',    label: 'Exercise Library',  blurb: 'Form cues and swaps for every movement.',                    icon: LibraryIcon },
  { key: 'progress',   label: 'Progress',          blurb: 'Track lifts, volume, and trends over time.',                 icon: ProgressIcon },
  { key: 'achievements', label: 'Achievements',    blurb: 'Streaks and milestones that keep you going.',                icon: TrophyIcon },
];

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: '1 1 140px', minWidth: 0, padding: '14px 16px', borderRadius: 14,
      background: 'rgba(var(--nura-bg-tint-rgb),0.02)', border: `1px solid ${BORDER}`,
    }}>
      <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '1.4px', color: TEXT_TER, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontFamily: SANS, fontWeight: 500, color: TEXT, lineHeight: 1.35 }}>
        {value}
      </div>
    </div>
  );
}

export default function FitnessHome({ profile, onEdit }: {
  profile: FitnessProfileData;
  onEdit: () => void;
}) {
  const [editHov, setEditHov] = useState(false);

  const goal = profile.primary_goal ? (GOAL_LABELS[profile.primary_goal] ?? profile.primary_goal) : '—';
  const experience = profile.experience_level || '—';
  const days = profile.days_per_week != null ? `${profile.days_per_week} / week` : '—';
  const equipment = profile.equipment.length ? profile.equipment.join(' · ') : '—';

  return (
    <NuraPageShell title="Fitness" maxWidth={760}>
      {/* Heading */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: TEXT, fontFamily: SANS, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Your training
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SEC, fontFamily: SANS, margin: 0, lineHeight: 1.6 }}>
          The plan NŪRA is shaping around you.
        </p>
      </div>

      {/* Summary card */}
      <div style={{
        background: 'var(--nura-surface)', border: `1px solid ${BORDER}`,
        borderRadius: 18, padding: 20, marginBottom: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: SAGE, textTransform: 'uppercase' }}>
            Fitness profile
          </span>
          <button
            onClick={onEdit}
            onMouseEnter={() => setEditHov(true)}
            onMouseLeave={() => setEditHov(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
              background: editHov ? `rgba(var(--nura-sage-rgb),0.18)` : `rgba(var(--nura-sage-rgb),0.10)`,
              border: `0.5px solid rgba(var(--nura-sage-rgb),0.4)`,
              color: editHov ? SAGE_HOV : SAGE, fontFamily: SANS, fontSize: 12, fontWeight: 500,
              transition: 'background 160ms, color 160ms',
            }}
          >
            <EditIcon />
            Edit
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <SummaryTile label="Goal" value={goal} />
          <SummaryTile label="Experience" value={experience} />
          <SummaryTile label="Days" value={days} />
          <SummaryTile label="Equipment" value={equipment} />
        </div>

        {profile.limitations && (
          <div style={{
            marginTop: 12, padding: '12px 16px', borderRadius: 12,
            background: 'rgba(var(--nura-bg-tint-rgb),0.02)', border: `1px solid ${BORDER}`,
          }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '1.4px', color: TEXT_TER, textTransform: 'uppercase', marginBottom: 6 }}>
              Working around
            </div>
            <div style={{ fontSize: 14, fontFamily: SANS, color: TEXT_SEC, lineHeight: 1.55 }}>
              {profile.limitations}
            </div>
          </div>
        )}
      </div>

      {/* Coming soon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '1.6px', color: TEXT_TER, textTransform: 'uppercase' }}>
          Coming soon
        </span>
        <div style={{ flex: 1, height: 0.5, background: 'rgba(var(--nura-bg-tint-rgb),0.08)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {PREVIEW_CARDS.map(card => (
          <div key={card.key} aria-disabled style={{
            position: 'relative', padding: 18, borderRadius: 16,
            background: 'rgba(var(--nura-bg-tint-rgb),0.015)',
            border: `1px solid ${BORDER}`, overflow: 'hidden', cursor: 'default',
          }}>
            <span style={{
              position: 'absolute', top: 12, right: 12,
              fontSize: 8, fontWeight: 700, letterSpacing: '0.6px',
              color: TEXT_TER, background: 'rgba(var(--nura-bg-tint-rgb),0.05)',
              border: `0.5px solid ${BORDER}`, padding: '3px 7px', borderRadius: 5,
              textTransform: 'uppercase', fontFamily: MONO,
            }}>Soon</span>
            <div style={{ color: TEXT_TER, marginBottom: 12, lineHeight: 0, opacity: 0.85 }}>
              <card.icon />
            </div>
            <div style={{ fontSize: 14, fontFamily: SANS, fontWeight: 600, color: TEXT_SEC, marginBottom: 5 }}>
              {card.label}
            </div>
            <div style={{ fontSize: 12.5, fontFamily: SANS, color: TEXT_TER, lineHeight: 1.5 }}>
              {card.blurb}
            </div>
          </div>
        ))}
      </div>
    </NuraPageShell>
  );
}
