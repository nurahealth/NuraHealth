import { create } from "zustand";

/**
 * Tracks how many theme toggles are currently mounted *inside a screen's own
 * header*.
 *
 * The shell renders a floating fallback toggle so no screen can ever be left
 * without one. But most screens do have a header, and a floating button would
 * sit on top of it. So header-mounted toggles register here, and the fallback
 * renders only when the count is zero.
 *
 * The upshot is that this stays correct on its own: give a new screen's header
 * a <ThemeToggle variant="header" /> and the floating one steps aside; forget
 * to, and the floating one covers you.
 *
 * Sidebar and floating toggles deliberately do NOT register — the sidebar is
 * mounted (translated off-screen) even when the mobile drawer is shut, so
 * counting it would suppress the fallback on every mobile screen.
 */
interface ThemeToggleHosts {
  headerCount: number;
  registerHeader: () => void;
  unregisterHeader: () => void;
}

export const useThemeToggleHosts = create<ThemeToggleHosts>((set) => ({
  headerCount: 0,
  registerHeader: () => set((s) => ({ headerCount: s.headerCount + 1 })),
  unregisterHeader: () => set((s) => ({ headerCount: Math.max(0, s.headerCount - 1) })),
}));
