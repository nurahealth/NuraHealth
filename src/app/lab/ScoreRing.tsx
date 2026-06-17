// Shared score ring — used by the browse cards and the product detail page.
// No hooks/state, so it renders fine in both server and client components.
//
// Drawn in a fixed 100×100 viewBox and scaled via width/height, so it stays
// crisp at any size (small browse cards → large detail header) with a
// consistent stroke weight and a proportional progress arc.

const SANS = "var(--font-inter), system-ui, sans-serif";
const FG_RGB = "var(--nura-fg-rgb)";

const SAGE = "var(--nura-sage)"; // >= 80
const AMBER = "var(--nura-watch)";         // 60–79
const RED = "var(--nura-danger)";           // < 60

// Fixed internal coordinate system — everything below is in viewBox units.
const VB = 100;
const STROKE = 9;                       // consistent stroke weight
const R = (VB - STROKE) / 2;            // radius inset by half the stroke
const C = VB / 2;                       // center
const CIRC = 2 * Math.PI * R;

export function scoreColor(score: number): string {
  if (score >= 80) return SAGE;
  if (score >= 60) return AMBER;
  return RED;
}

export default function ScoreRing({
  score,
  size = 40,
  showScale = false,
}: {
  score: number;
  size?: number;
  showScale?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = scoreColor(score);

  // Text is HTML overlaid on the SVG so it stays pixel-crisp at any size.
  const numberSize = Math.round(size * (showScale ? 0.3 : 0.36));
  const scaleSize = Math.round(size * 0.14);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0, lineHeight: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VB} ${VB}`}
        style={{ display: "block", overflow: "visible" }}
      >
        {/* Faint full-circle track + proportional arc, rotated so it starts at 12 o'clock */}
        <g transform={`rotate(-90 ${C} ${C})`}>
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={`rgba(${FG_RGB},0.14)`}
            strokeWidth={STROKE}
          />
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - pct)}
          />
        </g>
      </svg>

      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          fontFamily: SANS, color, lineHeight: 1,
        }}
      >
        <span style={{ fontSize: numberSize, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {Math.round(score)}
        </span>
        {showScale && (
          <span style={{ fontSize: scaleSize, fontWeight: 600, letterSpacing: "0.06em", opacity: 0.7, marginTop: size * 0.04 }}>
            /100
          </span>
        )}
      </div>
    </div>
  );
}
