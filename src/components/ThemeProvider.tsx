"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { NURA_DARK, NURA_LIGHT, type NuraPalette } from "@/lib/theme";

type Mode = "dark" | "light";

interface ThemeContextValue {
  mode: Mode;
  colors: NuraPalette;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  colors: NURA_DARK,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("nura-theme");
    if (stored === "light" || stored === "dark") setMode(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("nura-theme", mode);
    document.body.style.background = mode === "dark" ? NURA_DARK.bg : NURA_LIGHT.bg;
  }, [mode, mounted]);

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  const colors: NuraPalette = mode === "dark" ? NURA_DARK : NURA_LIGHT;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
