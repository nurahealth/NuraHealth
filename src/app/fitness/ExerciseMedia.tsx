'use client';

import { useState } from 'react';

// One simple renderer for every exercise — the ORIGINAL MoveKit clip, exactly as
// it ships (no matting, keying, tint, or dark/light routing).
//  - default: looping, muted, autoplay <video> for .mp4/.webm (with its poster);
//    <img> for anything else.
//  - thumb: the original static poster (.webp); on load error → sage placeholder.

const PH_SAGE = 'var(--nura-sage)';

// Clean sage line-art placeholder — shown for a thumbnail whose image fails to
// load (e.g. a non-MoveKit exercise whose GIF is gone). Never a broken image.
function ThumbPlaceholder({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: CLIP_BG, ...style }}>
      <svg width="42%" height="42%" viewBox="0 0 24 24" fill="none" stroke={PH_SAGE} strokeWidth="1.3" strokeLinecap="round" style={{ opacity: 0.7, maxWidth: 48, maxHeight: 48 }}>
        <path d="M6.5 6.5 17.5 17.5M3 8l3-3M16 21l3-3M8 3 5 6M21 16l-3 3" />
      </svg>
    </div>
  );
}

export function posterFor(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.includes('/exercise-media/clips/') && /\.mp4$/i.test(src)) {
    return src.replace('/clips/', '/posters/').replace(/\.mp4$/i, '.webp');
  }
  return undefined;
}

// A MoveKit 3D demo ships as a video clip; anything else (e.g. a WorkoutX gif) is not.
export const isVideo = (src: string) => /\.(mp4|webm)(\?|$)/i.test(src);

// The MoveKit clips' own studio backdrop (warm off-white). Used as the media
// element's background so any object-fit:contain letterbox is filled to match
// the clip — no dark/black bars — and the demo card uses the same colour.
export const CLIP_BG = '#dee0d2';

export default function ExerciseMedia({ src, alt, fit = 'cover', thumb = false, onError, style }: {
  src: string;
  alt: string;
  fit?: 'cover' | 'contain';
  thumb?: boolean;
  onError?: () => void;
  style?: React.CSSProperties;
}) {
  // backgroundColor fills any uncovered (letterbox) area with the clip's own
  // backdrop so there are never dark gaps behind the video/poster.
  const base: React.CSSProperties = { width: '100%', height: '100%', objectFit: fit, display: 'block', backgroundColor: CLIP_BG, ...style };

  // Thumb load-failure state — reset during render when src changes (React's
  // recommended pattern) so a recycled row doesn't keep a stale placeholder.
  const [thumbFailed, setThumbFailed] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(src);
  if (src !== thumbSrc) { setThumbSrc(src); setThumbFailed(false); }

  // Lists → original static poster; a broken/missing image falls back to the
  // clean sage placeholder instead of a broken-image glyph.
  if (thumb) {
    if (thumbFailed) return <ThumbPlaceholder style={style} />;
    const posterSrc = posterFor(src) ?? src;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={posterSrc} alt={alt} onError={() => { setThumbFailed(true); onError?.(); }} style={base} />;
  }

  if (isVideo(src)) {
    return (
      <video
        src={src}
        poster={posterFor(src)}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        onError={onError}
        style={base}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={onError} style={base} />;
}
