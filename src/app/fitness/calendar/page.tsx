'use client';

import NuraPageShell from '@/components/NuraPageShell';
import FitnessCalendar from '../FitnessCalendar';

export default function FitnessCalendarPage() {
  return (
    <NuraPageShell title="Fitness" maxWidth={940} desktopMaxWidth={1200}>
      <FitnessCalendar />
    </NuraPageShell>
  );
}
