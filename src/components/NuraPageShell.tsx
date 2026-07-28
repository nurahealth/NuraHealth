"use client";

import type { CSSProperties } from "react";
import NuraHeader from "./NuraHeader";
import NuraPlexus from "./NuraPlexus";

const BG = "var(--nura-bg)";
const TEXT = "var(--nura-text-primary)";
const SANS = "var(--font-inter), system-ui, sans-serif";

interface Props {
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  title?: string;
  plexusOpacity?: number;
  /** Content width below lg. This is the existing mobile value — don't change it. */
  maxWidth?: number;
  /**
   * Content width at lg and up. Defaults to `maxWidth`, i.e. a screen that
   * hasn't opted in keeps its phone width and simply centres — never stretched.
   * Use ~1200 for card-grid screens and ~720 for reading/detail screens.
   */
  desktopMaxWidth?: number;
}

export default function NuraPageShell({
  children,
  rightAction,
  title,
  plexusOpacity = 0.3,
  maxWidth = 720,
  desktopMaxWidth,
}: Props) {
  // Width is switched in CSS rather than JS so there is no hydration branch and
  // no flash: the element carries both values and a media query picks one.
  const widthVars = {
    "--shell-max": `${maxWidth}px`,
    "--shell-max-lg": `${desktopMaxWidth ?? maxWidth}px`,
  } as CSSProperties;

  return (
    <div style={{
      minHeight: "100dvh", background: BG, color: TEXT,
      fontFamily: SANS, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { background: ${BG}; }
        ::-webkit-scrollbar { width: 0; }
        .nura-shell-content {
          max-width: var(--shell-max);
          margin: 0 auto;
          width: 100%;
          padding: 20px 18px 80px;
        }
        @media (min-width: 1024px) {
          .nura-shell-content {
            max-width: var(--shell-max-lg);
            padding: 28px 40px 96px;
          }
        }
      `}</style>

      <NuraPlexus opacity={plexusOpacity} />
      <NuraHeader rightAction={rightAction} title={title} />

      <main style={{
        flex: 1, position: "relative", zIndex: 2,
        overflowY: "auto",
      }}>
        <div className="nura-shell-content" style={widthVars}>
          {children}
        </div>
      </main>
    </div>
  );
}
