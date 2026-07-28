"use client";

import { useEffect } from "react";
import { NURA_DARK, NURA_LIGHT, type NuraPalette } from "@/lib/theme";
import { useThemeStore, type Theme } from "@/lib/themeStore";

/** Keeps the browser chrome (PWA status bar / mobile URL bar) in step with the
 *  active theme. Values mirror --nura-bg in globals.css. */
const CHROME_COLOR: Record<Theme, string> = {
  dark: "#0d0d0e",
  light: "#faf9f6",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  // Adopt the persisted theme once, on the client, after the first commit.
  useEffect(() => { hydrateTheme(); }, [hydrateTheme]);

  useEffect(() => {
    // Until the store has hydrated, `theme` is still the deterministic SSR
    // default — writing it to the DOM here would stomp the correct value the
    // pre-paint inline script already set, producing a visible flash.
    if (!hydrated) return;

    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");

    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", CHROME_COLOR[theme]);
  }, [theme, hydrated]);

  return <>{children}</>;
}

/**
 * DEPRECATED back-compat hook for the legacy `{ mode, colors, toggle }` shape.
 *
 * Its `colors` come from `@/lib/theme` — a second, unrelated palette (mint on
 * navy) that renders nowhere: its only consumers (BottomNav, Topbar,
 * UpgradeButton, Logo) are dead code with zero imports. Kept purely so those
 * files still typecheck; scheduled for deletion with them.
 *
 * Do not use. Read `useThemeStore` for the mode and CSS `--nura-*` tokens for
 * colour.
 */
interface LegacyThemeContextValue {
  mode: Theme;
  colors: NuraPalette;
  toggle: () => void;
}
export function useTheme(): LegacyThemeContextValue {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggleTheme);
  return {
    mode: theme,
    colors: theme === "dark" ? NURA_DARK : NURA_LIGHT,
    toggle,
  };
}
