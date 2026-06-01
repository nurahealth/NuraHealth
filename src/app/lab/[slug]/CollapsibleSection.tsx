"use client";

// Client-side accordion wrapper for the measurement sections on the product
// detail page. The server renders the section's cards as children; this just
// adds the tappable heading + chevron and animates open/closed.

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const TEXT = "var(--nura-text-primary)";
const TEXT_TER = "var(--nura-text-tertiary)";
const SERIF = "'DM Serif Display', Georgia, serif";

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%", minHeight: 48,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "8px 0", background: "none", border: "none", cursor: "pointer",
          color: "inherit", textAlign: "left",
        }}
      >
        <h2 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 500, color: TEXT, margin: 0, letterSpacing: "-0.2px" }}>
          {title}
        </h2>
        <ChevronDown
          size={20}
          color={TEXT_TER}
          style={{
            flexShrink: 0,
            transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>

      {/* grid-rows 1fr↔0fr gives a smooth height animation without measuring */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ paddingTop: 12 }}>{children}</div>
        </div>
      </div>
    </section>
  );
}
