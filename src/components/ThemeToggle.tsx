"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/lib/themeStore";
import { useThemeToggleHosts } from "@/lib/themeToggleHosts";

const SANS = "var(--font-inter), system-ui, sans-serif";

/** Shown in dark mode — tapping it goes to light. */
const SunIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

/** Shown in light mode — tapping it goes to dark. */
const MoonIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
  </svg>
);

type Variant =
  /** Icon button for a screen's own header. Registers, suppressing the fallback. */
  | "header"
  /** Full-width labelled row, for the sidebar footer. */
  | "row"
  /** Fixed top-right fallback for screens with no header. */
  | "floating";

export default function ThemeToggle({ variant = "header", size = 38 }: { variant?: Variant; size?: number }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const registerHeader = useThemeToggleHosts((s) => s.registerHeader);
  const unregisterHeader = useThemeToggleHosts((s) => s.unregisterHeader);
  const [hov, setHov] = useState(false);

  useEffect(() => {
    if (variant !== "header") return;
    registerHeader();
    return unregisterHeader;
  }, [variant, registerHeader, unregisterHeader]);

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";
  const Icon = isDark ? SunIcon : MoonIcon;

  // The store writes localStorage; ThemeProvider mirrors it onto <html
  // data-theme> in an effect, so the swap lands on the next commit — instant,
  // and with no reload.
  const common = {
    onClick: toggleTheme,
    onMouseEnter: () => setHov(true),
    onMouseLeave: () => setHov(false),
    "aria-label": label,
    title: isDark ? "Light mode" : "Dark mode",
  };

  if (variant === "row") {
    return (
      <button
        {...common}
        style={{
          display: "flex", alignItems: "center", gap: 11,
          width: "100%", padding: "8px 4px", borderRadius: 8,
          background: hov ? "var(--nura-surface)" : "transparent",
          border: "none", color: "var(--nura-text-primary)",
          fontFamily: SANS, fontSize: 13, cursor: "pointer", textAlign: "left",
          transition: "background 160ms",
        }}
      >
        <span style={{ color: hov ? "var(--nura-sage)" : "var(--nura-text-secondary)", display: "flex", lineHeight: 0, flexShrink: 0 }}>
          <Icon />
        </span>
        <span style={{ flex: 1 }}>{isDark ? "Light mode" : "Dark mode"}</span>
      </button>
    );
  }

  const floating = variant === "floating";

  return (
    <button
      {...common}
      style={{
        ...(floating
          ? {
              position: "fixed",
              top: "max(env(safe-area-inset-top), 12px)",
              right: 16,
              zIndex: 45,
              // Elevated + blurred so it stays legible over imagery, gradients
              // and the aurora backdrops.
              background: "var(--nura-elevated)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "var(--nura-card-shadow-soft)",
            }
          : { background: hov ? "var(--nura-surface-elevated)" : "var(--nura-surface)" }),
        width: size, height: size, borderRadius: 11,
        border: "0.5px solid var(--nura-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
        color: hov ? "var(--nura-sage)" : "var(--nura-text-secondary)",
        transition: "background 160ms, color 160ms",
      }}
    >
      <Icon size={Math.round(size * 0.45)} />
    </button>
  );
}

/**
 * Rendered once in the app shell. Shows a floating toggle only on screens that
 * don't host one in their own header, so every page has exactly one.
 */
export function GlobalThemeToggle() {
  const headerCount = useThemeToggleHosts((s) => s.headerCount);
  if (headerCount > 0) return null;
  return <ThemeToggle variant="floating" />;
}
