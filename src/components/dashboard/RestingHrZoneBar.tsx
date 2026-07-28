// Shared resting-HR zone bar — rendered by BOTH the dashboard Resting HR card
// and the Resting Heart Rate detail page.
//
// A rounded teal→sage→gold→coral gradient bar spanning `min`→`max` bpm, with a
// vertical marker at the current value and the zone labels beneath. Lower bpm
// (left) is better.

const FAINT = "var(--nura-text-tertiary)";
const ROSE_RGB = "240,168,144";

// teal (athlete / lowest) → sage → gold → coral (average / highest)
const ZONE_GRADIENT = "linear-gradient(90deg, var(--nura-teal) 0%, var(--nura-sage) 38%, var(--nura-amber) 72%, var(--nura-alert) 100%)";

export default function RestingHrZoneBar({
  value, min, max, labels,
}: { value: number; min: number; max: number; labels: string[] }) {
  const span = (max - min) || 1;
  const pos = Math.max(0, Math.min(1, (value - min) / span)) * 100;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative", height: 12 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 999, background: ZONE_GRADIENT,
          boxShadow: `0 0 14px rgba(${ROSE_RGB},0.18)`,
        }} />
        {/* Current-value marker */}
        <div style={{
          position: "absolute", top: -4, bottom: -4, left: `${pos}%`, transform: "translateX(-50%)",
          width: 3, borderRadius: 2, background: "var(--nura-marker)",
          boxShadow: "0 0 6px rgba(var(--nura-bg-rgb),0.9), 0 0 2px rgba(0,0,0,0.4)",
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
