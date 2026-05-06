export const NURA_DARK = {
  // backgrounds
  bg: "#000814",
  bgPanel: "rgba(94,234,212,0.04)",
  bgPanelGradient: "linear-gradient(180deg,rgba(94,234,212,0.06),rgba(94,234,212,0.01))",
  bgInsight: "linear-gradient(135deg,rgba(94,234,212,0.06),rgba(0,8,20,0.8))",
  bgSidebar: "#00060f",
  bgTopbar: "rgba(0,8,20,0.85)",
  bgBottomNav: "rgba(0,8,20,0.95)",
  bgInput: "rgba(94,234,212,0.04)",
  // mint accent
  mint: "#5EEAD4",
  mintDeep: "#2DD4BF",
  mintBright: "#7FF5E5",
  mintGlow: "rgba(94,234,212,0.4)",
  mintBorder: "rgba(94,234,212,0.18)",
  mintBorderStrong: "rgba(94,234,212,0.4)",
  mintBorderFaint: "rgba(94,234,212,0.08)",
  mintBgSubtle: "rgba(94,234,212,0.04)",
  mintBgMedium: "rgba(94,234,212,0.08)",
  mintBg10: "rgba(94,234,212,0.10)",
  mintBg08: "rgba(94,234,212,0.08)",
  mintBg05: "rgba(94,234,212,0.05)",
  // semantic
  warn: "#FFB400",
  warnBg: "rgba(255,180,0,0.08)",
  warnBorder: "rgba(255,180,0,0.4)",
  danger: "#FF4C5C",
  dangerBg: "rgba(255,76,92,0.08)",
  dangerBorder: "rgba(255,76,92,0.4)",
  // text
  textOnAccent: "#000814",
  text: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  textDim: "rgba(255,255,255,0.5)",
  textFaint: "rgba(255,255,255,0.4)",
  textGhost: "rgba(255,255,255,0.3)",
  // borders
  border: "rgba(94,234,212,0.15)",
  borderFaint: "rgba(94,234,212,0.08)",
  borderDivider: "rgba(94,234,212,0.06)",
  overlay: "rgba(0,0,0,0.6)",
  // shadows
  glow: "0 0 20px rgba(94,234,212,0.4)",
  glowSoft: "0 0 12px rgba(94,234,212,0.2)",
  glowStrong: "0 0 30px rgba(94,234,212,0.6)",
} as const;

export const NURA_LIGHT = {
  // backgrounds
  bg: "#FAFAF7",
  bgPanel: "rgba(0,0,0,0.02)",
  bgPanelGradient: "linear-gradient(180deg,rgba(0,0,0,0.025),rgba(0,0,0,0.005))",
  bgInsight: "linear-gradient(135deg,rgba(0,0,0,0.05),rgba(0,0,0,0.01))",
  bgSidebar: "#FAFAF7",
  bgTopbar: "linear-gradient(180deg,rgba(250,250,247,0.98),rgba(250,250,247,0.85))",
  bgBottomNav: "rgba(250,250,247,0.95)",
  bgInput: "rgba(0,0,0,0.03)",
  // charcoal accent
  mint: "#2A2A2A",
  mintDeep: "#1A1A1A",
  mintBright: "#3A3A3A",
  mintGlow: "rgba(42,42,42,0.25)",
  mintBorder: "rgba(42,42,42,0.4)",
  mintBorderStrong: "rgba(42,42,42,0.6)",
  mintBorderFaint: "rgba(42,42,42,0.15)",
  mintBgSubtle: "rgba(0,0,0,0.03)",
  mintBgMedium: "rgba(0,0,0,0.05)",
  mintBg10: "rgba(42,42,42,0.08)",
  mintBg08: "rgba(42,42,42,0.06)",
  mintBg05: "rgba(42,42,42,0.04)",
  // semantic
  warn: "#B8860B",
  warnBg: "rgba(184,134,11,0.08)",
  warnBorder: "rgba(184,134,11,0.4)",
  danger: "#C95444",
  dangerBg: "rgba(201,84,68,0.08)",
  dangerBorder: "rgba(201,84,68,0.4)",
  // text
  textOnAccent: "#FFFFFF",
  text: "#000000",
  textMuted: "rgba(0,0,0,0.75)",
  textDim: "rgba(0,0,0,0.55)",
  textFaint: "rgba(0,0,0,0.4)",
  textGhost: "rgba(0,0,0,0.3)",
  // borders
  border: "rgba(0,0,0,0.12)",
  borderFaint: "rgba(0,0,0,0.06)",
  borderDivider: "rgba(0,0,0,0.05)",
  overlay: "rgba(0,0,0,0.4)",
  // shadows
  glow: "0 0 20px rgba(42,42,42,0.18)",
  glowSoft: "0 0 12px rgba(42,42,42,0.1)",
  glowStrong: "0 0 30px rgba(42,42,42,0.25)",
} as const;

export type NuraPalette = { readonly [K in keyof typeof NURA_DARK]: string };

export const FONTS = {
  serif: "'DM Serif Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;
