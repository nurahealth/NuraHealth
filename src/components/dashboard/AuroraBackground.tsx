// Aurora glow + fine grain overlay for metric detail pages.
//
// Renders two fixed, non-interactive layers:
//   • the aurora — teal/sage radial gradients pinned to the top of the screen
//   • the grain — a subtle fractal-noise texture blended over everything
//
// Place inside a `position: relative` (or full-bleed) container. The aurora sits
// behind content (z-index 0); the grain floats above it (z-index 9). Give your
// page content `position: relative; z-index: 1` so it renders between them.

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Default teal/sage aurora (used by the Sleep page). Other metrics can pass a
// different `gradient` (e.g. amber for Movement).
const TEAL_AURORA =
  "radial-gradient(80% 60% at 50% -6%, rgba(45,158,131,0.34), transparent 60%)," +
  "radial-gradient(60% 50% at 88% 6%, rgba(155,176,165,0.16), transparent 60%)," +
  "radial-gradient(70% 40% at 8% 14%, rgba(93,204,174,0.12), transparent 60%)";

export default function AuroraBackground({ gradient = TEAL_AURORA }: { gradient?: string }) {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute", inset: "0 0 auto 0", height: 520,
          pointerEvents: "none", zIndex: 0,
          background: gradient,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "fixed", inset: 0,
          pointerEvents: "none", zIndex: 9,
          opacity: 0.05, mixBlendMode: "overlay",
          backgroundImage: GRAIN,
        }}
      />
    </>
  );
}
