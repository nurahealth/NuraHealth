import { create } from "zustand";

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "nura-theme";

/** Dark is the default on both server and client. See `hydrate()` below. */
const DEFAULT_THEME: Theme = "dark";

/** Browser chrome (PWA status bar / mobile URL bar). Mirrors --nura-bg. */
const CHROME_COLOR: Record<Theme, string> = {
  dark: "#0d0d0e",
  light: "#faf9f6",
};

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

/**
 * Write the theme to the DOM.
 *
 * This runs SYNCHRONOUSLY inside the store actions, deliberately, rather than
 * from an effect in a provider. Components that resolve tokens by reading
 * getComputedStyle (charts and rings — see lib/themeTokens.ts) do so during
 * render. If the attribute were written in an effect, that render would happen
 * first and read the *outgoing* theme, then never re-run — which showed up as a
 * Health Score ring stuck on dark colours after toggling to light.
 *
 * Setting the attribute before `set()` means the DOM is already correct by the
 * time React re-renders any subscriber.
 */
function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", CHROME_COLOR[theme]);
}

interface ThemeState {
  theme: Theme;
  /** False until `hydrate()` has run. */
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
  // different markup on the server than on the client.
  //
  // Instead: start deterministically at DEFAULT_THEME everywhere, then adopt
  // the stored value in an effect via hydrate(). No flash of the wrong colour
  // occurs because the inline script in app/layout.tsx has already painted the
  // correct theme via the data-theme attribute.
  theme: DEFAULT_THEME,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const theme = readStoredTheme();
    applyTheme(theme);
    set({ theme, hydrated: true });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    writeStorage(next);
    applyTheme(next);
    set({ theme: next });
  },

  setTheme: (theme) => {
    writeStorage(theme);
    applyTheme(theme);
    set({ theme });
  },
}));
