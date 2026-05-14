import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

// Placeholder dark-mode toggle store (visual only for now)
interface DarkModeState {
  enabled: boolean;
  toggle: () => void;
}
export const useDarkMode = create<DarkModeState>((set) => ({
  enabled: true,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
}));
