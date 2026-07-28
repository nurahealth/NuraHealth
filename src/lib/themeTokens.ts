"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useThemeStore } from "@/lib/themeStore";

/**
 * Bridge between the CSS token layer and the components that do colour *maths*.
 *
 * Most components can hand `var(--nura-…)` straight to a style prop and are
 * done. Charts and rings can't: they interpolate ramps, build SVG gradient
 * stops, and paint to canvas, all of which need concrete "#rrggbb" values.
 * Those components used to hardcode hex literals — which is exactly why the
 * dashboard's data-viz never responded to the theme.
 *
 * Usage:
 *   const TOKENS = {
 *     sage: ["--nura-sage", "#9bb0a5"],
 *     teal: ["--nura-teal", "#5dccae"],
 *   } as const;
 *   const { sage, teal } = useThemeTokens(TOKENS);
 *
 * Hydration contract: fallbacks MUST be the dark-theme values. The server and
 * the first client render both emit the fallback, so the markup matches; the
 * resolved values land as soon as the stylesheet is live. Never pass a
 * light-theme value as a fallback.
 */

/** Read a CSS custom property off <html>. Returns `fallback` during SSR. */
export function readToken(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

type TokenSpec = Record<string, readonly [name: string, darkFallback: string]>;
type Resolved<T extends TokenSpec> = { [K in keyof T]: string };

function resolve<T extends TokenSpec>(spec: T): Resolved<T> {
  const out = {} as Resolved<T>;
  for (const key in spec) out[key] = readToken(spec[key][0], spec[key][1]);
  return out;
}

function fallbacks<T extends TokenSpec>(spec: T): Resolved<T> {
  const out = {} as Resolved<T>;
  for (const key in spec) out[key] = spec[key][1];
  return out;
}

/* ───────────────────────────────────────────────────────────────────────────
   "Are the tokens actually readable yet?" — an external store.

   This gate exists because of a real race. A component can hydrate before its
   stylesheet has been applied; getPropertyValue then returns "" for every
   token, readToken hands back the dark fallback, and — because the result was
   memoised — the component keeps painting dark values on a light page forever.
   It is intermittent by nature: it depends on whether the CSS chunk lands
   before or after hydration, so it hides on warm loads and appears on cold
   ones. It surfaced as a washed-out Health Score ring in light mode.

   getServerSnapshot returns false, so this doubles as the hydration guard:
   SSR and the hydration render both see `false` and emit the fallbacks, which
   keeps the markup matching. The probe then flips it once the CSS is live.
   ─────────────────────────────────────────────────────────────────────── */

const SENTINEL = "--nura-bg"; // always defined on :root
let tokensReadable = false;
const readyListeners = new Set<() => void>();

function probeTokens() {
  if (tokensReadable || typeof document === "undefined") return;
  if (getComputedStyle(document.documentElement).getPropertyValue(SENTINEL).trim()) {
    tokensReadable = true;
    readyListeners.forEach((l) => l());
    return;
  }
  requestAnimationFrame(probeTokens);
}

function subscribeReadable(onChange: () => void) {
  readyListeners.add(onChange);
  if (!tokensReadable) probeTokens();
  return () => { readyListeners.delete(onChange); };
}

function useTokensReadable(): boolean {
  return useSyncExternalStore(subscribeReadable, () => tokensReadable, () => false);
}

/**
 * Resolve a set of colour tokens to concrete values, re-resolving whenever the
 * theme changes. Define `spec` as a module-level constant so its identity is
 * stable across renders.
 */
export function useThemeTokens<T extends TokenSpec>(spec: T): Resolved<T> {
  const theme = useThemeStore((s) => s.theme);
  const storeHydrated = useThemeStore((s) => s.hydrated);
  const readable = useTokensReadable();

  return useMemo(
    () => (readable ? resolve(spec) : fallbacks(spec)),
    // `spec` is intentionally omitted: callers pass a module-level constant, and
    // re-resolution is driven by the theme and by CSS readiness, not by object
    // identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readable, theme, storeHydrated],
  );
}

/** Single-token convenience wrapper around {@link useThemeTokens}. */
export function useThemeToken(name: string, darkFallback: string): string {
  const theme = useThemeStore((s) => s.theme);
  const storeHydrated = useThemeStore((s) => s.hydrated);
  const readable = useTokensReadable();

  return useMemo(
    () => (readable ? readToken(name, darkFallback) : darkFallback),
    // `theme`/`storeHydrated` look unused to the linter but are load-bearing:
    // readToken's result depends on the DOM, which the theme drives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readable, theme, storeHydrated, name, darkFallback],
  );
}
