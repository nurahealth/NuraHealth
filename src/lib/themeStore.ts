import { create } from "zustand";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "nura-theme";

/** Dark is the default on both server and client. See `hydrate()` below. */
const DEFAULT_THEME: Theme = "dark";

export function readStoredTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

function writeStorage(theme: Theme) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch {}
}

interface ThemeState {
  theme: Theme;
  /** False until `hydrate()` has run. Guards effects that would otherwise
   *  fight the pre-paint inline script during the first client render. */
  hydrated: boolean;
  hydrate: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  // IMPORTANT: this must NOT read localStorage.
  //
  // The store module is evaluated once on the server (during SSR) and again on
  // the client (during hydration). Reading localStorage here made those two
  // evaluations disagree — the server produced "dark", the browser produced
  // "light" — so every component that renders off `theme` (NuraPlexus, the
  // home-screen sun/moon glyph, ChatPlexus, the onboarding kit, ...) emitted
  // different markup on the server than on the client. That is the real
  // hydration mismatch; the data-theme attribute was only the visible symptom.
  //
  // Instead: start deterministically at DEFAULT_THEME everywhere, then adopt
  // the stored value in an effect via hydrate(). No flash of the wrong colour
  // occurs because the inline script in app/layout.tsx has already painted the
  // correct theme via the data-theme attribute; only JS-derived colours settle
  // on the first commit.
  theme: DEFAULT_THEME,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ theme: readStoredTheme(), hydrated: true });
  },

  toggleTheme: () => set((s) => {
    const next: Theme = s.theme === "dark" ? "light" : "dark";
    writeStorage(next);
    return { theme: next };
  }),

  setTheme: (theme) => {
    writeStorage(theme);
    set({ theme });
  },
}));
