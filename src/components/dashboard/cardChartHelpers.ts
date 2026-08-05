// Shared chart helpers for the metric cards — hex/lerp/smooth come from the
// existing ActiveEnergyTodayChart; parse/hexA/light(string)/colorAt are the
// remaining helpers the card charts use. Importing colorAt + smooth here keeps
// them in scope wherever a chart renders (a missing one silently blanks it).
import { hex, lerp, smooth } from "@/components/dashboard/ActiveEnergyTodayChart";

export { hex, lerp, smooth };

/** Alias of hex — parse a "#rrggbb" string to an [r,g,b] tuple. */
export const parse = hex;

/**
 * True only for a literal "#rrggbb" / "#rgb". Everything else — most often a
 * `var(--nura-…)` reference — cannot go through hex maths.
 *
 * This guard exists because the failure was silent and looked like a design
 * choice. `hex("var(--nura-gold-ring)")` slices "va" and "r(" and returns
 * [NaN,NaN,NaN]; the helpers then emitted "rgba(NaN,NaN,NaN,0.3)", which SVG
 * rejects and resolves to BLACK. On a near-black card a black area fill is
 * invisible, so several charts shipped with their fills, dashed reference
 * lines and value labels quietly painted in nothing — and the moment light
 * mode arrived the same marks became black slabs on white cards. The blood
 * pressure band and the VO2 max trend fill were both this.
 */
const isHex = (h: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h.trim());

/**
 * "#5dccae" + alpha → "rgba(r,g,b,a)".
 *
 * Given a `var()` it falls back to color-mix, which takes the reference as-is
 * and resolves against the live theme — so a caller that has not resolved its
 * token still gets the right colour instead of a black rectangle.
 */
export const hexA = (h: string, a: number): string => {
  if (!isHex(h)) return `color-mix(in srgb, ${h} ${(a * 100).toFixed(2)}%, transparent)`;
  const [r, g, b] = hex(h);
  return `rgba(${r},${g},${b},${a})`;
};

/** Lighten a hex color toward white by `amt` (0–1) → "rgb(...)" string. */
export const light = (h: string, amt: number): string => {
  if (!isHex(h)) return `color-mix(in srgb, ${h}, white ${(amt * 100).toFixed(2)}%)`;
  const [r, g, b] = hex(h);
  return `rgb(${Math.round(lerp(r, 255, amt))},${Math.round(lerp(g, 255, amt))},${Math.round(lerp(b, 255, amt))})`;
};

/** Interpolate along stop list `[[pos,hex],…]` at t∈[0,1] → "rgb(...)" string. */
export function colorAt(t: number, stops: [number, string][]): string {
  const u = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (u >= p0 && u <= p1) {
      const k = (u - p0) / ((p1 - p0) || 1);
      const a = hex(c0), b = hex(c1);
      return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
    }
  }
  return stops[stops.length - 1][1];
}
