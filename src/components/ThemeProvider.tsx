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

function readStoredMode(): Mode {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("nura-theme");
  return stored === "light" || stored === "dark" ? stored : "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(readStoredMode);

  useEffect(() => {
    localStorage.setItem("nura-theme", mode);
    document.body.style.background = mode === "dark" ? NURA_DARK.bg : NURA_LIGHT.bg;
  }, [mode]);

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
