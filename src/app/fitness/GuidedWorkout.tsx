'use client';

// ── Guided Workout Mode ──────────────────────────────────────────────────────
// A full-screen overlay that walks one workout: a start screen (Stage A), then
// logging one exercise — one SET — at a time (Stage B), then a finish summary
// that saves (Stage C).
//
// It owns no persistence of its own. Sets are handed to the existing
// `bufferSets` buffer (see sessionSets.ts) and written by the dashboard's
// existing `finishWorkout` flush, so the data path here is unchanged. Like the
// session timer it lives in memory only for v1 — a reload drops the session.
//
// Same fixed-overlay pattern as ExerciseDetail: it starts at the content edge so
// it never slides under the docked desktop rail.

import { useState } from 'react';
import type { Workout } from './planData';
import { muscleLabel, estimateMinutes, setsRepsLabel } from './workoutFormat';
import FitnessBackButton from './FitnessBackButton';

// ── Palette — theme tokens only, so both skins render from one set of values ──
const SAGE = 'var(--nura-sage)';
const ON_SAGE = 'var(--nura-sage-bg-on)';       // ink that sits ON a filled sage surface
const TEXT = 'var(--nura-text-primary)';
const MUT = 'var(--nura-text-secondary)';
const FAINT = 'var(--nura-ink-faint)';
const SURF = 'rgba(var(--nura-bg-tint-rgb),.045)';
const LINE = 'rgba(var(--nura-bg-tint-rgb),.09)';
const FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif';
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'JetBrains Mono', monospace";
// Sage in dark, ink in light — the token that keeps headings AA-legible in both.
const ACCENT_TEXT = 'var(--nura-accent-text)';

type Stage = 'start' | 'log' | 'done';

type Props = {
  workout: Workout;
  /** Eyebrow line — day + workout title, e.g. "TUESDAY · UPPER BODY". */
  dayLabel: string;
  /** Begin the session (starts the dashboard's Start→Finish timer). */
  onStart: () => void;
  /** Leave guided mode and go back to the dashboard. */
  onClose: () => void;
  /** Close and reveal the existing plan editor for today. */
  onEditPlan: () => void;
};

// ── Shared bits ──────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  // A full-screen SCREEN, not a modal — same treatment as ExerciseDetail, so it
  // starts where the content does rather than under the docked rail.
  position: 'fixed', inset: '0 0 0 var(--nura-content-left)', zIndex: 100, overflowY: 'auto',
  minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: 20,
  background: 'var(--nura-page-gradient)',
  fontFamily: FONT, color: TEXT,
};

const column: React.CSSProperties = { width: '100%', maxWidth: 'var(--fit-detail, 440px)', paddingBottom: 40 };

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, letterSpacing: '.16em', color: MUT, textTransform: 'uppercase', margin: '0 0 14px' }}>
      {children}
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      className="nura-lift"
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', background: SAGE, color: ON_SAGE, border: 'none', borderRadius: 13,
        padding: 16, fontSize: 15.5, fontWeight: 700, fontFamily: FONT,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.7 : 1,
        boxShadow: '0 8px 24px rgba(var(--nura-sage-rgb),.3)',
        transition: 'opacity var(--nura-dur) var(--nura-ease)',
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', background: 'transparent', color: MUT, border: `1px solid ${LINE}`,
        borderRadius: 13, padding: 14, fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
        transition: 'color var(--nura-dur) var(--nura-ease)',
      }}
    >
      {children}
    </button>
  );
}

function MusclePill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10.5, borderRadius: 999, padding: '4px 9px', whiteSpace: 'nowrap',
      background: 'rgba(var(--nura-sage-rgb),.12)', border: '1px solid rgba(var(--nura-sage-rgb),.24)',
      color: ACCENT_TEXT,
    }}>{children}</span>
  );
}

// ── Stage A — start screen ───────────────────────────────────────────────────

function StartScreen({ workout, dayLabel, onStart, onClose, onEditPlan }: Props) {
  const exs = workout.exercises;
  return (
    <div style={overlay}>
      <div style={column}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <FitnessBackButton onClick={onClose} />
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: MUT }}>WORKOUT</div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: '.16em', color: ACCENT_TEXT, marginBottom: 10 }}>
          {dayLabel}
        </div>
        <h1 style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, lineHeight: 1.08, letterSpacing: '-.01em', margin: '0 0 12px' }}>
          Ready to <em style={{ color: ACCENT_TEXT, fontStyle: 'italic' }}>train?</em>
        </h1>
        <div style={{ fontSize: 13.5, color: MUT, marginBottom: 28 }}>
          {exs.length} exercise{exs.length === 1 ? '' : 's'} · ~{estimateMinutes(exs)} min
        </div>

        <SectionHead>Today&apos;s lineup</SectionHead>
        <div className="nura-card" style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: '4px 16px 6px', marginBottom: 26 }}>
          {exs.map((we, i) => (
            <div key={we.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(var(--nura-bg-tint-rgb),.06)',
            }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: FAINT, width: 16, flexShrink: 0 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {we.exercise?.name ?? 'Exercise'}
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                  {muscleLabel(we.exercise).split(' · ').filter(Boolean).slice(0, 2).map((m) => (
                    <MusclePill key={m}>{m}</MusclePill>
                  ))}
                </div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 12, color: MUT, flexShrink: 0 }}>
                {setsRepsLabel(we)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton onClick={onStart}>Start workout</PrimaryButton>
          <GhostButton onClick={onEditPlan}>Edit today&apos;s plan</GhostButton>
        </div>

      </div>
    </div>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

export default function GuidedWorkout(props: Props) {
  const [stage, setStage] = useState<Stage>('start');

  // Stage A → begin the session. Stages B/C land here in the next slices; until
  // then starting hands off to the dashboard's existing Start→Finish controls.
  const begin = () => {
    props.onStart();
    setStage('log');
    props.onClose();
  };

  if (stage === 'start') return <StartScreen {...props} onStart={begin} />;
  return null;
}
