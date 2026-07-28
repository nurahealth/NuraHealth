"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/themeStore";

/**
 * Adopts the persisted theme on the client, once.
 *
 * The DOM write itself lives in the store (see applyTheme in lib/themeStore.ts)
 * rather than in an effect here, so it lands synchronously with the state
 * change. Components that resolve tokens by reading getComputedStyle do so
 * during render, and need the data-theme attribute to already be correct when
 * they re-render — an effect would run too late and leave them a frame behind,
 * permanently, because their memo deps would not change again.
 *
 * All this provider does is kick off that one-time adoption after hydration.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  useEffect(() => { hydrateTheme(); }, [hydrateTheme]);

  return <>{children}</>;
}
