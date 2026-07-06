"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";

// Slim, dismissible "DRAFT PREVIEW" banner shown only on admin draft previews so
// it's always obvious the recipe is unpublished. Amber accent (design system).
const AMBER = "#d3a253";
const AMBER_RGB = "211,162,83";
const SANS = "var(--font-inter), system-ui, sans-serif";

export default function DraftPreviewBanner() {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px 9px 14px", borderRadius: 12, background: `rgba(${AMBER_RGB},0.10)`, border: `0.5px solid rgba(${AMBER_RGB},0.35)` }}>
      <Eye size={14} color={AMBER} style={{ flexShrink: 0 }} />
      <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: AMBER, flexShrink: 0 }}>Draft preview</span>
      <span style={{ fontFamily: SANS, fontSize: 12.5, color: "var(--nura-text-secondary)", lineHeight: 1.4, minWidth: 0 }}>
        Unpublished — visible only to you as admin.
      </span>
      <button
        onClick={() => setShow(false)}
        aria-label="Dismiss draft preview banner"
        style={{ marginLeft: "auto", flexShrink: 0, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: AMBER }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
