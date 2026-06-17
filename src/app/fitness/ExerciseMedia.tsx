'use client';

// One simple renderer for every exercise — the ORIGINAL MoveKit clip, exactly as
// it ships (no matting, keying, tint, or dark/light routing).
//  - default: looping, muted, autoplay <video> for .mp4/.webm (with its poster);
//    <img> for anything else.
//  - thumb: the original static poster (.webp).

export function posterFor(src: string | null | undefined): string | undefined {
  if (!src) return undefined;
  if (src.includes('/exercise-media/clips/') && /\.mp4$/i.test(src)) {
    return src.replace('/clips/', '/posters/').replace(/\.mp4$/i, '.webp');
  }
  return undefined;
}

const isVideo = (src: string) => /\.(mp4|webm)(\?|$)/i.test(src);

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

  // Lists → original static poster.
  if (thumb) {
    const posterSrc = posterFor(src) ?? src;
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={posterSrc} alt={alt} onError={onError} style={base} />;
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
