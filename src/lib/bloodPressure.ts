// Blood-pressure status classification — the single source of truth shared by
// the dashboard card and the detail view. Category = the WORSE of the systolic
// and diastolic classifications (ACC/AHA bands). Colors are status-driven.

export type BPCategory = "Normal" | "Elevated" | "Stage 1" | "Stage 2";

export const BP_COLOR: Record<BPCategory, string> = {
  Normal: "#6ea862",
  Elevated: "#d9c45e",
  "Stage 1": "#d99a55",
  "Stage 2": "#c75f5f",
};

const SEVERITY: Record<BPCategory, number> = { Normal: 0, Elevated: 1, "Stage 1": 2, "Stage 2": 3 };

/** Systolic band: <120 Normal · 120–129 Elevated · 130–139 Stage 1 · ≥140 Stage 2. */
export function systolicCategory(sys: number): BPCategory {
  if (sys >= 140) return "Stage 2";
  if (sys >= 130) return "Stage 1";
  if (sys >= 120) return "Elevated";
  return "Normal";
}

/** Diastolic band: <80 Normal · 80–89 Stage 1 · ≥90 Stage 2 (no Elevated). */
export function diastolicCategory(dia: number): BPCategory {
  if (dia >= 90) return "Stage 2";
  if (dia >= 80) return "Stage 1";
  return "Normal";
}

/** Overall category = the worse (higher-severity) of systolic and diastolic. */
export function bpCategory(sys: number, dia: number): BPCategory {
  const s = systolicCategory(sys);
  const d = diastolicCategory(dia);
  return SEVERITY[s] >= SEVERITY[d] ? s : d;
}

/** Category-appropriate one-liner for the compact card footer. */
export function bpFooterMessage(cat: BPCategory): string {
  switch (cat) {
    case "Normal": return "Both under your 120/80 ceiling";
    case "Elevated": return "Systolic creeping above 120";
    case "Stage 1": return "Above your 120/80 ceiling";
    case "Stage 2": return "Well above your 120/80 ceiling";
  }
}

// Meter geometry — marker position as a 0–100% offset along each track.
export const systolicPct = (sys: number): number => Math.max(0, Math.min(100, ((sys - 90) / 90) * 100));
export const diastolicPct = (dia: number): number => Math.max(0, Math.min(100, ((dia - 50) / 60) * 100));

// The gradient stops for each meter track (shared by card + detail).
export const SYS_GRADIENT = "linear-gradient(90deg, #6ea862 0%, #6ea862 33%, #d9c45e 46%, #d99a55 62%, #cf7a6a 82%, #c75f5f 100%)";
export const DIA_GRADIENT = "linear-gradient(90deg, #6ea862 0%, #6ea862 50%, #d9c45e 61%, #d99a55 74%, #cf7a6a 88%, #c75f5f 100%)";
