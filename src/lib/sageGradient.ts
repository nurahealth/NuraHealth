// Deterministic sage-toned gradient placeholders for recipe/food imagery until
// real images exist. Keyed off a string (hero_style or slug) so a given card
// always renders the same gradient. Stays within the locked NŪRA sage system —
// only the angle and opacity stops vary, for subtle per-card variety.

export function sageGradient(key: string | null | undefined): string {
  const s = key ?? "";
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = h >>> 0;
  const angle = 115 + (h % 130);            // 115–245deg
  const a1 = 0.24 + ((h >> 3) % 9) / 100;   // 0.24–0.32
  const a2 = 0.07 + ((h >> 8) % 6) / 100;   // 0.07–0.12
  return (
    `linear-gradient(${angle}deg, ` +
    `rgba(var(--nura-sage-rgb),${a1}) 0%, ` +
    `rgba(var(--nura-sage-rgb),${a2}) 58%, ` +
    `rgba(var(--nura-bg-tint-rgb),0.02) 100%)`
  );
}
