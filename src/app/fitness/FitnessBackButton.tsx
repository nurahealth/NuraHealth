'use client';

// Shared back control for PUSHED Fitness sub-screens — 1:1 with the control on
// ExerciseDetail.tsx (36×36, radius 12, SURF fill, LINE border, chevron in TEXT).
// Top-level bottom-nav tabs (Home / Calendar / Progress / Profile) navigate via
// the tab bar and don't use this. Added in one place so every sub-screen stays
// consistent by default.

const TEXT = '#ebe6d8';
const SURF = 'rgba(235,230,216,.045)';
const LINE = 'rgba(235,230,216,.09)';

export default function FitnessBackButton({ onClick, label = 'Back', style }: {
  onClick: () => void;
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{
      appearance: 'none', cursor: 'pointer', width: 36, height: 36, borderRadius: 12, padding: 0, flexShrink: 0,
      background: SURF, border: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
