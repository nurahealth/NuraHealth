import { create } from "zustand";

// ─────────────────────────────────────────────────────────────────────────────
// Temperature-unit preference (global, client-side).
//
// Mirrors themeStore: a tiny zustand store persisted to localStorage. There is
// no server-side user-preferences table in this app yet, so localStorage is the
// store of record (swap writeStorage/initUnit for a profile fetch later without
// changing any caller).
//
// IMPORTANT: body temperature in NŪRA is a DEVIATION from the user's personal
// baseline, not an absolute temperature. Converting a deviation to °F is a DELTA
// conversion — multiply by 1.8 ONLY, never add 32 (the +32 offset only applies
// to absolute temperatures, never to differences). So −0.2°C below baseline
// displays as −0.4°F below baseline.
// ─────────────────────────────────────────────────────────────────────────────
export type TemperatureUnit = "F" | "C";

const STORAGE_KEY = "nura-temperature-unit";

// Countries that use Fahrenheit (ISO region codes). Everything else → Celsius.
const F_REGIONS = ["US", "BS", "BZ", "KY", "PW", "FM", "MH", "LR"];

/** Initial default derived from the user's locale; US → "F". Falls back to "F". */
function localeDefault(): TemperatureUnit {
  if (typeof navigator === "undefined") return "F";
  const region = (navigator.language || "").split("-")[1]?.toUpperCase();
  if (!region) return "F";
  return F_REGIONS.includes(region) ? "F" : "C";
}

function writeStorage(unit: TemperatureUnit) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, unit); } catch {}
}

interface TemperatureUnitState {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
  /** Hydrate from localStorage / locale. Call from a client effect to avoid an
   *  SSR↔client mismatch (the store starts at the SSR-safe default "F"). */
  initUnit: () => void;
}

export const useTemperatureUnitStore = create<TemperatureUnitState>((set, get) => ({
  unit: "F", // SSR-safe default; hydrated client-side via initUnit()
  setUnit: (unit) => { writeStorage(unit); set({ unit }); },
  initUnit: () => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch {}
    const next: TemperatureUnit = stored === "F" || stored === "C" ? stored : localeDefault();
    if (next !== get().unit) set({ unit: next });
  },
}));

// ── Display helpers ───────────────────────────────────────────────────────────
/** Convert a °C deviation to the display unit — DELTA conversion (×1.8, no +32). */
export const toDisplayTemp = (deltaC: number, unit: TemperatureUnit): number =>
  unit === "F" ? deltaC * 1.8 : deltaC;

/** Signed magnitude, no degree/unit — e.g. -0.2°C in F → "−0.4". Uses U+2212. */
export function fmtDeltaBare(deltaC: number, unit: TemperatureUnit): string {
  const v = toDisplayTemp(deltaC, unit);
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(1)}`;
}

/** Signed value with degree, no unit letter — e.g. "−0.4°". */
export const fmtDeltaDeg = (deltaC: number, unit: TemperatureUnit): string =>
  `${fmtDeltaBare(deltaC, unit)}°`;

/** Full signed value with degree + unit — e.g. "−0.4°F", "+0.9°F", "0.0°C". */
export const fmtDeltaUnit = (deltaC: number, unit: TemperatureUnit): string =>
  `${fmtDeltaBare(deltaC, unit)}°${unit}`;

/** Absolute magnitude with degree + unit (no sign) — e.g. "0.4°F". */
export const fmtMagUnit = (deltaC: number, unit: TemperatureUnit): string =>
  `${Math.abs(toDisplayTemp(deltaC, unit)).toFixed(1)}°${unit}`;

/** Direction of a deviation in words — within ±0.05°C reads as "at" baseline. */
export const deviationDirection = (deltaC: number): "below" | "above" | "at" =>
  Math.abs(deltaC) < 0.05 ? "at" : deltaC < 0 ? "below" : "above";

/** Worded deviation, magnitude-only (never a leading minus) — e.g. "0.4°F below
 *  baseline", "Right at your baseline". `yourBaseline` switches the possessive. */
export function wordedDeviation(deltaC: number, unit: TemperatureUnit, yourBaseline = false): string {
  const base = yourBaseline ? "your baseline" : "baseline";
  const dir = deviationDirection(deltaC);
  return dir === "at" ? `Right at ${base}` : `${fmtMagUnit(deltaC, unit)} ${dir} ${base}`;
}
