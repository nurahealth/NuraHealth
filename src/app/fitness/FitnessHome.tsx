'use client';

import { useState } from 'react';
import Link from 'next/link';
import NuraPageShell from '@/components/NuraPageShell';
import { GOAL_LABELS } from './FitnessOnboarding';
import MuscleMap from './MuscleMap';
import WorkoutPlan from './WorkoutPlan';
import type { FitnessProfileData } from './actions';

const TEXT = 'var(--nura-text-primary)';
const TEXT_SEC = 'var(--nura-text-secondary)';
const TEXT_TER = 'var(--nura-text-tertiary)';
const BORDER = 'var(--nura-border)';
const SAGE = 'var(--nura-sage)';
const SAGE_HOV = 'var(--nura-sage-hover)';
const SANS = "var(--font-inter), system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

// ── Icons (kit-matched: 18px, 1.5 stroke) ──────────────────────────────────────
const I = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const EditIcon = () => <I size={15}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></I>;

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

  const calendarLink = (
    <Link
      href="/fitness/calendar"
      aria-label="Training calendar"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38,
        borderRadius: 11, color: SAGE, textDecoration: 'none',
        background: 'rgba(var(--nura-sage-rgb),0.1)', border: '0.5px solid rgba(var(--nura-sage-rgb),0.4)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </svg>
    </Link>
  );

  return (
    <NuraPageShell title="Fitness" maxWidth={940} desktopMaxWidth={1280} rightAction={calendarLink}>
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
      <div className="nura-card" style={{
        background: 'var(--nura-surface)', border: `1px solid ${BORDER}`,
        borderRadius: 18, padding: 20, marginBottom: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '2px', color: "var(--nura-accent-label)", textTransform: 'uppercase' }}>
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

      {/* Active program — the user's weekly plan */}
      <WorkoutPlan />

      {/* Train by muscle — browse the catalog */}
      <MuscleMap />
    </NuraPageShell>
  );
}
