// ─────────────────────────────────────────────────────────────────────────────
// Conditions — shared presentation primitives.
//
// Everything here reads from the central theme tokens, so the section renders
// correctly in both skins with identical geometry. No component in this section
// hardcodes a palette value.
//
// Token map (dark → light is handled by globals.css, not here):
//   AMBER = --nura-good   · the "your markers" / flagged colour
//   SAGE  = --nura-sage   · fine signals, step numerals, the CTA
//   ALERT = --nura-alert  · the CHECK FIRST card only
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from "react";
import {
  Zap, Moon, Leaf, Waves, Activity, Shield, Heart, Bug, Droplets,
} from "lucide-react";
import type { ConditionIcon } from "./data";
import { DISCLAIMER } from "./data";

export const TEXT = "var(--nura-text-primary)";
export const TEXT_SEC = "var(--nura-text-secondary)";
export const TEXT_TER = "var(--nura-text-tertiary)";
export const BORDER = "var(--nura-border)";
export const SURFACE = "var(--nura-surface)";
export const SAGE = "var(--nura-sage)";
export const SAGE_RGB = "var(--nura-sage-rgb)";
export const AMBER = "var(--nura-good)";
export const AMBER_RGB = "var(--nura-good-rgb)";
export const ALERT = "var(--nura-alert)";
export const ALERT_RGB = "var(--nura-alert-rgb)";
export const SANS = "var(--font-inter), system-ui, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
export const SERIF = "'DM Serif Display', Georgia, serif";
export const CARD_SHADOW = "var(--nura-card-lift)";

const ICONS: Record<ConditionIcon, typeof Zap> = {
  zap: Zap,
  moon: Moon,
  leaf: Leaf,
  waves: Waves,
  activity: Activity,
  shield: Shield,
  heart: Heart,
  bug: Bug,
  droplets: Droplets,
};

export function ConditionIconChip({ icon, size = 36 }: { icon: ConditionIcon; size?: number }) {
  const Glyph = ICONS[icon];
  return (
    <span
      aria-hidden
      style={{
        flex: "0 0 auto", width: size, height: size, borderRadius: 10,
        background: `rgba(${SAGE_RGB}, 0.13)`,
        border: `1px solid rgba(${SAGE_RGB}, 0.26)`,
        color: SAGE,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Glyph size={Math.round(size * 0.47)} strokeWidth={1.7} />
    </span>
  );
}

/**
 * The only markup the content layer is allowed: `**bold**`.
 * Anything else is rendered literally, so authored copy can never inject markup.
 */
export function RichText({ text, strongColor = TEXT }: { text: string; strongColor?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={i} style={{ color: strongColor, fontWeight: 500 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

/** Small uppercase label with a hairline running out to the right. */
export function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: "1.8px", textTransform: "uppercase",
      color: TEXT_TER, display: "flex", alignItems: "center", gap: 8, margin: "0 0 11px",
    }}>
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10.5, letterSpacing: "2.4px", textTransform: "uppercase",
      color: "var(--nura-accent-label)", marginBottom: 11,
    }}>
      {children}
    </div>
  );
}

/**
 * Sample-data banner — 1:1 with the Nutrition page's, because it is the same
 * sample panel. Shown whenever the user has no bloodwork on file.
 */
export function SampleBanner({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9, padding: "10px 14px",
      borderRadius: 12, background: `rgba(${AMBER_RGB}, 0.08)`,
      border: `0.5px solid rgba(${AMBER_RGB}, 0.25)`, marginBottom: 20, ...style,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, lineHeight: 1.4 }}>
        <strong style={{ color: TEXT, fontWeight: 600 }}>Sample data</strong>
        {" "}— add your bloodwork to match these protocols to you.
      </span>
    </div>
  );
}

/** The legal footer. Present on every screen in this section, without exception. */
export function Disclaimer({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      marginTop: 26, paddingTop: 14, borderTop: `1px solid ${BORDER}`,
      fontSize: 11, color: TEXT_TER, lineHeight: 1.6, textAlign: "center", ...style,
    }}>
      {DISCLAIMER}
    </div>
  );
}
