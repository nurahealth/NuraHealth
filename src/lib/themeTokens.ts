"use client";

import { useEffect, useState } from "react";
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
 *   const { sage, teal } = useThemeTokens({
 *     sage: ["--nura-sage", "#9bb0a5"],
 *     teal: ["--nura-teal", "#5dccae"],
 *   });
 *
 * Hydration contract: fallbacks MUST be the dark-theme values. The server and
 * the first client render both emit the fallback, so the markup matches; the
 * resolved values land in an effect on the first commit. Never pass a
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

/**
 * Resolve a set of colour tokens to concrete values, re-resolving whenever the
 * theme changes. `spec` is read once on mount — define it as a module-level
 * constant rather than inline, so its identity is stable.
 */
export function useThemeTokens<T extends TokenSpec>(spec: T): Resolved<T> {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);

  // Start from the dark fallbacks so SSR and the first client render agree.
  const [values, setValues] = useState<Resolved<T>>(() => fallbacks(spec));

  useEffect(() => {
    setValues(resolve(spec));
    // `spec` is intentionally omitted: callers pass a module-level constant, and
    // re-resolving is driven by the theme, not by object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, hydrated]);

  return values;
}

/** Single-token convenience wrapper around {@link useThemeTokens}. */
export function useThemeToken(name: string, darkFallback: string): string {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const [value, setValue] = useState(darkFallback);

  useEffect(() => {
    setValue(readToken(name, darkFallback));
  }, [name, darkFallback, theme, hydrated]);

  return value;
}
