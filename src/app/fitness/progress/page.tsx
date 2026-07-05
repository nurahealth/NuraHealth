'use client';

import FitnessProgress from '../FitnessProgress';

// Standalone full-screen design (own radial background, plexus and bottom nav),
// so it renders without the NuraPageShell wrapper — matching the dashboard.
export default function FitnessProgressPage() {
  return <FitnessProgress />;
}
