import { create } from "zustand";

export type Theme = "dark" | "light";

const STORAGE_KEY = "nura-theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function writeStorage(theme: Theme) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readInitial(),
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
