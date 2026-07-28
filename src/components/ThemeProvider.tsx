"use client";

import { useEffect } from "react";
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
