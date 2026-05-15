"use client";

import { useEffect } from "react";
import { NURA_DARK, NURA_LIGHT, type NuraPalette } from "@/lib/theme";
import { useThemeStore, type Theme } from "@/lib/themeStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }, [theme]);

  return <>{children}</>;
}

/**
 * Back-compat hook for legacy components that still expect the
 * { mode, colors, toggle } shape from the original ThemeProvider.
 * New code should use `useThemeStore` directly.
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
