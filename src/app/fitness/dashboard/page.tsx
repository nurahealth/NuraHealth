'use client';

import FitnessDashboard from '../FitnessDashboard';

// The dashboard is a full-screen design (its own header, radial background and
// bottom nav), so it renders standalone — no NuraPageShell wrapper.
export default function FitnessDashboardPage() {
  return <FitnessDashboard />;
}
