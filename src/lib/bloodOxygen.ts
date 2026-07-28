// Blood-oxygen (SpO2) status — shared by the dashboard card and the detail view.
// Identity colour is a fixed cyan (NOT status-driven); the status word/pill text
// derive from the reading.

export type SpO2Status = "Normal" | "Low" | "Concerning";

/** Fixed identity cyan + the softer cyan used for eyebrow / range values. */
export const CYAN = "var(--nura-aqua)";
export const CYAN_SOFT = "var(--nura-teal)";

/** SpO2 band: ≥95 Normal · 90–94 Low · <90 Concerning. */
export function spo2Status(pct: number): SpO2Status {
  if (pct >= 95) return "Normal";
  if (pct >= 90) return "Low";
  return "Concerning";
}

/** Category-appropriate one-liner for the compact card footer. */
export function spo2FooterMessage(status: SpO2Status): string {
  switch (status) {
    case "Normal": return "In your normal range";
    case "Low": return "Running a little low overnight";
    case "Concerning": return "Below your normal range";
  }
}
