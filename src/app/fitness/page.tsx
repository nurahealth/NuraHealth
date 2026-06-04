'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NuraPageShell from '@/components/NuraPageShell';
import FitnessOnboarding from './FitnessOnboarding';
import FitnessHome from './FitnessHome';
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

type View = 'loading' | 'onboarding' | 'home';

export default function FitnessPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('loading');
  const [profile, setProfile] = useState<FitnessProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Read the user's fitness profile and decide which surface to show. Bumping
  // reloadKey re-runs the fetch (used after completing/editing the flow).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) { router.push('/auth'); return; }

      const { data: row } = await supabase
        .from('fitness_profiles')
        .select('primary_goal, experience_level, equipment, days_per_week, limitations, onboarded')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;

      const r = row as FitnessRow | null;
      if (r && r.onboarded) {
        setProfile(rowToData(r));
        setView('home');
      } else {
        // No row, or row exists but onboarding not finished → run the flow.
        setProfile(r ? rowToData(r) : null);
        setView('onboarding');
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

  return <FitnessHome profile={profile} onEdit={() => setEditing(true)} />;
}
