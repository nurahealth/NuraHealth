"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Hydration-safe media query.
 *
 * The server cannot know the viewport, so getServerSnapshot returns `false`.
 * React uses that for both the SSR pass and the hydration render, then switches
 * to the live value — so the markup always matches on hydration and the real
 * answer lands on the first post-hydration render.
 *
 * Consequence to design around: every consumer must treat `false` as "mobile",
 * i.e. mobile is the default and desktop is the enhancement. That matches the
 * brief — below lg is exactly the existing mobile experience.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => (typeof window === "undefined" ? false : window.matchMedia(query).matches),
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** The single desktop breakpoint. Keep in step with --nura-lg in globals.css. */
export const LG = "(min-width: 1024px)";

/** True once the viewport is at or above the desktop breakpoint. */
export function useIsDesktop(): boolean {
  return useMediaQuery(LG);
}
