"use client";

import NuraHeader from "./NuraHeader";
import NuraPlexus from "./NuraPlexus";

const BG = "#0d0d0e";
const TEXT = "#f0ebde";
const SANS = "'Inter', system-ui, sans-serif";

interface Props {
  children: React.ReactNode;
  rightAction?: React.ReactNode;
  title?: string;
  plexusOpacity?: number;
  maxWidth?: number;
}

export default function NuraPageShell({
  children,
  rightAction,
  title,
  plexusOpacity = 0.3,
  maxWidth = 720,
}: Props) {
  return (
    <div style={{
      minHeight: "100dvh", background: BG, color: TEXT,
      fontFamily: SANS, position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; background: ${BG}; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <NuraPlexus opacity={plexusOpacity} />
      <NuraHeader rightAction={rightAction} title={title} />

      <main style={{
        flex: 1, position: "relative", zIndex: 2,
        overflowY: "auto",
      }}>
        <div style={{
          maxWidth, margin: "0 auto", width: "100%",
          padding: "20px 18px 80px",
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
