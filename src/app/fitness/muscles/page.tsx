'use client';

import NuraPageShell from '@/components/NuraPageShell';
import MuscleMap from '../MuscleMap';

export default function MusclesPage() {
  return (
    <NuraPageShell title="Fitness" maxWidth={1000}>
      <MuscleMap />
    </NuraPageShell>
  );
}
