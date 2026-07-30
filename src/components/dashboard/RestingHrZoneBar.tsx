// Shared resting-HR zone bar — rendered by BOTH the dashboard Resting HR card
// and the Resting Heart Rate detail page.
//
// A bar spanning `min`→`max` bpm with a marker at the current value and the zone
// labels beneath. Lower bpm (left) is better.
//
// This used to be a teal → sage → gold → coral gradient, which is four hues
// carrying one ordered quantity — and three of them belong to other metrics, so
// resting HR's own bar was wearing HRV's teal at one end and heart rate's coral
// at the other. It is now an ordered ramp of resting HR's own colour: a low
// wash at the athlete end deepening to full strength at the average end, so
// position reads as depth of one hue. Same rule as the sleep stages.
//
// Whether the value is GOOD is the status chip's job, which is why this ramp
// carries no green and no red.

const FAINT = "var(--nura-text-tertiary)";

export default function RestingHrZoneBar({
  value, min, max, labels, color,
}: {
  value: number;
  min: number;
  max: number;
  labels: string[];
  /** The metric's colour, from `useMetricPaint("resting-hr")`. */
  color: { hex: string; alpha: (a: number) => string };
}) {
  const span = (max - min) || 1;
  const pos = Math.max(0, Math.min(1, (value - min) / span)) * 100;
  const ramp = `linear-gradient(90deg, ${color.alpha(0.2)} 0%, ${color.alpha(0.42)} 38%, ${color.alpha(0.68)} 72%, ${color.hex} 100%)`;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative", height: 12 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: ramp }} />
        {/* Current-value marker. A hairline ring in the card colour separates it
            from the fill it sits on — the old version used a coloured glow,
            which the light theme then had to switch off again. */}
        <div className="nura-marker-ring" style={{
          position: "absolute", top: -4, bottom: -4, left: `${pos}%`, transform: "translateX(-50%)",
          width: 3, borderRadius: 2, background: "var(--nura-marker)",
          boxShadow: "0 0 0 1.5px var(--nura-card)",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 8,
        fontSize: 9.5, letterSpacing: "0.4px", textTransform: "uppercase", color: FAINT,
      }}>
        {labels.map((z) => <span key={z}>{z}</span>)}
      </div>
    </div>
  );
}
