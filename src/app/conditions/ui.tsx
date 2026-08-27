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
//   TINT  = --nura-bg-tint-rgb · the neutral low-opacity tint, cream in dark
//                               and ink in light — used for mono dose chips
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment } from "react";
import {
  Zap, Moon, Leaf, Waves, Activity, Shield, Heart, Bug, Droplets, Brain, Bone,
  Flame, Wind, Scale, Sparkles, Thermometer, Sun, Footprints, Hand, Salad,
  Pill, TestTube, Smile, Flower2, Droplet, Gauge, Bed, Wheat, WheatOff, Stethoscope,
  Snowflake, Wine, Dumbbell, Venus, Mars, Sprout, Layers, Microscope, Bubbles,
  Target, PersonStanding, Bandage, Ribbon, EyeOff,
} from "lucide-react";
import type { ConditionIcon, SkipTheHype as SkipTheHypeData } from "./types";
import { DISCLAIMER } from "./types";

// ── Colour ───────────────────────────────────────────────────────────────────
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
export const TINT_RGB = "var(--nura-bg-tint-rgb)";
export const SANS = "var(--font-inter), system-ui, sans-serif";
export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
export const SERIF = "'DM Serif Display', Georgia, serif";
export const CARD_SHADOW = "var(--nura-card-lift)";

// ── Space ────────────────────────────────────────────────────────────────────
// One scale for the whole section. The section reads as calm because these six
// values are the ONLY vertical distances in it — a screen that invents a 27 is
// a screen that will drift. Names are jobs, not sizes.
export const SP = {
  /** Inside a card, between a label and its body. */
  tight: 8,
  /** Between sibling cards in a stack. */
  stack: 12,
  /** A label to the block it introduces. */
  label: 16,
  /** Between blocks inside one section. */
  block: 28,
  /** Between one section and the next. */
  section: 40,
  /** Under the page's title block, before the first control. */
  header: 36,
} as const;

/** Card padding and radius, shared by every card in the section. */
export const CARD = {
  padding: "16px 17px",
  radius: 15,
} as const;

// ── Icons ────────────────────────────────────────────────────────────────────
const ICONS: Record<ConditionIcon, typeof Zap> = {
  zap: Zap, moon: Moon, leaf: Leaf, waves: Waves, activity: Activity,
  shield: Shield, heart: Heart, bug: Bug, droplets: Droplets, brain: Brain,
  bone: Bone, flame: Flame, wind: Wind, scale: Scale, sparkles: Sparkles,
  thermometer: Thermometer, sun: Sun, footprints: Footprints, hand: Hand,
  salad: Salad, pill: Pill, testTube: TestTube, smile: Smile, flower: Flower2,
  droplet: Droplet, gauge: Gauge, bed: Bed, wheat: Wheat, wheatOff: WheatOff,
  stethoscope: Stethoscope, snowflake: Snowflake, wine: Wine,
  dumbbell: Dumbbell, venus: Venus, mars: Mars, sprout: Sprout, layers: Layers,
  microscope: Microscope, bubbles: Bubbles, target: Target,
  personStanding: PersonStanding, bandage: Bandage, ribbon: Ribbon,
};

export function ConditionIconChip({ icon, size = 38 }: { icon: ConditionIcon; size?: number }) {
  const Glyph = ICONS[icon];
  return (
    <span
      aria-hidden
      style={{
        flex: "0 0 auto", width: size, height: size, borderRadius: 11,
        background: `rgba(${SAGE_RGB}, 0.13)`,
        border: `1px solid rgba(${SAGE_RGB}, 0.26)`,
        color: SAGE,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <Glyph size={Math.round(size * 0.45)} strokeWidth={1.7} />
    </span>
  );
}

// ── Rich text ────────────────────────────────────────────────────────────────
// Two markers, neither nestable:
//   **bold**  → emphasis, in ink
//   `1–2 g`   → a mono dose chip
// Anything else renders literally, so authored copy can never inject markup.
const RICH = /(\*\*[^*]+\*\*|`[^`]+`)/g;
const MONO_ONLY = /(`[^`]+`)/g;

/**
 * The dose chip. Numbers are the thing people come back to a protocol for, so
 * they get their own typography rather than being bold prose.
 */
function DoseChip({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      fontFamily: MONO, fontSize: "0.88em", fontWeight: 500,
      color: TEXT, whiteSpace: "nowrap",
      background: `rgba(${TINT_RGB}, 0.07)`,
      border: `1px solid rgba(${TINT_RGB}, 0.10)`,
      borderRadius: 5, padding: "1.5px 5px", margin: "0 1px",
      fontVariantNumeric: "tabular-nums",
    }}>
      {children}
    </code>
  );
}

/** Doses nested inside an emphasised span — "**within the first `24 hours`**". */
function withDoses(text: string, keyPrefix: string) {
  return text.split(MONO_ONLY).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <DoseChip key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</DoseChip>
    ) : (
      <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>
    )
  );
}

export function RichText({ text, strongColor = TEXT }: { text: string; strongColor?: string }) {
  return (
    <>
      {text.split(RICH).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={i} style={{ color: strongColor, fontWeight: 500 }}>
              {withDoses(part.slice(2, -2), String(i))}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return <DoseChip key={i}>{part.slice(1, -1)}</DoseChip>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/**
 * Body copy. Splits on a blank line so a condition intro is a run of short
 * paragraphs rather than one wall — two or three sentences each is the rule
 * the content layer is written to.
 */
export function Prose({
  text, size = 14.5, color = TEXT_SEC, style,
}: {
  text: string; size?: number; color?: string; style?: React.CSSProperties;
}) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div style={style}>
      {paras.map((p, i) => (
        <p key={i} style={{
          fontSize: size, lineHeight: 1.75, color,
          margin: i === paras.length - 1 ? 0 : "0 0 12px",
        }}>
          <RichText text={p} />
        </p>
      ))}
    </div>
  );
}

// ── Chrome ───────────────────────────────────────────────────────────────────
/** Small uppercase label with a hairline running out to the right. */
export function GroupLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: "1.9px", textTransform: "uppercase",
      color: TEXT_TER, display: "flex", alignItems: "center", gap: 10,
      margin: `0 0 ${SP.label}px`, ...style,
    }}>
      <span>{children}</span>
      <span style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

/** A category header inside the full list. Quieter than a GroupLabel. */
export function CategoryLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.01em",
      color: TEXT_SEC, margin: `0 0 ${SP.stack}px`, paddingLeft: 2,
    }}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: 10.5, letterSpacing: "2.4px", textTransform: "uppercase",
      color: "var(--nura-accent-label)", marginBottom: 13,
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
      display: "flex", alignItems: "center", gap: 10, padding: "11px 15px",
      borderRadius: 12, background: `rgba(${AMBER_RGB}, 0.08)`,
      border: `0.5px solid rgba(${AMBER_RGB}, 0.25)`, marginBottom: SP.label, ...style,
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER, flexShrink: 0 }} />
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: TEXT_SEC, lineHeight: 1.45 }}>
        <strong style={{ color: TEXT, fontWeight: 600 }}>Sample data</strong>
        {" "}— add your bloodwork to match these protocols to you.
      </span>
    </div>
  );
}

/**
 * The Consumer-Reports card. Deliberately styled as a quiet aside rather than a
 * warning: it isn't a danger, it's the section refusing to sell you something.
 */
export function SkipTheHypeCard({ data, style }: { data: SkipTheHypeData; style?: React.CSSProperties }) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      background: `rgba(${TINT_RGB}, 0.03)`,
      border: `1px dashed rgba(${TINT_RGB}, 0.18)`,
      borderRadius: CARD.radius, padding: CARD.padding, ...style,
    }}>
      <EyeOff size={16} strokeWidth={1.7} style={{ color: TEXT_TER, flex: "0 0 auto", marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: MONO, fontSize: 9.5, letterSpacing: "1.7px",
          textTransform: "uppercase", color: TEXT_TER, marginBottom: SP.tight,
        }}>
          Skip the hype
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, lineHeight: 1.45, marginBottom: 5 }}>
          {data.remedy}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: TEXT_SEC }}>
          <RichText text={data.why} />
        </div>
      </div>
    </div>
  );
}

/** The legal footer. Present on every screen in this section, without exception. */
export function Disclaimer({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      marginTop: SP.section, paddingTop: 18, borderTop: `1px solid ${BORDER}`,
      fontSize: 11, color: TEXT_TER, lineHeight: 1.65, textAlign: "center", ...style,
    }}>
      {DISCLAIMER}
    </div>
  );
}
