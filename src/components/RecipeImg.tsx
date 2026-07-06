"use client";

import { useState } from "react";

// Shared recipe photo. Fills its (positioned) parent with object-fit: cover so
// the sage-gradient background shows through as the fallback. On load error it
// removes itself entirely — so a broken URL never shows the browser's
// broken-image box + alt text over the gradient. `focalX`/`focalY` (0–1, default
// centered) drive object-position so the chosen area stays in-frame across crops.
export default function RecipeImg({
  src,
  alt,
  focalX,
  focalY,
  priority = false,
}: {
  src: string;
  alt: string;
  focalX?: number | null;
  focalY?: number | null;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  const fx = Math.round((focalX ?? 0.5) * 100);
  const fy = Math.round((focalY ?? 0.5) * 100);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: `${fx}% ${fy}%`,
        display: "block",
      }}
    />
  );
}
