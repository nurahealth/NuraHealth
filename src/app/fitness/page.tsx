'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NuraPageShell from '@/components/NuraPageShell';
import FitnessOnboarding from './FitnessOnboarding';
import FitnessDashboard from './FitnessDashboard';
import type { FitnessProfileData } from './actions';

interface FitnessRow {
  primary_goal: string | null;
  experience_level: string | null;
  equipment: string[] | null;
  days_per_week: number | null;
  limitations: string | null;
  onboarded: boolean | null;
}

function rowToData(row: FitnessRow): FitnessProfileData {
  return {
    primary_goal: row.primary_goal ?? '',
    experience_level: row.experience_level ?? '',
    equipment: row.equipment ?? [],
    days_per_week: row.days_per_week ?? null,
    limitations: row.limitations ?? '',
  };
}

type View = 'loading' | 'onboarding' | 'home' | 'error';

export default function FitnessPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('loading');
  const [profile, setProfile] = useState<FitnessProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read the user's fitness profile and decide which surface to show. Bumping
  // reloadKey re-runs the fetch (used after completing/editing the flow).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Any failure here (getUser reject, profile query throw) must land on a
      // visible error state — otherwise the page stays stuck on the loading
      // shell (header only, blank body) with no way to recover.
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) { router.push('/auth'); return; }

        const { data: row, error } = await supabase
          .from('fitness_profiles')
          .select('primary_goal, experience_level, equipment, days_per_week, limitations, onboarded')
          .eq('user_id', user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw new Error(error.message);

        const r = row as FitnessRow | null;
        if (r && r.onboarded) {
          setProfile(rowToData(r));
          setView('home');
        } else {
          // No row, or row exists but onboarding not finished → run the flow.
          setProfile(r ? rowToData(r) : null);
          setView('onboarding');
        }
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : 'Could not load your fitness profile.');
        setView('error');
      }
    })();
    return () => { cancelled = true; };
  }, [router, reloadKey]);

  const handleComplete = useCallback(() => {
    setEditing(false);
    setView('loading');
    setReloadKey(k => k + 1);
  }, []);

  if (view === 'loading') {
    return <NuraPageShell title="Fitness" maxWidth={760}><div /></NuraPageShell>;
  }

  if (view === 'error') {
    return (
      <NuraPageShell title="Fitness" maxWidth={760}>
        <div style={{ borderRadius: 18, padding: '24px 22px', textAlign: 'center', background: 'var(--nura-tint-danger)', border: '1px solid var(--nura-tint-danger-border)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--nura-danger-soft)', marginBottom: 6 }}>Couldn&apos;t load Fitness</div>
          <p style={{ fontSize: 13, color: 'var(--nura-text-secondary)', lineHeight: 1.6, margin: '0 0 16px', wordBreak: 'break-word' }}>{errorMsg}</p>
          <button
            type="button"
            onClick={() => { setErrorMsg(null); setView('loading'); setReloadKey((k) => k + 1); }}
            style={{ appearance: 'none', cursor: 'pointer', border: 'none', padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: 'var(--nura-bg)', background: 'var(--nura-sage)' }}
          >
            Try again
          </button>
        </div>
      </NuraPageShell>
    );
  }

  // First-time onboarding, or re-running the flow via "Edit".
  if (view === 'onboarding' || editing) {
    return (
      <FitnessOnboarding
        initial={editing ? profile : null}
        onComplete={handleComplete}
      />
    );
  }

  if (!profile) {
    return <NuraPageShell title="Fitness" maxWidth={760}><div /></NuraPageShell>;
  }

  // The Fitness tab renders the dashboard (1:1 port of the design reference),
  // wired to the user's real active program.
  return <FitnessDashboard />;
}
