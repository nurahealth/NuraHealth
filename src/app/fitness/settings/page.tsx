'use client';

import PlanSettings from '../PlanSettings';

// Full-screen premium design (own header, ambient background, sticky footer),
// so it renders standalone — no NuraPageShell wrapper.
export default function PlanSettingsPage() {
  return <PlanSettings />;
}
